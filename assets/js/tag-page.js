/**
 * A tag page's line of tags (_includes/tag-page.html): the open tag marked current and brought to the
 * middle of the line, and the line's edges faded where it runs on. The address opens a tag's list by
 * itself (:target, _sass/_tags.scss), so choosing, Back and Forward are the browser's own; with no tag
 * in the address, "All" is open. The corner's tarot card gives way while the tags are under it.
 */
const line = document.querySelector('.tag-page__tags ol');
const rows = [...document.querySelectorAll('.tag-page__tags a')];

const asked = () => { try { return decodeURIComponent(location.hash.slice(1)); } catch { return location.hash.slice(1); } };
const still = () => document.documentElement.classList.contains('motion-off') || matchMedia('(prefers-reduced-motion: reduce)').matches;

function edges() {
  line.classList.toggle('is-scrolled', line.scrollLeft > 1);
  line.classList.toggle('is-at-end', line.scrollLeft + line.clientWidth >= line.scrollWidth - 1);
}

// The line scrolls itself, never the page: scrollIntoView would also move the page, and in Safari sideways.
function mark(glide) {
  const open = rows.find((row) => row.getAttribute('href') === `#${asked()}`) || rows[0];
  rows.forEach((row) => (row === open ? row.setAttribute('aria-current', 'true') : row.removeAttribute('aria-current')));
  const left = open.offsetLeft - (line.clientWidth - open.offsetWidth) / 2;
  line.scrollTo({ left, behavior: glide && !still() ? 'smooth' : 'auto' });
  edges();
}

if (line) {
  window.addEventListener('hashchange', () => mark(true));
  line.addEventListener('scroll', edges, { passive: true });
  window.addEventListener('resize', edges);
  mark(false);
  document.fonts.ready.then(() => mark(false)); // Barlow arriving moves every tag
}

// The corner's tarot card waits unseen, above everything, over the page's foot: while the tags pass
// beneath it, it takes no click, so a click on a tag is the tag's.
const card = document.querySelector('.floating_tarot_card_container:not(.floating_tarot_card_container--right)');
const tags = document.querySelector('.tag-page__tags');
if (card && tags) {
  let queued = false;
  const giveWay = () => {
    queued = false;
    const c = card.getBoundingClientRect(), t = tags.getBoundingClientRect();
    card.classList.toggle('is-giving-way', t.bottom > c.top && t.top < c.bottom && t.right > c.left && t.left < c.right);
  };
  window.addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(giveWay); } }, { passive: true });
  window.addEventListener('resize', giveWay);
  giveWay();
}
