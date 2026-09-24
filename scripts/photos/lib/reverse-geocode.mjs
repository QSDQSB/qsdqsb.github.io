/**
 * Reverse geocoding for photo locations, from OpenStreetMap:
 *
 *   Nominatim  the address at a point: street, neighbourhood, city, country
 *   Overpass   the nearest *well-known* landmark within RADIUS metres:
 *              one with a Wikidata or Wikipedia link (Tower Bridge, St
 *              Paul's, Minack Theatre). Memorials, plaques, artworks,
 *              shops and cafés never qualify: a caption naming the plaque
 *              beside the camera confuses more than it places
 *
 * Both are free services with usage policies: at most one request a
 * second, an identifying User-Agent, and a cache so a point is asked once.
 * The cache (.photos-local/reverse-geocode.json) holds coordinates and is
 * gitignored; nothing this module returns carries a coordinate, so its
 * output can be committed. Displaying the result needs the attribution
 * "© OpenStreetMap contributors".
 */

import fs from 'node:fs';
import path from 'node:path';
import { PATHS } from './config.mjs';

const UA = 'qsdqsb-photos/1.0 (+https://qsdqsb.com)';
// Public Overpass instances, tried in order: the main one sheds load or
// refuses clients after heavy use, so a lookup moves to the next rather than fail.
const OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];
async function overpassQuery(q) {
  let last;
  for (const url of OVERPASS) {
    try { return await politely(url, { method: 'POST', body: new URLSearchParams({ data: q }) }); }
    catch (e) { last = e; }
  }
  throw last;
}
const RADIUS = 250;
const CACHE = path.join(PATHS.localStore, 'reverse-geocode.json');

let cache = null, lastCall = 0;
const load = () => { if (!cache) { try { cache = JSON.parse(fs.readFileSync(CACHE, 'utf8')); } catch { cache = {}; } } return cache; };
const save = () => { fs.mkdirSync(path.dirname(CACHE), { recursive: true }); fs.writeFileSync(CACHE, JSON.stringify(cache)); };
async function politely(url, init, attempt = 0) {
  const wait = lastCall + 1100 - Date.now();
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastCall = Date.now();
  let r;
  try { r = await fetch(url, { ...init, headers: { 'User-Agent': UA, ...(init?.headers || {}) }, signal: AbortSignal.timeout(45000) }); }
  catch (e) { if (attempt < 2) return politely(url, init, attempt + 1); throw e; }
  // Overpass sheds load with 429 and 504: back off and ask again, then give up for this run.
  if ((r.status === 429 || r.status === 504) && attempt < 2) { await new Promise(res => setTimeout(res, 8000 * (attempt + 1))); return politely(url, init, attempt + 1); }
  if (!r.ok) throw new Error(`${r.status} from ${new URL(url).host}`);
  return r.json();
}

function metres(a, b) {
  const r = (d) => d * Math.PI / 180;
  const h = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}

