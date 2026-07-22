/**
 * URL hash ↔ state.current synchronisation.
 *
 * Hash scheme: #N  where N is 1-based slide number (/voyage/london/#7 = slide index 6).
 *
 * Dependency: subscribes to state only; dispatches a custom event to avoid
 * a circular import with renderer.js.
 */

import { subscribe } from './state.js';

let _skipPush = true; // suppresses hash push during initial switchTo

export function init() {
  // After each state.current change, mirror it to the URL hash.
  subscribe('current', index => {
    if (_skipPush || index === null) return;
    const hash = `#${index + 1}`;
    if (window.location.hash !== hash) history.pushState(null, '', hash);
  });

  // Browser back / forward: read the new hash and navigate there.
  window.addEventListener('popstate', () => {
    const index = _parseHash();
    if (index !== null) {
      // Dispatch to index.js; avoids a renderer.js circular import.
      window.dispatchEvent(new CustomEvent('gallery:goto', { detail: index }));
    }
  });
}

/** Call this once the initial slide has been set, so navigation pushes hashes. */
export function enableHashPush() { _skipPush = false; }

/** Returns the 0-based index encoded in the current URL hash, or null. */
export function getInitialIndex() { return _parseHash(); }

// Backspace / "leave gallery" navigates to the parent voyage page, anchored
// to the gallery title. Shared by index.js (click) and keyboard.js (Backspace).
export function goToParent() {
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

function _parseHash() {
  const hash = window.location.hash;
  if (!hash || hash === '#') return null;
  const n = parseInt(hash.slice(1), 10);
  return (Number.isFinite(n) && n >= 1) ? n - 1 : null;
}
