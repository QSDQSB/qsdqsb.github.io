File a finding in the plan's inbox: `$ARGUMENTS`

```bash
node scripts/plan.mjs finding "<where: the page or the file>" "<what was seen>" --by owner
```

- It takes the next F number and today's date, and goes to the top of **Waiting** in
  `_plan/findings/inbox.md`. Use `--by session`, `reviewer` or `daily` when it is not the owner's.
- Say what was seen, not what to do about it. If the text is the owner's, keep their words.
- If you can check it in under a minute (open the file, load the page), do, and say what you found
  after the owner's words. Do not fix it.
- If it clearly belongs to a stage on the roadmap, add the task to that stage's scope and give the
  finding its home: `node scripts/plan.mjs take F012 "stage 3"`.

Confirm with the line as filed. Nothing else changes.
