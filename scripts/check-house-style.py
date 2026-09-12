#!/usr/bin/env python3
"""Flag generic-AI register in prose and code.

This site's value is a distinctive voice — editorial, ironic, muted. The
failure mode as it scales is *average* code and *average*
prose: the flattened register that any language model reaches for by default.
This check names that register explicitly so it can be refused.

What it does NOT flag: ornate prose, em-dashes, fragments, long sentences,
melancholy, irony. Those are the house style (see the `sound-like-qsd` skill),
not a defect. Only lexical tells of generic AI/marketing/travel-blog register
are listed below. If a rule here ever fights QSD's actual voice, the rule is
wrong — delete it from the lexicon rather than working around it.

Modes:
    --all (default)   Full audit across all content + code.
    --new-only        Only flag lines ADDED in the working tree vs git HEAD
                      (plus untracked files). This is what hooks use, so the
                      check judges what you just wrote, never the backlog.
    --prose / --code  Restrict to one lexicon (default: both).

Opt-out: put `@style-ok` on the line (in any comment syntax) to skip it.

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

OPT_OUT = "@style-ok"

# ---------------------------------------------------------------------------
# Lexicons — tune these freely. Each entry is (regex, short explanation).
#
# POLICY: minimise false positives, accept false negatives.
#
# The two error types are not symmetric here. A missed cliché is caught by the
# author's own ear on the next read — the voice is the thing being defended,
# and its owner is reading anyway. A false positive has no such backstop: it
# trains the reader to skim past the hook, and once that happens every real
# finding is lost too. So a rule earns its place only if it is hard to trigger
# accidentally in QSD's register.
#
# Consequences of that policy, applied below:
#   - Words that are ordinary English outside the cliché are cut entirely
#     ("robust", "myriad", "at its core") or narrowed to the exact stock
#     phrase ("boasts a", "leverage the").
#   - Anything that collides with the site's own subject matter is cut.
#     "stands as a" would fire on QSD's central image — monuments that stand
#     and crumble. "seams" are load-bearing in the aesthetic vocabulary, so
#     only the adverb "seamlessly" is matched.
# ---------------------------------------------------------------------------

PROSE_LEXICON: list[tuple[str, str, str]] = [
    # (category, pattern, why)
    ("ai-register", r"\bdelv(?:e|ing|es)\s+into\b", "the single most-flagged AI verb"),
    ("ai-register", r"\b(?:rich|vibrant|woven)\s+tapestry\b", "AI metaphor of choice"),
    ("ai-register", r"\b(?:a|is\s+a)\s+testament\s+to\b", "empty praise construction"),
    ("ai-register", r"\bit'?s\s+worth\s+noting\b", "filler throat-clearing"),
    ("ai-register", r"\bnavigating\s+the\s+(?:complex|landscape|world|challeng)", "stock metaphor"),
    ("ai-register", r"\bunlock(?:ing)?\s+the\s+(?:potential|secrets|power)\b", "marketing verb"),
    ("ai-register", r"\bdeep\s+dive\b", "stock transition"),
    ("ai-register", r"\bdiv(?:e|ing)\s+into\s+the\s+(?:world|realm|topic|details)\b", "stock transition"),
    ("ai-register", r"\bembark\s+on\s+a\s+journey\b", "stock opener"),
    ("ai-register", r"\bever-evolving\b", "filler adjective"),
    ("ai-register", r"\bin\s+today'?s\s+(?:fast-paced|digital|modern|world)\b", "stock opener"),
    ("ai-register", r"\bwhether\s+you'?re\s+a\b", "stock audience-hedge"),
    ("ai-register", r"\bmeticulously\s+(?:crafted|curated|designed)\b", "empty intensifier"),
    ("ai-register", r"\b(?:carefully|thoughtfully)\s+curated\b", "empty intensifier"),
    # Cut deliberately: "at its core", "in the realm of", "stands as a",
    # "myriad", "plethora", "ever-changing". Each is ordinary in literary or
    # philosophical prose, which is exactly what this site publishes.

    ("corporate", r"\bseamlessly\b", "corporate adverb"),
    ("corporate", r"\bleverag(?:e|ing|es)\s+(?:the|our|its|this|their)\b", "corporate verb"),
    ("corporate", r"\belevate\s+your\b", "marketing imperative"),
    ("corporate", r"\bgame[- ]changer\b", "marketing cliche"),
    ("corporate", r"\bboasts\s+(?:a|an|the|its|over|more\s+than)\b", "brochure verb"),
    # Cut deliberately: bare "robust" and bare "seamless" — both are ordinary
    # descriptive words ("a robust tripod", "the seam between two exposures").

    # Travel-blog register. This site is a travel gallery, which makes these
    # the *most* likely clichés to creep in — and the ones QSD's voice most
    # explicitly refuses. Kept because none is reachable by accident: each is
    # a fixed brochure phrase rather than a word with an innocent sense.
    ("travel-cliche", r"\bnestled\s+(?:in|among|between|amid)\b", "travel-brochure verb"),
    ("travel-cliche", r"\bhidden\s+gem\b", "travel-brochure noun"),
    ("travel-cliche", r"\ba\s+must-(?:visit|see|do)\b", "listicle register"),
    ("travel-cliche", r"\bbreathtaking\b", "empty intensifier"),
    ("travel-cliche", r"\bpicturesque\b", "empty intensifier"),
    ("travel-cliche", r"\bbustling\b", "travel-brochure adjective"),
    # `(?-i:[A-Z])` opts this one branch out of the global IGNORECASE so it
    # matches an actual proper noun ("in the heart of Prague") and not any
    # letter — otherwise "in the heart of winter" reads as a place name.
    ("travel-cliche",
     r"\bin\s+the\s+heart\s+of\s+(?:the\s+)?(?:city|town|old\s+town|village|"
     r"district|quarter|island|region|countryside|(?-i:[A-Z]))",
     "travel-brochure locator"),
    ("travel-cliche", r"\bcharming\s+(?:town|village|street|alley|square)", "travel-brochure adjective"),
    # Cut deliberately: bare "must see" (matches the ordinary "you must see
    # this"), and "in the heart of <abstract noun>" ("in the heart of winter").
]

CODE_LEXICON: list[tuple[str, str, str]] = [
    # Comment register. These words describe a change's *marketing*, not its
    # mechanism — and they rot the moment the next change lands.
    #
    # Deliberately NOT included: "for better performance / UX", "robust",
    # "comprehensive". Each usually states a real property in a comment
    # ("use event delegation for better performance", "robust against null
    # input", "comprehensive list of MIME types") rather than boasting, so
    # flagging them only trained the reader to ignore the hook.
    ("comment-register",
     r"(?://|/\*|<!--|^\s*\*)\s*[^\n]*\b(?:enhanced|improved|modernis?z?ed|"
     r"state-of-the-art|cutting-edge|best\s+practice)\b",
     "comment describes marketing, not mechanism"),

    # Naming drift — generic scaffolding names and version suffixes.
    #
    # `new` alone is excluded: BEM modifiers like `.home__panel--new` (the
    # "What's New" panel) are semantic, not version markers. Only digits or
    # the marketing words count.
    ("naming",
     r"(?:^|\s)\.[a-z][a-z0-9_-]*-(?:enhanced|improved|v\d+|wrapper-container|"
     r"inner-inner|holder)\b",
     "generic or versioned class name"),

    # Blanket transitions. Named explicitly in _gallery_view.scss as a fixed
    # Safari bug — don't let it back in.
    ("css-default", r"transition:\s*(?:[^;]*\s)?all\b", "blanket transition; list properties explicitly"),

    # The stock shadow *compounds* and gradient that generic frontend output
    # reaches for. Matching the offsets too, not just a dark rgba() tint —
    # `rgba(0,0,0,.15)` on its own is an ordinary hand-tuned shadow and
    # flagging it buried the real signal.
    ("css-default",
     r"0\s+(?:1px\s+2px|1px\s+3px|2px\s+4px|4px\s+6px|10px\s+15px)\s+"
     r"(?:-?\d+px\s+)?rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0?\.1\d?\s*\)",
     "stock shadow; use a $shadow-* token"),
    ("css-default", r"#667eea|#764ba2", "the default AI purple gradient"),
]

# ---------------------------------------------------------------------------
# File scoping
# ---------------------------------------------------------------------------

PROSE_DIRS = ("_posts", "_voyage", "_subvoyage", "_pages")
PROSE_SUFFIXES = (".md", ".markdown")

CODE_GLOBS = (
    ("_sass", "*.scss"),
    ("assets/js", "*.js"),
    ("_includes", "*.html"),
    ("_layouts", "*.html"),
)
CODE_EXCLUDE = ("_sass/vendor/", "assets/js/vendor/", "assets/js/main.min.js",
                "assets/js/plugins/")

# `seo_description` is contractually plain and factual (see CLAUDE.md) — it is
# the one place on the site that is intentionally un-stylised, so the voice
# lexicon must not police it.
SKIP_PROSE_KEYS = re.compile(r"^\s*seo_description\s*:")


def is_prose(rel: str) -> bool:
    p = Path(rel)
    return p.suffix in PROSE_SUFFIXES and rel.split("/")[0] in PROSE_DIRS


def is_code(rel: str) -> bool:
    if any(rel.startswith(x) or f"/{x}" in rel for x in CODE_EXCLUDE):
        return False
    for d, pat in CODE_GLOBS:
        if rel.startswith(d + "/") and Path(rel).match(pat):
            return True
    return False


# ---------------------------------------------------------------------------
# Neon guard — Design Philosophy says "muted & melancholic … No neon."
# Converts hex literals to HSL and flags anything highly saturated at
# mid-lightness, which is the mechanical definition of neon.
# ---------------------------------------------------------------------------

HEX_RE = re.compile(r"#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b")

# Saturation is the wrong test for colours whose value is dictated from
# outside the palette: social brand marks must be the brand's own hex, and
# status colours must stay legible as warnings. Exempt them by name.
NEON_EXEMPT_RE = re.compile(
    r"\$?(?:linkedin|facebook|twitter|x|youtube|instagram|github|bluesky|mastodon|"
    r"rss|google|pinterest|flickr|vimeo|weibo|wechat|xiaohongshu"
    r"|warning|danger|error|success|info|alert)[-_a-z]*\s*:", re.IGNORECASE)

# Solarized is a fixed external colour scheme reproduced verbatim; its values
# are not ours to mute.
NEON_EXEMPT_FILES = ("_sass/_syntax.scss",)


def hex_to_hsl(h: str) -> tuple[float, float, float]:
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    mx, mn = max(r, g, b), min(r, g, b)
    light = (mx + mn) / 2
    if mx == mn:
        return 0.0, 0.0, light
    d = mx - mn
    sat = d / (2 - mx - mn) if light > 0.5 else d / (mx + mn)
    return 0.0, sat, light


def neon_hits(line: str) -> list[str]:
    """Return hex literals in `line` that read as neon."""
    out = []
    if NEON_EXEMPT_RE.search(line):
        return out
    for m in HEX_RE.finditer(line):
        _, sat, light = hex_to_hsl(m.group(1))
        if sat >= 0.85 and 0.35 <= light <= 0.65:
            out.append(m.group(0))
    return out


# ---------------------------------------------------------------------------
# Scanning
# ---------------------------------------------------------------------------

class Violation:
    def __init__(self, path: str, line_no: int, category: str, why: str, text: str):
        self.path, self.line_no = path, line_no
        self.category, self.why, self.text = category, why, text.strip()


STRIP_COMMENT_RE = re.compile(r"//.*$|/\*.*?\*/|<!--.*?-->")
SELECTOR_RE = re.compile(r"^\s*[.#&][a-zA-Z0-9_.,\s#&:>\[\]=\"'-]*[,{]\s*$")
# Font Awesome social marks carry their platform's own hex by definition.
FA_BRAND_RE = re.compile(r"\.fa-|social", re.IGNORECASE)


def scan_lines(rel: str, numbered: list[tuple[int, str]],
               lexicon: list[tuple[str, str, str]],
               check_neon: bool) -> list[Violation]:
    found: list[Violation] = []
    in_fence = False
    selector_ctx = ""
    for line_no, raw in numbered:
        # Fenced code inside markdown is quoted material, not voice.
        if raw.lstrip().startswith("```"):
            in_fence = not in_fence
            continue
        if in_fence or OPT_OUT in raw or SKIP_PROSE_KEYS.match(raw):
            continue

        # Remember the enclosing selector so colour rules can read context.
        if SELECTOR_RE.match(raw):
            selector_ctx = raw
        elif raw.strip().startswith("}"):
            selector_ctx = ""

        # A rule *about* bad CSS is not bad CSS. Match structural patterns
        # against the code only, so a comment explaining why `transition: all`
        # was removed doesn't get flagged as `transition: all`.
        code_only = STRIP_COMMENT_RE.sub("", raw)

        for category, pattern, why in lexicon:
            target = raw if category == "comment-register" else code_only
            m = re.search(pattern, target, flags=re.IGNORECASE | re.MULTILINE)
            if m:
                found.append(Violation(rel, line_no, category,
                                       f"“{m.group().strip()}” — {why}", raw))

        if check_neon and not FA_BRAND_RE.search(selector_ctx):
            for hit in neon_hits(code_only):
                found.append(Violation(rel, line_no, "neon",
                                       f"{hit} — saturated colour; palette is "
                                       f"muted (oxblood, gold, verdigris, lapis)",
                                       raw))
    return found


def git(*args: str) -> str:
    return subprocess.run(["git", *args], cwd=ROOT, capture_output=True,
                          text=True, check=True).stdout


def added_lines() -> dict[str, list[tuple[int, str]]]:
    """Map path -> [(line_no, text)] for lines added vs HEAD, plus untracked files."""
    out: dict[str, list[tuple[int, str]]] = {}
    diff = git("diff", "HEAD", "--unified=0", "--no-color")
    path = None
    new_no = 0
    for line in diff.splitlines():
        if line.startswith("+++ b/"):
            path = line[6:]
        elif line.startswith("@@"):
            m = re.search(r"\+(\d+)", line)
            new_no = int(m.group(1)) if m else 0
        elif line.startswith("+") and not line.startswith("+++") and path:
            out.setdefault(path, []).append((new_no, line[1:]))
            new_no += 1
        elif not line.startswith("-") and path and new_no:
            new_no += 1

    for rel in git("ls-files", "--others", "--exclude-standard").split():
        f = ROOT / rel
        try:
            out.setdefault(rel, []).extend(
                enumerate(f.read_text(encoding="utf-8").splitlines(), 1))
        except (OSError, UnicodeDecodeError):
            pass
    return out


def all_files() -> dict[str, list[tuple[int, str]]]:
    out: dict[str, list[tuple[int, str]]] = {}
    candidates: list[Path] = []
    for d in PROSE_DIRS:
        for suf in PROSE_SUFFIXES:
            candidates += (ROOT / d).rglob(f"*{suf}") if (ROOT / d).is_dir() else []
    for d, pat in CODE_GLOBS:
        if (ROOT / d).is_dir():
            candidates += (ROOT / d).rglob(pat)
    for f in candidates:
        rel = str(f.relative_to(ROOT))
        try:
            out[rel] = list(enumerate(f.read_text(encoding="utf-8").splitlines(), 1))
        except (OSError, UnicodeDecodeError):
            pass
    return out


# ---------------------------------------------------------------------------
# Self-test — guards the tuning policy in both directions.
#
# CLEAN_PROBE is the one that matters. Every line uses a word the lexicon was
# tempted to ban, in the innocent sense QSD actually writes it. If a lexicon
# edit makes any of these fire, that edit is wrong.
# ---------------------------------------------------------------------------

CLEAN_PROBE = [
    "At its core, the escapement is a refusal — a myriad of tiny arrests.",
    "In the realm of the dead, the orloj stands as a monument that will crumble.",
    "The seam between two exposures is honest; I do not hide it.",
    "A robust tripod, a plethora of failures, the ever-changing light.",
    "You must see the brass before it patinas. I leverage nothing; I wait.",
    "He boasts, and I let him. In the heart of winter, the lens fogs.",
    "I dive into the lake, not into conclusions.",
    "// Use event delegation for better performance",
    "// comprehensive list of MIME types; robust against a null body",
    ".home__panel--new { color: $primary-color; }",
    "$linkedin-color: #007bb6;",
    "// the legacy `transition: all 0.8s ease` below was overriding this",
    "box-shadow: 0 18px 40px rgba(0, 0, 0, 0.15);",
]

DIRTY_PROBE = [
    "In the heart of Prague, a hidden gem nestled among breathtaking streets.",
    "Let's delve into this rich tapestry — a must-visit that seamlessly boasts a charm.",
    "It's worth noting this is a testament to meticulously curated design.",
    "Whether you're a novice, embark on a journey and unlock the potential within.",
    "/* Enhanced active state with a cutting-edge, state-of-the-art transition */",
    "transition: all 0.3s ease;",
    "box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);",
    ".card-v2 { background: #667eea; }",
]


def self_test() -> int:
    lex = PROSE_LEXICON + CODE_LEXICON
    clean = scan_lines("<clean>", list(enumerate(CLEAN_PROBE, 1)), lex, check_neon=True)
    dirty = scan_lines("<dirty>", list(enumerate(DIRTY_PROBE, 1)), lex, check_neon=True)

    ok = True
    if clean:
        ok = False
        print("FALSE POSITIVES — these legitimate lines were flagged:")
        for v in clean:
            print(f"  line {v.line_no}: {v.why}")
            print(f"    {CLEAN_PROBE[v.line_no - 1]}")
        print()

    missed = set(range(1, len(DIRTY_PROBE) + 1)) - {v.line_no for v in dirty}
    if missed:
        ok = False
        print("MISSED — these cliché lines were not flagged:")
        for n in sorted(missed):
            print(f"  line {n}: {DIRTY_PROBE[n - 1]}")
        print()

    if ok:
        print(f"Self-test passed — {len(CLEAN_PROBE)} legitimate lines clean, "
              f"{len(DIRTY_PROBE)} cliché lines caught ({len(dirty)} findings).")
        return 0
    return 1


def main() -> int:
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--self-test", action="store_true",
                    help="verify the lexicon against both probes and exit")
    ap.add_argument("--all", dest="mode", action="store_const", const="all", default="all")
    ap.add_argument("--new-only", dest="mode", action="store_const", const="new-only")
    ap.add_argument("--prose", action="store_true", help="prose lexicon only")
    ap.add_argument("--code", action="store_true", help="code lexicon only")
    args = ap.parse_args()

    if args.self_test:
        return self_test()

    do_prose = args.prose or not args.code
    do_code = args.code or not args.prose

    if args.mode == "new-only":
        try:
            git("rev-parse", "--is-inside-work-tree")
        except (subprocess.CalledProcessError, FileNotFoundError):
            print("Not in a git repo; --new-only requires git.", file=sys.stderr)
            return 2
        sources = added_lines()
    else:
        sources = all_files()

    violations: list[Violation] = []
    checked = 0
    for rel, numbered in sorted(sources.items()):
        if do_prose and is_prose(rel):
            checked += 1
            violations += scan_lines(rel, numbered, PROSE_LEXICON, check_neon=False)
        elif do_code and is_code(rel):
            checked += 1
            violations += scan_lines(rel, numbered, CODE_LEXICON,
                                     check_neon=rel not in NEON_EXEMPT_FILES)

    scope = "added in this change" if args.mode == "new-only" else "in the tree"
    if not violations:
        print(f"OK — no house-style violations {scope} ({checked} files checked).")
        return 0

    print(f"House-style violations {scope}:")
    print("(Rewrite in QSD's register, or add '@style-ok' to the line if "
          "deliberate. If a rule is simply wrong, delete it from the lexicon "
          "in scripts/check-house-style.py.)")
    print()
    current = None
    for v in violations:
        if v.path != current:
            current = v.path
            print(f"  {v.path}")
        print(f"    {v.line_no}: [{v.category}] {v.why}")
    print()
    print(f"{len(violations)} violation(s) across "
          f"{len({v.path for v in violations})} file(s).")
    return 1


if __name__ == "__main__":
    sys.exit(main())
