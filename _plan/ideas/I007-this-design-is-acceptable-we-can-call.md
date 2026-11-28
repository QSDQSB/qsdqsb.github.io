# I007 · Is a list of tags the best way to show a tag's collection?

**Status:** staged · **Raised:** 2026-11-28 by the owner · **Stage:** 10 (tags)

## In the owner's words

> this design is acceptable, we can call it ok for now, But IS IT REALLY THE BEST WAY TO DISPLAY TAG COLLECTIONS?

Said of the tag pages as built for R030 (the tags as a list of emoji and names in the column under the
author, the chosen tag's covers beside them; `_plan/stages/10-tags.md`, "Built").

## Notes from the session that raised it (data, not a shape)

Counted from the front matter on 2026-11-28:

- **Voyages:** 63 entries, 10 with no tag, 15 tags of 15, 13, 12, 12, 11, 8, 8, 7, 6, 5, 5, 3, 3, 2, 2.
  The tags are three kinds mixed: places (Italy, Switzerland, Alps), which the atlas already shows
  better; subjects (Coastal, Lake, Bridges, Metropolis, Historic, Baroque, Museum, Tropical); and the
  owner's own judgments (QSD's Favourite, Retrace, Hiking, "Everyone deserves a tag -- even the ...").
- **Posts:** 20 posts, 11 tags of 8, 7, 6, 6, 4, 4, 3, 3, 2, 1, 1. Two tags hold one post each, and the
  whole set is smaller than one year of the archive.
- A reader most likely reaches a tag page from a tag under a post or a voyage: "more like this", not
  "browse every tag". No measurement exists to confirm it.

The session's reading, for whoever shapes this: the built page is a sound filter, but a filter is a
utility's answer, and the site's are a book's. Directions worth trying as prototypes: a tag as a
*collection* with a line in the owner's voice, as a doorway has (the owner's judgments above are the
natural ones); places left to the atlas; and for 20 posts, whether the year archive with each post's tags
beside its title would serve better than a page of its own.

## Verdict

**Pursue.** Keep the list as built and give an open tag one line of its own, only where the name does not
already say it (B). Two prototypes answered the "really": folding the tags into Posts and Voyage (C) breaks
two of your calls (pages kept "as today" are "not re-proposed"; one control per job) and doubles the
Voyage page, so the list is the right form; what it lacks is a voice. If you strike most of the lines,
the answer is A, and the idea closes there.

**Waits on:** R030's pull request (the list as built) merged first; question 1, on which tags carry a line.

**The owner:** pursue · 2026-11-28 · Picked B on the choice page (tag-collections), 2026-11-28: "Then we need another artifact to help me indicate each word for each tag." The lines, tag by tag, come from that page; questions 1 and 2 are answered there.

## Made explicit

The counts above were checked again by the lead on 2026-11-28 from the front matter (a script in the
scratchpad): posts 20, every one tagged, 2.25 tags each; voyages and their parts 63, 10 untagged, 1.78
tags each. The voyage page shows fewer: it leaves out a voyage whose book is still empty
(`_includes/photobook-ready.html`). On the built site 25 tags show, not 26: 🔖Notes is carried only by an
unpublished post.

**The sentence, read every way it honestly can be.**

- **"this design is acceptable, we can call it ok for now"**: the surface is accepted. Read with the
  stage's record (walls of doors, upright doors, square doors, small squares, the vats, room heroes,
  five versions, all turned away on the way here), it says: do not start another round on how the list
  looks.
- **"tag collections"**, three ways:
  1. *the set of tags*: how the tags themselves are shown (the list under the author). The surface the
     owner has just accepted.
  2. *one tag's collection*: what a reader sees once a tag is chosen. Today the same covers as `/voyage/`
     and `/year-archive/`, under the tag's name in Barlow (`_includes/tag-page.html`, `.tag-page__room`).
     Nothing on it says what the collection is, or why these belong together.
  3. *tags as a way of collecting at all*: whether a tag needs a page of its own, when each of its
     entries is already on an index (`/voyage/`, `/year-archive/`), and the atlas already narrows the
     voyages by tag (its Tags list, `assets/js/map.js:612-700`).
