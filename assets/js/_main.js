/* ==========================================================================
   jQuery plugin settings and other scripts
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

$(document).ready(function(){
   // Sticky footer
  var bumpIt = function() {
    $("body").css("margin-bottom", $(".page__footer").outerHeight(true));
  };
  var VIEWPORT_TRAILING_MS = 140;
  var viewportRafScheduled = false;
  var viewportTrailingTimer = null;
  var latestViewportRequest = null;
  var lastViewportSync = null;
  var stickyModeEnabled = null;
  var stickyRuntimeInitialized = false;
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

    var viewportEvent;
    if (typeof window.CustomEvent === "function") {
      viewportEvent = new window.CustomEvent("qsd:viewport-change", { detail: detail });
    } else {
      viewportEvent = document.createEvent("CustomEvent");
      viewportEvent.initCustomEvent("qsd:viewport-change", false, false, detail);
    }
    window.dispatchEvent(viewportEvent);
  };

  // FitVids init
  $("#main").fitVids();

  // init sticky sidebar
  $(".sticky").Stickyfill();
  if (typeof Stickyfill !== "undefined") {
    Stickyfill.init();
    stickyRuntimeInitialized = true;
  }

  var stickySideBar = function(options){
    options = options || {};
    var phase = options.phase || "active";
    var viewport = options.viewport || readViewport();
    var settled = phase === "settled";
    var widthChanged = stickyLastSettledWidth !== null && viewport.width !== stickyLastSettledWidth;
    var show = $(".author__urls-wrapper button").length === 0 ? $(window).width() > 1024 : !$(".author__urls-wrapper button").is(":visible");

    if (show !== stickyModeEnabled) {
      stickyModeEnabled = show;

      if (show) {
        if (typeof Stickyfill !== "undefined") {
          if (!stickyRuntimeInitialized) {
            Stickyfill.init();
            stickyRuntimeInitialized = true;
          }
          Stickyfill.rebuild();
        }
        $(".author__urls").show();
      } else {
        if (typeof Stickyfill !== "undefined") {
          Stickyfill.stop();
        }
        $(".author__urls").hide();
      }
    } else if (show) {
      if (
        settled &&
        widthChanged &&
        typeof Stickyfill !== "undefined" &&
        stickyRuntimeInitialized
      ) {
        Stickyfill.rebuild();
      }
      $(".author__urls").show();
    } else {
      $(".author__urls").hide();
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

  $(".author__urls-wrapper button").on("click", function() {
    $(".author__urls").fadeToggle("fast", function() {});
    $(".author__urls-wrapper button").toggleClass("open");
  });

  // init smooth scroll
  $("a").smoothScroll({offset: -20});

  var $searchPanel = $(".search-content");
  var $searchToggle = $(".search__toggle");
  var $searchInput = $("input#search").first();
  var $searchSuggestions = $("#search-suggestions");
  var searchSuggestionCache = null;
  var searchBlurTimer = null;

  var normalizeSearchSuggestionValue = function(value) {
    return $.trim(String(value || "")).toLowerCase();
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

        var title = $.trim(entry.title || "");
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
          var tagLabel = $.trim(tag || "");
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
    if (!$searchSuggestions.length) return;
    $searchSuggestions.removeClass("is--visible").prop("hidden", true).empty();
  };

  var renderSearchSuggestions = function(query) {
    if (!$searchSuggestions.length) return;

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

    $searchSuggestions.html(markup).prop("hidden", false).addClass("is--visible");
  };

  var updateSearchPanelPosition = function() {
    if (!$searchPanel.length) return;

    var mastheadMenu = document.querySelector(".masthead__menu");
    if (!mastheadMenu) return;

    var menuBounds = mastheadMenu.getBoundingClientRect();
    var panelTop = Math.max(menuBounds.bottom, 0);
    $searchPanel.css("--search-panel-top", panelTop + "px");
  };

  var openSearchPanel = function() {
    if (!$searchPanel.length || !$searchInput.length) return;

    cancelSearchBlurTimer();
    updateSearchPanelPosition();
    $searchPanel.addClass("is--visible").attr("aria-hidden", "false");
    $searchToggle.attr("aria-expanded", "true").addClass("is-active");
    $searchInput.attr("tabindex", "0");

    window.requestAnimationFrame(function() {
      $searchInput.trigger("focus");
      renderSearchSuggestions($searchInput.val());
      $searchInput.trigger("input");
    });
  };

  var closeSearchPanel = function() {
    if (!$searchPanel.length) return;

    cancelSearchBlurTimer();
    hideSearchSuggestions();
    $searchPanel.removeClass("is--visible").attr("aria-hidden", "true");
    $searchToggle.attr("aria-expanded", "false").removeClass("is-active");
    $searchInput.attr("tabindex", "-1");
  };

  if ($searchPanel.length && $searchToggle.length && $searchInput.length) {
    $searchPanel.attr({
      id: "site-search-panel",
      role: "region",
      "aria-label": "Site search",
      "aria-hidden": "true"
    });

    $searchToggle.attr({
      "aria-controls": "site-search-panel",
      "aria-expanded": "false"
    });

    $searchToggle.on("click", function(event) {
      event.preventDefault();
      if ($searchPanel.hasClass("is--visible")) {
        closeSearchPanel();
      } else {
        openSearchPanel();
      }
    });

    $searchInput.on("input focus", function() {
      cancelSearchBlurTimer();
      renderSearchSuggestions($(this).val());
    });

    $searchInput.on("blur", function() {
      cancelSearchBlurTimer();
      searchBlurTimer = window.setTimeout(function() {
        hideSearchSuggestions();
      }, 140);
    });

    $searchSuggestions.on("mousedown", ".search-suggestion", function(event) {
      event.preventDefault();
    });

    $searchSuggestions.on("click", ".search-suggestion", function() {
      var suggestionValue = $(this).data("searchSuggestion");
      $searchInput.val(suggestionValue).trigger("input");
      hideSearchSuggestions();
    });

    var searchPanelViewportRaf = null;
    var syncSearchPanelAfterViewportChange = function(event) {
      if ($searchPanel.hasClass("is--visible")) {
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

    $(window).on("scroll", syncSearchPanelAfterViewportChange);
    window.addEventListener("qsd:viewport-change", syncSearchPanelAfterViewportChange, { passive: true });

    $(document).on("mousedown", function(event) {
      if (
        $searchPanel.hasClass("is--visible") &&
        !$(event.target).closest(".search-content, .search__toggle").length
      ) {
        closeSearchPanel();
      }
    });

    $(document).on("keydown", function(event) {
      if (event.key === "Escape" && $searchPanel.hasClass("is--visible")) {
        closeSearchPanel();
        $searchToggle.trigger("focus");
      }
    });
  }

});
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
      // If another handler (e.g. jQuery smoothScroll) already handled this, do nothing.
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
