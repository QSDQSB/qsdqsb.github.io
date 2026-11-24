/**
 * A fable's room, and the door's (_includes/fable-room.html, _sass/_bestiary.scss): its cover's palette
 * poured by the site's dye vat (assets/js/colour/vat.js), quiet and a step below the page's ground, laid on
 * the paper as a wash of watercolour that dried short of the words.
 *
 * Where the wash stopped is worked out for every pixel, from how far it lies from the column of words,
 * that distance bent by a noise that is itself bent by noise (a warp of a warp), so the edge wanders in
 * and out and up and down as a dried wash does, never a straight band. Out in the room the dye is the vat's
 * own; toward the words it thins (laid on the paper as pigment is, the paper's colour filtered by it, so a
 * thin wash is a paler one of the same colour, not a grey veil) through a feathered margin that is softer
 * in some places than others, with, where the water stood last, a faint line of the pigment it carried.
 * The words stand on the ground itself: the wash never reaches the column.
 *
 * One canvas the size of the window, fixed with the room, drawn once (and again when the window settles at
 * a new width); one more under the cover's foot, the page's own paper, whose lower edge wanders too, so the
 * painting dissolves into one paper across the width and the dye comes in beside the words below it.
 *
 * Where the window leaves no room beside the words there is no dye and the sheet is the whole width.
 * Without WebGL the same wash is worked out on the page at a quarter of the size and drawn over the dye.
 */
import { vat, seedOf, oklab } from '../colour/vat.js';

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const toHex = (c) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');

// Back from OKLab (the vat's `oklab` goes there), to set each dye at a lightness, not lift it by a share.
const gam = (v) => 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);
function fromOklab([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s]
    .map((v) => Math.min(255, Math.max(0, gam(Math.min(1, Math.max(0, v))))));
}
const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };

// The dye shows only where the window leaves this much room beside the words, each side: narrower, a band
// of it reads as a stripe, not a room (the owner, 2026-11-24), and the sheet is the whole width.
const ROOM = 160;

// The wash, in CSS pixels. p: the pixel, top down. Noise is gradient noise, its octaves turned against
// each other so no grid shows; the warp is the same field fed back into itself twice.
const GLSL_NOISE = `
uniform float seed;
float hash(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031 + seed * 0.0173); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float gn(vec2 p) { vec2 i = floor(p), f = fract(p); vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a0 = 6.2831853 * hash(i), a1 = 6.2831853 * hash(i + vec2(1.0, 0.0)), a2 = 6.2831853 * hash(i + vec2(0.0, 1.0)), a3 = 6.2831853 * hash(i + vec2(1.0, 1.0));
  float a = dot(vec2(cos(a0), sin(a0)), f), b = dot(vec2(cos(a1), sin(a1)), f - vec2(1.0, 0.0));
  float c = dot(vec2(cos(a2), sin(a2)), f - vec2(0.0, 1.0)), d = dot(vec2(cos(a3), sin(a3)), f - vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y); }
float fbm(vec2 p, int oct) { float v = 0.0, a = 0.5; mat2 R = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 7; i++) { if (i >= oct) break; v += a * gn(p); p = R * p * 2.03 + 17.1; a *= 0.5; } return v; }
`;

