# Stage 11 · The colour pages

**Status:** planned · **Tier:** 2, answered, for the picks of 2026-11-27 (Q22, Q24, Q25;
[0013](../decisions/0013-what-the-sheets-settled.md)); 0 and 1 for the faults. One batch, one
session, one pull request with pictures; the merge is the yes
([0010](../decisions/0010-the-merge-is-the-yes.md)).

## Goal

Palette, Reverie, Drift and Ridgway's plates finished to the standard of the book they hang beside:
Palette opens on its own dye, a frame's card is a print with its strip, and a plate reads as Ridgway
drew it.

## What is already decided

**Kept as it stands (Q22, Q25; not to be re-proposed):** Palette is a list of bars; its two lists
side by side, the narrow one beside the bars; no doors from Palette to Reverie, Drift and Ridgway; a
voyage's round vat, large at the right of the blocks; Reverie's field at two thirds of the screen,
its code large with the name small at its right end, its nearby colours as small dots; Drift on a
phone as it is.

**The owner, 2026-11-27:**

- Palette's head: "A hero made of the dye" (Q22). On Q21: "prefer B but we should re-design the
  hero-side, maybe we should follow the hero-overlay layout, and decide where to lay the palette
  lists" (R032). On Q25: "I wonder if it makes sense - we add the reverie like dry vat as the hero
  display, and when we switch voyages on palette we switch the background smoothly. The dry vat ball
  should remain. The ball is the visual language for palette (like a real palette colour blend)".
- The title of a voyage's palette: "The small QSD's palette should remain to just Palette".
- A frame's card: "A print with its colour strip"; "Should be C with dry vat ball".
- Ridgway: "Each plate as the book sets it, three plates abreast".
- The Didot italic line: "Playfair upright everywhere" (Q24). Small hex codes: "Barlow" (Q24).

**Standing** ([`PRINCIPLES.md`](../PRINCIPLES.md), Colour pages): the chain is book → palette →
Reverie; Reverie is keyed on the colour; "The vat is misty: a watercolour with no edges. Each photo
card keeps its small vat: the bar is the composition, the vat is the mood."; "No glass panel on the
palette page; the whole room is frosted."; one viewer. A colour no photograph holds shows the most
adjacent match, never nothing. "Dry vat" is read as the dye vat: the lead's reading (0013).

## Scope: batch 5

Tier 2, answered, unless a line says otherwise. Pictures at both widths; the switch between two
voyages as a short capture. Audit ids are sections of `design/audits/stylesheets.md` (S), findings
of `design/audits/reviewer.md` (R) and `design/audits/measured.md` (M).

**Palette's head**
- [ ] Q22, Q25, R032 · Palette opens on a hero made of the dye: the hero-overlay layout, its picture
      the vat's own dye poured across the whole width (the vat can already pour a rectangle:
      `assets/js/colour/vat.js`, `shape: 'rect'`), the title and its line on it as on any hero.
      Choosing a voyage changes the dye smoothly, through the site's own crossfade (the wash) and
      not a second one; at once for a reader who asked for stillness. The round vat stays where it
      is, at the right of the blocks: "The ball is the visual language for palette". The two lists
      stay under the hero as they are (Q25). Without WebGL the hero is the still the vats already
      fall back to (`no-webgl`). The dye as a hero is a shared piece, said in
      `_docs/components.md`: [stage 14](14-shell-and-small-pages.md) takes it for a page with no
      picture of its own.
- [ ] F077 · The vats pour about three a second, so a list fills in for seconds. With a dye across
      the head it must not get worse: the hero's dye first, the list's after. Tier 0, measured
      before and after.
- [ ] Q25, voyage-palette-title · The small label over a voyage's title reads "Palette", not "QSD's
      Palette" (`assets/js/colour/palette.js`, `.palette-page__home`).
- [ ] Q24, italic-lines · The line under Palette's and Ridgway's title is Playfair upright, and so is
      the shared `lede` (`_sass/_components.scss`), which no page then sets in Didot italic. On a
      phone Ridgway's line is the size of a hero's (M9).

**A frame's card**
- [ ] Q25, frame-card-colours · A frame's card is a print with its colour strip: one thin strip
      tight under the photograph, each colour as wide as its share, then the name, and its small
      vat ("with dry vat ball"). No codes and no numbers on the card: a colour's code shows on
      pointing, in Barlow (Q24), and pressing a colour opens its Reverie. F055 (a share that wraps
      at 370 px) goes with the numbers. A post's colour figure draws the same card and changes with
      it: shot on `/posts/in-the-naming-of-light/`.
