# I001 · A palette shareable as an image

**Status:** study · **Raised:** 2026-10-01 by the owner · **Stage:** [8](../stages/08-palette-as-image.md), which holds what the study must show

## In the owner's words

> I want the palette to be shareable by user as an image

## Verdict

**Pursue, turned.** As a door, not a data sheet: a voyage's palette as one image with no photograph
and no numbers on it (the vat, its name, the bar), the codes left on the page. It goes to a study
first, where the sheet is made by a script on this Mac and nothing a reader sees changes; a control
for readers is briefed only if question 1 says readers. I would park it if the vat at that size
reads as any gradient, or if a photograph is wanted on it (question 2).

**Waits on:** nothing, for the study. Before a control ships: F041 (the vat throws where there is no
WebGL) and the owner's eye on all 52 voyage palettes. F006 does not gate the image; a colour the
owner's eye finds missing from a palette may need an R2 backfill, which is their go. F036 and F037
bind only if the codes go on the image.

**The owner:** pursue · 2026-10-01 · Question 1: A, readers, from a control on the page. Question 2: B, a photograph may be on the image (a voyage's cover or a photograph's own frame). Q6 was answered the same day: A, casual saving. Tapped on the command centre, no note.

**After the decision** (the lead, 2026-10-01). Readers, and a photograph may be on the image. Q6 was
answered before question 2 was tapped, so nothing is parked. The verdict above stays as it was given;
where it says "no photograph", and that a photograph would park the idea, the owner's decision is
what holds. What the study must now show is under Next and in [stage 8](../stages/08-palette-as-image.md);
what the decision makes untrue or newly open is marked "After the decision" in the tables below.

## Made explicit

The sentence, each way it can honestly be read. The readings taken are the lead's.

- **"the palette"**: a voyage's (the page's "QSD's Palette for London"); one photograph's (a card,
  the bar in the specs); one colour's dye (Reverie); or the whole page, every voyage on one sheet.
  Taken: a voyage's, the one the page gives a title. A photograph's is struck from this idea (see
  Challenged).
- **"shareable"**: sent (a share sheet), saved (a file), copied (to paste), or linked (an address
  with a preview). Taken: sent where the browser can share a file, saved where it cannot. Which
  one is decided by the browser, not the device: Safari shares on a phone and on a Mac, Chrome on
  the same Mac saves. Linked is not this idea: the words say "as an image", and F038 keeps the
  preview.
- **"by user"**: a reader sending it on; the owner posting their own; or a user who composes one.
  Not taken: asked, in question 1. The words say a reader. Nothing shows a reader wants it, and the
  owner posting their own needs no control at all. Composing is a tool, which the site is not.
- **"as an image"**: a designed sheet; a capture of the screen; or the photograph with its colours
  beneath (what a palette app makes). Taken: a designed sheet, no photograph, no numbers. A
  screenshot does the second today: a phone's first screen of a voyage's palette is the title, the
  blocks with codes and shares, and the vat, under the site's bar and over the edge of the first
  photograph. Question 2.

It is for the person who receives it: the image stands alone in front of someone who has never
seen the site.

