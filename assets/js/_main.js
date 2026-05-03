/* ==========================================================================
   Site scripts (vanilla JS — jQuery removed)
   ========================================================================== */

/* ==========================================================================
   Cookie Utility Functions (Global)
   ========================================================================== */

/**
 * Get a cookie value by name
 * @param {string} name - Cookie name
 * @returns {string|null} Cookie value or null if not found
 */
function getCookie(name) {
	var nameEQ = name + "=";
	var ca = document.cookie.split(';');
	for(var i = 0; i < ca.length; i++) {
		var c = ca[i];
		while (c.charAt(0) === ' ') c = c.substring(1, c.length);
		if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
	}
	return null;
}

/**
 * Set a cookie with expiration
 * @param {string} name - Cookie name
 * @param {string} value - Cookie value
 * @param {number} days - Number of days until expiration
 */
function setCookie(name, value, days) {
	var expires = "";
	if (days) {
		var date = new Date();
		date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
		expires = "; expires=" + date.toUTCString();
	}
	document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

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

  var openSearchPanel = function() {
    if (!searchPanel || !searchInput) return;

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

    searchToggle.addEventListener("click", function(event) {
      event.preventDefault();
      if (searchPanel.classList.contains("is--visible")) {
        closeSearchPanel();
      } else {
        openSearchPanel();
      }
    });

    searchInput.addEventListener("input", function() {
      cancelSearchBlurTimer();
      renderSearchSuggestions(this.value);
    });

    searchInput.addEventListener("focus", function() {
      cancelSearchBlurTimer();
      renderSearchSuggestions(this.value);
    });

    searchInput.addEventListener("blur", function() {
      cancelSearchBlurTimer();
      searchBlurTimer = window.setTimeout(function() {
        hideSearchSuggestions();
      }, 140);
    });

    if (searchSuggestions) {
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

    var searchPanelViewportRaf = null;
    var syncSearchPanelAfterViewportChange = function(event) {
      if (searchPanel.classList.contains("is--visible")) {
        var phase = event && event.detail ? event.detail.phase : "active";
        if (phase === "active") {
          if (searchPanelViewportRaf) return;
          searchPanelViewportRaf = window.requestAnimationFrame(function() {
            searchPanelViewportRaf = null;
            updateSearchPanelPosition();
          });
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
        closeSearchPanel();
        searchToggle.focus();
      }
    });
  }

});
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
      if (e.defaultPrevented) return;

      // Let the TOC's own smooth scrolling handle TOC clicks to avoid double-scrolling.
      if (this.closest('.toc') || this.closest('.toc__menu')) return;

      const href = this.getAttribute('href');
      const targetElement = document.querySelector(href);

      if (targetElement) {
          e.preventDefault();
          targetElement.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
              inline: 'nearest'
          });
      } else if (this.origin !== window.location.origin || this.pathname !== window.location.pathname) {
          // If the anchor is from another page, navigate to the top of the page first
          e.preventDefault();
          window.location.href = this.href;
      }
  });
});
document.documentElement.style.scrollBehavior = 'smooth';
setTimeout(() => {
  document.documentElement.style.scrollBehavior = 'auto';
}, 1000);
