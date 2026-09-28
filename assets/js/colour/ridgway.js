/**
 * Ridgway's Colours (_pages/utils-ridgway.html): the named colours of Robert Ridgway's Color Standards
 * and Color Nomenclature (1912), plate by plate as the book sets them; each opens its Reverie, the
 * photographs that hold it (./cards.js holding). Those no photograph holds are dimmed, worked out a
 * plate at a time while the page is idle, so the book is on screen at once.
 *
 * Data: /assets/ridgway.json (scripts/colour/ridgway.mjs), /assets/colour-atlas.json.
 */

import { tips } from '../photobook/tip.js';
import { esc, reverieOf, holding } from './cards.js';

const root = document.getElementById('ridgway');
const plates = root?.querySelector('.ridgway-plates');

async function main() {
  const atlas = fetch(new URL('../../colour-atlas.json', import.meta.url)).then((r) => r.json()).catch(() => null);
  let book = null;
  try { book = await (await fetch(new URL('../../ridgway.json', import.meta.url))).json(); } catch { /* shown below */ }
  if (!book?.colours?.length) { plates.innerHTML = '<p class="colour-empty">The plates could not be read.</p>'; return; }

  const byPlate = new Map();
  for (const [name, hex, plate] of book.colours) { if (!byPlate.has(plate)) byPlate.set(plate, []); byPlate.get(plate).push([name, hex]); }
  plates.innerHTML = [...byPlate].map(([plate, cs]) => `<section class="ridgway-plate" aria-label="Plate ${plate}">
      <h2 class="ridgway-plate__no">Plate ${plate}</h2>
      <ol>${cs.map(([name, hex]) => `<li><a class="ridgway-swatch" href="${reverieOf(null, null, `#${hex}`)}" style="--c:#${hex}" data-hex="#${hex}"><i></i><b>${esc(name)}</b><span>${hex.toUpperCase()}</span></a></li>`).join('')}</ol>
    </section>`).join('');

  // Which of them the photographs hold, a plate at a time, when the page is idle.
  const frames = ((await atlas)?.photos || []).filter((p) => p.dots);
  if (!frames.length) return;
  const idle = window.requestIdleCallback || ((f) => setTimeout(f, 16));
  const sections = [...plates.querySelectorAll('.ridgway-plate')];
  let k = 0;
  const next = () => {
    const s = sections[k++]; if (!s) return;
    for (const a of s.querySelectorAll('.ridgway-swatch')) {
      const n = holding(frames, a.dataset.hex).length;
      a.classList.toggle('is-unheld', !n);
      a.dataset.tip = n ? `In ${n} photograph${n === 1 ? '' : 's'}` : 'In none of the photographs';
      a.dataset.tipSide = 'top';
    }
    idle(next);
  };
  idle(next);
}

if (plates) { tips(); main(); }
