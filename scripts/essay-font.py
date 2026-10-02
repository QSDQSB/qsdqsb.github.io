#!/usr/bin/env python3
"""The essays' Chinese face: a subset of Noto Serif SC, cut to the characters the essays use.

An essay (a post with `body_class: essay`) sets its Chinese in a Song face beside Playfair's Latin
(_sass/_page.scss, ESSAY). A Mac has Songti SC of its own. An iPhone does not let a page use it, and
Android and Windows have none, so there the page carries the face itself: Google's Noto Serif SC
(SIL Open Font License 1.1, assets/fonts/NotoSerifSC/OFL.txt). The whole font is 11.6 MB a weight;
the essays use a few hundred characters, so only those are shipped.

    python3 scripts/essay-font.py            # cut the subset again (after a Chinese essay changes)
    python3 scripts/essay-font.py --check    # is every character the essays use in the subset?

Writes assets/fonts/NotoSerifSC/NotoSerifSC-Regular-essays.woff2 and, beside it, chars.txt: the
characters it holds, which is what --check reads (so the check needs neither the font's source nor
fonttools, and runs in CI). A character an essay uses that the subset lacks would fall to the
device's own face, a sans among the Song: --check fails on it and names it.

Cutting needs fonttools and brotli (`python3 -m pip install --user fonttools brotli`) and the font's
source, which stays out of git: by default ~/.cache/qsdqsb/fonts/NotoSerifSC-Regular.otf, from
https://github.com/notofonts/noto-cjk/raw/main/Serif/SubsetOTF/SC/NotoSerifSC-Regular.otf
(or --source <path>).

Exit codes: 0 done, or the subset covers the essays · 1 characters missing · 2 cannot run
"""

import argparse
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "fonts" / "NotoSerifSC"
FONT = OUT / "NotoSerifSC-Regular-essays.woff2"
CHARS = OUT / "chars.txt"
SOURCE = Path.home() / ".cache" / "qsdqsb" / "fonts" / "NotoSerifSC-Regular.otf"
SOURCE_URL = "https://github.com/notofonts/noto-cjk/raw/main/Serif/SubsetOTF/SC/NotoSerifSC-Regular.otf"

# What the face is asked for (its @font-face unicode-range, _sass/_custom.scss): Han characters and
# the punctuation set with them. Latin, figures and Western punctuation stay Playfair's.
RANGES = [(0x2E80, 0x2FDF), (0x3000, 0x303F), (0x3400, 0x4DBF), (0x4E00, 0x9FFF), (0xF900, 0xFAFF), (0xFE30, 0xFE4F), (0xFF00, 0xFFEF)]


def wanted(ch):
    cp = ord(ch)
    return any(lo <= cp <= hi for lo, hi in RANGES)


def essays():
    """Every post whose front matter sets `body_class` with `essay` in it."""
    for path in sorted((ROOT / "_posts").glob("*.md")):
        text = path.read_text(encoding="utf-8")
        front = re.match(r"---\n(.*?)\n---\n", text, re.S)
        if front and re.search(r"^body_class:.*\bessay\b", front.group(1), re.M):
            yield path, text


def used():
    """The characters the essays use, each with the first essay it was seen in."""
    seen = {}
    for path, text in essays():
        for ch in text:
            if wanted(ch):
                seen.setdefault(ch, path.name)
    return seen


def check():
    need = used()
    have = set(CHARS.read_text(encoding="utf-8")) if CHARS.exists() else set()
    missing = sorted(set(need) - have)
    if missing:
        print(f"essay font: {len(missing)} character(s) the essays use are not in the subset:")
        for ch in missing[:40]:
            print(f"  {ch}  U+{ord(ch):04X}  ({need[ch]})")
        print("Cut it again: python3 scripts/essay-font.py")
        return 1
    print(f"essay font: the subset holds all {len(need)} characters the essays use.")
    return 0


def cut(source):
    try:
        from fontTools import subset
    except ImportError:
        print("essay font: fonttools is not installed (python3 -m pip install --user fonttools brotli).")
        return 2
    if not source.exists():
        print(f"essay font: no source font at {source}.\nFetch it once (it stays out of git):\n  curl -L -o '{source}' '{SOURCE_URL}'")
        return 2
    need = used()
    if not need:
        print("essay font: no essay uses a Chinese character; nothing to cut.")
        return 0
    chars = "".join(sorted(need))
    OUT.mkdir(parents=True, exist_ok=True)
    options = subset.Options()
    options.flavor = "woff2"
    options.layout_features = ["*"]
    options.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14]  # its names, and the licence it travels under
    options.name_languages = [0x409]
    options.notdef_outline = True
    options.desubroutinize = True
    font = subset.load_font(str(source), options)
    subsetter = subset.Subsetter(options)
    subsetter.populate(text=chars)
    subsetter.subset(font)
    cmap = set(font.getBestCmap())
    absent = [ch for ch in chars if ord(ch) not in cmap]
    subset.save_font(font, str(FONT), options)
    held = "".join(ch for ch in chars if ord(ch) in cmap)
    CHARS.write_text(held + "\n", encoding="utf-8")
    print(f"essay font: {len(held)} characters, {FONT.stat().st_size / 1024:.0f} KB → {FONT.relative_to(ROOT)}")
    if absent:
        print(f"  not in Noto Serif SC itself, left to the device's face: {' '.join(absent)}")
    return 0


def main():
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--check", action="store_true", help="only check the subset against the essays")
    parser.add_argument("--source", type=Path, default=SOURCE, help="the full Noto Serif SC Regular (.otf)")
    args = parser.parse_args()
    return check() if args.check else cut(args.source)


if __name__ == "__main__":
    sys.exit(main())
