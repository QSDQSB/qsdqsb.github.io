/**
 * A photograph's signature palette: three to five colours with their shares,
 * chosen the way a designer would, and what they say about the picture.
 *
 * Choosing: colour first, since a palette that could belong to any grey city
 * says nothing about the place.
 *   1. The pixels that read as grey (chroma under 0.025, or 0.04 near black)
 *      are set apart from the pixels that read as a colour. Greys are the light
 *      a place is seen in; colours are the place.
 *   2. Colour candidates come from the coloured pixels alone (k-means in
 *      OKLab, large areas tempered), so a sky that is a twentieth of a grey
 *      city still makes a candidate; each keeps its true share.
 *   3. Colours take the slots greedily, by share and by difference from those
 *      taken (up to 25 ΔE: a warm stone beats a third blue); each needs 2% of
 *      the picture and 9 ΔE from the rest. A mostly grey picture (a quarter or more) keeps one slot back.
 *   4. The greys, each group's own tinted mean (a warm white stays warm):
 *      at most two, the largest first, each holding 5% or more; three only
 *      for a picture with no colour to speak of, whose palette stays tonal.
 *   5. An accent: vivid pixels far from every swatch (a red bus, a lit
 *      window), if they make up at least 0.3% of the picture, earn a place
 *      for their main colour, at the cost of the most redundant swatch (the
 *      one nearest another), never of a lone grey.
 *   6. Shares are measured again against the swatches chosen: every pixel to
 *      its nearest, and told as they are. Ordered dark to light.
 *   A voyage, pooled, is read without the ground (`ground: false`): no near-black
 *   or near-white swatch, since every trip has its nights and shadows.
 *
 * Reading (over the whole picture, not just the swatches)
 *   harmony      Tonal (next to no colour), Monochrome (one 30° family of
 *                hue), Analogous (neighbouring families, within 60°), Complementary (two hues 150–210°
 *                apart), else Contrasting
 *   key          Low (mean lightness < 0.38), High (> 0.62), else Mid
 *   contrast     Soft, Moderate, Hard: the lightness range holding 90% of it
 *   temperature  Warm, Cool or Neutral: the lean of its colour on the
 *                yellow–blue and red–green axes
 *   saturation   Muted, Moderate, Vivid: its mean chroma
 *
 * The colour line joins the swatches, dark to light, on the plane of hue and
 * chroma (OKLab a–b): a short line is one family of colour, a line through the
 * centre is a pair of opposites.
 */

import { kmeans, oklabToRgb, rgbHex, isGrey } from './palette.mjs';

const chroma = (l) => Math.hypot(l[1], l[2]);
const hueOf = (l) => (Math.atan2(l[2], l[1]) * 180 / Math.PI + 360) % 360;
const gap = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
// Black or white to the eye, whatever trace of hue a cluster's mean keeps: very dark and barely
// coloured, or very light and barely coloured. Deep navies and warm stone are not.
const looksBlackOrWhite = (l) => (l[0] < 0.25 && chroma(l) < 0.05) || (l[0] > 0.8 && chroma(l) < 0.02);
const hueGap = (x, y) => { const d = Math.abs(x - y) % 360; return d > 180 ? 360 - d : d; };

