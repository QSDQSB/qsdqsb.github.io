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
- [x] The daily run's first run, 2026-10-02, with the owner approving its commands: it recorded Q11,
      filed F050 to F053 and left `hub/daily` local because `master` held an unpushed commit. It asked
      for dozens of approvals, so its mechanical steps became one script (`scripts/hub-daily.sh`),
      pre-approved by one line in `.claude/settings.json` on the owner's word. It no longer republishes
      the command centre (F054).
- [x] A tap on the command centre tells Claude (the owner, 2026-10-02: "there's no automatic cloud
      response… I have to tell you manually"). The page leaves a comment addressed to Claude inside
      the tap, at most once in twenty seconds, ids and letters only; a session watching the page wakes,
      records and replies in the thread (`/hub`). With no session watching, the daily run records.
      Proved against a stand-in for the runtime; in the real viewer: the owner's first tap.
- [ ] The daily run's agents (`"daily_agents"` in `hub.json`, off). An agent handed work starts in the
      owner's checkout, not the run's worktree; the reviewer blocked the run on it (2026-10-01). Until
      a hand-off has been shown to stay inside the worktree, the run records and files only, and raw
      ideas wait for the next session. Switch it on after a week of clean runs and one proven hand-off.
- [x] CI's first run (`.github/workflows/gate.yml`): 2026-10-01, on the owner's first push of the hub
      (f4bd34f). The fast gate passed on GitHub (run 36925029918, 55 s), and Cloudflare Pages built and
      deployed the same commit: the sixteen fixes of stage 1's first batch are live.
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
- [x] The owner's, on GitHub (I002, question 1). 2026-10-01: on the owner's word a session set a
      workflow's token to read by default and stopped Actions approving pull requests. 2026-10-02: the
      owner asked "what if we let PR to auto approve?", heard the case against, and switched approval
      back on themselves. As it stands, and as the owner wants it kept: tokens read by default;
      Actions may approve pull requests. Auto-merge is still off and `master` names no required check,
      so nothing merges by itself.
- [x] F044 · The owner's (I002, question 3): an outside app, ecc-tools, can push a branch inside the
      repository and open a pull request from it. Number 87 is open and adds commands and skills
      under `.claude/`. It is not to be merged unread. The owner answered (2026-10-01): remove the app
      and close number 87 unmerged. Done on 2026-10-01: the owner removed the app, and number 87 was
      closed unmerged on their word.
- [x] F045 · [0006](../decisions/0006-the-hub-keeps-itself.md) says the repository is a GitHub fork.
      GitHub lists it as no fork. Noted on 0006's status line; the decision does not rest on it.
- [x] The command centre's own note on the daily run, out of date since Q10, is rewritten
      (`scripts/hub-page.mjs`).
