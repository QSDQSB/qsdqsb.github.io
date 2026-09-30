---
name: web-design-guidelines
description: Review templates, SCSS and JS for whether every reader can reach and use the interface — keyboard, screen reader, reduced motion, phone, slow connection — without making the design plainer. Adapted from Vercel's Web Interface Guidelines to this Jekyll / SCSS / vanilla-JS site. Use when asked to "review my UI", "check accessibility", "audit design", "review UX", or "check the site against best practices"; whenever adding or changing an interactive control (button, link, input, dialog, lightbox, drawer, hidden-until-hover element) in `_includes/`, `_layouts/` or `assets/js/`; whenever a focus, hover, `outline` or looping-animation rule changes in `_sass/`. Does not judge prose — the house voice outranks the guidelines' copy rules.
argument-hint: <file-or-pattern>
---

# Web Design Guidelines

A review pass for how the interface *behaves* — can it be reached by
keyboard, does it announce itself, does it hold still for a reader who asked
it to, does it load without jumping. The other skills own how it *looks*
(`css-token-steward`), how it *reflows* (`responsive-layout-auditor`) and how
it *reads* (`house-style`); this one fills the gap between them.

## Access is added; the design stays

This is the rule above every rule below. The site is meant to be unusual —
a film dial instead of a filter menu, cards hidden until the pointer finds
them, a hero that breathes. A guideline that can only be satisfied by making
it ordinary is the guideline's failure, not the site's.

So every finding carries a fix that **leaves what a reader sees at rest
unchanged**. The fix shapes that pass:

- ARIA state or name (`aria-pressed`, `aria-expanded`, `role="status"`,
  visually-hidden text).
- A reveal on `:focus-visible` beside the existing `:hover`.
- A stop under reduced motion — for that reader only.
- An invisible hit area (`::after` with negative inset), `inert`,
  `tabindex="-1"`, `lang`, `overscroll-behavior`, a preconnect.
- A focus mark in the house's own material: the brass hairline,
  `outline: 2px solid rgba($intriguing-word-color, 0.6)` (`_sass/_map.scss`).

The fixes that never pass, whatever a rule says:

- Replacing a bespoke control with a standard one.
- Removing, shortening or taming signature motion for everyone.
- Adding visible chrome to satisfy a rule — pause buttons on the hero,
  arrows and dots on a swipe strip, labels on a glyph that was meant bare.
- Rewriting a layout animation as `transform` when that blurs a hairline,
  scales a glass edge or loses a morph.

If the only fix you can find is one of those, it is **not a finding**. Write
it under *Tensions* in the output — what the reader loses, what the design
would lose — and let the author decide.

## Provenance, and why this is not the upstream skill

Adapted from [`vercel-labs/agent-skills` → `web-design-guidelines`](https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines),
whose rules live in `vercel-labs/web-interface-guidelines/command.md`,
**pinned at `e3d624b`**. The upstream skill fetches that file on every run
and applies all of it. Here that would mean:

- **Rules nobody reviewed.** A remote file changing under you is a guard
  changing under you. Refresh deliberately: diff upstream against the pin,
  adopt what fits, move the pin.
- **False positives.** A third of the list is React, Next.js or Tailwind.
- **Flattening.** The trial below traced every would-be-plainer fix to a
  handful of upstream rules — they are listed under *Dropped*.

## Calibration — the first trial (2026-09-28)

Run across the whole site (Photobook, chrome, home and hero, map and
subscribe and cards), each candidate verified in context and sorted:

- **~28 real problems**, every one fixable without visible change: focus
  landing on invisible elements, a search whose suggestions vanish under
  the keyboard, silent copy and subscribe results, an infinite pulse with
  no reduced-motion stop, the wrong `theme-color`, no `color-scheme`.
- **13 would-be-flattening fixes**, all from four rules: *animate transform
  and opacity only* (7), *autoplay needs a pause control* (4), a literal
  *gesture needs a tap alternative* (1), an over-applied
  *overscroll-behavior* (1). All four are now dropped or rewritten.
- **~50 candidates that fell apart on inspection** — the replacement focus
  style lived three rules down, the JS added the ARIA at runtime, the
  include was never rendered. Verification is most of the work.

Two false claims in the first version of this page were caught by the
trial and are corrected below: `visual:audit` does **not** test reduced
motion, and there is **no** reader-facing motion toggle.

