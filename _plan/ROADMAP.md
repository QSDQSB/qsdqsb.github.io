# Roadmap

The stages in order. One line each; the detail is in the stage's file. Read
[`QUEUE.md`](QUEUE.md) next: it lists what is waiting on the owner.

Last reviewed: 2026-10-01.

| # | Stage | What a reader gets | Status | Mostly tier |
|---|---|---|---|---|
| 0 | [The hub](stages/00-hub.md) | Nothing yet: the plan, the lead and the gate | **done** 2026-10-01 | 0 |
| 1 | [Foundations: unseen fixes](stages/01-foundations-unseen.md) | A faster, steadier site that looks the same | planned | 0 |
| 2 | [Foundations: plumbing](stages/02-foundations-plumbing.md) | Nothing directly; one vocabulary for everything after | planned | 0, some 1 |
| 3 | [Wayfinding](stages/03-wayfinding.md) | A site that is easy to get around and obvious to use | planned | 2 |
| 4 | [Voyage and the cards](stages/04-voyage-and-cards.md) | The doorway to the photographs, refurbished | designing (branch `gallery/voyage-doors`) | 2 |
| 5 | [Bestiary](stages/05-bestiary.md) | A page that exists | idea | 2 |
| 6 | [Posts and About](stages/06-posts-and-about.md) | Writing and the person, in the house's own language | idea | 2 |
| 7 | [Protecting the pictures](stages/07-protecting-the-pictures.md) | Nothing visible, if done well | idea | 2 |
| 8 | [A palette as an image](stages/08-palette-as-image.md) | A palette that can be shared | idea | 2 |
| 9 | [Weight and scale](stages/09-weight-and-scale.md) | A site that stays fast as the archive grows | planned | 0 |

## Why this order

- **1 before everything.** It is tier 0, most of it is an hour a finding, and it removes the weight
  and the three daily irritations without waiting on anyone.
- **2 before any new page.** Stages 3 to 6 should take their controls from the vocabulary. Building
  them first would add a fifteenth button family.
- **3 beside 4.** Wayfinding decides how a reader reaches a voyage; the Voyage stage builds the
  door. They are designed together and built in that order.
- **5 after 4.** The Bestiary is the first page built only from the vocabulary, so it comes after
  one older page has been migrated and the vocabulary has been tested.
- **7 and 8 are small and independent.** They move up whenever the owner wants them.
- **9 runs in the background.** Its budgets start with stage 1; its larger changes wait for 2.

## Recently done

- 2026-10-01 · Stage 0. `_plan/`, the design lead, the site reviewer, `scripts/gate.sh`,
  `scripts/check-journeys.mjs`. The [audit](findings/2026-10-01-ui-audit.md) of 73 findings.
