#!/usr/bin/env node
/**
 * One-off: write the colours the local sidecar already holds (palette, grid, signature, dots,
 * computed from each photo's 480 px tier by scripts/photos/palettes.mjs) into the private manifests,
 * for photos processed before the processor kept them. Nothing is computed and nothing re-rendered;
 * only <gallery>/manifest.json in the originals bucket is touched, never .private.json.
 *
 * Dry run by default: per gallery, how many photos would gain which fields, and one sample. With
 * --write, each manifest that changes is first copied to trash/<date>/<gallery>/manifest.json (so
 * `photos:trash restore … --bucket-only` puts it back), re-read to be sure nothing else wrote it in
 * the meantime, then written. Through the local `r2:` rclone remote; no API keys.
 *
 * Usage: node scripts/photos/backfill-colours.mjs [--gallery london] [--write]
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { env, PATHS, MANIFEST_FILE, parseArgs } from './lib/config.mjs';
import { readSidecar } from './palettes.mjs';

const FIELDS = ['palette', 'grid', 'signature', 'dots'];
const args = parseArgs(process.argv.slice(2));
const remote = `${env.rcloneRemote}:${env.originalsBucket}`;
const today = new Date().toISOString().slice(0, 10);

const rclone = (a, input) => spawnSync('rclone', a, { encoding: 'utf8', input, maxBuffer: 64 << 20 });
const readManifest = (g) => { const r = rclone(['cat', `${remote}/${g}/${MANIFEST_FILE}`]); return r.status === 0 && r.stdout.trim() ? r.stdout : null; };

const index = JSON.parse(fs.readFileSync(path.join(PATHS.mergedDir, '_index.json'), 'utf8'));
const galleries = args.gallery ? [String(args.gallery)] : Object.keys(index.galleries);
let touched = 0, photos = 0, missing = 0, sample = null;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'backfill-'));

for (const g of galleries) {
  const side = readSidecar(g);
  const raw = readManifest(g);
  if (!raw) { console.log(`  ${g.padEnd(34)} no private manifest: skipped`); continue; }
  const m = JSON.parse(raw);
  const gained = { palette: 0, grid: 0, signature: 0, dots: 0 };
  let changed = 0, lacking = 0;
  for (const p of m.photos) {
    const want = FIELDS.filter(f => p[f] == null);
    if (!want.length) continue;
    const s = side[p.hash];
    if (!s) { lacking++; continue; }
    for (const f of want) if (s[f] != null) { p[f] = s[f]; gained[f]++; }
    changed++;
    if (!sample) sample = { gallery: g, slug: p.slug, added: Object.fromEntries(want.map(f => [f, typeof s[f] === 'string' ? `${s[f].slice(0, 32)}… (${s[f].length} chars)` : s[f]])) };
  }
  missing += lacking;
  const note = `${changed}/${m.photos.length} photos gain ${FIELDS.filter(f => gained[f]).join(', ') || 'nothing'}${lacking ? `; ${lacking} not in the sidecar` : ''}`;
  if (!changed) { console.log(`  ${g.padEnd(34)} ${note}`); continue; }
  touched++; photos += changed;
  if (!args.write) { console.log(`  ${g.padEnd(34)} ${note}`); continue; }

  // Back up, make sure nothing wrote it since we read it, then write.
  const back = rclone(['copyto', `${remote}/${g}/${MANIFEST_FILE}`, `${remote}/trash/${today}/${g}/${MANIFEST_FILE}`]);
  if (back.status !== 0) { console.log(`  ${g.padEnd(34)} ! backup failed, not written: ${back.stderr.trim().split('\n').pop()}`); continue; }
  if (readManifest(g) !== raw) { console.log(`  ${g.padEnd(34)} ! changed since read, not written`); continue; }
  const file = path.join(tmp, `${g.replace(/\//g, '_')}.json`);
  fs.writeFileSync(file, JSON.stringify(m, null, 2) + '\n'); // as the processor writes it
  const put = rclone(['copyto', file, `${remote}/${g}/${MANIFEST_FILE}`]);
  console.log(`  ${g.padEnd(34)} ${put.status === 0 ? 'written' : `! write failed: ${put.stderr.trim().split('\n').pop()}`} (${note})`);
}

fs.rmSync(tmp, { recursive: true, force: true });
console.log(`\n${args.write ? 'wrote' : 'would write'} ${touched} manifest(s), ${photos} photo(s)${missing ? `; ${missing} photo(s) not in the sidecar (run palettes.mjs)` : ''}`);
if (sample) console.log(`sample, ${sample.gallery}/${sample.slug}:`, JSON.stringify(sample.added, null, 1));
if (!args.write && touched) console.log(`\nDry run: nothing written. Each manifest would first be copied to trash/${today}/<gallery>/${MANIFEST_FILE}.`);
