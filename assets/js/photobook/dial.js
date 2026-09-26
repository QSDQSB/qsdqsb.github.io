/**
 * The film dial (_includes/photobook/filmbar.html): a mark per film around a face that turns the
 * chosen one under the red index. Click a mark, turn the face by hand (it leans towards each position
 * and settles on the nearest), or use the arrow keys; hovering a mark names it faintly underneath.
 * On a touch screen the first tap opens the dial (the dots become letters) and the next one chooses,
 * so nothing is picked blind. The book changes once the dial has settled, so turning through films
 * never re-lays the page.
 */

const TURN_MS = 520;

export function filmDial(el, onChoose) {
  const face = el.querySelector('.photobook-dial__face');
  const marks = [...face.querySelectorAll('[role="radio"]')];
  const names = [...el.querySelectorAll('.photobook-dial__name > span')];
  const nameEl = el.querySelector('.photobook-dial__name');
  const still = () => window.QSD?.motionOff?.() || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const last = marks.length - 1;
  const clamp = (i) => Math.max(0, Math.min(last, i));
  // 45° between marks, closer when there are many, so the last never comes round onto ALL.
  const STEP = Math.min(45, 315 / Math.max(1, last));
  marks.forEach((m, i) => m.style.setProperty('--at', `${i * STEP}deg`));
  let at = 0, sel = 0, raf = 0, shut = 0;

  const paint = () => face.style.setProperty('--rot', `${-at * STEP}deg`);
  const say = (i, preview = false) => {
    names.forEach((n, k) => n.classList.toggle('is-on', k === i));
    nameEl.classList.toggle('is-preview', preview);
  };
  const open = (on) => { clearTimeout(shut); el.classList.toggle('is-open', on); };

  function choose(i, { focus = false } = {}) {
    i = clamp(i);
    const changed = i !== sel;
    sel = i; say(i);
    marks.forEach((m, k) => { m.setAttribute('aria-checked', String(k === i)); m.tabIndex = k === i ? 0 : -1; });
    if (focus) marks[i].focus({ preventScroll: true });
    cancelAnimationFrame(raf);
    const settle = () => {
      if (changed) onChoose(marks[i].dataset.film || '');
      if (el.classList.contains('is-open')) shut = setTimeout(() => open(false), 1200);
    };
    if (still()) { at = i; paint(); settle(); return; }
    const from = at, t0 = performance.now();
    const turn = (t) => {
      const p = Math.min(1, (t - t0) / TURN_MS);
      at = from + (i - from) * (1 - (1 - p) ** 3); paint();
      if (p < 1) raf = requestAnimationFrame(turn); else settle();
    };
    raf = requestAnimationFrame(turn);
  }

  // A touch on a closed dial only opens it; a touch anywhere else closes it again.
  let opening = false;
  face.addEventListener('pointerdown', (e) => { opening = e.pointerType !== 'mouse' && !el.classList.contains('is-open'); }, true);
  document.addEventListener('pointerdown', (e) => { if (!el.contains(e.target)) open(false); });
  face.addEventListener('click', (e) => {
    if (!opening || turned) return;
    opening = false; open(true);
    e.stopPropagation();                                       // the mark under the finger is not chosen
  }, true);

  marks.forEach((m, i) => {
    m.addEventListener('click', () => { if (!turned) choose(i); });
    m.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse' && !held && i !== sel) say(i, true); });
    m.addEventListener('pointerleave', () => { if (!held) say(sel); });
  });

  // By hand: the face follows the pointer round its centre. The pointer is only taken once it has
  // turned the face a little, so a plain click still reaches the mark under it.
  let held = false, turned = false, start = 0, from = 0, pid = 0;
  const angle = (e) => {
    const r = face.getBoundingClientRect();
    return Math.atan2(e.clientX - (r.left + r.width / 2), -(e.clientY - (r.top + r.height / 2))) * 180 / Math.PI;
  };
  face.addEventListener('pointerdown', (e) => {
    held = true; turned = false; start = angle(e); from = at; pid = e.pointerId;
    el.classList.add('is-held');
  });
  face.addEventListener('pointermove', (e) => {
    if (!held) return;
    let d = angle(e) - start;
    if (d > 180) d -= 360;
    if (d < -180) d += 360;
    d = -d / STEP;
    if (!turned && Math.abs(d) > 0.12) { turned = true; opening = false; face.setPointerCapture(pid); cancelAnimationFrame(raf); }
    if (!turned) return;
    const raw = Math.max(-0.35, Math.min(last + 0.35, from + d)), near = clamp(Math.round(raw));
    at = raw + (near - raw) * 0.4; paint();                    // the pull of the nearest position
    say(near, near !== sel);
  });
  const release = () => {
    if (!held) return;
    held = false; el.classList.remove('is-held');
    if (turned) choose(Math.round(at));
    setTimeout(() => { turned = false; });
  };
  face.addEventListener('pointerup', release);
  face.addEventListener('pointercancel', release);

  // Keys turn it a position at a time; the page only moves once it settles.
  el.addEventListener('keydown', (e) => {
    const k = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    const to = k ? sel + k : e.key === 'Home' ? 0 : e.key === 'End' ? last : null;
    if (to === null) return;
    e.preventDefault();
    choose(to, { focus: true });
  });

  paint();
  return {
    // A first visit's hint that the face turns: a few degrees towards the next film and back, its
    // letters showing meanwhile.
    hint() {
      if (still() || held || sel !== 0) return;
      const t0 = performance.now();
      el.classList.add('is-hinting');
      const nudge = (t) => {
        const p = Math.min(1, (t - t0) / 1400);
        at = 0.22 * Math.sin(Math.PI * Math.min(1, p / 0.8)) ** 2; paint();
        if (p < 1) raf = requestAnimationFrame(nudge); else el.classList.remove('is-hinting');
      };
      raf = requestAnimationFrame(nudge);
    },
    /** The chosen film's colour, for the mark left in the corner while the controls are away. */
    hue: () => marks[sel].style.getPropertyValue('--film'),
  };
}
