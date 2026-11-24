# Stage 5 · Bestiary

**Status:** building, on the owner's request R024 (2026-11-24): "Read QSDQSB/dolomite-errata-bestiary,
get the idea of the errata-bestiary project, then consider the scalable and sota premium design option
to fit it in our site. In this conversation, implement the first two stories". The holding page is
passed over: the Bestiary itself is built, with its first two fables. The owner's merge is the yes
([0010](../decisions/0010-the-merge-is-the-yes.md)). **Tier:** 2.

## What is built (2026-11-24)

What the Bestiary is, from its own repository (the questions below, answered by the owner's request
and the bestiary's `CLAUDE.md`): bilingual fables set in the Dolomites, each one creature through one
unusual situation, told by a cool archivist; each built on a philosophical idea that is never named.

- **The material** is the bestiary's repository, not this one: `scripts/bestiary-import.mjs` copies a
  story's English and 中文版 into `_bestiary/<title>.md`, between markers, and never its design notes.
  The front matter is this site's: the number, the creature and place (kept for search and the record,
  never shown under a title), their Chinese names, the cover plate (R2), and the `room:`.
- **The whole Bestiary is light parchment (羊皮纸), from its door on** (the owner, 2026-11-24).
- **The door** (`/bestiary/`, `_layouts/bestiary.html`): its photograph across the window fading into
  the parchment, its name and one line beneath, then a card for every fable (the `card` piece: the
  cover plate, the number, both titles as the cover line). Two to a row from 1024 px, one on a phone.
