#!/usr/bin/env bash
# PostToolUse hook: after a file edit, run the checks that apply to that file
# and print contextual reminders for the follow-up steps that can't be checked.
#
# Two kinds of output:
#   - CHECKS   — a real script runs and reports. Previously these were only
#                *suggested* in prose ("consider running…"), which meant they
#                effectively never ran.
#   - NUDGES   — reminders for steps with no mechanical check (thumbnail
#                generation, geocoding), where the side effect is a build
#                artifact rather than something inspectable in the tree.
#
# Reads the hook's JSON payload from stdin to extract the edited file path.
# Always exits 0 — PostToolUse output is informational. The blocking versions
# live in the Stop hook (see stop-house-guards.sh).

set -uo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

file=$(python3 -c "import json,sys; print(json.load(sys.stdin).get('tool_input',{}).get('file_path',''))" 2>/dev/null || echo "")

[ -z "$file" ] && exit 0

cd "$ROOT_DIR" || exit 0

# --- SCSS -------------------------------------------------------------------
case "$file" in
  *_sass/vendor/*)
    # Third-party code — exempt from token, responsive and style policies.
    ;;
  *_sass/*.scss)
    bash scripts/check-responsive-policy.sh 2>&1 | sed 's/^/[responsive] /'
    python3 scripts/check-important-ratchet.py 2>&1 \
      | grep -v '^OK' | sed 's/^/[!important] /'
    python3 scripts/check-house-style.py --new-only --code 2>&1 \
      | grep -v '^OK' | sed 's/^/[house-style] /'
    ;;
esac

# --- JS ---------------------------------------------------------------------
case "$file" in
  *assets/js/vendor/*|*assets/js/main.min.js)
    ;;
  *assets/js/*.js)
    python3 scripts/check-js-sync.py 2>&1 | grep -v '^OK' | sed 's/^/[js-sync] /'
    python3 scripts/check-house-style.py --new-only --code 2>&1 \
      | grep -v '^OK' | sed 's/^/[house-style] /'
    ;;
esac

# --- Templates --------------------------------------------------------------
case "$file" in
  *_includes/*.html|*_layouts/*.html)
    python3 scripts/check-house-style.py --new-only --code 2>&1 \
      | grep -v '^OK' | sed 's/^/[house-style] /'
    ;;
esac

# --- Content ----------------------------------------------------------------
case "$file" in
  *_posts/*.md|*_voyage/*.md|*_subvoyage/*.md|*_pages/*.md)
    python3 scripts/check-house-style.py --new-only --prose 2>&1 \
      | grep -v '^OK' | sed 's/^/[house-style] /'
    # Coverage only — reports which pages still owe a hand-written
    # seo_description. Non-blocking by design: a new page legitimately
    # lands before its metadata does.
    python3 scripts/check-seo-descriptions.py 2>&1 \
      | grep -E '^(❌|⚠️).*gap|gap\(s\) need' | sed 's/^/[seo] /'
    # Deterministic contract validation — required keys, gallery_name
    # resolution, map: shapes, parent/child placement. Scoped to this file.
    node scripts/check-frontmatter.js "$file" 2>&1 \
      | grep -v '^OK' | sed 's/^/[frontmatter] /'
    ;;
esac

# --- The lexicon itself -----------------------------------------------------
# Editing the word list is exactly when a false positive gets introduced, so
# re-run both probes right then rather than waiting to discover it in use.
case "$file" in
  *scripts/check-house-style.py)
    python3 scripts/check-house-style.py --self-test 2>&1 | sed 's/^/[lexicon] /'
    ;;
esac

# --- Nudges: steps with no mechanical check --------------------------------
case "$file" in
  *_data/maps/*.yml|*_data/maps/*.yaml)
    echo "⚠️  Map dataset edited — run \`npm run geocode\` before building so assets/maps/ stays in sync."
    ;;
esac

case "$file" in
  *gallery/*/*)
    echo "💡 Gallery image edited/added — run \`npm run generate:gallery\` if this is a new file."
    ;;
esac

case "$file" in
  */_voyage/*.md|*/_subvoyage/*.md)
    echo "💡 Voyage frontmatter touched — if \`gallery_name\`, \`subgalleries\` or \`map:\` changed, run \`npm run geocode\`."
    ;;
esac

exit 0
