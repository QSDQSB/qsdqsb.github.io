/**
 * The dye vat (染缸): a palette as one round vat seen from above, its colours poured in and left to
 * drift together in broad, slow currents, so they run softly into one another. Each colour covers as
 * much of the vat as its share: the vat measures itself on the GPU at 64 px and adjusts until it does,
 * so it tells the truth the colour bar tells. Mixed in OKLab with the chroma kept, so two colours make
 * a clean third, not a grey (across nearly opposite hues it settles, as paint does).
 *
 * How it pours follows how the colours sit together: a palette of one family (a misty evening, all
 * blues) settles in layers, light above deep, edges misted; a palette of contrasts is stirred into
 * broad currents; most lie between. An accent is always a drop, never a layer.
 *
 * vat(palette, { size, width, height, shape, seed, stir, label, calm }) → a canvas. `palette` is
 * [{hex, pc, accent}] or [[hex, pc, accent]]; `calm` (0 stirred … 1 layered) overrides the choice; the vat is `size` across (or the smaller of width and height), centred, transparent
 * round it. `shape: 'rect'` pours the same dye into the whole width × height instead, its colours
 * spread along its length and measured over all of it, so each still covers its share (Reverie's
 * opening); drawn small and shown large (it is a mood, and softens as it spreads), it costs no more
 * than a round vat. Still by default: painted on one shared WebGL canvas and copied out, so a page of frames
 * costs one context. `stir: true` gives the vat its own and keeps the currents moving (the lab);
 * `stir: 'hover'` stirs only while a pointer rests on it (or while `canvas.stir(true)`, for a link
 * that leads to it), `speed` steps a second, and on leaving lets the dye settle back to where it was
 * poured, so at rest it is always true to its shares. Neither moves with motion off;
 * a live vat's `release()` lets its context go. Used by the palette page
 * (assets/js/colour/palette.js) and the book's colophon (assets/js/photobook/index.js).
 */

