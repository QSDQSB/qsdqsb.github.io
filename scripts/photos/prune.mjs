#!/usr/bin/env node
/**
 * Move a gallery's orphaned originals (in the bucket, not in photos/) into
 * trash/<date>/… inside the same bucket. Nothing is deleted: an R2 lifecycle
 * rule on the trash/ prefix expires objects after 30 days, and until then a
 * mistake is undone by moving the object back.
 *
 * The processor treats a moved original as gone and removes its public
 * tiers on its next run.
 *
 * Usage: npm run photos:prune -- --gallery london [--yes]
 * Refuses when an orphan is still referenced by _data/photos/<gallery>.yml.
 */

import readline from 'node:readline/promises';
import { env, PATHS, parseArgs } from './lib/config.mjs';
import { rcloneVersion, remoteExists, run } from './lib/rclone.mjs';
import { localFiles, remoteFiles, diff } from './plan.mjs';

const args = parseArgs(process.argv.slice(2));

async function main() {
  if (!rcloneVersion()) { console.error('rclone is not installed. See _docs/photos-pipeline.md → Local setup.'); return 2; }
  if (!remoteExists(env.rcloneRemote)) { console.error(`rclone remote "${env.rcloneRemote}:" is not configured.`); return 2; }
  const gallery = args.gallery && String(args.gallery).replace(/^\/+|\/+$/g, '');
  if (!gallery) { console.error('prune is always scoped: --gallery <name> is required.'); return 2; }

  const report = diff(localFiles(PATHS.photosDir), remoteFiles(gallery), gallery);
  const r = report.get(gallery) || { orphan: [], referenced: [] };
  if (r.referenced.length) {
    for (const k of r.referenced) console.log(`  REFERENCED ${k}  ← still named in _data/photos/${gallery}.yml`);
    console.error('\nRefusing: remove those slugs from the YAML first.');
    return 1;
  }
  if (!r.orphan.length) { console.log(`${gallery}: nothing to prune.`); return 0; }

  console.log(`${gallery}: ${r.orphan.length} original(s) exist in the bucket but not in photos/:`);
  for (const k of r.orphan) console.log(`  ${k}`);
  const date = new Date().toISOString().slice(0, 10);
  console.log(`\nThey will move to trash/${date}/… and expire after 30 days.`);

  if (!args.yes) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const answer = await rl.question(`Type the gallery name (${gallery}) to confirm: `);
    rl.close();
    if (answer.trim() !== gallery) { console.log('Not confirmed; nothing moved.'); return 1; }
  }

  const base = `${env.rcloneRemote}:${env.originalsBucket}`;
  let failed = 0;
  for (const k of r.orphan) {
    if (run(['moveto', `${base}/${k}`, `${base}/trash/${date}/${k}`], { dryRun: !!args['dry-run'] }) !== 0) failed++;
  }
  console.log(failed ? `\n${failed} move(s) failed.` : `\nMoved ${r.orphan.length} original(s) to trash/${date}/. The processor drops their public tiers on its next run.`);
  return failed ? 1 : 0;
}

main().then(c => process.exit(c), e => { console.error(e); process.exit(2); });
