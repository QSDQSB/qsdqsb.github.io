#!/usr/bin/env node
/**
 * Move orphaned originals (in the bucket, not in photos/) into
 * trash/<date>/… inside the same bucket. Nothing is deleted: an R2 lifecycle
 * rule on the trash/ prefix expires objects after 30 days, and until then a
 * mistake is undone by moving the object back.
 *
 * The processor treats a moved original as gone and removes its public
 * tiers on its next run.
 *
 * Scope is always explicit: one or more --gallery, or --all. Every file that
 * would move is listed, grouped by gallery, and one confirmation (typing
 * QSD) covers the lot.
 *
 * Refuses when any orphan is still referenced by _data/photos/<gallery>.yml.
 * With --all, a gallery that has no folder in photos/ on this machine is
 * skipped, not emptied: a machine that never pulled a voyage would otherwise
 * see every one of its originals as an orphan. Name it with --gallery to
 * prune it anyway.
 *
 * Usage: npm run photos:prune -- --all [--dry-run] [--yes]
 *        npm run photos:prune -- --gallery london [--gallery oxford]… [--dry-run] [--yes]
 */

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { env, PATHS, parseArgs } from './lib/config.mjs';
import { rcloneVersion, remoteExists, run } from './lib/rclone.mjs';
import { localFiles, remoteFiles, diff } from './plan.mjs';

const CONFIRM = 'QSD';
const args = parseArgs(process.argv.slice(2), { multi: ['gallery'] });
const clean = (g) => String(g).replace(/^\/+|\/+$/g, '');

/**
 * What would move, for a scope: `named` galleries, or every gallery (`all`).
 * @returns {{ orphans: Map<string,string[]>, referenced: string[], skipped: string[] }}
 */
export function pruneScope(report, { named = [], all = false, hasLocal = () => true } = {}) {
  const orphans = new Map(), referenced = [], skipped = [];
  for (const [g, r] of [...report].sort(([a], [b]) => a.localeCompare(b))) {
    if (!all && !named.includes(g)) continue;
    referenced.push(...r.referenced);
    if (!r.orphan.length) continue;
    if (all && !hasLocal(g)) { skipped.push(g); continue; }
    orphans.set(g, r.orphan);
  }
  return { orphans, referenced, skipped };
}

async function main() {
  if (!rcloneVersion()) { console.error('rclone is not installed. See _docs/photos-pipeline.md → Local setup.'); return 2; }
  if (!remoteExists(env.rcloneRemote)) { console.error(`rclone remote "${env.rcloneRemote}:" is not configured.`); return 2; }
  const named = (args.gallery || []).map(clean).filter(Boolean);
  const all = !!args.all;
  if (!all && !named.length) { console.error('prune is always scoped: --gallery <name> (repeatable) or --all.'); return 2; }

  const local = localFiles(PATHS.photosDir);
  const report = new Map();
  for (const sub of all ? [''] : named) for (const [g, r] of diff(local, remoteFiles(sub), sub)) report.set(g, r);
  const hasLocal = (g) => fs.existsSync(path.join(PATHS.photosDir, ...g.split('/')));
  const { orphans, referenced, skipped } = pruneScope(report, { named, all, hasLocal });

  if (referenced.length) {
    for (const k of referenced) console.log(`  REFERENCED ${k}  ← still named in _data/photos/${path.posix.dirname(k)}.yml`);
    console.error('\nRefusing: remove those slugs from the YAML first. Nothing moved.');
    return 1;
  }
  for (const g of skipped) console.log(`  skipped ${g}: no photos/${g}/ on this machine (pull it, or name it with --gallery)`);
  const total = [...orphans.values()].reduce((n, ks) => n + ks.length, 0);
  if (!total) { console.log('Nothing to prune.'); return 0; }

  for (const [g, keys] of orphans) {
    console.log(`${g}  (${keys.length})`);
    for (const k of keys) console.log(`  ${k}`);
  }
  const date = new Date().toISOString().slice(0, 10);
  console.log(`\n${total} original(s) across ${orphans.size} galler${orphans.size === 1 ? 'y' : 'ies'} will move to trash/${date}/… and expire after 30 days.`);
  if (args['dry-run']) { console.log('Dry run: nothing moved.'); return 0; }

  if (!args.yes) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const answer = await rl.question(`Type ${CONFIRM} to confirm: `);
    rl.close();
    if (answer.trim() !== CONFIRM) { console.log('Not confirmed; nothing moved.'); return 1; }
  }

  const base = `${env.rcloneRemote}:${env.originalsBucket}`;
  let failed = 0;
  for (const keys of orphans.values()) for (const k of keys) {
    if (run(['moveto', `${base}/${k}`, `${base}/trash/${date}/${k}`]) !== 0) { failed++; console.log(`  FAILED ${k}`); }
  }
  console.log(failed ? `\n${failed} of ${total} move(s) failed; the rest are in trash/${date}/.` : `\nMoved ${total} original(s) to trash/${date}/. The processor drops them from the site on its next run.`);
  return failed ? 1 : 0;
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) main().then(c => process.exit(c), e => { console.error(e); process.exit(2); });
