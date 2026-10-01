# Stage 1 · Foundations: unseen fixes

**Status:** planned · **Tier:** 0 throughout. Anything that turns out to move a pixel leaves this
stage and goes to the queue.

## Goal

A faster, steadier site that looks exactly the same. Every item is a finding from the
[2026-10-01 audit](../findings/2026-10-01-ui-audit.md); ids refer to it.

## Scope

**Weight**
- [ ] S01 · Posts, Tags and related cards defer their covers; run the 13 covers without renditions
      through `npm run covers`.
- [ ] S05 · One placeholder per frame in the Photobook, not two.
- [ ] S06 · Drift sizes for contain, not cover. One line.
- [ ] S03 · Search loads when the panel is first opened.
- [ ] S04 · The search index is built ahead, not on the first keystroke.
- [ ] S07 · Home paints one door plate, at 1920.
- [ ] S09 · CMU Serif self-hosted.
- [ ] S10 · Home's hero: a smaller rendition, preloaded.
- [ ] S11 · Lightbox prefetch: none on touch, sized from the mat, cancelled when passed.
- [ ] S13 · Reverie's first print opens at once.
- [ ] S14 · The map starts when near, and loads tiles once.
- [ ] S15 · Inline `code` loses its backdrop blur.

**Behaviour**
- [ ] X01 · The masthead stops opening on every touch and focus.
- [ ] X02 · The opening scene yields to Tab and the pointer.
- [ ] X04 · Reverie: fast stepping neither repeats nor stacks history.
- [ ] X07 · Lightbox and Drift leave the browser's shortcuts alone.
- [ ] X08 · The lightbox shows the frame's placeholder while its picture loads.
- [ ] X10 · Tarot cards are inert while search is open.
- [ ] X12 · In-page links change the address, move focus and respect reduced motion.
- [ ] X13 · The table of contents hands scroll back to the page.
- [ ] X16 · No focus on things that cannot be seen.
- [ ] X17 · Palette's glide yields to the reader; key repeat ignored.
- [ ] X18 · State changes are announced.
- [ ] X19 · Reduced motion and motion-off honoured everywhere.

**Content**
- [ ] P04 · The privacy page says what the site does.
- [ ] P05 · Home's tail: zero the padding. (Whether Home wants footer links is tier 2.)
- [ ] P12 · The 404's video fits; headings retagged.

## Not in this stage

X03 and X11 (phone-only visual changes: Q5 in the queue). X05, an honest empty state for Reverie,
is a new look: tier 2. S02, S08, S12 are larger and sit in stage 9.

## Design notes

- Each fix adds or extends a journey in `scripts/check-journeys.mjs` where a reader would notice
  it breaking again: search opening (S03), the lightbox keys (X07), Back in Reverie (X04).
- S01 and S05 change what the build emits; confirm with the budget numbers in
  [0004](../decisions/0004-budgets-that-only-fall.md) before and after.
- Order: S06, S15, P04 first (minutes each), then S01 and S05 (the two largest wins), then the rest.

## Exit

`npm run gate:full` passes with **no baseline re-captured**. The reviewer returns PASS. The audit's
Status column is updated for every id above.
