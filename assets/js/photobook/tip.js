/**
 * Hover labels for the Photobook's icon controls: any element with data-tip names itself in a small
 * glass label after a short pause, below it (to its left with data-tip-side="left"; above it with
 * "top", where what lies below must stay readable), kept on screen. Under a mouse, and on keyboard
 * focus (a swatch or a vat names nothing in words): touch has no hover, and screen readers read the
 * controls' own names.
 * Inside the lightbox (a modal <dialog>, drawn in the top layer) the label is drawn inside it too.
 */

export function tips() {
  // One label for the page, however many scripts ask (the masthead's glosses and a page's own).
  if (document.documentElement.dataset.tips) return;
  document.documentElement.dataset.tips = 'on';
  const tip = Object.assign(document.createElement('div'), { className: 'photobook-tip', role: 'tooltip' });
  let cur = null, wait = 0, byFocus = false;

  const hide = () => { clearTimeout(wait); cur = null; byFocus = false; tip.classList.remove('is-on'); };
  function show(el) {
    (el.closest('dialog') || document.body).appendChild(tip);
    tip.textContent = el.dataset.tip;
    const r = el.getBoundingClientRect(), t = tip.getBoundingClientRect(), m = 8;
    let x, y;
    if (el.dataset.tipSide === 'left') { x = r.left - t.width - 10; y = r.top + r.height / 2 - t.height / 2; }
    else if (el.dataset.tipSide === 'top') { x = r.left + r.width / 2 - t.width / 2; y = r.top - t.height - 8; if (y < m) y = r.bottom + 10; }
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
  // Focused from the keyboard: at once, and kept with its control while the page scrolls it into view.
  document.addEventListener('focusin', (e) => {
    const el = e.target.closest?.('[data-tip]');
    if (!el?.matches(':focus-visible')) return;
    hide(); cur = el; byFocus = true; show(el);
  });
  document.addEventListener('focusout', () => { if (byFocus) hide(); });
  for (const ev of ['pointerdown', 'keydown']) document.addEventListener(ev, hide, { capture: true, passive: true });
  document.addEventListener('scroll', () => { if (byFocus && cur?.isConnected) show(cur); else hide(); }, { capture: true, passive: true });
}