const FRAG = `
precision highp float;
uniform sampler2D dye; uniform vec2 view; uniform float dpr, mode;
uniform float wander, colL, colR, edge, edge2, amp, feather, warpA, tide, foot, band;
uniform vec3 ground;
uniform float coverBias, rampH;
${GLSL_NOISE}
vec3 toLin(vec3 c) { return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c)); }
vec3 toSrgb(vec3 c) { c = clamp(c, 0.0, 1.0); return mix(12.92 * c, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
void main() {
  vec2 p = vec2(gl_FragCoord.x, view.y * dpr - gl_FragCoord.y) / dpr;
  // Two triangular-dither values, a pixel's own, so the long thin gradients never step in 8 bits.
  float dith = (hash(gl_FragCoord.xy + 3.7) + hash(gl_FragCoord.yx + 9.1) - 1.0) / 255.0;
  // The column of words and a little past it: the ground, and nothing to work out.
  if (mode > 0.5 && mode < 1.5 && p.y < foot - band * 0.8) { gl_FragColor = vec4(toSrgb(ground), 1.0); return; }
  if (mode < 0.5 && max(colL - p.x, p.x - colR) < 6.0) { gl_FragColor = vec4(toSrgb(ground) + dith, 1.0); return; }
  // The warp: broad, then broad again through itself.
  vec2 s = p / 520.0;
  vec2 q = vec2(fbm(s, 3), fbm(s + vec2(5.2, 1.3), 3));
  vec2 r = vec2(fbm(s + 2.4 * q + vec2(1.7, 9.2), 4), fbm(s + 2.4 * q + vec2(8.3, 2.8), 4));
  if (mode > 0.5 && mode < 1.5) {
    // The paper under the cover's foot: whole, then thinning out downward along a wandering line.
    float y = p.y + band * 0.55 * fbm(vec2(p.x / 300.0, 3.0) + r, 5) + band * 0.18 * r.y;
    float t = clamp((y - foot) / band, 0.0, 1.0);
    float a = 1.0 - t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
    a = clamp(a + dith, 0.0, 1.0);
    gl_FragColor = vec4(toSrgb(ground) * a, a);
    return;
  }
  float d0, d, e1;
  if (mode > 1.5) {
    // The door: the wash over the whole page, words and all (the owner, 2026-11-24: no paper kept clear in
    // the middle), dried in broad patches and clearings. Its "distance" is how far inside a patch a point
    // lies, so the same thinning, dried edge and tide line follow.
    float cover = fbm(p / 640.0 + 1.3 * r + 2.1, 4) + coverBias;
    d0 = 1e4; d = cover * 420.0 + warpA * 2.0 * r.x; e1 = 0.0;
  } else {
    // How far outward from the column of words, measured at a bent position.
    vec2 pw = p + warpA * 2.0 * r;
    d0 = max(colL - p.x, p.x - colR);
    d = max(colL - pw.x, pw.x - colR);
    // The wash thins toward the words over a broad margin, its line bent only gently (F1 wide).
    e1 = edge + wander * smoothstep(-0.22, 0.22, fbm(p / 560.0 + 0.5 * r + 4.4, 2)) + amp * 0.5 * fbm(p / 300.0 + r, 3);
  }
  float u1 = clamp((d - e1) / feather * 0.5 + 0.5, 0.0, 1.0);
  float D1 = u1 * u1 * u1 * (u1 * (u1 * 6.0 - 15.0) + 10.0);
  // Where the water stopped: a line that wanders by a finer noise bent by the warp, cutting the wash only
  // where it is already thin, so its shape is for the close look and not a line at reading distance.
  float n = fbm(p / 240.0 + 1.6 * r, 5);
  float e2 = e1 - 0.45 * feather + amp * 1.7 * n;
  float F2 = edge2 * mix(0.45, 1.0, smoothstep(-0.35, 0.35, fbm(p / 380.0 + r + 3.3, 3)));
  float u2 = clamp((d - e2) / F2 * 0.5 + 0.5, 0.0, 1.0);
  float D = D1 * u2 * u2 * (3.0 - 2.0 * u2);
  // The tide line: a little more pigment where the wash dried last, broken, never a whole line.
  float tw = 2.5 + 4.0 * smoothstep(-0.3, 0.3, fbm(p / 160.0 + 5.1, 2));
  float at = (d - (e2 + 0.15 * F2)) / tw;
  D *= 1.0 + tide * exp(-at * at) * smoothstep(-0.05, 0.3, fbm(p / 110.0 + r * 1.5 + 7.1, 3));
  // The dye's own unevenness: pooled here, thin there, and the paper's tooth under it.
  D *= 1.0 + 0.22 * fbm(p / 85.0 + 2.0 * r, 4) + 0.05 * gn(p / 2.2);
  // Never on a fable's words: the column and a little past it stay paper, whatever the noise does.
  D *= smoothstep(6.0, 26.0, d0);
  // The door: no contrast at the hero's foot, where the painting's own meadow carries on (the mirror),
  // the wash coming in over the first screen below it and quieting toward the page's end.
  if (mode > 1.5) D *= smoothstep(foot, foot + rampH, p.y) * (1.0 - 0.6 * smoothstep(view.y - 900.0, view.y, p.y));
  D = max(D, 0.0);
  // The vat, its layers bent too, so they lie as currents rather than strata.
  vec2 uv = p / view + vec2(0.11, 0.16) * 2.0 * r + vec2(0.0, 0.05 * fbm(p / 900.0 + 9.0, 2));
  uv = 1.0 - abs(1.0 - abs(uv));
  vec3 C = toLin(texture2D(dye, uv).rgb);
  // Laid on the paper as pigment is: the paper's light filtered by the dye, as much as there is of it.
  vec3 T = clamp(C / max(ground, vec3(1e-4)), 0.0, 16.0); // above 1 on a dark ground: the wash glows on it
  vec3 o = ground * pow(T, vec3(D));
  gl_FragColor = vec4(toSrgb(o) + dith, 1.0);
}`;

