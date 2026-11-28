/**
 * A tag page's tags (_includes/tag-page.html): the open tag's row marked current. The address opens a
 * tag's list by itself (:target, _sass/_tags.scss), so choosing, Back and Forward are the browser's
 * own; with no tag in the address, "All" is open. The corner's tarot card gives way while the tags are
 * under it.
 */
const rows = [...document.querySelectorAll('.tag-page__tags a')];

const asked = () => { try { return decodeURIComponent(location.hash.slice(1)); } catch { return location.hash.slice(1); } };

function mark() {
  const open = rows.find((row) => row.getAttribute('href') === `#${asked()}`) || rows[0];
  rows.forEach((row) => (row === open ? row.setAttribute('aria-current', 'true') : row.removeAttribute('aria-current')));
}

window.addEventListener('hashchange', mark);
mark();

// The corner's tarot card waits unseen, above everything, over the column's foot: while the tags pass
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
