# 0009 · How much: the owner's amounts

**Status:** Accepted 2026-10-01, on the owner's picks of that day (round 2 of
[the pairs](../studies/2026-10-01-the-qsd-aesthetic.md), sixteen picks). The amounts are the owner's.
Where the owner gave a range and this record names one value inside it, or names a thing the picks
did not draw, the line says **the lead's**: those are tier 1 under [0001](0001-who-decides-what.md),
shown before and after, and the owner can reverse them.
**Amends:** [0002](0002-one-control-vocabulary.md), "The scales". 0002's pieces, inks, layers and
guard stand as written.

## Context

0002 gave the site scales for radius, duration, curve and glass under delegation, before the owner
had been asked how much of anything. It had no scale for a shadow, no ornament and no arrival. Round
1 of the pairs said which (a card lifts, a tag is ink, a brass ornament). Round 2 drew each thing at
two to four strengths and the owner picked one. This record is those picks as numbers a session can
build from, each traced to its pick ("pick 4" is round 2, question 4; the picks and the owner's notes
are in [`PRINCIPLES.md`](../PRINCIPLES.md), The eye, round 2).

What is established is not re-measured. The owner, of the whole exercise: "Most of the design
aesthetics we established should be inherited. Let's focus on the ambiguous part." So the amounts
bind what is drawn anew and what the older pages are brought to. They do not, on this record's say,
re-shape the Photobook's built pieces (see "Not settled").

## Decision

### Corners

| Step | Value | For | From |
|---|---|---|---|
| `none` | 0 | A print | Pair 1, score 1 |
| `hair` | 3 px | As 0002 | Not asked |
| `picture` | 8 px | A picture inside an article | Pick 7 (B, of square, 8 and 16 px). New step |
| `soft` | 10 px | A control. A card. A panel of glass (0002) | Pick 2 (B, "A rounded rectangle, soft: 10 px", over one of 4 px and over "A pill, and a round tool"). Pick 1 (B, of 4, 10 and 18 px) |
| `large` | 18 px | A card, where the scenario wants it | Pick 1, the note: "B or C depend on the scenario". C is 18 px. New step |
| `pill`, `round` | 999 px, 50% | Dots and circles (a tag's dot, a vat, an avatar) | Not a control's shape: the Photobook's pill and round tool took `soft` on 2026-10-03 (Q17, B). Nothing new is drawn as a pill: the lead's reading of pick 2 |

0002's `card` step (16 px) goes: a card takes `soft`, or `large`.

**"The scenario", the lead's reading.** A card's corner is 10 px. It is 18 px where the card is
itself the scene: as wide as its column or the largest thing on its screen, with a photograph edge
to edge. Home's feature card and the wide voyage cover on a desktop are the two built today (16 px,
and a clamp that reaches 18 px). In doubt, 10 px. The first 18 px on a surface that has not had it
is shown to the owner.

### A card: its shadow and its lift

0002 had no scale for a shadow. This is it. One layer each; no glow (pair 11: "doesnt have to glow").

| | Value | From |
|---|---|---|
| At rest | `box-shadow: 0 6px 18px rgba(0, 0, 0, 0.45)`, and no border | Pick 3 (B, "Just off it: a short shadow"), as drawn |
| Under the pointer, the owner's range | Up 3 to 6 px; grown to between 1.012 and 1.025 | Pick 4 (A: 3 px, 1.012), the note: "Between A and B". B is 6 px, 1.025 |
| Under the pointer, one value | `transform: translateY(-4px) scale(1.018)` | **The lead's**, inside the range |
| Its shadow, lifted | `0 14px 32px rgba(0, 0, 0, 0.5)` | **The lead's**, between the two drawn (A `0 10px 24px` at 0.45; B `0 18px 40px` at 0.6) |
| How long | 0.3 s, transform and shadow together | Pick 5 (A, of 0.3 s, 0.6 s and one second as built) |
| The curve | `$cubic-bezier-standard`, `cubic-bezier(0.4, 0, 0.2, 1)`: the curve the picks were drawn on | Pick 12 (A, "It arrives and stops") |

