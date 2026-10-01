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
- [x] The owner's two switches for the daily run (`/hub-daily`). Answered 2026-10-01, Q10, option A: on,
      daily, and it may push a branch that touches only the plan; never `master`, never a pull request.
- [ ] The daily run's first run. The schedule was made on 2026-10-01 and `_plan/hub.json` reads
      `"daily_may_push": true`; the first run is 2026-10-02. It still pushes nothing until the owner
      has pushed `master`: a branch cut from a `master` GitHub has not seen would carry the owner's
      unpushed work with it (`.claude/commands/hub-daily.md`, step 6). Proven when one run has left
      its branch, holding nothing but the plan.
- [x] "Touches only the plan" is a check: `node scripts/plan.mjs only-plan`, built 2026-10-01. The
      challenge to [I002](../ideas/I002-rules-for-the-hub-to-approve-and-merge-a-pull-re.md) found it
      wrong the same day (it passed a site file renamed into `_plan/`, a symlink, and a site commit
      followed by its revert), and the session mended it: every commit judged, renames off, ordinary
      files only.
- [x] The plan check stops on a `--since` it cannot find. It exited 0 when challenged; it exits 2 now.
- [x] The mended `only-plan` run against the reviewer's four cases by its own tests
      (`tests/plan-hub.test.js`: a site file, a rename into the plan, a link, a change and its
      revert, an untracked and a deleted site file, a linked `node_modules`). Run on 2026-10-01.
- [x] One branch carried forward. A branch a day, each cut from the same `master`, would repeat the
      day before's upkeep and give out the same ids. The daily run keeps one branch, `hub/daily`,
      and merges `master` into it each day (`.claude/commands/hub-daily.md`). No pull request and no
      setting. The plan check tells a session when that branch holds commits to merge, and `/hub`
      asks the owner first.
- [ ] The daily run's agents (`"daily_agents"` in `hub.json`, off). An agent handed work starts in the
      owner's checkout, not the run's worktree; the reviewer blocked the run on it (2026-10-01). Until
      a hand-off has been shown to stay inside the worktree, the run records and files only, and raw
      ideas wait for the next session. Switch it on after a week of clean runs and one proven hand-off.
- [ ] CI's first run (`.github/workflows/gate.yml`): at the first push. It has run only in a clean
      checkout on this Mac.
- [ ] A cloud session starting from the hook: unproven until one does.

**From I002, which the lead advises parking (2026-10-01).** The owner's note on merging was shaped,
tried and challenged. Nothing merges, opens or approves by itself. These go ahead whatever the owner
taps; each is tier 0 unless it says otherwise.

- [ ] The class check, grown from `only-plan`: a short list of what could merge unread (a line added
      under "Waiting" in the inbox; a section the lead writes in a `raw` idea), by path and by line,
      failing closed, with tests. It merges nothing. The daily run says in its ten lines which each
      day's branch was. A script, so the session's.
- [ ] After a month of runs: the count of days that held nothing but the list. I002 is read again
      with it.
- [ ] `.claude/settings.json`: the six deny patterns miss a bare `git push` made while on `master`,
      `git push origin HEAD`, a push to `x:master`, and any call that begins `/usr/bin/git`, which is
      the form the daily command tells the run to use. Read, not tried: trying one is a push. Close
      the gaps, and deny `gh pr merge` and an approving `gh pr review`. It only tightens, but it is
      the owner's permission file: the owner's word first.
- [ ] The owner's, on GitHub (I002, question 1): a workflow's token may write by default, and Actions
      may approve pull requests. Read on 2026-10-01. Worth tightening whatever becomes of I002.
- [ ] F044 · The owner's (I002, question 3): an outside app, ecc-tools, can push a branch inside the
      repository and open a pull request from it. Number 87 is open and adds commands and skills
      under `.claude/`. It is not to be merged unread.
- [x] F045 · [0006](../decisions/0006-the-hub-keeps-itself.md) says the repository is a GitHub fork.
      GitHub lists it as no fork. Noted on 0006's status line; the decision does not rest on it.
- [x] The command centre's own note on the daily run, out of date since Q10, is rewritten
      (`scripts/hub-page.mjs`).
