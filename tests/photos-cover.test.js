'use strict';

const test = require('node:test');
const assert = require('node:assert');

const cover = () => import('../scripts/photos/lib/cover.mjs');
const manifest = () => import('../scripts/photos/lib/manifest.mjs');
const book = () => import('../scripts/photos/lib/book.mjs');

test('a position centres the focus for the box, clamped to the photo\'s edges', async () => {
  const { positionFor } = await cover();
  // London: a 16:9 frame (1.775) cut 3:1, full width, its top 18.9% down. The focus is the cut's centre.
  const r = 1.775, v = r / 3, top = 0.189, fy = top + v / 2;
  const [, y] = positionFor([0.5, fy], r, 3).split(' ').map(parseFloat);
  assert.ok(Math.abs((y / 100) * (1 - v) - top) < 0.002, `the 3:1 cut starts where it did (${y}%)`);
  assert.strictEqual(positionFor([0.5, 0.5], r, 3), '50% 50%', 'a centred focus is the centre');
  assert.strictEqual(positionFor([0.02, 0.98], r, 0.85), '0% 50%', 'a portrait box pins a focus at the left edge');
  assert.strictEqual(positionFor([0.3, 0.3], r, r), '50% 50%', 'a box of the photo\'s own shape has nothing to move');
});

test('shapes are named by ratio, within a few percent', async () => {
  const { shapeOf } = await cover();
  assert.strictEqual(shapeOf('3:1'), 'wide');
  assert.strictEqual(shapeOf('4:3'), 'tall');
  assert.strictEqual(shapeOf('16:9'), 'screen');
  assert.strictEqual(shapeOf('1.91:1'), 'og');
  assert.strictEqual(shapeOf('card'), 'card');
  assert.strictEqual(shapeOf('1:1'), null);
});

test('an authored cover is checked for shape', async () => {
  const { validateCover } = await cover();
  assert.deepStrictEqual(validateCover({ photo: 'dscf0958', focus: [0.4, 0.6] }, 'x'), []);
  assert.deepStrictEqual(validateCover({ photo: 'sesto/dscf9474', focus: [0.5, 0.5], crops: { '4:3': [0.4, 0.5] } }, 'x'), []);
  assert.ok(validateCover({ photo: 'DSCF0958' }, 'x').some(p => p.includes('lowercase')));
  assert.ok(validateCover({ photo: 'dscf0958', focus: [1.2, 0.5] }, 'x').some(p => p.includes('focus')));
  assert.ok(validateCover({ photo: 'dscf0958', crops: { '1:1': [0.5, 0.5] } }, 'x').some(p => p.includes('not a shape')));
  assert.ok(validateCover({ photo: 'dscf0958', centre: [0.5, 0.5] }, 'x').some(p => p.includes('unknown key')));
});

test('a crop override moves only its own shape; the link preview is cut inside the photo', async () => {
  const { coverEntry, cropRect } = await cover();
  const photo = { slug: 'dscf1', url: 'https://img.example.com/t/abc', w: 6000, h: 4000, ratio: 1.5, sizes: {} };
  const e = coverEntry(photo, { photo: 'dscf1', focus: [0.5, 0.2], crops: { '4:3': [0.9, 0.5] } }, 'g');
  assert.strictEqual(e.pos.tall, '100% 50%');
  assert.notStrictEqual(e.pos.wide, '50% 50%');
  assert.deepStrictEqual(e.og, [0.5, 0.2]);
  const rect = cropRect([0.99, 0.01], 1920, 1280, 1200 / 630);
  assert.deepStrictEqual(rect, { left: 0, top: 0, width: 1920, height: 1008 });
});

test('the YAML may carry a cover; the merge passes it on and warns on an unknown slug', async () => {
  const { validateAuthored, mergeManifest } = await manifest();
  assert.deepStrictEqual(validateAuthored({ cover: { photo: 'dscf0001', focus: [0.5, 0.5] } }), []);
  const machine = { version: 1, gallery: 'g', generated: 'x', photos: [{ slug: 'dscf0001', file: 'DSCF0001.jpg', w: 6000, h: 4000 }] };
  const m = mergeManifest('g', machine, { cover: { photo: 'dscf0009', focus: [0.5, 0.5] } }, 'https://img.example.com');
  assert.strictEqual(m.cover.photo, 'dscf0009');
  assert.ok(m.warnings.some(w => w.includes('cover names unknown slug')));
});

test('the book opens on the authored cover\'s photo', async () => {
  const { coverIndex } = await book();
  const photos = [{ slug: 'a', ratio: 1.5 }, { slug: 'b', ratio: 1.5, featured: true }, { slug: 'c', ratio: 0.7 }];
  assert.strictEqual(coverIndex(photos), 1, 'without one, the first featured landscape');
  assert.strictEqual(coverIndex(photos, 'c'), 2, 'the named photo, even a portrait');
  assert.strictEqual(coverIndex(photos, 'gone'), 1, 'an unknown slug falls back');
});
