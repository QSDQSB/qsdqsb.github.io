# Stage 0 · The hub

**Status:** done 2026-10-01 · **Tier:** 0

## Goal

One plan every session follows, a lead that keeps it, and a gate nothing passes without. The owner
stops being the only reviewer.

## What was built

- `_plan/`: roadmap, queue, principles, decisions, stages, findings, ideas.
- `.claude/agents/design-lead.md`: keeps the plan, writes stage briefs, runs choices as prototypes.
- `.claude/agents/site-reviewer.md`: the gate. Read-only, so the author never marks their own work.
- `.claude/agents/prototyper.md`: builds one option of a choice, in its own worktree.
- `scripts/gate.sh`: every mechanical check in one pass (`npm run gate`, `npm run gate:full`).
- `scripts/check-journeys.mjs`: ten reader routes walked in a real browser (`npm run check:journeys`).
- Decisions [0001](../decisions/0001-who-decides-what.md) to
  [0005](../decisions/0005-choices-arrive-as-prototypes.md).
- The [2026-10-01 audit](../findings/2026-10-01-ui-audit.md), 73 findings.

## Still owed

- [ ] `scripts/check-budgets.mjs` ([0004](../decisions/0004-budgets-that-only-fall.md)); built in stage 9.
- [ ] The vocabulary ratchet ([0002](../decisions/0002-one-control-vocabulary.md)); built in stage 2.
- [ ] Point the daily tech-debt run at `findings/inbox.md`, so it files what it finds instead of
      standing alone. The run is configured outside this repo; the owner's to change.
