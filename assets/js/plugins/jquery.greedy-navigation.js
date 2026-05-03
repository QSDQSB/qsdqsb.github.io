/*
 * Greedy Navigation (vanilla JS — jQuery removed)
 *
 * Mobile overflow-safe variant:
 * - Uses intrinsic width checks (scrollWidth/clientWidth) for flex+clipped nav.
 * - Pins brand item in visible links.
 * - Shows overflow toggle only when hidden links exist.
 */
(function () {
  "use strict";

  var nav = document.getElementById("site-nav");
  if (!nav) return;

  var toggle = nav.querySelector(".greedy-nav__toggle");
  var visibleLinks = nav.querySelector(".visible-links");
  var hiddenLinks = nav.querySelector(".hidden-links");
  var rafId = null;
  var rebalanceReason = "init";
  var MAX_PASSES = 200;

  function hasDom() {
    return nav && toggle && visibleLinks && hiddenLinks;
  }

  function hiddenChildren() {
    return hiddenLinks.querySelectorAll(":scope > li");
  }

  function hasHiddenItems() {
    return hiddenChildren().length > 0;
  }

  function isOverflowMenuOpen() {
    return hasHiddenItems() && !hiddenLinks.classList.contains("hidden");
  }

  function hasVisibleOverflow() {
    // Tolerance avoids 1px rounding noise across browsers/zoom levels.
    return (visibleLinks.scrollWidth - visibleLinks.clientWidth) > 1;
  }

  function firstVisibleIsBrand() {
    var first = visibleLinks.querySelector(":scope > li");
    return first && first.classList.contains("masthead__menu-item--brand");
  }

  function pinBrandToVisibleStart() {
    var brandFromHidden = hiddenLinks.querySelector(".masthead__menu-item--brand");
    if (brandFromHidden) {
      visibleLinks.prepend(brandFromHidden);
    }

    var brandVisible = visibleLinks.querySelector(".masthead__menu-item--brand");
    if (brandVisible && !firstVisibleIsBrand()) {
      visibleLinks.prepend(brandVisible);
    }
  }

  function moveLastVisibleToHidden() {
    var items = visibleLinks.querySelectorAll(":scope > li:not(.masthead__menu-item--brand)");
    if (!items.length) return false;

    var candidate = items[items.length - 1];
    // Prepend preserves original nav order when items are restored.
    hiddenLinks.prepend(candidate);
    return true;
  }

  function moveFirstHiddenToVisible() {
    var item = hiddenLinks.querySelector(":scope > li");
    if (!item) return false;

    visibleLinks.append(item);
    return true;
  }

  function syncToggleState() {
    var hasOverflow = hasHiddenItems();

    nav.classList.toggle("greedy-nav--has-overflow", hasOverflow);
    toggle.classList.toggle("hidden", !hasOverflow);
    toggle.classList.toggle("greedy-nav__toggle--inactive", !hasOverflow);

    if (!hasOverflow) {
      closeOverflowMenu();
      return;
    }

    syncOverflowMenuState();
  }

  function syncOverflowMenuState() {
    var menuOpen = isOverflowMenuOpen();
    nav.classList.toggle("greedy-nav--menu-open", menuOpen);
    toggle.classList.toggle("close", menuOpen);
  }

  function closeOverflowMenu() {
    var wasOpen = isOverflowMenuOpen() || nav.classList.contains("greedy-nav--menu-open") || toggle.classList.contains("close");
    hiddenLinks.classList.add("hidden");
    toggle.classList.remove("close");
    nav.classList.remove("greedy-nav--menu-open");
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
    window.dispatchEvent(new CustomEvent("qsd:nav-overflow-updated", { detail: detail }));
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

  if (toggle) {
    toggle.addEventListener("click", function (event) {
      // Keep overflow button independent from search toggle behavior.
      if (toggle.classList.contains("hidden") || toggle.classList.contains("greedy-nav__toggle--inactive")) {
        event.preventDefault();
        return;
      }

      if (!hasHiddenItems()) {
        closeOverflowMenu();
        return;
      }

      hiddenLinks.classList.toggle("hidden");
      syncOverflowMenuState();
      emitOverflowState("toggle-click");
    });
  }

  document.addEventListener("mousedown", function (event) {
    if (!isOverflowMenuOpen()) return;
    if (event.target.closest("#site-nav")) return;
    closeOverflowMenu();
  });

  document.addEventListener("touchstart", function (event) {
    if (!isOverflowMenuOpen()) return;
    if (event.target.closest("#site-nav")) return;
    closeOverflowMenu();
  }, { passive: true });

  document.addEventListener("keydown", function (event) {
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

  window.addEventListener("load", function () {
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
})();
