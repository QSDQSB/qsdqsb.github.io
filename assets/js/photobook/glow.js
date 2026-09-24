/**
 * The glow: the page takes the colour of the photograph in view, the way Apple Music takes an
 * album's. Three soft colours per frame are worked out at build time; here two fixed layers trade
 * places by opacity alone, so a change costs the compositor a crossfade and nothing else.
 *
 * The colour moves only when the reader arrives at another photograph: a row counts as one (a
 * pair or a three takes its first frame's colour), and a new row must hold the screen for a
 * moment before the room turns to it. Within one photograph nothing moves.
 */

const SETTLE_MS = 400;

export function glow(frames) {
  const layers = [...document.querySelectorAll('.photobook-glow i')];
  if (layers.length < 2 || !('IntersectionObserver' in window)) return { watch() {} };
  let front = 0, lit = -1, settle = 0;

  const paint = (i) => {
    const c = frames[i]?.glow;
    if (!c) return;
    const next = layers[(front ^= 1)];
    next.style.background = `radial-gradient(70% 55% at 10% 6%,${c[0]},transparent 72%),radial-gradient(60% 50% at 92% 18%,${c[1]},transparent 72%),radial-gradient(85% 60% at 50% 108%,${c[2]},transparent 72%)`;
    next.classList.add('is-on');
    layers[front ^ 1].classList.remove('is-on');
  };

  const seen = new Map();
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) seen.set(e.target, e.intersectionRatio);
    let best = null, most = 0;
    for (const [el, r] of seen) if (r > most && el.isConnected) { most = r; best = el; }
    const i = best ? Number((best.querySelector('[data-i]') || best).dataset.i) : NaN;
    clearTimeout(settle);
    if (Number.isInteger(i) && i !== lit) settle = setTimeout(() => { lit = i; paint(i); }, lit < 0 ? 0 : SETTLE_MS);
  }, { threshold: [0, 0.2, 0.4, 0.6, 0.8, 1] });

  return {
    /** Watch the cover and the rows (or the sheet's frames) currently shown. */
    watch(targets) {
      seen.clear(); io.disconnect();
      for (const el of targets) io.observe(el);
    },
  };
}
