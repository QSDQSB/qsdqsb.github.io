#!/usr/bin/env node
/**
 * Upload the diff of photos/ to the private originals bucket.
 *
 * Only adds and updates, never deletes (see prune.mjs for removals). rclone
 * compares checksums, so a re-run over an unchanged tree transfers nothing.
 *
 * An update is a deletion in disguise, and R2 keeps no object versions, so
 * every original a push replaces is first moved to trash/<date>/<gallery>/
 * (rclone --backup-dir, server-side). It stays restorable for 30 days with
 * `photos:trash -- restore`, the same as a pruned file. A second overwrite
 * of the same file on the same day replaces that day's backup.
 * Uploads land in the bucket, the R2 event notification wakes the Worker,
 * the Worker starts the processing workflow. Nothing else to do locally.
 *
 * Usage:
 *   npm run photos:push                       everything under photos/
 *   npm run photos:push -- --gallery london   one gallery (nested: prague/twilight)
 *   npm run photos:push -- --dry-run          show what would transfer
 */

import fs from 'node:fs';
import path from 'node:path';
import { env, PATHS, parseArgs } from './lib/config.mjs';
import { rcloneVersion, remoteExists, run, EXCLUDES } from './lib/rclone.mjs';

const args = parseArgs(process.argv.slice(2));

function main() {
  if (!rcloneVersion()) { console.error('rclone is not installed. See _docs/photos-pipeline.md → Local setup.'); return 2; }
  if (!remoteExists(env.rcloneRemote)) { console.error(`rclone remote "${env.rcloneRemote}:" is not configured. See _docs/photos-pipeline.md → Local setup.`); return 2; }

  const sub = args.gallery ? String(args.gallery).replace(/^\/+|\/+$/g, '') : '';
  const local = path.join(PATHS.photosDir, ...sub.split('/').filter(Boolean));
  if (!fs.existsSync(local)) { console.error(`nothing to push: ${local} does not exist`); return 2; }
  const remote = `${env.rcloneRemote}:${env.originalsBucket}/${sub}`.replace(/\/$/, '');

  const date = new Date().toISOString().slice(0, 10);
  const backup = `${env.rcloneRemote}:${env.originalsBucket}/trash/${date}${sub ? `/${sub}` : ''}`;
  const status = run(['copy', local, remote, '--checksum', '--progress', '--transfers', '4', ...EXCLUDES,
    '--exclude', '/trash/**', '--backup-dir', backup], { dryRun: !!args['dry-run'] });
  if (status !== 0) return status;

  console.log(args['dry-run']
    ? '\nDry run only; nothing was uploaded.'
    : `\nUploaded. Processing starts on Cloudflare's side within a minute (R2 notification → Worker → GitHub workflow).\nTo run it by hand: gh workflow run photos-process.yml${sub ? ` -f gallery=${sub}` : ''}`);
  return 0;
}

process.exit(main());
