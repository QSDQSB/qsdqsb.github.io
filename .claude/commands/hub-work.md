The morning run: the upkeep, then one task taken from the plan, done, and handed to the owner as one
pull request ([decisions/0010](../../_plan/decisions/0010-the-merge-is-the-yes.md),
[0011](../../_plan/decisions/0011-unseen-work-merges-itself.md)). On Sundays the task is the scout's.
It runs unattended, with nobody there to approve anything, so it uses only what the owner allowed for
it: `bash scripts/hub-daily.sh …` and `bash scripts/hub-work.sh …` as the lines below give them, and
the Edit and Write tools inside
`/Users/apple/Documents/GitHub/qsdqsb.github.io/.claude/worktrees/hub-work/` and nowhere else. Read
any file with the Read tool. No other shell command, no `cd`, no pipe, no `npm` or `git` of your
own: anything else waits for an approval nobody will give, and the run stops for hours.

**Words never go on the command line.** A question for the owner, a finding, an idea: write it to
`.claude/worktrees/hub-work/NOTE.md` with the Write tool, then run the line that reads it. A `$` or a
backtick in a command waits for an approval (2026-10-06: two hours on one question).

Give every `bash scripts/hub-work.sh` call a timeout of 600000 ms (ten minutes): `run` and `wait`
each hold a call for up to nine.

A work run changes the site, never its tooling: scripts, tests, packages, plugins, workers, CI and
Claude's own settings are out of its reach, and the script refuses to build, gate or commit a folder
that touches them.

The bar is the one every session meets ([0008](../../_plan/decisions/0008-ready-and-done.md)): the
change is right, the full gate passes, the reviewer passes it, and the plan says what was done. It is
also the house's: read `CLAUDE.md`, the stage's file, `_plan/DESIGN-LANGUAGE.md` and
`_plan/PRINCIPLES.md` before you change anything a reader sees.

0. **The upkeep.** Do steps 1 to 5 of `.claude/commands/hub-daily.md` (read it with the Read tool),
   as written there and under its rules: `begin`, the store dumped and synced, the debt, the brief
   written, `finish`. Leave its step 6, the brief's publish, to the very end of this run: a publish
   that waits must not hold up the task. If its `begin` says STOP, say so in the report and go on
   to step 1 here.
1. **Begin.** `bash scripts/hub-work.sh begin`
   It merges first what the owner's rule lets merge (an `unseen` pull request, a day old, with no
   word from the owner) and says so: each "Merged by the rule" line goes in the report. Then:
   - "Nothing is started today" (three wait, or one has waited three days): end the run there and
     report those lines.
   - STOP: report it and end.
   - "REFUSED: the folder holds …": an earlier run of today left a claim. `abort`, then `begin`.
   - "Today is the scout's": go to **The scout** below.
   - Otherwise it makes the folder from GitHub's `master`, lists the files the open work pull
     requests change (keep off them: `gate` and `commit` refuse an overlap), and what to take next,
     each with its key: the owner's requests first, then the roadmap.
2. **Choose and claim.** Read the first candidate in full: its line in its stage file (or in
   `_plan/requests.md`), the stage's goal and design notes, and the code it names. Take it if you
   can finish it today to the bar above, without touching a file an open work pull request changes.
   Hold it if it needs a choice only the owner can make (a taste call no built version can answer, a
   fact only they know, a device you do not have) or a change to the site's tooling: write the one
   question, in a sentence the owner can answer, to `NOTE.md`, then
   `bash scripts/hub-work.sh hold <key>`, then `begin` again and read the next. When you have one
   you can finish: `bash scripts/hub-work.sh claim <key>`. One task a run; a request counts as one.
   **If GitHub's `master` itself fails the pixel diff** before you change anything (step 4 shows it
   on pages your task does not touch), and every failing page shows a pinned page's own words,
   captions, photographs or cover changed on `master` since its baselines were taken (voyages and photographs added after
   `tests/visual/content-pin.json` never reach the shots), that is today's task: `abort`, `begin`,
   `claim baselines-<today, YYYY-MM-DD>`, re-capture exactly those pages, and open it (step 7) as
   "🔧 Re-capture the baselines after …". It moves pictures, so it is the owner's to merge.
