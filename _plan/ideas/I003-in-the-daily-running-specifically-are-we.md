# I003 · A run that clears the list, started by Claude

**Status:** raw · **Raised:** 2026-10-02 by the owner · **Stage:** none yet

## In the owner's words

> In the daily running specifically. Are we kind of clearing the pending queues for the to-do list stored in this plan? Or are we trying to locate something new? What's the target output of each daily job? If it's finding the new stuff, how do we clear the pending queue clearly? Are we using a new session to do that? Shouldn't Claude have the ability to submit a new session that generates that?

## Verdict

## Made explicit

The words hold four questions and one proposal. The questions have answers in the files. They come
first, because the owner asked them.

**What the daily run does today** (`.claude/commands/hub-daily.md`, `scripts/hub-daily.sh`, as merged
on 2026-10-02):

- **It clears nothing.** Its own procedure says so: "It does not work the plan down: no fault is
  fixed, no idea shaped, no task ticked. That is a session's work (and idea I003's)."
- **It looks for one narrow kind of new thing:** a stylesheet or a script that nothing loads
  (`plan.mjs debt`). It also runs the plan check and the fast gate on `master`, and says if they fail.
- **Its output** is the plan brought up to date with the owner's taps: answers, decisions and new
  ideas from the command centre, recorded by a program (`plan.mjs sync`), as one commit on the
  branch `hub/daily` that touches only `_plan/`. It pushes that branch when the owner's switch is on
  and `master` holds nothing GitHub has not seen; today `master` holds 8 such commits, so it stays
  local. Then a report of under ten lines, in the scheduled task's own history. The next session
  merges the branch without asking (`/hub`). It no longer republishes the command centre (F054).
- **It is a new session.** A scheduled task on this Mac starts a fresh session each morning. It is
  the only session Claude starts by itself today.
- **Who clears the list:** a session the owner opens. Today's was stage 1's second batch: twenty-one
  findings fixed, `gate:full`, the reviewer twice (the first pass blocked on three faults), thirteen
  commits on `stage/1-second-batch`, not pushed.
- **The run that did look for new things** is another one: the "daily tech-debt run" that
  [0004](../decisions/0004-budgets-that-only-fall.md) and the audit say "finds little". GitHub holds
  nine `tech-debt/` branches from it, the newest 2026-08-28, none merged. Nothing in this repository
  starts it or records it (F074).

**The proposal, every way it can honestly be read.** The readings taken are the lead's.

- **"the daily running"**: the hub's daily run; the old tech-debt run; any run with nobody present.
  Taken: any run with nobody present, since the owner is asking what such a run should be for. The
  hub's daily run, as it stands, is what it would be built from.
- **"the pending queues for the to-do list stored in this plan"**: `QUEUE.md`, the owner's calls; the
  open tasks in the stage files (107 in stages 1 to 11); the findings inbox (36 waiting); raw ideas
  (this one). Taken: the stage tasks, with the inbox and raw ideas beside them as work that touches
  only the plan. Not `QUEUE.md`: only the owner clears it, and the daily run already records the
  taps that do.
- **"clearing"**: a task is cleared when it is built to the done bar
  ([0008](../decisions/0008-ready-and-done.md): `gate:full`, the reviewer, a journey, a changelog
  line); a finding when it is sorted into a stage; an idea when it is shaped, tried and challenged.
  Taken: building tasks to the done bar. Sorting and shaping follow if the hand-off to an agent is
  proven (below).
- **"locate something new"**: an audit, a debt hunt, the gate on `master`. Taken as the contrast the
  owner draws. There is no shortage of things found (107 open tasks, 36 in the inbox): what is short
  is clearing.
- **"the target output of each daily job"**: a report; the plan updated; a branch; a pull request.
  Taken: what the owner is handed each morning that they can act on.
- **"a new session"**: the daily run itself, new each day; a second scheduled run; a cloud session;
  an agent handed work inside a run.
- **"Claude … submit a new session"**: Claude starts sessions on its own judgement; a schedule starts
  them; the owner's tap starts them. Taken: a schedule, or the owner's tap. A session that starts
  others as it judges multiplies tokens and branches with nobody counting either. Shape 3 is that
  reading, kept so it can be weighed.
- **"that generates that"**: the clearing, not more findings.