- **"display"**: the look, or the form (a filter, a collection, a lens on an index). The look is
  accepted, so the form.
- **"the best"**: best for whom. Not measurable: the site keeps no analytics (`_config.yml`,
  `provider: false`). So best for the reader the links bring (below), judged against the principles.
- **"REALLY"**, in capitals: doubt about the idea, not the finish.
- One more reading, not taken: *are these the right tags* (places, subjects and judgements mixed). The
  tags are the owner's words in the owner's front matter; renaming or removing any is theirs to do, and
  nothing here asks it.

**Taken:** readings 2 and 3 together. Is a page that filters the index the best form for a tag's
collection, or should a tag's collection say what it is, or live where its entries already live? The
surface (reading 1) stays as the owner accepted it in every shape.

**Who reaches a tag page, and from where** (read from the source, 2026-11-28; the links counted in row 8):

| Route | Where in code | Arrives |
|---|---|---|
| The tags at the foot of every post (20 posts, 2.25 each) | `_includes/page__taxonomy.html:4` → `_includes/tag-list.html` | `/tags/#<tag>` |
| The tags at a voyage's end, and after a voyage in parts' covers | `_includes/photobook/end.html:40`, `_layouts/gallery.html:103` | `/voyage-by-tags/#<tag>` |
| A search result's tags | `assets/js/lunr/lunr-store.js:43-46`, `:105` | `#<tag>` on either page |
| The Posts page's left tarot card | `_pages/year-archive.html:8` | `/tags/#qsd-s-philosophy` |
| The Voyage page's left tarot card | `_portfolio/voyage.html` | the bare page, every entry |
| The menu | `_data/navigation.yml` names both only as `also:`, for the Posts and Voyage hairline | never |

So nearly every way in opens one tag: the reader has just finished a post or a voyage and wants more of
its kind. The view of every tag at once is seen mostly by a reader who found a tarot card ("unseen until
found", Q25).

**Who it is for.** That reader, first. The owner second: a tag is the owner's own judgement of what
belongs together ("QSD's Favourite", "Retrace", "Everyone deserves a tag -- even the ..."), and today
nothing on the page says so. Not a reader hunting a particular post: "finding is search's" (stage 10's
answer, "a doorway, not an index").

**The parts** (across the shapes):
- the tag list as built (exists);
- a head for a chosen tag: its name, and a line of its own where the name needs one (B);
- the lines themselves, the owner's words, in a data file (B);
- the tag rooms on the two indexes, the index's own list standing as "All" (C);
- the atlas following the chosen tag (C);
- the old addresses forwarding with their `#tag` (C);
- the tag paths in `_config.yml` and the tarot links that point at the tag pages (C).

**What it assumes that may not be true.**
- That readers mostly arrive by a tag. True of the links (row 8); unmeasured as traffic.
- That the owner will write, or keep, some lines (B). Without them B is A.
- That an index can carry its tags without changing the first screen the owner kept "as today" (C).
  Measured true of the first screen, at the cost of a second copy of the list on a phone (row 1).

**What it is not asking for.** A new look for the tags: colour, cards, doors, vats, rows of words,
heroes, each turned away in stage 10. Counts. A new page. Changes to the tags themselves. Changes to
search.

## Shapes it could take

**A · As built.** Nothing changes. The tags in the column under the author, every entry when none is
chosen, a tag's covers by `:target` (`/tags/#emo`). It takes nothing; stage 10's open "a line per tag
for its door" closes, and with it the two questions the vats left (a tag's photograph by hand, which
doors lead), moot now the photographs are gone. What a reader gets is a sound filter, and no more.

**B · A tag's list says what it is** (the one pursued). The list and the pages stay as built. When a tag
is open, under its name stands one line of its own, where the name does not already say it. Prototyped on
`proto/i007-b` (worktree `agent-a1ee632d6472a8c48`), fast gate 12 of 12, journeys 35 of 35:
- `_data/tag_lines.yml`, two maps, `posts:` and `voyage:`, keyed by the tag exactly as the front matter
  writes it, emoji and all; a tag with no entry shows no line.
- In `_includes/tag-page.html`, after each `.tag-page__room-name`, a `<p class="tag-page__room-line">`
  when the tag has a line (+6/−1).
