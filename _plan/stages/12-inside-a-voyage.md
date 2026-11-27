# Stage 12 · Inside a voyage

**Status:** planned. **Tier:** 2, answered: the owner's picks on the sheets of 2026-11-27 (Q24, Q25;
[0013](../decisions/0013-what-the-sheets-settled.md)). One batch, one session, one pull request
with pictures; the merge is the yes ([0010](../decisions/0010-the-merge-is-the-yes.md)).

New on 2026-11-27: no stage held the Photobook's inside, because it was the model and not a fault.
The sheets changed eight things in it.

## Goal

The book from its cover to its sign-off, as the owner picked it: full-width prints where they are
marked, the figures on a data plate beside the dial, an opened print hung at eye level over a rail
in the voyage's own light, a note that reads as an afterword, and an ending that closes on the
sign-off.

## What is already decided

**Kept as it stands (Q24, Q25; not to be re-proposed):** a full-width print runs edge to edge; names
stand under full-width prints only; on a phone pairs and threes are a strip to swipe; the contact
sheet; the colophon's colours; the phone lightbox opens with its specs up. And from Q24: the book
"stays as built", its own motion and marks as signatures (the dock that grows, the rail's ticks,
the switch's sliding thumb, "on" in ink), with two fixes, below.

**The owner, 2026-11-27:**

- Which photographs get the full width: "The ones you mark".
- Between the cover and the first photograph: "The figures move down beside the dial".
- On a phone's cover: "Four facts on a phone", and "we should have darker mask on the area to ensure
  readability" (Q24).
- An opened print beside its specs: "Hung at eye level".
- The row of marks under it: "Each mark in its frame's own colour".
- Words written for a voyage: "An afterword in a reading column"; "We should use the same style as
  standard post content".
- After the colophon: "Elsewhere as two covers, sign-off last"; "this aligns with the post's logic"
  (Q24). This replaces R010's order of 2026-10-17 (0013).
- The Photobook "as built, with the brass focus ring and no label under 11 px" (Q24).
- "No arrow" after a way on.

**Standing** ([`PRINCIPLES.md`](../PRINCIPLES.md), The Photobook, Photographs): "Book rhythm is
spread, pair, three. Openings are pinned by the owner through `order:`." "The gallery is immersive,
not storytelling"; the Photobook is English only. "The specs panel stays pinned by default." "Never
state clock times." "Text contrast is the same over every photograph… an engineered scrim plus a
hairline text shadow, assuming the worst lighting."

## Scope: batch 2

Tier 2, answered, unless a line says otherwise. Pictures at both widths, on a single voyage and on a
part. Audit ids are sections of `design/audits/stylesheets.md` (S), findings of
`design/audits/reviewer.md` (R) and `design/audits/measured.md` (M).

**The book**
- [ ] Q25, book-rhythm · A print is full width because the owner marked it in the voyage's file
      (`_data/photos/<gallery>.yml`, beside `order:`); where nothing is marked, today's rhythm
      stays, so no book changes until one is marked. The mark is read by the build's own layout
      (`scripts/photos/lib/book.mjs`, `_includes/photobook/book.html`, `assets/js/photobook/rows.mjs`)
      and needs no write to R2. Its recipe goes in `_docs/photos-recipes.md` (outside the plan: the
      session that builds). Tier 0 until a book is marked; the marks are the owner's.
- [ ] Q25, cover-seam · The band under the cover becomes the book's data plate: date, frames,
      lenses, films and body at the left, the dial at the right. The cover keeps the picture, the
      name and the line.
- [ ] Q24, phone-facts · **Needs the owner's word first** (it is on the list for the next sheet).
      Q24 put four facts on a phone's cover under a darker mask; Q25, later, moved the figures off
      the cover. Both cannot be built on a phone. The lead's reading, not built on a guess: on a
      phone the plate under the cover holds four facts (the body stays in a print's specs), and the
      darker mask goes under what the cover still carries, its name and its line. The other
      reading keeps four facts on a phone's cover, masked, and the plate on a desktop only.
- [ ] A phone's cover: its title is 19.5 px over a line of 16.3 (M9), the fault R031 named on a hero
      ("the title is not prominent… and so should the similar problems"). The same ratio as a
      phone's hero since 2026-11-27. Tier 2, answered by R031.
- [ ] Place names cut short in a phone's paired rows (M24: eight on two voyages). Tier 1.

**An opened print**
- [ ] Q25, lightbox-hang · With the specs pinned the print stands in the middle of the height, the
      specs level with its top (R25: 240 px of empty mat below and none above today).
- [ ] Q25, lightbox-rail · Each mark of the rail is its frame's own colour, so the row is the
      voyage's light from first frame to last. Same size, nothing added; the colour is the one each
      frame already carries in its manifest. Where you are stays the taller mark, in the warm brass.
- [ ] F071 · In picture only, on a slow line, a step shows an empty screen until the print lands.
      Tier 0; the `lightbox-slow` journey gains the case.
- [ ] "№" and "▸" in the lightbox are drawn in whatever face the device has (M25): a hairline mark
      or Barlow's own glyphs. Tier 1.

**The end of the book**
- [ ] Q25, book-note · A voyage's written lines are an afterword after the last print, in a reading
      column of about 65 characters, in a post's own text styles (stage 6's batch builds them;
      share the rules, do not copy them). The words stay as written.
- [ ] Q24, voyage-ending · After the colophon: Elsewhere as two covers, then tags and date on one
      line, the sign-off, the links (R9: four covers of 1,650 px and the sign-off mid-list today).
      The two covers are the `card` piece, as under a post. A part's "Other (parent)" row is drawn
      the same way: the lead's, tier 1, shown. The sign-off itself is the one ending of
      [stage 14](14-shell-and-small-pages.md).
- [ ] Q25, arrows · The ways on lose their arrows ("QSD's Palette for …", "Reverie from here"):
      `_includes/photobook/colophon.html`, `end.html`. The words wait on stage 3's drafted lines.
- [ ] Q24, italic-lines · The colophon's Didot italic line is Playfair upright (S, F: `lede`
      re-made at `_photobook.scss:809-816`). Its small headings stay Didot.