function gl2(w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const gl = c.getContext('webgl', { premultipliedAlpha: true, preserveDrawingBuffer: true, antialias: false });
  if (!gl) return null;
  const sh = (t, src) => { const x = gl.createShader(t); gl.shaderSource(x, src); gl.compileShader(x); return x; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, 'attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }'));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG)); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const at = gl.getAttribLocation(prog, 'a'); gl.enableVertexAttribArray(at); gl.vertexAttribPointer(at, 2, gl.FLOAT, false, 0, 0);
  const u = (n) => gl.getUniformLocation(prog, n);
  return { gl, c, u };
}

// The same wash on the page's own arithmetic, for a browser without WebGL: coarser noise (value noise,
// three octaves), at a quarter of the size, as the paper's alpha over the dye.
function washFallback(ctx, W, H, g, o) {
  const k = 4, w = Math.ceil(W / k), h = Math.ceil(H / k), img = ctx.createImageData(w, h);
  const hs = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7 + o.seed * 0.013) * 43758.5453; return s - Math.floor(s); };
  const vn = (x, y) => { const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
    const a = hs(ix, iy), b = hs(ix + 1, iy), c = hs(ix, iy + 1), d = hs(ix + 1, iy + 1); return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy - 0.5; };
  const fb = (x, y) => vn(x, y) * 0.5 + vn(x * 2.03 + 17, y * 2.03 + 17) * 0.25 + vn(x * 4.1 + 31, y * 4.1 + 31) * 0.125;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const x = i * k, y = j * k, rx = fb(x / 520, y / 520), ry = fb(x / 520 + 5.2, y / 520 + 1.3);
    const px = x + o.warpA * 2 * rx, d = Math.max(o.colL - px, px - o.colR), d0 = Math.max(o.colL - x, x - o.colR);
    const e = o.edge + o.amp * 1.7 * fb(x / 230 + rx, y / 230 + ry);
    let t = Math.min(1, Math.max(0, (d - e) / (o.feather * 0.8) * 0.5 + 0.5));
    t = t * t * t * (t * (t * 6 - 15) + 10) * Math.min(1, Math.max(0, (d0 - 6) / 20));
    const q = (j * w + i) * 4; img.data[q] = g[0]; img.data[q + 1] = g[1]; img.data[q + 2] = g[2]; img.data[q + 3] = Math.round(255 * (1 - t));
  }
  const tmp = document.createElement('canvas'); tmp.width = w; tmp.height = h; tmp.getContext('2d').putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = true; ctx.drawImage(tmp, 0, 0, W, H);
}

const room = document.querySelector('[data-fable-room]');
const sheet = document.querySelector('[data-fable-sheet]');

// The door's wash (`data-mode="full"`, the door's room): the photograph's colours over the whole page below
// its hero, a canvas the page's height in the sheet, so its clearings stay round the words as they scroll.
function drawDoor(palette, groundHex, seed) {
  const W = innerWidth, H = document.documentElement.scrollHeight;
  const dpr = Math.min(1.25, devicePixelRatio || 1, 4000 / H);
  const G = oklab(groundHex)[0];
  // On a dark ground (the door's dusk: the owner, 2026-11-24) the palette is the wash itself, colours
  // already set a little above the ground in the painting's own hues; on a light one each colour is set a
  // step below the ground, as a fable's room is. Either way the door's words stand on the wash, so every
  // ink is checked against the far end of it (_pages/bestiary.md).
  const dark = G < 0.5;
  const quiet = palette.map((p) => {
    const [L, a, b] = oklab(p.hex);
    const c = Math.hypot(a, b), k = Math.min(dark ? 1 : 0.9, c ? (dark ? 0.09 : 0.07) / c : 0);
    return { ...p, accent: false, hex: dark ? toHex(fromOklab([L, a * k, b * k])) : toHex(fromOklab([G - 0.075 - 0.04 * (1 - L), a * k, b * k])) };
  });
  const dye = vat(quiet, { shape: 'rect', width: Math.round(W / 2), height: Math.round(Math.min(H, 2400) / 2), seed, calm: 0.45 });
  const out = document.createElement('canvas'); out.width = Math.round(W * dpr); out.height = Math.round(H * dpr);
  out.style.cssText = `position:absolute;left:0;top:0;width:100%;height:${H}px`;
  const r = gl2(out.width, out.height);
  if (!r) return; // no WebGL: the plain parchment
  sheet.append(out);
  const { gl, c, u } = r;
  const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, dye);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.uniform1i(u('dye'), 0); gl.uniform1f(u('dpr'), dpr); gl.uniform1f(u('seed'), seed % 997);
  const o = dark ? { feather: 220, amp: 40, edge2: 40, warpA: 30, tide: 0.1, coverBias: 0.08, rampH: innerHeight } : { feather: 150, amp: 60, edge2: 40, warpA: 30, tide: 0.5, coverBias: 0.08, rampH: 0 };
  for (const k of Object.keys(o)) gl.uniform1f(u(k), o[k]);
  gl.uniform3f(u('ground'), ...hex(groundHex).map(lin));
  const hero = document.querySelector('.page__hero--overlay');
  gl.uniform1f(u('foot'), hero ? hero.getBoundingClientRect().bottom + scrollY : 0);
  c.width = out.width; c.height = out.height; gl.viewport(0, 0, out.width, out.height);
  gl.uniform2f(u('view'), W, H); gl.uniform1f(u('mode'), 2);
  gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  out.getContext('2d').drawImage(c, 0, 0);
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  if (hero && dark) mirror(hero);
}

