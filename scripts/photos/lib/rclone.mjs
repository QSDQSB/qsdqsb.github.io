/**
 * Thin wrapper over the rclone CLI, which does the local ↔ R2 transfer.
 * rclone compares by size + modtime (or checksum with `--checksum`), so a
 * copy only moves what is new or changed.
 *
 * Expected remote in ~/.config/rclone/rclone.conf (see _docs/photos-pipeline.md):
 *   [r2]
 *   type = s3
 *   provider = Cloudflare
 *   access_key_id = …
 *   secret_access_key = …
 *   endpoint = https://<account-id>.r2.cloudflarestorage.com
 *   acl = private
 */

import { spawnSync } from 'node:child_process';

export function rcloneVersion() {
  const r = spawnSync('rclone', ['version'], { encoding: 'utf8' });
  if (r.error || r.status !== 0) return null;
  return (r.stdout.split('\n')[0] || '').trim();
}

export function remoteExists(remote) {
  const r = spawnSync('rclone', ['listremotes'], { encoding: 'utf8' });
  return r.status === 0 && r.stdout.split('\n').map(s => s.trim()).includes(`${remote}:`);
}

/** Run rclone with inherited stdio; returns the exit status. */
export function run(args, { dryRun = false } = {}) {
  const full = dryRun ? [...args, '--dry-run'] : args;
  console.log(`$ rclone ${full.join(' ')}`);
  const r = spawnSync('rclone', full, { stdio: 'inherit' });
  return r.status ?? 1;
}

/** `rclone lsjson -R --files-only <path>` → [{ Path, Size, ModTime, Hashes? }] (empty when the path does not exist). */
export function lsjson(remotePath, { hash = false } = {}) {
  const args = ['lsjson', '-R', '--files-only', ...(hash ? ['--hash'] : []), remotePath];
  const r = spawnSync('rclone', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) {
    if (/directory not found/i.test(r.stderr || '')) return [];
    throw new Error(`rclone lsjson failed: ${(r.stderr || '').trim()}`);
  }
  return JSON.parse(r.stdout || '[]');
}

export const EXCLUDES = ['--exclude', '.DS_Store', '--exclude', '**/.*', '--exclude', '*.json'];
