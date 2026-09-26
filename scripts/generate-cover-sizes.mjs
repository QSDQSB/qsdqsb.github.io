#!/usr/bin/env node
/**
 * WebP renditions of the 3:1 voyage heroes (images/cover/), for the Photobook's cover srcset.
 *
 *   images/cover/london-shard-3v1.jpg → images/cover/sized/london-shard-3v1-{1920,2880}.webp
 *
 * A 3:1 cover is drawn at least 26rem tall, so on a phone it is scaled to about 78rem wide and
 * cropped: the visible slice still wants nearly the original's pixels at 3x. The saving is for
 * screens that need less: 1920 and 2880 WebP renditions (a laptop needs no more than 2880). At
 * full width the original JPEG stays the largest candidate: re-encoding it as WebP made it bigger.
 * The candidates for each cover go to _data/cover_sizes.json, which _includes/photobook/cover.html
 * reads; a cover with no entry keeps its original src.
 *
 * Generated on every build (npm run build / serve), skipped when up to date; both outputs are
 * gitignored.
 *
 * Usage: node scripts/generate-cover-sizes.mjs [--force]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'images', 'cover');
const OUT = path.join(SRC, 'sized');
const DATA = path.join(ROOT, '_data', 'cover_sizes.json');
const WIDTHS = [1920, 2880];
const force = process.argv.includes('--force');

const fresh = (out, src) => !force && fs.existsSync(out) && fs.statSync(out).mtimeMs >= fs.statSync(src).mtimeMs;

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const covers = fs.readdirSync(SRC).filter((f) => /\.(jpe?g|png)$/i.test(f));
  const map = {};
  let made = 0;
  for (const f of covers) {
    const src = path.join(SRC, f), stem = f.replace(/\.[^.]+$/, '');
    const { width } = await sharp(src).metadata();
    const smaller = WIDTHS.filter((w) => w < width);
    for (const w of smaller) {
      const out = path.join(OUT, `${stem}-${w}.webp`);
      if (fresh(out, src)) continue;
      await sharp(src).resize({ width: w }).webp({ quality: 80 }).toFile(out);
      made++;
    }
    map[`cover/${f}`] = [...smaller.map((w) => ({ w, src: `/images/cover/sized/${stem}-${w}.webp` })), { w: width, src: `/images/cover/${f}` }];
  }
  fs.writeFileSync(DATA, JSON.stringify(map, null, 1));
  console.log(`covers: ${covers.length} heroes, ${made} rendition(s) written → images/cover/sized/`);
}

main().catch((e) => { console.error(e); process.exit(1); });
