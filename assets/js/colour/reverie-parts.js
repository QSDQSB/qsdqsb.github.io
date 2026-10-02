/**
 * Reverie's parts, shared by the page (./reverie.js) and the card a post sets in its column
 * (./figures.js): the photograph a colour opens on, its name in Ridgway's book, the photographs that
 * hold it and the colours nearby, the dye poured for it, and the words and rows both set them in.
 * What the page shows of a colour the card shows, by the same rule: neither keeps a copy of the other's.
 */

import { vat, oklab } from './vat.js';
import { card, focus, holding, closest, varied, nearby, reverieOf, SHOWN } from './cards.js';

const PALETTE = new URL('../../../palette/', import.meta.url).pathname;

/** Ridgway's names (/assets/ridgway.json `colours`, [name, hex] each) as a way to name a colour: the
 *  nearest of his within half again the eye's match of it, else none (''). */
export function namer(colours) {
  const book = colours.map(([n, h]) => [n.replace(/\s*\(\d\)$/, ''), oklab(`#${h}`)]);
  return (hex) => {
    const P = oklab(hex); let best = null;
    for (const [n, L] of book) { const x = Math.hypot(P[0] - L[0], P[1] - L[1], P[2] - L[2]); if (!best || x < best.x) best = { n, x }; }
    return best && best.x <= 0.03 ? best.n : '';
  };
}

/** The colour (`hex`, #rrggbb or none) and the photograph it was found in (`from`, gallery/slug or
 *  none), made whole: without a photograph, the one that holds the colour most; without a colour, the
 *  photograph's most vivid one of any size; without either, a photograph at random. */
export function opening(frames, { hex = null, from = '' } = {}) {
  const cut = from.lastIndexOf('/');
  let f = frames.find((x) => x.g === from.slice(0, cut) && x.slug === from.slice(cut + 1));
  if (!f && hex) f = holding(frames, hex, { least: 0 })[0]?.f;
  // Found in a photograph that barely holds it (a voyage's palette leads here from its best frame by
  // signature, which the dots may not bear out): the one of its voyage that holds it most, else any.
  if (f && hex && !holding([f], hex, { least: 1 / 24 }).length) f = holding(frames.filter((x) => x.g === f.g), hex, { least: 1 / 24 })[0]?.f || holding(frames, hex, { least: 0 })[0]?.f || f;
  // A colour no photograph holds opens on the one that comes closest to it, never on nothing and
  // never on a photograph at random. With no colour asked, any photograph, and its own colour.
  if (!f && hex) f = closest(frames, hex);
  if (!f) f = frames[Math.floor(Math.random() * frames.length)];
  if (!hex) {
    const vivid = f.sig.filter(([h, pc]) => pc >= 8 && oklab(h)[0] > 0.3).sort((a, b) => Math.hypot(...oklab(b[0]).slice(1)) - Math.hypot(...oklab(a[0]).slice(1)));
    hex = (vivid[0] || [...f.sig].sort((a, b) => b[1] - a[1])[0])[0];
  }
  return { f, hex };
}

/**
 * What a colour's Reverie holds, from its opening: `focused`, the photograph's colours turned toward
 * this one (./cards.js focus), its dye; `found`, the photographs that hold it, the one it was found in
 * first, then the nearest others, no voyage crowding the rest out; `all`, how many hold it; `around`,
 * the colours a step away, this one among them, dark to light.
 */
export function gather(frames, { f, hex }) {
  const others = holding(frames, hex, { not: f });
  return {
    focused: focus(f.sig, hex),
    found: [{ f }, ...varied(others, { most: SHOWN - 1 })],
    all: others.length + 1,
    around: [...nearby(frames, hex), { hex, f, here: true }].sort((a, b) => oklab(a.hex)[0] - oklab(b.hex)[0]),
  };
}

/** The dye for a colour field `el`: a rectangular vat (./vat.js) drawn at an eighth of the size it is
 *  shown and let soften as it is spread: a mood. Still, from the shared context. `width`, `height`:
 *  the size it was drawn at, for a stirring one of the same. */
export function pour(el, focused, seed) {
  const box = el.getBoundingClientRect();
  const width = Math.max(1, Math.round(box.width / 8)), height = Math.max(1, Math.round(box.height / 8));
  return { field: vat(focused, { shape: 'rect', width, height, seed }), width, height };
}

/** The row of colours nearby: each a way to its own Reverie, the colour here marked among them. */
export const nearRow = (around) => `<p class="reverie__near-label">Nearby</p><ol>${around.map((c) => `<li>${c.here
  ? `<span class="is-here" style="--c:${c.hex}" aria-current="true"><span class="visually-hidden">${c.hex.toUpperCase()}, here</span></span>`
  : `<a href="${reverieOf(c.f.g, c.f.slug, c.hex)}" style="--c:${c.hex}" data-tip="${c.hex.toUpperCase()}" data-tip-side="top" aria-label="${c.hex.toUpperCase()}"></a>`}</li>`).join('')}</ol>`;

/** How many photographs the colour is in, as Reverie says it: `shown` of `all`. */
export const countLine = (shown, all) => (all > shown ? `QSD reveries: the ${shown} nearest of ${all} photographs` : (all === 1 ? 'QSD reveries in only this photograph… for now' : `QSD reveries in ${all} photographs`));

/** The photographs, bare: the print and its words; the first, where the colour was found, ringed.
 *  `href(p)`: where a print leads; `label`: that place, for a screen reader. A voyage's name opens
 *  its palette. `pages`: each gallery's page and title. */
export const prints = (found, pages, { href, label }) => `<div class="palette-cards">${found.map(({ f: p }, i) => card(p, { href: href(p), label, i, from: i === 0, place: pages[p.g].title, placeHref: `${PALETTE}?at=${encodeURIComponent(p.slug)}#${p.g}`, plain: true })).join('')}</div>`;
