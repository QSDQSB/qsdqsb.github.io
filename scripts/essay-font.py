#!/usr/bin/env python3
"""The site's Chinese serif: a subset of Noto Serif SC, cut to the characters the site's text uses.

Wherever the Latin is Playfair, the site sets Chinese in a Song face beside it ($global-font-family,
_sass/_variables.scss): every post, the Bestiary, a title on a page or a card. A Mac has Songti SC of
its own. An iPhone does not let a page use it, and Android and Windows have none, so there the page
carries the face itself: Google's Noto Serif SC (SIL Open Font License 1.1,
assets/fonts/NotoSerifSC/OFL.txt). The whole font is 11.6 MB a weight; the site uses a couple of
thousand characters, so only those are shipped. (The script keeps its first name, from when only the
essays were set so.)

    python3 scripts/essay-font.py            # cut the subset again (after Chinese text changes)
    python3 scripts/essay-font.py --check    # is every character the site's text uses in the subset?

Writes the face in slices of SLICE characters, assets/fonts/NotoSerifSC/NotoSerifSC-Regular-NN.woff2
(the characters most pages share first, then each file's own together), their @font-face rules with
the characters each holds as its unicode-range (_sass/_noto-serif-sc.scss), so a page fetches only
the slices it draws; and chars.txt: every character held, which is what --check reads (so the check needs neither the font's source nor
fonttools, and runs in CI). A character the text uses that the subset lacks would fall to the
device's own face, a sans among the Song: --check fails on it and names it.

Cutting needs fonttools and brotli (`python3 -m pip install --user fonttools brotli`) and the font's
source, which stays out of git: by default ~/.cache/qsdqsb/fonts/NotoSerifSC-Regular.otf, from
https://github.com/notofonts/noto-cjk/raw/main/Serif/SubsetOTF/SC/NotoSerifSC-Regular.otf
(or --source <path>).

Exit codes: 0 done, or the subset covers the site's text · 1 characters missing · 2 cannot run
"""

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "fonts" / "NotoSerifSC"
CHARS = OUT / "chars.txt"
SCSS = ROOT / "_sass" / "_noto-serif-sc.scss"
SLICE = 60  # characters a slice: about 15 KB

HEAD = """// Written by scripts/essay-font.py: do not edit. The site's Noto Serif SC, in slices. Each slice
// names its characters, so a page fetches only the slices it draws (_custom.scss says when).
"""
FACE = """@font-face {{
  font-family: 'Noto Serif SC';
  src: url('#{{$fa-font-path}}/NotoSerifSC/{file}') format('woff2');
  font-display: swap;
  font-weight: 400;
  font-style: normal;
  unicode-range: {range};
}}
"""
SOURCE = Path.home() / ".cache" / "qsdqsb" / "fonts" / "NotoSerifSC-Regular.otf"
SOURCE_URL = "https://github.com/notofonts/noto-cjk/raw/main/Serif/SubsetOTF/SC/NotoSerifSC-Regular.otf"

# What the face is asked for (its @font-face unicode-range, _sass/_custom.scss): Han characters and
# the punctuation set with them. Latin, figures and Western punctuation stay Playfair's.
RANGES = [(0x2E80, 0x2FDF), (0x3000, 0x303F), (0x3400, 0x4DBF), (0x4E00, 0x9FFF), (0xF900, 0xFAFF), (0xFE30, 0xFE4F), (0xFF00, 0xFFEF)]


def wanted(ch):
    cp = ord(ch)
    return any(lo <= cp <= hi for lo, hi in RANGES)


def essays():
    """Every file the site's words come from: the posts, the Bestiary's fables (set in the same Song
    by _sass/_bestiary.scss), the pages, the voyages and their parts, and the text in _data."""
    for pattern in ("_posts/*.md", "_bestiary/*.md", "_pages/*", "_voyage/*.md", "_subvoyage/**/*.md", "_data/*.yml"):
        for path in sorted(ROOT.glob(pattern)):
            if path.is_file():
                yield path, path.read_text(encoding="utf-8")


