# Stage 10 · Tags, from scratch

**Status:** designing (branch `work/r030`, not merged). **Tier:** 2. Taking the colour off the tags
that exist is tier 2, answered ([0009](../decisions/0009-how-much.md)).

**2026-11-27.** The owner asked again that both pages be rebuilt from scratch (R030: "the voyage by
tags page and post by tags page's layout is inconsistent. We should re-build from scratch.") and
picked their shape from prototypes: "A wall of doors" (Q23), over a column of covers. The branch
`work/r030` builds it: it removes the old dock and its styles from `_pages/tag-archive.html`,
`_pages/tag-voyage.html` and `_sass/_archive.scss`. Findings about the old dock and the two pages
are kept here, open, until that branch is merged and each is checked against the new pages.

## Built, 2026-11-27 (R030)

The redesign came first, so the answered scope's first task was skipped, as the note below allows. The owner's
words on the way: of the pages as they stood, "the tags display atm is a terrible design, you shouldnt' refer to
it"; of a wrapped row of tag names, "this is very boring and undesired. it's a nightmare when scaled up." So a
tag is not a word in a list. Picked from prototypes (the choice page `tag-pages`, option A: a wall of doors over a column of covers).

- Both pages are `_includes/tag-page.html`. Each tag is a small square door, the fullest first.
- A door's face (the owner, 2026-11-27, of the built photograph doors): "We should intentionally use Barlow +
  emoji for tag titles"; "use not the picture, but the dry vat generated from the picture"; "hovering on the
  dry-vat background tag card transforms the background to the actual picture"; "Pick an underlying cover image
  for each tag, and then from the cover image, which should be different across different tags, we should be
  able to draw the dry vat out of it. In that case, we can distinguish between different tags while not being
  too noisy and crowded over the page." So: each tag takes a photograph no other tag has (the newest of its
  own), the door is that photograph's dye vat (`vat.js`, still, a rectangle), its name is Barlow with its emoji,
  and under a pointer or the keyboard's focus the vat clears in 0.6 s to the photograph beneath. By touch the
  photograph is never fetched. The vat thereby becomes grammar on a second kind of page, by the owner's call.
- Then, of the built vats: "Each selected tag should also follow the overlay design" and "we don't need to use
  a bold barlow, just a regular barlow should work." So a room opens under the site's overlay hero (the same
  classes and rules as a page's, `_sass/_page.scss`), the tag's own photograph laid where the page's hero
  stood, with the way back and the tag's name on it; tag names are Barlow regular.
- Then, of that build: "i think we don't need darker mask on the tag-dry-vat. Right now the page looks slightly
  off and inconsistent , the layout is not aesthetically pleasing". The vats had been dimmed for their palest
  colour, and the doors came in three sizes so that every row was full. Now a vat is shown as poured, a door's
  name stands at its foot (a vat settles light above deep), and every door is one size on both pages and in
  "Next door" (four there). A tag's photograph is the earliest of its own that no other tag has taken, so a
  room does not open on the picture of its first cover.
- Then: "i think layout / fontsize should be reworked. Right now the visual language is - the tag text and the
  background are two separate thing", and "have opus subagent review with /design-taste-frontend and propose the
  fix". The review's reading: a white name with a drop shadow is a sticker on the vat, sized like a shrunken
  cover title, beside an emoji that is a third material, on a door too wide to be a field of colour. Built as it
  proposed: doors upright (4:5), five to a row on a desktop, four on a tablet, two square on a phone, so 15 and
  10 close flush; the name sized by its door, the same on every door of a wall; the emoji a small mark on its
  own line above; and the name printed in an ink taken from the dye beneath it (`assets/js/colour/ink.js`: the
  colour under the words walked lighter or darker in OKLab until it reads, hue kept), with no white and no
  shadow until the door develops into its photograph.
