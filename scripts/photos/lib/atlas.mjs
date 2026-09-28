/**
 * Every photograph on the site in one list, for the pages that look across
 * voyages (The Colour of Light, Drift): what each one is, where its light
 * stood, its colours (its signature too, for Drift's trail of dye vats, and its
 * 24 dots, `rrggbbss` each, for Reverie's matching: finer than the signature),
 * and its kindred frames in other voyages.
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

import { parsePalette, vectorOf, chi2, emd, colourPath, rgbToOklab, swatchesOf } from './palette.mjs';
import { holding } from '../../../assets/js/colour/cards.js';

/**
 * QSD's Palette (_pages/palette.html) and Reverie (_pages/reverie.html): for every voyage with colours, its signature (no black or
 * white), its colour line, its colour order (24 dots, lib/book.mjs colourOf), each frame's own
 * signature in the book's order (with renditions up to 2560 px, enough for Reverie's cover), and its
 * `rank` on the page's rail of voyages (by colour). Galleries are keyed as `gallery_name` says them
 * (`prague/twilight`).
 */
export function palettesOf(books) {
  const voyages = books.filter(m => m.book?.colour).map(m => ({
    g: m.gallery, palette: m.book.colour.palette, order: m.book.colour.order,
    photos: m.photos.map(p => ({ slug: p.slug, name: p.name || null, light: p.light?.text || null, url: p.url, r: p.ratio ? +p.ratio.toFixed(3) : null, sizes: (p.sizes?.webp || []).filter(s => s <= 2560), sig: p.signature || null })),
  }));
  // Each voyage's place on the rail of vats that leads from one to the next: its signature carried
  // into every other's (the earth mover's distance), laid on one line dark to light, like with like.
  const sigs = voyages.map(v => { const sum = v.palette.reduce((s, c) => s + c.pc, 0) || 1; return v.palette.map(c => ({ lab: rgbToOklab(...[1, 3, 5].map(i => parseInt(c.hex.slice(i, i + 2), 16))), w: c.pc / sum })); });
  const D = sigs.map((a, i) => sigs.map((b, j) => (i === j ? 0 : emd(a, b))));
  colourPath(D, sigs.map(P => P.reduce((s, c) => s + c.w * c.lab[0], 0))).forEach((k, rank) => { voyages[k].rank = rank; });
  return voyages.length ? { voyages } : null;
}

/**
 * The lightbox's frames for every voyage, for a lightbox opened away from its book (Reverie): what the
 * book's own page carries (lib/book.mjs, `book.lightbox`) without the placeholder picture, which would
 * weigh twenty times the rest; the room takes the frame's glow instead. Keyed by gallery.
 */
export function framesOf(books) {
  const out = {};
  for (const m of books) if (m.book?.lightbox?.length) out[m.gallery] = m.book.lightbox.map(({ ph, ...f }) => f);
  return Object.keys(out).length ? out : null;
}

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
        strip: p.strip, sw: p.swatches.map(([h]) => h), pc: p.swatches.map(([, w]) => Math.round(w)), sig: p.signature || null, dots: p.dots || null,
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
 * The landing page's Reverie (_includes/home/whats-new.html): every colour of Ridgway's book
 * (assets/ridgway.json) that `least` photographs or more hold, by Reverie's own matching (cards.js
 * holding), each as [name, hex, the photograph holding it most (`gallery/slug`), its signature], so
 * the page can pour its dye and open its Reverie without the atlas. The photographs are still, so this
 * is worked out here, once, not by every visitor.
 */
export function picksOf(atlas, book, { least = 3 } = {}) {
  const frames = (atlas?.photos || []).filter(p => p.dots && p.sig);
  if (!frames.length || !book?.colours?.length) return null;
  const out = [];
  for (const [name, hex] of book.colours) {
    const held = holding(frames, `#${hex}`);
    if (held.length >= least) out.push([name, hex, `${held[0].f.g}/${held[0].f.slug}`, held[0].f.sig]);
  }
  return out.length ? out : null;
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
