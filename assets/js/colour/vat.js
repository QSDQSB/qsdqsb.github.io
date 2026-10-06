/**
 * The dye vat (染缸): a palette as one round vat seen from above, its colours poured in and left to
 * drift together in broad, slow currents, so they run softly into one another. Each colour covers as
 * much of the vat as its share, so it tells the truth the colour bar tells: the currents are worked out
 * on the page's own arithmetic too (settle, below), exactly as the graphics card draws them, and each
 * colour's weight set there until it does, a millisecond or so a vat, nothing read back from the card. Mixed in OKLab with the chroma kept, so two colours make
 * a clean third, not a grey (across nearly opposite hues it settles, as paint does).
 *
 * How it pours follows how the colours sit together: a palette of one family (a misty evening, all
 * blues) settles in layers, light above deep, edges misted; a palette of contrasts is stirred into
 * broad currents; most lie between. An accent is always a drop, never a layer.
 *
 * vat(palette, { size, width, height, shape, seed, stir, label, calm }) → a canvas. `palette` is
 * [{hex, pc, accent}] or [[hex, pc, accent]]; `calm` (0 stirred … 1 layered) overrides the choice; the vat is `size` across (or the smaller of width and height), centred, transparent
 * round it. `shape: 'rect'` pours the same dye into the whole width × height instead, its colours
 * spread along its length and weighed over all of it, so each still covers its share (Reverie's
 * opening); drawn small and shown large (it is a mood, and softens as it spreads), it costs no more
 * than a round vat. Still by default: painted on one shared WebGL canvas and copied out, so a page of frames
 * costs one context. `stir: true` gives the vat its own and keeps the currents moving (the lab);
 * `stir: 'hover'` stirs only while a pointer rests on it (or while `canvas.stir(true)`, for a link
 * that leads to it), `speed` steps a second, and on leaving lets the dye settle back to where it was
 * poured, so at rest it is always true to its shares; `stir: 'hold'` stirs only while `canvas.stir(true)`
 * and stays where it stopped (Reverie's opening, stirred from its colour dot). None moves with motion off;
 * a live vat's `release()` lets its context go. Used by the palette page
 * (assets/js/colour/palette.js) and the book's colophon (assets/js/photobook/index.js).
 */

// How decisively a spot belongs to its strongest colour: each colour's hold raised to this power before
// the mix (in FRAG, and the same in settle, so the shares still come true). At 1 every spot averaged all
// five and the middle tone took the vat: Rigi's mauve covered 94% of it for a 25% share, Morocco's blue
// 96% for 36%. At 2 it still blends like watercolour, misty, no edge to be seen, and each colour shows
// nearer its share (Rigi's worst colour 69 points off → 37, Morocco 60 → 30). Chosen with the owner on
// 2026-10-01 over 3–12, which read as patches: the mist comes first, the percentages second.
const MIST = 2;

