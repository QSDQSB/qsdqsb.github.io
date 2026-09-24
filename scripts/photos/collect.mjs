#!/usr/bin/env node
/**
 * Re-collect originals straight from Apple Photos. For every photo in
 * photos/ that is still the bootstrap's compressed copy:
 *
 *   1. ask Photos for items with exactly that file name (DSCF1148.JPG), in
 *      small batches: an exact-name lookup is cheap even on a 30,000-photo
 *      library, where a date range or a prefix search loads the whole
 *      library into memory (it once reached 66 GB)
 *   2. rank the candidates (frame numbers repeat every ~10,000 shots) by
 *      closeness to the dates of the voyage's other originals, and export
 *      only the best one per photo, as edited in Photos (the site publishes
 *      the crop, not the full camera frame); the next candidate only if
 *      that one fails the picture check
 *   3. hand each exported batch to the gateway (photos:import), which
 *      verifies by picture and imports the matches over their compressed
 *      copies; the staged exports that did not match are deleted, never
 *      anything in Photos
 *
 * Built to run unattended for hours on a 30,000-photo library:
 *   - progress is saved after every batch (.photos-local/collect/state.json),
 *     so a stopped run resumes where it was, never re-exporting a done photo
 *   - one run at a time (a lock file with the owning pid)
 *   - Photos' memory is checked after every batch and Photos restarted
 *     past the ceiling; a failed lookup or export (Photos busy, an iCloud
 *     download that stalls) is retried with a pause, then left for the
 *     next run rather than stopping this one
 *   - a short pause between batches keeps Photos and iCloud unhurried
 *   - everything is logged to .photos-local/collect/log.txt, which the
 *     dashboard shows
 *   - at the end the lock is released and photos:locate names the places of
 *     the new originals in the background (it only talks to OpenStreetMap)
 * Nothing is pushed to R2.
 *
 * Usage: npm run photos:collect [-- --gallery <name>] [--rounds 10] [--batch 20] [--dry-run] [--no-locate]
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { PATHS, ROOT, parseArgs } from './lib/config.mjs';
import { galleriesUnder, localGallery, readHeadExif, isCompressedCopy, cleanGallery } from './lib/inventory.mjs';
import { findByFilename, exportPhotos, guardMemory, photosMemoryGB } from './lib/apple-photos.mjs';
import { planImport, applyImport, signatureIndex, NON_MATCH } from './import.mjs';

const require = createRequire(import.meta.url);
const DIR = path.join(PATHS.localStore, 'collect');
const STATE = path.join(DIR, 'state.json');
const loadState = () => { try { return JSON.parse(fs.readFileSync(STATE, 'utf8')); } catch { return { tried: {}, candidates: {} }; } };
const saveState = (s) => { fs.mkdirSync(DIR, { recursive: true }); fs.writeFileSync(STATE, JSON.stringify(s, null, 1)); };
export const LOG = path.join(DIR, 'log.txt');
const LOCK = path.join(DIR, 'lock');
// Local wall-clock time: the log is read by the owner, not a machine.
export const stamp = () => { const d = new Date(), p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`; };
// A closed stdout (a pipe to `head`, a terminal gone) must not end a run: the log file is the record.
for (const s of [process.stdout, process.stderr]) s.on('error', () => {});
export const pause = (ms) => new Promise(r => setTimeout(r, ms));

/** Take the lock, or return the pid that holds it. A lock whose process is gone is stale and taken over. */
export function lock() {
  try {
    const pid = Number(fs.readFileSync(LOCK, 'utf8'));
    if (pid && pid !== process.pid) { try { process.kill(pid, 0); return pid; } catch { /* stale */ } }
  } catch { /* none */ }
  fs.mkdirSync(DIR, { recursive: true });
  fs.writeFileSync(LOCK, String(process.pid));
  process.on('exit', unlock);
  for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { unlock(); process.exit(130); });
  return null;
}
/** Give the lock back early, once this process is done with Photos. */
export function unlock() { try { if (Number(fs.readFileSync(LOCK, 'utf8')) === process.pid) fs.unlinkSync(LOCK); } catch { /* gone */ } }

