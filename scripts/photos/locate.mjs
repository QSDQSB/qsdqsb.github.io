#!/usr/bin/env node
/**
 * Suggest where each photograph was taken, as a street or a landmark
 * nearby, for the owner to accept into the captions. Never writes the
 * authored YAML; writes a sidecar:
 *
 *   _data/photo_locations/<gallery>.yml   (committed; names only, no coordinates)
 *
 * Per photo, one of:
 *
 *   gps: present   the original carries GPS: reverse-geocoded against
 *                  OpenStreetMap (lib/reverse-geocode.mjs): a well-known
 *                  landmark, square, park or inn nearby, else the road
 *   gps: missing   no coordinates (a compressed copy, or a camera without a
 *                  fix): a guess from looking at the picture, recorded as
 *                  `source: visual guess` so nobody mistakes it for a fix
 *
 * The coordinates themselves stay private: in the original's EXIF, in the
 * bucket's .private.json, and in a gitignored lookup cache.
 *
 *   gps: missing   a compressed copy: `source: awaiting original`. Its old
 *                  caption stands until the camera original arrives with GPS.
 *
 * Usage:
 *   npm run photos:locate -- --gallery <name> | --all      geocode what has GPS, list what does not
 *   npm run photos:locate -- --all --sheets                contact sheets of originals without GPS, to look at
 *   npm run photos:locate -- --gallery <name> --set dscf1148="Porthcurno Beach, Penzance, UK" …
 *   npm run photos:locate -- --gallery <name> --accept [dscf1797,dscf2245]
 *                  suggestions into captions, only over captions nobody wrote by hand
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import sharp from 'sharp';
import { PATHS, ROOT, galleryKey, parseArgs } from './lib/config.mjs';
import { cleanGallery, localGallery, readHeadExif, readAuthored, isCompressedCopy } from './lib/inventory.mjs';
import { locate } from './lib/reverse-geocode.mjs';

export const LOCATIONS_DIR = path.join(ROOT, '_data', 'photo_locations');
const sidecarFile = (g, dir = LOCATIONS_DIR) => path.join(dir, `${g}.yml`);

export function readSidecar(g, dir = LOCATIONS_DIR) {
  try { return (yaml.load(fs.readFileSync(sidecarFile(g, dir), 'utf8')) || {}).photos || {}; } catch { return {}; }
}
export function writeSidecar(g, photos, dir = LOCATIONS_DIR) {
  const f = sidecarFile(g, dir);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  const sorted = Object.fromEntries(Object.keys(photos).sort().map(k => [k, photos[k]]));
  fs.writeFileSync(f, `# Suggested locations for gallery ${g}, written by npm run photos:locate.\n`
    + `# gps: present → reverse-geocoded from the original's GPS (© OpenStreetMap contributors).\n`
    + `# gps: missing → a visual guess, imprecise by design. No coordinates are stored here.\n`
    + yaml.dump({ photos: sorted }, { lineWidth: 120, quotingType: '"' }));
  return f;
}

const COUNTRY_ALIASES = { gb: ['uk', 'united kingdom', 'england', 'scotland', 'wales'], us: ['usa', 'us', 'united states'] };

/**
 * The tail a voyage's captions already end with ("London", "UK",
 * "Italy"): the most common last part of its authored captions, so a
 * suggestion reads like its neighbours.
 */
export function captionSuffix(doc) {
  const tails = Object.values(doc?.photos || {}).map(p => String(p?.caption || '').split(',').pop().trim()).filter(Boolean);
  const count = new Map(); for (const t of tails) count.set(t, (count.get(t) || 0) + 1);
  return [...count].sort((a, b) => b[1] - a[1])[0]?.[0] || null;
}

/**
 * House style for a place, as the voyages already caption: a landmark, a
 * square, a park, an inn, else the road; then the voyage's usual tail.
 * A city voyage keeps two parts ("East Smithfield, London"); a regional or
 * country voyage names the town between ("Porthcurno Beach, Penzance, UK").
 */
export function compose(place, suffix) {
  const s = (suffix || '').toLowerCase();
  const isCountry = !!s && (s === String(place.country || '').toLowerCase() || (COUNTRY_ALIASES[place.country_code] || []).includes(s));
  const tail = suffix || place.city || place.country;
  const name = place.landmark || place.street || place.area || place.city;
  const parts = isCountry ? [name, place.city || place.area, tail] : [name, tail];
  const seen = new Set();
  return parts.filter(p => p && !seen.has(p.toLowerCase()) && seen.add(p.toLowerCase())).join(', ');
}

