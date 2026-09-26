/**
 * Photo pipeline configuration. One place for every tunable and every
 * environment variable the pipeline reads, so a runbook can list them.
 *
 * Buckets:
 *   originals  private, holds the camera files as uploaded from photos/
 *   public     served from PHOTOS_PUBLIC_BASE, holds tiers + manifest.json
 *
 * Key layout in the public bucket:
 *   <gallery>/manifest.json
 *   <gallery>/<slug>/<long-edge>.<webp|jpg|avif>
 *
 * Key layout in the originals bucket:
 *   <gallery>/<Camera file name>        e.g. london/DSCF1797.jpg
 *   <gallery>/.private.json             GPS + full EXIF, never served
 *   trash/<date>/<gallery>/<file>       moved here by photos:prune
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

// `.env` at the repo root, when present, fills whatever the shell left unset.
// Variables already in the environment win, so CI secrets are never shadowed.
try { process.loadEnvFile?.(path.join(ROOT, '.env')); } catch { /* no .env */ }

export const PATHS = {
  photosDir:     path.resolve(ROOT, process.env.PHOTOS_DIR || 'photos'), // local originals, gitignored
  authoredDir:   path.join(ROOT, '_data', 'photos'),      // captions, order, stories (committed)
  mergedDir:     path.join(ROOT, '_data', 'photo_manifests'), // machine + authored merge (gitignored)
  locationsDir:  path.join(ROOT, '_data', 'photo_locations'), // place names from photos:locate (committed)
  localStore:    path.join(ROOT, '.photos-local'),        // filesystem stand-in for both buckets
};

// Long-edge sizes. Thumb tiers feed the grid, full tiers feed the lightbox
// and the loupe. 2880 is a MacBook's full-width spread at 2x (1440 × 2), so
// it need not reach for 4096; 4096 is the largest anything public ever reaches.
export const SIZES = {
  thumb: [480, 960],
  full:  [1280, 1920, 2560, 2880, 4096],
};
export const ALL_SIZES = [...SIZES.thumb, ...SIZES.full];

// Encoders per format. AVIF is capped: encoding a 4096px AVIF costs seconds
// per frame for a tier almost nobody fetches, so it stops at 1920.
export const FORMATS = {
  webp: { quality: 78, maxSize: Infinity },
  jpg:  { quality: 80, maxSize: Infinity, mozjpeg: true },
  avif: { quality: 55, maxSize: 1920, effort: 4 },
};

export const ORIGINAL_RE = /\.(jpe?g|png|tiff?|webp|heic)$/i;
export const IGNORED_PREFIXES = ['trash/', '.'];
export const PRIVATE_FILE = '.private.json';
export const MANIFEST_FILE = 'manifest.json';
export const MANIFEST_VERSION = 1;

export const env = {
  accountId:       process.env.R2_ACCOUNT_ID || '',
  accessKeyId:     process.env.R2_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  originalsBucket: process.env.PHOTOS_ORIGINALS_BUCKET || 'qsdqsb-originals',
  publicBucket:    process.env.PHOTOS_PUBLIC_BUCKET || 'qsdqsb-photos',
  publicBase:      (process.env.PHOTOS_PUBLIC_BASE || 'https://img.qsdqsb.com').replace(/\/+$/, ''),
  rcloneRemote:    process.env.PHOTOS_RCLONE_REMOTE || 'r2',
  deployHook:      process.env.CF_PAGES_DEPLOY_HOOK || '',
  avif:            process.env.PHOTOS_AVIF !== '0',
  // Staging folder camera originals are exported into before photos:import.
  inbox:           process.env.PHOTOS_INBOX || '~/Desktop/voyage originals',
};

/** `prague/petrin-hill` → `prague_petrin-hill`, the key Liquid reads from `site.data`. */
export const galleryKey = (gallery) => gallery.replace(/\//g, '_');

/** Parse `--flag value` / `--flag` / `--flag=value` argv into an object. Repeated flags collect. */
export function parseArgs(argv, { multi = [] } = {}) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) { out._.push(a); continue; }
    let [key, val] = a.slice(2).split('=', 2);
    if (val === undefined && argv[i + 1] !== undefined && !argv[i + 1].startsWith('--')) val = argv[++i];
    if (val === undefined) val = true;
    if (multi.includes(key)) (out[key] = out[key] || []).push(val);
    else out[key] = val;
  }
  return out;
}
