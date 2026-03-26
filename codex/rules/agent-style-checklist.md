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
11. If any material implementation choice confidence is below `0.90`, obtain explicit user confirmation (`CONF-CONFIRM-001`) before proceeding.
12. Confirm no blocked literal theme values were introduced in component SCSS.
13. If variables are removed/deprecated from `_sass/_variables.scss`, prove zero references across `_sass/**` after replacement (`JAN-001`).
14. Replace deprecated variable usage in other SCSS files with canonical/unified names where available; do not stop at token-file edits.
15. Generate and review replacement value-delta report; if relative delta `>= 20%` or absolute delta `>= 0.25rem`, obtain explicit confirmation (`DELTA-CONFIRM-001`) before mutation.
16. Run `bundle exec jekyll build` and explicitly report exact status (`JAN-003`), even when blocked by upstream non-CSS errors.
17. Report:
   - reused tokens/patterns
   - new variables introduced (if any) and necessity rationale
   - remaining magic numbers and why they are unavoidable

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
