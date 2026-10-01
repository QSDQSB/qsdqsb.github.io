# Stage 8 · A palette as an image

**Status:** idea. **Tier:** 2. Waits on the owner's word on
[I001](../ideas/I001-a-palette-shareable-as-an-image.md).

## Where this stands

The idea has been shaped, tried and challenged: what is asked, the shapes, what was proved and what
is still open, and the questions for the owner are in
[I001](../ideas/I001-a-palette-shareable-as-an-image.md). This file holds no design of its own until
that is answered. If the owner pursues it, a study with prototypes comes first
([0005](../decisions/0005-choices-arrive-as-prototypes.md)), and the brief is written here from its
verdict.

## Before a control is built

- [ ] F041 · The vat throws on a device without WebGL (`assets/js/colour/vat.js:122`). The control
      must not show where the vat cannot be drawn. Tier 0 for the fault itself, which is also a task in
      [stage 1](01-foundations-unseen.md).
- [ ] All 52 voyage palettes on one sheet, for the owner's eye: an image that has left cannot be
      corrected, and only Porto's has been looked at. Made in the study.
- [ ] A journey with `share` and `canShare` stubbed, run before the brief is written
      ([0008](../decisions/0008-ready-and-done.md): whatever a reader does with it has a journey).

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

## Exit

Not written until the study is answered.