The card moves as one object: its photograph does not zoom, shift or filter inside the frame
("The photograph itself never animates on hover"). Keyboard focus lifts it as the pointer does.
Stillness (**the lead's**): under `prefers-reduced-motion` and `html.motion-off` there is no
transition and no transform; the shadow alone answers.

The built stacks of six shadows (`_sass/_archive.scss:176`, `_sass/_home.scss:677`,
`_sass/_page.scss:83`) and the tokens `$box-shadow-fancy`, `$shadow-soft` and `$shadow-floating`
are what this replaces on a card. A shadow under glass, a sheet or a tooltip was not asked and stays
as built; it gets a step here on its second use.

### The wide cover

**Nothing.** Under the pointer the wide cover of a voyage does not rise, grow, deepen its shadow,
change its shape, or brighten or filter its photograph. Pick 13 (A: "Nothing moves, nothing
changes", over "The picture brightens; nothing moves" and "It lifts, as a small card does"). The
call of 2026-09-26, "no hover lift", stands.

The wide cover is the `card` of `_sass/_archive.scss` drawn the width of its column (3.5 to 1 from a
tablet up).

### Nothing springs

No curve goes past its end and comes back. Pick 12 (A, "It arrives and stops", over "It goes a
little past, and settles back"). "Never bouncy" stands. A `cubic-bezier` with a point above 1 or
below 0 is counted by the ratchet with the literal curves. One built thing springs and is left
alone, the bubbles on Home (see "Not settled").

### How words arrive

| | Value | From |
|---|---|---|
| How long | 0.7 s | Pick 6 (B), as drawn |
| From how far | 28 px below, and from nothing to full | As drawn |
| The curve | The rise on `cubic-bezier(0.22, 1, 0.36, 1)`, which is `$cubic-bezier-smooth` already; the fade on the standard curve | As drawn |
| In turn | Each line 0.12 s after the one before | As drawn (three lines: 0, 0.12, 0.24 s) |
| How many take turns | The first four lines that arrive together; a fifth and later arrive with the fourth | **The lead's**: the owner's note in round 1 was "Prefer B, but do not overdesign" |

It is one mechanism, and it exists: `reveal-on-scroll` (`_sass/_scroll-animations.scss`,
`assets/js/scroll-animations.js`), today 12 px over half a second, together. Stillness as built: the
words land and are never hidden.

### Durations and curves, as amended

| Step | Time | For | Change from 0002 |
|---|---|---|---|
| `fast` | 0.15 s | A control answering; a tag brightening | |
| `base` | 0.3 s | A control's hover and focus; **a card's lift** | The lift is new here (pick 5) |
| `slow` | 0.6 s | A print developing, a panel moving | |
| `arrive` | 0.7 s | Words arriving | New (pick 6) |
| `cover` | 1 s | What is left of the wide cover's hover: its words | Narrowed: no lift takes a second (picks 5 and 13). That the owner's deliberate second still times the words is **the lead's** reading |
| `scene` | 1.1 s and over | A room's light, an opening | |

Two curves, as 0002: standard and smooth; `$cubic-bezier-param` for `cover` only.

### Glass

| Depth | Value | For | From |
|---|---|---|---|
| `glass` | `blur(14px) saturate(1.2)`, over `rgba(21, 21, 21, 0.42)`, a hairline edge at 0.16 | The default: the glass anything new is made of | Pick 11 (B), as drawn. The blur is in code already (`dark-glass-fill`, `_sass/_mixins.scss`), under a darker tint (0.82) |
| `thin` | `blur(6px)`, over `rgba(21, 21, 21, 0.26)`, an edge at 0.14 | Equally the owner's. Which goes where is **the lead's**: thin on a small mark over a picture or over code, where it is built at 6 px today (the type badge on a cover, `_sass/_type-badge.scss:38`; the copy button, `_sass/_code-copy.scss:26`), because a mark that small does not need the picture behind it blurred away; `glass` everywhere else | Pick 11, the note: "A B Both OK". A is 6 px |
| `bar`, `panel` | 18 px at 140%; 24 px at 130% | The Photobook's pill, dial and specs; the masthead | Inherited as built; not drawn in round 2. See "Not settled" |

0002's `control` depth (12 px) folds into `glass`. The thick option (26 px, "the picture a blur of
colour") was shown and not picked: nothing new is thicker than 14 px. The pick drew a name on a
plate over a cover. An older panel of dense text (search at 25 and 30 px, the map's at 18 px) was
not drawn, and is not brought to 14 px on this pick: see "Not settled".

### The ornament

A lozenge on a rule (pick 8, A, over a star on a rule, three points and a short rule): a lozenge 14
px across, outlined at one pixel with a smaller filled lozenge inside, in brass; a one-pixel rule on
either side at about half strength, 12 px clear of it. As drawn. **The lead's:** it is built in the
site's brass (`$intriguing-word-color`, #c3b498, the brass the owner picked the link in); the pairs
page drew its brass a little warmer (#c9a86a).

It stands **only between passages of prose** (pick 9, A). Not under a title. Not between groups in
the interface. It does not replace the emblem rule, which is a signature.

### A tag

At rest: ink, one look for every tag, no fill (pair 4, score 5): the second ink, a one-pixel line
around it. Under the pointer it **only brightens** (pick 10, C, over "It turns brass" and "It takes
its own muted colour"): the words to the first ink, the line to the second. No colour, at rest or
hovered. **The lead's:** `fast` (drawn at 0.18 s), and corners of 10 px, as a control (the pick drew
it square).

## How this amends 0002

| 0002's scale | What moves | What is added |
|---|---|---|
| Radius | `card` 16 px goes; a card is `soft` 10 px | `picture` 8 px; `large` 18 px |
| Duration | `cover` narrows to the wide cover's words; `base` gains the card's lift | `arrive` 0.7 s |
| Curve | Nothing | The rule that none overshoots |
| Glass | `control` 12 px folds into `glass` 14 px | `glass` 14 px at 120%; `thin` 6 px |
| (none) | | A shadow scale: `rest`, `lifted` |
| Pieces | `card` gains its rest and its lift; `tag` its hover | The ornament; the arrival |

Depth (the six layers), the label, the inks and the guard are untouched.

## Who may build what

- **A pick answers the thing it drew.** A card, a tag, a line of words arriving, a picture in an
  article, a rule between passages, a wide cover. Carrying an amount to a different kind of thing
  (a panel of dense text to the glass drawn as a name on a cover; a table's corner to a card's) is
  the lead's sorting: it is shown to the owner first when the move is at or over the major-delta
  threshold, and is tier 1 below it.
- **A visible change that brings a surface to an amount in this record is tier 2, answered.** It is
  built without asking again. It still passes the full gate and the reviewer, and reaches the owner
  as pictures at both widths ([0008](0008-ready-and-done.md), Done, 6). A motion is shown as a short
  capture, since a still cannot show it.
- **A value marked the lead's is tier 1**: shown before and after, and the owner can reverse it.
- **What round 2 did not ask stands on 0002** and the owner's Fix marks, tier 1 under the
  major-delta threshold, as before.
- **The first appearance of a new piece** (the `card`, the `tag`, the text `button`, the ornament) is
  drawn in the catalogue with every state and shown before any page adopts it, as 0002 has it.

## Not settled

Places a pick meets something built or said that it did not draw. None is decided here. Each line
says what is done meanwhile; nothing the owner has not seen is taken as theirs.

- **The built pill and round tool.** Settled 2026-10-03: the owner brought them to the 10 px
  rectangle too (Q17, B), shown before and after first and approved as built ("OK for the change").
  As first written: pick 2 chose a rounded rectangle over "A pill, and a round tool"; the Photobook's
  way back was a pill and its viewer's tools round, kept as built until the owner said otherwise.
- **The Photobook's bar and panel of glass** (18 px, 24 px). The pick drew a name on a cover, not a
  panel of dense text over a print. Bringing them to 14 px is over the major-delta threshold. Shown
  on the specimen page first.
- **The search panel and the map's panel of glass** (25 and 30 px; 18 px). Panels of words, which
  the pick did not draw; 30 to 14 px is a move of more than half. Shown on the specimen page first.
- **Which corner is whose.** Sorting every radius in the code into print, picture, control, card and
  panel is the lead's judgement, with moves of up to half. The sorted list goes to the owner before
  any radius moves.
- **The words a wide cover shows under the pointer** (its line, its date, the reading time). Pick
  13's drawing had none. Read to the letter, "nothing changes" takes them away or sets them at rest.
  "Quiet by default: detail on hover or in hand" says they may come. Asked with the refined card
  ([stage 4](../stages/04-voyage-and-cards.md)).
- **"Of a voyage."** Pick 13 named a voyage's cover. The same piece carries a post and a portfolio
  entry. The lead's reading is one piece, one behaviour, which is also the simpler to build. Built
  so, as tier 1: it takes a lift off post cards the owner was not shown, so `/year-archive/` is in
  the report before and after, and the owner can say otherwise.
- **The corners and the shadow of the wide cover at rest.** Picks 1 and 3 drew a small card.
  The branch `gallery/voyage-doors` draws the cover square and without a shadow. Stage 4's choice.
- **The bubbles on Home** turn with a spring (`assets/js/qsd-bubbles.js:356`). They belong to a
  signature, so pick 12 is not applied to them unasked.
- **8 px beside 10 px.** A picture in an article is 8 px and a card 10 px, both the owner's. They are
  near. If one step fewer is wanted, the owner's own test ("choose the simpler one") points at 10 px.
  Not asked; 8 px is built.

## Consequences

- Stage 2's moves onto the scales no longer wait on an amount: C03, C04 and C05 split into what a
  pick answers, what stands on 0002, what is shown to the owner first, and what is inherited
  ([stage 2](../stages/02-foundations-plumbing.md)).
- The voyage card on `master` loses its lift where it is the wide cover; Home's cards keep theirs,
  smaller and quicker.
- Every post's words arrive more slowly than today. That is the pick, and it is the one to watch: a
  fast scroll must not leave a screen of words still on their way (the fault F049 names on Palette).
- The ratchet's baseline is counted after the scales are in, so it counts against this record.
- To revisit when the specimen page exists: the three inherited things above, seen beside the
  owner's amounts.
