#!/usr/bin/env node
/**
 * Bring camera originals from a staging folder into photos/, the first
 * step of adding a voyage (or new frames to one).
 *
 *   <from>/<gallery>/DSCF1797.JPG  →  photos/<gallery>/DSCF1797.jpg
 *
 * The staging folder mirrors photos/: one folder per gallery, nested for
 * sub-voyages. For every original in it:
 *
 *   - a frame photos/ already has keeps the file name photos/ uses, so the
 *     bucket key, slug, captions and URL all stay put (the camera's .JPG
 *     becomes the .jpg already there); a new frame keeps its camera name
 *   - it never replaces a file photos/ already holds, unless
 *     --replace-originals (a re-export after an edit)
 *   - byte-identical files are skipped, so a re-run does nothing
 *
 * Every file is verified before anything is copied (verifyOriginal):
 *
 *   decodes     the whole image decodes: not truncated, not corrupt
 *   camera      it carries camera make and capture time, as a camera file does
 *   same photo  against the original photos/ holds for that frame: the same
 *               aspect ratio within 1 %, and the same picture, by the
 *               correlation of 48×48 greyscale thumbnails ≥ 0.95. Calibrated
 *               on the first re-collection: true pairs scored ≥ 0.991, the
 *               closest different frames of one beach ≤ 0.76
 *   exposure    aperture, shutter, ISO against that original's; a
 *               difference is a warning, not a refusal
 *
 * A file failing any check is refused and nothing is copied. A new frame
 * has nothing to compare against and says so.
 *
 * The staging folder is only read, unless --move: then each file whose copy
 * in photos/ is byte-identical is removed from the staging folder, so it
 * empties as it is imported. Nothing touches R2: the next step is
 * `photos:recollect -- --gallery <g> --push` per gallery.
 *
 * A staging folder that is not a gallery (`uncategorised`) is sorted: each
 * file goes to the one gallery with the same frame and the same picture.
 * Files that fail verification, fit nowhere, or duplicate another staged
 * file are non-matches: left in place, listed, and discarded only when the
 * owner asks (`--discard`, which moves them to the macOS Trash).
 *
 * Usage: npm run photos:import [-- --from <dir>] [--gallery <name>] [--dry-run] [--move]
 *                              [--new-gallery <name>]… [--replace-originals] [--allow-no-exif]
 *        npm run photos:import -- --discard "<folder/file>"…
 * The staging folder defaults to PHOTOS_INBOX (~/Desktop/voyage originals).
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';
import { PATHS, env, parseArgs } from './lib/config.mjs';
import sharp from 'sharp';
import { galleriesUnder, localGallery, readHeadExif, cleanGallery } from './lib/inventory.mjs';
import { slugFor } from './lib/slug.mjs';

export const MATCH_THRESHOLD = 0.95;
const RATIO_TOLERANCE = 0.01;

async function signature(file) {
  return sharp(file).rotate().resize(48, 48, { fit: 'fill' }).greyscale().normalise().raw().toBuffer();
}
export function correlation(a, b) {
  const n = a.length; let ma = 0, mb = 0;
  for (let i = 0; i < n; i++) { ma += a[i]; mb += b[i]; }
  ma /= n; mb /= n;
  let c = 0, va = 0, vb = 0;
  for (let i = 0; i < n; i++) { const x = a[i] - ma, y = b[i] - mb; c += x * y; va += x * x; vb += y * y; }
  return va && vb ? c / Math.sqrt(va * vb) : 0;
}
async function orientedRatio(file) {
  const m = await sharp(file).metadata();
  const [w, h] = (m.orientation || 1) >= 5 ? [m.height, m.width] : [m.width, m.height];
  return w / h;
}

/** The original photos/ holds for this frame, which is what the site publishes, or null for a new frame. */
export async function publishedReference(gallery, slug, { photosDir = PATHS.photosDir } = {}) {
  const cur = localGallery(gallery, photosDir).files.find(f => f.slug === slug);
  if (!cur) return null;
  const x = await readHeadExif(cur.abs).catch(() => null);
  return { file: cur.abs, source: `photos/${gallery}/${cur.file}`, camera: x?.camera, taken: x?.taken, exposure: { aperture: x?.aperture, shutter: x?.shutter, iso: x?.iso } };
}

