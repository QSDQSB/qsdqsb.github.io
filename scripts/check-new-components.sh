#!/usr/bin/env bash
# Names the component families a file adds under _sass/ (top-level `.block` or `.block__element`
# selectors that HEAD does not have), as a reminder to look in _sass/_components.scss and
# _docs/components.md first. A nudge, never a failure: a genuinely new piece is allowed, it just
# has to be a decision. Exempt: vendor, and _components.scss itself (where new pieces belong).
#
# Usage: scripts/check-new-components.sh <file.scss>     (exit 0 always)

set -uo pipefail
file="${1:-}"
case "$file" in ""|*_sass/vendor/*|*_sass/_components.scss) exit 0 ;; esac
[ -f "$file" ] || exit 0

tops() { grep -oE '^\.[a-z][a-z0-9-]*' | sort -u; }
now=$(tops < "$file")
before=$(git show "HEAD:${file#"$(git rev-parse --show-toplevel)/"}" 2>/dev/null | tops)
new=$(comm -23 <(printf '%s\n' "$now") <(printf '%s\n' "$before") | grep -v '^$')
[ -z "$new" ] && exit 0
echo "New component famil$( [ "$(printf '%s\n' "$new" | wc -l)" -gt 1 ] && echo ies || echo y) in $(basename "$file"): $(echo $new)"
echo "  Before styling it here: is it an eyebrow, title, lede, onward links, pill, quiet icon button, glass or wash? Those live in _sass/_components.scss (catalogue: _docs/components.md)."
exit 0
