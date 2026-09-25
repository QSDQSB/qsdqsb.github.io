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
  });
  lb.openFromHash();
}

// The closing cards take their covers only as they come near (see _includes/photobook/end.html).
const later = document.querySelectorAll('.photobook-end .card');
if (later.length) {
  const io = new IntersectionObserver((seen) => {
    for (const e of seen) if (e.isIntersecting) { e.target.style.setProperty('--bg-img', e.target.style.getPropertyValue('--bg-later')); io.unobserve(e.target); }
  }, { rootMargin: '800px 0px' });
  later.forEach((c) => io.observe(c));
}
