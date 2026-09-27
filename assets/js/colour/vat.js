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
 * vat(palette, { size, width, height, seed, stir, label, calm }) → a canvas. `palette` is
 * [{hex, pc, accent}] or [[hex, pc, accent]]; `calm` (0 stirred … 1 layered) overrides the choice; the vat is `size` across (or the smaller of width and height), centred, transparent
 * round it. Still by default: painted on one shared WebGL canvas and copied out, so a page of frames
 * costs one context. `stir: true` gives the vat its own and keeps the currents moving (the lab);
 * `stir: 'hover'` stirs only while a pointer rests on it, and on leaving lets the dye settle back to
 * where it was poured, so at rest it is always true to its shares. Neither moves with motion off;
 * a live vat's `release()` lets its context go. Used by the palette page
 * (assets/js/colour/palette.js) and the book's colophon (assets/js/photobook/index.js).
 */

const FRAG = `
precision highp float;
uniform vec2 res, org; uniform float seed, t, calm, tilt; uniform int mode;
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
  vec2 uv = ((gl_FragCoord.xy - org) / res) * 2.0 - 1.0; uv.y = -uv.y;
  float r = length(uv), aa = 2.0 / res.x;
  if (r > 1.0 + aa || (mode > 0 && r > 1.0)) { gl_FragColor = vec4(0.0); return; }
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
    vec2 d = lean * (pw - pos[k]);
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
  rgb *= mix(1.0, 0.86, smoothstep(0.93, 1.0, r));
  float alpha = 1.0 - smoothstep(1.0 - aa, 1.0 + aa, r);
  gl_FragColor = vec4(rgb * alpha, alpha);
}`;

const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
function oklab(h) {
  const r = lin(parseInt(h.slice(1, 3), 16)), g = lin(parseInt(h.slice(3, 5), 16)), b = lin(parseInt(h.slice(5, 7), 16));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}

/** A seed from text (a gallery key), so a voyage's vat is always poured the same way. */
export const seedOf = (text) => { let h = 2166136261; for (const ch of String(text)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; } return (h % 2147483646) + 1; };

/** A WebGL renderer on `canvas`: the program compiled once, and one uniform setter. */
function renderer(canvas) {
  const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true, premultipliedAlpha: true, antialias: true });
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
  if (shared?.gl.isContextLost()) shared = undefined;
  if (shared === undefined) shared = renderer(document.createElement('canvas')) || false;
  return shared;
}

// The self-measuring grid: M × M pixels, the circle's pixels found once.
const M = 48, INSIDE = (() => { const out = []; for (let y = 0; y < M; y++) for (let x = 0; x < M; x++) { const u = ((x + 0.5) / M) * 2 - 1, v = ((y + 0.5) / M) * 2 - 1; if (u * u + v * v <= 1) out.push(y * M + x); } return out; })();
const px = new Uint8Array(M * M * 4);

