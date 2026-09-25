/**
 * The lightbox: each frame as a matted print over a wash of its own colours, a scrubber, a slow
 * slideshow, picture-only mode, and the specs panel.
 *
 * The specs come out with every frame. Pinned (the default) they keep their place and the print
 * makes room; on auto-hide they float over the print and slip away after a moment, coming back
 * when the pointer reaches for the right edge. Both choices are remembered on this browser.
 *
 * Markup: _includes/photobook/lightbox.html. Styles: _sass/_photobook.scss.
 */

const DWELL = 7000, AUTOHIDE = 2800, MAX_CROP = 0.15;
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
};
const still = () => window.QSD?.motionOff?.() || matchMedia('(prefers-reduced-motion: reduce)').matches;

/** The sun's glyph and phrase, as _includes/photobook/sun.html draws them. */
export function sunGlyph(l, cls = 'photobook-sun__glyph') {
  return `<svg class="${cls}" viewBox="0 0 20 16" aria-hidden="true"><path class="photobook-sun__arc" d="M2 11A8 8 0 0 1 18 11"/><path class="photobook-sun__horizon" d="M0 11H20"/><circle class="photobook-sun__dot${l.below ? ' photobook-sun__dot--below' : ''}" cx="${l.x}" cy="${l.y}" r="1.7"/></svg>`;
}

