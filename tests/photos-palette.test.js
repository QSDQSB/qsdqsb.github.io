const test = require('node:test');
const assert = require('node:assert');

const lib = () => import('../scripts/photos/lib/palette.mjs');

// A synthetic frame: a dark sky over a warm street, with a band of blue in between.
function frame(w = 48, h = 48, tint = [0, 0, 0]) {
  const px = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const o = (y * w + x) * 3;
    const c = y < h / 3 ? [23, 17, 35] : y < (2 * h) / 3 ? [60, 90, 140] : [236, 166, 114];
    const n = (x * 7 + y * 13) % 9 - 4; // a little texture, the same every time
    for (let k = 0; k < 3; k++) px[o + k] = Math.max(0, Math.min(255, c[k] + n + tint[k]));
  }
  return px;
}

test('OKLab round-trips sRGB', async () => {
  const { rgbToOklab, oklabToRgb } = await lib();
  for (const c of [[0, 0, 0], [255, 255, 255], [197, 146, 127], [23, 17, 35], [12, 200, 90]]) {
    assert.deepEqual(oklabToRgb(...rgbToOklab(...c)), c);
  }
});

test('the same pixels always give the same palette', async () => {
  const { paletteOf } = await lib();
  const a = paletteOf(frame(), 48, 48), b = paletteOf(frame(), 48, 48);
  assert.equal(a.palette, b.palette);
  assert.equal(a.grid, b.grid);
  assert.equal(a.grid.length, 54, 'nine rrggbb cells');
  assert.ok(a.palette.length % 8 === 0 && a.palette.length / 8 <= 32);
});

test('shares add up to the whole frame, heaviest first', async () => {
  const { paletteOf, parsePalette } = await lib();
  const raw = paletteOf(frame(), 48, 48).palette;
  const bytes = raw.match(/.{8}/g).map(e => parseInt(e.slice(6), 16));
  assert.equal(bytes.reduce((a, b) => a + b, 0), 255);
  assert.deepEqual([...bytes].sort((a, b) => b - a), bytes);
  const P = parsePalette(raw);
  assert.ok(Math.abs(P.reduce((s, c) => s + c.w, 0) - 1) < 1e-9);
});

test('a flat frame gives one colour, not thirty-two', async () => {
  const { paletteOf } = await lib();
  const px = Buffer.alloc(16 * 16 * 3, 128);
  assert.equal(paletteOf(px, 16, 16).palette, '808080ff');
});

test('the grid keeps what sits above what', async () => {
  const { paletteOf, parseGrid } = await lib();
  const G = parseGrid(paletteOf(frame(), 48, 48).grid);
  assert.ok(G[0][0] < G[6][0], 'the sky is darker than the street');
});

test('picture distance: zero for itself, symmetric, grows with change, obeys the triangle', async () => {
  const { paletteOf, parsePalette, parseGrid, emd, distance } = await lib();
  const ph = (tint) => { const r = paletteOf(frame(48, 48, tint), 48, 48); return { P: parsePalette(r.palette), G: parseGrid(r.grid) }; };
  const a = ph([0, 0, 0]), b = ph([12, 0, -12]), c = ph([40, 10, -40]);
  assert.equal(emd(a.P, a.P), 0);
  assert.ok(Math.abs(emd(a.P, b.P) - emd(b.P, a.P)) < 1e-9);
  assert.ok(emd(a.P, b.P) > 0 && emd(a.P, b.P) < emd(a.P, c.P));
  assert.ok(emd(a.P, c.P) <= emd(a.P, b.P) + emd(b.P, c.P) + 1e-9);
  assert.ok(distance(a, c, { composition: 0.35 }) > 0);
});

