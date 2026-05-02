#!/usr/bin/env bash
# PostToolUse hook: when _sass/_variables.scss is edited, run the single-use
# variable check on newly-added variables only. Non-blocking — informational
# signal so Claude can address mid-session.
#
# Reads the hook's JSON payload from stdin to extract the edited file path.

set -uo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

file=$(python3 -c "import json,sys; print(json.load(sys.stdin).get('tool_input',{}).get('file_path',''))" 2>/dev/null || echo "")

case "$file" in
  *_sass/_variables.scss)
    cd "$ROOT_DIR"
    python3 scripts/check-single-use-variables.py --new-only 2>&1 | sed 's/^/[var-check] /'
    ;;
esac

exit 0
