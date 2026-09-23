'use strict';

const test = require('node:test');
const assert = require('node:assert');

const lib = () => import('../scripts/photos/lib/manifest.mjs');

const machine = {
  version: 1, gallery: 'london', generated: '2026-09-18T00:00:00Z',
  photos: [
    { slug: 'dscf0003', file: 'DSCF0003.jpg', taken: '2024-05-01T10:00:00', w: 6240, h: 3512 },
    { slug: 'dscf0001', file: 'DSCF0001.jpg', taken: '2024-05-01T09:00:00', w: 6240, h: 3512 },
    { slug: 'dscf0002', file: 'DSCF0002.jpg', taken: null, w: 3512, h: 6240 },
  ],
};

test('photos sort by capture time, undated last, pins first', async () => {
  const { sortPhotos } = await lib();
  assert.deepStrictEqual(sortPhotos(machine.photos).map(p => p.slug), ['dscf0001', 'dscf0003', 'dscf0002']);
  assert.deepStrictEqual(sortPhotos(machine.photos, ['dscf0002', 'DSCF0003']).map(p => p.slug), ['dscf0002', 'dscf0003', 'dscf0001']);
});

test('merge overlays authored fields, drops hidden, warns on unknown slugs', async () => {
  const { mergeManifest } = await lib();
  const authored = {
    title: 'London, again',
    order: ['dscf0003', 'dscf9999'],
    photos: { dscf0003: { caption: 'Tower Bridge', featured: true }, dscf0001: { hidden: true }, dscf7777: { caption: 'gone' } },
  };
  const m = mergeManifest('london', machine, authored, 'https://img.example.com');
  assert.strictEqual(m.title, 'London, again');
  assert.strictEqual(m.key, 'london');
  assert.strictEqual(m.base, 'https://img.example.com/london');
  assert.deepStrictEqual(m.photos.map(p => p.slug), ['dscf0003', 'dscf0002']);
  assert.strictEqual(m.photos[0].caption, 'Tower Bridge');
  assert.strictEqual(m.photos[0].featured, true);
  assert.strictEqual(m.photos[0].url, 'https://img.example.com/london/dscf0003');
  assert.strictEqual('hidden' in m.photos[0], false);
  assert.deepStrictEqual(m.inventory.map(p => p.slug), ['dscf0001', 'dscf0003', 'dscf0002'], 'inventory keeps hidden photos, in capture order');
  assert.ok(m.warnings.some(w => w.includes('dscf7777')));
  assert.ok(m.warnings.some(w => w.includes('dscf9999')));
  assert.strictEqual(m.unlisted, 1); // dscf0002 has no authored entry
});

test('merge without a machine manifest yields an empty, flagged gallery', async () => {
  const { mergeManifest } = await lib();
  const m = mergeManifest('prague/twilight', null, null, 'https://img.example.com');
  assert.strictEqual(m.count, 0);
  assert.strictEqual(m.key, 'prague_twilight');
  assert.ok(m.warnings.some(w => /not processed/.test(w)));
});

test('authored validation catches shape mistakes', async () => {
  const { validateAuthored } = await lib();
  assert.deepStrictEqual(validateAuthored({ photos: { dscf0001: { caption: 'x' } } }), []);
  const problems = validateAuthored({ photos: { DSCF0001: { captions: 'x' } }, order: 'dscf0001', extra: 1 }, 'f.yml');
  assert.ok(problems.some(p => /unknown top-level key "extra"/.test(p)));
  assert.ok(problems.some(p => /"order" must be a list/.test(p)));
  assert.ok(problems.some(p => /unknown key "captions"/.test(p)));
  assert.ok(problems.some(p => /lowercase/.test(p)));
});
