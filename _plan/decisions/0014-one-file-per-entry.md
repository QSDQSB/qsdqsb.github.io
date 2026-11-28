# 0014 · One file per entry, so parallel branches do not collide

**Status:** Proposed 2026-11-28, the lead's, from the owner's words: "we should devise a structure such
that multiple working branches don't get merge conflicts on trivial things like changelog. Right now it's
very bothering productivity as it jeopardises parallelization." The first pull request is the owner's yes.

## Context

Of the twelve pull requests merged before 2026-11-28, ten touched `_plan/CHANGELOG.md`, nine
`_plan/FEATURES.md`, seven `tests/visual/baseline.json` and `scripts/check-journeys.mjs`, five
`_plan/findings/inbox.md`. Each is one file that every branch adds to, so any two branches conflict on it
however unrelated their work. Four parallel pull requests took several rounds of hand-resolution each, and a
force-pushed rebase overwrote another session's merge commit. Ids taken from a counter collided too (F123
handed out twice, R024 on two requests). `.gitattributes` marks the changelog `merge=union`, which spares
adjacent additions, not an edit of an existing line, and GitHub's own mergeability check does not run a
repository's merge drivers.

## Decision

A thing that a branch adds is a file of its own, in a folder; a thing that is a document is generated.

| Was | Now |
|---|---|
| `tests/visual/baseline.json` | `tests/visual/hashes/<shot>.sha`, one per picture |
| the `JOURNEYS` array in `scripts/check-journeys.mjs` | `tests/journeys/<id>.mjs`, one per journey |
| `_plan/CHANGELOG.md`, `FEATURES.md`, `findings/inbox.md`, `requests.md` | the second pull request: `_plan/changelog/`, `features/`, `findings/inbox/`, `requests/`, one file per entry; the four documents are rendered from them (`node scripts/plan.mjs render`) and not committed |
| a new finding's or request's number from a counter | `<date>-<slug>`; the numbered ones stay as they are |

Real conflicts (a stylesheet, a layout, a variable block) are not the target and stay.

## Working rules

Written in [`WORKFLOWS.md`](../WORKFLOWS.md), "Working in parallel".

## What it leaves

`_docs/components.md` rows (the next candidate), `QUEUE.md` and `hub.json` (one session writes them: the
one that talks to the command centre), and the counters of ideas (`I###`) and calls (`Q##`).
