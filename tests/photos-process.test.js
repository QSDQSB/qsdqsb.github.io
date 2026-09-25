'use strict';

// End-to-end run of the processor over a filesystem store with generated
// images: process, re-run unchanged, garbage-collect after a deletion, and
// EXIF (including GPS) staying out of the public bucket.

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const PROCESS = path.join(ROOT, 'scripts', 'photos', 'process.mjs');

async function makeJpeg(w, h, colour, exif) {
  const sharp = require('sharp');
  const { injectExif } = await import('../scripts/photos/lib/exif-write.mjs');
  const buf = await sharp({ create: { width: w, height: h, channels: 3, background: colour } }).jpeg().toBuffer();
  return exif ? injectExif(buf, exif) : buf;
}

function run(store, extra = []) {
  return execFileSync(process.execPath, [PROCESS, '--local', store, '--no-avif', ...extra], { encoding: 'utf8' });
}
const listFiles = (dir) => fs.existsSync(dir) ? fs.readdirSync(dir, { recursive: true }).filter(f => fs.statSync(path.join(dir, f)).isFile()).map(f => f.split(path.sep).join('/')).sort() : [];

test('processor renders tiers, skips unchanged, garbage-collects, and keeps EXIF private', { timeout: 120000 }, async () => {
  const store = fs.mkdtempSync(path.join(os.tmpdir(), 'photos-store-'));
  const originals = path.join(store, 'originals', 'demo', 'nested');
  fs.mkdirSync(originals, { recursive: true });
  fs.writeFileSync(path.join(originals, 'DSCF0001.jpg'), await makeJpeg(1600, 900, '#204060', { aperture: 2.8, shutter: '1/125', iso: 200, focal: 35, lens: 'XF 35mm', taken: '2024-05-01T09:00:00+01:00' }));
  fs.writeFileSync(path.join(originals, 'DSCF0002_old_name,_Place__XF90mm_f2.0_1:270s_ISO800.jpg'), await makeJpeg(600, 900, '#603020', { software: 'qsdqsb bootstrap: compressed copy' }));
  fs.writeFileSync(path.join(originals, '.hidden.jpg'), await makeJpeg(50, 50, '#000'));

  let out = run(store);
  assert.match(out, /2 processed, 0 unchanged/);

  const pub = path.join(store, 'public', 'demo', 'nested');
  // The manifest is private: it lives beside the originals, never in the public store.
  const manifestAt = path.join(store, 'originals', 'demo', 'nested', 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestAt, 'utf8'));
  assert.ok(!fs.existsSync(path.join(pub, 'manifest.json')), 'no manifest in the public store');
  assert.deepStrictEqual(manifest.photos.map(p => p.slug), ['dscf0001', 'dscf0002']);
  const p1 = manifest.photos[0];
  assert.strictEqual(p1.w, 1600); assert.strictEqual(p1.h, 900);
  assert.strictEqual(p1.aperture, 2.8); assert.strictEqual(p1.shutter, '1/125'); assert.strictEqual(p1.iso, 200);
  assert.strictEqual(p1.taken, '2024-05-01T09:00:00+01:00');
  assert.ok(p1.thumbhash.length > 10); assert.match(p1.tint, /^#[0-9a-f]{6}$/);
  // 1600px long edge: 480, 960, 1280 rendered; 1920+ skipped (no upscaling).
  assert.deepStrictEqual(p1.sizes.webp, [480, 960, 1280]);
  // Tiers live under the original's content hash, not the gallery path.
  assert.match(p1.hash, /^[0-9a-f]{16}$/);
  assert.strictEqual(p1.key, 'demo/nested/DSCF0001.jpg');
  assert.strictEqual(p1.frame, 'DSCF0001');
  const tiers = (h) => path.join(store, 'public', 't', h);
  assert.ok(fs.existsSync(path.join(tiers(p1.hash), '1280.webp')));
  assert.ok(!fs.existsSync(path.join(tiers(p1.hash), '1920.webp')));
  assert.ok(!fs.existsSync(path.join(pub, 'dscf0001')), 'nothing under the old gallery path');
  assert.strictEqual(p1.settings, null, 'no maker notes in a generated JPEG');
  assert.ok(!('gps' in p1), 'public manifest must not carry GPS');
  assert.ok(!('compressed' in p1), 'an unstamped original carries no compressed flag');
  assert.strictEqual(manifest.photos[1].compressed, true, 'the bootstrap stamp becomes compressed: true');

  const priv = JSON.parse(fs.readFileSync(path.join(store, 'originals', 'demo', 'nested', '.private.json'), 'utf8'));
  assert.ok(priv.photos.dscf0001, 'private manifest records every photo');
  assert.strictEqual(priv.photos.dscf0001.gps, null);

  // Public tiers carry no EXIF at all.
  const { readExif } = await import('../scripts/photos/lib/exif.mjs');
  const tierExif = await readExif(fs.readFileSync(path.join(tiers(p1.hash), '960.jpg')));
  assert.strictEqual(tierExif.aperture, null);

  out = run(store);
  assert.match(out, /0 processed, 2 unchanged, 0 removed/);

  const h2 = manifest.photos[1].hash;
  fs.unlinkSync(path.join(originals, 'DSCF0002_old_name,_Place__XF90mm_f2.0_1:270s_ISO800.jpg'));
  out = run(store);
  assert.match(out, /1 removed/);
  assert.deepStrictEqual(JSON.parse(fs.readFileSync(manifestAt, 'utf8')).photos.map(p => p.slug), ['dscf0001']);
  assert.ok(fs.existsSync(tiers(h2)), 'a normal run never deletes hash tiers: another gallery may share them');
  out = run(store, ['--gc']);
  assert.match(out, /gc: 1 referenced originals; \d+ unreferenced tier file\(s\) deleted/);
  assert.ok(!fs.existsSync(tiers(h2)), '--gc removes tiers no manifest references');

  // Only the one live original's tiers live in the public store: images, nothing else.
  assert.deepStrictEqual(listFiles(path.join(store, 'public')).filter(f => !f.startsWith(`t/${p1.hash}/`)), []);

  fs.rmSync(store, { recursive: true, force: true });
});

test('processor dry run touches nothing', { timeout: 60000 }, async () => {
  const store = fs.mkdtempSync(path.join(os.tmpdir(), 'photos-store-'));
  fs.mkdirSync(path.join(store, 'originals', 'g'), { recursive: true });
  fs.writeFileSync(path.join(store, 'originals', 'g', 'DSCF0009.jpg'), await makeJpeg(200, 100, '#123456'));
  const out = run(store, ['--dry-run']);
  assert.match(out, /1 processed/);
  assert.ok(!fs.existsSync(path.join(store, 'public')));
  fs.rmSync(store, { recursive: true, force: true });
});
