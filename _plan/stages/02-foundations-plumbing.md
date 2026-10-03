# Stage 2 · Foundations: plumbing

**Status:** building (from 2026-10-03) · **Tier:** 0 for structure; 1 for each visible migration under the major-delta
threshold; 2, answered, for a move onto one of the owner's amounts
([0009](../decisions/0009-how-much.md)); 2 for the first appearance of a new piece.

## Goal

One vocabulary every later page takes its controls from, and a guard that refuses a new one. For a
reader: links in brass, headings in white, words that arrive in turn, and nothing that springs.
Implements [0002](../decisions/0002-one-control-vocabulary.md) as amended by
[0009](../decisions/0009-how-much.md), and steps 1 to 3 of
[0003](../decisions/0003-stylesheet-organisation.md).

## What is already decided

The owner settled the language's ambiguous part on 2026-10-01 in two rounds of drawings
([the study](../studies/2026-10-01-the-qsd-aesthetic.md)). Round 1 said which; round 2 said how
much. Nothing here waits on an amount any longer. The language is version 1: the owner said it reads true
(Q11, 2026-10-01).

- **Three decision records.** [0002](../decisions/0002-one-control-vocabulary.md) and
  [0003](../decisions/0003-stylesheet-organisation.md), accepted under delegation, with the tiers
  the owner accepted (Q2). [0009](../decisions/0009-how-much.md), the owner's amounts, which moves
  steps of 0002's scales and adds a shadow scale, an ornament and an arrival.
- **The owner's calls**, from [`PRINCIPLES.md`](../PRINCIPLES.md), The eye, round 2:
  - "A card's corners are 10 px" (pick 1): "B or C depend on the scenario". C is 18 px.
  - "A control is a rounded rectangle of 10 px" (pick 2), chosen over "A pill, and a round tool".
  - "At rest a card stands just off the page, on a short shadow" (pick 3).
  - "Under the pointer a card lifts between 3 and 6 px and grows to between 1.012 and 1.025" (pick
    4, A, with the note "Between A and B"). The one value built, 4 px and 1.018, is the lead's. "A
    lift takes 0.3 s" (pick 5).
  - "Words arrive over 0.7 s, from 28 px below, one line after another, and settle" (pick 6).
  - "The ornament is a lozenge on a rule" (pick 8). "An ornament stands only between passages of
    prose" (pick 9).
  - "Under the pointer a tag only brightens" (pick 10). And round 1: "Tags are ink only" (pair 4,
    score 5).
  - "Glass is 14 px of blur" (pick 11): "A B Both OK". A is 6 px.
  - "Nothing springs": "It arrives and stops" (pick 12).
  - From before the pairs: white headings; brass links (Q9); the findings marked Fix on the audit.
- **From 0009, "Who may build what":** "A pick answers the thing it drew." Carrying an amount to a
  different kind of thing "is shown to the owner first when the move is at or over the major-delta
  threshold, and is tier 1 below it". "A visible change that brings a surface to an amount in this
  record is tier 2, answered. It is built without asking again. It still passes the full gate and
  the reviewer, and reaches the owner as pictures at both widths". "A value marked the lead's is
  tier 1". "What round 2 did not ask stands on 0002".
- **What is built.** Bringing a surface into line with a shared piece that already exists in
  `_sass/_components.scss` (`brass-focus`, `eyebrow`) is tier 1
  ([0001](../decisions/0001-who-decides-what.md)).
- **Not the lead's reading.** A line of the language with no date, score, pick or "built" beside it
  is not a reason to change anything a reader sees.
- **Inherited, not re-measured.** The owner: "Most of the design aesthetics we established should be
  inherited." The Photobook's pill, its round tools and its bar and panel of glass stay as built in
  this stage (0009, "Not settled").

## The order of work

1. The pixel harness's two faults (below): every before-and-after rests on the diff.
2. Tier 0: the import order, the inks, the scales as 0009 has them, the layers, the ratchet. No
   pixel moves.
3. The new pieces, written in `_components.scss`, entered in `_docs/components.md` and drawn on the
   specimen page with every state. No page adopts one yet.
