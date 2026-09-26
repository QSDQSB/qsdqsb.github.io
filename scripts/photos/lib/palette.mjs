/**
 * A photograph's colours, compressed once and compared honestly.
 *
 *   palette   up to 32 colours with their shares, found by k-means in OKLab
 *             (perceptual) on a small downsample, stored as sRGB: one
 *             `rrggbbww` per colour, largest first, ww the share out of 255
 *   grid      the mean colour of each ninth of the frame, row by row
 *             (`rrggbb` × 9): what sits above what
 *
 * From those two, everything else is derived and can be re-derived:
 *
 *   distance  how much paint must move to turn one palette into the other
 *             (the earth mover's distance, ground cost the OKLab ΔE × 100),
 *             optionally with the grid's cell-by-cell ΔE blended in
 *   vector    the palette soft-assigned onto 32 fixed anchor colours: a
 *             fixed-length histogram for indexes and quick pre-filters
 *   swatches  the 32 merged down to 5, for the page
 *
 * Deterministic: seeded k-means++ with a fixed number of iterations, so the
 * same pixels always give the same palette.
 */

// ---------------------------------------------------------------- colour spaces

const toLinear = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const toGamma = (c) => { const v = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055; return Math.round(Math.min(1, Math.max(0, v)) * 255); };
const LIN = Float64Array.from({ length: 256 }, (_, i) => toLinear(i));

/** sRGB 0–255 → OKLab [L, a, b]. */
export function rgbToOklab(r, g, b) {
  const R = LIN[r], G = LIN[g], B = LIN[b];
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  return [
    0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
  ];
}

/** OKLab → sRGB 0–255, clipped into gamut. */
export function oklabToRgb(L, a, b) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3;
  return [
    toGamma(+4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    toGamma(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    toGamma(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s),
  ];
}

const hex2 = (n) => n.toString(16).padStart(2, '0');
export const rgbHex = ([r, g, b]) => `#${hex2(r)}${hex2(g)}${hex2(b)}`;
const hexRgb = (h) => [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];

/** ΔE in OKLab, scaled so 1 is about a just-noticeable difference. */
export const deltaE = (p, q) => 100 * Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);

// ---------------------------------------------------------------- k-means

/** A small, seeded generator (mulberry32): the same seed, the same palette. */
function rng(seed) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Weighted k-means in 3-D. `pts` is a flat Float64Array [L,a,b, L,a,b, …], `w` the weight of each.
 * Seeded k-means++ start, then a fixed number of Lloyd steps. Returns centres with their total
 * weight, empty clusters dropped, heaviest first.
 */
export function kmeans(pts, w, k, { seed = 7, iterations = 16 } = {}) {
  const n = w.length;
  if (!n) return [];
  const rand = rng(seed);
  const d2 = (i, c) => { const dx = pts[3 * i] - c[0], dy = pts[3 * i + 1] - c[1], dz = pts[3 * i + 2] - c[2]; return dx * dx + dy * dy + dz * dz; };
  const at = (i) => [pts[3 * i], pts[3 * i + 1], pts[3 * i + 2]];

  // k-means++: each next centre drawn in proportion to weight × squared distance to the nearest so far.
  const total = w.reduce((s, v) => s + v, 0);
  let pick = rand() * total, first = 0;
  for (; first < n - 1 && (pick -= w[first]) > 0; first++);
  const centres = [at(first)];
  const near = new Float64Array(n).fill(Infinity);
  while (centres.length < k) {
    const c = centres[centres.length - 1];
    let sum = 0;
    for (let i = 0; i < n; i++) { near[i] = Math.min(near[i], d2(i, c)); sum += w[i] * near[i]; }
    if (sum <= 1e-12) break; // fewer distinct colours than k
    pick = rand() * sum;
    let i = 0;
    for (; i < n - 1 && (pick -= w[i] * near[i]) > 0; i++);
    centres.push(at(i));
  }

  const K = centres.length, label = new Int32Array(n);
  let mass = new Float64Array(K);
  for (let it = 0; it < iterations; it++) {
    const acc = new Float64Array(3 * K);
    mass = new Float64Array(K);
    for (let i = 0; i < n; i++) {
      let best = 0, bd = Infinity;
      for (let c = 0; c < K; c++) { const d = d2(i, centres[c]); if (d < bd) { bd = d; best = c; } }
      label[i] = best; mass[best] += w[i];
      acc[3 * best] += w[i] * pts[3 * i]; acc[3 * best + 1] += w[i] * pts[3 * i + 1]; acc[3 * best + 2] += w[i] * pts[3 * i + 2];
    }
    for (let c = 0; c < K; c++) if (mass[c] > 0) centres[c] = [acc[3 * c] / mass[c], acc[3 * c + 1] / mass[c], acc[3 * c + 2] / mass[c]];
  }
  return centres.map((lab, c) => ({ lab, w: mass[c] / total })).filter(c => c.w > 0).sort((a, b) => b.w - a.w);
}

