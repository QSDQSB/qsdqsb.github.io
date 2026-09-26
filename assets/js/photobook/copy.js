/**
 * A colour's hex, copied on a click: any element with data-hex (the specs panel's bands, the
 * colophon's swatches). The hover label says so; where there is no clipboard, it says the hex
 * instead, to be copied by hand.
 */

export function copyHex() {
  document.addEventListener('click', async (e) => {
    const el = e.target.closest?.('[data-hex]');
    if (!el) return;
    const hex = el.dataset.hex.toUpperCase();
    let said = `Copied ${hex}`;
    try { await navigator.clipboard.writeText(hex); } catch { said = hex; }
    el.dispatchEvent(new CustomEvent('photobook:say', { bubbles: true, detail: said }));
  });
}
