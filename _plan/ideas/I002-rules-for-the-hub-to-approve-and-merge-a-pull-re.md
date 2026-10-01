# I002 · Rules for the hub to approve and merge a pull request

**Status:** shaped · **Raised:** 2026-10-01 by the owner · **Stage:** [0](../stages/00-hub.md), for the part that goes ahead

## In the owner's words

> Hub can decide PRs but we need carefully crafted rules for conditions for an auto PR approval merge to master

## Verdict

**Park.** Nothing merges, opens or approves by itself; the rules stay here as a draft. There is
nothing yet for it to merge: no change the plan has had would have qualified, and the owner already
merges about a pull request a day by hand. And on this repository as it is set, a check that merges
is weaker than the owner's tap. What is useful goes ahead in stage 0 with no pull request: one branch
carried forward, and a check that says each day what it would have merged. Bring it back when a month
of that shows upkeep worth the machinery, and the settings are tightened.

**Waits on:** the first push of `master` (GitHub has not seen the hub); a month of daily runs, each
sorted; the two settings in question 1.

## Made explicit

The sentence came as a note beside Q10, where the owner switched the daily run on and let it push a
branch that touches only the plan, "never master, never a pull request". The note loosens that last
clause, on a condition. Each word, every way it can honestly be read; the readings taken are the
lead's.

- **"Hub"**: the daily run, which works with nobody present; a session at a desk, working through
  the plan; a workflow on GitHub; or the command centre page. Taken: the daily run as the author of
  a change, and a workflow on GitHub as its judge. Not a session at a desk: the owner is there to be
  asked. Not the page: it cannot write to git, and [0007](../decisions/0007-the-hub-architecture.md)
  chose that on purpose.
- **"can decide"**: to merge; to approve; to hold; to ask for changes; to close; and, before any of
  those, to open. Taken: to merge or to hold. Never to close: closing discards work, and deleting is
  the owner's. To open is not in the words, and opening is a hard rule. It is not asked now: with the
  idea parked, nothing is opened.
- **"PRs"**: the daily run's own branch; any pull request of Claude's, a fix to the site among them;
  the tech-debt run's; a stranger's, since the repository is public; an app's. Taken: the daily
  run's own branch and nothing else. Asked, in question 2.
- **"carefully crafted rules for conditions"**: the leave is not given yet. It is promised against
  rules the owner has accepted. So the thing to write first is the rules, in a form a program
  applies, and nothing merges until they are the owner's.
- **"auto PR approval"**: a review marked Approved on GitHub; or the decision that a change may go
  in. Taken: the decision, made by checks. An approving review from the same automation that wrote
  the change is the author marking its own work
  ([0001](../decisions/0001-who-decides-what.md)); it would be a stamp, not evidence.
- **"merge to master"**: `master` is the live site. Cloudflare Pages builds and publishes each push
  to it. A merge nobody watched is a deploy nobody watched.

It is for the owner: time not spent merging what needs no judgement.

**The rules, as a draft.** Kept for the day the idea comes back. None has been run on GitHub. The
challenge found the first draft wrong in eight of its nine; this is the second.

Before any rule, on GitHub, by the owner: a workflow's token reads by default; Actions may not
approve a pull request; whoever else can push a branch inside the repository is known and wanted
(F044); and `master` names its required check, and either binds admins or the owner accepts that
every session on this Mac holds an admin's token.

1. **Only what is on the list merges unread**, and the list is short: a line added under "Waiting"
   in `findings/inbox.md`; a section the lead writes in an idea that is still `raw`. Everything else
   in `_plan/` waits for the owner, the stage files, the roadmap, the features, the architecture, the
   changelog and the whole queue among them. A task line is a work order, and an edit to an open
   question's option changes what a stored tap means. Ordinary files only, no renames, and every
   commit judged, not only the last.
2. **Who sent it proves nothing.** A branch's name and an author's name can both be someone else's:
   pull request 87 is a third party's, from inside this repository, and every pull request from this
   Mac carries the owner's name. The rules judge what a change is. A fork: never.
3. **The evidence, each piece from a run the branch cannot touch.** The class check, from `master`'s
   copy, in a run that never executes the branch. The gate, which does execute it, in a run of its
   own with a token that only reads. A required check that a job of the same name in the branch
   cannot satisfy. A plan check that stops on a reference it cannot find.
