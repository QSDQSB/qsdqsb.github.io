#!/usr/bin/env node
/**
 * Compare photos/ with the originals bucket and report, per gallery:
 *
 *   new       local files not yet uploaded
 *   changed   same name, different bytes
 *   orphan    in the bucket but no longer local (candidates for prune)
 *   referenced orphan   an orphan that _data/photos/<gallery>.yml still names
 *
 * Nothing is transferred or deleted. Exit 1 when a referenced orphan exists,
 * because prune would refuse it too: fix the YAML first.
 *
 * Usage: npm run photos:plan [-- --gallery <name>]
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import yaml from 'js-yaml';
import { env, PATHS, ORIGINAL_RE, parseArgs } from './lib/config.mjs';
import { rcloneVersion, remoteExists, lsjson } from './lib/rclone.mjs';
import { slugFor } from './lib/slug.mjs';

const args = parseArgs(process.argv.slice(2));

export function localFiles(root) {
  const out = new Map();
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name.startsWith('.')) continue;
      const abs = path.join(dir, e.name);
      if (e.isDirectory()) walk(abs);
      else if (ORIGINAL_RE.test(e.name)) {
        const rel = path.relative(root, abs).split(path.sep).join('/');
        out.set(rel, { size: fs.statSync(abs).size, md5: () => crypto.createHash('md5').update(fs.readFileSync(abs)).digest('hex') });
      }
    }
  };
  walk(root);
  return out;
}

/** Slugs the authored YAML for a gallery mentions (photos keys + order). */
export function referencedSlugs(gallery) {
  const file = path.join(PATHS.authoredDir, `${gallery}.yml`);
  if (!fs.existsSync(file)) return new Set();
  try {
    const doc = yaml.load(fs.readFileSync(file, 'utf8')) || {};
    return new Set([...Object.keys(doc.photos || {}), ...(doc.order || []).map(String)].map(s => s.toLowerCase()));
  } catch { return new Set(); }
}

export function diff(local, remote, sub = '') {
  const inScope = (k) => !sub || k === sub || k.startsWith(`${sub}/`);
  const report = new Map();
  const bucket = (g) => { if (!report.has(g)) report.set(g, { new: [], changed: [], orphan: [], referenced: [] }); return report.get(g); };
  for (const [key, l] of local) {
    if (!inScope(key)) continue;
    const g = path.posix.dirname(key), r = remote.get(key);
    if (!r) bucket(g).new.push(key);
    else if (r.size !== l.size || (r.md5 && r.md5 !== l.md5())) bucket(g).changed.push(key);
  }
  for (const key of remote.keys()) {
    if (!inScope(key) || local.has(key)) continue;
    if (key.startsWith('trash/') || key.split('/').some(s => s.startsWith('.')) || !ORIGINAL_RE.test(key)) continue;
    const g = path.posix.dirname(key);
    const refs = referencedSlugs(g);
    (refs.has(slugFor(path.posix.basename(key))) ? bucket(g).referenced : bucket(g).orphan).push(key);
  }
  return report;
}

export function remoteFiles(sub = '') {
  const base = `${env.rcloneRemote}:${env.originalsBucket}${sub ? `/${sub}` : ''}`;
  const out = new Map();
  for (const f of lsjson(base, { hash: true })) {
    const key = sub ? `${sub}/${f.Path}` : f.Path;
    out.set(key, { size: f.Size, md5: f.Hashes?.md5 || f.Hashes?.MD5 || null });
  }
  return out;
}

function main() {
  if (!rcloneVersion()) { console.error('rclone is not installed. See _docs/photos-pipeline.md → Local setup.'); return 2; }
  if (!remoteExists(env.rcloneRemote)) { console.error(`rclone remote "${env.rcloneRemote}:" is not configured.`); return 2; }
  const sub = args.gallery ? String(args.gallery).replace(/^\/+|\/+$/g, '') : '';
  const report = diff(localFiles(PATHS.photosDir), remoteFiles(sub), sub);

  let referenced = 0, any = false;
  for (const [g, r] of [...report].sort()) {
    const n = r.new.length + r.changed.length + r.orphan.length + r.referenced.length;
    if (!n) continue;
    any = true;
    console.log(`\n${g}`);
    for (const k of r.new) console.log(`  new        ${k}`);
    for (const k of r.changed) console.log(`  changed    ${k}`);
    for (const k of r.orphan) console.log(`  orphan     ${k}`);
    for (const k of r.referenced) { console.log(`  REFERENCED ${k}  ← still named in _data/photos/${g}.yml`); referenced++; }
  }
  if (!any) console.log('photos/ and the originals bucket agree.');
  else console.log('\nnew/changed upload with `npm run photos:push`; orphans move to trash with `npm run photos:prune -- --gallery <name>`.');
  if (referenced) console.log(`\n${referenced} orphan(s) are still referenced by authored YAML; remove them from the YAML before pruning.`);
  return referenced ? 1 : 0;
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) process.exit(main());
