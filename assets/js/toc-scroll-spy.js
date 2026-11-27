/**
 * TOC Scroll Spy, and the fold of the contents above the text
 *
 * 1. Marks the section being read in the contents list.
 * 2. Below a wide window the list folds to its title row, which a press opens and closes. Whether it
 *    folds is the stylesheet's to say: it shows the row's count only there (_navigation.scss).
 */

(function() {
  "use strict";

  // Check if TOC exists on page
  const tocMenu = document.querySelector(".toc__menu");
  const sidebarRight = document.querySelector(".sidebar__right");

  if (!tocMenu || !sidebarRight) {
    return; // No TOC, exit early
  }

  // The fold. The stylesheet keeps the list folded from the first frame (html.js); the title row is a
  // button while the list can fold, and opens it under itself.
  const toc = tocMenu.closest(".toc");
  const toggle = toc && toc.querySelector(".toc__toggle");
  const count = toc && toc.querySelector(".toc__count");
  if (toggle && count) {
    const parts = tocMenu.querySelectorAll("li").length;
    count.textContent = parts + (parts === 1 ? " part" : " parts");
    const syncFold = () => {
      const foldable = getComputedStyle(count).display !== "none";
      toggle.disabled = !foldable;
      toggle.setAttribute("aria-expanded", String(!foldable || toc.classList.contains("toc--open")));
    };
    toggle.addEventListener("click", () => {
      toc.classList.toggle("toc--open");
      syncFold();
    });
    window.addEventListener("resize", syncFold, { passive: true });
    syncFold();
  }

  // Get all TOC links
  const allTocLinks = Array.from(tocMenu.querySelectorAll("a[href^=\"#\"]"));
  if (allTocLinks.length === 0) {
    return; // No TOC links, exit early
  }

  function decodeHashId(rawId) {
    try {
      return decodeURIComponent(rawId);
    } catch (error) {
      return rawId;
    }
  }

  function getHeadingFromLink(link) {
    const href = link.getAttribute("href");
    if (!href || !href.startsWith("#") || href.length <= 1) return null;

    const rawId = href.substring(1);
    const decodedId = decodeHashId(rawId);
    return document.getElementById(decodedId) || document.getElementById(rawId);
  }

  // Collect all headings once for observers.
  const observerHeadings = Array.from(
    new Set(
      allTocLinks
        .map(getHeadingFromLink)
        .filter(Boolean)
    )
  );

  if (observerHeadings.length === 0) {
    return; // No valid headings found
  }

  // State
  let activeHeadingId = null;
  let scrollRaf = null;

  function isHiddenForToc(element) {
    if (!element) return true;
    if (element.hidden) return true;
    if (element.getAttribute("aria-hidden") === "true") return true;
    return !!element.closest("[hidden], [aria-hidden=\"true\"]");
  }

  function getVisibleHeadings() {
    return allTocLinks
      .filter(link => !isHiddenForToc(link) && !isHiddenForToc(link.parentElement))
      .map(link => {
        const heading = getHeadingFromLink(link);
        if (!heading) return null;
        return {
          id: heading.id,
          heading: heading,
          link: link
        };
      })
      .filter(Boolean);
  }

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

    tocMenu.scrollTo({ top: targetScrollTop, behavior: window.QSD.motionOff() ? 'auto' : 'smooth' });
  }

  /**
   * Throttled scroll handler (reliable in both scroll directions)
   */
  function handleScroll() {
    if (scrollRaf) cancelAnimationFrame(scrollRaf);
    scrollRaf = requestAnimationFrame(() => {
      updateActiveTOC();
      scrollRaf = null;
    });
  }

  /**
   * Update active TOC link based on current viewport position
   */
  function updateActiveTOC() {
    const headings = getVisibleHeadings();
    if (headings.length === 0) {
      allTocLinks.forEach(link => {
        link.classList.remove("toc-active");
        if (link.parentElement) link.parentElement.classList.remove("toc-active");
      });
      activeHeadingId = null;
      return;
    }

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

    if (!currentHeading) return;

    // Update active state
    if (currentHeading.id !== activeHeadingId) {
      // Remove active class from all links
      allTocLinks.forEach(link => {
        link.classList.remove("toc-active");
        if (link.parentElement) link.parentElement.classList.remove("toc-active");
      });

      // Add active class to current link
      if (currentHeading.link) {
        currentHeading.link.classList.add("toc-active");
        if (currentHeading.link.parentElement) {
          currentHeading.link.parentElement.classList.add("toc-active");
        }

        // Scroll the TOC container (not the page) if needed
        scrollTocMenuToLink(currentHeading.link);
      }

      activeHeadingId = currentHeading.id;
    }
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
    observerHeadings.forEach(heading => {
      observer.observe(heading);
    });
  }

  /**
   * Initialize
   */
  function init() {
    // Use Intersection Observer for better accuracy
    if ("IntersectionObserver" in window) {
      initIntersectionObserver();
    }

    // Update the active entry on scroll (works in both directions)
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Initial update
    handleScroll();

    // Update on resize
    window.addEventListener("resize", () => {
      handleScroll();
    }, { passive: true });

    // Re-sync after bilingual visibility updates.
    window.addEventListener("qsd:bilingual-change", () => {
      handleScroll();
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
