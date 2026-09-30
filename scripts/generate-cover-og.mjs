#!/usr/bin/env node
/**
 * Link previews for the voyage covers: a 1200 × 630 JPEG cut around each cover's focus.
 *
 *   _data/photo_manifests/_covers.json (photos:fetch) → images/og/<page key>.jpg
 *
 * Each is cut from the photo's 1920 JPEG tier on img.qsdqsb.com (a public read), so a
 * changed focus needs only a rebuild. Skipped when the photo and the focus are unchanged
 * (images/og/_made.json). A cover whose tier can't be read keeps its previous preview, or
 * has none: _includes/seo.html then falls back to the page's overlay_image.
 *
 * Runs in every build after photos:fetch; the outputs are gitignored.
 *
 * Usage: node scripts/generate-cover-og.mjs [--force]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { cropRect } from './photos/lib/cover.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const COVERS = path.join(ROOT, '_data', 'photo_manifests', '_covers.json');
const OUT = path.join(ROOT, 'images', 'og');
const MADE = path.join(OUT, '_made.json');
const force = process.argv.includes('--force');
const W = 1200, H = 630;

async function main() {
  if (!fs.existsSync(COVERS)) { console.log('link previews: no covers (photos:fetch first)'); return; }
  const covers = JSON.parse(fs.readFileSync(COVERS, 'utf8'));
  fs.mkdirSync(OUT, { recursive: true });
  const made = !force && fs.existsSync(MADE) ? JSON.parse(fs.readFileSync(MADE, 'utf8')) : {};
  const todo = Object.entries(covers).filter(([key, c]) => made[key] !== stamp(c) || !fs.existsSync(path.join(OUT, `${key}.jpg`)));
  let wrote = 0; const failed = [];
  let next = 0;
  await Promise.all(Array.from({ length: 8 }, async () => {
    for (let i = next++; i < todo.length; i = next++) {
      const [key, c] = todo[i];
      try {
        const w = (c.sizes?.jpg || []).includes(1920) ? 1920 : Math.max(...(c.sizes?.jpg || [1920]));
        const res = await fetch(`${c.url}/${w}.jpg`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buf = Buffer.from(await res.arrayBuffer());
        const { width, height } = await sharp(buf).metadata();
        await sharp(buf).extract(cropRect(c.og, width, height, W / H)).resize(W, H).jpeg({ quality: 82, mozjpeg: true })
          .toFile(path.join(OUT, `${key}.jpg`));
        made[key] = stamp(c); wrote++;
      } catch (e) { failed.push(`${key} (${e.message})`); }
    }
  }));
  fs.writeFileSync(MADE, JSON.stringify(made, null, 1) + '\n');
  console.log(`link previews: ${Object.keys(covers).length} covers, ${wrote} written → images/og/${failed.length ? `; not read: ${failed.join(', ')}` : ''}`);
}
const stamp = (c) => `${c.url}|${c.og.join(',')}`;

main().catch((e) => { console.error(e); process.exit(1); });
