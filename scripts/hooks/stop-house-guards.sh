#!/usr/bin/env bash
# Stop hook: at end-of-turn, block (exit 2) if this session introduced
# house-style violations, a stale JS bundle, or new `!important` declarations.
#
# All three judge only what CHANGED in the working tree — never the existing
# backlog. A guard that reports pre-existing debt every turn gets ignored
# within a day, which is worse than no guard at all.
#
# Runs in ~0.6s total. Each check is independent; all run so the turn gets
# one consolidated report rather than one problem per turn.
#
# Exit codes:
#   0  Clean.
#   2  Violations — stderr is fed back to Claude to address before yielding.

set -uo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR" || exit 0

report=""
failed=0

run_guard() {
  local label="$1"; shift
  local out
  if ! out=$("$@" 2>&1); then
    report+="── ${label} ──"$'\n'"${out}"$'\n\n'
    failed=1
  fi
}

run_guard "House style" python3 scripts/check-house-style.py --new-only
run_guard "JS bundle sync" python3 scripts/check-js-sync.py
run_guard "!important ratchet" python3 scripts/check-important-ratchet.py

[ "$failed" -eq 0 ] && exit 0

{
  printf '%s' "$report"
  echo "Address these before ending the turn. Each is scoped to changes made"
  echo "in this session, so none of it is pre-existing debt."
} >&2
exit 2
