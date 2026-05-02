---
name: css-scss-janitor
description: Cleanup workflow for CSS/SCSS entropy in the `_sass/` tree — inlining single-use variables back to their callsites, deduplicating near-identical tokens, and replacing magic numbers with existing shared scales. Use whenever the user asks for SCSS cleanup, dedup, refactor, consolidation, simplification, or "tidying up" — and proactively when a diff introduces several near-duplicate tokens or repeated literals. Does not redesign visual behaviour; reduces entropy while preserving intent.
---

# CSS/SCSS Janitor

`_sass/_variables.scss` has accumulated drift: many entries are used in exactly one selector in one file (e.g. `$nav-action-sweep-duration`, `$overlay-hero-mobile-aspect-ratio`, `$search-panel-offset-y`). Those are component-specific knobs masquerading as design tokens. They belong inline at their callsites — not in the global token file. This skill cleans that up while leaving the genuinely shared scales (type, breakpoints, spacing, surfaces, motion) intact.

## What to look for

**Primary target — single-use variables.** Variables defined in `_variables.scss` (or any `_sass/*.scss` partial) that are referenced in exactly one selector in one file. These are the bulk of the entropy. Inline them at the callsite and remove the variable definition.

**Secondary targets:**
- Near-identical variables encoding the same intent (`$radius-card: 8px` vs `$panel-radius: 8px`) — collapse to one canonical name.
- Repeated literal values across multiple files that should share a token — promote into the global scale.
- Magic numbers that map cleanly to an existing scale (`$type-size-*`, breakpoint scale, `$global-transition-time`, etc.) — use the scale.
- Variables defined but never referenced — delete.
- Deeply nested selectors that flatten safely.
- Duplicate animation, spacing, blur, or shadow definitions hiding under different names.

## Working principles

**Variables are for multi-use.** Promote on the second use, not the first. Single-use values stay inline. When in doubt, count the references — if it's one, it shouldn't be a variable.

**Reuse, merge, or delete before adding.** Cleanup that ends with more variables than it started usually missed the point. The exception is unifying genuinely repeated literals across multiple files into one shared token.

**Prefer deletion.** Each one-off knob inflates the design-system surface area for no reusable benefit. Inlining feels like "losing structure" but it's actually restoring it — the structure now lives in the small set of genuinely shared tokens, instead of being diluted across hundreds of single-use entries.

**Keep the most semantic name** when collapsing duplicates. `$radius-md` reads better than `$panel-corner-3`. The token's name should encode its design role, not the value or a single consumer.

**Preserve documented public theme hooks.** If a token is referenced from a theme override or documented as customisable, don't remove it without compatibility planning.

## Pairing

If you need a comprehensive read-only audit *before* deciding what to clean up, invoke the `scss-auditor` agent first — it sweeps the whole `_sass/` tree in its own context window and returns a structured punch list grouped by component family. Then come back here for the cleanup pass.

For a quick check of just newly-added variables, run `python3 scripts/check-single-use-variables.py --new-only` (or `/check-vars` for the full file).

## Execution sequence

1. **Build a single-use map.** For every variable in `_variables.scss` (and in any `_sass/*.scss` that defines variables), grep all of `_sass/**` to count references. Anything with exactly one reference is a primary inlining candidate. Anything with zero references is a deletion candidate.
2. **Diff `_sass/_variables.scss`** and build a map of any tokens being renamed or removed in this pass.
3. **For each deprecated/inlined token**, search **all** of `_sass/**` before mutating anything — touched files plus everything else. Janitor mistakes always come from incomplete traces.
4. **Replace deprecated usages** in this priority order:
   - **Inline the literal at the callsite** when the variable is single-use (the dominant case here).
   - **Canonical unified token** when consolidating near-duplicates.
   - **Existing semantic token from a shared scale** when the value maps to one.
   - **Literal kept verbatim** only when no safe mapping exists and the visual delta is minor (see below).
5. After mutation, re-trace the deprecated tokens and prove zero references remain.
6. Run `bundle exec jekyll build` and report the exact result. If the build is blocked by an unrelated upstream error, say so and note that CSS-specific checks still ran.
7. Run `bash scripts/check-responsive-policy.sh` and include the result — janitor work easily introduces raw `@media` calls that bypass the breakpoint mixins.

## Visual-delta gate

Replacement values can drift the design subtly. Treat a replacement as a *major* change when either:
- relative delta ≥ 20%, or
- absolute delta ≥ 0.25rem (or domain equivalent — e.g. timing changes ≥ 0.1s).

Major deltas need explicit user confirmation before mutation. Inlining a single-use variable is *not* a value change — there's no delta — so no confirmation needed for those.

## Output

- **Audit summary** — counts: single-use variables, orphaned variables, near-duplicate groups, magic-number hotspots, highest-entropy modules.
- **Cleanup plan** — what gets inlined (the primary action), what merges, what maps to existing shared scales, what stays and why.
- **Implementation** — apply changes in small reviewable steps. Group inlinings by component file so reviewers can sanity-check one component at a time.
- **Final report** — variables removed via inlining, variables merged, exceptions retained, areas requiring human design judgement.
