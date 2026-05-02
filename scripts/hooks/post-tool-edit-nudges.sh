#!/usr/bin/env bash
# PostToolUse hook: print contextual reminders after file edits that
# routinely produce silent breakage if a follow-up step is forgotten.
#
# Reads the hook's JSON payload from stdin, extracts the edited file path,
# and prints a nudge if the path matches a known pattern.
#
# Always exits 0 — these are informational, never blocking.

set -uo pipefail

file=$(python3 -c "import json,sys; print(json.load(sys.stdin).get('tool_input',{}).get('file_path',''))" 2>/dev/null || echo "")

[ -z "$file" ] && exit 0

case "$file" in
  *assets/js/_main.js)
    echo "⚠️  _main.js was edited — run \`npm run build:js\` before committing to keep main.min.js in sync."
    ;;
  *_sass/vendor/*)
    # Vendor files are exempt from token/responsive policies.
    ;;
  *_sass/*.scss)
    echo "💡 SCSS edited — consider running \`bash scripts/check-responsive-policy.sh\` to catch raw breakpoint usage."
    ;;
esac

case "$file" in
  *_data/maps/*.yml|*_data/maps/*.yaml)
    echo "⚠️  Map dataset edited — run \`npm run geocode\` before building so assets/maps/ stays in sync."
    ;;
esac

case "$file" in
  *gallery/*/*)
    echo "💡 Gallery image edited/added — run \`bundle exec rake generate_thumbnails\` if this is a new file."
    ;;
esac

exit 0
