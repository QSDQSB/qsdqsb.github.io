/**
 * Enhanced Scroll Animations (IntersectionObserver)
 *
 * Conservative defaults:
 * - Only animates direct children of `.page__content`
 * - Skips TOC sidebar and non-content elements
 * - Respects `prefers-reduced-motion`
 * - Does not hide content when JS is disabled (`.no-js`)
 */

(function () {
  'use strict';

  if (!('IntersectionObserver' in window)) return;

  const reduceMotion =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  const pageContent = document.querySelector('.page__content');
  if (!pageContent) return;

  // Mark JS-ready to avoid any accidental no-js hiding.
  document.documentElement.classList.add('scroll-reveal-ready');

  const candidates = Array.from(pageContent.children).filter((el) => {
    if (!(el instanceof HTMLElement)) return false;
    if (el.classList.contains('sidebar__right')) return false; // TOC
    if (el.matches('script, style, noscript')) return false;
    // Skip empty wrappers that often exist in markdown
    if (!el.textContent || el.textContent.trim().length === 0) return false;
    return true;
  });

  if (candidates.length === 0) return;

  candidates.forEach((el) => el.classList.add('reveal-on-scroll'));

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      });
    },
    {
      root: null,
      // Reveal a bit before it fully enters; avoids “late” reveals.
      rootMargin: '0px 0px -10% 0px',
      threshold: 0.12
    }
  );

  candidates.forEach((el) => observer.observe(el));
})();

