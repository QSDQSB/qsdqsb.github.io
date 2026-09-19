#!/usr/bin/env python3
"""Ratchet the `!important` count in _sass/** downward — never up.

This stylesheet does not use `!important`. The site inherited ~110 of them
from the Minimal Mistakes fork and retired every one: a rule that loses a
fight names its elements more precisely, a state (hover, motion-off,
reduced motion) is declared beside the rule it counters, inline styles are
kept out of content, and third-party CSS is outranked by one more class.
The motion kill switches, the last to go, are guaranteed by
`npm run visual:audit` instead of by shouting.

So this guard has one job: refuse any increase. The ceiling is computed
from git HEAD rather than a checked-in figure, so it drops automatically
when a commit removes one and never has to be maintained by hand. It sits
at the handful still in _gallery_view.scss until that file's rebuild
lands; after that, zero.

Vendor code (_sass/vendor/**) is exempt — third-party, not ours to police.

Usage:
    check-important-ratchet.py              compare working tree to HEAD
    check-important-ratchet.py --list       also print every line
    check-important-ratchet.py --self-test  run the counting probes

Exit codes:
    0  Count is unchanged or lower (or self-test passed)
    1  Count increased (or self-test failed)
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



def strip_block_comments(text: str) -> str:
    """Blank block comments but keep their newlines so line numbers hold."""
    return BLOCK_COMMENT_RE.sub(lambda m: "\n" * m.group(0).count("\n"), text)


def split_line_comment(line: str) -> tuple[str, str]:
    """Return (code, comment) for a `//` line comment, if any."""
    idx = line.find("//")
    if idx < 0:
        return line, ""
    return line[:idx], line[idx:]


def scan_text(text: str) -> tuple[int, list[tuple[int, str]]]:
    """Count `!important`s outside comments; return the (lineno, line) hits."""
    count = 0
    lines: list[tuple[int, str]] = []
    for lineno, raw in enumerate(strip_block_comments(text).split("\n"), 1):
        code, _comment = split_line_comment(raw)
        n = len(IMPORTANT_RE.findall(code))
        if not n:
            continue
        count += n
        lines.append((lineno, raw.strip()))
    return count, lines


def is_vendor(rel: str) -> bool:
    return rel.startswith("_sass/vendor/")


def git(*args: str) -> str:
    return subprocess.run(["git", *args], cwd=ROOT, capture_output=True,
                          text=True, check=True).stdout


def worktree_scan() -> dict[str, tuple[int, list[tuple[int, str]]]]:
    out = {}
    for f in sorted(SASS_DIR.rglob("*.scss")):
        rel = str(f.relative_to(ROOT))
        if is_vendor(rel):
            continue
        try:
            count, lines = scan_text(f.read_text(encoding="utf-8"))
        except (OSError, UnicodeDecodeError):
            continue
        if count:
            out[rel] = (count, lines)
    return out


def head_scan() -> dict[str, int]:
    counts = {}
    try:
        listing = git("ls-tree", "-r", "--name-only", "HEAD", "_sass/")
    except (subprocess.CalledProcessError, FileNotFoundError):
        return counts
    for rel in listing.split():
        if not rel.endswith(".scss") or is_vendor(rel):
            continue
        try:
            count, _ = scan_text(git("show", f"HEAD:{rel}"))
        except subprocess.CalledProcessError:
            continue
        if count:
            counts[rel] = count
    return counts


def self_test() -> int:
    probes = [
        ("plain", "a { color: red !important; }", 1),
        ("two on one line",
         ".x { animation: none !important; transition: none !important; }", 2),
        ("line comment mention only", "a { color: red; } // no !important here", 0),
        ("trailing line comment", "a { color: red !important; } // says why", 1),
        ("block comment mention only", "/* FF has !important on line-height */\na { x: 1; }", 0),
        ("multi-line block comment",
         "/* one\n   !important two\n*/\na { color: red !important; }", 1),
        ("spaced bang", "a { color: red ! important; }", 1),
        ("line number survives a block comment",
         "/* a\n b */\n\na { color: red !important; }", 1),
    ]
    failed = 0
    for name, text, want in probes:
        got, lines = scan_text(text)
        ok = got == want and (not got or lines[-1][0] == text.count("\n") + 1)
        failed += not ok
        print(f"  {'ok  ' if ok else 'FAIL'}  {name}: count={got}"
              + ("" if ok else f" (want {want})"))
    print(f"{len(probes) - failed}/{len(probes)} probes passed.")
    return 1 if failed else 0


def main(argv: list[str]) -> int:
    if "--self-test" in argv:
        return self_test()
    list_lines = "--list" in argv
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
    head_total = sum(head.values())
    now_total = sum(count for count, _ in now.values())

    if list_lines:
        for rel, (_count, lines) in now.items():
            for lineno, line in lines:
                print(f"  {rel}:{lineno}: {line}")
        if now_total:
            print()

    if now_total <= head_total:
        delta = head_total - now_total
        note = f" (down {delta})" if delta else ""
        print(f"OK — !important count {now_total}{note}, ceiling {head_total}.")
        return 0

    print(f"!important count rose: {head_total} → {now_total} (+{now_total - head_total}).")
    print("This stylesheet does not use !important. Name the elements more "
          "precisely, declare the state (hover, motion-off, reduced motion) "
          "beside the rule it counters, or outrank third-party CSS with one "
          "more class — see the SCSS Authoring section of CLAUDE.md.")
    print()
    for rel in sorted(set(head) | set(now)):
        before = head.get(rel, 0)
        after = now[rel][0] if rel in now else 0
        if after > before:
            print(f"  {rel}: {before} → {after}")
    return 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