export function lightbox(frames) {
  const lb = document.getElementById('photobook-lightbox');
  if (!lb) return { open() {}, openFromHash() {} };
  const $ = (s) => lb.querySelector(s);
  const mat = $('.photobook-lightbox__mat'), wash = $('.photobook-lightbox__wash');
  const specsEl = $('.photobook-specs'), specsIn = $('.photobook-specs__inner');
  let order = frames.map((_, i) => i), pos = -1, timer = 0, raf = 0, t0 = 0, idleT = 0, specT = 0, lastFocus = null;
  let specOpen = store.get('photobook-specs') !== 'closed', pinned = store.get('photobook-pin') !== 'auto';
  const cur = () => frames[order[pos]];
  const pressed = (act, on) => $(`[data-act="${act}"]`)?.setAttribute('aria-pressed', String(on));

  // The smallest rendition at least as wide as the print will be drawn, and never past 2560 px:
  // beyond that a screen shows no more, and the 4096 file is several times the weight.
  const MAX_W = 2560;
  const srcFor = (p) => {
    const want = Math.min(window.innerWidth, window.innerHeight * (p.ratio || 1.5), MAX_W / 2) * Math.min(window.devicePixelRatio || 1, 2);
    const fit = p.sizes.filter((s) => s <= MAX_W);
    const w = fit.find((s) => s >= want) || fit[fit.length - 1] || p.sizes[0] || 1920;
    return `${p.url}/${w}.webp`;
  };

  // Picture only fills the screen when the frame's shape is close to it: at most 15% is cropped,
  // so a 16:9 frame fills a MacBook's screen. Further apart it is shown whole on black.
  const fitFor = (p) => {
    const screen = window.innerWidth / window.innerHeight, r = p?.ratio || screen;
    const crop = 1 - Math.min(r, screen) / Math.max(r, screen);
    lb.style.setProperty('--fit', crop <= MAX_CROP ? 'cover' : 'contain');
  };

  function open(i, visible, fromImg) {
    order = visible?.length ? visible : frames.map((_, k) => k);
    lastFocus = document.activeElement;
    const run = () => { lb.showModal(); buildRail(); applySpecs(); show(Math.max(0, order.indexOf(i)), { instant: true }); wake(); };
    if (document.startViewTransition && fromImg && !still()) {
      fromImg.style.viewTransitionName = 'photobook-print';
      const t = document.startViewTransition(() => {
        fromImg.style.viewTransitionName = '';
        run();
        const on = mat.querySelector('img.is-on'); if (on) on.style.viewTransitionName = 'photobook-print';
      });
      t.ready.catch(() => {});
      t.finished.catch(() => {}).finally(() => mat.querySelectorAll('img').forEach((im) => { im.style.viewTransitionName = ''; }));
    } else run();
  }

  lb.addEventListener('close', () => {
    stop(); clearTimeout(specT);
    lb.classList.remove('has-specs', 'is-pinned', 'is-bare', 'is-zoomed', 'is-idle'); pressed('bare', false);
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    mat.replaceChildren(); wash.replaceChildren(); pos = -1;
    history.replaceState(null, '', location.pathname + location.search);
    lastFocus?.focus?.({ preventScroll: true });
  });

  function show(n, { instant = false, slow = false, dir = 0 } = {}) {
    n = (n + order.length) % order.length;
    if (n === pos) return;
    pos = n;
    const p = cur(), i = order[pos];
    lb.classList.remove('is-zoomed');
    fitFor(p);
    // The print drifts in from the side it came from; the old one leaves the other way.
    const old = [...mat.querySelectorAll('img')];
    // A light rendition shows at once; the full one takes its place as soon as it is decoded.
    const im = new Image(), full = srcFor(p), quick = `${p.url}/${p.sizes.find((s) => s >= 960) || p.sizes[0] || 960}.webp`;
    im.alt = p.name; im.draggable = false; im.decoding = 'async'; im.src = quick;
    if (full !== quick) { const big = new Image(); big.src = full; big.decode().then(() => { if (im.isConnected) im.src = full; }, () => {}); }
    im.style.setProperty('--d', String(dir));
    mat.style.setProperty('--xf', still() ? '0s' : slow ? '1.6s' : '.55s');
    mat.appendChild(im);
    const reveal = () => requestAnimationFrame(() => {
      im.classList.add('is-on');
      for (const o of old) { o.style.setProperty('--d', String(-dir)); o.classList.remove('is-on'); setTimeout(() => o.remove(), slow ? 1700 : 900); }
    });
    if (instant || im.complete) reveal(); else im.decode().then(reveal, reveal);
    // The room takes the print's colour, from its placeholder (already soft, so no blur).
    if (p.ph) {
      const a = document.createElement('div'); a.style.backgroundImage = `url(${p.ph})`; wash.appendChild(a);
      requestAnimationFrame(() => { a.classList.add('is-on'); for (const x of [...wash.children]) if (x !== a) { x.classList.remove('is-on'); setTimeout(() => x.remove(), 1300); } });
    }
    $('.photobook-lightbox__count').innerHTML = `<b>${String(pos + 1).padStart(2, '0')}</b> / ${String(order.length).padStart(2, '0')}`;
    $('.photobook-lightbox__caption').innerHTML = captionHTML(p);
    specsIn.innerHTML = specsHTML(p);
    for (const [k, b] of [...$('.photobook-lightbox__rail').children].entries()) b.classList.toggle('is-on', k === pos);
    for (const d of [1, -1]) { const q = frames[order[(pos + d + order.length) % order.length]]; if (q) new Image().src = srcFor(q); }
    history.replaceState(null, '', `#${p.slug}`);
    if (timer) restart();
    if (specOpen && !pinned && !timer) revealSpecs();
    return i;
  }

  const specsLine = (p) => [
    p.focal && `<span><b>${Math.round(p.focal)}</b>mm</span>`, p.aperture && `<span><b>ƒ/${p.aperture}</b></span>`,
    p.shutter && `<span><b>${esc(p.shutter)}</b>s</span>`, p.iso && `<span>ISO <b>${p.iso}</b></span>`,
    p.light && `<span class="photobook-sun">${sunGlyph(p.light)}${esc(p.light.text)}</span>`,
    p.film && `<span class="photobook-film" style="--film:${p.hue}"><i></i>${esc(p.film)}</span>`,
  ].filter(Boolean).join('');

  const captionHTML = (p) => `<h3>${esc(p.name)}</h3>${p.city ? `<span class="photobook-lightbox__city">${esc(p.city)}</span>` : ''}<div class="photobook-lightbox__specs-line">${specsLine(p)}</div>`;

  function specsHTML(p) {
    const ev = p.bias ? ` · ${p.bias > 0 ? '+' : '−'}${Math.abs(Math.round(p.bias * 100) / 100)} EV` : '';
    const sun = p.light ? `<div class="photobook-specs__sun"><b>${sunGlyph(p.light)}${String(p.light.alt).replace('-', '−')}°<em>${esc(p.light.text.startsWith('Sun at') ? (p.light.alt >= 0 ? 'above the horizon' : 'below the horizon') : p.light.text)}</em></b><span>Sun</span></div>` : '';
    const wide = ([, v]) => String(v).length > 12;
    const settings = p.settings?.length ? `<dl class="photobook-specs__settings">${[...p.settings.filter((s) => !wide(s)), ...p.settings.filter(wide)].map(([k, v]) => `<div${wide([k, v]) ? ' class="is-wide"' : ''}><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : '';
    return `<div class="photobook-specs__head"><span class="photobook-specs__no">${esc(p.frame.replace(/^DSCF/i, 'DSCF '))}${p.shots ? ` · № ${Number(p.shots).toLocaleString('en-GB')}` : ''}</span>
        <button class="photobook-specs__pin" type="button" data-act="pin" aria-pressed="${pinned}" title="${pinned ? 'Pinned: stays open' : 'Auto-hide: slips away'}"><svg viewBox="0 0 12 12" aria-hidden="true">${pinned ? '<path d="M4 1.5h4M5 1.5v4L3 7.5h6L7 5.5v-4M6 7.5V11"/>' : '<path d="M1.5 6h9M7.5 3l3 3-3 3"/>'}</svg>${pinned ? 'Pinned' : 'Auto-hide'}</button>
        <h3>${esc(p.name)}</h3>${p.city ? `<span class="photobook-specs__city">${esc(p.city)}</span>` : ''}</div>
      <div class="photobook-specs__highlights">
        <div><b>${p.focal ? Math.round(p.focal) : '—'}<small>mm</small></b><span>Focal length</span></div>
        <div><b><i>ƒ</i>/${p.aperture ?? '—'}</b><span>Aperture</span></div>
        <div><b>${esc(p.shutter || '—')}<small>s</small></b><span>Shutter</span></div>
        <div><b>${p.iso ?? '—'}</b><span>ISO${ev}</span></div>
        ${sun}
        ${p.film ? `<div class="photobook-specs__film"><div class="photobook-specs__print" style="--film:${p.hue}">${esc(p.film)}</div></div>` : ''}
      </div>
      ${p.camera || p.lens ? `<p class="photobook-specs__gear"><b>${esc(p.camera || '')}</b>${p.lens ? ` · ${esc(p.lens)}` : ''}</p>` : ''}
      ${settings}`;
  }

  function buildRail() {
    const rail = $('.photobook-lightbox__rail');
    rail.innerHTML = order.map((i, k) => `<button type="button" data-k="${k}" aria-label="Frame ${k + 1}: ${esc(frames[i].name)}"><span class="photobook-lightbox__peek"></span></button>`).join('');
  }
  const rail = $('.photobook-lightbox__rail');
  // A preview is only fetched the first time the pointer rests on its mark.
  rail.addEventListener('pointerover', (e) => {
    const b = e.target.closest('button'); const pk = b?.querySelector('.photobook-lightbox__peek');
    if (pk && !pk.style.backgroundImage) { const p = frames[order[Number(b.dataset.k)]]; pk.style.backgroundImage = `url(${p.url}/${p.sizes[0] || 480}.webp)`; }
  });
  rail.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; const k = Number(b.dataset.k); stop(); show(k, { dir: Math.sign(k - pos) }); });

  // The panel's state: open or closed (the toolbar button), pinned or auto-hide (the pin inside it).
  function applySpecs() {
    clearTimeout(specT);
    const bare = lb.classList.contains('is-bare');
    lb.classList.toggle('is-pinned', specOpen && pinned && !bare);
    lb.classList.toggle('has-specs', specOpen && !bare);
    pressed('specs', specOpen);
    if (specOpen && !pinned) specT = setTimeout(() => { if (!specsEl.matches(':hover')) lb.classList.remove('has-specs'); }, AUTOHIDE);
  }
  const revealSpecs = () => { if (specOpen && !lb.classList.contains('is-bare')) { lb.classList.add('has-specs'); applySpecs(); } };
  function toggleSpecs() { specOpen = !specOpen; store.set('photobook-specs', specOpen ? 'open' : 'closed'); if (specOpen) bare(false); applySpecs(); }
  function togglePin() { pinned = !pinned; store.set('photobook-pin', pinned ? 'pinned' : 'auto'); specsIn.innerHTML = specsHTML(cur()); applySpecs(); }
  function bare(on = !lb.classList.contains('is-bare')) {
    lb.classList.toggle('is-bare', on); pressed('bare', on);
    if (on) lb.classList.remove('has-specs', 'is-pinned'); else applySpecs();
    // Picture only asks for the whole screen where the browser allows it; the page never depends on it.
    if (on && !document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
    if (!on && document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    wake();
  }
  function wake() { lb.classList.remove('is-idle'); clearTimeout(idleT); idleT = setTimeout(() => lb.classList.add('is-idle'), lb.classList.contains('is-bare') ? 1000 : 3200); }
  specsEl.addEventListener('pointerleave', () => { if (specOpen && !pinned) applySpecs(); });

  // The slideshow: a slow crossfade, a gentle push, a gold hairline for the dwell. Any touch stops it.
  const progress = $('.photobook-lightbox__progress'), playGlyph = $('.photobook-lightbox__play');
  function restart() { clearTimeout(timer); cancelAnimationFrame(raf); t0 = performance.now(); tick(); timer = setTimeout(() => show(pos + 1, { slow: true }), DWELL); }
  function tick() { progress.style.width = `${Math.min(100, (performance.now() - t0) / DWELL * 100)}%`; if (timer) raf = requestAnimationFrame(tick); }
  function play() { lb.classList.add('is-playing'); lb.style.setProperty('--dwell', `${DWELL + 1600}ms`); pressed('play', true); playGlyph.setAttribute('d', 'M9 6v12M15 6v12'); timer = 1; restart(); }
  function stop() { lb.classList.remove('is-playing'); pressed('play', false); playGlyph.setAttribute('d', 'M8 5.5v13l10.5-6.5z'); clearTimeout(timer); cancelAnimationFrame(raf); timer = 0; progress.style.width = '0'; }

  const next = () => { stop(); show(pos + 1, { dir: 1 }); };
  const prev = () => { stop(); show(pos - 1, { dir: -1 }); };
  const ACTS = { next, prev, close: () => lb.close(), specs: toggleSpecs, pin: togglePin, bare: () => bare(), play: () => (timer ? stop() : play()) };
  lb.addEventListener('click', (e) => { const b = e.target.closest('[data-act]'); if (b && ACTS[b.dataset.act]) { ACTS[b.dataset.act](); wake(); } });
  lb.addEventListener('cancel', (e) => {
    if (lb.classList.contains('is-zoomed')) { e.preventDefault(); lb.classList.remove('is-zoomed'); }
    else if (lb.classList.contains('is-bare')) { e.preventDefault(); bare(false); }
  });
  window.addEventListener('keydown', (e) => {
    if (!lb.open || e.target.matches?.('input,textarea')) return;
    const k = e.key.toLowerCase();
    if (k === 'arrowright') next(); else if (k === 'arrowleft') prev();
    else if (k === ' ' || k === 's') ACTS.play(); else if (k === 'i') toggleSpecs(); else if (k === 'p') togglePin(); else if (k === 'f') bare();
    else if (k === 'z') lb.classList.toggle('is-zoomed'); else return;
    e.preventDefault(); wake();
  });
  window.addEventListener('resize', () => { if (lb.open && pos >= 0) fitFor(cur()); });

  // Loupe: double-click to look closer; the print follows the pointer.
  const origin = (e) => { const r = mat.getBoundingClientRect(); lb.style.setProperty('--ox', `${((e.clientX - r.left) / r.width * 100).toFixed(1)}%`); lb.style.setProperty('--oy', `${((e.clientY - r.top) / r.height * 100).toFixed(1)}%`); };
  mat.addEventListener('dblclick', (e) => { origin(e); lb.classList.toggle('is-zoomed'); });
  mat.addEventListener('pointermove', (e) => { if (lb.classList.contains('is-zoomed')) origin(e); });

  // Touch: swipe to move, swipe up for the specs, tap to bring the tools back.
  let sx = null, sy = 0;
  lb.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse' || e.target.closest('button,.photobook-specs')) return; sx = e.clientX; sy = e.clientY; if (timer) stop(); });
  lb.addEventListener('pointerup', (e) => {
    if (sx === null) return;
    const dx = e.clientX - sx, dy = e.clientY - sy; sx = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) (dx < 0 ? next : prev)();
    else if (dy < -60) { if (!specOpen) toggleSpecs(); else revealSpecs(); }
    else if (dy > 60 && lb.classList.contains('has-specs')) { if (pinned) toggleSpecs(); else lb.classList.remove('has-specs'); }
    else if (lb.classList.contains('is-idle')) { wake(); revealSpecs(); } else { lb.classList.add('is-idle'); clearTimeout(idleT); }
  });
  // On auto-hide, reaching toward the right edge brings the specs back.
  lb.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    wake();
    if (specOpen && !pinned && !lb.classList.contains('has-specs') && e.clientX > window.innerWidth - 340) revealSpecs();
  });

  return {
    open,
    /** A link to a frame (#slug) opens it straight away. */
    openFromHash() {
      const slug = decodeURIComponent(location.hash.slice(1));
      const i = slug ? frames.findIndex((p) => p.slug === slug) : -1;
      if (i >= 0) open(i);
    },
  };
}
