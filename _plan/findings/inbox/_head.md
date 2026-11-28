# Findings inbox

*This page is rendered from the files in `_plan/findings/inbox/` (`node scripts/plan.mjs render`) and is not committed: add a file there, do not edit this page.*

One line each: the date, the page, what was seen. Anyone files here, the moment they notice
something: a session, the daily run, the owner. The design lead sorts it into stages; an item
leaves this list when a stage takes it or it is closed.

Format: `- YYYY-MM-DD · id · where · what was seen (who reported)`. File one with
`node scripts/plan.mjs finding "<where>" "<what was seen>"`: a file of its own, named `<date>-<slug>`
(the older ones keep their F numbers). Give it a home with
`node scripts/plan.mjs take <id> "stage 3"`.

