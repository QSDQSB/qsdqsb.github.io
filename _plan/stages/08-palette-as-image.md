# Stage 8 · A palette as an image

**Status:** planned. The owner pursued
[I001](../ideas/I001-a-palette-shareable-as-an-image.md) on 2026-10-01; a study comes first, and
nothing a reader sees is built before its pictures have been judged. **Tier:** 2.

## Where this stands

The idea was shaped, tried and challenged, and the owner decided on 2026-10-01:

- **Pursue.**
- **Question 1, A:** readers share it, from a control on the page.
- **Question 2, B:** a photograph may be on the image, "a voyage's cover or a photograph's own frame".
- Q6 was answered the same day, before question 2 was tapped: protecting the pictures means casual
  saving. So nothing is parked.

The lead's verdict had said no photograph, and that a photograph would park the idea. The owner
decided otherwise; the decision holds, and the verdict stays in the idea file as the record of what
was advised. Pursue means the study and nothing more
([`ideas/README.md`](../ideas/README.md)): a control for readers is a later call, made on the study's
pictures.

## What the study must show

Made by one script on this Mac, for three voyages, at 1080 by 1350; nothing on the site changes
([0005](../decisions/0005-choices-arrive-as-prototypes.md)). As planned before the decision:

- the voyage's header as a reader's own screenshot;
- the sheet with the vat and the name;
- the sheet with the vat, the name and the bar;
- all 52 voyage palettes on one sheet.

Added by the decision:

- **The sheet with a photograph on it.**

**Which photograph.** On a voyage's sheet, the voyage's cover and no other. It is the one photograph
a door already shows, the owner picked it and its focus (`cover: { photo, focus }`), and it already
leaves the site as the link preview. Never a second photograph, a strip, or a frame from inside the
book. "A photograph's own frame", the other half of the owner's answer, belongs to a single
photograph's palette, which the challenge struck from this idea. The study draws one specimen of it
so the owner can see it. If it is wanted it is a second idea, shaped on its own: it would put a
control on every card and in the lightbox, and let any print in a book leave.

**At what size.** The sheet is 1080 wide, so the photograph that leaves is 1080 px across at most:
under the link preview (1200 by 630) and far under the 4096 tier. The study shows it at two sizes
and states each in pixels beside the picture: the cover across the sheet's width, as the door; and
the cover small, as provenance, with the dye leading.

**Under which of the owner's calls.** Quoted from [`PRINCIPLES.md`](../PRINCIPLES.md); each binds the
sheet now that a photograph is on it.

- Photographs: "Photographs are prints: as large as the screen allows, nothing laid over them, never
  zoomed or filtered on hover." On the sheet, the name, the bar, the vat and the address sit beside
  the photograph and never on it.
- Cards: "**A card is a magazine cover.** The photograph is the cover; the title is the cover line.
  No opaque plates, chips or panels over the image." And: "**Text contrast is the same over every
  photograph** … an engineered scrim plus a hairline text shadow". The one lawful way to set words on
  the photograph is the card's own way.
- So the study draws it **two ways and no third**: the cover as a print, with the palette beneath it;
  and the cover as a card's cover, with its line. The palette laid over the photograph is not drawn.
- Doorways: "**Doorways withhold.** … no strips, previews, counts, film ticks or rails at the door.
  One magnificent cover and its poetic line." A sheet with the cover is a door in these words. The
  bar is still the one strip on it: the study shows the cover with the bar and without.
- Doorways: "Catalogue looks, labels beside plates and ordering by hour were a definite no." The
  picture a palette app makes, a photograph with its swatches and codes beside it, is that. No codes
  and no percentages go on the sheet.
- Colour pages: "The vat is misty: a watercolour with no edges." And: "the bar is the composition,
  the vat is the mood." With a photograph beside it, whether the vat is still needed is for the
  owner's eye: the study shows the cover with the vat and with the bar alone.
- Colour pages: "No glass panel on the palette page; the whole room is frosted. No voyage card
  there." Said of the page, not of an image that leaves it. A sheet with a cover and its line is a
  voyage's card in all but place: named to the owner beside the pictures.
- Photographs: "**Never state clock times.** Dates only." If a date goes on the sheet, it is a date.

**How Q6's answer bears on it.** The owner chose casual saving as what is to be guarded against
([stage 7](07-protecting-the-pictures.md)). The sheet is the opposite act: a copy handed out on
purpose, which whoever receives it can keep.

- What leaves is bounded: one photograph a voyage, the cover, at 1080 px or less. That is about what
  the link preview gives away already, and nothing near print quality, which Q6 left out of scope.
- It must not become the way round stage 7. A sheet for any photograph in a book would be a save
  button for every print, under another name. That is why a photograph's own palette is not part of
  this control.
