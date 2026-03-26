# Agent Style Checklist

Mandatory checklist for CSS/theme and responsive modifications.

1. Identify existing selector candidates in `_sass/*.scss`.
2. Map changed declarations to existing semantic-scale tokens first (`space`, `radius`, `shadow`, `type`, key tones).
3. Attempt reuse/extension of existing class first.
4. If missing token, run dedup check and only then add/extend token in `_sass/_variables.scss`.
5. Apply token-backed updates.
6. Create a new class only if existing-selector path is insufficient.
7. If a new class is added, document rationale:
   - selectors evaluated
   - insufficiency reason
   - tokens used
8. Validate responsive behavior at desktop and mobile-small.
9. Detect any visual desktop/mobile divergence.
10. If divergence exists, obtain explicit user confirmation (`RESP-CONFIRM-001`) before proceeding.
11. Confirm no blocked literal theme values were introduced in component SCSS.

## Required Change Note Snippet (new selector)

```markdown
### New Selector Rationale
- Existing selectors reviewed: ...
- Why reuse/extension was insufficient: ...
- Tokens used from `_sass/_variables.scss`: ...
- Regression risk considered: low|medium|high
```

## Required Responsive Confirmation Snippet (if divergence exists)

```markdown
### Responsive Divergence Confirmation
- divergence_detected: true
- breakpoint_profile: desktop vs mobile-small
- confirmation_reference: <link or quote from user approval>
```
