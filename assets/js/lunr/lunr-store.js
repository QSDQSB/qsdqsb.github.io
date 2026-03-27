---
layout: none
---

{%- assign liquid_tag_open = "{" | append: "%" -%}
{%- assign liquid_tag_close = "%" | append: "}" -%}
{%- assign liquid_output_open = "{" | append: "{" -%}
{%- assign liquid_output_close = "}" | append: "}" -%}
var store = [
  {%- assign search_entry_started = false -%}
  {%- for c in site.collections -%}
    {%- assign docs = c.docs | where_exp:'doc','doc.search != false' -%}
    {%- for doc in docs -%}
      {%- capture searchable_content -%}
        {%- assign liquid_tag_chunks = doc.content | split: liquid_tag_open -%}
        {%- for liquid_tag_chunk in liquid_tag_chunks -%}
          {%- assign liquid_tag_stripped = liquid_tag_chunk | split: liquid_tag_close | last -%}
          {%- assign liquid_output_chunks = liquid_tag_stripped | split: liquid_output_open -%}
          {%- for liquid_output_chunk in liquid_output_chunks -%}
            {{ liquid_output_chunk | split: liquid_output_close | last }}
          {%- endfor -%}
        {%- endfor -%}
      {%- endcapture -%}
      {%- capture display_excerpt -%}{{ doc.description | default: doc.excerpt | markdownify | strip_html | strip_newlines }}{%- endcapture -%}
      {%- capture content_excerpt -%}
        {%- if site.search_full_content == true -%}
          {{ searchable_content | markdownify | strip_html | strip_newlines }}
        {%- else -%}
          {{ searchable_content | markdownify | strip_html | strip_newlines | truncatewords: 50 }}
        {%- endif -%}
      {%- endcapture -%}
      {%- if doc.header.teaser -%}
        {%- capture teaser -%}{{ doc.header.teaser }}{%- endcapture -%}
      {%- else -%}
        {%- assign teaser = site.teaser -%}
      {%- endif -%}
      {%- assign search_collection = doc.collection | default: "pages" -%}
      {%- if search_collection == "posts" -%}
        {%- assign tag_palette = site.data.tag_colours.post_tag_colours -%}
        {%- assign tag_base_path = site.tag_archive.path | relative_url -%}
      {%- else -%}
        {%- assign tag_palette = site.data.tag_colours.voyage_tag_colours -%}
        {%- assign tag_base_path = site.tag_voyage.path | relative_url -%}
      {%- endif -%}
      {%- if search_entry_started -%},{%- endif -%}
      {
        "title": {{ doc.title | jsonify }},
        "collection": {{ search_collection | jsonify }},
        "excerpt": {{ display_excerpt | jsonify }},
        "content_excerpt": {{ content_excerpt | strip | jsonify }},
        "categories": {{ doc.categories | jsonify }},
        "tags": {{ doc.tags | jsonify }},
        "search_keywords": {{ doc.search_keywords | jsonify }},
        "search_tags": [
          {%- for tag in doc.tags -%}
            {%- assign tag_colour = tag_palette[tag] -%}
            {%- capture tag_url -%}{{ tag_base_path }}#{{ tag | slugify }}{%- endcapture -%}
            {
              "label": {{ tag | jsonify }},
              "url": {{ tag_url | jsonify }},
              "color": {%- if tag_colour -%}{{ tag_colour | append: 'bf' | jsonify }}{%- else -%}""{%- endif -%}
            }{%- unless forloop.last -%},{%- endunless -%}
          {%- endfor -%}
        ],
        "url": {{ doc.url | relative_url | jsonify }},
        "teaser": {{ teaser | relative_url | jsonify }}
      }
      {%- assign search_entry_started = true -%}
    {%- endfor -%}
  {%- endfor -%}
  {%- for doc in site.pages -%}
    {%- unless doc.search == false or doc.url != "/" and doc.url != "/publications/" and doc.url != "/portfolio/" and doc.url != "/talks/" and doc.url != "/cv/" -%}
    {%- capture display_excerpt -%}{{ doc.description | default: doc.excerpt | markdownify | strip_html | strip_newlines }}{%- endcapture -%}
    {%- if doc.layout == "archive" -%}
      {%- assign content_excerpt = "" -%}
    {%- else -%}
      {%- capture searchable_content -%}
        {%- assign liquid_tag_chunks = doc.content | split: liquid_tag_open -%}
        {%- for liquid_tag_chunk in liquid_tag_chunks -%}
          {%- assign liquid_tag_stripped = liquid_tag_chunk | split: liquid_tag_close | last -%}
          {%- assign liquid_output_chunks = liquid_tag_stripped | split: liquid_output_open -%}
          {%- for liquid_output_chunk in liquid_output_chunks -%}
            {{ liquid_output_chunk | split: liquid_output_close | last }}
          {%- endfor -%}
        {%- endfor -%}
      {%- endcapture -%}
      {%- capture content_excerpt -%}
        {%- if site.search_full_content == true -%}
          {{ searchable_content | markdownify | strip_html | strip_newlines }}
        {%- else -%}
          {{ searchable_content | markdownify | strip_html | strip_newlines | truncatewords: 50 }}
        {%- endif -%}
      {%- endcapture -%}
    {%- endif -%}
    {%- if doc.header.teaser -%}
      {%- capture teaser -%}{{ doc.header.teaser }}{%- endcapture -%}
    {%- else -%}
      {%- assign teaser = site.teaser -%}
    {%- endif -%}
    {%- assign search_collection = "pages" -%}
    {%- assign tag_palette = site.data.tag_colours.voyage_tag_colours -%}
    {%- assign tag_base_path = site.tag_voyage.path | relative_url -%}
    {%- if search_entry_started -%},{%- endif -%}
    {
      "title": {{ doc.title | jsonify }},
      "collection": {{ search_collection | jsonify }},
      "excerpt": {{ display_excerpt | jsonify }},
      "content_excerpt": {{ content_excerpt | strip | jsonify }},
      "categories": {{ doc.categories | jsonify }},
      "tags": {{ doc.tags | jsonify }},
      "search_keywords": {{ doc.search_keywords | jsonify }},
      "search_tags": [
        {%- for tag in doc.tags -%}
          {%- assign tag_colour = tag_palette[tag] -%}
          {%- capture tag_url -%}{{ tag_base_path }}#{{ tag | slugify }}{%- endcapture -%}
          {
            "label": {{ tag | jsonify }},
            "url": {{ tag_url | jsonify }},
            "color": {%- if tag_colour -%}{{ tag_colour | append: 'bf' | jsonify }}{%- else -%}""{%- endif -%}
          }{%- unless forloop.last -%},{%- endunless -%}
        {%- endfor -%}
      ],
      "url": {{ doc.url | relative_url | jsonify }},
      "teaser": {{ teaser | relative_url | jsonify }}
    }
    {%- assign search_entry_started = true -%}
    {%- endunless -%}
  {%- endfor -%}
];

