#!/usr/bin/env bash
# PreToolUse hook: Claude reaches Apple Photos through one door, the album.
#
# The owner, 2026-10-10: access should be open only to the Voyage-of-QSDQSB album. macOS cannot
# grant that (Automation on Photos is all of it or none), so the line is drawn here: the only
# way a session touches Photos is `photos:harvest`, whose code starts every request from the
# album by name (scripts/photos/lib/apple-photos.mjs: albumItems, exportFromAlbum, tagInAlbum).
# Refused, for a session's own commands:
#
#   osascript, Shortcuts, Automator   anything could be said to Photos through them
#   the library's files               *.photoslibrary, Photos.sqlite, osxphotos, photoscript
#   the library-wide helpers          enrich and ingest (enrich searches every item by name),
#                                     and apple-photos.mjs called from anywhere but harvest
#   computer use on Photos            screenshots and clicks would show the whole library
#
# The scripts that harvest runs (ingest --skip-enrich) are its own children: a hook sees only the
# command a session types. The owner's own terminal is untouched.
#
# Exit 2 refuses the call and tells the session why; 0 lets it through.

set -uo pipefail

payload=$(cat)
parsed=$(python3 -c '
import json, sys
p = json.loads(sys.stdin.read() or "{}")
i = p.get("tool_input") or {}
t = i["command"] if isinstance(i.get("command"), str) else json.dumps(i)
print(p.get("tool_name", ""))
print(" ".join(t.split()))
' <<<"$payload" 2>/dev/null) || exit 0
tool=$(printf '%s\n' "$parsed" | sed -n 1p)
text=$(printf '%s\n' "$parsed" | sed -n 2p)

refuse() {
  echo "Refused: $1 Apple Photos is open to this session only through the album: npm run photos:harvest (look, set, go, bring). See .claude/commands/harvest.md." >&2
  exit 2
}

case "$tool" in
  Bash)
    lower=$(printf '%s' "$text" | tr '[:upper:]' '[:lower:]')
    case "$lower" in
      *photos:harvest*|*scripts/photos/harvest.mjs*)
        # The door itself, alone: nothing chained after it may speak to Photos.
        rest=${lower//photos:harvest/}; rest=${rest//scripts\/photos\/harvest.mjs/}
        case "$rest" in *osascript*|*apple-photos*|*photoslibrary*|*photos:enrich*|*enrich.mjs*) refuse "a command beside photos:harvest that reaches Photos." ;; esac
        exit 0 ;;
    esac
    case "$lower" in
      *osascript*|*"shortcuts run"*|*automator*) refuse "scripting apps directly (osascript, Shortcuts, Automator) could reach the whole Photos library." ;;
      *photoslibrary*|*photos.sqlite*|*osxphotos*|*photoscript*) refuse "the Photos library's own files are outside the album." ;;
      *photos:enrich*|*enrich.mjs*|*photos:ingest*|*ingest.mjs*) refuse "enrich (and ingest, which runs it) searches the whole library by name." ;;
      *apple-photos*) refuse "the Photos helpers are used only by harvest." ;;
    esac
    ;;
  mcp__computer-use__*)
    case "$text" in *'"Photos"'*|*com.apple.Photos*) refuse "computer use on Photos would show the whole library." ;; esac
    ;;
  Read|Grep|Glob)
    case "$text" in *.photoslibrary*) refuse "the Photos library's own files are outside the album." ;; esac
    ;;
esac
exit 0