## What is already mechanical

Where a rule is deterministic it belongs in a script (CLAUDE.md → Guards).

- `transition: all` → `check-house-style.py` (`css-default`), blocking.
- `npm run visual:audit` → nothing moves under **`?motion=off`**. That is
  the kill switch for bots and screenshots, stamped only by the query or a
  bot user-agent (`_includes/head/custom.html`). It says nothing about a
  reader whose system asks for reduced motion — see *Motion*.
- Photobook `<img>` dimensions, `srcset`, `loading` → written by the photo
  pipeline, not by hand.

Everything else needs context, so it stays here. If a rule turns out to be
decidable without context, move it into a script and delete it from this
page.

## Before reporting anything

- **Is it rendered?** Check the include is reached and its branch taken.
  Dead code in the Minimal Mistakes fork (`breadcrumbs`, `comments`,
  `ticker-tape`, `archive-single-talk`'s grid, `_layouts/search.html`) is
  not a finding.
- **Is it handled elsewhere?** Search the SCSS for the same selector's other
  states, the parent's `:focus-within` / `:has(:focus-visible)`, and the JS
  for ARIA or key handlers added at runtime.
- **Who is hurt, and how?** Name the reader and what happens to them. If
  you cannot, leave it out (house policy: minimise false positives).

## Review — the rules that apply here

### Keyboard & focus

- Every interactive element is reachable and **visibly** focused. An
  `outline: none` is a finding only if the same state draws no replacement
  **that can be seen against its surface** — a 12%-ivory hairline on glass
  is not a replacement; a colour, border or background change a sighted
  reader would notice is. Focus should read at least as strongly as hover.
- **Hidden until hover.** An element at `opacity: 0` / `visibility` that the
  pointer reveals (tarot cards, the Photobook's corner mark, the collapsed
  masthead) must reveal on `:focus-visible` too — the focus ring inherits
  the zero opacity — or leave the tab order (`tabindex="-1"`, `inert`) while
  hidden. The secret stays a secret for the pointer.
- **Focus never falls to `<body>`.** When a container hides or empties — a
  blur timer clearing suggestions, a fold, Escape on a menu — send focus
  somewhere visible first. When script scrolls the page to a target (a
  random jump, a smooth anchor), move focus there too
  (`tabindex="-1"` + `.focus({ preventScroll: true })`).
- **Not a finding:** `outline: none` on a `tabindex="-1"` element focused by
  script (the Photobook lightbox mat) — nobody tabs to it.
- Prefer `:focus-visible` to `:focus` on links and buttons, so a click
  leaves no mark. Text inputs keep a visible `:focus` state — the caret
  alone is not one.
- A skip link to the main content, shown only on focus.
- `autofocus` only where one control is plainly the point of the view (the
  lightbox mat). Never on page load.

### Semantics & ARIA

- Actions are `<button>`, navigation is `<a href>`. A clickable `<div>` or
  `<span>` needs `role`, `tabindex="0"` and a key handler — and say which
  element it should have been.
- Toggles announce their state: `aria-expanded` on disclosure buttons (the
  greedy-nav overflow), `aria-pressed` on filter buttons (map tags).
- An `aria-label` that replaces visible text must contain it — a button
  reading "Got it" labelled "Dismiss this message" breaks voice control.
  Prefer no `aria-label` when the visible text already names the control.
- A widget role promises its keyboard contract: `role="listbox"` means
  arrow keys work. Either wire the keys or drop the role.
- Live results announce: copy confirmation, subscribe result, search
  count — `role="status"` or `aria-live="polite"`.
- One `<h1>` per page, headings in order; a decorative word card is a
  `<p>` or `<h2>`, styled as before.
- Content in another language carries `lang` (`zh` on the 中 panel of the
  bilingual switch), so screen readers voice it and CJK fonts resolve.
- Images carry `alt`; decorative ones take `alt=""`.
- The viewport meta never locks zoom — and neither does a custom gesture:
  a `touch-action: none` or `gesturestart` capture must not swallow a pinch
  aimed at text (the lightbox specs panel).

### Motion

Reduced motion is honoured **per component**, not by any global switch: CSS
through `@include responsive-reduced-motion` (`_sass/_responsive-policy.scss`),
JS through `window.QSD.motionOff()`. Nothing tests this mechanically.

- Every `infinite` or looping animation stops under
  `responsive-reduced-motion` — the avatar pulse, the tarot oscillation,
  a breathing entry. Everyone else keeps it.
- Every script-driven scroll or animation checks `QSD.motionOff()`:
  `behavior: QSD.motionOff() ? 'auto' : 'smooth'`; Leaflet's
  `zoomAnimation` / `fadeAnimation` / `animate` likewise.
- Motion is interruptible: an intro yields to scroll **and** to Tab; a
  second click never queues behind the first.
- **Stopping is the reader's system setting, never a widget.** Don't ask
  for pause controls on the hero or decorative loops.
- Animating layout properties (`height`, `inset`, `padding`,
  `aspect-ratio`) is **not** a finding by itself. Report it only with
  measured jank.

### Images & loading

- Hand-written raster `<img>` needs `width`/`height` or a CSS
  `aspect-ratio` box. SVGs sized by CSS are fine.
- Below the fold `loading="lazy"`; the first-screen image
  `fetchpriority="high"`, never lazy.
- Third-party CSS in `<head>` blocks first paint on every page (CMU Serif
  from cdnfonts): self-host it, or at least preconnect. The typeface stays.
- `<link rel="preconnect">` for `img.qsdqsb.com` where a page leads with a
  photograph.

### Forms

The subscribe slip and the search panel.

- A label or `aria-label`, the right `type`, an `autocomplete` value.
- Never block paste.
- Results and errors are announced (see *Semantics*); focus survives the
  form folding away.

### Touch

- Tap targets a finger can hit — about 24px — grown with an invisible
  `::after`, not a bigger pill.
- `overscroll-behavior: contain` on an overlay that scrolls **over** the
  page (search results, the map drawer, the lightbox). Not on panels whose
  scroll is meant to hand back to the page (the home reel).
- `-webkit-tap-highlight-color` set on purpose — the default grey rectangle
  over a round dial is noise.
- Native scroll with a hidden scrollbar is not a gesture; a swipe strip
  where every item is a button needs no arrows.

### Theming

- `color-scheme: dark` on `html` — scrollbars, autofill and native controls
  join the palette.
- `<meta name="theme-color">` equals `$background-color`.

### Typography in templates

Kramdown already typesets `...` and quotes in Markdown; this applies only to
literal text in `_includes/`, `_layouts/`, `_data/ui-text.yml` and JS
strings: `…` not `...`; `tabular-nums` where numbers line up in a column.

### Dropped from upstream, on purpose

Don't import these back without new evidence:

- **Animate `transform`/`opacity` only** — flattened 7 of 7 times in the
  trial: the dial's glass rim, the mount morph, the rail's crisp ticks, the
  cover card's breathing, the subscribe fold.
- **Autoplay needs pause/stop controls** — asks for player chrome on a
  cinematic hero. Replaced by the reduced-motion rule above.
- **Flex/grid over JS measurement**, **virtualise long lists** — would
  undo the greedy nav, the specs placement and the Photobook's
  place-holding re-filter.
- **Content & Copy** (Title Case, second person, active voice, specific
  button labels, placeholders ending in `…`) — the house voice decides.
- **Hydration**, controlled inputs, `nuqs`, `Intl.*` dates, URL-state for
  every toggle, `translate="no"`, safe areas without `viewport-fit=cover` —
  framework-only or noise here.

## Output

Group by file, `file:line`, terse. Every finding names who is hurt and a
fix from the passing shapes above. No preamble.

```text
## _sass/_subscribe.scss

_sass/_subscribe.scss:132 - input :focus clears outline, border, shadow; no :focus-within on the form — keyboard reader can't see the field has focus → brass border on .subscribe-slip__form:focus-within

## _sass/_archive.scss

_sass/_archive.scss:615 - tarot link opacity:0 until :hover — keyboard focus lands on an invisible link → add :focus-visible to the hover selector

## Tensions

_sass/_home.scss:141 - hero blobs loop >5s with no pause; the only stop is reduced motion — a pause control would make the hero a player. Author's call.
```

A fix that changes what the page looks like at all — even a focus-only
reveal — goes through `npm run visual:diff`, and through
`responsive-layout-auditor` if desktop and mobile-small would differ.
