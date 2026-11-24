/**
 * A fable's room (_layouts/fable.html, _sass/_bestiary.scss): its cover's palette poured by the site's
 * dye vat (assets/js/colour/vat.js), calm and lifted toward the page's ground so the room is a tint of
 * the painting and never louder than it; and the sheet in the middle, the ground's own colour eased in
 * from the sides on a smootherstep curve, so the dye turns to paper with no edge to be seen.
 *
 * Where the window leaves no room beside the words (a phone, a narrow window) there is no dye and the sheet
 * is the whole width: the room shows only where there is room for it.
 *
 * The colours are the page's before this runs (the front matter's `room:`, from scripts/bestiary-room.py),
 * so without it the page is the plain ground and its words, which is enough to read by.
 */
import { vat, seedOf } from '../colour/vat.js';

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const toHex = (c) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
const ease = (t) => t * t * t * (t * (t * 6 - 15) + 10);

// OKLab, to set each dye at a lightness rather than lift it by a share: a dark cover lifted by a share
// stays dark, and its room reads as shadow round the page, not as colour.
const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const gam = (v) => 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);
function oklab([r, g, b]) {
  [r, g, b] = [r, g, b].map(lin);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}
function fromOklab([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s]
    .map((v) => Math.min(255, Math.max(0, gam(Math.min(1, Math.max(0, v))))));
}

// The dye shows only where the window leaves this much room beside the words, each side: narrower, a band
// of it reads as a stripe, not a room (the owner, 2026-11-24), and the sheet is the whole width.
const ROOM = 160;

const room = document.querySelector('[data-fable-room]');
const sheet = document.querySelector('[data-fable-sheet]');

function draw() {
  const css = getComputedStyle(document.documentElement);
  const ground = hex(css.getPropertyValue('--fable-ground').trim());
  const ink = hex(css.getPropertyValue('--fable-ink').trim());
  const palette = JSON.parse(room.dataset.palette || '[]');
  const words = document.querySelector('.fable');
  const W = innerWidth;
  const gap = words ? (W - words.getBoundingClientRect().width) / 2 : 0;
  const roomy = palette.length > 0 && gap >= ROOM;

  // The dye: each colour set a step below the ground's lightness (between .09 and .14 of OKLab L, the
  // darker colours lower), its hue kept and its chroma at four fifths or .035, whichever is less, so the room is the cover's colours
  // as a pale endpaper and never a shadow; poured calm (layers, not ribbons), drawn at half the window's
  // size and shown at its full size.
  room.replaceChildren();
  if (roomy) {
    const G = oklab(ground)[0];
    // The cover's accent is left out (as a drop it sits by the words as a stray spot, as a layer it fills a
    // flank), and every colour is held to a chroma of .035, so the room is never a saturated block.
    const quiet = palette.filter((p) => !p.accent).map((p) => {
      const [L, a, b] = oklab(hex(p.hex));
      const c = Math.hypot(a, b), k = Math.min(0.8, c ? 0.035 / c : 0);
      return { ...p, hex: toHex(fromOklab([G - 0.09 - 0.05 * (1 - L), a * k, b * k])) };
    });
    room.append(vat(quiet, { shape: 'rect', width: Math.round(W / 2), height: Math.round(innerHeight / 2), seed: seedOf(room.dataset.seed || 'bestiary'), calm: 0.8 }));
  }

  // The sheet: the ground, its grain and its mottle in the page's own ink, faint (a paper, not a stucco),
  // shown through a mask that is whole over the words and a little past them and eases out over at most
  // 200 px, leaving the rest of the room plain dye, a field of colour; with no room, whole across the width.
  // (The drawn edge runs past the page's head and foot, so the drift at the edge never lifts the paper off
  // the bottom.) Under the cover's foot it is whole across the width too, so the painting dissolves into one paper and
  // not into three colours, and the dye comes in beside the words below it.
  const b = roomy ? (gap - 24) / W : 0;
  const a = roomy ? Math.max(0.005, b - Math.min(gap * 0.5, 200) / W) : 0;
  const grey = (v) => { const c = Math.round(v * 255); return `rgb(${c},${c},${c})`; };
  const N = 14;
  const side = Array.from({ length: N + 1 }, (_, i) => [a + (b - a) * (i / N), grey(roomy ? ease(i / N) : 1)]);
  const stops = [[0, grey(roomy ? 0 : 1)], ...side, ...side.slice().reverse().map(([o, c]) => [1 - o, c]), [1, grey(roomy ? 0 : 1)]]
    .map(([o, c]) => `<stop offset="${o.toFixed(4)}" stop-color="${c}"/>`).join('');
  const [r, g, bl] = ink.map((v) => (v / 255).toFixed(3));
  const foot = Math.min(innerHeight * 0.68, 720) + 32, band = innerHeight * 0.35;
  const head = roomy ? `<linearGradient id="fable-sheet-h" gradientUnits="userSpaceOnUse" x1="0" y1="${foot}" x2="0" y2="${foot + band}">${Array.from({ length: N + 1 }, (_, i) => `<stop offset="${(i / N).toFixed(4)}" stop-color="#fff" stop-opacity="${(1 - ease(i / N)).toFixed(4)}"/>`).join('')}</linearGradient>` : '';
  const mottle = roomy ? 0.07 : 0; // with no room to blend into, the mottle is only a smudge on the paper
  sheet.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><defs>
    <linearGradient id="fable-sheet-g" x1="0" x2="1">${stops}</linearGradient>
    <filter id="fable-sheet-d" filterUnits="userSpaceOnUse" x="-200" y="-200" width="6000" height="80000"><feTurbulence type="fractalNoise" baseFrequency="0.0025" numOctaves="3" seed="11" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="${roomy ? 60 : 0}" xChannelSelector="R" yChannelSelector="G"/></filter>
    ${head}
    <mask id="fable-sheet-m"><rect y="-2%" width="100%" height="104%" fill="url(#fable-sheet-g)" filter="url(#fable-sheet-d)"/>${roomy ? `<rect width="100%" height="${Math.round(foot + band)}" fill="url(#fable-sheet-h)"/>` : ''}</mask>
    <filter id="fable-sheet-k" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="3" seed="4"/><feColorMatrix values="0 0 0 0 ${r}  0 0 0 0 ${g}  0 0 0 0 ${bl}  0 0 0 .05 0"/></filter>
    <filter id="fable-sheet-t" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".008" numOctaves="3" seed="9"/><feColorMatrix values="0 0 0 0 ${r}  0 0 0 0 ${g}  0 0 0 0 ${bl}  0 0 0 ${mottle} ${mottle ? -0.02 : 0}"/></filter>
  </defs><g mask="url(#fable-sheet-m)"><rect width="100%" height="100%" fill="var(--fable-ground)"/><rect width="100%" height="100%" filter="url(#fable-sheet-t)"/><rect width="100%" height="100%" filter="url(#fable-sheet-k)"/></g></svg>`;
}

if (room && sheet) {
  draw();
  // Drawn again when the window settles at a new width (a phone turned, a window resized), not as it moves.
  let w = innerWidth, t;
  addEventListener('resize', () => { clearTimeout(t); t = setTimeout(() => { if (innerWidth !== w) { w = innerWidth; draw(); } }, 250); });
}
