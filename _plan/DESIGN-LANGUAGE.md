# The QSD design language

**Version 0, 2026-10-01. A draft, and the owner's in part.** Asked whether it reads true (Q3), the
owner answered "We need to revisit it", and said how: what is established is inherited, and the
ambiguous part is asked as pairs to score. Round 1 was scored the same day
([the study](studies/2026-10-01-the-qsd-aesthetic.md)). The lines it answered are the owner's now,
recorded in [`PRINCIPLES.md`](PRINCIPLES.md) under "The eye", and may be rested on. The page stays
version 0 until the owner says it reads true, and where it and the principles differ, the principles
win.

What it is for (the owner, 2026-10-01): "not to constrain the layout or ideas, but to have a
mimicking QSD aesthetics that can kill bad designs that are cheap, overly fancy for no good reasons".
So this page describes an eye. It is not a rulebook for layouts: a layout or an idea is free, and is
then put to the test below.

Three kinds of line are in it, and each is marked. **The owner's** is a call the owner made: dated,
quoted, or given as a pair and its score ("12: 5" is pair 12, scored 5; a 2 or a 4 is a leaning; a 3
is either and makes no rule). **Built** is what the code does today. **The lead's reading** is this
page's own ordering of the two: every rule without a date, a score or a "built" is one of those.
Where the code does not yet do what a line says, the line says so.

[`PRINCIPLES.md`](PRINCIPLES.md) is why. This page is how. `_docs/components.md` is the catalogue of
the pieces in code. [`WORKFLOWS.md`](WORKFLOWS.md) is how to work with all three.

## What the eye turns away

The test a proposed design is put to before anything else. **The wording is the lead's, drawn from
the owner's scores, until the owner confirms it.** Each line names the pairs it stands on.

A design is turned away when it has:

1. **A saturated block of colour that is not a photograph**: on a tag (4: 5), an icon (17: 1), a
   plate over a picture (10: 1). "Crowded saturated colour blocks are distracting visually."
2. **Glow.** A card may lift; it "doesnt have to glow" (11: 4). A heading does not glow (6: 1).
3. **Type that is a gradient** (6: 1).
4. **A dependency or a mechanism that changes nothing the eye sees.** "When similar visually, choose
   the simpler one with less dependency and complexity" (5: 1).
5. **Crowding.** Few things, with room (16: 1).
6. **An effect that draws the eye to itself.** "Prefer B, but do not overdesign" (13: 4); "aesthetic
   but not distracting" (on hover and focus, the audit's C02).

It kills the cheap and the needlessly fancy. It does not ask for plainness: the owner chose lift
(12: 5) and ornament (15: 5) over the quiet option each time. And passing it is not the bar. It only
means a design has not been refused.

## Until the owner has talked it through

The conversation has begun. Round 1 settled **which**. It did not settle **how much**.

- **Settled, and the owner's** (quote [`PRINCIPLES.md`](PRINCIPLES.md), The eye, not this page): a
  print is square and a card is a rounded rectangle; tags and icons are ink, with no block of colour;
  the accent is brass; glass, not a solid plate; a card lifts and grows under the pointer; a brass
  ornament between passages; few things, with room; a caption in spaced small capitals. As leanings
  (a 2 or a 4): a control is rounded, a card is raised at rest, words arrive more slowly and from
  below.
- **Left free** (a 3): how a block of words is held; the face of a number; the voice of a title,
  which goes by purpose; plain words or voiced, which is a combination.
- **Not settled: every amount.** A radius, a distance, a shadow, a time, a curve. A change a reader
  sees that needs one of those waits for round 2. So do the four places where a score meets an
  earlier call (`PRINCIPLES.md`, "Where these meet an earlier call").
- **Not asked at all, and still the lead's reading**: the split into grammar and signatures and its
  test; the patterns' names and the Shell row's "never"; what protects a signature beyond the owner's
  own quoted call; the wording of "What the eye turns away"; section 11. A lead's reading decides
  nothing a reader sees. It may place a page (which pattern, which pieces) and be the reason a
  question is asked. It is not quoted to the owner as a rule, and a fit check against it says "the
  lead's reading" beside its verdict.
- **A line marked built is a fact about the code.** Bringing a surface into line with a shared piece
  that is built is tier 1, as before ([0001](decisions/0001-who-decides-what.md)).
- **The scales and the pieces marked "decided, not built"** stand on
  [0002](decisions/0002-one-control-vocabulary.md) and
  [0003](decisions/0003-stylesheet-organisation.md), accepted under delegation. Work on them that
  moves no pixel goes ahead. A move a reader can see onto a radius, a duration, a curve or a depth of
  glass waits until round 2 is scored. Then what the owner answered is built to the answer; what was
  not asked stands on 0002 and the owner's Fix marks on the audit, as tier 1, shown before and after.
