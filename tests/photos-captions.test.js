'use strict';

// photos:captions: new slugs are appended as text, in capture-time order,
// and nothing already written (entries, comments, other keys) moves.

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const captions = () => import('../scripts/photos/captions.mjs');

test('appendEntries extends a block mapping and keeps comments and later keys in place', async () => {
  const { appendEntries } = await captions();
  const before = [
    '# header',
    'photos:',
    '  dscf0001:',
    '    caption: East Smithfield  # kept',
    '    # a note inside the block',
    '',
    '# trailing top-level comment',
    'order: [dscf0001]',
    '',
  ].join('\n');
  const after = appendEntries(before, ['dscf0002', 'dscf0003']);
  assert.strictEqual(after, [
    '# header',
    'photos:',
    '  dscf0001:',
    '    caption: East Smithfield  # kept',
    '    # a note inside the block',
    '  dscf0002:',
    '    caption:',
    '  dscf0003:',
    '    caption:',
    '',
    '# trailing top-level comment',
    'order: [dscf0001]',
    '',
  ].join('\n'));
});

test('appendEntries handles an empty flow mapping, a missing key, a missing file, and refuses inline content', async () => {
  const { appendEntries } = await captions();
  assert.strictEqual(appendEntries('# c\nphotos: {}\n', ['dscf0001']), '# c\nphotos:\n  dscf0001:\n    caption:\n');
  assert.strictEqual(appendEntries('title: Rigi\n', ['dscf0001']), 'title: Rigi\nphotos:\n  dscf0001:\n    caption:\n');
  assert.strictEqual(appendEntries(null, ['dscf0001'], '# new\n'), '# new\nphotos:\n  dscf0001:\n    caption:\n');
  assert.strictEqual(appendEntries('photos: {}\n', []), 'photos: {}\n', 'nothing to add leaves the text alone');
  assert.throws(() => appendEntries('photos: {dscf0001: {caption: x}}\n', ['dscf0002']), /inline/);
});

test('scaffold orders new slugs by capture time, keeps existing entries, and is idempotent', { timeout: 30000 }, async () => {
  const { scaffold } = await captions();
  const sharp = require('sharp');
  const { injectExif } = await import('./helpers/exif-write.mjs');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'photos-captions-'));
  const photosDir = path.join(root, 'photos'), authoredDir = path.join(root, 'authored'), mergedDir = path.join(root, 'merged');
  fs.mkdirSync(path.join(photosDir, 'g'), { recursive: true });
  fs.mkdirSync(authoredDir, { recursive: true });
  const jpeg = await sharp({ create: { width: 8, height: 8, channels: 3, background: '#333' } }).jpeg().toBuffer();
  // Frame numbers run against capture time, so the order proves EXIF was read.
  fs.writeFileSync(path.join(photosDir, 'g', 'DSCF0003.jpg'), injectExif(jpeg, { taken: '2024-05-01T08:00:00' }));
  fs.writeFileSync(path.join(photosDir, 'g', 'DSCF0002.jpg'), injectExif(jpeg, { taken: '2024-05-01T09:00:00' }));
  fs.writeFileSync(path.join(photosDir, 'g', 'DSCF0001.jpg'), injectExif(jpeg, { taken: '2024-05-01T10:00:00' }));
  fs.writeFileSync(path.join(photosDir, 'g', 'DSCF0009.jpg'), jpeg); // undated: last
  const yml = path.join(authoredDir, 'g.yml');
  fs.writeFileSync(yml, 'photos:\n  dscf0002:\n    caption: Already written\n    featured: true\n');

  const dirs = { photosDir, authoredDir, mergedDir };
  const r = await scaffold('g', dirs);
  assert.deepStrictEqual(r.problems, []);
  assert.deepStrictEqual(r.added, ['dscf0003', 'dscf0001', 'dscf0009']);
  assert.ok(r.after.startsWith('photos:\n  dscf0002:\n    caption: Already written\n    featured: true\n'));
  fs.writeFileSync(yml, r.after);

  const again = await scaffold('g', dirs);
  assert.deepStrictEqual(again.added, []);
  assert.strictEqual(again.total, 4);
  fs.rmSync(root, { recursive: true, force: true });
});

test('scaffold refuses YAML that already fails validation and writes nothing', async () => {
  const { scaffold } = await captions();
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'photos-captions-'));
  fs.mkdirSync(path.join(root, 'authored'));
  fs.writeFileSync(path.join(root, 'authored', 'g.yml'), 'photos:\n  DSCF0001:\n    captoin: typo\n');
  const r = await scaffold('g', { photosDir: path.join(root, 'photos'), authoredDir: path.join(root, 'authored'), mergedDir: path.join(root, 'merged') });
  assert.ok(r.problems.some(p => p.includes('captoin')));
  assert.strictEqual(r.after, r.before);
  fs.rmSync(root, { recursive: true, force: true });
});
