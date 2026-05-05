/**
 * Slide data store and DOM builder.
 * Parses #thumbnails, constructs slide objects, assigns data-index.
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

    _slides.push({
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
    });
  });
}
