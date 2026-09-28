---
name: web-design-guidelines
description: Review templates, SCSS and JS against web-interface guidelines — accessibility, focus states, forms, motion, images, touch, theming — adapted from Vercel's Web Interface Guidelines to this Jekyll / SCSS / vanilla-JS site. Use when asked to "review my UI", "check accessibility", "audit design", "review UX", or "check the site against best practices"; whenever adding or changing an interactive control (button, link, input, dialog, lightbox, drawer) in `_includes/`, `_layouts/` or `assets/js/`; and whenever a focus, hover or `outline` rule changes in `_sass/`. Does not judge prose — the house voice outranks the guidelines' copy rules.
argument-hint: <file-or-pattern>
---

# Web Design Guidelines

A review pass for how the interface *behaves* — can it be reached by
keyboard, does it announce itself, does it hold still for a reader who asked
it to, does it load without jumping. The other skills own how it *looks*
(`css-token-steward`), how it *reflows* (`responsive-layout-auditor`) and how
it *reads* (`house-style`); this one fills the gap between them.

## Provenance, and why this is not the upstream skill

Adapted from [`vercel-labs/agent-skills` → `web-design-guidelines`](https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines),
whose rules live in `vercel-labs/web-interface-guidelines/command.md`,
**pinned at `e3d624b`**.

The upstream skill fetches that file fresh on every run and applies all of
it. Here that would mean three things this repo refuses elsewhere:

- **Rules nobody reviewed.** A remote file changing under you is a guard
  changing under you. Refresh deliberately: diff upstream against the pin,
  adopt what fits, move the pin.
- **False positives by the dozen.** Roughly a third of the upstream list is
  React, Next.js or Tailwind (`onClick`, `useState`, hydration, `nuqs`,
  `focus-visible:ring-*`). Applied to Liquid and SCSS it cries wolf, and a
  guard that cries wolf gets muted (CLAUDE.md → Guards).
- **Copy rules that contradict the house voice.** Title Case, "second
  person, avoid first person", "active voice", "`&` over *and*" — on a
  first-person personal blog these are wrong, not strict. Prose belongs to
  `house-style` and `sound-like-qsd`.

## What is already mechanical

Where a rule is deterministic it belongs in a script (CLAUDE.md → Guards).
Of the upstream list, the context-free rules are already guarded, so this
skill adds no checker of its own:

- `transition: all` → `check-house-style.py` (`css-default`), blocking at
  end of turn.
- `prefers-reduced-motion` / `html.motion-off` → `npm run visual:audit`.
- Photobook `<img>` dimensions, `srcset`, `loading` → written by the photo
  pipeline, not by hand.

Everything else needs context — an `outline: none` is fine when the same
state draws a border — so it stays in the review below rather than in a
script that would guess. If a rule here turns out to be decidable without
context, move it into a script and delete it from this page.

## Review — the rules that apply here

Read the files, check each rule, report in the format at the end. A rule
earns a finding only when the context confirms it; when unsure, leave it
out (house policy: minimise false positives).

### Keyboard & focus

- Every interactive element is reachable and **visibly** focused. An
  `outline: none` / `outline: 0` is a finding **only if** the same state
  sets no replacement — a `box-shadow`, `border-color`, `background` or
  `color` change counts. Check `:focus-visible` *and* `:focus`, and the
  parent's `:focus-within` / `:has(:focus-visible)`.
- **Not a finding:** `outline: none` on a `tabindex="-1"` element focused by
  script (the Photobook lightbox mat) — nobody tabs to it.
- Prefer `:focus-visible` to `:focus` for buttons and links, so a click
  draws no ring. Text inputs may keep `:focus`: the caret alone is not an
  indicator, so they still need a visible state.
- Compound controls (the Photobook dial, the map drawer) surface focus on
  the group with `:focus-within` / `:has(:focus-visible)`.
- The sticky masthead and the Photobook bar must not cover the focused
  element — give anchor targets `scroll-margin-top`.
- `autofocus` only where one control is plainly the point of the view
  (a dialog opening — the Photobook lightbox's mat). Never on page load.

### Semantics & ARIA

- Actions are `<button>`, navigation is `<a href>`. A `<div>` or `<span>`
  with a click listener in `assets/js/` is a finding unless it also carries
  `role`, `tabindex="0"` and a key handler — and even then, say which
  element it should have been.
- Icon-only buttons and links carry `aria-label`; the icon itself
  (`<i class="fa…">`, inline SVG) carries `aria-hidden="true"`.
- Images carry `alt`. Decorative ones — hero backdrops, emblems, the cover
  behind a title that already names the page — take `alt=""`, not a
  restated title.
- Live updates (copy-to-clipboard confirmation, subscribe result, search
  results count) announce via `aria-live="polite"`.
- One `<h1>` per page, headings in order; a skip link to main content.
- The viewport meta never carries `user-scalable=no` or `maximum-scale=1`:
  readers who zoom are locked out.

### Motion

Already covered, so don't re-audit — confirm and point:

- `prefers-reduced-motion` and `html.motion-off` are guaranteed by
  `npm run visual:audit`. Flag a new animation only if it is missing from
  that audit's reach (JS-driven motion that does not check
  `window.QSD.motionOff()`).