function searchNormalizeKeywords(value) {
  if (Array.isArray(value)) {
    return value.map(function(keyword) {
      return String(keyword || "").trim();
    }).filter(Boolean).join(" ");
  }

  if (typeof value === "string") {
    return value.trim();
  }

  return "";
}

function searchExtractCjkTerms(text) {
  var cjkRuns = String(text || "").match(/[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]+/g) || [];
  var seen = {};
  var terms = [];

  cjkRuns.forEach(function(run) {
    var value = String(run || "");
    if (!value) return;

    if (value.length === 1) {
      if (!seen[value]) {
        seen[value] = true;
        terms.push(value);
      }
      return;
    }

    if (!seen[value]) {
      seen[value] = true;
      terms.push(value);
    }

    for (var index = 0; index < value.length - 1; index++) {
      var bigram = value.slice(index, index + 2);
      if (!seen[bigram]) {
        seen[bigram] = true;
        terms.push(bigram);
      }
    }
  });

  return terms;
}

function searchGetContentSnapshot(text) {
  var normalized = String(text || "").replace(/\s+/g, " ").trim();
  if (!normalized) return "";

  var sentenceMatch = normalized.match(/^(.+?[.!?。！？])/);
  if (sentenceMatch) {
    return sentenceMatch[1].trim();
  }

  var clauseMatch = normalized.match(/^(.+?[,:;，；：])/);
  var fallback = clauseMatch ? clauseMatch[1].trim() : normalized;
  if (fallback.length > 140) {
    fallback = fallback.slice(0, 140).trim() + "...";
  }
  return fallback;
}

