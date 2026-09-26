/**
 * A photograph as 24 dots, each one plain RGB colour. Two meanings, and the
 * methods for each:
 *
 * Atoms, to be gathered (a voyage's dots, a month's, an hour's): each dot a
 * twenty-fourth of the picture, so any pooling of dots is a pooling of the
 * pictures themselves.
 *
 *   share     the 24 points closest to the picture when each must stand for
 *             exactly a twenty-fourth of it: k-means under equal capacities,
 *             each assignment solved as optimal transport (Sinkhorn's
 *             iterations, log domain), started from median cut.
 *
 *   balanced  the same with every colour's area square-rooted first: large
 *             areas still take the most dots, but not all of them.
 *
 * A palette, the picture's range: each dot a different colour of it, its
 * proportions lost once drawn equal.
 *
 *   median    median cut into 24 equal-population boxes (the classic
 *             quantiser): a large sky takes many near-identical dots.
 *   kmeans    k-means in OKLab weighted by area: better, still drawn towards
 *             the large areas, so a small accent can merge away.
 *   tempered  k-means with each colour's weight square-rooted: large areas
 *             count for less, small ones for more.
 *   maximin   farthest-point: each next dot the colour furthest from all
 *             before it (weighted a little by how much of it there is), then
 *             settled by k-means steps. The extremes first.
 *   distinct  tempered k-means, then, while two dots lie within a just-
 *             visible 5 ΔE of each other, one of the pair is moved to the
 *             colour the palette covers worst (distance × how much of it),
 *             and the palette settles again. Every slot a different colour.
 *
 * Measures, from a small downsample, in OKLab ΔE (×100):
 *
 *   honesty   the transport cost from the pixels to the dots when each dot
 *             takes a twenty-fourth: how truly the dots, counted equal, stand
 *             for the picture, and so how truly they pool. Lower is better.
 *   reach     the mean distance from a pixel to its nearest dot. Lower is better.
 *   worst     the distance within which 95% of the picture lies. Lower is better.
 *   missed    the share of the picture further than 8 ΔE from every dot.
 *   apart     the mean distance from each dot to its nearest other dot: how
 *             different the 24 are. Higher is better; near 0, slots wasted.
 *
 * Each dot keeps its share of the picture (the pixels nearest it), for
 * ordering and for sizing, though a palette is drawn equal.
 */

import { rgbToOklab, oklabToRgb, rgbHex, kmeans, deltaE } from './palette.mjs';

export const DOTS = 24;
const FAR = 0.08, CLOSE = 0.05;

/** Pixels as weighted OKLab points, near-identical pixels pooled (5 bits a channel). */
export function pointsOf(data, width, height, channels = 3) {
  const bins = new Map();
  for (let i = 0; i < width * height; i++) {
    const o = i * channels, r = data[o], g = data[o + 1], b = data[o + 2];
    const k = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
    const e = bins.get(k);
    if (e) { e[0] += r; e[1] += g; e[2] += b; e[3]++; } else bins.set(k, [r, g, b, 1]);
  }
  const n = bins.size, X = new Float64Array(3 * n), w = new Float64Array(n);
  let i = 0;
  for (const [r, g, b, c] of bins.values()) {
    const lab = rgbToOklab(Math.round(r / c), Math.round(g / c), Math.round(b / c));
    X[3 * i] = lab[0]; X[3 * i + 1] = lab[1]; X[3 * i + 2] = lab[2]; w[i] = c / (width * height); i++;
  }
  return { X, w, n };
}

const at = (X, i) => [X[3 * i], X[3 * i + 1], X[3 * i + 2]];
const dist = (X, i, c) => Math.hypot(X[3 * i] - c[0], X[3 * i + 1] - c[1], X[3 * i + 2] - c[2]);
const nearest = (X, i, C) => { let b = 0, d = Infinity; for (let j = 0; j < C.length; j++) { const e = dist(X, i, C[j]); if (e < d) { d = e; b = j; } } return [b, d]; };

/** Lloyd's steps from given centres (area-weighted unless `w` says otherwise). */
function settle({ X, n }, w, C, steps = 12) {
  C = C.map(c => [...c]);
  for (let s = 0; s < steps; s++) {
    const acc = C.map(() => [0, 0, 0, 0]);
    for (let i = 0; i < n; i++) { const [j] = nearest(X, i, C); const a = acc[j]; a[0] += w[i] * X[3 * i]; a[1] += w[i] * X[3 * i + 1]; a[2] += w[i] * X[3 * i + 2]; a[3] += w[i]; }
    C = acc.map((a, j) => (a[3] > 0 ? [a[0] / a[3], a[1] / a[3], a[2] / a[3]] : C[j]));
  }
  return C;
}

const pad = (C, k) => { const out = [...C]; while (out.length < k) out.push(out[out.length % Math.max(1, C.length)]); return out; };

