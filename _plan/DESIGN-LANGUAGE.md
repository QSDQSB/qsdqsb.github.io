# The QSD design language

**Version 1, 2026-10-01: the owner said the page reads true (Q11, answered A). It is the owner's
wherever a line says so; a number marked the lead's is still the lead's, and stays reversible
([decisions/0009](decisions/0009-how-much.md)).** Asked to accept it unread (Q3), the owner
answered "We need to revisit it", and settled the ambiguous part by eye: seventeen pairs scored
(round 1, which) and sixteen picks (round 2, how much), both on 2026-10-01
([the study](studies/2026-10-01-the-qsd-aesthetic.md)). Those calls are in
[`PRINCIPLES.md`](PRINCIPLES.md) under "The eye"; the amounts, as a scale to build from, are
[decisions/0009](decisions/0009-how-much.md). Where this page and the principles differ, the
principles win.

What it is for (the owner, 2026-10-01): "not to constrain the layout or ideas, but to have a
mimicking QSD aesthetics that can kill bad designs that are cheap, overly fancy for no good reasons".
So this page describes an eye. It is not a rulebook for layouts: a layout or an idea is free, and is
then put to the test below.

**How a line is marked.** **The owner's** is a call the owner made: dated, quoted, or given by its
pair or pick ("12: 5" is round 1, pair 12, scored 5; a 2 or a 4 is a leaning, a 3 makes no rule;
"r2: 4" is round 2, pick 4). **Built** is what the code does today. **The lead's reading** is this
page's own ordering of the two: every rule with no date, score, pick or "built" beside it.

**After two rounds.**

- **The owner's:** the test below; no block of colour in the interface, brass as the one accent,
  tags and icons in ink, glass and not a solid plate; the corners of a print, a card, a control and
  an article's picture; a card's shadow, the range of its lift and how long it takes; the wide
  cover that does nothing; how words arrive; that nothing springs (but for the bubbles, section 5);
  the ornament and where it stands; how much glass; Playfair bold titles; captions in spaced
  capitals; few things, with room; the book's voice in its empty rooms and ways on. And every dated
  call quoted on this page.
- **Left free by the owner** (a 3): how a block of words is held; the face of a number; plain words
  or voiced, which is a combination.
- **Still the lead's reading:** the split into grammar and signatures, and its test; the patterns'
  names and the Shell row's "never"; what protects a signature beyond the owner's own quoted call;
  the test carried to things no pair drew (the type badges, About's notice); the single values
  chosen inside a range the owner gave, and the places a pick met something it did not draw (both
  listed in 0009). A lead's reading decides nothing a reader sees. It may place a page (which
  pattern, which pieces) and be the reason a question is asked; a fit check against it says "the
  lead's reading" beside its verdict.
- **Building on it:** a visible change that brings a surface to one of the owner's amounts is tier
  2, answered: built without asking again, through the full gate and the reviewer, and shown as
  pictures at both widths (0009, "Who may build what"). No signature is added, retired or re-ranked
  on this page's say.

[`PRINCIPLES.md`](PRINCIPLES.md) is why. This page is how. `_docs/components.md` is the catalogue of
the pieces in code. [`WORKFLOWS.md`](WORKFLOWS.md) is how to work with all three.

## What the eye turns away

The test a proposed design is put to before anything else. **The owner's** (r2: 16: "It reads
true", "Use it as the test"). The five lines are as the owner was shown them; the pairs named after
each are the lead's note of what it rests on.

A design that does any of these is sent back before anything else is asked of it:

1. **A saturated block of colour in the interface that is not a photograph.** On a tag (4: 5), an
   icon (17: 1), a plate over a picture (10: 1). "Crowded saturated colour blocks are distracting
   visually."
2. **Glow, and type that is a gradient.** A heading does neither (6: 1). A card may lift; it
   "doesnt have to glow" (11: 4).
3. **A mechanism or a dependency that changes nothing the eye sees.** "When similar visually, choose
   the simpler one with less dependency and complexity" (5: 1).
4. **Crowding: many things where few would do.** Few things, with room (16: 1).
5. **An effect that draws the eye to itself.** "Prefer B, but do not overdesign" (13: 4); nothing
   springs (r2: 12).

It kills the cheap and the needlessly fancy. It does not ask for plainness: the owner chose lift
(12: 5) and ornament (15: 5) over the quiet option each time. And passing it is not the bar. It only
means a design has not been refused.

## Still to be talked through

No pair asked these.

- **Is "a grammar and its signatures" the owner's way of seeing the site?** Everything below hangs on
  it. The six lines it grows from ("What makes the site itself", in `PRINCIPLES.md`) are a draft the
  owner has not corrected. Twelve signatures are registered: which are missing, and which would the
  owner not protect? Is the list of signatures where whimsy lives?
