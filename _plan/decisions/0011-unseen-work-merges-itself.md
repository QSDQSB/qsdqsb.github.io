# 0011 · Unseen work merges itself; one morning, made reliable

**Status:** Accepted 2026-10-18, the owner, in chat, four taps on questions a session put to them
(their requests R012 and R013, `_plan/requests.md`):

1. "When a work run's PR is ready, how should it reach master?" → **"Unseen fixes merge
   themselves"**: up to three work pull requests open at once, on separate files; one with a clean
   pixel diff, `gate:full` and the reviewer's PASS, and no tooling, merges itself after 24 hours
   unless the owner comments.
2. "How many tasks should a morning take?" → **"One, made reliable"**: the sleep, re-gate and
   approval traps fixed first; revisited after two weeks of clean runs.
3. "How often should Claude look for what's subpar and propose ideas of its own?" → **"A weekly
   scout"**.
4. "Fold the daily upkeep into the work run?" → **"One morning session"**.

**Amends:** [0001](0001-who-decides-what.md) (merging a pull request is always tier 2),
[0006](0006-the-hub-keeps-itself.md) (what the scheduled run does) and
[0010](0010-the-merge-is-the-yes.md) (one work pull request at a time; never a merge).

## Context

The owner, 2026-10-18: "We want to handle I002 and I003 ideas from Hub for a smoother and mor
efficient, productive automation" (R012), and "you should be able to identify the subpar part of the
website and propose functionality / upgrade / improvement ideas as well, and i shall confirm in the
hub for major changes" (R013).

