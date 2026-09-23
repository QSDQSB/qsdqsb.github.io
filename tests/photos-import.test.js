'use strict';

// photos:import (staging folder → photos/) and photos:pull (bucket →
// photos/): each may only fill gaps or replace a stamped compressed copy,
// never overwrite an original.

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const hasRclone = spawnSync('rclone', ['version']).status === 0;
const STAMP = 'qsdqsb bootstrap: compressed copy';

async function jpeg(colour, exif) {
  const sharp = require('sharp');
  const { injectExif } = await import('../scripts/photos/lib/exif-write.mjs');
  const buf = await sharp({ create: { width: 16, height: 9, channels: 3, background: colour } }).jpeg().toBuffer();
  return exif ? injectExif(buf, exif) : buf;
}

test('import replaces compressed copies under their existing name, adds new frames, refuses to clobber originals', { timeout: 30000 }, async () => {
  const { planImport, applyImport } = await import('../scripts/photos/import.mjs');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'photos-import-'));
  const photos = path.join(root, 'photos', 'cornwall'), from = path.join(root, 'staging', 'cornwall');
  fs.mkdirSync(photos, { recursive: true }); fs.mkdirSync(from, { recursive: true });

  fs.writeFileSync(path.join(photos, 'DSCF0001.jpg'), await jpeg('#111', { software: STAMP }));      // compressed copy
  fs.writeFileSync(path.join(photos, 'DSCF0002.jpg'), await jpeg('#222', { taken: '2023-03-14T15:00:00' })); // already an original
  fs.writeFileSync(path.join(from, 'DSCF0001.JPG'), await jpeg('#aaa', { taken: '2023-03-14T15:01:00' }));
  fs.writeFileSync(path.join(from, 'DSCF0003.JPG'), await jpeg('#bbb', { taken: '2023-03-14T15:02:00' }));

  let plan = await planImport(path.join(root, 'staging'), { photosDir: path.join(root, 'photos') });
  assert.deepStrictEqual(plan.map(s => [s.file, s.action, path.basename(s.to)]), [
    ['DSCF0001.JPG', 'replace', 'DSCF0001.jpg'],
    ['DSCF0003.JPG', 'add', 'DSCF0003.JPG'],
  ]);
  assert.strictEqual(applyImport(plan), 2);
  assert.deepStrictEqual(fs.readFileSync(path.join(photos, 'DSCF0001.jpg')), fs.readFileSync(path.join(from, 'DSCF0001.JPG')));

  plan = await planImport(path.join(root, 'staging'), { photosDir: path.join(root, 'photos') });
  assert.deepStrictEqual(plan.map(s => s.action), ['same', 'same'], 'a re-run copies nothing');

  // A different original for a frame that already has one, and a stamped copy coming back in.
  fs.writeFileSync(path.join(from, 'DSCF0002.JPG'), await jpeg('#ccc', { taken: '2023-03-14T15:00:00' }));
  fs.writeFileSync(path.join(from, 'DSCF0004.jpg'), await jpeg('#ddd', { software: STAMP }));
  plan = await planImport(path.join(root, 'staging'), { photosDir: path.join(root, 'photos') });
  const byFile = Object.fromEntries(plan.map(s => [s.file, s]));
  assert.strictEqual(byFile['DSCF0002.JPG'].action, 'refuse');
  assert.match(byFile['DSCF0002.JPG'].why, /already an original/);
  assert.strictEqual(byFile['DSCF0004.jpg'].action, 'refuse');
  assert.match(byFile['DSCF0004.jpg'].why, /bootstrap stamp/);
  const again = await planImport(path.join(root, 'staging'), { photosDir: path.join(root, 'photos'), replaceOriginals: true });
  assert.strictEqual(again.find(s => s.file === 'DSCF0002.JPG').action, 'replace');
  fs.rmSync(root, { recursive: true, force: true });
});

test('pull fetches only what photos/ lacks, and leaves trash and private manifests in the bucket', { skip: !hasRclone && 'rclone not installed', timeout: 30000 }, () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'photos-pull-'));
  const bucket = path.join(root, 'bucket');
  for (const [k, v] of [['london/DSCF0001.jpg', 'bucket copy'], ['london/DSCF0002.jpg', 'only in bucket'], ['london/.private.json', '{}'], ['trash/2026-09-20/london/DSCF0009.jpg', 'trashed']]) {
    fs.mkdirSync(path.dirname(path.join(bucket, k)), { recursive: true });
    fs.writeFileSync(path.join(bucket, k), v);
  }
  fs.mkdirSync(path.join(root, 'photos', 'london'), { recursive: true });
  fs.writeFileSync(path.join(root, 'photos', 'london', 'DSCF0001.jpg'), 'unpushed camera original');
  const env = {
    ...process.env, RCLONE_CONFIG_TESTR2_TYPE: 'local', PHOTOS_RCLONE_REMOTE: 'testr2',
    PHOTOS_ORIGINALS_BUCKET: bucket, PHOTOS_DIR: path.join(root, 'photos'),
  };
  const r = spawnSync(process.execPath, [path.join(ROOT, 'scripts/photos/pull.mjs')], { env, encoding: 'utf8' });
  assert.strictEqual(r.status, 0, r.stdout + r.stderr);
  const got = fs.readdirSync(path.join(root, 'photos'), { recursive: true }).map(f => f.split(path.sep).join('/')).sort();
  assert.deepStrictEqual(got, ['london', 'london/DSCF0001.jpg', 'london/DSCF0002.jpg']);
  assert.strictEqual(fs.readFileSync(path.join(root, 'photos', 'london', 'DSCF0001.jpg'), 'utf8'), 'unpushed camera original');
  fs.rmSync(root, { recursive: true, force: true });
});