- **Does the Photobook's shell stand under every new page?** Its words are settled (section 10).
- **Is a utility's title Barlow?** A voyage's title stays Playfair bold (r2: 14); pair 7 gave Barlow
  to "easy readability (like Utils)" and no pick asked about a title there.
- **What a pick met and did not draw**: the built pill and round tool, the book's deeper glass, the
  words a wide cover shows under the pointer, and the rest of "Not settled" in
  [0009](decisions/0009-how-much.md).

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
| Light | **The photograph is the light source.** A room takes its colour from the picture in view: the glow, the wash, the dye. Built, and the lead's reading of it. | `glow.js`, `wash`, `vat.js` |
| The interface | **No block of colour of its own** (the owner: 4: 5, 10: 1, 17: 1). Ink, glass and brass. **A tag takes no colour, even under the pointer: it only brightens** (r2: 10). | Not yet so: `_data/tag_colours.yml` tints the tag pages, the pills under a post and at a book's end, and a search result's tags; the type badges; About's notice. The atlas colours its markers from the same file: a dot on a map, which no pair drew |
| Ink | Three inks and a line: ivory for what is read, a quieter grey for what supports it, a third for what waits. | `--photobook-ink`, `-ink-2`, `-ink-3`, `-line` (moving to `--ink…`, [0002](decisions/0002-one-control-vocabulary.md)) |
| Brass | The one metal and **the one accent** (the owner, 5: 1: always brass, never taken from the photograph): marks, the focus ring, what is on, a title's accent, the ornament. Aged, never bright. | `$intriguing-word-color` #c3b498, `$h2-color` |
| Gold | The sun's alone, in the specs. | `--photobook-gold` |
| Film hues | A film carries its own hue, as a tick or a dot, nowhere larger. | the dial, the colophon |
| Headings | **White by default.** The owner, 2026-10-01: "Titles should be default white coloured"; "retire the overly colourful H1 to H6 font colour". Never a gradient, never a glow (6: 1). Which white (the ivory ink, or pure white) is shown before it is built. | Not yet built: `_sass/_base.scss:63-85` still colours h2 to h5 |
| A link in a page's text | **Brass, with a hairline underline.** The owner, 2026-10-01 (Q9, option B, picked from three prototypes). Hover brightens to ivory. | Not yet built: `_sass/_base.scss:31-41` still colours every link `$link-color` #6fcdff. A task in [stage 2](stages/02-foundations-plumbing.md) |
| Refused | Neon. A saturated block of colour that is not a photograph (the owner, above). The lead's reading carries that to the type badges and to About's gradient notice, which no pair drew. | |

## 2. Type

A voice for each purpose. The owner (7: 3, either): "Both have their usecase. Italic, serif, didone
font for poetic and storytelling text (like Voyage); Barlow for easy readability (like Utils)". The
faces are the owner's; the rows are the lead's arrangement of them.

| Voice | Face | For |
|---|---|---|
| The title | Playfair Display bold, upright | A page's title, every page's, a voyage's included (the owner, 2026-09-25; kept, r2: 14). `display-title` |
| The poetic and the storytelling | Didone, serif, italic. Built as Didot italic | The lede under a title; the poetic line at a doorway. Never the title. `lede` |
| What must be read easily | Barlow | The interface, a utility, anything that names |
| The label and the caption | Barlow, spaced capitals | Eyebrows, places, and the line under a print (the owner, 8: 1: "Easier to read"). Never under 11 px. `eyebrow` |
| The figure | Didot (the owner, 2026-09-28) | Numbers read as figures; hex codes. Serif or sans tabular scored either (9: 3), so a figure in Barlow is not a fault. In code only Reverie's large hex is Didot (finding F036). Didot is a system face: where a device lacks it the stack falls to CMU Serif, then Playfair |

Body text is Playfair Display today; a reading design for posts is open (stage 6). Code is the
monospace stack and nothing else is: Home's eyebrows in Monaco are a fault (audit C06).

Chinese falls through to Songti. The site speaks two languages in its writing; the Photobook
speaks one.

The scale is `$type-size-1` to `-8`, in rem, so nothing compounds. A size outside it is a decision
to justify.

## 3. Shape and space

The corners are the owner's ([0009](decisions/0009-how-much.md)).

