/*
	Lens by HTML5 UP
	html5up.net | @ajlkn
	Free for personal and commercial use under the CCA 3.0 license (html5up.net/license)

	Vanilla JS rewrite — no jQuery, no skel.
*/

function goToParentDirectory() {
    const segments = window.location.pathname.split('/').filter(seg => seg !== '');

    if (segments.length > 1) {
      segments.pop();
      const parentUrl = '/' + segments.join('/') + '/';
	  	const title = document.querySelector('#header h1')?.textContent || '';
		if (title) {
			const slugify = str => str.toLowerCase().replace(/[^a-z0-9À-ſ]+/g, '-').replace(/^-+|-+$/g, '');
			const slugifiedTitle = slugify(title);
			window.location.href = parentUrl + '#' + slugifiedTitle;
		} else {
			window.location.href = parentUrl;
		}
    } else {
      window.location.href = '/';
    }
  }

var main = (function() { var _ = {

	/**
	 * Settings.
	 */
	settings: {

		// Preload all images.
			preload: false,

		// Slide duration (must match "duration.slide" in _vars.scss).
			slideDuration: 500,

		// Layout duration (must match "duration.layout" in _vars.scss).
			layoutDuration: 750,
			captionDuration: 2000,

		// Thumbnails per "row" (must match "misc.thumbnails-per-row" in _vars.scss).
			thumbnailsPerRow: 2,

		// Side of main wrapper (must match "misc.main-side" in _vars.scss).
			mainSide: 'right'

	},

	/**
	 * Breakpoints — mirrors the previous skel config.
	 * Each value is a MediaQueryList that we can read `.matches` from.
	 */
	breakpoints: {},

	/** Window-level refs (kept for symmetry with previous code). */
	body: null,
	thumbnails: null,
	viewer: null,
	main: null,
	toggleEls: null,        // NodeList — there are two `.toggle` elements (viewer + main)
	imageDisplay: null,
	leaveGalleryEls: null,  // NodeList — there are two `.leave_gallery` elements (viewer + main)
	navNext: null,
	navPrevious: null,

	/** Slides. */
	slides: [],

	/** Current slide index. */
	current: null,

	/** Lock state. */
	locked: false,

	/** Background size for slides ('cover' or 'contain'). */
	background_size: 'cover',

	/** Helper: is a breakpoint active. */
	bp: function(name) {
		var mql = _.breakpoints[name];
		return !!(mql && mql.matches);
	},

	/** Aliased so the keyboard map can call it via `_.goToParentDirectory()`. */
	goToParentDirectory: function() { goToParentDirectory(); },

	/**
	 * Keyboard shortcuts.
	 */
	keys: {
		// Backspace: Leave gallery.
			8: function() {
				_.goToParentDirectory();
			},
		// Shift: toggle image display.
			16: function() {
				_.change_image_display();
			},

		// Escape: Toggle main wrapper.
			27: function() {
				_.toggle();
			},

		// Up: Move up.
			38: function() {
				_.up();
			},

		// Down: Move down.
			40: function() {
				_.down();
			},

		// Space: Next.
			32: function() {
				_.next();
			},

		// Right Arrow: Next.
			39: function() {
				_.next();
			},

		// Left Arrow: Previous.
			37: function() {
				_.previous();
			}

	},

	/**
	 * Initialize properties (DOM refs and viewer markup).
	 */
	initProperties: function() {

		// Body, thumbnails.
			_.body = document.body;
			_.thumbnails = document.getElementById('thumbnails');

		// Viewer.
			var viewerHTML =
				'<div id="viewer">' +
					'<div class="inner">' +
						'<div class="nav-next" title="Next Image\n→ Right OR ⎵ Space "></div>' +
						'<div class="nav-previous" title="Previous Image\n← Left"></div>' +
						'<div class="toggle" title="Toggle Gallery Bar\n⎋ Esc"></div>' +
						'<div class="toggle-image-display" title="Toggle Image Display\n⇧ Shift"></div>' +
						'<div class="leave_gallery" title="Leave Gallery\n ⌫ Backspace"></div>' +
					'</div>' +
				'</div>';
			_.body.insertAdjacentHTML('beforeend', viewerHTML);
			_.viewer = document.getElementById('viewer');

		// Nav.
			_.navNext = _.viewer.querySelector('.nav-next');
			_.navPrevious = _.viewer.querySelector('.nav-previous');
			_.imageDisplay = _.viewer.querySelector('.toggle-image-display');

		// Background size — read from cookie or default to 'cover'.
			var savedDisplay = getCookie('gallery_image_display');
			if (savedDisplay === 'cover' || savedDisplay === 'contain') {
				_.background_size = savedDisplay;
			} else {
				_.background_size = 'cover';
				setCookie('gallery_image_display', 'cover', 365);
			}

		// Main wrapper.
			_.main = document.getElementById('gallery_main');

		// Leave_gallery (inside #gallery_main).
			_.main.insertAdjacentHTML('beforeend', '<div class="leave_gallery"></div>');
			// Match the original `$('.leave_gallery')` which selected BOTH the viewer's and main's element.
			_.leaveGalleryEls = document.querySelectorAll('.leave_gallery');

		// Toggle (inside #gallery_main).
			_.main.insertAdjacentHTML('beforeend', '<div class="toggle"></div>');
			// Match the original `$('.toggle')` which selected BOTH the viewer's and main's element.
			_.toggleEls = document.querySelectorAll('.toggle');

	},

	/**
	 * Initialize events.
	 */
	initEvents: function() {

		// Window — remove is-loading-* classes on load.
			window.addEventListener('load', function() {
				_.body.classList.remove('is-loading-0');

				window.setTimeout(function() {
					_.body.classList.remove('is-loading-1');
				}, 100);

				window.setTimeout(function() {
					_.body.classList.remove('is-loading-2');
				}, 100 + Math.max(_.settings.layoutDuration - 150, 0));
			});

		// Window — disable animations/transitions on resize.
			var resizeTimeout;
			window.addEventListener('resize', function() {
				_.body.classList.add('is-loading-0');
				window.clearTimeout(resizeTimeout);
				resizeTimeout = window.setTimeout(function() {
					_.body.classList.remove('is-loading-0');
				}, 100);
			});

		// Viewer — hide main wrapper on tap (<= medium only).
			_.viewer.addEventListener('touchend', function() {
				if (_.bp('medium'))
					_.hide();
			});

		// Viewer — touch gestures.
			_.viewer.addEventListener('touchstart', function(event) {
				_.viewer.touchPosX = event.touches[0].pageX;
				_.viewer.touchPosY = event.touches[0].pageY;
			}, { passive: true });

			_.viewer.addEventListener('touchmove', function(event) {
				if (_.viewer.touchPosX === null || _.viewer.touchPosY === null)
					return;

				var diffX = _.viewer.touchPosX - event.touches[0].pageX,
					diffY = _.viewer.touchPosY - event.touches[0].pageY,
					boundary = 20,
					delta = 50;

				// Swipe left (next).
					if ((diffY < boundary && diffY > (-1 * boundary)) && (diffX > delta))
						_.next();
				// Swipe right (previous).
					else if ((diffY < boundary && diffY > (-1 * boundary)) && (diffX < (-1 * delta)))
						_.previous();

				// Overscroll fix.
					var th = _.viewer.offsetHeight,
						ts = (_.viewer.scrollHeight - _.viewer.scrollTop);

					if ((_.viewer.scrollTop <= 0 && diffY < 0)
					|| (ts > (th - 2) && ts < (th + 2) && diffY > 0)) {
						event.preventDefault();
						event.stopPropagation();
					}
			}, { passive: false });

		// Main — touch gestures.
			_.main.addEventListener('touchstart', function(event) {
				if (_.bp('xsmall')) return;
				_.main.touchPosX = event.touches[0].pageX;
				_.main.touchPosY = event.touches[0].pageY;
			}, { passive: true });

			_.main.addEventListener('touchmove', function(event) {
				if (_.bp('xsmall')) return;

				if (_.main.touchPosX === null || _.main.touchPosY === null)
					return;

				var diffX = _.main.touchPosX - event.touches[0].pageX,
					diffY = _.main.touchPosY - event.touches[0].pageY,
					boundary = 20,
					delta = 50,
					result = false;

				// Swipe to close.
					switch (_.settings.mainSide) {
						case 'left':
							result = (diffY < boundary && diffY > (-1 * boundary)) && (diffX > delta);
							break;
						case 'right':
							result = (diffY < boundary && diffY > (-1 * boundary)) && (diffX < (-1 * delta));
							break;
						default:
							break;
					}

					if (result)
						_.hide();

				// Overscroll fix.
					var th = _.main.offsetHeight,
						ts = (_.main.scrollHeight - _.main.scrollTop);

					if ((_.main.scrollTop <= 0 && diffY < 0)
					|| (ts > (th - 2) && ts < (th + 2) && diffY > 0)) {
						event.preventDefault();
						event.stopPropagation();
					}
			}, { passive: false });

		// Leave gallery — bind to all matches (viewer + main).
			_.leaveGalleryEls.forEach(function(el) {
				el.addEventListener('click', function() {
					goToParentDirectory();
				});
			});

		// Toggle — bind to all matches (viewer + main).
			_.toggleEls.forEach(function(el) {
				el.addEventListener('click', function() { _.toggle(); });
				// Prevent event from bubbling up to "hide on tap" event.
				el.addEventListener('touchend', function(event) {
					event.stopPropagation();
				});
			});

		// Nav.
			_.navNext.addEventListener('click', function() { _.next(); });
			_.navPrevious.addEventListener('click', function() { _.previous(); });

		// toggle-image-display.
			_.imageDisplay.addEventListener('click', function() { _.change_image_display(); });

		// Keyboard shortcuts — ignore inside form elements.
			_.body.addEventListener('keydown', function(event) {
				if (event.target.matches('input, select, textarea')) {
					event.stopPropagation();
				}
			}, true); // capture so we run before the window-level handler

			window.addEventListener('keydown', function(event) {
				if (_.bp('xsmall')) return;

				if (event.keyCode in _.keys) {
					event.stopPropagation();
					event.preventDefault();
					(_.keys[event.keyCode])();
				}
			});

	},

	/**
	 * Initialize viewer (build slides from thumbnails, wire click).
	 */
	initViewer: function() {

		// Bind thumbnail click event (delegated).
			_.thumbnails.addEventListener('click', function(event) {
				var thumb = event.target.closest('.thumbnail');
				if (!thumb || !_.thumbnails.contains(thumb)) return;

				event.preventDefault();
				event.stopPropagation();

				if (_.locked)
					thumb.blur();

				var index = parseInt(thumb.dataset.index, 10);
				if (!isNaN(index))
					_.switchTo(index);
			});

		// Create slides from thumbnails (each direct child of #thumbnails).
			var children = Array.prototype.slice.call(_.thumbnails.children);
			children.forEach(function(parent) {
				var thumbnail = parent.querySelector(':scope > .thumbnail');
				if (!thumbnail) return;

				// Slide object.
					var s = {
						parent: parent,
						slide: null,
						slideImage: null,
						slideCaption: null,
						url: thumbnail.getAttribute('href'),
						loaded: false
					};

				// Parent.
					parent.setAttribute('tabIndex', '-1');

				// Build slide DOM.
					var slideHTML = '<div class="slide"><div class="caption"></div><div class="image"></div></div>';
					var tmp = document.createElement('div');
					tmp.innerHTML = slideHTML;
					s.slide = tmp.firstChild;

					s.slideImage = s.slide.querySelector('.image');
					s.slideImage.style.backgroundImage = '';
					s.slideImage.style.backgroundPosition = (thumbnail.dataset.position || 'center');

					s.slideCaption = s.slide.querySelector('.caption');

				// Move everything except the thumbnail itself into the caption.
					Array.prototype.slice.call(parent.children).forEach(function(child) {
						if (child !== thumbnail) {
							s.slideCaption.appendChild(child);
						}
					});

				// Preload?
					if (_.settings.preload) {
						var img = new Image();
						img.src = s.url;
						s.slideImage.style.backgroundImage = 'url(' + s.url + ')';
						s.slide.classList.add('loaded');
						s.loaded = true;
					}

				// Add to slides array.
					_.slides.push(s);

				// Set thumbnail's index.
					thumbnail.dataset.index = String(_.slides.length - 1);
			});

	},

	/**
	 * Initialize stuff.
	 */
	init: function() {

		// Breakpoints (mirror the previous skel config).
			_.breakpoints = {
				xlarge:  window.matchMedia('(max-width: 1680px)'),
				large:   window.matchMedia('(max-width: 1280px)'),
				medium:  window.matchMedia('(max-width: 980px)'),
				small:   window.matchMedia('(max-width: 736px)'),
				xsmall:  window.matchMedia('(max-width: 480px)')
			};

		// Everything else.
			_.initProperties();
			_.initViewer();
			_.initEvents();

		// Initial slide — mirror skel.on('-xsmall !xsmall', ...): fire when xsmall is NOT active
		// (either initial state or when transitioning out of xsmall), but only set the first slide once.
			window.setTimeout(function() {
				var xsmallMQL = _.breakpoints.xsmall;

				var maybeSwitch = function() {
					if (!xsmallMQL.matches) {
						if (_.current === null)
							_.switchTo(0, true);
					}
				};

				if (typeof xsmallMQL.addEventListener === 'function') {
					xsmallMQL.addEventListener('change', maybeSwitch);
				} else if (typeof xsmallMQL.addListener === 'function') {
					// Safari < 14 fallback
					xsmallMQL.addListener(maybeSwitch);
				}
				maybeSwitch();
			}, 0);

		// Thumbnail lazy loading (already vanilla in the previous version).
			(function() {
				var placeholders = document.querySelectorAll('.thumbnail-placeholder');
				if (!placeholders.length || typeof IntersectionObserver === 'undefined') return;

				var observer = new IntersectionObserver(function(entries) {
					entries.forEach(function(entry) {
						if (entry.isIntersecting) {
							var placeholder = entry.target;
							var img = new Image();
							img.src = placeholder.dataset.thumbnail || placeholder.dataset.src;
							img.alt = placeholder.parentElement.getAttribute('href').split('/').pop();

							placeholder.classList.add('loading');

							img.onload = function() {
								placeholder.appendChild(img);
								placeholder.classList.remove('loading');
								placeholder.classList.add('loaded');
								img.classList.add('loaded');
							};

							observer.unobserve(placeholder);
						}
					});
				}, {
					rootMargin: '50px 0px',
					threshold: 0.01
				});

				placeholders.forEach(function(placeholder) {
					observer.observe(placeholder);
				});
			})();

	},

	/**
	 * Switch to a specific slide.
	 */
	switchTo: function(index, noHide) {

		// Already at index and xsmall isn't active? Bail.
			if (_.current == index && !_.bp('xsmall'))
				return;

		// Locked? Bail.
			if (_.locked)
				return;

		// Lock.
			_.locked = true;

		// Hide main wrapper if medium is active.
			if (!noHide && _.bp('medium'))
				_.hide();

		// Get slides.
			var oldSlide = (_.current !== null ? _.slides[_.current] : null),
				newSlide = _.slides[index];

		// Update current.
			_.current = index;

		// Deactivate old slide.
			if (oldSlide) {
				oldSlide.parent.classList.remove('active');
				oldSlide.slide.classList.remove('active');
			}

		// Activate new slide.
			newSlide.parent.classList.add('active');
			newSlide.parent.focus();

			var f = function() {

				// Old slide exists? Detach (remove from DOM, keep object).
					if (oldSlide && oldSlide.slide.parentNode)
						oldSlide.slide.parentNode.removeChild(oldSlide.slide);

				// Attach new slide.
					_.viewer.appendChild(newSlide.slide);

				// New slide not yet loaded?
					if (!newSlide.loaded) {

						window.setTimeout(function() {

							newSlide.slide.classList.add('loading');

							var img = new Image();
							img.onload = function() {
								newSlide.slideImage.style.backgroundImage = 'url(' + newSlide.url + ')';
								newSlide.slideImage.style.backgroundSize = _.background_size;

								newSlide.loaded = true;
								newSlide.slide.classList.remove('loading');
								newSlide.slide.classList.add('active');

								window.setTimeout(function() { _.locked = false; }, 100);

								var imageTitle = newSlide.slideCaption.querySelector('.image_title');
								if (imageTitle) {
									imageTitle.classList.add('hovered');
									window.setTimeout(function() {
										imageTitle.classList.remove('hovered');
									}, _.settings.captionDuration);
								}
							};
							img.src = newSlide.url;

						}, 100);

					}
					else {

						window.setTimeout(function() {
							newSlide.slide.classList.add('active');
							newSlide.slideImage.style.backgroundSize = _.background_size;

							window.setTimeout(function() { _.locked = false; }, 100);

							var imageTitle = newSlide.slideCaption.querySelector('.image_title');
							if (imageTitle) {
								imageTitle.classList.add('hovered');
								window.setTimeout(function() {
									imageTitle.classList.remove('hovered');
								}, _.settings.captionDuration);
							}
						}, 100);

					}
			};

			// No old slide? Switch immediately.
				if (!oldSlide)
					f();
			// Otherwise, wait for old slide to disappear first.
				else
					window.setTimeout(f, _.settings.slideDuration);
	},

	/** Switch to the next slide. */
	next: function() {
		var i, c = _.current, l = _.slides.length;
		if (c >= l - 1) i = 0;
		else i = c + 1;
		_.switchTo(i);
	},

	/** Switch to the previous slide. */
	previous: function() {
		var i, c = _.current, l = _.slides.length;
		if (c <= 0) i = l - 1;
		else i = c - 1;
		_.switchTo(i);
	},

	/** Toggle cover/contain background-size, with translateY transition. */
	change_image_display: function() {
		var YTranslate;
		if (_.background_size === 'cover') {
			_.background_size = 'contain';
			YTranslate = '-100%';
		}
		else {
			_.background_size = 'cover';
			YTranslate = '100%';
		}
		setCookie('gallery_image_display', _.background_size, 365);

		var image = _.viewer.querySelector('.image');
		if (!image) return;

		var transitionDuration = parseFloat(getComputedStyle(image).transitionDuration) * 1000;
		image.style.transform = 'translateY(' + YTranslate + ')';
		setTimeout(function() {
			image.style.backgroundSize = _.background_size;
			image.style.transform = 'translateY(0)';
		}, transitionDuration - 100);
	},

	/** Move "up" by one row of thumbnails. */
	up: function() {
		if (_.body.classList.contains('fullscreen')) return;
		var i, c = _.current, l = _.slides.length, tpr = _.settings.thumbnailsPerRow;
		if (c <= (tpr - 1)) i = l - (tpr - 1 - c) - 1;
		else i = c - tpr;
		_.switchTo(i);
	},

	/** Move "down" by one row of thumbnails. */
	down: function() {
		if (_.body.classList.contains('fullscreen')) return;
		var i, c = _.current, l = _.slides.length, tpr = _.settings.thumbnailsPerRow;
		if (c >= l - tpr) i = c - l + tpr;
		else i = c + tpr;
		_.switchTo(i);
	},

	/** Show the main wrapper (exit fullscreen). */
	show: function() {
		if (!_.body.classList.contains('fullscreen')) return;
		_.body.classList.remove('fullscreen');
		_.main.focus();
	},

	/** Hide the main wrapper (enter fullscreen). */
	hide: function() {
		if (_.body.classList.contains('fullscreen')) return;
		_.body.classList.add('fullscreen');
		_.main.blur();
	},

	/** Toggle the main wrapper. */
	toggle: function() {
		var rotate;
		if (_.body.classList.contains('fullscreen')) {
			_.show();
			rotate = 'rotate(0deg)';
		} else {
			_.hide();
			rotate = 'rotate(180deg)';
		}
		_.toggleEls.forEach(function(el) { el.style.transform = rotate; });
	}

}; return _; })(); main.init();
