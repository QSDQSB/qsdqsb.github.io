// Customize swiper for new-release voyage galleries.
document.addEventListener("DOMContentLoaded", function () {
const swiper = new Swiper('.new-release-swiper', {
    slidesPerView: 1.2,
    spaceBetween: 16,
    centeredSlides: false,
    loop: true,
    grabCursor: true,
  
    // effect: "slide",
  
    autoplay: {
      delay: 5000,
      disableOnInteraction: false,
    },
    mousewheel: {
      invert: false,
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
        768: {
          slidesPerView: 2.5,
          spaceBetween: 20,
        },
        1024: {
          slidesPerView: 3.5,
          spaceBetween: 24,
        },
    },
  });
  });