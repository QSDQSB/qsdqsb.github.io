# What is the QSD eye, where the design language only guessed?

**Asked:** 2026-10-01 · **Status:** open · **Stage:** 2

## Why it was asked

The owner answered Q3 with "We need to revisit it", and then said how: "Most of the design aesthetics
we established should be inherited. Let's focus on the ambiguous part. The idea of the design language
is not to constrain the layout or ideas, but to have a mimicking QSD aesthetics that can kill bad
designs that are cheap, overly fancy for no good reasons. You can create an artifact or a local html
to use side by side comparison and let me select (score 1-5) of the preference between the two
options, and we approach and summarise the aesthetics".

So the language is not to be a rulebook for layouts. It is to be a description of an eye, exact enough
that a session can tell the house's work from the cheap and the needlessly fancy.

## The tests

- What is already settled is inherited and is not asked again ([`PRINCIPLES.md`](../PRINCIPLES.md)).
- Each pair isolates one thing the draft guessed (the lines marked "the lead's reading" in
  [`DESIGN-LANGUAGE.md`](../DESIGN-LANGUAGE.md)), drawn twice in the site's own ground, inks and faces.
- A score is a leaning, not a rule: what is written afterwards says why, in the owner's words where
  they gave them.

## What was tried

Round 1: seventeen pairs, on a page of their own, https://claude.ai/artifact/MKXF1rRxmTxmydfvzYv9AN.
Each is scored 1 (A, clearly) to 5 (B, clearly), 3 for either; "Neither is the site" and a note are
answers too. The scores are kept with the page, in its `scores` collection, one document per pair id
(`ArtifactData`, `action: "list"`, `collection: "scores"`); `all` holds what the pairs missed. The
page's source is `design/taste/aesthetic-pairs.src.html` (outside git, as prototypes are).

| # | id | The question | A | B |
|---|---|---|---|---|
| 1 | `corners` | The corners of a print | Square | Soft |
| 2 | `controls` | The shape of a control | Pills, and a round tool | Square, hairline |
| 3 | `container` | How a block of words is held | On the ground, under a rule | In a card |
| 4 | `tags` | Tags | Each its own muted colour | Ink only |
| 5 | `accent` | Where an accent comes from | Always brass | Taken from the photograph |
| 6 | `heading` | A heading that wants attention | White, with a brass eyebrow | A gradient, with a glow |
| 7 | `display` | The voice of a title | Serif, italic | Sans, capitals |
| 8 | `caption` | The voice of a caption | Small capitals, spaced | Serif, italic |
| 9 | `figures` | The voice of a number | Serif figures | Sans, tabular |
| 10 | `glass` | A plate over a photograph | Glass | A solid plate |
| 11 | `shadow` | Whether a card lifts off the page | Flat, under a rule | Raised, with a glow |
| 12 | `hover` | What a card does under the pointer | Brightens; a line draws under its name | Lifts and grows |
| 13 | `arrive` | How words arrive | A quarter second, almost in place | Slower, from below, in turn |
| 14 | `words` | How the interface speaks | Plain | With a voice |
| 15 | `ornament` | Between two passages | A hairline | A brass ornament |
| 16 | `density` | How much air | Few, with room | Many, in rows |
| 17 | `icons` | Icons | Hairline, in ink | Filled, each in a colour |

Three of the pairs (6, 11, 17) put the house beside something loud on purpose: they calibrate how
firmly the eye turns the loud thing away, which is the half of the language that kills bad designs.

The owner's scores: not yet given.

## What was learned

Nothing yet. When the scores are in: a short description of the eye, each line marked the owner's
(with the pair and the score behind it), replacing the lead's readings in the design language; then a
second round on whatever the first left split.

## What it led to

Nothing yet.