- **No signature is added, retired or re-ranked** on this page's say.

### For the conversation

**Round 2, on the pairs page: how much, not which.**

1. The radius of a card, and of a control.
2. How far a card lifts and grows, and what shadow it casts. With it: whether the full-width voyage
   cover lifts at all (the owner said "no hover lift" of it on 2026-09-26).
3. How slowly words arrive, and whether they overshoot ("never bouncy" is in the principles).
4. Which ornament, and where it may stand.
5. What colour a tag takes when hovered, if any.

The pairs page is the record of what was asked. Where it asks more than these five, this list is
behind it.

**Still to be talked through. No pair asked them.**

- **Is "a grammar and its signatures" the owner's way of seeing the site?** Everything below hangs on
  it. The six lines it grows from ("What makes the site itself", in `PRINCIPLES.md`) are a draft the
  owner has not corrected. Twelve signatures are registered: which are missing, and which would the
  owner not protect? Is the list of signatures where whimsy lives?
- **How far does the Photobook's manner reach?** Its shell under every new page. And its register of
  words: the interface speaks in a combination (14: 3), but the book's constraint is the owner's
  earlier call, for the book, and the pair did not ask about the book.
- **Which titles are storytelling and which are for reading** (7: 3). Every title is Playfair bold
  today. Does a voyage's title turn italic? Is a utility's title Barlow?

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
| The interface | **No block of colour of its own** (the owner: 4: 5, 10: 1, 17: 1). Ink, glass and brass. A control that must be told apart "can change colour when hovered, if distinguishing colour is required": which colour is round 2. | Not yet so: `_data/tag_colours.yml` tints the tag pages and a post's pills; the type badges; About's notice |
| Ink | Three inks and a line: ivory for what is read, a quieter grey for what supports it, a third for what waits. | `--photobook-ink`, `-ink-2`, `-ink-3`, `-line` (moving to `--ink…`, [0002](decisions/0002-one-control-vocabulary.md)) |
| Brass | The one metal and **the one accent** (the owner, 5: 1: always brass, never taken from the photograph): marks, the focus ring, what is on, a title's accent. Aged, never bright. | `$intriguing-word-color` #c3b498, `$h2-color` |
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
| The title | Playfair Display bold | A page's title, every page's, a voyage's included (the owner, 2026-09-25). `display-title` |
| The poetic and the storytelling | Didone, serif, italic. Built as Didot italic | The lede under a title; the poetic line at a doorway. `lede` |
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

| | Rule |
|---|---|
| A print | **Square corners** (the owner, 1: 1). Nothing laid over it ("photographs are prints"). Built in the book and the viewers |
| A picture inside an article | May be a rounded rectangle. The owner: "We sometimes use rounded rectangle for pictures in the middle of article to make it more smooth" |
| A card | **A rounded rectangle** (the owner: "Rounded Rectangle is for card-like elements"). How round is round 2; 16 px in 0002 |
| A cover on a card | Takes the card's corners. Built |
| A control | **Rounded**: round (a tool), a pill, or a rounded rectangle. The owner (2: 2, a leaning): "Doesn't have to be pills, rounded rectangle is fine". Not hard-square. How round is round 2 |
| A panel of glass | 10 px (0002; not asked) |
| A line | One pixel, in the line ink. It organises |
| An ornament | **Between two passages, a brass ornament, not a hairline** (the owner, 15: 5). New grammar, not yet designed: which ornament and where it may stand is round 2. Its relative in the code is the emblem rule, a signature |
| How words are held | On the ground under a rule, or in a card: either (3: 3). No rule |
| Space | **Few things, with room** (the owner, 16: 1). The gutter is `clamp(1rem, 3vw, 2.4rem)`; prints sit `clamp(6px, 0.7vw, 12px)` apart |

The radius scale is six steps (none, 3, 10, 16, pill, round). The code has thirty-six values today;
the scale is decided and not yet built ([0002](decisions/0002-one-control-vocabulary.md)), and round
2 may move its steps for a card and a control.

## 4. Depth and glass

Two things lift off the page: glass, and a card.

**Glass** says "this floats above the photograph". Where something must lie over a picture it is
glass, never a solid plate (the owner, 10: 1: "pure-colour block distracts readers"). It is a depth
cue, not decoration.

| Depth | Blur | For |
|---|---|---|
| Control | 12 px | A round tool, a tooltip |
| Bar | 18 px, saturate 140% | A pill, the dial's well, the masthead |
| Panel | 24 px, saturate 130% | The specs, a sheet |

One edge: a hairline of white at about a tenth. Over a pale sky a bar is darkened behind
(`glass-bar`) so its marks keep their contrast. A cover carries a scrim and no plate (the owner,
Cards: "No opaque plates, chips or panels over the image"); pair 10 chose glass over solid and did
not ask whether a cover takes a plate.