const FRAG = `
precision highp float;
uniform vec2 res, org; uniform float seed, t, calm, tilt, aspect; uniform int mode, shape;
uniform vec3 col[5]; uniform float gain[5], drop[5]; uniform vec2 pos[5]; uniform int n;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7)) + seed * 0.013) * 43758.5453); }
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
  if (shape == 0 && (r > 1.0 + aa || (mode > 0 && r > 1.0))) { gl_FragColor = vec4(0.0); return; }
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
  // Each colour's hold here: its gain (set so its area is its share), fading softly from where it was poured.
  float ws[5]; float tot = 0.0;
  for (int k = 0; k < 5; k++) { ws[k] = 0.0; if (k >= n) continue;
    vec2 d = lean * (pw - pos[k] * vec2(shape == 1 ? aspect : 1.0, 1.0)); // spread along a rectangle's length
    // A layer reaches across the vat; a drop (the accent) stays a drop.
    float layer = calm * (1.0 - drop[k]);
    ws[k] = gain[k] * exp(-(d.x * d.x * (1.0 - 0.94 * layer) + d.y * d.y) / mix(0.26, 0.1, calm)); tot += ws[k]; }
  for (int k = 0; k < 5; k++) ws[k] /= tot;
  if (mode == 1) { gl_FragColor = vec4(ws[0], ws[1], ws[2], ws[3]); return; }
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

const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
export function oklab(h) {
  const r = lin(parseInt(h.slice(1, 3), 16)), g = lin(parseInt(h.slice(3, 5), 16)), b = lin(parseInt(h.slice(5, 7), 16));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}

/** A seed from text (a gallery key), so a voyage's vat is always poured the same way. */
export const seedOf = (text) => { let h = 2166136261; for (const ch of String(text)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; } return (h % 2147483646) + 1; };

/** A WebGL renderer on `canvas`: the program compiled once, and one uniform setter. */
function renderer(canvas, { v2 = false } = {}) {
  const opts = { preserveDrawingBuffer: true, premultipliedAlpha: true, antialias: true };
  const gl = (v2 && canvas.getContext('webgl2', opts)) || canvas.getContext('webgl', opts);
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
  return { gl, canvas, u, async: typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext };
}

// Still vats are all painted on one hidden canvas and copied out: a browser keeps only a few WebGL
// contexts alive, and a page of frames wants one each. False once WebGL has failed here; renewed if
// the context is lost (a GPU reset, a tab sent to the background on a phone). WebGL 2 where there is
// one, so the vats can be measured without stopping the page (below).
let shared;
function sharedRenderer() {
  if (shared?.gl.isContextLost()) { shared = undefined; for (const j of jobs.splice(0)) j.resolve(null); } // settled, not left waiting
  if (shared === undefined) shared = renderer(document.createElement('canvas'), { v2: true }) || false;
  return shared;
}

// The self-measuring grid: M × M pixels, the circle's pixels found once.
const M = 48, EVERY = Array.from({ length: M * M }, (_, i) => i), INSIDE = (() => { const out = []; for (let y = 0; y < M; y++) for (let x = 0; x < M; x++) { const u = ((x + 0.5) / M) * 2 - 1, v = ((y + 0.5) / M) * 2 - 1; if (u * u + v * v <= 1) out.push(y * M + x); } return out; })();
const px = new Uint8Array(M * M * 4);

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

// Measuring a vat: how much of it each colour covers, adjusted until each is its share (within half a
// point; most arrive in a few rounds; the fifth colour's share is what the other four leave). Done
// once per palette and seed, ever: the gains are kept here and in this browser's storage. Where
// WebGL 2 allows, each round's reading is copied aside on the graphics card and collected a frame
// later, several vats at once, so measuring never stops the page; else, at once, as before.
const STORE = 'vat-gains-1';
const gains = (() => { try { return new Map(Object.entries(JSON.parse(localStorage.getItem(STORE) || '{}'))); } catch { return new Map(); } })();
let saving = 0;
const keep = (key, g) => { gains.set(key, g); clearTimeout(saving); saving = setTimeout(() => { try { localStorage.setItem(STORE, JSON.stringify(Object.fromEntries(gains))); } catch { /* this visit only */ } }, 800); };
const areasOf = (P, data) => {
  const mass = [0, 0, 0, 0];
  const cells = P.aspect ? EVERY : INSIDE;
  for (const j of cells) for (let k = 0; k < 4; k++) mass[k] += data[j * 4 + k];
  const all = cells.length * 255, areas = [...mass.map((m) => m / all), 0].slice(0, P.n);
  if (P.n === 5) areas[4] = Math.max(0, 1 - areas[0] - areas[1] - areas[2] - areas[3]);
  return areas;
};
const step = (P, gain, areas) => { for (let k = 0; k < P.n; k++) gain[k] *= ((P.share[k] + 1e-3) / (areas[k] + 1e-3)) ** 0.8; };
const settled = (P, areas) => areas.every((a, k) => Math.abs(a - P.share[k]) < 0.005);

function measureNow(r, P) {
  const { gl, u } = r, gain = P.share.slice();
  let areas = [];
  gl.viewport(0, 0, M, M); gl.uniform2f(u('res'), M, M); gl.uniform2f(u('org'), 0, 0); gl.uniform1i(u('mode'), 1);
  for (let it = 0; it < 16; it++) {
    set(r, P, gain);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); gl.readPixels(0, 0, M, M, gl.RGBA, gl.UNSIGNED_BYTE, px);
    areas = areasOf(P, px);
    if (settled(P, areas)) break;
    step(P, gain, areas);
  }
  return { gain, areas };
}

const LANES = 6, jobs = [];
let pumping = 0;
function measureLater(P) {
  return new Promise((resolve) => { jobs.push({ P, gain: P.share.slice(), it: 0, areas: [], resolve, buf: null, fence: null }); if (!pumping) pumping = requestAnimationFrame(pump); });
}
function pump() {
  pumping = 0;
  const r = sharedRenderer();
  if (!r) { for (const j of jobs.splice(0)) j.resolve(null); return; }
  const { gl, u } = r;
  if (r.canvas.width < M * LANES || r.canvas.height < M) { r.canvas.width = Math.max(r.canvas.width, M * LANES); r.canvas.height = Math.max(r.canvas.height, M); }
  jobs.slice(0, LANES).forEach((j, lane) => {
    if (j.fence) {
      const st = gl.clientWaitSync(j.fence, 0, 0);
      if (st !== gl.ALREADY_SIGNALED && st !== gl.CONDITION_SATISFIED) return; // not yet: next frame
      gl.deleteSync(j.fence); j.fence = null;
      gl.bindBuffer(gl.PIXEL_PACK_BUFFER, j.buf); gl.getBufferSubData(gl.PIXEL_PACK_BUFFER, 0, px); gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
      j.areas = areasOf(j.P, px); j.it++;
      if (settled(j.P, j.areas) || j.it >= 16) { j.done = true; return; }
      step(j.P, j.gain, j.areas);
    }
    // One round: drawn in its own lane of the canvas, read into its own buffer, fenced.
    set(r, j.P, j.gain);
    gl.viewport(lane * M, 0, M, M); gl.uniform2f(u('res'), M, M); gl.uniform2f(u('org'), lane * M, 0); gl.uniform1i(u('mode'), 1);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    j.buf ??= gl.createBuffer();
    gl.bindBuffer(gl.PIXEL_PACK_BUFFER, j.buf); gl.bufferData(gl.PIXEL_PACK_BUFFER, M * M * 4, gl.STREAM_READ);
    gl.readPixels(lane * M, 0, M, M, gl.RGBA, gl.UNSIGNED_BYTE, 0);
    gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
    j.fence = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
  });
  gl.flush();
  for (let i = jobs.length - 1; i >= 0; i--) if (jobs[i].done) { const [j] = jobs.splice(i, 1); if (j.buf) gl.deleteBuffer(j.buf); j.resolve({ gain: j.gain, areas: j.areas }); }
  if (jobs.length) pumping = requestAnimationFrame(pump);
}

/**
 * A vat as a canvas, returned at once; `canvas.ready` resolves when it is drawn. Measured before (its
 * gains remembered), it is drawn there and then; else it is drawn once measured, a few frames on,
 * and fades in (CSS: .colour-vat[data-pouring]).
 */
const stillness = () => window.QSD?.motionOff?.() || matchMedia('(prefers-reduced-motion: reduce)').matches;

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
  const r0 = sharedRenderer();
  if (!r0) return out;

  const draw = ({ gain, areas }) => {
    // A live vat keeps its own context for its life, and is repainted in it (repaint, below).
    if (shown && live) { shown.gain = gain; set(live, P, gain); shown.frame(0); if (areas) out.dataset.areas = areas.map((x) => x.toFixed(3)).join(' '); out.dataset.calm = P.calm.toFixed(2); delete out.dataset.pouring; return; }
    const r = moving ? (live = renderer(out)) : sharedRenderer();
    if (!r) return;
    const { gl, canvas, u } = r;
    if (canvas.width < W || canvas.height < H) { canvas.width = Math.max(W, canvas.width); canvas.height = Math.max(H, canvas.height); }
    set(r, P, gain);
    // Round: a square as tall as the smaller side, centred. A rectangle: the whole canvas.
    const side = Math.min(W, H), [vw, vh] = aspect ? [W, H] : [side, side], ox = Math.round((W - vw) / 2), oy = Math.round((H - vh) / 2);
    const baseY = canvas.height - H; // drawing at the bottom-left of a larger shared canvas: the top-left of the copy
    gl.uniform2f(u('res'), vw, vh); gl.uniform2f(u('org'), ox, baseY + oy); gl.uniform1i(u('mode'), 0);
    const frame = (t) => { gl.viewport(0, 0, canvas.width, canvas.height); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.viewport(ox, baseY + oy, vw, vh); gl.uniform1f(u('t'), t); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); };
    frame(0);
    shown = { frame, gain };
    if (areas) out.dataset.areas = areas.map((x) => x.toFixed(3)).join(' '); // what the vat covers, to check against the shares
    out.dataset.calm = P.calm.toFixed(2);
    delete out.dataset.pouring;
    if (moving) out.release = () => gl.getExtension('WEBGL_lose_context')?.loseContext();
    if (moving && stir === 'hover') {
      // Drawn only while it moves: stirred under the pointer, then eased back to rest (t = 0).
      let t = 0, on = false, raf = 0, last = 0;
      const tick = (now) => {
        const dt = Math.min(0.05, (now - last) / 1000); last = now;
        t = on ? t + dt * speed : t * Math.exp(-dt * 2.4); // stirred at `speed` a second, settling back as before
        if (!on && t < 0.02) t = 0;
        frame(t);
        raf = on || t ? requestAnimationFrame(tick) : 0;
      };
      const wake = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } };
      out.stir = (v) => { on = !!v; wake(); };
      out.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'touch') out.stir(true); });
      out.addEventListener('pointerleave', () => out.stir(false));
    } else if (moving) {
      const t0 = performance.now();
      const loop = (now) => { if (!out.isConnected && now - t0 > 1000) { out.release(); return; } frame((now - t0) / 1000); requestAnimationFrame(loop); };
      requestAnimationFrame(loop);
    } else {
      out.getContext('2d').drawImage(canvas, 0, 0, W, H, 0, 0, W, H);
    }
  };

  const pour = () => {
    const known = gains.get(P.key);
    if (known) { draw({ gain: known }); return Promise.resolve(out); }
    // At once where it cannot be deferred (WebGL 1), and with motion off (a reader who asked for
    // stillness, a screenshot that must find every vat drawn): nothing there moves to be spoiled.
    if (!r0.async || stillness()) { const m = measureNow(r0, P); keep(P.key, m.gain); draw(m); return Promise.resolve(out); }
    if (!shown) out.dataset.pouring = '';
    const mine = P;
    return measureLater(P).then((m) => {
      if (mine !== P) return out;
      if (m) { keep(P.key, m.gain); draw(m); }
      else { const r = sharedRenderer(); if (r) { const n = measureNow(r, P); keep(P.key, n.gain); draw(n); } else delete out.dataset.pouring; }
      return out;
    });
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
