Work on a stage of the roadmap: `$ARGUMENTS` (a stage number; with none, the current one).

1. Run `node scripts/check-plan.mjs --brief`. Read `_plan/ROADMAP.md`, the stage's file, and every
   decision and line of `_plan/PRINCIPLES.md` it cites.
2. If the stage file is not yet a brief (no scope, no exit), hand it to the `design-lead` agent to
   write one, and stop there if the brief needs the owner.
3. Take the next unticked task that needs nobody. For each task:
   - Find the feature's row in `_plan/FEATURES.md` and read the files it names.
   - Set the tier (`_plan/decisions/0001-who-decides-what.md`). Tier 2 that is not answered in the
     queue: do not build it. If it is a choice between ways, run `/choose`; otherwise add a queue
     entry and move to the next task.
   - Build it. Reuse the shared pieces. Add or extend a journey in `scripts/check-journeys.mjs`
     if a reader would notice it breaking.
   - Add its line to `_plan/CHANGELOG.md` if a reader gets something different.
4. Run `bash -lc 'npm run gate:full'` (or `npm run gate` if nothing under `_sass/`, `_layouts/`,
   `_includes/`, `assets/js/`, `_pages/` changed). Fix what fails.
5. Hand the change to the `site-reviewer` agent. On BLOCK, fix and return to it. Do not argue with
   a BLOCK on a tier 2 change: queue it.
6. On PASS: tick the tasks, set the audit's Status for each finding id, update the roadmap's status
   if the stage moved. Commit with the house's commit style. **Never push**; that is the owner's.
7. Report: what was done (by id), the reviewer's verdict, before-and-after shots for any tier 1
   change, and what is now waiting on the owner.
