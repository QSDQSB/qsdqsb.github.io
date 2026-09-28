#!/usr/bin/env node
/**
 * Ridgway's names for colours: Robert Ridgway, Color Standards and Color Nomenclature (Washington,
 * 1912), 1,115 named colours on 53 plates, in the public domain. Read from Project Gutenberg's edition
 * (#63087, pg63087-h.zip: its page names each swatch, and each swatch is an image), not from anyone's
 * later list: each swatch's colour is taken here, from the middle of its image (the paper's grain and
 * specks trimmed away, the rest averaged in OKLab).
 *
 *   node scripts/colour/ridgway.mjs <unzipped pg63087-h folder>   → assets/ridgway.json
 *
 * Each colour as [name, hex, plate], in the book's order: plate by plate, as the swatches stand on it.
 *
 * The plates are over a century old and photographed: a name here evokes a colour; it does not
 * measure one. Used by Reverie (assets/js/colour/reverie.js) to name a colour when one lies close, and
 * by the colour book (/utils/ridgway/, assets/js/colour/ridgway.js).
 */

import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const dir = process.argv[2];
if (!dir || !fs.existsSync(path.join(dir, 'pg63087-images.html'))) {
  console.error('usage: node scripts/colour/ridgway.mjs <folder holding pg63087-images.html and images/>');
  process.exit(1);
}

const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const gam = (x) => Math.round(Math.min(1, Math.max(0, x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055)) * 255);
const toLab = (r, g, b) => {
  [r, g, b] = [r, g, b].map(lin);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
};
const toHex = ([L, a, b]) => {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3, m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3, s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s].map((x) => gam(x).toString(16).padStart(2, '0')).join('');
};

// Every swatch as the page names it, in its order: <a title="Clay Color"><img alt="XXIX_17′′___Clay_Color"
// src="images/xxix_17pp___clay_color.jpg"> (the plate first in the image's words).
const html = fs.readFileSync(path.join(dir, 'pg63087-images.html'), 'utf8');
const swatches = [...html.matchAll(/<a title="([^"]+)"[^>]*>\s*<img[^>]*alt="([^"_]+)_[^"]*"[^>]*src="(images\/[^"]+)"/g)].map(([, name, plate, src]) => ({ name: name.replace(/&amp;/g, '&').trim(), plate: plate.toUpperCase(), src }));

const out = [];
for (const { name, plate, src } of swatches) {
  // The middle three-fifths of the swatch, each pixel in OKLab; the lightest and darkest tenth (the
  // paper's specks, a speck of dust) left out, the rest averaged.
  const { data, info } = await sharp(path.join(dir, src)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const px = [];
  for (let y = Math.floor(info.height * 0.2); y < info.height * 0.8; y++) for (let x = Math.floor(info.width * 0.2); x < info.width * 0.8; x++) {
    const i = (y * info.width + x) * 3; px.push(toLab(data[i], data[i + 1], data[i + 2]));
  }
  px.sort((p, q) => p[0] - q[0]);
  const keep = px.slice(Math.floor(px.length * 0.1), Math.ceil(px.length * 0.9));
  const mean = [0, 1, 2].map((k) => keep.reduce((s, p) => s + p[k], 0) / keep.length);
  out.push([name, toHex(mean), plate]);
}
// The book's order: plate by plate (I to LIII), each as its page lays it out.
const roman = (r) => [...r].reduce((n, c, i, a) => { const v = { I: 1, V: 5, X: 10, L: 50 }[c], w = { I: 1, V: 5, X: 10, L: 50 }[a[i + 1]] || 0; return n + (v < w ? -v : v); }, 0);
out.forEach((c, i) => { c.at = i; });
out.sort((a, b) => roman(a[2]) - roman(b[2]) || a.at - b.at);
out.forEach((c) => { delete c.at; });

const file = path.join(path.dirname(new URL(import.meta.url).pathname), '../../assets/ridgway.json');
fs.writeFileSync(file, JSON.stringify({
  source: "Robert Ridgway, Color Standards and Color Nomenclature (Washington, 1912), public domain; colours read from Project Gutenberg's edition, #63087, by scripts/colour/ridgway.mjs",
  colours: out,
}) + '\n');
console.log(`${out.length} named colours → assets/ridgway.json (${fs.statSync(file).size} bytes)`);
