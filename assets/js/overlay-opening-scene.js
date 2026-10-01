document.addEventListener("DOMContentLoaded", function () {
  const body = document.body;
  // The opening of every page with an overlay hero: the masthead stays away while the hero
  // arrives. Pages that set `no-opening-scene` (e.g. /about/) keep their overlay hero but
  // never run it.
  if (body.classList.contains("no-opening-scene")) return;
  const hasOverlayHero = body.classList.contains("has-overlay-hero");
  const overlayHero = document.querySelector(".page__hero--overlay");
  if (!hasOverlayHero || !overlayHero) return;

  // Reduced-motion readers and automated renderers (the kill-switch) share this
  // path: excerpt visible, scene complete, no dim frame. See window.QSD.motionOff.
  const prefersReducedMotion = window.QSD.motionOff();
  const OPENING_HOLD_MS = 3000;
  const DIM_FADE_MS = 1000;
  const EXCERPT_REVEAL_DELAY_MS = 1500;
  const SCROLL_CANCEL_DELTA = 2;
  const TOP_INTENT_ZONE = 120; // as the masthead's own (masthead-intent.js)
  const TAP_SLOP = 10;
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
    document.removeEventListener("focusin", onFocusIn);
    document.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("touchstart", onTouchStart);
    window.removeEventListener("touchend", onTouchEnd);
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

  // The scene holds the masthead away for immersion. A reader looking for the way ends it at once:
  // Tab reaching the masthead (its links would take focus unseen), the pointer brought up to the
  // top edge, a tap at the top of the screen. A pointer that was already resting there (it has just
  // clicked a link in the bar) is not asking; it has to leave the edge and come back.
  const seeking = function () {
    if (!sceneCompleted && phase === "active") beginEnding("cancel");
  };

  function onFocusIn(event) {
    const masthead = document.querySelector(".masthead");
    if (masthead && masthead.contains(event.target)) seeking();
  }

  let pointerWasBelow = false;
  function onMouseMove(event) {
    if (event.clientY >= TOP_INTENT_ZONE) { pointerWasBelow = true; return; }
    if (pointerWasBelow) seeking();
  }

  let touchStart = null;
  function onTouchStart(event) {
    const touch = event.touches && event.touches[0];
    touchStart = touch ? { x: touch.clientX, y: touch.clientY } : null;
  }
  function onTouchEnd(event) {
    const start = touchStart;
    const touch = event.changedTouches && event.changedTouches[0];
    touchStart = null;
    if (!start || !touch || start.y >= TOP_INTENT_ZONE) return;
    if (Math.abs(touch.clientX - start.x) <= TAP_SLOP && Math.abs(touch.clientY - start.y) <= TAP_SLOP) seeking();
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
  document.addEventListener("focusin", onFocusIn);
  document.addEventListener("mousemove", onMouseMove, { passive: true });
  window.addEventListener("touchstart", onTouchStart, { passive: true });
  window.addEventListener("touchend", onTouchEnd, { passive: true });
});
