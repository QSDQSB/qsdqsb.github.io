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
