/**
 * Accessibility enhancements for the gallery viewer.
 *
 * - Adds role="region" + aria-label to #viewer so screen readers announce it.
 * - Injects a visually-hidden live region that announces the current slide
 *   (title + position) on every slide change.
 * - On mobile (phone viewport), traps focus within #viewer when it is the
 *   only visible panel (fullscreen mode), and releases it when the sidebar
 *   is shown again.
 *
 * Focus trap is intentionally skipped on desktop: both panels are visible
 * simultaneously and users need Tab to move freely between them.
 */

import { subscribe } from './state.js';
import { getSlide } from './slides.js';

export function init(viewer) {
  // Semantic role for the viewer pane.
  viewer.setAttribute('role', 'region');
  viewer.setAttribute('aria-label', 'Photo viewer');

  // Screen-reader announcement live region (visually hidden).
  const announce = document.createElement('div');
  announce.setAttribute('aria-live', 'polite');
  announce.setAttribute('aria-atomic', 'true');
  announce.className = 'visually-hidden';
  viewer.appendChild(announce);

  // Update the live region whenever the current slide changes.
  subscribe('current', (index, state) => {
    if (index === null) return;
    const slide = getSlide(index);
    const titleEl = slide?.slideCaption.querySelector('.image_title h3');
    const title   = titleEl?.textContent?.trim() || `Image ${index + 1}`;
    // Brief pause before setting text so screen readers reliably pick it up.
    setTimeout(() => {
      announce.textContent = `${title} — ${index + 1} of ${state.total}`;
    }, 50);
  });

  // Mobile focus trap: activate when body gains 'fullscreen' (viewer only shown),
  // release when it is removed (sidebar visible again).
  const phoneQuery = window.matchMedia('(max-width: 480px)');
  const body = document.body;

  const observer = new MutationObserver(() => {
    if (!phoneQuery.matches) return;
    if (body.classList.contains('fullscreen')) {
      _trapFocus(viewer);
    } else {
      _releaseFocus(viewer);
    }
  });
  observer.observe(body, { attributes: true, attributeFilter: ['class'] });
}

// ─── Focus trap helpers ───────────────────────────────────────────────────────

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

function _trapFocus(viewer) {
  viewer.addEventListener('keydown', _trapHandler);
}

function _releaseFocus(viewer) {
  viewer.removeEventListener('keydown', _trapHandler);
}

function _trapHandler(e) {
  if (e.key !== 'Tab') return;
  const focusable = Array.from(e.currentTarget.querySelectorAll(FOCUSABLE));
  if (!focusable.length) return;
  const first = focusable[0];
  const last  = focusable[focusable.length - 1];

  if (e.shiftKey) {
    if (document.activeElement === first) { e.preventDefault(); last.focus(); }
  } else {
    if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
  }
}
