/**
 * The rhythm of a Photobook. Where the voyage's YAML marks frames `spread: true`, those frames take
 * the full width and the frames between them run in pairs and threes. Where it marks none, the count
 * decides: a spread, a pair, a three, again. A portrait never takes a spread, and the last two or
 * three frames close the book together, never as a run of lone spreads.
 *
 * One module for both sides: the build lays out the page with it
 * (scripts/photos/lib/book.mjs), the film filter re-lays the frames it keeps.
 *
 * @param {{ratio?: number, spread?: boolean}[]} photos
 * @param {boolean} marked  whether the book is laid by its marks; a filtered book passes its whole
 *                          gallery's answer, so a film holding no marked frame keeps the marked rhythm
 * @returns {{kind: 'spread'|'pair'|'triple', items: number[]}[]} indices into `photos`
 */
export const PORTRAIT = 1.2; // below this ratio a frame is too tall for a full-width spread

const KINDS = ['spread', 'pair', 'triple'];
const tall = (p) => (p.ratio || 1.5) < PORTRAIT;

export function bookRows(photos, marked = photos.some((p) => p.spread)) {
  return marked ? markedRows(photos) : countedRows(photos);
}

// Pairs and threes between the marked frames; a frame left alone between two marks is a row of one.
function markedRows(photos) {
  const rows = [];
  let run = [];
  const flush = () => {
    for (let k = 0, beat = 0; k < run.length; beat++) {
      const left = run.length - k, want = beat % 2 ? 3 : 2;
      const take = left <= 3 ? left : left - want === 1 ? 2 : want; // never one frame left over
      rows.push({ kind: take === 3 ? 'triple' : 'pair', items: run.slice(k, k + take) });
      k += take;
    }
    run = [];
  };
  photos.forEach((p, i) => {
    if (p.spread && !tall(p)) { flush(); rows.push({ kind: 'spread', items: [i] }); } else run.push(i);
  });
  flush();
  return rows;
}

function countedRows(photos) {
  const rows = []; let k = 0, beat = 0;
  while (k < photos.length) {
    const left = photos.length - k;
    let want = [1, 2, 3][beat++ % 3];
    if (want === 1 && tall(photos[k])) want = 2;
    const take = k > 0 && left <= 3 && left !== want ? left : Math.min(want, left);
    rows.push({ kind: KINDS[take - 1], items: Array.from({ length: take }, (_, j) => k + j) });
    k += take;
  }
  // A lone portrait closing the book would stand full width: it joins the row before, or takes
  // that row's last frame for a pair when the row is already a three.
  const last = rows[rows.length - 1], prev = rows[rows.length - 2];
  if (prev && last.items.length === 1 && tall(photos[last.items[0]])) {
    rows.pop();
    if (prev.items.length < 3) prev.items.push(last.items[0]);
    else rows.push({ items: [prev.items.pop(), last.items[0]] });
    for (const r of rows.slice(-2)) r.kind = KINDS[r.items.length - 1];
  }
  return rows;
}
