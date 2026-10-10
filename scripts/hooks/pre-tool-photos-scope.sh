#!/usr/bin/env bash
# PreToolUse hook: a session reaches Apple Photos through one door, the album.
#
# The owner, 2026-10-10: access should be open only to the Voyage-of-QSDQSB album. macOS cannot
# grant that (Automation on Photos is all of it or none), so the line is drawn here, and it is a
# guard against a slip, not a lock: a script a session writes and runs could still speak to
# Photos. The door is `photos:harvest`, whose code starts every request from the album by name
# (scripts/photos/lib/apple-photos.mjs: albumItems, exportFromAlbum, tagInAlbum). Refused, when
# it is what a command runs (each part of a chain on ; && || | judged apart, so naming a file in
# git, grep or cat is never refused):
#
#   osascript, shortcuts, automator, osxphotos    anything could be said to Photos through them
#   node …/enrich.mjs, …/ingest.mjs, apple-photos  enrich searches every item in the library by
#   npm run photos:enrich, photos:ingest           name; ingest runs it (harvest runs ingest
#                                                  itself, without enrich: its child, unseen here)
#   a path into *.photoslibrary or Photos.sqlite   the library's own files, anywhere
#   computer use that names Photos                 a screenshot would show the whole library
#
# The owner's own terminal is untouched. Exit 2 refuses the call and says why; 0 lets it through.

set -uo pipefail

python3 -c '
import json, os, shlex, sys

def refuse(why):
    sys.stderr.write("Refused: " + why + " Apple Photos is open to this session only through the album: "
                     "npm run photos:harvest (look, set, go, bring). See .claude/commands/harvest.md.\n")
    sys.exit(2)

try:
    p = json.loads(sys.stdin.read() or "{}")
except Exception:
    sys.exit(0)
tool, i = p.get("tool_name", ""), p.get("tool_input") or {}
text = i["command"] if isinstance(i.get("command"), str) else json.dumps(i)
low = text.lower()

if ".photoslibrary/" in low or low.rstrip("\" ").endswith(".photoslibrary") or "photos.sqlite" in low:
    if tool in ("Bash", "Read", "Grep", "Glob"):
        refuse("the Photos library'"'"'s own files are outside the album.")

if tool.startswith("mcp__computer-use__"):
    if "\"photos\"" in low or "com.apple.photos" in low:
        refuse("computer use on Photos would show the whole library.")
    sys.exit(0)

if tool != "Bash":
    sys.exit(0)

try:
    lex = shlex.shlex(text, posix=True, punctuation_chars=";&|")
    lex.whitespace_split = True
    tokens = list(lex)
except ValueError:
    tokens = text.split()

segments, cur = [], []
for t in tokens + [";"]:
    if t and set(t) <= set(";&|"):
        if cur: segments.append(cur)
        cur = []
    else:
        cur.append(t)

SCRIPTING = {"osascript", "shortcuts", "automator", "osxphotos"}
for seg in segments:
    words = [w for w in seg if "=" not in w.split("/")[0] or w.startswith("-")]  # drop VAR=value prefixes
    while words and words[0] in ("sudo", "env", "time", "exec", "command", "nohup"):
        words = words[1:]
    if not words:
        continue
    cmd = os.path.basename(words[0]).lower()
    args = [w.lower() for w in words[1:]]
    if cmd in SCRIPTING:
        refuse("scripting apps directly (" + cmd + ") could reach the whole Photos library.")
    if cmd in ("node", "bun", "deno", "npx"):
        if any(a.endswith(("enrich.mjs", "ingest.mjs")) for a in args):
            refuse("enrich (and ingest, which runs it) searches the whole library by name.")
        if any("apple-photos" in a for a in args):
            refuse("the Photos helpers are used only by harvest.")
    if cmd in ("npm", "pnpm", "yarn"):
        if any(a in ("photos:enrich", "photos:ingest") for a in args):
            refuse("enrich (and ingest, which runs it) searches the whole library by name.")
sys.exit(0)
'
