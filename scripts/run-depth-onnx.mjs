#!/usr/bin/env node
/* Depth Anything V2 ONNX runner (session-local bake-off tool).
 *
 * Mirrors the official DA2 inference recipe: aspect-preserving resize with
 * the SHORT side at --size (default 518), both dims rounded up to multiples
 * of 14 (lower_bound mode), ImageNet mean/std normalisation. Output follows
 * the site's depth-map conventions: inverse-depth (near=bright), 0.5–99.5
 * percentile stretch, grayscale JPEG q94, max width 1600.
 *
 * Usage: node run-depth.mjs <model.onnx> <image> <out.jpg> [--size 518]
 */
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import ort from 'onnxruntime-node';

const [modelPath, imagePath, outPath] = process.argv.slice(2);
const sizeIdx = process.argv.indexOf('--size');
const SHORT = sizeIdx !== -1 ? parseInt(process.argv[sizeIdx + 1], 10) : 518;
if (!modelPath || !imagePath || !outPath) {
  console.error('usage: node run-depth.mjs <model.onnx> <image> <out.jpg> [--size N]');
  process.exit(1);
}

const MEAN = [0.485, 0.456, 0.406];
const STD = [0.229, 0.224, 0.225];
const mul14up = (v) => Math.ceil(v / 14) * 14;

const t0 = Date.now();

// Display-space source: EXIF-rotated, capped at 1600 wide (site convention).
const display = sharp(imagePath).rotate().resize({ width: 1600, withoutEnlargement: true });
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

const session = await ort.InferenceSession.create(modelPath);
const inputName = session.inputNames[0];
const outputName = session.outputNames[0];
console.log(`[run-depth] model io: ${inputName} -> ${outputName}; inference ${iW}x${iH} (display ${dW}x${dH})`);

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

fs.mkdirSync(path.dirname(outPath), { recursive: true });
await sharp(gray, { raw: { width: oW, height: oH, channels: 1 } })
  .resize(dW, dH, { fit: 'fill' })
  .jpeg({ quality: 94 })
  .toFile(outPath);

console.log(`[run-depth] wrote ${outPath} (${dW}x${dH}) in ${Math.round((Date.now() - t0) / 1000)}s`);
