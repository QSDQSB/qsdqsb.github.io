/**
 * Painting a voyage's mood from its five colours (QSD's Palette), for the lab pages: the dye vat (the
 * colours stirred together in one round vessel), watercolour splashes, oil in the manner of Monet, oil
 * in swirls, bokeh circles, and soft fields. Each painting
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

// ── the dye vat (染缸) ─────────────────────────────────────────────────────
// A round vat seen from above: each colour poured in at its own place, as much as its share, then the
// liquid stirred (a slow swirl about the centre, and a broad flow warped twice over), so the colours
// run into one another in long soft currents. Mixed in OKLab with the chroma kept, so where two colours
// meet they make a clean third, never a grey. No seams, no grain: it should blend. WebGL; `t` stirs it on.
const VAT_FRAG = `
precision highp float;
uniform vec2 res, org; uniform float seed, t;
uniform vec3 col[5]; uniform float wt[5]; uniform vec2 pos[5]; uniform int n;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7)) + seed * 0.013) * 43758.5453); }
float noise(vec2 p) { vec2 i = floor(p), f = fract(p); vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y); }
float fbm(vec2 p) { float v = 0.0, a = 0.55; for (int i = 0; i < 3; i++) { v += a * noise(p); p = p * 1.9 + 11.0; a *= 0.45; } return v / 0.85; }
vec3 toRgb(vec3 c) { float l = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z, m = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z, s = c.x - 0.0894841775 * c.y - 1.2914855480 * c.z;
  l = l * l * l; m = m * m * m; s = s * s * s;
  vec3 lin = vec3(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s);
  lin = clamp(lin, 0.0, 1.0); return mix(12.92 * lin, 1.055 * pow(lin, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, lin)); }
void main() {
  vec2 uv = ((gl_FragCoord.xy - org) / res) * 2.0 - 1.0; uv.y = -uv.y;
  float r = length(uv);
  vec3 ground = vec3(0.078, 0.078, 0.082);
  float aa = 2.0 / res.x;
  if (r > 1.0 + aa) { gl_FragColor = vec4(ground, 1.0); return; }
  // Stir: a slow swirl about the centre, stronger inside.
  float ang = 2.2 * pow(1.0 - min(r, 1.0), 1.5) + t * 0.05;
  vec2 p = mat2(cos(ang), -sin(ang), sin(ang), cos(ang)) * uv;
  // The flow: broad currents, warped twice, so the colours draw out in long soft ribbons.
  vec2 o = vec2(seed * 0.0071, seed * 0.0037);
  vec2 q = vec2(fbm(p * 1.1 + o), fbm(p * 1.1 + o + vec2(5.2, 1.3)));
  vec2 w = vec2(fbm(p * 1.3 + 2.4 * q + vec2(1.7, 9.2) + t * 0.02), fbm(p * 1.3 + 2.4 * q + vec2(8.3, 2.8) - t * 0.017));
  vec2 pw = p + 0.7 * (w - 0.5);
  // Each colour's hold here: as much liquid as its share, nearer where it was poured the stronger.
  float ws[5]; float tot = 0.0;
  for (int k = 0; k < 5; k++) { ws[k] = 0.0; if (k >= n) continue;
    vec2 d = pw - pos[k]; ws[k] = pow(exp(-dot(d, d) / (0.12 + 0.6 * wt[k])) * (0.25 + wt[k]), 1.7); tot += ws[k]; }
  float L = 0.0, C = 0.0; vec2 ab = vec2(0.0);
  for (int k = 0; k < 5; k++) { if (k >= n) continue; float a = ws[k] / tot;
    L += a * col[k].x; ab += a * col[k].yz; C += a * length(col[k].yz); }
  // Keep the chroma: a mixture of two colours is a colour, not the grey their average would be; but
  // across nearly opposite hues let it settle, as paint does, rather than pass through a rainbow.
  float h = length(ab); if (h > 1e-4) ab *= mix(1.0, C / h, smoothstep(0.25, 0.75, h / max(C, 1e-4)));
  vec3 rgb = toRgb(vec3(L, ab));
  // The vessel, lightly: a faint sheen above left, a hairline of light at the rim.
  rgb += 0.045 * smoothstep(0.7, 0.0, length(uv - vec2(-0.4, -0.45)));
  rgb = mix(rgb, rgb + 0.08, smoothstep(0.975, 1.0, r));
  gl_FragColor = vec4(mix(rgb, ground, smoothstep(1.0 - aa, 1.0 + aa, r)), 1.0);
}`;

function vat(palette, W, H, { stir = false } = {}) {
  const c = document.createElement('canvas'), dpr = Math.min(2, devicePixelRatio || 1), S = Math.min(W, H);
  c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); c.style.aspectRatio = `${W} / ${H}`;
  const gl = c.getContext('webgl', { preserveDrawingBuffer: true, antialias: true });
  if (!gl) return fields(palette, W, H);
  const sh = (type, src) => { const x = gl.createShader(type); gl.shaderSource(x, src); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, 'attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }'));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, VAT_FRAG)); gl.linkProgram(prog); gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const a = gl.getAttribLocation(prog, 'a'); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
  // The vat is a square in the middle of the canvas.
  const side = Math.round(S * dpr), ox = Math.round((c.width - side) / 2), oy = Math.round((c.height - side) / 2);
  gl.clearColor(0.078, 0.078, 0.082, 1); gl.clear(gl.COLOR_BUFFER_BIT); gl.viewport(ox, oy, side, side);
  const cs = colours(palette).slice(0, 5), total = cs.reduce((s2, x) => s2 + x.w, 0);
  const u = (name) => gl.getUniformLocation(prog, name);
  gl.uniform2f(u('res'), side, side); gl.uniform2f(u('org'), ox, oy); gl.uniform1f(u('seed'), (state % 1000) + 1); gl.uniform1i(u('n'), cs.length);
  // Where each colour is poured: spread round the vat, the largest nearest the middle.
  const order = cs.map((x, i) => i).sort((x, y) => cs[y].w - cs[x].w);
  order.forEach((i, rank) => {
    const col = cs[i], lab = oklab(col.hex), ang = rand() * 2 * Math.PI, rad = rank === 0 ? 0.12 * rand() : 0.32 + rand() * 0.28;
    gl.uniform3f(u(`col[${i}]`), lab[0], lab[1], lab[2]);
    gl.uniform1f(u(`wt[${i}]`), col.w / total);
    gl.uniform2f(u(`pos[${i}]`), Math.cos(ang) * rad, Math.sin(ang) * rad);
  });
  const frame = (t) => { gl.uniform1f(u('t'), t); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); };
  frame(0);
  if (stir) {
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!still) { const t0 = performance.now(); const loop = (now) => { if (!c.isConnected && now - t0 > 1000) return; frame((now - t0) / 1000); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
  }
  return c;
}

export const STYLES = {
  vat: { name: 'Dye vat', note: 'The colours poured into one round vat and stirred, blending like dye in water', draw: vat },
  watercolour: { name: 'Watercolour', note: 'Splashes on warm paper, bleeding and pooling', draw: watercolour },
  monet: { name: 'Oil · Monet', note: 'Short level strokes, like water and sky', draw: monet },
  swirl: { name: 'Oil · swirls', note: 'Strokes caught in a moving air', draw: swirl },
  bokeh: { name: 'Bokeh', note: 'Out-of-focus lights, glowing where they cross', draw: bokeh },
  fields: { name: 'Fields', note: 'Soft bands, light above dark, a sky over its land', draw: fields },
};

export function paint(style, palette, { width = 640, height = 400, seed = 1, stir = false } = {}) {
  state = seed;
  return STYLES[style].draw(palette, width, height, { stir });
}
