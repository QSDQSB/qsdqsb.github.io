# Stage 10 · Tags, from scratch

**Status:** idea · **Tier:** 2. Taking the colour off the tags that exist is tier 2, answered
([0009](../decisions/0009-how-much.md)). It runs beside the owner's standing call that these pages
are redesigned from scratch: see the note in the scope.

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

The owner, 2026-10-01 ([`PRINCIPLES.md`](../PRINCIPLES.md), The eye):

- **Tags are ink only** (pair 4, score 5): "Crowded saturated colour blocks are distracting
  visually. I prefer a consistent secondary layout for the functionality buttons, it can change
  colour when hovered, if distinguishing colour is required."
- **"Under the pointer a tag only brightens"** (round 2, pick 10, chosen over "It turns brass" and
  "It takes its own muted colour"). The later word: a tag takes no colour, at rest or hovered.
- **Few things, with room** (pair 16, score 1). The dock of every tag at once is what this turns away.
- **Icons are hairline, in ink** (pair 17, score 1): "Again, saturated pure colour blocks are
  distracting".
- **Nothing springs** (pick 12). A doorway to photographs withholds.

## Where a tag takes colour today

Read 2026-10-01. All of it comes from `_data/tag_colours.yml`: twenty-six tags, each with a colour
the owner chose and named.

| Where | What it colours | Code |
|---|---|---|
| `/tags/`, `/voyage-by-tags/` | Every tile of the dock, as a gradient; a dot beside each tag's heading. A tile also grows by a tenth under the pointer | `_pages/tag-archive.html:22-41`, `_pages/tag-voyage.html:24-46`, `_sass/_archive.scss:389-417` |
| The foot of a post, the end of a book | The pill's words and line; its fill under the pointer | `_includes/tag-list.html`, `_sass/_page.scss:807-823` ([stage 6](06-posts-and-about.md)) |
| A search result | Its tags, the same pill | `assets/js/lunr/lunr-store.js:39-56`, `101-114`, `255-260`, `299` |
| The atlas | A marker's fill, the legend's dots, the line round a tag in a popup | `scripts/geocode-maps.js:178-181`, `assets/js/map.js`, `_sass/_map.scss:627` |
| A voyage's card | Nothing. The rule is there (`_sass/_archive.scss:196-199`) and no card emits a tag | Dead: deleted with A05 in [stage 2](02-foundations-plumbing.md) |

## Scope: answered, to build once stage 2 has the `tag` piece

Tier 2, answered: pictures of both tag pages at desktop and at phone width.

A note before the first task. The owner's standing call is "We should revamp voyage by tag and post
by tag from scratch". Restyling the tiles of pages that are to be replaced is work on something
temporary. It is here because the colour is what the owner turned away, and it can go now. If the
redesign is the next thing built, the first task is skipped and the redesign carries the ink; the
digest says which was done.

- [ ] On both tag pages the tiles take the `tag` piece and the dots go: no gradient, no colour, and
      under the pointer a tile only brightens (it no longer grows). The dock's shape and its faults
      (X14) are the redesign's, not this task's.
- [ ] A tag in the atlas's popup takes the `tag` piece; the inline `--tag-color` leaves `map.js`.
      (A search result's tags are the post's pill and change with it, in stage 6.)
- [ ] Outside `_plan/`, for the session that builds: `scripts/check-frontmatter.js:259-268` warns
      that a tag with no entry "renders without accent colour". For a post that is then a warning
      about nothing a reader sees, and it goes, with its test
      (`tests/check-frontmatter.test.js:133-137`), whether or not the colours themselves are kept
      (below). For a voyage it stays while the atlas reads the file, reworded to say what is lost:
      the marker's colour. The same line is repeated in
      `.claude/skills/frontmatter-contract-enforcer/SKILL.md`, `.claude/agents/voyage-scaffolder.md`,
      `.claude/commands/content-check.md` and `_docs/layouts.md`.

## What needs the owner

None is in the queue: each is asked when its page is drawn.

- **What becomes of `_data/tag_colours.yml`.** Twenty-six colours the owner chose and named. Once
  the tiles, the pills and the popup are ink, `post_tag_colours` has no reader left;
  `voyage_tag_colours` still colours the atlas. Removing either is deleting the owner's work, and
  is the owner's call ([0001](../decisions/0001-who-decides-what.md)). Nothing is removed in the
  answered scope: the file stays whole, unread in part, until the owner says. The lead's proposal,
  to put when asked: remove `post_tag_colours` once nothing reads it (git keeps it), and keep
  `voyage_tag_colours` as the atlas's colours.

- **The atlas's markers.** Each is a dot in its main tag's colour, with a legend of dots. No pair
  drew a map. A dot is not a block, and the nearest standing call is the films' ("their own hue as
  small ticks and dots"). The lead's reading: the markers keep their colours until the owner sees
  the atlas in ink beside it. Nothing is changed on a guess.
- **The emoji in the tags' names** ("🌆Metropolis", "📘Diary"): each is a small filled picture in
  colour, and the names are the owner's words. The lead's reading of pair 17 would set them aside;
  no pair asked. The owner's to say, with the prototypes.

## Shared pieces

The `tag` piece ([0002](../decisions/0002-one-control-vocabulary.md),
[0009](../decisions/0009-how-much.md)), built in stage 2. Nothing new until the redesign.

## Journeys

None walks a tag page today. To add with the answered tasks: `tags`, a tile on `/tags/` leads to its
tag's posts, and a post there opens.

## Exit

The answered tasks: `npm run gate:full` passes, the reviewer returns PASS, baselines re-captured for
the two tag pages. The redesign: chosen from prototypes
([0005](../decisions/0005-choices-arrive-as-prototypes.md)), each of them ink only, and each put to
"What the eye turns away" ([`DESIGN-LANGUAGE.md`](../DESIGN-LANGUAGE.md)) before it is shown.
