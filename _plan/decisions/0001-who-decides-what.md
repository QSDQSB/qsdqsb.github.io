# 0001 · Who decides what, and the gate

**Status:** In force from 2026-10-01, on the owner's instruction ("Claude should save my time
without jeopardising the site quality we deliver"). The tier boundaries are Claude's proposal; the
owner amends them here.
**Supersedes:** nothing. It adds to `CLAUDE.md` (Decision Confidence, Responsive Policy, the SCSS
major-delta rule), and loosens none of them.

## Context

Every call has gone to the owner, including ones with a single sensible answer. That costs the
owner time and makes sessions stop mid-task. The opposite failure is worse: a session deciding a
visible or structural matter alone, differently from the last session. The site needs most calls
made without the owner, and the few that are theirs to arrive short, batched and ready.

## Decision

Three tiers. A change's tier is set by its **most visible part**.

| Tier | What | Who decides | Who checks | The owner |
|---|---|---|---|---|
| **0 · Unseen** | No reader sees a difference: speed, correctness, accessibility that changes nothing at rest, dead code, refactors, tooling, docs. Pixel diff clean. | Claude | Reviewer, full gate | Hears of it in the stage's summary |
| **1 · In line** | Visible, but only to bring something into line with an accepted decision or a shared piece, and under the major-delta threshold (below 20% relative and below 0.25rem). Bug fixes whose correct look is not in doubt. | Claude | Reviewer, full gate, before-and-after shots | Sees the shots in the digest; can reverse |
| **2 · The owner's** | Anything else a reader sees or that changes what the site is. | Owner | Reviewer first, so the owner only sees work that already passes | Decides, from the queue |

**Always tier 2**, whatever the size:

- A new look, a new component, a new page, or a change to a signature (the hero, the dial, the
  lightbox, the sun diagram, the opening, the monogram).
- Navigation, page structure, addresses, what is on Home.
- Words a reader reads: copy, labels, the voice.
- Any visual difference between desktop and phone (`CLAUDE.md`, Responsive Policy).
- A replacement at or over the major-delta threshold.
- Anything in `PRINCIPLES.md`, or that contradicts a standing call there.
- Writes to R2, removals from R2, merging or opening a pull request, pushing, deleting content.
- A material choice Claude is under about 90% sure of (`CLAUDE.md`, Decision Confidence).

## The gate

Nothing is presented to the owner as done until:

1. `bash scripts/gate.sh --full` passes (static checks, seeded build, pixel diff, motion audit,
   reader journeys, iPhone overflow). `--fast` is enough only for changes outside `_sass/`,
   `_layouts/`, `_includes/` and `assets/js/`.
2. The **site reviewer** has returned `PASS` or `PASS WITH NOTES`. It is a separate agent that
   cannot edit files, so the author never marks their own work.
3. The stage file and the findings are updated.

A `BLOCK` goes back to the author, not to the owner. The reviewer blocks a tier 2 change that is
not approved in the queue even when the work is good: it is not the reviewer's call either.

## The queue

Tier 2 calls go to [`QUEUE.md`](../QUEUE.md), not into the middle of a task.

- Each entry: the question in one line, the options, a recommendation, what it unblocks, and a
  picture where one helps.
- An unanswered entry never becomes a yes. Work carries on with everything that does not need it.
- The design lead keeps it to about seven open entries. More than that means the calls are too
  small or the batching is wrong.

## Consequences

- Sessions stop less. Most of stages 1 and 2 in the roadmap is tier 0.
- The owner's attention goes to what the site is, not to whether a radius is 9 or 10 px.
- The reviewer becomes load-bearing. If the gate is weak, tier 0 and 1 changes ship unchecked, so
  the gate is itself reviewed: a regression that got through adds a journey or a check
  (`scripts/check-journeys.mjs`), every time.
- Honest limit: the reviewer runs in Chromium and in Playwright's WebKit. It does not hold a real
  iPhone. Tier 1 changes to layout say so in the digest.