/**
 * Is this a genuine original of the photograph it claims to be?
 * @returns {{ok:boolean, checks:{name,ok,detail,warn?}[], reference:string|null}}
 */
export async function verifyOriginal(file, gallery, slug, { allowNoExif = false, reedit = false, ...dirs } = {}) {
  const checks = [];
  const add = (name, ok, detail, warn = false, extra = {}) => checks.push({ name, ok, detail, warn, ...extra });
  try { await sharp(file).stats(); add('decodes', true, 'whole image decodes'); }
  catch (e) { add('decodes', false, `does not decode: ${e.message}`); return { ok: false, checks, reference: null }; }

  const exif = await readHeadExif(file).catch(() => null);
  if (exif?.camera && exif?.taken) add('camera', true, `${exif.camera}, ${exif.taken}`);
  else add('camera', allowNoExif, `no ${exif?.camera ? 'capture time' : 'camera make'} in EXIF${allowNoExif ? ' (allowed by --allow-no-exif)' : '; an export that stripped metadata? --allow-no-exif to accept'}`, allowNoExif);

  const ref = await publishedReference(gallery, slug, dirs);
  if (!ref) { add('same photo', true, 'new frame: nothing in photos/ to compare against', true); }
  else {
    const [ra, rb] = await Promise.all([orientedRatio(file), orientedRatio(ref.file)]);
    const dr = Math.abs(ra - rb) / rb;
    const r = correlation(await signature(file), await signature(ref.file));
    const same = dr <= RATIO_TOLERANCE && r >= MATCH_THRESHOLD;
    // A new edit (--replace-originals) may be cropped differently: the same camera and capture time,
    // to the second, still make it the same frame. Said as a warning, never passed silently.
    const edit = !same && reedit && exif?.taken && exif.taken === ref.taken && exif.camera === ref.camera;
    if (edit) add('same photo', true, `a new edit of ${ref.source}: same camera and capture time, cropped differently (correlation ${r.toFixed(3)}, aspect Δ ${(dr * 100).toFixed(2)}%)`, true, { reedit: true });
    else add('same photo', same, `vs ${ref.source}: correlation ${r.toFixed(3)} (≥ ${MATCH_THRESHOLD}), aspect Δ ${(dr * 100).toFixed(2)}%`);
    const diffs = [];
    const l = ref.exposure || {};
    // Aperture within a third of a stop; shutter within 10 %.
    if (l.aperture && exif?.aperture && Math.abs(Math.log2(l.aperture / exif.aperture)) > 0.2) diffs.push(`f/${exif.aperture} vs f/${l.aperture}`);
    const secs = (s) => { const m = String(s).match(/^(\d+)\/(\d+)$/); return m ? m[1] / m[2] : Number(s); };
    if (l.shutter && exif?.shutter && Math.abs(secs(l.shutter) / secs(exif.shutter) - 1) > 0.1) diffs.push(`${exif.shutter}s vs ${l.shutter}s`);
    if (l.iso && exif?.iso && l.iso !== exif.iso) diffs.push(`ISO ${exif.iso} vs ${l.iso}`);
    add('exposure', true, diffs.length ? `differs from the original in photos/: ${diffs.join(', ')}` : 'matches the original in photos/', diffs.length > 0);
  }
  return { ok: checks.every(c => c.ok), checks, reference: ref ? ref.source : null };
}

const md5 = (f) => crypto.createHash('md5').update(fs.readFileSync(f)).digest('hex');

/** Every gallery in photos/ that has a frame: slug → Set<gallery>. */
function frameIndex(photosDir) {
  const idx = new Map();
  if (!fs.existsSync(photosDir)) return idx;
  for (const g of galleriesUnder(photosDir)) for (const f of localGallery(g, photosDir).files) {
    if (!idx.has(f.slug)) idx.set(f.slug, new Set());
    idx.get(f.slug).add(g);
  }
  return idx;
}

/**
 * A picture fingerprint of every original in photos/, for matching a file
 * whose name says nothing (an iCloud export renamed IMG_…, a copy named
 * "DSCF1797 (1)"). Cached in .photos-local/signatures.json by path, size and
 * modification time, so only new or changed files are read.
 */
