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

// A textured picture: `seed` decides the pattern, so the same seed is "the
// same photograph" at any size or quality and different seeds are not.
async function jpeg(seed, exif, { w = 96, h = 64, quality = 90 } = {}) {
  const sharp = require('sharp');
  const { injectExif } = await import('../scripts/photos/lib/exif-write.mjs');
  const px = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const u = x / w, t = y / h; // size-independent, so a smaller copy is the same picture
    const v = 128 + 100 * Math.sin(u * (seed % 7 + 2) * 4 + seed) * Math.cos(t * (seed % 5 + 2) * 4 - seed);
    px.fill(Math.max(0, Math.min(255, Math.round(v))), (y * w + x) * 3, (y * w + x) * 3 + 3);
  }
  const buf = await sharp(px, { raw: { width: w, height: h, channels: 3 } }).jpeg({ quality }).toBuffer();
  return exif ? injectExif(buf, exif) : buf;
}
const CAMERA = (t) => ({ camera: 'FUJIFILM X-S10', taken: `2023-03-14T15:0${t}:00` });

function tree() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'photos-import-'));
  const dirs = { root, photosDir: path.join(root, 'photos'), legacyDir: path.join(root, 'gallery'), inbox: path.join(root, 'inbox'), cacheFile: path.join(root, 'sigs.json') };
  for (const d of [dirs.photosDir, dirs.legacyDir, dirs.inbox]) fs.mkdirSync(d, { recursive: true });
  return dirs;
}
const put = (dir, rel, buf) => { fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true }); fs.writeFileSync(path.join(dir, rel), buf); };

test('import verifies by picture, replaces compressed copies under their name, adds new frames, refuses to clobber originals', { timeout: 60000 }, async () => {
  const { planImport, applyImport, signatureIndex } = await import('../scripts/photos/import.mjs');
  const d = tree();
  put(d.photosDir, 'cornwall/DSCF0001.jpg', await jpeg(1, { software: STAMP }, { w: 48, h: 32, quality: 60 })); // compressed copy
  put(d.photosDir, 'cornwall/DSCF0002.jpg', await jpeg(2, CAMERA(0)));                                          // already an original
  put(d.inbox, 'cornwall/DSCF0001.JPG', await jpeg(1, CAMERA(1)));   // its camera original
  put(d.inbox, 'cornwall/DSCF0003.JPG', await jpeg(3, CAMERA(2)));   // a new frame, filed under its voyage

  const opts = { photosDir: d.photosDir, legacyDir: d.legacyDir, index: await signatureIndex({ ...d }) };
  let plan = await planImport(d.inbox, opts);
  assert.deepStrictEqual(plan.map(s => [s.rel, s.action, s.to && path.basename(s.to)]), [
    ['cornwall/DSCF0001.JPG', 'replace', 'DSCF0001.jpg'],
    ['cornwall/DSCF0003.JPG', 'add', 'DSCF0003.JPG'],
  ]);
  assert.ok(plan[0].checks.some(c => c.name === 'same photo' && c.ok && !c.warn), 'the replacement is confirmed by picture');
  assert.deepStrictEqual(applyImport(plan, { move: true }), { copied: 2, moved: 2 });
  assert.deepStrictEqual(fs.readdirSync(path.join(d.inbox, 'cornwall')), [], 'verified files leave the inbox');

  // The same frame number with a different picture, a different original for a frame that has one, and a stamped copy.
  put(d.inbox, 'cornwall/DSCF0002.JPG', await jpeg(9, CAMERA(3)));
  put(d.inbox, 'cornwall/DSCF0004.jpg', await jpeg(4, { software: STAMP }));
  plan = await planImport(d.inbox, { ...opts, index: await signatureIndex({ ...d }) });
  const by = Object.fromEntries(plan.map(s => [s.file, s]));
  assert.strictEqual(by['DSCF0002.JPG'].action, 'unplaced');
  assert.match(by['DSCF0002.JPG'].why, /different one/);
  assert.strictEqual(by['DSCF0004.jpg'].action, 'refuse');
  assert.match(by['DSCF0004.jpg'].why, /bootstrap stamp/);
  fs.rmSync(d.root, { recursive: true, force: true });
});

test('the gateway sorts loose and misfiled files by name or by picture, and flags what matches nothing', { timeout: 60000 }, async () => {
  const { planImport, signatureIndex, discard, NON_MATCH } = await import('../scripts/photos/import.mjs');
  const d = tree();
  put(d.legacyDir, 'capri/DSCF3921_Monte_Solaro__XF90mm_f7.6_1:140s_ISO800.jpg', await jpeg(21, null, { w: 48, h: 32 }));
  put(d.legacyDir, 'rome/trevi/DSCF0500_Trevi__XF90mm_f5_1:250s_ISO200.jpg', await jpeg(50, null, { w: 48, h: 32 }));
  put(d.photosDir, 'capri/DSCF3921.jpg', await jpeg(21, { software: STAMP }, { w: 48, h: 32 }));
  put(d.photosDir, 'rome/trevi/DSCF0500.jpg', await jpeg(50, { software: STAMP }, { w: 48, h: 32 }));

  put(d.inbox, 'DSCF0500.JPG', await jpeg(50, CAMERA(1)));                 // loose at the root, right name
  put(d.inbox, 'wrong folder/DSCF3951.JPG', await jpeg(21, CAMERA(2)));    // a typo'd name: only the picture says capri
  put(d.inbox, 'wrong folder/zz copy.JPG', await jpeg(21, CAMERA(2)));        // byte-identical to the one above
  put(d.inbox, 'IMG_0042.JPG', await jpeg(77, CAMERA(3)));                 // matches nothing

  const plan = await planImport(d.inbox, { photosDir: d.photosDir, legacyDir: d.legacyDir, index: await signatureIndex({ ...d }) });
  const by = Object.fromEntries(plan.map(s => [s.rel, s]));
  assert.strictEqual(by['DSCF0500.JPG'].gallery, 'rome/trevi');
  assert.strictEqual(by['DSCF0500.JPG'].action, 'replace');
  assert.strictEqual(by['wrong folder/DSCF3951.JPG'].gallery, 'capri');
  assert.strictEqual(path.basename(by['wrong folder/DSCF3951.JPG'].to), 'DSCF3921.jpg', 'imported under the published name, so the slug survives');
  assert.match(by['wrong folder/DSCF3951.JPG'].placed, /matched by picture to capri\/dscf3921/);
  assert.strictEqual(by['wrong folder/zz copy.JPG'].action, 'duplicate');
  assert.strictEqual(by['IMG_0042.JPG'].action, 'unplaced');
  assert.deepStrictEqual(plan.filter(s => NON_MATCH.has(s.action)).map(s => s.rel).sort(), ['IMG_0042.JPG', 'wrong folder/zz copy.JPG']);

  // Discarding moves to a trash folder, never deletes, and only inside the inbox.
  const trash = path.join(d.root, 'Trash');
  assert.deepStrictEqual(discard(d.inbox, ['IMG_0042.JPG'], trash).map(x => path.basename(x.dest)), ['IMG_0042.JPG']);
  assert.ok(fs.existsSync(path.join(trash, 'IMG_0042.JPG')) && !fs.existsSync(path.join(d.inbox, 'IMG_0042.JPG')));
  assert.throws(() => discard(d.inbox, ['../photos/capri/DSCF3921.jpg'], trash), /not a file in/);
  fs.rmSync(d.root, { recursive: true, force: true });
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