4. **No agent merges or approves, and that is a setting**, not a promise in a command file.
   Switching auto-merge on for a pull request is itself an act of merging: it is the workflow's, from
   `master`'s copy, or the owner's.
5. **A doubt is a no.** A check that is missing, red or skipped means it waits. A job skipped by a
   condition reports success to a required check, so the judging job always runs and fails by its
   own exit.
6. **The switch** is a repository variable, set in GitHub's settings. Not `hub.json`: the run
   rewrites that file whole.
7. **Undoing it is the owner's.** The revert is a push to `master`. It is rehearsed once, from a
   local `master` that has moved on, before anything merges.
8. **The owner hears from GitHub**, by its own email for a merge. The command centre is built from a
   checkout that does not hold the merge, and cannot be the notice.
9. **The local `master` follows.** After a merge on GitHub the checkout on this Mac is behind, and no
   agent may move `master`. How it follows is not solved.
10. **The rules change by the owner's hand**, in a decision record. Never by a change that merged
    itself.

Its parts, each a thing that would have to exist: the rules as a decision record; the class check,
an allow-list that fails closed; a workflow that may merge; the settings; the switch.

It assumed that the daily run makes changes worth merging unattended; that "only the plan" means
"safe"; that GitHub's settings allow it; and that a green check in CI is evidence. The trial and the
challenge went against the first two. The plan holds the owner's standing calls and the answers that
let tier 2 work go ahead, and it is printed into every session as that session starts: it is every
later session's instructions.

It does not ask for a push straight to `master`, for anything a reader sees to merge unseen, for
anything that touches R2, or for the owner to stop deciding what the site is.

## Shapes it could take

1. **The rules written, and a check that reports. No pull request.** The daily run carries one
   branch, `hub/daily`, forward on this Mac, with `master` merged into it each day, so no day repeats
   the last. `only-plan` grows into the class check, and the run's ten lines say each day which it
   was: nothing but the list, or what on it waits for the owner. Nothing on GitHub changes. It is
   stage 0 work, tier 0. After a month there is a count.
2. **A pull request the owner merges with a tap.** The same branch, pushed, with a pull request
   opened for it and the check's word on it. A merged pull request is closed and its branch deleted
   here, so there is no standing one: a new pull request is opened after every merge, by someone. It
   takes the owner's leave to open them.
3. **Upkeep merges itself.** The ten rules, on GitHub. It takes the settings, a workflow that may
   write to `master`, and a decision record of the owner's that amends the hard rule. What it could
   merge is the short list in rule 1.

Unseen fixes to the site merging themselves is not a shape today: the full gate and the reviewer do
not run in CI (the last row of the trial).

The turn that makes it the house's own: the hub does not decide. A check decides, in a place the
author cannot reach. That is the gate's own rule, "the author never marks their own work", carried
one step further. The challenge showed how much has to be true on GitHub before such a place exists.

I would build 1. Shapes 2 and 3 are what is parked.

## What it changes

Weighed for shape 3, the largest still on the table, which is the one parked. Shape 1, which goes
ahead, touches the Scripts row and the daily command and nothing else. Shape 2 adds the pull request
and the owner's leave to open it. Each row is from the files and settings it names, read on
2026-10-01.

