/**
 * A crossfade of layers in `box`, as the lightbox's wash takes each print's colour: `fresh` is laid
 * over the rest and turned on, the others turned off beneath it and let go once faded. The fading is
 * CSS (@mixin photobook-wash-layer, _sass/_photobook.scss), and with motion off it is instant. Also
 * the palette page's light and dye vat (assets/js/colour/palette.js).
 */
export function crossfade(box, fresh) {
  box.appendChild(fresh);
  requestAnimationFrame(() => { fresh.classList.add('is-on'); for (const x of [...box.children]) if (x !== fresh) { x.classList.remove('is-on'); setTimeout(() => x.remove(), 1300); } });
}
