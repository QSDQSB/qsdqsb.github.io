/**
 * Where a photograph from the album belongs: the reasoning photos:harvest
 * can do without judgement, kept apart from Photos so it can be tested.
 *
 * The site's galleries are places, not trips (japan/kyoto holds March 2025
 * and June 2026 alike), so a photo is weighed against each voyage two ways:
 *
 *   time   the published photo taken nearest to it. Within 12 hours, in the
 *          same country, it is the same day's walk: sure
 *   place  the voyages whose place names (photos:locate) include its city
 *
 * One voyage on both counts is `sure`; one on either is `likely`; none, or
 * several (Prague's parts share a city), is `open`, for judgement: the
 * session looks at the picture, or the owner says.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import yaml from 'js-yaml';

export const SURE_HOURS = 12;
export const NEAR_HOURS = 36;
export const HOLD = 'hold';

/** Milliseconds since the epoch for a capture time; one without an offset is read as UTC, ±14 h at worst. */
export function instant(taken) {
  if (!taken) return null;
  const t = Date.parse(/(Z|[+-]\d\d:?\d\d)$/.test(taken) ? taken : `${taken.slice(0, 19)}Z`);
  return Number.isNaN(t) ? null : t;
}

/** Every voyage page that names a gallery: `{ gallery, title, page }`. */
export function voyageGalleries(root) {
  const out = [];
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, e.name);
      if (e.isDirectory()) { walk(abs); continue; }
      if (!e.name.endsWith('.md')) continue;
      const fm = fs.readFileSync(abs, 'utf8').match(/^---\n([\s\S]*?)\n---/);
      if (!fm) continue;
      let doc; try { doc = yaml.load(fm[1]) || {}; } catch { continue; }
      if (doc.gallery_name) out.push({ gallery: String(doc.gallery_name), title: String(doc.title || doc.gallery_name), page: path.relative(root, abs) });
    }
  };
  walk(path.join(root, '_voyage'));
  walk(path.join(root, '_subvoyage'));
  return out.sort((a, b) => a.gallery.localeCompare(b.gallery));
}

/**
 * What the site knows of each voyage's photographs: frame, capture instant,
 * city and country. `readMerged` gives the manifest; `places` the gallery's
 * photo_locations sidecar (or null).
 */
export function siteIndex(voyages, { readMerged, places }) {
  return voyages.map((v) => {
    const m = readMerged(v.gallery);
    const where = places(v.gallery)?.photos || {};
    const photos = (m?.photos || []).map((p) => ({
      frame: String(p.frame || '').toUpperCase(), slug: p.slug, at: instant(p.taken),
      city: where[p.slug]?.city || null, country: where[p.slug]?.country || null,
    }));
    const cities = new Set(photos.map((p) => p.city?.toLowerCase()).filter(Boolean));
    const countries = new Set(photos.map((p) => p.country?.toLowerCase()).filter(Boolean));
    return { ...v, photos, cities, countries };
  });
}

/** The same picture already published: same frame, same second. */
export function onSite(item, index) {
  const at = instant(item.taken);
  for (const v of index) {
    for (const p of v.photos) if (p.frame === item.frame && at != null && p.at != null && Math.abs(p.at - at) < 1000) return v.gallery;
  }
  return null;
}

/**
 * The proposal for one album item: `{ status, gallery, confidence, why, candidates }`.
 * `item`: `{ frame, taken, city, country }`; `index`: siteIndex().
 */
export function attribute(item, index) {
  const already = onSite(item, index);
  if (already) return { status: 'on-site', gallery: already, confidence: 'sure', why: `already in ${already}`, candidates: [] };

  const at = instant(item.taken);
  const city = item.city?.toLowerCase(), country = item.country?.toLowerCase();
  let near = null;
  if (at != null) {
    for (const v of index) for (const p of v.photos) {
      if (p.at == null) continue;
      const h = Math.abs(p.at - at) / 3600e3;
      if (!near || h < near.hours) near = { gallery: v.gallery, hours: h, frame: p.frame, country: p.country?.toLowerCase() || null };
    }
  }
  const sameCountry = near && (!country || !near.country || near.country === country);
  const byTime = near && near.hours <= NEAR_HOURS && sameCountry ? near : null;
  const byCity = city ? index.filter((v) => v.cities.has(city)).map((v) => v.gallery) : [];
  const byCountry = country ? index.filter((v) => v.countries.has(country)).map((v) => v.gallery) : [];
  const candidates = [...new Set([byTime?.gallery, ...byCity, ...(byCity.length ? [] : byCountry)].filter(Boolean))];
  const hrs = (h) => (h < 1 ? `${Math.round(h * 60)} min` : `${h.toFixed(h < 10 ? 1 : 0)} h`);
  const timeWhy = byTime && `${hrs(byTime.hours)} from ${byTime.frame} in ${byTime.gallery}`;
  const cityWhy = (gs) => `${item.city} is in ${gs.join(', ')}`;

  if (byTime && byTime.hours <= SURE_HOURS && (!byCity.length || byCity.includes(byTime.gallery))) {
    return { status: 'waiting', gallery: byTime.gallery, confidence: 'sure', why: timeWhy, candidates };
  }
  if (byCity.length === 1 && (!byTime || byTime.gallery === byCity[0])) {
    return { status: 'waiting', gallery: byCity[0], confidence: byTime ? 'sure' : 'likely', why: [timeWhy, cityWhy(byCity)].filter(Boolean).join('; '), candidates };
  }
  if (byTime && !byCity.length) {
    return { status: 'waiting', gallery: byTime.gallery, confidence: 'likely', why: timeWhy, candidates };
  }
  const why = byCity.length > 1 ? cityWhy(byCity)
    : byTime ? `${timeWhy}, but ${cityWhy(byCity)}`
    : byCountry.length ? `no voyage in ${item.city || 'this place'}; ${item.country} has ${byCountry.join(', ')}`
    : `no voyage near ${[item.city, item.country].filter(Boolean).join(', ') || 'this place'}: a new one?`;
  return { status: 'waiting', gallery: null, confidence: 'open', why, candidates };
}

/** The set the owner says yes to: each waiting item's id and where it goes. Order-free. */
export function planHash(items) {
  const set = items.filter((i) => i.status === 'waiting').map((i) => `${i.id}=${i.gallery || ''}`).sort();
  return crypto.createHash('sha256').update(set.join('\n')).digest('hex').slice(0, 16);
}

/** A gallery name a new voyage could take: lower-case words joined by hyphens, parts by a slash. */
export const validGallery = (g) => /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)?$/.test(g);

/** The keyword a brought-in photo carries in Photos, so the library remembers where it went. */
export const keywordFor = (gallery) => `qsdqsb: ${gallery}`;
