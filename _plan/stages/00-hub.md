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
      merges it once it has seen that it holds only the plan (asking first until 2026-10-02).
- [x] The daily run's first run, 2026-10-02, with the owner approving its commands: it recorded Q11,
      filed F050 to F053 and left `hub/daily` local because `master` held an unpushed commit. It asked
      for dozens of approvals, so its mechanical steps became one script (`scripts/hub-daily.sh`),
      pre-approved by one line in `.claude/settings.json` on the owner's word. It no longer republishes
      the command centre (F054).
- [x] A tap on the command centre tells Claude (the owner, 2026-10-02: "there's no automatic cloud
      response… I have to tell you manually"). The page leaves a comment addressed to Claude inside
      the tap, at most once in twenty seconds, ids and letters only; a session watching the page wakes,
      records and replies in the thread (`/hub`). With no session watching, the daily run records.
      Proved against a stand-in for the runtime, then for real on 2026-10-03: the owner tapped Q13
      at 08:18, and Q14 to Q19 in the next three minutes; each was recorded and answered in the
      thread within a minute. Two sessions watching the page both replied; one stopped watching.
- [x] The daily run made fully automatic (the owner, 2026-10-02: "IT SHOULD BE FULLY AUTOMATIC"). Its
      first scheduled run, 07:34 that day, sat for two hours on a shell command of its own making in
      the debt hunt, waiting for an approval; and its finish would have thrown the day away because
      another session was at work in the owner's checkout. Built the same day, with tests: recording
      the store is a program (`plan.mjs sync`, from a dump; every id and letter checked against the
      plan, nothing written twice, nothing stored printed back, a change of mind named and not
      written); the debt hunt is a program (`plan.mjs debt`); the finish writes its own commit line
      and report, and says that the owner's checkout changed without refusing for it; the copy of
      `hub-daily.sh` that runs is `master`'s whatever branch the checkout is on; and `/hub` merges
      `hub/daily` without asking once `only-plan master --of hub/daily` passes. The box is ticked
      when a scheduled run has ended with nobody approving anything. A first try the same morning
      stopped at the store's dump: saved into the repository's folder it waited for an approval, so
      the dump goes to the run's own scratch folder. The next try (11:14) ended by
      itself in a minute and a half; the first run the schedule itself started (2026-10-03, 07:34)
      ended by itself too, with the new finish and its report. Not yet seen in a real run: an answer that
      is new (the taps of 2026-10-03 were all recorded by an open session first).
- [ ] The daily run built on GitHub's `master` (2026-10-03). It read the local `master`, which moves
      only when someone pulls it: the owner now works branch, pull request, merge on GitHub, so a
      call asked since (Q13 to Q19 that day) was not in the plan it read, and an answer to it would
      have been skipped. Now the run fetches and builds on `origin/master`; the copy of the script
      that runs is GitHub's (the local `master`'s while GitHub's predates the hand-over); a branch
      that carried an older local `master` starts again from GitHub's with the run's own commits; an
      answer to a call not yet merged stays in the store and is named, and a later run records it; a
      session takes only the run's own commits (`/hub`, by cherry-pick), and a commit so taken is
      counted as here. With tests. The box is ticked when a run built on GitHub's `master` has ended
      by itself.
- [ ] A day brief (the owner, 2026-10-03: "a daily brief / one-page … to have a high-level understanding
      of what was performed in today's automated workflows … with necessary visualisations"). One page,
      read and never typed (`scripts/hub-brief.mjs`): the day's runs, calls, commits by kind, pull
      requests, the gate on GitHub, how far each stage moved, what readers got, who moves next. The
      07:34 run builds it for the day before and republishes it at `brief` in `hub.json`; it keeps a
      log of its own runs for it (`.claude/worktrees/hub-runs.log`). The first, for 3 October, was
      made by hand the same evening. With tests. Its first publish from the run asks the owner once.
      Ticked when a run has built and published one.
- [x] The work run (the owner, 2026-10-04: "a daily job that looks through the ongoing tasks and then
      decide one that we haven't started and to start it in every day session … It should minimize
      my burden"; [0010](../decisions/0010-the-merge-is-the-yes.md)). Each morning after the upkeep,
      one unattended session takes the next request or roadmap task (`plan.mjs next`), claims it (a
      branch `work/<key>` on GitHub), does it in `.claude/worktrees/hub-work/` only, passes the full
      gate and the reviewer, and opens one pull request with its pictures (`scripts/hub-work.sh`,
      `/hub-work`). One open at a time; a task that needs the owner is held (`hold/<key>`) with its
      question, and the day brief shows both. Requests: `plan.mjs request`, in `_plan/requests.md`.
      With tests. Ticked when a scheduled work run has opened a pull request by itself: the first, on
      2026-10-04, held P10 with its question, stopped once on a failed build and started again clean,
      then took A02 and opened #103 (full gate passed, the reviewer passed it with notes), with nobody
      approving anything.
- [x] The daily run's agents (`"daily_agents"` in `hub.json`, off). An agent handed work starts in the
      owner's checkout, not the run's worktree; the reviewer blocked the run on it (2026-10-01). Until
      a hand-off has been shown to stay inside the worktree, the run records and files only, and raw
      ideas wait for the next session. Switch it on after a week of clean runs and one proven hand-off.
      Overtaken 2026-10-18: the work run has handed the reviewer its own folder's diff since #103, and
      the daily run folds into the one morning session ([0011](../decisions/0011-unseen-work-merges-itself.md)),
      whose agents work in that folder. The switch goes with the separate run.
- [x] CI's first run (`.github/workflows/gate.yml`): 2026-10-01, on the owner's first push of the hub
      (f4bd34f). The fast gate passed on GitHub (run 36925029918, 55 s), and Cloudflare Pages built and
      deployed the same commit: the sixteen fixes of stage 1's first batch are live.
- [ ] A cloud session starting from the hook: unproven until one does.

**From I002, which the lead advised parking (2026-10-01).** The owner's note on merging was shaped,
tried and challenged. These went ahead whatever the owner tapped; each is tier 0 unless it says
otherwise. On 2026-10-18 the owner pursued it: one class merges itself, below.

- [x] The class check, grown from `only-plan`: a short list of what could merge unread (a line added
      under "Waiting" in the inbox; a section the lead writes in a `raw` idea), by path and by line,
      failing closed, with tests. It merges nothing. The daily run says in its ten lines which each
      day's branch was. A script, so the session's. Overtaken 2026-10-18: the class is the unseen work
      pull request, judged at `hub-work.sh pr` ([0011](../decisions/0011-unseen-work-merges-itself.md), below).
- [x] After a month of runs: the count of days that held nothing but the list. I002 is read again
      with it. Overtaken 2026-10-18: the owner decided on the audit of all 29 scheduled runs instead.
- [ ] `.claude/settings.json`: the six deny patterns miss a bare `git push` made while on `master`,
      `git push origin HEAD`, a push to `x:master`, and any call that begins `/usr/bin/git`, which is
      the form the daily command tells the run to use. Read, not tried: trying one is a push. Close
      the gaps, and deny `gh pr merge` and an approving `gh pr review` to everything but
      `hub-work.sh` (since 2026-10-18 the run merges the unseen class through it, 0011). It only
      tightens, but it is the owner's permission file: the owner's word first.
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

**From [0011](../decisions/0011-unseen-work-merges-itself.md) (the owner, in chat, 2026-10-18; R012, R013;
[I002](../ideas/I002-rules-for-the-hub-to-approve-and-merge-a-pull-re.md),
[I003](../ideas/I003-in-the-daily-running-specifically-are-we.md)).** Each is tier 0 and tooling, so a
session's, never the work run's. Ticked when built with tests; the last three when seen in a real run.

- [x] Three open at once (R012, tier 0): `begin` starts nothing at three open work pull requests,
      pauses on one three days unmerged, and lists the files open ones touch; `gate`, `commit` and
      `pr` refuse an overlap outside `_plan/`. 2026-10-18, with tests.
- [x] The `unseen` label (R012, tier 0): `pr` puts it on only when every path, renames counted as
      the old path gone, is on the list of what may be unseen (the plan, the docs, the site's code), with
      no changelog line, no baseline, the gate passed on that tree and `--reviewer PASS` (plain PASS).
      2026-10-18, with tests (a served folder not named, a post moved into the docs, a robots file).
- [x] The owner's own files kept out of the class (R012, tier 0; the lead's working of 0011):
      `_plan/PRINCIPLES.md`, `_plan/DESIGN-LANGUAGE.md`, `_plan/decisions/`, `_plan/QUEUE.md` and
      `_plan/hub.json`, and an owner's line in an idea taken away or rewritten, mean no label.
      2026-10-18, with tests.
- [x] The merge (R012, tier 0): `begin` merges each `unseen` work pull request 24 hours old, its head
      the gated commit, no comment or review by QSDQSB, label on, mergeable, checks green and none
      running (`gh pr merge --merge --match-head-commit`), only while `work_may_merge` is on in GitHub's
      `master`'s `hub.json` and the fetch answered; the run's report names each, and it tells the owner by a notification the
      day one opens or merges (the lead's objection). 2026-10-18, with tests; the first real merge is
      still to be seen.
- [x] Cut-offs count awake time (R012, tier 0): a jump in the clock is a sleep and extends the limit;
      `wait` says when the Mac slept through a gate, and the run gates once more before hunting a
      fault. 2026-10-18, with a test.
- [x] A long `run` (R012, tier 0): `visual:diff` runs on into `wait` instead of being killed at nine
      minutes; `visual:capture --only` takes `--viewport` for a one-width change. 2026-10-18.
- [x] No second full gate for the plan (R012, tier 0): an edit only inside `_plan/` after a passing
      full gate, or a change that is the plan alone, needs only the fast gate at `pr`. 2026-10-18,
      with a test.
- [x] Words for the owner are a file (R012, tier 0): `NOTE.md`, written with the Write tool, for a
      hold, a finding or an idea; never a shell argument, so a `$` in it asks nobody for an approval.
      2026-10-18, with a test.
- [x] `begin` refuses to destroy a folder that holds a claim made in the last six hours (R012, tier
      0). 2026-10-18, with a test.
- [ ] The day brief marks an `unseen` pull request as merging itself (and when), and names what
      merged by the rule (R012, tier 0; the reviewer's note, 2026-10-18). Today it counts every open
      work pull request as one to merge, and is written before `begin` merges.
- [ ] One morning session (R012, tier 0): the upkeep (`hub-daily.sh`) first, then the task; the day
      brief published last, after the pull request. Written 2026-10-18 (`hub-work.md` step 0; the task
      renamed "morning run"); ticked when a morning has done it by itself and the separate daily task is
      switched off. The morning task needs ArtifactData, Artifact and PushNotification allowed first, or
      its first use of each waits for an approval.
- [ ] Sunday is scout day (R013, tier 0): `begin` says so; `scout`, `finding` and `idea` are built
      (2026-10-18, with tests). The run reads the shots against "What the eye turns away" and
      `PRINCIPLES.md`, files small faults as findings, raises lead ideas only while fewer than two
      wait, has them shaped and challenged, and opens a plan-only pull request. Ticked when a Sunday
      run has done it by itself.
- [ ] Two weeks of clean runs after these land (I003, tier 0): counted, and the owner asked whether a
      morning takes more than one task.
