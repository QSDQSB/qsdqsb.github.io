#!/usr/bin/env node
/**
 * Put the camera's full record back into the originals in photos/.
 *
 * Apple Photos drops the Fujifilm maker notes when it exports an edited
 * photo (film simulation, dynamic range, grain, colour chrome, tones,
 * focus and drive modes, shutter type, stabilisation, shutter count). The
 * site needs the edit, since it publishes the owner's crop, and the
 * database wants the record. So for every original here without maker
 * notes:
 *
 *   1. find its item in Photos: the file name, then the capture time to the
 *      second, since frame numbers repeat
 *   2. export that item's unedited original to a staging folder
 *   3. copy its maker notes and EXIF into our file with ExifTool. The
 *      pixels, orientation and dimensions of the edit stay as they are.
 *   4. check the result decodes at the same size and now names its film
 *      simulation; if not, restore the file as it was
 *
 * Shares the collector's lock and log, so the two never talk to Photos at
 * once. Resumable. Nothing is pushed.
 *
 * Usage: npm run photos:enrich [-- --gallery <name>] [--batch 20] [--dry-run] [--by-time]
 *   --by-time  find items by capture time alone (renamed files), retrying earlier misses
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import sharp from 'sharp';
import { PATHS, parseArgs } from './lib/config.mjs';
import { galleriesUnder, localGallery, readHeadExif, isCompressedCopy, cleanGallery } from './lib/inventory.mjs';
import { findByFilename, findByMoment, exportPhotos, guardMemory, sameMoment } from './lib/apple-photos.mjs';
import { lock, retry, pause, stamp, LOG } from './collect.mjs';

const DIR = path.join(PATHS.localStore, 'collect');
const STAGE = path.join(DIR, 'enrich-stage');
const STATE = path.join(DIR, 'enrich-state.json');
const loadState = () => { try { return JSON.parse(fs.readFileSync(STATE, 'utf8')); } catch { return { done: {}, failed: {} }; } };
const saveState = (s) => fs.writeFileSync(STATE, JSON.stringify(s, null, 1));

function exif(file, tags) {
  const r = spawnSync('exiftool', ['-j', '-n', ...tags.map(t => `-${t}`), file], { encoding: 'utf8' });
  if (r.status !== 0) return {};
  try { return JSON.parse(r.stdout)[0] || {}; } catch { return {}; }
}
const hasMakerNotes = (file) => { const x = exif(file, ['Make', 'FilmMode', 'ImageCount', 'Saturation']); return x.ImageCount != null || x.FilmMode != null; };

/**
 * Copy maker notes and EXIF from `orig` into `target`, keeping what
 * describes the edited image itself (orientation, dimensions, thumbnail).
 */
