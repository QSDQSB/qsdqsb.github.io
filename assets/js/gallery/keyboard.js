/**
 * Keyboard shortcut handler.
 * Parity with the legacy gallery.js shortcuts — all 8 bindings preserved.
 */

import { next, previous, up, down, toggle, changeBgSize } from './renderer.js';

// Backspace navigates to the parent voyage page, anchored to the gallery title.
function goToParent() {
  const segs = window.location.pathname.split('/').filter(Boolean);
  if (segs.length > 1) {
    segs.pop();
    const base  = '/' + segs.join('/') + '/';
    const title = document.querySelector('#header h1')?.textContent?.trim() || '';
    if (title) {
      const slug = title.toLowerCase().replace(/[^a-z0-9À-ÿ]+/g, '-').replace(/^-+|-+$/g, '');
      window.location.href = base + '#' + slug;
    } else {
      window.location.href = base;
    }
  } else {
    window.location.href = '/';
  }
}

const KEYS = {
   8: () => goToParent(),     // Backspace — leave gallery
  16: () => changeBgSize(),   // Shift     — toggle cover / contain
  27: () => toggle(),         // Escape    — toggle sidebar panel
  32: () => next(),           // Space     — next slide
  37: () => previous(),       // ← Arrow   — previous slide
  38: () => up(),             // ↑ Arrow   — move up one row
  39: () => next(),           // → Arrow   — next slide
  40: () => down(),           // ↓ Arrow   — move down one row
};

export function init() {
  // Suppress gallery shortcuts when focus is inside a form element.
  document.body.addEventListener('keydown', e => {
    if (e.target.matches('input, select, textarea')) e.stopPropagation();
  }, true); // capture so it runs before the window listener

  window.addEventListener('keydown', e => {
    if (window.matchMedia('(max-width: 480px)').matches) return; // no keyboard on xsmall
    if (!(e.keyCode in KEYS)) return;
    e.preventDefault();
    e.stopPropagation();
    KEYS[e.keyCode]();
  });
}
