#!/usr/bin/env bash
# Make a git worktree buildable, for a prototype of one option of a choice
# (_plan/decisions/0005, the prototyper agent).
#
# A fresh worktree has the tracked files and nothing else. A build also needs
# what git ignores: the packages, and the data fetched or generated before
# Jekyll runs (photo manifests from R2, cover renditions, link previews). This
# links the packages and copies that data from the main checkout, so a
# prototype builds in a minute without touching R2.
#
#   bash scripts/prototype-setup.sh <path-to-worktree>
#
# Then, in the worktree:  bash -lc 'npm run visual:build'   (the seeded build)
#                         node scripts/check-journeys.mjs
#
# Nothing here is committed: every path it writes is gitignored. The worktree
# is thrown away when the owner has picked (git worktree remove <path>).
#
# Exit codes: 0 ready · 1 the main checkout has not been built · 2 usage

set -euo pipefail

MAIN="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WT="${1:-}"
if [ -z "$WT" ] || [ ! -d "$WT" ] || [ ! -f "$WT/_config.yml" ]; then
  echo "Usage: bash scripts/prototype-setup.sh <path-to-worktree>" >&2
  exit 2
fi
WT="$(cd "$WT" && pwd)"
if [ "$WT" = "$MAIN" ]; then
  echo "That is the main checkout, not a worktree." >&2
  exit 2
fi
if [ ! -f "$MAIN/_data/photo_manifests/_index.json" ]; then
  echo "The main checkout has no photo manifests: run npm run photos:fetch there first." >&2
  exit 1
fi

[ -e "$WT/node_modules" ] || ln -s "$MAIN/node_modules" "$WT/node_modules"

copy() {
  local rel="$1"
  [ -e "$MAIN/$rel" ] || return 0
  mkdir -p "$(dirname "$WT/$rel")"
  rsync -a --delete "$MAIN/$rel" "$(dirname "$WT/$rel")/"
}
copy _data/photo_manifests
copy _data/cover_sizes.json
copy images/cover/sized
copy images/og

echo "Ready: $WT"
echo "Build:  (cd \"$WT\" && bash -lc 'npm run visual:build')"
