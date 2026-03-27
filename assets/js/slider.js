// Customize swiper for different layouts.
document.addEventListener("DOMContentLoaded", function () {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let newReleaseSwiper = null;
  let pageOverlaySwiper = null;
  let pageOverlayInitTimer = null;
  let pageOverlayRetryTimer = null;
  let viewportUpdateRaf = null;
  let pendingViewportPhase = null;

  // Swiper config for new-release voyage galleries
  const newReleaseEl = document.querySelector('.new-release-swiper');
  if (newReleaseEl) {
    newReleaseSwiper = new Swiper('.new-release-swiper', {
      slidesPerView: 3,
      spaceBetween: 10,
      centeredSlides: true,
      loop: true,
      speed: 800,
      autoplay: {
        delay: 4000,
        disableOnInteraction: false,
      },
      mousewheel: {
        invert: false,
      },
      preventInteractionOnTransition: true,
      observer: true,
      observeParents: true,
      keyboard: {
        enabled: true,
        onlyInViewport: true,
      },
      // parallax: {
      //   enabled: true,
      // },
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      },
    
      // lazy: {
      //   loadOnTransitionStart: true,
      //   loadPrevNext: true,
      // },
    
      breakpoints: {
        0: {
          slidesPerView: 1,
        },
        360: {
          slidesPerView: 3,
          spaceBetween: 0,
        },
        480: {
          slidesPerView: 3,
          spaceBetween: 16,
        },
        1280: {
          slidesPerView: 5,
          spaceBetween: 20,
        },
      },
    });
  };
  // Swiper config for page overlay
  function initPageOverlaySwiper() {
    const pageOverlayEl = document.querySelector('.page-overlay-swiper');
    if (pageOverlaySwiper && !pageOverlaySwiper.destroyed) {
      pageOverlaySwiper.update();
      pageOverlaySwiper.updateSlides();
      return;
    }

    if (pageOverlayEl && typeof Swiper !== 'undefined') {
      const swiperWrapper = pageOverlayEl.querySelector('.swiper-wrapper');
      const slides = swiperWrapper && swiperWrapper.querySelectorAll('.swiper-slide');
      
      if (slides && slides.length > 0) {
        // Force layout calculation for Chrome
        void pageOverlayEl.offsetHeight;
        
        // Use setTimeout to ensure DOM is fully ready (Chrome fix)
        window.clearTimeout(pageOverlayInitTimer);
        pageOverlayInitTimer = window.setTimeout(function() {
          pageOverlayInitTimer = null;
          pageOverlaySwiper = new Swiper('.page-overlay-swiper', {
            slidesPerView: 1,
            centeredSlides: true,
            loop: slides.length > 1,
            speed: prefersReducedMotion ? 0 : 1100,
            allowTouchMove: false, 
            spaceBetween: 0,
            autoplay: prefersReducedMotion ? false : {
              delay: 9000,
              disableOnInteraction: false,
            },
            preventInteractionOnTransition: true,
            observer: true,
            observeParents: true,
            watchOverflow: true,
            parallax: {
              enabled: !prefersReducedMotion,
            },
            on: {
              init: function() {
                // Force update after initialization to fix Chrome rendering
                this.update();
                this.updateSlides();
              },
              imagesReady: function() {
                // Update when images are loaded
                this.update();
              }
            }
          });
        }, 100);
      }
    } else if (pageOverlayEl && typeof Swiper === 'undefined') {
      // Retry if Swiper not loaded yet
      window.clearTimeout(pageOverlayRetryTimer);
      pageOverlayRetryTimer = window.setTimeout(initPageOverlaySwiper, 200);
    }
  }

  const scheduleSwiperViewportUpdate = function (event) {
    const detail = event && event.detail ? event.detail : {};
    const phase = detail.phase || "active";
    pendingViewportPhase = phase === "settled" ? "settled" : (pendingViewportPhase || phase);

    if (viewportUpdateRaf) return;

    viewportUpdateRaf = window.requestAnimationFrame(function () {
      viewportUpdateRaf = null;
      const queuedPhase = pendingViewportPhase || "active";
      pendingViewportPhase = null;

      if (queuedPhase !== "settled") return;

      if (newReleaseSwiper && !newReleaseSwiper.destroyed) {
        newReleaseSwiper.update();
        newReleaseSwiper.updateSlides();
      }

      if (pageOverlaySwiper && !pageOverlaySwiper.destroyed) {
        pageOverlaySwiper.update();
        pageOverlaySwiper.updateSlides();
      } else {
        initPageOverlaySwiper();
      }
    });
  };
  
  // Initialize page overlay swiper
  initPageOverlaySwiper();
  window.addEventListener("qsd:viewport-change", scheduleSwiperViewportUpdate, { passive: true });
});
