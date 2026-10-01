# Stage 8 · A palette as an image

**Status:** idea. **Tier:** 2.

## Goal

A reader can take a voyage's palette, or a photograph's, away as an image worth sharing.

## Open questions

- Which palette: a voyage's (the vat and its bar), one photograph's, or a Reverie colour with its
  photographs?
- What is on the image: the vat, the bar, the hex codes, the voyage's name, the house mark?
- What shape: square, 4:5 for a phone, 1200×630 for a link preview?
- Made where: in the browser on a canvas at the moment of sharing, or at build time like the
  voyage link previews (`npm run covers`)?

## What exists to build on

- `assets/js/colour/vat.js` already draws the vat on a canvas.
- The build already cuts 1200×630 link previews for voyage covers.
- The palette bar copies a hex on click; the specs panel shows the bar.

## Notes

- A browser-made image needs no R2 write and no new build step. It is the cheaper first prototype.
- The share control must come from the vocabulary: a `round-tool`, not a new button.

## Exit

Chosen from prototypes.
