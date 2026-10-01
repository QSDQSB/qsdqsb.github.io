#!/usr/bin/env bash
# The gate: every mechanical check the site has, run in one pass with one verdict.
#
# The hooks run a few of these per edit and the rest were run when someone
# remembered. A change is not ready for the owner until this passes; the
# site-reviewer agent (.claude/agents/site-reviewer.md) runs it first and
# adds the judgement a script cannot: does it follow the plan, the vocabulary
# and the house's standing calls (_plan/).
#
#   bash scripts/gate.sh            # fast: the static checks, a few seconds
#   bash scripts/gate.sh --full     # + seeded build, pixel diff, motion audit,
#                                   #   reader journeys, iPhone overflow (minutes)
#
# --full builds `_site/` with visual:build, so stop the dev server first (it
# writes the same directory). Each check judges changes vs HEAD where it can,
# as the hooks do, so the backlog never fails a change that did not touch it.
#
# Exit codes: 0 every check passed · 1 a check failed · 2 usage problem

set -uo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR" || exit 2

mode="fast"
case "${1:-}" in
  "" | --fast) ;;
  --full) mode="full" ;;
  *) echo "Usage: bash scripts/gate.sh [--fast|--full]" >&2; exit 2 ;;
esac

passed=0
failed=0
skipped=0
report=""

check() {
  local label="$1"; shift
  local out
  if out=$("$@" 2>&1); then
    printf '✓  %s\n' "$label"
    passed=$((passed + 1))
  else
    printf '✗  %s\n' "$label"
    report+="── ${label} ──"$'\n'"$(printf '%s' "$out" | tail -n 25)"$'\n\n'
    failed=$((failed + 1))
  fi
}

skip() {
  printf '–  %s (skipped: %s)\n' "$1" "$2"
  skipped=$((skipped + 1))
}

check "Unit tests"               npm test --silent
check "JS bundle in sync"        python3 scripts/check-js-sync.py
check "!important ratchet"       python3 scripts/check-important-ratchet.py
check "Breakpoint policy"        bash scripts/check-responsive-policy.sh
check "Single-use variables"     python3 scripts/check-single-use-variables.py --new-only
check "House style"              python3 scripts/check-house-style.py --new-only
check "Frontmatter contracts"    node scripts/check-frontmatter.js
check "Gallery integrity"        node scripts/check-gallery-integrity.js
check "The plan"                 node scripts/check-plan.mjs

if [ "$mode" = "full" ]; then
  if out=$(npm run --silent visual:build 2>&1); then
    printf '✓  %s\n' "Seeded build"
    passed=$((passed + 1))
    check "Pixel diff"           npm run --silent visual:diff
    check "Motion-off audit"     npm run --silent visual:audit
    check "Reader journeys"      node scripts/check-journeys.mjs

    # check-mobile-overflow wants a served site; serve the build for its run only.
    port=4173
    python3 -m http.server "$port" --bind 127.0.0.1 --directory _site >/dev/null 2>&1 &
    server_pid=$!
    trap 'kill "$server_pid" 2>/dev/null' EXIT
    sleep 1
    check "iPhone overflow (WebKit)" node scripts/check-mobile-overflow.mjs --base "http://127.0.0.1:${port}"
    kill "$server_pid" 2>/dev/null
    trap - EXIT
  else
    printf '✗  %s\n' "Seeded build"
    report+="── Seeded build ──"$'\n'"$(printf '%s' "$out" | tail -n 25)"$'\n\n'
    failed=$((failed + 1))
    skip "Pixel diff" "no build"
    skip "Motion-off audit" "no build"
    skip "Reader journeys" "no build"
    skip "iPhone overflow (WebKit)" "no build"
  fi
fi

echo
if [ "$failed" -eq 0 ]; then
  if [ "$mode" = "fast" ]; then
    echo "GATE: PASS (fast) — ${passed} checks. A change to _sass/, _layouts/, _includes/ or assets/js/ also needs --full."
  else
    echo "GATE: PASS (full) — ${passed} checks."
  fi
  exit 0
fi

printf '%s' "$report"
echo "GATE: FAIL — ${failed} of $((passed + failed)) checks."
exit 1
