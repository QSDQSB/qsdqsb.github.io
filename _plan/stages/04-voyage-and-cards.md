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

**Next step the owner named:** today's card view, refined: full colour, the poem on phones, no hover
lift.

## Scope

- [ ] The refined card (branch `gallery/voyage-doors`): bring up to date with master, run the gate.
- [ ] Parent pages (Prague, Rome, Japan, Dolomites, Venice) off the old card-list layout.
- [ ] The Voyage index and its length (P03), decided with stage 3's wayfinding walk.
- [ ] Related-post and grid cards get the cover's scrim (P07).
- [ ] The same voyages listed two ways (`/voyage/` and `/voyage-by-tags/`): one card.
- [ ] The tag dock that covers card titles (X14).
- [ ] Venice: four parts "still on their way"; five processed photographs no page uses. The owner
      chose to leave this; ask before touching.

## Design notes

- Built from the `card` piece of [0002](../decisions/0002-one-control-vocabulary.md), which this
  stage is the first real test of.
- The author rail and its social icons on the index: part of the old layout. Whether they stay is
  a call for the queue.

## Exit

Chosen from prototypes. `npm run gate:full` passes with baselines re-captured for the pages meant
to change, and only those.