def used():
    """The characters the site's text uses, each with the files it was seen in (in reading order)."""
    seen = {}
    for path, text in essays():
        for ch in text:
            if wanted(ch):
                files = seen.setdefault(ch, [])
                if not files or files[-1] != path.name:
                    files.append(path.name)
    return seen


def check():
    # The two pieces the cut relies on, checked where the gate runs.
    assert unicode_range("七一丁") == "U+4E00-4E01, U+4E03", unicode_range("七一丁")
    assert slices({"甲": ["a", "b"], "乙": ["b"], "丙": ["a"]}) == [["甲", "丙", "乙"]]
    need = used()
    have = set(CHARS.read_text(encoding="utf-8")) if CHARS.exists() else set()
    missing = sorted(set(need) - have)
    if missing:
        print(f"essay font: {len(missing)} character(s) the site's text uses are not in the subset:")
        for ch in missing[:40]:
            print(f"  {ch}  U+{ord(ch):04X}  ({need[ch][0]})")
        print("Cut it again: python3 scripts/essay-font.py")
        return 1
    print(f"essay font: the subset holds all {len(need)} characters the site's text uses.")
    return 0


def slices(need):
    """The characters in slices of SLICE: the most shared first, so a slice or two serve most pages,
    then each file's own characters together, so a page fetches few of the rest."""
    order = {name: i for i, name in enumerate(dict.fromkeys(f for files in need.values() for f in files))}
    chars = sorted(need, key=lambda ch: (-len(need[ch]), order[need[ch][0]], ord(ch)))
    return [chars[i:i + SLICE] for i in range(0, len(chars), SLICE)]


def unicode_range(chars):
    """U+4E00-4E02, U+4E8C: runs of consecutive code points written as ranges."""
    runs = []
    for cp in sorted(ord(ch) for ch in chars):
        if runs and cp == runs[-1][1] + 1:
            runs[-1][1] = cp
        else:
            runs.append([cp, cp])
    return ", ".join(f"U+{a:X}" if a == b else f"U+{a:X}-{b:X}" for a, b in runs)


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
        print("essay font: no text uses a Chinese character; nothing to cut.")
        return 0
    OUT.mkdir(parents=True, exist_ok=True)
    for old in OUT.glob("*.woff2"):
        old.unlink()
    options = subset.Options()
    options.flavor = "woff2"
    options.layout_features = ["*"]
    options.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14]  # its names, and the licence it travels under
    options.name_languages = [0x409]
    options.notdef_outline = True
    options.desubroutinize = True
    held, absent, faces, total = [], [], [], 0
    for i, part in enumerate(slices(need)):
        font = subset.load_font(str(source), options)
        subsetter = subset.Subsetter(options)
        subsetter.populate(text="".join(part))
        subsetter.subset(font)
        cmap = set(font.getBestCmap())
        absent += [ch for ch in part if ord(ch) not in cmap]
        part = [ch for ch in part if ord(ch) in cmap]
        if not part:
            continue
        name = f"NotoSerifSC-Regular-{i:02d}.woff2"
        subset.save_font(font, str(OUT / name), options)
        total += (OUT / name).stat().st_size
        held += part
        faces.append(FACE.format(file=name, range=unicode_range(part)))
    CHARS.write_text("".join(sorted(held)) + "\n", encoding="utf-8")
    SCSS.write_text(HEAD + "\n".join(faces), encoding="utf-8")
    print(f"essay font: {len(held)} characters in {len(faces)} slices, {total / 1024:.0f} KB in all → {OUT.relative_to(ROOT)}")
    if absent:
        print(f"  not in Noto Serif SC itself, left to the device's face: {' '.join(absent)}")
    return 0


def main():
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--check", action="store_true", help="only check the subset against the site's text")
    parser.add_argument("--source", type=Path, default=SOURCE, help="the full Noto Serif SC Regular (.otf)")
    args = parser.parse_args()
    return check() if args.check else cut(args.source)


if __name__ == "__main__":
    sys.exit(main())
