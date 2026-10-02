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

# Said once, not for ever. When the turn is already going on because a stop hook sent it back,
# let it end: what is left may be another session's work in this checkout, or an unattended
# run's that is told to fix nothing, and a hook that refuses every time never lets it stop.
# Read with a limit: run by hand from a tool, stdin is open and nothing ever comes.
payload=""; [ -t 0 ] || IFS= read -r -t 2 -d '' payload || true
case "$payload" in *'"stop_hook_active":true'*|*'"stop_hook_active": true'*) exit 0 ;; esac

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
