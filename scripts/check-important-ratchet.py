#!/usr/bin/env python3
"""Ratchet the *unmarked* `!important` count in _sass/** downward — never up.

This repo inherited ~110 `!important` declarations from the Minimal Mistakes
fork. Some are justified: overrides of third-party CSS (Leaflet), of inline
styles authored inside a post, utility classes, reduced-motion and
motion-off kill switches. The rest are specificity fights that the next
author has to win with another one.

The two are told apart by a marker on the same line:

    animation: none !important; // @keep — motion-off kill switch

A line whose `!important` is followed by `// @keep` is *kept*: counted,
reported, exempt from the ratchet. Everything else is *unmarked*, and that
is the number this guard refuses to let grow. The ceiling is computed from
git HEAD rather than a checked-in figure, so it drops automatically every
time a commit removes or marks one.

Vendor code (_sass/vendor/**) is exempt — third-party, not ours to police.

Usage:
    check-important-ratchet.py              compare working tree to HEAD
    check-important-ratchet.py --list       also print every unmarked line
    check-important-ratchet.py --self-test  run the counting probes

Exit codes:
    0  Unmarked count is unchanged or lower (or self-test passed)
    1  Unmarked count increased (or self-test failed)
    2  Usage error / environment problem
"""

from __future__ import annotations

import re
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SASS_DIR = ROOT / "_sass"
IMPORTANT_RE = re.compile(r"!\s*important", re.IGNORECASE)
KEEP_RE = re.compile(r"//.*@keep\b")

BLOCK_COMMENT_RE = re.compile(r"/\*.*?\*/", re.DOTALL)


@dataclass(frozen=True)
class Tally:
    kept: int = 0
    unmarked: int = 0

    def __add__(self, other: "Tally") -> "Tally":
        return Tally(self.kept + other.kept, self.unmarked + other.unmarked)


def strip_block_comments(text: str) -> str:
    """Blank block comments but keep their newlines so line numbers hold."""
    return BLOCK_COMMENT_RE.sub(lambda m: "\n" * m.group(0).count("\n"), text)


def split_line_comment(line: str) -> tuple[str, str]:
    """Return (code, comment) for a `//` line comment, if any."""
    idx = line.find("//")
    if idx < 0:
        return line, ""
    return line[:idx], line[idx:]


def scan_text(text: str) -> tuple[Tally, list[tuple[int, str]]]:
    """Count kept and unmarked `!important`s; return unmarked (lineno, line)."""
    kept = unmarked = 0
    unmarked_lines: list[tuple[int, str]] = []
    for lineno, raw in enumerate(strip_block_comments(text).split("\n"), 1):
        code, comment = split_line_comment(raw)
        n = len(IMPORTANT_RE.findall(code))
        if not n:
            continue
        if KEEP_RE.search(comment):
            kept += n
        else:
            unmarked += n
            unmarked_lines.append((lineno, raw.strip()))
    return Tally(kept, unmarked), unmarked_lines


def is_vendor(rel: str) -> bool:
    return rel.startswith("_sass/vendor/")


def git(*args: str) -> str:
    return subprocess.run(["git", *args], cwd=ROOT, capture_output=True,
                          text=True, check=True).stdout


def worktree_scan() -> dict[str, tuple[Tally, list[tuple[int, str]]]]:
    out = {}
    for f in sorted(SASS_DIR.rglob("*.scss")):
        rel = str(f.relative_to(ROOT))
        if is_vendor(rel):
            continue
        try:
            tally, lines = scan_text(f.read_text(encoding="utf-8"))
        except (OSError, UnicodeDecodeError):
            continue
        if tally.kept or tally.unmarked:
            out[rel] = (tally, lines)
    return out


def head_scan() -> dict[str, Tally]:
    counts = {}
    try:
        listing = git("ls-tree", "-r", "--name-only", "HEAD", "_sass/")
    except (subprocess.CalledProcessError, FileNotFoundError):
        return counts
    for rel in listing.split():
        if not rel.endswith(".scss") or is_vendor(rel):
            continue
        try:
            tally, _ = scan_text(git("show", f"HEAD:{rel}"))
        except subprocess.CalledProcessError:
            continue
        if tally.kept or tally.unmarked:
            counts[rel] = tally
    return counts