test('the earth mover\'s distance is exact on a case worked by hand', async () => {
  const { emd, rgbToOklab, deltaE } = await lib();
  const col = (rgb, w) => ({ rgb, lab: rgbToOklab(...rgb), w });
  const black = [0, 0, 0], white = [255, 255, 255], grey = [128, 128, 128];
  // Half black, half white against all grey: each half travels to grey.
  const d = emd([col(black, 0.5), col(white, 0.5)], [col(grey, 1)]);
  const want = 0.5 * deltaE(rgbToOklab(...black), rgbToOklab(...grey)) + 0.5 * deltaE(rgbToOklab(...white), rgbToOklab(...grey));
  assert.ok(Math.abs(d - want) < 1e-6);
  // Moving nothing costs nothing, whatever the order.
  assert.ok(emd([col(black, 0.3), col(white, 0.7)], [col(white, 0.7), col(black, 0.3)]) < 1e-9);
});

test('the fixed vector has 32 dimensions and sums to one', async () => {
  const { paletteOf, parsePalette, vectorOf, chi2, ANCHORS } = await lib();
  assert.equal(ANCHORS.length, 32);
  const v = vectorOf(parsePalette(paletteOf(frame(), 48, 48).palette));
  assert.equal(v.length, 32);
  assert.ok(Math.abs(v.reduce((a, b) => a + b, 0) - 1) < 1e-9);
  assert.equal(chi2(v, v), 0);
});

test('swatches merge to five at most, and a colour path visits every frame once', async () => {
  const { paletteOf, parsePalette, swatchesOf, colourPath } = await lib();
  const s = swatchesOf(parsePalette(paletteOf(frame(), 48, 48).palette));
  assert.ok(s.length <= 5 && s.length >= 3);
  assert.ok(Math.abs(s.reduce((a, c) => a + c.pc, 0) - 100) < 0.5);
  const D = [[0, 1, 5, 9], [1, 0, 4, 8], [5, 4, 0, 4], [9, 8, 4, 0]];
  const path = colourPath(D, [0.9, 0.7, 0.4, 0.1]);
  assert.deepEqual([...path].sort(), [0, 1, 2, 3]);
  assert.deepEqual(path, [3, 2, 1, 0], 'dark to light along the shortest line');
});

const atlas = () => import('../scripts/photos/lib/atlas.mjs');

test('kindred frames come from other voyages only, nearest first', async () => {
  const { paletteOf } = await lib();
  const { kindredOf } = await atlas();
  const pal = (tint) => paletteOf(frame(48, 48, tint), 48, 48).palette;
  const items = [
    { hash: 'a', gallery: 'prague/twilight', palette: pal([0, 0, 0]) },
    { hash: 'b', gallery: 'prague/portraits', palette: pal([1, 0, 0]) },   // same voyage: never kindred
    { hash: 'c', gallery: 'london', palette: pal([6, 0, -6]) },
    { hash: 'd', gallery: 'porto', palette: pal([40, 20, -40]) },
  ];
  const k = kindredOf(items, { k: 3 });
  assert.deepEqual(k.a.map(([h]) => h), ['c', 'd']);
  assert.ok(k.a[0][1] <= k.a[1][1]);
  assert.ok(!k.b.some(([h]) => h === 'a'));
});

test('the atlas pools each band of the sun, and is nothing without colours', async () => {
  const { atlasOf } = await atlas();
  const ph = (slug, alt, sw) => ({ slug, hash: slug, url: `u/${slug}`, ratio: 1.5, light: { alt, phase: 'day', text: 'x' }, strip: ['#111111', '#222222', '#333333'], swatches: sw });
  const book = { gallery: 'london', photos: [ph('p1', -4, [['#a96e6e', 60], ['#242b44', 40]]), ph('p2', -3, [['#cb9286', 100]]), ph('p3', 30, [['#908e8e', 100]])] };
  const a = atlasOf([book], { p1: [['p3', 5]] });
  const blue = a.bands.find((b) => b.key === 'blue'), day = a.bands.find((b) => b.key === 'day');
  assert.equal(blue.n, 2);
  assert.equal(day.n, 1);
  assert.ok(blue.rose > day.rose, 'the blue hour leans rose');
  assert.deepEqual(a.photos[0].k, [2]);
  assert.ok(!('hash' in a.photos[0]));
  assert.equal(atlasOf([{ gallery: 'x', photos: [{ slug: 's', hash: 'h' }] }]), null);
});