**The two fixes the owner asked of the book (Q24)**
- [ ] Keyboard focus is the brass ring: the book's gold ring and its one-pixel ink rings give way
      to `brass-focus` (S, E; M2). Tier 2, answered.
- [ ] No label under 11 px: eighteen sizes in `_photobook.scss` sit under the floor, most of them
      hand-set capitals of 8 to 11 px (S, A5 and H13). They take `eyebrow`, or its floor. The
      colophon's label and the link beside it share one spacing (M17). Tier 2, answered.

**Brought into line, in these files** (tier 1 or 0)
- [ ] Tap sizes on a phone: the view switch (26 px), a frame's dot (28.8), the rail (12 px wide), a
      way on (19 px high) (M22). The target grows, not the mark.
- [ ] Dead styles deleted (S, G: `_photobook.scss`, `.photobook-specs__id` and the block after it);
      a weight of Barlow the site does not load (S, A1.4). Tier 0.
- [ ] F088 · A journey for the facts at 320 px: every fact inside its plate, none on two lines. The
      finding's second half (a baseline 3.6 MB larger) is moot: baselines left git on 2026-11-22.
- [ ] F047 · In Safari's engine the blurred placeholder draws as a grid of blocks, on the book's
      frames and on Palette's and Reverie's cards. Seen in Playwright's WebKit only: it wants a
      real iPhone before anything is changed.
- [ ] F004 · About 20 photographs have no place and 8 no camera record, so their specs are thin.
      It needs the owner's input or re-exports: it goes to the owner on the next sheet.

## Shared pieces

Uses: `card`, `brass-focus`, `eyebrow`, `onward-links`, the post's text styles, the two brasses.
Nothing new. The data plate is the cover's facts moved, not a new piece.

## Journeys

`book`, `deeplink`, `specs-folded`, `lightbox-slow`, `lightbox-morph` and `voyages` must pass. To add:

- `book-marked` · a frame marked full width is laid full width; with no mark the rows run one, two, three.
- `book-plate` · the figures stand beside the dial, and the dial still filters the frames (the film
  dial has no journey today); at 320 px every fact is inside the plate (F088).
- `book-end` · after the colophon come two covers, then the sign-off; a cover leads to its voyage
  (the colophon has no journey today).

## Exit

`npm run gate:full` passes with baselines re-captured for the Photobook's shots and no others;
`npm run check:mobile-overflow` in Safari's engine; the reviewer returns PASS. The phone's facts are
built only once the owner has said which reading.
