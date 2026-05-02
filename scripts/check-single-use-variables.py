#!/usr/bin/env python3
"""Audit _sass/_variables.scss for single-use variables.

Variables in _sass/_variables.scss are for shared, multi-use design decisions.
A variable used in fewer than two callsites belongs inline at its callsite,
not in the global token file.

Modes:
    --all (default)   Full audit. Lists every single-use variable in the file.
    --new-only        Only flag variables newly added in the working tree
                      vs git HEAD.
    --threshold N     Minimum required CALLSITE count, excluding the
                      definition itself (default: 2 — i.e. the multi-use rule:
                      a variable must be used in at least 2 distinct places
                      across _sass/**). Use --threshold 1 to flag only
                      orphans (variables defined but never referenced).

Opt-out: add `// @keep` to the variable's definition line to skip the check.
Use sparingly — only for variables genuinely scaffolded ahead of a second use.

Exit codes:
    0  No violations
    1  Violations found
    2  Usage error / environment problem
"""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VARS_FILE = ROOT / "_sass" / "_variables.scss"
SASS_DIR = ROOT / "_sass"

DEF_RE = re.compile(r"^\$([a-zA-Z0-9_-]+)\s*:")
# Keep marker can appear anywhere in the variable's lexical region: from
# `$name:` through the next `;` and out to the end of the line that contains
# that `;`. This handles both:
#   - single-line: `$foo: 1rem; // @keep`            (`@keep` after the `;`)
#   - multi-line:  `$bar:\n   0 10px // @keep\n  ;`  (`@keep` between `:` and `;`)
KEEP_RE_TEMPLATE = r"^\${name}\s*:[^;]*;?[^\n]*"

BLOCK_COMMENT_RE = re.compile(r"/\*.*?\*/", re.DOTALL)
LINE_COMMENT_RE = re.compile(r"//[^\n]*")


def strip_comments(text: str) -> str:
    """Remove /* ... */ and // ... comments from SCSS text.

    Without this, `// TODO: replace $foo` counts as a callsite for $foo and
    masks orphaned/single-use variables.

    Caveat: a `//` inside a string literal will be partially stripped. SCSS
    strings rarely contain `//`, and this function is for *counting* — we
    never write back, so a stripped URL in a string is harmless.
    """
    text = BLOCK_COMMENT_RE.sub("", text)
    text = LINE_COMMENT_RE.sub("", text)
    return text


def extract_vars(text: str) -> list[str]:
    """Pull variable names from variable-definition lines."""
    names = []
    for line in text.splitlines():
        m = DEF_RE.match(line)
        if m:
            names.append(m.group(1))
    return names


def is_kept(text: str, name: str) -> bool:
    """Check whether the variable's definition is marked `// @keep`."""
    m = re.search(KEEP_RE_TEMPLATE.format(name=re.escape(name)),
                  text, flags=re.MULTILINE)
    return m is not None and "@keep" in m.group()


def count_refs(name: str, scss_files: list[Path]) -> int:
    """Count occurrences of $name across scss_files using a word-boundary regex.

    The lookahead ensures `$nav-action-size` doesn't false-match
    `$nav-action-size-mobile`. Comments are stripped before counting so
    `// $name` references don't false-positive as callsites.
    """
    pattern = re.compile(r"\$" + re.escape(name) + r"(?![a-zA-Z0-9_-])")
    total = 0
    for path in scss_files:
        try:
            content = strip_comments(path.read_text(encoding="utf-8"))
            total += len(pattern.findall(content))
        except (OSError, UnicodeDecodeError):
            pass
    return total


def head_vars() -> set[str]:
    """Variables present in HEAD's _variables.scss (or empty set if not in git)."""
    try:
        result = subprocess.run(
            ["git", "show", f"HEAD:_sass/_variables.scss"],
            cwd=ROOT, capture_output=True, text=True, check=True,
        )
    except (subprocess.CalledProcessError, FileNotFoundError):
        return set()
    return set(extract_vars(result.stdout))


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--all", dest="mode", action="store_const",
                        const="all", default="all")
    parser.add_argument("--new-only", dest="mode", action="store_const",
                        const="new-only")
    parser.add_argument("--threshold", type=int, default=2,
                        help="Minimum required callsite count, excluding "
                             "the definition (default: 2 — the multi-use "
                             "rule). Use 1 to flag only orphans.")
    args = parser.parse_args()

    if not VARS_FILE.is_file():
        print(f"Not found: {VARS_FILE}", file=sys.stderr)
        return 2

    text = VARS_FILE.read_text(encoding="utf-8")
    all_vars = extract_vars(text)

    if args.mode == "new-only":
        try:
            subprocess.run(["git", "rev-parse", "--is-inside-work-tree"],
                           cwd=ROOT, capture_output=True, check=True)
        except (subprocess.CalledProcessError, FileNotFoundError):
            print("Not in a git repo; --new-only requires git.", file=sys.stderr)
            return 2
        existing = head_vars()
        target_vars = [v for v in all_vars if v not in existing]
    else:
        target_vars = all_vars

    if not target_vars:
        msg = ("No newly-added variables in working tree."
               if args.mode == "new-only"
               else f"No variables found in {VARS_FILE.relative_to(ROOT)}.")
        print(msg)
        return 0

    scss_files = list(SASS_DIR.rglob("*.scss"))

    violations: list[tuple[str, int]] = []
    kept = 0
    for v in target_vars:
        if is_kept(text, v):
            kept += 1
            continue
        refs = count_refs(v, scss_files)
        uses = refs - 1  # subtract the definition itself
        if uses < args.threshold:
            violations.append((v, uses))

    if not violations:
        scope = ("added in this change" if args.mode == "new-only"
                 else f"in {VARS_FILE.relative_to(ROOT)}")
        print(f"OK — no single-use variables {scope} "
              f"({len(target_vars)} checked, {kept} @keep).")
        return 0

    rel = VARS_FILE.relative_to(ROOT)
    print(f"Single-use variables found in {rel}:")
    print("(Inline these at their callsite, or mark the definition with "
          "'// @keep' if intentional.)")
    print()
    for name, uses in violations:
        suffix = "" if uses == 1 else "s"
        print(f"  - ${name} (used in {uses} callsite{suffix})")
    return 1


if __name__ == "__main__":
    sys.exit(main())
