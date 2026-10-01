# Stage 10 · Tags, from scratch

**Status:** idea · **Tier:** 2.

## Goal

The two tag pages (`/tags/` for posts, `/voyage-by-tags/` for voyages) redesigned from nothing. The
owner, 2026-10-01: "We should revamp voyage by tag and post by tag from scratch."

## What is wrong today

- The sticky tag bar is a fixed-height box that scrolls inside itself; on a phone it is five rows
  in a 56 px window (audit X14). It covers card titles.
- Voyages are listed as photo-less bordered rows here and as covers on `/voyage/` (audit C01).
- Five recipes for a tag across the site (audit C08).
- The tag pages are reached mainly through a tarot card, whose own future is open.

## Before it is designed

- What tags are for, for a reader: a way to browse, or a way to find? It decides whether this is a
  doorway or an index.
- Whether posts and voyages share one page or keep two.
- It belongs with stage 3's wayfinding walk: "find a post on a remembered subject" is one of its
  eight tasks.

## What is already decided

- **Tags are ink only** (the owner, 2026-10-01, pair 4, score 5; [`PRINCIPLES.md`](../PRINCIPLES.md),
  The eye): "Crowded saturated colour blocks are distracting visually. I prefer a consistent secondary
  layout for the functionality buttons, it can change colour when hovered, if distinguishing colour is
  required." So a tag at rest carries no fill of its own; every tag has one look; a colour appears
  under the pointer at most, and only where tags must be told apart.
- **Few things, with room** (pair 16, score 1). The dock of every tag at once is what this turns away.
- **Icons are hairline, in ink** (pair 17, score 1): "Again, saturated pure colour blocks are
  distracting".
- A doorway to photographs withholds.

## What that leaves open

- **What colour a tag takes when hovered, if any**: asked in round 2 of
  [the pairs](../studies/2026-10-01-the-qsd-aesthetic.md). Nothing is built on a guess.
- **`_data/tag_colours.yml`**: twenty-six tags, each with a colour the owner chose and named. Today
  it tints every tile of the tag grid on both tag pages, puts a dot beside each tag's heading
  (`_pages/tag-archive.html`, `_pages/tag-voyage.html`) and colours the pills at the foot of a post
  (`_includes/tag-list.html`). On a voyage's card a tag takes its colour only under the pointer
  (`_sass/_archive.scss`), which is what the owner's note allows. At rest the colours go; whether
  they stay as what a tag shows under the pointer follows round 2. The file is not deleted before
  that: the colours are the owner's work, and `scripts/check-frontmatter.js` reads it.
- **The emoji in the tags' names** ("🌆Metropolis", "📘Diary"): each is a small filled picture in
  colour, and the names are the owner's words. The lead's reading of pair 17 would set them aside; no
  pair asked. The owner's to say, with the prototypes.

## Constraints

- The `tag` piece from the vocabulary ([0002](../decisions/0002-one-control-vocabulary.md)), which
  this stage needs built first: ink only, as above.

## Exit

Chosen from prototypes ([0005](../decisions/0005-choices-arrive-as-prototypes.md)), each of them
ink only at rest, and each put to "What the eye turns away"
([`DESIGN-LANGUAGE.md`](../DESIGN-LANGUAGE.md)) before it is shown.
