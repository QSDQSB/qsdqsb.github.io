# Changelog

*This page is rendered from the files in `_plan/changelog/` (`node scripts/plan.mjs render`) and is not committed: add a file there, do not edit this page.*

What changed for a reader, newest first. One line per change: the date, what a reader now gets, the
finding or stage it answers, and its tier. Not a commit log: `git log` is that. A line here says
what the site does differently.

`scripts/check-plan.mjs` fails the gate when styles, layouts, includes, scripts, pages or the
navigation change with no entry added (`node scripts/plan.mjs log "…"`). Tooling, docs and the plan itself need none.

Format: `- YYYY-MM-DD · what changed (ids) · tier n`

