/**
 * TOC Scroll Spy and Reading Progress Indicator
 * 
 * Features:
 * 1. Auto-highlights current section in TOC based on viewport
 * 2. Shows reading progress with a thin progress line
 */

(function() {
  'use strict';

  // Check if TOC exists on page
  const tocMenu = document.querySelector('.toc__menu');
  const sidebarRight = document.querySelector('.sidebar__right');
  
  if (!tocMenu || !sidebarRight) {
    return; // No TOC, exit early
  }

  // Get all TOC links
  const tocLinks = tocMenu.querySelectorAll('a[href^="#"]');
  
  if (tocLinks.length === 0) {
    return; // No TOC links, exit early
  }

  // Get all headings that have IDs (targets of TOC links)
  const headings = Array.from(tocLinks).map(link => {
    const href = link.getAttribute('href');
    if (!href || !href.startsWith('#')) return null;
    
    const id = href.substring(1);
    const heading = document.getElementById(id);
    return heading ? { id, heading, link } : null;
  }).filter(Boolean);

  if (headings.length === 0) {
    return; // No valid headings found
  }

  // Create progress indicator element - place it inside the TOC
  const toc = sidebarRight.querySelector('.toc');
  const progressIndicator = document.createElement('div');
  progressIndicator.className = 'toc-progress-indicator';
  
  // Insert at the beginning of TOC for proper positioning
  if (toc) {
    toc.insertBefore(progressIndicator, toc.firstChild);
  } else {
    sidebarRight.appendChild(progressIndicator);
  }

  // State
  let activeHeading = null;
  let scrollRaf = null;

  function scrollTocMenuToLink(link) {
    if (!link) return;
    if (tocMenu.scrollHeight <= tocMenu.clientHeight) return;

    const tocRect = tocMenu.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();

    // link position within scroll container
    const linkTopInToc = (linkRect.top - tocRect.top) + tocMenu.scrollTop;
    const linkCenterInToc = linkTopInToc + link.offsetHeight / 2;
    const targetScrollTop = Math.max(
      0,
      Math.min(
        tocMenu.scrollHeight - tocMenu.clientHeight,
        linkCenterInToc - tocMenu.clientHeight / 2
      )
    );

    const currentScrollTop = tocMenu.scrollTop;
    const delta = Math.abs(currentScrollTop - targetScrollTop);
    if (delta < 4) return;

    tocMenu.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
  }

  /**
   * Throttled scroll handler (reliable in both scroll directions)
   */
  function handleScroll() {
    if (scrollRaf) cancelAnimationFrame(scrollRaf);
    scrollRaf = requestAnimationFrame(() => {
      updateActiveTOC();
      updateProgress();
    });
  }

  /**
   * Update active TOC link based on current viewport position
   */
  function updateActiveTOC() {
    // Get viewport center point (or slightly above center for better UX)
    const viewportCenter = window.innerHeight * 0.3; // 30% from top
    const scrollPosition = window.scrollY + viewportCenter;

    // Find the heading that's currently in view
    let currentHeading = null;
    
    // Check headings from bottom to top to find the last one that's above viewport center
    for (let i = headings.length - 1; i >= 0; i--) {
      const { heading } = headings[i];
      const rect = heading.getBoundingClientRect();
      const headingTop = rect.top + window.scrollY;
      
      if (headingTop <= scrollPosition) {
        currentHeading = headings[i];
        break;
      }
    }

    // If no heading found, use the first one if we're at the top
    if (!currentHeading && window.scrollY < 100) {
      currentHeading = headings[0];
    }

    // Update active state
    if (currentHeading && currentHeading !== activeHeading) {
      // Remove active class from all links
      tocLinks.forEach(link => {
        link.classList.remove('toc-active');
        link.parentElement?.classList.remove('toc-active');
      });

      // Add active class to current link
      if (currentHeading.link) {
        currentHeading.link.classList.add('toc-active');
        currentHeading.link.parentElement?.classList.add('toc-active');

        // Scroll the TOC container (not the page) if needed
        scrollTocMenuToLink(currentHeading.link);
      }

      activeHeading = currentHeading;
    }
  }

  /**
   * Update reading progress indicator
   */
  function updateProgress() {
    // Prefer the actual content container for a stable start/end
    const pageContent = document.querySelector('.page__content');
    const contentTop = pageContent ? (pageContent.getBoundingClientRect().top + window.scrollY) : 0;
    const contentBottom = pageContent
      ? (pageContent.getBoundingClientRect().bottom + window.scrollY)
      : document.documentElement.scrollHeight;

    // Use first heading as the "start" anchor when possible
    const firstHeadingTop = headings[0]?.heading?.getBoundingClientRect().top + window.scrollY;
    const articleStart = Number.isFinite(firstHeadingTop) ? firstHeadingTop : contentTop;
    const articleEnd = contentBottom;
    const articleHeight = articleEnd - articleStart;
    
    if (articleHeight <= 0) {
      progressIndicator.style.height = '0%';
      return;
    }

    const scrollProgress = window.scrollY - articleStart;
    const progress = Math.max(0, Math.min(100, (scrollProgress / articleHeight) * 100));
    
    progressIndicator.style.height = progress + '%';
  }

  /**
   * Initialize Intersection Observer for more accurate detection
   */
  function initIntersectionObserver() {
    // Options for intersection observer
    const options = {
      root: null, // viewport
      rootMargin: '-20% 0px -70% 0px', // Trigger when heading is in upper 30% of viewport
      threshold: [0, 0.1, 0.5, 1]
    };

    const observer = new IntersectionObserver(() => {
      // Use the scroll-position based computation to decide the active item.
      // This avoids edge cases where observer entries don't include the
      // currently-visible heading (common when scrolling upward).
      handleScroll();
    }, options);

    // Observe all headings
    headings.forEach(({ heading }) => {
      observer.observe(heading);
    });
  }

  /**
   * Initialize
   */
  function init() {
    // Use Intersection Observer for better accuracy
    if ('IntersectionObserver' in window) {
      initIntersectionObserver();
    }

    // Always update both active TOC + progress on scroll (works in both directions)
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Initial update
    handleScroll();
    
    // Update on resize
    window.addEventListener('resize', () => {
      handleScroll();
    }, { passive: true });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

