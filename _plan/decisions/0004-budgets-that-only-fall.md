# 0004 · Budgets that only fall

**Status:** Accepted 2026-10-01 under delegation. Writing the checker is tier 0. The numbers are
set from a measured baseline when it is written, not from this page.
**Answers:** A06, A07, S01, S05, S07 in the [2026-10-01 audit](../findings/2026-10-01-ui-audit.md).

## Context

The daily tech-debt run finds little, because the debt here is not broken code. It is weight and
duplication that grow a little with every photograph and every session: a data file that is linear
in the archive, a page that ships a placeholder twice, a new radius. Nothing fails, so nothing
flags.

The one kind of rule that has held across many sessions in this repo is the ratchet: a number that
may fall and may not rise (`check-important-ratchet.py`). This record extends that shape to weight.

## Decision

A checker, `scripts/check-budgets.mjs`, run by `scripts/gate.sh --full` against the built site. It
measures, compares with a committed baseline, and fails on a rise beyond a small tolerance. A fall
rewrites the baseline.

| Budget | Measured on 2026-10-01 | Direction |
|---|---|---|
| `main.css`, raw | 288 KB | Falls with 0003 |
| Image bytes at load, Posts archive at phone width | 9.1 MB | S01 brings it under 1 MB |
| Largest single image request on an index page | 1.26 MB (Home's Palette plate) | Under 500 KB |
| Photobook HTML per frame | about 10.7 KB (London: 386 KB, 36 frames) | S05 roughly halves it |
| `colour-atlas.json`, raw | 465 KB at 633 photographs | Per photograph, not total |
| `frames.json`, raw | 586 KB | Per photograph |
| `lunr-store.js`, raw | 221 KB | Leaves every page with S03 |
| External scripts on the Voyage index | 17 | Falls with 0003 step 4 |
| Vocabulary counts (0002) | radii 36, curves 8, blurs 12, focus recipes 12 | Fall only |

Budgets that grow with the archive are kept **per photograph or per post**, so adding a voyage
never fails the gate but adding weight per frame does.

## What this is not

Not a performance score. Paint timings and frame rates vary with the machine and are not gated. If
one of those matters, it is measured by hand, in a visible browser, and written into the stage.

## Scale ceilings to decide

Today's largest book is 36 frames. Four parts of the Photobook stop working somewhere past a few
hundred (A06: the lightbox rail, the Hours stack, a vat per frame in the colophon, the sheet's
view-transition names). Either a book has a designed ceiling, or these four are fixed before the
first large book. That choice is in the queue.

## Consequences

- The gate gets slower by one script. It reads files already built.
- A real feature that needs more weight raises its budget in the same change, in the open, with the
  reason. That is the conversation the budget exists to cause.
