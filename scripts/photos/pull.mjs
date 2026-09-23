#!/usr/bin/env node
/**
 * The other direction of photos:push: copy originals from the private
 * bucket into photos/. Use it to rebuild photos/ on a new machine, or after
 * losing the local tree.
 *
 * Only fetches files photos/ does not have (rclone --ignore-existing), so
 * it can never overwrite a local file: a camera original you have not
 * pushed yet is safe. trash/, the processor's .private.json files and
 * dotfiles stay in the bucket.
 *
 * Usage: npm run photos:pull [-- --gallery <name>] [--dry-run]
 */

import fs from 'node:fs';
import path from 'node:path';
import { env, PATHS, parseArgs } from './lib/config.mjs';
import { run, EXCLUDES } from './lib/rclone.mjs';
import { originalsBucket, cleanGallery } from './lib/inventory.mjs';

function main() {
  const args = parseArgs(process.argv.slice(2));
  const { bucket, why } = originalsBucket();
  if (!bucket) { console.error(`${why}. See _docs/photos-pipeline.md → Local setup.`); return 2; }
  const sub = args.gallery ? cleanGallery(args.gallery) : '';
  const local = path.join(PATHS.photosDir, ...sub.split('/').filter(Boolean));
  fs.mkdirSync(local, { recursive: true });
  const remote = `${bucket}${sub ? `/${sub}` : ''}`;

  const status = run(['copy', remote, local, '--ignore-existing', '--progress', '--transfers', '4', ...EXCLUDES, '--exclude', '/trash/**'], { dryRun: !!args['dry-run'] });
  if (status !== 0) return status;
  console.log(args['dry-run'] ? '\nDry run only; nothing was downloaded.' : `\nphotos/${sub} now holds every original in ${env.originalsBucket}${sub ? `/${sub}` : ''} it was missing. Check with: npm run photos:status`);
  return 0;
}

process.exit(main());
