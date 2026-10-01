Show where the site stands and what to do next, from the plan in `_plan/`.

1. Run `node scripts/check-plan.mjs --brief` and `node scripts/check-plan.mjs`. If the plan is
   broken, say what is broken first.
2. If `_plan/hub.json` has a `url`, read the owner's answers from the command centre: `ArtifactData`
   with `action: "list"`, `collection: "answers"`, that `url`. For each answer not yet under
   **Answered** in `_plan/QUEUE.md`, hand it to the `design-lead` agent to record. Do the same for
   `picks` on any choice page under `choices` in `hub.json`, and for `decisions` on the `audit` page.
3. Report, in this order and briefly:
   - **Now**: the current stage, its tasks done and open, and the next task that needs nobody.
   - **Waiting on you**: each open queue entry, one line, with its recommendation.
   - **New since last time**: the last few lines of `_plan/CHANGELOG.md`; the inbox count.
   - **Upkeep**: any warning from the plan check.
4. If `$ARGUMENTS` is `page`, also rebuild and republish the command centre: `npm run hub:page`,
   then publish `design/hub/hub.html` with the Artifact tool to the `url` in `_plan/hub.json`
   (capabilities `{db: {}, user: {}}`). Read the artifact first if this conversation has not.

Do not start building anything. This command only reports.