4. The shared moves a reader sees: the link, the headings, the arrival, then C02 and C06, the chrome
   first. One surface per change. The corners, the timings and the glass that the owner has not
   seen go to them first ("Shown to the owner first", below).
5. Surfaces take the pieces in their own stages: the cards in [4](04-voyage-and-cards.md), the
   ornament and article pictures in [6](06-posts-and-about.md), the tag pages in [10](10-tags.md).

## Scope

**Tier 0: no pixel moves**
- [x] 2026-10-01 · Done 2026-10-03: a page taller than 8,000 px is shot in tiles and joined
      (`scripts/visual-baseline.mjs`, `fullPageShot`); eight long shots re-captured, now drawn to the foot.
      As first written: The pixel harness is blind below about 16,700 px: full-page shots are blank past it
      (post-notices desktop 17,075–40,390 of 42,501, mobile 16,677–51,713 of 53,423; voyage-by-tags
      mobile; the treatise's figure on a phone). Shoot long pages in tiles. First: the arrival below
      changes every post, and half of a long post is unseen today.
- [x] 2026-09-26 · Found with the tiling, 2026-10-03: in a single full-page shot a mask could land short
      of its element (post-toc on a phone showed 80 px of the sampled cards it was meant to cover); shot in
      tiles, each mask lands on its box. Checked by two diffs on an unchanged tree (see the Log). As first written:
      The pixel harness's phone shots differ run to run (intermittent masks, image load
      timing). Same reason, same place in the order: a diff that cries wolf gets re-captured, not read.
- [x] A01 · Import `components` directly after `responsive-policy`. The compiled stylesheet holds the same
      lines before and after, one block moved (2026-10-03).
- [x] A03 · Inks and glass on `:root` under neutral names; old names kept as aliases. `_sass/_tokens.scss`
      (2026-10-03), with the two curves; the weather glyphs' own `--ink` became `--glyph-w` so the name is free.
- [ ] A02 · The scales in `_variables.scss`, as 0002 amended by 0009, each introduced with its first
      two uses: corners `none`, `hair` 3, `picture` 8, `soft` 10, `large` 18, `pill`, `round`;
      durations `fast`, `base`, `slow`, `arrive` 0.7 s, `cover`, `scene`; shadows `rest` and
      `lifted`; glass `glass` 14 px and `thin` 6 px.
- [ ] C09 · Depth as six named layers; every literal z-index mapped to one.
- [x] The ratchet: `scripts/check-vocabulary-ratchet.py` (2026-10-03), counts against HEAD as the
      `!important` ratchet does, in the gate, the edit hook and the stop hook. Today: radius 95, curve 90,
      overshoot 1 (the bubbles), blur 19, focus 40, z-index 99 (focus counts only a block that draws a ring of its
      own, an outline, a shadow or a border, since the reviewer's note of 2026-10-03: a hover-and-focus pair that
      only colours is not a ring, and counting it would have pushed authors to drop `:focus-visible`). As first written: counts stored, an increase fails, wired into the hook and the gate. It also counts
      a curve with a point above 1 or below 0 (0009, "Nothing springs"): two today. One is inert
      and goes with A05 (`_sass/_page.scss:210`); the other is the bubbles on Home
      (`assets/js/qsd-bubbles.js:356`), a signature's, which stays and is the count's floor.
- [x] The specimen page (2026-10-03: `_specimen/`, in the visual build only, shot as `specimen`): every piece, drawn with the site's own stylesheet, at desktop and at phone
      width, each labelled built, the owner's amount, the lead's value, or decided under delegation.
      It is where the owner sees the pieces whole, and once it is in the pixel baseline a change to a
      shared piece shows on one page. It must not ship to readers: a page of the seeded visual build
      only, or a page outside the site. A page a reader can reach is a new page, and the owner's.