// ---------------------------------------------------------------- methods

export function medianDots({ X, w, n }, k = DOTS) {
  const out = [];
  const cut = (idx, leaves) => {
    const mass = idx.reduce((s, i) => s + w[i], 0);
    if (leaves === 1 || idx.length === 1) {
      const c = [0, 0, 0];
      for (const i of idx) for (let a = 0; a < 3; a++) c[a] += w[i] * X[3 * i + a];
      for (let l = 0; l < leaves; l++) out.push(c.map(v => v / (mass || 1)));
      return;
    }
    let axis = 0, span = -1;
    for (let a = 0; a < 3; a++) {
      let lo = Infinity, hi = -Infinity;
      for (const i of idx) { lo = Math.min(lo, X[3 * i + a]); hi = Math.max(hi, X[3 * i + a]); }
      if (hi - lo > span) { span = hi - lo; axis = a; }
    }
    const sorted = [...idx].sort((p, q) => X[3 * p + axis] - X[3 * q + axis]);
    const left = Math.floor(leaves / 2), target = mass * left / leaves;
    let acc = 0, s = 0;
    for (; s < sorted.length - 1 && acc + w[sorted[s]] <= target; s++) acc += w[sorted[s]];
    s = Math.min(Math.max(1, s), sorted.length - 1);
    cut(sorted.slice(0, s), left); cut(sorted.slice(s), leaves - left);
  };
  cut([...Array(n).keys()], k);
  return out;
}

export function kmeansDots({ X, w }, k = DOTS) {
  return pad(kmeans(X, w, k, { seed: 7, iterations: 20 }).map(c => c.lab), k);
}

export function temperedDots({ X, w }, k = DOTS) {
  return pad(kmeans(X, Float64Array.from(w, v => Math.sqrt(v)), k, { seed: 7, iterations: 20 }).map(c => c.lab), k);
}

export function maximinDots(pts, k = DOTS) {
  const { X, w, n } = pts;
  let first = 0; for (let i = 1; i < n; i++) if (w[i] > w[first]) first = i;
  const C = [at(X, first)], near = new Float64Array(n).fill(Infinity);
  while (C.length < Math.min(k, n)) {
    const c = C[C.length - 1];
    let best = -1, score = -1;
    for (let i = 0; i < n; i++) {
      near[i] = Math.min(near[i], dist(X, i, c));
      const s = near[i] * Math.pow(w[i], 0.25); // the far first, a little in favour of what there is more of
      if (s > score) { score = s; best = i; }
    }
    if (score <= 0) break;
    C.push(at(X, best));
  }
  return pad(settle(pts, Float64Array.from(w, v => Math.sqrt(v)), C, 4), k);
}

export function distinctDots(pts, k = DOTS, { rounds = 48 } = {}) {
  const { X, w, n } = pts;
  const tw = Float64Array.from(w, v => Math.sqrt(v));
  let C = temperedDots(pts, k);
  for (let r = 0; r < rounds; r++) {
    // The closest pair, if closer than a just-visible difference.
    let pa = -1, pb = -1, pd = Infinity;
    for (let a = 0; a < C.length; a++) for (let b = a + 1; b < C.length; b++) {
      const d = Math.hypot(C[a][0] - C[b][0], C[a][1] - C[b][1], C[a][2] - C[b][2]);
      if (d < pd) { pd = d; pa = a; pb = b; }
    }
    if (pd >= CLOSE) break; // 0.05 in OKLab: 5 ΔE
    // The colour covered worst, by distance and by how much of it there is.
    let worst = -1, ws = -1;
    for (let i = 0; i < n; i++) { const s = nearest(X, i, C)[1] * tw[i]; if (s > ws) { ws = s; worst = i; } }
    if (worst < 0) break;
    // One of the pair takes the pair's middle; the other goes to the colour left out.
    C[pa] = C[pa].map((v, a) => (v + C[pb][a]) / 2);
    C[pb] = at(X, worst);
    C = settle(pts, tw, C, 3);
  }
  return C;
}

/**
 * Transport from the weighted points to centres each taking `cap[j]` of the mass (Sinkhorn, log
 * domain). Returns the plan's per-centre means and its mean distance.
 */
