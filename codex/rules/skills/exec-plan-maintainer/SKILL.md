---
name: exec-plan-maintainer
description: Create and maintain a long-term project execution plan in `for_agents/` for multi-stage work with multiple milestones and checkpoints.
---

# Exec Plan Maintainer

## Use This Skill When
- The project is multi-stage and long-term.
- There are multiple checkpoints and multiple milestones to track.
- Work spans several sessions/PRs and needs continuity in one plan artifact.

## Do Not Use This Skill When
- The task is a small one-off fix or a short single-stage change.
- There are no meaningful milestones/checkpoints to manage.

## Canonical Artifact Location
- Store execution plans under `for_agents/`.
- Prefer one stable plan file per initiative and update it in place instead of creating duplicates.

## Required Plan Structure
1. `Context` (problem, goals, constraints)
2. `Scope` (in-scope, out-of-scope)
3. `Milestones` (named milestones with exit criteria)
4. `Checkpoints` (verification points within milestones)
5. `Execution Phases` (ordered steps and dependencies)
6. `Risks & Mitigations`
7. `Decision Log` (timestamped major decisions and rationale)
8. `Progress Ledger` (status per milestone/checkpoint: pending/in-progress/done)

## Workflow
1. Confirm the task qualifies as long-term multi-stage work with multiple milestones/checkpoints.
2. Create or select the canonical plan file in `for_agents/`.
3. Concretize milestones and checkpoints before implementation starts.
4. Update plan status after each meaningful implementation batch.
5. Keep plan and code changes aligned; if scope changes, update milestones/checkpoints and decision log.

## Output Expectations
- A maintained markdown execution plan in `for_agents/` that remains the source of truth for project progress.
- Clear milestone/checkpoint status transitions with concise evidence notes.
