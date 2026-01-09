// Customize swiper for different layouts.
document.addEventListener("DOMContentLoaded", function () {
  // Swiper config for new-release voyage galleries
  const newReleaseEl = document.querySelector('.new-release-swiper');
  if (newReleaseEl) {
    new Swiper('.new-release-swiper', {
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
    if (pageOverlayEl && typeof Swiper !== 'undefined') {
      const swiperWrapper = pageOverlayEl.querySelector('.swiper-wrapper');
      const slides = swiperWrapper && swiperWrapper.querySelectorAll('.swiper-slide');
      
      if (slides && slides.length > 0) {
        // Force layout calculation for Chrome
        void pageOverlayEl.offsetHeight;
        
        // Use setTimeout to ensure DOM is fully ready (Chrome fix)
        setTimeout(function() {
          const pageOverlaySwiper = new Swiper('.page-overlay-swiper', {
            slidesPerView: 1,
            centeredSlides: true,
            loop: slides.length > 1,
            speed: 800,
            allowTouchMove: false, 
            spaceBetween: 0,
            autoplay: {
              delay: 9000,
              disableOnInteraction: false,
            },
            preventInteractionOnTransition: true,
            observer: true,
            observeParents: true,
            watchOverflow: true,
            parallax: {
              enabled: true,
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
      setTimeout(initPageOverlaySwiper, 200);
    }
  }
  
  // Initialize page overlay swiper
  initPageOverlaySwiper();
});