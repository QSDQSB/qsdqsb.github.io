/**
 * Voyage cards take their covers only as they come near.
 *
 * _includes/archive-single.html with defer_cover=true parks a card's cover in --bg-later
 * instead of --bg-img, so /voyage/, a voyage's index of parts and the Photobook's closing
 * cards do not fetch every cover on arrival. A card within 800px of the screen gets its
 * cover (--bg-img) from here; one on the first screen gets it straight away.
 *
 * Automated renderers (window.QSD_MOTION_OFF: crawlers, screenshot baselines) and browsers
 * without IntersectionObserver take every cover at once, so a full-page render is complete.
 * Without JS, `.no-js .card` in _sass/_archive.scss reads --bg-later directly.
 */
(function () {
  'use strict';

  function show(card) {
    card.style.setProperty('--bg-img', card.style.getPropertyValue('--bg-later'));
  }

  function init() {
    var cards = Array.prototype.filter.call(document.querySelectorAll('.card'), function (c) {
      return c.style.getPropertyValue('--bg-later');
    });
    if (!cards.length) return;

    if (window.QSD_MOTION_OFF === true || !('IntersectionObserver' in window)) {
      cards.forEach(show);
      return;
    }

    var io = new IntersectionObserver(function (seen) {
      seen.forEach(function (e) {
        if (e.isIntersecting) { show(e.target); io.unobserve(e.target); }
      });
    }, { rootMargin: '800px 0px' });
    cards.forEach(function (c) { io.observe(c); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