export function transplant(orig, target) {
  const r = spawnSync('exiftool', [
    '-overwrite_original', '-tagsFromFile', orig, '-MakerNotes:all', '-EXIF:all', '-XMP:all',
    '--Orientation', '--ExifImageWidth', '--ExifImageHeight', '--IFD1:all', '--ThumbnailImage', '--PreviewImage',
    target,
  ], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error((r.stderr || r.stdout || 'exiftool failed').trim().split('\n').pop());
}

async function targets(only) {
  const out = [];
  for (const g of galleriesUnder(PATHS.photosDir)) {
    if (only && g !== only && !g.startsWith(`${only}/`)) continue;
    for (const f of localGallery(g).files) {
      const x = await readHeadExif(f.abs).catch(() => null);
      if (!x || isCompressedCopy(x) || !x.camera || !/FUJIFILM/i.test(x.camera)) continue; // compressed copies and other cameras have nothing to fetch
      if (hasMakerNotes(f.abs)) continue;
      out.push({ gallery: g, slug: f.slug, file: f.file, abs: f.abs, taken: x.taken, name: `${path.parse(f.file).name.toUpperCase()}.JPG` });
    }
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const only = args.gallery ? cleanGallery(args.gallery) : null, batch = Number(args.batch) || 20;
  const log = (m) => { const line = `${stamp()} enrich: ${m}`; console.log(line); fs.mkdirSync(DIR, { recursive: true }); fs.appendFileSync(LOG, line + '\n'); };
  for (const s of [process.stdout, process.stderr]) s.on('error', () => {});
  if (spawnSync('exiftool', ['-ver']).status !== 0) { console.error('exiftool is not installed: brew install exiftool'); return 2; }
  const holder = lock();
  if (holder) { console.error(`photos:collect or photos:enrich is running (pid ${holder}); not starting another`); return 1; }
  const state = loadState();

  // --by-time looks items up by capture time alone, for files whose names Photos does not know;
  // it retries the ones the name lookup gave up on.
  const byTime = !!args['by-time'];
  const todo = (await targets(only)).filter(t => !state.done[`${t.gallery}/${t.slug}`] && (byTime || !(state.failed[`${t.gallery}/${t.slug}`] >= 2)));
  log(`${todo.length} original(s) without maker notes`);
  if (args['dry-run'] || !todo.length) return 0;

  let enriched = 0;
  for (let i = 0; i < todo.length; i += batch) {
    const chunk = todo.slice(i, i + batch);
    const found = byTime
      ? await retry(`lookup of ${chunk.length} capture times`, () => findByMoment(chunk.map(t => t.taken)), log)
      : await retry(`lookup of ${chunk.length} names`, () => findByFilename([...new Set(chunk.map(t => t.name))]), log);
    if (!found) continue;
    // The item shot at the same moment as our file: frame numbers repeat, capture times do not.
    const pick = chunk.map(t => ({ t, item: (found.get(byTime ? t.taken : t.name) || []).find(c => sameMoment(c.date, t.taken)) }));
    for (const p of pick.filter(p => !p.item)) { state.failed[`${p.t.gallery}/${p.t.slug}`] = (state.failed[`${p.t.gallery}/${p.t.slug}`] || 0) + 1; }
    const wanted = pick.filter(p => p.item);
    if (!wanted.length) { saveState(state); continue; }

    fs.rmSync(STAGE, { recursive: true, force: true }); fs.mkdirSync(STAGE, { recursive: true });
    const ok = await retry(`export of ${wanted.length} original(s)`, () => { exportPhotos(wanted.map(p => p.item.id), STAGE, { originals: true, batch }); return true; }, log);
    if (!ok) continue;
    // Match each exported original back to its photo by capture time (export names can collide).
    const exported = fs.readdirSync(STAGE).filter(f => !f.startsWith('.')).map(f => ({ abs: path.join(STAGE, f), x: exif(path.join(STAGE, f), ['DateTimeOriginal', 'ImageCount']) }));
    for (const p of wanted) {
      const key = `${p.t.gallery}/${p.t.slug}`;
      const want = p.t.taken.slice(0, 19).replace('T', ' ').replace(/-/g, ':');
      const orig = exported.find(e => String(e.x.DateTimeOriginal || '').slice(0, 19) === want);
      if (!orig) { state.failed[key] = (state.failed[key] || 0) + 1; continue; }
      const before = fs.readFileSync(p.t.abs);
      const size = await sharp(p.t.abs).metadata();
      try {
        transplant(orig.abs, p.t.abs);
        const after = await sharp(p.t.abs).metadata();
        if (after.width !== size.width || after.height !== size.height || (after.orientation || 1) !== (size.orientation || 1) || !hasMakerNotes(p.t.abs)) throw new Error('the result changed shape or lacks maker notes');
        state.done[key] = orig.x.ImageCount ?? true;
        enriched++;
      } catch (e) {
        fs.writeFileSync(p.t.abs, before); // restore exactly as it was
        state.failed[key] = (state.failed[key] || 0) + 1;
        log(`  ${key}: not enriched (${e.message}); restored`);
      }
    }
    saveState(state);
    fs.rmSync(STAGE, { recursive: true, force: true });
    guardMemory({ log });
    log(`  batch ${Math.floor(i / batch) + 1}/${Math.ceil(todo.length / batch)}: ${enriched} enriched so far`);
    await pause(2000);
  }
  const failed = Object.keys(state.failed).length;
  log(`done: ${enriched} original(s) now carry their maker notes${failed ? `; ${failed} not matched in Photos (see enrich-state.json)` : ''}`);
  return 0;
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) main().then(c => process.exit(c), e => { console.error(e.stack || e); process.exit(2); });
