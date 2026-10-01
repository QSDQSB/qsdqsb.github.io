# Stage 7 · Protecting the pictures

**Status:** idea. Blocked on Q7 in the [queue](../QUEUE.md). **Tier:** 2.

## Goal

Not yet stated. It depends on what is being prevented: casual saving, reuse in print, or scraping.

## What is true today

- Renditions are public at `img.qsdqsb.com`, up to 4096 px, cached for a year. The owner chose to
  keep the 4096 tier.
- Manifests are private; the build reads them with a key.
- Nothing discourages a right-click save or a drag.
- Capture times are in the page data, though never shown as clock times.

## Options, by what they cost

| Option | Stops | Costs |
|---|---|---|
| No context menu, no drag, a transparent layer | Casual saving | An hour. Stops nobody determined; can annoy. |
| Cap the public tier (say 2560) | Print-quality reuse | The 4096 tier. Lightbox zoom gets softer. |
| Signed or referrer-checked image URLs | Hot-linking, simple scraping | A Worker in front of R2; cache behaviour changes. |
| A visible mark on large tiers | Uncredited reuse | Reprocessing every photograph: an R2 write. Changes the look. |
| An invisible watermark | Proves origin after the fact | Reprocessing; proves, does not prevent. |
| `robots` and AI-crawler rules, a licence line | Well-behaved crawlers | Minutes. Honoured only by those who honour it. |

## Hard rules that apply

Any reprocessing is a write to R2: the owner's go, every time.

## Exit

Not written until the goal is.
