/**
 * Slide data store and DOM builder.
 *
 * Parses #thumbnails, constructs slide objects, assigns data-index. Each slide
 * exposes a single `load()` method — a memoised Promise that resolves only
 * after the full image is both fetched AND decoded. Every consumer (the
 * adjacent-slide prefetcher, the active-slide switcher, the View Transitions
 * wrapper) awaits the same Promise, so there is exactly one owner of the
 * <img>'s onload/onerror and no race conditions between modules.
 */

const _slides = [];

export const getSlides  = () => _slides;
export const getSlide   = i  => _slides[i] ?? null;
export const slideCount = () => _slides.length;

/**
 * Walk #thumbnails children, build a slide object per .thumbnail found,
 * and move non-thumbnail siblings into the slide caption.
 */
export function build(thumbnailsEl) {
  Array.from(thumbnailsEl.children).forEach(parent => {
    const thumb = parent.querySelector(':scope > .thumbnail');
    if (!thumb) return;

    const index = _slides.length;
    thumb.dataset.index = String(index);
    parent.tabIndex = -1;

    const wrap = document.createElement('div');
    wrap.innerHTML = '<div class="slide"><div class="lqip-bg"></div><div class="caption"></div><div class="image"><img alt="" draggable="false"></div></div>';
    const slideEl      = wrap.firstChild;
    const slideImage   = slideEl.querySelector('.image');
    const slideImg     = slideImage.querySelector('img');
    const slideCaption = slideEl.querySelector('.caption');
    const lqipBg       = slideEl.querySelector('.lqip-bg');

    // Apply LQIP backdrop from the thumbnail's data-lqip if present.
    const lqipUri = thumb.dataset.lqip;
    if (lqipBg && lqipUri) {
      lqipBg.style.backgroundImage = `url('${lqipUri}')`;
    }

    // Migrate non-thumbnail children (titles, metadata) into the caption area.
    Array.from(parent.children).forEach(child => {
      if (child !== thumb) slideCaption.appendChild(child);
    });

    // Populate alt text from caption h3 if present.
    const titleEl = slideCaption.querySelector('h3');
    if (titleEl) slideImg.alt = titleEl.textContent.trim();

    const slide = {
      parent,
      thumb,
      slideEl,
      slideImage,
      slideImg,
      slideCaption,
      lqipBg,
      url:    thumb.getAttribute('href'),
      lqip:   lqipUri || null,
      ar:     thumb.dataset.ar || null,
      loaded: false,
      _loadPromise: null,
    };

    /**
     * Memoised loader: fetches + decodes the full image exactly once.
     *
     * Returns the same Promise on every call, so concurrent consumers share
     * one network request and one decode. Resolves only after `decode()`
     * has resolved — meaning the bitmap is ready for synchronous paint, so
     * a View Transitions snapshot taken immediately afterwards will capture
     * real pixels rather than a blank <img>.
     *
     * On error the Promise still resolves (rather than rejecting) so callers
     * never need a try/catch — the slide simply stays `loaded: false` and the
     * normal loading-state UI handles it.
     */
    slide.load = () => {
      if (slide._loadPromise) return slide._loadPromise;
      slide._loadPromise = new Promise(resolve => {
        const img = slide.slideImg;

        const finish = () => {
          slide.loaded = true;
          resolve();
        };

        const onSettle = () => {
          // `decode()` ensures the bitmap is ready; if unsupported or it
          // rejects (e.g. broken image), we still resolve so callers don't
          // hang. The visible failure is handled by the slide's loading UI.
          const p = img.decode ? img.decode() : Promise.resolve();
          p.then(finish, finish);
        };

        if (img.complete && img.naturalWidth > 0) {
          onSettle();
          return;
        }

        img.addEventListener('load',  onSettle, { once: true });
        img.addEventListener('error', resolve,  { once: true });
        if (img.getAttribute('src') !== slide.url) {
          img.src = slide.url;
        }
      });
      return slide._loadPromise;
    };

    _slides.push(slide);
  });
}
