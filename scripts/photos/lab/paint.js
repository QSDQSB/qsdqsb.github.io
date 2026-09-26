/**
 * Painting a voyage's mood from its five colours (QSD's Palette), for the lab pages: watercolour
 * splashes, oil in the manner of Monet, oil in swirls, bokeh circles, and soft fields. Each painting
 * is seeded by the voyage, so a voyage always gets the same picture. Pure canvas, no dependencies.
 *
 *   paint(style, palette, { width, height, seed }) → <canvas>
 *   palette: [{ hex, pc }], its shares in per cent.
 */

// ── colour ────────────────────────────────────────────────────────────────
const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
export function oklab(h) {
  const R = lin(parseInt(h.slice(1, 3), 16)), G = lin(parseInt(h.slice(3, 5), 16)), B = lin(parseInt(h.slice(5, 7), 16));
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B), m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B), s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}
export function srgb(L, a, b) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3, m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3, s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const g = (v) => { const x = v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055; return Math.round(Math.min(1, Math.max(0, x)) * 255); };
  return `rgb(${g(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s)},${g(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s)},${g(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)})`;
}
const shade = (hex, dL = 0, k = 1) => { const [L, a, b] = oklab(hex); return srgb(L + dL, a * k, b * k); };

// ── chance, seeded ─────────────────────────────────────────────────────────
let state = 1;
const rand = () => { state = (state * 16807) % 2147483647; return state / 2147483647; };
const gauss = () => { let u = 0; for (let i = 0; i < 6; i++) u += rand(); return u / 6 - 0.5; };
export const seedOf = (text) => { let h = 2166136261; for (const ch of String(text)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; } return (h % 2147483646) + 1; };
const pick = (cs) => { let r = rand() * cs.reduce((s, c) => s + c.w, 0); for (const c of cs) if ((r -= c.w) <= 0) return c; return cs[cs.length - 1]; };
const vary = (hex, dl = 0.03, dc = 0.012) => { const [L, a, b] = oklab(hex); return srgb(L + gauss() * dl * 2, a + gauss() * dc * 2, b + gauss() * dc * 2); };

function surface(w, h) {
  const c = document.createElement('canvas'), dpr = Math.min(2, devicePixelRatio || 1);
  c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); c.style.aspectRatio = `${w} / ${h}`;
  const ctx = c.getContext('2d'); ctx.scale(dpr, dpr);
  return [c, ctx];
}
function grain(ctx, amount) {
  const img = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height), d = img.data;
  for (let i = 0; i < d.length; i += 4) { const n = (rand() - 0.5) * 255 * amount; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  ctx.putImageData(img, 0, 0);
}
const colours = (palette) => palette.map((p) => ({ hex: p.hex, w: Math.sqrt(p.pc), L: oklab(p.hex)[0] }));

// ── watercolour ────────────────────────────────────────────────────────────
function deform(pts, depth, spread) {
  for (let d = 0; d < depth; d++) {
    const out = [];
    for (let i = 0; i < pts.length; i++) {
      const [x1, y1, v1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length];
      const len = Math.hypot(x2 - x1, y2 - y1), ang = Math.atan2(y2 - y1, x2 - x1) + (rand() - 0.5) * Math.PI, push = gauss() * len * spread * v1 * 2;
      out.push([x1, y1, v1], [(x1 + x2) / 2 + Math.cos(ang) * push, (y1 + y2) / 2 + Math.sin(ang) * push, v1 * (0.8 + rand() * 0.4)]);
    }
    pts = out;
  }
  return pts;
}
const poly = (ctx, pts) => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); };