export async function signatureIndex({ photosDir = PATHS.photosDir, cacheFile = path.join(PATHS.localStore, 'signatures.json') } = {}) {
  let cache = {};
  try { cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8')); } catch { /* first run */ }
  const refs = [];
  if (fs.existsSync(photosDir)) for (const g of galleriesUnder(photosDir)) for (const f of localGallery(g, photosDir).files) refs.push({ gallery: g, slug: f.slug, file: f.abs });
  const next = {}, out = [];
  for (const r of refs) {
    const st = fs.statSync(r.file), key = `${r.file}|${st.size}|${st.mtimeMs}`;
    let e = cache[key];
    if (!e) e = { sig: (await signature(r.file)).toString('base64'), ratio: await orientedRatio(r.file) };
    next[key] = e;
    out.push({ ...r, sig: Buffer.from(e.sig, 'base64'), ratio: e.ratio });
  }
  fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
  fs.writeFileSync(cacheFile, JSON.stringify(next));
  return out;
}

/** Best matches in photos/ for a file by picture alone, highest first. */
export async function matchByPicture(file, index, { threshold = MATCH_THRESHOLD } = {}) {
  const [sig, ratio] = await Promise.all([signature(file), orientedRatio(file)]);
  return index
    .filter(r => Math.abs(r.ratio - ratio) / r.ratio <= RATIO_TOLERANCE)
    .map(r => ({ gallery: r.gallery, slug: r.slug, score: correlation(sig, r.sig) }))
    .filter(m => m.score >= threshold)
    .sort((a, b) => b.score - a.score);
}

/** Every original in the staging folder, loose files at its root included. */
function stagedFiles(fromDir) {
  const out = [];
  const walk = (dir, rel) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name.startsWith('.')) continue;
      const abs = path.join(dir, e.name), r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) walk(abs, r);
      else if (/\.(jpe?g|png|tiff?|webp|heic)$/i.test(e.name)) out.push({ abs, rel: r, folder: rel, file: e.name, slug: slugFor(e.name) });
    }
  };
  walk(fromDir, '');
  return out.sort((a, b) => a.rel.localeCompare(b.rel));
}

/**
 * The gateway. For every file in the staging folder, find the voyage it
 * belongs to, verify it, and decide what to do. Folders are hints, never
 * trusted: the owner exports from iCloud Photos in whatever batches are at
 * hand. In order:
 *
 *   1. by name     galleries holding the same frame number, confirmed by
 *                  picture (frame numbers repeat across years and cameras)
 *   2. by picture  no frame fits: the closest photograph in photos/ by
 *                  fingerprint; the file is imported under that frame's
 *                  name so the slug, captions and URL survive
 *   3. by folder   the folder is a gallery (or named in `newGalleries`) and
 *                  nothing in photos/ matches: a new frame for that voyage
 *
 * An existing frame is only replaced with `replaceOriginals`; otherwise a
 * verified file for it is refused.
 *
 * Actions: replace | add | same (already imported) — verified;
 * refuse | unplaced | duplicate — non-matches, left in the staging folder
 * for the owner to see and decide on.
 */
