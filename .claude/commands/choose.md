Run a choice for the owner, prototypes first: `$ARGUMENTS`

Follow `_plan/decisions/0005-choices-arrive-as-prototypes.md`. The owner should not have to ask for
the prototypes or describe the options; they open one page and pick.

1. **Check it is a choice.** Read `_plan/PRINCIPLES.md` and the decisions. If a standing call
   already answers the question, say which line and stop. If it is tier 0 or 1
   (`_plan/decisions/0001-who-decides-what.md`), decide it and stop.
2. **Frame it** with the `design-lead` agent: the question in one line, two or three tests, two
   options (three at most) it would be content to ship, a recommendation. It writes
   `design/choices/<id>/choice.json`.
3. **Build the options in parallel.** One `prototyper` agent per option, each with
   `isolation: "worktree"`. If "as today" is an option, it needs no agent: shoot the current site.
4. **Gate each option.** A prototype whose report says the gate fails is not shown.
5. **Shoot and assemble.** Serve each option's built site
   (`python3 -m http.server <port> --directory <worktree>/_site`), put the URLs in `choice.json`,
   run `node scripts/choice-page.mjs design/choices/<id>/choice.json`. Stop the servers.
6. **Publish** `design/choices/<id>/choice.html` with the Artifact tool, capabilities
   `{db: {}, user: {}}`, icon `compare`. Add `{ "<id>": "<url>" }` under `choices` in
   `_plan/hub.json`.
7. **Queue it.** One entry in `_plan/QUEUE.md`: the question, the link, the recommendation.
8. Tell the owner in two lines: the question, the link. Keep the worktrees until they pick.

When the pick comes back (read `picks/<id>` from the page with ArtifactData): record it, build the
chosen option properly through `npm run gate:full` and the `site-reviewer` agent, remove the other
worktrees, move the queue entry to **Answered**.