// The meadow carries on: under the hero, its own painting turned over and softened, so every column goes on
// in its own colour (the tent's dark, the fire's warmth, the stone's grey) and fades into the wash over half
// a screen. The hero's straight dissolve then lands on the painting itself and cannot be found.
function mirror(hero) {
  const media = hero.querySelector('.page__hero-media');
  const url = media && (getComputedStyle(media).backgroundImage.match(/url\("?([^")]+)"?\)/) || [])[1];
  if (!url) return;
  const img = new Image();
  img.onload = () => {
    const box = hero.getBoundingClientRect(), W = box.width, H = box.height, pad = 60;
    const s = Math.max(W / img.naturalWidth, H / img.naturalHeight), bw = img.naturalWidth * s, bh = img.naturalHeight * s;
    const [px, py] = getComputedStyle(media).backgroundPosition.split(' ').map((v, i) => (v.endsWith('%') ? (parseFloat(v) / 100) * ((i ? H : W) - (i ? bh : bw)) : parseFloat(v)));
    // Only the meadow carries on: the band of the painting under its peaks (from b0 to b1 of the hero's
    // height), turned over and drawn long, from where the hero's fade begins, so the reflection meets the
    // painting row for row and no mountain or sky is carried down into it.
    // Drawn tiny and wide-soft (a few dozen pixels across, more down), so the browser's own scaling smears it
    // sideways into a haze of the meadow's colours, never upright stripes of its tent and figures.
    const b0 = 0.44 * H, b1 = 0.7 * H, len = 1.05 * H, c = document.createElement('canvas');
    c.width = 48; c.height = Math.max(24, Math.round(len / 12));
    const ctx = c.getContext('2d');
    // Source rows b1 → b0 of the drawn cover map to canvas rows 0 → len.
    const sy = (b0 - py) / s, sh = (b1 - b0) / s, sx = -(px + pad) / s, sw = (W + 2 * pad) / s;
    ctx.translate(0, c.height); ctx.scale(1, -1);
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, c.width, c.height);
    const top = (H - b1) / len;
    const mask = `linear-gradient(to bottom, transparent 0%, #000 ${Math.max(6, top * 100).toFixed(1)}%, rgba(0,0,0,.75) ${((top + (1 - top) * 0.3) * 100).toFixed(1)}%, rgba(0,0,0,.32) ${((top + (1 - top) * 0.6) * 100).toFixed(1)}%, rgba(0,0,0,.08) ${((top + (1 - top) * 0.84) * 100).toFixed(1)}%, transparent 100%)`;
    c.className = 'fable-mirror';
    c.style.cssText = `position:absolute;left:${-pad}px;top:${box.top + scrollY + b1}px;width:${W + 2 * pad}px;height:${len}px;opacity:.55;filter:blur(28px);-webkit-mask-image:${mask};mask-image:${mask};`;
    sheet.append(c);
  };
  img.src = url;
}