export async function planImport(fromDir, { photosDir = PATHS.photosDir, gallery = null, replaceOriginals = false, allowNoExif = false, newGalleries = [], index = null } = {}) {
  const out = [];
  const frames = frameIndex(photosDir);
  const known = new Set([...(fs.existsSync(photosDir) ? galleriesUnder(photosDir) : []), ...newGalleries]);
  const seen = new Map(); // md5 → first staged path, to catch the same file staged twice
  const vopts = { allowNoExif, photosDir, reedit: replaceOriginals };
  const isMatch = (v) => v.ok && v.checks.some(c => c.name === 'same photo' && (!c.warn || c.reedit));
  let pictures = index;

  for (const src of stagedFiles(fromDir)) {
    const step = { folder: src.folder, gallery: src.folder, file: src.file, slug: src.slug, from: src.abs, rel: src.rel };
    const hash = md5(src.abs);
    if (seen.has(hash)) { out.push({ ...step, action: 'duplicate', why: `the same file as ${seen.get(hash)}` }); continue; }
    seen.set(hash, step.rel);

    let target = null, targetSlug = src.slug, verdict = null;
    // 1. by name: the folder's gallery first, then every other gallery with this frame.
    const byName = [...(frames.get(src.slug) || [])].sort((a, b) => (b === src.folder) - (a === src.folder));
    const tries = [];
    for (const g of byName) {
      const v = await verifyOriginal(src.abs, g, src.slug, vopts);
      tries.push({ g, v });
      if (isMatch(v)) { target = g; verdict = v; step.placed = g === src.folder ? null : `matched by name and picture to ${g}`; break; }
    }
    // 2. by picture: nothing by name, so search every photograph in photos/.
    if (!target) {
      pictures = pictures || await signatureIndex({ photosDir });
      const hits = await matchByPicture(src.abs, pictures);
      const best = hits[0];
      if (best && !(hits[1] && hits[1].gallery !== best.gallery && hits[1].score > best.score - 0.005)) {
        const v = await verifyOriginal(src.abs, best.gallery, best.slug, vopts);
        if (isMatch(v)) { target = best.gallery; targetSlug = best.slug; verdict = v; step.placed = `matched by picture to ${best.gallery}/${best.slug} (${best.score.toFixed(3)})`; }
      }
    }
    // 3. by folder: a voyage folder with a frame nothing in photos/ matches is a new frame.
    if (!target && known.has(src.folder) && !byName.length) {
      const v = await verifyOriginal(src.abs, src.folder, src.slug, vopts);
      if (v.ok) { target = src.folder; verdict = v; }
      else { out.push({ ...step, action: 'refuse', checks: v.checks, why: v.checks.filter(c => !c.ok).map(c => c.detail).join('; ') }); continue; }
    }
    if (!target) {
      const why = byName.length
        ? `frame ${src.slug} exists in ${byName.join(', ')}, but the picture is a different one (${tries.map(t => t.v.checks.find(c => c.name === 'same photo')?.detail).filter(Boolean).join('; ')})`
        : `matches no photograph in photos/ by name or by picture`;
      out.push({ ...step, action: 'unplaced', why, checks: tries[0]?.v.checks || [] });
      continue;
    }
    if (gallery && target !== gallery && !target.startsWith(`${gallery}/`)) continue;
    step.gallery = target; step.slug = targetSlug; step.checks = verdict.checks;
    if (!verdict.ok) { out.push({ ...step, action: 'refuse', why: verdict.checks.filter(c => !c.ok).map(c => c.detail).join('; ') }); continue; }

    const cur = localGallery(target, photosDir).files.find(f => f.slug === targetSlug);
    if (!cur) { out.push({ ...step, to: path.join(photosDir, ...target.split('/'), src.file), action: 'add' }); continue; }
    const to = cur.abs;
    if (cur.size === fs.statSync(src.abs).size && md5(cur.abs) === hash) { out.push({ ...step, to, action: 'same' }); continue; }
    if (!replaceOriginals) { out.push({ ...step, to, action: 'refuse', why: `${target}/${cur.file} is already an original; --replace-originals to overwrite it` }); continue; }
    out.push({ ...step, to, action: 'replace' });
  }
  return out;
}

export const NON_MATCH = new Set(['refuse', 'unplaced', 'duplicate']);

/** Move confirmed non-matches from the staging folder to the macOS Trash (restorable), never a hard delete. */
export function discard(fromDir, rels, trashDir = path.join(os.homedir(), '.Trash')) {
  const done = [];
  for (const rel of rels) {
    const abs = path.resolve(fromDir, rel);
    if (!abs.startsWith(path.resolve(fromDir) + path.sep) || !fs.existsSync(abs)) throw new Error(`not a file in ${fromDir}: ${rel}`);
    let dest = path.join(trashDir, path.basename(abs)), n = 1;
    while (fs.existsSync(dest)) dest = path.join(trashDir, `${path.parse(abs).name} ${++n}${path.extname(abs)}`);
    fs.mkdirSync(trashDir, { recursive: true });
    fs.renameSync(abs, dest);
    done.push({ rel, dest });
  }
  return done;
}

/**
 * Copy the planned files, keeping the source's modification time. With
 * `move`, a source file is removed once its copy is byte-identical (checked
 * after the copy, and for files imported on an earlier run).
 */
