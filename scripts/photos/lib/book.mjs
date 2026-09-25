/**
 * What the Photobook needs beyond the merged manifest, worked out once at
 * build time so Liquid only renders and the page's script only reacts:
 *
 *   rows       the rhythm of the book: a spread, a pair, a three, again;
 *              a portrait never takes a spread, and the last two or three
 *              frames close the book together
 *   cover      the frame the voyage opens on
 *   colophon   films, lenses and the hours the frames were made
 *   per photo  film (its familiar name), place (name and city), light (the sun as one phrase and the
 *              glyph's dot), glow (three soft colours for the page), ph
 *              (the placeholder as a data URL), filmHue
 *
 * Nothing here reads a photograph's coordinates: place names come from the
 * locate sidecar, the sun from values the processor keeps at city precision.
 */

import { thumbHashToDataURL, thumbHashToRGBA } from 'thumbhash';
import { normalizeFilm } from './camera.mjs';
// The rhythm is shared with the page, whose film filter re-lays the frames it keeps.
import { bookRows, PORTRAIT } from '../../../assets/js/photobook/rows.mjs';
export { bookRows };

// Film simulations take a hue from the site's palette: an original mark, not Fujifilm's artwork.
const FILMS = {
  'Provia': '#8fb0a0', 'Velvia': '#d08a86', 'Astia': '#b7a6c6', 'Classic Chrome': '#c9b98f', 'Classic Negative': '#7fbcbc',
  'Nostalgic Neg.': '#e4b181', 'Eterna Bleach Bypass': '#a8adae', 'Eterna': '#93a6b3', 'Pro Neg. Hi': '#e5cfa9', 'Pro Neg. Std': '#cdbfa6',
  'Reala Ace': '#9fc3a0', 'Sepia': '#c7a27c',
};
export function filmHue(name) {
  if (!name) return null;
  const k = Object.keys(FILMS).find(f => name.startsWith(f));
  return k ? FILMS[k] : /^(Acros|Monochrome)/.test(name) ? '#e6eee8' : '#8b9296';
}

/** The opening frame: the first featured landscape, else the first landscape, else the first. */
export function coverIndex(photos) {
  const land = (p) => (p.ratio || 1.5) >= PORTRAIT;
  const i = photos.findIndex(p => p.featured && land(p));
  if (i >= 0) return i;
  const j = photos.findIndex(land);
  return j >= 0 ? j : photos.length ? 0 : null;
}

/** "XF90mmF2 R LM WR" → "XF 90 mm f/2": the lens as a photographer says it. */
export const lensName = (l) => (l ? String(l).replace(/^(XF|XC|GF)(?=\d)/, '$1 ').replace(/mmF/, ' mm f/').replace(/ R LM WR| R WR| R LM| OIS WR| LM WR| WR| R$/g, '').trim() : null);

/** "FUJIFILM X-S10" → "Fujifilm X-S10". */
export const cameraName = (c) => (c ? String(c).replace(/^FUJIFILM\b/, 'Fujifilm').replace(/^SONY\b/, 'Sony').replace(/^NIKON CORPORATION\b|^NIKON\b/, 'Nikon').replace(/^Canon\b/, 'Canon') : null);

/** "Tower Bridge, London" → { name: 'Tower Bridge', city: 'London' }. */
export function splitPlace(text, fallbackCity = null) {
  if (!text) return null;
  const m = String(text).match(/^(.*),\s*([^,]+)$/);
  return m ? { name: m[1].trim(), city: m[2].trim() } : { name: String(text).trim(), city: fallbackCity };
}

const span = (n) => (n >= 60 ? `${Math.floor(n / 60)} h ${n % 60} min` : `${n} min`);

const HORIZON = -0.833; // the sun's upper limb on the horizon, with refraction (lib/sun.mjs)

/**
 * The sun as one phrase, and where the glyph's sun sits. The phrase never states a time: within a
 * quarter hour of sunrise or sunset it is golden hour; the sun's height says the rest.
 *
 * The glyph is a 20×16 box with the horizon at y = 11. While the sun is up it is a filled disc on
 * the day's arc, from (2,11) at sunrise over the top at noon to (18,11) at sunset, placed by that
 * same day's sunrise, noon and sunset. Once it has set it is a hollow circle on a shallow arc under
 * the horizon, from the sunset end through midnight to the sunrise end, so an early evening and a
 * small hour read apart without a clock.
 *
 * phase: 'day' | 'golden' (sun under 6°) | 'night' (4° below the horizon or lower).
 */