const FRAG = `
precision highp float;
uniform vec2 res, org; uniform float seed, t, calm, tilt, aspect; uniform int shape;
uniform vec3 col[5]; uniform float gain[5], drop[5]; uniform vec2 pos[5]; uniform int n;
// Integers only, each below 2^24 (exact in any float), so every graphics card, and the page's own
// arithmetic (settle, below), draws the same currents: a permutation polynomial mod 289, the +0.5
// keeping the remainder clear of rounding at exact multiples.
float m289(float x) { return x - floor((x + 0.5) * (1.0 / 289.0)) * 289.0; }
float perm(float x) { return m289((34.0 * x + 1.0) * x); }
float hash(vec2 p) { return perm(perm(m289(p.x) + m289(seed)) + m289(p.y)) / 289.0; }
float noise(vec2 p) { vec2 i = floor(p), f = fract(p); vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y); }
float fbm(vec2 p) { float v = 0.0, a = 0.6; for (int i = 0; i < 2; i++) { v += a * noise(p); p = p * 1.9 + 11.0; a *= 0.4; } return v / 0.84; }
vec3 toRgb(vec3 c) { float l = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z, m = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z, s = c.x - 0.0894841775 * c.y - 1.2914855480 * c.z;
  l = l * l * l; m = m * m * m; s = s * s * s;
  vec3 lin = vec3(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s);
  lin = clamp(lin, 0.0, 1.0); return mix(12.92 * lin, 1.055 * pow(lin, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, lin)); }
void main() {
  vec2 uv = ((gl_FragCoord.xy - org) / res) * 2.0 - 1.0; uv.y = -uv.y; uv.x *= aspect;
  float r = length(uv), aa = 2.0 / res.x;
  // Round, or (shape 1) a rectangle aspect wide to 1 high, filled to its edges.
  if (shape == 0 && r > 1.0 + aa) { gl_FragColor = vec4(0.0); return; }
  // The currents: broad, warped twice, drifting slowly with t; and, where the colours contrast, one
  // long sweep across the vat, so they draw out in ribbons rather than sit in patches. Where they are
  // of one family (calm), no sweep: they settle in layers, light over deep, their edges misted.
  vec2 o = vec2(seed * 0.0071, seed * 0.0037);
  vec2 q = vec2(fbm(uv + o + t * 0.012), fbm(uv + o + vec2(5.2, 1.3) - t * 0.01));
  vec2 w = vec2(fbm(uv * 1.2 + 2.2 * q + vec2(1.7, 9.2)), fbm(uv * 1.2 + 2.2 * q + vec2(8.3, 2.8)));
  vec2 pw = uv + mix(0.7, 0.42, calm) * (w - 0.5) + calm * 0.1 * (vec2(fbm(uv * 4.0 + 3.1), fbm(uv * 4.0 + 7.7)) - 0.5);
  vec2 along = vec2(cos(seed * 0.37), sin(seed * 0.37)), across = vec2(-along.y, along.x);
  pw += (1.0 - calm) * along * 0.28 * sin(dot(pw, across) * 2.4 + seed * 0.11 + t * 0.03);
  mat2 lean = mat2(cos(tilt), -sin(tilt), sin(tilt), cos(tilt));
  // Each colour's hold here: its gain (set so its area is its share), fading softly from where it was poured,
  // raised to MIST so the strongest colour leads a spot rather than all five averaging.
  float ws[5]; float tot = 0.0;
  for (int k = 0; k < 5; k++) { ws[k] = 0.0; if (k >= n) continue;
    vec2 d = lean * (pw - pos[k] * vec2(shape == 1 ? aspect : 1.0, 1.0)); // spread along a rectangle's length
    // A layer reaches across the vat; a drop (the accent) stays a drop.
    float layer = calm * (1.0 - drop[k]);
    ws[k] = pow(gain[k], ${MIST.toFixed(1)}) * exp(-${MIST.toFixed(1)} * (d.x * d.x * (1.0 - 0.94 * layer) + d.y * d.y) / mix(0.26, 0.1, calm)); tot += ws[k]; }
  for (int k = 0; k < 5; k++) ws[k] /= tot;
  float L = 0.0, C = 0.0; vec2 ab = vec2(0.0);
  for (int k = 0; k < 5; k++) { if (k >= n) continue; L += ws[k] * col[k].x; ab += ws[k] * col[k].yz; C += ws[k] * length(col[k].yz); }
  float h = length(ab); if (h > 1e-4) ab *= mix(1.0, C / h, smoothstep(0.25, 0.75, h / max(C, 1e-4)));
  vec3 rgb = toRgb(vec3(L, ab));
  // The vessel, seen from above: its wall a little in shade at the rim, as a vat's is, not lit as a
  // sphere would be.
  if (shape == 1) { gl_FragColor = vec4(rgb, 1.0); return; }
  rgb *= mix(1.0, 0.86, smoothstep(0.93, 1.0, r));
  float alpha = 1.0 - smoothstep(1.0 - aa, 1.0 + aa, r);
  gl_FragColor = vec4(rgb * alpha, alpha);
}`;

/** An sRGB channel (0–255) as linear light. */
export const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
export function oklab(h) {
  const r = lin(parseInt(h.slice(1, 3), 16)), g = lin(parseInt(h.slice(3, 5), 16)), b = lin(parseInt(h.slice(5, 7), 16));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}

