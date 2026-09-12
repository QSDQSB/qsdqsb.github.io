---
name: house-style
description: Defend the site's voice against generic-AI register in prose and code, and govern edits to the cliché lexicon itself. Use whenever writing or editing content in `_posts/`, `_voyage/`, `_subvoyage/`, or `_pages/`, whenever `scripts/check-house-style.py` is being changed, whenever the house-style hook reports a finding, and whenever the user mentions clichés, AI-sounding writing, tone, register, or voice. Use also when adding comments or class names in `_sass/`, `assets/js/`, `_includes/`, or `_layouts/`.
---

# House Style — refusing the average

The risk as this site scales isn't broken code, it's *flattened* code and
prose: the generic register any language model reaches for by default. This
skill governs the guard that resists it, and — more importantly — the policy
for tuning that guard.

## The guard

`scripts/check-house-style.py` (`npm run check:house-style`) carries an
explicit lexicon, in two halves:

- **Prose** (`_posts/`, `_voyage/`, `_subvoyage/`, `_pages/`) — generic AI,
  corporate, and travel-brochure register.
- **Code** (`_sass/`, `assets/js/`, `_includes/`, `_layouts/`) — comments that
  describe marketing rather than mechanism, generic or versioned class names,
  stock CSS defaults, and neon colours (Design Philosophy says muted, no neon).

Modes: `--new-only` (changes vs `HEAD` — what the hooks run), `--prose`,
`--code`, `--self-test`.

It is scoped to **what changed**, never the existing backlog. A check that
reports old debt every turn gets ignored within a day.

## Tuning policy: minimise false positives, accept false negatives

**This is the governing rule.** The two error types are not symmetric:

- A **missed cliché** is caught by the author's own ear on the next read. The
  voice is the thing being defended and its owner is reading anyway — there is
  a reliable second line of defence.
- A **false positive** has no backstop. It trains the reader to skim past the
  hook, and once that happens every real finding is lost with it.

So a rule earns its place only if it is hard to trigger *accidentally* in QSD's
register. **When in doubt, cut the rule.**

Two concrete consequences, both already applied:

- Words that are ordinary English outside the cliché are cut entirely
  (`robust`, `myriad`, `plethora`, `at its core`, `in the realm of`,
  `ever-changing`) or narrowed to the exact stock phrase (`boasts a`,
  `leverage the`, `a must-visit`).
- Anything colliding with the site's own subject matter is cut. `stands as a`
  would fire on QSD's central image — monuments that stand and crumble. *Seams*
  are load-bearing in the aesthetic vocabulary, so only the adverb `seamlessly`
  is matched, never bare `seamless`.

The same bar applies to code rules: BEM modifiers like `.home__panel--new`,
Font Awesome brand colours, Solarized syntax values, and comments explaining
real mechanism (`for better performance`, `robust against null input`) all had
their rules removed or narrowed. Authoring went 32 findings → 4 true positives.

### The self-test is the enforcement

`python3 scripts/check-house-style.py --self-test` holds both probes:

- `CLEAN_PROBE` — legitimate lines, each using a word the lexicon was tempted
  to ban, in its innocent sense. **These must never fire.**
- `DIRTY_PROBE` — real clichés that must stay caught.

The PostToolUse hook runs it automatically whenever `check-house-style.py` is
edited — that being the exact moment a false positive gets introduced.

**Whenever you cut a rule, add a line to `CLEAN_PROBE` preserving the innocent
sense**, so the reason for the cut can't be lost later.

## What this skill does NOT flag

Ornate prose, em-dashes, fragments, long sentences, melancholy, irony. Those
are the house voice — see the `sound-like-qsd` skill. Only lexical tells of
generic AI/marketing/travel-brochure register are in scope.

`seo_description` is exempt from the prose lexicon: it is contractually plain
and factual, the one place on the site that is intentionally un-stylised.

## Escape hatches, in order of preference

1. **The rule is wrong** — delete it from the lexicon. If a rule fires on QSD's
   genuine voice, it is a bug in the rule, not in the writing. Add the line to
   `CLEAN_PROBE`.
2. **This instance is deliberate** — put `@style-ok` on the line.
3. **Rewrite in QSD's register** — the usual case. Aim for concrete and
   specific, not a thinner version of the same empty sentence.

Never satisfy a finding by swapping one generic phrase for another.

## Workflow

1. Run `npm run check:house-style` (full tree) or `--new-only` (this change).
2. Group findings by category: `ai-register`, `corporate`, `travel-cliche`
   (prose); `comment-register`, `naming`, `css-default`, `neon` (code).
3. For each, judge first whether the *rule* is right. If it fired on genuine
   voice, fix the lexicon and extend `CLEAN_PROBE`.
4. Otherwise rewrite the line, or mark `@style-ok` if deliberate.
5. If the lexicon changed, confirm `--self-test` still passes.
