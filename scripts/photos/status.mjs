#!/usr/bin/env node
/**
 * One report for the whole collection: per gallery, how many originals sit
 * on this machine, how many in the bucket, how many the processor has
 * rendered, how many carry a caption, and what is out of place.
 *
 *   local      files in photos/<gallery>/
 *   bucket     originals in the private bucket (rclone listing)
 *   pending    local files the bucket does not have yet, or has at another size
 *   processed  photos in the public manifest, hidden ones included
 *   captioned  processed photos whose YAML entry has words in it
 *   unlisted   processed photos with no YAML entry at all
 *
 * Exit 1 on anything that would surprise the owner: an orphan (in the bucket,
 * not local), a referenced orphan (an orphan the YAML still names), an
 * original the processor has not rendered, a voyage whose gallery has no
 * manifest, a caption that matches no photo, or YAML that fails validation.
 * Pending uploads are reported, never failed: they are the normal state
 * between dropping files in and pushing them.
 *
 * Usage: npm run photos:status [-- --gallery <name>] [--offline] [--no-fetch] [--json]
 *   --offline   skip the bucket listing (no rclone)
 *   --no-fetch  read _data/photo_manifests/ as it is instead of refreshing it
 */

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { PATHS, parseArgs } from './lib/config.mjs';
import {
  cleanGallery, originalsBucket, localGallery, galleriesUnder, bucketGalleries,
  readAuthored, readMerged, isCaptioned,
} from './lib/inventory.mjs';
import { slugFor } from './lib/slug.mjs';
import { readSidecar } from './locate.mjs';

const require = createRequire(import.meta.url);

/**
 * Pure: turn what was read into one row per gallery.
 * @param {object} input
 * @param {string[]} input.galleries
 * @param {Set<string>} input.referenced   gallery_name values used by voyages
 * @param {(g:string)=>{files:object[],warnings:string[]}} input.local
 * @param {Map<string,object[]>|null} input.bucket   null when the bucket was not read
 * @param {(g:string)=>object|null} input.merged
 * @param {(g:string)=>{doc:object|null,problems:string[]}} input.authored
 */
export function buildStatus({ galleries, referenced, local, bucket, merged, authored, locations = () => ({}) }) {
  return galleries.map((gallery) => {
    const problems = [], notes = [];
    const l = local(gallery);
    const b = bucket ? (bucket.get(gallery) || []) : null;
    const m = merged(gallery);
    const { doc, problems: yamlProblems } = authored(gallery);
    const aPhotos = (doc && doc.photos) || {};
    const inventory = (m && m.inventory) || [];
    const processedSlugs = new Set(inventory.map(p => p.slug));
    problems.push(...yamlProblems);
    notes.push(...l.warnings);

    const row = {
      gallery, referenced: referenced.has(gallery),
      local: l.files.length, bucket: b ? b.length : null,
      pending: [], processed: inventory.length,
      captioned: inventory.filter(p => isCaptioned(aPhotos[p.slug])).length,
      unlisted: inventory.filter(p => !(p.slug in aPhotos)).map(p => p.slug),
      orphans: [], referencedOrphans: [], unprocessed: [],
      lastProcessed: inventory.map(p => p.processed).filter(Boolean).sort().pop() || (m && m.generated) || null,
      formats: [...new Set(inventory.flatMap(p => p.formats || []))].sort(),
      // Where each photo's place name comes from (photos:locate): GPS, a visual guess, or not yet.
      located: Object.values(locations(gallery)).reduce((n, e) => {
        const k = e.gps === 'present' ? 'gps' : e.source === 'visual guess' ? 'visual' : 'pending';
        n[k] = (n[k] || 0) + 1; return n;
      }, { gps: 0, visual: 0, pending: 0 }),
      problems, notes,
    };

    if (b) {
      const inBucket = new Map(b.map(f => [f.file, f]));
      const localNames = new Set(l.files.map(f => f.file));
      const localSlugs = new Set(l.files.map(f => slugFor(f.file)));
      row.pending = l.files.filter(f => !inBucket.has(f.file) || inBucket.get(f.file).size !== f.size).map(f => f.file);
      const named = new Set([...Object.keys(aPhotos), ...((doc && doc.order) || []).map(String)].map(s => s.toLowerCase()));
      for (const f of b) {
        if (localNames.has(f.file)) continue;
        const slug = slugFor(f.file);
        (named.has(slug) && !localSlugs.has(slug) ? row.referencedOrphans : row.orphans).push(f.key);
      }
      row.unprocessed = b.filter(f => !processedSlugs.has(f.slug)).map(f => f.slug);
    } else {
      // Offline: the best available stand-in for "in the bucket" is "on this machine".
      row.unprocessed = l.files.filter(f => !processedSlugs.has(f.slug)).map(f => f.slug);
    }

    if (row.orphans.length) problems.push(`${row.orphans.length} orphan(s) in the bucket, not in photos/: ${row.orphans.join(', ')}`);
    if (row.referencedOrphans.length) problems.push(`${row.referencedOrphans.length} orphan(s) still named in the YAML: ${row.referencedOrphans.join(', ')}`);
    const everProcessed = !!(m && m.generated);
    if (!everProcessed && row.unprocessed.length) problems.push(`not processed yet: no manifest for its ${row.unprocessed.length} original(s)`);
    else if (row.unprocessed.length) problems.push(`${row.unprocessed.length} original(s) not processed yet: ${short(row.unprocessed)}`);
    else if (row.referenced && !everProcessed) problems.push('a voyage names this gallery but no photograph exists for it anywhere');
    if (everProcessed) {
      const stray = Object.keys(aPhotos).filter(s => !processedSlugs.has(s));
      if (stray.length) problems.push(`YAML entries that match no photo: ${short(stray)}`);
    }
    if (row.pending.length) notes.push(`${row.pending.length} local file(s) not pushed yet: ${short(row.pending)}`);
    if (!row.referenced) notes.push('no voyage names this gallery yet');
    return row;
  });
}

