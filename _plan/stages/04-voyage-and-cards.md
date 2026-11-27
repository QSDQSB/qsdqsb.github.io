# Stage 4 · Voyage and the cards

**Status:** planned. **Tier:** 2, answered: the picks of 2026-10-01
([0009](../decisions/0009-how-much.md)) and the sheets of 2026-11-27 (Q24, Q25;
[0013](../decisions/0013-what-the-sheets-settled.md)). Built as one batch, one session and one pull
request with pictures; the merge is the yes ([0010](../decisions/0010-the-merge-is-the-yes.md)).

**Scope changed 2026-11-27.** The refined card is no longer a choice: the owner kept the Voyage
page, its wall and a part's covers as they stand (Q25) and answered the cover's words (Q24). The
map joins this stage: both pages that carry it are here. Home's cards moved to
[stage 13](13-home.md). The branch `gallery/voyage-doors` is on neither this Mac nor GitHub
(looked 2026-11-27); its study is [here](../studies/2026-09-26-voyage-parent-pages.md).

## Goal

The doorway to the photographs, as it stands, made true to the rule: a cover that is still under the
pointer, a voyage in parts that says what it holds, and a map a reader can use without being asked
to wake it.

## What is already decided

**Kept as it stands (Q25; not to be re-proposed):** how the Voyage page opens; the wall of covers as
one unbroken run; the size of a part's covers. With them, from before: doorways withhold; the huge
vivid cover on a large screen is the point; a card is a magazine cover with the same contrast over
every photograph; the photograph never animates.

**Tried and judged (2026-09-26):** a contents list, a square-cover grid and one continuous book with
chapter cards: none felt immersive. "By the light": a definite no. "Hang" and "cinema": competent,
not extraordinary. "Through the doors": fine as the moment of entering, must not replace the cards.

**The owner, on the cover:**

- "The wide cover of a voyage does nothing under the pointer": "Nothing moves, nothing changes"
  (2026-10-01, pick 13). Its words: "Fade in, in place" (Q24).
- "Under the pointer a card lifts between 3 and 6 px and grows to between 1.012 and 1.025" (pick 4);
  "A lift takes 0.3 s" (pick 5); "At rest a card stands just off the page, on a short shadow" (pick
  3). Each was drawn as a small card.
- "Nothing springs" (pick 12). "A voyage's title stays as built: Playfair, bold, upright" (pick 14).

**The owner, on a voyage in parts and the map (Q25, with Q24's two):**

- A voyage in parts introduces itself with "The facts a single voyage carries".
- Its map opens "Close, with each part's name written in".
- The map is "Awake from the start".
- A marker opens "A label, as on a map": "It should be able to hover and display".
- On a phone a marker's card is "A strip of words at the foot", and "A tap unfolds it to the whole
  screen".
- The map's tags: "One slim list, no title bar". Its markers: "Colour stays, on the map alone" (Q24).
- The map stands "After the covers, on both pages" (Q24).

**Which is the cover and which is a card.** The wide cover is the `card` of `_sass/_archive.scss`,
drawn the width of its column (`_includes/archive-single.html`). It is on `/voyage/`, a voyage in
parts, `/year-archive/`, `/portfolio/` and, until batches 1 and 2 land, under a post and at the end
of a book.

## Scope: batch 3, Voyage and the map

Tier 2, answered, unless a line says otherwise. Pictures at both widths; a hover as a short capture.
Audit ids are sections of `design/audits/stylesheets.md` (S), findings of
`design/audits/reviewer.md` (R) and `design/audits/measured.md` (M).

**The cover**
- [ ] The wide cover is still under the pointer (pick 13). From `.card:hover, .card:focus-within`
      take the transform, the six shadows, the change of shape and the title's rise (S, B1; R2;
      M3). Its line, date and reading time fade in, in place, over the owner's one second (Q24);
      a block an author hides on a cover (`.hidden_item`) fades the same way and no longer slides.
      Keyboard focus keeps a mark: `brass-focus`. Q24 asked of "a wide cover", so a post's and
      Portfolio's change with a voyage's.
- [ ] The `cover-still` journey: on `/voyage/` at desktop width, hover the first `.card` and assert
      its transform is none and its shadow is what it was at rest, and that its line reaches full
      strength. Nothing else guards "the wide cover does nothing".
- [ ] The same cover has four left edges: Posts 268 px, Voyage and Portfolio 277, a voyage in parts
      27 (outside its own title at 43), the end of a book 43 (R21; M11, M12). One edge a page, the
      title's. It is R025, whose branch `work/r025` is on GitHub: read it first. With it F103's
      journey: the title starts at the list's edge at 1152 and at 1440. Tier 1; the moves are 9 to
      16 px, so they are shown.
- [ ] The grid card (`.card_grid_view .list__item`) grows by 5 per cent on a fancy shadow (S, B3):
      the audit found no page that draws it (M, table 3). Delete it if none does; else the `card` piece. Tier 0 or 1.

**A voyage in parts**
- [ ] Q25, parts-intro · A voyage in parts states the facts a single voyage carries: when (its span),
      how many parts, how many frames, at the right of its opening picture, set as on a voyage's
      cover. Figured at build from its parts, never typed. It is a count at a door, and the owner's
      ([0013](../decisions/0013-what-the-sheets-settled.md)); nothing else at a door gains one.
