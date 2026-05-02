Run `bash scripts/check-responsive-policy.sh` and report the result.

The script scans top-level files in `_sass/` (excluding `_responsive-policy.scss`) for raw `@media`, `@container`, or `@include breakpoint(...)` calls and fails if any are found — the canonical mixins live in `_sass/_responsive-policy.scss`.

If violations are reported, list each one as `file:line — pattern` and suggest the corresponding mixin from `_sass/_responsive-policy.scss`.