**Who it is for.** The owner: work moves between their sessions, and they are left the decision and
the push. Readers, only as fixes arrive sooner.

**Its parts**, each a thing that would have to exist:

1. A list a program can read: which open tasks need nobody (tier 0; no call open in the queue; no
   design job; no real phone), and which are already done on a branch not yet on `master`.
2. A run that builds: started by a schedule, in a worktree of its own, on one branch carried
   forward, every mechanical step a script, as the daily run's are.
3. Its proof: `gate:full` in that worktree, beside whatever the owner is building, with the pixel diff
   unchanged. That is [0001](../decisions/0001-who-decides-what.md)'s own definition of tier 0:
   "No reader sees a difference … Pixel diff clean."
4. Its second reader: the site reviewer, handed the worktree and not the owner's checkout.
5. Its permissions: edits and builds with nobody approving, and still no push to `master`, no write
   to R2, no pull request.
6. Its end: a branch, gated and reviewed; a line on the command centre; the push left to the owner.

**What it assumes that may not be true.**

- That there is work that needs nobody. Stage 1 has none left: its six open tasks wait on the owner,
  a design job or a real iPhone. Stages 2 and 9 hold tier 0 tasks, but stage 2's are a foundation
  laid in an order (A01 before the pieces).
- That a run can tell what is done. On `master`, stage 1 shows 30 open tasks; on the branch that
  built them, 6. A run cut from `master` today would take up 24 finished tasks.
- That a run with nobody present can build. The daily run was made fully automatic by shrinking it to
  a handful of lines allowed beforehand. Building is the opposite: edits, and commands chosen as it
  goes.
- That a branch handed over is work delivered. Nine branches made by a run sit unmerged; today's
  batch is unpushed; `master` here is 8 commits ahead of GitHub. The scarce step may be the push, not
  the start.
- That the cost is worth it: about ten minutes of `gate:full` a run on this Mac, twice when the
  reviewer blocks, and tokens every day, for changes no reader sees.

**What it does not ask for.** Merging, or opening a pull request
([I002](I002-rules-for-the-hub-to-approve-and-merge-a-pull-re.md), parked). A push to `master`.
Anything a reader sees anew, built unasked. A write to R2. More findings.

## Shapes it could take

1. **Answer, and hand over the list.** No new session. A program (`plan.mjs next`) lists the tasks
   that need nobody, stage by stage, and the ones finished on a branch not yet on `master`. The daily
   run's report and the command centre say each morning what is ready: "Stage 2: A01, A05, A09 need
   nobody." The owner starts `/stage` when they wish. It needs the task lines to carry their tier
   and what they wait on (F076). Small to medium. It is the first half of shape 2.
2. **A work run on this Mac, for unseen fixes.** A second scheduled task, after the daily run, built
   like it: a script (`scripts/hub-work.sh`: begin, gate, finish) does every mechanical step; a
   worktree of its own; one branch, `work/next`, carried forward with `master` merged in each day. It
   takes the next tasks shape 1 lists, tier 0 only, from a stage no other branch is building. It runs
   `gate:full` in the worktree; a change that moves any pixel baseline is backed out and left for a
   session with the owner near. It hands the reviewer the worktree. It commits, and never pushes. The
   owner is handed one branch, gated and reviewed, and a line on the command centre: "work/next: four
   fixes, gated and reviewed." The push is the owner's, by a tap if they want it so (question 2),
   carried out by the next session. Medium to large.
3. **Claude starts sessions as it judges.** Any session, or a tap, starts others: a cloud session for
   a batch, or a one-off scheduled task, several at once. Large. A cloud session's work exists only
   once it is pushed, and the full gate cannot run there: "Not here: the seeded build, the pixel diff,
   the reader journeys and the iPhone check … They need the photo manifests, which are private, and
   Ruby" (`.github/workflows/gate.yml`).

**The turn that makes it the house's own.** The site's own instrument decides what may be built with
nobody there: tier 0 is "Pixel diff clean", and the run takes only what keeps it clean. Whatever a
reader would see waits for a session with the owner near. And the step where finished work has been
waiting, the push, becomes one tap.

The lead would build 1 now and 2 once its trials pass. 3 conflicts (below).

## What it changes

