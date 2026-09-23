#!/usr/bin/env node
/**
 * The originals bucket's trash/: what photos:prune moved there, and a way
 * back out. Everything happens server-side through rclone; nothing is
 * deleted here (the R2 lifecycle rule expires trash/ after 30 days).
 *
 *   list                   every object under trash/, grouped by the day it
 *                          was pruned, with the day it expires
 *   restore <key>          move one object back to where it came from
 *   restore <prefix>/      move everything under a prefix back, e.g. a whole
 *                          day (trash/2026-09-23/) or one gallery that day
 *                          (trash/2026-09-23/london/)
 *
 * `<key>` may be written with or without the leading `trash/`. A restore
 * refuses to overwrite an original that is already back in place, and
 * copies the restored file into photos/ when it is missing there, so the
 * next photos:plan does not report it as an orphan again. The object-create
 * event it causes re-runs the processor, which renders the photo again.
 *
 * Usage:
 *   npm run photos:trash -- list [--gallery <name>]
 *   npm run photos:trash -- restore <key|prefix/> [--dry-run] [--bucket-only]
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { PATHS, parseArgs } from './lib/config.mjs';
import { lsjson, run } from './lib/rclone.mjs';
import { originalsBucket } from './lib/inventory.mjs';

export const TRASH_DAYS = 30;
const TRASH_RE = /^trash\/(\d{4}-\d{2}-\d{2})\/(.+)$/;

/** `trash/2026-09-23/london/DSCF1797.jpg` → { date, original: 'london/DSCF1797.jpg', gallery, file }; null for anything else. */
export function parseTrashKey(key) {
  const k = String(key).replace(/^\/+/, '');
  const m = (k.startsWith('trash/') ? k : `trash/${k}`).match(TRASH_RE);
  if (!m) return null;
  const original = m[2];
  return { key: `trash/${m[1]}/${original}`, date: m[1], original, gallery: path.posix.dirname(original), file: path.posix.basename(original) };
}

export function expiresOn(date, days = TRASH_DAYS) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** lsjson rows under trash/ → entries sorted newest day first, each with its expiry and days left. */
export function summariseTrash(rows, { now = new Date(), gallery = null } = {}) {
  const today = now.toISOString().slice(0, 10);
  const out = [];
  for (const r of rows) {
    const t = parseTrashKey(`trash/${r.Path}`);
    if (!t) continue;
    if (gallery && t.gallery !== gallery && !t.gallery.startsWith(`${gallery}/`)) continue;
    const expires = expiresOn(t.date);
    const left = Math.round((Date.parse(`${expires}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000);
    out.push({ ...t, size: r.Size, expires, daysLeft: left });
  }
  return out.sort((a, b) => b.date.localeCompare(a.date) || a.original.localeCompare(b.original));
}

/**
 * Plan a restore of one key or every key under a prefix.
 * @param {string} target      key or prefix (trailing `/`)
 * @param {object[]} trashRows  lsjson rows of trash/
 * @param {Set<string>} live    keys of originals currently outside trash/
 * @returns {{moves:{from,to,gallery,file}[], problems:string[]}}
 */
export function planRestore(target, trashRows, live) {
  const want = String(target).replace(/^\/+/, '').replace(/^(?!trash\/)/, 'trash/');
  const isPrefix = want.endsWith('/');
  const all = trashRows.map(r => parseTrashKey(`trash/${r.Path}`)).filter(Boolean);
  const picked = all.filter(t => isPrefix ? t.key.startsWith(want) : t.key === want);
  const problems = [];
  if (!picked.length) problems.push(`nothing in trash matches ${want}`);
  const seen = new Set();
  for (const t of picked) {
    if (live.has(t.original)) problems.push(`${t.original} is already in place; restoring ${t.key} would overwrite it`);
    if (seen.has(t.original)) problems.push(`${t.original} appears under more than one day; restore one key at a time`);
    seen.add(t.original);
  }
  return { moves: picked.map(t => ({ from: t.key, to: t.original, gallery: t.gallery, file: t.file })), problems };
}

function listing(bucket) {
  const rows = lsjson(bucket);
  return {
    trash: rows.filter(r => r.Path.startsWith('trash/')).map(r => ({ ...r, Path: r.Path.slice('trash/'.length) })),
    live: new Set(rows.map(r => r.Path).filter(p => !p.startsWith('trash/'))),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const [cmd, target] = args._;
  if (!['list', 'restore'].includes(cmd) || (cmd === 'restore' && !target)) {
    console.error('usage: npm run photos:trash -- list [--gallery <name>]\n       npm run photos:trash -- restore <key|prefix/> [--dry-run] [--bucket-only]');
    return 2;
  }
  const { bucket, why } = originalsBucket();
  if (!bucket) { console.error(`${why}. See _docs/photos-pipeline.md → Local setup.`); return 2; }
  const { trash, live } = listing(bucket);

  if (cmd === 'list') {
    const rows = summariseTrash(trash, { gallery: args.gallery ? String(args.gallery).replace(/^\/+|\/+$/g, '') : null });
    if (!rows.length) { console.log('trash/ is empty.'); return 0; }
    let day = null;
    for (const r of rows) {
      if (r.date !== day) { day = r.date; console.log(`\npruned ${r.date} · expires ${r.expires} (${r.daysLeft > 0 ? `${r.daysLeft} day(s) left` : 'due now'})`); }
      console.log(`  ${r.key.padEnd(64)} ${(r.size / 1048576).toFixed(1).padStart(6)} MB`);
    }
    console.log(`\n${rows.length} object(s). Restore with: npm run photos:trash -- restore <key>`);
    return 0;
  }

  const { moves, problems } = planRestore(target, trash, live);
  if (problems.length) { for (const p of problems) console.error(`✗ ${p}`); return 1; }
  const dry = !!args['dry-run'];
  let failed = 0;
  for (const m of moves) {
    if (run(['moveto', `${bucket}/${m.from}`, `${bucket}/${m.to}`], { dryRun: dry }) !== 0) { failed++; continue; }
    const localFile = path.join(PATHS.photosDir, ...m.to.split('/'));
    if (args['bucket-only'] || fs.existsSync(localFile)) continue;
    if (dry) { console.log(`would copy ${m.to} back into photos/`); continue; }
    fs.mkdirSync(path.dirname(localFile), { recursive: true });
    const r = spawnSync('rclone', ['copyto', `${bucket}/${m.to}`, localFile], { stdio: 'inherit' });
    if (r.status !== 0) { console.error(`restored in the bucket, but copying it into photos/ failed: ${m.to}`); failed++; }
  }
  if (dry) console.log(`\nDry run; nothing moved.`);
  else console.log(failed ? `\n${failed} of ${moves.length} restore(s) failed.` : `\nRestored ${moves.length} original(s). The processor renders them again on its next run.`);
  return failed ? 1 : 0;
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) main().then(c => process.exit(c), e => { console.error(e.message || e); process.exit(2); });