// ---------------------------------------------------------------- per photo

export const PALETTE_SIZE = 32;

/** Shares out of 255 that add up to 255 exactly (largest remainder), so nothing is lost to rounding. */
function bytesOf(shares) {
  const raw = shares.map(s => s * 255), out = raw.map(Math.floor);
  let left = 255 - out.reduce((s, v) => s + v, 0);
  raw.map((v, i) => [v - out[i], i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (left-- > 0) out[i]++; });
  return out;
}

/**
 * The palette and the grid, from raw RGB(A) pixels (a downsample: ~96 px on the long edge is plenty).
 * @param {Uint8Array|Buffer} data  row-major, `channels` bytes per pixel
 * @returns {{palette:string, grid:string}}
 */
export function paletteOf(data, width, height, channels = 3, { k = PALETTE_SIZE, seed = 7 } = {}) {
  const n = width * height;
  const pts = new Float64Array(3 * n), w = new Float64Array(n).fill(1);
  const cells = Array.from({ length: 9 }, () => [0, 0, 0, 0]);
  for (let y = 0, i = 0; y < height; y++) for (let x = 0; x < width; x++, i++) {
    const o = i * channels;
    const lab = rgbToOklab(data[o], data[o + 1], data[o + 2]);
    pts[3 * i] = lab[0]; pts[3 * i + 1] = lab[1]; pts[3 * i + 2] = lab[2];
    const cell = cells[Math.min(2, Math.floor(3 * y / height)) * 3 + Math.min(2, Math.floor(3 * x / width))];
    cell[0] += lab[0]; cell[1] += lab[1]; cell[2] += lab[2]; cell[3]++;
  }
  const clusters = kmeans(pts, w, k, { seed });
  // Two clusters that land on the same sRGB byte triple are one colour: fold them before storing.
  const byHex = new Map();
  for (const c of clusters) {
    const h = rgbHex(oklabToRgb(...c.lab)).slice(1);
    byHex.set(h, (byHex.get(h) || 0) + c.w);
  }
  const merged = [...byHex].sort((a, b) => b[1] - a[1]);
  const ww = bytesOf(merged.map(([, s]) => s));
  const palette = merged.map(([h], i) => h + hex2(ww[i])).filter(e => !e.endsWith('00')).join('');
  const grid = cells.map(([L, a, b, c]) => rgbHex(oklabToRgb(L / c, a / c, b / c)).slice(1)).join('');
  return { palette, grid };
}

/** `rrggbbww…` → [{ rgb, lab, w }] with w as a share of 1. */
export function parsePalette(s) {
  if (!s) return [];
  const out = [];
  for (let i = 0; i + 8 <= s.length; i += 8) {
    const rgb = hexRgb(s.slice(i, i + 6)), w = parseInt(s.slice(i + 6, i + 8), 16);
    if (w) out.push({ rgb, lab: rgbToOklab(...rgb), w });
  }
  const sum = out.reduce((a, c) => a + c.w, 0) || 1;
  for (const c of out) c.w /= sum;
  return out;
}

/** `rrggbb` × 9 → nine OKLab triples, row by row. */
export function parseGrid(s) {
  if (!s) return [];
  return Array.from({ length: s.length / 6 }, (_, i) => rgbToOklab(...hexRgb(s.slice(6 * i, 6 * i + 6))));
}

// ---------------------------------------------------------------- distance

