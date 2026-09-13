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
 * Depth estimation runs Depth Anything V2 via @xenova/transformers on the
 * WASM backend at 1036 px inference size. This is an AUTHORING-TIME step:
 * run it locally when adding a hero image and commit the outputs. CI never
 * runs the model (a full sweep would add ~1 h per deploy), and visitors only
 * ever download the finished grayscale JPEG.
 *
 * Models (--model, default v2-base). First run downloads the fp32 ONNX
 * weights to the transformers cache; rough sizes/pace on CPU:
 *   v1-small  Xenova/depth-anything-small-hf          ~100 MB  (legacy)
 *   v2-small  onnx-community/depth-anything-v2-small  ~100 MB  ~30-60 s/img
 *   v2-base   onnx-community/depth-anything-v2-base   ~390 MB  ~2-4 min/img
 *   v2-large  onnx-community/depth-anything-v2-large  ~1.3 GB  ~8-15 min/img
 *
 * Post-processing: percentile contrast stretch (0.5%–99.5% → full range) so
 * amp/focus behave consistently across images; NO blur (edge softness is what
 * causes the rubber-sheet parallax look); JPEG q94 to keep compression
 * ringing off the depth edges.
 *
 * Incremental: an image is skipped when its depth map exists and is newer
 * than the source. A warm run over an unchanged tree takes < 1 s.
 *
 * Usage:
 *   npm run generate:depth              # full sweep
 *   node scripts/generate-hero-depth-maps.mjs --only venice   # substring filter
 *   node scripts/generate-hero-depth-maps.mjs --force         # ignore mtimes
 *   node scripts/generate-hero-depth-maps.mjs --model v2-large
 *   node scripts/generate-hero-depth-maps.mjs --suffix v2l    # write
 *       <name>.depth.v2l.jpg beside the canonical map — benchmarking variants
 *       (the hero include only ever loads the exact .depth.jpg, and the tilt
 *       rig picks variants up via ?depth=v2l)
 *   node scripts/generate-hero-depth-maps.mjs --size 1288     # inference px
 */

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT_ROOT = path.join(ROOT, 'images', 'depth');
const COLLECTIONS = ['_pages', '_posts', '_voyage', '_subvoyage', '_portfolio'];
const MAX_WIDTH = 1600;      // heroes are viewport-cropped; depth needs no more

const MODELS = {
  'v1-small': 'Xenova/depth-anything-small-hf',
  'v2-small': 'onnx-community/depth-anything-v2-small',
  'v2-base': 'onnx-community/depth-anything-v2-base',
  'v2-large': 'onnx-community/depth-anything-v2-large'
};

const args = process.argv.slice(2);
const force = args.includes('--force');
function argValue(name) {
  const i = args.indexOf(name);
  return i !== -1 ? args[i + 1] : null;
}
const only = argValue('--only');
const modelKey = argValue('--model') || 'v2-base';
const suffix = argValue('--suffix');
const INFERENCE_SIZE = parseInt(argValue('--size') || '', 10) || 1036; // 2x native 518 — finer edge structure

if (!MODELS[modelKey]) {
  console.error(`[depth] unknown --model "${modelKey}" — one of: ${Object.keys(MODELS).join(', ')}`);
  process.exit(1);
}
if (suffix && !/^[a-z0-9-]+$/.test(suffix)) {
  console.error('[depth] --suffix must be lowercase alphanumeric/hyphen');
  process.exit(1);
}

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
// A --suffix lands between .depth and .jpg: benchmark variants the hero
// include never loads (it looks for the exact .depth.jpg).
function depthPathFor(srcRel) {
  const key = srcRel.startsWith('images/') ? srcRel.slice('images/'.length) : srcRel;
  return path.posix.join('images', 'depth', key + '.depth' + (suffix ? '.' + suffix : '') + '.jpg');
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

console.log(`[depth] ${jobs.length} image(s) to process — model ${modelKey} (${MODELS[modelKey]}), inference ${INFERENCE_SIZE}px`);

// Lazy-load the model only when there is real work — keeps warm runs instant.
// fp32 weights first (quantization visibly bands smooth depth gradients);
// fall back to the repo's default quantization only if fp32 isn't published.
const { pipeline, RawImage } = await import('@xenova/transformers');
let estimator;
try {
  estimator = await pipeline('depth-estimation', MODELS[modelKey], { quantized: false });
} catch (err) {
  console.warn(`[depth] fp32 load failed for ${MODELS[modelKey]} (${err.message}) — retrying default quantization`);
  try {
    estimator = await pipeline('depth-estimation', MODELS[modelKey]);
  } catch (err2) {
    console.error(`[depth] model load failed: ${err2.message}`);
    console.error('[depth] try a different --model (v1-small always works offline once cached)');
    process.exit(1);
  }
}
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

  // Percentile contrast stretch (0.5%–99.5% → 0–255): the shader's amp/focus
  // knobs assume depth uses the full range; raw model output often doesn't.
  // Deliberately NO blur — softened occlusion edges are what create the
  // rubber-sheet look in the parallax. q94 keeps JPEG ringing off the edges.
  const { data, info } = await sharp(raw).greyscale().raw().toBuffer({ resolveWithObject: true });
  const hist = new Array(256).fill(0);
  for (let i = 0; i < data.length; i += 1) hist[data[i]] += 1;
  const clip = data.length * 0.005;
  let lo = 0;
  let hi = 255;
  for (let v = 0, acc = 0; v < 256; v += 1) { acc += hist[v]; if (acc >= clip) { lo = v; break; } }
  for (let v = 255, acc = 0; v >= 0; v -= 1) { acc += hist[v]; if (acc >= clip) { hi = v; break; } }
  if (hi > lo + 8) {
    const scale = 255 / (hi - lo);
    for (let i = 0; i < data.length; i += 1) {
      data[i] = Math.max(0, Math.min(255, Math.round((data[i] - lo) * scale)));
    }
  }
  await sharp(data, { raw: { width: info.width, height: info.height, channels: 1 } })
    .jpeg({ quality: 94 }).toFile(job.out);
  done += 1;
  console.log(`[depth] ${done}/${jobs.length} ${job.outRel} (${Math.round((Date.now() - t0) / 1000)}s)`);
}

console.log(`[depth] done — ${done} depth map(s) written`);