/** @param {{X:Float64Array, w:Float64Array, n:number}} pts  weighted OKLab points (lib/dots.mjs pointsOf) */
export function signatureOf({ X, w, n }, { most = 5, least = 3, ground = true } = {}) {
  const lab = (i) => [X[3 * i], X[3 * i + 1], X[3 * i + 2]];
  const meanOf = (idx) => { const m = idx.reduce((s, i) => s + w[i], 0), c = [0, 0, 0]; for (const i of idx) for (let a = 0; a < 3; a++) c[a] += w[i] * X[3 * i + a]; return { lab: c.map(v => v / (m || 1)), share: m }; };
  const subset = (idx) => { const S = new Float64Array(3 * idx.length); idx.forEach((i, k) => { S[3 * k] = X[3 * i]; S[3 * k + 1] = X[3 * i + 1]; S[3 * k + 2] = X[3 * i + 2]; }); return S; };

  // Colour first: the pixels that read as a colour, and the pixels that read as grey (at any
  // lightness), apart. Greys are the light a place is seen in; colours are the place.
  const hued = [], greys = { dark: [], mid: [], light: [] };
  for (let i = 0; i < n; i++) {
    const l = lab(i), c = chroma(l);
    if (c < 0.025 || (l[0] < 0.15 && c < 0.04)) greys[l[0] < 0.35 ? 'dark' : l[0] > 0.7 ? 'light' : 'mid'].push(i);
    else hued.push(i);
  }

  // Colour candidates from the coloured pixels alone, so a sky that is a twentieth of a grey city
  // still makes a candidate of its own; large areas tempered; near-twins merged.
  let found = [];
  if (hued.length) {
    const cs = kmeans(subset(hued), Float64Array.from(hued, i => Math.sqrt(w[i])), Math.min(10, hued.length), { seed: 7, iterations: 16 }).map(c => ({ lab: c.lab, share: 0 }));
    for (const i of hued) { let b = 0, d = Infinity; cs.forEach((c, j) => { const e = gap(lab(i), c.lab); if (e < d) { d = e; b = j; } }); cs[b].share += w[i]; }
    found = cs.filter(c => c.share > 0).filter(c => ground || !looksBlackOrWhite(c.lab)).sort((x, y) => y.share - x.share);
  }
  const tones = Object.entries(greys).filter(([, idx]) => idx.length).map(([kind, idx]) => ({ ...meanOf(idx), kind }));
  const greyMass = tones.reduce((s, t) => s + t.share, 0);

  // Colours take the slots, by share and by difference from those taken; each needs 2% of the picture.
  const taken = [];
  const apart = (c) => (taken.length ? Math.min(...taken.map(t => gap(t.lab, c.lab))) : Infinity);
  const colourSlots = most - (ground && greyMass >= 0.25 ? 1 : 0);
  while (taken.length < colourSlots) {
    const pool = found.filter(c => !taken.includes(c) && c.share >= 0.02 && apart(c) >= 0.09);
    if (!pool.length) break;
    const score = (c) => Math.sqrt(c.share) * Math.min(1, apart(c) / 0.25);
    taken.push(pool.reduce((x, y) => (score(y) > score(x) ? y : x)));
  }
  // The greys: at most two (the ground the colours stand on), the largest first; more only when a
  // picture has no colour to speak of, so a colourless frame keeps an honest, tonal palette.
  // Without the ground (a voyage, pooled: every trip has its nights and its shadows, so black and
  // white say nothing about this one), no near-black or near-white at all, and a mid grey only to
  // make up three swatches when there is too little colour.
  const usable = ground ? tones : tones.filter(t => t.kind === 'mid');
  const greySlots = ground ? Math.max(0, Math.min(taken.length ? 2 : 3, most - taken.length)) : Math.max(0, least - taken.length);
  const chosen = [...taken, ...usable.filter(t => t.share >= 0.05 || !taken.length).sort((x, y) => y.share - x.share).slice(0, greySlots)];
  while (chosen.length < Math.min(least, found.length + usable.length)) {
    const rest = [...found, ...usable].filter(c => !chosen.includes(c)).sort((x, y) => y.share - x.share)[0];
    if (!rest) break;
    chosen.push(rest);
  }
  const weight = (c) => c.share;

  // The accent, found among the pixels themselves (a few pixels never make a cluster of their own):
  // the vivid ones far from every swatch, if there are enough of them, gathered to their main colour;
  // it takes the place of the weakest colour when the palette is full.
  const far = [];
  for (let i = 0; i < n; i++) { const l = lab(i); if (chroma(l) > 0.1 && Math.min(...chosen.map(t => gap(t.lab, l))) > 0.12) far.push(i); }
  const farMass = far.reduce((s, i) => s + w[i], 0);
  if (far.length && farMass >= 0.003) {
    const top = kmeans(subset(far), Float64Array.from(far, i => w[i] * chroma(lab(i))), 2, { seed: 7, iterations: 12 })[0];
    if (chosen.length >= most) {
      // It displaces the most redundant swatch, the one nearest another, not the smallest: a third
      // blue goes before the only warm stone. A lone grey stays, as the ground.
      const greysIn = chosen.filter(c => c.kind).length;
      const pool = chosen.filter(c => !c.kind || greysIn > 1);
      const nearest = (c) => Math.min(...chosen.filter(o => o !== c).map(o => gap(o.lab, c.lab)));
      const redundant = pool.reduce((x, y) => (nearest(y) < nearest(x) ? y : x));
      chosen.splice(chosen.indexOf(redundant), 1);
    }
    chosen.push({ lab: top.lab, share: 0, accent: true });
  }

  // Shares against the palette itself: every pixel to its nearest swatch.
  const share = new Float64Array(chosen.length);
  for (let i = 0; i < n; i++) { let b = 0, d = Infinity; chosen.forEach((c, j) => { const e = gap(lab(i), c.lab); if (e < d) { d = e; b = j; } }); share[b] += w[i]; }
  const colours = chosen.map((c, j) => ({ lab: c.lab, share: share[j], accent: !!c.accent }))
    .sort((a, b) => a.lab[0] - b.lab[0])
    .map(c => ({ hex: rgbHex(oklabToRgb(...c.lab)), pc: Math.round(c.share * 1000) / 10, accent: c.accent, a: +c.lab[1].toFixed(4), b: +c.lab[2].toFixed(4), L: +c.lab[0].toFixed(3) }));
  return { colours, reading: readingOf({ X, w, n }) };
}