function draw() {
  const css = getComputedStyle(document.documentElement);
  const groundHex = css.getPropertyValue('--fable-ground').trim();
  const palette = JSON.parse(room.dataset.palette || '[]');
  const words = document.querySelector('.fable');
  const W = innerWidth, H = innerHeight, dpr = Math.min(1.5, devicePixelRatio || 1);
  const box = words ? words.getBoundingClientRect() : null;
  const gap = box ? (W - box.width) / 2 : 0;
  const roomy = palette.length > 0 && gap >= ROOM;
  const seed = seedOf(room.dataset.seed || 'bestiary');

  room.replaceChildren(); sheet.replaceChildren();
  if (room.dataset.mode === 'full') { sheet.style.background = 'var(--fable-ground)'; if (palette.length) drawDoor(palette, groundHex, seed); return; }
  sheet.style.background = roomy ? '' : 'var(--fable-ground)';
  if (!roomy) return;

  const G = oklab(groundHex)[0];
  const quiet = palette.filter((p) => !p.accent).map((p) => {
    const [L, a, b] = oklab(p.hex);
    const c = Math.hypot(a, b), k = Math.min(0.8, c ? 0.035 / c : 0);
    return { ...p, hex: toHex(fromOklab([G - 0.09 - 0.05 * (1 - L), a * k, b * k])) };
  });
  // Poured with a current through its layers (calm .45, not .8): bent again below, it lies as drifts.
  const dye = vat(quiet, { shape: 'rect', width: Math.round(W / 2), height: Math.round(H / 2), seed, calm: 0.45 });

  // The wash's measures, from the room there is: the line where it stopped sits clear of the column by
  // its own wander and feather, so it never reaches the words, and is whole well short of the window's edge.
  const feather = Math.min(0.3 * gap, 170), amp = Math.min(0.12 * gap, 80), edge2 = Math.min(0.1 * gap, 50), warpA = Math.min(0.06 * gap, 36);
  const o = { colL: box.left, colR: box.right, amp, feather, edge2, warpA, wander: Math.min(0.24 * gap, 130), edge: 26 + edge2 + amp * 1.3 + warpA * 0.6 + 0.45 * feather, tide: 0.5, seed: seed % 997 };
  const ground = hex(groundHex);
  const cover = document.querySelector('.page__hero--overlay');
  const foot = (cover ? cover.getBoundingClientRect().bottom + scrollY : Math.min(H * 0.68, 720)) + 24, band = H * 0.32;

  const out = document.createElement('canvas'); out.width = Math.round(W * dpr); out.height = Math.round(H * dpr);
  const head = document.createElement('canvas'); head.width = Math.round(W * dpr); head.height = Math.round((foot + band * 1.4) * dpr);
  head.style.cssText = `position:absolute;left:0;top:0;width:100%;height:${Math.round(foot + band * 1.4)}px`;
  room.append(out); sheet.append(head);

  const r = gl2(out.width, out.height);
  if (!r) {
    const ctx = out.getContext('2d'); ctx.drawImage(dye, 0, 0, out.width, out.height);
    ctx.save(); ctx.scale(dpr, dpr); washFallback(ctx, W, H, ground, o); ctx.restore();
    const hc = head.getContext('2d'), gr = hc.createLinearGradient(0, foot * dpr, 0, (foot + band) * dpr);
    gr.addColorStop(0, groundHex); gr.addColorStop(1, groundHex + '00'); hc.fillStyle = gr; hc.fillRect(0, 0, head.width, head.height);
    return;
  }
  const { gl, c, u } = r;
  const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, dye);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.uniform1i(u('dye'), 0); gl.uniform1f(u('dpr'), dpr); gl.uniform1f(u('seed'), o.seed);
  for (const k of ['wander', 'colL', 'colR', 'edge', 'edge2', 'amp', 'feather', 'warpA', 'tide']) gl.uniform1f(u(k), o[k]);
  gl.uniform3f(u('ground'), ...ground.map(lin)); gl.uniform1f(u('foot'), foot); gl.uniform1f(u('band'), band);
  const pass = (mode, w, h, target) => {
    c.width = w; c.height = h; gl.viewport(0, 0, w, h);
    gl.uniform2f(u('view'), w / dpr, h / dpr); gl.uniform1f(u('mode'), mode);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    target.getContext('2d').drawImage(c, 0, 0, w, h, 0, 0, w, h);
  };
  pass(0, out.width, out.height, out);
  pass(1, head.width, head.height, head);
  gl.getExtension('WEBGL_lose_context')?.loseContext();
}

if (room && sheet) {
  draw();
  // Drawn again when the window settles at a new width (a phone turned, a window resized), not as it moves.
  let w = innerWidth, t;
  addEventListener('resize', () => { clearTimeout(t); t = setTimeout(() => { if (innerWidth !== w) { w = innerWidth; draw(); } }, 250); });
}
