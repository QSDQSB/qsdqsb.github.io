'use strict';

// photos:recollect: the comparison, what blocks a push, the case-only rename
// that keeps a bucket key stable, and (when rclone is installed) the CLI
// against a local-directory rclone remote standing in for R2.

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const recollect = () => import('../scripts/photos/recollect.mjs');
const hasRclone = spawnSync('rclone', ['version']).status === 0;

const loc = (file, size = 10) => ({ file, slug: file.replace(/\..*$/, '').toLowerCase(), size });
const base = (file, size = 5) => ({ file, slug: file.replace(/\..*$/, '').toLowerCase(), size });

test('matched, new, renamed and vanishing are told apart, with authored work named', async () => {
  const { compareRecollection, blockers } = await recollect();
  const r = compareRecollection({
    local: [loc('DSCF0001.JPG'), loc('DSCF0002.jpg', 5), loc('DSCF0007.JPG'), loc('DSCF0008.tif')],
    baseline: [base('DSCF0001.jpg'), base('DSCF0002.jpg'), base('DSCF0003.jpg'), base('DSCF0004.jpg'), base('DSCF0008.jpg')],
    baselineHasSizes: true,
    doc: { order: ['dscf0004'], photos: { dscf0003: { caption: 'Gone' }, dscf0005: { caption: null } } },
  });
  assert.deepStrictEqual(r.matched, ['dscf0001', 'dscf0002', 'dscf0008']);
  assert.deepStrictEqual(r.unchanged, ['dscf0002']);
  const rewritten = compareRecollection({ local: [{ ...loc('DSCF0002.jpg', 5), md5: 'b' }], baseline: [{ ...base('DSCF0002.jpg'), md5: 'a' }], baselineHasSizes: true });
  assert.deepStrictEqual(rewritten.unchanged, [], 'same size, different bytes is a change');
  assert.deepStrictEqual(r.new.map(n => n.slug), ['dscf0007']);
  assert.deepStrictEqual(r.renamed, [
    { slug: 'dscf0001', local: 'DSCF0001.JPG', bucket: 'DSCF0001.jpg', safe: true },
    { slug: 'dscf0008', local: 'DSCF0008.tif', bucket: 'DSCF0008.jpg', safe: false },
  ]);
  assert.deepStrictEqual(r.vanishing, [
    { slug: 'dscf0003', file: 'DSCF0003.jpg', work: ['captioned'] },
    { slug: 'dscf0004', file: 'DSCF0004.jpg', work: ['pinned in order'] },
    { slug: 'dscf0005', file: null, work: [] },
  ]);

  const stop = blockers(r);
  assert.strictEqual(stop.length, 2);
  assert.match(stop[0], /dscf0003, dscf0004/);
  assert.match(stop[1], /1 file\(s\) are named differently/, 'a format change is not offered a rename');
  assert.deepStrictEqual(blockers(r, { allowDrop: true, rename: true }), []);
});

test('two local files for one frame block the push', async () => {
  const { compareRecollection, blockers } = await recollect();
  const r = compareRecollection({ local: [loc('DSCF0001.jpg')], baseline: [], collisions: ['slug collision: DSCF0001.tif → dscf0001-2'] });
  assert.ok(blockers(r).some(b => b.includes('share a frame')));
});

test('sameFormat allows case and .jpeg/.jpg, nothing else', async () => {
  const { sameFormat } = await recollect();
  assert.ok(sameFormat('DSCF0001.JPG', 'DSCF0001.jpg'));
  assert.ok(sameFormat('DSCF0001.jpeg', 'DSCF0001.jpg'));
  assert.ok(!sameFormat('DSCF0001.tif', 'DSCF0001.jpg'));
});

test('applyRenames gives a camera file the bucket name, and refuses to clobber a different file', async () => {
  const { applyRenames } = await recollect();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'photos-recollect-'));
  fs.writeFileSync(path.join(dir, 'DSCF0001.JPG'), 'camera');
  applyRenames(dir, [{ local: 'DSCF0001.JPG', bucket: 'DSCF0001.jpg', safe: true }]);
  assert.deepStrictEqual(fs.readdirSync(dir), ['DSCF0001.jpg']);
  assert.strictEqual(fs.readFileSync(path.join(dir, 'DSCF0001.jpg'), 'utf8'), 'camera');

  fs.writeFileSync(path.join(dir, 'DSCF0002.jpeg'), 'new');
  fs.writeFileSync(path.join(dir, 'DSCF0002.jpg'), 'other');
  assert.throws(() => applyRenames(dir, [{ local: 'DSCF0002.jpeg', bucket: 'DSCF0002.jpg', safe: true }]), /already exists/);
  assert.strictEqual(fs.readFileSync(path.join(dir, 'DSCF0002.jpeg'), 'utf8'), 'new', 'nothing moved');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('CLI refuses a case mismatch against the bucket, then fixes it with --rename', { skip: !hasRclone && 'rclone not installed', timeout: 30000 }, () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'photos-recollect-'));
  const gallery = 'zz-recollect-test';
  fs.mkdirSync(path.join(root, 'bucket', gallery), { recursive: true });
  fs.mkdirSync(path.join(root, 'photos', gallery), { recursive: true });
  fs.writeFileSync(path.join(root, 'bucket', gallery, 'DSCF0001.jpg'), 'earlier upload');
  fs.writeFileSync(path.join(root, 'photos', gallery, 'DSCF0001.JPG'), 'camera original');
  const env = {
    ...process.env, RCLONE_CONFIG_TESTR2_TYPE: 'local', PHOTOS_RCLONE_REMOTE: 'testr2',
    PHOTOS_ORIGINALS_BUCKET: path.join(root, 'bucket'), PHOTOS_DIR: path.join(root, 'photos'),
  };
  const cli = (...a) => spawnSync(process.execPath, [path.join(ROOT, 'scripts/photos/recollect.mjs'), '--gallery', gallery, ...a], { env, encoding: 'utf8' });

  let r = cli();
  assert.strictEqual(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stdout, /compared against the bucket \(1 original/);
  assert.match(r.stdout, /DSCF0001\.JPG\s+\(bucket: DSCF0001\.jpg\)/);

  r = cli('--rename');
  assert.strictEqual(r.status, 0, r.stdout + r.stderr);
  assert.deepStrictEqual(fs.readdirSync(path.join(root, 'photos', gallery)), ['DSCF0001.jpg']);
  fs.rmSync(root, { recursive: true, force: true });
});