| | Rule |
|---|---|
| A print | **Square** (1: 1). Nothing laid over it ("photographs are prints"). Built in the book and the viewers |
| A picture inside an article | **8 px** (r2: 7). "We sometimes use rounded rectangle for pictures in the middle of article to make it more smooth". Built at 10 px and at 1em |
| A card | **10 px; 18 px where the scenario wants it** (r2: 1: "B or C depend on the scenario"). The lead's reading of the scenario: 18 px where the card is itself the scene, as wide as its column or the largest thing on its screen |
| A cover on a card | Takes the card's corners. Built |
| A control | **A rounded rectangle of 10 px** (r2: 2, chosen over "A pill, and a round tool"). The lead's reading: the built pill and round tool are inherited as they are, and nothing new is drawn as a pill |
| A panel of glass | 10 px (0002; not asked) |
| A line | One pixel, in the line ink. It organises |
| An ornament | **A lozenge on a brass rule** (15: 5; r2: 8), **only between passages of prose** (r2: 9): not under a title, not between groups in the interface. Not built. The emblem rule is a signature and stays |
| How words are held | On the ground under a rule, or in a card: either (3: 3). No rule |
| Space | **Few things, with room** (16: 1). The gutter is `clamp(1rem, 3vw, 2.4rem)`; prints sit `clamp(6px, 0.7vw, 12px)` apart |

The radius scale: none, 3, 8, 10, 18, pill, round. The code has thirty-six values today.

## 4. Depth and glass

Two things lift off the page: glass, and a card.

**Glass** says "this floats above the photograph". Where something must lie over a picture it is
glass, never a solid plate (10: 1: "pure-colour block distracts readers"). It is a depth cue, not
decoration.

