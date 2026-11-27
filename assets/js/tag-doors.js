/**
 * A tag's door is the dye vat of its photograph (_includes/tag-page.html): the photograph's colours
 * poured into the door's shape, still, drawn small and shown large so it softens. The photograph
 * lies beneath: under a pointer the vat clears and the door develops into it (_sass/_tags.scss).
 * Without this script a door shows its photograph.
 */
import { vat, seedOf } from './colour/vat.js';

document.querySelectorAll('.tag-page__door[data-vat]').forEach((door) => {
  const dye = vat(JSON.parse(door.dataset.vat), { shape: 'rect', width: 240, height: 240, seed: seedOf(door.dataset.seed) });
  dye.classList.add('tag-page__vat');
  door.querySelector('.card').prepend(dye);
  door.classList.add('is-poured');
});
