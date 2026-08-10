/* Subscribe slip — behaviour for _includes/subscribe.html.
 *
 * Lifecycle: reveal on viewport entry (IntersectionObserver) → 10 s dwell →
 * fold into an ornamental rule (two hairlines meeting at the monogram).
 * Hovering the rule PEEKS the card open — it folds back if the pointer
 * leaves without engaging. Clicking the rule, or keyboard-focusing into the
 * card, COMMITS the expansion (never re-folds). Hovering the still-open card
 * pauses the dwell clock; typing cancels it. After a successful subscription
 * the card folds itself to the rule, and future visits start folded.
 */
(function () {
  "use strict";

  var DWELL_MS = 10000;
  var FOLD_AFTER_SUCCESS_MS = 2800;
  var DONE_KEY = "qsd-subscribe-done";

  var MSG_INVALID = "That address doesn’t look right.";
  var MSG_FAILED = "That didn’t go through. Try once more.";

  // Automated renderers (window.QSD_MOTION_OFF — see head/custom.html) get the
  // slip fully expanded and static: no reveal animation, no dwell auto-fold.
  var motionOff = window.QSD_MOTION_OFF === true;
  var reduced = motionOff || window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function storageGet(key) {
    try { return window.localStorage.getItem(key); } catch (_) { return null; }
  }
  function storageSet(key, value) {
    try { window.localStorage.setItem(key, value); } catch (_) { /* private mode */ }
  }

  function Slip(root) {
    this.root = root;
    this.remaining = DWELL_MS;
    this.timer = null;
    this.startedAt = 0;
    this.cancelled = false; // dwell clock permanently stopped
    this.peeking = false;   // expanded by hover/focus, may fold back
    this.sticky = false;    // expansion committed by click/engagement

    this.summary = root.querySelector(".subscribe-slip__summary");
    this.form = root.querySelector(".subscribe-slip__form");
    this.input = root.querySelector(".subscribe-slip__input");
    this.send = root.querySelector(".subscribe-slip__send");
    this.hp = root.querySelector(".subscribe-slip__hp input");
    this.okNote = root.querySelector(".subscribe-slip__note--ok");
    this.errNote = root.querySelector(".subscribe-slip__note--err");

    this.bind();

    if (motionOff) {
      // Deterministic render for screenshots/crawlers: visible, expanded, still.
      this.cancelled = true;
      this.root.classList.add("is-in");
      return;
    }

    if (storageGet(DONE_KEY)) {
      // Already subscribed on this browser — start as the quiet rule.
      this.cancelled = true;
      this.root.classList.add("is-in");
      this.fold(true);
    }
  }

  Slip.prototype.bind = function () {
    var self = this;

    this.summary.addEventListener("click", function () { self.engage(true); });

    this.root.addEventListener("pointerenter", function () {
      if (self.root.classList.contains("is-folded")) self.peek();
      else self.pause();
    });
    this.root.addEventListener("pointerleave", function () {
      if (self.peeking && !self.sticky) self.refold();
      else self.resume();
    });

    this.root.addEventListener("focusin", function (event) {
      self.cancelDwell();
      if (event.target === self.summary) {
        if (self.root.classList.contains("is-folded")) self.peek();
      } else if (self.peeking) {
        self.engage(false); // tabbed/clicked into the card — commit
      }
    });
    this.root.addEventListener("focusout", function (event) {
      if (!self.root.contains(event.relatedTarget) && self.peeking && !self.sticky) {
        self.refold();
      }
    });

    this.input.addEventListener("input", function () {
      self.cancelDwell();
      if (self.peeking) self.engage(false);
    });

    this.form.addEventListener("submit", function (event) {
      event.preventDefault();
      self.engage(false);
      self.submit();
    });
  };

  /* ---------- dwell clock ---------- */

  Slip.prototype.reveal = function () {
    this.root.classList.add("is-in");
    this.startClock();
  };

  Slip.prototype.startClock = function () {
    if (this.cancelled || this.timer) return;
    var self = this;
    this.startedAt = Date.now();
    this.timer = window.setTimeout(function () { self.fold(); }, this.remaining);
  };

  Slip.prototype.pause = function () {
    if (!this.timer) return;
    window.clearTimeout(this.timer);
    this.timer = null;
    this.remaining = Math.max(0, this.remaining - (Date.now() - this.startedAt));
  };

  Slip.prototype.resume = function () {
    if (this.cancelled || this.sticky || this.root.classList.contains("is-folded")) return;
    if (this.remaining <= 0) { this.fold(); return; }
    this.startClock();
  };

  Slip.prototype.cancelDwell = function () {
    this.cancelled = true;
    if (this.timer) { window.clearTimeout(this.timer); this.timer = null; }
  };

  /* ---------- fold / peek / engage ---------- */

  Slip.prototype.fold = function (instant) {
    var self = this;
    if (this.timer) { window.clearTimeout(this.timer); this.timer = null; }
    this.peeking = false;
    this.sticky = false;
    this.summary.hidden = false;
    this.summary.setAttribute("aria-expanded", "false");
    if (instant || reduced) {
      this.root.classList.add("is-folded");
      return;
    }
    // Unhide first, force a layout pass, then flip the class so the rule
    // animates in while the body folds shut.
    void this.summary.offsetHeight;
    window.requestAnimationFrame(function () {
      self.root.classList.add("is-folded");
    });
  };

  Slip.prototype.peek = function () {
    this.peeking = true;
    this.root.classList.remove("is-folded");
    this.summary.setAttribute("aria-expanded", "true");
  };

  Slip.prototype.refold = function () {
    this.peeking = false;
    this.root.classList.add("is-folded");
    this.summary.setAttribute("aria-expanded", "false");
  };

  Slip.prototype.engage = function (focusInput) {
    this.cancelDwell();
    this.peeking = false;
    this.sticky = true;
    this.root.classList.remove("is-folded");
    this.summary.setAttribute("aria-expanded", "true");
    if (focusInput && !this.root.classList.contains("is-done")) {
      this.input.focus({ preventScroll: true });
    }
  };

  /* ---------- submission ---------- */

  Slip.prototype.submit = function () {
    var self = this;
    var email = (this.input.value || "").trim();
    this.okNote.hidden = true;
    this.errNote.hidden = true;
    this.cancelDwell();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      this.errNote.textContent = MSG_INVALID;
      this.errNote.hidden = false;
      return;
    }

    this.send.disabled = true;

    var controller = typeof AbortController === "function" ? new AbortController() : null;
    var timeout = controller
      ? window.setTimeout(function () { controller.abort(); }, 8000)
      : null;

    fetch(this.form.action, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: email,
        source: window.location.pathname,
        website: this.hp ? this.hp.value : "",
      }),
      signal: controller ? controller.signal : undefined,
    }).then(function (response) {
      if (timeout) window.clearTimeout(timeout);
      if (response.ok) {
        self.succeed();
        return;
      }
      return response.json().then(function (body) {
        self.fail(body && body.error === "invalid_email" ? MSG_INVALID : MSG_FAILED);
      }, function () {
        self.fail(MSG_FAILED);
      });
    }).catch(function () {
      if (timeout) window.clearTimeout(timeout);
      self.fail(MSG_FAILED);
    });
  };

  Slip.prototype.succeed = function () {
    var self = this;
    this.root.classList.add("is-done");
    this.okNote.hidden = false;
    storageSet(DONE_KEY, String(Date.now()));
    window.setTimeout(function () { self.fold(); }, FOLD_AFTER_SUCCESS_MS);
  };

  Slip.prototype.fail = function (message) {
    this.send.disabled = false;
    this.errNote.textContent = message;
    this.errNote.hidden = false;
  };

  /* ---------- boot ---------- */

  var roots = document.querySelectorAll("[data-subscribe-slip]");
  if (!roots.length) return;

  var slips = [];
  roots.forEach(function (el) { slips.push(new Slip(el)); });

  var pending = slips.filter(function (slip) {
    return !slip.root.classList.contains("is-in");
  });
  if (!pending.length) return;

  if (!("IntersectionObserver" in window)) {
    pending.forEach(function (slip) { slip.reveal(); });
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      for (var i = 0; i < pending.length; i += 1) {
        if (pending[i].root === entry.target) {
          pending[i].reveal();
          io.unobserve(entry.target);
          break;
        }
      }
    });
  }, { threshold: 0.35 });

  pending.forEach(function (slip) { io.observe(slip.root); });
})();
