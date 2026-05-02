---
name: css-token-steward
description: Token-first CSS/SCSS authoring discipline for this Jekyll site. Use whenever editing or reviewing any file under `_sass/`, whenever a colour/shadow/gradient/radius/timing literal is being added or changed, and whenever the user mentions theme variables, design tokens, or `_sass/_variables.scss`. Use even if the user doesn't explicitly say "tokens" — any change touching theme values triggers this. Use also when the user is about to add a new entry to `_variables.scss`, since this skill enforces the multi-use rule that decides whether the entry belongs there at all.
---

# CSS Token Steward

## The core rule

**Variables in `_sass/_variables.scss` exist for multi-use.** If a value is used in exactly one place, it belongs inline at that place — not in the token file. The token file encodes reusable design decisions (the type scale, the spacing rhythm, the surface tones, the breakpoints, the motion timings shared across components). It is not a parking lot for component-specific knobs.

This site has historical drift in the other direction — the latter half of `_variables.scss` contains many entries like `$nav-action-sweep-duration`, `$overlay-hero-mobile-aspect-ratio`, `$search-panel-offset-y` that are used in exactly one selector in one file. Those don't belong in the token file. They expand the design-system surface area without adding reusability, and they make every theme change harder to reason about.

**Promote on the second use, not the first.** Default to inline. When you find yourself reaching for the same value in a second location, *that's* when it earns a token.

## What to do when a theme value enters a component file

1. **Does an existing token already cover it?** Grep `_sass/_variables.scss` for the value or its near-neighbours. The shared scales (`$type-size-*`, `$small`/`$medium`/etc breakpoints, `$global-transition-time`, the surface colours, `$border-radius`) cover most cases.
2. **If yes — use the token.** Replace the literal.
3. **If no — leave the value inline at the callsite.** Don't preemptively create a token. Single-use literals are not a violation; single-use *variables* are.
4. **Promote later, only when the value gets used a second time.** When that happens, choose a name that encodes the *role*, not the *value* (e.g. `$shadow-floating`, not `$shadow-rgba-022`).

## When a new entry in `_variables.scss` is justified

All of the following must be true:

- The value is used in **two or more places** today, or extends a global scale that is already shared across many components (type scale, breakpoint scale, spacing rhythm, motion timing, surface tones).
- The name encodes a design role, not a value or a single component's name. `$shadow-soft` good. `$nav-action-sweep-duration` bad.
- A reasonable future change to that design role would propagate sensibly to all callsites — the value is a shared decision, not a coincidence.

If any of those fails, the value belongs inline.

## Anti-patterns to flag

- **Single-use variables.** Used in exactly one selector in one file. Inline them.
- **Component-named knobs.** `$nav-foo-x`, `$search-panel-offset-y`, `$overlay-hero-mobile-aspect-ratio`. Even if used twice within the same component, it's almost always cleaner to keep these inline unless the value is also referenced from another component's SCSS.
- **Renaming a literal as a token.** `$smoke-violet-7a: #7a6f88` — a name describing its colour value rather than its design role. Don't do this.
- **Preemptive tokens.** "I might reuse this later." If you do reuse it, promote it then. Until then it's noise.
- **Raw theme literals where a shared scale exists.** Hex/rgb/hsl colours, timings, sizes that should map to existing scales. Use the scale.

## Vendor exemption

`_sass/vendor/**` is third-party code. Don't enforce token policy there.

## Output

Report findings as PASS / WARN / FAIL with file:line evidence and concrete remediation.

- For literals that should use an existing token: name the token.
- For new variables you added: justify with the multi-use rule. State the second-or-Nth callsite. If you can't, the variable shouldn't exist — keep the value inline.
- For existing single-use variables encountered during the change: flag as cleanup candidates (don't necessarily fix in this PR, but surface them).
