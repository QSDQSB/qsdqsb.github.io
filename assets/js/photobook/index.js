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