/** A labelled grid of small thumbnails: cheap to look at, enough to recognise a place. */
async function contactSheet(items, out, { cols = 4, w = 300 } = {}) {
  const h = 200, label = 34, rows = Math.ceil(items.length / cols);
  const esc = (s) => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const tiles = await Promise.all(items.map(async (it, i) => {
    const img = await sharp(it.abs).rotate().resize(w, h, { fit: 'cover' }).jpeg({ quality: 70 }).toBuffer();
    const text = Buffer.from(`<svg width="${w}" height="${label}"><rect width="100%" height="100%" fill="#111"/>`
      + `<text x="6" y="14" font-family="Helvetica" font-size="13" fill="#fff">${esc(it.slug)}</text>`
      + `<text x="6" y="29" font-family="Helvetica" font-size="11" fill="#aaa">${esc((it.hint || '').slice(0, 44))}</text></svg>`);
    const x = (i % cols) * w, y = Math.floor(i / cols) * (h + label);
    return [{ input: img, left: x, top: y }, { input: text, left: x, top: y + h }];
  }));
  await sharp({ create: { width: cols * w, height: rows * (h + label), channels: 3, background: '#000' } })
    .composite(tiles.flat()).jpeg({ quality: 72 }).toFile(out);
  return out;
}

/** The place text the bootstrap took from the old file names, per slug: a caption still equal to it was never written by hand. */
export function legacyPlaces(g, photosDir = PATHS.photosDir) {
  try {
    const map = JSON.parse(fs.readFileSync(path.join(photosDir, ...g.split('/'), '.bootstrap-map.json'), 'utf8'));
    return new Map(map.map(m => [m.slug, m.place || null]));
  } catch { return new Map(); }
}

/**
 * Locate one gallery: geocode originals with GPS, queue originals without
 * GPS for a visual guess, and mark compressed copies as awaiting their
 * original (their old caption stands; a guess would be thrown away when the
 * original arrives with GPS).
 */
export async function locateGallery(g, { log = () => {} } = {}) {
  const photos = readSidecar(g);
  const files = localGallery(g).files;
  const { doc } = readAuthored(g);
  const suffix = captionSuffix(doc);
  const out = { located: 0, guess: [], awaiting: 0 };
  const live = new Set(files.map(f => f.slug));
  for (const slug of Object.keys(photos)) if (!live.has(slug)) delete photos[slug];
  for (const f of files) {
    const x = await readHeadExif(f.abs).catch(() => null);
    if (x?.gps) {
      const place = await locate(x.gps.lat, x.gps.lng);
      const suggested = compose(place, suffix);
      photos[f.slug] = { suggested, landmark: place.landmark, street: place.street, city: place.city, country: place.country, gps: 'present', source: 'OpenStreetMap reverse geocode' };
      for (const k of Object.keys(photos[f.slug])) if (photos[f.slug][k] == null) delete photos[f.slug][k];
      out.located++;
      log(`  ${f.slug}  ${suggested}`);
    } else if (isCompressedCopy(x)) {
      photos[f.slug] = { gps: 'missing', source: 'awaiting original' };
      out.awaiting++;
    } else if (photos[f.slug]?.source !== 'visual guess') {
      photos[f.slug] = { gps: 'missing', source: 'pending visual guess' };
      out.guess.push({ ...f, hint: doc?.photos?.[f.slug]?.caption || '' });
    }
  }
  if (Object.keys(photos).length) writeSidecar(g, photos);
  return out;
}

/**
 * Put accepted suggestions into the authored captions. A caption is only
 * replaced while it is empty or still the old file-name place (the owner
 * never wrote it); anything else is reported and left. Edits the one
 * caption line per photo, so comments and every other field stay as written.
 */