/** Try fn up to `times`, pausing longer each time and restarting Photos between tries. */
export async function retry(what, fn, log, times = 3) {
  for (let i = 1; ; i++) {
    try { return fn(); }
    catch (e) {
      const msg = e.message.split('\n')[0].slice(0, 160);
      if (i >= times) { log(`${what} failed ${times} times (${msg}); leaving it for the next run`); return undefined; }
      log(`${what} failed (${msg}); retry ${i + 1}/${times} in ${30 * i} s`);
      guardMemory({ log, max: 0.5 });
      await pause(30000 * i);
    }
  }
}

/** Photos still on their compressed copy: { gallery, slug, file, name } with the camera's file name to look for. */
async function targets(only) {
  const out = [];
  for (const g of galleriesUnder(PATHS.photosDir)) {
    if (only && g !== only && !g.startsWith(`${only}/`)) continue;
    for (const f of localGallery(g).files) {
      if (!isCompressedCopy(await readHeadExif(f.abs).catch(() => null))) continue;
      out.push({ gallery: g, slug: f.slug, file: f.file, name: `${path.parse(f.file).name.toUpperCase()}.JPG` });
    }
  }
  return out;
}

/** The `date:` of the voyage page naming each gallery (a sub-voyage's, else its parent's). */
function voyageDates() {
  const out = new Map();
  const { referencedGalleries } = require('../check-gallery-integrity.js');
  for (const [g, files] of referencedGalleries()) {
    for (const f of files) {
      const m = fs.readFileSync(path.join(ROOT, f), 'utf8').match(/^date:\s*["']?(\d{4}-\d{2}-\d{2})/m);
      if (m) { out.set(g, Date.parse(m[1])); break; }
    }
  }
  return out;
}

/**
 * When each gallery was shot: the capture days of its originals already in
 * photos/, else the date on its voyage page (a gallery re-collected for the
 * first time has no originals yet). Recomputed every round, so the first
 * match in a gallery anchors the ranking of the rest.
 */
async function galleryDays(pageDates = voyageDates()) {
  const out = new Map();
  for (const g of galleriesUnder(PATHS.photosDir)) {
    const days = [];
    for (const f of localGallery(g).files) {
      const x = await readHeadExif(f.abs).catch(() => null);
      if (x?.taken && !isCompressedCopy(x)) days.push(Date.parse(x.taken.slice(0, 10)));
    }
    const page = pageDates.get(g) ?? pageDates.get(g.split('/')[0]);
    out.set(g, days.length ? days : page ? [page] : []);
  }
  return out;
}

/** Candidates nearest in time to the gallery's known originals first; unknown galleries keep Photos' order. */
export function rank(cands, days) {
  if (!days?.length) return cands;
  const dist = (c) => Math.min(...days.map(d => Math.abs(Date.parse(c.date.slice(0, 10)) - d)));
  return [...cands].sort((a, b) => dist(a) - dist(b));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const only = args.gallery ? cleanGallery(args.gallery) : null;
  // Rounds continue until every photo's candidates are tried; the cap only guards against a bug looping.
  const rounds = Number(args.rounds) || 10, batch = Number(args.batch) || 20;
  const log = (m) => { const line = `${stamp()} ${m}`; console.log(line); fs.mkdirSync(DIR, { recursive: true }); fs.appendFileSync(LOG, line + '\n'); };
  const holder = lock();
  if (holder) { console.error(`another photos:collect is running (pid ${holder}); not starting a second one`); return 1; }
  const state = loadState();

  let todo = await targets(only);
  log(`${todo.length} photo(s) still on their compressed copy${only ? ` in ${only}` : ''}`);
  if (!todo.length) return 0;

  // 1. Look up every needed name once (cached in the state file).
  const unknown = [...new Set(todo.map(t => t.name))].filter(n => !(n in state.candidates));
  for (let i = 0; i < unknown.length; i += 25) {
    const chunk = unknown.slice(i, i + 25);
    const found = await retry(`lookup of ${chunk.length} names`, () => findByFilename(chunk, { batch: 25 }), log);
    if (!found) continue; // retried and failed: these names are looked up next run
    for (const n of chunk) state.candidates[n] = found.get(n) || [];
    saveState(state);
    guardMemory({ log });
    log(`looked up ${Math.min(i + 25, unknown.length)}/${unknown.length} names (Photos ${photosMemoryGB().toFixed(1)} GB)`);
  }
  const none = todo.filter(t => t.name in state.candidates && !state.candidates[t.name].length);
  if (none.length) log(`${none.length} photo(s) have no item of that name in Photos: ${none.map(t => `${t.gallery}/${t.slug}`).slice(0, 12).join(' ')}${none.length > 12 ? ' …' : ''}`);
  if (args['dry-run']) { log('dry run: stopping before any export'); return 0; }

  const pageDates = voyageDates();
  const index = await signatureIndex();
  let imported = 0;

  // 2–3. Rounds: the best untried candidate per photo, exported in small batches, judged by the gateway.
  for (let round = 1; round <= rounds; round++) {
    todo = await targets(only);
    const days = await galleryDays(pageDates);
    const picks = [];
    for (const t of todo) {
      const key = `${t.gallery}/${t.slug}`, tried = new Set(state.tried[key] || []);
      const next = rank(state.candidates[t.name] || [], days.get(t.gallery)).find(c => !tried.has(c.id));
      if (next) picks.push({ key, id: next.id });
    }
    if (!picks.length) break;
    log(`round ${round}: ${picks.length} candidate(s) to fetch`);

    for (let i = 0; i < picks.length; i += batch) {
      const chunk = picks.slice(i, i + batch);
      const stage = path.join(DIR, 'stage');
      fs.rmSync(stage, { recursive: true, force: true });
      fs.mkdirSync(stage, { recursive: true });
      const exported = await retry(`export of ${chunk.length} photo(s)`, () => { exportPhotos([...new Set(chunk.map(p => p.id))], stage, { batch }); return true; }, log);
      // Judge whatever arrived, even from a failed batch; only mark as tried what was exported.
      const arrived = fs.readdirSync(stage).filter(f => !f.startsWith('.')).length;
      if (!exported && !arrived) { await pause(5000); continue; }
      for (const p of chunk) (state.tried[p.key] = state.tried[p.key] || []).push(p.id);
      saveState(state);

      const plan = await planImport(stage, { index });
      const good = plan.filter(s => s.action === 'replace' || s.action === 'same');
      const { copied } = applyImport(good, { move: true });
      imported += copied;
      fs.rmSync(stage, { recursive: true, force: true }); // unmatched exports only; the originals stay in Photos
      guardMemory({ log });
      const left = (await targets(only)).length;
      log(`  batch ${Math.floor(i / batch) + 1}/${Math.ceil(picks.length / batch)}: ${copied} imported, ${plan.filter(s => NON_MATCH.has(s.action)).length} not matching · ${left} still compressed (Photos ${photosMemoryGB().toFixed(1)} GB)`);
      await pause(2000);
    }
  }

  const left = await targets(only);
  const report = path.join(DIR, 'unresolved.txt');
  fs.writeFileSync(report, left.map(t => `${t.gallery}/${t.file}  candidates tried: ${(state.tried[`${t.gallery}/${t.slug}`] || []).length}/${(state.candidates[t.name] || []).length}`).join('\n') + '\n');
  log(`collected: ${imported} original(s) imported; ${left.length} still compressed, listed in ${path.relative(ROOT, report)}`);

  // Naming places only talks to OpenStreetMap, and takes hours for a large
  // import: it runs on its own, so the lock goes back to the next Photos job.
  unlock();
  if (imported && !args['no-locate']) {
    const pidFile = path.join(DIR, 'locate.pid');
    const running = (() => { try { const pid = Number(fs.readFileSync(pidFile, 'utf8')); process.kill(pid, 0); return pid; } catch { return 0; } })();
    if (running) log(`places: photos:locate is already running (pid ${running})`);
    else {
      const out = fs.openSync(path.join(DIR, 'locate.out'), 'a');
      const child = spawn(process.execPath, [path.join(ROOT, 'scripts/photos/locate.mjs'), '--all', '--quiet'], { cwd: ROOT, detached: true, stdio: ['ignore', out, out] });
      fs.writeFileSync(pidFile, String(child.pid));
      child.unref();
      log(`places: photos:locate --all runs on in the background (pid ${child.pid}), output in ${path.relative(ROOT, path.join(DIR, 'locate.out'))}`);
    }
  }
  log('done');
  return 0;
}

// Only when run as a script: importing this module (a test, a syntax check) must never start a collection.
if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) main().then(c => process.exit(c), e => { console.error(e.stack || e); process.exit(2); });
