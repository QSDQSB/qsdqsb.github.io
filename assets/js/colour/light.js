/**
 * The Colour of Light (_pages/light.html): every photograph with a known sun, one column per degree
 * of the sun's altitude, each frame a small print of its own colours top to bottom (its grid's three
 * rows), darkest at the foot of its column. Under the pointer a frame shows itself and the sun, in
 * gold, stands at its altitude on the axis; a frame opens in its book. Then the light in bands, and
 * what the bands say, in sentences worked out from the numbers rather than written in advance.
 *
 * Data: /assets/colour-atlas.json (scripts/photos/lib/atlas.mjs).
 */

const LO = -20, HI = 70, COLS = HI - LO + 1;
// Few enough to read at a phone's width; the bands' dotted edges carry the finer divisions.
const TICKS = [LO, 0, 20, 45, HI];
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const deg = (d) => `${d < 0 ? '−' : ''}${Math.abs(d)}°`;
const still = () => window.QSD?.motionOff?.() || matchMedia('(prefers-reduced-motion: reduce)').matches;
const lum = (h) => { const n = parseInt(h.slice(1), 16); return 0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255); };
const pct = (col) => `${(col / COLS) * 100}%`;

const root = document.getElementById('colour-light');
const plot = root?.querySelector('.colour-sky__plot');

async function main() {
  let data = null;
  try { data = await (await fetch(new URL('../../colour-atlas.json', import.meta.url))).json(); } catch { /* shown below */ }
  const all = data?.photos || [];
  const sunned = all.filter((p) => p.alt != null && p.strip);
  if (!sunned.length) {
    root.querySelector('.colour-sky').insertAdjacentHTML('beforebegin', '<p class="colour-empty">The colours are still being read from the photographs.</p>');
    root.querySelector('.colour-sky').hidden = true;
    return;
  }
  const pages = data.pages || {};

  // Columns by degree, the edges holding everything beyond; darkest at the foot.
  const cols = Array.from({ length: COLS }, () => []);
  sunned.forEach((p) => cols[Math.min(HI, Math.max(LO, Math.round(p.alt))) - LO].push(p));
  const light = (p) => p.sw.reduce((s, h, i) => s + lum(h) * p.pc[i], 0);
  for (const c of cols) c.sort((a, b) => light(a) - light(b));
  const rows = Math.max(...cols.map((c) => c.length));
  plot.style.setProperty('--cols', COLS);
  plot.style.setProperty('--rows', rows);

  const tiles = [];
  cols.forEach((c, x) => c.forEach((p, y) => {
    const t = document.createElement('i');
    t.className = 'colour-tile';
    t.style.cssText = `--c:${x};--s:${y};--t:${p.strip[0]};--m:${p.strip[1]};--b:${p.strip[2]}`;
    t.dataset.i = all.indexOf(p);
    tiles.push(t);
  }));
  plot.append(...tiles);

  // The axis: the horizon drawn through the sky, degrees beneath, the bands named along the foot.
  const axis = root.querySelector('.colour-sky__axis');
  const bands = (data.bands || []).filter((b) => b.n > 0);
  axis.innerHTML = `${TICKS.map((d) => `<span class="colour-sky__tick${d === 0 ? ' is-horizon' : ''}${d === LO ? ' is-first' : ''}${d === HI ? ' is-last' : ''}" style="left:${pct(d - LO + 0.5)}">${d === 0 ? 'Horizon' : `${d === LO ? '≤ ' : d === HI ? '≥ ' : ''}${deg(d)}`}</span>`).join('')}
    <span class="colour-sky__sun"></span>`;
  plot.insertAdjacentHTML('beforeend', `<span class="colour-sky__horizon" style="left:${pct(-LO + 0.5)}"></span>`
    + bands.filter((b) => b.lo > LO && b.lo <= HI).map((b) => `<span class="colour-sky__edge" style="left:${pct(b.lo - LO)}"></span>`).join(''));
  const without = all.length - sunned.length;
  root.querySelector('.colour-sky__note').textContent = `${sunned.length} photographs, one column for each degree of the sun above or below the horizon.${without ? ` ${without} have no sun to stand under (taken from the air, or with no position) and are left out.` : ''}`;

  // A frame in hand: its print, its place, its light; the sun at its altitude. It opens in its book.
  const card = root.querySelector('.colour-card');
  const sun = axis.querySelector('.colour-sky__sun');
  let on = null;
  const show = (t, x, y) => {
    if (on === t) return place(x, y);
    on?.classList.remove('is-on');
    on = t; t.classList.add('is-on'); plot.classList.add('has-on');
    const p = all[t.dataset.i], page = pages[p.g];
    card.innerHTML = `<img src="${p.url}/${p.sizes[0] || 480}.webp" alt="" width="480" height="${Math.round(480 / (p.r || 1.5))}" style="background:linear-gradient(${p.strip.join(',')})">
      <p class="colour-card__name">${esc(p.name)}</p>
      <p class="colour-card__meta">${esc([p.city, page?.title].filter((v, i, a) => v && a.indexOf(v) === i).join(' · '))}</p>
      <p class="colour-card__light"><b>${deg(p.alt)}</b>${esc(p.light || '')}</p>`;
    card.hidden = false;
    sun.style.left = pct(Math.min(HI, Math.max(LO, Math.round(p.alt))) - LO + 0.5);
    sun.classList.add('is-on');
    place(x, y);
  };
  const hide = () => { on?.classList.remove('is-on'); on = null; plot.classList.remove('has-on'); card.hidden = true; sun.classList.remove('is-on'); };
  function place(x, y) {
    const r = card.getBoundingClientRect(), m = 12;
    let left = x + 18, top = y - r.height - 18;
    if (left + r.width > innerWidth - m) left = x - r.width - 18;
    if (top < m) top = y + 18;
    card.style.left = `${Math.max(m, left)}px`; card.style.top = `${Math.max(m, top)}px`;
  }
  const open = (t) => { const p = all[t.dataset.i], page = pages[p.g]; if (page) location.href = `${page.url}#${p.slug}`; };
  plot.addEventListener('pointermove', (e) => { const t = e.target.closest('.colour-tile'); if (t) show(t, e.clientX, e.clientY); else if (e.pointerType === 'mouse') hide(); });
  plot.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') hide(); });
  // A mouse opens at once; a finger's first touch shows the frame, a second opens it.
  plot.addEventListener('click', (e) => {
    const t = e.target.closest('.colour-tile'); if (!t) return;
    if (e.pointerType === 'mouse' || on === t) open(t); else show(t, e.clientX, e.clientY);
  });
  card.addEventListener('click', () => on && open(on));
  addEventListener('scroll', () => { if (on) hide(); }, { passive: true });

  // The bands: each one's colours pooled from its frames, its range, its count.
  root.querySelector('.colour-bands').innerHTML = bands.map((b) => `<div class="colour-band">
      <h3>${esc(b.label)}</h3>
      <p class="colour-band__range">${b.lo <= -90 ? `below ${deg(b.hi)}` : b.hi > 90 ? `above ${deg(b.lo)}` : `${deg(b.lo)} to ${deg(b.hi)}`}</p>
      <div class="colour-band__bar">${b.palette.map((s) => `<i style="--c:${s.hex};flex:${s.pc}" title="${s.hex.toUpperCase()} · ${s.pc}%"></i>`).join('')}</div>
      <p class="colour-band__n"><b>${b.n}</b> frame${b.n === 1 ? '' : 's'}</p>
    </div>`).join('');

  root.querySelector('.colour-findings').textContent = findings(bands);

  // The sky fills from night to noon, a column at a time: once, on arrival.
  if (!still()) {
    for (const t of tiles) {
      const c = Number(t.style.getPropertyValue('--c')), s = Number(t.style.getPropertyValue('--s'));
      t.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 520, delay: 120 + c * 18 + s * 10, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'backwards' });
    }
  }
}

