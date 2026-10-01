# Stage 4 · Voyage and the cards

**Status:** designing. Work exists on branch `gallery/voyage-doors` (pushed, not merged).
**Tier:** 2.

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

**From the pairs (the owner, 2026-10-01; `PRINCIPLES.md`, The eye).** "A card leans raised off the
page" (pair 11, score 4): "doesnt have to glow". "Under the pointer a card lifts and grows" (pair 12,
score 5). "Over a photograph, glass and not a solid plate" (pair 10, score 1). "Few things, with room"
(pair 16, score 1).

**Two of these pull against an earlier call. Neither is settled by reading; both are asked.**

- **Does the cover lift?** "No hover lift" (2026-09-26) was said of this card. Pair 12 (score 5) says
  a card lifts and grows; it drew a small card, not a full-width cover. In `PRINCIPLES.md` the later
  date wins, which would keep the lift. The card on `master` lifts and grows today
  (`_sass/_archive.scss:170-184`: up a quarter em, to 1.03, under a deeper shadow, over the owner's
  one second); the branch takes the lift off. Asked in round 2 of [the pairs](../studies/2026-10-01-the-qsd-aesthetic.md),
  with the cover itself drawn. Until it is answered the branch's removal is not merged as decided,
  and nothing is added to the cover.
- **Does a cover take a glass plate?** Pair 10 drew a name on a plate over a cover, in glass and in
  solid, and the owner chose glass. The standing call is "No opaque plates, chips or panels over the
  image": a scrim and a hairline shadow. The pair asked which plate, not whether. The scrim stays
  unless the owner asks for the plate.

## Scope

- [ ] The refined card (branch `gallery/voyage-doors`): bring up to date with master, run the gate.
      Its hover waits on "Does the cover lift?" above.
- [ ] The tags on a card: today each takes its own colour under the pointer and none at rest
      (`_sass/_archive.scss`, the card's hover), which is what the owner's note on pair 4 allows ("it
      can change colour when hovered, if distinguishing colour is required"). Kept as it is until
      round 2 says what colour a hovered tag takes.
- [ ] The card's lift, once round 2 gives the amounts: how far, which shadow, no glow. From the
      `card` piece ([stage 2](02-foundations-plumbing.md)); shown to the owner as a choice. The card
      moves as one object; the photograph does not move inside its frame.
- [ ] Parent pages (Prague, Rome, Japan, Dolomites, Venice) off the old card-list layout.
- [ ] The Voyage index and its length (P03), decided with stage 3's wayfinding walk.
- [ ] Related-post and grid cards get the cover's scrim (P07).
- [ ] The same voyages listed two ways (`/voyage/` and `/voyage-by-tags/`): one card.
- [ ] The tag dock that covers card titles (X14).
- [ ] Venice: four parts "still on their way"; five processed photographs no page uses. The owner
      chose to leave this; ask before touching. (Inbox, 2026-09-26.)
- [ ] 2026-09-29 · Tokyo's line, "Where sakura blooms in the bustling metropolis."
      (`_subvoyage/japan/tokyo.md`): the house-style check names "bustling". It is the card's poem, so
      the word is the owner's. Raise it when the poem comes to phones; change nothing before.

## Design notes

- Built from the `card` piece of [0002](../decisions/0002-one-control-vocabulary.md), which this
  stage is the first real test of.
- The author rail and its social icons on the index: part of the old layout. Whether they stay is
  a call for the queue.

## Exit

Chosen from prototypes. `npm run gate:full` passes with baselines re-captured for the pages meant
to change, and only those.
