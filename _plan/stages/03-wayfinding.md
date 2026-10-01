# Stage 3 · Wayfinding

**Status:** planned · **Tier:** 2. Navigation and structure are always the owner's.

## Goal

A site that is easy to get around and obvious to use, without becoming ordinary. The owner's words
(2026-10-01): easy to navigate, the interface intuitive.

The house hides things for the curious, and doorways withhold. So the test is not "everything is
visible". It is: **a reader who wants something specific can get to it, and always knows how to get
back.**

## What the audit already saw

- The masthead collapses to a hexagon on scroll and fades out after three seconds. On a phone it
  takes one touch to summon and a second to press. On Home's hero there is no navigation at all.
- On hero pages the navigation is hidden for three seconds on every load (X02), and twitches on
  every touch (X01).
- Five destinations. One is a building site (P02). Reverie is reached only through Palette; plain
  Drift, Ridgway's plates and `/utils/` have no door, by choice.
- The Voyage index is one column of thirty covers (P03). The map is the only other way in.
- The way back is a chevron with four implementations (C11). From a book's lightbox, Back is right.
- Search is an icon with no open state on a phone (X09); it does not know place names.
- Many controls are icons with no name on touch: the Photobook's tools, Screening, the view switch.
- On desktop, a card's line and date appear only on hover; on a phone they are at rest.
- Home has no footer, so RSS and Terms are unreachable from the front page (P05).
- The Posts list shows a cover and a title; nothing says what a post is about.

## First task: measure it

Eight things a reader comes to do, each walked on a phone and on a desktop, counting taps, dead ends
and moments of "where am I". Cheap, objective, and it replaces opinion with a table.

1. Find the Kyoto photographs.
2. From a photograph in the lightbox, get to all voyages.
3. Find out what camera and film a photograph was taken with.
4. Find photographs that share a colour with this one.
5. Read the newest piece of writing.
6. Find a post on a remembered subject.
7. Find out who QSD is.
8. Subscribe.

The walks become journeys in `scripts/check-journeys.mjs` once the routes are settled.

## Open questions, for the queue when the walk is done

- Should the masthead stay reachable on a phone without a first touch to summon it?
- Does Home's hero need a way on besides scrolling?
- How does a reader find one voyage among thirty without the door revealing what is inside?
  Candidates that respect "doorways withhold": the map made more prominent, a quiet index of names
  beside the covers, search that knows places.
- Do icon-only controls get names on touch, and how, without adding chrome?

## Exit

The eight walks, before and after, with fewer taps and no dead ends. The owner has chosen each
change from a prototype ([0005](../decisions/0005-choices-arrive-as-prototypes.md)).
