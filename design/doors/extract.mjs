// Brainstorm only (design/ is gitignored): every door on the site — 28 voyages, their parts —
// with its authored cover, depth map, poem, and an atmosphere line (light · weather · when).
// Dates only, never clock times. Run from the worktree root: node design/doors/extract.mjs
import fs from 'node:fs';
import path from 'node:path';
import { weatherOf } from '../../scripts/photos/lib/book.mjs';

const root = process.cwd();
// The merged manifests (`npm run photos:fetch`): this checkout's own, else the main checkout's when run
// from a worktree under .claude/worktrees/, else a path given as the first argument.
const MAN = [process.argv[2], path.join(root, '_data/photo_manifests'), path.resolve(root, '../../../_data/photo_manifests')]
  .find((p) => p && fs.existsSync(p) && fs.readdirSync(p).some((f) => f.endsWith('.json')));
if (!MAN) { console.error('No photo manifests found: run `npm run photos:fetch` first.'); process.exit(1); }

const front = (file) => {
  const t = fs.readFileSync(file, 'utf8').split(/^---\s*$/m)[1] || '';
  const get = (k) => (t.match(new RegExp(`^\\s*${k}:\\s*"?(.*?)"?\\s*$`, 'm')) || [])[1] || null;
  return { title: get('title'), excerpt: get('excerpt'), date: get('date'), gallery: get('gallery_name'), cover: get('overlay_image'), subgalleries: /^subgalleries:\s*true/m.test(t) };
};
const mode = (xs) => { const m = new Map(); for (const x of xs) if (x) m.set(x, (m.get(x) || 0) + 1); return [...m].sort((a, b) => b[1] - a[1])[0]?.[0] || null; };
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function photosOf(gallery) {
  if (!gallery) return [];
  const f = path.join(MAN, `${gallery.replace(/\//g, '_')}.json`);
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')).photos : [];
}
// The feel of a set of frames, in words: the light that dominates, the air, the months.
function atmosphere(photos) {
  if (!photos.length) return null;
  const light = mode(photos.map((p) => {
    const l = p.light; if (!l) return null;
    if (l.phase === 'golden') return 'Golden hour';
    if (l.phase === 'night') return l.below && /blue/i.test(l.text) ? 'Blue hour' : 'After dark';
    return /before|after/.test(l.text) ? 'Low sun' : l.text;
  }));
  const w = photos.map((p) => weatherOf(p.weather, p.light)).filter(Boolean);
  const ts = w.map((x) => x.t).sort((a, b) => a - b);
  const air = w.length ? `${Math.round(ts[Math.floor(ts.length / 2)])} °C, ${mode(w.map((x) => x.text)).toLowerCase()}` : null;
  const days = [...new Set(photos.map((p) => String(p.taken || '').slice(0, 10)).filter(Boolean))].sort();
  const visits = [];
  for (const d of days) {
    const v = visits[visits.length - 1];
    if (v && (new Date(d) - new Date(v[v.length - 1])) / 864e5 < 21) v.push(d); else visits.push([d]);
  }
  const when = visits.map((v) => { const [y, m] = v[0].split('-'); return `${MONTHS[+m - 1]} ${y}`; }).join(' · ');
  // The page's glow, from the frames' own colours (the median frame).
  const glow = photos[Math.floor(photos.length / 2)]?.glow || null;
  return { light, air, when, glow };
}
const depthOf = (cover) => cover && fs.existsSync(path.join(root, 'images/depth', `${cover}.depth.jpg`)) ? `images/depth/${cover}.depth.jpg` : null;

const voyages = [];
for (const f of fs.readdirSync(path.join(root, '_voyage')).filter((f) => f.endsWith('.md'))) {
  const slug = f.replace(/\.md$/, '');
  const fm = front(path.join(root, '_voyage', f));
  const door = { slug, title: fm.title, excerpt: fm.excerpt, date: fm.date, cover: fm.cover, depth: depthOf(fm.cover) };
  if (fm.subgalleries) {
    const dir = path.join(root, '_subvoyage', slug);
    const parts = fs.readdirSync(dir).filter((x) => x.endsWith('.md')).map((x) => {
      const p = front(path.join(dir, x)), ph = photosOf(p.gallery);
      return { slug: `${slug}/${x.replace(/\.md$/, '')}`, title: p.title, excerpt: p.excerpt, date: p.date, cover: p.cover, depth: depthOf(p.cover), atmos: atmosphere(ph), frames: ph.length };
    }).sort((a, b) => String(a.date).localeCompare(String(b.date)) || a.title.localeCompare(b.title));
    door.parts = parts;
    door.atmos = atmosphere(parts.flatMap((p) => photosOf(`${slug}/${p.slug.split('/')[1]}`)));
    // Prague's streetscape part is stored under another gallery name; fall back to the parts' own.
    if (!door.atmos) door.atmos = parts.find((p) => p.atmos)?.atmos || null;
  } else {
    const ph = photosOf(fm.gallery);
    door.atmos = atmosphere(ph); door.frames = ph.length;
  }
  voyages.push(door);
}
voyages.sort((a, b) => String(b.date).localeCompare(String(a.date)));
fs.writeFileSync(path.join(root, 'design/doors/data.js'), `window.DOORS = ${JSON.stringify(voyages)};\n`);
const parts = voyages.reduce((n, v) => n + (v.parts?.length || 0), 0);
console.log(voyages.length, 'voyages,', parts, 'parts;', voyages.filter((v) => v.depth).length + voyages.flatMap((v) => v.parts || []).filter((p) => p.depth).length, 'with depth maps');
for (const v of voyages.slice(0, 6)) console.log(v.title, '|', v.excerpt, '|', v.atmos && [v.atmos.light, v.atmos.air, v.atmos.when].join(' · '));