Weighed for shape 2, the largest still in play: shape 3 fails the fit check on the hard rule and the
done bar. Shape 1 touches only the Scripts, Stage files and Command centre rows, each smaller. Shape 3
would add a cloud session that pushes each branch, and no `gate:full`. Every row is from the files it
names, read on 2026-10-03.

| Part of the site | Today | With this idea | Size |
|---|---|---|---|
| Pages and addresses | `_plan/` is not built. A tier 0 change moves no page at rest | Nothing from the run itself. What it builds reaches readers after the owner's push and merge | none |
| Shared pieces and styles | `_components.scss`; the vocabulary ratchet still owed (stage 2) | No new piece. The run would take stage 2's unseen tasks (A01, the import order; A05, the dead CSS) as a session would | none |
| Scripts | `scripts/hub-daily.sh` (begin, plan, check, page, finish, abort); `plan.mjs` sync, debt, only-plan, all with tests in `tests/plan-hub.test.js` | A picker (`plan.mjs next`) that reads the task lines, the roadmap and the unmerged branches; a work script (`scripts/hub-work.sh`); a check that no baseline moved, as `only-plan` is for the plan. Each with tests | large |
| The gate | `gate.sh --full` builds into the tree's own `_site/`; the iPhone check serves it on port 4173, fixed; the journeys and the pixel diff take a free port | Two full gates at once (the owner's session and the run) meet on 4173: it takes a free port, as the others do. The pixel diff's blind spots become the run's: below about 16,700 px (F030), a coarse pointer (F063), phone shots that differ run to run (F002) | small |
| Agents | The reviewer's first commands are `git status` and `git diff HEAD`, in its working directory: the owner's checkout. `daily_agents` is `false` for that reason ([stage 0](../stages/00-hub.md)). The prototyper builds in a worktree when a session hands it one | The reviewer told the worktree's path, and judging it there, with every command it runs already allowed. Shown before the switch | medium |
| `.claude/settings.json` | Allows `npm run *`, `git commit *`, `git push *` (any branch) and `bash scripts/hub-daily.sh *`. Denies six forms of a push to `master`, which miss four (stage 0). `npm run photos:push`, a write to R2, runs unasked (F073) | Allows `bash scripts/hub-work.sh *`. The four gaps closed and the R2 commands denied first. Edits by a scheduled session need a permission mode set on the task, or approvals stored on it: which, is the trial's first row. The owner's file: their word first | medium |
| The scheduled tasks on this Mac | One, `house-of-wonders-hub-daily`: a prompt outside the repository that reads `master`'s copy of the procedure | A second, its prompt reading `master`'s copy of its own procedure | small |
| `_plan/hub.json` | `daily_may_push: true`, `daily_agents: false` | A switch for the work run, off until the owner turns it on. The run never pushes, whatever `daily_may_push` says | small |
| Stage files and the roadmap | 107 open tasks in stages 1 to 11; 3 name a tier on the line (F076); what a task waits on is prose; a stage's branch is named in prose ("On the branch `stage/1-second-batch`; not pushed") | Each task line carries its tier and what it waits on, in a shape the picker reads. A stage being built names its branch in its roadmap row, and the run takes nothing from a stage another branch is building | medium |
| The command centre | Built and published by a session; the daily run no longer republishes it (F054) | A line on what the work branch holds; the push, if the owner wants a tap for it, as a call | small |
| Data and the photo pipeline | A worktree's build uses the manifests copied from the owner's checkout (`scripts/prototype-setup.sh`), which stops if that checkout has not fetched | The same. No write to R2. A run whose checkout has not fetched stops and says so | none |
| The build and its weight | One build at a time per tree. No bytes change from the run's machinery | A second tree building on this Mac each day; tokens daily for a building session and the reviewer | medium |
| The pictures and privacy | Untouched | Untouched: tier 0 only, no R2 | none |
| Other stages and open calls | Stage 0 owes: a scheduled run ending with nobody approving; `daily_agents` after a week of clean runs and one proven hand-off; the deny gaps. I002 parked. Q13 and Q14 open | Waits on all three stage 0 items. Q13 and Q14 untouched. Stage 1 holds nothing for it; stages 2 and 9 do. I002 stays parked: nothing merges | medium |
| Upkeep | The daily run's tests; stage 0's lines | Tests for the picker and the work script. A branch carried forward that can meet the owner's own branches in the same files. A branch the owner must push, or it piles up as the tech-debt branches did | medium |