| Depth | Blur | For |
|---|---|---|
| Glass | **14 px**, saturate 120% (r2: 11) | The default for anything new. An older panel of dense text (search, the map) is shown beside it before it moves: the pick drew a name on a cover. The blur is in code already (`dark-glass-fill`), under a darker tint |
| Thin | **6 px** (r2: 11: "A B Both OK": either is the owner's) | The lead's reading of which goes where: thin on a small mark over a picture or over code (the type badge on a cover, the copy button), where it is built at 6 px today |
| Bar | 18 px, saturate 140% | Built, inherited: a pill, the dial's well, the masthead. Not drawn in round 2 |
| Panel | 24 px, saturate 130% | Built, inherited: the specs, a sheet. Not drawn in round 2 |

Nothing new is thicker than 14 px: the 26 px option was shown and passed over. One edge: a hairline
of white at about a tenth. Over a pale sky a bar is darkened behind (`glass-bar`) so its marks keep
their contrast. A cover carries a scrim and no plate (the owner, Cards: "No opaque plates, chips or
panels over the image"); pair 10 and pick 11 chose among plates of glass and did not ask whether a
cover takes one.

**A card** stands just off the page on a short shadow (11: 4; r2: 3): one layer,
`0 6px 18px rgba(0, 0, 0, 0.45)`, no border, no glow ("doesnt have to glow"). Not built: the code's
cards carry stacks of two to six.

Layers, lowest first: the page, what sticks (the control bar), the masthead, what lies over the
page (a sheet, search), a modal, a tooltip.

## 5. Motion

> Smooth but not heavy; aesthetic but not distracting. (the owner, 2026-10-01, on hover and focus)

| Step | Time | For |
|---|---|---|
| Fast | 0.15 s | A control answering: a press, a tick, a tag brightening |
| Base | 0.3 s | A control's hover and focus; **a card's lift** (r2: 5) |
| Slow | 0.6 s | A print developing, a panel moving |
| Arrive | 0.7 s | **Words arriving** (r2: 6) |
| Cover | 1 s | What is left of the wide cover's hover: its words. The owner's deliberate second (Cards); the lead's reading of what it still times |
| Scene | 1.1 s and over | A room's light changing, an opening |

Two curves: standard for things answering and leaving, smooth for things arriving. Not yet so: the
code has eight (audit C04).

- **A card lifts and grows under the pointer** (12: 5): between 3 and 6 px and between 1.012 and
  1.025 (r2: 4: "Between A and B"), in 0.3 s (r2: 5). To be built at 4 px and 1.018, the lead's
  value inside that range. It moves as one object: nothing moves inside its frame.
- **The wide cover does nothing under the pointer**: "Nothing moves, nothing changes" (r2: 13; "no
  hover lift", 2026-09-26). Not yet so: on `master` it rises, grows by 3 per cent and changes shape
  over a second.
- **Words arrive from 28 px below over 0.7 s, one line after another, 0.12 s apart, and settle**
  (13: 4; r2: 6). Built today: `reveal-on-scroll`, 12 px over half a second, together.
- **Nothing springs** (r2: 12: "It arrives and stops"; "never bouncy"). Nothing new goes past its
  end. One built exception, not a fault and not changed unasked: the bubbles on Home's hero turn
  with a spring, and they belong to a signature.
- **Formation.** Things become: a print develops over its placeholder, a wash crossfades as the
  light shifts.
- **Keep the reader's place.** A change of film does not scroll the page away.
- **Still when asked.** Every motion has its reduced-motion and `html.motion-off` rule beside it.
- **Never the photograph.** It does not zoom, shift or filter under the pointer.

## 6. How things behave

- **Quiet by default.** Detail appears on hover or in hand. Whatever hover reveals, keyboard focus
  reveals too, and a touch reader gets it at rest or on a first tap. Quiet is about what is shown,
  not about how a card answers (12: 5).
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
- **An icon is a hairline, in ink** (the owner, 17: 1), never filled in a colour of its own.
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
| Controls | A text button, solid and quiet, a rounded rectangle of 10 px (r2: 2). One tag: ink, one look for every tag, brightening under the pointer (4: 5; r2: 10) | The owner's amounts; not built |
| Surfaces | Bar glass, wash, surface relief | Built |
| Surfaces | Glass at 14 px, and thin at 6 px (r2: 11). One card: 10 px, a short shadow, a lift of 0.3 s (r2: 1, 3, 4, 5) | The owner's amounts; not built |
| Marks | Brass focus; the palette strip | Built |
| Marks | One mark for "current" | Decided (0002), not built |
| Marks | The ornament: a lozenge on a brass rule, between passages of prose (r2: 8, 9) | The owner's; not built |
| Motion | The arrival: 0.7 s, 28 px, in turn (r2: 6) | The owner's amounts; built at other amounts (`reveal-on-scroll`) |

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
| The word card, the emblem rule | Posts, Home | The ornament does not replace the emblem rule |
| The tarot cards | Corners of several pages | Under review (the owner, 2026-10-01): a new purpose is wanted; the wheel of fortune that spins to a random voyage is liked |

## 10. Words

The voice is the owner's: ornate, ironic, melancholic, in two languages. The `sound-like-qsd` and
`house-style` skills hold it. For the interface:

- **A combination** (the owner, 14: 3): "I prefer a combination. Clarity when needed. For example:
  "34 frames; Nothing here but dust and echoes. ONWARD"". The lead's reading of the example: a fact
  is said plainly (a count, a date, a tool's name); an empty room and a way on may carry the voice.
- A tool is named by a plain noun: Specs, Slideshow, Book, Sheet.
- The poetic line belongs to doorways. A count does not ("Doorways withhold").
- **In the Photobook**: constrained and minimal, no over-explaining, no jokes (the owner,
  2026-09-24), except that "The book may speak too, in its empty rooms and ways on" (r2: 15). There,
  and nowhere else in the book. The words are the owner's: a session drafts, the owner keeps or
  strikes.
- Never a clock time. Dates only.

## 11. What the language refuses

Beyond the eye's test at the head of this page. From the owner's standing calls: a colour of its own
for each heading level; an opaque plate over a cover; a photograph that moves under the pointer;
numbers at a doorway; a spring; anything that looks generated ("not an AI-generated showpiece"). The
lead's reading: a new button for one page; a label where a mark is enough, and a mark with no name
for a screen reader.

## What is settled, decided, open

| | |
|---|---|
| **The owner's, and built** | Doorways withhold; a card is a magazine cover; photographs are prints, square, with nothing over them; Playfair bold titles, Barlow labels, Didot figures; gold for the sun alone; the misty vat; one viewer; the monogram's loop; the masthead that hides and returns |
| **Built, and the lead's reading of it** | "The photograph is the light source"; the grammar and its signatures; the patterns' names; the pieces marked Built. The tarot cards are built and under review |
| **The owner's, with its amount, not yet built** ([0009](decisions/0009-how-much.md)) | A card's corners, shadow and lift; a still wide cover; a control's corners; an article picture's corners; how words arrive; the lozenge between passages of prose; tags in ink that only brighten; glass at 14 px; the book's voice in its empty rooms and ways on. And from before the pairs: white headings; brass links with a hairline underline (Q9) |
| **Decided under delegation, not yet built** ([0002](decisions/0002-one-control-vocabulary.md), [0003](decisions/0003-stylesheet-organisation.md)) | What 0009 did not move: the hair radius, the fast, base, slow and scene durations, six layers; inks on `:root`; the text button and one mark for "current"; one focus ring; two curves; the ratchet |
| **Open** (the owner's, in conversation or to come) | Grammar and signatures; what a pick met and did not draw (0009, "Not settled"); body face and measure for reading; the footer; the tarot cards' next life |
