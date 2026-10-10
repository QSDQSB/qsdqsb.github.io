#!/usr/bin/env node
/**
 * No committed picture says where it was taken. Photographs on the site come from R2, where GPS
 * stays private; but a picture committed under images/ (a cover, a hero, a post's figure) is
 * served as it is, and its EXIF can name a home to the metre. Fifteen did, until 2026-10-10.
 *
 * Reads every tracked image (or the files named) and fails on any that carries a GPS position.
 * Strip one with: exiftool -m -overwrite_original -gps:all= -xmp:geotag= <file>
 *
 * Usage: node scripts/check-image-privacy.mjs [files…]
 * Exit codes: 0 none · 1 a picture carries GPS · 2 could not run
 */
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import exifr from 'exifr';

const IMAGE = /\.(jpe?g|png|heic|heif|tiff?|webp|avif)$/i;
const files = process.argv.slice(2).length
  ? process.argv.slice(2)
  : execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).split('\0').filter((f) => IMAGE.test(f));

const found = [];
for (const f of files) {
  if (!fs.existsSync(f)) continue;
  let gps = null;
  try { gps = await exifr.gps(fs.readFileSync(f)); } catch { /* no EXIF to read */ }
  if (gps && Number.isFinite(gps.latitude) && Number.isFinite(gps.longitude)) found.push(f);
}
if (found.length) {
  console.log(`${found.length} picture(s) carry a GPS position; strip it before committing:\n${found.map((f) => `  ${f}`).join('\n')}\n  exiftool -m -overwrite_original -gps:all= -xmp:geotag= <file>`);
  process.exit(1);
}
console.log(`OK: ${files.length} picture(s), none with a GPS position.`);
