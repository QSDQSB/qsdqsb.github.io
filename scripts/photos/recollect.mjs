#!/usr/bin/env node
/**
 * The re-collection check. Run it after dropping a voyage's camera files
 * into photos/<gallery>/ and before pushing them. It compares what is local
 * now with what the gallery already has (the bucket listing, or the
 * processed manifest when the bucket cannot be read) and with the authored
 * YAML, and reports:
 *
 *   matched     existing slugs with a local file; of those, how many are
 *               byte-identical to what the bucket holds
 *   new         local files no existing slug knows
 *   renamed     same frame, different file name than the bucket holds
 *               (DSCF1797.JPG from the camera vs DSCF1797.jpg in the
 *               bucket). R2 keys are case-sensitive, so pushing as-is
 *               would leave the old key beside the new one and the site
 *               would show both, the second as dscf1797-2
 *   vanishing   existing slugs with no local file; the ones carrying
 *               authored work (caption, story, featured, hidden, pinned
 *               order) are listed as such
 *   collisions  two local files for one frame
 *
 * Refuses (exit 1) while a slug with authored work would vanish, unless
 * --allow-drop; while two local files share a frame; and while a file is
 * renamed, unless --rename, which renames the local file to the name the
 * bucket already holds so the key, the slug, and the captions all stay put.
 * With --push, a clean check goes straight on to `photos:push` for the gallery.
 *
 * Usage: npm run photos:recollect -- --gallery <name> [--rename] [--allow-drop] [--push] [--offline]
 */

import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseArgs } from './lib/config.mjs';
import { frameFromName } from './lib/slug.mjs';
import {
  cleanGallery, originalsBucket, localGallery, bucketGalleries, readAuthored, readMerged,
  authoredWork,
} from './lib/inventory.mjs';

/**
 * Pure comparison.
 * @param {object} input
 * @param {{file,slug,size,md5?}[]} input.local
 * @param {{file,slug,size?}[]} input.baseline   what the gallery holds now (bucket or manifest)
 * @param {boolean} input.baselineHasSizes       true when baseline sizes came from the bucket
 * @param {object|null} input.doc                authored YAML
 * @param {string[]} input.collisions            slug-collision warnings from the local listing
 */
export function compareRecollection({ local, baseline, baselineHasSizes = false, doc = null, collisions = [] }) {
  const work = authoredWork(doc);
  const base = new Map(baseline.map(b => [b.slug, b]));
  const named = new Set(Object.keys((doc && doc.photos) || {}).map(s => s.toLowerCase()));
  const existing = new Set([...base.keys(), ...named, ...work.keys()]);
  const localBySlug = new Map(local.map(f => [f.slug, f]));

  const matched = local.filter(f => existing.has(f.slug));
  const report = {
    matched: matched.map(f => f.slug),
    // Same size is not same bytes: compare checksums when both sides have one.
    unchanged: baselineHasSizes ? matched.filter(f => {
      const b = base.get(f.slug);
      return b?.size === f.size && (!b.md5 || !f.md5 || b.md5 === f.md5);
    }).map(f => f.slug) : [],
    new: local.filter(f => !existing.has(f.slug)).map(f => ({ slug: f.slug, file: f.file })),
    renamed: matched.filter(f => base.get(f.slug) && base.get(f.slug).file !== f.file)
      .map(f => ({ slug: f.slug, local: f.file, bucket: base.get(f.slug).file, safe: sameFormat(f.file, base.get(f.slug).file) })),
    vanishing: [...existing].filter(s => !localBySlug.has(s)).sort()
      .map(s => ({ slug: s, file: base.get(s)?.file || null, work: work.get(s) || [] })),
    noFrame: local.filter(f => !frameFromName(f.file)).map(f => f.file),
    collisions,
  };
  report.dropsWork = report.vanishing.filter(v => v.work.length);
  return report;
}

/** Two names for one file format: only letter case differs, or `.jpeg` vs `.jpg`. Renaming between these never lies about the bytes. */
export function sameFormat(a, b) {
  const norm = (n) => n.toLowerCase().replace(/\.jpeg$/, '.jpg');
  return norm(a) === norm(b);
}