// What a reader can place: roads and streets, inns, historic places,
// landmarks, parks, squares. Never museums, theatres, clubs, shops or
// plaques, however notable. Only features with a Wikidata or Wikipedia
// link are considered (the fame test), in two tiers:
//   tier 1  wins anywhere within 300 m: the place a photo is "at"
//   tier 2  counts only within 120 m: a church or an inn beside the camera
const TIERS = [
  { max: 300, match: {
    tourism: /^(attraction|viewpoint)$/, historic: /^(castle|palace|monument|city_gate|fort|ruins|cathedral|abbey|archaeological_site|bridge|tower)$/,
    man_made: /^(bridge|lighthouse)$/, 'bridge:name': /./, leisure: /^(park|garden)$/, place: /^square$/,
    natural: /^(peak|beach|cliff|bay|volcano|glacier)$/, aeroway: /^aerodrome$/, building: /^(cathedral|castle|palace)$/,
  } },
  { max: 120, match: {
    amenity: /^(place_of_worship|pub|marketplace)$/, historic: /^(building|church|manor|house|monastery)$/, tourism: /^(hotel|guest_house)$/,
    building: /^(church|chapel|train_station)$/, railway: /^station$/, man_made: /^(tower|pier)$/,
  } },
];
const KEYS = [...new Set(TIERS.flatMap(t => Object.keys(t.match)))];
const EXCLUDE = { tourism: /^(museum|gallery|artwork|theme_park|zoo)$/, amenity: /^(theatre|arts_centre|nightclub|cinema|restaurant|cafe|bar)$/, historic: /^(memorial|plaque|boundary_stone|milestone|wayside_cross|wayside_shrine)$/ };
// Within tier 1, the whole before its parts: the Tower of London before
// Martin Tower, a cathedral before a square beside it. Added as metres.
const WEIGHT = [
  [/^(castle|palace|cathedral|abbey)$/, 0], [/^attraction$/, 40], [/^(bridge|aerodrome|lighthouse)$/, 80],
  [/^(square|park|garden|beach|peak|viewpoint)$/, 100], [/^(monument|city_gate|fort|ruins)$/, 140], [/./, 260],
];
export function weightOf(tags) {
  const v = [tags.historic, tags.building, tags.tourism, tags.man_made, tags.aeroway, tags.place, tags.leisure, tags.natural].filter(Boolean);
  if (tags['bridge:name'] && !v.length) v.push('bridge');
  return Math.min(...v.map(x => WEIGHT.find(([re]) => re.test(x))[1]), 260);
}

export function tierOf(tags) {
  if (!(tags.wikidata || tags.wikipedia)) return -1;
  // A tourist attraction is a landmark whatever else it is (the Minack Theatre);
  // otherwise museums, theatres, clubs and plaques never name a photo.
  const attraction = tags.tourism === 'attraction';
  if (!attraction && Object.entries(EXCLUDE).some(([k, re]) => tags[k] && re.test(tags[k]))) return -1;
  // An inn among pubs and hotels: the name says so.
  if ((tags.amenity === 'pub' || tags.tourism === 'hotel' || tags.tourism === 'guest_house') && !/\b(inn|tavern|arms)\b/i.test(tags.name || '') && !tags.historic) return -1;
  return TIERS.findIndex(t => Object.entries(t.match).some(([k, re]) => tags[k] && re.test(tags[k])));
}

/** Known to an English-reading visitor: an English Wikipedia article, an English name, or a tourist attraction. */
const renowned = (tags) => /^en:/.test(tags.wikipedia || '') || !!tags['name:en'] || tags.tourism === 'attraction';

/**
 * Tier 1 is for places a reader recognises from afar. A mapped point (a
 * stone, a statue) is small, and a place known only locally (a palace with
 * a Czech article alone) confuses: both only name a photo at tier-2 range.
 */
export function effectiveTier(x) {
  const t = tierOf(x.tags);
  if (t !== 0) return t;
  if (x.type === 'node' && !/^(peak|viewpoint)$/.test(x.tags.natural || x.tags.tourism || '')) return 1;
  if (!renowned(x.tags)) return 1;
  return 0;
}

async function nominatim(lat, lng) {
  const u = new URL('https://nominatim.openstreetmap.org/reverse');
  for (const [k, v] of Object.entries({ format: 'jsonv2', lat, lon: lng, zoom: 18, addressdetails: 1, namedetails: 1, 'accept-language': 'en' })) u.searchParams.set(k, v);
  return politely(u);
}

async function overpass(lat, lng) {
  const around = `(around:${RADIUS},${lat},${lng})`;
  const around300 = around.replace(`around:${RADIUS}`, 'around:300');
  const q = `[out:json][timeout:25];(${KEYS.map(k => { const key = k.includes(':') ? `"${k}"` : k; return `nwr${around300}[name][${key}][wikidata];nwr${around300}[name][${key}][wikipedia];`; }).join('')});out tags bb 120;`;
  const j = await overpassQuery(q);
  // Keep the raw tags that decide the tier, so the rules can change without asking again.
  // Distance to the outline's bounding box, not the centre: standing at the
  // Tower of London's wall is 0 m from it, however far its middle is.
  const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
  return (j.elements || []).map(e => {
    const b = e.bounds;
    const near = b ? { lat: clamp(lat, b.minlat, b.maxlat), lng: clamp(lng, b.minlon, b.maxlon) } : e.lat != null ? { lat: e.lat, lng: e.lon } : null;
    return { type: e.type, tags: keepTags(e.tags), m: near ? Math.round(metres({ lat, lng }, near)) : null };
  }).filter(x => x.tags.name && x.m != null);
}
const keepTags = (t = {}) => Object.fromEntries(['name', 'name:en', 'wikidata', 'wikipedia', ...KEYS, ...Object.keys(EXCLUDE)].filter(k => t[k]).map(k => [k, t[k]]));