## Can it be delivered

What must be true, the riskiest first. Rows marked "lead's trial" read only plan files and git, and
were run by the lead on 2026-10-03; the session runs them again. Nothing else has been run.

| What must be true | How it was tried | Result |
|---|---|---|
| A session started by a schedule can edit site files, build and run `gate:full` with nobody approving, and still cannot push `master` or write to R2 | Not tried. To try: a throwaway scheduled task, run once (`run_scheduled_task`), in a scratch worktree: edit a comment in one partial, run the gate, then try `npm run photos:push -- --dry-run` and `git push origin HEAD:master --dry-run`. Read its events (`list_events`): a last line "(called …)" for minutes is a wait; a denied command must be refused, not run | open |
| The reviewer, handed a worktree by a run, reviews that tree and not the owner's checkout, and none of its commands waits | Read: the reviewer opens with `git status` and `git diff HEAD` where it stands; the allow list holds `git diff *`, not `git -C <path> diff`. To try: plant a known fault in a scratch worktree only, hand the reviewer its path from a scheduled run, and see whether it names the fault and whether any command waits | open |
| A whole run stays inside its worktree (build, `gate:full`, journeys, the iPhone check) beside a gate in the owner's checkout, and leaves that checkout as it was | Read: `prototype-setup.sh` links the packages and copies the fetched data; `gate.sh` serves the iPhone check on 4173, fixed. To try: two `gate:full` at once, one in a scratch worktree, with `git status` and `master`'s hash taken before and after | open; by reading, the two meet on port 4173 |
| A run can tell what is already done on a branch not yet on `master` | Lead's trial: stage 1's file on `master` against `stage/1-second-batch`: 30 open tasks against 6; 13 commits not on `master` | failed as things stand: a run cut from `master` today would take up 24 finished tasks. Open for the rule in "What it changes" (a building stage names its branch) |
| There is work that needs nobody, and a program can find it | Lead's trial: every open task line in stages 1 to 11 read for a tier: 107 open, 3 name one. Stage 1's six open tasks each wait on the owner, a design job or a real iPhone | failed as the files stand: no program can list them (F076), and stage 1 holds none. By reading, stages 2 and 9 hold candidates (A01, A05, A09, the ratchet, `check-budgets.mjs`). Run again once the lines carry tiers |
| "Unseen" can be told by a program: the pixel diff stays clean on an unseen change and moves on a seen one, and is quiet enough to trust with nobody there | Not run. To try: A01 in a scratch worktree, `visual:build` and `visual:diff` twice; then the same with one radius moved by a pixel | open. Its known holes: F030, F063, F002 |
| Claude can start a session by itself on this Mac, from inside a run, with nobody approving | Read: the daily run is a scheduled task's session; the scheduled-tasks tool can make and run a task. Not tried from inside an unattended session | open: from a scheduled run, make a one-off task that only reports, and see it fire |
| A branch handed over becomes work delivered | Lead's trial (git): nine `tech-debt/` branches on GitHub, none merged, the newest 2026-08-28; this batch's 13 commits unpushed; local `master` 8 ahead of GitHub as last fetched | open: a month of the run's branches, counted. A tap to push (question 2) is how it would be helped |
| For shape 3: a cloud session can meet the done bar | Read by the lead: `.github/workflows/gate.yml`, "Not here: the seeded build, the pixel diff, the reader journeys and the iPhone check … They need the photo manifests, which are private, and Ruby" | failed, by reading. The session reads it again |
| A run's cost is bearable | Not measured. `gate:full` takes about ten minutes a run on this Mac (sessions' own timing, 2026-10-02) | open: the first runs timed, and their tokens counted |

## Does it fit

