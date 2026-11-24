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
  The front matter is this site's: the number, the creature, the place, their Chinese names, a line
  that is a sentence of the story's own, and a photograph of the place from the owner's archive.
- **The door** (`/bestiary/`, `_layouts/bestiary.html`): its hero, a few words in two languages, then a
  card for every fable (the `card` piece, 18 px: the scene), the photograph as the cover, the number,
  place and both titles as the cover line. Two to a row from 1024 px, one on a phone; as many rows as
  there are fables.
- **A fable** (`_layouts/fable.html`): the hero, its title and line, then the story at once behind
  the site's switch, its Chinese in the essays' Song (the subset now cut for the fables too), and the
  onward links to the fables either side and the Bestiary.
- No new piece: everything is the grammar. What the vocabulary missed is the record, which stays the
  Bestiary's own.

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
- **The plates live in R2, never git** (the owner): the site's `bestiary/` gallery, staged in the
  git-ignored `photos/bestiary/` until the owner's `QSD`; fables to name their plate, the soft edge a
  CSS mask.

Waiting on the owner: (the titles and the door's words are answered above; what follows is older) the door's few words (drafted from the bestiary's description, and they replace the holding
page's 施工中 and its emoji); the two photographs (sesto/dscf9401 for Val di Cenere, which is not a
real valley; siusi/dscf0634 for Alpe di Siusi); story 01's 中文版 is marked a draft in the bestiary.

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
