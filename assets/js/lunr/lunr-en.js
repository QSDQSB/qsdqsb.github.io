---
layout: none
---

var SEARCH_DEBOUNCE_MS = 140;
var SEARCH_MIN_LATIN_LENGTH = 2;
var SEARCH_MIN_HAN_LENGTH = 1;
var SEARCH_MAX_RENDERED_RESULTS = 30;
var SEARCH_HAN_PATTERN = /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/;
var SEARCH_HAN_RUN_PATTERN = /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]+/g;

// Building the index is one pass over the whole-site store (87 entries, about 60 ms
// on a laptop on 2026-10-02, several times that on a phone, and it grows with the
// site). In one go, on the first query, it held the page while the reader was
// typing. This script arrives when the search panel is first opened
// (assets/js/_main.js), and the index is built from then, a few entries at a time
// with the page given its turn between; a query typed meanwhile is answered when
// it is ready (searchWhenReady). Never at page load: the Home hero's morph runs on
// the main thread, and the build lands behind the search panel, out of its view.
var idx = null;
var searchWhenReady = null;
(function buildSearchIndex() {
  var SLICE_MS = 8;
  // As lunr() sets a builder up, less the trimmer (it would strip CJK terms).
  var builder = new lunr.Builder();
  builder.pipeline.add(lunr.stopWordFilter, lunr.stemmer);
  builder.searchPipeline.add(lunr.stemmer);
  builder.field('title', { boost: 16 })
  builder.field('search_keywords', { boost: 14 })
  builder.field('tags', { boost: 11 })
  builder.field('excerpt', { boost: 8 })
  builder.field('categories', { boost: 6 })
  builder.field('content_excerpt', { boost: 4 })
  builder.field('cjk_terms', { boost: 14 })
  builder.ref('id')

  var at = 0;
  var slice = function () {
    var began = Date.now();
    for (; at < store.length && Date.now() - began < SLICE_MS; at++) {
      var rawTags = store[at].tags;
      var indexTags = Array.isArray(rawTags)
        ? rawTags.map(function(t) { return String(t || '').replace(/^[^\p{L}]+/u, ''); }).join(' ')
        : String(rawTags || '').replace(/^[^\p{L}]+/u, '');
      builder.add({
        title: store[at].title,
        excerpt: store[at].excerpt,
        content_excerpt: store[at].content_excerpt,
        categories: store[at].categories,
        tags: indexTags,
        search_keywords: store[at].search_keywords,
        cjk_terms: store[at].cjk_terms,
        id: at
      })
    }
    if (at < store.length) { window.setTimeout(slice, 0); return; }
    idx = builder.build();
    if (searchWhenReady) { var run = searchWhenReady; searchWhenReady = null; run(); }
  };
  slice();
}());

function searchHasHanText(value) {
  return SEARCH_HAN_PATTERN.test(String(value || ""));
}

function searchExtractHanRuns(value) {
  return String(value || "").match(SEARCH_HAN_RUN_PATTERN) || [];
}

function searchBuildCjkQueryTerms(value) {
  var seen = {};
  var terms = [];
  var runs = searchExtractHanRuns(value);

  runs.forEach(function(run) {
    var text = String(run || "");
    if (!text) return;

    if (text.length === 1) {
      if (!seen[text]) {
        seen[text] = true;
        terms.push(text);
      }
      return;
    }

    if (!seen[text]) {
      seen[text] = true;
      terms.push(text);
    }

    for (var index = 0; index < text.length - 1; index++) {
      var bigram = text.slice(index, index + 2);
      if (!seen[bigram]) {
        seen[bigram] = true;
        terms.push(bigram);
      }
    }
  });

  return terms;
}

