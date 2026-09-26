#!/usr/bin/env node
/**
 * Every photograph's colours, computed from its public 480 px tier and kept
 * in a local sidecar: nothing written to either bucket, no manifest touched.
 *
 *   in   _data/photo_manifests/<key>.json          (npm run photos:fetch first)
 *   in   img.qsdqsb.com/t/<hash>/480.webp          public, read only
 *   out  .photos-local/palettes/<key>.json         { photos: { <hash>: { palette, grid } } } (gitignored)
 *   out  .photos-local/palettes/_kindred.json      every photo's nearest in other voyages (lib/atlas.mjs),
 *                                                  recomputed only when the set of photos changes
 *
 * Keyed by content hash, so a reorder or a caption never costs a re-run and
 * a replaced photograph is computed afresh. `photos:fetch` folds the sidecar
 * into the merge wherever the machine manifest has no palette of its own.
 *
 * Usage: node scripts/photos/palettes.mjs [--gallery london] [--force]
 */

import fs from 'node:fs';
import path from 'node:path';
import { PATHS, galleryKey, parseArgs } from './lib/config.mjs';
import { kindredOf } from './lib/atlas.mjs';

export const PALETTES_DIR = path.join(PATHS.localStore, 'palettes');
const PARALLEL = 12;

/** One photo's palette and grid (lib/tiers.mjs), loaded only here: the build reads the sidecar without Sharp. */
export async function paletteOfImage(buffer) {
  return (await import('./lib/tiers.mjs')).paletteOfImage(buffer);
}

export function readKindred() {
  try { return JSON.parse(fs.readFileSync(path.join(PALETTES_DIR, '_kindred.json'), 'utf8')).photos || {}; } catch { return {}; }
}

/** Kindred frames for every photo in the sidecars; skipped when the same photos were done last time. */
function writeKindred({ force = false } = {}) {
  const items = [];
  for (const f of fs.readdirSync(PALETTES_DIR).filter(f => f.endsWith('.json') && !f.startsWith('_'))) {
    const side = JSON.parse(fs.readFileSync(path.join(PALETTES_DIR, f), 'utf8'));
    for (const [hash, v] of Object.entries(side.photos || {})) items.push({ hash, gallery: side.gallery, palette: v.palette });
  }
  const signature = items.map(x => x.hash).sort().join('');
  const file = path.join(PALETTES_DIR, '_kindred.json');
  try { if (!force && JSON.parse(fs.readFileSync(file, 'utf8')).signature === signature) return 'kept'; } catch { /* compute */ }
  const t = Date.now();
  fs.writeFileSync(file, JSON.stringify({ generated: new Date().toISOString(), signature, photos: kindredOf(items) }) + '\n');
  return `${items.length} photos in ${((Date.now() - t) / 1000).toFixed(1)} s`;
}

export function readSidecar(gallery) {
  try { return JSON.parse(fs.readFileSync(path.join(PALETTES_DIR, `${galleryKey(gallery)}.json`), 'utf8')).photos || {}; } catch { return {}; }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const index = JSON.parse(fs.readFileSync(path.join(PATHS.mergedDir, '_index.json'), 'utf8'));
  const galleries = args.gallery ? [String(args.gallery)] : Object.keys(index.galleries);
  fs.mkdirSync(PALETTES_DIR, { recursive: true });
  let done = 0, kept = 0, failed = 0; const t0 = Date.now(); let busy = 0;
  for (const gallery of galleries) {
    const merged = JSON.parse(fs.readFileSync(path.join(PATHS.mergedDir, `${galleryKey(gallery)}.json`), 'utf8'));
    const have = args.force ? {} : readSidecar(gallery);
    const out = {};
    const todo = merged.photos.filter(p => p.hash);
    let next = 0;
    await Promise.all(Array.from({ length: PARALLEL }, async () => {
      for (let i = next++; i < todo.length; i = next++) {
        const p = todo[i];
        if (have[p.hash]) { out[p.hash] = have[p.hash]; kept++; continue; }
        try {
          const r = await fetch(`${p.url}/480.webp`);
          if (!r.ok) throw new Error(`${r.status}`);
          const buf = Buffer.from(await r.arrayBuffer());
          const t = performance.now();
          out[p.hash] = await paletteOfImage(buf);
          busy += performance.now() - t; done++;
        } catch (e) { failed++; console.warn(`  ! ${gallery}/${p.slug}: ${e.message}`); }
      }
    }));
    fs.writeFileSync(path.join(PALETTES_DIR, `${galleryKey(gallery)}.json`), JSON.stringify({ gallery, generated: new Date().toISOString(), photos: out }) + '\n');
  }
  console.log(`kindred: ${writeKindred({ force: !!args.force })}`);
  console.log(`palettes: ${done} computed, ${kept} kept, ${failed} failed, ${galleries.length} galleries in ${((Date.now() - t0) / 1000).toFixed(1)} s (${done ? (busy / done).toFixed(0) : 0} ms of compute per photo)`);
  return failed ? 1 : 0;
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) main().then(c => process.exit(c), e => { console.error(e); process.exit(2); });
