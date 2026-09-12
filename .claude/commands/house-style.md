Audit prose and code for generic-AI register.

1. Run `npm run check:house-style` for the full tree audit.
   (Use `python3 scripts/check-house-style.py --new-only` to judge only
   what changed vs `HEAD` — this is what the hooks run.)
2. Report findings grouped by category:
   - `ai-register`, `corporate`, `travel-cliche` — prose in `_posts/`,
     `_voyage/`, `_subvoyage/`, `_pages/`
   - `comment-register`, `naming`, `css-default`, `neon` — code in `_sass/`,
     `assets/js/`, `_includes/`, `_layouts/`
3. For each finding, rewrite in QSD's register rather than merely deleting
   the flagged word — the goal is specific, concrete language, not a thinner
   version of the same sentence. Consult the `sound-like-qsd` skill for voice.

Two escape hatches, in order of preference:

- **The rule is wrong.** If a rule fires on QSD's genuine voice, delete it
  from the lexicon in `scripts/check-house-style.py`. The lexicon targets
  generic AI/marketing/travel-brochure register only. Ornate prose,
  em-dashes, fragments and irony are the house style, not defects.
- **This instance is deliberate.** Add `@style-ok` to the line.

Never work around a finding by rephrasing into something equally generic.
