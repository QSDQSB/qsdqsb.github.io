/**
 * Ridgway's Colours (_pages/utils-ridgway.html): the named colours of Robert Ridgway's Color Standards
 * and Color Nomenclature (1912), plate by plate as the book sets them; each opens its Reverie, the
 * photographs that hold it (./cards.js holding). The plates are the page's own (drawn at build from
 * _data/ridgway.json); here, those no photograph holds are dimmed, from counts worked out at build
 * (/assets/reverie-picks.json held), and ‹ goes back the way the reader came.
 */

import { tips } from '../photobook/tip.js';
import { cameFrom, backLabel, json } from './cards.js';

const root = document.getElementById('ridgway');
const plates = root?.querySelector('.ridgway-plates');

async function main() {
  // How many photographs hold each colour, worked out at build (scripts/photos/lib/atlas.mjs picksOf).
  const counts = json(new URL('../../reverie-picks.json', import.meta.url)).then((d) => d.held).catch(() => null);
  // The masthead's ‹, when the reader came from another page of the site: back that way (Reverie as
  // they left it), not to the Utilities.
  const back = document.querySelector('.masthead__back'), came = cameFrom();
  if (back && came) {
    const to = backLabel(came);
    back.href = came.href; back.setAttribute('aria-label', to); back.dataset.tip = to;
    back.addEventListener('click', (e) => { if (history.length > 1) { e.preventDefault(); history.back(); } });
  }

  // Which of them the photographs hold: those none holds are named in grey.
  const held = await counts;
  if (!held) return;
  for (const a of plates.querySelectorAll('.ridgway-swatch')) {
    const n = held[a.dataset.hex.slice(1)] || 0;
    a.classList.toggle('is-unheld', !n);
    a.dataset.tip = n ? `In ${n} photograph${n === 1 ? '' : 's'}` : 'In none of the photographs';
    a.dataset.tipSide = 'top';
  }
}

if (plates) { tips(); main(); }
