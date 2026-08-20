/* Subscribe slip — behaviour for _includes/subscribe.html.
 *
 * Lifecycle: reveal on viewport entry (IntersectionObserver) and then STAY
 * open. The card no longer folds itself on a timer — a reader at the end of a
 * post keeps the whole invitation in view. It becomes the ornamental rule (two
 * hairlines meeting at the monogram) only in two cases: after a successful
 * subscription, and on any later visit from a browser that has already
 * subscribed. In that folded state, hovering PEEKS the card open (folding back
 * if the pointer leaves without engaging); a click or keyboard focus COMMITS
 * the expansion (never re-folds). A browser that already subscribed peeks to a
 * quiet acknowledgement, not a fresh form.
 */
(function () {
  "use strict";

  var FOLD_AFTER_SUCCESS_MS = 2800;
  // Hysteresis for the hover-peek: the expansion always completes (a min-open
  // latch covering the 0.8 s transition) and the refold waits out a grace
  // period, cancelled if the pointer returns. Without this, the box moving
  // under a stationary cursor mid-animation fires spurious enter/leave events
  // and the rule trembles between states.
  var PEEK_MIN_OPEN_MS = 900;
  var PEEK_REFOLD_GRACE_MS = 2000; // unhurried retreat — the card lingers before folding back
  var DONE_KEY = "qsd-subscribe-done";

  var MSG_INVALID = "That address doesn’t look right.";
  var MSG_FAILED = "That didn’t go through. Try once more.";

  // Automated renderers (window.QSD_MOTION_OFF — see head/custom.html) get the
  // slip fully expanded and static: no reveal animation.
  var motionOff = window.QSD_MOTION_OFF === true;
  var reduced = window.QSD.motionOff();

  function storageGet(key) {
    try { return window.localStorage.getItem(key); } catch (_) { return null; }
  }
  function storageSet(key, value) {
    try { window.localStorage.setItem(key, value); } catch (_) { /* private mode */ }
  }

  function Slip(root) {
    this.root = root;
    this.peeking = false;   // expanded by hover/focus, may fold back
    this.sticky = false;    // expansion committed by click/engagement
    this.hovering = false;  // pointer currently inside the slip
    this.peekedAt = 0;      // when the current peek began (min-open latch)
    this.refoldTimer = null;

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
      this.root.classList.add("is-in");
      return;
    }

    if (storageGet(DONE_KEY)) {
      // Already subscribed on this browser — rest as the quiet rule, and mark
      // the card done so a peek reveals the acknowledgement, not a fresh form.
      this.root.classList.add("is-in", "is-done");
      this.okNote.hidden = false;
      this.fold(true);
    }
  }

  Slip.prototype.bind = function () {
    var self = this;

    this.summary.addEventListener("click", function () { self.engage(true); });

    this.root.addEventListener("pointerenter", function () {
      self.hovering = true;
      self.cancelRefold(); // pointer came back — the rule stays open
      if (self.root.classList.contains("is-folded")) self.peek();
    });
    this.root.addEventListener("pointerleave", function () {
      self.hovering = false;
      if (self.peeking && !self.sticky) self.scheduleRefold();
    });

    this.root.addEventListener("focusin", function (event) {
      if (event.target === self.summary) {
        if (self.root.classList.contains("is-folded")) self.peek();
      } else if (self.peeking) {
        self.engage(false); // tabbed/clicked into the card — commit
      }
    });
    this.root.addEventListener("focusout", function (event) {
      if (!self.root.contains(event.relatedTarget) && self.peeking && !self.sticky) {
        self.scheduleRefold();
      }
    });

    this.input.addEventListener("input", function () {
      if (self.peeking) self.engage(false);
    });

    this.form.addEventListener("submit", function (event) {
      event.preventDefault();
      self.engage(false);
      self.submit();
    });
  };

  /* ---------- reveal ---------- */

  Slip.prototype.reveal = function () {
    this.root.classList.add("is-in");
  };

  /* ---------- fold / peek / engage ---------- */

  Slip.prototype.fold = function (instant) {
    var self = this;
    this.cancelRefold();
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
    this.cancelRefold();
    if (this.peeking) return;
    this.peeking = true;
    this.peekedAt = Date.now();
    this.root.classList.remove("is-folded");
    this.summary.setAttribute("aria-expanded", "true");
  };

  Slip.prototype.scheduleRefold = function () {
    var self = this;
    this.cancelRefold();
    // Never refold before the expansion has fully played out, and always give
    // the pointer a grace window to come back.
    var latch = this.peekedAt + PEEK_MIN_OPEN_MS - Date.now();
    var wait = Math.max(PEEK_REFOLD_GRACE_MS, latch);
    this.refoldTimer = window.setTimeout(function () {
      self.refoldTimer = null;
      if (self.peeking && !self.sticky && !self.hovering) self.refold();
    }, wait);
  };

  Slip.prototype.cancelRefold = function () {
    if (this.refoldTimer) {
      window.clearTimeout(this.refoldTimer);
      this.refoldTimer = null;
    }
  };

  Slip.prototype.refold = function () {
    this.cancelRefold();
    this.peeking = false;
    this.root.classList.add("is-folded");
    this.summary.setAttribute("aria-expanded", "false");
  };

  Slip.prototype.engage = function (focusInput) {
    this.cancelRefold();
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
    // The card has done its job — retire it to the quiet rule after a beat.
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