- Animate `transform` and `opacity`; anything that triggers layout
  (`top`, `height`, `inset`, `margin`) needs a reason — the Photobook
  lightbox's `inset` transition has one.
- Motion is interruptible: a second click mid-transition must not queue
  behind the first.
- Autoplaying motion over 5 s beside other content (the hero parallax,
  the opening scene) needs a way to stop it; `motion-off` is that way —
  confirm the toggle reaches it.

### Images & loading

The Photobook pipeline already writes `width`, `height`, `srcset`,
`loading="lazy"` and `fetchpriority="high"` for the cover — don't re-flag
it. For hand-written `<img>` in `_includes/` / `_layouts/`:

- Raster images need `width` and `height` (or an `aspect-ratio` in CSS) so
  they do not shift layout. SVGs sized by CSS are fine.
- Below the fold: `loading="lazy"`. The one image that *is* the first
  screen: `fetchpriority="high"`, never lazy.
- `<link rel="preconnect">` for `img.qsdqsb.com` wherever a page leads with
  a photograph.

### Forms

The subscribe slip and the search panel are the forms here.

- Each input has a `<label>` or `aria-label`, a meaningful `name`, the right
  `type` (`email`, `search`) and an `autocomplete` value.
- Never block paste.
- `spellcheck="false"` on email fields.
- The submit button stays enabled until the request starts, then shows
  that it is working. Errors appear next to the field and take focus.

### Touch

- `touch-action: manipulation` on tap targets that must not wait for a
  double-tap zoom (lightbox zones, the dial).
- `overscroll-behavior: contain` on anything that scrolls over the page:
  the lightbox, the map drawer, the search panel.
- A gesture (swipe in the lightbox, drag on the dial) always has a tap and
  a key alternative.
- `-webkit-tap-highlight-color` set on purpose, not left to the browser's
  blue.

### Theming

The site is dark; the browser should be told so.

- `color-scheme: dark` on `html`, so scrollbars, form controls and the
  autofill tint match.
- `<meta name="theme-color">` equals the page background
  (`$background-color` in `_sass/_variables.scss`).
- Native `<select>`: explicit `background-color` and `color`.

### Typography in templates

Kramdown already turns `...` and straight quotes into `…` and curly quotes
in Markdown, so this applies only to literal text in `_includes/`,
`_layouts/`, `_data/ui-text.yml` and JS strings:

- `…` not `...`; loading states end in `…` ("Loading…").
- `font-variant-numeric: tabular-nums` where numbers line up in a column
  (the photo count, EXIF rows, map totals).
- `text-wrap: balance` on display headings.

### Dropped from upstream, on purpose

Not reviewed here, so don't import them back without a reason:

- **Hydration Safety**, controlled inputs, `nuqs`, virtualisation of
  `.map()` — React-only; there is no framework.
- **Content & Copy** (Title Case, second person, active voice, numerals,
  `&` for *and*) — the house voice decides; see `house-style`.
- **Locale & i18n** via `Intl.*` — dates are rendered by Liquid at build
  time, and the bilingual toggle has its own conventions.
- **URL reflects state** — worth it for filters that exist; don't invent
  query params for a static page.
- **Safe areas** — covered by `responsive-layout-auditor` at mobile-small.

## Output

Group by file, `file:line`, terse. State the issue and the location; explain
only when the fix is not obvious. No preamble.

```text
## _sass/_subscribe.scss

_sass/_subscribe.scss:132 - input :focus drops outline, border and shadow — no focus indicator
_sass/_toc-progress.scss:22 - :focus not :focus-visible — ring on click

## _includes/head/custom.html

_includes/head/custom.html:47 - theme-color #f0f0f0 ≠ $background-color #151515

## _includes/photobook/frame.html

✓ pass
```

A finding that would change what the page *looks like* — a new focus ring,
a different browser-chrome colour — is a visible change: it goes through
`npm run visual:diff`, and through `responsive-layout-auditor` if desktop
and mobile-small would differ.