| Part of the site | Today | With this idea | Size |
|---|---|---|---|
| Pages and addresses | `_plan/` is not in the built site. `CLAUDE.md` is: it is served at `/CLAUDE/` (F043) | None from `_plan/`. A rule that let through a hub file outside the plan would change the live site | none |
| Shared pieces and styles | Untouched by the plan | None | none |
| Scripts | `check-plan.mjs` judges the plan's shape. `plan.mjs only-plan` refuses a branch that holds anything but the plan, commit by commit (built and mended on 2026-10-01) | The class check: an allow-list by path and by line, with tests. For shape 3 the daily command and `hub-page.mjs` change too | medium |
| Workflows on GitHub | `gate.yml` asks for `contents: read`. The two Claude workflows ask for read-only jobs, which limits GitHub's own token only: they act with the Claude app's token. `photos-process.yml` asks for nothing, and so gets a token that may write | The first workflow written in order to write to `master`. To judge from `master`'s copy it runs as `pull_request_target`: a run a pull request starts, holding secrets and a write token | large |
| The repository's settings | Read on 2026-10-01. A workflow's token may write by default. Actions may approve pull requests. `master` forbids force pushes and deletions, names no required check, asks for no review, does not bind admins. Auto-merge is off. A merged branch is deleted | Tokens read by default; Actions may not approve; a required check named on `master`; auto-merge on; a repository variable as the switch. All by the owner's hand. Binding admins changes how the owner pushes | large |
| `.claude/settings.json` | Six deny patterns for a push to `master`. They miss a bare `git push` made while on `master`, `git push origin HEAD`, a push to `x:master`, and any call that begins `/usr/bin/git`, which is how the daily command tells the run to call git. Nothing about `gh pr` | The gaps closed; `gh pr merge` and an approving `gh pr review` denied | small |
| The command centre and its store | The page is private to the owner. What is written in its store becomes lines under "Answered" and ideas in the owner's words, and the plan is printed into every session at its start | The rules hold only while the page stays private. Sharing it is a setting on claude.ai | medium |
| The checkout on this Mac | Sessions and the daily run read and cut from the local `master` | After a merge on GitHub the local `master` is behind, and no agent may move it. The owner's next pull merges plan files changed on both sides; only the changelog merges by union | medium |
| Data and the photo pipeline | A build of `master` runs `photos:fetch` and publishes whatever R2 holds at that hour | No R2 write. Each merge is one more production build that nobody watched | small |
| The build and its weight | One production build for each push to `master`; one preview build for each push to a pull request's branch | Nothing in bytes. Cloudflare's monthly allowance cannot be seen from here | small |
| The pictures and privacy | Untouched by the plan | None | none |
| The plan's own rules | `PRINCIPLES.md`, Hard rules: "Opening or merging a pull request; pushing." [0001](../decisions/0001-who-decides-what.md): always tier 2. `WORKFLOWS.md`: nothing is merged without the owner | A decision record of the owner's that amends the hard rule for one class; a dated line in `PRINCIPLES.md` | medium |
| Other stages and open calls | [Stage 0](../stages/00-hub.md) owes the first push of `master`, CI's first run on GitHub and the daily run's first run | It waits on all three, and on a month of runs. Nothing waits on it | medium |
| Upkeep | The plan check runs in the gate and in CI | A short allow-list seldom goes stale. A setting on GitHub can drift with nobody seeing: the daily run would read the settings again each month | medium |

## Can it be delivered

What must be true, the riskiest first. Tried on 2026-10-01 by the session, reading git, the built
site and GitHub's settings (`gh api`, read only). Nothing was pushed and no pull request was opened,
so every row that needs one is open, and says how it will be tried. Rows were corrected on the second
pass where the challenge found them wrong; the lead read the settings again, and the session reads
them once more before this is returned.

