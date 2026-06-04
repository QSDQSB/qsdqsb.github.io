/**
 * Slide preloader.
 *
 * Two strategies, both feeding the same memoised `slide.load()` Promise
 * (see slides.js) so consumers (renderer, preloader, anything else) never
 * race or clobber each other:
 *
 *   1. **Urgent N±1 prefetch** — on every slide change, kick off the
 *      previous and next slides' loads at high priority. Cheapest win for
 *      sequential nav (←/→ arrows, swipe).
 *
 *   2. **Background warm-up** — after the first slide is shown, walk the
 *      remaining slides during idle frames and load them all. This is the
 *      key to eliminating click-to-transition dead time: by the time the
 *      visitor clicks a far-away thumbnail, its full image is already
 *      decoded, so the View Transition starts the same frame as the click
 *      rather than after a half-second `await` on the network.
 */

import { subscribe } from './state.js';
import { getSlide, getSlides, slideCount } from './slides.js';

// Tunables — small numbers chosen to stay well under bandwidth budgets on
// mobile while still completing a 20-image voyage gallery in a few seconds
// of idle time.
const WARMUP_DELAY_MS = 1200; // wait for first slide to settle before warming
const WARMUP_BATCH    = 2;    // concurrent warm-up loads at any moment

export function init() {
  // (1) Urgent N±1 prefetch on slide change.
  subscribe('current', index => {
    if (index === null) return;
    const n = slideCount();
    [((index - 1) + n) % n, (index + 1) % n].forEach(prefetch);
  });

  // (2) Background warm-up — defer to give the active slide and its
  // immediate neighbours a clear runway, then opportunistically load the
  // rest during idle frames.
  setTimeout(_warmUpAll, WARMUP_DELAY_MS);
}

export function prefetch(index) {
  const slide = getSlide(index);
  if (!slide || slide.loaded) return;
  slide.load();
}

/**
 * Progressive background loader. Walks every slide that hasn't been
 * fetched yet and asks it to load — but only `WARMUP_BATCH` at a time,
 * and scheduled via `requestIdleCallback` so it never competes with
 * user-driven work (a click, a scroll, an in-flight View Transition).
 */
function _warmUpAll() {
  const queue = getSlides()
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => !s.loaded);

  if (!queue.length) return;

  const idle = window.requestIdleCallback || (cb => setTimeout(cb, 250));
  let inFlight = 0;

  const pump = () => {
    while (inFlight < WARMUP_BATCH && queue.length) {
      const { s } = queue.shift();
      if (s.loaded) continue;
      inFlight++;
      s.load().finally(() => {
        inFlight--;
        if (queue.length) idle(pump);
      });
    }
  };

  idle(pump);
}
