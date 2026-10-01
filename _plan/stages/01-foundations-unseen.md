# Stage 1 · Foundations: unseen fixes

**Status:** building · **Tier:** mostly 0. The owner marked every finding here Fix on 2026-10-01, so a fix
that a reader can notice (tier 1), or that cuts words (tier 2), goes ahead on that mark, shown in the digest.
A fix whose direction is in doubt still goes to the queue.

## Goal

A faster, steadier site that looks exactly the same. Every item is a finding from the
[2026-10-01 audit](../findings/2026-10-01-ui-audit.md); ids refer to it.

## Scope

**Weight**
- [x] S01 · Posts, Tags and related cards defer their covers.
- [ ] S01, second half · The 13 post covers with no smaller rendition: `generate-cover-sizes.mjs` reads
      only `images/cover/`. Moves to stage 9 with S02.
- [ ] S05 · One placeholder per frame in the Photobook, not two.
- [x] S06 · Drift sizes for contain, not cover. One line.
- [ ] S03 · Search loads when the panel is first opened.
- [ ] S04 · The search index is built ahead, not on the first keystroke.
- [ ] S07 · Home paints one door plate, at 1920.
- [ ] S09 · CMU Serif self-hosted.
- [ ] S10 · Home's hero: a smaller rendition, preloaded.
- [ ] S11 · Lightbox prefetch: none on touch, sized from the mat, cancelled when passed.
- [ ] S13 · Reverie's first print opens at once.
- [ ] S14 · The map starts when near, and loads tiles once.
- [x] S15 · Inline `code` loses its backdrop blur.

**Behaviour**
- [x] X05 · A colour no photograph holds opens on the closest one (the owner's note: the most adjacent match,
      never nothing). Its count line still reads "only this photograph… for now": the words are the owner's.
- [x] X06 · The monogram no longer logs.
- [x] X01 · The masthead stops opening on every touch and focus.
- [x] X02 · The opening scene yields to Tab and the pointer.
- [x] X04 · Reverie: fast stepping neither repeats nor stacks history.
- [x] X07 · Lightbox and Drift leave the browser's shortcuts alone. The owner's note ("change to not
      conflicting shortcuts") was read as: stop conflicting. No key was changed; if new keys were meant, say so.
- [ ] X08 · The lightbox shows the frame's placeholder while its picture loads.
- [x] X10 · Tarot cards are inert while search is open.
- [x] X12 · In-page links change the address, move focus and respect reduced motion.
- [x] X13 · The table of contents hands scroll back to the page.
- [x] X16 · No focus on things that cannot be seen.
- [x] X17 · Palette's glide yields to the reader; key repeat ignored.
- [ ] X18 · State changes are announced.
- [x] X19 · Reduced motion and motion-off honoured by the map's zooms and reset, the lightbox's mount and the treatise.
- [ ] X19, the rest · The map's keyboard pans and `panTo` still ease (F039).
- [ ] X10, X16 · 2026-10-01 · Their journeys: tarot corners take no click with search open (X10); a folded
      specs panel takes no Tab (X16). Both fixes shipped without one. Tier 0.
- [ ] P01, the deep-link half · 2026-10-01 · `/reverie/?…#colour` did not open the lightbox on load in the
      audit's browser. Confirm it on a served site first: it was seen in one pane only. If it is real, fix it
      and extend the `reverie` journey. Tier 0. The colour frame's size, the rest of P01, is not in this stage.
- [ ] 2026-07-28 · Search: a result's snapshot double-escapes `<` and shows `&lt;!` (search "porto": the
      Voyage index's result). Not on the audit, so not under the owner's mark: tier 1, a fault whose right
      look is not in doubt. The text is escaped once in `assets/js/lunr/lunr-store.js` and again by
      `searchHighlightText()` in `assets/js/lunr/lunr-en.js`: mend one side, not both. Then check a text
      with a real `<`, a Chinese query, a highlighted term, and the Voyage result. Sits with S03 and S04.

**More, marked Fix**
- [ ] X15 · Home's door list hovers evenly.
- [ ] X21 · Small lightbox edges: the opening morph, a one-frame slideshow, fullscreen Escape, pinch on the specs.
- [ ] X22 · The masthead does not fade in from nothing on every page change.

**Approved, phone only**
- [ ] P10 · The phone lightbox in landscape; the cover's facts do not wrap mid-value.
- [ ] X03 · Long post titles wrap on a phone.
- [ ] X11 · The subscribe field is 16 px on touch.

**Content**
- [x] P04 · The privacy page no longer describes tracking the site does not do.
- [ ] P04, second half · One sentence on what it does do (Cloudflare Web Analytics, no cookies): the owner's words.
- [ ] P05 · Home's tail: zero the padding. (Whether Home wants footer links is tier 2.)
- [ ] P12 · The 404's video fits; headings retagged.
- [ ] X05, second half · 2026-10-01 · Reverie's count line for a colour no photograph holds still reads
      "QSD reveries in only this photograph… for now", though the photograph shown is the closest one,
      not one that holds the colour. The words are the owner's.
- [ ] P04 · 2026-10-01 · `/terms/`'s `seo_description` still mentions comments. Cut the word on the P04
      mark; add nothing.
- [ ] 2026-09-29 · SEO. Not on the audit, so not under the owner's mark. Portfolio stubs out of
      `sitemap.xml`: tier 0. Venice is in it too, but the owner chose to leave Venice as it is (stage 4):
      ask before taking it out. `/utils/`'s description is thin: its words are the owner's.
- [ ] 2026-09-29 · Jianfei's table overflows by 1 px. Not on the audit: tier 0. Confirm it still does;
      the treatise's styles changed on 2026-10-01.

## Not in this stage

S02, S08, S12 are larger and sit in stage 9. X03 and X11 (phone-only visual changes) were approved on
2026-10-01 and are next here.

## Design notes

- Each fix adds or extends a journey in `scripts/check-journeys.mjs` where a reader would notice
  it breaking again: search opening (S03), the lightbox keys (X07), Back in Reverie (X04).
- S01 and S05 change what the build emits; confirm with the budget numbers in
  [0004](../decisions/0004-budgets-that-only-fall.md) before and after.
- Order: S06, S15, P04 first (minutes each), then S01 and S05 (the two largest wins), then the rest.

## Exit

`npm run gate:full` passes. A baseline is re-captured only for a page a fix was meant to change, named in
the changelog. The reviewer returns PASS. The audit's Status is updated for every id above.

## Log

- 2026-10-01 · First batch: S01, S06, S15, X01, X02, X04, X05, X06, X07, X10, X12, X13, X16, X17, X19, P04.
  Baselines re-captured for two pages: the treatise (its abstract now shows under motion-off) and the
  notices post (the code blur's halo is gone). The reviewer blocked the first pass on three faults
  (Escape in Drift with search open; the wheel's focus move; no journey for the masthead), all fixed, and
  five journeys were added.
