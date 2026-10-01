# Stage 4 · Voyage and the cards

**Status:** designing. Prototypes exist on branch `gallery/voyage-doors` (pushed, not merged).
**Tier:** 2. What the picks of 2026-10-01 answer is tier 2, answered
([0009](../decisions/0009-how-much.md)).

## Goal

The doorway to the photographs, refurbished: the Voyage index, the parent pages of voyages in parts,
and the card they are both made of. The first older page moved onto the shared pieces, and the
model for the rest.

## What is already decided

From the owner's calls in [`PRINCIPLES.md`](../PRINCIPLES.md), Doorways and Cards. In short:
doorways withhold; the huge vivid cover on a large screen is the point; the overview of several
doors stays; a card is a magazine cover with the same contrast over every photograph; the
photograph never animates; the bar is extraordinary, not competent variants.

Tried and judged (2026-09-26): a contents list, a square-cover grid and one continuous book with
chapter cards: none felt immersive. "By the light" (labels beside plates, ordered by hour): a
definite no. "Hang" and "cinema": competent, not extraordinary. "Through the doors" (scroll moves
through each cover's depth map): fine as the moment of entering, must not replace the card view.

**Next step the owner named (2026-09-26):** today's card view, refined: full colour, the poem on
phones, no hover lift.

**From the pairs (the owner, 2026-10-01; `PRINCIPLES.md`, The eye).**

- "The wide cover of a voyage does nothing under the pointer": "Nothing moves, nothing changes"
  (round 2, pick 13, over "The picture brightens; nothing moves" and "It lifts, as a small card
  does"). "No hover lift" stands, and "The photograph itself never animates on hover" with it.
- "Under the pointer a card lifts between 3 and 6 px and grows to between 1.012 and 1.025" (pick 4,
  A, with the note "Between A and B"); the one value built, 4 px and 1.018, is the lead's. "A lift
  takes 0.3 s" (pick 5). "At rest a card stands just off the page, on a short shadow" (pick 3). "A
  card's corners are 10 px" (pick 1): "B or C depend on the scenario". Each was drawn as a small
  card.
- "Nothing springs" (pick 12). "A voyage's title stays as built: Playfair, bold, upright" (pick 14).
- "Over a photograph, glass and not a solid plate" (pair 10, score 1). "Few things, with room" (pair
  16, score 1).

**Which is the cover and which is a card.** The wide cover is the `card` of
`_sass/_archive.scss:106-329`, drawn the width of its column, 3.5 to 1 from a tablet up
(`_includes/archive-single.html`). It is on `/voyage/`, a voyage in parts, the end of a book,
`/year-archive/`, `/tags/`, `/portfolio/` and under a post. A small card, today, is Home's "What's
new" (`.wn-card`, `_sass/_home.scss:657-683`), whose hover was written to mirror the cover's.

**What the code does today, and what the picks make of it.**

| | Built on `master` | After the picks |
|---|---|---|
| The wide cover, under the pointer | Up a quarter em, grown to 1.03, six shadows deep, its shape from 3.5 to 3.3, its title up a quarter em: all over one second (`_sass/_archive.scss:144`, `170-187`) | None of it (pick 13) |
| The wide cover, its words under the pointer | Its line, its date and the reading time fade in over a second on a desktop; on touch the line and the date are at rest | Not settled: see below |
| Home's cards, under the pointer | Up a quarter em, grown to 1.03, six shadows deep, over half a second | Up 4 px, grown to 1.018, one shadow, over 0.3 s (picks 4 and 5; 0009) |
| Home's cards, at rest | 16 px corners, a hairline, no shadow | A short shadow (pick 3). One corner for the whole grid: 18 px, by the lead's reading of "the scenario" (the grid is Home's scene), which is 2 px from what is built |

**The branch, against the picks.** `gallery/voyage-doors` holds prototypes only (`design/doors/`,
no site code). Its refined door is the 3.5 to 1 cover, so it is the wide cover.

- Its **removal of the lift and the growth is confirmed** (pick 13). The reading that pair 12 might
  put the lift back on the cover is closed: pair 12 and picks 4 and 5 are about a small card, and
  the branch draws none.
- Its picture that **breathes with the depth map as the pointer nears is contradicted**: "Nothing
  moves, nothing changes", and "The photograph itself never animates on hover". The door's opening
  on a click is not under the pointer and is untouched; it may not overshoot (pick 12).
- Its poem that brightens and its line of atmosphere that appears on hover are words under the
  pointer: not settled, below.
- Its square corners and no shadow meet picks 1 and 3 (a card is 10 or 18 px, on a short shadow).
  Those picks drew a small card. Not settled; the lead's recommendation is the card's corners at 18
  px and the short shadow, since the owner's own name for it is a card.

## Scope

In order. The `card` piece comes from [stage 2](02-foundations-plumbing.md) and is built there first.

**Tier 2, answered. Pictures at both widths; a hover as a short capture.**
- [ ] The wide cover of a voyage is still under the pointer (pick 13). From
      `.card:hover, .card:focus-within` take the transform, the deeper shadow, the change of shape
      and the title's rise; the `aspect-ratio` transition goes with them. Keyboard focus keeps a
      mark: `brass-focus`. The words that fade in are left exactly as they are for now. Answered
      for a voyage's cover: `/voyage/`, a voyage in parts, the end of a book. Baselines hold, since
      rest does not change.
- [ ] **Tier 1, the lead's reading, not answered:** the same rule draws the card of a post, a
      portfolio entry and the tag page, and the owner said "of a voyage". One piece, one behaviour
      (0009, "Not settled") takes the lift off post cards the owner was not shown. `/year-archive/`
      and a post's related cards are in the report before and after, as captures, and the owner can
      reverse it: the post card would then keep a lift, the `card` piece's.
- [ ] The `cover-still` journey, in `scripts/check-journeys.mjs`, with the task above: on `/voyage/`
      at desktop width, hover the first `.card` and assert its computed transform is none and its
      shadow is what it was at rest; on Home, hover a "What's new" card and assert that it does
      move. Nothing else guards "the wide cover does nothing".
- [ ] Home's "What's new" cards take the `card` piece's lift: 4 px, 1.018, one shadow, 0.3 s on the
      standard curve; the six-shadow stack goes (picks 4, 5, 12). The lift's single values are the
      lead's (tier 1).
- [ ] Home's cards at rest take the short shadow, `0 6px 18px rgba(0, 0, 0, 0.45)` (pick 3), and
      one corner, 18 px (pick 1's note; that this grid is "the scenario" is the lead's reading, tier
      1). Home's baseline is re-captured.

**Tier 2: the owner's, as a choice** ([0005](../decisions/0005-choices-arrive-as-prototypes.md))
- [ ] The refined card (branch `gallery/voyage-doors`): bring up to date with `master`, take out the
      breathing picture, run the gate. The prototypes put three things to the owner at once:
      - the words under the pointer: none at all (pick 13 to the letter, with the poem at rest as on
        a phone); or the line and the date still arriving under the pointer ("Quiet by default:
        detail on hover or in hand"), over the owner's one second;
      - its corners and its shadow at rest: the card's (18 px, a short shadow), or square and flat
        as the branch draws it;
      - the poem on phones, which differs from the desktop and so needs the owner's word
        (`CLAUDE.md`, Responsive Policy).
- [ ] Parent pages (Prague, Rome, Japan, Dolomites, Venice) off the old card-list layout.
- [ ] The Voyage index and its length (P03), decided with stage 3's wayfinding walk.
- [ ] Related-post and grid cards get the cover's scrim (P07).
- [ ] The same voyages listed two ways (`/voyage/` and `/voyage-by-tags/`): one card.
- [ ] The tag dock that covers card titles (X14).
- [ ] Venice: four parts "still on their way"; five processed photographs no page uses. The owner
      chose to leave this; ask before touching. (Inbox, 2026-09-26.) Its line is one of the book's
      empty rooms: the words are drafted in [stage 3](03-wayfinding.md).
- [ ] 2026-09-29 · Tokyo's line, "Where sakura blooms in the bustling metropolis."
      (`_subvoyage/japan/tokyo.md`): the house-style check names "bustling". It is the card's poem, so
      the word is the owner's. Raise it when the poem comes to phones; change nothing before.

**Corrected 2026-10-01.** This file said a voyage card's tags take their colour under the pointer.
The rule exists (`_sass/_archive.scss:196-199`) and no card emits a tag: it is dead, and is deleted
with A05 in stage 2. There is no tag on a card to restyle.

## Shared pieces

- Uses: `card` (rest, lift), `brass-focus`, `eyebrow`, `lede`, the scrim. Nothing new.
- The wide cover is the `card` piece without its lift. If that needs a second piece, it is said in
  the catalogue first ([0002](../decisions/0002-one-control-vocabulary.md)).

## What needs the owner

- The refined card's three questions above: one choice page, not yet in the queue (it needs the
  prototypes brought up to date first).
- Does a cover take a plate of glass? Pair 10 and pick 11 drew a name on one. The standing call is
  "No opaque plates, chips or panels over the image": the scrim stays unless the owner asks.
- The author rail and its social icons on the index: part of the old layout. Whether they stay is a
  call for the queue.

## Journeys

`voyages` and `home` must pass. To add: `cover-still` (in the scope above), which holds the still
cover and the small card's lift. With the refined card: a cover's line can be read without a
pointer, at desktop width and on touch (it is only under the pointer on a desktop today).

## Exit

The answered tasks: `npm run gate:full` passes, the reviewer returns PASS, and the owner has the
pictures and the captures. The rest: chosen from prototypes, with baselines re-captured for the
pages meant to change, and only those.
