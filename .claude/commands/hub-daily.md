The daily upkeep of the site and its plan. Written to be run unattended by a scheduled agent; it
changes nothing a reader sees and never pushes.

1. `git fetch` and work from the latest `master`. Run `node scripts/check-plan.mjs --since origin/master`
   and `bash scripts/gate.sh`. A red gate on `master` is the first thing in the report.
2. If `_plan/hub.json` has a `url`, read the owner's new answers (`ArtifactData`, `action: "list"`,
   `collection: "answers"`; and `picks` on each page under `choices`).
3. Hand the `design-lead` agent: the answers, and the job "sort the inbox, record the answers, keep
   the queue to about seven, bump Last reviewed if you reviewed the roadmap".
4. Look for debt the gate cannot see, and file each as one line in `_plan/findings/inbox.md`,
   never fixing it here:
   - a feature in `_plan/FEATURES.md` with no journey;
   - a budget in `_plan/decisions/0004-budgets-that-only-fall.md` that has risen;
   - a doc or comment that contradicts the code it sits beside;
   - a file under `_sass/` or `assets/js/` that nothing imports or loads.
   Minimise false positives: file only what you verified.
5. Rebuild the command centre (`npm run hub:page`) and republish it to the `url` in
   `_plan/hub.json` if anything in `_plan/` changed.
6. Persisting. Commit changes under `_plan/` only, on a branch named `hub/daily-YYYY-MM-DD`, with
   the house's commit style. Push that branch **only if** `_plan/hub.json` has `"daily_may_push": true`
   (the owner's switch; absent means no). Without it, put the `_plan/` diff in the report instead.
   Never push `master`, never open a pull request, never touch site files.
7. Report in under ten lines: gate, plan, what was filed, what is waiting on the owner.
