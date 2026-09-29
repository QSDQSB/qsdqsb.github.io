/**
 * Ridgway's Colours (_pages/utils-ridgway.html): the named colours of Robert Ridgway's Color Standards
 * and Color Nomenclature (1912), plate by plate as the book sets them; each opens its Reverie, the
 * photographs that hold it (./cards.js holding). Those no photograph holds are dimmed, from counts
 * worked out at build, so the book is on screen at once and nothing is matched here.
 *
 * Data: /assets/ridgway.json (scripts/colour/ridgway.mjs), /assets/reverie-picks.json (held).
 */

import { tips } from '../photobook/tip.js';
import { esc, reverieOf, cameFrom, backLabel } from './cards.js';

const root = document.getElementById('ridgway');
const plates = root?.querySelector('.ridgway-plates');

async function main() {
  // How many photographs hold each colour, worked out at build (scripts/photos/lib/atlas.mjs picksOf).
  const counts = fetch(new URL('../../reverie-picks.json', import.meta.url)).then((r) => r.json()).then((d) => d.held).catch(() => null);
  let book = null;
  try { book = await (await fetch(new URL('../../ridgway.json', import.meta.url))).json(); } catch { /* shown below */ }
  if (!book?.colours?.length) { plates.innerHTML = '<p class="colour-empty">The plates could not be read.</p>'; return; }

  // The masthead's ‹, when the reader came from another page of the site: back that way (Reverie as
  // they left it), not to the Utilities.
  const back = document.querySelector('.masthead__back'), came = cameFrom();
  if (back && came) {
    const to = backLabel(came);
    back.href = came.href; back.setAttribute('aria-label', to); back.dataset.tip = to;
    back.addEventListener('click', (e) => { if (history.length > 1) { e.preventDefault(); history.back(); } });
  }

  const byPlate = new Map();
  for (const [name, hex, plate] of book.colours) { if (!byPlate.has(plate)) byPlate.set(plate, []); byPlate.get(plate).push([name, hex]); }
  plates.innerHTML = [...byPlate].map(([plate, cs]) => `<section class="ridgway-plate" aria-label="Plate ${plate}">
      <h2 class="ridgway-plate__no">Plate ${plate}</h2>
      <ol>${cs.map(([name, hex]) => `<li><a class="ridgway-swatch" href="${reverieOf(null, null, `#${hex}`)}" style="--c:#${hex}" data-hex="#${hex}"><i></i><b>${esc(name)}</b><span>${hex.toUpperCase()}</span></a></li>`).join('')}</ol>
    </section>`).join('');

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