| Against | Verdict | Why |
|---|---|---|
| Hard rules, on pushing | Fits for shapes 1 and 2; conflicts for 3 | "Opening or merging a pull request; pushing" are "never anyone's call but the owner's, each time". Shape 2 never pushes, and a tap per push is the owner's each time. A cloud session's work exists only once it is pushed |
| Hard rules, on R2 | Strains | "Writes to R2, and removals from it" are the owner's. Today `npm run *` lets `photos:push` run unasked (F073). A run that chooses its own commands needs it denied first |
| Who decides ([0001](../decisions/0001-who-decides-what.md)) | Fits, tier 0 only | Tier 0 is "No reader sees a difference … Pixel diff clean", and Claude decides it. Tier 1 is visible and owes "before-and-after shots" in a digest: it waits for a session. Tier 2 is never the run's |
| Ready and done ([0008](../decisions/0008-ready-and-done.md)) | Strains for 2; conflicts for 3 | Done needs `gate:full` and the reviewer, "a separate agent". The run must hand work to an agent, which stage 0 holds back until "a hand-off has been shown to stay inside the worktree". The full gate does not run in a cloud session |
| Fully automatic (the owner, 2026-10-02, [stage 0](../stages/00-hub.md): "IT SHOULD BE FULLY AUTOMATIC") | Strains | Said of the daily run, which sat two hours on an approval for a command it made up. Building is made of commands chosen as one goes. Either every one is allowed beforehand, or the run hangs. Not yet a line in `PRINCIPLES.md` |
| The hub's architecture ([0007](../decisions/0007-the-hub-architecture.md)) | Fits, as a second run | The daily run "decides nothing a program can decide" (`hub-daily.md`). A run that builds decides plenty, so it is a second run with its own switch, not the daily run grown. A scheduled agent costs "tokens daily", in 0007's own table |
| One branch for related work | Fits | One branch carried forward is how the daily run already works. The owner's "one large pull request" (2026-09-24) is a session's note, not a line in `PRINCIPLES.md` (I002 says the same) |
| The design language | Fits | Nothing a reader sees: no pattern, no piece, no signature |
| What was tried | Bears on it | The daily run's first scheduled runs, 2026-10-02, hung on a command of its own and on a save outside its scratchpad (stage 0). I002, parked: nothing merges by itself. The tech-debt run "finds little" (0004) and left nine branches unmerged: a branch nobody asked for is not a fix delivered |

**Fits if turned**: tier 0 only, proved unseen by the pixel diff, on this Mac in a worktree of its own,
never pushing, with the push a tap of the owner's. As said (Claude starting sessions as it judges),
it conflicts with the hard rule on pushing (a cloud session must push to deliver) and with the done bar
(the full gate runs only here).

## For and against

**For**

- Work moves while the owner is away: open tasks clear without the owner opening a session.
- The bar already exists: tier 0 is "pixel diff clean", and the gate and the reviewer are built.
- It answers the owner's complaint: a run that keeps the books hands over nothing they can feel.
- What it needs is worth having anyway: readable tasks (F076), the R2 deny (F073), a free port.
- Shape 1 costs little and says each morning what is ready, which is most of the answer.

**Against**

- The start is not the bottleneck: nine run-made branches unmerged, today's batch unpushed.
- An unattended builder is what hung twice on 2026-10-02; building cannot be shrunk to a few lines.
- Little for it to do today: stage 1 has nothing left that needs nobody; stage 2 is a foundation laid in order.
- A second build on one Mac meets the owner's (port 4173), and its branch meets theirs in the same files.
- Tokens every day, twice on a block, for changes no reader sees.

## Challenged

## Questions for the owner

### 1 · What should a run with nobody present hand you each morning?

- **A (recommended):** A list of what is ready now; a branch of unseen fixes once that is proven.
- **B:** A branch of unseen fixes, gated and reviewed, as soon as it can be built.
- **C:** Neither: it keeps the books, and I start the work.

Why: it decides whether code is ever written here with nobody watching.

### 2 · May a branch Claude has finished be pushed on your tap, one tap each time?

- **A (recommended):** Yes: a tap on the command centre per push; never `master`, never a pull request.
- **B:** No: I push it myself.

Why: finished work waits at the push today, and a tap keeps the push yours each time.

### 3 · Is the old daily tech-debt run still on?

- **A (recommended):** Retire it, if it runs: the hub's runs take its place.
- **B:** Keep it, pointed at the plan's tasks instead of a search of its own.
- **C:** It is already off.

Why: the plan names it, nine of its branches sit unmerged, and nothing here can see where it is set.

## Next

The trial (the first three rows of "Can it be delivered", in order, in a scratch worktree), then the
challenge. Whatever is decided, F076 (a tier on every task line) is the lead's, and F073 is stage 0's.
