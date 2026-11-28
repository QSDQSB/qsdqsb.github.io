# Findings inbox

One line each: the date, the page, what was seen. Anyone files here, the moment they notice
something: a session, the daily run, the owner. The design lead sorts it into stages; an item
leaves this list when a stage takes it or it is closed.

Format: `- YYYY-MM-DD · F012 · where · what was seen (who reported)`. File one with
`node scripts/plan.mjs finding "<where>" "<what was seen>"`: it takes the next number, which is never
reused. Give it a home with `node scripts/plan.mjs take F012 "stage 3"`.