- [ ] Parent pages (Prague, Rome, Japan, Dolomites, Venice) keep their covers as they stand (Q25).
      Venice: four parts "still on their way"; the owner chose to leave it. Ask before touching.

**The map**
- [ ] Q24, atlas · The map comes after the covers on `/voyage/` as on a voyage in parts, under the
      same small heading and on the covers' own edges (R7: it is inset 9 px today, and first on the
      index). The heading is Didot with a hairline, no filled pin and no dashed rule (the lead's
      reading of Q24's small headings, tier 1; R15, R22; M15).
- [ ] Q25, map-asleep · Awake from the start: no veil and no "Click to explore". The lead's, tier 1:
      the wheel still moves the page until the map has been clicked, so scroll is never taken, and
      it still starts only when the reader nears it (audit S14). The `atlas` journey is rewritten
      with it.
- [ ] Q25, parts-map-close · A voyage in parts' map opens on its parts, each marker with its part's
      name written beside it. With F099's journey: on `/voyage/` the tiles' zoom is at least 4.
- [ ] Q25, map-card · A marker shows a label, the voyage's name and its date, under the pointer and
      under keyboard focus; pressing it opens the voyage. The box of words goes: the line, the tags
      and the wide button wait on the voyage's own page, and a tag's inline colour leaves
      `assets/js/map.js` with them. The name is Playfair (it is CMU italic today: S, A3). No arrow
      (Q25, "No arrow").
- [ ] Q25, map-card-phone and map-phone-buttons · On a phone the small map is a preview; a tap
      unfolds it across the screen with a close mark and Tags, and no zoom buttons. A marker's
      words are a strip at the foot: name, date, "Open voyage". The unfolded map takes the
      lightbox's grammar ("One viewer"): Escape and Back close it and the page is where it was.
      Desktop and phone differ here by the owner's pick.
- [ ] Q25, map-tags · The tags are one slim list with no title bar: all fourteen in a column about
      236 px wide, none scrolled. The dots keep their colours (Q24); the chosen tag is marked by a
      hairline in the pale brass, not a fill and a grown dot (S, C).
- [ ] The map's controls, to 0012 (tier 1; S is the audit to open): zoom, reset and full screen are
      the site's own button and not the library's (R20); nothing rises a pixel under the pointer
      (S, B9); 10 px corners and no pill (S, D); labels and counts in Barlow at 11 px or more (S,
      A2, A5, H13); the hand-made buttons, tags and close mark take the shared pieces (S, F); the
      Tags button is tall enough to tap (M22). Weights the site loads (S, A1.4).

**Kept from before**
- [ ] Related-post and grid cards get the cover's scrim (P07): with batch 1's two small cards.
- [ ] 2026-09-29 · Tokyo's line, "Where sakura blooms in the bustling metropolis."
      (`_subvoyage/japan/tokyo.md`): the house-style check names "bustling". It is the card's poem,
      so the word goes to the owner. Change nothing before.

**Closed by the sheets (2026-11-27)**
- [x] The refined card as a choice: closed. Its words are answered (Q24); the page, the wall and the
      parts' covers are kept (Q25); the poem is at rest on a phone already.
- [x] The Voyage index and its length (P03): kept as one unbroken run (Q25).
- [x] The same voyages listed two ways, and the tag dock that covers card titles (X14, C01): they
      are the tag pages', rebuilt in [stage 10](10-tags.md) (Q23, R030).
- [x] Home's "What's new" cards: moved to [stage 13](13-home.md).

## Still open: the owner's

- **The wide cover's corners.** 17.28 px on a desktop and 9.6 px on a phone, a difference nobody
  chose (R16; M10; 0009, "Not settled"). One value at both widths, 18 px or 10 px: to be asked.
- Does a cover take a plate of glass? "No opaque plates, chips or panels over the image" stands; the
  scrim stays unless the owner asks.

## Shared pieces

Uses: `card` (rest, and stillness without its lift), `brass-focus`, `eyebrow`, the scrim, the quiet
icon button, the round tool. New, said in `_docs/components.md` first
([0002](../decisions/0002-one-control-vocabulary.md)): a map's label. The unfolded map on a phone
reuses the lightbox's shell, or says why it cannot.

## Journeys

`voyages`, `home` and `atlas` (rewritten: no veil) must pass. To add: `cover-still`; `atlas-label` (a
marker under the pointer or focus shows its name and date, and pressing it opens the voyage);
`atlas-parts` (a voyage in parts' map shows every part's name; `/voyage/` opens at zoom 4 or
closer); `atlas-phone` (a tap unfolds the map, a marker's strip leads to its voyage, closing
returns the page to where it was); the archive's edge (F103).

## Exit

`npm run gate:full` passes with baselines re-captured for the pages meant to change (`/voyage/`, a
voyage in parts, Posts, Portfolio), and only those; `npm run check:mobile-overflow` in Safari's
engine; the reviewer returns PASS; the pull request carries the pictures and the captures.
