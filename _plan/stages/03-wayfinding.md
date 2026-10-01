# Stage 3 · Wayfinding

**Status:** planned · **Tier:** 2. Navigation and structure are always the owner's.

## Goal

A site that is easy to get around and obvious to use, without becoming ordinary. The owner's words
(2026-10-01): easy to navigate, the interface intuitive.

The house hides things for the curious, and doorways withhold. So the test is not "everything is
visible". It is: **a reader who wants something specific can get to it, and always knows how to get
back.**

## What the owner has said (2026-10-01)

- **Immersive without losing direction.** The masthead hides itself while a page is read and returns when
  the reader scrolls up. That is the design, not a fault; any fix keeps it.
- A minimal, consistent footer on every page that scrolls. Home has none today (audit P05).
- The tarot cards need a new purpose; the wheel of fortune stays liked.
- The Voyage index's length (audit P03) is marked Later.

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

- Does Home's hero need a way on besides scrolling?
- How does a reader find one voyage among thirty without the door revealing what is inside?
  Candidates that respect "doorways withhold": the map made more prominent, a quiet index of names
  beside the covers, search that knows places.
- Do icon-only controls get names on touch, and how, without adding chrome?

## Scope so far

- [ ] The eight walks, on a phone and a desktop.
- [ ] The footer: a choice, with prototypes.
- [ ] The tarot cards' next life: a study.
- [ ] X09 · Search shows that it is open, and can be closed on a phone.
- [ ] X20 · Tap targets under 24 px.

**From the inbox, sorted 2026-10-01.** None is on the audit, so none is under the owner's mark. All are
tier 2 unless a line says otherwise.
- [ ] 2026-10-01 · The wheel of fortune: should the card it lands on light up as if hovered? Focus is not
      moved there: that took cards out of the Tab order and held them in their hover state. Asked with
      the tarot study, not before.
- [ ] 2026-10-01 · The masthead on a phone: a tap in the middle of a page no longer un-fades the bar; it
      returns on a scroll up or a tap at the top (X01, built in stage 1, tier 1). Watch for it on the
      phone walks, and show it in the digest as a choice the owner can reverse.
- [ ] 2026-09-29 · Home: Back to the landing always re-opens on the hero; reviewers suggested skipping it
      on back and forward. Framed with "does Home's hero need a way on".
- [ ] 2026-09-29 · A palette card to the book: the first system Back lands on `/voyage/london/`, not the
      palette. Decide what the first Back owes a reader who came from the palette; it is built with
      C11's shared way back (stage 9).
- [ ] 2026-09-29 · Ridgway on a phone: about 36 screens with no jump to a plate. A jump is a new control.
      Low: the page has no door, by choice. Its sibling is audit P08 (a palette with no way on).

**Known faults at 320 px, on the walks' route.** Each fix is a change only a small phone sees, so it
needs the owner's word (`CLAUDE.md`, Responsive Policy), asked as one call the way X03 and X11 were.
Not yet asked.
- [ ] 2026-09-29 · The lightbox at 320 px: the back label shrinks to "‹ #…". It gives way so the tools
      stay on screen.
- [ ] 2026-09-29 · Palette at 320 px: "7% · accent" runs into "16%".
- [ ] 2026-09-29 · Home's Wonders at 320×640: overflows by about 27 px, with five doors. Q5 comes
      first: its option B leaves four.

## Exit

The eight walks, before and after, with fewer taps and no dead ends. The owner has chosen each
change from a prototype ([0005](../decisions/0005-choices-arrive-as-prototypes.md)).
