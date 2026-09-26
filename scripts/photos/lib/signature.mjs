/**
 * A photograph's signature palette: three to five colours with their shares,
 * chosen the way a designer would, and what they say about the picture.
 *
 * Choosing
 *   1. Pixels near black (L < 0.2) or near white (L > 0.9, and grey: a pale sky is not) are tone, not
 *      colour: each group may give at most one swatch, its own tinted mean
 *      (a warm white stays warm), and counts for little in the choosing.
 *   2. The rest is reduced to twelve candidates (k-means in OKLab, large areas
 *      tempered), each with its true share.
 *   3. Swatches are taken greedily by share and by difference from those taken
 *      (up to 15 ΔE, beyond which a colour counts as fully different); the
 *      palette stops at five, or sooner when the next adds little.
 *   4. An accent: vivid pixels far from every swatch taken (a red bus, a lit
 *      window), if they make up at least 0.3% of the picture, earn a place
 *      for their main colour, at the cost of the weakest swatch.
 *   5. Shares are measured again against the swatches chosen: every pixel to
 *      its nearest. Ordered dark to light.
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
const hueGap = (x, y) => { const d = Math.abs(x - y) % 360; return d > 180 ? 360 - d : d; };

/** @param {{X:Float64Array, w:Float64Array, n:number}} pts  weighted OKLab points (lib/dots.mjs pointsOf) */
export function signatureOf({ X, w, n }, { most = 5, least = 3 } = {}) {
  const lab = (i) => [X[3 * i], X[3 * i + 1], X[3 * i + 2]];
  const dark = [], light = [], mid = [];
  for (let i = 0; i < n; i++) {
    const l = lab(i);
    (l[0] < 0.2 ? dark : l[0] > 0.9 && isGrey(l[0], chroma(l)) ? light : mid).push(i);
  }
  const meanOf = (idx) => { const m = idx.reduce((s, i) => s + w[i], 0), c = [0, 0, 0]; for (const i of idx) for (let a = 0; a < 3; a++) c[a] += w[i] * X[3 * i + a]; return { lab: c.map(v => v / (m || 1)), share: m }; };

  const cands = [];
  if (mid.length) {
    const mX = new Float64Array(3 * mid.length); mid.forEach((i, k) => { mX[3 * k] = X[3 * i]; mX[3 * k + 1] = X[3 * i + 1]; mX[3 * k + 2] = X[3 * i + 2]; });
    for (const c of kmeans(mX, Float64Array.from(mid, i => Math.sqrt(w[i])), 12, { seed: 7, iterations: 16 })) cands.push({ lab: c.lab, kind: 'mid', share: 0 });
    for (const i of mid) { let b = 0, d = Infinity; cands.forEach((c, j) => { const e = gap(lab(i), c.lab); if (e < d) { d = e; b = j; } }); cands[b].share += w[i]; }
  }
  if (dark.length) cands.push({ ...meanOf(dark), kind: 'dark' });
  if (light.length) cands.push({ ...meanOf(light), kind: 'light' });

  // Tone counts for little in the choosing, however much of the picture it fills.
  const weight = (c) => (c.kind === 'mid' ? c.share : Math.min(c.share, 0.15) * 0.5);
  const midMass = cands.filter(c => c.kind === 'mid').reduce((s, c) => s + c.share, 0);
  const chosen = [];
  const score = (c) => {
    const apart = chosen.length ? Math.min(...chosen.map(t => gap(t.lab, c.lab))) : Infinity;
    return Math.sqrt(weight(c)) * Math.min(1, apart / 0.15);
  };
  while (chosen.length < most) {
    const pool = cands.filter(c => !chosen.includes(c) && (chosen.length || c.kind === 'mid' || midMass < 0.1));
    if (!pool.length) break;
    const best = pool.reduce((a, b) => (score(b) > score(a) ? b : a));
    if (chosen.length >= least && score(best) < 0.12) break;
    if (score(best) <= 0) break;
    chosen.push(best);
  }
  // The accent, found among the pixels themselves (a few pixels never make a cluster of their own):
  // the vivid ones far from every swatch, if there are enough of them, gathered to their main colour.
  const far = [];
  for (let i = 0; i < n; i++) { const l = lab(i); if (chroma(l) > 0.1 && Math.min(...chosen.map(t => gap(t.lab, l))) > 0.12) far.push(i); }
  const farMass = far.reduce((s, i) => s + w[i], 0);
  if (far.length && farMass >= 0.003) {
    const fX = new Float64Array(3 * far.length); far.forEach((i, k) => { fX[3 * k] = X[3 * i]; fX[3 * k + 1] = X[3 * i + 1]; fX[3 * k + 2] = X[3 * i + 2]; });
    const top = kmeans(fX, Float64Array.from(far, i => w[i] * chroma(lab(i))), 2, { seed: 7, iterations: 12 })[0];
    if (chosen.length >= most) { const weakest = chosen.slice(1).reduce((a, b) => (weight(b) < weight(a) ? b : a)); chosen.splice(chosen.indexOf(weakest), 1); }
    chosen.push({ lab: top.lab, kind: 'mid', share: 0, accent: true });
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
export function signatureOfColours(list) {
  const n = list.length, X = new Float64Array(3 * n), w = new Float64Array(n);
  list.forEach((c, i) => { X[3 * i] = c.lab[0]; X[3 * i + 1] = c.lab[1]; X[3 * i + 2] = c.lab[2]; w[i] = c.w; });
  const sum = w.reduce((a, b) => a + b, 0) || 1;
  for (let i = 0; i < n; i++) w[i] /= sum;
  return signatureOf({ X, w, n });
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
