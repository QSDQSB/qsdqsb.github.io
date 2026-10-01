Show where the site stands and what to do next, from the plan in `_plan/`.

1. Run `node scripts/check-plan.mjs --brief` and `node scripts/check-plan.mjs`. If the plan is
   broken, say what is broken first.
   If the plan check says the daily run's branch (`hub/daily`) holds commits that are not here, say
   what they are (`git log --oneline HEAD..hub/daily`), ask the owner, and on their word merge it
   (`git merge hub/daily`) before recording anything: it holds answers and ideas already recorded,
   and ids already given out.
2. If `_plan/hub.json` has a `url`, read the owner's answers from the command centre: `ArtifactData`
   with `action: "list"`, `collection: "answers"`, that `url`. For each answer not yet under
   **Answered** in `_plan/QUEUE.md`, record it: `node scripts/plan.mjs answer Q5 "A: …"`, and hand the
   consequence to the `design-lead` agent. An answer on an idea (`I001`: pursue, park or drop; `I001-1`, `I001-2`: its
   questions) goes to that idea's file: `node scripts/plan.mjs decide I001 pursue "<the note, and the
   answers to its questions>"`. A question left untapped stays open: an unanswered
   call is never a yes, and Pursue does not answer it. An idea whose file already carries `**The owner:**` with
   that decision is recorded: run `decide` again only for a different decision or a new note. A
   question answered with no Pursue, Park or
   Drop beside it (`answers/I001-2` and no `answers/I001`) is not recorded yet: it waits in the page's
   store until the owner decides. Do the same for `picks` on any choice page under `choices` in `hub.json`, and for
   `decisions` on the `audit` page. Then read the `ideas` collection: each document is a new idea in
   the owner's words; run `/idea` on it and delete the document.
3. Report, in this order and briefly:
   - **Now**: the current stage, its tasks done and open, and the next task that needs nobody.
   - **Waiting on you**: each open queue entry, one line, with its recommendation.
   - **New since last time**: the last few lines of `_plan/CHANGELOG.md`; the inbox count.
   - **Upkeep**: any warning from the plan check.
4. If `$ARGUMENTS` is `page`, or the plan check says the command centre is behind the plan, rebuild and
   republish it: `npm run hub:page`, publish `design/hub/hub.html` with the Artifact tool to the `url`
   in `_plan/hub.json` (capabilities `{db: {}, user: {}}`; read the artifact first if this conversation
   has not), then `node scripts/plan.mjs published`.

Do not start building anything. This command only reports.
