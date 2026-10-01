# Stage 5 · Bestiary

**Status:** idea. No design exists for the Bestiary itself. Its holding page is decided (Q5,
2026-10-01) and is the next thing here. **Tier:** 2.

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

- [ ] Frame the choice and write `design/choices/bestiary-holding/choice.json` (the lead).
- [ ] Two or three prototypes, each through the gate, shot at both widths; the choice page published,
      with a one-line entry in the queue that links to it.
- [ ] The picked option built on the Photobook shell; the inline styles gone. Tier 2, on the pick.
- [ ] A journey, `bestiary`: from the masthead the page opens, says what it is, and its way on leads
      to a page that exists. The row in [`FEATURES.md`](../FEATURES.md) gains it.
- [ ] A pixel baseline for `/bestiary/` at both widths; a line in the changelog.

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
