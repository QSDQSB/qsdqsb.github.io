/**
 * Bilingual Markdown switcher.
 *
 * Authoring contract:
 * <div data-bilingual>
 *   <section data-bilingual-lang="EN" markdown="1">...</section>
 *   <section data-bilingual-lang="FR" markdown="1">...</section>
 * </div>
 */
(function() {
  "use strict";

  var STORAGE_KEY = "qsd:bilingual:preferred-language";
  var COOKIE_KEY = "qsd_bilingual_language";
  var COOKIE_DAYS = 365;
  var EVENT_NAME = "qsd:bilingual-change";

  var bilingualBlocks = [];
  var currentLanguage = null;

  function normalizeLabel(value) {
    return String(value || "").trim();
  }

  function getCookie(name) {
    var key = name + "=";
    var parts = document.cookie ? document.cookie.split(";") : [];

    for (var i = 0; i < parts.length; i += 1) {
      var part = parts[i].trim();
      if (part.indexOf(key) === 0) return part.substring(key.length);
    }

    return null;
  }

  function setCookie(name, value, days) {
    var expires = "";
    if (days && typeof days === "number") {
      var expiryDate = new Date();
      expiryDate.setTime(expiryDate.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = "; expires=" + expiryDate.toUTCString();
    }
    document.cookie = name + "=" + encodeURIComponent(value || "") + expires + "; path=/";
  }

  function readStoredLanguage() {
    var stored = null;

    try {
      stored = window.localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      stored = null;
    }

    if (!stored) {
      var cookieValue = getCookie(COOKIE_KEY);
      if (cookieValue) {
        try {
          stored = decodeURIComponent(cookieValue);
        } catch (error) {
          stored = cookieValue;
        }
      }
    }

    stored = normalizeLabel(stored);
    return stored || null;
  }

  function persistLanguage(label) {
    if (!label) return;

    try {
      window.localStorage.setItem(STORAGE_KEY, label);
    } catch (error) {
      // Fallback to cookie below.
    }

    setCookie(COOKIE_KEY, label, COOKIE_DAYS);
  }

  function getDirectLanguagePanels(container) {
    return Array.prototype.filter.call(container.children, function(child) {
      return child.hasAttribute("data-bilingual-lang");
    });
  }

  function getPanelsByLanguageLabel(panels, labels) {
    var result = {};
    for (var i = 0; i < labels.length; i += 1) {
      result[labels[i]] = panels[i];
    }
    return result;
  }

  function hasLanguageInAnyBlock(label) {
    for (var i = 0; i < bilingualBlocks.length; i += 1) {
      if (bilingualBlocks[i].labels.indexOf(label) !== -1) return true;
    }
    return false;
  }

  function findVisibleLanguageForBlock(block, preferred) {
    if (preferred && block.labels.indexOf(preferred) !== -1) return preferred;
    return block.labels[0];
  }

  function updateTocVisibility() {
    var tocMenu = document.querySelector(".toc__menu");
    if (!tocMenu) return;

    var tocLinks = tocMenu.querySelectorAll("a[href^=\"#\"]");
    for (var i = 0; i < tocLinks.length; i += 1) {
      var link = tocLinks[i];
      var hash = link.getAttribute("href");
      if (!hash || hash.length <= 1) continue;

      var rawId = hash.substring(1);
      var decodedId = rawId;
      try {
        decodedId = decodeURIComponent(rawId);
      } catch (error) {
        decodedId = rawId;
      }

      var heading = document.getElementById(decodedId) || document.getElementById(rawId);
      var isVisible = true;

      if (heading) {
        var panel = heading.closest("[data-bilingual-lang]");
        if (panel && panel.parentElement && panel.parentElement.hasAttribute("data-bilingual")) {
          isVisible = !panel.hidden;
        }
      }

      var item = typeof link.closest === "function" ? link.closest("li") : link.parentElement;
      if (item) {
        item.hidden = !isVisible;
        item.setAttribute("aria-hidden", isVisible ? "false" : "true");
      } else {
        link.hidden = !isVisible;
      }
    }
  }

  function dispatchBilingualChange(source) {
    var detail = {
      language: currentLanguage,
      source: source || "script"
    };

    var eventObject;
    if (typeof window.CustomEvent === "function") {
      eventObject = new window.CustomEvent(EVENT_NAME, { detail: detail });
    } else {
      eventObject = document.createEvent("CustomEvent");
      eventObject.initCustomEvent(EVENT_NAME, false, false, detail);
    }
    window.dispatchEvent(eventObject);
  }

  function applyLanguageToBlock(block, preferredLanguage) {
    var activeLanguage = findVisibleLanguageForBlock(block, preferredLanguage);
    block.container.setAttribute("data-bilingual-active", activeLanguage);

    for (var i = 0; i < block.labels.length; i += 1) {
      var label = block.labels[i];
      var panel = block.panelsByLabel[label];
      var button = block.buttonByLabel[label];
      var isActive = label === activeLanguage;

      panel.hidden = !isActive;
      panel.setAttribute("aria-hidden", isActive ? "false" : "true");
      panel.classList.toggle("is-bilingual-active", isActive);

      if (button) {
        button.setAttribute("aria-pressed", isActive ? "true" : "false");
        button.classList.toggle("is-active", isActive);
      }
    }
  }

  function applyLanguageAcrossPage(label, options) {
    options = options || {};
    if (!bilingualBlocks.length) return false;

    var normalized = normalizeLabel(label);
    if (!normalized || !hasLanguageInAnyBlock(normalized)) {
      normalized = bilingualBlocks[0].labels[0];
    }

    var hasLanguageChanged = currentLanguage !== normalized;
    if (!hasLanguageChanged) {
      return false;
    }

    currentLanguage = normalized;

    for (var i = 0; i < bilingualBlocks.length; i += 1) {
      applyLanguageToBlock(bilingualBlocks[i], currentLanguage);
    }

    updateTocVisibility();

    if (options.persist !== false) {
      persistLanguage(currentLanguage);
    }
    if (options.emit !== false) {
      dispatchBilingualChange(options.source || "script");
    }

    return true;
  }

  function createSwitcherForBlock(container, labels) {
    var switcher = document.createElement("div");
    switcher.className = "bilingual-switch";
    switcher.setAttribute("role", "group");
    switcher.setAttribute("aria-label", "Content language");

    var buttonByLabel = {};

    for (var i = 0; i < labels.length; i += 1) {
      var label = labels[i];
      var button = document.createElement("button");
      button.type = "button";
      button.className = "bilingual-switch__button";
      button.setAttribute("data-bilingual-option", label);
      button.setAttribute("aria-pressed", "false");
      button.textContent = label;

      button.addEventListener("click", function(event) {
        var selected = normalizeLabel(event.currentTarget.getAttribute("data-bilingual-option"));
        if (!selected) return;
        applyLanguageAcrossPage(selected, {
          source: "user"
        });
      });

      switcher.appendChild(button);
      buttonByLabel[label] = button;
    }

    container.insertBefore(switcher, container.firstChild);
    return {
      switcher: switcher,
      buttonByLabel: buttonByLabel
    };
  }

  function buildBilingualBlock(container) {
    var panels = getDirectLanguagePanels(container);
    if (panels.length !== 2) {
      if (typeof window.console !== "undefined" && typeof window.console.warn === "function") {
        window.console.warn("[bilingual-switch] Expected exactly 2 direct [data-bilingual-lang] children.", container);
      }
      return null;
    }

    var labels = [];
    for (var i = 0; i < panels.length; i += 1) {
      var panel = panels[i];
      var label = normalizeLabel(panel.getAttribute("data-bilingual-lang")) || ("LANG " + (i + 1));
      labels.push(label);
      panel.classList.add("bilingual-switch__panel");
    }

    if (labels[0] === labels[1]) {
      if (typeof window.console !== "undefined" && typeof window.console.warn === "function") {
        window.console.warn("[bilingual-switch] Duplicate language labels are not supported.", container);
      }
      return null;
    }

    var switcherData = createSwitcherForBlock(container, labels);
    container.classList.add("is-bilingual-enhanced");

    return {
      container: container,
      panelsByLabel: getPanelsByLanguageLabel(panels, labels),
      labels: labels,
      buttonByLabel: switcherData.buttonByLabel
    };
  }

  function init() {
    var containers = document.querySelectorAll("[data-bilingual]");
    if (!containers.length) return;

    for (var i = 0; i < containers.length; i += 1) {
      var block = buildBilingualBlock(containers[i]);
      if (block) bilingualBlocks.push(block);
    }

    if (!bilingualBlocks.length) return;

    var storedLanguage = readStoredLanguage();
    var initialLanguage = storedLanguage && hasLanguageInAnyBlock(storedLanguage)
      ? storedLanguage
      : bilingualBlocks[0].labels[0];

    applyLanguageAcrossPage(initialLanguage, {
      persist: false,
      emit: false,
      source: "init"
    });

    dispatchBilingualChange("init");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
