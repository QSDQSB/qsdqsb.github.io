# Agent Style Checklist

Mandatory checklist for CSS/theme and responsive modifications.

1. Identify existing selector candidates in `_sass/*.scss`.
2. Attempt reuse/extension of existing class first.
3. If missing token, add/extend token in `_sass/_variables.scss`.
4. Apply token-backed updates.
5. Create a new class only if existing-selector path is insufficient.
6. If a new class is added, document rationale:
   - selectors evaluated
   - insufficiency reason
   - tokens used
7. Validate responsive behavior at desktop and mobile-small.
8. Detect any visual desktop/mobile divergence.
9. If divergence exists, obtain explicit user confirmation (`RESP-CONFIRM-001`) before proceeding.
10. Confirm no blocked literal theme values were introduced in component SCSS.

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
