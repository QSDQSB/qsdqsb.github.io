/**
 * The lightbox: each frame as a matted print over a wash of its own colours, a scrubber, a slow
 * slideshow, picture-only mode, and the specs panel.
 *
 * The specs come out with every frame and keep their place, the print making room; the ≡ button
 * (or I) puts them away and brings them back, and the choice is remembered on this browser.
 *
 * Markup: _includes/photobook/lightbox.html. Styles: _sass/_photobook.scss.
 *
 * Away from its book (Reverie, assets/js/colour/reverie.js) it takes frames from many voyages, each
 * naming its own (`g`, `voyage`), and three things from the page: `printOf(i)`, where a frame's print
 * stands on it (to close back into); `mark(p)`, a mark for each frame on the rail in place of the tick;
 * and frames that are painted rather than photographed (`paint()`, a colour), which have no specs.
 */

import { crossfade } from './wash.js';
import { esc, sunGlyph, specsHTML } from './specs.js';

const DWELL = 7000, MAX_CROP = 0.15, HOLD = 200, SLOW = 160;
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
};
const still = () => window.QSD?.motionOff?.() || matchMedia('(prefers-reduced-motion: reduce)').matches;

export function lightbox(frames, { printOf = null, mark = null } = {}) {
  const lb = document.getElementById('photobook-lightbox');
  if (!lb) return { open() {}, openFromHash() {}, screen() {}, prefetch() {} };
  const $ = (s) => lb.querySelector(s);
  const mat = $('.photobook-lightbox__mat'), wash = $('.photobook-lightbox__wash');
  const specsEl = $('.photobook-specs'), specsIn = $('.photobook-specs__inner');
  let order = frames.map((_, i) => i), pos = -1, timer = 0, raf = 0, t0 = 0, idleT = 0, lastFocus = null, turn = 0, holdT = 0, slowT = 0;
  let specOpen = store.get('photobook-specs') !== 'closed';
  const cur = () => frames[order[pos]];
  // Where a frame's print stands on the page, to close back into: in the book, its frame.
  const printFor = printOf || ((i) => [...document.querySelectorAll(`.photobook-frame[data-i="${i}"] .photobook-frame__print`)].find((b) => b.offsetParent));
  const pressed = (act, on) => $(`[data-act="${act}"]`)?.setAttribute('aria-pressed', String(on));

  // The smallest rendition at least as wide as the print will be drawn on this screen, in device
  // pixels. Framed, never past 2880 px (the 4096 file is several times the weight for little more);
  // picture only and the loupe may take the largest.
  // Renditions are named by their long edge, so a portrait needs a larger name for the same width.
  const srcFor = (p) => {
    if (p.paint) return null;
    const r = p.ratio || 1.5, bare = lb.classList.contains('is-bare'), zoomed = lb.classList.contains('is-zoomed');
    const [bw, bh] = matBox();
    const fill = bare && lb.style.getPropertyValue('--fit') === 'cover';
    const width = (fill ? Math.max : Math.min)(bw, bh * r) * Math.min(window.devicePixelRatio || 1, 3) * (zoomed ? Math.max(2.2, zoom) : 1);
    const want = width / Math.min(1, r);
    const cap = bare || zoomed ? Infinity : 2880;
    const fit = p.sizes.filter((s) => s <= cap);
    const w = fit.find((s) => s >= want) || fit[fit.length - 1] || p.sizes[0] || 1920;
    return `${p.url}/${w}.webp`;
  };
  // The mat's room for a print. Closed, the dialog has no layout to measure, so a print asked for
  // ahead (prefetch) is sized from the mat as it last stood open, kept on this browser as its share of
  // the window; before any opening there is nothing to go by, and nothing is asked for.
  let matShare = (store.get('photobook-mat') || '').split(',').map(Number);
  if (!(matShare[0] > 0 && matShare[0] <= 1 && matShare[1] > 0 && matShare[1] <= 1)) matShare = null;
  const matBox = () => {
    const box = mat.getBoundingClientRect();
    if (box.width) return [box.width, box.height];
    return matShare ? [matShare[0] * window.innerWidth, matShare[1] * window.innerHeight] : [0, 0];
  };
  // Kept when the mat has come to rest (its inset eases as the specs fold) and as the lightbox closes.
  const keepMat = () => {
    const box = mat.getBoundingClientRect();
    if (!box.width || lb.classList.contains('is-bare')) return;
    matShare = [box.width / window.innerWidth, box.height / window.innerHeight];
    store.set('photobook-mat', matShare.map((x) => x.toFixed(3)).join(','));
  };
  // Renditions already fetched: a frame whose full print is in hand shows it at once, no light one first.
  // Those on their way are kept by address, so one is never asked for twice, and those no longer
  // wanted (the frame was passed) are let go.
  const seen = new Set(), loading = new Map();
  const fetchImg = (src) => {
    let x = loading.get(src); if (x) return x;
    x = new Image(); loading.set(src, x); x.src = src;
    x.decode().then(() => seen.add(src), () => {}).finally(() => { if (loading.get(src) === x) loading.delete(src); });
    return x;
  };
  const letGo = (keep) => { for (const [src, x] of loading) if (!keep.has(src)) { loading.delete(src); x.src = ''; } };

  // Picture only fills the screen when the frame's shape is close to it: at most 15% is cropped,
  // so a 16:9 frame fills a MacBook's screen. Further apart it is shown whole on black.
  const fitFor = (p) => {
    const screen = window.innerWidth / window.innerHeight, r = p?.ratio || screen;
    const crop = 1 - Math.min(r, screen) / Math.max(r, screen);
    lb.style.setProperty('--fit', crop <= MAX_CROP ? 'cover' : 'contain');
  };

  // Opening adds one history entry and moving between frames replaces it, so Back closes the
  // lightbox instead of leaving the voyage; closing by any other way steps back over that entry.
  let pushed = false, popping = false, stepping = false, returnTo = null, returnY = null, firstQuick = null;
  const settle = (el, y = null) => {
    if (y !== null) { window.scrollTo({ top: y, behavior: 'instant' }); el?.focus({ preventScroll: true }); return; }
    if (el) { el.scrollIntoView({ block: 'center' }); el.focus({ preventScroll: true }); }
  };
  function open(i, visible, fromImg) {
    order = visible?.length ? visible : frames.map((_, k) => k);
    lastFocus = document.activeElement;
    firstQuick = fromImg?.currentSrc || null;
    // Scroll restoration belongs to each entry: the one we will step back to must not restore its old scroll.
    history.scrollRestoration = 'manual';
    if (!history.state?.photobook) history.pushState({ photobook: true }, '', location.href);
    pushed = true;
    const at = Math.max(0, order.indexOf(i));
    const run = () => { lb.showModal(); buildRail(at); applySpecs(); show(at, { instant: true }); wake(); };
    if (document.startViewTransition && fromImg && !still()) {
      fromImg.style.viewTransitionName = 'photobook-print';
      const t = document.startViewTransition(async () => {
        fromImg.style.viewTransitionName = '';
        run();
        // The print just laid on the mat is the one the page's print grows into: named here, shown
        // without its own fade and decoded, so the transition's picture of it is the photograph.
        const on = mat.querySelector(':scope > img');
        if (!on) return;
        on.style.transition = 'none'; on.classList.add('is-on'); on.style.viewTransitionName = 'photobook-print';
        // The page stands still while this waits, so it waits only for a picture already in hand
        // (the page's own print, loaded), and never long.
        if (fromImg.complete && fromImg.naturalWidth) await Promise.race([on.decode().catch(() => {}), new Promise((r) => setTimeout(r, 200))]);
      });
      t.ready.catch(() => {});
      t.finished.catch(() => {}).finally(() => mat.querySelectorAll('img').forEach((im) => { im.style.viewTransitionName = ''; im.style.transition = ''; }));
    } else run();
  }

  lb.addEventListener('close', () => {
    // Back on the page where the reader left off: the frame last shown, in whichever view is out;
    // after a screening, the place the reader started it from.
    const here = !screening && pos >= 0 && printFor(order[pos]);
    const was = screening ? screenFrom : null;
    stop(); screening = false; lb.classList.remove('is-screening');
    lb.classList.remove('has-specs', 'is-pinned', 'is-bare', 'is-idle', 'is-painted'); pressed('bare', false); setZoom(1); placeSpecs();
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    mat.replaceChildren(); wash.replaceChildren(); pos = -1;
    clearTimeout(holdT); clearTimeout(slowT); turn++; letGo(new Set());
    const back = here || lastFocus;
    if (pushed && !popping) { stepping = true; returnTo = back; returnY = was; history.back(); }
    else { history.replaceState(null, '', location.pathname + location.search); settle(back, was); }
    pushed = false; popping = false;
  });
  window.addEventListener('popstate', () => {
    if (stepping) {
      stepping = false; history.replaceState(null, '', location.pathname + location.search);
      const el = returnTo, y = returnY; returnTo = null; returnY = null;
      requestAnimationFrame(() => { settle(el, y); history.scrollRestoration = 'auto'; });
      return;
    }
    if (lb.open) { popping = true; shut(); history.scrollRestoration = 'auto'; }
    else if (location.hash) openFromHash();
  });

  function show(n, { instant = false, slow = false, dir = 0 } = {}) {
    n = (n + order.length) % order.length;
    if (n === pos) return;
    pos = n;
    const p = cur(), i = order[pos];
    setZoom(1);
    lb.classList.toggle('is-single', order.length === 1);
    fitFor(p);
    // The mount beneath the print takes this frame's shape (_photobook.scss, .photobook-lightbox__mount).
    if (!mat.querySelector('.photobook-lightbox__mount')) mat.prepend(Object.assign(document.createElement('div'), { className: 'photobook-lightbox__mount' }));
    const mount = mat.querySelector('.photobook-lightbox__mount');
    lb.style.setProperty('--pr', String(p.ratio || 1.5));
    // The print drifts in from the side it came from; the old one leaves the other way.
    const old = [...mat.querySelectorAll(':scope > img, :scope > .photobook-lightbox__painted')], stale = [...mount.children];
    const mine = ++turn;
    clearTimeout(holdT); clearTimeout(slowT);
    const wasPainted = lb.classList.contains('is-painted');
    lb.classList.toggle('is-painted', !!p.paint);
    let im, full = null, quick = null;
    if (p.paint) { im = p.paint(); im.classList.add('photobook-lightbox__painted'); firstQuick = null; }
    else {
      // A light rendition shows at once; the full one takes its place as soon as it is decoded.
      im = new Image(); full = srcFor(p);
      quick = firstQuick || `${p.url}/${p.sizes.find((s) => s >= 960) || p.sizes[0] || 960}.webp`; firstQuick = null;
      im.alt = p.alt || p.name; im.draggable = false; im.decoding = 'async'; im.src = seen.has(full) ? full : quick;
    }
    // The full print, and the frames either side, are asked for once this frame has held a moment
    // (at once when the lightbox opens on it): a reader stepping through, or holding an arrow,
    // downloads none of the frames passed, and what a passed frame had started is let go.
    const beside = [1, -1].map((d) => frames[order[(pos + d + order.length) % order.length]]).filter((q) => q && q !== p && !q.paint).map(srcFor);
    letGo(new Set([full, ...beside]));
    holdT = setTimeout(() => {
      if (full && !seen.has(full) && full !== quick) fetchImg(full).decode().then(() => { if (im.isConnected) im.src = full; }, () => {});
      for (const f of beside) if (!seen.has(f)) fetchImg(f);
    }, instant ? 0 : HOLD);
    im.style.setProperty('--d', String(dir));
    mat.style.setProperty('--xf', still() ? '0s' : slow ? '1.6s' : '.55s');
    mat.appendChild(im);
    const leave = () => {
      for (const o of old.splice(0)) { o.style.scale = getComputedStyle(o).scale; o.style.setProperty('--d', String(-dir)); o.classList.remove('is-on'); setTimeout(() => o.remove(), slow ? 1700 : 900); }
      for (const h of stale.splice(0)) { h.classList.remove('is-on'); setTimeout(() => h.remove(), slow ? 1700 : 900); }   // a passed frame's placeholder
    };
    let held = null;
    const reveal = () => requestAnimationFrame(() => {
      if (mine !== turn) return;                        // stepped past since: not brought on when its file arrives late
      im.classList.add('is-on'); leave();
      if (held) setTimeout(() => held.remove(), slow ? 1700 : 900);   // beneath the print until it is fully in
    });
    if (instant || p.paint || im.complete) reveal();
    // Picture only shows no words and no mount (so no placeholder either): there the last print
    // stays until this one is in hand, as it always did.
    else if (lb.classList.contains('is-bare')) im.decode().then(reveal, reveal);
    else {
      // On a slow line the words would change under the last frame's picture. After a moment the
      // last print leaves and this frame's own placeholder stands on the mount, the print's own box
      // (in the book; away from it, the bare mount over the room's colour), and the print develops
      // over it when it arrives, as the book's prints do.
      // The timer is this turn's own: a passed frame's print, landing late, must not clear the
      // timer of the frame now on show.
      const mySlow = slowT = setTimeout(() => requestAnimationFrame(() => {
        if (mine !== turn || im.classList.contains('is-on') || lb.classList.contains('is-bare')) return;
        leave();
        if (!p.ph) return;
        held = Object.assign(document.createElement('div'), { className: 'photobook-lightbox__held' });
        held.style.backgroundImage = p.ph;
        mount.append(held);
        requestAnimationFrame(() => held?.classList.add('is-on'));
      }), SLOW);
      const done = () => { clearTimeout(mySlow); reveal(); };
      im.decode().then(done, done);
    }
    // The room takes the print's colour, from its placeholder (already soft, so no blur; a CSS image,
    // read from the frame's own print by ./index.js); away from its book, from its glow; a painted
    // frame brings its own.
    if (p.room) crossfade(wash, p.room());
    else if (p.ph) {
      const a = document.createElement('div'); a.style.backgroundImage = p.ph;
      crossfade(wash, a);
    } else if (p.glow?.length) {
      const a = document.createElement('div'), [x, y = x, z = y] = p.glow;
      a.style.background = `radial-gradient(60% 70% at 25% 30%, ${x}, transparent 72%), radial-gradient(60% 70% at 75% 35%, ${y}, transparent 72%), radial-gradient(80% 60% at 50% 100%, ${z}, transparent 72%), ${z}`;
      crossfade(wash, a);
    }
    // Fewer frames than the book holds means one film was chosen: the count names it, in its colour
    // (where the bar has room: _photobook.scss hides it on phones).
    const one = order.length < frames.length && frames[order[0]]?.film;
    $('.photobook-lightbox__count').innerHTML = `<span><b>${String(pos + 1).padStart(2, '0')}</b> / ${String(order.length).padStart(2, '0')}</span>${one ? `<i style="--film:${frames[order[0]].hue}">${esc(one)}</i>` : ''}`;
    $('.photobook-lightbox__caption').innerHTML = captionHTML(p);
    specsIn.innerHTML = p.paint ? '' : specsHTML(p, i + 1, paletteOf(p)) + specsHint();
    if (wasPainted || p.paint) applySpecs(); else placeSpecs();   // a painted frame has no specs: the panel steps aside
    const railHadFocus = rail.contains(document.activeElement);
    for (const [k, b] of [...rail.children].entries()) {
      const on = k === pos;
      b.classList.toggle('is-on', on); b.tabIndex = on ? 0 : -1;
      if (on) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
      if (on && railHadFocus) b.focus({ preventScroll: true });
      // A rail of marks scrolls (more of them than fit): the one on show is kept in its middle.
      if (on && mark) rail.scrollTo({ left: b.offsetLeft - (rail.clientWidth - b.offsetWidth) / 2, behavior: instant || still() ? 'instant' : 'smooth' });
    }
    $('.photobook-lightbox__live').textContent = `${p.name}, ${pos + 1} of ${order.length}`;
    history.replaceState({ photobook: true }, '', `#${p.slug}`);
    if (timer) restart();
    return i;
  }

  const specsLine = (p) => [
    p.focal && `<span><b>${Math.round(p.focal)}</b>mm</span>`, p.aperture && `<span><b>ƒ/${p.aperture}</b></span>`,
    p.shutter && `<span><b>${esc(p.shutter)}</b>s</span>`, p.iso && `<span>ISO <b>${p.iso}</b></span>`,
    p.light && `<span class="photobook-sun">${sunGlyph(p.light)}${esc(p.light.text)}</span>`,
    p.film && `<span class="photobook-film" style="--film:${p.hue}"><i></i>${esc(p.film)}</span>`,
  ].filter(Boolean).join('');

  const captionHTML = (p) => `${p.place ? `<h3>${esc(p.place)}</h3>` : ''}${p.city ? `<span class="photobook-lightbox__city">${esc(p.city)}</span>` : ''}<div class="photobook-lightbox__specs-line">${specsLine(p)}</div>`;

  // Where a frame's palette leads (./specs.js paletteStrip): its voyage's page in QSD's Palette, the
  // book's own or, away from its book, the frame's.
  const palette = { base: lb.dataset.palette, gallery: lb.dataset.gallery, title: lb.dataset.paletteTitle };
  const paletteOf = (p) => (p.g ? { ...palette, gallery: p.g, title: `QSD's Palette for ${p.voyage || p.g}` } : palette);

  // Until the reader has folded the specs once (the setting is then remembered), the panel's foot
  // says how: a swipe on a phone, where the panel stands over half the screen; the key elsewhere.
  const specsHint = () => (store.get('photobook-specs') ? '' : `<p class="photobook-specs__hint">${matchMedia('(hover: none), (pointer: coarse)').matches ? 'Swipe down to fold these away' : 'Press I to fold these away'}</p>`);

  const rail = $('.photobook-lightbox__rail');
  let marking = 0;
  function buildRail(at = 0) {
    rail.innerHTML = order.map((i, k) => `<button type="button" data-k="${k}" tabindex="-1" aria-label="Frame ${k + 1}: ${esc(frames[i].name)}"><span class="photobook-lightbox__peek"></span></button>`).join('');
    rail.classList.toggle('has-marks', !!mark);
    cancelAnimationFrame(marking);
    if (!mark) return;
    // The page's marks (away from the book, each frame's dye vat) are made one a frame of the screen,
    // the one on show first and outward from it, so a long rail never stalls the opening.
    const bs = [...rail.children], todo = bs.map((_, k) => k).sort((a, b) => Math.abs(a - at) - Math.abs(b - at));
    const pour = () => {
      const k = todo.shift(); if (k === undefined) return;
      const m = mark(frames[order[k]]); if (m) bs[k].prepend(m);
      marking = requestAnimationFrame(pour);
    };
    pour();
  }
  // A preview is only fetched the first time the pointer (or a finger) rests on its mark; it is kept on screen.
  const peekOf = (b) => {
    const pk = b?.querySelector('.photobook-lightbox__peek'); if (!pk) return;
    if (!pk.style.backgroundImage) { const p = frames[order[Number(b.dataset.k)]]; if (p.paint) return; pk.style.backgroundImage = `url(${p.url}/${p.sizes[0] || 480}.webp)`; }
    pk.style.removeProperty('--px');
    const r = pk.getBoundingClientRect(), m = 8;
    const shift = r.left < m ? m - r.left : r.right > innerWidth - m ? innerWidth - m - r.right : 0;
    if (shift) pk.style.setProperty('--px', `${Math.round(shift)}px`);
  };
  rail.addEventListener('pointerover', (e) => peekOf(e.target.closest('button')));
  let scrubbed = false;
  rail.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b || scrubbed) { scrubbed = false; return; }
    const k = Number(b.dataset.k); stop(); show(k, { dir: Math.sign(k - pos) });
  });
  // By touch: a finger drawn along the rail scrubs the frames, each one's preview rising above it;
  // lifting it opens that frame. A tap stays a tap.
  let scrub = null;
  const markAt = (x) => {
    const bs = [...rail.children]; if (!bs.length) return null;
    return bs.reduce((best, b) => { const r = b.getBoundingClientRect(), d = Math.abs(r.left + r.width / 2 - x); return d < best.d ? { b, d } : best; }, { b: null, d: Infinity }).b;
  };
  const scrubTo = (b) => {
    if (!b || b === scrub.at) return;
    scrub.at?.classList.remove('is-scrub'); b.classList.add('is-scrub'); scrub.at = b; peekOf(b);
  };
  rail.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' || mark) return;   // a rail of marks scrolls under the finger instead
    scrub = { x: e.clientX, at: null, moved: false, id: e.pointerId };
    rail.setPointerCapture(e.pointerId); rail.classList.add('is-scrubbing'); scrubTo(markAt(e.clientX));
  });
  rail.addEventListener('pointermove', (e) => {
    if (!scrub || e.pointerId !== scrub.id) return;
    if (Math.abs(e.clientX - scrub.x) > 6) scrub.moved = true;
    scrubTo(markAt(e.clientX));
  });
  const endScrub = (open) => {
    if (!scrub) return;
    const { at, moved } = scrub; scrub = null;
    rail.classList.remove('is-scrubbing'); at?.classList.remove('is-scrub');
    if (open && at) { const k = Number(at.dataset.k); scrubbed = moved; if (k !== pos) { stop(); show(k, { dir: Math.sign(k - pos) }); } else scrubbed = true; }
  };
  rail.addEventListener('pointerup', () => endScrub(true));
  rail.addEventListener('pointercancel', () => endScrub(false));

  // The panel's state: open or closed (the toolbar button). Open, the print makes room for it.
  function applySpecs() {
    const bare = lb.classList.contains('is-bare') || (pos >= 0 && !!cur()?.paint);
    lb.classList.toggle('is-pinned', specOpen && !bare);
    lb.classList.toggle('has-specs', specOpen && !bare);
    pressed('specs', specOpen);
    placeSpecs();
  }

  // Where the open specs stand: beside the print, or beneath it as a low band of columns, whichever
  // leaves the print larger for this frame's shape and this window (a landscape in a laptop window
  // goes full width with the specs under it; a portrait keeps them beside). The band's height is
  // measured as laid out; print and band are centred together in the room below the tools.
  // A phone's sheet (--sheet on the panel) has its own place and is left alone.
  function placeSpecs() {
    lb.classList.remove('is-compact');
    const clear = () => { lb.classList.remove('is-specs-below'); for (const v of ['--top', '--right', '--bot', '--band-top']) lb.style.removeProperty(v); };
    clear();
    if (!lb.classList.contains('is-pinned') || pos < 0 || getComputedStyle(specsEl).getPropertyValue('--sheet').trim()) return;
    // A panel taller than its window sets itself tighter, so all of it shows without scrolling.
    const fitPanel = () => { if (specsEl.scrollHeight > specsEl.clientHeight + 1) lb.classList.add('is-compact'); };
    const W = window.innerWidth, H = window.innerHeight, rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const r = cur().ratio || 1.5, side = Math.min(1.5 * rem, Math.max(rem, 0.016 * W)), bar = 4 * rem, gap = rem;
    const area = (w, h) => { const pw = Math.max(0, Math.min(w, h * r)); return pw * pw / r; };
    const besideArea = area(W - side - (specsEl.offsetWidth + rem + side), H - bar - 3 * rem);
    lb.classList.add('is-specs-below');
    const band = specsEl.scrollHeight;
    const bw = W - 2 * side, bh = H - bar - gap - band - side;
    if (area(bw, bh) <= besideArea * 1.08) { clear(); return fitPanel(); }   // beside, unless beneath is clearly larger
    const ph = Math.min(bw, bh * r) / r, top = bar + Math.max(0, (H - bar - side - (ph + gap + band)) / 2);
    lb.style.setProperty('--top', `${top}px`);
    lb.style.setProperty('--right', `${side}px`);
    lb.style.setProperty('--bot', `${H - top - ph}px`);
    lb.style.setProperty('--band-top', `${top + ph + gap}px`);
  }
  const revealSpecs = () => { if (specOpen && !lb.classList.contains('is-bare')) { lb.classList.add('has-specs'); applySpecs(); } };
  // In picture only the panel is out of sight whatever its setting, so the button always brings it out.
  function toggleSpecs() {
    specOpen = lb.classList.contains('is-bare') || !specOpen;
    store.set('photobook-specs', specOpen ? 'open' : 'closed');
    specsIn.querySelector('.photobook-specs__hint')?.remove();
    if (specOpen) bare(false);
    applySpecs();
  }
  function bare(on = !lb.classList.contains('is-bare')) {
    lb.classList.toggle('is-bare', on); pressed('bare', on);
    if (on) { lb.classList.remove('has-specs', 'is-pinned'); placeSpecs(); } else applySpecs();
    // Picture only asks for the whole screen where the browser allows it; the page never depends on it.
    if (on && !document.fullscreenElement) lb.requestFullscreen?.().catch(() => {});
    if (!on && document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    if (on) upgrade();
    wake();
  }
  // Picture only and the loupe may want a larger file than the framed print had.
  let pending = '';
  function upgrade() {
    const im = mat.querySelector('img.is-on'), f = pos >= 0 && !cur().paint && srcFor(cur());
    if (!im || !f || im.src.endsWith(f) || f === pending || !bigger(f, im.src)) return;
    pending = f;
    fetchImg(f).decode().then(() => { if (im.isConnected) im.src = f; }, () => {}).finally(() => { if (pending === f) pending = ''; });
  }
  const bigger = (a, b) => Number(a.match(/\/(\d+)\.webp$/)?.[1] || 0) > Number(b.match(/\/(\d+)\.\w+$/)?.[1] || 0);
  // The print's area grows when the specs close or the window widens: a larger file follows, never a smaller.
  mat.addEventListener('transitionend', (e) => { if (e.target === mat && /^(top|right|bottom|left)$/.test(e.propertyName)) { upgrade(); keepMat(); } });
  function wake() { lb.classList.remove('is-idle'); clearTimeout(idleT); idleT = setTimeout(() => lb.classList.add('is-idle'), lb.classList.contains('is-bare') ? 1000 : 3200); }

  // The slideshow: a slow crossfade, a gentle push, a gold hairline for the dwell. Any touch stops it.
  const progress = $('.photobook-lightbox__progress'), playGlyph = $('.photobook-lightbox__play');
  function restart() { clearTimeout(timer); cancelAnimationFrame(raf); t0 = performance.now(); tick(); timer = setTimeout(() => show(pos + 1, { slow: true }), DWELL); }
  function tick() { progress.style.width = `${Math.min(100, (performance.now() - t0) / DWELL * 100)}%`; if (timer) raf = requestAnimationFrame(tick); }
  function play() { if (order.length < 2) return; lb.classList.add('is-playing'); lb.style.setProperty('--dwell', `${DWELL + 1600}ms`); pressed('play', true); playGlyph.setAttribute('d', 'M9 6v12M15 6v12'); timer = 1; restart(); }
  function stop() { lb.classList.remove('is-playing'); pressed('play', false); playGlyph.setAttribute('d', 'M8 5.5v13l10.5-6.5z'); clearTimeout(timer); cancelAnimationFrame(raf); timer = 0; progress.style.width = '0'; }

  const next = () => { stop(); show(pos + 1, { dir: 1 }); };
  const prev = () => { stop(); show(pos - 1, { dir: -1 }); };
  const ACTS = { next, prev, close: () => shut(), specs: toggleSpecs, bare: () => bare(), play: () => (timer ? stop() : play()) };
  lb.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b || !ACTS[b.dataset.act]) return;
    ACTS[b.dataset.act](); wake();
    // The side zones are for the pointer alone: focus goes back to the print, so no ring is drawn on them.
    if (b.classList.contains('photobook-lightbox__zone')) mat.focus({ preventScroll: true });
  });
  lb.addEventListener('cancel', (e) => {
    e.preventDefault();
    if (screening) shut();                                     // Esc ends a screening outright
    else if (lb.classList.contains('is-zoomed')) setZoom(1);
    else if (lb.classList.contains('is-bare')) bare(false);
    else shut();
  });

  // In full screen Esc is the browser's: it leaves full screen and tells the dialog nothing, so
  // picture only would stay on and want a second press. Leaving full screen ends picture only (a
  // screening, outright), as one Esc does out of full screen.
  document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement || !lb.open || !lb.classList.contains('is-bare')) return;
    if (screening) shut(); else bare(false);
  });

  // Every way out closes through here: the print shrinks back into its place in the book (a view
  // transition, the reverse of the opening), the page behind first brought to that place unseen.
  // A screening, or a frame not on the page, simply fades.
  function shut() {
    if (!lb.open) return;
    keepMat();
    const on = mat.querySelector('img.is-on');
    const box = !screening && pos >= 0 && printFor(order[pos]), to = box?.querySelector('img');
    if (!document.startViewTransition || still() || !on || !to) return lb.close();
    box.scrollIntoView({ block: 'center', behavior: 'instant' });
    on.style.viewTransitionName = 'photobook-print';
    const t = document.startViewTransition(() => { on.style.viewTransitionName = ''; lb.close(); to.style.viewTransitionName = 'photobook-print'; });
    t.ready.catch(() => {});
    t.finished.catch(() => {}).finally(() => { to.style.viewTransitionName = ''; });
  }
  window.addEventListener('keydown', (e) => {
    // A key held with a modifier is the browser's: Cmd+F finds, Alt+← goes back, Cmd+S saves.
    if (!lb.open || e.altKey || e.metaKey || e.ctrlKey || e.target.matches?.('input,textarea')) return;
    const k = e.key.toLowerCase();
    if ((k === ' ' || k === 'enter') && e.target.closest?.('button')) return;
    if (k === 'arrowright') next(); else if (k === 'arrowleft') prev();
    else if (k === ' ' || k === 's') ACTS.play(); else if (k === 'i') { if (!cur()?.paint) toggleSpecs(); } else if (k === 'f') bare();
    else if (k === 'z') setZoom(zoom > 1.02 ? 1 : 2.2); else return;
    e.preventDefault(); wake();
  });
  window.addEventListener('resize', () => { if (lb.open && pos >= 0) { fitFor(cur()); placeSpecs(); upgrade(); keepMat(); } });

  // Loupe: double-click (or Z) to look closer, or pinch on a trackpad for any depth from 1× to 4×,
  // about the point between the fingers; the print follows the pointer.
  let zoom = 1, pinchT = 0;
  function setZoom(z, e) {
    zoom = Math.min(4, Math.max(1, z));
    if (e) origin(e);
    lb.style.setProperty('--zoom', zoom.toFixed(3));
    lb.classList.toggle('is-zoomed', zoom > 1.02);
    if (zoom > 1.02) upgrade();
  }
  // Pinching follows the fingers directly, without the eased step of a double-click.
  const pinching = () => { lb.classList.add('is-pinching'); clearTimeout(pinchT); pinchT = setTimeout(() => lb.classList.remove('is-pinching'), 160); };
  const origin = (e) => { const r = mat.getBoundingClientRect(); lb.style.setProperty('--ox', `${((e.clientX - r.left) / r.width * 100).toFixed(1)}%`); lb.style.setProperty('--oy', `${((e.clientY - r.top) / r.height * 100).toFixed(1)}%`); };
  mat.addEventListener('dblclick', (e) => setZoom(zoom > 1.02 ? 1 : 2.2, e));
  mat.addEventListener('pointermove', (e) => { if (lb.classList.contains('is-zoomed')) origin(e); });

  // Touch: swipe to move, swipe up for the specs, tap to bring the tools back.
  // On the specs panel (pinned over half a phone's screen) only a sideways swipe counts: the panel
  // scrolls up and down itself, and a tap there is for what it holds.
  let sx = null, sy = 0, onSpecs = false;
  lb.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse' || pinch || e.target.closest('button:not(.photobook-lightbox__zone)')) return; onSpecs = !!e.target.closest('.photobook-specs'); sx = e.clientX; sy = e.clientY; if (timer && !screening && !onSpecs) stop(); });
  lb.addEventListener('pointercancel', () => { sx = null; });
  lb.addEventListener('pointerup', (e) => {
    if (sx === null) return;
    // Zoomed, a drag looks around the print (the loupe follows it); it does not turn the page.
    if (lb.classList.contains('is-zoomed')) { sx = null; return; }
    const dx = e.clientX - sx, dy = e.clientY - sy; sx = null;
    if (onSpecs) { if (Math.abs(dx) > 50 && Math.abs(dx) > 1.5 * Math.abs(dy)) (dx < 0 ? next : prev)(); return; }
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) (dx < 0 ? next : prev)();
    else if (dy < -60) { if (!specOpen) toggleSpecs(); else revealSpecs(); }
    else if (dy > 60 && lb.classList.contains('has-specs')) toggleSpecs();
    else if (dy > 90) shut();                                  // pulled down with nothing to fold: back to the book
    else if (lb.classList.contains('is-idle')) { wake(); revealSpecs(); } else { lb.classList.add('is-idle'); clearTimeout(idleT); }
  });
  // Open, nothing behind the lightbox scrolls: iOS Safari scrolls the page under `overflow: hidden`
  // with a finger, so drags and wheels are stopped here, except inside the specs panel, which
  // scrolls itself when it is taller than its room (and hands no scroll on: overscroll-behavior).
  const own = (e) => specsEl.contains(e.target) && specsEl.scrollHeight > specsEl.clientHeight;
  lb.addEventListener('touchmove', (e) => { if (!own(e)) e.preventDefault(); }, { passive: false });
  lb.addEventListener('wheel', (e) => {
    if (own(e)) return;
    e.preventDefault();
    // A trackpad pinch arrives as a wheel with Ctrl held (Chrome, Firefox); it zooms the print.
    if (e.ctrlKey) { pinching(); setZoom(zoom * Math.exp(-e.deltaY * 0.012), e); return; }
    // A two-finger swipe sideways turns the page, once per gesture (its momentum is let run out).
    if (lb.classList.contains('is-zoomed') || Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    clearTimeout(swipeT); swipeT = setTimeout(() => { swipeX = 0; swiped = false; }, 220);
    if (swiped) return;
    swipeX += e.deltaX;
    if (Math.abs(swipeX) > 60) { swiped = true; stop(); (swipeX > 0 ? next : prev)(); }
  }, { passive: false });
  let swipeX = 0, swiped = false, swipeT = 0;
  // Two fingers on a touch screen pinch the print, about the point between them; the gesture never
  // turns the page.
  let pinch = null;
  const spread = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
  const between = (t) => ({ clientX: (t[0].clientX + t[1].clientX) / 2, clientY: (t[0].clientY + t[1].clientY) / 2 });
  lb.addEventListener('touchstart', (e) => { if (e.touches.length === 2 && !own(e)) { pinch = { d: spread(e.touches), z: zoom }; sx = null; } }, { passive: true });
  lb.addEventListener('touchmove', (e) => { if (pinch && e.touches.length === 2) { pinching(); setZoom(pinch.z * spread(e.touches) / pinch.d, between(e.touches)); } }, { passive: true });
  lb.addEventListener('touchend', (e) => { if (pinch && e.touches.length < 2) { pinch = null; sx = null; } }, { passive: true });
  // Safari reports the same pinch as gesture events.
  let gz = 1;
  lb.addEventListener('gesturestart', (e) => { e.preventDefault(); gz = zoom; });
  lb.addEventListener('gesturechange', (e) => { e.preventDefault(); pinching(); setZoom(gz * e.scale, e); });

  // A pull down on the sheet from its top puts it away, as a pull down on the print does.
  let ty = null;
  specsEl.addEventListener('touchstart', (e) => { ty = specsEl.scrollTop <= 0 ? e.touches[0].clientY : null; }, { passive: true });
  specsEl.addEventListener('touchend', (e) => {
    if (ty === null) return;
    const dy = e.changedTouches[0].clientY - ty; ty = null;
    if (dy > 60 && lb.classList.contains('has-specs')) toggleSpecs();
  });
  lb.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') wake(); });

  // Screening: the book shown full screen, picture only, as a slideshow from the first frame of what
  // is on the page. A tap or the pointer brings the tools back, as in picture only (the slideshow
  // keeps playing until its own button pauses it); Esc or ‹ ends it where the reader started it.
  let screening = false, screenFrom = 0;
  function screen(visible) {
    screenFrom = window.scrollY;
    open(visible?.[0] ?? 0, visible);
    screening = true; lb.classList.add('is-screening');
    bare(true); play();
  }

  /** A link to a frame (#slug) opens it straight away. */
  function openFromHash() {
    const slug = decodeURIComponent(location.hash.slice(1));
    const i = slug ? frames.findIndex((p) => p.slug === slug) : -1;
    if (i >= 0) open(i);
  }
  /** Start fetching a frame's full print before it is opened (the pointer resting on it: ./book.js). */
  function prefetch(i) { const p = frames[i]; if (!p || p.paint || !matBox()[0]) return; const f = srcFor(p); if (!seen.has(f)) fetchImg(f); }

  return { open, openFromHash, screen, prefetch };
}
