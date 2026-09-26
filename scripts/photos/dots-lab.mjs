#!/usr/bin/env node
/**
 * The colour lab, two pages, git-ignored, shown by `jekyll serve`:
 *
 *   /lab/dots/     every photograph as 24 dots by each method in lib/dots.mjs, for comparing by
 *                  eye and trying layouts (a row of 24, a 3 × 8 block, a voyage's dots gathered)
 *   /lab/palette/  every photograph's signature palette (lib/signature.mjs): three to five
 *                  colours with their shares, its colour line and its reading; and each
 *                  voyage's own, pooled
 *
 *   in   _data/photo_manifests/*.json, img.qsdqsb.com/t/<hash>/480.webp (public, read only)
 *   out  lab/{dots,palette}/index.html (from scripts/photos/lab/) and data.json
 *
 * Usage: node scripts/photos/dots-lab.mjs [--gallery london]
 */

import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { PATHS, ROOT, galleryKey, parseArgs } from './lib/config.mjs';
import { dotsOf, pointsOf } from './lib/dots.mjs';
import { signatureOf, poolPoints } from './lib/signature.mjs';

const args = parseArgs(process.argv.slice(2));
const OUT = path.join(ROOT, 'lab', 'dots');
const SAMPLE = 96, PARALLEL = 10;

const index = JSON.parse(fs.readFileSync(path.join(PATHS.mergedDir, '_index.json'), 'utf8'));
const names = args.gallery ? [String(args.gallery)] : Object.keys(index.galleries).filter(g => index.galleries[g].count > 0);
const galleries = [], signatures = [];
const t0 = Date.now();
for (const g of names) {
  const m = JSON.parse(fs.readFileSync(path.join(PATHS.mergedDir, `${galleryKey(g)}.json`), 'utf8'));
  const photos = new Array(m.photos.length), sigs = new Array(m.photos.length), pts = new Array(m.photos.length);
  let next = 0;
  await Promise.all(Array.from({ length: PARALLEL }, async () => {
    for (let i = next++; i < m.photos.length; i = next++) {
      const p = m.photos[i];
      try {
        const buf = Buffer.from(await (await fetch(`${p.url}/480.webp`)).arrayBuffer());
        const { data, info } = await sharp(buf).resize({ width: SAMPLE, height: SAMPLE, fit: 'inside' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
        photos[i] = { slug: p.slug, name: p.name, url: p.url, r: p.ratio, light: p.light?.text || null, m: dotsOf(data, info.width, info.height, 3) };
        pts[i] = pointsOf(data, info.width, info.height, 3);
        sigs[i] = { slug: p.slug, name: p.name, url: p.url, r: p.ratio, light: p.light?.text || null, film: p.film || null, taken: p.taken || null, ...signatureOf(pts[i]) };
      } catch (e) { console.warn(`  ! ${g}/${p.slug}: ${e.message}`); }
    }
  }));
  const title = m.title || g.split('/').map(s => s[0].toUpperCase() + s.slice(1).replace(/-/g, ' ')).join(' · ');
  galleries.push({ g, title, photos: photos.filter(Boolean) });
  const kept = pts.filter(Boolean);
  signatures.push({ g, title, voyage: kept.length ? signatureOf(poolPoints(kept), { ground: false }) : null, photos: sigs.filter(Boolean) });
  process.stdout.write('.');
}
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'data.json'), JSON.stringify({ generated: new Date().toISOString(), galleries }));
fs.copyFileSync(path.join(ROOT, 'scripts', 'photos', 'lab', 'dots.html'), path.join(OUT, 'index.html'));
const PAL = path.join(ROOT, 'lab', 'palette');
fs.mkdirSync(PAL, { recursive: true });
fs.writeFileSync(path.join(PAL, 'data.json'), JSON.stringify({ generated: new Date().toISOString(), galleries: signatures }));
fs.copyFileSync(path.join(ROOT, 'scripts', 'photos', 'lab', 'palette.html'), path.join(PAL, 'index.html'));
console.log(`\ncolour lab: ${galleries.reduce((s, g) => s + g.photos.length, 0)} photos in ${galleries.length} galleries, ${((Date.now() - t0) / 1000).toFixed(0)} s → lab/dots/, lab/palette/`);
