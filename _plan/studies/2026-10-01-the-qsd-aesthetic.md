# What is the QSD eye, where the design language only guessed?

**Asked:** 2026-10-01 · **Status:** answered (two rounds, 2026-10-01) · **Stage:** 2

## Why it was asked

The owner answered Q3 with "We need to revisit it", and then said how: "Most of the design aesthetics
we established should be inherited. Let's focus on the ambiguous part. The idea of the design language
is not to constrain the layout or ideas, but to have a mimicking QSD aesthetics that can kill bad
designs that are cheap, overly fancy for no good reasons. You can create an artifact or a local html
to use side by side comparison and let me select (score 1-5) of the preference between the two
options, and we approach and summarise the aesthetics".

So the language is not to be a rulebook for layouts. It is to be a description of an eye, exact enough
that a session can tell the house's work from the cheap and the needlessly fancy.

## The tests

- What is already settled is inherited and is not asked again ([`PRINCIPLES.md`](../PRINCIPLES.md)).
- Each pair isolates one thing the draft guessed (the lines marked "the lead's reading" in
  [`DESIGN-LANGUAGE.md`](../DESIGN-LANGUAGE.md)), drawn twice in the site's own ground, inks and faces.
- A score is a leaning, not a rule: what is written afterwards says why, in the owner's words where
  they gave them.

## What was tried

Round 1: seventeen pairs, on a page of their own, https://claude.ai/artifact/MKXF1rRxmTxmydfvzYv9AN.
Each is scored 1 (A, clearly) to 5 (B, clearly), 3 for either; "Neither is the site" and a note are
answers too. The scores are kept with the page, in its `scores` collection, one document per pair id
(`ArtifactData`, `action: "list"`, `collection: "scores"`); `all` holds what the pairs missed. The
page's source is `design/taste/aesthetic-pairs.html` (outside git, as prototypes are).

| # | id | The question | A | B |
|---|---|---|---|---|
| 1 | `corners` | The corners of a print | Square | Soft |
| 2 | `controls` | The shape of a control | Pills, and a round tool | Square, hairline |
| 3 | `container` | How a block of words is held | On the ground, under a rule | In a card |
| 4 | `tags` | Tags | Each its own muted colour | Ink only |
| 5 | `accent` | Where an accent comes from | Always brass | Taken from the photograph |
| 6 | `heading` | A heading that wants attention | White, with a brass eyebrow | A gradient, with a glow |
| 7 | `display` | The voice of a title | Serif, italic | Sans, capitals |
| 8 | `caption` | The voice of a caption | Small capitals, spaced | Serif, italic |
| 9 | `figures` | The voice of a number | Serif figures | Sans, tabular |
| 10 | `glass` | A plate over a photograph | Glass | A solid plate |
| 11 | `shadow` | Whether a card lifts off the page | Flat, under a rule | Raised, with a glow |
| 12 | `hover` | What a card does under the pointer | Brightens; a line draws under its name | Lifts and grows |
| 13 | `arrive` | How words arrive | A quarter second, almost in place | Slower, from below, in turn |
| 14 | `words` | How the interface speaks | Plain | With a voice |
| 15 | `ornament` | Between two passages | A hairline | A brass ornament |
| 16 | `density` | How much air | Few, with room | Many, in rows |
| 17 | `icons` | Icons | Hairline, in ink | Filled, each in a colour |

Three of the pairs (6, 11, 17) put the house beside something loud on purpose: they calibrate how
firmly the eye turns the loud thing away, which is the half of the language that kills bad designs.

**The owner's scores, round 1** (2026-10-01; in the page's store and pasted in chat; the notes are the
owner's words, verbatim). The first attempt was lost: it was made in a local copy of the page's source
opened in the app's file view, which keeps nothing; the page was mended the same day.

| # | Pair | Score | Reads as | The owner's note |
|---|---|---|---|---|
| 1 | Corners of a print | 1 | Square, clearly | "Rounded Rectangle is for card-like elements. We sometimes use rounded rectangle for pictures in the middle of article to make it more smooth" |
| 2 | Shape of a control | 2 | Rounded, not square | "Doesn't have to be pills, rounded rectangle is fine" |
| 3 | How a block of words is held | 3 | Either | |
| 4 | Tags | 5 | Ink only, clearly | "Crowded saturated colour blocks are distracting visually. I prefer a consistent secondary layout for the functionality buttons, it can change colour when hovered, if distinguishing colour is required." |
| 5 | Where an accent comes from | 1 | Always brass | "When similar visually, choose the simpler one with less dependency and complexity" |
| 6 | A heading that wants attention | 1 | White, brass eyebrow | |
| 7 | Voice of a title | 3 | Both, by purpose | "Both have their usecase. Italic, serif, didone font for poetic and storytelling text (like Voyage); Barlow for easy readability (like Utils)" |
| 8 | Voice of a caption | 1 | Small capitals, spaced | "Easier to read" |
| 9 | Voice of a number | 3 | Either | |
| 10 | A plate over a photograph | 1 | Glass | "Again, pure-colour block distracts readers" |
| 11 | Whether a card lifts | 4 | Raised | "doesnt have to glow" |
| 12 | A card under the pointer | 5 | Lifts and grows, clearly | |
| 13 | How words arrive | 4 | Slower, from below, in turn | "Prefer B, but do not overdesign" |
| 14 | How the interface speaks | 3 | A combination | "I prefer a combination. Clarity when needed. For example: "34 frames; Nothing here but dust and echoes. ONWARD"" |
| 15 | Between two passages | 5 | A brass ornament, clearly | |
| 16 | How much air | 1 | Few, with room | |
| 17 | Icons | 1 | Hairline, in ink | "Again, saturated pure colour blocks are distracting" |