export function formatRecollection(gallery, r, { source }) {
  const out = [];
  const list = (xs, n = 8) => xs.length <= n ? xs.join(', ') : `${xs.slice(0, n).join(', ')} … (+${xs.length - n})`;
  out.push(`${gallery}: compared against ${source}`);
  out.push(`  matched     ${String(r.matched.length).padStart(3)}${r.unchanged.length ? `  ${r.unchanged.length} byte-identical to the bucket` : ''}`);
  out.push(`  new         ${String(r.new.length).padStart(3)}  ${list(r.new.map(n => n.slug)) || '—'}`);
  if (r.renamed.length) {
    out.push(`  renamed     ${String(r.renamed.length).padStart(3)}  the bucket holds another name for the same frame:`);
    for (const x of r.renamed) out.push(`                ${x.local}  (bucket: ${x.bucket})${x.safe ? '' : '  format change'}`);
  }
  out.push(`  vanishing   ${String(r.vanishing.length).padStart(3)}  ${list(r.vanishing.map(v => v.work.length ? `${v.slug} [${v.work.join(', ')}]` : v.slug)) || '—'}`);
  for (const w of r.collisions) out.push(`  collision        ${w}`);
  if (r.noFrame.length) out.push(`  no frame number: ${list(r.noFrame)} (their slugs come from the file name instead)`);
  return out;
}

export function blockers(r, { allowDrop = false, rename = false } = {}) {
  const out = [];
  if (r.dropsWork.length && !allowDrop) out.push(`${r.dropsWork.length} slug(s) with authored work would vanish: ${r.dropsWork.map(v => v.slug).join(', ')}. Put their files back, remove them from the YAML, or pass --allow-drop.`);
  if (r.collisions.length) out.push('two local files share a frame; keep one of each.');
  const fixable = r.renamed.filter(x => x.safe);
  if (fixable.length && !rename) out.push(`${fixable.length} file(s) are named differently from the bucket; --rename gives them the bucket's names so nothing is duplicated.`);
  return out;
}

/** Rename local files to the names the bucket holds. Returns the renames done, or throws before touching anything if one would clobber a different file. */
export function applyRenames(dir, renamed) {
  renamed = renamed.filter(x => x.safe);
  for (const x of renamed) {
    const to = path.join(dir, x.bucket);
    const caseOnly = x.local.toLowerCase() === x.bucket.toLowerCase();
    if (!caseOnly && fs.existsSync(to)) throw new Error(`cannot rename ${x.local} → ${x.bucket}: ${x.bucket} already exists`);
  }
  for (const x of renamed) fs.renameSync(path.join(dir, x.local), path.join(dir, x.bucket));
  return renamed;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const gallery = cleanGallery(args.gallery);
  if (!gallery) { console.error('usage: npm run photos:recollect -- --gallery <name> [--rename] [--allow-drop] [--push] [--offline]'); return 2; }

  const { dir, files, warnings } = localGallery(gallery);
  if (!files.length) { console.error(`nothing in ${path.relative(process.cwd(), dir)}/ to compare.`); return 2; }
  const local = files.map(f => ({ ...f, md5: crypto.createHash('md5').update(fs.readFileSync(f.abs)).digest('hex') }));

  let baseline = [], source, hasSizes = false;
  const { bucket, why } = args.offline ? { bucket: null, why: '--offline' } : originalsBucket();
  if (bucket) {
    const { remoteFiles } = await import('./plan.mjs');
    baseline = bucketGalleries(remoteFiles(gallery, bucket)).get(gallery) || [];
    source = `the bucket (${baseline.length} original(s))`; hasSizes = true;
  } else {
    baseline = readMerged(gallery)?.inventory || [];
    source = `the processed manifest (${baseline.length} photo(s)); bucket not read: ${why}`;
  }
  const { doc, problems } = readAuthored(gallery);
  if (problems.length) { for (const p of problems) console.error(`  ✗ ${p}`); return 1; }

  const r = compareRecollection({ local, baseline, baselineHasSizes: hasSizes, doc, collisions: warnings });
  for (const l of formatRecollection(gallery, r, { source })) console.log(l);

  const stop = blockers(r, { allowDrop: !!args['allow-drop'], rename: !!args.rename });
  if (stop.length) { console.log(''); for (const s of stop) console.log(`✗ ${s}`); return 1; }

  const renamed = applyRenames(dir, r.renamed);
  if (renamed.length) console.log(`\nRenamed ${renamed.length} local file(s) to the bucket's names.`);
  const formatChanges = r.renamed.filter(x => !x.safe);
  if (formatChanges.length) console.log(`\n${formatChanges.length} frame(s) change format. After the push the bucket holds both files and the site shows the old one until \`photos:prune -- --gallery ${gallery}\` retires it; prune straight after pushing.`);
  if (r.vanishing.length) console.log(`\nAfter the push, \`npm run photos:plan -- --gallery ${gallery}\` lists the ${r.vanishing.length} vanished original(s) and \`npm run photos:prune -- --gallery ${gallery}\` moves them to trash.`);
  if (!args.push) { console.log(`\nClean. Next: npm run photos:push -- --gallery ${gallery}`); return 0; }

  console.log('');
  const push = spawnSync(process.execPath, [fileURLToPath(new URL('./push.mjs', import.meta.url)), '--gallery', gallery], { stdio: 'inherit' });
  return push.status ?? 1;
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) main().then(c => process.exit(c), e => { console.error(e.message || e); process.exit(2); });