- [ ] A05 · Delete the CSS and script that nothing renders (about 700 lines). Done 2026-10-03: `.card .tags`
      and the springing transition on `.page-no-right-sidebar`. Not dead after all: `.card .hidden_item`
      (the Lontananza post uses it). The rest of the list overlaps three draft pull requests of August
      (#56, #57, #64), which are the owner's to merge or close first. As first written: Among it, found
      2026-10-01: `.card .tags .tag` and `.card .hidden_item` (`_sass/_archive.scss:192-199`,
      `213-218`, `288-302`). No include emits either: `_includes/archive-single.html` writes no tag.
      And the transition on `.page-no-right-sidebar` (`_sass/_page.scss:208-211`), on a curve that
      overshoots (`cubic-bezier(0.175, 0.885, 0.32, 1.275)`): read 2026-10-01, nothing in `_sass/`,
      the layouts, the includes or the scripts ever sets a transform or an opacity on that element,
      so it never runs and no reader sees it. Confirm in the build, then delete.
- [ ] A09 · Docs and comments corrected to match the code. One more, found 2026-10-01: the comment in
      `assets/colour-atlas.json` still names The Colour of Light, a page retired on 2026-09-29.
- [ ] Split `_photobook.scss` and `_colour.scss` by part, after confirming the guards walk subfolders.

**The new pieces: tier 2, answered by the picks; each lead's value tier 1.** Written once, in the
catalogue, with every state (rest, hover, focus, pressed, unavailable, on a photograph, on the
ground), and put to "What the eye turns away" before it is shown.
- [x] `card` (picks 1, 3, 4, 5, 12). Written 2026-10-03, on the specimen page; shown to the owner there before any page adopts it. Corners 10 px, and 18 px as `large`. At rest
      `0 6px 18px rgba(0, 0, 0, 0.45)`, no border. Under the pointer and under keyboard focus
      `translateY(-4px) scale(1.018)` and `0 14px 32px rgba(0, 0, 0, 0.5)`, over 0.3 s on the
      standard curve; the lift and its shadow are the lead's values inside the owner's range. The
      photograph does not move inside the frame. Stillness beside it: no transition and no
      transform, the shadow alone answers. First adopted in [stage 4](04-voyage-and-cards.md).
- [x] `tag` (written 2026-10-03, on the specimen page) (pair 4, score 5; pick 10; audit C08, marked Fix): one look for every tag. The second
      ink, a one-pixel line, no fill; under the pointer the words go to the first ink and the line
      to the second, in `fast`; no colour. Corners 10 px (the lead's: the pick drew it square).
      Replaces five recipes; the surfaces are stages [6](06-posts-and-about.md) and
      [10](10-tags.md).
- [x] The text `button`, solid and quiet: a rounded rectangle of 10 px (pick 2). `text-button`, 2026-10-03, on the specimen page.
- [x] The ornament (written 2026-10-03, on the specimen page) (picks 8 and 9): a lozenge 14 px across, outlined at one pixel with a smaller
      filled one inside, on a one-pixel rule at about half strength, 12 px clear of it, in the
      site's brass. It is new, not the emblem rule (`_includes/qsd-emblem-horizontal-rule.html`, a
      signature, in two posts, which stays). First used in [stage 6](06-posts-and-about.md).

**The arrival: tier 2, answered (picks 6 and 12), for what it reaches today.** One mechanism, and
it exists. The owner was shown three lines arriving: an eyebrow, a title, a lede. The mechanism is
wider than that drawing, and this says how.
- [x] `reveal-on-scroll` takes the owner's amounts. Built 2026-10-03: a second class, `arrives`, carries them,
      so Palette's frames (which add only `reveal-on-scroll`) keep the older ones; the observer fires at any
      part showing (threshold 0), so a block taller than the screen is never left hidden; journey `arrival`
      (checked with teeth: at 0.5 s turns it fails). Captures for the owner in `design/arrival/` (not in git).
      As first written: Today (`_sass/_scroll-animations.scss:8-13`,
      `assets/js/scroll-animations.js`): every direct child of `.page__content` rises 12 px, fading
      over 0.5 s and moving over 0.65 s, the moment it comes into view, together. It becomes: from
      28 px, fade and rise both 0.7 s, the rise on `$cubic-bezier-smooth` (which is the curve
      drawn), each 0.12 s after the one before among those that come into view together. The first
      four take turns and the rest arrive with the fourth (the lead's value: "Prefer B, but do not
      overdesign").
      - What takes turns is a block, not a line of type: a paragraph, a heading, a list, a table, a
        code block, a figure. The script also reveals a picture (`.article-image`) and the
        children of a few wrappers (a centred block, lyrics, a bilingual panel), so it is not words
        only. The owner chose against "As built today", which was this same mechanism; a picture
        arriving with the words around it is part of what is built.
      - Where it reaches: every page with a `.page__content`. That is a post, About
        (`_layouts/about.html`), the CV, Terms, the 404, Bestiary (`_layouts/single.html`) and a
        splash page. Not a book, not the Voyage index, not Home.
      - Not Palette's photographs. `assets/js/colour/palette.js:166` puts the same class on them:
        they keep today's amounts until F049 is settled in [stage 11](11-colour-pages.md). The
        treatise and Nocturne set their own.
      - It must not cost a reader the page: jump to the foot of a long post and no screen is left
        without words. Measured, and held by the `arrival` journey below.
      - Stillness as built: under reduced motion and `html.motion-off` everything lands and is
        never hidden. `npm run visual:audit` proves it.
      - Shown to the owner as short captures at both widths: `/posts/shihuqiao/`, a bilingual post,
        and `/about/`, which is not a post. A still cannot show it. If blocks of prose arriving
        28 px apart read as too much beside the three lines the owner was shown, that is said with
        the captures, not decided by the session.

**Shown to the owner first.** Each carries an amount to a surface the owner did not see drawn, by a
move at or over the major-delta threshold (20 per cent, or 0.25rem). Nothing here is built on the
pick alone. They go to the owner together, from the specimen page, as pictures at both widths
([0005](../decisions/0005-choices-arrive-as-prototypes.md)).
- [ ] C03, the sorted list. Every literal radius in `_sass/` is sorted: print, article picture,
      control, card, panel of glass, pill or round, other, with the value today and the value it
      would take (a control and a card 10 px, a card that is the scene 18 px). The sorting is the
      lead's judgement and some moves are half the value (20 px in five places; 30 px on the search
      panel). The list, with a picture of each surface that would change, goes to the owner before
      any radius moves. Tier 0 to make; the moves are the owner's. Not on the list: the 18 pills and
      28 circles (inherited); the wide cover's own clamp (stage 4); the surfaces stages 6 and 10
      redraw.
- [ ] C05, the panels of words. The search panel's glass is 25 px and 30 px
      (`_sass/_search.scss:109,399`) and the map's panel 18 px (`_sass/_map.scss:390`). The owner's
      14 px was drawn as a name on a plate over a cover, not as a panel of dense text, and 30 to 14
      px is a move of 53 per cent. Each is drawn at 14 px beside what is built, with the
      Photobook's bar and panel, and the owner chooses.
- [ ] C05, the bilingual switch. Its glass is 4 px (`_sass/_bilingual-switch.scss:50`); `thin` is 6
      px. That is 2 px and 50 per cent: under the absolute threshold and over the relative one, so
      it is not tier 1. Shown with the panels.
- [ ] C04, the one-second controls. `$cubic-bezier-default` puts one second on seven properties,
      twenty uses in seven files, the navigation, the copy button and the sidebar among them. One second to `base` (0.3 s) is 70 per cent. "Snappy timings are for utility
      controls" is the owner's (Cards), but which of the twenty is a control is the lead's sorting:
      the list goes to the owner, each with a capture, before a timing moves. The wide cover's use
      is stage 4's.
- [x] The built pill and round tool beside the 10 px control (0009, "Not settled"). Settled 2026-10-03: brought to
      the 10 px rectangle (Q17, B), shown before and after (https://claude.ai/artifact/VnsZ39qDGSbUkvebTymwCn) and approved.

**Tier 1: brought into line, under the threshold, shown before and after**
- [ ] C02 · `brass-focus` as the one focus ring, surface by surface.
- [ ] C03, under the threshold · A radius the sorted list moves by less than 0.25rem and less than
      20 per cent, once the owner has seen the list.
- [ ] C04, under the threshold · A timing within a fifth of its step moves onto it (0.28 s to
      `base`); bare `ease` and the ad hoc curves go to the two curves where the duration does not
      change. Anything further is in "Shown to the owner first".
- [ ] C05, under the threshold · `control` (12 px) folds into `glass` (14 px): 2 px, 17 per cent.
- [ ] C06 · Hand-written labels onto `eyebrow`.
- [ ] C12 · Small dialects swept once the scales exist: hover direction, dates, ellipses, rules, one `scroll-padding-top`.

**Decided by the owner on 2026-10-01, to build**
- [x] Headings white by default; the hue-per-level h2 to h5 in `_sass/_base.scss` retired. Shown before and after.
      Built 2026-10-03 in the ivory ink (Q18, A). Links inside headings stay F078's.
- [x] Q9 · Built 2026-10-03 (`_sass/_page.scss`, "A link in a page's text"): prose under `.page__content`
      and under its `.barlow` wrapper (the CV); notices are paragraphs, so their mint went with it. Still
      blue and filed: a link in a heading (F078, with the headings below), About's typewriter (F079), the
      '#' on Voyage by tags (F080). As first written: A link inside a page's text is brass, with a hairline underline. Tier 2, answered: the
      owner picked option B of three prototypes on 2026-10-01 (`design/choices/link-colour/`; the page
      is `choices.link-colour` in `_plan/hub.json`). Built as "The link, as chosen" below.
- [ ] C07 · The lede on older heroes takes the shared Didot italic (marked Fix).
- [x] C10 · Roboto leaves the two font stacks, so Android reads as Apple does (marked Fix). Done 2026-10-03 (`_sass/_variables.scss`).

## What needs the owner

- **Nothing before it starts.** Q11 (does the language read true) is open and holds nothing here.
- **At the specimen page, with pictures** ([0005](../decisions/0005-choices-arrive-as-prototypes.md);
  not in the queue until the page exists to shoot): everything under "Shown to the owner first".
  That is the sorted list of corners; the search and map panels and the book's bar and panel
  beside 14 px of glass; the bilingual switch; the one-second controls; the built pill and round
  tool beside the 10 px control. The unsettled ones are in 0009, "Not settled".
- **The arrival, as captures**, on two posts and on About: it is answered, and it reaches more than
  the three lines the owner was shown.
- **Which white a heading is** (the ivory ink, or pure white): shown before it is built.
- Any other move at or over the threshold on a surface the owner has not seen at its new amount.

## Journeys

`post`, `anchor`, `home`, `search`, `masthead-touch` and `masthead-keys` must pass unchanged. To add:

- `arrival` · on a long post, a jump to the foot leaves no screen without words: what is in view
  reaches full strength by about 1.1 s (three turns of 0.12 s, then 0.7 s) and nothing in view stays hidden. With motion off, nothing
  is ever hidden.

The `tag`, the `card` and the ornament get theirs where a page first uses them.

## The link, as chosen (Q9)

What the owner saw and picked, from `design/choices/link-colour/choice.json`, option B, shot on
`/about/` at 1440 and 390:

- The brass, `#c3b498`, which is the site's brass already (`$intriguing-word-color`). A link that has
  been visited looks the same as one that has not.
- An underline at rest: one pixel, set 0.22em under the text, in the same brass at half strength.
- Under the pointer it brightens to ivory. This was written on the option ("Hover brightens to
  ivory") and not in the stills, so it is shown in the before-and-after.

To settle at the build, each within what was chosen:

- **Where it reaches.** The prototype laid its rules on `.page__content a` and nothing else. The
  question the owner answered was a link inside a page's text. Today the colour comes from the bare
  `a` rule (`_sass/_base.scss:31-41`: blue, a second blue once visited, mint and an underline under
  the pointer), which also colours every link that has no rule of its own. Build the chosen link for
  text a reader reads: a post, About, the CV, Terms, the 404, a notice. Then list whatever else is
  still blue by inheritance. Each one either has its own look already or is a line in the inbox. None
  is recoloured in passing.
- **Not text links, so not in this task.** `$link-color` also feeds the type badges
  (`_sass/_type-badge.scss:27,44`, `_sass/_search.scss:271`) and the search field's focus border
  (`_sass/_variables.scss:190`). The badges are C08's, the border is C02's. The variable stays until
  they have moved (`CLAUDE.md`: a token is traced across all of `_sass/` before it is removed).
- **Mint on a notice** (`_sass/_notices.scss:49-51`) and the older blue on an archive item
  (`_sass/_archive.scss:39`): text links in an older dress. Brought to the chosen link, shown before
  and after.
- **The focus ring** is `brass-focus` (C02). Brass on brass: check that the ring still reads.
- **The underline is what marks the link for a reader who cannot tell brass from ivory.** It stays
  at rest. It is never shown only under the pointer.
- **No new variable.** The brass exists; the underline's values sit at the one rule that uses them.

Pages it is checked on, desktop and phone, in Chromium and in Safari's engine:

| Page | Why |
|---|---|
| `/about/` (baseline `about`) | The page the owner saw. The built page must match the picked still |
| `/posts/shihuqiao/` (`post-toc`) | Links in running text beside a contents list, whose own links must not gain the underline |
| `/posts/defined-by-archive/` (`post-bilingual`) | Chinese: the underline's distance under Songti, and a link that wraps across lines |
| `/posts/leetcode-july-challenge/` (`post-notices`) | Links inside notices and beside inline code |
| `/posts/jianfei-diary/` (`post-jianfei`) | The treatise colours its own links (`_sass/_jianfei-treatise.scss:55`); they keep that |
| `/cv/`, `/terms/` | Text pages with no baseline: shot by hand, before and after |
| `/404.html` (`404`) | Its way back |
| Home, `/voyage/`, a book, `/palette/`, `/reverie/`, the search panel | Must not change: a card, a door, an onward link or a result is not a text link. The pixel diff stays clean on these. Home's layout and `splash` carry `.page__content` too, so the prototype's selector reaches further than About |

Baselines are re-captured for the pages meant to change and no others, named in the changelog line.
A link that wraps a picture takes no underline.

## Design notes

- The owner's calls and decisions 0002, 0003 and 0009 are what this stage implements.
  [`DESIGN-LANGUAGE.md`](../DESIGN-LANGUAGE.md) describes them on one page; its head says which
  lines are the owner's and which are still the lead's reading.
- The chrome first (masthead, search, subscribe), because it is on every page and has the most
  private recipes. Then the map. The older pages' own controls wait for their stages.
- One surface per change, so a pixel-diff delta has one cause.
- `_docs/components.md` gains each new piece and the amended scales in the same change that writes
  them. It is outside `_plan/`: the session that builds makes the edit.

## Exit

The ratchet's counts are lower than on 2026-10-01 and committed as the baseline. `npm run gate:full`
passes and the reviewer returns PASS. The digest shows each tier 1 change before and after, and each
tier 2, answered change as pictures at desktop and at phone width, with the pick it answers; the
arrival as captures. Nothing under "Shown to the owner first" has moved without the owner's word. A baseline is re-captured only for a page meant to change, named in its
changelog line.

## Log

- 2026-10-03 · First batch: the harness's two faults, A01, A03, A05 (in part), C10, Q9, the ratchet, the
  specimen page and the four pieces (card, tag, text button, ornament), none adopted by a page yet. The
  harness's determinism, honestly: two full diffs on an unchanged tree after the tiling came back with one
  and three shots over tolerance (home on a phone, 68 px against 59 allowed; palette-voyage at desktop,
  about 2,700 px; portfolio on a phone, 84 px). The palette ones were vats caught mid-pour (F077): the
  harness now waits until the canvases stop arriving and reshoots a blank vat. What remains is a few
  antialiased pixels that move between runs, so a diff over tolerance is shot a second time before it
  fails, and the report says so ("on a second shot"). A real change fails twice.
