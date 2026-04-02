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

  const nestedRevealSelectors = [
    '.paragraph-center-wrapper',
    '.center-wrapper',
    '.lyrics',
    '.reveal-on-scroll-target',
    '[data-bilingual]',
    '[data-bilingual-lang]',
    '.bilingual-switch__panel'
  ].join(', ');

  function isValidCandidate(el) {
    if (!(el instanceof HTMLElement)) return false;
    // Skip elements inside the right sidebar / TOC
    if (el.closest && el.closest('.sidebar__right')) return false;
    if (el.matches && el.matches('script, style, noscript, .bilingual-switch')) return false;
    // Skip hidden language panels until they become active
    if (el.hidden || el.getAttribute('aria-hidden') === 'true') return false;
    // Skip empty wrappers that often exist in markdown
    if (!el.textContent || el.textContent.trim().length === 0) return false;
    return true;
  }

  function collectCandidates() {
    // Collect direct children plus specific inner containers so nested
    // sections (e.g. `.center-wrapper`, `.lyrics`, bilingual panels) can
    // reveal independently.
    const directChildren = Array.from(pageContent.children);
    const nestedWrappers = Array.from(pageContent.querySelectorAll(nestedRevealSelectors));
    const nestedChildren = [];

    nestedWrappers.forEach((wrapper) => {
      if (!(wrapper instanceof HTMLElement)) return;
      const elChildren = Array.from(wrapper.children).filter((c) => c instanceof HTMLElement);
      if (elChildren.length > 0) {
        nestedChildren.push(...elChildren);
      } else {
        nestedChildren.push(wrapper);
      }
    });

    return Array.from(new Set(directChildren.concat(nestedChildren))).filter(isValidCandidate);
  }

  const candidates = collectCandidates();

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

  function registerCandidates(nodes) {
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

    nodes.forEach((el) => {
      el.classList.add('reveal-on-scroll');
      observer.observe(el);

      // If the active language was switched while the element is already in
      // view, reveal it immediately instead of waiting for the next scroll.
      const rect = el.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < viewportHeight) {
        el.classList.add('is-visible');
        observer.unobserve(el);
      }
    });
  }

  // Observe normally so elements animate as they scroll into view.
  registerCandidates(candidates);

  window.addEventListener('qsd:bilingual-change', () => {
    registerCandidates(collectCandidates());
  });
})();
