#!/usr/bin/env python3
"""Ratchet the stylesheet's private vocabulary downward: never up (decisions/0002, "The guard").

A session that wants a corner, a curve, a blur, a focus ring or a layer and writes it as a literal
adds to the dialects the audit of 2026-10-01 counted: 36 radii, 8 curves, 12 blurs, 12 focus rings,
z-index from 40 to 999,999. The shared scales and pieces are where those values live
(_variables.scss, _tokens.scss, _components.scss, the amounts in decisions/0009). This guard counts
what is written outside them, compares with git HEAD, and fails when any count rises. A fall is
simply the new ceiling: nothing is stored by hand, as with check-important-ratchet.py.

What is counted, in _sass/** (vendor exempt):

  radius     a border-radius (or one corner's) written with a number other than 0, not a $token or a var()
  curve      a literal cubic-bezier( ), or a bare ease / ease-in / ease-out / ease-in-out, in a
             transition or an animation (the scale's own definitions in _variables.scss excepted)
  overshoot  a cubic-bezier whose second or fourth number lies outside 0 to 1: a curve that goes past
             its end and comes back. "Nothing springs" (0009). Also counted in assets/js/ (vendor
             and the bundle exempt), where the bubbles on Home are the one the owner has left alone
  blur       a backdrop-filter, or an @include backdrop-blur( ) other than none, outside the shared
             pieces (_components.scss, _mixins.scss)
  focus      a rule block for :focus or :focus-visible that draws a ring of its own (an outline, a
             box-shadow or a border) and does not include brass-focus (outside _components.scss,
             where brass-focus is defined). A block that only colours, as a hover-and-focus pair
             does, is not a ring and is not counted
  z-index    a z-index written as a number, not a $token or a var()

The counts are totals per kind, so moving rules between files (splitting a partial) never fails;
a rise is reported with the files that grew.

Usage:
    check-vocabulary-ratchet.py              compare the working tree with HEAD
    check-vocabulary-ratchet.py --list       also print every counted line
    check-vocabulary-ratchet.py --self-test  run the counting probes

Exit codes:
    0  no count rose (or self-test passed)
    1  a count rose (or self-test failed)
    2  usage error / environment problem
"""

from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
KINDS = ("radius", "curve", "overshoot", "blur", "focus", "z-index")

BLOCK_COMMENT_RE = re.compile(r"/\*.*?\*/", re.DOTALL)
RADIUS_RE = re.compile(r"(?<![\w-])border(?:-[a-z]+)*-radius\s*:\s*([^;{}]+)")
TOKEN_RE = re.compile(r"\$[\w-]+|var\([^()]*(?:\([^()]*\)[^()]*)*\)|#\{[^}]*\}")
BEZIER_RE = re.compile(r"cubic-bezier\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)")
EASE_DECL_RE = re.compile(r"(?<![\w-])(?:transition|animation)(?:-timing-function)?\s*:\s*([^;{}]+)")
BARE_EASE_RE = re.compile(r"(?<![\w-])ease(?:-in-out|-in|-out)?(?![\w-])")
BLUR_RE = re.compile(r"(?<![\w-])backdrop-filter\s*:|@include\s+backdrop-blur\(\s*(?!none\s*\))")
ZINDEX_RE = re.compile(r"(?<![\w-])z-index\s*:\s*(-?\d+)")
FOCUS_SELECTOR_RE = re.compile(r":focus(?:-visible|-within)?\b")
RING_RE = re.compile(r"(?<![\w-])(?:outline|box-shadow|border(?:-[\w-]+)?)\s*:")


def strip_comments(text: str) -> str:
    """Blank block and line comments, keeping newlines so line numbers hold."""
    text = BLOCK_COMMENT_RE.sub(lambda m: "\n" * m.group(0).count("\n"), text)
    out = []
    for line in text.split("\n"):
        # A // inside url(...) or a string is not a comment.
        idx, depth, quote = -1, 0, ""
        for i, ch in enumerate(line):
            if quote:
                if ch == quote:
                    quote = ""
                continue
            if ch in "\"'":
                quote = ch
            elif ch == "(":
                depth += 1
            elif ch == ")":
                depth = max(0, depth - 1)
            elif ch == "/" and depth == 0 and line[i:i + 2] == "//":
                idx = i
                break
        out.append(line if idx < 0 else line[:idx])
    return "\n".join(out)


def line_of(text: str, pos: int) -> int:
    return text.count("\n", 0, pos) + 1


def focus_blocks(text: str):
    """Yield (pos, selector, body) for every rule block whose own selector names :focus."""
    stack: list[tuple[int, str]] = []
    start = 0
    for i, ch in enumerate(text):
        if ch == "{":
            selector = text[start:i].strip().split(";")[-1].strip()
            stack.append((i, selector))
            start = i + 1
        elif ch == "}":
            if stack:
                open_at, selector = stack.pop()
                if FOCUS_SELECTOR_RE.search(selector) and not selector.startswith("@"):
                    yield open_at, selector, text[open_at + 1:i]
            start = i + 1
        elif ch == ";":
            start = i + 1