export function acceptSuggestions(g, { slugs = null, legacy = legacyPlaces(g), authoredDir = PATHS.authoredDir, dir = LOCATIONS_DIR } = {}) {
  const suggestions = readSidecar(g, dir);
  const file = path.join(authoredDir, `${g}.yml`);
  const text = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : `photos:\n`;
  const doc = yaml.load(text) || {};
  const lines = text.replace(/\n$/, '').split('\n');
  const done = [], kept = [];
  for (const [slug, sg] of Object.entries(suggestions)) {
    if (!sg.suggested || (slugs && !slugs.includes(slug))) continue;
    const cur = doc.photos?.[slug]?.caption ?? null;
    if (cur === sg.suggested) continue;
    if (cur && cur !== legacy.get(slug)) { kept.push({ slug, cur, suggested: sg.suggested }); continue; }
    const value = yaml.dump(sg.suggested, { lineWidth: -1 }).trim();
    const at = lines.findIndex(l => l.replace(/\s+$/, '') === `  ${slug}:` || l.startsWith(`  ${slug}: `));
    if (at < 0) {
      let photosAt = lines.findIndex(l => /^photos:/.test(l));
      if (photosAt < 0) { lines.push('photos:'); photosAt = lines.length - 1; }
      if (/^photos:\s*\{\}\s*$/.test(lines[photosAt])) lines[photosAt] = 'photos:';
      let end = photosAt + 1; while (end < lines.length && !/^[^\s#]/.test(lines[end])) end++;
      lines.splice(end, 0, `  ${slug}:`, `    caption: ${value}`);
    } else {
      // `dscf1797: {}` or `dscf1797: ~` becomes a block the caption can go under.
      if (/:\s*(\{\}|~|null)\s*$/.test(lines[at])) lines[at] = `  ${slug}:`;
      let i = at + 1, capAt = -1;
      while (i < lines.length && /^(\s{4,}|\s*$)/.test(lines[i])) { if (/^\s{4}caption:/.test(lines[i])) capAt = i; i++; }
      if (capAt >= 0) lines[capAt] = `    caption: ${value}`;
      else lines.splice(at + 1, 0, `    caption: ${value}`);
    }
    done.push({ slug, from: cur, to: sg.suggested });
  }
  const next = lines.join('\n') + '\n';
  const parsed = yaml.load(next) || {};
  // Prove the edit touched captions only.
  for (const [slug, e] of Object.entries(doc.photos || {})) {
    const { caption: _a, ...restBefore } = e || {}; const { caption: _b, ...restAfter } = parsed.photos?.[slug] || {};
    if (JSON.stringify(restBefore) !== JSON.stringify(restAfter)) throw new Error(`accept would change more than the caption of ${slug}`);
  }
  if (done.length) fs.writeFileSync(file, next);
  return { done, kept, file };
}

async function main() {
  const args = parseArgs(process.argv.slice(2), { multi: ['set'] });
  const { galleriesUnder } = await import('./lib/inventory.mjs');
  const all = args.all ? galleriesUnder(PATHS.photosDir) : null;
  const g = cleanGallery(args.gallery);
  if (!g && !all) { console.error('usage: npm run photos:locate -- --gallery <name> | --all  [--sheets] [--set slug="place"]… [--accept [slugs,…]]'); return 2; }

  if (args.set) {
    const photos = readSidecar(g), files = localGallery(g).files;
    for (const pair of args.set) {
      const m = String(pair).match(/^([a-z0-9-]+)=(.+)$/i);
      if (!m) { console.error(`--set wants slug="place", got ${pair}`); return 2; }
      const [, slug, place] = m;
      if (!files.some(f => f.slug === slug.toLowerCase())) { console.error(`${g} has no photo ${slug}`); return 2; }
      photos[slug.toLowerCase()] = { suggested: place.trim(), gps: 'missing', source: 'visual guess' };
    }
    console.log(`${path.relative(ROOT, writeSidecar(g, photos))}: ${args.set.length} visual guess(es) recorded`);
    return 0;
  }

  if (args.accept) {
    const slugs = typeof args.accept === 'string' ? args.accept.split(',').map(s => s.trim().toLowerCase()) : null;
    for (const gg of all || [g]) {
      const { done, kept, file } = acceptSuggestions(gg, { slugs });
      if (!done.length && !kept.length) continue;
      console.log(`${path.relative(ROOT, file)}: ${done.length} caption(s) set`);
      for (const d of done) console.log(`  ${d.slug}  ${d.from ? `${d.from} → ` : ''}${d.to}`);
      for (const k of kept) console.log(`  ${k.slug}  kept "${k.cur}" (written by hand; suggestion: ${k.suggested})`);
    }
    return 0;
  }

  let guess = [];
  for (const gg of all || [g]) {
    if (!localGallery(gg).files.length) continue;
    const r = await locateGallery(gg, { log: args.quiet ? () => {} : console.log });
    console.log(`${gg}: ${r.located} from GPS, ${r.awaiting} awaiting their original, ${r.guess.length} original(s) without GPS to guess`);
    guess.push(...r.guess.map(x => ({ ...x, gallery: gg })));
  }
  if (guess.length && args.sheets) {
    const dir = path.join(PATHS.localStore, 'sheets'); fs.mkdirSync(dir, { recursive: true });
    for (let i = 0; i < guess.length; i += 12) {
      const batch = guess.slice(i, i + 12).map(x => ({ ...x, slug: `${x.gallery}/${x.slug}` }));
      const sheet = await contactSheet(batch, path.join(dir, `sheet-${i / 12 + 1}.jpg`));
      console.log(`  sheet ${path.relative(ROOT, sheet)}: ${batch.map(b => b.slug).join(' ')}`);
    }
  } else if (guess.length) console.log(`without GPS: ${guess.map(x => `${x.gallery}/${x.slug}`).join(' ')}  (--sheets to look at them)`);
  return 0;
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) main().then(c => process.exit(c), e => { console.error(e.message || e); process.exit(2); });
