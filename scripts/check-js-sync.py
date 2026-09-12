#!/usr/bin/env python3
"""Verify assets/js/main.min.js is rebuilt from its sources.

CLAUDE.md's rule is "never hand-edit main.min.js — edit _main.js, then run
`npm run build:js`". The failure it guards against is silent and ships: edit
the source, forget the rebuild, commit, and Cloudflare Pages serves the old
bundle. Nothing in the site breaks visibly, so it can go unnoticed for weeks.

Detection rule — all three must hold for the bundle to be called stale:

  1. A bundle source differs from git HEAD (edited this session), AND
  2. main.min.js does NOT differ from HEAD (so it wasn't rebuilt), AND
  3. a source's mtime is newer than main.min.js's.

Clause 3 is what makes this usable rather than nagging. A comment-only edit
to _main.js produces byte-identical terser output, so clause 2 stays true
forever and the check would never clear. But `npm run build:js` rewrites the
file regardless, refreshing its mtime — so the honest "I did rebuild it"
case resolves, while a genuine skipped rebuild stays flagged.

Sources are read from package.json's `uglify` script, so adding a file to
the bundle doesn't silently escape this check.

Exit codes:
    0  In sync (or not applicable)
    1  Stale — rebuild needed
    2  Usage error / environment problem
"""

from __future__ import annotations

import json
import shlex
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ARTIFACT = "assets/js/main.min.js"


def git(*args: str) -> str:
    return subprocess.run(["git", *args], cwd=ROOT, capture_output=True,
                          text=True, check=True).stdout


def bundle_sources() -> list[str]:
    """Parse the `uglify` npm script for its input files.

    Reading the real build command means a new file added to the bundle is
    covered automatically, instead of drifting out of a hardcoded list.
    """
    try:
        scripts = json.loads((ROOT / "package.json").read_text())["scripts"]
        cmd = scripts["uglify"]
    except (OSError, KeyError, json.JSONDecodeError):
        return []
    out, tokens = [], shlex.split(cmd)
    i = 0
    while i < len(tokens):
        t = tokens[i]
        if t == "-o":          # skip the output path
            i += 2
            continue
        if t.startswith("-"):
            i += 1
            continue
        if t.endswith(".js") and t != ARTIFACT:
            out.append(t)
        i += 1
    return out


def dirty_paths() -> set[str]:
    """Paths differing from HEAD (staged, unstaged, or untracked)."""
    paths = set()
    for line in git("status", "--porcelain").splitlines():
        if len(line) > 3:
            paths.add(line[3:].strip())
    return paths


def main() -> int:
    try:
        git("rev-parse", "--is-inside-work-tree")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("Not in a git repo; skipping JS sync check.", file=sys.stderr)
        return 0

    sources = bundle_sources()
    artifact = ROOT / ARTIFACT
    if not sources or not artifact.is_file():
        print("No JS bundle sources resolved; skipping.")
        return 0

    dirty = dirty_paths()
    changed = [s for s in sources if s in dirty]
    if not changed:
        print(f"OK — no bundle sources modified ({len(sources)} tracked).")
        return 0

    if ARTIFACT in dirty:
        print(f"OK — {ARTIFACT} rebuilt alongside {', '.join(changed)}.")
        return 0

    art_mtime = artifact.stat().st_mtime
    newer = [s for s in changed
             if (ROOT / s).is_file() and (ROOT / s).stat().st_mtime > art_mtime]
    if not newer:
        print(f"OK — {ARTIFACT} is at least as new as its modified sources.")
        return 0

    print(f"{ARTIFACT} is stale — these sources changed but the bundle "
          f"was not rebuilt:")
    for s in newer:
        print(f"  - {s}")
    print()
    print("Run `npm run build:js` before committing. Never hand-edit "
          "main.min.js.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
