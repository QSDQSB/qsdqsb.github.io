#!/usr/bin/env bash
# SessionStart hook: put the state of the plan in front of every session.
#
# A plan is forgotten the first time a session starts without it. This prints
# a few lines (the current stage, the owner's open calls, the findings inbox,
# the last changes, the rules) from _plan/, so local and cloud sessions alike
# begin from the same place. See _plan/decisions/0006.
#
# Always exits 0 and prints nothing if the plan or Node is missing: a hook that
# can fail a session start is a hook that gets removed.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR" || exit 0
[ -d _plan ] || exit 0
command -v node >/dev/null 2>&1 || exit 0
node scripts/check-plan.mjs --brief 2>/dev/null || true
exit 0
