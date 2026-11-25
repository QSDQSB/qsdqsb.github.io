#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

TARGETS=()
while IFS= read -r file; do
  TARGETS+=("$file")
done < <(find _sass -maxdepth 1 -name "*.scss" ! -name "_responsive-policy.scss" | sort)

if [ ${#TARGETS[@]} -eq 0 ]; then
  echo "No SCSS files found for responsive policy check."
  exit 0
fi

PATTERN='@include breakpoint\(|@media[[:space:]]*\(|@container[[:space:]]*\('

# grep, not rg: rg is not on every machine, and a missing tool must never read as "clean".
status=0
grep -nE "$PATTERN" "${TARGETS[@]}" >/tmp/responsive_policy_violations.txt || status=$?
if [ "$status" -eq 0 ]; then
  echo "Responsive policy violations detected. Use mixins from _sass/_responsive-policy.scss:"
  cat /tmp/responsive_policy_violations.txt
  rm -f /tmp/responsive_policy_violations.txt
  exit 1
elif [ "$status" -ge 2 ]; then
  echo "Responsive policy check could not run (grep exit $status)." >&2
  exit 2
fi

rm -f /tmp/responsive_policy_violations.txt
echo "Responsive policy check passed."
