#!/usr/bin/env python3
"""CMU Serif, carried by the site (S09, the owner's Q14): four faces of cm-unicode, cut and set.

The site sets CMU Serif in the treatise, in blockquotes, in the atlas's popup titles, and wherever
`$didot-family` meets a device without Didot. It used to come from a font service; since 2026-10-03
the site carries it, cut from the release on CTAN (cm-unicode 0.7.0, SIL Open Font License,
assets/fonts/CMUSerif/OFL.txt) to the letters it sets: Latin and its extensions, Greek, and the
signs of mathematics.

The release's faces differ from the copy the service sent in two ways a reader would see: their
lines sit lower (hhea 935/-250 with a line gap of 200, against the service's none), and they are drawn
on 1000 units to the em where the service's copy has 2048, so a word's width rounds differently, by a
quarter of a pixel across a line: enough to break a justified line one word earlier. So the cut is
scaled to 2048 units and given the service's copy's line metrics and advance widths, recorded once in
scripts/cmu-metrics.json: every line stands, and breaks, where it did (measured 2026-10-03).

    python3 scripts/cmu-font.py --zip ~/Downloads/cm-unicode.zip   # cut the four faces again

The release stays out of git: https://mirrors.ctan.org/fonts/cm-unicode.zip (18 MB). Needs fonttools
and brotli (`python3 -m pip install --user fonttools brotli`).

Exit codes: 0 done · 2 cannot run
"""
import argparse
import io
import json
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets/fonts/CMUSerif"

# The release's file for each face the site sets.
FACES = {"Roman": "cmunrm.otf", "Italic": "cmunti.otf", "Bold": "cmunbx.otf", "BoldItalic": "cmunbi.otf"}
METRICS = Path(__file__).resolve().parent / "cmu-metrics.json"
UNICODES = ("U+0000-024F,U+02B0-02FF,U+0300-036F,U+0370-03FF,U+1E00-1EFF,U+2000-206F,U+2070-209F,"
            "U+20AC,U+2100-214F,U+2190-21FF,U+2200-22FF,U+FB00-FB06,U+FEFF,U+FFFD")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--zip", required=True, help="cm-unicode.zip from CTAN")
    args = ap.parse_args()
    try:
        from fontTools import subset
        from fontTools.ttLib import TTFont
        from fontTools.ttLib.scaleUpem import scale_upem
    except ImportError:
        print("Needs fonttools and brotli: python3 -m pip install --user fonttools brotli", file=sys.stderr)
        return 2

    metrics = json.loads(METRICS.read_text())["faces"]
    OUT.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(args.zip) as z:
        names = {Path(n).name: n for n in z.namelist()}
        (OUT / "OFL.txt").write_bytes(z.read(names["OFL.txt"]))
        for face, source in FACES.items():
            m = metrics[face]
            font = TTFont(io.BytesIO(z.read(names[source])))
            opts = subset.Options()
            opts.flavor = "woff2"
            opts.layout_features = ["*"]
            sub = subset.Subsetter(opts)
            sub.populate(unicodes=subset.parse_unicodes(UNICODES))
            sub.subset(font)
            scale_upem(font, m["unitsPerEm"])
            widths = m["advances"]
            for code, glyph in font.getBestCmap().items():
                w = widths.get(format(code, "X"))
                if w is not None:
                    font["hmtx"][glyph] = (w, font["hmtx"][glyph][1])
            hhea, os2 = font["hhea"], font["OS/2"]
            hhea.ascent, hhea.descent, hhea.lineGap = m["hhea"]
            os2.usWinAscent, os2.usWinDescent = m["win"]
            os2.sTypoAscender, os2.sTypoDescender, os2.sTypoLineGap = m["typo"]
            target = OUT / f"CMUSerif-{face}.woff2"
            # Stamped with the release's own date, so a cut with nothing changed gives the same bytes.
            font.recalcTimestamp = False
            font["head"].modified = font["head"].created
            font.flavor = "woff2"
            font.save(target)
            print(f"{target.relative_to(ROOT)}  {target.stat().st_size // 1024} KB")
    return 0


if __name__ == "__main__":
    sys.exit(main())
