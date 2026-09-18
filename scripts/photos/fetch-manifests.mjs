#!/usr/bin/env node
/**
 * Pre-build step: merge each gallery's machine manifest (from the public
 * bucket) with its authored YAML (from the repo) into the JSON Liquid reads.
 *
 *   in   https://img.qsdqsb.com/<gallery>/manifest.json   (or --local <dir>)
 *   in   _data/photos/<gallery>.yml
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
 */

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import yaml from 'js-yaml';
import { env, PATHS, MANIFEST_FILE, galleryKey, parseArgs } from './lib/config.mjs';
import { FsStore } from './lib/store.mjs';
import { mergeManifest, validateAuthored } from './lib/manifest.mjs';

const require = createRequire(import.meta.url);
const { referencedGalleries } = require('../check-gallery-integrity.js');

const args = parseArgs(process.argv.slice(2));
const TIMEOUT_MS = 10000;

async function fetchMachine(gallery, local) {
  if (local) return local.getJson(`${gallery}/${MANIFEST_FILE}`);
  const url = `${env.publicBase}/${gallery}/${MANIFEST_FILE}`;
  const r = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`${r.status} from ${url}`);
  return r.json();
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

  for (const gallery of names) {
    const out = path.join(PATHS.mergedDir, `${galleryKey(gallery)}.json`);
    const { doc, problems } = readAuthored(gallery);
    let machine = null, note = null;
    try { machine = await fetchMachine(gallery, local); }
    catch (e) {
      unreachable++;
      if (fs.existsSync(out)) { note = `bucket unreachable (${e.message}); kept the previous merge`; index.galleries[gallery] = { ...summary(JSON.parse(fs.readFileSync(out, 'utf8'))), note }; continue; }
      note = `bucket unreachable (${e.message}); no previous merge`;
    }
    const merged = mergeManifest(gallery, machine, doc, env.publicBase);
    merged.warnings.push(...problems);
    if (note) merged.warnings.push(note);
    fs.writeFileSync(out, JSON.stringify(merged, null, 2) + '\n');
    index.galleries[gallery] = summary(merged);
  }
  fs.writeFileSync(path.join(PATHS.mergedDir, '_index.json'), JSON.stringify(index, null, 2) + '\n');
  return { index, unreachable };
}
const summary = (m) => ({ key: m.key, count: m.count, unlisted: m.unlisted, processed: !!m.generated, warnings: m.warnings });

async function main() {
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