- Then, of those upright doors: "I believe the issue is the aspect ratio of the card. If we intend to just show
  the tag, then I think we should have either square card or a pill-like landscape card, because it doesn't
  carry the image. It doesn't need to have such large space". Both were built and shown; the owner: "I think we
  should have square ones. Also the tag text should be small (just the regular content text size) right now
  it's too large to be consistent". So a door is a square and its name is the running text's size (`$type-size-7`).
  Shown eight to a row, the owner: "We can have larger tag cards"; shown six: "I think we can use larger tag
  card size and just ivory (white) tag text as title (the background is gradient dry vat so readability is
  ok". Now two to a row on a phone, three on a tablet, five from a desktop up (15 and 10 close flush); "Next
  door" shows five; and a name is the ivory every cover's name wears, with the cover card's own soft shadow.
  The ink taken from the dye (`ink.js`) was removed with that. Measured, ivory reads at 4.2:1 or better on 21
  of the 25 doors; on the four palest feet it read at 2.4 to 3.1 (Coastal, Happy Moments, Emo, Ox).
- Then, of the ivory names: "The title doesn't blend in the background. It needs either simple mask or shadow,
  consult with design taste". The consult's reading: on a cover the photograph darkens toward its foot (the
  card's scrim), so a title stands in a dusk that is part of the picture; on a door the vat lay over that scrim,
  and only a shadow held the name up. Built as it proposed: the cover card's own scrim brought back over the
  vat (clear to four tenths down, then to 0.55 at the foot; a cover's is 0.45, over a dimmed photograph), the
  same on every door, with no script. Measured in Chromium and WebKit, every name reads at 4.9:1 or better at
  desktop and phone widths; "Happy Moments" at 320 px, where it wraps to two lines, reads at 3.9:1. The low bar was dropped: the dye ran in streaks behind the name, and it looked like the old
  colour tiles.
- A door opens a room in place, the tag's covers as `/voyage/` and `/posts/` show them, by `:target`, with no
  script for that. At a room's foot, the doors of the five tags that share the most with it ("Next door").
- The answers to "Before it is designed": a doorway, not an index (finding is search's); two pages, one layout.

The corner tarot cards on these two pages sit over part of the door in the first and last column; asked
with the pull request, the owner: "Keep them".

Then, with the pull request open: "i think the zoom-in transition on hover isn't reconciling with the site.
Either make it the default transition time 0.5s, or remove it, also bring back the default author-profile on
the two tags page", and "i think the openned post-by-tag should be in the same page, maybe we should have small
tag card blocks, on top of the page, and clicking the card block opens the list of posts / voyages belonging to
this tag directly below the page", "e.g. it's trackable via qsdqsb.com/posta-by-tag/#emo". So the doors no
longer grow under the pointer; the profile is back; and a tag no longer opens a room with its own hero and a
"Next door" row: the doors stay at the head of the page as small squares, and choosing one opens its list right below them, the page keeping the doors in
sight. The address names the tag (`/tags/#emo`), Back steps through the tags chosen, and the open tag's door
shows its photograph. Without script the list opens by `:target`.
- Then: "the tag can be much smaller. Have a subagent indicate the correct size, i think it should be at least
  50% smaller (with respect to the text size)". The subagent read it as the door shrinking round its name, not
  the name halving: the floor is the longest word ("Switzerland", about 6.4 times the name's size). Built as it
  proposed: as many doors to a row as fit at a side of at least 4.9rem (four on a 390 phone, eleven at 1440),
  the name at 0.8rem; the doors take 45 to 59% less area and the set of them 41 to 70% less height.
- Then: "the tag should have the same size as the tags in the actual article"; "give me prototype eexamples so
  i can compare"; "i prefer to keep the dry vat but as small squares"; "what if we just keep the emoji inside the
  dry vat?"; and of the small squares at the onward links' size: "not aesthetic. figure out why and suggest". The
  reading given: the vat is made round, and cut square it reads as an out-of-focus thumbnail, a tiny name in a
  coloured tile as a filename, and a grid of shadowed squares as a phone's home screen. Palette's round vat
  beside a name was suggested; the owner: "what if tags behave on a list on the left, just like palette page?"
  Built three ways (the choice page `tag-left`, Q26); the owner: "we can use C" (under the author profile), "but
  please let two subagents with /design-taste-frontend and /ponytail:ponytail-review to further improve the UI on
  tags, for example, what's the default tag view, if there should be soemthing on the beginning of page".
- From both reviews, C was built: the tags in the column under the author, every entry open when no tag
  is chosen, the address opening a list by itself (`:target`). The owner: "not good enough, don't capature
  the baseline yet. We should finalise the design first. i think you should propose 5 alternative versions
  that is more matching the site's aesthetic language". Read against the language, C had broken three
  lines (a soft pill for the open tag where rule 4 asks for a brass hairline, counts at a doorway, each tag
  in full colour); five versions were built (the choice page `tag-five`, Q27). The owner: "ok , maybe we
  should forget about the dry vat idea for tags?"; told why the vat said nothing about a tag (its colours
  were one photograph's, picked by the page), "yes it makes sense, but 1. keep author profile; 2. we should
  have a consistent animation when hovered, and slightly better layout".
- So the vats are gone, and with them the per-tag photograph, `tag-door-vat.html`,
  `generate-cover-palettes.mjs` and its data. A tag in the column is its emoji, in a column of its own so
  the names align, and its name in regular Barlow; under the pointer its ink brightens in the time and on
  the curve of the tag a post carries; the open one carries the menu's brass hairline under its name. No
  counts. On a laptop the column stays in view, the author and then the tags under a hairline, and only the
  tags scroll when the screen is short; below 1152 px the tags alone stand above the list. The left tarot
  card takes no click while the tags are under it.

Still open, the owner's: whether a tag's list should say what it is, or live on its index instead
(I007, "IS IT REALLY THE BEST WAY TO DISPLAY TAG COLLECTIONS?", being shaped).
Three people brainstormed the reader's experience; what was not built is in the pull request's note. The
atlas's popup and the frontmatter warning below are untouched.

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
- [x] A tag in the atlas's popup: moot since 2026-11-27. A marker opens "A label, as on a map" (Q25),
      so the popup's tags go, and their inline `--tag-color` leaves `map.js` with them, in
      [stage 4](04-voyage-and-cards.md)'s batch. A post's and a search result's inline colour is
      F113, in [stage 6](06-posts-and-about.md).
- [ ] F080 · The "#" anchor after each tag's heading on Voyage by tags is `#0072b1` at 60 per cent, a
      blue no other rule uses, and mint under the pointer (`_sass/_archive.scss`,
      `_pages/tag-voyage.html`). Check it on the rebuilt page: gone with the old heading, or ink.
- [ ] X14, C01 · The dock that covers card titles, and voyages listed two ways (moved from stage 4):
      both are the old pages'. Check on the rebuilt pages, then close.
- [ ] The `tags` journey below, and `post-tags` (stage 6), once the wall of doors is merged.
- [ ] Outside `_plan/`, for the session that builds: `scripts/check-frontmatter.js:259-268` warns
      that a tag with no entry "renders without accent colour". For a post that is then a warning
      about nothing a reader sees, and it goes, with its test
      (`tests/check-frontmatter.test.js:133-137`), whether or not the colours themselves are kept
      (below). For a voyage it stays while the atlas reads the file, reworded to say what is lost:
      the marker's colour. The same line is repeated in
      `.claude/skills/frontmatter-contract-enforcer/SKILL.md`, `.claude/agents/voyage-scaffolder.md`,
      `.claude/commands/content-check.md` and `_docs/layouts.md`.

## A line under an open post tag (I007, answered 2026-11-28)

The owner asked of the built list "IS IT REALLY THE BEST WAY TO DISPLAY TAG COLLECTIONS?" ([I007](../ideas/I007-this-design-is-acceptable-we-can-call.md)).
Moving the tags onto Posts and Voyage was built and dropped. From the choice page `tag-collections`, the owner picked B,
a line under an open tag's name, and wrote each line on the page `tag-lines`
(https://claude.ai/artifact/5A4rsBQyKwB6b4GvPRk5QD). Of voyages: "i don't thikn voyage needs tag contents".
So only `/tags/` carries lines, and `/voyage-by-tags/` stays as built.

- [x] Built with R035 below (on `work/r030-list`, not after a merge): port B's prototype (branch `proto/i007-b`, `.claude/worktrees/agent-a1ee632d6472a8c48`):
      the line under `.tag-page__room-name`, the shared `lede` (Playfair upright since #147), held
      smaller than the name. `_data/tag_lines.yml` holds `posts:` only,
      these words exactly as the owner wrote them:

```yaml
posts:
  "💍Horcrux": "Where you can find a piece of QSD or QSB."
  "🧼QSD's Philosophy": "QSD's perspective of the world. No guarantee of coherence."
  "🍜Life": "We should hope every weekend is at least slightly different."
  "📘Diary": "And which normal people would write a diary?"
  "😻Happy Moments": "Life needs joyful moments!"
  "🗒TODO": "#TODO is #TODO."
  "🏦卷！": "I don't think future content will include this tag, hopefully not."
  "🐮Ox": "We don't see Oxen in Oxford, we see cows."
  "😢Emo": "Maybe it's nice, to be able to feel something."
  "🍡Tutorial": "Do you think QSD is a good teacher?"
```

      Keys are copied from front matter, emoji and variation selectors included. Copy them from the prototype's file, not by hand.
      A changelog line and a step in the `post-tags` journey come with it.

## R035 · One line of tags (2026-11-28)

Of the list under the author, as built: "Bad design. Try again" (R035). Three forms were built as prototypes
(the choice page `tag-pages-2`, Q29): the open tag as the page's heading that opens the others in the menu's
panel (A, the lead's pick), every tag a chapter with a contents beside (B), and one unwrapped line of tags (C).
The owner: "C: one line". Built on `work/r030-list` from prototype C: the tags leave the column, which is the
author's again, and stand in one line at the head of the list that never wraps (what does not fit runs on
sideways under a fade, the open tag brought to the middle, the line scrolling itself and never the page); the
open tag keeps the menu's brass hairline, a tag the brightening every tag has; the open post tag carries the
owner's line (I007). The strain the prototype named stays: it is still a row of names, so twice the tags puts
more of them out of sight, and a mouse wheel cannot reach them (a trackpad, a swipe or Tab can).

## What needs the owner

None is in the queue: each is asked when its page is drawn.

- **What becomes of `_data/tag_colours.yml`.** Twenty-six colours the owner chose and named. Once
  the tiles, the pills and the popup are ink, `post_tag_colours` has no reader left;
  `voyage_tag_colours` still colours the atlas. Removing either is deleting the owner's work, and
  is the owner's call ([0001](../decisions/0001-who-decides-what.md)). Nothing is removed in the
  answered scope: the file stays whole, unread in part, until the owner says. The lead's proposal,
  to put when asked: remove `post_tag_colours` once nothing reads it (git keeps it), and keep
  `voyage_tag_colours` as the atlas's colours.

- **The atlas's markers.** Answered 2026-11-27 (Q24): "Colour stays, on the map alone". So
  `voyage_tag_colours` keeps a reader, the atlas, and is not removed.
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
