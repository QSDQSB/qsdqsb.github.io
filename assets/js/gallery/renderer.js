/**
 * DOM renderer: slide switching, loading states, bgSize toggle, fullscreen.
 * All visual mutations live here; other modules call these functions.
 *
 * MOTION MODEL — a single, engine-agnostic opacity crossfade.
 *
 * Every slide is an absolutely-positioned layer filling the viewer. To switch
 * images we stack the incoming slide ON TOP of the outgoing one at opacity 0
 * and fade it to 1; the outgoing slide stays fully opaque underneath until the
 * fade completes, then it is removed. Because the new image always covers the
 * old one at every opacity step, the composite never reveals the background —
 * there is no mid-transition darkening "dip", just a clean dissolve.
 *
 * This deliberately uses ONLY a CSS `transition: opacity` (see `.slide .image`
 * in _gallery_view.scss). There is no View Transitions API, no snapshotting,
 * no decode-before-snapshot race, and no cross-browser divergence: the swap
 * looks and times identically in Safari, Chrome, and Firefox. An earlier
 * iteration drove this with `document.startViewTransition` and suppressed the
 * CSS fallback during the transition — which produced hard cuts in Safari
 * whenever its VT under-delivered, because nothing was left to animate. This
 * model has no such failure mode.
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

export const getViewer      = () => _viewer;
export const getBody        = () => _body;
export const setLastTrigger = el => { _lastTrigger = el; };

// ─── Core slide switch — the one and only motion path ────────────────────────

/**
 * Switch the active slide to `index`, crossfading the new image in over the
 * old. If the new image isn't decoded yet, the old image stays in place and a
 * hairline loading bar shows until the new one is ready — so the visitor never
 * sees a blank frame or a half-painted image.
 *
 * `noHide` skips the auto-collapse of the thumbnail rail on small viewports
 * (used for the initial slide on load and for hash/popstate navigation).
 */
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

  // Move the thumbnail-rail selection (blue border) immediately — it should
  // track intent, not wait for the image to finish loading.
  if (oldSlide && oldSlide !== newSlide) {
    oldSlide.parent.classList.remove('active');
    _concealCaption(oldSlide);
  }
  newSlide.parent.classList.add('active');
  newSlide.parent.focus();

  const crossfade = () => {
    // Bail if the visitor navigated on while we were waiting to load.
    if (getState().current !== index) { _viewer.classList.remove('pending'); return; }

    _viewer.classList.remove('pending');
    newSlide.slideEl.classList.remove('loading');

    // Stack the incoming slide on top (appendChild moves it last == highest in
    // the equal-z stacking order). It begins at opacity 0 via `.slide .image`.
    _viewer.appendChild(newSlide.slideEl);

    // Commit the opacity:0 starting state to layout BEFORE flipping to active,
    // so the browser actually runs the 0→1 transition instead of collapsing
    // append+active into a single frame (which would be an instant cut).
    void newSlide.slideEl.offsetHeight;

    newSlide.slideEl.classList.add('active'); // image fades 0 → 1 over the old
    _revealCaption(newSlide);

    if (oldSlide && oldSlide !== newSlide) {
      // Keep the old slide fully opaque UNDERNEATH the fading-in new one (no
      // background dip), then retire it once the crossfade has completed.
      const dying = oldSlide.slideEl;
      setTimeout(() => {
        // Don't remove it if the visitor has navigated back to it meanwhile.
        if (getSlide(getState().current)?.slideEl !== dying) {
          dying.classList.remove('active');
          dying.remove();
        }
      }, SLIDE_DURATION);
    }

    // Release the lock partway through the fade so navigation stays responsive
    // without letting a second swap start before this one is visually underway.
    setTimeout(() => setState({ locked: false }), SLIDE_DURATION * 0.4);
  };

  if (newSlide.loaded) {
    crossfade();
  } else {
    // Genuinely waiting on the network. Leave the old image on screen, show the
    // loading bar, and crossfade only once the new image is fetched + decoded.
    _viewer.classList.add('pending');
    newSlide.slideEl.classList.add('loading');
    newSlide.load().then(crossfade);
  }
}

// ─── Captions ────────────────────────────────────────────────────────────────

/**
 * Reveal the title overlay on a slide and schedule its auto-hide. The caption
 * rides the same opacity vocabulary as the image (see `.image_title` in SCSS).
 */
function _revealCaption(slide) {
  const title = slide.slideCaption.querySelector('.image_title');
  if (!title) return;
  clearTimeout(slide._captionTimer);
  title.classList.add('hovered');
  slide._captionTimer = setTimeout(() => {
    title.classList.remove('hovered');
  }, CAPTION_DURATION);
}

/** Hide a slide's title — symmetric to `_revealCaption`. */
function _concealCaption(slide) {
  const title = slide.slideCaption.querySelector('.image_title');
  if (!title) return;
  clearTimeout(slide._captionTimer);
  title.classList.remove('hovered');
}

// ─── Navigation helpers ──────────────────────────────────────────────────────

export function next() {
  const { current, locked } = getState();
  if (locked) return;
  const n = slideCount();
  switchTo(current >= n - 1 ? 0 : current + 1);
}

export function previous() {
  const { current, locked } = getState();
  if (locked) return;
  const n = slideCount();
  switchTo(current <= 0 ? n - 1 : current - 1);
}

export function up() {
  if (_body.classList.contains('fullscreen')) return;
  const { current } = getState();
  const n = slideCount(), tpr = 2; // thumbnailsPerRow — must match SCSS
  switchTo(current <= tpr - 1 ? n - (tpr - 1 - current) - 1 : current - tpr);
}

export function down() {
  if (_body.classList.contains('fullscreen')) return;
  const { current } = getState();
  const n = slideCount(), tpr = 2;
  switchTo(current >= n - tpr ? current - n + tpr : current + tpr);
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
