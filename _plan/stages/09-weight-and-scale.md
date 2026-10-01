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
- [ ] Page bundles, if `main.css` is still over 200 KB raw after stage 2.

## Design notes

- S08 changes how icons are drawn. If any glyph looks different it is tier 1 and is shown.
- Measure paint timings by hand in a visible browser before and after S02 and S08; the audit could
  not (its browser pane was hidden).

## Exit

Every budget in 0004 is lower than on 2026-10-01 and the checker is in the gate.