/** The signature as a manifest keeps it: [[hex, share %], …], dark to light, the accent marked with a third 1. */
export const compactSignature = ({ colours }) => colours.map(c => (c.accent ? [c.hex, c.pc, 1] : [c.hex, c.pc]));

/** The signature of weighted colours rather than pixels (a voyage pooled from its photos' 32-colour palettes). */
export function signatureOfColours(list, opts = {}) {
  const n = list.length, X = new Float64Array(3 * n), w = new Float64Array(n);
  list.forEach((c, i) => { X[3 * i] = c.lab[0]; X[3 * i + 1] = c.lab[1]; X[3 * i + 2] = c.lab[2]; w[i] = c.w; });
  const sum = w.reduce((a, b) => a + b, 0) || 1;
  for (let i = 0; i < n; i++) w[i] /= sum;
  return signatureOf({ X, w, n }, opts);
}

/** The picture read as a photographer might: harmony, key, contrast, temperature, saturation. */
export function readingOf({ X, w, n }) {
  let L = 0, C = 0, warm = 0, cm = 0;
  const Ls = [], hues = new Float64Array(12);
  for (let i = 0; i < n; i++) {
    const l = [X[3 * i], X[3 * i + 1], X[3 * i + 2]], c = chroma(l);
    L += w[i] * l[0]; C += w[i] * c; Ls.push([l[0], w[i]]);
    if (!isGrey(l[0], c)) { warm += w[i] * (l[2] + 0.4 * l[1]); cm += w[i]; hues[Math.floor(hueOf(l) / 30)] += w[i] * c; }
  }
  Ls.sort((a, b) => a[0] - b[0]);
  const at = (q) => { let s = 0; for (const [v, m] of Ls) { s += m; if (s >= q) return v; } return Ls[Ls.length - 1][0]; };
  const range = at(0.95) - at(0.05);
  // Hue families: 30° bins holding at least a tenth of the colour.
  const total = hues.reduce((s, v) => s + v, 0);
  const fam = [...hues.keys()].filter(k => total && hues[k] / total >= 0.1).map(k => k * 30 + 15);
  let harmony;
  if (cm < 0.12 || C < 0.02 || !fam.length) harmony = 'Tonal';
  else {
    const spread = Math.max(0, ...fam.flatMap(x => fam.map(y => hueGap(x, y))));
    harmony = spread <= 30 ? 'Monochrome' : spread <= 60 ? 'Analogous' : fam.some(x => fam.some(y => hueGap(x, y) >= 150)) ? 'Complementary' : 'Contrasting';
  }
  const lean = cm ? warm / cm : 0;
  return {
    harmony,
    key: L < 0.38 ? 'Low-key' : L > 0.62 ? 'High-key' : 'Mid-key',
    contrast: range > 0.6 ? 'Hard' : range > 0.35 ? 'Moderate' : 'Soft',
    temperature: lean > 0.012 ? 'Warm' : lean < -0.012 ? 'Cool' : 'Neutral',
    saturation: C < 0.04 ? 'Muted' : C < 0.08 ? 'Moderate' : 'Vivid',
    L: +L.toFixed(3), C: +C.toFixed(3), range: +range.toFixed(3), lean: +lean.toFixed(4),
  };
}

/** Several pictures' points as one, each picture counting once. */
export function poolPoints(list) {
  const n = list.reduce((s, p) => s + p.n, 0), X = new Float64Array(3 * n), w = new Float64Array(n);
  let o = 0;
  for (const p of list) { X.set(p.X, 3 * o); for (let i = 0; i < p.n; i++) w[o + i] = p.w[i] / list.length; o += p.n; }
  return { X, w, n };
}
