#!/usr/bin/env bash
# Stop hook: at end-of-turn, fail (exit 2) if any newly-added variable in
# _sass/_variables.scss is single-use. Forces the issue to be addressed
# (inlined or marked '// @keep') before the turn yields.
#
# Exit codes:
#   0  Clean — no newly-added single-use variables.
#   2  Violations found — stderr is fed back to Claude.

set -uo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

if out=$(python3 scripts/check-single-use-variables.py --new-only 2>&1); then
  exit 0
fi

# Violation path. Echo the script output + a directive on stderr so the
# stop-hook surface feeds it back to Claude.
{
  echo "$out"
  echo
  echo "Inline these single-use variables at their callsite, or mark each"
  echo "definition with '// @keep' if intentional, before ending the turn."
} >&2
exit 2
