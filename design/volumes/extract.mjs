// Brainstorm only (design/ is gitignored): condense the parent voyages' chapters into data.js
// for the volume prototypes. Dates only, never clock times.
// Run from the worktree root: node design/volumes/extract.mjs [manifest-dir]
import fs from 'node:fs';
import path from 'node:path';
import { colophonOf } from '../../scripts/photos/lib/book.mjs';

const root = process.cwd();
const dir = [process.argv[2], path.join(root, '_data/photo_manifests'), path.resolve(root, '../../../_data/photo_manifests')]
  .find((p) => p && fs.existsSync(p) && fs.readdirSync(p).some((f) => f.endsWith('.json')));
if (!dir) { console.error('No photo manifests found: run `npm run photos:fetch` first.'); process.exit(1); }
const VOYAGES = ['prague', 'japan', 'rome', 'dolomites'];

const front = (file) => {
  const t = fs.readFileSync(file, 'utf8').split(/^---\s*$/m)[1] || '';
  const get = (k) => (t.match(new RegExp(`^\\s*${k}:\\s*"?(.*?)"?\\s*$`, 'm')) || [])[1] || null;
  return { title: get('title'), excerpt: get('excerpt'), date: get('date'), gallery: get('gallery_name'), cover: get('overlay_image') };
};

const out = {};
for (const v of VOYAGES) {
  const vf = front(path.join(root, '_voyage', `${v}.md`));
  const chapters = [];
  for (const f of fs.readdirSync(path.join(root, '_subvoyage', v)).filter((f) => f.endsWith('.md'))) {
    const fm = front(path.join(root, '_subvoyage', v, f));
    const mf = path.join(dir, `${(fm.gallery || '').replace(/\//g, '_')}.json`);
    if (!fs.existsSync(mf)) { chapters.push({ ...fm, slug: f.replace(/\.md$/, ''), photos: [], cover: fm.cover }); continue; }
    const m = JSON.parse(fs.readFileSync(mf, 'utf8'));
    const photos = m.photos.map((p) => ({
      url: p.url, webp: p.sizes?.webp || [], ratio: p.ratio, w: p.w, h: p.h,
      film: p.film, hue: p.filmHue, place: p.place?.name || null, day: p.taken ? String(p.taken).slice(0, 10) : null,
      ph: p.ph, glow: p.glow, alt: p.alt, phase: p.light?.phase || null,
    }));
    const days = photos.map((p) => p.day).filter(Boolean).sort();
    chapters.push({
      slug: f.replace(/\.md$/, ''), title: fm.title, excerpt: fm.excerpt, hero: fm.cover,
      coverIndex: m.book?.cover ?? 0, first: days[0] || fm.date, last: days[days.length - 1] || fm.date,
      films: m.book?.colophon?.films || [], photos,
    });
  }
  chapters.sort((a, b) => String(a.first).localeCompare(String(b.first)) || a.title.localeCompare(b.title));
  const all = chapters.flatMap((c) => c.photos);
  const col = colophonOf(all.map((p) => ({ film: p.film })));
  out[v] = { title: vf.title, excerpt: vf.excerpt, hero: vf.cover, chapters, films: col.films, frames: all.length };
}
fs.writeFileSync(path.join(root, 'design/volumes/data.js'), `window.VOLUMES = ${JSON.stringify(out)};\n`);
for (const [k, v] of Object.entries(out)) console.log(k, v.chapters.length, 'chapters,', v.frames, 'frames,', v.films.length, 'films');
