#!/usr/bin/env node
/**
 * Gallery asset pipeline.
 *
 * For every source image under gallery/**\/*.{jpg,jpeg,png,...} produces:
 *
 *   1. JPEG thumbnail        →  <stem>.jpg       (480w, committed in repo)
 *   2. JPEG thumbnail @2x    →  <stem>@2x.jpg    (960w, CI-only, gitignored)
 *   3. WebP thumbnail        →  <stem>.webp      (480w, CI-only, gitignored)
 *   4. WebP thumbnail @2x    →  <stem>@2x.webp   (960w, CI-only, gitignored)
 *   5. AVIF thumbnail        →  <stem>.avif      (480w, CI-only, gitignored)
 *   6. AVIF thumbnail @2x    →  <stem>@2x.avif   (960w, CI-only, gitignored)
 *   7. LQIP data-URI         →  _data/gallery_meta/<key>.yml
 *
 * Also writes per-image width/height (for aspect-ratio + CLS prevention) and
 * flags marking which formats/sizes were generated, so Liquid can emit
 * <source> tags conditionally.
 *
 * Incremental: skips outputs newer than their source.
 *
 * Usage:
 *   node scripts/generate-gallery-assets.mjs [--no-avif] [--no-webp] [--no-2x] [--lqip-only]
 *
 * Env:
 *   SKIP_AVIF=1   disable AVIF (slow on some CI runners)
 *   SKIP_WEBP=1   disable WebP
 *   SKIP_2X=1     skip @2x variants
 */

import sharp from 'sharp';
import fs    from 'fs';
import path  from 'path';

const ROOT        = process.cwd();
const GALLERY_DIR = path.join(ROOT, 'gallery');
const THUMB_DIR   = path.join(ROOT, 'images', 'thumbnails', 'gallery');
const META_DIR    = path.join(ROOT, '_data', 'gallery_meta');

const THUMB_W     = 480;
const THUMB_W_2X  = 960;
const LQIP_W      = 32;
const LQIP_Q      = 20;

const SKIP_AVIF = process.env.SKIP_AVIF === '1' || process.argv.includes('--no-avif');
const SKIP_WEBP = process.env.SKIP_WEBP === '1' || process.argv.includes('--no-webp');
const SKIP_2X   = process.env.SKIP_2X   === '1' || process.argv.includes('--no-2x');
const LQIP_ONLY = process.argv.includes('--lqip-only');

const EXT_RE = /\.(jpg|jpeg|png|gif|tif|tiff)$/i;

// ── helpers ────────────────────────────────────────────────────────────────────

