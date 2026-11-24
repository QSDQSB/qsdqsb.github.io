#!/usr/bin/env python3
"""A fable's room, from its cover: the palette the page's dye is poured from, and the ground and inks
its words stand on.

The palette is weighted to the cover's foot (each pixel counts by (row / height) ** 2), since the room
begins where the cover fades out. The ground is a parchment (the owner, 2026-11-24: the Bestiary is
the light 羊皮纸 page): pale, lightly tinted, its hue in the parchment's warm range, leaning within that
range toward the palette's lightest colour, so each fable's paper is its own cover's and still paper; the
inks are its darkest, deepened until they pass WCAG contrast against that ground (the words and what
supports them 7:1, small labels and the brass 4.5:1). Written into the fable's front matter as `room:`,
so the page is right before any script runs.

    python3 scripts/bestiary-room.py            # every fable whose cover is in photos/bestiary/<fable>.(png|jpg)
    python3 scripts/bestiary-room.py --check    # does every fable carry a room that passes contrast?

The covers are the owner's plates, local in photos/bestiary/ (git-ignored, bound for R2). Exit codes:
0 done · 1 a fable has no room, or its room fails contrast · 2 cannot run (no numpy or Pillow).
"""
import argparse
import colorsys
import json
import math
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FABLES = ROOT / "_bestiary"
COVERS = ROOT / "photos" / "bestiary"
POWER = 2.0
NEED = {"ink": 7.0, "ink2": 7.0, "ink3": 4.5, "brass": 4.5}


# --- colour ---------------------------------------------------------------------------------------
def to_lin(c):
    c /= 255
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def from_lin(c):
    c = min(1.0, max(0.0, c))
    return 255 * (12.92 * c if c <= 0.0031308 else 1.055 * c ** (1 / 2.4) - 0.055)


def oklab(rgb):
    r, g, b = (to_lin(v) for v in rgb)
    l = (0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b) ** (1 / 3)
    m = (0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b) ** (1 / 3)
    s = (0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b) ** (1 / 3)
    return (0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
            1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
            0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s)


def rgb(lab):
    L, A, B = lab
    l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3
    m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3
    s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3
    return tuple(from_lin(v) for v in (4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
                                        -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
                                        -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s))


def lum(c):
    r, g, b = (to_lin(v) for v in c)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(a, b):
    x, y = sorted((lum(a), lum(b)), reverse=True)
    return (x + 0.05) / (y + 0.05)


def hexof(c):
    return "#" + "".join(f"{max(0, min(255, round(v))):02x}" for v in c)


def rgbof(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))


def at(lab, L, cmax):
    c = math.hypot(lab[1], lab[2])
    k = cmax / c if c > cmax else 1
    return rgb((L, lab[1] * k, lab[2] * k))


def parchment(lab, L=0.94, hues=(70, 95), chroma=(0.016, 0.028)):
    c = math.hypot(lab[1], lab[2])
    h = math.degrees(math.atan2(lab[2], lab[1])) % 360 if c > 0.004 else 85
    lo, hi = hues
    # Nearest edge of the range, going the short way round the circle.
    if not lo <= h <= hi:
        h = lo if (lo - h) % 360 < (h - hi) % 360 else hi
    k = min(max(c, chroma[0]), chroma[1])
    return rgb((L, k * math.cos(math.radians(h)), k * math.sin(math.radians(h))))


def passing(lab, L, cmax, ground, need):
    c = at(lab, L, cmax)
    while contrast(c, ground) < need and L > 0.05:
        L -= 0.01
        c = at(lab, L, cmax)
    return c


# --- the cover ------------------------------------------------------------------------------------
def palette(path):
    import numpy as np
    from PIL import Image
    rng = np.random.default_rng(7)
    im = Image.open(path).convert("RGB")
    im.thumbnail((220, 220))
    w, h = im.size
    X = np.asarray(im, dtype=float).reshape(-1, 3)
    W = np.repeat(((np.arange(h) + 0.5) / h) ** POWER, w)
    C = X[rng.choice(len(X), 10, replace=False, p=W / W.sum())]
    for _ in range(30):
        a = ((X[:, None, :] - C[None]) ** 2).sum(-1).argmin(1)
        C = np.array([np.average(X[a == j], axis=0, weights=W[a == j]) if W[a == j].sum() > 0 else C[j] for j in range(10)])
    share = np.array([W[a == j].sum() for j in range(10)]) / W.sum()

    def sat(c):
        _, l, s = colorsys.rgb_to_hls(*(np.asarray(c) / 255))
        return s * (1 - abs(2 * l - 1))

    order = np.argsort(-share)
    chosen = []
    for j in order:
        if all(np.linalg.norm(C[j] - C[i]) > 36 for i in chosen):
            chosen.append(j)
        if len(chosen) == 4:
            break
    vivid = max((j for j in range(10) if j not in chosen and share[j] > 0.008), key=lambda j: sat(C[j]), default=None)
    if vivid is not None and sat(C[vivid]) > max(sat(C[i]) for i in chosen) + 0.05:
        chosen.append(vivid)
    else:
        chosen += [j for j in order if j not in chosen][:5 - len(chosen)]
    tot = sum(share[j] for j in chosen)
    out = [{"hex": hexof(C[j]), "pc": round(float(100 * share[j] / tot), 1)} for j in chosen]
    small = [i for i, p in enumerate(out) if p["pc"] < 15]
    if small:
        out[max(small, key=lambda i: sat(C[chosen[i]]))]["accent"] = True
    return out