function transport({ X, w, n }, C, cap, { eps = 1e-3, iters = 60 } = {}) {
  const k = C.length, M = new Float64Array(n * k);
  for (let i = 0; i < n; i++) for (let j = 0; j < k; j++) { const d = dist(X, i, C[j]); M[i * k + j] = d * d; }
  const f = new Float64Array(n), g = new Float64Array(k), row = new Float64Array(k), col = new Float64Array(n);
  const la = Float64Array.from(w, v => Math.log(v)), lb = cap.map(v => Math.log(v));
  for (let it = 0; it < iters; it++) {
    for (let i = 0; i < n; i++) {
      let m = -Infinity;
      for (let j = 0; j < k; j++) { row[j] = (g[j] - M[i * k + j]) / eps; if (row[j] > m) m = row[j]; }
      let s = 0; for (let j = 0; j < k; j++) s += Math.exp(row[j] - m);
      f[i] = eps * (la[i] - m - Math.log(s));
    }
    for (let j = 0; j < k; j++) {
      let m = -Infinity;
      for (let i = 0; i < n; i++) { col[i] = (f[i] - M[i * k + j]) / eps; if (col[i] > m) m = col[i]; }
      let s = 0; for (let i = 0; i < n; i++) s += Math.exp(col[i] - m);
      g[j] = eps * (lb[j] - m - Math.log(s));
    }
  }
  const acc = Array.from({ length: k }, () => [0, 0, 0, 0]);
  let cost = 0;
  for (let i = 0; i < n; i++) for (let j = 0; j < k; j++) {
    const p = Math.exp((f[i] + g[j] - M[i * k + j]) / eps);
    if (!p) continue;
    acc[j][0] += p * X[3 * i]; acc[j][1] += p * X[3 * i + 1]; acc[j][2] += p * X[3 * i + 2]; acc[j][3] += p;
    cost += p * Math.sqrt(M[i * k + j]);
  }
  return { means: acc.map((a, j) => (a[3] > 0 ? [a[0] / a[3], a[1] / a[3], a[2] / a[3]] : C[j])), cost };
}

export function shareDots(pts, k = DOTS, { rounds = 6 } = {}) {
  let C = medianDots(pts, k);
  const cap = Array(k).fill(1 / k);
  for (let r = 0; r < rounds; r++) C = transport(pts, C, cap).means;
  return C;
}

/**
 * Balanced: equal shares of the picture with every colour's area tempered first (square-rooted).
 * A night frame that is four-fifths black gives the black about a third of the dots rather than
 * nineteen of them, and the lamps, the lit windows and the sky's last blue take the rest. Each dot
 * still records its true share, so a pooling can weigh it honestly.
 */
export function balancedDots({ X, w, n }, k = DOTS, { temper = 0.5 } = {}) {
  const t = Float64Array.from(w, v => Math.pow(v, temper)), sum = t.reduce((a, b) => a + b, 0);
  return shareDots({ X, w: t.map(v => v / sum), n }, k);
}

export const METHODS = { share: shareDots, balanced: balancedDots, median: medianDots, kmeans: kmeansDots, tempered: temperedDots, maximin: maximinDots, distinct: distinctDots };

// ---------------------------------------------------------------- measures

export function measure({ X, w, n }, C) {
  const ds = [], share = new Float64Array(C.length);
  let reach = 0, missed = 0;
  for (let i = 0; i < n; i++) { const [j, d] = nearest(X, i, C); ds.push([d, w[i]]); reach += w[i] * d; if (d > FAR) missed += w[i]; share[j] += w[i]; }
  ds.sort((a, b) => a[0] - b[0]);
  let acc = 0, worst = 0;
  for (const [d, m] of ds) { acc += m; if (acc >= 0.95) { worst = d; break; } }
  const honesty = transport({ X, w, n }, C, Array(C.length).fill(1 / C.length), { eps: 5e-4, iters: 80 }).cost;
  const apart = C.reduce((s, c, a) => s + Math.min(...C.map((e, b) => (a === b ? Infinity : Math.hypot(c[0] - e[0], c[1] - e[1], c[2] - e[2])))), 0) / C.length;
  return { honesty: +(honesty * 100).toFixed(2), reach: +(reach * 100).toFixed(2), worst: +(worst * 100).toFixed(2), missed: +(missed * 100).toFixed(2), apart: +(apart * 100).toFixed(2), share: Array.from(share) };
}

/**
 * Every method's 24 dots, each dot `rrggbb` with its share (0–255) as `rrggbbss`, darkest first,
 * with the method's measures.
 */
export function dotsOf(data, width, height, channels = 3, methods = METHODS) {
  const pts = pointsOf(data, width, height, channels);
  const out = {};
  for (const [name, fn] of Object.entries(methods)) {
    const C = fn(pts);
    const { share, ...m } = measure(pts, C);
    // Equal share holds a twenty-fourth per dot by construction; the rest, what lies nearest each.
    const dots = C.map((lab, j) => ({ lab, s: fn === shareDots ? 1 / C.length : share[j] })).sort((a, b) => a.lab[0] - b.lab[0]);
    out[name] = { dots: dots.map(d => rgbHex(oklabToRgb(...d.lab)).slice(1) + Math.min(255, Math.round(d.s * 255)).toString(16).padStart(2, '0')).join(''), ...m };
  }
  return out;
}

export { deltaE };