| What must be true | How it was tried | Result |
|---|---|---|
| There is something for it to merge | The three commits that touch `_plan/`, sorted by path, by the lead and again by the session: 4ef9339 has 52 files, 22 outside the plan and 9 of the owner's voice; 5591d91 33, 29 and 0; 1c8a4ae 46, 19 and 9. Pull requests merged since 1 September, counted by the reviewer (23) and again by the lead (22): every one merged by the owner | failed so far: no change to the plan would have merged itself, and any day the owner answers writes under "Answered". The owner merges about one pull request a day by hand already. A month of daily branches, each sorted, is what could change this |
| A program can tell, from the diff alone, what may merge unread | The same sort, and the reviewer's cases against it | proved by path only, and a path is not enough: the owner's voice is found only where it is filed. An edit to an open question's option changes what a stored tap means, and a stage file can quote the owner. Open for the allow-list by line, which is not written |
| No agent can merge or approve | Read by the reviewer and again by the lead: `gh api repos/QSDQSB/qsdqsb.github.io/actions/permissions/workflow`, the protection on `master`, and the deny list in `.claude/settings.json` | failed today: tokens write by default, Actions may approve, admins are not bound, and every session here holds the owner's admin token. The deny list misses four forms of a push to `master`. Those were read, not tried: trying one is a push |
| The judge cannot be changed by the branch it judges | Not tried: it needs a scratch branch that weakens the check, pushed and opened as a pull request | open: tried on GitHub once the hub is pushed. A `pull_request` run takes its workflow from the branch; `pull_request_target` takes it from the base, and hands secrets and a write token to a run a pull request started. Also to try: a job of the same name in the branch must not satisfy a required check |
| A required check can block a merge to `master`, and GitHub's auto-merge waits for it | Read by the session and again by the lead: `gh api repos/QSDQSB/qsdqsb.github.io/branches/master/protection` and the repository's flags | open: `master` is protected today (no force pushes, no deletions, status checks strict) but names no required check, asks for no review and does not bind admins; auto-merge is off. Documented and not tried: a job skipped by a condition counts as passed |
| The plan check and `only-plan` fail closed | The reviewer: `check-plan --since nosuchref` exited 0, and `only-plan` passed a site file renamed into `_plan/`, a symlink, and a site commit followed by its revert, and judged the wrong tree when called by an absolute path. The session mended both the same day. The lead ran the first again (it now exits 2) and read the second | failed when challenged. Mended, and its tests run on 2026-10-01 (`tests/plan-hub.test.js`: the four cases, an untracked and a deleted site file, a base it cannot read, the wrong checkout). A second challenge of the mend is the reviewer's |
| A merge that touches only `_plan/` cannot change a page a reader gets | The built site read by a script: no `_plan/` folder in it, and none of its 197 text files names the plan | proved for `_plan/`. Not so for the hub's other files: `CLAUDE.md` is served at qsdqsb.com/CLAUDE/ today (F043), so a change to it is a change to the live site |
| The checks run at all where the merge happens | Read: `gh run list` and the workflows on GitHub: Claude Code Review, Claude Code, the photo processing and Pages. `gate.yml` is not there: the hub is three commits that have not been pushed | open: after the first push, a pull request opened the way the daily run would open it. One opened with a workflow's own token starts no checks |
| The owner can stop it with one switch that no merged change can flip | Not tried | open: a repository variable the workflow reads, set in GitHub's settings. Not `hub.json`: the run rewrites that file whole |
| A merge can be undone, and it is clear by whom | Not tried | open: the revert is a push to `master`, which is the owner's by the hard rule, from a local `master` that has moved on. To be rehearsed. Cloudflare's rollback is beside the point: `_plan/` is not built |
| The owner hears of a merge | Read: the command centre is built from the local checkout (`scripts/hub-page.mjs`) | failed as first drafted: the page would not hold the merge. Open for GitHub's own email on a merged pull request, which was not tried |
| The local `master` follows a merge made on GitHub | Read: the daily command cuts from the local `master` and may not touch it; `.gitattributes` gives a union merge to the changelog alone | open: no way is known that keeps an agent's hands off `master` |
| Only the owner can write what the plan takes as the owner's words | The session's fact, not checked by the lead: the command centre is a private Artifact, readable by the owner alone, and its store is written through the page | open: true while the page is not shared. Sharing it is a setting on claude.ai |
| Every `gh` call is aimed at this repository | Read: every `gh` call in the commands, the agents, the scripts and the workflows | proved by reading: none is left unpinned (one commented example in `claude.yml`). The scheduled run's prompt forbids `gh` for anything but reading. GitHub does not list the repository as a fork (F045); `gh` strays because the clone keeps an `upstream` remote |
| The daily run does what its command says: a branch that holds nothing but the plan | Cannot be tried today: its first run is 2026-10-02, 07:34 | open: a month of runs, each sorted by the check, is the trial |
| A merge made by a workflow is itself gated | Not tried | open: a push made with a workflow's own token starts no other workflow, so `gate.yml` would not run on the merge commit; the next daily run would be the first check of `master` |
| For site code only: the full gate and the site reviewer run where the author is not | Read by the lead: `gate.yml` says why they do not (private manifests, Ruby); the baselines were captured on this Mac; `claude-code-review.yml` returns no verdict a check can read | failed today, by reading: this is what keeps site code out |

## Does it fit