export function lightOf(sun) {
  if (!sun || !Number.isFinite(sun.alt)) return null;
  const { alt, rising, toSunrise, toSunset, toNoon } = sun;
  const events = [toSunrise != null && { m: toSunrise, what: 'sunrise' }, toSunset != null && { m: toSunset, what: 'sunset' }]
    .filter(Boolean).sort((a, b) => Math.abs(a.m) - Math.abs(b.m));
  const near = events[0];
  const up = alt >= HORIZON;
  const text = near && Math.abs(near.m) <= 15 ? 'Golden hour'
    : alt < -6 ? 'Night'
    : alt < -4 ? 'Blue hour'
    : !up ? (rising ? 'Dawn glow' : 'Afterglow')
    : near && Math.abs(near.m) <= 90 ? `${span(Math.abs(near.m))} ${near.m > 0 ? 'before' : 'after'} ${near.what}`
    : `Sun at ${Math.round(alt)}°`;

  const clamp = (v) => Math.min(1, Math.max(0, v));
  let x, y;
  if (up) {
    // How far the day has gone: sunrise → noon is the first half, noon → sunset the second.
    const f = toNoon == null ? 0.5
      : toNoon >= 0 ? (toSunrise != null && toSunrise <= 0 ? 0.5 * -toSunrise / (-toSunrise + toNoon || 1) : clamp(0.5 - toNoon / 1440))
      : (toSunset != null && toSunset >= 0 ? 0.5 + 0.5 * -toNoon / (-toNoon + toSunset || 1) : clamp(0.5 - toNoon / 1440));
    const a = Math.PI * (1 - f);
    x = 10 + 8 * Math.cos(a); y = 11 - 8 * Math.sin(a);
  } else {
    // How far the night has gone: last sunset → next sunrise.
    const g = toSunset != null && toSunrise != null && toSunset <= 0 && toSunrise >= 0
      ? -toSunset / (-toSunset + toSunrise || 1) : (rising ? 0.9 : 0.1);
    x = 18 - 16 * g; y = 11 + 3.2 * Math.sin(Math.PI * g);
  }
  const phase = alt < -4 ? 'night' : alt < 6 ? 'golden' : 'day';
  return { alt: Math.round(alt), text, phase, below: !up, x: +x.toFixed(1), y: +y.toFixed(1) };
}

const GROUND = [21, 21, 21], STRENGTH = 0.34;
/** Three soft colours from the placeholder (upper left, upper right, bottom), mixed most of the way back to the ground. */
export function glowOf(thumbhash) {
  if (!thumbhash) return null;
  let img;
  try { img = thumbHashToRGBA(Buffer.from(thumbhash, 'base64')); } catch { return null; }
  const { w, h, rgba } = img;
  const mean = (x0, x1, y0, y1) => {
    const acc = [0, 0, 0]; let n = 0;
    for (let y = Math.floor(y0 * h); y < Math.ceil(y1 * h); y++) for (let x = Math.floor(x0 * w); x < Math.ceil(x1 * w); x++) {
      const o = (y * w + x) * 4; acc[0] += rgba[o]; acc[1] += rgba[o + 1]; acc[2] += rgba[o + 2]; n++;
    }
    return acc.map(v => v / Math.max(1, n));
  };
  const soften = (c) => `rgb(${c.map((v, k) => Math.round(GROUND[k] + (v - GROUND[k]) * STRENGTH)).join(',')})`;
  return [mean(0, 0.5, 0, 0.5), mean(0.5, 1, 0, 0.5), mean(0, 1, 0.5, 1)].map(soften);
}

export function placeholderOf(thumbhash) {
  if (!thumbhash) return null;
  try { return thumbHashToDataURL(Buffer.from(thumbhash, 'base64')); } catch { return null; }
}