/** A seed from text (a gallery key), so a voyage's vat is always poured the same way. */
export const seedOf = (text) => { let h = 2166136261; for (const ch of String(text)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; } return (h % 2147483646) + 1; };

/** A WebGL renderer on `canvas`: the program compiled once, and one uniform setter. */
function renderer(canvas) {
  const opts = { preserveDrawingBuffer: true, premultipliedAlpha: true, antialias: true };
  const gl = canvas.getContext('webgl', opts);
  if (!gl) return null;
  const sh = (type, src) => { const x = gl.createShader(type); gl.shaderSource(x, src); gl.compileShader(x); return x; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, 'attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }'));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG)); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const at = gl.getAttribLocation(prog, 'a'); gl.enableVertexAttribArray(at); gl.vertexAttribPointer(at, 2, gl.FLOAT, false, 0, 0);
  const loc = {}, u = (name) => (loc[name] ??= gl.getUniformLocation(prog, name));
  return { gl, canvas, u };
}

// Still vats are all painted on one hidden canvas and copied out: a browser keeps only a few WebGL
// contexts alive, and a page of frames wants one each. False once WebGL has failed here; renewed if
// the context is lost (a GPU reset, a tab sent to the background on a phone).
let shared;
function sharedRenderer() {
  if (shared && shared.gl.isContextLost()) shared = undefined;
  if (shared === undefined) shared = renderer(document.createElement('canvas')) || false;
  return shared;
}

// What a vat is, from its palette and seed alone: its colours, where each is poured, how calm it
// is. Deterministic, so it can be set on any context, as often as needed.
function plan(palette, seed, calmFor, aspect = 0) {
  let state = seed;
  const rand = () => { state = (state * 16807) % 2147483647; return state / 2147483647; };
  const gauss = () => { let v = 0; for (let i = 0; i < 6; i++) v += rand(); return v / 6 - 0.5; };
  const cs = palette.slice(0, 5).map((p) => (Array.isArray(p) ? { hex: p[0], pc: p[1], accent: !!p[2] } : p)), n = cs.length;
  const total = cs.reduce((s, p) => s + p.pc, 0) || 1, share = cs.map((p) => p.pc / total);
  const labs = cs.map((p) => oklab(p.hex));
  // How the colours sit together: the widest gap of hue between any two (the accent aside). One
  // family (under 0.06 on the plane of hue) settles in layers; a contrast (over 0.16) is stirred;
  // between, layers with a current through them.
  const main = cs.map((p, i) => i).filter((i) => !cs[i].accent);
  let gap = 0; for (const i of main) for (const j of main) gap = Math.max(gap, Math.hypot(labs[i][1] - labs[j][1], labs[i][2] - labs[j][2]));
  const calm = calmFor ?? Math.min(1, Math.max(0, (0.16 - gap) / 0.1));
  const tilt = gauss() * 0.5;
  // Where each colour is poured. Stirred: evenly round the vat, a little astray, the largest in the
  // middle. Layered: light above deep, each as deep as its share; the accent a drop at its own level.
  const order = cs.map((p, i) => i).sort((x, y) => share[y] - share[x]), turn = rand() * 2 * Math.PI;
  const layers = [...main].sort((x, y) => labs[y][0] - labs[x][0]), mainShare = main.reduce((s, i) => s + share[i], 0) || 1;
  const level = {}; let run = 0;
  for (const i of layers) { level[i] = -0.8 + 1.6 * (run + share[i] / 2) / mainShare; run += share[i]; }
  for (const i of cs.keys()) if (!(i in level)) { const deeper = layers.filter((j) => labs[j][0] > labs[i][0]).length; level[i] = -0.8 + 1.6 * deeper / Math.max(1, layers.length); }
  const pos = [];
  order.forEach((i, rank) => {
    const ang = turn + (rank / Math.max(1, n - 1)) * 2 * Math.PI + gauss() * 0.6, rad = rank === 0 ? 0.1 * rand() : 0.45 + gauss() * 0.2;
    const stirred = [Math.cos(ang) * rad, Math.sin(ang) * rad], layered = [cs[i].accent ? (rand() - 0.5) * 0.9 : gauss() * 0.3, level[i]];
    pos[i] = [stirred[0] + (layered[0] - stirred[0]) * calm, stirred[1] + (layered[1] - stirred[1]) * calm];
  });
  const key = `${seed}|${calmFor ?? ''}|${cs.map((p) => `${p.hex}:${p.pc}:${p.accent ? 1 : 0}`).join(',')}${aspect ? `|rect ${aspect.toFixed(2)}` : ''}`;
  return { n, cs, share, labs, calm, tilt, pos, key, seed, aspect };
}
function set(r, P, gain) {
  const { gl, u } = r;
  gl.uniform1f(u('seed'), (P.seed % 1000) + 1); gl.uniform1i(u('n'), P.n); gl.uniform1f(u('t'), 0);
  gl.uniform1f(u('calm'), P.calm); gl.uniform1f(u('tilt'), P.tilt);
  gl.uniform1i(u('shape'), P.aspect ? 1 : 0); gl.uniform1f(u('aspect'), P.aspect || 1);
  for (let i = 0; i < P.n; i++) {
    gl.uniform3f(u(`col[${i}]`), P.labs[i][0], P.labs[i][1], P.labs[i][2]);
    gl.uniform1f(u(`drop[${i}]`), P.cs[i].accent ? 1 : 0);
    gl.uniform2f(u(`pos[${i}]`), P.pos[i][0], P.pos[i][1]);
  }
  for (let k = 0; k < 5; k++) gl.uniform1f(u(`gain[${k}]`), gain[k] || 0);
}