export function applyImport(plan, { move = false } = {}) {
  let copied = 0, moved = 0;
  for (const s of plan) {
    if (s.action === 'add' || s.action === 'replace') {
      fs.mkdirSync(path.dirname(s.to), { recursive: true });
      fs.copyFileSync(s.from, s.to);
      const st = fs.statSync(s.from);
      fs.utimesSync(s.to, st.atime, st.mtime);
      copied++;
    } else if (s.action !== 'same') continue;
    if (move && md5(s.to) === md5(s.from)) { fs.unlinkSync(s.from); moved++; }
  }
  return { copied, moved };
}

async function main() {
  const args = parseArgs(process.argv.slice(2), { multi: ['new-gallery', 'discard'] });
  const from = path.resolve(String(args.from || env.inbox).replace(/^~(?=$|\/)/, os.homedir()));
  if (!fs.existsSync(from)) { console.error(`no such folder: ${from} (set --from, or PHOTOS_INBOX)`); return 2; }

  if (args.discard) {
    for (const d of discard(from, args.discard)) console.log(`  ${d.rel} → Trash (${d.dest})`);
    return 0;
  }

  console.log(`Sorting ${from} …`);
  const plan = await planImport(from, {
    gallery: args.gallery ? cleanGallery(args.gallery) : null, replaceOriginals: !!args['replace-originals'],
    allowNoExif: !!args['allow-no-exif'], newGalleries: (args['new-gallery'] || []).map(cleanGallery),
  });
  if (!plan.length) { console.log(`nothing to import: ${from} holds no originals.`); return 0; }

  const label = (s) => ({ replace: 'replaces the original', add: 'new frame', same: 'already imported', refuse: 'REFUSED', unplaced: 'NOT PLACED', duplicate: 'DUPLICATE' }[s.action]);
  const byGallery = new Map();
  for (const s of plan.filter(s => !NON_MATCH.has(s.action))) (byGallery.get(s.gallery) || byGallery.set(s.gallery, []).get(s.gallery)).push(s);
  for (const [g, steps] of [...byGallery].sort()) {
    console.log(`\n${g}${fs.existsSync(path.join(PATHS.photosDir, ...g.split('/'))) ? '' : '  (new gallery)'}`);
    for (const s of steps) {
      console.log(`  ${s.rel.padEnd(34)} → ${path.basename(s.to).padEnd(15)} ${label(s)}${s.placed ? ` (${s.placed})` : ''}`);
      for (const c of s.checks || []) if (c.warn || !c.ok || args.verbose) console.log(`      ${c.ok ? (c.warn ? '!' : '✓') : '✗'} ${c.name}: ${c.detail}`);
    }
  }
  const bad = plan.filter(s => NON_MATCH.has(s.action));
  if (bad.length) {
    console.log(`\nNON-MATCHES: ${bad.length} file(s) stay in ${from} until you decide:`);
    for (const s of bad) console.log(`  ✗ ${s.rel.padEnd(34)} ${label(s)}: ${s.why}`);
    console.log(`  To discard one after checking it (moves it to the Trash): npm run photos:import -- --discard "<folder/file>"`);
  }

  const good = plan.filter(s => !NON_MATCH.has(s.action));
  const matched = good.filter(s => s.checks?.some(c => c.name === 'same photo' && c.ok && !c.warn)).length;
  console.log(`\nVerified ${good.length}: ${matched} match a photograph in photos/, ${good.length - matched} new frame(s). ${bad.length} non-match(es).`);
  if (args['dry-run']) { console.log(`Dry run: would copy ${good.filter(s => s.action !== 'same').length} file(s)${args.move ? ` and move ${good.length} out of ${from}` : ''}.`); return bad.length ? 1 : 0; }

  const { copied, moved } = applyImport(good, { move: !!args.move });
  console.log(`Copied ${copied} file(s) into photos/.${args.move ? ` Moved ${moved} verified file(s) out of ${from}; non-matches left in place.` : ` ${from} is unchanged.`}`);
  const touched = [...byGallery.keys()].sort();
  if (touched.length) console.log(`Next: ${touched.map(g => `npm run photos:recollect -- --gallery ${g}`).join('\n      ')}`);
  return bad.length ? 1 : 0;
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) main().then(c => process.exit(c), e => { console.error(e.message || e); process.exit(2); });
