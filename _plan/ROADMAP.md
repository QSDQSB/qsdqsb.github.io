# Roadmap

The stages in order. One line each; the detail is in the stage's file. Read
[`QUEUE.md`](QUEUE.md) next: it lists what is waiting on the owner.

Last reviewed: 2026-10-02.

| # | Stage | What a reader gets | Status | Mostly tier |
|---|---|---|---|---|
| 0 | [The hub](stages/00-hub.md) | Nothing yet: the plan, the lead and the gate | **done** 2026-10-01 | 0 |
| 1 | [Foundations: unseen fixes](stages/01-foundations-unseen.md) | A faster, steadier site that looks the same | building | 0 |
| 2 | [Foundations: plumbing](stages/02-foundations-plumbing.md) | One vocabulary for everything after; brass links, white headings, words that arrive in turn | building | 0, 1, some 2 (answered) |
| 3 | [Wayfinding](stages/03-wayfinding.md) | A site that is easy to get around and obvious to use | planned | 2 |
| 4 | [Voyage and the cards](stages/04-voyage-and-cards.md) | The doorway to the photographs, refurbished | designing (branch `gallery/voyage-doors`) | 2 |
| 5 | [Bestiary](stages/05-bestiary.md) | A page that exists; first, a holding page worth arriving at | idea (the holding page is decided, and comes as a choice) | 2 |
| 6 | [Posts and About](stages/06-posts-and-about.md) | Writing and the person, in the house's own language | idea | 2 |
| 7 | [Protecting the pictures](stages/07-protecting-the-pictures.md) | Nothing visible, if done well: a print is not saved by a right-click, a drag or a long press | planned (a trial first) | 2 |
| 8 | [A palette as an image](stages/08-palette-as-image.md) | A palette that can be shared | planned (a study first) | 2 |
| 9 | [Weight and scale](stages/09-weight-and-scale.md) | A site that stays fast as the archive grows | planned | 0 |
| 10 | [Tags, from scratch](stages/10-tags.md) | Tag pages worth using | idea | 2 |
| 11 | [The colour pages](stages/11-colour-pages.md) | Palette, Reverie and Drift, finished | planned | 0, 1, some 2 |

## Why this order

- **1 before everything.** It is tier 0, most of it is an hour a finding, and it removes the weight
  and the three daily irritations without waiting on anyone.
- **2 before any new page.** Stages 3 to 6 should take their controls from the vocabulary. Building
  them first would add a fifteenth button family.
- **3 beside 4.** Wayfinding decides how a reader reaches a voyage; the Voyage stage builds the
  door. They are designed together and built in that order.
- **5 after 4.** The Bestiary is the first page built only from the vocabulary, so it comes after
  one older page has been migrated and the vocabulary has been tested. Its holding page (the owner,
  2026-10-01) does not wait: it uses only pieces that are built, and moves up when the owner wants it.
- **2's visible moves no longer wait.** The owner settled the design language's ambiguous part by
  eye on 2026-10-01: round 1 said which, round 2 said how much
  ([0009](decisions/0009-how-much.md)). A move onto one of those amounts is tier 2, answered: built
  without asking again, through the full gate and the reviewer, and shown as pictures at both
  widths. A pick answers the thing it drew: an amount carried to a surface the owner did not see
  (a panel of words, a corner sorted by the lead) is shown to them first. The language is version 1 (the owner, Q11, 2026-10-01).
- **The scale and the pieces first, then the surfaces.** Stage 2 writes the scales and the `card`,
  the `tag`, the ornament and the arrival once. Then, each waiting only on its piece: the still
  cover and Home's cards (4), article pictures, the ornament and a post's tags (6), the colour off
  the tag pages (10; the colours file itself is kept until the owner says). The book's words in its
  empty rooms and ways on (3) wait on no piece: the lead drafts, the owner keeps or strikes.
- **7 and 8 are small and independent**, and now touch: 7 keeps a print from being saved by a
  gesture, 8 hands a reader an image that may hold a voyage's cover. Each is tried before the owner
  is asked anything more, and they are tried together before 8's control ships.
- **10 waits on 2 and 3.** It needs the `tag` piece (ink, and only brightening under the pointer:
  the owner, 2026-10-01), and the wayfinding walk decides what tags are for. Taking the colour off
  today's tags waits on 2 alone.
- **11 is small and can run beside 1.** Its faults are marked Fix; only its taste calls wait on the owner.
- **9 runs in the background.** Its budgets start with stage 1; its larger changes wait for 2.

## Recently done

- 2026-10-01 · Stage 0. `_plan/`, the design lead, the site reviewer, `scripts/gate.sh`,
  `scripts/check-journeys.mjs`. The [audit](findings/2026-10-01-ui-audit.md) of 73 findings, marked by
  the owner the same day. The [design language](DESIGN-LANGUAGE.md) (version 0), the
  [workflows](WORKFLOWS.md), the idea workshop, studies, `scripts/plan.mjs`, CI, and the hub's own
  architecture ([0007](decisions/0007-the-hub-architecture.md)), and the two bars a thing passes
  before it reaches the owner ([0008](decisions/0008-ready-and-done.md)).
- 2026-10-01 · Stage 1, first batch: sixteen findings fixed, through the gate and the reviewer
  (two passes: the first was blocked on three faults). Live the same day, on the owner's push.
- 2026-10-02 · Stage 1, second batch: twenty-one findings fixed or closed (search loads on demand, a
  voyage's page a third lighter, the lightbox on a slow line, Home's weight and its doors, the map, what a
  screen reader hears, two phone fixes), through the gate and the reviewer (two passes: the first was
  blocked on three faults the gate could not see, now each held by a journey). Six tasks remain, each
  waiting on the owner or on a design job. On the branch `stage/1-second-batch`; not pushed.
- 2026-10-01 · The owner answered six calls and one idea on the command centre. The tiers stand as
  written (Q2). The design language is not yet theirs and is to be talked through (Q3). Bestiary gets
  a designed holding page and keeps its place (Q5). Protecting the pictures means casual saving (Q6).
  Links in text are brass with a hairline underline (Q9). The daily run is on and may push a branch
  that touches only the plan (Q10). A palette as an image is pursued, for readers, and a photograph
  may be on it (I001). The owner's note on merging is kept as
  [I002](ideas/I002-rules-for-the-hub-to-approve-and-merge-a-pull-re.md): shaped, tried and
  challenged the same day, and returned with the lead's advice to park it. Its useful part is stage
  0 work.
- 2026-10-01 · The owner scored round 1 of the aesthetic pairs
  ([the study](studies/2026-10-01-the-qsd-aesthetic.md)). The lines are in
  [`PRINCIPLES.md`](PRINCIPLES.md) as "The eye", and the [design language](DESIGN-LANGUAGE.md) now
  opens with the test they make: what the eye turns away. Where the draft had guessed flat cards and
  a quiet hover, the owner chose lift. Stages 2, 4, 5, 6 and 10 carry what follows.
- 2026-10-01 · The owner picked round 2 of the pairs, sixteen times: the amounts. They are in
  [`PRINCIPLES.md`](PRINCIPLES.md) under "The eye", and as a scale to build from in
  [0009](decisions/0009-how-much.md), which amends 0002. Five places where round 1 met an earlier
  call are settled: nothing springs, the wide cover is still, a voyage's title stays Playfair bold,
  the book may speak in its empty rooms and ways on, a tag takes no colour. "What the eye turns
  away" is the owner's test. Stages 2, 3, 4, 6 and 10 carry the tasks; Q11 asks whether the
  [design language](DESIGN-LANGUAGE.md) now reads true.
