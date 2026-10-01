document.addEventListener("DOMContentLoaded", function () {
  const masthead = document.querySelector(".masthead");
  if (!masthead) return;

  // The section this page belongs to (masthead.html is cached, so it is marked here, not in
  // Liquid): the link whose data-section holds the longest path this page's path starts with.
  (function markCurrentSection() {
    const here = window.location.pathname;
    let best = null;
    let bestLength = 0;
    masthead.querySelectorAll(".visible-links a[data-section]").forEach(function (link) {
      link.dataset.section.split(/\s+/).forEach(function (path) {
        if (path.length > 1 && here.indexOf(path) === 0 && path.length > bestLength) {
          best = link;
          bestLength = path.length;
        }
      });
    });
    if (best) best.setAttribute("aria-current", "page");
  })();

  const nav = masthead.querySelector(".greedy-nav");
  const navToggle = masthead.querySelector(".greedy-nav__toggle");
  const hiddenLinks = masthead.querySelector(".hidden-links");
  // Also true for automated renderers (the kill-switch), so a crawler screenshot
  // gets the static masthead rather than a mid-scroll hide. See window.QSD.motionOff.
  const prefersReducedMotion = window.QSD.motionOff();
  const SCROLL_INTENT_TRIGGER = 22;
  const MIN_SCROLL_DELTA = 0.1;
  const SCROLL_ACTIVITY_WINDOW_MS = 260;
  const COLLAPSED_AUTO_FADE_MS = 3000;
  const NEAR_TOP_Y = 16;
  const TOP_INTENT_ZONE = 120;
  const IDLE_COLLAPSE_MS = 2600;
  const MOUSEMOVE_THROTTLE_MS = 180;
  const TAP_SLOP = 10;
  let lastScrollY = window.scrollY;
  let directionalScrollIntent = 0;
  let scrollActivityUntil = 0;
  let hideTimer = null;
  let autoFadeTimer = null;
  let pendingViewportPhase = null;
  let lastTopIntentAt = 0;
  let navState = "collapsed";
  let navLocked = false;

  const clearHideTimer = function () {
    if (hideTimer) {
      window.clearTimeout(hideTimer);
      hideTimer = null;
    }
  };

  const clearAutoFadeTimer = function () {
    if (autoFadeTimer) {
      window.clearTimeout(autoFadeTimer);
      autoFadeTimer = null;
    }
  };

  const canAutoFadeCollapsed = function () {
    return (
      !prefersReducedMotion &&
      !navLocked &&
      navState === "collapsed" &&
      !isOverflowMenuOpen() &&
      !isSearchOpen()
    );
  };

  const scheduleAutoFadeIfEligible = function () {
    clearAutoFadeTimer();

    if (!canAutoFadeCollapsed()) {
      masthead.classList.remove("is-nav-faded");
      return;
    }

    autoFadeTimer = window.setTimeout(function () {
      if (canAutoFadeCollapsed()) {
        masthead.classList.add("is-nav-faded");
      }
    }, COLLAPSED_AUTO_FADE_MS);
  };

  const revealAutoFadedNav = function () {
    clearAutoFadeTimer();
    masthead.classList.remove("is-nav-faded");
  };

  const scheduleIdleCollapse = function () {
    clearHideTimer();
    if (prefersReducedMotion || navLocked || navState !== "expanded") return;

    hideTimer = window.setTimeout(function () {
      const active = document.activeElement;
      const interacting = masthead.matches(":hover") || (active && masthead.contains(active));
      const overflowMenuOpen = isOverflowMenuOpen();

      if (!interacting && !overflowMenuOpen && !isSearchOpen()) {
        setNavState("collapsed", "idle-timeout");
      } else {
        scheduleIdleCollapse();
      }
    }, IDLE_COLLAPSE_MS);
  };

  const markActiveScroll = function () {
    scrollActivityUntil = Date.now() + SCROLL_ACTIVITY_WINDOW_MS;
  };

  const isActivelyScrolling = function () {
    return Date.now() < scrollActivityUntil;
  };

  // While search is open its input holds focus outside the masthead, and the
  // masthead's search toggle is the visible way to close it: hold the bar still.
  const isSearchOpen = function () {
    return !!document.querySelector(".search-content.is--visible");
  };

  const isOverflowMenuOpen = function () {
    return !!(
      nav &&
      hiddenLinks &&
      nav.classList.contains("greedy-nav--menu-open") &&
      !hiddenLinks.classList.contains("hidden")
    );
  };

  const setNavState = function (nextState, reason) {
    if (prefersReducedMotion) return;
    if (navLocked) return;
    if (nextState !== "expanded" && nextState !== "collapsed") return;
    if (nextState === "collapsed" && isOverflowMenuOpen()) {
      clearHideTimer();
      return;
    }

    const stateAlreadyApplied = navState === nextState && !masthead.classList.contains("is-hidden");
    if (stateAlreadyApplied) {
      if (nextState === "expanded") {
        revealAutoFadedNav();
        scheduleIdleCollapse();
      } else {
        scheduleAutoFadeIfEligible();
      }
      return;
    }

    navState = nextState;
    masthead.classList.remove("is-nav-faded");
    masthead.classList.remove("is-hidden", "is-nav-expanded", "is-nav-collapsed");
    masthead.classList.add(nextState === "expanded" ? "is-nav-expanded" : "is-nav-collapsed");

    if (nextState === "expanded") {
      clearAutoFadeTimer();
      scheduleIdleCollapse();
    } else {
      clearHideTimer();
      scheduleAutoFadeIfEligible();
    }
  };

  const syncScrollState = function () {
    const currentY = window.scrollY;
    const delta = currentY - lastScrollY;
    masthead.classList.toggle("is-scrolled", currentY > 12);

    if (prefersReducedMotion || navLocked) {
      lastScrollY = currentY;
      return;
    }

    if (isOverflowMenuOpen() || isSearchOpen()) {
      directionalScrollIntent = 0;
      lastScrollY = currentY;
      return;
    }

    if (currentY <= NEAR_TOP_Y) {
      directionalScrollIntent = 0;
      setNavState("expanded", "near-top");
      lastScrollY = currentY;
      return;
    }

    if (Math.abs(delta) < MIN_SCROLL_DELTA) {
      lastScrollY = currentY;
      return;
    }

    revealAutoFadedNav();
    markActiveScroll();

    if (delta > 0) {
      directionalScrollIntent = directionalScrollIntent > 0
        ? directionalScrollIntent + delta
        : delta;

      if (directionalScrollIntent >= SCROLL_INTENT_TRIGGER) {
        setNavState("collapsed", "scroll-down");
        directionalScrollIntent = SCROLL_INTENT_TRIGGER;
      }
    } else {
      directionalScrollIntent = directionalScrollIntent < 0
        ? directionalScrollIntent + delta
        : delta;

      if (Math.abs(directionalScrollIntent) >= SCROLL_INTENT_TRIGGER) {
        setNavState("expanded", "scroll-up");
        directionalScrollIntent = -SCROLL_INTENT_TRIGGER;
      }
    }

    lastScrollY = currentY;
  };

  const onIntentExpand = function (reason) {
    if (navLocked) return;
    if (prefersReducedMotion) return;
    if (
      reason === "top-edge" &&
      isActivelyScrolling() &&
      directionalScrollIntent > 0 &&
      window.scrollY > NEAR_TOP_Y
    ) {
      return;
    }
    revealAutoFadedNav();
    setNavState("expanded", reason || "intent");
  };

  const syncGreedyToggle = function () {
    if (!navToggle || !hiddenLinks || !nav) return;

    const hasOverflowLinks = nav.classList.contains("greedy-nav--has-overflow") || hiddenLinks.children.length > 0;

    navToggle.classList.toggle("greedy-nav__toggle--inactive", !hasOverflowLinks);

    if (!hasOverflowLinks) {
      navToggle.classList.add("hidden");
      navToggle.classList.remove("close");
      hiddenLinks.classList.add("hidden");
      nav.classList.remove("greedy-nav--menu-open");
    } else {
      const menuOpen = !hiddenLinks.classList.contains("hidden");
      nav.classList.toggle("greedy-nav--menu-open", menuOpen);
      navToggle.classList.toggle("close", menuOpen);
    }
  };

  if (prefersReducedMotion) {
    navLocked = false;
    navState = "expanded";
    masthead.classList.remove("is-hidden", "is-nav-collapsed", "is-nav-faded");
    masthead.classList.add("is-nav-expanded");
    clearAutoFadeTimer();
  } else {
    setNavState("collapsed", "init");
  }

  syncScrollState();

  const flushViewportState = window.QSD.rafGate(function () {
    const phase = pendingViewportPhase || "active";
    pendingViewportPhase = null;

    syncGreedyToggle();

    if (phase !== "settled") {
      return;
    }

    scheduleAutoFadeIfEligible();
  });

  const syncViewportState = function (event) {
    const detail = event && event.detail ? event.detail : {};
    const nextPhase = detail.phase || "active";
    pendingViewportPhase = nextPhase === "settled" ? "settled" : (pendingViewportPhase || nextPhase);
    flushViewportState();
  };

  const syncOverflowState = window.QSD.rafGate(function () {
    syncGreedyToggle();

    if (navState === "collapsed") {
      scheduleAutoFadeIfEligible();
    }
  });

  const onOverlayOpeningState = function (event) {
    if (prefersReducedMotion) return;

    const detail = event && event.detail ? event.detail : {};
    const action = detail.action;

    if (action === "start") {
      navLocked = true;
      clearHideTimer();
      clearAutoFadeTimer();
      masthead.classList.remove("is-nav-expanded", "is-nav-collapsed", "is-nav-faded");
      masthead.classList.add("is-hidden");
      return;
    }

    if (action === "finish" || action === "cancel") {
      navLocked = false;
      revealAutoFadedNav();
      setNavState("expanded", "overlay-opening");
    }
  };

  window.addEventListener("scroll", window.QSD.rafGate(syncScrollState), { passive: true });
  window.addEventListener("qsd:viewport-change", syncViewportState, { passive: true });
  window.addEventListener("qsd:nav-overflow-updated", syncOverflowState, { passive: true });
  window.addEventListener("qsd:overlay-opening", onOverlayOpeningState, { passive: true });

  // The bar stays away while the page is being read and comes back on a hint of looking for it:
  // a scroll up (above), the pointer at the top edge (below), focus arriving inside it, or a tap at
  // the top of the screen. A finger that lands to scroll, or a focus elsewhere on the page, is
  // reading. A tap anywhere also counts on a page still at its top, where there is no scrolling up
  // to ask with.
  let touchStart = null;
  window.addEventListener("touchstart", function (event) {
    const touch = event.touches && event.touches[0];
    touchStart = touch ? { x: touch.clientX, y: touch.clientY, scrollY: window.scrollY } : null;
  }, { passive: true });
  window.addEventListener("touchend", function (event) {
    const start = touchStart;
    const touch = event.changedTouches && event.changedTouches[0];
    touchStart = null;
    if (!start || !touch) return;
    const moved = Math.abs(touch.clientX - start.x) > TAP_SLOP || Math.abs(touch.clientY - start.y) > TAP_SLOP;
    if (moved || Math.abs(window.scrollY - start.scrollY) > MIN_SCROLL_DELTA) return;
    if (start.y < TOP_INTENT_ZONE || window.scrollY <= NEAR_TOP_Y) onIntentExpand("touch");
  }, { passive: true });
  document.addEventListener("focusin", function (event) {
    if (masthead.contains(event.target)) onIntentExpand("focus");
  });
  document.addEventListener("mousemove", function (event) {
    if (event.clientY < TOP_INTENT_ZONE) {
      const now = Date.now();
      if (now - lastTopIntentAt > MOUSEMOVE_THROTTLE_MS) {
        lastTopIntentAt = now;
        onIntentExpand("top-edge");
      }
    }
  }, { passive: true });

  if (nav) {
    nav.addEventListener("mouseenter", function () {
      onIntentExpand("hover");
    });
  }

  syncGreedyToggle();
});
