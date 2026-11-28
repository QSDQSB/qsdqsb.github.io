/**
 * The dye as a hero's picture (`.page__hero-media--dye`, _sass/_components.scss): a palette's dye vat
 * (./vat.js, shape 'rect') poured across the hero's whole width, drawn small and spread, as Reverie's
 * opening is. Called again with another palette, the new dye is laid over the last
 * through the site's crossfade (../photobook/wash.js); at once with motion off. Without WebGL it is the
 * still every vat falls back to.
 *
 *   dyeHero(media, palette, { seed })   palette: [{hex, pc, accent}] or [[hex, pc, accent]]
 *
 * A page with no script of its own sets `data-dye='[["#hex", pc], …]'` (and `data-dye-seed`, any text)
 * on the media, and loads this module: poured once, still. QSD's Palette (./palette.js) calls it.
 */

import { vat, seedOf } from './vat.js';
import { crossfade } from '../photobook/wash.js';

export function dyeHero(media, palette, { seed = 1 } = {}) {
  const box = media.getBoundingClientRect();
  // A quarter of its size, not Reverie's eighth: spread over a hero's width, an eighth shows its steps.
  const field = vat(palette, { shape: 'rect', width: Math.max(16, Math.round(box.width / 4)), height: Math.max(9, Math.round(box.height / 4)), seed });
  crossfade(media, field);
  return field;
}

for (const el of document.querySelectorAll('.page__hero-media--dye[data-dye]')) {
  try { dyeHero(el, JSON.parse(el.dataset.dye), { seed: seedOf(el.dataset.dyeSeed || el.dataset.dye) }); } catch { /* a dye that cannot be read: the page's ground */ }
}