An audit of all 29 scheduled-run transcripts, 2026-10-04 to 10-18: the work run opened 8 pull
requests in 15 days, 4 of them with nobody touching anything (#105, #106, #114, #118); #109 was
closed unmerged. Three mornings did nothing because a work pull request waited (10-09, 10-11,
10-12); four died or were aborted (10-13, 10-14, 10-15, 10-17). The time went to the Mac sleeping
mid-run (5 runs, about six hours, made worse by cut-offs counted on the wall clock), to about seven
extra full gates (about 110 minutes) for a line added after the gate, to approvals (118 minutes on a
`$` inside a hold question; 61 hours on a hung publish of the brief), to `master`'s own baselines
gone stale after photographs, and to `begin` run twice. The daily upkeep ran 17 times for one
commit, never pushed. A full gate takes about sixteen minutes here, not ten.

## Decision

**What merges itself.** A work pull request that `scripts/hub-work.sh pr` labels `unseen`. The
label is a list of what may be unseen, and anything not on it is seen, so a served folder nobody
named starts out seen (the reviewer's block, 2026-10-18): every path the change touches, renames
counted as the old path gone and the new one made, is under `_plan/`, `_docs/`, `_sass/`,
`_includes/`, `_layouts/`, `assets/js/` or `assets/css/`; no line in `_plan/CHANGELOG.md` (a line
there means a reader gets something); no baseline under `tests/visual/baseline/` (the pixel diff is
clean, [0001](0001-who-decides-what.md)'s own test of tier 0); the gate passed on that exact tree
(the full gate, or for a change that is the plan alone, which the site never reads, the fast one);
and the reviewer returned a plain PASS (PASS WITH NOTES is not eligible). The owner's own words in
the plan are not in the class either: `_plan/PRINCIPLES.md`, `_plan/DESIGN-LANGUAGE.md`,
`_plan/decisions/`, `_plan/QUEUE.md`, the switch in `_plan/hub.json`, and any line of the owner's in
an idea (their words, their decision) taken away or rewritten change only on the owner's word, so a
pull request that touches them waits for the owner's merge.

**What that covers, honestly.** `check-plan` asks a changelog line of any change to the site's
code, so such a change is seen today and the owner merges it: as built, the rule would have merged
none of the twelve work pull requests #103 to #118. What merges itself at first is the plan alone
(the scout's week, a finding filed, a task ticked) and the docs. The site's code is on the list for
the day `check-plan` tells a pixel-clean refactor from a change a reader gets; narrowing it would
widen this class, and is the owner's to see first.

Each morning `begin` merges every open `unseen` work pull request that is at least 24 hours old,
whose head is the commit that was gated, that the owner (QSDQSB) has neither commented on nor
reviewed, that still carries the label, and that is mergeable with every check green (none running,
and at least one). A merge commit, pinned to that head. **The owner's veto** is any one of: taking
the label off, a comment, a review. **The owner's switch** is `"work_may_merge"` in GitHub's
`master`'s `_plan/hub.json`: off, nothing merges by the rule; and nothing merges on a morning GitHub
did not answer the fetch, since the switch may have moved. GitHub sends no email for a merge made
with the owner's own token, so the run tells the owner on their phone (a notification) the day an
`unseen` pull request opens and the day one merges, and the run's report names each. The day brief
does not yet mark them (a task in stage 0).

**Up to three open at once**, on separate files: `begin` starts nothing while three work pull
requests are open, pauses when one has waited three days unmerged, and a change that overlaps the
files of an open one (outside `_plan/`) is refused at `commit` and `pr`.

**One task a morning, made reliable.** Before a morning takes more: cut-offs count the time the Mac
was awake; a gate the Mac slept through is run once more before a fault is hunted; a long step runs
on into `wait` rather than being killed; an edit only inside `_plan/` after a passing full gate needs
only the fast gate; a hold's question is a file, never a shell argument; `begin` never destroys a
folder that holds a claim. Revisited after two weeks of clean runs: a run that ends by itself with a
pull request, a hold or nothing to do, and waits on nobody.

**One morning session.** The upkeep (`hub-daily.sh`: the owner's taps recorded, the debt hunt) is
the work run's first step, the task its second, and the day brief is published last, after the pull
request. The separate daily task is switched off once this is on `master`.

**The weekly scout.** On Sunday the morning run takes no task. It builds the site, shoots every page
of the pixel harness at desktop and phone width, and reads them against
[`DESIGN-LANGUAGE.md`](../DESIGN-LANGUAGE.md) ("What the eye turns away") and
[`PRINCIPLES.md`](../PRINCIPLES.md). A small fault becomes a finding. A major one becomes an idea of
the lead's (`plan.mjs idea --by lead`), shaped and challenged, and only while fewer than two such
ideas wait on the owner. It opens a pull request of the plan alone. Nothing it finds is built
unasked: a major change reaches the owner as an idea on the command centre, for Pursue, Park or Drop.

**What still never happens without the owner:** any other merge, a push to `master`, a write to R2,
a removal, a signature redrawn without pictures, a change to the run's own tooling, and anything
`PRINCIPLES.md` holds as theirs.

What the owner said yes to are the four taps under "Status". The rest (the exact conditions, the
exclusion of the owner's own files, what counts as a clean run) is the lead's and the session's
working of them, and the owner's to change. These rules change only in a record like this one, never
by a pull request that merged itself.

## Consequences

- [0001](0001-who-decides-what.md): "merging a pull request" stays tier 2 except for this class.
  The reviewer stays load-bearing: its PASS is now the last reader a tier 0 change meets.
- [0006](0006-the-hub-keeps-itself.md), "It is kept, because a scheduled run tends it": the
  morning session records the owner's taps, files what nothing loads, runs the gate and publishes the
  day brief. It neither sorts the inbox nor republishes the command centre (F054, F075): a session
  and the lead do. Once a week the scout looks for what is subpar.
- [0010](0010-the-merge-is-the-yes.md): "one work pull request at a time" becomes three; "a merge"
  leaves its list of what never happens without the owner for this class only.
- Honest limits. The pixel diff is blind past about 16,700 px down a long page, to a coarse
  pointer, and on pages outside the harness (F030, F063): what it cannot see can merge seen by
  no one. Each pull request is gated alone; three merged in one morning are first gated together
  by the next run. The veto holds only if the owner hears of a pull request within the day: the
  notification reaches the phone only while Remote Control is connected, and the brief has hung
  before (the lead's objection, 2026-10-18, kept here).
- [I002](../ideas/I002-rules-for-the-hub-to-approve-and-merge-a-pull-re.md) and
  [I003](../ideas/I003-in-the-daily-running-specifically-are-we.md) are pursued, in
  [stage 0](../stages/00-hub.md).