/**
 * The earth mover's distance between two weighted palettes (each summing to 1), exact: successive
 * shortest paths on the transport graph, Dijkstra with potentials over a dense 2 + n + m node set.
 * The result is in ΔE: the average distance a unit of colour has to travel.
 */
export function emd(P, Q) {
  const n = P.length, m = Q.length;
  if (!n || !m) return n === m ? 0 : Infinity;
  const C = P.map(p => Q.map(q => deltaE(p.lab, q.lab)));
  const supply = P.map(p => p.w), demand = Q.map(q => q.w);
  const flow = P.map(() => new Float64Array(m));
  // Nodes: 0 source, 1..n suppliers, n+1..n+m consumers, n+m+1 sink.
  const N = n + m + 2, S = 0, T = N - 1, pot = new Float64Array(N);
  const EPS = 1e-12;
  let left = Math.min(supply.reduce((a, b) => a + b, 0), demand.reduce((a, b) => a + b, 0));
  let cost = 0;
  while (left > 1e-9) {
    const dist = new Float64Array(N).fill(Infinity), prev = new Int32Array(N).fill(-1), done = new Uint8Array(N);
    dist[S] = 0;
    for (;;) {
      let u = -1, bd = Infinity;
      for (let v = 0; v < N; v++) if (!done[v] && dist[v] < bd) { bd = dist[v]; u = v; }
      if (u < 0) break;
      done[u] = 1;
      const relax = (v, c) => { const nd = dist[u] + c + pot[u] - pot[v]; if (nd < dist[v] - 1e-12) { dist[v] = nd; prev[v] = u; } };
      if (u === S) { for (let i = 0; i < n; i++) if (supply[i] > EPS) relax(1 + i, 0); }
      else if (u <= n) { const i = u - 1; for (let j = 0; j < m; j++) relax(1 + n + j, C[i][j]); }
      else if (u < T) {
        const j = u - 1 - n;
        if (demand[j] > EPS) relax(T, 0);
        for (let i = 0; i < n; i++) if (flow[i][j] > EPS) relax(1 + i, -C[i][j]);
      }
    }
    if (!Number.isFinite(dist[T])) break;
    for (let v = 0; v < N; v++) if (Number.isFinite(dist[v])) pot[v] += dist[v];
    // The bottleneck along the path, then push it.
    let amt = left;
    for (let v = T; v !== S; v = prev[v]) {
      const u = prev[v];
      if (u === S) amt = Math.min(amt, supply[v - 1]);
      else if (v === T) amt = Math.min(amt, demand[u - 1 - n]);
      else if (u > n) amt = Math.min(amt, flow[v - 1][u - 1 - n]); // a reverse step: undo flow
    }
    for (let v = T; v !== S; v = prev[v]) {
      const u = prev[v];
      if (u === S) supply[v - 1] -= amt;
      else if (v === T) demand[u - 1 - n] -= amt;
      else if (u <= n) { flow[u - 1][v - 1 - n] += amt; cost += amt * C[u - 1][v - 1 - n]; }
      else { flow[v - 1][u - 1 - n] -= amt; cost -= amt * C[v - 1][u - 1 - n]; }
    }
    left -= amt;
  }
  return Math.max(0, cost);
}

/** The mean ΔE between the two frames' ninths, cell by cell: composition, not just colour. */
export function gridDistance(A, B) {
  if (!A.length || A.length !== B.length) return 0;
  return A.reduce((s, a, i) => s + deltaE(a, B[i]), 0) / A.length;
}

/**
 * Picture distance. `composition` blends in the grid (0 = colour only). Takes parsed photos:
 * { P: parsePalette(...), G: parseGrid(...) }.
 */
export function distance(x, y, { composition = 0 } = {}) {
  const d = emd(x.P, y.P);
  return composition ? (1 - composition) * d + composition * gridDistance(x.G, y.G) : d;
}

// ---------------------------------------------------------------- fixed vector

/**
 * 32 fixed anchors, chosen once and never learned from the photographs, so a vector means the same
 * thing next year: five neutrals down the grey axis, then nine hues at three lightnesses, muted
 * (chroma 0.07) the way most of the world is.
 */