const short = (xs, n = 6) => xs.length <= n ? xs.join(', ') : `${xs.slice(0, n).join(', ')} … (+${xs.length - n})`;

export function formatStatus(rows, { bucketNote = null } = {}) {
  const out = [];
  const cols = [
    ['gallery', 34, r => r.gallery], ['local', 6, r => r.local], ['bucket', 7, r => r.bucket ?? '–'],
    ['pending', 8, r => r.bucket == null ? '–' : r.pending.length], ['processed', 10, r => r.processed],
    ['captioned', 10, r => r.captioned], ['unlisted', 9, r => r.unlisted.length],
    ['orphans', 8, r => r.bucket == null ? '–' : r.orphans.length + r.referencedOrphans.length],
    ['last processed', 17, r => r.lastProcessed ? r.lastProcessed.slice(0, 16).replace('T', ' ') : '–'],
    ['formats', 0, r => r.formats.join('/') || '–'],
  ];
  const line = (vals) => vals.map((v, i) => i === 0 ? String(v).padEnd(cols[i][1]) : cols[i][1] ? String(v).padStart(cols[i][1]) : `  ${v}`).join('');
  if (bucketNote) out.push(`bucket columns skipped: ${bucketNote}`, '');
  out.push(line(cols.map(c => c[0])));
  for (const r of rows) {
    out.push(line(cols.map(c => c[2](r))));
    for (const p of r.problems) out.push(`    ✗ ${p}`);
    for (const n of r.notes) out.push(`    · ${n}`);
  }
  const t = (k) => rows.reduce((n, r) => n + (typeof r[k] === 'number' ? r[k] : 0), 0);
  const bad = rows.filter(r => r.problems.length).length;
  out.push('', `${rows.length} galleries · ${t('local')} local · ${t('processed')} processed · ${t('captioned')} captioned · ${bad ? `${bad} with problems` : 'no problems'}`);
  return out;
}

function authoredGalleries(dir) {
  const out = [];
  const walk = (abs, rel) => {
    if (!fs.existsSync(abs)) return;
    for (const e of fs.readdirSync(abs, { withFileTypes: true })) {
      if (e.isDirectory()) walk(path.join(abs, e.name), rel ? `${rel}/${e.name}` : e.name);
      else if (e.name.endsWith('.yml')) out.push(rel ? `${rel}/${e.name.slice(0, -4)}` : e.name.slice(0, -4));
    }
  };
  walk(dir, '');
  return out;
}

/**
 * Read everything and build the rows.
 * @returns {Promise<{rows:object[], bucketNote:string|null, unreachable:number}>}
 */
export async function collect({ gallery = null, offline = false, fetch = true } = {}) {
  const only = gallery ? cleanGallery(gallery) : null;
  const inScope = (g) => !only || g === only || g.startsWith(`${only}/`);

  let bucket = null, bucketNote = null;
  if (offline) bucketNote = '--offline';
  else {
    const { bucket: base, why } = originalsBucket();
    if (!base) bucketNote = why;
    else {
      const { remoteFiles } = await import('./plan.mjs');
      bucket = bucketGalleries(remoteFiles(only || '', base));
    }
  }

  const referenced = new Set(require('../check-gallery-integrity.js').referencedGalleries().keys());
  const galleries = [...new Set([
    ...referenced, ...galleriesUnder(PATHS.photosDir), ...(bucket ? bucket.keys() : []), ...authoredGalleries(PATHS.authoredDir),
  ])].filter(inScope).sort();

  let unreachable = 0;
  if (fetch) ({ unreachable } = await (await import('./fetch-manifests.mjs')).fetchAll({ galleries }));

  const rows = buildStatus({
    galleries, referenced, bucket,
    local: (g) => localGallery(g),
    merged: (g) => readMerged(g),
    authored: (g) => readAuthored(g),
    locations: (g) => readSidecar(g),
  });
  return { rows, bucketNote, unreachable };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { rows, bucketNote, unreachable } = await collect({ gallery: args.gallery, offline: !!args.offline, fetch: !args['no-fetch'] });
  if (unreachable) console.log(`note: ${unreachable} manifest(s) unreachable; their previous merge was used where one existed\n`);
  if (args.json) console.log(JSON.stringify(rows, null, 2));
  else for (const l of formatStatus(rows, { bucketNote })) console.log(l);
  return rows.some(r => r.problems.length) ? 1 : 0;
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) main().then(c => process.exit(c), e => { console.error(e); process.exit(2); });
