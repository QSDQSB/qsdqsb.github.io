#!/usr/bin/env python3
"""Depth Pro challenger — single-image depth map for the Lontananza bake-off.

Apple's Depth Pro (github.com/apple/ml-depth-pro) has the sharpest occlusion
boundaries of the practical open monocular depth models, which is exactly the
quality axis that matters for parallax (soft edges → rubber-sheet look). This
script runs ONE image through it and writes the same output format as
scripts/generate-hero-depth-maps.mjs, so variants drop straight into the
tilt rig (?depth=<suffix>) and, if the model wins the bake-off, straight into
the site.

Setup (once, local — authoring-time only, never CI):
    pip install git+https://github.com/apple/ml-depth-pro
    # checkpoint (~1.9 GB) into ./checkpoints/depth_pro.pt:
    huggingface-cli download --local-dir checkpoints apple/DepthPro depth_pro.pt

Usage:
    python3 scripts/generate-depth-pro.py images/QSD_Night_4v1.jpg --suffix pro
    python3 scripts/generate-depth-pro.py images/cover/venice-3v1.jpg   # canonical .depth.jpg
    python3 scripts/generate-depth-pro.py <image> --out <explicit-path>

Output: grayscale JPEG q94, near=bright (inverse depth), percentile contrast
stretch 0.5%%-99.5%%, max width 1600 — identical conventions to the JS
generator so the shader knobs behave the same across models.
"""

import argparse
import os
import sys

import numpy as np
from PIL import Image, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MAX_WIDTH = 1600


def depth_path_for(src_rel: str, suffix: str | None) -> str:
    key = src_rel[len("images/"):] if src_rel.startswith("images/") else src_rel
    sfx = f".{suffix}" if suffix else ""
    return os.path.join("images", "depth", f"{key}.depth{sfx}.jpg")


def main() -> int:
    ap = argparse.ArgumentParser(description="Depth Pro single-image depth map")
    ap.add_argument("image", help="source image, repo-relative (e.g. images/QSD_Night_4v1.jpg)")
    ap.add_argument("--suffix", help="benchmark variant tag -> <name>.depth.<suffix>.jpg")
    ap.add_argument("--out", help="explicit output path (overrides the mirrored default)")
    args = ap.parse_args()

    if args.suffix and not args.suffix.replace("-", "").isalnum():
        print("[depth-pro] --suffix must be alphanumeric/hyphen", file=sys.stderr)
        return 1

    src_rel = args.image.replace("\\", "/").lstrip("/")
    src = os.path.join(ROOT, src_rel)
    if not os.path.exists(src):
        print(f"[depth-pro] source not found: {src}", file=sys.stderr)
        return 1
    out = os.path.join(ROOT, args.out) if args.out else os.path.join(ROOT, depth_path_for(src_rel, args.suffix))

    try:
        import torch
        import depth_pro
    except ImportError as exc:
        print(f"[depth-pro] missing dependency: {exc}", file=sys.stderr)
        print("[depth-pro] install: pip install git+https://github.com/apple/ml-depth-pro", file=sys.stderr)
        return 1

    if torch.cuda.is_available():
        device = torch.device("cuda")
    elif getattr(torch.backends, "mps", None) and torch.backends.mps.is_available():
        device = torch.device("mps")
    else:
        device = torch.device("cpu")
    print(f"[depth-pro] device: {device}")

    try:
        model, transform = depth_pro.create_model_and_transforms(device=device)
    except TypeError:
        model, transform = depth_pro.create_model_and_transforms()
        model = model.to(device)
    except FileNotFoundError as exc:
        print(f"[depth-pro] checkpoint missing: {exc}", file=sys.stderr)
        print("[depth-pro] fetch it: huggingface-cli download --local-dir checkpoints apple/DepthPro depth_pro.pt", file=sys.stderr)
        return 1
    model.eval()

    image, _, f_px = depth_pro.load_rgb(src)
    with torch.no_grad():
        prediction = model.infer(transform(image), f_px=f_px)
    depth_m = prediction["depth"].detach().cpu().numpy().astype(np.float64)

    # Metric depth (meters, far=large) -> inverse depth (near=bright), which is
    # what the shader and the Depth Anything maps use.
    inv = 1.0 / np.maximum(depth_m, 1e-6)
    lo, hi = np.percentile(inv, (0.5, 99.5))
    if hi - lo < 1e-9:
        print("[depth-pro] degenerate depth map (flat) — writing unstretched", file=sys.stderr)
        lo, hi = float(inv.min()), float(max(inv.max(), inv.min() + 1e-9))
    gray = np.clip((inv - lo) / (hi - lo) * 255.0, 0, 255).astype(np.uint8)

    img = Image.fromarray(gray, mode="L")
    # Match the display orientation/scale conventions of the JS generator.
    with Image.open(src) as ref:
        ref = ImageOps.exif_transpose(ref)
        if img.size != ref.size:
            img = img.resize(ref.size, Image.LANCZOS)
    if img.width > MAX_WIDTH:
        img = img.resize((MAX_WIDTH, round(img.height * MAX_WIDTH / img.width)), Image.LANCZOS)

    os.makedirs(os.path.dirname(out), exist_ok=True)
    img.save(out, "JPEG", quality=94)
    print(f"[depth-pro] wrote {os.path.relpath(out, ROOT)} ({img.width}x{img.height})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