- [ ] F049 · Whether the cards rise into view, and by how much, is judged on the new card: shown as
      a capture in the same pull request. Until then Palette's frames keep today's amounts.
- [ ] F048 · A photograph that fails to load shows Safari's broken-image mark over its placeholder
      on Palette and Reverie: hide the `img` on error (`assets/js/photobook/develop.js`). Tier 0.

**Ridgway**
- [ ] Q25, ridgway-plate · Each plate as the book sets it: three hues across, seven steps down, every
      colour still named; three plates abreast on a desktop, one to a row on a phone. The page is
      about half as long. A jump to a plate stays stage 3's.

**Marked Fix on the [audit](../findings/2026-10-01-ui-audit.md)**
- [ ] P01 · Viewing a colour in Reverie, the vat fills the frame (the owner's own observation). The
      lightbox draws its colour frame at a fixed 200×112; Drift sizes its colour from the stage.
- [ ] P08 · A voyage's palette ends with a way on: the next voyage by colour, and this voyage's book.
- [ ] P09 · Drift's small frictions: the tools that flash at load, the title a reduced-motion reader
      never sees, the tap highlight over the photograph, the 10 px place line, a failed load that
      reads like an unbuilt atlas. With R23: on a phone its sun line breaks mid-phrase.
- [ ] C13 · Drift's room through the shared wash; the palette list's hover on the shared timing.
- [ ] S13 · The first tap on a Reverie print opens at once.

**Brought into line with 0012, in these files** (tier 1; S is the audit to open)
- [ ] What is on is a hairline: the current voyage in the narrow list (a fill today) takes the pale
      brass; the order button's grey underline takes the warm one (S, C; M20). A ring that means
      both "on" and "focused" is parted: `brass-focus` for the keyboard (S, E).
- [ ] 10 px corners on the list's rows and the fold (S, D; M21). Hand-set labels onto `eyebrow`, none
      under 11 px (S, A5, H13). A voyage's name in the narrow list is Playfair, as in the list of
      bars beside it (S, A3: the lead's reading of "a name is set in the serif", shown).
- [ ] No arrows after the ways on (Q25). Tap sizes on a phone: a card's place line, the way home,
      "Voyages", Drift's thread dot (M22).
- [ ] F056 · The colour plate's corner, ground and shadow are literals in a page's partial: the
      `card` piece's own (S, H9, F). Tier 0.
- [ ] F095 · Drift's title takes the shared `display-title`.
- [ ] F059 · In Playwright's WebKit, Back from Reverie to a post lands at the top; Chromium keeps
      the place. Confirm on a real Safari, then mend. Tier 0.

**Shared with other stages** (listed here so the pages are seen whole; built there)
- C11 · One module for the three pages' keys, way back and rendition choice: stage 9.
- Ridgway's jump to a plate; the 320 px faults: stage 3.
- Salient colour under-weighted in palettes; a link preview for each voyage's palette (F038): with
  [I001](../ideas/I001-a-palette-shareable-as-an-image.md), [stage 8](08-palette-as-image.md).
- Drift under its viewer takes no ending: [stage 14](14-shell-and-small-pages.md).

**The owner's taste calls**
- The six gathered in [`ideas/colour-pages.md`](../ideas/colour-pages.md). Two are settled by the
  sheets: the dye on a phone is kept at two thirds (Q25), and the space under the palette's title
  goes with the new head. The other four are still to be asked as one entry, with a picture of
  each, when P01 is open.

## Shared pieces

Uses: the vat, the wash, `card`, `eyebrow`, `onward-links`, `brass-focus`, the hover tip. New: the
dye as a hero (grammar: a second page takes it in stage 14).

## Journeys

`palette`, `reverie`, `reverie-unheld`, `drift` and `no-webgl` must pass. To add: `palette-hero` (the
head is the dye; choosing a second voyage changes it and the round vat is still there; with motion
off the change is at once); `palette-card` (a colour on a card opens its Reverie, and a keyboard can
reach it); `ridgway` (a plate holds three hues by seven steps, every colour named; it has no journey
today). P01 adds one: a colour's frame opens from its address (`#colour`).

## Exit

`npm run gate:full` passes with baselines re-captured for Palette, a voyage's palette, Ridgway and
the essay's figure, and no others; the reviewer returns PASS; P01 is shown before and after.
