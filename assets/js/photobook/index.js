/**
 * The Photobook's script (_includes/photobook.html). The page is complete without it: every frame
 * is plain HTML. This adds the glow, the film filter and sheet, and the lightbox.
 *
 * Data: one JSON block (#photobook-data), what the lightbox needs per frame, written at build
 * time by scripts/photos/lib/book.mjs. Styles: _sass/_photobook.scss.
 */

import { glow } from './glow.js';
import { book } from './book.js';
import { lightbox } from './lightbox.js';
import { tips } from './tip.js';

tips();

const dataEl = document.getElementById('photobook-data');
if (dataEl) {
  let frames = [];
  try { frames = JSON.parse(dataEl.textContent); } catch { frames = []; }
  const g = glow(frames);
  const lb = lightbox(frames);
  book({
    frames,
    onOpen: (i, order, fromImg) => lb.open(i, order, fromImg),
    onLayout: (targets) => g.watch(targets),
    onScreen: (order) => lb.screen(order),
  });
  lb.openFromHash();
}

// Prints develop over their placeholders as they arrive (see .is-developing in _photobook.scss);
// one already in hand when the script runs is shown at once.
const main = document.querySelector('.photobook-main');
if (main) {
  const show = (img) => img.classList.add('is-in');
  for (const img of main.querySelectorAll('.photobook-frame__print img')) {
    if (img.complete && img.naturalWidth) show(img);
    else { img.addEventListener('load', () => show(img), { once: true }); img.addEventListener('error', () => show(img), { once: true }); }
  }
  new MutationObserver((ms) => { for (const m of ms) for (const n of m.addedNodes) n.querySelectorAll?.('.photobook-frame__print img').forEach((img) => (img.complete ? show(img) : img.addEventListener('load', () => show(img), { once: true }))); })
    .observe(main, { childList: true, subtree: true });
  main.classList.add('is-developing');
}

// The closing cards take their covers only as they come near (see _includes/photobook/end.html).
const later = document.querySelectorAll('.photobook-end .card');
if (later.length) {
  const io = new IntersectionObserver((seen) => {
    for (const e of seen) if (e.isIntersecting) { e.target.style.setProperty('--bg-img', e.target.style.getPropertyValue('--bg-later')); io.unobserve(e.target); }
  }, { rootMargin: '800px 0px' });
  later.forEach((c) => io.observe(c));
}
