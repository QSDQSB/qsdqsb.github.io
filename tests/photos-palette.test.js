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

const dotsLib = () => import('../scripts/photos/lib/dots.mjs');
const sigLib = () => import('../scripts/photos/lib/signature.mjs');

// A night frame: mostly black, a band of lamplight, and a red of half a percent.
function night(w = 60, h = 40) {
  const px = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const o = (y * w + x) * 3, n = (x * 5 + y * 3) % 7;
    const c = y > 26 && y < 34 ? [220 + n, 150 + n, 60] : x < 3 && y < 4 ? [200, 20, 15] : [4 + n, 4 + n, 6 + n];
    px[o] = c[0]; px[o + 1] = c[1]; px[o + 2] = c[2];
  }
  return px;
}

test('24 dots: every method gives 24, the same each time; balanced gives the dark fewer than equal shares', async () => {
  const { dotsOf } = await dotsLib();
  const a = dotsOf(night(), 60, 40), b = dotsOf(night(), 60, 40);
  for (const [k, v] of Object.entries(a)) {
    assert.equal(v.dots.length, 24 * 8, k);
    assert.equal(v.dots, b[k].dots, `${k} is deterministic`);
  }
  const dark = (s) => s.match(/.{8}/g).filter((d) => parseInt(d.slice(0, 2), 16) < 40).length;
  assert.ok(dark(a.balanced.dots) < dark(a.share.dots), 'balanced gives the black fewer dots');
  assert.ok(a.share.honesty <= a.distinct.honesty, 'equal shares pool most honestly');
});

test('the signature: three to five swatches, black allowed once, a half-percent red kept', async () => {
  const { pointsOf } = await dotsLib();
  const { signatureOf } = await sigLib();
  const { colours, reading } = signatureOf(pointsOf(night(), 60, 40));
  assert.ok(colours.length >= 2 && colours.length <= 5);
  const darks = colours.filter((c) => c.L < 0.2);
  assert.ok(darks.length <= 1, 'one black at most');
  assert.ok(colours.some((c) => parseInt(c.hex.slice(1, 3), 16) > 150 && parseInt(c.hex.slice(3, 5), 16) < 80), 'the half-percent red is kept');
  assert.ok(Math.abs(colours.reduce((s, c) => s + c.pc, 0) - 100) < 1);
  assert.equal(reading.key, 'Low-key');
});

test('grey means grey: dark navies and greens keep their colour, near-black noise does not', async () => {
  const { isGrey, rgbToOklab } = await lib();
  const grey = (h) => { const [L, a, b] = rgbToOklab(parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)); return isGrey(L, Math.hypot(a, b)); };
  for (const h of ['2a2a2c', '8b9296', 'e8e6ea', '080808', '0a0d14']) assert.ok(grey(h), `${h} is grey`);
  for (const h of ['0b1d33', '1a2a3c', '1c2a1e', '2e241c', 'b9a092', 'd8e0ea', '4a5a68']) assert.ok(!grey(h), `${h} has a colour`);
});

test('colour first: a grey city keeps its sky, its stone and its bus, and no more than two greys', async () => {
  const { pointsOf } = await dotsLib();
  const { signatureOf } = await sigLib();
  const { rgbToOklab } = await lib();
  const w = 100, h = 60, px = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const o = (y * w + x) * 3, n = (x * 3 + y * 7) % 5;
    // Seventy per cent greys (charcoal, mid, pale), then a blue sky, a warm stone, and a small red.
    const c = y < 8 ? [70, 105, 150] : y < 14 ? [196, 172, 152] : x < 4 && y > 50 ? [190, 40, 30] : y < 30 ? [40, 41, 42] : y < 45 ? [110, 110, 112] : [205, 205, 207];
    px[o] = c[0] + n; px[o + 1] = c[1] + n; px[o + 2] = c[2] + n;
  }
  const { colours } = signatureOf(pointsOf(px, w, h));
  const C = (c) => { const [, a, b] = rgbToOklab(parseInt(c.hex.slice(1, 3), 16), parseInt(c.hex.slice(3, 5), 16), parseInt(c.hex.slice(5, 7), 16)); return { a, b, c: Math.hypot(a, b) }; };
  assert.ok(colours.filter((c) => C(c).c < 0.025).length <= 2, 'two greys at most');
  assert.ok(colours.some((c) => C(c).b < -0.03), 'the blue sky');
  assert.ok(colours.some((c) => C(c).b > 0.02 && C(c).c < 0.08), 'the warm stone');
  assert.ok(colours.some((c) => C(c).a > 0.1), 'the red');
});

test('always coloured: a colour photo has no black or white swatch; a black-and-white one keeps its greys', async () => {
  const { pointsOf } = await dotsLib();
  const { signatureOf } = await sigLib();
  const { rgbToOklab } = await lib();
  const looksBW = (hex) => { const [L, a, b] = rgbToOklab(parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)); const C = Math.hypot(a, b); return (L < 0.25 && C < 0.05) || (L > 0.8 && C < 0.02); };
  const colour = signatureOf(pointsOf(night(), 60, 40));
  assert.ok(colour.colours.length >= 1 && !colour.colours.some((c) => looksBW(c.hex)), 'no black or white in a colour photo');
  assert.ok(Math.abs(colour.colours.reduce((s, c) => s + c.pc, 0) - 100) < 1, 'shares of its colour sum to the whole');
  const grey = Buffer.alloc(40 * 30 * 3); for (let i = 0; i < 40 * 30; i++) { const v = i % 40 < 20 ? 30 : 200; grey[3 * i] = grey[3 * i + 1] = grey[3 * i + 2] = v; }
  const mono = signatureOf(pointsOf(grey, 40, 30));
  assert.ok(mono.colours.length >= 2 && mono.colours.every((c) => c.hex.slice(1, 3) === c.hex.slice(3, 5)), 'a black-and-white frame stays tonal');
});

test('the rail of voyages lays like beside like, dark to light', async () => {
  const { palettesOf } = await import('../scripts/photos/lib/atlas.mjs');
  const book = (g, hexes) => ({ gallery: g, photos: [], book: { colour: { palette: hexes.map((hex, i) => ({ hex, pc: [40, 30, 20, 10][i] })), wheel: null, order: [] } } });
  const { voyages } = palettesOf([
    book('blue', ['#202a40', '#304868', '#4c668c', '#7c889c']),
    book('amber', ['#c05030', '#e08040', '#f0b070', '#fae0c0']),
    book('navy', ['#223050', '#35507a', '#5070a0', '#8090b0']),
    book('rust', ['#b04a28', '#d07a3a', '#e8a868', '#f8d8b8']),
  ]);
  const rail = [...voyages].sort((a, b) => a.rank - b.rank).map(v => v.g);
  assert.deepEqual([...rail].sort(), ['amber', 'blue', 'navy', 'rust']);
  assert.ok(Math.abs(rail.indexOf('blue') - rail.indexOf('navy')) === 1 && Math.abs(rail.indexOf('amber') - rail.indexOf('rust')) === 1);
  assert.ok(rail.indexOf('blue') < rail.indexOf('amber'), 'the darker family first');
});
