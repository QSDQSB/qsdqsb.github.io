const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const yaml = require('js-yaml');

// The pixel harness's content is pinned (scripts/visual-content.mjs): content added after the pin
// must never reach the shots, and the pinned content must come out as it went in.
const load = () => import('../scripts/visual-content.mjs');
const book = () => import('../scripts/photos/lib/book.mjs');
const ROOT = path.join(__dirname, '..');

const photo = (slug, ratio) => ({ slug, frame: slug.toUpperCase(), url: `https://img.example/${slug}`, w: 3000, h: Math.round(3000 / ratio), ratio, sizes: { webp: [480, 960] } });

test("a document's updated: is kept as written, none where it has none", async () => {
  const { updatedOf } = await load();
  assert.equal(updatedOf('---\ntitle: X\nupdated: 2026-10-10 19:35\n---\nbody'), '2026-10-10 19:35');
  assert.equal(updatedOf('---\ntitle: X\n---\nupdated: 2026-01-01'), null);
  assert.equal(updatedOf('no front matter'), undefined);
});

test('a document Jekyll leaves out is not pinned', async () => {
  const { unpublished } = await load();
  assert.equal(unpublished('---\ntitle: X\npublished: false\n---\n'), true);
  assert.equal(unpublished('---\ntitle: X\n---\npublished: false\n'), false);
});

test('a book that gained a photograph, narrowed to the pin, is the book the pin saw', async () => {
  const { narrowBook } = await load();
  const { bookOf } = await book();
  const pinned = [photo('a', 1.5), photo('b', 0.66), photo('c', 1.5), photo('d', 1.0)];
  const then = bookOf({ gallery: 'g', title: 'G', cover: { photo: 'c' }, count: 4, photos: pinned });
  const now = bookOf({ gallery: 'g', title: 'G', cover: { photo: 'c' }, count: 5, photos: [pinned[0], photo('new', 0.66), ...pinned.slice(1)] });
  assert.notDeepEqual(now.book.rows, then.book.rows);
  const narrowed = narrowBook(now, pinned.map((p) => p.slug));
  assert.deepEqual(narrowed.book, then.book);
  assert.deepEqual(narrowed.photos, then.photos);
  assert.equal(narrowed.count, 4);
});

test('a book that holds only pinned photographs is left as it is', async () => {
  const { narrowBook } = await load();
  const m = { gallery: 'g', photos: [photo('a', 1.5)], book: { rows: 'as fetched' } };
  assert.equal(narrowBook(m, ['a', 'b']), m);
});

test('a book that lost a pinned photograph is drawn as it is, the rest as pinned', async () => {
  const { narrowBook } = await load();
  const m = { gallery: 'g', photos: [photo('a', 1.5), photo('c', 1.5)], book: { rows: 'as fetched' } };
  assert.equal(narrowBook(m, ['a', 'b', 'c']), m);
});

test('a pinned photograph the manifests lack is named', async () => {
  const { missingOf } = await load();
  const pin = { photos: { g: ['a', 'b'], h: ['c'] } };
  assert.deepEqual(missingOf(pin, { g: { photos: [{ slug: 'a' }] } }), [['g', 'b'], ['h', 'c']]);
});

test('the frozen manifests hold only pinned galleries, counted as pinned', async () => {
  const { frozenFiles } = await load();
  const { bookOf } = await book();
  const london = bookOf({ gallery: 'london', key: 'london', photos: [photo('a', 1.5), photo('new', 1.5)] });
  const added = bookOf({ gallery: 'dolomites/in-passing', key: 'dolomites/in-passing', photos: [photo('x', 1.5)] });
  const live = {
    london, 'dolomites_in-passing': added,
    _covers: { london: { gallery: 'london' }, dolomites: { gallery: 'dolomites/in-passing' } },
    _index: { base: 'b', galleries: { london: { count: 2 }, 'dolomites/in-passing': { count: 1 } } },
  };
  const files = frozenFiles({ photos: { london: ['a'] } }, live, { colours: [] });
  assert.deepEqual(Object.keys(files).sort(), ['_covers', '_index', 'frames', 'london']);
  assert.deepEqual(Object.keys(files.frames), ['london']);
  assert.equal(files.london.count, 1);
  assert.deepEqual(files._index.galleries, { london: { count: 1 } });
  assert.deepEqual(Object.keys(files._covers), ['london']);
});

// The wiring: visual:build freezes first and loads the Ruby half ahead of Jekyll (the github-pages
// gem's safe mode loads no plugin of the site's own), and the Ruby half acts only on a build with
// visual_baseline set, which the live build never has.
test('visual:build freezes the manifests and loads the pin ahead of Jekyll', () => {
  const build = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).scripts['visual:build'];
  assert.match(build, /^node scripts\/visual-content\.mjs freeze && /);
  assert.match(build, /ruby -r \.\/scripts\/visual-content\.rb /);
  assert.equal(yaml.load(fs.readFileSync(path.join(ROOT, '_config_visual.yml'), 'utf8')).visual_baseline, true);
  assert.equal(yaml.load(fs.readFileSync(path.join(ROOT, '_config.yml'), 'utf8')).visual_baseline, undefined);
  const pin = JSON.parse(fs.readFileSync(path.join(ROOT, 'tests/visual/content-pin.json'), 'utf8'));
  assert.ok(!Number.isNaN(Date.parse(pin.time)), 'the pin holds its moment');
  assert.ok(Object.keys(pin.docs).length && Object.keys(pin.photos).length);
});