def scan_scss(rel: str, raw: str) -> dict[str, list[tuple[int, str]]]:
    text = strip_comments(raw)
    lines = raw.split("\n")
    hits: dict[str, list[tuple[int, str]]] = {k: [] for k in KINDS}
    hit = lambda kind, pos: hits[kind].append((line_of(text, pos), lines[line_of(text, pos) - 1].strip()))
    name = rel.split("/")[-1]

    for m in RADIUS_RE.finditer(text):
        value = TOKEN_RE.sub("", m.group(1))
        if re.search(r"(?<![\w.])(?:0*[1-9]\d*(?:\.\d+)?|0?\.\d*[1-9]\d*)", value):
            hit("radius", m.start())

    if name != "_variables.scss":
        for m in BEZIER_RE.finditer(text):
            hit("curve", m.start())
        for m in EASE_DECL_RE.finditer(text):
            value = TOKEN_RE.sub("", m.group(1))
            for e in BARE_EASE_RE.finditer(value):
                hit("curve", m.start())
    for m in BEZIER_RE.finditer(text):
        y1, y2 = float(m.group(2)), float(m.group(4))
        if not (0 <= y1 <= 1 and 0 <= y2 <= 1):
            hit("overshoot", m.start())

    if name not in ("_components.scss", "_mixins.scss"):
        for m in BLUR_RE.finditer(text):
            hit("blur", m.start())

    if name != "_components.scss":
        for pos, _selector, body in focus_blocks(text):
            if "brass-focus" not in body and RING_RE.search(body):
                hit("focus", pos)

    for m in ZINDEX_RE.finditer(text):
        hit("z-index", m.start())
    return hits


def scan_js(raw: str) -> list[tuple[int, str]]:
    lines = raw.split("\n")
    out = []
    for m in BEZIER_RE.finditer(raw):
        y1, y2 = float(m.group(2)), float(m.group(4))
        if not (0 <= y1 <= 1 and 0 <= y2 <= 1):
            n = raw.count("\n", 0, m.start()) + 1
            out.append((n, lines[n - 1].strip()))
    return out


def git(*args: str) -> str:
    return subprocess.run(["git", *args], cwd=ROOT, capture_output=True, text=True, check=True).stdout


def wanted(rel: str) -> bool:
    if rel.startswith("_sass/"):
        return rel.endswith(".scss") and not rel.startswith("_sass/vendor/")
    if rel.startswith("assets/js/"):
        return rel.endswith((".js", ".mjs")) and not rel.startswith("assets/js/vendor/") and not rel.endswith(".min.js")
    return False


def scan(read, files) -> dict[str, dict[str, list[tuple[int, str]]]]:
    """Per file, per kind, the counted lines."""
    out = {}
    for rel in files:
        if not wanted(rel):
            continue
        try:
            raw = read(rel)
        except (OSError, UnicodeDecodeError, subprocess.CalledProcessError):
            continue
        if rel.startswith("_sass/"):
            out[rel] = scan_scss(rel, raw)
        else:
            js = scan_js(raw)
            if js:
                out[rel] = {k: (js if k == "overshoot" else []) for k in KINDS}
    return out


def totals(per_file) -> dict[str, int]:
    return {k: sum(len(f[k]) for f in per_file.values()) for k in KINDS}


