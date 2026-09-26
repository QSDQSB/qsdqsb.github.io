/**
 * The colophon's field: every dot of the voyage (24 from each frame, lib/dots.mjs) packed into one
 * carpet, the greys first, then the colours in order of hue (starting after the widest gap in this
 * voyage's hues, so no family is split across the two ends), each column light above and dark below.
 * Under the pointer a dot lights its frame's twenty-four and names the frame; a click opens it.
 */

const CELL = 10;
const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
function lab(hex) {
  const r = lin(parseInt(hex.slice(0, 2), 16)), g = lin(parseInt(hex.slice(2, 4), 16)), b = lin(parseInt(hex.slice(4, 6), 16));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}

export function field(frames, onOpen) {
  const box = document.querySelector('.photobook-field');
  if (!box) return;
  const dots = [];
  frames.forEach((p, i) => {
    const s = p.dots || '';
    for (let k = 0; k + 8 <= s.length; k += 8) {
      const hex = s.slice(k, k + 6), [L, a, b] = lab(hex), C = Math.hypot(a, b);
      dots.push({ hex, i, L, C, h: ((Math.atan2(b, a) * 180) / Math.PI + 360 + 330) % 360 });
    }
  });
  if (!dots.length) { box.hidden = true; return; }
  const cv = box.querySelector('canvas');
  const ctx = cv.getContext('2d');
  let grid = null, W = 0, H = 0, on = -1;

  // The order, once: greys by how grey, then hue from the widest gap round.
  const grey = dots.filter((d) => d.C < 0.03).sort((x, y) => x.C - y.C);
  const hued = dots.filter((d) => d.C >= 0.03).sort((x, y) => x.h - y.h);
  let from = 0, widest = -1;
  hued.forEach((d, k) => { const next = hued[(k + 1) % hued.length], g = (next.h - d.h + 360) % 360 || (hued.length === 1 ? 360 : 0); if (g > widest) { widest = g; from = (k + 1) % hued.length; } });
  const sequence = [...grey, ...hued.slice(from), ...hued.slice(0, from)];

  function lay() {
    W = Math.max(8, Math.floor(box.clientWidth / CELL));
    H = Math.max(1, Math.ceil(dots.length / W));
    const cols = Math.ceil(dots.length / H);
    grid = new Int32Array(W * H).fill(-1);
    for (let c = 0; c < cols; c++) {
      sequence.slice(c * H, (c + 1) * H).sort((x, y) => y.L - x.L).forEach((d, r) => { d.x = c; d.y = r; grid[r * W + c] = dots.indexOf(d); });
    }
    const dpr = Math.min(2, devicePixelRatio || 1);
    const used = Math.ceil(dots.length / H);
    cv.width = used * CELL * dpr; cv.height = H * CELL * dpr;
    cv.style.width = `${used * CELL}px`; cv.style.height = `${H * CELL}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    paint();
  }
  function paint() {
    ctx.clearRect(0, 0, W * CELL, H * CELL);
    for (const d of dots) {
      if (d.x == null) continue;
      ctx.globalAlpha = on < 0 || d.i === on ? 1 : 0.2;
      ctx.fillStyle = `#${d.hex}`;
      ctx.beginPath(); ctx.arc(d.x * CELL + CELL / 2, d.y * CELL + CELL / 2, CELL * 0.38, 0, 2 * Math.PI); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  const at = (e) => {
    const r = cv.getBoundingClientRect(), x = Math.floor((e.clientX - r.left) / CELL), y = Math.floor((e.clientY - r.top) / CELL);
    const k = x >= 0 && y >= 0 && x < W && y < H ? grid[y * W + x] : -1;
    return k >= 0 ? dots[k].i : -1;
  };
  cv.addEventListener('pointermove', (e) => {
    const i = at(e);
    if (i === on) return;
    on = i; paint();
    if (i < 0) return;
    const r = cv.getBoundingClientRect(), x = r.left + Math.floor((e.clientX - r.left) / CELL) * CELL, y = r.top + Math.floor((e.clientY - r.top) / CELL) * CELL;
    cv.dispatchEvent(new CustomEvent('photobook:say', { bubbles: true, detail: { text: frames[i].name || '', rect: { left: x, right: x + CELL, top: y, bottom: y + CELL, width: CELL, height: CELL } } }));
  });
  cv.addEventListener('pointerleave', () => { on = -1; paint(); });
  cv.addEventListener('click', (e) => { const i = at(e); if (i >= 0) onOpen?.(i); });
  let t = 0;
  new ResizeObserver(() => { cancelAnimationFrame(t); t = requestAnimationFrame(lay); }).observe(box);
}
