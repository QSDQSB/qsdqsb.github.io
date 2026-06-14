/**
 * Gallery viewer — entry point.
 *
 * Boots the module tree in dependency order, wires DOM events, and
 * sets the initial slide from the URL hash (or slide 0 on non-xsmall).
 */

import { setState, getState } from './state.js';
import { build, slideCount }  from './slides.js';
import {
  init      as initRenderer,
  switchTo,
  next, previous,
  setLastTrigger,
  toggle,
  changeBgSize,
} from './renderer.js';
import { init as initUrlSync, getInitialIndex, enableHashPush } from './url-sync.js';
import { init as initKeyboard } from './keyboard.js';
import { init as initTouch }    from './touch.js';
import { init as initA11y }     from './a11y.js';
import { init as initPreloader } from './preloader.js';

// ─── Boot ─────────────────────────────────────────────────────────────────────

function boot() {
  const thumbnailsEl = document.getElementById('thumbnails');
  if (!thumbnailsEl) return; // not a gallery-viewer page

  const body = document.body;

  // ── 1. Inject viewer shell into <body> ──────────────────────────────────────
  body.insertAdjacentHTML('beforeend', `
    <div id="viewer">
      <div class="loading-bar" aria-hidden="true"></div>
      <div class="inner">
        <div class="nav-next"           title="Next Image&#10;→ Right OR ⎵ Space"></div>
        <div class="nav-previous"       title="Previous Image&#10;← Left"></div>
        <div class="toggle"             title="Toggle Gallery Bar&#10;⎋ Esc"></div>
        <div class="toggle-image-display" title="Toggle Image Display&#10;⇧ Shift"></div>
        <div class="leave_gallery"      title="Leave Gallery&#10;⌫ Backspace"></div>
      </div>
    </div>`);

  const viewer     = document.getElementById('viewer');
  const galleryMain = document.getElementById('gallery_main');

  // Inject the two controls that live inside #gallery_main (shown on phone only).
  if (galleryMain) {
    galleryMain.insertAdjacentHTML('beforeend', '<div class="leave_gallery"></div>');
    galleryMain.insertAdjacentHTML('beforeend', '<div class="toggle"></div>');
  }

  // ── 2. Build slide objects from thumbnail DOM ───────────────────────────────
  build(thumbnailsEl);
  setState({ total: slideCount() });

  // ── 3. Init modules ─────────────────────────────────────────────────────────
  initRenderer(body, viewer);   // must be first (others depend on switchTo)
  initUrlSync();
  initA11y(viewer);
  initPreloader();
  initKeyboard();
  initTouch(viewer, galleryMain);

  // ── 4. Wire click events ────────────────────────────────────────────────────
  _bindEvents(thumbnailsEl, viewer, galleryMain);

  // ── 5. Loading-class lifecycle (mirrors legacy gallery.js) ──────────────────
  window.addEventListener('load', () => {
    body.classList.remove('is-loading-0');
    setTimeout(() => body.classList.remove('is-loading-1'), 100);
    setTimeout(() => body.classList.remove('is-loading-2'), 100 + Math.max(750 - 150, 0));
  });

  let _resizeTimer;
  window.addEventListener('resize', () => {
    body.classList.add('is-loading-0');
    clearTimeout(_resizeTimer);
    _resizeTimer = setTimeout(() => body.classList.remove('is-loading-0'), 100);
  });

  // ── 6. Thumbnail lazy loading (IntersectionObserver) ───────────────────────
  _initLazyLoad(thumbnailsEl);

  // Image-saving deterrent is now handled in CSS via `pointer-events: none`
  // on the <img> elements (see _gallery_view.scss). The right-click target
  // becomes the parent <div> instead, so the browser's menu drops the
  // image-specific items ("Save Image As", "Copy Image") while keeping
  // every other menu action available.

  // ── 7. Initial slide ────────────────────────────────────────────────────────
  const xsmallMQ    = window.matchMedia('(max-width: 480px)');
  const hashIndex   = getInitialIndex(); // null if no hash
  const startIndex  = hashIndex ?? 0;

  const maybeSwitch = () => {
    if (!xsmallMQ.matches && getState().current === null) {
      switchTo(startIndex, true); // noHide = true on initial load
      // Allow hash pushes from here on, but only after a tick so that
      // the initial switchTo's state.current subscription fires first.
      setTimeout(enableHashPush, 0);
    }
  };

  // Re-check when the viewport crosses the xsmall breakpoint.
  if (xsmallMQ.addEventListener) {
    xsmallMQ.addEventListener('change', maybeSwitch);
  } else {
    xsmallMQ.addListener(maybeSwitch); // Safari < 14 fallback
  }

  // url-sync dispatches this event on popstate so we can call switchTo
  // without creating a circular module import.
  window.addEventListener('gallery:goto', e => switchTo(e.detail, true));

  setTimeout(maybeSwitch, 0);
}

// ─── Event wiring ─────────────────────────────────────────────────────────────

function _bindEvents(thumbnailsEl, viewer, galleryMain) {
  const navNext    = viewer.querySelector('.nav-next');
  const navPrev    = viewer.querySelector('.nav-previous');
  const imgDisplay = viewer.querySelector('.toggle-image-display');

  // Delegated click on thumbnails. Uses exactly the same crossfade as
  // nav-next/prev — one quiet photo-to-photo dissolve everywhere, keeping
  // the focus on the photograph.
  thumbnailsEl.addEventListener('click', e => {
    const thumb = e.target.closest('.thumbnail');
    if (!thumb || !thumbnailsEl.contains(thumb)) return;
    e.preventDefault();
    e.stopPropagation();
    if (getState().locked) return;
    const index = parseInt(thumb.dataset.index, 10);
    if (!isNaN(index)) {
      setLastTrigger(thumb);
      switchTo(index);
    }
  });

  // Nav arrows.
  navNext?.addEventListener('click', () => next());
  navPrev?.addEventListener('click', () => previous());

  // Cover ↔ contain toggle.
  imgDisplay?.addEventListener('click', () => changeBgSize());

  // Leave gallery (viewer + main — both get the class).
  document.querySelectorAll('.leave_gallery').forEach(el =>
    el.addEventListener('click', _goToParent));

  // Panel toggle (viewer + main — both get the class).
  document.querySelectorAll('.toggle').forEach(el => {
    el.addEventListener('click', () => toggle());
    // Stop the touchend from bubbling up to the viewer's "hide on tap" handler.
    el.addEventListener('touchend', e => e.stopPropagation());
  });
}

// ─── Thumbnail lazy loading ───────────────────────────────────────────────────
// The <img class="thumb-img"> elements use native loading="lazy".
// This observer simply fades them in once they've decoded, so there's no
// flash from opacity-0 → opacity-1 on images that load before DOMContentLoaded.

function _initLazyLoad(thumbnailsEl) {
  const imgs = thumbnailsEl.querySelectorAll('img.thumb-img');
  if (!imgs.length) return;

  const markLoaded = img => {
    img.classList.add('loaded');
  };

  imgs.forEach(img => {
    if (img.complete && img.naturalWidth) {
      markLoaded(img);
    } else {
      img.addEventListener('load', () => markLoaded(img), { once: true });
    }
  });
}

// ─── Leave-gallery navigation ─────────────────────────────────────────────────

function _goToParent() {
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

// ─── Run ──────────────────────────────────────────────────────────────────────

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
