# Stage 9 · Weight and scale

**Status:** planned. Runs beside the others. **Tier:** 0.

## Goal

A site that stays fast as the archive grows. Implements
[0004](../decisions/0004-budgets-that-only-fall.md) and the rest of
[0003](../decisions/0003-stylesheet-organisation.md).

## Scope

- [ ] `scripts/check-budgets.mjs`, with the baseline measured when it is written.
- [ ] S02 · Heroes through the cover renditions, preloaded; the depth texture capped.
- [ ] S08 · Font Awesome replaced by an inline sprite of the glyphs used (about 35).
- [ ] S12 · Each frame's own `sizes`, kept right after a film change.
- [ ] S17 · Scripts loaded where they are used; Photobook modules preloaded.
- [ ] A07 · The colour atlas and `frames.json` sharded by voyage where a page needs one voyage.
- [ ] A06 · The Photobook's four scale limits, or a designed ceiling for a book (in the queue when
      a book nears 100 frames).
- [ ] C11 · One shared module for the colour pages' keys, way back and rendition choice.
- [ ] A04 · Page bundles: a base stylesheet and one per kind of page (marked Fix). After stage 2.
- [ ] S01, second half · Renditions for the 13 post covers outside `images/cover/`.
- [ ] S16 · Three surfaces that repaint for effects that could be composited: measure first.

**From the inbox, sorted 2026-11-27** (tier 0)
- [ ] F058 · `images/posts/all-souls-sun-dial.jpg` is 435 KB at 3250 px for a column of at most
      1200 px, with no smaller rendition for a phone. With S01's second half.
- [ ] F065 · Home's door plates fetch the same bytes as before, only later (Palette's is 1.26 MB): a
      plate is a crop of a wide picture and wants a `sizes` of its own. With S12.
- [ ] F066 · The lightbox, opened from a larger print, still fetches the smaller rendition its mat
      asks for and swaps to it: a wasted fetch. Skipping it changes which file is drawn, so its
      baseline is re-captured with it.
- [ ] F111 · `images/QSDSigils/proclamation-seal.webp` is 78 KB at 720 px and shown at 261 px at
      most: 540 px covers a dense screen.
- F101, F110 · The Chinese font's subset (234 KB on 2026-11-27, shared by the essays and the fables)
  is cut in slices with [stage 6](06-posts-and-about.md)'s batch, where Songti becomes every
  post's face; excerpt-only search for the fables stays here, with A07.

## Design notes

- S08 changes how icons are drawn. If any glyph looks different it is tier 1 and is shown.
- Measure paint timings by hand in a visible browser before and after S02 and S08; the audit could
  not (its browser pane was hidden).

## Exit

Every budget in 0004 is lower than on 2026-10-01 and the checker is in the gate.