3. **Do it.** Edit only inside the folder. Build what it needs with
   `bash scripts/hub-work.sh run <script>`: `build:js` after an edit to `assets/js/_main.js`,
   `test`, `check:<name>`, `visual:build`, `visual:diff`. Nothing else runs. A `run` that says
   "Still running" goes on in the background: `bash scripts/hub-work.sh wait` until it ends. In the
   plan, in the folder: tick the task (`- [x]`, with today's date and what was done in a clause), add
   the changelog line a reader's change needs, and for a request move its line from Open to Done in
   `_plan/requests.md`. Use the Edit tool for these. Do them before the gate when you can; a change
   to the plan alone after a passing gate costs only the fast gate at `pr`.
4. **Pictures, when a reader would see it.** `bash scripts/hub-work.sh run visual:build`, then
   `bash scripts/hub-work.sh run visual:diff`: it names the pages that changed. Every one must be a
   page the task meant to change; any other is a fault to fix, not a picture to keep. Then
   `bash scripts/hub-work.sh run visual:capture --only <those page ids, comma-separated>`, adding
   `--viewport desktop` or `--viewport mobile` when the task meant only one width (2026-10-05: a
   phone fix re-wrote the desktop shot, and the reviewer blocked it). The pictures go in the commit,
   and GitHub shows them before and after in the pull request. Name the pages in the pull request's
   body. A change no reader sees re-captures nothing; its pixel diff must be clean.
5. **The gate.** `bash scripts/hub-work.sh gate` starts the full gate in the background (about
   fifteen minutes); then `bash scripts/hub-work.sh wait`, again each time it says it is still
   running, until it prints the verdict and the log's path. If it failed **and** says the Mac slept
   while it ran, gate once more before you look for a fault: a page that "did not load" after a
   sleep is the sleep's. Otherwise read the log, fix inside the folder, and gate again. If it cannot
   pass today, `bash scripts/hub-work.sh abort` and report why.
6. **The reviewer.** `bash scripts/hub-work.sh diff`, then hand the `site-reviewer` agent the diff
   file's path, the gate log's path, the task's key and its line in the plan, and the pages you
   re-captured. Tell it: it is in an unattended run; it may use only the Read tool and
   `bash scripts/hub-work.sh diff`; it reads the gate's log and does not run the gate again; any
   other command would hang the run. A BLOCK is fixed and reviewed again, at most twice; then
   abort and report. Notes on PASS WITH NOTES that change the site's files cost a second gate:
   apply them only when they are faults, and say in the body which you left.
7. **Commit and open.** `bash scripts/hub-work.sh commit "<emoji> <what changed, in the house's
   commit style>"`. Write the pull request's body with the Write tool to
   `.claude/worktrees/hub-work/PR-BODY.md`, a few lines and high-level, never a file-by-file or
   item-by-item account (the owner, 2026-10-17): what the owner will see; which task or request it
   closes; the pages re-captured; what the reviewer said; what to look at in the pictures. End it
   with the line
   `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.
   Then `bash scripts/hub-work.sh pr "<emoji> <title>" --reviewer <PASS|NOTES|BLOCK>`, with the
   reviewer's last word exactly (NOTES for PASS WITH NOTES). The script decides whether it is
   **unseen** (no pixel moved, nothing a reader is given, nothing of the owner's voice, the full gate
   and a plain PASS): then it is labelled so, and merges itself on the first morning run a day
   later unless the owner comments, reviews or takes the label off. You never decide that.
8. **Publish the brief** (the upkeep's step 6), then **tell the owner** with the PushNotification
   tool, one line, only when something needs them within a day: an `unseen` pull request opened
   ("#N opened, unseen: merges itself on the first morning a full day from now, unless you say"), anything merged by the rule, or a
   hold. Nothing on a quiet day.
9. **Report** in under ten lines: the upkeep's lines, what merged by the rule, the task, the pull
   request's address (unseen or not; or the hold and its question, or why it was aborted), the gate,
   the reviewer, and anything the owner should know.

## The scout (Sundays)

Once a week the run looks at the site as a reader would and says what is below the house's own bar
(the owner, 2026-10-18, R013). It builds nothing a reader sees: what it finds goes to the owner as
findings and ideas, and anything major is theirs to confirm on the command centre.

1. `bash scripts/hub-work.sh scout`: it claims the week's scout and builds the site and shoots every
   page of the pixel harness at desktop and phone width, in the background. `wait` until it prints
   where the pictures are.
2. Read `_plan/DESIGN-LANGUAGE.md` (its head first: "What the eye turns away"), `_plan/PRINCIPLES.md`,
   `_plan/FEATURES.md`, the open ideas in `_plan/ideas/` and the findings inbox, so you do not raise
   what is already known, decided or turned down. Then look at every picture with the Read tool, and
   read the source of what you look at hard.
3. **Small faults** (a broken wrap, a stray colour, a control that differs from its kind, a dead
   link): one finding each. Write what was seen to `NOTE.md`, then
   `bash scripts/hub-work.sh finding "<the page or file>"`. Five at most; the plainest first.
4. **Something larger** (a feature that is missing or weak, a page below the others, an upgrade that
   would serve readers): write it to `NOTE.md` as the lead would put it, in two or three sentences,
   then `bash scripts/hub-work.sh idea`. It refuses while two of the lead's ideas wait on the owner;
   then keep it for next week. For each idea raised, hand the `design-lead` agent the job "Shape an
   idea" on that file **inside the folder** (give it the full path; it writes only there and only
   the plan), then the `site-reviewer` agent "Challenge a proposal" on the same file, then the lead
   again to settle it. Tell both they are in an unattended run: Read, Glob, Grep, and the Edit and
   Write tools inside the folder only, and no shell command. Nothing is tried in code on a Sunday:
   its "Can it be delivered" rows stay **open**, saying how each will be tried.
5. Commit (`commit "📘 The scout's week: <n> findings, <the idea's name>"`), write a short body (what
   was looked at, what was filed, the idea and its verdict), and
   `pr "📘 The scout, <the week>" --reviewer <its last word, exactly>` once the reviewer has read the
   change to the plan (hand it the `diff`). A change to the plan alone needs only the fast gate, which `pr` runs.
6. Steps 8 and 9 above. The idea reaches the command centre once its pull request is on `master`
   and a session republishes the page; its Pursue, Park or Drop is the owner's.

Never: merge by hand, push `master`, touch R2 or photographs, edit outside the folder, change a
permission or the site's tooling, take a second task, or open a second pull request in one run. A
hook's message about files outside the folder is the owner's unfinished work: report it, fix nothing.
