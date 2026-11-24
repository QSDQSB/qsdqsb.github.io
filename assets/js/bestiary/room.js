/**
 * A fable's room (_layouts/fable.html, _sass/_bestiary.scss): its cover's palette poured by the site's
 * dye vat (assets/js/colour/vat.js), calm and lifted toward the page's ground so the room is a tint of
 * the painting and never louder than it; and the sheet in the middle, the ground's own colour eased in
 * from the sides on a smootherstep curve, so the dye turns to paper with no edge to be seen.
 *
 * The colours are the page's before this runs (the front matter's `room:`, from scripts/bestiary-room.py),
 * so without it the page is the plain ground and its words, which is enough to read by.
 */
import { vat, seedOf } from '../colour/vat.js';

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const toHex = (c) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
const ease = (t) => t * t * t * (t * (t * 6 - 15) + 10);

const room = document.querySelector('[data-fable-room]');
const sheet = document.querySelector('[data-fable-sheet]');
if (room && sheet) {
  const css = getComputedStyle(document.documentElement);
  const ground = hex(css.getPropertyValue('--fable-ground').trim());
  const ink = hex(css.getPropertyValue('--fable-ink').trim());
  const palette = JSON.parse(room.dataset.palette || '[]');

  // The dye: each colour lifted part of the way to the ground, poured calm (layers, not ribbons), drawn
  // at half the window's size and shown at its full size (it is a mood, and softens as it spreads).
  if (palette.length) {
    const quiet = palette.map((p) => ({ ...p, hex: toHex(hex(p.hex).map((v, i) => v + (ground[i] - v) * 0.38)) }));
    const canvas = vat(quiet, { shape: 'rect', width: Math.round(innerWidth / 2), height: Math.round(innerHeight / 2), seed: seedOf(room.dataset.seed || 'bestiary'), calm: 0.8 });
    room.append(canvas);
  }

  // The sheet: the ground, its grain and its mottle in the page's own ink, shown through a mask that is
  // whole over the words and eases out toward the sides; on a phone a narrow, plain fringe (no drift,
  // which at that width reads as a torn edge).
  const phone = innerWidth < 760;
  const [a, b] = phone ? [0, 0.07] : [0.03, 0.31];
  const grey = (v) => { const c = Math.round(v * 255); return `rgb(${c},${c},${c})`; };
  const N = 14;
  const side = Array.from({ length: N + 1 }, (_, i) => [a + (b - a) * (i / N), grey(ease(i / N))]);
  const stops = [[0, grey(0)], ...side, ...side.slice().reverse().map(([o, c]) => [1 - o, c]), [1, grey(0)]]
    .map(([o, c]) => `<stop offset="${o.toFixed(4)}" stop-color="${c}"/>`).join('');
  const [r, g, bl] = ink.map((v) => (v / 255).toFixed(3));
  sheet.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><defs>
    <linearGradient id="fable-sheet-g" x1="0" x2="1">${stops}</linearGradient>
    <filter id="fable-sheet-d" filterUnits="userSpaceOnUse" x="-200" y="-200" width="4000" height="80000"><feTurbulence type="fractalNoise" baseFrequency="${phone ? 0.008 : 0.0025}" numOctaves="3" seed="11" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="${phone ? 0 : 60}" xChannelSelector="R" yChannelSelector="G"/></filter>
    <mask id="fable-sheet-m"><rect width="100%" height="100%" fill="url(#fable-sheet-g)" filter="url(#fable-sheet-d)"/></mask>
    <filter id="fable-sheet-k" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="3" seed="4"/><feColorMatrix values="0 0 0 0 ${r}  0 0 0 0 ${g}  0 0 0 0 ${bl}  0 0 0 .13 0"/></filter>
    <filter id="fable-sheet-t" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".008" numOctaves="3" seed="9"/><feColorMatrix values="0 0 0 0 ${r}  0 0 0 0 ${g}  0 0 0 0 ${bl}  0 0 0 .14 -.04"/></filter>
  </defs><g mask="url(#fable-sheet-m)"><rect width="100%" height="100%" fill="var(--fable-ground)"/><rect width="100%" height="100%" filter="url(#fable-sheet-t)"/><rect width="100%" height="100%" filter="url(#fable-sheet-k)"/></g></svg>`;
}
