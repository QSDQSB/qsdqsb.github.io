#!/usr/bin/env node
/**
 * Pre-build step: merge each gallery's machine manifest (from the locked
 * originals bucket) with its authored YAML (from the repo) into the JSON
 * Liquid reads.
 *
 *   in   r2 qsdqsb-originals/<gallery>/manifest.json      (or --local <dir>)
 *   in   _data/photos/<gallery>.yml
 *   in   _data/photo_locations/<gallery>.yml               place names, when located
 *   out  _data/photo_manifests/<key>.json                  (gitignored)
 *   out  _data/photo_manifests/_index.json                 summary + warnings
 *
 * Galleries are the `gallery_name` values referenced by _voyage and
 * _subvoyage frontmatter, so a voyage with no processed photos still gets
 * an (empty, flagged) manifest rather than a Liquid nil.
 *
 * The manifests are private, so reading them needs credentials: R2_ACCOUNT_ID,
 * R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY in the environment (a read-only
 * key, set in the Cloudflare Pages build settings), else the local `r2:`
 * rclone remote. Nothing is read from the public host.
 *
 * Without access (a fresh clone, a sandbox), or when the read fails, each
 * gallery keeps its previously merged file when there is one, and the
 * summary says why. On Cloudflare Pages (CF_PAGES) a failed read fails the
 * build instead, so the last good deploy stays live rather than an empty
 * one going out. `--strict` turns warnings into a non-zero exit for CI.
 *
 * Usage: npm run photos:fetch [-- --local <dir>] [--strict] [--quiet]
 *        npm run photos:fetch -- --shape _data/photos/<gallery>.yml [--strict]
 *
 * `--shape <file>` checks one authored YAML file's shape and nothing else:
 * no network, no merge, nothing written. The edit hook runs it.
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import yaml from 'js-yaml';
import { env, PATHS, MANIFEST_FILE, galleryKey, parseArgs } from './lib/config.mjs';
import { FsStore, R2Store } from './lib/store.mjs';
import { rcloneVersion, remoteExists } from './lib/rclone.mjs';
import { mergeManifest, validateAuthored } from './lib/manifest.mjs';
import { bookOf } from './lib/book.mjs';

const require = createRequire(import.meta.url);
const { referencedGalleries } = require('../check-gallery-integrity.js');

const args = parseArgs(process.argv.slice(2));
// The rclone read's ceiling; galleries are fetched in parallel.
const TIMEOUT_MS = 5000;
const PARALLEL = 8;

// The private manifests: through the S3 API with the build's key, or the local rclone remote.
const creds = { accountId: env.accountId, accessKeyId: env.accessKeyId, secretAccessKey: env.secretAccessKey };
const r2 = creds.accountId && creds.accessKeyId && creds.secretAccessKey ? new R2Store(env.originalsBucket, creds) : null;
const viaRclone = !r2 && rcloneVersion() && remoteExists(env.rcloneRemote);
// Why the private read failed, when it did (a key without access, a wrong secret…): said once.
let privateError = null;
const NO_ACCESS = 'no access to the private manifests: set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY, or the rclone remote';

async function privateManifest(gallery) {
  const key = `${gallery}/${MANIFEST_FILE}`;
  if (r2) return r2.getJson(key);
  if (viaRclone) {
    const r = spawnSync('rclone', ['cat', `${env.rcloneRemote}:${env.originalsBucket}/${key}`], { encoding: 'utf8', timeout: TIMEOUT_MS * 2 });
    return r.status === 0 && r.stdout.trim() ? JSON.parse(r.stdout) : null;
  }
  return null;
}

// A manifest not there (a gallery nothing processed yet) is null; no access, or a read that fails,
// is an error, so the gallery keeps its previous merge rather than going empty.
async function fetchMachine(gallery, local) {
  if (local) return local.getJson(`${gallery}/${MANIFEST_FILE}`);
  if (!r2 && !viaRclone) { privateError ||= NO_ACCESS; throw new Error(NO_ACCESS); }
  try { return await privateManifest(gallery); }
  catch (e) { privateError ||= `the private read failed (${`${e.name || 'Error'}: ${e.message}`.slice(0, 160)})`; throw e; }
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

  const fetched = await mapLimited(names, PARALLEL, async (gallery) => {
    try { return { machine: await fetchMachine(gallery, local), error: null }; }
    catch (e) { return { machine: null, error: e.cause?.message || e.message }; }
  });

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
  const source = local ? 'local store' : r2 ? 'private, R2 key' : viaRclone ? 'private, rclone' : 'no private access';
  console.log(`photo manifests: ${rows.length} galleries → ${path.relative(process.cwd(), PATHS.mergedDir)}/ (${source}; ${warned} warning(s)${unreachable ? `, ${unreachable} unreachable` : ''})`);
  if (privateError) {
    console.log(`photo manifests: ${privateError}; each gallery kept its previous merge where there was one`);
    // On Cloudflare a build without its photographs must not go live: failing keeps the last good deploy.
    if (process.env.CF_PAGES) { console.error('photo manifests: failing the build so the site stays as it was'); return 1; }
  }
  return args.strict && warned ? 1 : 0;
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) main().then(c => process.exit(c), e => { console.error(e); process.exit(2); });