function isNewer(src, dest) {
  if (!fs.existsSync(dest)) return false;
  return fs.statSync(dest).mtimeMs >= fs.statSync(src).mtimeMs;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function toDataUri(buf, mime) {
  return `data:${mime};base64,${buf.toString('base64')}`;
}

/** gallery/japan/kyoto → "japan_kyoto" */
function metaKey(relDir) {
  return relDir.replace(/\//g, '_').replace(/^_|_$/g, '');
}

async function makeVariant(srcPath, outPath, width, encoder) {
  if (LQIP_ONLY) return false;
  if (isNewer(srcPath, outPath)) return fs.existsSync(outPath);
  await encoder(sharp(srcPath).resize(width, null, { withoutEnlargement: true })).toFile(outPath);
  return true;
}

// ── per-file processing ────────────────────────────────────────────────────────

async function processImage(srcPath) {
  const relFromGallery = path.relative(GALLERY_DIR, srcPath);
  const dirPart        = path.dirname(relFromGallery);
  const basename       = path.basename(relFromGallery);
  const stem           = path.basename(basename, path.extname(basename));

  const thumbSubDir = path.join(THUMB_DIR, dirPart);
  ensureDir(thumbSubDir);

  const out = {
    jpeg:   path.join(thumbSubDir, basename),
    jpeg2x: path.join(thumbSubDir, `${stem}@2x.jpg`),
    webp:   path.join(thumbSubDir, `${stem}.webp`),
    webp2x: path.join(thumbSubDir, `${stem}@2x.webp`),
    avif:   path.join(thumbSubDir, `${stem}.avif`),
    avif2x: path.join(thumbSubDir, `${stem}@2x.avif`),
  };

  // 1× variants
  await makeVariant(srcPath, out.jpeg,   THUMB_W, p => p.jpeg({ quality: 80, mozjpeg: true }));
  if (!SKIP_WEBP) await makeVariant(srcPath, out.webp, THUMB_W, p => p.webp({ quality: 80 }));
  if (!SKIP_AVIF) await makeVariant(srcPath, out.avif, THUMB_W, p => p.avif({ quality: 65 }));

  // 2× variants
  if (!SKIP_2X) {
    await makeVariant(srcPath, out.jpeg2x, THUMB_W_2X, p => p.jpeg({ quality: 78, mozjpeg: true }));
    if (!SKIP_WEBP) await makeVariant(srcPath, out.webp2x, THUMB_W_2X, p => p.webp({ quality: 78 }));
    if (!SKIP_AVIF) await makeVariant(srcPath, out.avif2x, THUMB_W_2X, p => p.avif({ quality: 60 }));
  }

  // LQIP data-URI
  const lqipBuf = await sharp(srcPath)
    .resize(LQIP_W, null, { withoutEnlargement: true })
    .jpeg({ quality: LQIP_Q })
    .toBuffer();
  const lqip = toDataUri(lqipBuf, 'image/jpeg');

  // Natural dimensions (for aspect-ratio + CLS) — read from JPEG thumbnail when present,
  // otherwise fall back to source.
  const dims = await sharp(fs.existsSync(out.jpeg) ? out.jpeg : srcPath).metadata();

  return {
    dirPart,
    key:      metaKey(dirPart),
    basename,
    lqip,
    width:    dims.width  || null,
    height:   dims.height || null,
    avif:     fs.existsSync(out.avif),
    webp:     fs.existsSync(out.webp),
    avif2x:   fs.existsSync(out.avif2x),
    webp2x:   fs.existsSync(out.webp2x),
    jpeg2x:   fs.existsSync(out.jpeg2x),
  };
}

// ── YAML writer ────────────────────────────────────────────────────────────────

const FLAG_KEYS = ['avif', 'webp', 'avif2x', 'webp2x', 'jpeg2x'];

function writeMetaYaml(key, entries) {
  ensureDir(META_DIR);
  const metaFile = path.join(META_DIR, `${key}.yml`);

  // Preserve any keys we don't manage (forward-compat).
  const existing = {};
  if (fs.existsSync(metaFile)) {
    const text = fs.readFileSync(metaFile, 'utf8');
    let cur = null;
    for (const line of text.split('\n')) {
      const m = line.match(/^"?([^":]+)"?:\s*$/);
      if (m) { cur = m[1].trim(); existing[cur] = existing[cur] || {}; }
      else if (cur) {
        const kv = line.match(/^\s+([a-zA-Z0-9_]+):\s*"?(.+?)"?\s*$/);
        if (kv) existing[cur][kv[1]] = kv[2];
      }
    }
  }

  for (const e of entries) {
    existing[e.basename] = {
      ...existing[e.basename],
      lqip:   e.lqip,
      width:  e.width,
      height: e.height,
      avif:   e.avif,
      webp:   e.webp,
      avif2x: e.avif2x,
      webp2x: e.webp2x,
      jpeg2x: e.jpeg2x,
    };
  }

  const lines = [];
  for (const [filename, data] of Object.entries(existing)) {
    lines.push(`"${filename}":`);
    if (data.lqip)   lines.push(`  lqip: "${data.lqip}"`);
    if (data.width)  lines.push(`  width: ${data.width}`);
    if (data.height) lines.push(`  height: ${data.height}`);
    for (const k of FLAG_KEYS) {
      if (data[k] === true) lines.push(`  ${k}: true`);
    }
  }
  fs.writeFileSync(metaFile, lines.join('\n') + '\n');
  console.log(`  [meta] ${metaFile} (${entries.length} entries)`);
}

// ── main ───────────────────────────────────────────────────────────────────────

async function main() {
  const sources = [];
  const scan = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) scan(full);
      else if (EXT_RE.test(entry.name)) sources.push(full);
    }
  };
  scan(GALLERY_DIR);

  console.log(`Processing ${sources.length} images${LQIP_ONLY ? ' (LQIP+meta only)' : ''}…`);

  const byKey = new Map();
  let count = 0;
  for (const src of sources) {
    try {
      const result = await processImage(src);
      if (!byKey.has(result.key)) byKey.set(result.key, []);
      byKey.get(result.key).push(result);
      if (++count % 50 === 0) console.log(`  ... ${count}/${sources.length}`);
    } catch (err) {
      console.error(`  [error] ${src}: ${err.message}`);
    }
  }

  for (const [key, entries] of byKey) writeMetaYaml(key, entries);

  console.log('Done.');
}

main().catch(err => { console.error(err); process.exit(1); });