- **A fable** (`_layouts/fable.html`): its cover plate across the window, dissolving into one paper;
  the title and the Chinese title in 宋体; the story behind the site's switch (the Chinese set on its
  grid); the way on (the Bestiary always in the middle). The paper is a parchment tinted by the cover
  (`scripts/bestiary-room.py` writes each fable's `room:`: ground, four contrast-checked inks, the
  palette weighted to the cover's foot). **Beside the words, only where the window leaves at least
  160 px each side**, a room dyed quietly from that palette by the vat (no accent, chroma held low), the
  paper eased into it; **on a phone, paper edge to edge, no dye** (the owner, 2026-11-24). **The texture
  is very faint** (the owner, 2026-11-24, "too strong" three times). The room, paper and relief are
  `_includes/fable-room.html` and `assets/js/bestiary/room.js`, shared by the door and the fables.
- **The door is washed in watercolour** (the owner, 2026-11-24: "use watercolours with the background's
  colour... a magical fable-like Dolomites vibe... can span on the full background"): the photograph's
  whole-image palette, its blue kept, poured over the whole page below the hero, dried in patches and
  thinning softly (no dried edge) round the name and the site's last line.
- **The blend is a watercolour bloom** (the owner, 2026-11-24, after three prototypes, bloom, soaked
  fibre and a pool of light, of a blend with "a clear linear pattern": "prefer A and B, no strong opinion
  in between"): the wash dried short of the words, its edge wandering in both axes, a faint broken tide
  line; the dye poured with a current (calm .45) so it lies in drifts, not strata.

**The owner, 2026-11-24, in the same conversation** (the framework is the bestiary's
`art/README.md`, uncommitted while it is brainstormed):
- The stories are named **The Pineapple Crown** and **The Milk Plate**: a fable is named by its story,
  not its creature.
- **A fable opens as a story**: no creature's name or place under the title ("That's underwhelming").
  The record is gone from the page and the place from the door's cards.
- **The art is a vintage storybook plate**, the owner's own picture of the orange cat as the measure
  and as that cat's image; the tabby is a 背影, walking away with its tail raised. Plates fade into the
  page; fixed objects (the lute, the cup) never change between plates.
- PR #133 was closed: "we are still brainstorming". Nothing is pushed until the direction is settled.
- **One round of calls, answered**: Chinese titles 菠萝王冠 and 牛奶碟; two hands (storybook creatures,
  oil covers, both the owner's own paintings for now); **a warm paper room** for the Bestiary's pages;
  the goblet stays; the lute's missing star and the Milk Plate cover's liberties are accepted; the
  close tabby; the bestiary repo renamed its story too; **no words on the door** and **no line under a
  fable's title** ("The title suffices"); the crown painting cropped at its foot.
- **The door keeps its cards; a fable is its own room** (the owner, 2026-11-24, after prototypes in a
  paper room and a free layout: "I like the card design... use the latest soft light setup for the
  content"). The fable: cover across the window, its foot fading into a room dyed by the vat from the
  cover's lower part (weighted to the foot: "the more bottom the pixel is the more weighted"), a sheet
  of the cover's own light colour eased in from the sides with no edge (later: parchment, above),
  Reverie's relief over the whole background (later: very faint), 宋体 for the
  Chinese. `scripts/bestiary-room.py` writes each fable's `room:`.
- **The plates live in R2, never git** (the owner): the site's `bestiary/` gallery, staged in the
  git-ignored `photos/bestiary/` until the owner's `QSD`; fables to name their plate, the soft edge a
  CSS mask.

**The plates are committed for now** under `images/bestiary/` (the owner, 2026-11-24: "wrap it to the
repo's images for now"; the session's R2 key could not write): each a `.webp` and a `-960.webp`, the
layouts taking either a committed plate or R2's tiers. To R2 later, with the owner's `QSD`.
Waiting on the owner: the door's one line, "An errata of creatures."
(keep or strike); the masthead pill over the pale pages; the door's photograph among paintings; the
blend prototypes; story 01's 中文版 is marked a draft in the bestiary.

## Goal

A page that exists. Today `/bestiary/` ("Dolomiti Errata Bestiary", "An errata of creatures") is a
hero and an under-construction notice, in the masthead and on Home (audit P02, marked Fix).

In two steps. First a holding page worth arriving at, so that one of five destinations is no longer
a building site. Then the Bestiary.

## What is already decided

- **The owner, 2026-10-01 (Q5, option A, tapped on the command centre):** until the Bestiary is
  built, "a designed holding page in the house's language, kept in the navigation". Bestiary keeps
  its place in the masthead and its door on Home.
- [0001](../decisions/0001-who-decides-what.md): "A new look, a new component, a new page" is always
  tier 2. The answer says that there is to be a holding page. How it looks is still the owner's.
- [0005](../decisions/0005-choices-arrive-as-prototypes.md): "A tier 2 choice between ways of doing
  something reaches the owner **already prototyped**, on one page, with a recommendation. Nobody asks
  for the prototype."
- [`PRINCIPLES.md`](../PRINCIPLES.md), The look: "Dark editorial boutique: premium, minimal, classy,
  informative. Not skeuomorphic, and not an AI-generated showpiece." And: "Quiet by default".
- `PRINCIPLES.md`, The eye (2026-10-01), on how the interface speaks (pair 14, score 3): "I prefer a
  combination. Clarity when needed. For example: "34 frames; Nothing here but dust and echoes.
  ONWARD"". The lead's reading, for the frame: that nothing is inside yet is said plainly; the line
  about the binding may keep its voice.
  And "Few things, with room" (pair 16, score 1).
- `PRINCIPLES.md`, Finding the way: "**Immersive without losing direction.**"
- `PRINCIPLES.md`, How the owner likes to be asked: "Reuse the site's own mechanism before writing a
  parallel one."
- [0003](../decisions/0003-stylesheet-organisation.md), step 6, and
  [`ARCHITECTURE.md`](../ARCHITECTURE.md), rule 4: a new page stands on the Photobook shell, never on
  `single` or `archive`.

## The holding page

**How it arrives.** As a `/choose`: two options, three at most, each a real page shot at 1440 and at
390, on one page where the owner taps. The lead frames it; a prototyper builds each option in its own
worktree; each passes the gate before it is shown. Nothing is built into the site until the owner has
picked. "None of these" restarts the frame.

**The frame, for whoever runs the choice.** The question: what does the Bestiary's door show until
the book is bound? The tests, from the lines quoted above:

1. A reader knows at once that nothing is inside yet, and has a way on that is not the Back button.
2. It reads as the house's own page beside a book or the palette, and not as a notice.
3. It is made only of pieces that are built today (the eyebrow, the display title, the lede, the
   onward links, the shell). A holding page that needs a new piece, or a signature, is no longer a
   holding page: that waits for the Bestiary and for stage 2.

**What is there today** (`_pages/bestiary.md`, read 2026-10-01): `layout: single`; a hero of the
Dolomites at sunrise under a 35% filter; three centred lines set with inline styles, "施工中" between
two signs, "The Bestiary is still being bound...", "图鉴装订中..."; three emoji. The masthead's gloss
reads "An errata of creatures, still being bound" (`_data/navigation.yml`).

**The words are the owner's.** Each option sets the words that are on the page today. Where an
option drops or changes any of them (the emoji among them), the choice page says so beside that
option; the pick is then also the owner's word on the words.

**It waits on nothing.** The pieces it may use are built, so it need not wait for stage 2 or stage
4. Like stages 7 and 8, it moves up whenever the owner wants it.

- [-] Frame the choice and write `design/choices/bestiary-holding/choice.json` (the lead). Passed over:
      the Bestiary was built instead (R024).
- [-] Two or three prototypes for the holding page. Passed over (R024).
- [x] Built on the Photobook shell; the inline styles gone (R024, 2026-11-24).
- [x] A journey, `bestiary`: from the masthead the page opens, a card opens a fable, its switch shows
      the Chinese, its design notes are not on the page, and its way on leads on and back. The row in
      [`FEATURES.md`](../FEATURES.md) gains it.
- [ ] A pixel baseline for `/bestiary/` at both widths, re-captured on the owner's `QSD` (a capture
      writes to R2). The line in the changelog is written.

Home keeps five doors, so the overflow of Home's Wonders at 320×640 is mended with five
([stage 3](03-wayfinding.md)).

## The Bestiary itself: before anything is drawn

The lead needs from the owner, in one conversation:

- What the Bestiary is: what a creature is, how many, what each one carries (a picture, a name, a
  text, a place?).
- What it should feel like, in the owner's words, and one or two references.
- Where its material lives: authored YAML like the photographs, or posts.

## Constraints already known

- It is the first page built **only** from the vocabulary
  ([0002](../decisions/0002-one-control-vocabulary.md)), on the Photobook shell
  ([0003](../decisions/0003-stylesheet-organisation.md), step 6). What it has to add shows what
  the vocabulary missed. The holding page is a smaller first test of the same thing.
- It is a design before it is code: a Figma file or real pages with desktop and phone screenshots.

## Exit

For the holding page: the owner's pick is recorded here; `npm run gate:full` passes with a baseline
captured for `/bestiary/` and no other page changed; the journey passes; the reviewer returns PASS.

For the Bestiary: not written until its brief is.
