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
- `scripts/check-journeys.mjs`: reader routes walked in a real browser (`npm run check:journeys`).
- `scripts/plan.mjs`: the routine edits to the plan, in one shape (findings, ideas, queue, changelog).
- `scripts/hub-page.mjs`, `scripts/choice-page.mjs`: the owner's command centre, and a choice with its prototypes.
- The idea workshop (`ideas/README.md`, `/idea`), studies, the design language and the workflows.
- The two bars a thing passes before it reaches the owner: ready (explicit, weighed, argued both
  ways, tried, challenged, judged) and done ([0008](../decisions/0008-ready-and-done.md)). The site
  reviewer's second job, "Challenge a proposal".
- A08 · Plans and findings centralised here (the owner: "Centralise in the latest structure").
- Decisions [0001](../decisions/0001-who-decides-what.md) to
  [0008](../decisions/0008-ready-and-done.md).
- The [2026-10-01 audit](../findings/2026-10-01-ui-audit.md), 73 findings.

## Still owed

- [ ] `scripts/check-budgets.mjs` ([0004](../decisions/0004-budgets-that-only-fall.md)); built in stage 9.
- [ ] The vocabulary ratchet ([0002](../decisions/0002-one-control-vocabulary.md)); built in stage 2.
- [ ] The daily run switched on (`/hub-daily`), and whether it may push its `_plan/`-only branch: the
      owner's two switches, Q10 in the queue. No scheduled task exists on this Mac; the tech-debt run
      is configured elsewhere.
- [ ] CI's first run (`.github/workflows/gate.yml`): at the first push. It has run only in a clean
      checkout on this Mac.
- [ ] A cloud session starting from the hook: unproven until one does.
