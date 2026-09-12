#!/usr/bin/env node
/* Depth Anything V2 ONNX runner.
 *
 * Mirrors the official DA2 inference recipe: aspect-preserving resize with
 * the SHORT side at --size (default 518), both dims rounded up to multiples
 * of 14 (lower_bound mode), ImageNet mean/std normalisation. Output follows
 * the site's depth-map conventions: inverse-depth (near=bright), 0.5–99.5
 * percentile stretch, grayscale JPEG q94, max width 1600.
 *
 * The production "subject-centred" recipe (daylight/architecture heroes) is
 * --blur 2 --centre:
 *   --blur S    Gaussian-soften the map (σ px at 1600w). Soft occlusion edges
 *               warp as flow; sharp ones tear (the shader has no inpainting).
 *   --centre    Remap so the centre-weighted median (the compositional
 *               subject) lands at depth 0.5, far-side slope capped at 3× so a
 *               tiny median doesn't amplify noise. With these maps the shader
 *               pins the subject at the data-depth-centred default focus 50.
 *
 * Weights: GitHub-released ONNX exports (no Hugging Face dependency), e.g.
 *   https://github.com/fabio-sim/Depth-Anything-ONNX/releases/download/v2.0.0/depth_anything_v2_vitl_dynamic.onnx
 *
 * Usage:
 *   node scripts/run-depth-onnx.mjs <model.onnx> <image> <out.jpg> [flags]
 *   node scripts/run-depth-onnx.mjs <model.onnx> --batch <jobs.json> [flags]
 *     jobs.json: [{"image": "images/foo.jpg", "out": "images/depth/foo.jpg.depth.jpg"}, ...]
 *     (one model session for the whole batch)
 */
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import ort from 'onnxruntime-node';

const argv = process.argv.slice(2);
function flag(name) {
  const i = argv.indexOf(name);
  return i === -1 ? null : (argv[i + 1] || true);
}
const modelPath = argv[0];
const SHORT = parseInt(flag('--size') || '518', 10);
const BLUR = parseFloat(flag('--blur') || '0');
const CENTRE = argv.includes('--centre');
const batchPath = flag('--batch');

let jobs;
if (batchPath && typeof batchPath === 'string') {
  jobs = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
} else {
  const positional = argv.filter((a, i) => !a.startsWith('--') && (i === 0 || !argv[i - 1].startsWith('--') || ['--centre'].includes(argv[i - 1])));
  const [, imagePath, outPath] = positional;
  if (!modelPath || !imagePath || !outPath) {
    console.error('usage: run-depth-onnx.mjs <model.onnx> <image> <out.jpg> [--size N] [--blur S] [--centre]');
    console.error('       run-depth-onnx.mjs <model.onnx> --batch <jobs.json> [--size N] [--blur S] [--centre]');
    process.exit(1);
  }
  jobs = [{ image: imagePath, out: outPath }];
}

const MEAN = [0.485, 0.456, 0.406];
const STD = [0.229, 0.224, 0.225];
const mul14up = (v) => Math.ceil(v / 14) * 14;

const session = await ort.InferenceSession.create(modelPath);
const inputName = session.inputNames[0];
const outputName = session.outputNames[0];
console.log(`[run-depth] model loaded (${inputName} -> ${outputName}); ${jobs.length} job(s); short side ${SHORT}px` +
  (BLUR ? `, blur σ${BLUR}` : '') + (CENTRE ? ', subject-centred' : ''));

// Subject-centred remap: centre-weighted median -> 127.5, far slope <= 3x.
function centreRemap(data, width, height) {
  const vals = [];
  const x0 = Math.round(width * 0.25), x1 = Math.round(width * 0.75);
  const y0 = Math.round(height * 0.3), y1 = Math.round(height * 0.8);
  for (let y = y0; y < y1; y += 2) for (let x = x0; x < x1; x += 2) vals.push(data[y * width + x]);
  vals.sort((a, b) => a - b);
  const m = Math.max(1, vals[Math.floor(vals.length / 2)]);
  const farLow = Math.max(0, 127.5 - 3 * m);
  for (let i = 0; i < data.length; i += 1) {
    const v = data[i];
    data[i] = Math.round(v <= m
      ? farLow + (v / m) * (127.5 - farLow)
      : 127.5 + ((v - m) / (255 - m)) * 127.5);
  }
  return m;
}

let done = 0;
for (const job of jobs) {
  const t0 = Date.now();

  // Display-space source: EXIF-rotated, capped at 1600 wide (site convention).
  const display = sharp(job.image).rotate().resize({ width: 1600, withoutEnlargement: true });
  const dispMeta = await display.clone().jpeg().toBuffer({ resolveWithObject: true });
  const dW = dispMeta.info.width;
  const dH = dispMeta.info.height;

  // lower_bound: short side >= SHORT, keep aspect, both dims multiples of 14.
  const scale = SHORT / Math.min(dW, dH);
  const iW = mul14up(Math.round(dW * scale));
  const iH = mul14up(Math.round(dH * scale));

  const { data: rgb } = await sharp(dispMeta.data)
    .resize(iW, iH, { fit: 'fill' })
    .removeAlpha().raw().toBuffer({ resolveWithObject: true });

  const chw = new Float32Array(3 * iH * iW);
  for (let y = 0; y < iH; y += 1) {
    for (let x = 0; x < iW; x += 1) {
      const p = (y * iW + x) * 3;
      const o = y * iW + x;
      chw[o] = (rgb[p] / 255 - MEAN[0]) / STD[0];
      chw[iH * iW + o] = (rgb[p + 1] / 255 - MEAN[1]) / STD[1];
      chw[2 * iH * iW + o] = (rgb[p + 2] / 255 - MEAN[2]) / STD[2];
    }
  }

  const feeds = {};
  feeds[inputName] = new ort.Tensor('float32', chw, [1, 3, iH, iW]);
  const results = await session.run(feeds);
  const out = results[outputName];
  const depth = out.data; // relative inverse depth, larger = nearer
  const [, oH, oW] = out.dims.length === 3 ? out.dims : [1, out.dims[2], out.dims[3]];

  // Percentile stretch on float values, then quantise to uint8.
  const sorted = Float32Array.from(depth).sort();
  const lo = sorted[Math.floor(sorted.length * 0.005)];
  const hi = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.995))];
  const span = Math.max(hi - lo, 1e-9);
  const gray = Buffer.alloc(oW * oH);
  for (let i = 0; i < depth.length; i += 1) {
    gray[i] = Math.max(0, Math.min(255, Math.round(((depth[i] - lo) / span) * 255)));
  }

  // Display-size map, optional soften, optional subject-centred remap.
  let stage = sharp(gray, { raw: { width: oW, height: oH, channels: 1 } }).resize(dW, dH, { fit: 'fill' });
  if (BLUR > 0) stage = stage.blur(BLUR);
  const { data: mapped } = await stage.greyscale().raw().toBuffer({ resolveWithObject: true });
  let medianNote = '';
  if (CENTRE) medianNote = ` median ${centreRemap(mapped, dW, dH)}`;

  fs.mkdirSync(path.dirname(job.out), { recursive: true });
  await sharp(mapped, { raw: { width: dW, height: dH, channels: 1 } })
    .jpeg({ quality: 94 }).toFile(job.out);

  done += 1;
  console.log(`[run-depth] ${done}/${jobs.length} ${job.out} (${dW}x${dH},${medianNote} ${Math.round((Date.now() - t0) / 1000)}s)`);
}