export function vat(palette, { size = 176, width = size, height = size, seed = 1, stir = false, label = '', calm: calmFor = null } = {}) {
  let state = seed;
  const rand = () => { state = (state * 16807) % 2147483647; return state / 2147483647; };
  const gauss = () => { let v = 0; for (let i = 0; i < 6; i++) v += rand(); return v / 6 - 0.5; };
  const cs = palette.slice(0, 5).map((p) => (Array.isArray(p) ? { hex: p[0], pc: p[1], accent: !!p[2] } : p)), n = cs.length;
  const dpr = Math.min(2, devicePixelRatio || 1), W = Math.round(width * dpr), H = Math.round(height * dpr);
  const moving = !!stir && !(window.QSD?.motionOff?.() || matchMedia('(prefers-reduced-motion: reduce)').matches);
  const out = document.createElement('canvas'); out.width = W; out.height = H;
  out.className = 'colour-vat'; out.style.aspectRatio = `${width} / ${height}`;
  if (label) { out.setAttribute('role', 'img'); out.setAttribute('aria-label', label); } else out.setAttribute('aria-hidden', 'true');
  if (!n) return out;
  const r = moving ? renderer(out) : sharedRenderer();
  if (!r) return out;
  const { gl, canvas, u } = r;
  if (canvas.width < Math.max(W, M) || canvas.height < Math.max(H, M)) { canvas.width = Math.max(W, M, canvas.width); canvas.height = Math.max(H, M, canvas.height); }
  const total = cs.reduce((s, p) => s + p.pc, 0), share = cs.map((p) => p.pc / total);
  const labs = cs.map((p) => oklab(p.hex));
  // How the colours sit together: the widest gap of hue between any two (the accent aside). One
  // family (under 0.06 on the plane of hue) settles in layers; a contrast (over 0.16) is stirred;
  // between, layers with a current through them.
  const main = cs.map((p, i) => i).filter((i) => !cs[i].accent);
  let gap = 0; for (const i of main) for (const j of main) gap = Math.max(gap, Math.hypot(labs[i][1] - labs[j][1], labs[i][2] - labs[j][2]));
  const calm = calmFor ?? Math.min(1, Math.max(0, (0.16 - gap) / 0.1));
  gl.uniform1f(u('seed'), (seed % 1000) + 1); gl.uniform1i(u('n'), n); gl.uniform1f(u('t'), 0);
  gl.uniform1f(u('calm'), calm); gl.uniform1f(u('tilt'), gauss() * 0.5);
  // Where each colour is poured. Stirred: evenly round the vat, a little astray, the largest in the
  // middle. Layered: light above deep, each as deep as its share; the accent a drop at its own level.
  const order = cs.map((p, i) => i).sort((x, y) => share[y] - share[x]), turn = rand() * 2 * Math.PI;
  const layers = [...main].sort((x, y) => labs[y][0] - labs[x][0]), mainShare = main.reduce((s, i) => s + share[i], 0) || 1;
  const level = {}; let run = 0;
  for (const i of layers) { level[i] = -0.8 + 1.6 * (run + share[i] / 2) / mainShare; run += share[i]; }
  for (const i of cs.keys()) if (!(i in level)) { const deeper = layers.filter((j) => labs[j][0] > labs[i][0]).length; level[i] = -0.8 + 1.6 * deeper / Math.max(1, layers.length); }
  order.forEach((i, rank) => {
    const ang = turn + (rank / Math.max(1, n - 1)) * 2 * Math.PI + gauss() * 0.6, rad = rank === 0 ? 0.1 * rand() : 0.45 + gauss() * 0.2;
    const stirred = [Math.cos(ang) * rad, Math.sin(ang) * rad], layered = [cs[i].accent ? (rand() - 0.5) * 0.9 : gauss() * 0.3, level[i]];
    gl.uniform3f(u(`col[${i}]`), labs[i][0], labs[i][1], labs[i][2]);
    gl.uniform1f(u(`drop[${i}]`), cs[i].accent ? 1 : 0);
    gl.uniform2f(u(`pos[${i}]`), stirred[0] + (layered[0] - stirred[0]) * calm, stirred[1] + (layered[1] - stirred[1]) * calm);
  });
  // Measure and adjust: how much of the vat each colour covers, until it is its share (within half a
  // point; most arrive in a few rounds). The fifth colour's share is what the other four leave.
  const gain = share.slice();
  gl.viewport(0, 0, M, M); gl.uniform2f(u('res'), M, M); gl.uniform2f(u('org'), 0, 0); gl.uniform1i(u('mode'), 1);
  let areas = [];
  for (let it = 0; it < 16; it++) {
    for (let k = 0; k < 5; k++) gl.uniform1f(u(`gain[${k}]`), gain[k] || 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); gl.readPixels(0, 0, M, M, gl.RGBA, gl.UNSIGNED_BYTE, px);
    const mass = [0, 0, 0, 0];
    for (const j of INSIDE) for (let k = 0; k < 4; k++) mass[k] += px[j * 4 + k];
    const all = INSIDE.length * 255;
    areas = [...mass.map((m) => m / all), 0].slice(0, n);
    if (n === 5) areas[4] = Math.max(0, 1 - areas[0] - areas[1] - areas[2] - areas[3]);
    if (areas.every((a, k) => Math.abs(a - share[k]) < 0.005)) break;
    for (let k = 0; k < n; k++) gain[k] *= ((share[k] + 1e-3) / (areas[k] + 1e-3)) ** 0.8;
  }
  for (let k = 0; k < 5; k++) gl.uniform1f(u(`gain[${k}]`), gain[k] || 0);
  // Then the vat itself, centred.
  const side = Math.min(W, H), ox = Math.round((W - side) / 2), oy = Math.round((H - side) / 2);
  const baseY = canvas.height - H; // drawing at the bottom-left of a larger shared canvas: the top-left of the copy
  gl.uniform2f(u('res'), side, side); gl.uniform2f(u('org'), ox, baseY + oy); gl.uniform1i(u('mode'), 0);
  const frame = (t) => { gl.viewport(0, 0, canvas.width, canvas.height); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.viewport(ox, baseY + oy, side, side); gl.uniform1f(u('t'), t); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); };
  frame(0);
  out.dataset.areas = areas.map((x) => x.toFixed(3)).join(' '); // what the vat covers, to check against the shares
  out.dataset.calm = calm.toFixed(2);
  if (moving) out.release = () => gl.getExtension('WEBGL_lose_context')?.loseContext();
  if (moving && stir === 'hover') {
    // Drawn only while it moves: stirred under the pointer, then eased back to rest (t = 0).
    let t = 0, on = false, raf = 0, last = 0;
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      t = on ? t + dt * 6 : t * Math.exp(-dt * 2.4);
      if (!on && t < 0.02) t = 0;
      frame(t);
      raf = on || t ? requestAnimationFrame(tick) : 0;
    };
    const wake = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } };
    out.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'touch') { on = true; wake(); } });
    out.addEventListener('pointerleave', () => { on = false; wake(); });
  } else if (moving) {
    const t0 = performance.now();
    const loop = (now) => { if (!out.isConnected && now - t0 > 1000) { out.release(); return; } frame((now - t0) / 1000); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  } else {
    out.getContext('2d').drawImage(canvas, 0, 0, W, H, 0, 0, W, H);
  }
  return out;
}
