const test = require('node:test');
const assert = require('node:assert');

const LONDON = { lat: 51.5074, lng: -0.1278 };

test('sunAt places a London evening frame against its sunset', async () => {
  const { sunAt } = await import('../scripts/photos/lib/sun.mjs');
  // Midsummer sunset in London falls around 21:21 BST.
  const s = sunAt('2023-06-25T21:17:04+01:00', LONDON);
  assert.ok(s.toSunset >= 2 && s.toSunset <= 7, `toSunset ${s.toSunset}`);
  assert.ok(s.alt > -1.5 && s.alt < 1, `alt ${s.alt}`);
  assert.ok(s.az > 300 && s.az < 320, `az ${s.az}`);
  assert.equal(s.rising, false);
  // Solar noon was that afternoon, about eight hours earlier.
  assert.ok(s.toNoon < -450 && s.toNoon > -540, `toNoon ${s.toNoon}`);
});

test('sunAt knows the sun is below the horizon after sunset, and rising in the morning', async () => {
  const { sunAt } = await import('../scripts/photos/lib/sun.mjs');
  const dusk = sunAt('2023-08-06T21:01:00+01:00', LONDON);
  assert.ok(dusk.toSunset < 0 && dusk.alt < 0);
  const morning = sunAt('2024-07-24T07:00:00+01:00', LONDON);
  assert.equal(morning.rising, true);
  assert.ok(morning.toSunrise < 0, 'sunrise was earlier that morning');
});

test('sunAt works at city precision, so exact coordinates cannot be read back', async () => {
  const { sunAt } = await import('../scripts/photos/lib/sun.mjs');
  const a = sunAt('2023-07-07T18:06:00+01:00', { lat: 51.5138, lng: -0.0886 });
  const b = sunAt('2023-07-07T18:06:00+01:00', { lat: 51.4951, lng: -0.1149 });
  assert.deepEqual(a, b);
});

test('sunAt gives nothing without a place or an instant', async () => {
  const { sunAt } = await import('../scripts/photos/lib/sun.mjs');
  assert.equal(sunAt('2023-07-07T18:06:00', LONDON), null, 'no UTC offset: not an instant');
  assert.equal(sunAt('2023-07-07T18:06:00+01:00', null), null);
  assert.equal(sunAt(null, LONDON), null);
});

test('instantOf borrows the offset of the gallery frame nearest in time', async () => {
  const { instantOf } = await import('../scripts/photos/lib/sun.mjs');
  const times = ['2023-03-14T09:00:00+00:00', '2023-04-10T12:00:00+02:00', '2023-03-14T15:09:32'];
  assert.equal(instantOf('2023-03-14T15:09:32', times), '2023-03-14T15:09:32+00:00');
  assert.equal(instantOf('2023-06-01T12:00:00', times), null, 'nothing within a week');
  assert.equal(instantOf('2023-03-14T15:09:32+01:00', times), '2023-03-14T15:09:32+01:00');
  assert.equal(instantOf(null, times), null);
});

test('lightGallery gives each photo its sun once, from its GPS or else the gallery point', async () => {
  const { lightGallery } = await import('../scripts/photos/lib/sun.mjs');
  const kept = { alt: 10, az: 200, rising: false, toSunrise: -600, toSunset: 120, toNoon: -200 };
  const photos = [
    { slug: 'a', taken: '2023-06-25T21:17:04+01:00' },
    { slug: 'b', taken: '2023-06-25T21:17:04' },
    { slug: 'c', taken: null },
    { slug: 'd', taken: '2023-06-25T12:00:00+01:00', sun: kept },
  ];
  const lit = lightGallery(photos, (s) => (s === 'a' ? LONDON : null), { lat: 51.5, lng: -0.1 });
  assert.equal(lit, 2);
  assert.ok(photos[0].sun.toSunset > 0 && photos[1].sun.toSunset > 0);
  assert.equal(photos[2].sun, null, 'no time, no sun');
  assert.equal(photos[3].sun, kept, 'a sun once given is never worked out again');
  assert.equal(lightGallery(photos, () => LONDON, null), 0);
});

test('galleryPlaces finds a gallery on the voyage atlas through its page or its path', async () => {
  const path = require('node:path');
  const { galleryPlaces } = await import('../scripts/photos/lib/places.mjs');
  const placeOf = galleryPlaces(path.join(__dirname, '..'));
  const near = (p, lat, lng) => p && Math.abs(p.lat - lat) < 0.5 && Math.abs(p.lng - lng) < 0.5;
  assert.ok(near(placeOf('london'), 51.5, -0.13));
  assert.ok(near(placeOf('hong-kong'), 22.3, 114.2), 'through the page, whose slug differs');
  assert.ok(near(placeOf('prague/twilight'), 50.09, 14.42), 'a part with no pin of its own takes its voyage');
  assert.ok(near(placeOf('venice/gondola'), 45.43, 12.34), 'no page at all: its path');
  assert.equal(placeOf('nowhere'), null);
});

test('instantOf works out the offset from the zones the gallery could be in, or gives none', async () => {
  const { instantOf } = await import('../scripts/photos/lib/sun.mjs');
  // Cornwall: the gallery's September frames kept +01:00; mid-March in Britain is still GMT.
  const cornwall = ['2023-09-25T11:19:55+01:00', '2023-09-26T15:32:58+01:00'];
  assert.equal(instantOf('2023-03-14T15:09:32', cornwall, -4.6), '2023-03-14T15:09:32+00:00');
  // Northern Spain keeps Paris time, an hour off its longitude: no zone fits, so no guess.
  assert.equal(instantOf('2023-03-14T15:09:32', ['2023-09-25T11:19:55+02:00'], -2.8), null);
  assert.equal(instantOf('2023-03-14T15:09:32', [], -4.6), null, 'nothing recorded: no guess');
});
