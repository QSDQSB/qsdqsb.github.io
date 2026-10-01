# The QSD design language

**Version 0, 2026-10-01. A draft until the owner confirms it** (Q3 in the [queue](QUEUE.md)). It
describes the language the site already speaks at its best (the Photobook and the colour pages) and
the owner's calls, so every page can speak it.

Three kinds of line are in it, and each is marked. **The owner's** is a call the owner made, dated or
quoted; [`PRINCIPLES.md`](PRINCIPLES.md) holds the record. **Built** is what the code does today.
**The lead's reading** is this page's own ordering of the two, not yet the owner's: every rule
without a date or a "built" is one of those, and is what Q3 asks about. Where the code does not yet
do what a line says, the line says so.

[`PRINCIPLES.md`](PRINCIPLES.md) is why. This page is how. `_docs/components.md` is the catalogue of
the pieces in code. [`WORKFLOWS.md`](WORKFLOWS.md) is how to work with all three.

## The one idea: a grammar and its signatures

Consistency and character pull against each other only when they are asked of the same thing. The
language asks them of different things.

- **The grammar** is what every page shares: the ground, the inks, the type, the labels, the
  controls, the glass, the focus mark, the timings. It is the same everywhere, and a session never
  invents any of it. A reader learns it once.
- **A signature** is a one-of-a-kind piece that makes a page itself: the film dial, the sun
  diagram, the dye vat, the monogram. It is free in form. It is still made of the grammar's
  materials (its inks, its faces, its curves), and it is registered below.

The test for anything new: **would a second page ever need this?** If yes, it is grammar: find it
in the catalogue, or add it there first. If no, it is a signature: it has to earn its place, and
creating one is the owner's call.

This is how the site stays consistent without becoming plain. Most of what a session builds is
grammar and takes no decision at all. The few things that are meant to be extraordinary get the
attention.

## 1. The room

| | Rule | In code |
|---|---|---|
| Ground | Near-black. Black is the canvas, never a colour among others. | `$background-color` #151515 |
| Light | **The photograph is the light source.** A room takes its colour only from the picture in view: the glow, the wash, the dye. Chrome never brings its own colour. | `glow.js`, `wash`, `vat.js` |
| Ink | Three inks and a line: ivory for what is read, a quieter grey for what supports it, a third for what waits. | `--photobook-ink`, `-ink-2`, `-ink-3`, `-line` (moving to `--ink…`, [0002](decisions/0002-one-control-vocabulary.md)) |
| Brass | The one metal: marks, the focus ring, a title's accent. Aged, never bright. | `$intriguing-word-color` #c3b498, `$h2-color` |
| Gold | The sun's alone, in the specs. | `--photobook-gold` |
| Film hues | A film carries its own hue, as a tick or a dot, nowhere larger. | the dial, the colophon |
| Headings | **White by default.** The owner, 2026-10-01: "Titles should be default white coloured"; "retire the overly colourful H1 to H6 font colour". Which white (the ivory ink, or pure white) is shown before it is built. | Not yet built: `_sass/_base.scss:63-85` still colours h2 to h5 |
| Refused | Neon. Saturated fills. A colour that is not from a photograph, the brass, or the inks. | |

Open: in-content links are blue (`$link-color` #6fcdff), outside this palette.

## 2. Type

Four voices, each with one job. The faces are the owner's (Playfair for titles, Barlow for labels,
Didot for figures and hex codes); the Didot italic lede is built (`lede`); counting them as four is the
lead's reading.

