# QSD's House of Wonders

Source for **[qsdqsb.com](https://qsdqsb.com)** — QSD's blog, travel gallery, and portfolio.

A Jekyll site hosted on **Cloudflare Pages**, which rebuilds and deploys on every push to `master`. The repository keeps its historical `qsdqsb.github.io` name, but GitHub Pages no longer serves the site.

## Origin

This git is originally forked from [Academic Pages](https://github.com/academicpages/academicpages.github.io), which was modified from the [Minimal Mistakes Jekyll Theme](https://mmistakes.github.io/minimal-mistakes/), which is © 2016 Michael Rose and released under the MIT License. See [LICENSE](LICENSE).

I can only say that the original Academic Pages documentation and code comments are extremely hard to read. It took me much effort to modify it into my own version. It also deleted some interesting sections from the original Minimal Mistakes site, which I am gradually adding back.

Some parts of the code are over five years old. I have been updating them to newer CSS and HTML standards for a better browsing experience and performance.

## Running locally

Prerequisites: Ruby with Bundler, Node.js ≥ 18, and Python 3 (for the check scripts).

```bash
bundle install
npm install
npm run serve        # generate gallery assets → fetch photo manifests → geocode → jekyll serve
```

The site is then served at `http://localhost:4000`.

| Command | What it does |
|---|---|
| `npm run build` / `npm run serve` | Full pipeline, then `jekyll build` / `jekyll serve` |
| `npm run build:fast` / `npm run serve:fast` | Skip the gallery pipeline — for CSS/HTML/JS iteration |
| `npm run build:js` | Minify `assets/js/_main.js` → `assets/js/main.min.js` (never hand-edit the `.min.js`) |
| `npm test` | Node test suite in `tests/` |

Gallery thumbnails are not tracked in git; they are regenerated from `gallery/**` on every build and deploy.

## Further reading

- [`_docs/build.md`](_docs/build.md) — build pipeline, check scripts, visual regression harness
- [`_docs/layouts.md`](_docs/layouts.md) — the layouts and the gallery system
- [`_docs/photos-pipeline.md`](_docs/photos-pipeline.md) — photo originals on R2 and the processing workflow
- [`CLAUDE.md`](CLAUDE.md) — repo map, design philosophy, and authoring rules
