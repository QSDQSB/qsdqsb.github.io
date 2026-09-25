const test = require('node:test');
const assert = require('node:assert');

const fakeFetch = (temps, codes) => async (url) => {
  const date = new URL(url).searchParams.get('start_date');
  const time = Array.from({ length: 24 }, (_, h) => `${date}T${String(h).padStart(2, '0')}:00`);
  return { ok: true, json: async () => ({ hourly: { time, temperature_2m: time.map((_, h) => temps(h)), weather_code: time.map((_, h) => codes(h)) } }) };
};

test('weatherAt takes the hour nearest the instant, in UTC', async () => {
  const { weatherAt } = await import('../scripts/photos/lib/weather.mjs');
  // 21:58 at +01:00 is 20:58 UTC → the 21:00 UTC hour.
  const w = await weatherAt('2023-06-23T21:58:53+01:00', { lat: 51.51, lng: -0.08 }, fakeFetch((h) => h + 0.4, (h) => (h === 21 ? 3 : 0)));
  assert.deepEqual(w, { t: 21, code: 3 });
  assert.equal(await weatherAt('2023-06-23T21:58:53', { lat: 51.5, lng: 0 }, fakeFetch(() => 1, () => 0)), null, 'no offset, no instant');
  assert.equal(await weatherAt('2023-06-23T21:58:53+01:00', null, fakeFetch(() => 1, () => 0)), null);
});

test('weatherGallery gives each photo its weather once, borrowing the offset the sun would', async () => {
  const { weatherGallery } = await import('../scripts/photos/lib/weather.mjs');
  const kept = { t: 5, code: 71 };
  const photos = [
    { slug: 'a', taken: '2023-03-14T15:00:00' },
    { slug: 'b', taken: '2023-03-14T12:00:00+00:00' },
    { slug: 'c', taken: '2023-03-14T13:00:00+00:00', weather: kept },
  ];
  const n = await weatherGallery(photos, () => ({ lat: 50.4, lng: -4.6 }), null, fakeFetch((h) => h, () => 2));
  assert.equal(n, 2);
  assert.deepEqual(photos[0].weather, { t: 15, code: 2 });
  assert.equal(photos[2].weather, kept);
});

test('weatherOf names the sky in one word and one mark; clear after dark is a clear night', async () => {
  const { weatherOf } = await import('../scripts/photos/lib/book.mjs');
  assert.deepEqual(weatherOf({ t: -9, code: 73 }), { t: -9, kind: 'snow', text: 'Snow' });
  assert.equal(weatherOf({ t: 20, code: 0 }, { below: true }).kind, 'night');
  assert.equal(weatherOf({ t: 20, code: 1 }, { below: false }).text, 'Clear');
  assert.equal(weatherOf({ t: 12, code: 2 }).text, 'Partly cloudy');
  assert.equal(weatherOf({ t: 12, code: 45 }).kind, 'fog');
  assert.equal(weatherOf({ t: 12, code: 53 }).kind, 'rain');
  assert.equal(weatherOf({ t: 12, code: 81 }).kind, 'rain');
  assert.equal(weatherOf({ t: 30, code: 95 }).kind, 'thunder');
  assert.equal(weatherOf(null), null);
});
