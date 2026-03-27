document.addEventListener("DOMContentLoaded", function () {
  const body = document.body;
  const hasOverlayHero = body.classList.contains("has-overlay-hero");
  const overlayHero = document.querySelector(".page__hero--overlay");
  if (!hasOverlayHero || !overlayHero) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const OPENING_HOLD_MS = 3000;
  const DIM_FADE_MS = 1000;
  const EXCERPT_REVEAL_DELAY_MS = 1500;
  const SCROLL_CANCEL_DELTA = 2;
  const SCROLL_KEYS = new Set([
    "PageDown",
    "PageUp",
    "ArrowDown",
    "ArrowUp",
    "Home",
    "End",
    " "
  ]);

  let phase = "idle";
  let sceneCompleted = false;
  let holdTimer = null;
  let fadeTimer = null;
  let excerptTimer = null;
  let lastScrollY = window.scrollY;

  const emitOpeningState = function (action) {
    let openingEvent;
    if (typeof window.CustomEvent === "function") {
      openingEvent = new window.CustomEvent("qsd:overlay-opening", {
        detail: { action: action }
      });
    } else {
      openingEvent = document.createEvent("CustomEvent");
      openingEvent.initCustomEvent("qsd:overlay-opening", false, false, { action: action });
    }
    window.dispatchEvent(openingEvent);
  };

  const removeInteractionListeners = function () {
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("wheel", onWheel);
    window.removeEventListener("touchmove", onTouchMove);
    document.removeEventListener("keydown", onKeyDown);
  };

  const completeScene = function (action) {
    if (sceneCompleted) return;
    sceneCompleted = true;
    phase = "complete";
    body.classList.remove("overlay-opening-active", "overlay-opening-ending");
    body.classList.add("overlay-opening-complete");
    removeInteractionListeners();
    if (action) {
      emitOpeningState(action);
    }
  };

  const beginEnding = function (action) {
    if (sceneCompleted) return;

    if (action === "cancel") {
      window.clearTimeout(holdTimer);
      window.clearTimeout(fadeTimer);
      completeScene("cancel");
      return;
    }

    if (phase === "ending") return;

    phase = "ending";
    window.clearTimeout(holdTimer);
    body.classList.remove("overlay-opening-active");
    body.classList.add("overlay-opening-ending");
    emitOpeningState("finish");

    fadeTimer = window.setTimeout(function () {
      completeScene(null);
    }, DIM_FADE_MS);
  };

  const handleMeaningfulScroll = function (delta) {
    if (sceneCompleted || phase !== "active") return;
    if (Math.abs(delta) < SCROLL_CANCEL_DELTA) return;
    beginEnding("cancel");
  };

  function onScroll() {
    const currentY = window.scrollY;
    const delta = currentY - lastScrollY;
    lastScrollY = currentY;
    handleMeaningfulScroll(delta);
  }

  function onWheel(event) {
    handleMeaningfulScroll(event.deltaY || 0);
  }

  function onTouchMove() {
    handleMeaningfulScroll(SCROLL_CANCEL_DELTA + 1);
  }

  function onKeyDown(event) {
    if (SCROLL_KEYS.has(event.key)) {
      handleMeaningfulScroll(SCROLL_CANCEL_DELTA + 1);
    }
  }

  body.classList.add("overlay-opening-enabled");

  if (prefersReducedMotion) {
    body.classList.add("overlay-opening-excerpt-visible", "overlay-opening-complete");
    emitOpeningState("finish");
    return;
  }

  body.classList.remove("overlay-opening-ending", "overlay-opening-complete", "overlay-opening-excerpt-visible");
  body.classList.add("overlay-opening-active");
  phase = "active";
  emitOpeningState("start");

  excerptTimer = window.setTimeout(function () {
    body.classList.add("overlay-opening-excerpt-visible");
  }, EXCERPT_REVEAL_DELAY_MS);

  holdTimer = window.setTimeout(function () {
    beginEnding("finish");
  }, OPENING_HOLD_MS);

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("wheel", onWheel, { passive: true });
  window.addEventListener("touchmove", onTouchMove, { passive: true });
  document.addEventListener("keydown", onKeyDown);
});
