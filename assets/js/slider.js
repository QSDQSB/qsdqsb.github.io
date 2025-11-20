// Customize swiper for new-release voyage galleries.
document.addEventListener("DOMContentLoaded", function () {
const swiper = new Swiper('.new-release-swiper', {
    slidesPerView: 3,
    spaceBetween: 10,
    // slidesOffsetBefore: 20,      // inner left padding
    // slidesOffsetAfter: 20,       // inner right padding
    // centeredSlidesBounds: true,
    centeredSlides: true,
    loop: true,
    grabCursor: true,
    speed: 1000,
    autoplay: {
      delay: 5000,
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
    parallax: {
      enabled: true,
    },
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
  });