def self_test() -> int:
    probes = [
        ("plain", "a { color: red !important; }", Tally(0, 1)),
        ("kept", "a { color: red !important; } // @keep — utility class", Tally(1, 0)),
        ("kept em-dash optional", "a { color: red !important; } // @keep utility", Tally(1, 0)),
        ("two on one kept line",
         ".x { animation: none !important; transition: none !important; } // @keep — kill switch",
         Tally(2, 0)),
        ("two on one unmarked line",
         ".x { animation: none !important; transition: none !important; }", Tally(0, 2)),
        ("line comment mention only", "a { color: red; } // no !important here", Tally(0, 0)),
        ("block comment mention only", "/* FF has !important on line-height */\na { x: 1; }", Tally(0, 0)),
        ("multi-line block comment",
         "/* one\n   !important two\n*/\na { color: red !important; }", Tally(0, 1)),
        ("keep in block comment does not count",
         "a { color: red !important; } /* @keep */", Tally(0, 1)),
        ("keep on a different line",
         "// @keep\na { color: red !important; }", Tally(0, 1)),
        ("spaced bang", "a { color: red ! important; }", Tally(0, 1)),
        ("keep must be a word", "a { color: red !important; } // @keeper", Tally(0, 1)),
    ]
    failed = 0
    for name, text, want in probes:
        got, _ = scan_text(text)
        ok = got == want
        failed += not ok
        print(f"  {'ok  ' if ok else 'FAIL'}  {name}: kept={got.kept} unmarked={got.unmarked}"
              + ("" if ok else f" (want kept={want.kept} unmarked={want.unmarked})"))
    print(f"{len(probes) - failed}/{len(probes)} probes passed.")
    return 1 if failed else 0


def main(argv: list[str]) -> int:
    if "--self-test" in argv:
        return self_test()
    list_unmarked = "--list" in argv
    unknown = [a for a in argv if a not in ("--list",)]
    if unknown:
        print(f"Unknown argument(s): {' '.join(unknown)}", file=sys.stderr)
        return 2

    if not SASS_DIR.is_dir():
        print(f"Not found: {SASS_DIR}", file=sys.stderr)
        return 2
    try:
        git("rev-parse", "--is-inside-work-tree")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("Not in a git repo; the ratchet needs git for its baseline.",
              file=sys.stderr)
        return 2

    head, now = head_scan(), worktree_scan()
    head_total = sum(head.values(), Tally())
    now_total = sum((t for t, _ in now.values()), Tally())

    if list_unmarked:
        for rel, (tally, lines) in now.items():
            for lineno, line in lines:
                print(f"  {rel}:{lineno}: {line}")
        if now_total.unmarked:
            print()

    if now_total.unmarked <= head_total.unmarked:
        delta = head_total.unmarked - now_total.unmarked
        note = f" (down {delta})" if delta else ""
        print(f"OK — !important: {now_total.kept} kept, {now_total.unmarked} unmarked{note}, "
              f"ceiling on unmarked {head_total.unmarked}.")
        return 0

    print(f"Unmarked !important count rose: {head_total.unmarked} → {now_total.unmarked} "
          f"(+{now_total.unmarked - head_total.unmarked}); {now_total.kept} kept.")
    print("Win the specificity fight with a more specific selector, or by "
          "reordering — not with another '!important'. A justified override "
          "(third-party CSS, inline styles, utilities, motion kill switches) "
          "carries `// @keep — <reason>` on its line.")
    print()
    for rel in sorted(set(head) | set(now)):
        before = head.get(rel, Tally()).unmarked
        after = now[rel][0].unmarked if rel in now else 0
        if after > before:
            print(f"  {rel}: {before} → {after} unmarked")
    return 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