/**
 * What the bands say, only where the numbers say it: where the frames lean furthest to red and to
 * yellow (and whether the red comes first), and whether the light stops brightening after a point.
 */
function findings(bands) {
  const solid = bands.filter((b) => b.n >= 8);
  if (solid.length < 3) return '';
  const out = [];
  const rose = solid.reduce((a, b) => (b.rose > a.rose ? b : a)), gold = solid.reduce((a, b) => (b.gold > a.gold ? b : a));
  const lower = (b) => b.label.charAt(0).toLowerCase() + b.label.slice(1);
  if (rose !== gold && rose.rose > 0.5 && gold.gold > 0.5) {
    out.push(solid.indexOf(rose) < solid.indexOf(gold)
      ? `The rose comes before the gold: the frames lean furthest towards red at ${lower(rose)}, and towards yellow only at ${lower(gold)}.`
      : `The frames lean furthest towards red at ${lower(rose)}, and furthest towards yellow at ${lower(gold)}.`);
  }
  // The first band from which every later one keeps the same lightness, within a shade.
  const k = solid.findIndex((b, i) => i > 0 && solid.slice(i).every((c) => Math.abs(c.L - b.L) < 0.03));
  if (k > 0 && k < solid.length - 1 && solid[k].L > solid[0].L + 0.1) {
    out.push(`Past ${deg(solid[k].lo)} the light stops brightening: from ${lower(solid[k])} to ${lower(solid[solid.length - 1])}, the frames keep one lightness.`);
  }
  return out.join(' ');
}

if (root && plot) main();
