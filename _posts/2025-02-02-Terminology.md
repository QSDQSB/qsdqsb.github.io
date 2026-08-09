---
title: "Terminology, by QSD."
date: 2025-02-02
permalink: /posts/terminology/
redirect_from:
  - /posts/2025/terminology/
excerpt: "Intepretation and misintepretation of this world."
toc: true
toc_sticky: true
toc_label: "Letters"
tags:
  - 🧼QSD's Philosophy
  - 😻Happy Moments
header:
  overlay_image: Legotypewriter1-3v1.jpg
  overlay_filter: 0.4
---

{%- assign sorted_words = site.data.words | sort: "title" -%}
{%- assign current_letter = "" -%}

{%- for word in sorted_words -%}
  {%- assign first_letter = word.title | slice: 0 | upcase -%}
  {%- if first_letter != current_letter -%}
    {%- if current_letter != "" -%}
</div>
    {%- endif -%}
    {%- assign current_letter = first_letter -%}

<h2 class="codex-letter" id="{{ current_letter }}">{{ current_letter }} <span class="codex-letter__word">for {{ word.title }}</span></h2>
<div class="card_grid_view">
  {%- endif -%}
  <a class="word_card word_card--link" href="#{{ first_letter }}">
    <h1 lang="{{ word.language | default: 'en' }}" translate="no">{{ word.title }}</h1>
    <p>{{ word.description }}</p>
  </a>
{%- endfor -%}
</div>
