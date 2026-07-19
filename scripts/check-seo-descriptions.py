#!/usr/bin/env python3
"""Audit search <meta name="description"> coverage across content collections.

Every routable page emits a `<meta name="description">` (see _includes/seo.html).
This script reports, per page, *which source* that description comes from — so
description coverage stays maintainable as content scales, and genuine gaps
(pages falling back to the generic site-wide description, i.e. duplicate meta
descriptions) surface instead of hiding.

It mirrors the precedence in _includes/seo.html exactly:

    1. frontmatter `seo_description`     -> authored   (hand-written, richest)
    2. _voyage / _subvoyage  template    -> template   (auto "<place> — travel
                                                         photography by QSD")
    3. `description` / `excerpt`          -> display    (poetic display copy;
                                                         weak, unspecific for search)
    4. site.description                  -> GAP        (generic, duplicated
                                                         across every such page)

Stubs (empty / `#TODO` body) are reported separately and never counted as gaps —
a meta description must describe content that actually exists.

Modes:
    (default)     Full report. Exit 1 if any real GAP exists.
    --strict      Also treat `display` (poetic-only) pages as failures — use
                  when you want every content page to carry a hand-written or
                  templated description.
    --quiet       Print only the summary and the pages needing attention.

Exit codes:
    0  No gaps (and, under --strict, no display-only pages)
    1  Coverage problems found
    2  Usage error / environment problem
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# collection dir -> kind label. `template`-covered kinds are voyage/subvoyage.
COLLECTIONS = {
    "_posts": "post",
    "_pages": "page",
    "_voyage": "voyage",
    "_subvoyage": "subvoyage",
}
TEMPLATED_KINDS = {"voyage", "subvoyage"}

# Pages excluded from the audit (noindex utility routes).
SKIP_BASENAMES = {"404"}

FRONTMATTER_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n?(.*)$", re.DOTALL)
# Top-level scalar keys only — nested keys are indented, so `^` never matches them.
KEY_RE = re.compile(r"^([A-Za-z0-9_\-]+)\s*:\s*(.*)$")

CATEGORIES = ("authored", "template", "display", "gap", "stub")
BADGE = {
    "authored": "✅ authored",
    "template": "🔵 template",
    "display": "⚠️  display",
    "gap": "❌ GAP",
    "stub": "⏭️  stub",
}


def parse_frontmatter(text: str):
    """Return (top_level_keys: dict[str, str], body: str)."""
    if not text.startswith("---"):
        return {}, text
    m = FRONTMATTER_RE.match(text)
    if not m:
        return {}, text
    block, body = m.group(1), m.group(2)
    keys: dict[str, str] = {}
    for line in block.splitlines():
        if line[:1] in (" ", "\t"):  # nested / continuation — skip
            continue
        km = KEY_RE.match(line)
        if km:
            keys.setdefault(km.group(1), km.group(2).strip())
    return keys, body


def has_value(keys: dict, name: str) -> bool:
    if name not in keys:
        return False
    v = keys[name].strip().strip('"').strip("'").strip()
    # A bare block-scalar indicator ('>' or '|') means content follows on
    # indented lines — treat as present.
    return len(v) > 0


def is_stub(body: str) -> bool:
    b = re.sub(r"<!--.*?-->", "", body, flags=re.DOTALL).strip()
    if len(b) < 12:
        return True
    return bool(re.match(r"^#*\s*TODO\b", b, re.IGNORECASE))


def classify(kind: str, keys: dict, body: str) -> str:
    if has_value(keys, "seo_description"):
        return "authored"
    if kind in TEMPLATED_KINDS:
        return "template"
    if is_stub(body):
        return "stub"
    if has_value(keys, "description") or has_value(keys, "excerpt"):
        return "display"
    return "gap"


def iter_content_files():
    for subdir, kind in COLLECTIONS.items():
        base = ROOT / subdir
        if not base.is_dir():
            continue
        for path in sorted(base.rglob("*")):
            if path.suffix.lower() not in (".md", ".markdown", ".html"):
                continue
            if path.stem in SKIP_BASENAMES:
                continue
            yield path, kind


def main() -> int:
    ap = argparse.ArgumentParser(description="Audit SEO meta-description coverage.")
    ap.add_argument("--strict", action="store_true",
                    help="Treat poetic display-only pages as failures too.")
    ap.add_argument("--quiet", action="store_true",
                    help="Print only the summary and pages needing attention.")
    args = ap.parse_args()

    results: dict[str, list[Path]] = {c: [] for c in CATEGORIES}
    by_collection: dict[str, dict[str, int]] = {}

    for path, kind in iter_content_files():
        try:
            text = path.read_text(encoding="utf-8")
        except OSError as exc:  # pragma: no cover
            print(f"error: cannot read {path}: {exc}", file=sys.stderr)
            return 2
        keys, body = parse_frontmatter(text)
        cat = classify(kind, keys, body)
        results[cat].append(path.relative_to(ROOT))
        by_collection.setdefault(kind, {c: 0 for c in CATEGORIES})[cat] += 1

    total = sum(len(v) for v in results.values())
    covered = len(results["authored"]) + len(results["template"])

    if not args.quiet:
        print("SEO meta-description coverage\n" + "=" * 29)
        for kind in ("post", "page", "voyage", "subvoyage"):
            counts = by_collection.get(kind)
            if not counts:
                continue
            parts = ", ".join(f"{counts[c]} {c}" for c in CATEGORIES if counts[c])
            print(f"  {kind:<10} {parts}")
        print()

    # Pages that need a hand-written description.
    attention = list(results["gap"])
    if args.strict:
        attention += list(results["display"])

    if results["gap"]:
        print(f"❌ {len(results['gap'])} GAP — fall back to the generic "
              f"site.description (duplicate meta descriptions):")
        for p in results["gap"]:
            print(f"     {p}")
    if results["display"]:
        label = "❌" if args.strict else "⚠️ "
        print(f"{label} {len(results['display'])} display-only — rely on the "
              f"poetic excerpt/description (weak for search); hand-write "
              f"`seo_description` to improve:")
        for p in results["display"]:
            print(f"     {p}")
    if results["stub"] and not args.quiet:
        print(f"⏭️  {len(results['stub'])} stub — skipped (no real content yet): "
              + ", ".join(str(p) for p in results["stub"]))

    pct = (covered / total * 100) if total else 100.0
    print(f"\n{covered}/{total} pages covered by an authored or templated "
          f"description ({pct:.0f}%).")
    if results["gap"]:
        print(f"{len(results['gap'])} gap(s) need attention.")

    return 1 if attention else 0


if __name__ == "__main__":
    sys.exit(main())
