# Should Palette's and Reverie's cards show three colours while their photograph loads?

**Asked:** 2026-10-01 · **Status:** answered · **Stage:** 11

## Why it was asked

A reader's review, relayed by the owner, in the reader's words:

> 书页里的照片在加载完成前，先显示一张很小的模糊缩略图。你看到的是一团带着照片颜色的柔光，然后清晰的照片再"显影"出来。
>
> Palette 和 Reverie 的照片卡片没有这一步：加载前只是一个深色空框，照片到了再直接出现。网速正常时几乎察觉不到，网慢或往下快速滚动时，就会看到一排黑框，和书页的体验不一致。
>
> 改动确实小。卡片用的颜色数据里，每张照片已经带着一个 strip 字段，是这张照片从上到下的三个颜色。卡片的图片框可以直接用这三个色做一个渐变背景：不用新增任何图片请求，加载前就是这张照片自己的颜色。大约改两三行（cards.js 的 card() 加一个 style，_colour.scss 里去掉 background: none）。

The owner asked for the review to be audited before anything is built: does it have merit, can its
fix be done, what speaks for and against, and whether to proceed.

## The tests

- "Reuse the site's own mechanism before writing a parallel one" (`PRINCIPLES.md`).
- The cards should behave as the book does: the review's own standard.
- Nothing a reader loads grows for it.

## What was tried

**The review's three claims, against the code and the live site.**

| Claim | Found | Holds? |
|---|---|---|
| The book shows a blurred placeholder and the print develops over it | `_includes/photobook/frame.html:20`, `assets/js/photobook/develop.js` | Yes |
| The cards have no such step: an empty dark frame | True until 2026-10-01 01:06, when 30d8301 ("Let Palette and Reverie prints develop over their blur, as the book's do") gave each card its ThumbHash placeholder. That commit is on `origin/master`; the live `cards.js` holds it, and the live `palettes.json` carries a hash for 633 of 633 photographs | No longer |
| The cards' data carries `strip`; two or three lines would do it | `palettes.json`, which Palette's cards read, has no `strip` (0 of 633). `colour-atlas.json`, which Reverie and Drift read, has it (633 of 633). `background: none` is no longer in `_colour.scss` | Half: not for Palette without adding data |

**With every photograph held back** (requests to the image host never answered), on the built site,
in Chromium and in Safari's engine: 36 of 36 Palette cards and 29 of 29 Reverie cards show their
placeholder, at 390 and at 1440.

**One card drawn three ways** (the empty frame, the review's three colours, the blur that ships):
the three colours give the right mood and no shape; the blur gives the picture's own masses, and is
byte for byte the book's.

**What the trial found that the review did not.**

- In Safari's engine the placeholder draws with a visible grid of blocks, on the book and the cards
  alike (F047). Chromium draws it smooth. Not yet looked at on a real iPhone.
- When a photograph fails outright, WebKit draws its broken-image mark over a card's placeholder; the
  book shows none (F048).
- After a fast scroll, Palette's cards are at 9% opacity for the first tenth of a second and take
  about a second to arrive: the scroll reveal. On a slow line this is likely the "row of dark frames"
  the reader saw, placeholder or no placeholder (F049).

## What was learned

The review was right about the fault and a day late: the fault was fixed hours before, with the
book's own mechanism and not a second one. Its fix would now make the cards differ from the book
again. A review is audited against the live site first: half of this one was already history.

## What it led to

**Not built.** For: no decoding, no added data for Reverie. Against: a second placeholder beside the
book's; Palette would need `strip` added to its data; less faithful than what ships; nothing to gain.

In its place, three findings from the trial, and one journey to keep the fix that shipped:

1. A journey: with the photographs held back, every Palette and Reverie card shows a placeholder
   (stage 11; tier 0).
2. F047, the blocks in Safari's engine: looked at on a real iPhone first, then tried (a soft blur on
   the placeholder, or a larger one), for the book and the cards together (stage 11; tier 1).
3. F048, the broken-image mark: hide the image on error (stage 1; tier 0).
4. F049, the scroll reveal on a fast scroll: a taste call for the owner, with the two behaviours
   side by side (stage 11; tier 2).