| Against | Verdict | Why |
|---|---|---|
| Hard rules | Conflicts | "These are never anyone's call but the owner's, each time." Among them: "Opening or merging a pull request; pushing." The idea is the owner proposing to change this line, on a condition. Until the rules are theirs, the line stands |
| Who decides ([0001](../decisions/0001-who-decides-what.md)) | Conflicts | "Always tier 2": "merging or opening a pull request, pushing". And "the author never marks their own work": a run that writes a change and then merges it is exactly that. Turned: a check the author cannot reach is the judge, and no agent merges |
| How the owner likes to be asked | Fits | "The owner decides, hears and brainstorms; Claude verifies." Merging a sorted inbox is not a decision |
| An unanswered call | Strains | `CLAUDE.md`: "An unanswered call is never a yes." A merge nobody read that writes a line under "Answered" makes the plan say yes. So everything in the owner's voice waits for the owner |
| The hub's architecture ([0007](../decisions/0007-the-hub-architecture.md)) | Strains | It turned down a page that writes to the repository: "not worth an immediacy nobody has asked for". A workflow's token is not narrow here, since it may write by default, and this would be the first workflow written in order to write to `master` with nobody present |
| Ready and done ([0008](../decisions/0008-ready-and-done.md)) | Fits for the plan; conflicts for site code | Done is "the fast gate for the rest", and CI runs the fast gate. For `_sass/`, `_layouts/`, `_includes/` and `assets/js/` it is `npm run gate:full` and the reviewer, and neither runs in CI |
| A check that cries wolf | Fits, once turned | `CLAUDE.md`: "minimise false positives, accept false negatives". Here a missed case is a wrong merge, so the rule fails closed. A short allow-list does that without nagging: what is not on it simply waits, as it does today |
| The design language | Fits | Nothing a reader sees: no pattern, no piece, no signature |
| What was tried | Bears on it | No study. Two things that happened: three pull requests opened unasked, after which the owner asked on 2026-09-24 for one large pull request and none opened without their word (from a session's notes; not yet a line in `PRINCIPLES.md`). And six commits whose Cloudflare build failed while every local check passed (PR #80): a green check is not a site that builds |

**Fits if turned**: only what is on a short list; judged by a check the author cannot reach and
merged by GitHub, never by an agent; and the hard rule amended in the owner's own words first. The
turn fits the principles and leaves little to merge. As said, with no class named, it conflicts with
the hard rule on merging.

## For and against

**For**

- Merging upkeep is a chore, not a decision: the kind of time the owner asked to have back.
- A cloud session would start from a plan that is current. None has yet started from the hook.
- Shaping it turned "touches only the plan" into a program, and the challenge found that program
  wrong four ways before it guarded a single push.
- The settings it would need tightened are worth tightening anyway, and it is how they were found.
- The rules cost nothing to keep, and a month of sorted branches will say what there is to merge.

**Against**

- There is nothing for it to merge. No change to the plan so far qualifies, a day the owner answers
  waits for the owner anyway, and the owner already merges about a pull request a day by hand.
- The plan is every later session's instructions. A merge nobody read can make it say yes, or say
  anything.
- On this repository as it is set, a check that merges is weaker than the owner's tap: tokens write
  by default, Actions may approve, admins are not bound, and an outside app opens pull requests from
  inside it.
- It does not end the branch a day. GitHub's `master` moves and the one on this Mac does not; the
  owner's next pull merges plan files by hand.
- On the day it is wrong the hub does not tell the owner, and the undoing is the owner's: a revert is
  a push to `master`.

## Challenged

By: the site reviewer, 2026-10-01.

Eleven claims checked: six held, five did not. The lead read the settings again with `gh`, pinned to
this repository, before answering. The reviewer's own verdict was Park.

- **Stands:** what it would merge does not exist, and what does would wait for the owner anyway. The
  lead's count agrees: 22 pull requests merged since 1 September, each by the owner. The saving is
  one tap on a day the owner did nothing.
- **Changed:** on that objection the verdict is now Park. What would bring it back is the reviewer's
  own test: a month of daily branches, each sorted by a check that only reports.
- **Changed:** it does not cure the branch a day. That line is struck from For. The cure is one
  branch carried forward on this Mac, with no pull request and no setting: shape 1, and stage 0.
- **Stands:** how the local `master` follows a merge made on GitHub, without an agent touching
  `master`. The lead has no answer. It is rule 9, marked not solved, and a condition of return.
- **Changed:** "only the plan" is not "safe", and the owner's voice cannot be told by path. Rule 1 is
  now a list of what may merge, in place of a list of what may not. It leaves out the stage files, the
  roadmap, the features, the architecture, the changelog and the whole queue, and asks for ordinary
  files, no renames and every commit judged.
- **Stands:** the list that is safe is thin: a finding filed, and an idea's first pass. And the
  store that feeds the owner's words into the plan is private only while the page is not shared.
- **Stands:** a check that merges is weaker than the owner's tap, on this repository as it is set.
  Judging from `master`'s copy means a run that a pull request starts, holding a write token.
- **Changed:** the settings come before the rules, and are question 1, to be tightened whatever is
  decided. The outside app is question 3 and F044.
- **Changed:** rule 7 now says the revert is the owner's push and is rehearsed first; rule 8 names
  GitHub's own email as the notice, since the command centre cannot hold the merge.
- **Stands:** each merge is a production build nobody watched, which publishes whatever R2 holds at
  that hour.
- **Changed:** "not visible from here" was wrong of the Actions settings. They are read, and in the
  table: tokens write by default, Actions may approve.
- **Changed:** "none may write to the repository" was wrong. A job's permissions limit GitHub's own
  token; the two Claude workflows act with an app's token, and `photos-process.yml` gets a write
  token by default. The row is rewritten.
- **Stands:** whether a comment naming `@claude` can push to the repository today. The app's rights
  could not be listed, by the reviewer or by the lead.
- **Changed:** "every session is already denied a push to `master`" was wrong and is struck from
  For. The deny list misses four forms, one of them the form the daily command itself uses. It is in
  the table, and a task in stage 0.
- **Changed:** "one standing pull request" asked leave for less than the mechanics need: a merged
  pull request is closed and its branch deleted here. Shape 2 now says a new one after every merge,
  and the question that asked leave to open it is withdrawn with the shape.
- **Changed:** "`only-plan` now refuses a branch that touches anything else" was untrue when
  challenged: it passed a renamed site file, a symlink, and a commit with its revert. The row says
  so, and says it is open until the mended script's tests have run.
- **Changed:** rule 2 proved nothing and now says so: pull request 87 is an outside app's, from a
  branch inside this repository, and every pull request from this Mac carries the owner's name.
- **Changed:** rule 3: the plan check failed open and has been mended; the class check and the gate
  cannot share a run, because the gate executes the branch; a job of the same name is to be tried.
- **Changed:** rule 4 is a setting, not a thing a program in the repository decides, and switching
  auto-merge on is itself merging. Rule 5 now covers a skipped job. Rule 6 is a repository variable
  only.
- **Answered:** rule 9 of the first draft, that the rules change only by the owner, holds if the
  evidence does. It is rule 10 now, unchanged.

## Questions for the owner

### 1 · Tighten two settings on GitHub now, whatever becomes of this idea?

- **A (recommended):** Yes: a workflow's token reads by default, and Actions may not approve pull requests.
- **B:** Leave them as they are.

Why: today every workflow here is handed a token that may write, and Actions may approve; no workflow in the repository is written to need either.

### 2 · Which pull requests did you mean?

- **A (recommended):** Only the daily run's own branch, which holds nothing but the plan.
- **B:** Those, and Claude's unseen fixes to the site.
- **C:** Any pull request that passes the rules, whoever opened it.

Why: it decides what the month of sorting counts, and a fix to the site cannot be proved unseen anywhere but on the machine that made it.

### 3 · An outside app, ecc-tools, can open pull requests from inside this repository: does it stay?

- **A (recommended):** Remove it, and close its pull request 87 unmerged.
- **B:** Keep it; its pull requests wait for me like any other.

Why: number 87 adds commands and skills under `.claude/`, which every session here would then follow; nothing of the app's is in the repository today.

## Next

Nothing for the idea itself. In [stage 0](../stages/00-hub.md), whatever is tapped: one branch carried forward, and the check that sorts each day's branch, said in the daily run's ten lines. This file is read again after a month of runs (the first is 2026-10-02), with the count.