/** Named, well-known areas the point lies inside: an airport, a park, a castle's grounds. */
async function enclosing(lat, lng) {
  const q = `[out:json][timeout:25];is_in(${lat},${lng})->.a;(${TIERS[0] && Object.keys(TIERS[0].match).filter(k => !k.includes(':')).map(k => `area.a[name][${k}][wikidata];`).join('')});out tags;`;
  const j = await overpassQuery(q);
  return (j.elements || []).map(e => ({ type: 'area', tags: keepTags(e.tags), m: 0 })).filter(x => x.tags.name);
}

/**
 * @returns {{landmark, landmark_m, street, area, city, country, suggested}}
 *   everything named, nothing numeric about the position
 */
export async function locate(lat, lng) {
  const c = load();
  const at = `${lat.toFixed(5)},${lng.toFixed(5)}`, key = `v5:${at}`;
  // Older entries hold the address and the enclosing areas; only the nearby query changed.
  const old = c[`v4:${at}`] || c[`v3:${at}`] || c[`v2:${at}`] || c[at];
  const e = c[key] || (c[key] = { addr: old?.addr, inside: old?.inside });
  for (const k of [`v4:${at}`, `v3:${at}`, `v2:${at}`, at]) delete c[k];
  // A lookup is kept only when it answered. A failure stays unset and is asked
  // again next run; an empty answer from before `verified` existed is asked once more.
  if (!e.addr) e.addr = await nominatim(lat, lng);
  if (!e.verified || !e.marks) { try { e.marks = await overpass(lat, lng); } catch { e.marks = e.marks?.length ? e.marks : null; } }
  if (!e.verified || !e.inside) { try { e.inside = await enclosing(lat, lng); } catch { e.inside = e.inside?.length ? e.inside : null; } }
  e.verified = !!(e.marks && e.inside);
  save();
  const { addr } = e, marks = e.marks || [], inside = e.inside || [];
  const a = addr?.address || {};
  // Nearest landmark, preferring the more telling kinds when distances are close.
  const street = a.road || a.pedestrian || a.square || null; // not footway/path: unnamed paths get odd labels
  const area = a.neighbourhood || a.quarter || a.suburb || a.city_district || a.village || a.hamlet || null;
  const city = a.city || a.town || a.village || a.municipality || null;
  // A place name is not a landmark ("City of London" as an OSM feature).
  const placeNames = new Set([area, city, a.suburb, a.city_district, a.county, a.state].filter(Boolean).map(s => s.toLowerCase()));
  const named = (x) => ({ name: x.tags['name:en'] || x.tags.name, tier: effectiveTier(x), w: weightOf(x.tags), m: x.m });
  const ok = (x) => x.tier >= 0 && !placeNames.has(x.name.toLowerCase());
  // Standing inside a famous place names the photo; else the best landmark nearby.
  const within = inside.map(named).filter(x => ok(x) && x.tier === 0).sort((a, b) => a.w - b.w)[0];
  const near = marks.map(named).filter(x => ok(x) && x.m <= TIERS[x.tier].max)
    .sort((a, b) => (a.tier - b.tier) || ((a.m + a.w) - (b.m + b.w)))[0];
  const mark = within || near || null;
  return {
    landmark: mark?.name || null, landmark_m: mark?.m ?? null,
    street, area, city, country: a.country || null, country_code: a.country_code || null,
  };
}
