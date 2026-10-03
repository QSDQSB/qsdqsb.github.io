/**
 * Scroll reveals: content blocks fade up as they enter the viewport (IntersectionObserver)
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

  // Reduced-motion readers and automated renderers (the kill-switch) both bail
  // out: no reveal classes, content stays visible. See window.QSD.motionOff.
  const reduceMotion = window.QSD.motionOff();
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
    // Skip empty wrappers that often exist in markdown — except image
    // figures (`.article-image`), which legitimately have no text.
    const isImageFigure = el.matches && el.matches('.article-image');
    if (!isImageFigure && (!el.textContent || el.textContent.trim().length === 0)) return false;
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

  candidates.forEach((el) => el.classList.add('reveal-on-scroll', 'arrives'));

  // Blocks that come into view together take turns, 0.12 s apart, in the order they are read; the
  // first four take turns and the rest arrive with the fourth (_scroll-animations.scss, "The arrival").
  const STEP = 0.12;
  const TURNS = 4;
  const inOrder = (a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
  function arrive(els) {
    // Only those not yet shown take turns: after a language switch the blocks already on the screen
    // are collected again, and must not hold the new panel back.
    els.filter((el) => !el.classList.contains('is-visible')).sort(inOrder).forEach((el, i) => {
      el.style.setProperty('--arrive-delay', `${Math.min(i, TURNS - 1) * STEP}s`);
      el.classList.add('is-visible');
    });
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      const now = entries.filter((entry) => entry.isIntersecting).map((entry) => entry.target);
      now.forEach((el) => obs.unobserve(el));
      arrive(now);
    },
    {
      root: null,
      // A block arrives once its top is a tenth of the screen above the bottom edge. Any part showing is enough: a
      // block taller than the screen (a long code block, a table) would never show 12 per cent of
      // itself at once, and would stay hidden.
      rootMargin: '0px 0px -10% 0px',
      threshold: 0
    }
  );

  function registerCandidates(nodes) {
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const inView = [];

    nodes.forEach((el) => {
      el.classList.add('reveal-on-scroll', 'arrives');
      observer.observe(el);

      // A block already in view (the first screen, or a panel a language switch has just shown)
      // arrives now, in turn with the others in view, instead of waiting for the next scroll.
      const rect = el.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < viewportHeight) {
        inView.push(el);
        observer.unobserve(el);
      }
    });
    arrive(inView);
  }

  // Observe normally so elements animate as they scroll into view.
  registerCandidates(candidates);

  window.addEventListener('qsd:bilingual-change', () => {
    registerCandidates(collectCandidates());
  });
})();