/** Films, lenses and hours for the colophon; each entry carries its count and its share. */
export function colophonOf(photos) {
  const count = (key) => {
    const m = new Map();
    for (const p of photos) { const k = key(p); if (k) m.set(k, (m.get(k) || 0) + 1); }
    return [...m].sort((a, b) => b[1] - a[1]).map(([name, n]) => ({ name, n, pc: Math.round(n / photos.length * 100) }));
  };
  const films = count(p => p.film ?? normalizeFilm(p.settings?.filmSimulation)).map(f => ({ ...f, hue: filmHue(f.name) }));
  const lenses = count(p => lensName(p.lens));
  const bins = new Map(), phases = { day: 0, golden: 0, night: 0 }, hours = [];
  for (const p of photos) {
    const m = p.taken && String(p.taken).match(/T(\d{2}):(\d{2})/);
    if (!m) continue;
    const bin = Math.floor((+m[1] * 60 + +m[2]) / 30), k = bins.get(bin) || 0;
    bins.set(bin, k + 1);
    const phase = p.light?.phase || 'day';
    phases[phase]++;
    hours.push({ at: `${m[1]}:${m[2]}`, left: +((bin + 0.5) / 48 * 100).toFixed(2), stack: k, phase });
  }
  const bodies = count(p => cameraName(p.camera));
  return { films, lenses, hours, phases, bodies, frames: photos.length };
}

// The in-camera rendering, as the specs panel lists it: short labels, values without their glosses.
const SETTINGS = [
  ['dynamicRange', 'DR'], ['grainRoughness', 'Grain'], ['colorChrome', 'Chrome'], ['colorChromeBlue', 'Chr. blue'],
  ['highlightTone', 'Highl.'], ['shadowTone', 'Shad.'], ['whiteBalance', 'WB'], ['color', 'Colour'], ['sharpness', 'Sharp'],
  ['noiseReduction', 'NR'], ['clarity', 'Clarity'], ['shutterType', 'Shutter type'], ['focusMode', 'Focus'],
];
const DEFAULTS = new Set(['Off', '0', 'Standard', 'Auto', 'Normal']);
export const tidy = (v) => String(v).replace(/\s*\((?!\d)[^)]*\)/g, '').replace(/^-(?=\d)/, '−').trim();
export function settingsOf(p) {
  const st = p.settings || {};
  const out = [];
  for (const [key, label] of SETTINGS) {
    let v = key === 'whiteBalance' ? p.whiteBalance : st[key];
    if (key === 'grainRoughness' && v && v !== 'Off' && st.grainSize) v = `${v} / ${String(st.grainSize)[0]}`;
    if (key === 'focusMode' && v && st.afMode) v = `${v} · ${st.afMode}`;
    // A value the camera leaves alone says nothing ("Film Simulation" means the film decides it);
    // what the photographer chose is what the panel keeps.
    if (v == null || v === '' || v === 'Film Simulation') continue;
    const shown = tidy(v);
    if (DEFAULTS.has(shown)) continue;
    out.push([label, shown]);
  }
  return out;
}

/** What the lightbox needs per frame, and nothing more: the page carries it as one JSON block. */
export function lightboxOf(photos) {
  return photos.map(p => ({
    slug: p.slug, frame: p.frame, url: p.url, sizes: p.sizes?.webp || [], ratio: p.ratio,
    name: p.name, city: p.place?.city || null,
    shots: p.shutterCount ?? null, focal: p.focal ?? null, aperture: p.aperture ?? null, shutter: p.shutter ?? null,
    iso: p.iso ?? null, bias: p.exposureBias ?? null, camera: cameraName(p.camera), lens: lensName(p.lens),
    film: p.film ?? null, hue: p.filmHue ?? null, light: p.light, glow: p.glow, ph: p.ph, settings: settingsOf(p),
  }));
}

/** Add the Photobook's layer to a merged manifest. `locations` is the locate sidecar's `photos` map, if any. */
export function bookOf(merged, locations = {}) {
  const photos = merged.photos.map(p => {
    const loc = locations?.[p.slug];
    const place = splitPlace(loc?.suggested) || splitPlace(p.caption);
    const light = lightOf(p.sun);
    // Manifests processed before the names were tidied carry ExifTool's own ("F2/Fujichrome (Velvia)").
    const film = normalizeFilm(p.settings?.filmSimulation);
    // A frame with no place yet is named for its voyage, never for its camera file.
    const name = place?.name || p.caption || merged.title || p.frame;
    return { ...p, name, film, place, light, glow: glowOf(p.thumbhash), ph: placeholderOf(p.thumbhash), filmHue: filmHue(film) };
  });
  return { ...merged, photos, book: { rows: bookRows(photos), cover: coverIndex(photos), colophon: colophonOf(photos), lightbox: lightboxOf(photos) } };
}