function searchEscapeRegExp(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function searchCollectHighlightTerms(query) {
  var seen = {};
  var terms = [];
  var latinTerms = String(query || "")
    .toLowerCase()
    .split(lunr.tokenizer.separator)
    .map(function(token) { return token.trim(); })
    .filter(Boolean);

  latinTerms.forEach(function(term) {
    if (term.length < SEARCH_MIN_LATIN_LENGTH || searchHasHanText(term) || seen[term]) return;
    seen[term] = true;
    terms.push(term);
  });

  searchExtractHanRuns(query).forEach(function(run) {
    if (!run) return;
    if (!seen[run]) {
      seen[run] = true;
      terms.push(run);
    }

    if (run.length > 1) {
      for (var index = 0; index < run.length - 1; index++) {
        var bigram = run.slice(index, index + 2);
        if (!seen[bigram]) {
          seen[bigram] = true;
          terms.push(bigram);
        }
      }
    }
  });

  return terms.sort(function(left, right) {
    return right.length - left.length;
  });
}

// The passage a result was found by, as written (searchHighlightText escapes it): the sentence in
// its text around the first word asked for, cut to about `limit` characters, each cut marked. A
// result found only by its title, its line or its tags has no such passage, and shows none: the
// opening of a page says nothing of why it was found.
function searchContextSnippet(text, terms, limit) {
  var value = String(text || "").replace(/\s+/g, " ").trim();
  if (!value || !terms.length) return "";
  var at = -1;
  var length = 0;
  // Chosen by a word that carries meaning: "of" in "naming of light" chose any sentence with "of".
  var meant = terms.filter(function(term) {
    return searchHasHanText(term) || !!lunr.stopWordFilter(new lunr.Token(term.toLowerCase()));
  });
  (meant.length ? meant : terms).forEach(function(term) {
    var pattern = searchHasHanText(term)
      ? new RegExp(searchEscapeRegExp(term))
      : new RegExp("(^|[^\\p{L}\\p{N}])" + searchEscapeRegExp(term), "iu");
    var match = value.match(pattern);
    if (!match) return;
    var index = match.index + (searchHasHanText(term) ? 0 : match[1].length);
    if (at < 0 || index < at) { at = index; length = term.length; }
  });
  if (at < 0) return "";

  // The sentence it sits in.
  var start = 0;
  var stop = value.length;
  var before = value.slice(0, at);
  var ended = before.match(/.*[.!?。！？]\s*/);
  if (ended) start = ended[0].length;
  var after = value.slice(at + length).search(/[.!?。！？]/);
  if (after >= 0) stop = at + length + after + 1;
  // A sentence ending inside a quotation keeps its close.
  while (stop < value.length && /["'”’」』）)]/.test(value.charAt(stop))) stop++;

  // A long sentence begins near the word, so that two lines on a phone still hold it; then it is
  // cut, at a space where there is one, about `limit` characters on.
  // Widths count a Han character as two Latin letters, as it sets.
  var width = function(a, b) {
    var text = value.slice(a, b);
    return text.length + (text.match(SEARCH_HAN_RUN_PATTERN) || []).join("").length;
  };
  if (width(start, stop) > 90 && width(start, at) > 40) {
    var from = at;
    while (from > start && width(from, at) < 40) from--;
    var space = value.lastIndexOf(" ", from);
    if (space > from - 20) from = space + 1;
    start = Math.max(start, from);
  }
  if (stop - start > limit) {
    var to = start + limit;
    var end = value.lastIndexOf(" ", to);
    if (end > at + length) to = end;
    stop = to;
  }

  var passage = value.slice(start, stop).trim();
  var open = start > 0 && !/[.!?。！？]\s*$/.test(value.slice(0, start)) ? "…" : "";
  var close = stop < value.length && !/[.!?。！？]["'”’」』）)]*$/.test(passage) ? "…" : "";
  return open + passage + close;
}

// Every word asked for marked in one pass over the text as written, then escaped. Marking one word at
// a time over markup already marked put a later word inside an earlier mark ("light" in
// class="search-highlight"), a Han bigram inside another's, a word inside an entity.
function searchHighlightText(text, terms) {
  var raw = String(text || "");
  if (!raw) return "";
  var words = (Array.isArray(terms) ? terms : []).filter(Boolean).map(searchEscapeRegExp);
  if (!words.length) return searchEscapeHtml(raw);
  return raw.split(new RegExp("(" + words.join("|") + ")", "gi")).map(function(piece, index) {
    return index % 2 ? '<mark class="search-highlight">' + searchEscapeHtml(piece) + '</mark>' : searchEscapeHtml(piece);
  }).join("");
}

// What the results say of themselves (a status, or how many were found), said
// to a screen reader in #results-live: the results are not themselves a live region.
function searchAnnounce(text) {
  var live = document.getElementById('results-live');
  if (live) live.textContent = text;
}

function searchRenderStatus(resultdiv, statusText) {
  resultdiv.innerHTML = '';
  resultdiv.insertAdjacentHTML('beforeend', '<p class="results__status">' + searchEscapeHtml(statusText) + '</p>');
  searchAnnounce(statusText);
}

function searchRenderResultsFound(resultdiv, totalCount, renderedCount) {
  var foundText = totalCount + (totalCount === 1 ? ' result' : ' results');
  if (totalCount > renderedCount) {
    foundText += ' · the first ' + renderedCount + ' shown';
  }
  resultdiv.insertAdjacentHTML('afterbegin', '<p class="results__found">' + searchEscapeHtml(foundText) + '</p>');
  searchAnnounce(foundText);
}

(function() {
  var searchInput = document.querySelector('input#search');
  if (!searchInput) return;

  var searchDebounceTimer = null;
  var runSearch = function(rawQuery) {
    var resultdiv = document.getElementById('results');
    var normalizedQuery = String(rawQuery || "").trim().toLowerCase();
    var hasHan = searchHasHanText(normalizedQuery);
    var compactQueryLength = normalizedQuery.replace(/\s+/g, "").length;

    if (!normalizedQuery) {
      searchRenderStatus(
        resultdiv,
        '{{ site.data.ui-text[site.locale].search_start_typing | default: "Start typing to search..." }}'
      );
      return;
    }

    if ((!hasHan && compactQueryLength < SEARCH_MIN_LATIN_LENGTH) || (hasHan && compactQueryLength < SEARCH_MIN_HAN_LENGTH)) {
      searchRenderStatus(
        resultdiv,
        '{{ site.data.ui-text[site.locale].search_start_typing | default: "Start typing to search..." }}'
      );
      return;
    }

    // The index is still being built (it began when the panel opened): say so, and
    // answer whatever stands in the field once it is ready.
    if (!idx) {
      searchRenderStatus(resultdiv, '{{ site.data.ui-text[site.locale].search_indexing | default: "Preparing search…" }}');
      searchWhenReady = function () { runSearch(searchInput.value); };
      return;
    }

    var latinTerms = normalizedQuery
      .split(lunr.tokenizer.separator)
      .map(function(term) { return term.trim(); })
      .filter(Boolean);
    var cjkTerms = searchBuildCjkQueryTerms(normalizedQuery);
    var result =
      idx.query(function (q) {
        latinTerms.forEach(function (term) {
          if (!term || searchHasHanText(term)) return;
          q.term(term, { boost: 100 })
          if (normalizedQuery.lastIndexOf(" ") !== normalizedQuery.length - 1) {
            q.term(term, { usePipeline: false, wildcard: lunr.Query.wildcard.TRAILING, boost: 10 })
          }
          if (term.length >= SEARCH_MIN_LATIN_LENGTH) {
            q.term(term, { usePipeline: false, editDistance: 1, boost: 1 })
          }
        })

        cjkTerms.forEach(function(term) {
          q.term(term, { fields: ['cjk_terms'], usePipeline: false, boost: 40 })
        });
      });

    if (!result.length) {
      searchRenderStatus(
        resultdiv,
        '{{ site.data.ui-text[site.locale].search_no_results | default: "No results found." }}'
      );
      return;
    }

    var highlightTerms = searchCollectHighlightTerms(normalizedQuery);
    var renderedResults = result.slice(0, SEARCH_MAX_RENDERED_RESULTS);

    resultdiv.innerHTML = '';
    searchRenderResultsFound(resultdiv, result.length, renderedResults.length);

    for (var itemIndex = 0; itemIndex < renderedResults.length; itemIndex++) {
      var ref = renderedResults[itemIndex].ref;
      var entry = store[ref];
      if (!entry) continue;

      var safeUrl = searchEscapeHtml(entry.url || "#");
      var safeTeaser = searchEscapeHtml(entry.teaser || "");
      var visibleExcerpt = searchGetDisplayExcerpt(entry);
      var trimmedExcerpt = searchTrimExcerpt(visibleExcerpt, 20);
      var excerptContent = trimmedExcerpt || "";
      var excerptMarkup = excerptContent
        ? '<p class="archive__item-excerpt" itemprop="description">' +
            searchHighlightText(excerptContent, highlightTerms) +
          '</p>'
        : '';
      var tagsMarkup = searchRenderTags(entry);
      var highlightedTitle = searchHighlightText(entry.title || "", highlightTerms);
      var resultType = entry.result_type || searchGetResultTypeMeta(entry.collection);
      var resultTypeLabel = searchEscapeHtml(resultType.label || "Other");
      var resultTypeClass = String(resultType.className || "other").replace(/[^a-z0-9_-]/gi, "").toLowerCase();
      var resultTypeIconClass = searchEscapeHtml(resultType.iconClass || "fa-solid fa-cat");
      var typeMarkup = '<span class="search-result__type search-result__type--' + resultTypeClass + '" title="' + resultTypeLabel + '" aria-label="' + resultTypeLabel + '">' +
        '<i class="' + resultTypeIconClass + '" aria-hidden="true"></i>' +
        '<span class="search-result__type-label">' + resultTypeLabel + '</span>' +
      '</span>';
      // Shown only where it says more than the result's own line.
      var snapshotText = searchContextSnippet(entry.content_excerpt, highlightTerms, 170);
      var snapshotPlain = snapshotText.replace(/…/g, "").trim().toLowerCase();
      if (snapshotPlain && excerptContent.toLowerCase().indexOf(snapshotPlain) >= 0) snapshotText = "";
      var snapshotMarkup = snapshotText
        ? '<p class="search-result__snapshot" itemprop="abstract">' + searchHighlightText(snapshotText, highlightTerms) + '</p>'
        : '';
      var teaserMarkup = entry.teaser
        ? '<div class="archive__item-teaser"><img src="' + safeTeaser + '" alt=""></div>'
        : '';

      var searchitem =
        '<div class="list__item">'+
          '<article class="archive__item" itemscope itemtype="https://schema.org/CreativeWork">'+
            '<div class="search-result__header">'+
              '<div class="search-result__heading">'+
                '<h2 class="archive__item-title" itemprop="headline">'+
                  '<a href="' + safeUrl + '" rel="permalink">' + highlightedTitle + '</a>'+
                '</h2>'+
                typeMarkup+
              '</div>'+
            '</div>'+
            teaserMarkup+
            excerptMarkup+
            snapshotMarkup+
            tagsMarkup+
          '</article>'+
        '</div>';
      resultdiv.insertAdjacentHTML('beforeend', searchitem);
    }
  };

  var scheduleSearch = function(query) {
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }
    searchDebounceTimer = window.setTimeout(function() {
      runSearch(query);
    }, SEARCH_DEBOUNCE_MS);
  };

  searchInput.addEventListener('input', function () {
    scheduleSearch(this.value);
  });

  runSearch(searchInput.value);
}());
