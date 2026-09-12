#!/usr/bin/env python3
"""Ratchet the `!important` count in _sass/** downward — never upward.

This repo carries ~107 `!important` declarations inherited from the Minimal
Mistakes fork. Auditing them all is not worth the churn, but letting the
number *grow* is how a stylesheet becomes unworkable: each new `!important`
is a specificity fight that the next author has to win with another one.

So this doesn't demand a fix. It only refuses an increase.

The baseline is computed from git HEAD rather than a checked-in number, so
there is no file to keep in sync and the ceiling drops automatically every
time a commit removes one.

Vendor code (_sass/vendor/**) is exempt — third-party, not ours to police.

Exit codes:
    0  Count is unchanged or lower
    1  Count increased
    2  Usage error / environment problem
"""

from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SASS_DIR = ROOT / "_sass"
IMPORTANT_RE = re.compile(r"!\s*important", re.IGNORECASE)

BLOCK_COMMENT_RE = re.compile(r"/\*.*?\*/", re.DOTALL)
LINE_COMMENT_RE = re.compile(r"//[^\n]*")


def strip_comments(text: str) -> str:
    """Drop comments so a note *about* `!important` isn't counted as one."""
    return LINE_COMMENT_RE.sub("", BLOCK_COMMENT_RE.sub("", text))


def is_vendor(rel: str) -> bool:
    return rel.startswith("_sass/vendor/")


def count_text(text: str) -> int:
    return len(IMPORTANT_RE.findall(strip_comments(text)))


def git(*args: str) -> str:
    return subprocess.run(["git", *args], cwd=ROOT, capture_output=True,
                          text=True, check=True).stdout


def worktree_counts() -> dict[str, int]:
    counts = {}
    for f in SASS_DIR.rglob("*.scss"):
        rel = str(f.relative_to(ROOT))
        if is_vendor(rel):
            continue
        try:
            counts[rel] = count_text(f.read_text(encoding="utf-8"))
        except (OSError, UnicodeDecodeError):
            pass
    return {k: v for k, v in counts.items() if v}


def head_counts() -> dict[str, int]:
    counts = {}
    try:
        listing = git("ls-tree", "-r", "--name-only", "HEAD", "_sass/")
    except (subprocess.CalledProcessError, FileNotFoundError):
        return counts
    for rel in listing.split():
        if not rel.endswith(".scss") or is_vendor(rel):
            continue
        try:
            counts[rel] = count_text(git("show", f"HEAD:{rel}"))
        except subprocess.CalledProcessError:
            pass
    return {k: v for k, v in counts.items() if v}


def main() -> int:
    if not SASS_DIR.is_dir():
        print(f"Not found: {SASS_DIR}", file=sys.stderr)
        return 2
    try:
        git("rev-parse", "--is-inside-work-tree")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("Not in a git repo; the ratchet needs git for its baseline.",
              file=sys.stderr)
        return 2

    head, now = head_counts(), worktree_counts()
    head_total, now_total = sum(head.values()), sum(now.values())

    if now_total <= head_total:
        delta = head_total - now_total
        note = f" (down {delta})" if delta else ""
        print(f"OK — !important count {now_total}{note}, ceiling {head_total}.")
        return 0

    print(f"!important count rose: {head_total} → {now_total} "
          f"(+{now_total - head_total}).")
    print("Win the specificity fight with a more specific selector, or by "
          "reordering — not with another '!important'.")
    print()
    for rel in sorted(set(head) | set(now)):
        before, after = head.get(rel, 0), now.get(rel, 0)
        if after > before:
            print(f"  {rel}: {before} → {after}")
    return 1


if __name__ == "__main__":
    sys.exit(main())
