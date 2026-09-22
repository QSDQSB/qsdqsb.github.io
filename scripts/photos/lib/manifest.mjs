/**
 * Manifest shapes and the merge that produces what the site renders.
 *
 * Machine layer  (public bucket, <gallery>/manifest.json, written by the processor)
 *   { version, gallery, generated, photos: [ { slug, file, etag, w, h, taken, camera,
 *     lens, focal, aperture, shutter, iso, thumbhash, tint, sizes: {webp:[…],jpg:[…],avif:[…]} } ] }
 *
 * Authored layer (repo, _data/photos/<gallery>.yml, written by hand)
 *   title:    optional display override
 *   order:    [slug, …]   pinned first, in this sequence; the rest follow by capture time
 *   photos:
 *     <slug>:
 *       caption, caption_zh, alt, story, featured, hidden
 *
 * Merged (repo, _data/photo_manifests/<key>.json, gitignored, what Liquid reads)
 *   { gallery, key, base, title, count, photos: [ machine ∪ authored, ordered ] ,
 *     warnings: [ … ] }
 */

import { MANIFEST_VERSION, galleryKey } from './config.mjs';

export const AUTHORED_PHOTO_KEYS = ['caption', 'caption_zh', 'alt', 'story', 'story_zh', 'featured', 'hidden'];
export const AUTHORED_TOP_KEYS = ['title', 'order', 'photos'];

export function emptyManifest(gallery) {
  return { version: MANIFEST_VERSION, gallery, generated: null, photos: [] };
}

/** Sort: pinned slugs in their given order, then by capture time, then by slug. */
export function sortPhotos(photos, order = []) {
  const pin = new Map(order.map((s, i) => [String(s).toLowerCase(), i]));
  return [...photos].sort((a, b) => {
    const pa = pin.has(a.slug) ? pin.get(a.slug) : Infinity;
    const pb = pin.has(b.slug) ? pin.get(b.slug) : Infinity;
    if (pa !== pb) return pa - pb;
    const ta = a.taken || '', tb = b.taken || '';
    if (ta !== tb) return ta && tb ? ta.localeCompare(tb) : (ta ? -1 : 1);
    return a.slug.localeCompare(b.slug);
  });
}

/** Validate an authored YAML document. Returns a list of problems; empty means fine. */
export function validateAuthored(doc, where = 'authored') {
  const problems = [];
  if (doc == null) return problems;
  if (typeof doc !== 'object' || Array.isArray(doc)) return [`${where}: must be a mapping`];
  for (const k of Object.keys(doc)) if (!AUTHORED_TOP_KEYS.includes(k)) problems.push(`${where}: unknown top-level key "${k}"`);
  if (doc.order != null && !Array.isArray(doc.order)) problems.push(`${where}: "order" must be a list of slugs`);
  if (doc.photos != null) {
    if (typeof doc.photos !== 'object' || Array.isArray(doc.photos)) problems.push(`${where}: "photos" must be a mapping keyed by slug`);
    else for (const [slug, p] of Object.entries(doc.photos)) {
      if (p == null) continue;
      if (typeof p !== 'object') { problems.push(`${where}: photos.${slug} must be a mapping`); continue; }
      for (const k of Object.keys(p)) if (!AUTHORED_PHOTO_KEYS.includes(k)) problems.push(`${where}: photos.${slug}: unknown key "${k}"`);
      if (slug !== slug.toLowerCase()) problems.push(`${where}: photos.${slug}: slugs are lowercase`);
    }
  }
  return problems;
}

/**
 * @param {string} gallery      e.g. `prague/petrin-hill`
 * @param {object|null} machine public manifest
 * @param {object|null} authored parsed YAML
 * @param {string} base         public URL base, e.g. https://img.qsdqsb.com
 */
export function mergeManifest(gallery, machine, authored, base) {
  const warnings = [];
  const m = machine || emptyManifest(gallery);
  const a = authored || {};
  const aPhotos = a.photos || {};
  const known = new Set(m.photos.map(p => p.slug));

  if (!machine) warnings.push('no machine manifest: gallery not processed yet');
  else {
    for (const slug of Object.keys(aPhotos)) if (!known.has(slug)) warnings.push(`authored slug "${slug}" has no processed photo`);
    for (const slug of a.order || []) if (!known.has(String(slug).toLowerCase())) warnings.push(`order lists unknown slug "${slug}"`);
  }

  const photos = sortPhotos(
    m.photos.filter(p => !(aPhotos[p.slug] && aPhotos[p.slug].hidden))
      .map(p => ({ ...p, ...pickAuthored(aPhotos[p.slug]), url: `${base}/${gallery}/${p.slug}` })),
    a.order || [],
  );
  const unlisted = m.photos.filter(p => !aPhotos[p.slug]).length;

  return {
    gallery, key: galleryKey(gallery), base: `${base}/${gallery}`,
    title: a.title || null, generated: m.generated, count: photos.length, unlisted, photos, warnings,
  };
}

function pickAuthored(p) {
  if (!p) return {};
  const out = {};
  for (const k of AUTHORED_PHOTO_KEYS) if (p[k] != null && k !== 'hidden') out[k] = p[k];
  return out;
}
