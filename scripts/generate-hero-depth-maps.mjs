#!/usr/bin/env node
/**
 * Hero depth-map pipeline (Lontananza).
 *
 * Scans collection frontmatter for `header.overlay_image` and produces one
 * neural depth map per unique hero image:
 *
 *   images/cover/venice-3v1.jpg  →  images/depth/cover/venice-3v1.jpg.depth.jpg
 *   gallery/foo/bar.jpg          →  images/depth/gallery/foo/bar.jpg.depth.jpg
 *
 * The `.depth.jpg` suffix is appended to the FULL source filename (dots occur
 * mid-name in EXIF-style gallery filenames, so extension swapping is unsafe).
 * `_includes/page__hero.html` derives the same path in Liquid and checks
 * `site.static_files` for it — pages whose hero has no depth map simply keep
 * the static background.
 *
 * Depth estimation runs Depth Anything (small) via @xenova/transformers on
 * the WASM backend at 1036 px inference size — roughly 30–60 s per image on
 * CPU. This is an AUTHORING-TIME step: run it locally when adding a hero
 * image and commit the outputs. CI never runs the model (a full sweep would
 * add ~1 h per deploy), and visitors only ever download the finished ~40 KB
 * grayscale JPEG.
 *
 * Incremental: an image is skipped when its depth map exists and is newer
 * than the source. A warm run over an unchanged tree takes < 1 s.
 *
 * Usage:
 *   npm run generate:depth              # full sweep
 *   node scripts/generate-hero-depth-maps.mjs --only venice   # substring filter
 *   node scripts/generate-hero-depth-maps.mjs --force         # ignore mtimes
 */

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT_ROOT = path.join(ROOT, 'images', 'depth');
const COLLECTIONS = ['_pages', '_posts', '_voyage', '_subvoyage', '_portfolio'];
const INFERENCE_SIZE = 1036; // 2x the model's native 518 — finer foliage/edge structure
const MAX_WIDTH = 1600;      // heroes are viewport-cropped; depth needs no more

const args = process.argv.slice(2);
const force = args.includes('--force');
const onlyIdx = args.indexOf('--only');
const only = onlyIdx !== -1 ? args[onlyIdx + 1] : null;

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(p);
    else if (/\.(md|html)$/.test(entry.name)) yield p;
  }
}

// Hero images referenced outside frontmatter (e.g. hardcoded in a layout's
// CSS custom property) — listed here explicitly so the sweep still covers them.
const EXTRA_SOURCES = [
  'QSD_Night_5v2.jpg', // _layouts/home.html --hero-photo
];

// Collect unique overlay_image values from frontmatter blocks.
const sources = new Set(EXTRA_SOURCES);
for (const collection of COLLECTIONS) {
  const dir = path.join(ROOT, collection);
  if (!fs.existsSync(dir)) continue;
  for (const file of walk(dir)) {
    const text = fs.readFileSync(file, 'utf8');
    const fm = text.match(/^---\n([\s\S]*?)\n---/);
    if (!fm) continue;
    const m = fm[1].match(/^\s*overlay_image:\s*["']?([^"'\n]+?)["']?\s*$/m);
    if (m) sources.add(m[1].trim());
  }
}

// Resolve to a repo-relative source path, mirroring page__hero.html:
// external URLs are skipped, a leading "/" is site-root-relative, and bare
// paths live under images/.
function resolveSource(value) {
  if (value.includes('://')) return null;
  return value.startsWith('/') ? value.slice(1) : path.posix.join('images', value);
}

// images/<rest> → depth/<rest>; anything else (gallery/…) mirrors in full.
function depthPathFor(srcRel) {
  const key = srcRel.startsWith('images/') ? srcRel.slice('images/'.length) : srcRel;
  return path.posix.join('images', 'depth', key + '.depth.jpg');
}

const jobs = [];
for (const value of [...sources].sort()) {
  const srcRel = resolveSource(value);
  if (!srcRel) continue;
  if (only && !srcRel.includes(only)) continue;
  const src = path.join(ROOT, srcRel);
  if (!fs.existsSync(src)) {
    console.warn(`[depth] MISSING source ${srcRel} (referenced as "${value}")`);
    continue;
  }
  const outRel = depthPathFor(srcRel);
  const out = path.join(ROOT, outRel);
  if (!force && fs.existsSync(out) && fs.statSync(out).mtimeMs > fs.statSync(src).mtimeMs) {
    continue; // fresh
  }
  jobs.push({ src, srcRel, out, outRel });
}

if (jobs.length === 0) {
  console.log('[depth] all depth maps fresh — nothing to do');
  process.exit(0);
}

console.log(`[depth] ${jobs.length} image(s) to process`);

// Lazy-load the model only when there is real work — keeps warm runs instant.
const { pipeline, RawImage } = await import('@xenova/transformers');
const estimator = await pipeline('depth-estimation', 'Xenova/depth-anything-small-hf');
estimator.processor.feature_extractor.size = { width: INFERENCE_SIZE, height: INFERENCE_SIZE };

let done = 0;
for (const job of jobs) {
  const t0 = Date.now();
  // Inference input mirrors the display orientation/scale of the hero photo.
  const prepared = await sharp(job.src).rotate().resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: 92 }).toBuffer();
  const image = await RawImage.fromBlob(new Blob([prepared]));
  const { depth } = await estimator(image);
  const raw = await depth.save('__depth_tmp.png').then(() => fs.readFileSync('__depth_tmp.png'));
  fs.rmSync('__depth_tmp.png', { force: true });
  fs.mkdirSync(path.dirname(job.out), { recursive: true });
  await sharp(raw).blur(0.7).jpeg({ quality: 88 }).toFile(job.out);
  done += 1;
  console.log(`[depth] ${done}/${jobs.length} ${job.outRel} (${Math.round((Date.now() - t0) / 1000)}s)`);
}

console.log(`[depth] done — ${done} depth map(s) written`);