// Without WebGL (switched off, a GPU lost for good, a browser that never had it) a vat is still a
// vat: its colours poured where the plan pours them, each a soft pool as wide as its share, on the
// largest one's ground, in the same round or rectangle. Painted once in 2D; it never moves.
function still2d(out, P, W, H) {
  const ctx = out.getContext('2d');
  if (!ctx) return;
  const rgb = (hex, a) => { const h = String(hex).replace('#', ''), f = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6), n = parseInt(f, 16) || 0; return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };
  const side = Math.min(W, H), [vw, vh] = P.aspect ? [W, H] : [side, side], ox = (W - vw) / 2, oy = (H - vh) / 2;
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  ctx.beginPath();
  if (P.aspect) ctx.rect(ox, oy, vw, vh); else ctx.arc(W / 2, H / 2, side / 2, 0, 2 * Math.PI);
  ctx.clip();
  const order = P.cs.map((c, i) => i).sort((a, b) => P.share[b] - P.share[a]);
  ctx.fillStyle = rgb(P.cs[order[0]].hex, 1); ctx.fillRect(ox, oy, vw, vh);
  // The plan's places run from -1 to 1 across the vat, as the shader reads them: x right, y down
  // (a layered vat's lightest colour, at the lowest level, lies on top).
  const at = (i) => [W / 2 + P.pos[i][0] * vw / 2, H / 2 + P.pos[i][1] * vh / 2];
  // A calm vat lies in layers: each colour a soft band at its level, as deep as its share.
  if (P.calm > 0) {
    for (const i of order.slice(1)) {
      if (P.cs[i].accent) continue;
      const [, cy] = at(i), half = Math.max(vh * 0.08, vh * P.share[i] * 0.9);
      const g = ctx.createLinearGradient(0, cy - half * 1.6, 0, cy + half * 1.6);
      g.addColorStop(0, rgb(P.cs[i].hex, 0)); g.addColorStop(0.3, rgb(P.cs[i].hex, 0.9 * P.calm)); g.addColorStop(0.7, rgb(P.cs[i].hex, 0.9 * P.calm)); g.addColorStop(1, rgb(P.cs[i].hex, 0));
      ctx.fillStyle = g; ctx.fillRect(ox, cy - half * 1.6, vw, half * 3.2);
    }
  }
  // A stirred vat (and a calm one's accent): each colour a soft pool where it was poured, as wide as its share.
  const half = Math.max(vw, vh) / 2;
  for (const i of order.slice(1)) {
    const weight = P.cs[i].accent ? 1 : 1 - P.calm;
    if (weight <= 0) continue;
    const [cx, cy] = at(i), r = half * (P.cs[i].accent ? 0.22 : 0.18 + 0.85 * Math.sqrt(P.share[i]));
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, rgb(P.cs[i].hex, 0.9 * weight)); g.addColorStop(0.55, rgb(P.cs[i].hex, 0.5 * weight)); g.addColorStop(1, rgb(P.cs[i].hex, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2 * Math.PI); ctx.fill();
  }
  // Shaded as a vessel only at its edge, as the shader's is: not lit as a sphere would be.
  if (!P.aspect) {
    const rim = ctx.createRadialGradient(W / 2, H / 2, side / 2 * 0.93, W / 2, H / 2, side / 2);
    rim.addColorStop(0, 'rgba(0,0,0,0)'); rim.addColorStop(1, 'rgba(0,0,0,0.14)');
    ctx.fillStyle = rim; ctx.fillRect(ox, oy, vw, vh);
  }
  ctx.restore();
  out.dataset.still = '2d';
}