- An image that has left cannot be called back. The sheet carries the site's address, so the
  photograph travels with its source.
- The two are tried together before a control ships: with stage 7's rules on, the sheet is still
  made, and the print on the page is still not saved by the gesture.

## Before a control is built

- [ ] F041 · The vat throws on a device without WebGL (`assets/js/colour/vat.js:122`). The control
      must not show where the vat cannot be drawn. Tier 0 for the fault itself, which is also a task in
      [stage 1](01-foundations-unseen.md).
- [ ] All 52 voyage palettes on one sheet, for the owner's eye: an image that has left cannot be
      corrected, and only Porto's has been looked at. Made in the study.
- [ ] A journey with `share` and `canShare` stubbed, run before the brief is written
      ([0008](../decisions/0008-ready-and-done.md): whatever a reader does with it has a journey).

Added on 2026-10-01, by the owner's decision that a photograph may be on the image:

- [ ] The owner's pick among the study's sheets: with a photograph or without, which way, what size.
      Tier 2.
- [ ] The size of the photograph that leaves, in pixels, agreed by the owner. No larger than the link
      preview unless the owner says so.
- [ ] A canvas can read the photograph wherever the sheet is made: for a reader, on the gate's server
      and on a preview build. Read by the lead on 2026-10-01: `img.qsdqsb.com` allows
      `https://qsdqsb.com` and `http://localhost:4000`, and not `http://127.0.0.1:4173`, the gate's
      own. The link previews under `images/og/` are same origin. Tried in a browser in the study.
- [ ] F042 · Intermezzo has a palette and no cover: 51 of the 52 voyages have one. Its cover is the
      owner's to pick; until then its sheet has no photograph.
- [ ] The made file read for a camera record: no EXIF, no place, no time.
- [ ] Ready inside the tap with a photograph on it: timed with the processor slowed, in both engines,
      with the file's size. The earlier timing fetched nothing and encoded flat colour.
- [ ] Tried with stage 7's rules on, once stage 7 has a spike: the sheet is made, the print is not
      saved by the gesture.

## Not binding, kept here

- [ ] F006 · 2026-09-28 · Palettes under-weight salient colour (Porto DSCF7059: the orange roofs and
      the yellow parasol). This does not gate the image. Traced on 2026-10-01: the finding is about
      one photograph's signature, which the image never prints; a voyage's palette is pooled at build
      from its photographs' 32 colours (`scripts/photos/lib/book.mjs:266`), all 52 recompute from the
      fetched manifests, and Porto's carries the roofs. A new weighting in `lib/signature.mjs` reaches
      the voyages by a rebuild. That does not mean a wrong palette can always be put right without
      R2: this frame's stored 32 colours hold no yellow and its orange at 0.4%
      (`scripts/photos/lib/palette.mjs:143`), and a colour lost there needs a backfill, the owner's go. In the built data that frame's signature now
      holds an orange accent (`#b26339`, 3.3%) and no yellow. Tier 2 if it changes what a reader sees.
      If a single photograph's palette is ever taken up (the specimen above), this finding binds it:
      that sheet would print the very signature the finding is about.

## For the study

- 27 of the 52 voyages are parts whose titles name no place alone ("Portraits", "Selva"); the trip's
  name is in `palettes.json`, under `trips`.
- "Church of Our Lady before Týn" measures 923 px at 64 px Playfair bold, wider than the 840 the
  trial gave a name.
- The vat has never been shown above 176 px (`assets/js/colour/palette.js:206`). At 760 px its rim
  reads as an edge: for the owner's eye, against "a watercolour with no edges".
- The trial's sheet printed the gallery's key and blocks of equal width (it read `share` where the
  data's key is `pc`). It is evidence for the mechanism, not a design.
- Android was never tried. The system's share sheet opening can only be proved by hand; it has not
  been yet.
- 2026-10-01 · The covers are keyed by page (`prague_twilight`) in `_covers.json` and under
  `images/og/`; the palettes are keyed by gallery (`prague/twilight`). `palettes.json` itself names
  no cover.
- 2026-10-01 · For the 51 voyages with a cover, the cover is one of the photographs already listed
  under that voyage in `palettes.json`.
- 2026-10-01 · The link previews are JPEGs of 1200 by 630, 121 KB on average and 244 KB at most.
  They are cut for a wide frame; the sheet is tall. A cover drawn from one is cut twice.
- 2026-10-01 · The poetic line of a door is the voyage's own `excerpt`. If the cover carries its
  line, those are the words: the owner's, already written.

## Journeys

`palette` walks the page today. A control adds one: `share` and `canShare` stubbed, one image of the
agreed size handed over inside the tap; and the save path where the browser cannot share. Written in
the study, before the brief.

## Exit

Not written until the study is answered.