function searchGetResultTypeMeta(collection) {
  var normalizedCollection = String(collection || "").toLowerCase();

  if (normalizedCollection === "posts") {
    return { label: "Post", className: "post", iconClass: "fa-solid fa-mug-hot" };
  }

  if (normalizedCollection === "voyage" || normalizedCollection === "subvoyage") {
    return { label: "Voyage", className: "voyage", iconClass: "fa-solid fa-cable-car" };
  }

  if (normalizedCollection === "portfolio") {
    return { label: "Portfolio", className: "portfolio", iconClass: "fa-solid fa-helicopter" };
  }

  return { label: "Other", className: "other", iconClass: "fa-solid fa-cat" };
}

for (var searchStoreIndex = 0; searchStoreIndex < store.length; searchStoreIndex++) {
  var searchEntry = store[searchStoreIndex];
  if (!searchEntry) continue;

  var normalizedKeywords = searchNormalizeKeywords(searchEntry.search_keywords);
  searchEntry.search_keywords = normalizedKeywords;

  var cjkSourceParts = [
    searchEntry.title,
    searchEntry.excerpt,
    searchEntry.content_excerpt,
    normalizedKeywords,
    Array.isArray(searchEntry.tags) ? searchEntry.tags.join(" ") : searchEntry.tags,
    Array.isArray(searchEntry.categories) ? searchEntry.categories.join(" ") : searchEntry.categories
  ].filter(Boolean);

  searchEntry.cjk_terms = searchExtractCjkTerms(cjkSourceParts.join(" ")).join(" ");
  searchEntry.content_snapshot = searchGetContentSnapshot(searchEntry.content_excerpt);
  searchEntry.result_type = searchGetResultTypeMeta(searchEntry.collection);
}

var searchTagPalette = {{ site.data.tag_colours.post_tag_colours | jsonify }};
var voyageTagPalette = {{ site.data.tag_colours.voyage_tag_colours | jsonify }};

for (var voyageTag in voyageTagPalette) {
  if (voyageTagPalette.hasOwnProperty(voyageTag)) {
    searchTagPalette[voyageTag] = voyageTagPalette[voyageTag];
  }
}

function searchEscapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, function(character) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;"
    }[character];
  });
}

function searchGetDisplayExcerpt(entry) {
  if (!entry) return "";
  return entry.excerpt || entry.content_excerpt || "";
}

function searchTrimExcerpt(text, limit) {
  var words = String(text || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "";
  if (words.length <= limit) return searchEscapeHtml(words.join(" "));
  return searchEscapeHtml(words.slice(0, limit).join(" ")) + "...";
}

function searchTrimSnapshot(text, limit) {
  var value = String(text || "").trim();
  if (!value) return "";
  if (value.length <= limit) return searchEscapeHtml(value);
  return searchEscapeHtml(value.slice(0, limit).trim()) + "...";
}

function searchRenderTags(entry) {
  if (!entry || !Array.isArray(entry.search_tags) || !entry.search_tags.length) return "";

  var items = entry.search_tags.map(function(tag) {
    var styleAttribute = tag.color ? ' style="--tag-color: ' + searchEscapeHtml(tag.color) + ';"' : "";
    return '<a href="' + searchEscapeHtml(tag.url) + '" class="page__taxonomy-item"' + styleAttribute + ' rel="tag">' +
      searchEscapeHtml(tag.label) +
      '</a>';
  }).join('<span class="sep"> </span>');

  return '<div class="page__taxonomy translucent_border"><i class="fa fa-fw fa-tags" aria-hidden="true"></i><span itemprop="keywords">' +
    items +
    '</span></div>';
}