def room(pal):
    labs = [oklab(rgbof(p["hex"])) for p in pal]
    light, dark = max(labs, key=lambda c: c[0]), min(labs, key=lambda c: c[0])
    ground = parchment(light)
    inks = {
        "ink": passing(dark, 0.27, 0.035, ground, NEED["ink"]),
        "ink2": passing(dark, 0.42, 0.04, ground, NEED["ink2"]),
        "ink3": passing(dark, 0.55, 0.04, ground, NEED["ink3"]),
        "brass": passing(oklab((138, 108, 62)), 0.55, 0.09, ground, NEED["brass"]),
    }
    return {"ground": hexof(ground), **{k: hexof(v) for k, v in inks.items()}, "palette": pal}


# --- the front matter ---------------------------------------------------------------------------
BLOCK = re.compile(r"^room:.*?(?=^\S|\Z)", re.M | re.S)


def write(path, r):
    text = path.read_text(encoding="utf-8")
    front = re.match(r"---\n(.*?)\n---\n", text, re.S)
    head = BLOCK.sub("", front.group(1) + "\n").rstrip("\n")
    pal = json.dumps(r["palette"], separators=(", ", ": "))
    block = (f"room: # from its cover by scripts/bestiary-room.py: the dye, the ground and the inks (contrast-checked)\n"
             f"  ground: \"{r['ground']}\"\n  ink: \"{r['ink']}\"\n  ink2: \"{r['ink2']}\"\n  ink3: \"{r['ink3']}\"\n"
             f"  brass: \"{r['brass']}\"\n  palette: {pal}")
    path.write_text(f"---\n{head}\n{block}\n---\n" + text[front.end():], encoding="utf-8")


def read(path):
    front = re.match(r"---\n(.*?)\n---\n", path.read_text(encoding="utf-8"), re.S).group(1)
    m = BLOCK.search(front + "\n")
    if not m:
        return None
    vals = dict(re.findall(r"^\s+(ground|ink|ink2|ink3|brass): \"(#[0-9a-f]{6})\"", m.group(0), re.M))
    return vals if len(vals) == 5 else None


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()
    fables = sorted(FABLES.glob("*.md"))
    if args.check:
        bad = 0
        for f in fables:
            r = read(f)
            if not r:
                print(f"bestiary room: _bestiary/{f.name} has no room (python3 scripts/bestiary-room.py)")
                bad += 1
                continue
            g = rgbof(r["ground"])
            for k, need in NEED.items():
                got = contrast(rgbof(r[k]), g)
                if got < need:
                    print(f"bestiary room: _bestiary/{f.name}: {k} {r[k]} on {r['ground']} is {got:.2f}:1, under {need}:1")
                    bad += 1
        if not bad:
            print(f"bestiary room: all {len(fables)} fables carry a room that passes contrast.")
        return 1 if bad else 0
    try:
        import numpy  # noqa: F401
        import PIL  # noqa: F401
    except ImportError:
        print("bestiary room: needs numpy and Pillow (python3 -m pip install --user numpy pillow).")
        return 2
    for f in fables:
        cover = next((c for c in (COVERS / f"{f.stem}.png", COVERS / f"{f.stem}.jpg") if c.exists()), None)
        if not cover:
            print(f"bestiary room: no cover for _bestiary/{f.name} in photos/bestiary/; left as it is")
            continue
        r = room(palette(cover))
        write(f, r)
        ratios = {k: round(contrast(rgbof(r[k]), rgbof(r["ground"])), 2) for k in NEED}
        print(f"bestiary room: _bestiary/{f.name} ← {cover.name}: ground {r['ground']}, ink {r['ink']} {ratios}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
