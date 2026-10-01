/**
 * Prints develop over their blurred placeholders as they arrive, instead of cutting in: each image
 * under `root` matching `selector` is held clear (`.is-developing … img:not(.is-in)`, in
 * _photobook.scss and _colour.scss) until it has loaded, then fades in; one already in hand is shown
 * at once. The root is marked only here, so a page without its script shows every image straight
 * away. Images added later (the book's sheet, a page drawing its cards from data) develop the same way.
 *
 * Shared by the Photobook (./index.js), QSD's Palette and Reverie (assets/js/colour/).
 */
export function develop(root, selector) {
  if (!root) return;
  const show = (img) => img.classList.add('is-in');
  const watch = (img) => {
    if (img.complete && img.naturalWidth) show(img);
    else { img.addEventListener('load', () => show(img), { once: true }); img.addEventListener('error', () => show(img), { once: true }); }
  };
  root.querySelectorAll(selector).forEach(watch);
  new MutationObserver((ms) => {
    for (const m of ms) for (const n of m.addedNodes) { if (n.matches?.(selector)) watch(n); n.querySelectorAll?.(selector).forEach(watch); }
  }).observe(root, { childList: true, subtree: true });
  root.classList.add('is-developing');
}
