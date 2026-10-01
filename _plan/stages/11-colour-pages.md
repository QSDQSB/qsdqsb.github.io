# Stage 11 · The colour pages

**Status:** planned · **Tier:** 0 and 1 for the faults; 2 for the taste calls.

## Goal

Palette, Reverie and Drift finished to the standard of the book they hang beside. They are the
newest pages and the site's most original work; what is left is small and scattered.

## Scope

**Marked Fix on the [audit](../findings/2026-10-01-ui-audit.md)**
- [ ] P01 · Viewing a colour in Reverie, the vat fills the frame (the owner's own observation). The
      lightbox draws its colour frame at a fixed 200×112; Drift sizes its colour from the stage.
- [ ] P08 · A voyage's palette ends with a way on: the next voyage by colour, and this voyage's book.
- [ ] P09 · Drift's small frictions: the tools that flash at load, the title a reduced-motion reader
      never sees, the tap highlight over the photograph, the 10 px place line, a failed load that
      reads like an unbuilt atlas.
- [ ] C13 · Drift's room through the shared wash; the palette list's hover on the shared timing.
- [ ] S13 · The first tap on a Reverie print opens at once.

**Shared with other stages** (listed here so the pages are seen whole; built there)
- C11 · One module for the three pages' keys, way back and rendition choice: stage 9.
- Ridgway with no jump to a plate; the 320 px faults: stage 3.
- Salient colour under-weighted in palettes: with [I001](../ideas/I001-a-palette-shareable-as-an-image.md).

**The owner's taste calls**
- Six small calls, gathered in [`ideas/colour-pages.md`](../ideas/colour-pages.md) with the lead's
  leanings. To be asked as one entry, with a picture of each, when P01 is open.

## What is already decided

[`PRINCIPLES.md`](../PRINCIPLES.md), Colour pages: the chain is book → palette → Reverie; Reverie is
keyed on the colour; the vat is misty; no glass panel on the palette page; one viewer. And from
2026-10-01: a colour no photograph holds shows the most adjacent match, never nothing.

## Journeys

`palette`, `reverie`, `reverie-unheld`, `drift` exist. P01 adds one: a colour's frame opens from its
address (`#colour`), which did not open in the audit's browser.

## Exit

`npm run gate:full` passes; the reviewer returns PASS; P01 is shown to the owner before and after.
