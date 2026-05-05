/**
 * N±1 adjacent-slide prefetcher.
 *
 * On each slide change, loads the previous and next full images into the
 * browser cache and marks the slide as loaded (with backgroundImage set),
 * so renderer.js takes the instant "already loaded" path for those slides.
 */

import { subscribe } from './state.js';
import { getSlide, slideCount } from './slides.js';

const _queued = new Set(); // indices already prefetched (or in flight)

export function init() {
  subscribe('current', index => {
    if (index === null) return;
    const n = slideCount();
    // Prefetch both neighbours, wrapping at the ends.
    [((index - 1) + n) % n, (index + 1) % n].forEach(i => prefetch(i));
  });
}

export function prefetch(index) {
  if (_queued.has(index)) return;
  const slide = getSlide(index);
  if (!slide || slide.loaded) return;

  _queued.add(index);
  slide.slideImg.onload = () => { slide.loaded = true; };
  slide.slideImg.src = slide.url;
}