// Each colour a splash as large as its share, light ones higher: thin glazes laid one over another
// (each newly deformed, softened a little so the pigment bleeds), a darker rim where it pooled as it
// dried, and a few droplets flicked from the brush. On warm paper, hung on the dark wall.
function watercolour(palette, W, H) {
  const [c, ctx] = surface(W, H);
  ctx.fillStyle = '#151515'; ctx.fillRect(0, 0, W, H);
  const m = Math.round(Math.min(W, H) * 0.06), PW = W - 2 * m, PH = H - 2 * m;
  ctx.fillStyle = '#eee7da'; ctx.fillRect(m, m, PW, PH);
  ctx.save(); ctx.beginPath(); ctx.rect(m, m, PW, PH); ctx.clip();
  const cs = colours(palette).sort((a, b) => b.w - a.w), total = cs.reduce((s, x) => s + x.w, 0);
  const Ls = cs.map((x) => x.L), lo = Math.min(...Ls), hi = Math.max(...Ls);
  cs.forEach((col, k) => {
    const r = Math.sqrt(col.w / total) * PW * 0.36, up = hi > lo ? (col.L - lo) / (hi - lo) : 0.5;
    const cx = m + PW * (0.14 + ((k * 0.23 + rand() * 0.2) % 0.72)), cy = m + PH * (0.72 - up * 0.44 + gauss() * 0.12);
    const base = deform(Array.from({ length: 12 }, (_, i) => { const t = (i / 12) * 2 * Math.PI; return [cx + r * Math.cos(t), cy + r * 0.78 * Math.sin(t), 1]; }), 3, 0.32);
    for (let layer = 0; layer < 22; layer++) {
      ctx.filter = `blur(${0.6 + rand() * 1.4}px)`; ctx.globalAlpha = 0.05; ctx.fillStyle = col.hex;
      poly(ctx, deform(base.map((p) => [...p]), 3, 0.24)); ctx.fill();
    }
    ctx.filter = 'blur(0.8px)'; ctx.globalAlpha = 0.18; ctx.strokeStyle = shade(col.hex, -0.08); ctx.lineWidth = 1.2;
    poly(ctx, deform(base.map((p) => [...p]), 2, 0.12)); ctx.stroke();
    ctx.filter = 'none';
    for (let d = 0; d < 7; d++) { ctx.globalAlpha = 0.25 + rand() * 0.3; ctx.fillStyle = col.hex; ctx.beginPath(); ctx.arc(cx + gauss() * r * 3.2, cy + gauss() * r * 2.4, 0.6 + rand() * 2.4, 0, 2 * Math.PI); ctx.fill(); }
  });
  ctx.restore(); ctx.globalAlpha = 1; ctx.filter = 'none';
  grain(ctx, 0.03);
  return c;
}

// ── oil: Monet ─────────────────────────────────────────────────────────────
// Short, broad, mostly level strokes, as water and sky are painted: each colour as many as its
// share, the light ones towards the top, every stroke a slightly different mix.
function monet(palette, W, H) {
  const [c, ctx] = surface(W, H), cs = colours(palette);
  const Ls = cs.map((x) => x.L), lo = Math.min(...Ls), hi = Math.max(...Ls), dark = cs.reduce((a, b) => (b.L < a.L ? b : a));
  const [dL, da, db] = oklab(dark.hex); ctx.fillStyle = srgb(dL * 0.7, da * 0.7, db * 0.7); ctx.fillRect(0, 0, W, H);
  ctx.lineCap = 'round';
  const n = Math.round(W * H / 30);
  for (let i = 0; i < n; i++) {
    const col = pick(cs), up = hi > lo ? (col.L - lo) / (hi - lo) : 0.5;
    const x = rand() * W, y = Math.min(H + 4, Math.max(-4, H * (0.88 - up * 0.78) + gauss() * H * 0.62));
    const ang = gauss() * 0.35 + Math.sin(y * 0.02) * 0.08, len = 8 + rand() * 12, wid = 4 + rand() * 4;
    ctx.strokeStyle = vary(col.hex, 0.035, 0.014); ctx.globalAlpha = 0.72 + rand() * 0.26; ctx.lineWidth = wid;
    ctx.beginPath(); ctx.moveTo(x - Math.cos(ang) * len / 2, y - Math.sin(ang) * len / 2); ctx.lineTo(x + Math.cos(ang) * len / 2, y + Math.sin(ang) * len / 2); ctx.stroke();
  }
  ctx.globalAlpha = 1; grain(ctx, 0.035);
  return c;
}

