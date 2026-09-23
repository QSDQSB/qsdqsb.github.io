#!/usr/bin/env node
/**
 * Bring camera originals from a staging folder into photos/, the first
 * step of re-collecting a voyage (or of adding a new one).
 *
 *   <from>/<gallery>/DSCF1797.JPG  →  photos/<gallery>/DSCF1797.jpg
 *
 * The staging folder mirrors photos/: one folder per gallery, nested for
 * sub-voyages. For every original in it:
 *
 *   - a frame photos/ already has keeps the file name photos/ uses, so the
 *     bucket key, slug, captions and URL all stay put (the camera's .JPG
 *     becomes the bootstrap's .jpg); a new frame keeps its camera name
 *   - it replaces a compressed copy (one carrying BOOTSTRAP_STAMP)
 *   - it never replaces a file that is already an original, unless
 *     --replace-originals (a re-export after an edit)
 *   - a stamped file in the staging folder is refused: that is a compressed
 *     copy on its way back in
 *   - byte-identical files are skipped, so a re-run does nothing
 *
 * The staging folder is only read, never changed. Nothing touches R2: the
 * next step is `photos:recollect -- --gallery <g> --push` per gallery.
 *
 * Usage: npm run photos:import -- --from <dir> [--gallery <name>] [--dry-run] [--replace-originals]
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';
import { PATHS, parseArgs } from './lib/config.mjs';
import { galleriesUnder, localGallery, readHeadExif, isCompressedCopy, cleanGallery } from './lib/inventory.mjs';

const md5 = (f) => crypto.createHash('md5').update(fs.readFileSync(f)).digest('hex');

/**
 * Work out what to copy without copying it.
 * @returns {{gallery, from, to, action:'replace'|'add'|'same'|'refuse', why?:string}[]}
 */
export async function planImport(fromDir, { photosDir = PATHS.photosDir, gallery = null, replaceOriginals = false } = {}) {
  const out = [];
  for (const g of galleriesUnder(fromDir)) {
    if (gallery && g !== gallery && !g.startsWith(`${gallery}/`)) continue;
    const have = new Map(localGallery(g, photosDir).files.map(f => [f.slug, f]));
    for (const src of localGallery(g, fromDir).files) {
      const step = { gallery: g, file: src.file, slug: src.slug, from: src.abs };
      const srcExif = await readHeadExif(src.abs).catch(() => null);
      if (isCompressedCopy(srcExif)) { out.push({ ...step, action: 'refuse', why: 'carries the bootstrap stamp: a compressed copy, not an original' }); continue; }
      const cur = have.get(src.slug);
      if (!cur) { out.push({ ...step, to: path.join(photosDir, ...g.split('/'), src.file), action: 'add' }); continue; }
      const to = cur.abs;
      if (cur.size === src.size && md5(cur.abs) === md5(src.abs)) { out.push({ ...step, to, action: 'same' }); continue; }
      const compressed = isCompressedCopy(await readHeadExif(cur.abs).catch(() => null));
      if (!compressed && !replaceOriginals) { out.push({ ...step, to, action: 'refuse', why: `${cur.file} is already an original; --replace-originals to overwrite it` }); continue; }
      out.push({ ...step, to, action: 'replace', replacing: compressed ? 'compressed copy' : 'original' });
    }
  }
  return out;
}

/** Copy the planned files, keeping the source's modification time. */
export function applyImport(plan) {
  let n = 0;
  for (const s of plan) {
    if (s.action !== 'add' && s.action !== 'replace') continue;
    fs.mkdirSync(path.dirname(s.to), { recursive: true });
    fs.copyFileSync(s.from, s.to);
    const st = fs.statSync(s.from);
    fs.utimesSync(s.to, st.atime, st.mtime);
    n++;
  }
  return n;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (typeof args.from !== 'string') { console.error('usage: npm run photos:import -- --from <dir> [--gallery <name>] [--dry-run] [--replace-originals]'); return 2; }
  const from = path.resolve(args.from.replace(/^~(?=$|\/)/, os.homedir()));
  if (!fs.existsSync(from)) { console.error(`no such folder: ${from}`); return 2; }

  const plan = await planImport(from, { gallery: args.gallery ? cleanGallery(args.gallery) : null, replaceOriginals: !!args['replace-originals'] });
  if (!plan.length) { console.log(`nothing to import: ${from} holds no gallery folders with originals.`); return 2; }

  const galleries = [...new Set(plan.map(s => s.gallery))];
  for (const g of galleries) {
    const steps = plan.filter(s => s.gallery === g);
    const isNew = !fs.existsSync(path.join(PATHS.photosDir, ...g.split('/')));
    console.log(`\n${g}${isNew ? '  (new gallery)' : ''}`);
    for (const s of steps) {
      const label = { replace: `replaces ${s.replacing}`, add: 'new frame', same: 'already imported', refuse: `REFUSED: ${s.why}` }[s.action];
      console.log(`  ${s.file.padEnd(16)} → ${path.basename(s.to || s.file).padEnd(16)} ${label}`);
    }
  }
  const refused = plan.filter(s => s.action === 'refuse');
  const todo = plan.filter(s => s.action === 'add' || s.action === 'replace');
  if (refused.length) { console.log(`\n${refused.length} file(s) refused; nothing copied.`); return 1; }
  if (args['dry-run']) { console.log(`\nDry run: would copy ${todo.length} file(s).`); return 0; }

  const n = applyImport(plan);
  console.log(`\nCopied ${n} file(s) into photos/; ${plan.length - n} already there. ${from} is unchanged.`);
  console.log(`Next, per gallery: ${galleries.map(g => `npm run photos:recollect -- --gallery ${g} --push`).join('\n                   ')}`);
  return 0;
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) main().then(c => process.exit(c), e => { console.error(e.message || e); process.exit(2); });
