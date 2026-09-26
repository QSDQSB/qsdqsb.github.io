/**
 * Every photograph on the site in one list, for the pages that look across
 * voyages (The Colour of Light, Drift): what each one is, where its light
 * stood, its colours, and its kindred frames in other voyages.
 *
 *   kindredOf   nearest photos by colour, other voyages only: a shortlist by
 *               the 32-anchor vector (χ²), then the exact earth mover's
 *               distance. Slow enough (seconds) to be computed offline and
 *               cached by content hash (scripts/photos/palettes.mjs).
 *   atlasOf     the compact records the pages read, from the booked
 *               manifests and that cache, and the light in bands of the
 *               sun's altitude: each band's pooled colours, its mean
 *               lightness and its lean (rose–green, gold–blue)
 *
 * No coordinates: place names and the sun's altitude only, as in the books.
 */

import { parsePalette, vectorOf, chi2, emd, rgbToOklab, swatchesOf } from './palette.mjs';

/** Where the kindred list lives in the originals bucket, beside the galleries' manifests (private). */
export const KINDRED_KEY = '_kindred.json';

/** The voyage a gallery belongs to: "prague/twilight" and "prague/portraits" are one trip. */
export const voyageOf = (gallery) => String(gallery).split('/')[0];

/**
 * @param {Array<{hash:string, gallery:string, palette:string}>} items
 * @returns {Record<string, Array<[string, number]>>} hash → [[hash, ΔE], …] nearest first
 */
export function kindredOf(items, { k = 12, shortlist = 36 } = {}) {
  const xs = items.map(x => { const P = parsePalette(x.palette); return { ...x, P, V: vectorOf(P), voyage: voyageOf(x.gallery) }; });
  const memo = new Map();
  const d = (a, b) => {
    const key = a.hash < b.hash ? `${a.hash}${b.hash}` : `${b.hash}${a.hash}`;
    if (!memo.has(key)) memo.set(key, emd(a.P, b.P));
    return memo.get(key);
  };
  const out = {};
  for (const a of xs) {
    const near = xs.filter(b => b.voyage !== a.voyage).map(b => ({ b, c: chi2(a.V, b.V) })).sort((x, y) => x.c - y.c).slice(0, shortlist);
    out[a.hash] = near.map(({ b }) => [b.hash, +d(a, b).toFixed(2)]).sort((x, y) => x[1] - y[1]).slice(0, k);
  }
  return out;
}

/**
 * @param {Array<object>} books  booked manifests (bookOf output), in any order
 * @param {Record<string, Array<[string, number]>>} kindred  from kindredOf, or {}
 * @returns {{photos: object[]}|null}  null when no photo has colours
 */
export function atlasOf(books, kindred = {}) {
  const photos = [];
  for (const m of books) {
    for (const p of m.photos || []) {
      if (!p.swatches || !p.hash) continue;
      photos.push({
        hash: p.hash, g: m.gallery, v: voyageOf(m.gallery), slug: p.slug, url: p.url,
        sizes: (p.sizes?.webp || []).filter(s => s <= 2560), r: p.ratio,
        name: p.name || null, city: p.place?.city || null,
        alt: p.light ? p.light.alt : null, phase: p.light?.phase || null, light: p.light?.text || null,
        strip: p.strip, sw: p.swatches.map(([h]) => h), pc: p.swatches.map(([, w]) => Math.round(w)),
        taken: p.taken ? String(p.taken).slice(0, 10) : null,
      });
    }
  }
  if (!photos.length) return null;
  const bands = bandsOf(photos);
  // Indices, not hashes, on the page: kindred frames still to be found are left out.
  const at = new Map(photos.map((p, i) => [p.hash, i]));
  for (const p of photos) p.k = (kindred[p.hash] || []).map(([h]) => at.get(h)).filter(i => i != null);
  for (const p of photos) delete p.hash;
  return { photos, bands };
}

/**
 * The sun's altitude in bands, as the site names its light (lib/book.mjs lightOf): below −6° night,
 * to −2° blue hour, ±2° the horizon, to 6° golden light, then low sun, day and high sun.
 */
export const BANDS = [
  { key: 'night', label: 'Night', lo: -90, hi: -6 },
  { key: 'blue', label: 'Blue hour', lo: -6, hi: -2 },
  { key: 'horizon', label: 'The horizon', lo: -2, hi: 2 },
  { key: 'golden', label: 'Golden light', lo: 2, hi: 6 },
  { key: 'low', label: 'Low sun', lo: 6, hi: 20 },
  { key: 'day', label: 'Day', lo: 20, hi: 45 },
  { key: 'high', label: 'High sun', lo: 45, hi: 91 },
];

const hexLab = (h) => rgbToOklab(parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16));

function bandsOf(photos) {
  return BANDS.map(b => {
    const ps = photos.filter(p => p.alt != null && p.alt >= b.lo && p.alt < b.hi);
    if (!ps.length) return { ...b, n: 0 };
    // Each photo counts once: its five colours by their shares, pooled, then merged back to five.
    const pooled = ps.flatMap(p => p.sw.map((h, i) => ({ lab: hexLab(h), w: p.pc[i] / 100 / ps.length })));
    const mean = (k) => pooled.reduce((s, c) => s + c.w * c.lab[k], 0) / pooled.reduce((s, c) => s + c.w, 0);
    return {
      ...b, n: ps.length,
      palette: swatchesOf(pooled).map(s => ({ hex: s.hex, pc: Math.round(s.pc) })),
      L: +mean(0).toFixed(3), rose: +(mean(1) * 100).toFixed(2), gold: +(mean(2) * 100).toFixed(2),
    };
  });
}