// Weighing a vat: how much of it each colour covers, adjusted until each is its share (settle,
// below). Once per palette and seed in a visit: kept here for the next vat of the same.
const gains = new Map();
const step = (P, gain, areas) => { for (let k = 0; k < P.n; k++) gain[k] *= ((P.share[k] + 1e-3) / (areas[k] + 1e-3)) ** (0.8 / MIST); }; // a gain's change shows MIST-fold in its area

/**
 * A vat as a canvas, drawn at once; `canvas.ready` resolves with it.
 */
/** Motion held still: the site's kill switch (crawlers, screenshots) or the reader's reduced motion. */
export const stillness = () => window.QSD?.motionOff?.() || matchMedia('(prefers-reduced-motion: reduce)').matches;

export function vat(palette, { size = 176, width = size, height = size, shape = 'round', seed = 1, stir = false, speed = 15, label = '', calm: calmFor = null } = {}) {
  const dpr = Math.min(2, devicePixelRatio || 1), W = Math.round(width * dpr), H = Math.round(height * dpr);
  const moving = !!stir && !stillness();
  const out = document.createElement('canvas'); out.width = W; out.height = H;
  out.className = 'colour-vat'; out.style.aspectRatio = `${width} / ${height}`;
  if (label) { out.setAttribute('role', 'img'); out.setAttribute('aria-label', label); } else out.setAttribute('aria-hidden', 'true');
  out.ready = Promise.resolve(out);
  if (!palette?.length) return out;
  const aspect = shape === 'rect' ? width / height : 0;
  let P = plan(palette, seed, calmFor, aspect), live = null, shown = null;
  // A stirring vat draws only in its own context: the shared one is not made for it.
  if (!moving && !sharedRenderer()) {
    // Without WebGL a still vat keeps the whole of a vat's contract: it is ready, stirring does
    // nothing, and a repaint takes the next palette and its label (Palette, Reverie, Home all call them).
    const paint = () => { still2d(out, P, W, H); return Promise.resolve(out); };
    out.stir = () => {};
    out.ready = paint();
    out.repaint = (next, { seed: s2 = seed, label: l2 = '' } = {}) => { P = plan(next, s2, calmFor, aspect); if (l2) out.setAttribute('aria-label', l2); return (out.ready = paint()); };
    return out;
  }

  const draw = ({ gain, areas }) => {
    // A live vat keeps its own context for its life, and is repainted in it (repaint, below).
    if (shown && live) { shown.gain = gain; set(live, P, gain); shown.frame(0); if (areas) out.dataset.areas = areas.map((x) => x.toFixed(3)).join(' '); out.dataset.calm = P.calm.toFixed(2); return; }
    const r = moving ? (live = renderer(out)) : sharedRenderer();
    if (!r) { still2d(out, P, W, H); return; }
    const { gl, canvas, u } = r;
    if (canvas.width < W || canvas.height < H) { canvas.width = Math.max(W, canvas.width); canvas.height = Math.max(H, canvas.height); }
    set(r, P, gain);
    // Round: a square as tall as the smaller side, centred. A rectangle: the whole canvas.
    const side = Math.min(W, H), [vw, vh] = aspect ? [W, H] : [side, side], ox = Math.round((W - vw) / 2), oy = Math.round((H - vh) / 2);
    const baseY = canvas.height - H; // drawing at the bottom-left of a larger shared canvas: the top-left of the copy
    gl.uniform2f(u('res'), vw, vh); gl.uniform2f(u('org'), ox, baseY + oy); 
    const frame = (t) => { gl.viewport(0, 0, canvas.width, canvas.height); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.viewport(ox, baseY + oy, vw, vh); gl.uniform1f(u('t'), t); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); };
    frame(0);
    shown = { frame, gain };
    if (areas) out.dataset.areas = areas.map((x) => x.toFixed(3)).join(' '); // what the vat covers, to check against the shares
    out.dataset.calm = P.calm.toFixed(2);
    if (moving) out.release = () => gl.getExtension('WEBGL_lose_context')?.loseContext();
    if (moving && (stir === 'hover' || stir === 'hold')) {
      // Drawn only while it moves. 'hover': stirred under the pointer, then eased back to rest (t = 0).
      // 'hold': stirred while out.stir(true) (a control elsewhere asks it), and left where it stopped.
      let t = 0, on = false, raf = 0, last = 0;
      const settles = stir === 'hover';
      const tick = (now) => {
        const dt = Math.min(0.05, (now - last) / 1000); last = now;
        t = on ? t + dt * speed : settles ? t * Math.exp(-dt * 2.4) : t; // stirred at `speed` a second
        if (settles && !on && t < 0.02) t = 0;
        frame(t);
        raf = on || (settles && t) ? requestAnimationFrame(tick) : 0;
      };
      const wake = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } };
      out.stir = (v) => { on = !!v; wake(); };
      if (settles) {
        out.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'touch') out.stir(true); });
        out.addEventListener('pointerleave', () => out.stir(false));
      }
    } else if (moving) {
      const t0 = performance.now();
      const loop = (now) => { if (!out.isConnected && now - t0 > 1000) { out.release(); return; } frame((now - t0) / 1000); requestAnimationFrame(loop); };
      requestAnimationFrame(loop);
    } else {
      out.getContext('2d').drawImage(canvas, 0, 0, W, H, 0, 0, W, H);
    }
  };

  const pour = () => {
    if (!gains.has(P.key)) gains.set(P.key, settle(P));
    draw(gains.get(P.key));
    return Promise.resolve(out);
  };
  if (!shown) out.stir = () => {}; // until drawn
  out.ready = pour();
  // A live vat takes another palette in the same canvas and context: no new context, no new program.
  out.repaint = (next, { seed: s2 = seed, label: l2 = '' } = {}) => {
    P = plan(next, s2, calmFor, aspect);
    if (l2) out.setAttribute('aria-label', l2);
    return (out.ready = pour());
  };
  return out;
}

