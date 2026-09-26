#!/usr/bin/env node
/**
 * New photographs, start to finish: the routine after dropping exports into the inbox.
 *
 *   1. photos:import --move     verify and sort the inbox into photos/<gallery>/
 *   2. photos:enrich            put back camera records a plain Photos export stripped
 *   3. photos:locate            name where each new frame was taken
 *   4. photos:recollect         the check before pushing, per gallery touched
 *   5. one confirmation         type QSD
 *   6. photos:recollect --push  upload; processing (tiers, sun, weather, D1) starts on its own
 *
 * Only the galleries whose files changed in step 1 go through 2–6. Nothing is pushed without the
 * confirmation, and a gallery whose check fails is left out of the push and named.
 *
 * Usage: npm run photos:ingest [-- --from <dir>] [--dry-run]
 *   --dry-run  import as a dry run and stop: shows what would come in
 */

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { spawnSync } from 'node:child_process';
import { PATHS, parseArgs } from './lib/config.mjs';
import { galleriesUnder } from './lib/inventory.mjs';

const CONFIRM = 'QSD';
const args = parseArgs(process.argv.slice(2));
const node = (script, extra) => spawnSync(process.execPath, [path.join(PATHS.photosDir, '..', 'scripts', 'photos', script), ...extra], { stdio: 'inherit' }).status;
const quiet = (script, extra) => spawnSync(process.execPath, [path.join(PATHS.photosDir, '..', 'scripts', 'photos', script), ...extra], { encoding: 'utf8' });

/** Every original under photos/, by gallery: name → size + mtime, to see what an import changed. */
function snapshot() {
  const out = new Map();
  for (const g of galleriesUnder(PATHS.photosDir)) {
    const dir = path.join(PATHS.photosDir, ...g.split('/'));
    const files = fs.readdirSync(dir).filter((f) => !f.startsWith('.') && /\.(jpe?g|tiff?|heic|png)$/i.test(f));
    out.set(g, new Map(files.map((f) => { const s = fs.statSync(path.join(dir, f)); return [f, `${s.size}:${s.mtimeMs}`]; })));
  }
  return out;
}

async function main() {
  const from = args.from ? ['--from', String(args.from)] : [];
  if (args['dry-run']) return node('import.mjs', [...from, '--dry-run']);

  const before = snapshot();
  console.log('── 1. import');
  node('import.mjs', [...from, '--move']);
  const after = snapshot();
  const touched = [...after].filter(([g, files]) => {
    const was = before.get(g);
    return !was || [...files].some(([f, sig]) => was.get(f) !== sig);
  }).map(([g]) => g).sort();
  if (!touched.length) { console.log('\nNothing new came in; nothing to do.'); return 0; }
  console.log(`\nChanged: ${touched.join(', ')}`);

  console.log('\n── 2. enrich');
  for (const g of touched) node('enrich.mjs', ['--gallery', g]);
  console.log('\n── 3. locate');
  for (const g of touched) node('locate.mjs', ['--gallery', g]);

  console.log('\n── 4. check');
  const ready = [], held = [];
  for (const g of touched) {
    const r = quiet('recollect.mjs', ['--gallery', g]);
    process.stdout.write(r.stdout.split('\n').filter((l) => /^\s+(matched|new|renamed|vanishing|collisions)|✗/.test(l)).map((l) => `  ${g}: ${l.trim()}`).join('\n') + '\n');
    (r.status === 0 ? ready : held).push(g);
  }
  if (held.length) console.log(`\nHeld back (fix, then run photos:recollect -- --gallery <g> --push): ${held.join(', ')}`);
  if (!ready.length) return 1;

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question(`\nPush ${ready.length} galler${ready.length === 1 ? 'y' : 'ies'} (${ready.join(', ')})? Type ${CONFIRM} to confirm: `);
  rl.close();
  if (answer.trim() !== CONFIRM) { console.log('Not confirmed; nothing pushed.'); return 1; }

  console.log('\n── 6. push');
  let failed = 0;
  for (const g of ready) if (node('recollect.mjs', ['--gallery', g, '--push']) !== 0) failed++;
  console.log(failed ? `\n${failed} push(es) failed.` : `\nPushed. Processing starts on Cloudflare's side within a minute.`);
  return failed ? 1 : held.length ? 1 : 0;
}

main().then((c) => process.exit(c), (e) => { console.error(e); process.exit(2); });