def self_test() -> int:
    def count(text, kind, rel="_sass/_x.scss"):
        return len(scan_scss(rel, text)[kind])
    probes = [
        ("a px radius", "a { border-radius: 6px; }", "radius", 1),
        ("a token radius", "a { border-radius: $border-radius; }", "radius", 0),
        ("a var radius", "a { border-radius: var(--r, 10px); }", "radius", 0),
        ("radius 0", "a { border-radius: 0; }", "radius", 0),
        ("one corner", "a { border-top-left-radius: 50%; }", "radius", 1),
        ("radius in a comment", "a { x: 1; } // border-radius: 6px", "radius", 0),
        ("a literal curve", "a { transition: opacity .3s cubic-bezier(0.4, 0, 0.2, 1); }", "curve", 1),
        ("a token curve", "a { transition: opacity .3s $cubic-bezier-standard; }", "curve", 0),
        ("a bare ease", "a { transition: opacity .3s ease; }", "curve", 1),
        ("ease-in-out once", "a { animation: spin 1s ease-in-out infinite; }", "curve", 1),
        ("ease in a class name is not a curve", "a { transition-property: opacity; } .ease-panel { x: 1; }", "curve", 0),
        ("the scale's own curves", "$c: cubic-bezier(0.4, 0, 0.2, 1);", "curve", 0, "_sass/_variables.scss"),
        ("an overshoot", "a { transition: x .3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }", "overshoot", 1),
        ("no overshoot", "a { transition: x .3s cubic-bezier(0.22, 1, 0.36, 1); }", "overshoot", 0),
        ("a backdrop-filter", "a { backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); }", "blur", 1),
        ("backdrop-blur none", "a { @include backdrop-blur(none); }", "blur", 0),
        ("backdrop-blur on", "a { @include backdrop-blur(12px); }", "blur", 1),
        ("a focus ring by hand", "a:focus-visible { outline: 2px solid red; }", "focus", 1),
        ("a focus ring through the piece", "a:focus-visible { @include brass-focus; }", "focus", 0),
        ("nested focus", "a { color: red; &:focus { outline: none; } }", "focus", 1),
        ("focus in a parent, not its own", ".x:focus-within .y { outline: 0; } .z { a { b: c; } }", "focus", 1),
        ("a hover-and-focus pair that only colours", "a:hover, a:focus-visible { color: red; }", "focus", 0),
        ("a focus that stops an animation", ".w:focus-visible { animation: none; }", "focus", 0),
        ("a focus ring drawn as a shadow", "a:focus-visible { box-shadow: 0 0 0 2px red; }", "focus", 1),
        ("a z-index number", "a { z-index: 40; }", "z-index", 1),
        ("a z-index token", "a { z-index: $z-masthead; }", "z-index", 0),
        ("url with // is not a comment", "a { background: url(https://x/y.png); border-radius: 4px; }", "radius", 1),
    ]
    js_probes = [
        ("js overshoot", 'el.animate(k, { easing: "cubic-bezier(0.34, 1.5, 0.64, 1)" });', 1),
        ("js plain", 'el.animate(k, { easing: "cubic-bezier(0.2, 0, 0.2, 1)" });', 0),
    ]
    failed = 0
    for name, text, kind, want, *rel in probes:
        got = count(text, kind, *rel)
        ok = got == want
        failed += not ok
        print(f"  {'ok  ' if ok else 'FAIL'}  {name}: {kind}={got}" + ("" if ok else f" (want {want})"))
    for name, text, want in js_probes:
        got = len(scan_js(text))
        ok = got == want
        failed += not ok
        print(f"  {'ok  ' if ok else 'FAIL'}  {name}: overshoot={got}" + ("" if ok else f" (want {want})"))
    n = len(probes) + len(js_probes)
    print(f"{n - failed}/{n} probes passed.")
    return 1 if failed else 0


def main(argv: list[str]) -> int:
    if "--self-test" in argv:
        return self_test()
    list_lines = "--list" in argv
    unknown = [a for a in argv if a != "--list"]
    if unknown:
        print(f"Unknown argument(s): {' '.join(unknown)}", file=sys.stderr)
        return 2
    try:
        tracked = git("ls-tree", "-r", "--name-only", "HEAD", "_sass/", "assets/js/").split()
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("Not in a git repo; the ratchet needs git for its baseline.", file=sys.stderr)
        return 2

    here = sorted(str(p.relative_to(ROOT)) for d in ("_sass", "assets/js") for p in (ROOT / d).rglob("*") if p.is_file())
    head = scan(lambda rel: git("show", f"HEAD:{rel}"), tracked)
    now = scan(lambda rel: (ROOT / rel).read_text(encoding="utf-8"), here)
    before, after = totals(head), totals(now)

    if list_lines:
        for rel, kinds in now.items():
            for kind in KINDS:
                for lineno, line in kinds[kind]:
                    print(f"  {kind:9}  {rel}:{lineno}: {line}")
        print()

    rose = [k for k in KINDS if after[k] > before[k]]
    summary = " · ".join(f"{k} {after[k]}" + (f" (was {before[k]})" if after[k] != before[k] else "") for k in KINDS)
    if not rose:
        print(f"OK — vocabulary: {summary}.")
        return 0
    print(f"The stylesheet's private vocabulary grew: {summary}.")
    print("Take the value from a scale or a shared piece (_variables.scss, _tokens.scss, _components.scss,")
    print("the owner's amounts in _plan/decisions/0009); a new one is added there first (decisions/0002).")
    for kind in rose:
        print(f"\n  {kind}:")
        for rel in sorted(set(head) | set(now)):
            b = len(head.get(rel, {}).get(kind, []))
            a = len(now.get(rel, {}).get(kind, []))
            if a > b:
                print(f"    {rel}: {b} → {a}")
                if list_lines is False:
                    known = {line for _n, line in head.get(rel, {}).get(kind, [])}
                    for lineno, line in now[rel][kind]:
                        if line not in known:
                            print(f"      {lineno}: {line}")
    return 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