export const ANCHORS = (() => {
  const out = [];
  for (const L of [0.12, 0.3, 0.5, 0.7, 0.92]) out.push([L, 0, 0]);
  for (const L of [0.35, 0.6, 0.82]) for (let h = 0; h < 9; h++) {
    const t = (h / 9) * 2 * Math.PI + 0.5;
    out.push([L, 0.07 * Math.cos(t), 0.07 * Math.sin(t)]);
  }
  return out;
})();

/** The palette as a 32-dimension histogram over the anchors (Gaussian soft assignment, σ in ΔE), L1-normalised. */
export function vectorOf(P, { sigma = 10 } = {}) {
  const v = new Float64Array(ANCHORS.length);
  for (const c of P) {
    const k = ANCHORS.map(a => Math.exp(-(deltaE(c.lab, a) ** 2) / (2 * sigma * sigma)));
    const s = k.reduce((a, b) => a + b, 0) || 1;
    k.forEach((x, i) => { v[i] += c.w * x / s; });
  }
  const s = v.reduce((a, b) => a + b, 0) || 1;
  return Array.from(v, x => x / s);
}

/** χ² distance between two histograms: 0 identical, 1 disjoint. */
export function chi2(u, v) {
  let s = 0;
  for (let i = 0; i < u.length; i++) { const t = u[i] + v[i]; if (t > 0) s += (u[i] - v[i]) ** 2 / t; }
  return s / 2;
}

// ---------------------------------------------------------------- for the page

/** Merge weighted palettes down to `k` display swatches: [{ hex, pc }], heaviest first. */
export function swatchesOf(P, k = 5, { seed = 7 } = {}) {
  if (!P.length) return [];
  const pts = new Float64Array(3 * P.length);
  P.forEach((c, i) => { pts[3 * i] = c.lab[0]; pts[3 * i + 1] = c.lab[1]; pts[3 * i + 2] = c.lab[2]; });
  const cs = kmeans(pts, Float64Array.from(P, c => c.w), k, { seed, iterations: 24 });
  return cs.map(c => ({ hex: rgbHex(oklabToRgb(...c.lab)), pc: +(c.w * 100).toFixed(1), lab: c.lab }));
}

/** One voyage's palette: every photo's colours pooled (each photo counts once), merged to `k`. */
export function voyagePalette(palettes, k = 5) {
  const pooled = palettes.flatMap(P => P.map(c => ({ ...c, w: c.w / palettes.length })));
  return swatchesOf(pooled, k);
}

/**
 * An order in which the sheet reads as a gradient: the shortest open path through all the photos
 * under the picture distance (nearest-neighbour start from the darkest, then 2-opt), running dark
 * to light. `D` is a full distance matrix; returns indices.
 */
export function colourPath(D, lightness) {
  const n = D.length;
  if (n < 3) return [...Array(n).keys()];
  const start = lightness.indexOf(Math.min(...lightness));
  const seen = new Uint8Array(n); const path = [start]; seen[start] = 1;
  while (path.length < n) {
    const last = path[path.length - 1];
    let best = -1, bd = Infinity;
    for (let j = 0; j < n; j++) if (!seen[j] && D[last][j] < bd) { bd = D[last][j]; best = j; }
    path.push(best); seen[best] = 1;
  }
  // 2-opt on an open path: reverse a stretch whenever that shortens it.
  for (let improved = true, rounds = 0; improved && rounds < 200; rounds++) {
    improved = false;
    for (let i = 0; i < n - 1; i++) for (let j = i + 1; j < n; j++) {
      const a = i ? path[i - 1] : -1, b = path[i], c = path[j], d = j < n - 1 ? path[j + 1] : -1;
      const before = (a >= 0 ? D[a][b] : 0) + (d >= 0 ? D[c][d] : 0);
      const after = (a >= 0 ? D[a][c] : 0) + (d >= 0 ? D[b][d] : 0);
      if (after < before - 1e-9) { path.splice(i, j - i + 1, ...path.slice(i, j + 1).reverse()); improved = true; }
    }
  }
  const L = (idx) => idx.reduce((s, i) => s + lightness[i], 0) / idx.length;
  const half = Math.floor(n / 2);
  return L(path.slice(0, half)) <= L(path.slice(-half)) ? path : path.reverse();
}
