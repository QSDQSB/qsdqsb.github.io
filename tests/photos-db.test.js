'use strict';

// The photo database Worker: stable ids and how each manifest entry finds its photo.

const test = require('node:test');
const assert = require('node:assert');

const db = () => import('../workers/photos-db/src/index.mjs');

test('ids are p_ + a 26-character ULID, sortable by creation time', async () => {
  const { ulid, newId } = await db();
  const a = ulid(1_700_000_000_000, new Uint8Array(10)), b = ulid(1_700_000_000_001, new Uint8Array(10));
  assert.match(a, /^[0-9A-HJKMNP-TV-Z]{26}$/);
  assert.ok(a < b, 'later ids sort after earlier ones');
  assert.match(newId(), /^p_[0-9A-Z]{26}$/);
});

test('an entry finds its photo by source key, then camera key, then content hash, else a new id', async () => {
  const { resolve, factsDigest } = await db();
  const facts = factsDigest({ slug: 'dscf1797', key: 'london/DSCF1797.jpg', version: 'e1:10', hash: 'h1' });
  const known = {
    sources: new Map([['london/DSCF1797.jpg', { photo_id: 'p_SOURCE', version: 'e1:10', hash: 'h1', facts, removed_at: null }]]),
    byCamera: new Map([['FUJIFILM X-S10#11391', 'p_CAMERA']]),
    byHash: new Map([['h9', 'p_HASH']]),
  };
  let n = 0;
  const mint = () => `p_NEW${++n}`;
  const entries = [
    { slug: 'dscf1797', key: 'london/DSCF1797.jpg', version: 'e2:20', hash: 'h2' },        // re-collected original, same key
    { slug: 'dscf1797', key: 'london/DSCF1797.jpg', version: 'e1:10', hash: 'h1' },        // untouched
    { slug: 'dscf1559', key: 'cornwall/DSCF1559.jpg', version: 'e3:1', hash: 'h3', camera: 'FUJIFILM X-S10', shutterCount: 11391 }, // moved: same exposure, new key
    { slug: 'dscf0001', key: 'paris/DSCF0001.jpg', version: 'e4:1', hash: 'h9' },          // same bytes as a known photo
    { slug: 'dscf0002', key: 'paris/DSCF0002.jpg', version: 'e5:1', hash: 'h5' },          // never seen
  ];
  const priv = {};
  const r = resolve(entries, priv, known, mint);
  assert.deepStrictEqual(r.map(x => [x.id, x.how, x.unchanged]), [
    ['p_SOURCE', 'source', false], ['p_SOURCE', 'source', true], ['p_CAMERA', 'camera', false], ['p_HASH', 'hash', false], ['p_NEW1', 'new', false],
  ]);
});

test('an entry with no hash yet is unchanged when its version is, not rewritten every sync', async () => {
  const { resolve, factsDigest } = await db();
  const entry = { slug: 'dscf1797', key: 'london/DSCF1797.jpg', version: 'e1:10' };
  const known = { sources: new Map([['london/DSCF1797.jpg', { photo_id: 'p_A', version: 'e1:10', hash: null, facts: factsDigest(entry), removed_at: null }]]), byCamera: new Map(), byHash: new Map() };
  assert.strictEqual(resolve([entry], {}, known)[0].unchanged, true);
});

test('a fact derived later (the sun) rewrites a photo whose original never changed', async () => {
  const { resolve, factsDigest } = await db();
  const before = { slug: 'dscf1797', key: 'london/DSCF1797.jpg', version: 'e1:10', hash: 'h1' };
  const known = { sources: new Map([['london/DSCF1797.jpg', { photo_id: 'p_A', version: 'e1:10', hash: 'h1', facts: factsDigest(before), removed_at: null }]]), byCamera: new Map(), byHash: new Map() };
  const after = { ...before, sun: { alt: 2.8, az: 302, rising: false, toSunrise: 480, toSunset: 28, toNoon: -452 } };
  assert.strictEqual(resolve([after], {}, known)[0].unchanged, false);
  assert.strictEqual(resolve([before], {}, known)[0].unchanged, true);
});

test('manifest and private-file events both mark their gallery as touched; trash never does', async () => {
  const { touched } = await db();
  const msg = (key) => ({ body: { object: { key } } });
  assert.deepStrictEqual(touched([msg('london/manifest.json'), msg('prague/twilight/.private.json'), msg('london/.private.json'),
    msg('trash/2026-09-24/london/.private.json'), msg('t/abc/960.webp')]).sort(), ['london', 'prague/twilight']);
});
