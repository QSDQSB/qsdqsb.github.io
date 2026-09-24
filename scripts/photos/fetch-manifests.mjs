#!/usr/bin/env node
/**
 * Pre-build step: merge each gallery's machine manifest (from the public
 * bucket) with its authored YAML (from the repo) into the JSON Liquid reads.
 *
 *   in   https://img.qsdqsb.com/<gallery>/manifest.json   (or --local <dir>)
 *   in   _data/photos/<gallery>.yml
 *   in   _data/photo_locations/<gallery>.yml               place names, when located
 *   out  _data/photo_manifests/<key>.json                  (gitignored)
 *   out  _data/photo_manifests/_index.json                 summary + warnings
 *
 * Galleries are the `gallery_name` values referenced by _voyage and
 * _subvoyage frontmatter, so a voyage with no processed photos still gets
 * an (empty, flagged) manifest rather than a Liquid nil.
 *
 * Never fails the build: an unreachable bucket keeps the previously merged
 * file when there is one and reports it. `--strict` turns warnings into a
 * non-zero exit for CI.
 *
 * Usage: npm run photos:fetch [-- --local <dir>] [--strict] [--quiet]
 *        npm run photos:fetch -- --shape _data/photos/<gallery>.yml [--strict]
 *
 * `--shape <file>` checks one authored YAML file's shape and nothing else:
 * no network, no merge, nothing written. The edit hook runs it.
 */

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import yaml from 'js-yaml';
import { env, PATHS, MANIFEST_FILE, galleryKey, parseArgs } from './lib/config.mjs';
import { FsStore } from './lib/store.mjs';
import { mergeManifest, validateAuthored } from './lib/manifest.mjs';
import { bookOf } from './lib/book.mjs';

const require = createRequire(import.meta.url);
const { referencedGalleries } = require('../check-gallery-integrity.js');

const args = parseArgs(process.argv.slice(2));
// Per-request and whole-run ceilings. Galleries are fetched in parallel, so
// an unreachable or slow host costs the build seconds, never minutes.
const TIMEOUT_MS = 5000;
const BUDGET_MS = 30000;
const PARALLEL = 8;

async function fetchMachine(gallery, local, signal) {
  if (local) return local.getJson(`${gallery}/${MANIFEST_FILE}`);
  const url = `${env.publicBase}/${gallery}/${MANIFEST_FILE}`;
  const r = await fetch(url, { signal: AbortSignal.any([signal, AbortSignal.timeout(TIMEOUT_MS)]) });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`${r.status} from ${url}`);
  return r.json();
}

/** Run `fn` over `items` with at most `limit` in flight; results keep input order. */
async function mapLimited(items, limit, fn) {
  const out = new Array(items.length); let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    for (let i = next++; i < items.length; i = next++) out[i] = await fn(items[i], i);
  }));
  return out;
}

/** The locate sidecar's `photos` map (names only, never coordinates), or an empty one. */
function readLocations(gallery) {
  const file = path.join(PATHS.locationsDir, `${gallery}.yml`);
  try { return (yaml.load(fs.readFileSync(file, 'utf8')) || {}).photos || {}; } catch { return {}; }
}

function readAuthored(gallery) {
  const file = path.join(PATHS.authoredDir, `${gallery}.yml`);
  if (!fs.existsSync(file)) return { doc: null, problems: [] };
  try {
    const doc = yaml.load(fs.readFileSync(file, 'utf8'));
    return { doc, problems: validateAuthored(doc, `_data/photos/${gallery}.yml`) };
  } catch (e) { return { doc: null, problems: [`_data/photos/${gallery}.yml: ${e.message.split('\n')[0]}`] }; }
}

export async function fetchAll({ local = null, galleries = null } = {}) {
  const names = galleries || [...referencedGalleries().keys()].sort();
  fs.mkdirSync(PATHS.mergedDir, { recursive: true });
  const index = { generated: new Date().toISOString(), base: env.publicBase, galleries: {} };
  let unreachable = 0;

  // One budget for the whole run: when it expires, every fetch still in
  // flight aborts and those galleries fall back like any unreachable one.
  const budget = new AbortController();
  const budgetTimer = setTimeout(() => budget.abort(new Error(`fetch budget of ${BUDGET_MS} ms exhausted`)), BUDGET_MS);
  const fetched = await mapLimited(names, PARALLEL, async (gallery) => {
    try { return { machine: await fetchMachine(gallery, local, budget.signal), error: null }; }
    catch (e) { return { machine: null, error: e.cause?.message || e.message }; }
  });
  clearTimeout(budgetTimer);

  names.forEach((gallery, i) => {
    const out = path.join(PATHS.mergedDir, `${galleryKey(gallery)}.json`);
    const { doc, problems } = readAuthored(gallery);
    const { machine, error } = fetched[i];
    let note = null;
    if (error) {
      unreachable++;
      if (fs.existsSync(out)) { note = `bucket unreachable (${error}); kept the previous merge`; index.galleries[gallery] = { ...summary(JSON.parse(fs.readFileSync(out, 'utf8'))), note }; return; }
      note = `bucket unreachable (${error}); no previous merge`;
    }
    // The Photobook's layer (rows, cover, colophon, place, light, glow) is worked out here, once.
    const merged = bookOf(mergeManifest(gallery, machine, doc, env.publicBase), readLocations(gallery));
    merged.warnings.push(...problems);
    if (note) merged.warnings.push(note);
    fs.writeFileSync(out, JSON.stringify(merged, null, 2) + '\n');
    index.galleries[gallery] = summary(merged);
  });
  fs.writeFileSync(path.join(PATHS.mergedDir, '_index.json'), JSON.stringify(index, null, 2) + '\n');
  return { index, unreachable };
}
const summary = (m) => ({ key: m.key, count: m.count, unlisted: m.unlisted, processed: !!m.generated, warnings: m.warnings });

/** Shape-check one authored file. Returns its problems; an empty list means it would merge cleanly. */
export function checkShape(file) {
  const rel = path.relative(PATHS.authoredDir, path.resolve(file));
  if (rel.startsWith('..') || !rel.endsWith('.yml')) return [`${file}: not a YAML file under _data/photos/`];
  const gallery = rel.slice(0, -'.yml'.length).split(path.sep).join('/');
  return readAuthored(gallery).problems;
}

async function main() {
  if (args.shape) {
    const problems = checkShape(String(args.shape));
    for (const p of problems) console.log(p);
    if (!problems.length) console.log(`OK ${args.shape}`);
    return args.strict && problems.length ? 1 : 0;
  }
  const local = args.local ? new FsStore(path.join(typeof args.local === 'string' ? args.local : PATHS.localStore, 'public')) : null;
  const { index, unreachable } = await fetchAll({ local });
  const rows = Object.entries(index.galleries);
  let warned = 0;
  if (!args.quiet) {
    for (const [g, s] of rows) {
      const flag = !s.processed ? 'unprocessed' : `${s.count} photos${s.unlisted ? `, ${s.unlisted} uncaptioned` : ''}`;
      console.log(`  ${g.padEnd(32)} ${flag}`);
      for (const w of s.warnings) { console.log(`    ! ${w}`); warned++; }
    }
  } else warned = rows.reduce((n, [, s]) => n + s.warnings.length, 0);
  console.log(`photo manifests: ${rows.length} galleries → ${path.relative(process.cwd(), PATHS.mergedDir)}/ (${warned} warning(s)${unreachable ? `, ${unreachable} unreachable` : ''})`);
  return args.strict && warned ? 1 : 0;
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) main().then(c => process.exit(c), e => { console.error(e); process.exit(2); });
