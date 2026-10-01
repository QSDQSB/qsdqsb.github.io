# 0005 · Choices arrive as prototypes

**Status:** In force from 2026-10-01, on the owner's instruction.

## Context

When two ways of doing something were on the table, the owner asked Claude to prototype them, then
chose. The asking was a round trip that added nothing: the prototypes were always wanted. The owner
also judges by seeing ("they iterate by screenshot"), and has said plainly that they want a thinking
partner with an opinion, not a menu.

## Decision

A tier 2 choice between ways of doing something reaches the owner **already prototyped**, on one
page, with a recommendation. Nobody asks for the prototype.

1. **Frame it.** One line for the question. Two or three tests a good answer passes, taken from
   [`PRINCIPLES.md`](../PRINCIPLES.md). If the principles already answer it, there is no choice:
   build that.
2. **Two options, three at most.** Each must be one the lead would be content to ship. A weak
   option added to make the other look good is a wasted prototype.
3. **Build each as the real thing, cheaply.** Real pages in their own git worktree when the choice
   is how something behaves (the `prototyper` agent, one per option, in parallel). A standalone page
   under `design/choices/<id>/` when it stands alone. Never a description in place of a prototype.
4. **Each option passes the gate** (`npm run gate` at least). An option that breaks the site is not
   an option.
5. **Shoot and assemble.** `node scripts/choice-page.mjs design/choices/<id>/choice.json` shoots
   every option at 1440×900 and 390×844 and writes one page: the options side by side, what each
   costs, the recommendation and why, a control to pick, a note field, and "none of these is good
   enough".
6. **Publish and queue.** The page is published as a private Artifact (capabilities `db` and
   `user`). The queue entry is one line and the link.
7. **Read the pick.** At the start of a session, picks are read from the page's `picks`
   collection. The pick is recorded here in `decisions/` if it sets a rule, or in the stage file if
   it settles a detail. The chosen option is built properly, through the gate. The other worktrees
   are removed.

## Limits, on purpose

- **A prototype costs at most one session.** If an honest prototype would cost more, the queue
  entry says so and asks whether to spend it.
- **Not for tier 0 or 1.** Those are decided, not offered ([0001](0001-who-decides-what.md)).
- **"None of these" is a real answer.** The owner's bar is extraordinary. A "none" with a note
  restarts step 1; it does not produce three more variants of the same idea.
- **New visual directions still start as a design** (Figma, or real pages with screenshots) when
  the owner asks for that; this record covers choices between ways, not the invention of a look.

## Consequences

- The owner's part of a choice becomes: open a page, look, tap.
- Prototypes are disposable by construction: worktrees and `design/` are outside the tracked tree.
- The pick page is generated, so every choice looks the same and none is designed afresh.