| Voice | Face | For |
|---|---|---|
| The title | Playfair Display bold | A page's title, every page's, a voyage's included. `display-title` |
| The line beneath | Didot italic | The lede under a title; the poetic line at a doorway. `lede` |
| The figure | Didot | Numbers that are read as figures; hex codes (Playfair's digits read badly). In code today only Reverie's large hex is Didot; the small codes are Barlow (finding F036). Didot is a system face: where a device lacks it the stack falls to CMU Serif, then Playfair |
| The label | Barlow, spaced capitals | Eyebrows, places, UI, anything that names. Never under 11 px. `eyebrow` |

Body text is Playfair Display today; a reading design for posts is open (stage 6). Code is the
monospace stack and nothing else is: Home's eyebrows in Monaco are a fault (audit C06).

Chinese falls through to Songti. The site speaks two languages in its writing; the Photobook
speaks one.

The scale is `$type-size-1` to `-8`, in rem, so nothing compounds. A size outside it is a decision
to justify.

## 3. Shape and space

| | Rule |
|---|---|
| A print | Nothing laid over it (the owner: "photographs are prints"). Square corners: built in the book and the viewers, and the lead's reading of that call |
| A cover on a card | Takes the card's corners. Built |
| A panel of glass | 10 px. |
| A card | 16 px. |
| A control | Fully round (a tool) or a pill (a tool with a word). |
| A line | One pixel, in the line ink. Rules organise; they do not decorate. |
| Space | Generous. The gutter is `clamp(1rem, 3vw, 2.4rem)`; prints sit `clamp(6px, 0.7vw, 12px)` apart. |

The radius scale is six steps (none, 3, 10, 16, pill, round). The code has thirty-six values today;
the scale is decided and not yet built ([0002](decisions/0002-one-control-vocabulary.md)).

## 4. Depth and glass

Glass is a depth cue, never decoration. It says "this floats above the photograph", and only
controls and panels float.

| Depth | Blur | For |
|---|---|---|
| Control | 12 px | A round tool, a tooltip |
| Bar | 18 px, saturate 140% | A pill, the dial's well, the masthead |
| Panel | 24 px, saturate 130% | The specs, a sheet |

One edge: a hairline of white at about a tenth. Over a pale sky a bar is darkened behind
(`glass-bar`) so its marks keep their contrast. Glass never covers the part of a photograph the eye
goes to: a card has a scrim, not a plate.

Layers, lowest first: the page, what sticks (the control bar), the masthead, what lies over the
page (a sheet, search), a modal, a tooltip.

## 5. Motion

> Smooth but not heavy; aesthetic but not distracting. (the owner, 2026-10-01, on hover and focus)

| Step | Time | For |
|---|---|---|
| Fast | 0.15 s | A control answering: a press, a tick |
| Base | 0.3 s | Hover, focus, a colour or border change |
| Slow | 0.6 s | A print developing, a panel moving |
| Cover | 1 s | A magazine cover answering the pointer. Deliberate, cinematic; never shortened to feel snappy |
| Scene | 1.1 s and over | A room's light changing, an opening |

Two curves: standard for things leaving, smooth for things arriving. The cover has its own. Not yet
so: the code has eight (audit C04).

- **Formation.** Things become: a print develops over its placeholder, a wash crossfades as the
  light shifts. Reveal by illumination, not by sliding in.
- **Keep the reader's place.** A change of film does not scroll the page away.
- **Still when asked.** Every motion has its reduced-motion and `html.motion-off` rule beside it.
- **Never the photograph.** It does not zoom, shift or filter under the pointer.

## 6. How things behave

- **Quiet by default.** Detail appears on hover or in hand. Whatever hover reveals, keyboard focus
  reveals too, and a touch reader gets it at rest or on a first tap.
- **Immersive without losing direction** (the owner, 2026-10-01): the masthead hides itself and
  appears "when user scrolls up (hint of finding something)". The lead's reading extends the hint to
  the pointer at the top edge, focus arriving in the bar, and a tap at the top of the screen, and
  holds that it never appears because a finger landed to scroll. Built on 2026-10-01 (X01, X02).
- **One control per job.** A second way to do the same thing is removed, not added.
- **The way back is always in the same place**: the chevron at the top left, in the masthead or a
  viewer. In place, it is; in behaviour, not yet: four implementations (audit C11).
- **Every control has its states**: at rest, under the pointer, focused (the brass ring, 2 px, set
  off its edge), on (lit in brass), pressed, unavailable. Focus reads at least as strongly as hover.
  Not yet so: twelve focus rings today (audit C02).
- **A link is a link and a button is a button.** The address changes when the place does. Back
  does what a reader expects. A browser's own shortcuts are the browser's.
- **Nothing is ever empty.** A colour no photograph holds opens on the closest one (the owner,
  2026-10-01). A book with no frames says so.

## 7. The pieces

The grammar's parts. Most are mixins in `_sass/_components.scss`; three are classes that still live in
`_sass/_photobook.scss` (the segmented toggle, the palette strip and the tooltip) and move with stage 2.
`_docs/components.md` says where each is used.

| Kind | Pieces | State |
|---|---|---|
| Words | Eyebrow, display title, lede, onward links | Built |
| Controls | Pill, round tool, quiet icon button, segmented toggle, tooltip | Built |
| Controls | A text button (solid and quiet), one tag | Decided, not built |
| Surfaces | Bar glass, wash, surface relief | Built |
| Surfaces | Glass at three named depths, one card | Decided, not built |
| Marks | Brass focus; the palette strip | Built |
| Marks | One mark for "current" | Decided, not built |

## 8. Patterns

How pages are put together. A new page is one of these, or a case for a new one.

| Pattern | What it is | The rule |
|---|---|---|
| **Doorway** | A page that leads into photographs: the Voyage index, a voyage in parts | It withholds. One cover and its poetic line; several doors at once; no counts, strips or previews |
| **Room** | A page that is the photographs: a book, a colour page | It takes the photograph's colour. Controls step away while the reader reads |
| **Viewer** | One photograph at full size: the lightbox, Drift, Screening | One grammar: the way back top left, round tools top right, caption and rail at the foot. Nothing over the print |
| **Reading page** | Writing | Open: stage 6 |
| **Ending** | How a page closes | The colophon and onward links in a book. Site-wide, a minimal footer on every page that scrolls (the owner, 2026-10-01): to be designed |
| **Shell** | What a new page stands on | The Photobook's (`layout: default`, `body_class: photobook`). Never `single` or `archive` |

## 9. Signatures

Registered here so they are protected, not copied, and not multiplied. A new one is the owner's
call ([0001](decisions/0001-who-decides-what.md)) and arrives as a prototype
([0005](decisions/0005-choices-arrive-as-prototypes.md)).

| Signature | Where | What protects it |
|---|---|---|
| The sun diagram | The specs | The flagship. Nothing competes with it; gold is its alone |
| The film dial | A voyage's cover seam | Minimal and translucent, not skeuomorphic. First tap opens |
| The room's light | Lightbox, Palette, Reverie, Drift | One mechanism (the wash). No second version |
| The dye vat | Palette, Reverie, the colophon | Misty: a watercolour with no edges |
| Reverie's dye and hex | Reverie | The colour leads; the photograph is provenance |
| Drift's overture | Drift | |
| The monogram | Home's hero | Inline, never a gate. It loops |
| The hero's depth | Every hero | |
| The opening | Hero pages | The masthead stays away, then returns; it yields to a reader looking for the way |
| The map's veil | The atlas | The map never takes the scroll |
| The word card, the emblem rule | Posts, Home | |
| The tarot cards | Corners of several pages | Under review (the owner, 2026-10-01): a new purpose is wanted; the wheel of fortune that spins to a random voyage is liked |

## 10. Words

The voice is the owner's: ornate, ironic, melancholic, in two languages. The `sound-like-qsd` and
`house-style` skills hold it. For the interface:

- A control is named by a plain noun: Specs, Slideshow, Book, Sheet.
- The poetic line belongs to doorways.
- In the Photobook, the owner's call (2026-09-24): constrained and minimal, no over-explaining, no
  jokes. Whether that holds for the whole interface is the owner's to say.
- Never a clock time. Dates only.

## 11. What the language refuses

A new button for one page. A colour of its own for each heading level. A plate over a photograph.
A photograph that moves under the pointer. Numbers at a doorway. A label where a mark is enough,
and a mark with no name for a screen reader. Motion that plays for its own sake. Anything that looks
generated.

## What is settled, decided, open

| | |
|---|---|
| **The owner's, and built** | Doorways withhold; a card is a magazine cover; photographs are prints, with nothing over them; Playfair titles, Barlow labels, Didot figures; gold for the sun alone; the misty vat; one viewer; the monogram's loop; the masthead that hides and returns |
| **Built, and the lead's reading of it** | "The photograph is the light source"; the grammar and its signatures; the four voices; the patterns' names; the pieces marked Built. The tarot cards are built and under review |
| **Decided, not yet built** | The six radii, five durations, three glass depths, six layers; inks on `:root`; the text button, tag and card; white headings; one focus ring; two curves; the ratchet |
| **Open** (the owner's, in the queue or to come) | Link colour; body face and measure for reading; the footer; the tarot cards' next life; whether this page reads true |
