---
title: "Terminology, by QSD."
date: 2025-02-02
permalink: /posts/terminology/
redirect_from:
  - /posts/2025/terminology/
excerpt: "Intepretation and misintepretation of this world."
tags:
  - 🧼QSD's Philosophy
  - 😻Happy Moments
  - 🗒TODO
header:
  overlay_image: Legotypewriter1-3v1.jpg
  overlay_filter: 0.4
---

## TERMINOLOGIES
{: .barlow}

#TODO

<!-- 
### Wands
{: .barlow}

### Pentacles
{: .barlow}

### Cups
{: .barlow}

### Swords
{: .barlow} 

#### 谷歌街景感 / Google Street View Vibe
{: .barlow}
-->

## List of Intriguing Words
{: .barlow}

<div class="card_grid_view">
  {% assign intriguing_words = site.data.words %}
  <!-- Randomly reshuffle -->
  {% assign intriguing_words = intriguing_words | sample: intriguing_words.size %}
    {% for sample_word in intriguing_words %}
    <div class="word_card">
        <h1 lang="{{ sample_word.language | default: 'en' }}" translate="no">{{ sample_word.title }}</h1>
        <p>{{ sample_word.description }}</p>
    </div>
    {% endfor %}
</div>