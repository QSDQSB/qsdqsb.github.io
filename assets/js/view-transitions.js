/**
 * View Transitions API Implementation
 * Provides smooth page transitions for Jekyll static site
 * 
 * Browser Support: Chrome 111+, Edge 111+, Safari (experimental)
 * Gracefully degrades for unsupported browsers
 */

(function() {
  'use strict';

  // Debug mode - set to false in production
  const DEBUG = false;

  function log(...args) {
    if (DEBUG) {
      console.log('[View Transitions]', ...args);
    }
  }

  // Check if View Transitions API is supported
  if (!document.startViewTransition) {
    log('View Transitions API not supported in this browser');
    return;
  }

  log('View Transitions API is supported, initializing...');

  /**
   * Check if a link is internal (same origin)
   */
  function isInternalLink(link) {
    try {
      const url = new URL(link.href, window.location.origin);
      return url.origin === window.location.origin;
    } catch (e) {
      // If URL parsing fails, it's likely a relative link
      return true;
    }
  }

  /**
   * Check if we should skip this link
   */
  function shouldSkipLink(link) {
    const href = link.getAttribute('href');
    
    // Skip if no href
    if (!href) {
      return true;
    }

    // Skip gallery thumbnails and any links inside the gallery thumbnails
    // area so existing gallery handlers (gallery.js) can manage clicks.
    if (link.classList.contains('thumbnail') || link.closest && (link.closest('#thumbnails') || link.closest('.gallery_view'))) {
      return true;
    }

    // Skip if link has target="_blank"
    if (link.target === '_blank') {
      return true;
    }

    // Skip if it's just a hash link to same page
    if (href.startsWith('#') || (href.includes('#') && new URL(link.href, window.location.origin).pathname === window.location.pathname)) {
      return true;
    }

    // Skip if link is to a file download
    if (/\.(pdf|zip|doc|docx|xls|xlsx|ppt|pptx|jpg|jpeg|png|gif|svg)$/i.test(href)) {
      // But allow images in gallery context
      if (!link.closest('#thumbnails') && !link.closest('.gallery_view')) {
        return true;
      }
    }

    // Skip external links
    if (!isInternalLink(link)) {
      return true;
    }

    return false;
  }

  /**
   * Intercept navigation clicks and use View Transitions API
   */
  function initViewTransitions() {
    // Use event delegation for better performance and to catch dynamically added links
    document.addEventListener('click', function(e) {
      // Find the closest anchor tag
      const link = e.target.closest('a');
      
      if (!link) {
        return;
      }

      // Check if we should skip this link
      if (shouldSkipLink(link)) {
        return;
      }

      // Get the full URL
      let targetUrl;
      try {
        targetUrl = new URL(link.href, window.location.origin);
      } catch (e) {
        log('Failed to parse URL:', link.href);
        return;
      }

      // Skip if it's a hash link to same page
      if (targetUrl.pathname === window.location.pathname && targetUrl.hash) {
        return;
      }

      // Skip if already handled by other scripts (like smooth-scroll for hash links)
      // Check if it's a hash link that should be handled by smooth-scroll
      if (link.href.includes('#') && link.href.split('#')[0] === window.location.href.split('#')[0]) {
        return;
      }

      // Prevent default navigation but allow other handlers to run
      e.preventDefault();
      e.stopPropagation();

      log('Starting view transition to:', targetUrl.href);

      // Start view transition
      // For multi-page apps, we need to let the browser handle the navigation
      // The View Transitions API will automatically handle the transition
      const transition = document.startViewTransition(() => {
        // Use location.assign for better compatibility
        window.location.assign(targetUrl.href);
      });

      // Optional: Log transition events for debugging
      if (DEBUG) {
        transition.finished.then(() => {
          log('View transition completed');
        }).catch((err) => {
          log('View transition error:', err);
        });
      }
    }, true); // Use capture phase to intercept before other handlers
  }

  /**
   * Handle browser back/forward navigation with transitions
   */
  function initPopStateTransitions() {
    // Note: For multi-page apps, popstate transitions work differently
    // The browser handles the navigation, but we can enhance it
    window.addEventListener('popstate', function(e) {
      log('Popstate event detected');
      // The browser will handle navigation, View Transitions should work automatically
      // if the pages have view-transition-name set
    });
  }

  // Initialize when DOM is ready
  function init() {
    log('Initializing View Transitions...');
    initViewTransitions();
    initPopStateTransitions();
    log('View Transitions initialized');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // DOM already loaded
    init();
  }

})();

