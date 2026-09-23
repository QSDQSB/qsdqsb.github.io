/**
 * What the management scripts (status, captions, recollect, trash) need to
 * know about one gallery, read from the three places a photograph lives:
 *
 *   local     photos/<gallery>/*            the files on this machine
 *   bucket    <remote>:<originals>/<gallery>  what has been pushed (rclone)
 *   merged    _data/photo_manifests/<key>.json  what the processor rendered,
 *                                            merged with the authored YAML
 *   authored  _data/photos/<gallery>.yml     captions, order, stories
 *
 * Every reader takes its directory as an argument so tests can point it at
 * a temporary tree; the defaults are the real ones.
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { env, PATHS, ORIGINAL_RE, BOOTSTRAP_STAMP, galleryKey } from './config.mjs';
import { assignSlugs } from './slug.mjs';
import { validateAuthored } from './manifest.mjs';
import { rcloneVersion, remoteExists } from './rclone.mjs';

export const cleanGallery = (g) => String(g || '').replace(/^\/+|\/+$/g, '');

/** The rclone path of the originals bucket, or null with the reason when it cannot be reached. */
export function originalsBucket() {
  if (!rcloneVersion()) return { bucket: null, why: 'rclone is not installed' };
  if (!remoteExists(env.rcloneRemote)) return { bucket: null, why: `rclone remote "${env.rcloneRemote}:" is not configured` };
  return { bucket: `${env.rcloneRemote}:${env.originalsBucket}`, why: null };
}

/** Originals directly inside photos/<gallery>/ (not in sub-galleries), with the slug the processor will give each. */
export function localGallery(gallery, photosDir = PATHS.photosDir) {
  const dir = path.join(photosDir, ...gallery.split('/'));
  if (!fs.existsSync(dir)) return { dir, files: [], warnings: [] };
  const names = fs.readdirSync(dir, { withFileTypes: true })
    .filter(e => e.isFile() && !e.name.startsWith('.') && ORIGINAL_RE.test(e.name)).map(e => e.name);
  const { slugs, warnings } = assignSlugs(names);
  const files = slugs.map(({ file, slug }) => ({ file, slug, abs: path.join(dir, file), size: fs.statSync(path.join(dir, file)).size }));
  return { dir, files, warnings };
}

/** Every gallery that holds at least one original under `root` (a directory of galleries). */
export function galleriesUnder(root) {
  const out = [];
  const visit = (abs, rel) => {
    const entries = fs.readdirSync(abs, { withFileTypes: true });
    if (entries.some(e => e.isFile() && !e.name.startsWith('.') && ORIGINAL_RE.test(e.name))) out.push(rel);
    for (const d of entries.filter(e => e.isDirectory() && !e.name.startsWith('.'))) visit(path.join(abs, d.name), `${rel}/${d.name}`);
  };
  if (fs.existsSync(root)) for (const e of fs.readdirSync(root, { withFileTypes: true })) {
    if (e.isDirectory() && !e.name.startsWith('.')) visit(path.join(root, e.name), e.name);
  }
  return out.sort();
}

/** Bucket keys (from plan.remoteFiles) grouped into galleries, originals only: no trash/, no dotfiles. */
export function bucketGalleries(remote) {
  const out = new Map();
  for (const [key, meta] of remote) {
    if (key.startsWith('trash/') || key.split('/').some(s => s.startsWith('.')) || !ORIGINAL_RE.test(key)) continue;
    const g = path.posix.dirname(key);
    if (g === '.') continue;
    if (!out.has(g)) out.set(g, []);
    out.get(g).push({ file: path.posix.basename(key), key, ...meta });
  }
  for (const [g, files] of out) {
    const bySlug = new Map(assignSlugs(files.map(f => f.file)).slugs.map(s => [s.file, s.slug]));
    out.set(g, files.map(f => ({ ...f, slug: bySlug.get(f.file) })));
  }
  return out;
}

export function readAuthored(gallery, authoredDir = PATHS.authoredDir) {
  const file = path.join(authoredDir, `${gallery}.yml`);
  if (!fs.existsSync(file)) return { file, text: null, doc: null, problems: [] };
  const text = fs.readFileSync(file, 'utf8');
  try {
    const doc = yaml.load(text);
    return { file, text, doc, problems: validateAuthored(doc, `_data/photos/${gallery}.yml`) };
  } catch (e) { return { file, text, doc: null, problems: [`_data/photos/${gallery}.yml: ${e.message.split('\n')[0]}`] }; }
}

export function readMerged(gallery, mergedDir = PATHS.mergedDir) {
  const file = path.join(mergedDir, `${galleryKey(gallery)}.json`);
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}

const WORDS = ['caption', 'caption_zh', 'alt', 'story', 'story_zh'];

/** True when the authored entry carries words someone wrote (not just an empty scaffold). */
export function isCaptioned(entry) {
  return !!entry && typeof entry === 'object' && WORDS.some(k => typeof entry[k] === 'string' && entry[k].trim());
}

/**
 * Slugs whose loss would destroy authored work: any written field, a
 * featured or hidden flag, or a place in the pinned order.
 */
export function authoredWork(doc) {
  const out = new Map();
  const photos = (doc && doc.photos) || {};
  for (const [slug, e] of Object.entries(photos)) {
    const why = [];
    if (isCaptioned(e)) why.push('captioned');
    if (e && e.featured) why.push('featured');
    if (e && e.hidden) why.push('hidden');
    if (why.length) out.set(slug.toLowerCase(), why);
  }
  for (const s of (doc && doc.order) || []) {
    const slug = String(s).toLowerCase();
    out.set(slug, [...(out.get(slug) || []), 'pinned in order']);
  }
  return out;
}

/**
 * True for a compressed copy the bootstrap made: it carries BOOTSTRAP_STAMP
 * in EXIF Software. Anything else is an original.
 *
 * Transitional: this, the `compressed` column in photos:status, and the
 * "still the compressed copy" count in photos:recollect exist only to track
 * the re-collection. Remove them together once every gallery reports
 * compressed 0 (see _docs/photos-pipeline.md → Re-collecting the originals).
 */
export const isCompressedCopy = (exif) => !!exif && exif.software === BOOTSTRAP_STAMP;

/**
 * EXIF from the head of a file. JPEG and TIFF keep their metadata in the
 * first segments, so 512 KB is enough and a 25 MB camera file is not read whole.
 */
export async function readHeadExif(abs, bytes = 512 * 1024) {
  const { readExif } = await import('./exif.mjs');
  const fd = fs.openSync(abs, 'r');
  try {
    const buf = Buffer.alloc(Math.min(bytes, fs.fstatSync(fd).size));
    fs.readSync(fd, buf, 0, buf.length, 0);
    return await readExif(buf);
  } finally { fs.closeSync(fd); }
}