// ── oil: swirls ────────────────────────────────────────────────────────────
function swirl(palette, W, H) {
  const [c, ctx] = surface(W, H), cs = colours(palette);
  const Ls = cs.map((x) => x.L), lo = Math.min(...Ls), hi = Math.max(...Ls), dark = cs.reduce((a, b) => (b.L < a.L ? b : a));
  const [dL, da, db] = oklab(dark.hex); ctx.fillStyle = srgb(dL * 0.6, da * 0.6, db * 0.6); ctx.fillRect(0, 0, W, H);
  ctx.lineCap = 'round';
  const n = Math.round(W * H / 52);
  for (let i = 0; i < n; i++) {
    const col = pick(cs), up = hi > lo ? (col.L - lo) / (hi - lo) : 0.5;
    const x = rand() * W, y = Math.min(H, Math.max(0, H * (1 - up) * 0.85 + gauss() * H * 0.9 + H * 0.08));
    const ang = Math.sin(x * 0.011) * 0.6 + Math.cos(y * 0.013) * 0.5 + gauss() * 0.5, len = 7 + rand() * 13, wid = 3 + rand() * 4;
    ctx.strokeStyle = vary(col.hex); ctx.globalAlpha = 0.78 + rand() * 0.2; ctx.lineWidth = wid;
    ctx.beginPath(); ctx.moveTo(x - Math.cos(ang) * len / 2, y - Math.sin(ang) * len / 2); ctx.lineTo(x + Math.cos(ang) * len / 2, y + Math.sin(ang) * len / 2); ctx.stroke();
  }
  ctx.globalAlpha = 1; grain(ctx, 0.04);
  return c;
}

// ── bokeh ──────────────────────────────────────────────────────────────────
// The colours as out-of-focus lights: one large disc each, as large as its share, and a few smaller
// ones drifting from it, glowing where they cross.
function bokeh(palette, W, H) {
  const [c, ctx] = surface(W, H), cs = colours(palette).sort((a, b) => b.w - a.w), total = cs.reduce((s, x) => s + x.w, 0);
  ctx.fillStyle = '#131314'; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'screen';
  const disc = (x, y, r, hex, a) => { const g = ctx.createRadialGradient(x, y, r * 0.2, x, y, r); g.addColorStop(0, hex); g.addColorStop(0.72, hex); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.globalAlpha = a; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI); ctx.fill(); };
  for (const col of cs) {
    const r = Math.sqrt(col.w / total) * Math.min(W, H) * 0.5, x = W * (0.2 + rand() * 0.6), y = H * (0.25 + rand() * 0.5);
    disc(x, y, r, col.hex, 0.88);
    for (let s = 0; s < 3; s++) disc(x + gauss() * r * 4, y + gauss() * r * 3, r * (0.12 + rand() * 0.22), col.hex, 0.5);
  }
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; grain(ctx, 0.03);
  return c;
}

// ── fields ─────────────────────────────────────────────────────────────────
function fields(palette, W, H) {
  const [c, ctx] = surface(W, H), cs = colours(palette).sort((a, b) => b.L - a.L), total = cs.reduce((s, x) => s + x.w, 0);
  const [L0, a0, b0] = oklab(cs[cs.length - 1].hex); ctx.fillStyle = srgb(Math.max(0.12, L0 * 0.55), a0 * 0.6, b0 * 0.6); ctx.fillRect(0, 0, W, H);
  let y = H * 0.065;
  for (const x of cs) {
    const hh = H * 0.87 * (x.w / total);
    ctx.save(); ctx.filter = 'blur(18px)'; ctx.fillStyle = x.hex; ctx.globalAlpha = 0.92; ctx.fillRect(W * 0.055 + rand() * 8, y + 4, W * 0.89 - rand() * 8, hh - 8); ctx.restore();
    y += hh;
  }
  grain(ctx, 0.045);
  return c;
}

export const STYLES = {
  watercolour: { name: 'Watercolour', note: 'Splashes on warm paper, bleeding and pooling', draw: watercolour },
  monet: { name: 'Oil · Monet', note: 'Short level strokes, like water and sky', draw: monet },
  swirl: { name: 'Oil · swirls', note: 'Strokes caught in a moving air', draw: swirl },
  bokeh: { name: 'Bokeh', note: 'Out-of-focus lights, glowing where they cross', draw: bokeh },
  fields: { name: 'Fields', note: 'Soft bands, light above dark, a sky over its land', draw: fields },
};

export function paint(style, palette, { width = 640, height = 400, seed = 1 } = {}) {
  state = seed;
  return STYLES[style].draw(palette, width, height);
}