**A card** is raised off the page, by a shadow (the owner, 11: 4, a leaning: "doesnt have to glow").
No glow. The draft had only controls and panels floating: the lead's guess, and the owner leans the
other way. How far, and which shadow, is round 2. 0002 has no scale for a shadow: one is decided once the amounts
are the owner's, in a record of its own.

Layers, lowest first: the page, what sticks (the control bar), the masthead, what lies over the
page (a sheet, search), a modal, a tooltip.

## 5. Motion

> Smooth but not heavy; aesthetic but not distracting. (the owner, 2026-10-01, on hover and focus)

| Step | Time | For |
|---|---|---|
| Fast | 0.15 s | A control answering: a press, a tick |
| Base | 0.3 s | A control's hover and focus, a colour or border change |
| Slow | 0.6 s | A print developing, a panel moving |
| Cover | 1 s | A magazine cover answering the pointer. Deliberate, cinematic; never shortened to feel snappy |
| Scene | 1.1 s and over | A room's light changing, an opening |

Two curves: standard for things leaving, smooth for things arriving. The cover has its own. Not yet
so: the code has eight (audit C04).

- **A card answers the pointer by lifting and growing** (the owner, 12: 5), not by brightening. The
  draft guessed the quiet hover; the owner chose the other. How far is round 2. The card moves as one
  object: nothing moves inside its frame.
- **Words arrive from below, one line after another, and take their time** (the owner, 13: 4, a
  leaning: "Prefer B, but do not overdesign"). The draft said "not by sliding in"; that was the
  lead's. Built today: `reveal-on-scroll`, a 12 px rise over half a second, all at once. How slowly,
  from how far, and the turn-taking are round 2.
- **Formation.** Things become: a print develops over its placeholder, a wash crossfades as the
  light shifts.
- **Nothing new overshoots** until the owner says so: "never bouncy" (`PRINCIPLES.md`, The
  direction). Round 2 asks.
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
| Controls | A text button (solid and quiet; a rounded rectangle is fine, 2: 2). One tag: ink only, one look for every tag (4: 5) | Decided, not built |
| Surfaces | Bar glass, wash, surface relief | Built |
| Surfaces | Glass at three named depths. One card: raised, and it lifts and grows under the pointer (11: 4, 12: 5) | Decided, not built |
| Marks | Brass focus; the palette strip | Built |
| Marks | One mark for "current" | Decided, not built |
| Marks | A brass ornament between passages (15: 5) | The owner's; not designed |

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

- **A combination** (the owner, 14: 3): "I prefer a combination. Clarity when needed. For example:
  "34 frames; Nothing here but dust and echoes. ONWARD"". The lead's reading of the example: a fact
  is said plainly (a count, a date, a tool's name); an empty room and a way on may carry the voice.
- A tool is named by a plain noun: Specs, Slideshow, Book, Sheet.
- The poetic line belongs to doorways. A count does not ("Doorways withhold").
- In the Photobook, the owner's call (2026-09-24): constrained and minimal, no over-explaining, no
  jokes. It stands for the book until the owner says the combination reaches into it.
- Never a clock time. Dates only.

## 11. What the language refuses

Beyond the eye's test at the head of this page. From the owner's standing calls: a colour of its own
for each heading level; an opaque plate over a cover; a photograph that moves under the pointer;
numbers at a doorway; anything that looks generated ("not an AI-generated showpiece"). The lead's
reading: a new button for one page; a label where a mark is enough, and a mark with no name for a
screen reader.

## What is settled, decided, open

| | |
|---|---|
| **The owner's, and built** | Doorways withhold; a card is a magazine cover; photographs are prints, square, with nothing over them; Playfair titles, Barlow labels, Didot figures; gold for the sun alone; the misty vat; one viewer; the monogram's loop; the masthead that hides and returns |
| **Built, and the lead's reading of it** | "The photograph is the light source"; the grammar and its signatures; the patterns' names; the pieces marked Built. The tarot cards are built and under review |
| **The owner's, not yet built** | White headings; brass links with a hairline underline (Q9); tags in ink only; no block of colour in the interface; brass as the one accent on every page |
| **The owner's from the pairs, waiting on an amount** (round 2) | A card's corners, its lift at rest and under the pointer; a control's corners; how words arrive; the brass ornament; a tag's colour when hovered |
| **Decided under delegation, not yet built** ([0002](decisions/0002-one-control-vocabulary.md), [0003](decisions/0003-stylesheet-organisation.md)) | The six radii, five durations, three glass depths, six layers; inks on `:root`; the text button, tag and card; one focus ring; two curves; the ratchet |
| **Open** (the owner's, in conversation or to come) | Whether this page reads true: round 1 scored, round 2 asked; the wording of "What the eye turns away"; grammar and signatures; how far the book's manner reaches; which titles are storytelling; body face and measure for reading; the footer; the tarot cards' next life |
