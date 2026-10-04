# 0010 · The merge is the yes: how work reaches the owner

**Status:** Accepted 2026-10-04, the owner, in chat ("Yes"), to this proposal: a change the owner
would see is built and arrives as a pull request with pictures at desktop and phone width, and the
owner's merge is the yes.
**Amends:** [0001](0001-who-decides-what.md) (what tier 2 waits for) and
[0006](0006-the-hub-keeps-itself.md) (what the hub does unattended).

## Context

The owner, 2026-10-04: "What does the daily run supposed to do? … There are a lot of roadmaps going
on, and when can we make any progress?" and "can't you have a daily job that looks through the
ongoing tasks and then decide one that we haven't started and to start it in every day session?
Also, I am allowed to directly tell you what I want to fix at a random day … It should minimize my
burden to have the unnecessary communication with you and to streamline the process. I want my time
to be valuable."

Until now a change a reader sees anew waited for a separate yes in the queue before it was built.
Work moved only when a session was opened and given a batch; the daily run kept the books and fixed
nothing.

## Decision

**The owner's three touchpoints, and no others:**

1. **Say what they want**, any day, to any session or on the phone. It becomes a request in
   `_plan/requests.md` and goes to the front of the line once it is on GitHub's `master` (a session
   files it there, or in the pull request it opens). A box for it on the command centre is to come.
2. **Tap a call** on the command centre, only when the next step needs their taste and cannot be
   shown as a built change.
3. **Merge a pull request**, having looked at its pictures. The merge is the yes; closing it or a
   comment on it is the no, and the work is redone.

**The work run.** Each morning after the upkeep, one unattended session takes the next task:
the owner's requests first, newest first; then the roadmap in order, the stage being built, its
first open task that nobody has claimed and that does not wait on the owner. It claims the task
before it starts (a branch `work/<task>` on GitHub, so a session opened the same day does not do it
twice), works in its own folder only (`.claude/worktrees/hub-work/`), passes the full gate and the
reviewer, and opens one pull request. A change the owner would see carries its re-captured pictures
in the pull request, at both widths. A task that turns out to need a choice of the owner's is held
(a branch `hold/<task>` with the question), named in the day brief, and the run takes the next; the
owner answers it to any session, which records the answer and deletes the branch. A pull request the
owner closes without merging comes back the same way: held, with the question what should change. A
work run changes the site and never its tooling (scripts, tests, packages, settings): a task that
needs those is held for a session the owner opens.
One work pull request at a time: none is opened while one waits for the owner, and after three
days unmerged the run pauses and the brief says so.

**A session the owner opens** files what it is told as a request, does it on the spot when small,
and otherwise leaves it first in line. Before it takes a roadmap task it claims it the same way.

**What still never happens without the owner:** a merge, a push to `master`, a write to R2, a
removal, a signature redrawn without pictures, and anything `PRINCIPLES.md` holds as theirs.

What the owner said yes to is the first sentence of "Status". The rest (requests first, one pull
request at a time, the three-day pause, holds) is the lead's working of it, shown to the owner on
2026-10-04 before the yes, and theirs to change.

## Consequences

- Tier 2 now means "arrives with pictures and waits for the merge", not "waits for a yes before it
  is built". A choice between ways still arrives as prototypes ([0005](0005-choices-arrive-as-prototypes.md)).
- The command centre asks less; the pull request list and the day brief carry more.
- A run's cost is a session a day. The brief says what each run did and what it waits on.
