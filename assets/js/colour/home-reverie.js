/**
 * The landing page's Reverie (_includes/home/whats-new.html): one of Ridgway's colours the
 * photographs hold, at random on each visit (assets/reverie-picks.json, worked out at build by
 * scripts/photos/lib/atlas.mjs picksOf), its name and hex on the tile, and its dye poured across it
 * as Reverie pours its opening: the photograph holding it most, its colours round it, the colour at
 * sixty parts. The dye stirs while the pointer rests on the tile and settles when it leaves; the tile
 * opens that Reverie. Poured when the board comes near, so the landing costs nothing for it.
 */
import { vat, seedOf } from './vat.js';
import { focus, reverieOf, shadeFor } from './cards.js';

const tile = document.querySelector('.wn-card--reverie');

async function pour() {
  let picks = [];
  try { ({ picks } = await (await fetch(tile.dataset.picks)).json()); } catch { return; } // the Liquid pick stays
  if (!picks.length) return;
  const [name, six, from, sig] = picks[Math.floor(Math.random() * picks.length)];
  const hex = `#${six}`, cut = from.lastIndexOf('/');
  tile.href = reverieOf(from.slice(0, cut), from.slice(cut + 1), hex);
  tile.style.setProperty('--dye', hex);
  tile.style.setProperty('--shade', shadeFor(hex));
  tile.querySelector('.wn-named').textContent = name;
  tile.querySelector('.wn-hex').textContent = hex.toUpperCase();
  const { width, height } = tile.getBoundingClientRect();
  const dye = vat(focus(sig, hex), { shape: 'rect', width: Math.max(1, Math.round(width)), height: Math.max(1, Math.round(height)), seed: seedOf(from), stir: 'hover' });
  tile.querySelector('.wn-dye').replaceChildren(dye);
  tile.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'touch') dye.stir(true); });
  tile.addEventListener('pointerleave', () => dye.stir(false));
  tile.addEventListener('focus', () => dye.stir(true));
  tile.addEventListener('blur', () => dye.stir(false));
  await dye.ready;
  tile.classList.add('is-poured');
}

if (tile) {
  if (!('IntersectionObserver' in window)) pour();
  else {
    const io = new IntersectionObserver((seen) => { if (seen.some((e) => e.isIntersecting)) { io.disconnect(); pour(); } }, { rootMargin: '100% 0px' });
    io.observe(tile);
  }
}
