The work run: each morning after the upkeep, one task taken from the plan, done, and handed to the
owner as one pull request ([decisions/0010](../../_plan/decisions/0010-the-merge-is-the-yes.md)). It
runs unattended, with nobody there to approve anything, so it uses only what the owner allowed for it:
`bash scripts/hub-work.sh …` as the lines below give it, and the Edit and Write tools inside
`/Users/apple/Documents/GitHub/qsdqsb.github.io/.claude/worktrees/hub-work/` and nowhere else. Read
any file with the Read tool. No other shell command, no `cd`, no pipe, no `npm` or `git` of your
own: anything else waits for an approval nobody will give, and the run stops for hours.

Give every `bash scripts/hub-work.sh` call a timeout of 600000 ms (ten minutes): `run` and `wait`
each hold a call for up to nine.

A work run changes the site, never its tooling: scripts, tests, packages, plugins, workers, CI and
Claude's own settings are out of its reach, and the script refuses to build, gate or commit a folder
that touches them.

The bar is the one every session meets ([0008](../../_plan/decisions/0008-ready-and-done.md)): the
change is right, the full gate passes, the reviewer passes it, and the plan says what was done. It is
also the house's: read `CLAUDE.md`, the stage's file, `_plan/DESIGN-LANGUAGE.md` and
`_plan/PRINCIPLES.md` before you change anything a reader sees.

1. **Begin.** `bash scripts/hub-work.sh begin`
   If it says a work pull request waits for the owner, end the run there and report that line. If
   it says STOP, report it and end. Otherwise it makes the folder from GitHub's `master` and lists
   what to take next, each with its key: the owner's requests first, then the roadmap.
2. **Choose and claim.** Read the first candidate in full: its line in its stage file (or in
   `_plan/requests.md`), the stage's goal and design notes, and the code it names. Take it if you
   can finish it today to the bar above. Hold it if it needs a choice only the owner can make (a
   taste call no built version can answer, a fact only they know, a device you do not have) or a
   change to the site's tooling:
   `bash scripts/hub-work.sh hold <key> "<the one question, in a sentence the owner can answer>"`,
   then `begin` again and read the next. When you have one you can finish:
   `bash scripts/hub-work.sh claim <key>`. One task a run; a request counts as one task.
3. **Do it.** Edit only inside the folder. Build what it needs with
   `bash scripts/hub-work.sh run <script>`: `build:js` after an edit to `assets/js/_main.js`,
   `test`, `check:<name>`, `visual:build`, `visual:diff`. Nothing else runs. In the plan, in the
   folder: tick the task (`- [x]`, with today's date and what was done in a clause), add the
   changelog line a reader's change needs, and for a request move its line from Open to Done in
   `_plan/requests.md`. Use the Edit tool for these.
4. **Pictures, when a reader would see it.** `bash scripts/hub-work.sh run visual:build`, then
   `bash scripts/hub-work.sh run visual:diff`: it names the pages that changed. Every one must be a
   page the task meant to change; any other is a fault to fix, not a picture to keep. Then
   `bash scripts/hub-work.sh run visual:capture --only <those page ids, comma-separated>`: their
   pictures at desktop and phone width are re-written, go in the commit, and GitHub shows them
   before and after in the pull request. Name the pages in the pull request's body. A change no
   reader sees re-captures nothing; its pixel diff must be clean.
5. **The gate.** `bash scripts/hub-work.sh gate` starts the full gate in the background (about ten
   minutes); then `bash scripts/hub-work.sh wait`, again each time it says it is still running,
   until it prints the verdict and the log's path. Read the log if it fails, fix inside the folder,
   and gate again. If it cannot pass today, `bash scripts/hub-work.sh abort` and report why.
6. **The reviewer.** `bash scripts/hub-work.sh diff`, then hand the `site-reviewer` agent the diff
   file's path, the gate log's path, the task's key and its line in the plan, and the pages you
   re-captured. Tell it: it is in an unattended run; it may use only the Read tool and
   `bash scripts/hub-work.sh diff`; it reads the gate's log and does not run the gate again; any
   other command would hang the run. A BLOCK is fixed and reviewed again, at most twice; then
   abort and report.
7. **Commit and open.** `bash scripts/hub-work.sh commit "<emoji> <what changed, in the house's
   commit style>"`. Write the pull request's body with the Write tool to
   `.claude/worktrees/hub-work/PR-BODY.md`: what the owner will see, in two or three lines; what
   was done; which task or request it closes; the pages re-captured; what the reviewer said; what
   to look at in the pictures. End it with the line
   `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.
   Then `bash scripts/hub-work.sh pr "<emoji> <title>"`.
8. **Report** in under eight lines: the task, the pull request's address (or the hold and its
   question, or why it was aborted), the gate, the reviewer, and anything the owner should know.

Never: merge, push `master`, touch R2 or photographs, edit outside the folder, change a permission
or the site's tooling, take a second task, or open a second pull request. A hook's message about
files outside the folder is the owner's unfinished work: report it, fix nothing.