/** A room's light from a palette: the square inside its vat, 48 px, for a page to spread and soften
 *  behind itself (a small picture scaled up is already soft, and costs next to nothing to hold). */
export function glow(palette, { seed = 1 } = {}) {
  const c = vat(palette, { size: 96, seed }), out = document.createElement('canvas');
  out.width = out.height = 48;
  out.ready = c.ready.then(() => { const side = c.width / Math.SQRT2, at = (c.width - side) / 2; out.getContext('2d').drawImage(c, at, at, side, side, 0, 0, 48, 48); return out; });
  return out;
}

// The currents as the shader draws them at rest (t = 0), on a G × G grid in plain arithmetic: each
// cell's pull toward each colour, before the gains. The random numbers are whole numbers, exact here
// and on any graphics card (FRAG's hash), so what is weighed here is what is drawn there.
const G = 32; // as true as a finer grid, measured against 128 × 128 (worst colour within 0.21 points)
function field(P) {
  const s = (P.seed % 1000) + 1, calm = P.calm, asp = P.aspect || 1, rect = !!P.aspect;
  const m289 = (x) => x - Math.floor((x + 0.5) / 289) * 289, perm = (x) => m289((34 * x + 1) * x), sm = m289(s);
  const hash = (x, y) => perm(perm(m289(x) + sm) + m289(y)) / 289;
  const noise = (x, y) => { const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
    const ux = fx * fx * fx * (fx * (fx * 6 - 15) + 10), uy = fy * fy * fy * (fy * (fy * 6 - 15) + 10);
    const a = hash(ix, iy), b = hash(ix + 1, iy), c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1);
    return (a + (b - a) * ux) + ((c + (d - c) * ux) - (a + (b - a) * ux)) * uy; };
  const fbm = (x, y) => { let v = 0, a = 0.6; for (let i = 0; i < 2; i++) { v += a * noise(x, y); x = x * 1.9 + 11; y = y * 1.9 + 11; a *= 0.4; } return v / 0.84; };
  const ox = s * 0.0071, oy = s * 0.0037, amp = 0.7 + (0.42 - 0.7) * calm, width = 0.26 + (0.1 - 0.26) * calm;
  const al = [Math.cos(s * 0.37), Math.sin(s * 0.37)], ac = [-al[1], al[0]], ct = Math.cos(P.tilt), st = Math.sin(P.tilt);
  const pull = new Float64Array(G * G * P.n); let cells = 0; // one array, not one a cell
  for (let y = 0; y < G; y++) for (let x = 0; x < G; x++) {
    let u = ((x + 0.5) / G) * 2 - 1, v = -(((y + 0.5) / G) * 2 - 1);
    if (!rect && u * u + v * v > 1) continue;
    u *= asp;
    const qx = fbm(u + ox, v + oy), qy = fbm(u + ox + 5.2, v + oy + 1.3);
    const wx = fbm(u * 1.2 + 2.2 * qx + 1.7, v * 1.2 + 2.2 * qy + 9.2), wy = fbm(u * 1.2 + 2.2 * qx + 8.3, v * 1.2 + 2.2 * qy + 2.8);
    let px = u + amp * (wx - 0.5) + calm * 0.1 * (fbm(u * 4 + 3.1, v * 4 + 3.1) - 0.5), py = v + amp * (wy - 0.5) + calm * 0.1 * (fbm(u * 4 + 7.7, v * 4 + 7.7) - 0.5);
    const sw = (1 - calm) * 0.28 * Math.sin((px * ac[0] + py * ac[1]) * 2.4 + s * 0.11);
    px += al[0] * sw; py += al[1] * sw;
    const e = cells++ * P.n;
    for (let k = 0; k < P.n; k++) {
      const rx = px - P.pos[k][0] * (rect ? asp : 1), ry = py - P.pos[k][1];
      const dx = ct * rx + st * ry, dy = -st * rx + ct * ry, layer = calm * (1 - (P.cs[k].accent ? 1 : 0));
      pull[e + k] = Math.exp(-(dx * dx * (1 - 0.94 * layer) + dy * dy) / width);
    }
  }
  return { pull, cells };
}
// Each colour's weight, set until it covers its share within a tenth of a point.
function settle(P, { tol = 0.001, rounds = 120 } = {}) {
  const { pull, cells } = field(P), gain = P.share.slice(), n = P.n;
  let areas = [];
  for (let it = 0; it < rounds; it++) {
    areas = new Array(n).fill(0);
    for (let e = 0; e < cells * n; e += n) { let t = 0; for (let k = 0; k < n; k++) t += (gain[k] * pull[e + k]) ** MIST; if (t > 0) for (let k = 0; k < n; k++) areas[k] += (gain[k] * pull[e + k]) ** MIST / t; }
    for (let k = 0; k < n; k++) areas[k] /= cells;
    if (areas.every((a, k) => Math.abs(a - P.share[k]) < tol)) break;
    step(P, gain, areas);
  }
  return { gain, areas };
}
