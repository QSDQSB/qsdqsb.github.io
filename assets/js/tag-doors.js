/**
 * A tag page's doors (_includes/tag-page.html). A door's face is the dye vat of its photograph: the
 * photograph's colours poured into the door's shape, still, drawn small and shown large so it
 * softens. The photograph lies beneath: under a pointer the vat clears and the door develops into it
 * (_sass/_tags.scss). Without this script a door shows its photograph and opens its list by :target.
 *
 * A door opens its tag's list right below the doors, the address naming the tag (/tags/#emo), and
 * the page stays where the doors are in sight; Back and Forward step through the tags chosen. The
 * open tag's door is marked current, and stays developed.
 */
import { vat, seedOf } from './colour/vat.js';

const page = document.querySelector('.tag-page');
const doors = [...page.querySelectorAll('.tag-page__door .card')];
const rooms = [...page.querySelectorAll('.tag-page__room')];

page.querySelectorAll('.tag-page__door[data-vat]').forEach((door) => {
  const dye = vat(JSON.parse(door.dataset.vat), { shape: 'rect', width: 200, height: 200, seed: seedOf(door.dataset.seed) });
  dye.classList.add('tag-page__vat');
  door.querySelector('.card').prepend(dye);
  door.classList.add('is-poured');
});

const asked = () => { try { return decodeURIComponent(location.hash.slice(1)); } catch { return location.hash.slice(1); } };

/** Opens the list the address names (none, if it names none of these tags) and marks its door. */
function open() {
  const slug = asked();
  rooms.forEach((room) => room.classList.toggle('is-open', room.id === slug));
  doors.forEach((card) => {
    if (card.getAttribute('href') === `#${slug}`) card.setAttribute('aria-current', 'true');
    else card.removeAttribute('aria-current');
  });
  return rooms.some((room) => room.id === slug);
}

/** Brings the doors to the top of the screen, under the menu, so the doors and the list's head are both in sight. */
function toDoors() {
  const top = page.getBoundingClientRect().top + window.scrollY - parseFloat(getComputedStyle(page).scrollMarginTop);
  window.scrollTo({ top, behavior: window.QSD?.motionOff?.() ? 'auto' : 'smooth' });
}

doors.forEach((card) => card.addEventListener('click', (event) => {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button) return; // a new tab or window keeps the link
  event.preventDefault();
  const href = card.getAttribute('href');
  if (location.hash !== href) history.pushState(null, '', href);
  open();
  toDoors();
}));

// The browser's own jump to the anchor (on Back and Forward, and on arriving) comes after the event:
// the doors are brought back once it has.
const afterTheJump = (fn) => requestAnimationFrame(() => requestAnimationFrame(fn));
window.addEventListener('popstate', () => { if (open()) afterTheJump(toDoors); });
// Arriving with a tag in the address (from the tags under a post): its list, with the doors above it.
if (open()) {
  if (document.readyState === 'complete') afterTheJump(toDoors);
  else window.addEventListener('load', () => afterTheJump(toDoors), { once: true });
}
