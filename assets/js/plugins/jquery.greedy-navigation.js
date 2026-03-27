/*
 * Greedy Navigation
 *
 * Mobile overflow-safe variant:
 * - Uses intrinsic width checks (scrollWidth/clientWidth) for flex+clipped nav.
 * - Pins brand item in visible links.
 * - Shows overflow toggle only when hidden links exist.
 */
(function ($) {
  "use strict";

  var $nav = $("#site-nav");
  if (!$nav.length) return;

  var $toggle = $nav.find(".greedy-nav__toggle");
  var $visibleLinks = $nav.find(".visible-links");
  var $hiddenLinks = $nav.find(".hidden-links");
  var rafId = null;
  var rebalanceReason = "init";
  var MAX_PASSES = 200;

  function hasDom() {
    return $nav.length && $toggle.length && $visibleLinks.length && $hiddenLinks.length;
  }

  function hasHiddenItems() {
    return $hiddenLinks.children("li").length > 0;
  }

  function isOverflowMenuOpen() {
    return hasHiddenItems() && !$hiddenLinks.hasClass("hidden");
  }

  function hasVisibleOverflow() {
    var node = $visibleLinks.get(0);
    if (!node) return false;

    // Tolerance avoids 1px rounding noise across browsers/zoom levels.
    return (node.scrollWidth - node.clientWidth) > 1;
  }

  function firstVisibleIsBrand() {
    var $first = $visibleLinks.children("li").first();
    return $first.hasClass("masthead__menu-item--brand");
  }

  function pinBrandToVisibleStart() {
    var $brandFromHidden = $hiddenLinks.children(".masthead__menu-item--brand");
    if ($brandFromHidden.length) {
      $brandFromHidden.prependTo($visibleLinks);
    }

    var $brandVisible = $visibleLinks.children(".masthead__menu-item--brand");
    if ($brandVisible.length && !firstVisibleIsBrand()) {
      $brandVisible.first().prependTo($visibleLinks);
    }
  }

  function moveLastVisibleToHidden() {
    var $candidate = $visibleLinks
      .children("li")
      .not(".masthead__menu-item--brand")
      .last();

    if (!$candidate.length) return false;

    // Prepend preserves original nav order when items are restored.
    $candidate.prependTo($hiddenLinks);
    return true;
  }

  function moveFirstHiddenToVisible() {
    var $item = $hiddenLinks.children("li").first();
    if (!$item.length) return false;

    $item.appendTo($visibleLinks);
    return true;
  }

  function syncToggleState() {
    var hasOverflow = hasHiddenItems();

    $nav.toggleClass("greedy-nav--has-overflow", hasOverflow);
    $toggle.toggleClass("hidden", !hasOverflow);
    $toggle.toggleClass("greedy-nav__toggle--inactive", !hasOverflow);

    if (!hasOverflow) {
      closeOverflowMenu();
      return;
    }

    syncOverflowMenuState();
  }

  function syncOverflowMenuState() {
    var menuOpen = isOverflowMenuOpen();
    $nav.toggleClass("greedy-nav--menu-open", menuOpen);
    $toggle.toggleClass("close", menuOpen);
  }

  function closeOverflowMenu() {
    var wasOpen = isOverflowMenuOpen() || $nav.hasClass("greedy-nav--menu-open") || $toggle.hasClass("close");
    $hiddenLinks.addClass("hidden");
    $toggle.removeClass("close");
    $nav.removeClass("greedy-nav--menu-open");
    if (wasOpen) {
      emitOverflowState("menu-close");
    }
  }

  function emitOverflowState(source) {
    var detail = {
      source: source || "rebalance",
      hasOverflow: hasHiddenItems(),
      menuOpen: isOverflowMenuOpen()
    };
    var overflowEvent;
    if (typeof window.CustomEvent === "function") {
      overflowEvent = new window.CustomEvent("qsd:nav-overflow-updated", { detail: detail });
    } else {
      overflowEvent = document.createEvent("CustomEvent");
      overflowEvent.initCustomEvent("qsd:nav-overflow-updated", false, false, detail);
    }
    window.dispatchEvent(overflowEvent);
  }

  function rebalance(source) {
    if (!hasDom()) return;

    pinBrandToVisibleStart();
    syncToggleState();

    var pass = 0;
    while (hasVisibleOverflow() && pass < MAX_PASSES) {
      if (!moveLastVisibleToHidden()) break;
      pass += 1;
      syncToggleState();
    }

    pass = 0;
    while (hasHiddenItems() && pass < MAX_PASSES) {
      if (!moveFirstHiddenToVisible()) break;
      syncToggleState();

      if (hasVisibleOverflow()) {
        moveLastVisibleToHidden();
        syncToggleState();
        break;
      }

      pass += 1;
    }

    emitOverflowState(source || "rebalance");
  }

  function requestRebalance(reason) {
    if (reason) {
      rebalanceReason = reason;
    }

    if (rafId !== null) return;
    rafId = window.requestAnimationFrame(function () {
      rafId = null;
      var reasonLabel = rebalanceReason || "rebalance";
      rebalanceReason = "rebalance";
      rebalance(reasonLabel);
    });
  }

  if ($toggle.length) {
    $toggle.on("click", function (event) {
      // Keep overflow button independent from search toggle behavior.
      if ($(this).hasClass("hidden") || $(this).hasClass("greedy-nav__toggle--inactive")) {
        event.preventDefault();
        return;
      }

      if (!hasHiddenItems()) {
        closeOverflowMenu();
        return;
      }

      $hiddenLinks.toggleClass("hidden");
      syncOverflowMenuState();
      emitOverflowState("toggle-click");
    });
  }

  $(document).on("mousedown touchstart", function (event) {
    if (!isOverflowMenuOpen()) return;
    if ($(event.target).closest("#site-nav").length) return;
    closeOverflowMenu();
  });

  $(document).on("keydown", function (event) {
    if (!isOverflowMenuOpen()) return;
    if (event.key === "Escape" || event.keyCode === 27) {
      closeOverflowMenu();
    }
  });

  window.addEventListener("qsd:viewport-change", function (event) {
    var detail = event && event.detail ? event.detail : {};
    var phase = detail.phase || "active";

    closeOverflowMenu();
    requestRebalance("viewport-" + phase);
  }, { passive: true });

  $(window).on("load", function () {
    requestRebalance("load");
    window.setTimeout(function () { requestRebalance("load-180ms"); }, 180);
    window.setTimeout(function () { requestRebalance("load-600ms"); }, 600);
  });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      requestRebalance("fonts-ready");
      window.setTimeout(function () { requestRebalance("fonts-ready-120ms"); }, 120);
    });
  }

  requestRebalance("init");
})(jQuery);
