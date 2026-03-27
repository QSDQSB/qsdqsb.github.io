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

PATTERN='@include breakpoint\(|@media\s*\(|@container\s*\('

if rg -n "$PATTERN" "${TARGETS[@]}" >/tmp/responsive_policy_violations.txt 2>/dev/null; then
  echo "Responsive policy violations detected. Use mixins from _sass/_responsive-policy.scss:"
  cat /tmp/responsive_policy_violations.txt
  rm -f /tmp/responsive_policy_violations.txt
  exit 1
fi

rm -f /tmp/responsive_policy_violations.txt
echo "Responsive policy check passed."
