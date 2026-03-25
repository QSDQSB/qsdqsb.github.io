# Design Language Contract

## Tone and Identity
- Dark, editorial, boutique interface.
- Minimalist and modern layout.
- Emotional tone: existentialist / romantic / poetic with slight sorrow.
- Visual hierarchy: typography-led, generous negative space, strict grid, quiet separators.

## Typography Governance
- Multi-family system is allowed, but role mapping is mandatory:
  - Display/editorial headings: Didot/Playfair family roles.
  - Utility/meta/UI labels: Barlow family roles.
  - Body/caption roles must stay consistent per module.
- Avoid ad hoc `font-family` declarations in component selectors without role justification.

## Color Governance
- Base: near-black, glass-lite surfaces.
- Accent policy: section-level accent families are allowed, but must remain muted and melancholic.
- Preferred accent families: oxblood, antique gold, verdigris, lapis, smoke-violet, ivory highlights.
- No neon drift for default thematic surfaces.

## Motion Governance
- Apple-smooth baseline: short eased transitions, calm micro-reveals.
- Cinematic exceptions are allowed only for explicit hero/landing contexts.
- Always respect `prefers-reduced-motion`.

## Material Governance
- Glassmorphism is a subtle depth cue, not decoration.
- Use restraint on blur/transparency/specular highlights.

## CSS Theme Rule Link
All design implementation must follow `css-theme-governance.md`:
- token-first via `_sass/_variables.scss`
- existing-class-first before adding selectors
- documented rationale for any new class
