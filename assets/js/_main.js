/* ==========================================================================
   Site scripts (vanilla JS — jQuery removed)
   ========================================================================== */

/* ==========================================================================
   Shared event-coalescing helper (Global)
   ========================================================================== */

/**
 * Coalesce rapid repeated calls into a single requestAnimationFrame flush.
 * Returns a gated function: the first call schedules `fn` on the next
 * frame; further calls before that frame are no-ops. `fn` runs with
 * whatever arguments the *last* call before the flush provided.
 *
 * Shared by masthead-intent.js and this file's own search-panel listener,
 * which both repeated this same guard-flag/rAF/reset idiom.
 */
window.QSD = window.QSD || {};
window.QSD.rafGate = function(fn) {
	var scheduled = false;
	return function() {
		var args = arguments;
		if (scheduled) return;
		scheduled = true;
		window.requestAnimationFrame(function() {
			scheduled = false;
			fn.apply(null, args);
		});
	};
};

document.addEventListener("DOMContentLoaded", function(){
   // Sticky footer
  var bumpIt = function() {
    var footer = document.querySelector(".page__footer");
    if (!footer) { document.body.style.marginBottom = "0px"; return; }
    var cs = getComputedStyle(footer);
    var h = footer.offsetHeight + parseFloat(cs.marginTop) + parseFloat(cs.marginBottom);
    document.body.style.marginBottom = h + "px";
  };
  var VIEWPORT_TRAILING_MS = 140;
  var viewportRafScheduled = false;
  var viewportTrailingTimer = null;
  var latestViewportRequest = null;
  var lastViewportSync = null;
  var stickyModeEnabled = null;
  var stickyLastSettledWidth = null;
  var htmlRoot = document.documentElement;

  var toViewportPx = function(value, fallback) {
    if (typeof value === "number" && !isNaN(value) && value > 0) return Math.round(value);
    return Math.round(fallback || 0);
  };

  var readViewport = function() {
    var visualViewport = window.visualViewport;
    var innerWidth = window.innerWidth || document.documentElement.clientWidth || 0;
    var innerHeight = window.innerHeight || document.documentElement.clientHeight || 0;
    return {
      width: toViewportPx(visualViewport && visualViewport.width, innerWidth),
      height: toViewportPx(visualViewport && visualViewport.height, innerHeight)
    };
  };

  var sameViewportSize = function(left, right) {
    if (!left || !right) return false;
    return left.width === right.width && left.height === right.height;
  };

  var dispatchViewportChange = function(source, phase, viewport) {
    var detail = {
      source: source || "viewport",
      phase: phase || "active",
      width: viewport.width,
      height: viewport.height
    };
    var nextSnapshot = {
      width: viewport.width,
      height: viewport.height,
      phase: detail.phase
    };
    if (
      lastViewportSync &&
      lastViewportSync.width === nextSnapshot.width &&
      lastViewportSync.height === nextSnapshot.height &&
      lastViewportSync.phase === nextSnapshot.phase
    ) {
      return;
    }
    lastViewportSync = nextSnapshot;

    window.dispatchEvent(new CustomEvent("qsd:viewport-change", { detail: detail }));
  };

  // Sticky sidebar (position: sticky is natively supported — no polyfill needed)
  var stickySideBar = function(options){
    options = options || {};
    var phase = options.phase || "active";
    var viewport = options.viewport || readViewport();
    var settled = phase === "settled";
    var sidebarBtn = document.querySelector(".author__urls-wrapper button");
    var show = !sidebarBtn ? viewport.width > 1024 : getComputedStyle(sidebarBtn).display === "none";

    var authorUrls = document.querySelector(".author__urls");
    if (!authorUrls) return;

    if (show !== stickyModeEnabled) {
      stickyModeEnabled = show;
      authorUrls.style.display = show ? "" : "none";
    } else if (show) {
      authorUrls.style.display = "";
    } else {
      authorUrls.style.display = "none";
    }

    if (settled) {
      stickyLastSettledWidth = viewport.width;
    }
  };

  var runViewportSync = function(payload) {
    payload = payload || {};
    var source = payload.source || "viewport";
    var phase = payload.phase || "active";
    var viewport = payload.viewport || readViewport();
    var force = !!payload.force;

    if (phase === "active") {
      htmlRoot.classList.add("is-resizing");
    } else {
      htmlRoot.classList.remove("is-resizing");
    }

    if (
      !force &&
      phase === "active" &&
      lastViewportSync &&
      sameViewportSize(lastViewportSync, viewport) &&
      lastViewportSync.phase === "active"
    ) {
      return;
    }

    bumpIt();
    stickySideBar({ phase: phase, viewport: viewport });
    dispatchViewportChange(source, phase, viewport);
  };

  var scheduleViewportSync = function(source) {
    latestViewportRequest = {
      source: source || "resize",
      viewport: readViewport()
    };

    if (!viewportRafScheduled) {
      viewportRafScheduled = true;
      window.requestAnimationFrame(function() {
        viewportRafScheduled = false;
        var request = latestViewportRequest || { source: source || "resize", viewport: readViewport() };
        runViewportSync({
          source: request.source,
          phase: "active",
          viewport: request.viewport
        });
      });
    }

    window.clearTimeout(viewportTrailingTimer);
    viewportTrailingTimer = window.setTimeout(function() {
      var settledRequest = latestViewportRequest || { source: source || "resize", viewport: readViewport() };
      runViewportSync({
        source: settledRequest.source,
        phase: "settled",
        viewport: settledRequest.viewport
      });
    }, VIEWPORT_TRAILING_MS);
  };

  window.addEventListener("resize", function() {
    scheduleViewportSync("resize");
  }, { passive: true });

  window.addEventListener("orientationchange", function() {
    scheduleViewportSync("orientationchange");
  }, { passive: true });

  if (window.visualViewport && window.visualViewport.addEventListener) {
    window.visualViewport.addEventListener("resize", function() {
      scheduleViewportSync("visualViewport.resize");
    }, { passive: true });
  }

  runViewportSync({
    source: "init",
    phase: "settled",
    viewport: readViewport(),
    force: true
  });

  // Follow menu drop down
  var authorToggleBtn = document.querySelector(".author__urls-wrapper button");
  if (authorToggleBtn) {
    authorToggleBtn.addEventListener("click", function() {
      var authorUrls = document.querySelector(".author__urls");
      if (authorUrls) {
        var isHidden = getComputedStyle(authorUrls).display === "none";
        authorUrls.style.display = isHidden ? "" : "none";
      }
      authorToggleBtn.classList.toggle("open");
    });
  }

  // Search panel
  var searchPanel = document.querySelector(".search-content");
  var searchToggle = document.querySelector(".search__toggle");
  var searchInput = document.querySelector("input#search");
  var searchSuggestions = document.getElementById("search-suggestions");
  var searchSuggestionCache = null;
  var searchBlurTimer = null;

  var normalizeSearchSuggestionValue = function(value) {
    return String(value || "").trim().toLowerCase();
  };

  var escapeSearchHtml = function(value) {
    return String(value || "").replace(/[&<>"']/g, function(character) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#39;"
      }[character];
    });
  };

  var cancelSearchBlurTimer = function() {
    if (searchBlurTimer) {
      clearTimeout(searchBlurTimer);
      searchBlurTimer = null;
    }
  };

  var buildSearchSuggestionCache = function() {
    var titles = [];
    var tags = [];
    var seenTitles = {};
    var seenTags = {};
    var palette = window.searchTagPalette || {};

    if (Array.isArray(window.store)) {
      window.store.forEach(function(entry) {
        if (!entry) return;

        var title = (entry.title || "").trim();
        var normalizedTitle = normalizeSearchSuggestionValue(title);
        if (normalizedTitle && !seenTitles[normalizedTitle]) {
          seenTitles[normalizedTitle] = true;
          titles.push({
            type: "title",
            label: title,
            value: title,
            normalized: normalizedTitle
          });
        }

        var entryTags = Array.isArray(entry.tags) ? entry.tags : (entry.tags ? [entry.tags] : []);
        entryTags.forEach(function(tag) {
          var tagLabel = (tag || "").trim();
          var normalizedTag = normalizeSearchSuggestionValue(tagLabel);
          if (!normalizedTag || seenTags[normalizedTag]) return;

          seenTags[normalizedTag] = true;
          tags.push({
            type: "tag",
            label: tagLabel,
            value: tagLabel,
            normalized: normalizedTag,
            color: palette[tagLabel] || ""
          });
        });
      });
    }

    Object.keys(palette).forEach(function(tag) {
      var normalizedTag = normalizeSearchSuggestionValue(tag);
      if (!normalizedTag || seenTags[normalizedTag]) return;

      seenTags[normalizedTag] = true;
      tags.push({
        type: "tag",
        label: tag,
        value: tag,
        normalized: normalizedTag,
        color: palette[tag] || ""
      });
    });

    return {
      titles: titles,
      tags: tags
    };
  };

  var getSearchSuggestionCache = function() {
    if (!searchSuggestionCache) {
      searchSuggestionCache = buildSearchSuggestionCache();
    }
    return searchSuggestionCache;
  };

  var filterSearchSuggestions = function(query) {
    var normalizedQuery = normalizeSearchSuggestionValue(query);
    var matches = [];
    var seenMatches = {};
    var cache = getSearchSuggestionCache();

    if (!normalizedQuery) return matches;

    var collectMatches = function(items) {
      items.forEach(function(item) {
        var matchIndex = item.normalized.indexOf(normalizedQuery);
        var matchKey = item.type + ":" + item.normalized;

        if (matchIndex === -1 || seenMatches[matchKey]) return;

        seenMatches[matchKey] = true;
        matches.push({
          type: item.type,
          label: item.label,
          value: item.value,
          color: item.color || "",
          priority: matchIndex === 0 ? 0 : 1,
          matchIndex: matchIndex
        });
      });
    };

    collectMatches(cache.titles);
    collectMatches(cache.tags);

    matches.sort(function(left, right) {
      if (left.priority !== right.priority) return left.priority - right.priority;
      if (left.matchIndex !== right.matchIndex) return left.matchIndex - right.matchIndex;
      if (left.type !== right.type) return left.type === "title" ? -1 : 1;
      if (left.label.length !== right.label.length) return left.label.length - right.label.length;
      return left.label.localeCompare(right.label);
    });

    return matches.slice(0, 5);
  };

  var hideSearchSuggestions = function() {
    if (!searchSuggestions) return;
    searchSuggestions.classList.remove("is--visible");
    searchSuggestions.hidden = true;
    searchSuggestions.innerHTML = "";
  };

  var renderSearchSuggestions = function(query) {
    if (!searchSuggestions) return;

    var matches = filterSearchSuggestions(query);
    if (!matches.length) {
      hideSearchSuggestions();
      return;
    }

    var markup = matches.map(function(item) {
      var styleAttribute = item.color
        ? ' style="--search-suggestion-accent: ' + escapeSearchHtml(item.color) + ';"'
        : "";

      return (
        '<button type="button" class="search-suggestion' + (item.type === "tag" ? ' is-tag' : '') + '"' + styleAttribute +
        ' data-search-suggestion="' + escapeSearchHtml(item.value) + '">' +
          '<span class="search-suggestion__label">' + escapeSearchHtml(item.label) + '</span>' +
          '<span class="search-suggestion__meta">' + (item.type === "tag" ? "Tag" : "Title") + '</span>' +
        '</button>'
      );
    }).join("");

    searchSuggestions.innerHTML = markup;
    searchSuggestions.hidden = false;
    searchSuggestions.classList.add("is--visible");
  };

  var updateSearchPanelPosition = function() {
    if (!searchPanel) return;

    var mastheadMenu = document.querySelector(".masthead__menu");
    if (!mastheadMenu) return;

    var menuBounds = mastheadMenu.getBoundingClientRect();
    var panelTop = Math.max(menuBounds.bottom, 0);
    searchPanel.style.setProperty("--search-panel-top", panelTop + "px");
  };

  // Search's own scripts (lunr, the whole-site store, the results' renderer:
  // _includes/search/lunr-search-scripts.html) are fetched when the panel is first
  // opened, or the pointer first comes to its button: most readers never open it.
  // They run in order; the renderer, last, takes whatever has been typed by then.
  var searchScripts = null;
  var loadSearchScripts = function() {
    if (searchScripts) return searchScripts;
    var held = document.getElementById("search-scripts");
    var urls = [];
    try { urls = JSON.parse(held.textContent); } catch (error) { urls = []; }
    if (!urls.length) return (searchScripts = Promise.resolve());

    var results = document.getElementById("results");
    var live = document.getElementById("results-live");
    var wait = null;
    if (results && !results.childElementCount && held.dataset.wait) {
      wait = document.createElement("p");
      wait.className = "results__status";
      wait.textContent = held.dataset.wait;
      results.appendChild(wait);
      if (live) live.textContent = held.dataset.wait;
    }
    searchScripts = Promise.all(urls.map(function(url) {
      return new Promise(function(resolve, reject) {
        var script = document.createElement("script");
        script.src = url;
        script.async = false; // fetched together, run in this order
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    })).then(function() {
      // The suggestions are drawn from the store, which has only now arrived.
      searchSuggestionCache = null;
      if (searchPanel.classList.contains("is--visible") && document.activeElement === searchInput) {
        renderSearchSuggestions(searchInput.value);
      }
    });
    // A fetch that failed is tried again at the next opening, or the next thing typed;
    // until then nothing says search is on its way.
    searchScripts.catch(function() {
      searchScripts = null;
      if (wait && wait.parentNode) wait.parentNode.removeChild(wait);
      if (live) live.textContent = "";
    });
    return searchScripts;
  };

  var openSearchPanel = function() {
    if (!searchPanel || !searchInput) return;

    loadSearchScripts();
    cancelSearchBlurTimer();
    updateSearchPanelPosition();
    searchPanel.classList.add("is--visible");
    searchPanel.setAttribute("aria-hidden", "false");
    searchToggle.setAttribute("aria-expanded", "true");
    searchToggle.classList.add("is-active");
    searchInput.setAttribute("tabindex", "0");

    window.requestAnimationFrame(function() {
      searchInput.focus();
      renderSearchSuggestions(searchInput.value);
      searchInput.dispatchEvent(new Event("input"));
    });
  };

  var closeSearchPanel = function() {
    if (!searchPanel) return;

    cancelSearchBlurTimer();
    hideSearchSuggestions();
    searchPanel.classList.remove("is--visible");
    searchPanel.setAttribute("aria-hidden", "true");
    searchToggle.setAttribute("aria-expanded", "false");
    searchToggle.classList.remove("is-active");
    searchInput.setAttribute("tabindex", "-1");
  };

  if (searchPanel && searchToggle && searchInput) {
    searchPanel.id = "site-search-panel";
    searchPanel.setAttribute("role", "region");
    searchPanel.setAttribute("aria-label", "Site search");
    searchPanel.setAttribute("aria-hidden", "true");

    searchToggle.setAttribute("aria-controls", "site-search-panel");
    searchToggle.setAttribute("aria-expanded", "false");
    searchToggle.addEventListener("pointerenter", loadSearchScripts, { once: true });
    searchToggle.addEventListener("focus", loadSearchScripts, { once: true });

    searchToggle.addEventListener("click", function(event) {
      event.preventDefault();
      if (searchPanel.classList.contains("is--visible")) {
        closeSearchPanel();
      } else {
        openSearchPanel();
      }
    });

    searchInput.addEventListener("input", function() {
      loadSearchScripts();
      cancelSearchBlurTimer();
      renderSearchSuggestions(this.value);
    });

    searchInput.addEventListener("focus", function() {
      cancelSearchBlurTimer();
      renderSearchSuggestions(this.value);
    });

    // Suggestions fold once focus has left both the input and the suggestions: a
    // keyboard reader tabbing from the input onto a suggestion keeps it.
    var foldSuggestionsOnLeave = function(event) {
      var next = event.relatedTarget;
      if (next && (next === searchInput || (searchSuggestions && searchSuggestions.contains(next)))) return;
      cancelSearchBlurTimer();
      searchBlurTimer = window.setTimeout(function() {
        hideSearchSuggestions();
      }, 140);
    };
    searchInput.addEventListener("blur", foldSuggestionsOnLeave);

    // Enter (a phone keyboard's Go) goes to the results: onto the first one, or,
    // with none yet, off the input so the keyboard folds away and the list shows.
    searchInput.addEventListener("keydown", function(event) {
      if (event.key !== "Enter") return;
      event.preventDefault();
      var firstResult = document.querySelector("#results a");
      if (firstResult) {
        firstResult.focus();
      } else {
        searchInput.blur();
      }
    });

    if (searchSuggestions) {
      searchSuggestions.addEventListener("focusout", foldSuggestionsOnLeave);

      searchSuggestions.addEventListener("mousedown", function(event) {
        if (event.target.closest(".search-suggestion")) {
          event.preventDefault();
        }
      });

      searchSuggestions.addEventListener("click", function(event) {
        var btn = event.target.closest(".search-suggestion");
        if (!btn) return;
        var suggestionValue = btn.dataset.searchSuggestion;
        searchInput.value = suggestionValue;
        searchInput.dispatchEvent(new Event("input"));
        hideSearchSuggestions();
      });
    }

    var gatedUpdateSearchPanelPosition = window.QSD.rafGate(updateSearchPanelPosition);
    var syncSearchPanelAfterViewportChange = function(event) {
      if (searchPanel.classList.contains("is--visible")) {
        var phase = event && event.detail ? event.detail.phase : "active";
        if (phase === "active") {
          gatedUpdateSearchPanelPosition();
          return;
        }
        updateSearchPanelPosition();
      }
    };

    window.addEventListener("scroll", syncSearchPanelAfterViewportChange, { passive: true });
    window.addEventListener("qsd:viewport-change", syncSearchPanelAfterViewportChange, { passive: true });

    document.addEventListener("mousedown", function(event) {
      if (
        searchPanel.classList.contains("is--visible") &&
        !event.target.closest(".search-content, .search__toggle")
      ) {
        closeSearchPanel();
      }
    });

    document.addEventListener("keydown", function(event) {
      if (event.key === "Escape" && searchPanel.classList.contains("is--visible")) {
        // Spent here: a page that also answers Escape (Drift's way back) checks defaultPrevented.
        event.preventDefault();
        closeSearchPanel();
        searchToggle.focus();
      }
    });
  }

});
/* In-page links glide to their section for a reader who has not asked for stillness. Either way they
   do what a plain link does: the address names the section, Back returns from it, and focus goes
   with the reader, so the next Tab starts from where they landed. */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
      if (e.defaultPrevented) return;

      // The contents list's links are plain links: the browser takes them.
      if (this.closest('.toc') || this.closest('.toc__menu')) return;

      // By id, not by selector: a footnote's id (fn:1) is no selector.
      const id = decodeURIComponent(this.getAttribute('href').slice(1));
      const target = id && document.getElementById(id);
      if (!target) return;

      e.preventDefault();
      target.scrollIntoView({
          behavior: window.QSD.motionOff() ? 'auto' : 'smooth',
          block: 'start',
          inline: 'nearest'
      });
      // The address holds the id percent-encoded; compared decoded, or 卷 pushes again on every click.
      var here = '';
      try { here = decodeURIComponent(window.location.hash.slice(1)); } catch (err) { here = window.location.hash.slice(1); }
      if (here !== id) history.pushState(history.state, '', this.getAttribute('href'));
      // A heading takes focus by script only; a link or a button that is the target keeps its place in the Tab order.
      if (target.tabIndex < 0) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
  });
});
// An address that arrives with a #section glides to it, then the page scrolls plainly: scripts that
// place the reader (the Photobook holding its place, Home's return to the top) must not glide.
if (!window.QSD.motionOff()) document.documentElement.style.scrollBehavior = 'smooth';
setTimeout(() => {
  document.documentElement.style.scrollBehavior = 'auto';
}, 1000);

/* Random-jump tarot links (random voyage / random in-page anchor) — one
   shared handler driven by data attributes, instead of each Liquid partial
   (random_voyage.html, random_voyage_anchor.html) carrying its own
   duplicated inline <script>. */
document.querySelectorAll('[data-random-jump]').forEach(function(link) {
  var targets;
  try {
    targets = JSON.parse(link.getAttribute('data-random-jump-targets') || '[]');
  } catch (e) {
    targets = [];
  }
  if (!targets.length) return;

  link.addEventListener('click', function(event) {
    event.preventDefault();
    var pick = targets[Math.floor(Math.random() * targets.length)];

    if (link.getAttribute('data-random-jump-mode') === 'scroll') {
      var target = document.querySelector(pick);
      if (!target) return;
      var top = target.getBoundingClientRect().top + window.scrollY - 50;
      window.scrollTo({ top: top, behavior: window.QSD.motionOff() ? 'auto' : 'smooth' });
    } else {
      window.location.href = pick;
    }
  });
});
