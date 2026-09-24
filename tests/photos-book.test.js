const test = require('node:test');
const assert = require('node:assert');

const lib = () => import('../scripts/photos/lib/book.mjs');
const land = (n) => Array.from({ length: n }, (_, i) => ({ slug: `p${i}`, ratio: 1.78 }));

test('the book runs spread, pair, three, and the last frames close it together', async () => {
  const { bookRows } = await lib();
  const kinds = (ps) => bookRows(ps).map(r => r.kind).join(',');
  assert.equal(kinds(land(6)), 'spread,pair,triple');
  assert.equal(kinds(land(35)), 'spread,pair,triple,spread,pair,triple,spread,pair,triple,spread,pair,triple,spread,pair,triple,spread,pair,pair');
  assert.equal(kinds(land(3)), 'spread,pair', 'a short gallery opens on a spread');
  assert.equal(kinds(land(1)), 'spread');
  assert.equal(kinds([]), '');
  // Every frame appears once, in order.
  assert.deepEqual(bookRows(land(35)).flatMap(r => r.items), [...Array(35).keys()]);
});

test('a portrait never takes a spread', async () => {
  const { bookRows } = await lib();
  const ps = [{ ratio: 0.66 }, { ratio: 1.5 }, { ratio: 1.5 }, { ratio: 1.5 }];
  assert.equal(bookRows(ps).map(r => r.kind).join(','), 'pair,pair');
});

test('the cover is the first featured landscape, else the first landscape', async () => {
  const { coverIndex } = await lib();
  assert.equal(coverIndex([{ ratio: 0.7 }, { ratio: 1.5 }, { ratio: 1.5, featured: true }]), 2);
  assert.equal(coverIndex([{ ratio: 0.7, featured: true }, { ratio: 1.5 }]), 1);
  assert.equal(coverIndex([]), null);
});

test('the light is one phrase, and the glyph sits under the horizon after dusk', async () => {
  const { lightOf } = await lib();
  assert.equal(lightOf({ alt: 2.8, rising: false, toSunrise: 480, toSunset: 28, toNoon: -452 }).text, '28 min before sunset');
  assert.equal(lightOf({ alt: -0.7, rising: false, toSunrise: 450, toSunset: 0, toNoon: -480 }).text, 'At sunset');
  assert.equal(lightOf({ alt: -3.5, rising: false, toSunrise: 430, toSunset: -20, toNoon: -500 }).text, 'Afterglow');
  assert.equal(lightOf({ alt: -5, rising: false, toSunrise: 400, toSunset: -37, toNoon: -520 }).text, 'Blue hour');
  assert.equal(lightOf({ alt: -7, rising: false, toSunrise: 400, toSunset: -46, toNoon: -520 }).text, 'Night');
  assert.equal(lightOf({ alt: 55.2, rising: true, toSunrise: -420, toSunset: 543, toNoon: 60 }).text, 'Sun at 55°');
  assert.equal(lightOf({ alt: 3, rising: true, toSunrise: -25, toSunset: 900, toNoon: 480 }).text, '25 min after sunrise');
  const dusk = lightOf({ alt: -3.5, rising: false, toSunrise: 430, toSunset: -20, toNoon: -500 });
  assert.equal(dusk.below, true); assert.ok(dusk.y > 11 && dusk.x > 17);
  assert.equal(dusk.phase, 'golden');
  assert.equal(lightOf(null), null);
});

test('glow and placeholder come from the thumbhash; a missing one gives nothing', async () => {
  const { glowOf, placeholderOf } = await lib();
  const th = 'XBgODIIp73xtd3eIeIeHh3eHeI0IZ3A='; // any valid thumbhash
  const g = glowOf(th);
  assert.equal(g.length, 3);
  for (const c of g) assert.match(c, /^rgb\(\d+,\d+,\d+\)$/);
  assert.match(placeholderOf(th), /^data:image\/png;base64,/);
  assert.equal(glowOf(null), null);
});

test('the colophon counts films, lenses and the half hours of the day', async () => {
  const { colophonOf } = await lib();
  const c = colophonOf([
    { taken: '2023-07-07T18:06:00+01:00', lens: 'XF90', settings: { filmSimulation: 'Classic Negative' }, light: { phase: 'day' } },
    { taken: '2023-07-07T18:17:00+01:00', lens: 'XF90', settings: { filmSimulation: 'Astia' }, light: { phase: 'day' } },
    { taken: '2023-07-12T21:14:00+01:00', lens: 'XF16', settings: { filmSimulation: 'Classic Negative' }, light: { phase: 'golden' } },
  ]);
  assert.deepEqual(c.films.map(f => [f.name, f.n, f.pc]), [['Classic Negative', 2, 67], ['Astia', 1, 33]]);
  assert.equal(c.films[0].hue, '#7fbcbc');
  assert.deepEqual(c.lenses.map(l => l.name), ['XF90', 'XF16']);
  assert.deepEqual(c.hours.map(h => h.stack), [0, 1, 0], 'two frames in the 18:00 half hour stack');
  assert.deepEqual(c.phases, { day: 2, golden: 1, night: 0 });
});

test('bookOf takes the place from the locate sidecar, else the caption', async () => {
  const { bookOf } = await lib();
  const merged = { photos: [{ slug: 'a', ratio: 1.78, caption: 'Pembroke Road, London' }, { slug: 'b', ratio: 1.78 }] };
  const b = bookOf(merged, { b: { suggested: 'Tower Bridge, London' } });
  assert.deepEqual(b.photos.map(p => p.place), [{ name: 'Pembroke Road', city: 'London' }, { name: 'Tower Bridge', city: 'London' }]);
  assert.equal(b.book.cover, 0);
  assert.equal(b.book.rows[0].kind, 'spread');
});