- In `_sass/_tags.scss`, `@include lede`, then the family set back to Playfair and the style to upright
  (+11), as `.photobook-cover__lede` does: the shared `lede` is still Didot italic in code
  (`_components.scss:36`) until 0013's change to it is built, and the owner turned that face away for
  every such line ("The Didot italic line: Playfair upright everywhere", Q24). In `--ink-2`, 19.3 px at
  1440 and 16.3 px on a phone, under a name of 23.4 and 20.8 px: below the name, never beside it.
- The prototype drafted 24 lines, every one marked a draft. Whose voice is open: most say "QSD", one
  ("QSD's Favourite") says "I". "Everyone deserves a tag -- even the ..." has none on purpose: its name is
  already a line. Changed after the challenge: B no longer asks a line of every tag. The owner keeps a
  line where it adds what the name cannot (the lead's view: the judgements and the private words, such as
  💍Horcrux, 🐮Ox, 🛤️Retrace, 🏞️QSD's Favourite) and strikes the rest; a place such as 🍝Italy may well
  need none.
- About 2 KB of text. No count, no cover, no hero.

**C · The tag goes home** (dropped after the trial and the challenge). No tag pages: `/year-archive/` and
`/voyage/` each carry their tags in the column under the author, a chosen tag opening its list in place
of the index's own, and on Voyage the atlas following it; `/tags/` and `/voyage-by-tags/` forward with
their `#tag`. Prototyped on `proto/i007-c` (worktree `agent-aac307032ad7e2732`): 15 files +114/−105,
`map.js` +43. Everything it needed could be built (rows 1 to 4), but what it does conflicts with the
owner's calls (see "Does it fit"), and on Voyage a tag swaps in a different list, the voyages' parts
included, which the index never shows.

"What it changes" was weighed for C, the largest shape, while it was in play; B differs only where its
rows say, and B's are the ones that stand.

## What it changes

| Part of the site | Today | With this idea | Size |
|---|---|---|---|
| Pages | `/tags/` and `/voyage-by-tags/` (`_pages/tag-archive.html`, `_pages/tag-voyage.html`), each with its hero and the owner's line under it ("Isn't it a boring pun to put an airtag pic."; the chair at `50°05'11.5"N 14°23'26.6"E`) | B: unchanged. C (dropped): both gone, their heroes and lines with them | none (B), medium (C) |
| Addresses | `/tags/#<tag>`, `/voyage-by-tags/#<tag>`, set by `_config.yml:303-308`, read by `tag-list.html` and `lunr-store.js` | B: none. C: the indexes' paths, the old ones forwarding through a redirect layout that adds `location.hash` (all 19 redirect pages), the Voyage tarot given a new target | none (B), medium (C) |
| Posts index `/year-archive/` (kept "as today", Q25) | Hero, the years in Didot, one column of covers, the author column | B: none. C: tags under the author; on a phone a second copy of the list after the covers (+195 px at 390, +325 at 320) | none (B), medium (C) |
| Voyage index `/voyage/` (kept "as today", Q25) | The wall as one run, then the atlas; the author column | B: none. C: as Posts (+276 / +466 px on a phone); a chosen tag shows voyages and parts, which "All" never does | none (B), medium (C) |
| The atlas | Its own Tags list filters the markers (`assets/js/map.js:612-760`); F121 open | B: none. C: follows the column through the address, with a 300 ms hold against Safari's second jump to the fragment | none (B), small (C) |
| Shared pieces | `_includes/tag-page.html`, `_includes/sidebar.html`, `_sass/_tags.scss`, `assets/js/tag-page.js`; `tag-lit`, `brass-focus`, `eyebrow`, `onward-links`, `lede` | B: `lede` reused, its face set back to Playfair upright until 0013 changes the piece itself; when it does, the two overriding lines go. No new piece | small |
| The tags under a post and a voyage | `_includes/tag-list.html` links to the tag pages | Unchanged (C would have moved the path through `_config.yml`) | none |
| Search | Tags in a result link to `#<tag>` on the tag pages | Unchanged | none |
| Data | `_data/tag_colours.yml`, read by the atlas alone | B: new `_data/tag_lines.yml`, the owner's words only, as many as kept | small |
| Photographs, R2, manifests | Covers through `archive-single.html`, deferred | Unchanged | none |
| Weight | `/tags/` and `/voyage-by-tags/` as built | B: about 2 KB of text across both pages. C: `/voyage/` gzip 9,882 → 20,326 B (+106%), `/year-archive/` 7,698 → 9,663 B (+26%); images at first load unchanged | small (B), medium (C) |
| Build time | | Unchanged | none |
| Pictures and privacy | | Untouched | none |
| Checks and baselines | Journey `tags` (`scripts/check-journeys.mjs:198`); baselines `voyage-by-tags` and `voyage` | B: journeys pass unchanged; the `voyage-by-tags` baselines change only if a shot opens a tag with a line. C: `tags` and `atlas-index` rewritten, `voyage` mobile baseline taller (6168 → 6444), a slug function in JS to keep in step with Jekyll's | small (B), medium (C) |
| Other stages and calls | Stage 10 designing, R030's PR open; stage 4 holds Voyage and the map; stage 6 the post, its index kept | B answers stage 10's open "a line per tag" and waits on R030. No other call is made moot | small |
| Upkeep | `FEATURES.md` row Tags | B: the Tags row gains the line; a new tag simply shows no line until one is written | small |

## Can it be delivered

Tried 2026-11-28 by two prototypes and the session. Rows 1 to 5 are C's, 6 and 7 are B's, 8 is the
premise of both.

| What must be true | How it was tried | Result |
|---|---|---|
| 1. (C) The first screens the owner kept "as today" survive: with no tag in the address, `/voyage/` and `/year-archive/` look as on master at 390 and 320 px, and at 1440 only the column under the author differs | Before-and-after captures in Chromium at 1440, 390 and 320 on `proto/i007-c`; `check:mobile-overflow` in WebKit, 19 pages and 5 tag states | **proved** for the first screen: at 1440 only the column differs (0.021% and 0.012% of pixels, all at x 18 to 226); at 390 and 320 nothing differs down to the end of the list. Below it the page grows by a second rendering of the list (CSS order cannot set it between the wall and the atlas): on a phone arriving at a tag, the tags are out of sight until the reader scrolls past that tag's covers |
| 2. (C) No tag's slug equals an id already on either index (a cover's anchor on `/voyage/`, linked as `/voyage/#dolomites`; a year, `#2024`, or a card's id on `/year-archive/`); a clash opens the wrong thing. If one does, the way out is a prefix (`#tag-alps`), which changes the address the owner asked for (`/tags/#emo`) | A script over the built HTML of the r030 build, 2026-11-28 (`trial_links_ids.py`, scratchpad): the 10 post tags a published post carries (the 11th, 🔖Notes, is on an unpublished post only) against the 30 ids on `/year-archive/` (years, post slugs), the 15 voyage tags' against the 69 on `/voyage/` (cover anchors such as `dolomites`) | **proved**: no clash on either index. It holds for today's titles only: a future voyage or post whose slug equals a tag's (a voyage called "Alps") would clash, so a build check would have to refuse it. The trial also found every cover's id written twice on `/voyage/` (F123) |
| 3. (C) An old address keeps its tag: `/tags/#emo` lands on `/year-archive/#emo` with Emo's list open, `/voyage-by-tags/#alps` on `/voyage/#alps` | `redirect_from` with a redirect layout that adds `location.hash`, built on `proto/i007-c`; Chromium and WebKit opened each old address and read the final URL and the visible room. No `_redirects` was built | **proved**: both land with the room open in both engines; without script, on the bare index. The layout serves all 19 redirect pages |
| 4. (C) The atlas follows the tag in one state with its own list: `/voyage/#alps` lights Alps' markers when the map starts late; Back and Forward follow; the map's list and the column never disagree | A spike in `assets/js/map.js` (`hashchange` → `setAtlasActiveTag`, +43 lines), walked by the edited `tags` and `atlas-index` journeys, both engines | **proved**, with a seam: it needed a 300 ms hold against Safari's second jump to the fragment, so a reader scrolling in that moment snaps back once. "Museum" has no marker on the index atlas (its two voyages are Vatican parts): choosing it dims every marker |
| 5. (C) The indexes stay light: their HTML grows by little, and no cover in a hidden room is fetched at load at phone width (0004 budgets "image bytes at load, Posts archive at phone width") | Built before and after; gzip sizes; a phone-width load in Chromium, image requests counted | **failed** for `/voyage/`: gzip 9,882 → 20,326 B (+106%; raw 47.7 → 184 KB, 140 cards where there were 30). `/year-archive/` +26% (7,698 → 9,663 B). Images held: 13 requests before and after at 390, none from a hidden room |
| 6. (B) There are lines the owner keeps, in the owner's voice | 24 drafted on `proto/i007-b` (`_data/tag_lines.yml`), marked as drafts, e.g. 😢Emo "Written after midnight, and left up in the morning anyway."; 🏰Baroque "Gilt, stucco and painted heavens: excess, raised into a theology." | **open**: only the owner can keep or strike them; shown on the choice page and, if pursued, on the pull request |
| 7. (B) A line under a name holds in the column's measure: no overflow and no orphaned word at 320 px, Playfair upright under Barlow reading as one head | Every tag room on both pages, WebKit and Chromium, at 1440, 390 and 320 (150 measurements); `check:mobile-overflow` on 7 addresses | **proved**: 0 px overflow; on a phone a line takes two or three lines and its last holds at least two words (`text-wrap: pretty`). The line is smaller than the name (above). Whether it reads as one head is the owner's eye, on the choice page |
| 8. (A, B, C) Nearly every link into a tag page names a tag | Every `href` into `/tags/` and `/voyage-by-tags/` across the built site (r030 build, the two tag pages themselves left out), 2026-11-28 | **proved**: 154 links, 153 name a tag (41 into `/tags/`, 112 into `/voyage-by-tags/`); one is bare, the Voyage page's tarot card. It proves the ways in, not the arrivals: the site keeps no analytics (`_config.yml`, `provider: false`) and a `#tag` never reaches a server |

## Does it fit

| Against | Verdict | Why |
|---|---|---|
| "Tags are ink only" (PRINCIPLES, pair 4, 5) | fits | No shape adds colour. The atlas's markers keep theirs, "on the map alone" (Q24) |
| "Under the pointer a tag only brightens" (r2: 10) | fits | The list's hover (`tag-lit`) is kept as built |
| "Few things, with room" (16: 1) | fits | B adds one line to an open tag, and only where it is kept |
| "Kept as it stands. Each was drawn beside an alternative and the owner picked "as today": it is not re-proposed" (PRINCIPLES, of Posts and Voyage) | conflicts (C) | C re-proposes both pages: their column, a phone's page below the list, and what Voyage shows when a tag is chosen. B and A touch neither |
| "One control per job. A second way to do the same thing is removed, not added" (DESIGN-LANGUAGE §6) | conflicts (C) | On Voyage the column and the map's Tags list would both choose a tag, one with "All" and no counts, the other toggling off and showing counts. The remedy is removal, and the map's list is the owner's pick (Q25, "One slim list"), so the column could not be the one kept |
| Doorways: "One magnificent cover and its poetic line" (2026-09-26); stage 10's answer for both pages, "a doorway, not an index"; "The poetic line belongs to doorways. A count does not" (DESIGN-LANGUAGE §10) | fits (B) | For `/voyage-by-tags/`, B is the doorway's line. For `/tags/` the warrant is stage 10's answer: the design language defines a Doorway as "a page that leads into photographs", which posts are not, so there it is the lead's reading |
| Q24: "The Didot italic line: Playfair upright everywhere" | fits (B) | B's line is Playfair upright, set so by its own rule until the shared `lede` is changed |
| R030: "the voyage by tags page and post by tags page's layout is inconsistent" | fits | A and B keep one mechanism for both |
| The owner, 2026-11-27: "trackable via qsdqsb.com/posta-by-tag/#emo"; "keep author profile"; "a consistent animation when hovered"; "We should intentionally use Barlow + emoji for tag titles" | fits | A and B change none of these: the address, the profile, the hover and the Barlow names stay |
| Design language: the pattern and pieces | fits | Grammar only: the tag, the eyebrow, `lede`, onward links, the brass hairline for what is open (§6 rule 4). No new piece, no signature |
| "What the eye turns away" | fits | No block of colour, no glow, no mechanism without something seen, no crowding, no effect that draws the eye |
| What was tried (stage 10, "Built"; Q23, Q26, Q27) | fits | Rows of tag words, big cards, square tiles, the vat, a room's hero, "Next door": none comes back in A or B |

**Fits** as B (and A). C **conflicts** with "it is not re-proposed" and "one control per job", and was
dropped.

## For and against

**For**
- 153 of 154 links in open one tag, and what opens is the index again under a name: B makes it a collection.
- A line is what a doorway carries; stage 10 already holds "a line per tag" as open.
- Small and proved: a data file, 17 lines of code, 0 px overflow in both engines, journeys unchanged.
- The owner's judgements (Favourite, Retrace, Horcrux, Ox) are private words; a line lets a reader in.
- No new piece, no colour, no motion, and nothing the owner kept is touched.

**Against**
- About a dozen rounds on these pages ended in "acceptable"; this asks the owner to read up to 24 lines.
- A name that already speaks (Emo, Italy) gets a line that only pads it, unless struck.
- A line under a private joke can explain the joke away.
- Each page already carries a line of the owner's under its hero; a tag's line is a second voice.
- Nobody has measured that readers use these pages at all.

## Challenged

By: the site reviewer, 2026-11-28.
- **Changed:** B's line was said to be "the `lede` piece (Playfair upright)", but `lede` is Didot italic in code (`_components.scss:36`). The shape now says what the prototype does: `lede`, its face set back to Playfair upright until 0013 changes the piece, as `.photobook-cover__lede` does.
- **Changed:** C was said to narrow Voyage's list "in place"; it swaps in another list, voyages and parts. The shape says so, and it is one reason C is dropped.
- **Changed:** "A tag's list is a Doorway" held only for `/voyage-by-tags/` (DESIGN-LANGUAGE:299, "a page that leads into photographs"). The fit row now gives `/tags/` stage 10's answer as its warrant, marked the lead's reading.
- **Answered:** row 1 had no look at 320 px. The prototype then captured 320, and the row records it.
- **Answered:** row 8 proved links, not arrivals. The row now says so; the site keeps no analytics.
- **Changed:** C puts two controls for one job on Voyage, and §6's remedy is removal. Agreed: the fit row is now "conflicts", and C is dropped.
- **Changed:** C swaps the wall for a different list. Confirmed in code (`site.voyage` against voyages and parts); C is dropped.
- **Changed:** C re-proposes pages kept "as today" (PRINCIPLES, "it is not re-proposed") and worsens the phone. Agreed, and C is dropped. One part does not hold: the author column is settled, not open. Q24's picture did not land, but Q25 asked again and the owner kept it, "everywhere" (0013).
- **Changed:** B leaned on the Didot lede the owner turned away; that is mended above. Lines are now asked only where a name does not speak for itself (question 1), so a line under "Italy" is not asked for.
- **Stands:** B can explain a private joke, and the pages already carry the owner's hero line. Only the owner can say which lines add and which take away: that is question 1, and the choice page.
- **Stands:** the reviewer's verdict, Park: "acceptable, ok for now", R030 unmerged, no measured audience. The lead pursues B anyway, because the prototype is built and proved, costs 2 KB and 17 lines, and waits on R030 rather than competing with it. The owner should weigh it: if you mean "ok for now" as "leave it", that is A, and the choice page offers it as a live option.

## Questions for the owner

### 1 · Which tags should carry a line under their name?
- **A (recommended):** Only those whose name keeps a secret (Horcrux, Ox, Retrace, Favourite…); I keep or strike each.
- **B:** Every tag, from the 24 drafts, as I keep or strike them.
- **C:** None: the names say enough.

Why: a line under a private word lets a reader in; under "Italy" it only pads.

### 2 · Whose voice is a tag's line in?
- **A (recommended):** QSD's, in the third person, as the drafts mostly are.
- **B:** Mine, "I", as the line for QSD's Favourite is.

Why: the drafts mix the two; one voice reads as one hand.

## Next

A `/choose` of A (as built) against B (`design/choices/tag-collections/`); if B is picked, it goes into
stage 10 after R030 merges, with the lines the owner kept.
