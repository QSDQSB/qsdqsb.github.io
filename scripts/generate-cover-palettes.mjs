#!/usr/bin/env node
/**
 * The colours of the covers still cut by hand (posts, pages, Venice), so a tag's door can be poured
 * as the dye vat of its photograph (_includes/tag-door-vat.html, assets/js/tag-doors.js). A voyage's
 * cover has its colours from the photo pipeline already; these are read the same way, by the same
 * function (scripts/photos/lib/tiers.mjs), from the file under images/; one named by its address on
 * the photo host is a pipeline photograph, and takes the colours its manifest holds.
 *
 *   _data/cover_palettes.json   { "cover/posts/x-3v1.jpg": [["#38282c", 41.2], …five at most] }
 *
 * Keyed as the front matter names the cover (header.teaser, else header.overlay_image). Generated on
 * every build (npm run covers), gitignored; a door whose cover has no entry shows its photograph.
 * shortcut: reads the two front-matter lines by pattern, not as YAML, upgrade if a cover's path is
 * ever written across lines or with a space in it.
 *
 * Usage: node scripts/generate-cover-palettes.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { paletteOfImage } from './photos/lib/tiers.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, '_data', 'cover_palettes.json');

const named = new Set();
for (const dir of ['_posts', '_voyage', '_subvoyage']) {
  const at = path.join(ROOT, dir);
  if (!fs.existsSync(at)) continue;
  for (const f of fs.readdirSync(at, { recursive: true }).filter((x) => /\.(md|html)$/.test(x))) {
    const front = fs.readFileSync(path.join(at, f), 'utf8').split(/^---\s*$/m)[1] || '';
    for (const m of front.matchAll(/^\s+(?:teaser|overlay_image):\s*["']?([^"'\s#]+)["']?\s*(?:#.*)?$/gm)) named.add(m[1]);
  }
}

// A cover named by its address on the photo host is one of the pipeline's photographs: its colours are read already.
const HOSTED = /^(https:\/\/img\.qsdqsb\.com\/t\/[0-9a-f]+)\//;
const read = {};
const manifests = path.join(ROOT, '_data', 'photo_manifests');
if ([...named].some((k) => HOSTED.test(k)) && fs.existsSync(manifests)) {
  for (const f of fs.readdirSync(manifests).filter((x) => x.endsWith('.json') && !x.startsWith('_'))) {
    for (const p of JSON.parse(fs.readFileSync(path.join(manifests, f), 'utf8')).photos || []) if (p.url && p.signature) read[p.url] = p.signature;
  }
}

const map = {};
let missing = 0;
for (const key of [...named].sort()) {
  const hosted = key.match(HOSTED);
  if (hosted) { if (read[hosted[1]]) map[key] = read[hosted[1]]; else missing++; continue; }
  if (key.includes('://')) continue;
  const file = path.join(ROOT, 'images', key);
  if (!fs.existsSync(file)) { missing++; continue; }
  map[key] = (await paletteOfImage(fs.readFileSync(file))).signature;
}
if (!Object.values(map).every((sig) => sig.length >= 1 && sig.every(([hex, pc]) => /^#[0-9a-f]{6}$/i.test(hex) && pc > 0))) {
  console.error('A cover came out with no colours: _data/cover_palettes.json not written.');
  process.exit(1);
}
fs.writeFileSync(DATA, `${JSON.stringify(map, null, 1)}\n`);
console.log(`Cover palettes: ${Object.keys(map).length} cover(s)${missing ? `, ${missing} named but not found` : ''}.`);
