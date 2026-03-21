/* ==========================================================================
   jQuery plugin settings and other scripts
   ========================================================================== */

/* ==========================================================================
   Cookie Utility Functions (Global)
   ========================================================================== */

/**
 * Get a cookie value by name
 * @param {string} name - Cookie name
 * @returns {string|null} Cookie value or null if not found
 */
function getCookie(name) {
	var nameEQ = name + "=";
	var ca = document.cookie.split(';');
	for(var i = 0; i < ca.length; i++) {
		var c = ca[i];
		while (c.charAt(0) === ' ') c = c.substring(1, c.length);
		if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
	}
	return null;
}

/**
 * Set a cookie with expiration
 * @param {string} name - Cookie name
 * @param {string} value - Cookie value
 * @param {number} days - Number of days until expiration
 */
function setCookie(name, value, days) {
	var expires = "";
	if (days) {
		var date = new Date();
		date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
		expires = "; expires=" + date.toUTCString();
	}
	document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

$(document).ready(function(){
   // Sticky footer
  var bumpIt = function() {
      $("body").css("margin-bottom", $(".page__footer").outerHeight(true));
    },
    didResize = false;
    // Track last known window size and DPR to ignore trivial resize events
    var _lastWindowState = { w: window.innerWidth, h: window.innerHeight, dpr: window.devicePixelRatio };

  bumpIt();

  $(window).resize(function() {
    var now = { w: window.innerWidth, h: window.innerHeight, dpr: window.devicePixelRatio };
    var dw = Math.abs(now.w - _lastWindowState.w);
    var dh = Math.abs(now.h - _lastWindowState.h);
    var ddpr = Math.abs(now.dpr - _lastWindowState.dpr);
    // Ignore very small changes (e.g., fractional layout changes from zoom) to avoid rapid toggles.
    if (dw < 60 && dh < 40 && ddpr === 0) return;
    _lastWindowState = now;
    didResize = true;
  });
  setInterval(function() {
    if (didResize) {
      didResize = false;
      bumpIt();
    }
  }, 250);
  // FitVids init
  $("#main").fitVids();

  // init sticky sidebar
  $(".sticky").Stickyfill();

  var stickySideBar = function(){
    var show = $(".author__urls-wrapper button").length === 0 ? $(window).width() > 1024 : !$(".author__urls-wrapper button").is(":visible");
    // console.log("has button: " + $(".author__urls-wrapper button").length === 0);
    // console.log("Window Width: " + windowWidth);
    // console.log("show: " + show);
    //old code was if($(window).width() > 1024)
    if (show) {
      // fix
      Stickyfill.rebuild();
      Stickyfill.init();
      $(".author__urls").show();
    } else {
      // unfix
      Stickyfill.stop();
      $(".author__urls").hide();
    }
  };

  stickySideBar();

  $(window).resize(function(){
    var now = { w: window.innerWidth, h: window.innerHeight, dpr: window.devicePixelRatio };
    var dw = Math.abs(now.w - _lastWindowState.w);
    var dh = Math.abs(now.h - _lastWindowState.h);
    var ddpr = Math.abs(now.dpr - _lastWindowState.dpr);
    if (dw < 60 && dh < 40 && ddpr === 0) return;
    _lastWindowState = now;
    stickySideBar();
  });

  // Follow menu drop down

  $(".author__urls-wrapper button").on("click", function() {
    $(".author__urls").fadeToggle("fast", function() {});
    $(".author__urls-wrapper button").toggleClass("open");
  });

  // init smooth scroll
  $("a").smoothScroll({offset: -20});

  // add lightbox class to all image links
  $("a[href$='.jpg'],a[href$='.jpeg'],a[href$='.JPG'],a[href$='.png'],a[href$='.gif']").addClass("image-popup");

  // Magnific-Popup options
  $(".image-popup").magnificPopup({
    // disableOn: function() {
    //   if( $(window).width() < 500 ) {
    //     return false;
    //   }
    //   return true;
    // },
    type: 'image',
    tLoading: 'Loading image #%curr%...',
    gallery: {
      enabled: true,
      navigateByImgClick: true,
      preload: [0,1] // Will preload 0 - before current, and 1 after the current image
    },
    image: {
      tError: '<a href="%url%">Image #%curr%</a> could not be loaded.',
    },
    removalDelay: 500, // Delay in milliseconds before popup is removed
    // Class that is added to body when popup is open.
    // make it unique to apply your CSS animations just to this exact popup
    mainClass: 'mfp-zoom-in',
    callbacks: {
      beforeOpen: function() {
        // just a hack that adds mfp-anim class to markup
        this.st.image.markup = this.st.image.markup.replace('mfp-figure', 'mfp-figure mfp-with-anim');
      }
    },
    closeOnContentClick: true,
    midClick: true // allow opening popup on middle mouse click. Always set it to true if you don't provide alternative source.
  });

});
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
      // If another handler (e.g. jQuery smoothScroll) already handled this, do nothing.
      if (e.defaultPrevented) return;

      // Let the TOC's own smooth scrolling handle TOC clicks to avoid double-scrolling.
      if (this.closest('.toc') || this.closest('.toc__menu')) return;

      const href = this.getAttribute('href');
      const targetElement = document.querySelector(href);

      if (targetElement) {
          e.preventDefault();
          targetElement.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
              inline: 'nearest'
          });
      } else if (this.origin !== window.location.origin || this.pathname !== window.location.pathname) {
          // If the anchor is from another page, navigate to the top of the page first
          e.preventDefault();
          window.location.href = this.href;
      }
  });
});
document.documentElement.style.scrollBehavior = 'smooth';
setTimeout(() => {
  document.documentElement.style.scrollBehavior = 'auto';
}, 1000);