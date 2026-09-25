/**
 * Hover labels for the Photobook's icon controls: any element with data-tip names itself in a small
 * glass label after a short pause, below it (or to its left, with data-tip-side="left"), kept on
 * screen. Pointer only: touch has no hover, and screen readers read the controls' aria-labels.
 * Inside the lightbox (a modal <dialog>, drawn in the top layer) the label is drawn inside it too.
 */

export function tips() {
  const tip = Object.assign(document.createElement('div'), { className: 'photobook-tip', role: 'tooltip' });
  let cur = null, wait = 0;

  const hide = () => { clearTimeout(wait); cur = null; tip.classList.remove('is-on'); };
  function show(el) {
    (el.closest('dialog') || document.body).appendChild(tip);
    tip.textContent = el.dataset.tip;
    const r = el.getBoundingClientRect(), t = tip.getBoundingClientRect(), m = 8;
    let x, y;
    if (el.dataset.tipSide === 'left') { x = r.left - t.width - 10; y = r.top + r.height / 2 - t.height / 2; }
    else { x = r.left + r.width / 2 - t.width / 2; y = r.bottom + 10; if (y + t.height > innerHeight - m) y = r.top - t.height - 10; }
    tip.style.left = `${Math.round(Math.max(m, Math.min(x, innerWidth - t.width - m)))}px`;
    tip.style.top = `${Math.round(Math.max(m, y))}px`;
    tip.classList.add('is-on');
  }

  document.addEventListener('pointerover', (e) => {
    if (e.pointerType !== 'mouse') return;
    const el = e.target.closest?.('[data-tip]');
    if (el === cur) return;
    hide();
    if (!el) return;
    cur = el;
    wait = setTimeout(() => { if (cur === el && el.isConnected) show(el); }, 450);
  });
  for (const ev of ['pointerdown', 'scroll', 'keydown']) document.addEventListener(ev, hide, { capture: true, passive: true });
}