It would need the sheet (a layout that is the site's own with no page round it), a way to make it
(a script here, or the reader's browser), and for readers one control from the grammar, named for
the thing and not the act, since the act differs by browser.

It assumes a palette is worth having without its photographs, that someone wants to send one
(nothing measures this), and that the 52 voyage palettes are right (one has been looked at). It
does not ask for photographs to be shared, for a link, or for anything the reader edits.

## Shapes it could take

1. **The header, worth a screenshot.** Nothing is made. A voyage's header on the palette page is
   tidied so a reader's own screenshot stands alone: the trip's name on a part, the address under
   the vat. No control, no file, nothing to prove by hand. It is not an image of the site's making:
   the phone decides the crop, the site's bar and a photograph's edge come with it, and the page
   prints its own address.
2. **A sheet made on this Mac.** A script pours the page's own vat and writes the sheet for any
   voyage, or all 52, to a folder outside git, for the owner to post. Didot and WebGL are here.
   Nothing on the site changes: no control, no reader's browser, no share sheet.
3. **The same sheet from one control on the page.** For readers. One quiet control beside the
   voyage's vat; a tap hands the sheet over, shared or saved as the browser allows.

The sheet, in 2 and 3: 1080 by 1350, the dark ground, the vat poured as on the page, the voyage's
name, the bar, the site's address. No codes and no percentages: they are on the page the image
leads to. Nothing lies over the dye; the name is said once. Not the dye edge to edge with words
over it: off the site that is any gradient.

I would design the sheet once, in the study, and make it there by 2, which is the study's own
script. 3 is built only if the owner says readers. A photograph's palette (a control on every card
and beside the sun diagram) is struck from this idea; it can come back as its own once Q6 is
answered.

## What it changes

Weighed for shape 3, the control. Shape 2 changes nothing a reader sees and touches no row. Shape 1
touches the first row alone. Each row is from the files it names, read on 2026-10-01.

| Part of the site | Today | With this idea | Size |
|---|---|---|---|
| Pages and addresses | One page; a voyage is an anchor, `/palette/#london` | None new. The voyage's header is arranged again to seat one control, at both widths | small |
| Shared pieces | The quiet icon button and the tooltip are on the page already; no mark for sharing | Both reused, one new mark. The sheet is a canvas: its inks are read from the page's custom properties and its faces from the page's own title and label, as `palette.js` reads its curves. Only its measures are new | small |
| Scripts | `vat.js` copies a still vat to a canvas a browser can save. Nothing on the site makes a file | One module, on the page before the tap; a few lines in `palette.js`. The vat asked for at a fixed 760 px. No control where the vat cannot be drawn | small |
| Data and the photo pipeline | `palettes.json` holds each voyage's colours, shares, name, address and its trip's name | Nothing added; no R2 write. A voyage's palette is made at build | none |
| The build and its weight | Five modules and the data, preloaded | A sixth module preloaded, its size not known until written. No build step. The image, 325 to 380 KB in the trial, is made in memory and never stored | small |
| The pictures and privacy | Nothing offers a reader a file | The first control that does. Colours, a name, an address: no photograph, no date, no camera record | small |
| Other stages and open calls | Stage 8 waits on this; F041, F006, F036, F037 are open | F041 gates the control. F006 does not bind. F036 and F037 bind only if the codes go on. Stage 7 and Q6 untouched. Stage 11 works on the same page | small |
| Upkeep | Journey `palette`; baseline `palette-voyage` at 1440 and 390; the iPhone check walks `/palette/#london` | A journey with `share` stubbed, and the save path. The sheet as a pixel baseline, which the harness must learn to take. Two page baselines again | medium |
| After the decision · The pictures and privacy | The row above says no photograph | A photograph leaves inside the image, on purpose: the first file with a photograph in it that the site hands a reader. On a voyage's sheet it is that voyage's cover, which already leaves as the link preview, 1200 by 630 (`scripts/generate-cover-og.mjs`). A photograph's own frame has no such precedent | medium |
| After the decision · Data and the photo pipeline | The row above says nothing added | `palettes.json` names no cover: a voyage there has `g`, `palette`, `order`, `photos`, `rank`. The sheet needs the cover's address: the link preview under `images/og/`, same origin, or a rendition on `img.qsdqsb.com`, which a canvas may read only from an origin the bucket allows. No object in R2 is written; the allowed origins are a Cloudflare setting, the owner's | small |
| After the decision · The build and its weight | The row above: 325 to 380 KB, nothing fetched | A photograph is fetched, or is on the page before the tap, and the file grows: a photograph does not compress as flat colour does. Neither figure is known until the study | medium |
| After the decision · Shared pieces | The row above | If the cover carries its line as a card does, the card's scrim and hairline shadow are reused, not drawn again | small |
| After the decision · Other stages and open calls | The row above says stage 7 and Q6 untouched | No longer true. Q6 is answered and [stage 7](../stages/07-protecting-the-pictures.md) has a brief: it keeps a print from being saved by a gesture, while this hands one out. Each names the other. F042: Intermezzo has a palette and no cover | medium |
| After the decision · Upkeep | The row above | A cover picked again, or focused again, changes its sheet; the sheet's baseline now depends on a photograph | small |

Rows marked "After the decision" were added on 2026-10-01, when the owner allowed a photograph on the
image. The rows above them were weighed for a sheet with none and are kept as the record. Where the
two disagree, the later row holds.

## Can it be delivered

Tried on 2026-10-01 for the sheet, against the built site, in Chromium and in Safari's engine
(Playwright WebKit). One throwaway script called the page's own `vat()`, laid a 1080 by 1350 sheet
out on a canvas and asked the browser for a PNG. The site reviewer ran it again across pixel ratios
and with the processor slowed; the lead traced the palettes through the pipeline. The sheet the
trial drew is evidence for the mechanism only: it printed the gallery's key and blocks of equal
width.

| What must be true | How it was tried | Result |
|---|---|---|
| A browser can make the sheet, the same on every screen | `vat()` asked for a fixed 760 px, composed, `toBlob`. Chromium at 1, 1.25, 1.5, 2, 2.625 and 3; WebKit at 1, 2 and 3 | proved: 1080 by 1350, the vat 760 by 760 and identical to the pixel at every ratio within an engine. The two engines differ from each other. 325 to 380 KB |
| It is ready inside the tap, on a desktop | Timed from the call to the finished file, the module and data already on the page | proved for that design: 28 to 125 ms on a desktop graphics card; with the processor slowed six times, 47 ms to pour and 71 ms to encode. A module fetched on the tap was never timed, so the module is on the page first |
| It is ready inside the tap, on a real phone | Not tried: no phone here | open: in the study, by hand |
| Safari will take the file | `navigator.canShare({ files })` with the PNG, in WebKit | proved: true. Every Chromium run had no share, which is the save path |
| Android's browser takes it, and the system's sheet opens | Not tried: no Android here, and no program can open the sheet | open: by hand, once, before a control ships |
| A program can walk the share route | Not tried: a journey that stubs `share` and `canShare` and asserts one image/png of 1080 by 1350 handed over in the tap | open: written and run in the study, before a control is briefed |
| A reader without WebGL gets the image, or no control | The same script with 3D switched off | failed: `vat()` throws (F041, `vat.js:122`, a fault in the site today on Palette, Reverie and Drift). The control must not show where the vat cannot be drawn |
| A voyage's palette is made at build, from its photographs' stored 32 colours | A throwaway script recomputed all 52 from the fetched manifests with `colourOf` (`scripts/photos/lib/book.mjs:238`) and compared them with the built data. Run by the lead, and again by the site reviewer | proved: 52 of 52 identical. A new weighting in `lib/signature.mjs` reaches a voyage by a rebuild |
| A palette the owner finds wrong can be put right without an R2 write | Read, not run: F006's own frame (DSCF7059) holds no yellow in its stored 32 colours, and its orange at 0.4%; `paletteOf` is plain area k-means (`scripts/photos/lib/palette.mjs:143`) | open: a colour lost in the 32 cannot be recovered by weighting. Putting it right is an R2 backfill, the owner's go |
| The 52 voyage palettes are right enough to send | Porto's read from the built data: it carries the roofs (`#89371d` 12%, `#ae7352` 11%). The other 51 not looked at | open: all 52 on one sheet for the owner's eye, in the study |
| The image reads as this site's and not as any gradient | Cannot be tried by a program. The vat has never been shown above 176 px | open: the study, judged by the owner |
| After the decision · A canvas may read the photograph, so the sheet can be made at all | Run by the lead, reading response headers only; the session runs it again in a browser. A cover's 1280 rendition asked for with an `Origin` header: allowed for `https://qsdqsb.com` and `http://localhost:4000`; no permission for `http://127.0.0.1:4173` (the gate's own server), for the Pages preview address, or for another site. The link previews under `images/og/` are same origin and need none | open: the live site may read a rendition; the gate's server and a preview build may not, so a journey or a baseline that draws from `img.qsdqsb.com` fails there. Either the sheet draws the same-origin link preview, or the bucket's allowed origins change (the owner's). Not yet drawn in a browser, where a copy fetched earlier without the header can still spoil the canvas |
| After the decision · Every voyage on Palette has a cover to put on its sheet | Run by the lead on built data, to be run again: `palettes.json` against `_covers.json` and `images/og/` | failed: 51 of 52. Intermezzo has a palette and no cover (F042). For the 51 the cover is one of the voyage's own photographs and its link preview is on disk |
| After the decision · The photograph that leaves is no larger than one the site already gives away | Read, not run: the link preview is 1200 by 630, cut round the cover's focus at every build; the sheet is 1080 wide | open: true if the sheet draws the cover, at 1080 px or less. Not true of a photograph's own frame, which has no link preview. The study states each variant's size in pixels |
| After the decision · It is still ready inside the tap, and Safari still takes the file | Not tried. The earlier timing fetched nothing and encoded flat colour | open: timed in the study with the photograph on the page first, slowed six times, in both engines; the file's size as PNG and as JPEG; `canShare` asked again with that file |
| After the decision · The file carries no camera record | Not tried | open: the study reads the made file for EXIF, a place and a time. A canvas writes none; proved by reading one |
| After the decision · With a photograph on it the sheet keeps the owner's calls on photographs | Cannot be tried by a program | open: the study draws it the two ways the calls allow, for the owner's eye ([stage 8](../stages/08-palette-as-image.md)) |

Rows marked "After the decision" were added on 2026-10-01. The first, second and fourth rows of the
table were proved for a sheet with no photograph; with one on it they are open again, as the later
rows say. Nothing above was run again.

## Does it fit

| Against | Verdict | Why |
|---|---|---|
| Colour pages | Fits | "The bar is the composition, the vat is the mood." The sheet carries both; the vat stays misty. |
| Doorways | Strains | Off the site the image is a door. As the page shows a palette, it carries codes and shares: "no strips, previews, counts, film ticks or rails at the door … data belongs inside the book", and the language refuses "Numbers at a doorway". Turned: no numbers on the sheet. The bar is the one strip left (the lead reads those strips as photographs'); the study shows the sheet without it too. |
| The look | Fits | "Didot for figures and for hex codes" binds only if the codes go on the sheet. Without them it is Playfair and Barlow, both shipped: the same from every phone. |
| Controls | Strains | "One control per job": it is one job. But "Honest mechanism … Nothing arbitrary": whether it shares or saves is decided by the browser, which the reader cannot see. |
| Design language | Strains | The quiet icon button, the title and the label; a new mark; no new signature. But the vat is a signature protected as "a watercolour with no edges", and at 760 px its rim may read as one. |
| Photographs | Fits | None is on it, so "nothing laid over them" is not touched. |

Nothing like it has been tried: the one study on file is of the voyage parent pages.

**Fits if turned**: the numbers stay on the page, and the sheet is a door: the vat, the name, the bar.

**After the decision** (2026-10-01; the table above is kept as it was judged). With a photograph
allowed, three of its rows read differently:

- Photographs: no longer "fits" by absence. The call now binds the sheet itself: "nothing laid over
  them". The name, the bar, the vat and the address sit beside the photograph, never on it, unless
  the photograph is set as a card's cover, where the owner's own rule for a cover line applies ("an
  engineered scrim plus a hairline text shadow").
- Doorways: closer to a fit than before. With the voyage's cover on it the sheet is a door in the
  owner's own words, "One magnificent cover and its poetic line". What would break it: a second
  photograph, a strip, a count, a frame from inside the book.
- Colour pages: a new strain. "No voyage card there" was said of the palette page; a sheet with a
  cover and its line is a voyage's card in all but place. And the picture every palette app makes,
  a photograph with its swatches and codes beside it, is what the owner called "labels beside
  plates": "a definite no".

## For and against

**For**

- It sends out the colour study, the part of the site nobody else has, and gives no photograph
  away.
- The sheet can be made: the same pixels on every screen within an engine, inside the tap (tried).
- Turned, it is a door: a name and a dye for a picture the stranger has not seen. With no codes on
  it, it is also set in one face on every phone.
- The owner has sheets to post from the study itself, whatever is decided about a control.
- Small to take back: one control and one module.

**Against**

- Nothing shows a reader wants it, and nothing will: the site counts visits, not taps. A screenshot
  already carries the title, the codes and the vat.
- An image that has left cannot be corrected, and one palette of the 52 has been looked at.
- The whole sheet rests on the vat at four times any size it has been shown: its rim may read as an
  edge, and a misty disc as any gradient.
- It is the site's first control that hands over a file, while stage 7 still asks how to protect
  the pictures; and whether it shares or saves is the browser's choice, unseen by the reader.
- The system's share sheet can be proved only by hand, and has not been; Android was never tried;
  and a fault in the vat today (F041) gates the control.

**After the decision** (2026-10-01; the lists above are kept as they were weighed). The first line
For no longer holds for a sheet with a photograph on it: it does give one away. What it gains in
exchange is the lead's hardest open point: with the cover beside it, the dye reads as this voyage's
and not as any gradient. Against gains one line: a photograph leaves in a file the site cannot call
back, in the same week stage 7 sets out to keep prints from being saved.

## Challenged

By: the site reviewer, 2026-10-01.

- **Changed:** "user" was read as a reader without asking, and the smaller things that reading hides
  were not weighed. Question 1 now asks who shares, and two smaller shapes are in: the header as a
  screenshot, and a sheet made on this Mac. The study shows the screenshot beside the sheets.
- **Stands:** nothing shows a reader wants this, and nothing on the site would say so after it
  ships. The recommendation is still readers, on the owner's own words.
- **Changed:** the main route could only be proved by hand, and the look lived in script. The
  proposal now carries a journey with `share` and `canShare` stubbed, the sheet as a pixel baseline,
  and inks and faces read from the page. None of that has been run: it is an open row. The system's
  own sheet is left to a hand, once.
- **Changed:** the fit check was smoothed: three strains, then "Fits", and a doorway carrying five
  codes. The pick has no numbers now, the check ends "fits if turned" and the verdict follows it.
  The bar stays in the pick; the vat-and-name sheet is shown beside it.
- **Changed:** the precondition that carried the verdict, F006, was neither traced nor tried. Traced
  and run: a voyage's palette is made at build, 52 of 52 recomputed. F006 no longer gates the image.
- **Stands:** whether a palette found wrong can be put right without R2 is open: a colour missing
  from a photograph's stored 32 needs a backfill. The 52 on one sheet come before any control.
- **Stands:** the bar on the sheet rests on the lead's reading of "no strips … at the door" as
  photographs' strips. The study shows the sheet with the bar and without it; the owner's eye decides.
- **Changed:** Q6 was offered as a tap inside the idea, and a control was promised beside the
  prints. The photograph's palette is struck from this idea, and option B of question 2 now parks.
- **Changed:** "proved at 1x, 2x and 3x in both engines" was more than the trial ran. The row now
  carries the reviewer's run, which did cover them.
- **Changed:** the timing was on a warm desktop, and the design fetched its module on the tap,
  which nobody timed. The module is now on the page before the tap; the row carries the slowed
  figure and leaves a real phone open.
- **Changed:** "shares on a phone, saves on a laptop" was wrong: the split is by browser. Said so
  throughout; the control is named for the thing, and "Controls" now reads Strains.

## Questions for the owner

### 1 · Who shares it?

- **A (recommended):** Readers, from a control on the page; the study's script gives you the sheets as well.
- **B:** Only me: sheets made on this Mac, nothing new on the site.
- **C:** Nobody needs a sheet: tidy the page's header so a screenshot is enough.

Why: the sentence says "by user", and the control is small once a program walks it. B is the honest smaller thing if the wish is to post them yourself.

### 2 · May a photograph ever be on the image?

- **A (recommended):** Never.
- **B:** Yes, a voyage's cover or a photograph's own frame: this parks the idea until Q6 is answered.

Why: B is the picture every palette app makes, and nothing can be built on it while Q6 is open.

## Next

A study, on the owner's Pursue. One script on this Mac draws, for three voyages, the header as a screenshot, the vat-and-name sheet and the sheet with the bar (the lead's pick), and all 52 voyage palettes on one sheet. It also runs the stubbed journey. Then stage 8 gets its brief; what the study will meet is noted there.

**After the owner's decision (2026-10-01): readers, and a photograph may be on it.** The same study, with more on the table. It also draws the sheet with the voyage's cover on it, the two ways the owner's calls allow and no third: the cover as a print with the palette beneath it and nothing over it, and the cover as a card's cover with its line. Each is shown beside the number of pixels of photograph that leave, against the link preview the site already gives away (1200 by 630). The earlier sheets with no photograph stay in, so the owner compares. One specimen of a single photograph's own palette is drawn as well, because the answer allows it; whether it is wanted is a second idea, not this control. The study answers the rows marked "After the decision" under "Can it be delivered". A control is briefed in [stage 8](../stages/08-palette-as-image.md) only on the study's pictures: that is a later call of the owner's.