**Round 2** (asked 2026-10-01, on the same page, above round 1): how much, not which. Each question
draws one thing at two to four strengths and says which the site does today, where it does one; the
owner picks one, or "None of these", with a note. Kept in the same `scores` collection as `r2-…`
documents, with the letter picked in `pick`. The second part (12 to 16) came from the lead's reading
of round 1 against the owner's earlier calls.

| # | id | The question | A | B | C | D |
|---|---|---|---|---|---|---|
| 1 | `r2-card-radius` | How round is a card | 4 px | 10 px | 18 px | |
| 2 | `r2-control-radius` | How round is a control | Rounded rectangle, 4 px | Rounded rectangle, 10 px | A pill, and a round tool | |
| 3 | `r2-rest` | How far a card stands off the page, at rest | A hairline, no shadow | A short shadow | A deep shadow | |
| 4 | `r2-lift` | How far a card lifts under the pointer | 3 px, scale 1.012 | 6 px, scale 1.025 | 10 px, scale 1.05, with a spring | As built: 4 px, scale 1.03, over 1 s |
| 5 | `r2-lift-time` | How long a lift takes | 0.3 s | 0.6 s | 1 s, as built | |
| 6 | `r2-arrive` | How slowly words arrive | As built: 0.5 s, 12 px, together | 0.7 s, 28 px, in turn, settling | The same, with a spring (round 1's B) | |
| 7 | `r2-article-picture` | A picture inside an article | Square | 8 px | 16 px | |
| 8 | `r2-ornament` | Which ornament | A lozenge on a rule | A star on a rule | Three points | A short brass rule |
| 9 | `r2-ornament-where` | Where an ornament may stand (the furthest) | Only between passages of prose | Also under a title | Also between groups in the interface | |
| 10 | `r2-tag-hover` | What a tag does under the pointer | Turns brass | Takes its own muted colour | Only brightens | |
| 11 | `r2-glass` | How much glass | Thin (6 px blur) | As round 1 (14 px) | Thick (26 px) | |
| 12 | `r2-spring` | Does anything spring? (against "never bouncy") | It arrives and stops | It goes a little past, and settles back | | |
| 13 | `r2-cover-lift` | The wide cover of a voyage, under the pointer (against "no hover lift", 2026-09-26) | Nothing changes | The picture brightens; nothing moves | It lifts, as a small card does | |
| 14 | `r2-title` | The title of a voyage (against "Playfair bold for titles, on every page", 2026-09-25) | As built: bold, upright | Italic, lighter | | |
| 15 | `r2-book-words` | Do the words with a voice reach into the Photobook? (against the book's register, 2026-09-24) | The book stays plain | The book may speak too | | |
| 16 | `r2-turns-away` | "What the eye turns away": does it read true? | It reads true | Close, with a note | Not yet | |

**The owner's picks, round 2** (2026-10-01; in the page's store and pasted in chat; notes verbatim).

| # | Question | Pick | Which is | The owner's note |
|---|---|---|---|---|
| 1 | How round is a card | B | 10 px | "B or C depend on the scenario" (C is 18 px) |
| 2 | How round is a control | B | A rounded rectangle, 10 px | |
| 3 | A card at rest | B | A short shadow | |
| 4 | How far a card lifts | A | 3 px, scale 1.012 | "Between A and B" (B is 6 px, scale 1.025) |
| 5 | How long a lift takes | A | 0.3 s | |
| 6 | How words arrive | B | 0.7 s, 28 px, one line after another, settling | |
| 7 | A picture inside an article | B | 8 px | |
| 8 | Which ornament | A | A lozenge on a rule | |
| 9 | Where an ornament may stand | A | Only between passages of prose | |
| 10 | A tag under the pointer | C | It only brightens | |
| 11 | How much glass | B | As round 1 (14 px blur) | "A B Both OK" (A is 6 px) |
| 12 | Does anything spring? | A | It arrives and stops | |
| 13 | The wide cover under the pointer | A | Nothing moves, nothing changes | |
| 14 | The title of a voyage | A | As built: Playfair, bold, upright | |
| 15 | Do the voiced words reach into the Photobook? | B | The book may speak too, in its empty rooms and ways on | |
| 16 | "What the eye turns away" | A | It reads true: use it as the test | |

What round 2 settles, read from the picks:

- **Nothing springs.** Round 1's two preferred drawings overshot; asked directly, the owner chose
  "arrives and stops" (12). "Never bouncy" stands.
- **A card**: 10 px corners, 18 px where the scene wants it (1); a short shadow at rest (3); under the
  pointer it rises between 3 and 6 px and grows between 1.2 and 2.5 per cent, in a third of a second
  (4, 5). That is quicker and smaller than the voyage cards do today (4 px, 3 per cent, one second).
- **The wide cover of a voyage does nothing under the pointer** (13): the call of 2026-09-26 stands,
  and is now stricter than what was drawn as "brightens".
- **A control** is a rounded rectangle of 10 px (2). **A picture in an article**: 8 px (7).
- **Words arrive** over 0.7 s from 28 px below, one line after another, and settle (6): slower and
  further than the built reveal (0.5 s, 12 px, together).
- **The ornament** is a lozenge on a rule (8), and stands only between passages of prose (9).
- **A tag** is ink, and only brightens under the pointer (10): no colour, even on hover.
- **Glass** at 14 px of blur; 6 px is also fine (11).
- **A voyage's title stays Playfair bold, upright** (14): the call of 2026-09-25 stands; the didone
  italic is for storytelling text, not for the title.
- **The Photobook may speak** in its empty rooms and its ways on (15): this amends the book's register
  of 2026-09-24, for those two places.
- **"What the eye turns away" reads true** (16): it is the owner's now, and is the first test a
  design is put to.

**Round 2, read against the table** (the design lead, 2026-10-01). The eleven lines above hold. What
they leave out:

- **Pick 4 is a range.** The pick is A and the note is "Between A and B". Between 3 and 6 px and
  between 1.012 and 1.025 is the owner's; the one value a session builds (4 px, 1.018) is the
  lead's, and is marked so in [0009](../decisions/0009-how-much.md).
- **"The scenario"** (pick 1's note) is the owner's word and is not explained. When a card is 18 px
  is the lead's reading.
- **What a pick met and did not draw.** Pick 2 chose a rounded rectangle over "A pill, and a round
  tool", and the Photobook's way back is a pill and its tools are round. Pick 11 chose 14 px, and
  the book's bar and panel are 18 and 24. Pick 13 drew a cover with no words appearing; the built
  cover shows its line and date under the pointer. Pick 13 said "of a voyage"; the same piece
  carries a post. Pick 12 drew a card; the bubbles on Home spring. None is settled by reading: 0009,
  "Not settled".
- **The one-second cover hover** (the owner's, Cards) was option C of pick 5 and was not chosen for
  a card's lift; pick 13 leaves the wide cover no lift. What the second still times is a reading.
- **The page's brass** is #c9a86a; the site's is #c3b498, the one the link was picked in. The
  ornament is built in the site's.
- **A tag was drawn square** in pick 10; a control is 10 px by pick 2. The tag's corner is a reading.

## What was learned

The eye, as round 1 shows it. Each line rests on the pairs named; the quoted words are the owner's,
the rest is the session's reading of the scores and is marked so where it goes beyond them.

1. **No saturated blocks of colour in the interface.** Not on tags (4), not on icons (17), not as a
   solid plate over a photograph (10). "Crowded saturated colour blocks are distracting visually." The
   owner asks for "a consistent secondary layout for the functionality buttons": one look for every
   tag, which "can change colour when hovered, if distinguishing colour is required". (Pair 6 is a
   separate refusal: gradient type and glow.)
2. **Of two that look alike, the simpler.** "When similar visually, choose the simpler one with less
   dependency and complexity" (5). This is a rule for building as much as for looking.
3. **Shape by kind.** A print is square (1). A card is a rounded rectangle, and so may be a picture set
   inside an article. A control is rounded, a pill or a rounded rectangle; not a hard square (2).
4. **The page has depth and life, and stops short of show.** Glass over a picture, not a block (10).
   A card lifts off the page (11), and lifts and grows under the pointer (12). Words arrive from
   below, in turn (13). And each time the limit is said: "doesnt have to glow"; "do not overdesign".
5. **Ornament and air are both the house.** A brass ornament between passages (15); few things, with
   room (16). The owner's own word for the look is still "premium, minimal, classy, informative": an
   ornament is finish, not clutter.
6. **A voice for each purpose.** Didone, italic, serif "for poetic and storytelling text (like
   Voyage)"; Barlow "for easy readability (like Utils)" (7). Captions in spaced small capitals:
   "Easier to read" (8).
7. **Clear where it must be, voiced where there is room.** "34 frames; Nothing here but dust and
   echoes. ONWARD" (14): the count plain, the empty room and the way on in the house's voice.
8. **Left free.** How a block of words is held (3) and the face of a number (9): either. No rule is
   written for these.

**What it turns away** (the session's reading; confirmed by the owner in round 2, pick 16, in the
wording shown there):
a saturated block of colour in the interface; glow, and type that is a gradient; a dependency or a
mechanism that changes nothing the eye sees; crowding; an effect that draws the eye to itself.

**Where the draft language guessed wrong.** It guessed a quiet hover and flat cards: the owner chose
lift (a clear 5 under the pointer, a leaning 4 at rest). It guessed a control "is either round or a
pill": a rounded rectangle is fine (a leaning, 2). It guessed right on square prints and on brass as
the one accent; "chrome never brings its own colour" was right in substance and too strong in its
"never", since colour may come on hover.

**What round 1 opened, for round 2** (how much, not which): the radius of a card and of a control;
how far a card lifts and grows, and its shadow; how slowly words arrive, and whether they overshoot;
which ornament, and where it may stand; what colour a tag takes when hovered.

**Read against the table** (the design lead, 2026-10-01). The table is the record; the eight lines
above are a reading of it. Where the reading goes further than a score or a note:

- **A 2 or a 4 is a leaning.** Pairs 2, 11 and 13 are written above as settled ("not a hard square",
  "a card lifts off the page", "words arrive from below"). In the principles they are leanings.
- **"The site is not minimal"** (line 5) is the session's, and it crosses the owner's own word: "Dark
  editorial boutique: premium, minimal, classy, informative". What pairs 15 and 16 show is narrower:
  a brass ornament beats a hairline between two passages, and few things beat many.
- **"Colour belongs to the photographs"** (line 1) is wider than the notes. The owner's words are
  about blocks: "Crowded saturated colour blocks", "pure-colour block". Film hues as ticks and dots,
  the sun's gold and a colour under the pointer all stand. Pair 6 drew gradient type and a glow, not
  a block.
- **Pair 6 reads "White, brass eyebrow".** The pair set the house beside something loud. It does not
  re-ink the eyebrow, which is built in the second ink.
- **Pair 10 chose glass over a solid plate.** Both options laid a plate on a cover. "No opaque
  plates, chips or panels over the image" stands; the pair did not ask whether a cover takes a plate.
- **Pair 7 was a 3.** The note gives each face a purpose; it does not say a voyage's title turns
  italic. Playfair Display bold for titles (2026-09-25) stands.
- **What the B's carried that their titles did not name.** Pair 12's lift ran 0.34 s with an
  overshoot; pair 13's arrival overshot too. The owner's cover hover is one second, and the
  principles say "never bouncy". A 5 for "lifts and grows" is not a 5 for the time or the curve.
- **Pair 12 and the voyage cover.** The owner said "no hover lift" of the full-width cover on
  2026-09-26. The pair drew a small card. Which holds for the cover is asked, not read.
- **Already built.** Content arrives by rising 12 px over half a second (`reveal-on-scroll`), between
  pair 13's two drawings. The voyage card on `master` lifts and grows today. (Corrected the same
  day: this line also said a voyage card's tags take their colour under the pointer. The rule is in
  `_sass/_archive.scss`, and no card emits a tag: it is dead.)

## What it led to

- The owner's lines: [`PRINCIPLES.md`](../PRINCIPLES.md), "The eye (2026-10-01, from the pairs)":
  round 1 with each pair, score and note; round 2 with each pick, what it was chosen from, and the
  note; then where a line meets an earlier call, settled or not.
- The amounts as a scale to build from: [decisions/0009](../decisions/0009-how-much.md), which
  amends 0002 and lists what the picks did not settle.
- [`DESIGN-LANGUAGE.md`](../DESIGN-LANGUAGE.md): it opens with the test, "What the eye turns away",
  which is the owner's (pick 16); every "waits for round 2" is replaced by its amount. Whether the
  page now reads true is Q11.
- What may be built, tier 2, answered: stages [2](../stages/02-foundations-plumbing.md) (the scales,
  the `card`, the `tag`, the ornament, the arrival), [3](../stages/03-wayfinding.md) (the book's
  words, drafted for the owner), [4](../stages/04-voyage-and-cards.md) (the still cover; Home's
  cards), [6](../stages/06-posts-and-about.md) (article pictures, the ornament, a post's tags) and
  [10](../stages/10-tags.md) (the colour off the tags).
