/**
 * DOM renderer: slide switching, loading states, bgSize toggle, fullscreen.
 * All visual mutations live here; other modules call these functions.
 */

import { getState, setState, subscribe } from './state.js';
import { getSlide, slideCount } from './slides.js';

// Must stay in sync with the CSS transition durations in _gallery_view.scss.
const SLIDE_DURATION   = 500;
const CAPTION_DURATION = 2000;

let _viewer      = null;
let _body        = null;
let _bgSize      = 'cover';
let _lastTrigger = null; // thumbnail that opened viewer — restored on close

// ─── Cookie helpers (self-contained; avoids global dependency) ───────────────

function _getCookie(name) {
  const parts = `; ${document.cookie}`.split(`; ${name}=`);
  return parts.length === 2 ? parts.pop().split(';').shift() : null;
}

function _setCookie(name, value, days) {
  const d = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value};expires=${d};path=/`;
}

// ─── Init ────────────────────────────────────────────────────────────────────

export function init(body, viewer) {
  _body   = body;
  _viewer = viewer;

  const saved = _getCookie('gallery_image_display');
  _bgSize = (saved === 'contain') ? 'contain' : 'cover';
  setState({ bgSize: _bgSize });
  viewer.classList.toggle('bg-contain', _bgSize === 'contain');

  // React to bgSize changes: brief 150ms cross-fade while swapping object-fit
  // (which is not animatable). Easier than animating around it.
  subscribe('bgSize', val => {
    _bgSize = val;
    _setCookie('gallery_image_display', val, 365);
    const slide = _viewer.querySelector('.slide.active');
    if (!slide) {
      _viewer.classList.toggle('bg-contain', val === 'contain');
      return;
    }
    slide.classList.add('bg-swapping');
    setTimeout(() => {
      _viewer.classList.toggle('bg-contain', val === 'contain');
      slide.classList.remove('bg-swapping');
    }, 150);
  });
}

export const getViewer     = () => _viewer;
export const getBody       = () => _body;
export const setLastTrigger = el => { _lastTrigger = el; };

// ─── Core slide switch ───────────────────────────────────────────────────────

export function switchTo(index, noHide) {
  const { current, locked } = getState();

  if (current === index && !_bp('xsmall')) return;
  if (locked) return;

  setState({ locked: true });

  if (!noHide && _bp('medium')) _doHide();

  const oldSlide = (current !== null) ? getSlide(current) : null;
  const newSlide = getSlide(index);
  if (!newSlide) { setState({ locked: false }); return; }

  setState({ current: index, mode: 'viewer' });

  if (oldSlide) {
    oldSlide.parent.classList.remove('active');
    oldSlide.slideEl.classList.remove('active');
    // The View Transitions API renders its own snapshot of the old slide
    // for the duration of the transition, so we can remove the live DOM
    // node fairly quickly without a visible cut.
    setTimeout(() => oldSlide.slideEl.remove(), SLIDE_DURATION);
  }

  newSlide.parent.classList.add('active');
  newSlide.parent.focus();

  _viewer.appendChild(newSlide.slideEl);

  const finalize = () => {
    newSlide.slideEl.classList.remove('loading');
    newSlide.slideEl.classList.add('active');
    setTimeout(() => setState({ locked: false }), 100);
    _animateCaption(newSlide);
  };

  if (newSlide.loaded) {
    // Already loaded — finalize directly. (RAF can stall while a View
    // Transition is awaiting its callback's promise, leaving locked=true.)
    finalize();
  } else {
    newSlide.slideEl.classList.add('loading');
    newSlide.slideImg.onload = () => {
      newSlide.loaded = true;
      finalize();
    };
    newSlide.slideImg.onerror = () => {
      newSlide.slideEl.classList.remove('loading');
      setState({ locked: false });
    };
    newSlide.slideImg.src = newSlide.url;
  }
}

/**
 * Same as switchTo but returns a promise that resolves once the slide is
 * fully active (image loaded, locked released). Used by the View Transitions
 * wrapper so the callback can await DOM settle before the post-snapshot.
 */
export function switchToAsync(index, noHide) {
  return new Promise(resolve => {
    let started = false;
    const unsub = subscribe('locked', val => {
      if (val) { started = true; return; }
      if (started) { unsub(); resolve(); }
    });
    switchTo(index, noHide);
    // If switchTo bailed early (same index, locked, or no slide), nothing locked.
    // Resolve next tick so callers don't hang.
    queueMicrotask(() => { if (!started) { unsub(); resolve(); } });
  });
}

/**
 * Pre-load a slide's full image so a subsequent switchTo is instant — used
 * to make View Transitions snapshots show a real image, not a blank.
 */
export function preloadSlide(slide) {
  if (slide.loaded) return Promise.resolve();
  return new Promise(resolve => {
    const tmp = new Image();
    tmp.onload = tmp.onerror = () => {
      slide.slideImg.src = slide.url;
      slide.loaded = true;
      resolve();
    };
    tmp.src = slide.url;
  });
}

const VT_NAME = 'gallery-active-image';

const _prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Module-level guard — `state.locked` releases ~100ms after `finalize()`
// (well before the View Transition's animation completes around 550ms).
// Without an explicit transition-lifetime guard, a second click during the
// in-flight VT animation kicks off a new `startViewTransition()` while the
// previous one is still painting — Safari aborts the new one (sometimes
// silently, sometimes mid-flight) because the spec is stricter about
// overlapping transitions than Chromium's tolerant implementation. This
// flag stays `true` for the *whole* VT lifetime so a rapid second click is
// dropped cleanly. Chromium users see no behavioural change vs. before.
let _morphActive = false;

/**
 * View-Transitions-API-driven slide change.
 *
 * Tags the source element (or current slide's <img> by default) and the
 * target slide's <img> with the same `view-transition-name`, then runs
 * the switch inside `document.startViewTransition`. The browser snapshots
 * old & new states and animates between them — for thumbnail clicks this
 * becomes a magnify morph; for slide-to-slide it's a crossfade.
 *
 * Falls through to plain switchTo if the API is unavailable or the user
 * has prefers-reduced-motion.
 */
export async function morphTo(index, sourceImg = null) {
  // Synchronous gate FIRST — claim the lock before any await so two rapid
  // calls in the same task can't both pass the guard.
  if (_morphActive) return;
  const { current, locked } = getState();
  if (current === index) return;
  if (locked) return;

  const newSlide = getSlide(index);
  if (!newSlide) return;

  if (!document.startViewTransition || _prefersReducedMotion()) {
    switchTo(index);
    return;
  }

  _morphActive = true;
  try {
    const oldSlide = current !== null ? getSlide(current) : null;
    const fromImg = sourceImg ?? oldSlide?.slideImg ?? null;

    // Pre-load the full image so the post-snapshot is real, not blank.
    await preloadSlide(newSlide);

    // Defensive cleanup: clear stale view-transition-name from any previous
    // run before tagging this round's source. Some Safari versions don't
    // reliably remove the inline property when set to '', so use both forms.
    _clearVTName(fromImg);
    _clearVTName(newSlide.slideImg);

    if (fromImg) fromImg.style.viewTransitionName = VT_NAME;

    const transition = document.startViewTransition(async () => {
      // Mutation phase: clear the source name (about to be torn down anyway)
      // and tag the target before the new snapshot is captured.
      _clearVTName(fromImg);
      newSlide.slideImg.style.viewTransitionName = VT_NAME;
      await switchToAsync(index);
    });

    transition.finished.finally(() => {
      _clearVTName(fromImg);
      _clearVTName(newSlide.slideImg);
      _morphActive = false;
    });
  } catch (err) {
    _morphActive = false;
    throw err;
  }
}

// Robustly remove an inline `view-transition-name` across browsers.
function _clearVTName(el) {
  if (!el || !el.style) return;
  el.style.viewTransitionName = '';
  el.style.removeProperty('view-transition-name');
}

function _animateCaption(slide) {
  const title = slide.slideCaption.querySelector('.image_title');
  if (!title) return;
  title.classList.add('hovered');
  setTimeout(() => title.classList.remove('hovered'), CAPTION_DURATION);
}

// ─── Navigation helpers ──────────────────────────────────────────────────────

export function next() {
  const { current, locked } = getState();
  if (locked) return;
  const n = slideCount();
  morphTo(current >= n - 1 ? 0 : current + 1);
}

export function previous() {
  const { current, locked } = getState();
  if (locked) return;
  const n = slideCount();
  morphTo(current <= 0 ? n - 1 : current - 1);
}

export function up() {
  if (_body.classList.contains('fullscreen')) return;
  const { current } = getState();
  const n = slideCount(), tpr = 2; // thumbnailsPerRow — must match SCSS
  morphTo(current <= tpr - 1 ? n - (tpr - 1 - current) - 1 : current - tpr);
}

export function down() {
  if (_body.classList.contains('fullscreen')) return;
  const { current } = getState();
  const n = slideCount(), tpr = 2;
  morphTo(current >= n - tpr ? current - n + tpr : current + tpr);
}

// ─── Panel show / hide / toggle ──────────────────────────────────────────────

export function show() {
  if (!_body.classList.contains('fullscreen')) return;
  _body.classList.remove('fullscreen');
  // Return focus to the thumbnail that triggered the viewer (a11y).
  (_lastTrigger ?? document.getElementById('gallery_main'))?.focus();
}

function _doHide() {
  if (_body.classList.contains('fullscreen')) return;
  _body.classList.add('fullscreen');
}

export function toggle() {
  const toggleEls = document.querySelectorAll('.toggle');
  if (_body.classList.contains('fullscreen')) {
    show();
    toggleEls.forEach(el => { el.style.transform = 'rotate(0deg)'; });
  } else {
    _doHide();
    toggleEls.forEach(el => { el.style.transform = 'rotate(180deg)'; });
  }
}

// ─── bgSize swap ─────────────────────────────────────────────────────────────

export function changeBgSize() {
  setState({ bgSize: getState().bgSize === 'cover' ? 'contain' : 'cover' });
}

// ─── Breakpoint helpers ──────────────────────────────────────────────────────

function _bp(name) {
  const px = { xsmall: 480, medium: 980 };
  return window.matchMedia(`(max-width: ${px[name]}px)`).matches;
}
