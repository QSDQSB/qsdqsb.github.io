/**
 * Touch / swipe gesture handler.
 * Mirrors the legacy gallery.js touch logic exactly:
 *   - Viewer: swipe left → next, swipe right → previous.
 *             touchend hides the sidebar on ≤980px viewports.
 *   - Main panel (right-side, ≥480px only): swipe right to dismiss (hide sidebar).
 *
 * dx = startX − currentX, so:
 *   dx > +DELTA  = swiping left  (finger moves left)
 *   dx < −DELTA  = swiping right (finger moves right)
 */

import { next, previous, getBody } from './renderer.js';

const BOUNDARY = 20; // px — vertical tolerance for treating a move as horizontal
const DELTA    = 50; // px — minimum horizontal travel to trigger a swipe action

export function init(viewer, mainEl) {
  _initViewer(viewer);
  if (mainEl) _initMain(mainEl);
}

// ─── Viewer ──────────────────────────────────────────────────────────────────

function _initViewer(viewer) {
  let startX = null, startY = null;

  viewer.addEventListener('touchstart', e => {
    startX = e.touches[0].pageX;
    startY = e.touches[0].pageY;
  }, { passive: true });

  viewer.addEventListener('touchmove', e => {
    if (startX === null) return;
    const dx = startX - e.touches[0].pageX;
    const dy = startY - e.touches[0].pageY;

    if (Math.abs(dy) < BOUNDARY) {
      if (dx >  DELTA) { startX = null; next();     return; } // swipe left  → next
      if (dx < -DELTA) { startX = null; previous(); return; } // swipe right → previous
    }

    // Prevent overscroll at the top/bottom edges of the viewer.
    const th = viewer.offsetHeight;
    const ts = viewer.scrollHeight - viewer.scrollTop;
    if ((viewer.scrollTop <= 0 && dy < 0) || (ts > th - 2 && ts < th + 2 && dy > 0)) {
      e.preventDefault();
    }
  }, { passive: false });

  // Tapping the viewer hides the sidebar on ≤980 px (medium and below).
  viewer.addEventListener('touchend', () => {
    startX = null;
    startY = null;
    if (window.matchMedia('(max-width: 980px)').matches) _hidePanel();
  });
}

// ─── Main (sidebar) panel ────────────────────────────────────────────────────

function _initMain(mainEl) {
  let startX = null, startY = null;

  mainEl.addEventListener('touchstart', e => {
    if (window.matchMedia('(max-width: 480px)').matches) return; // disabled on xsmall
    startX = e.touches[0].pageX;
    startY = e.touches[0].pageY;
  }, { passive: true });

  mainEl.addEventListener('touchmove', e => {
    if (window.matchMedia('(max-width: 480px)').matches) return;
    if (startX === null) return;

    const dx = startX - e.touches[0].pageX;
    const dy = startY - e.touches[0].pageY;

    // Panel sits on the right → swipe right (dx < −DELTA) dismisses it.
    if (Math.abs(dy) < BOUNDARY && dx < -DELTA) {
      startX = null;
      _hidePanel();
      return;
    }

    // Prevent overscroll at the top/bottom edges of the panel.
    const th = mainEl.offsetHeight;
    const ts = mainEl.scrollHeight - mainEl.scrollTop;
    if ((mainEl.scrollTop <= 0 && dy < 0) || (ts > th - 2 && ts < th + 2 && dy > 0)) {
      e.preventDefault();
    }
  }, { passive: false });

  mainEl.addEventListener('touchend', () => { startX = null; startY = null; });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function _hidePanel() {
  const body = getBody();
  if (body && !body.classList.contains('fullscreen')) body.classList.add('fullscreen');
}
