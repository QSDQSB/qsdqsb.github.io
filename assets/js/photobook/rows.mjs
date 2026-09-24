/**
 * The rhythm of a Photobook: a spread, a pair, a three, again. A portrait
 * never takes a spread, and the last two or three frames close the book
 * together, never as a run of lone spreads.
 *
 * One module for both sides: the build lays out the page with it
 * (scripts/photos/lib/book.mjs), the film filter re-lays the frames it keeps.
 *
 * @param {{ratio?: number}[]} photos
 * @returns {{kind: 'spread'|'pair'|'triple', items: number[]}[]} indices into `photos`
 */
export const PORTRAIT = 1.2; // below this ratio a frame is too tall for a full-width spread

export function bookRows(photos) {
  const rows = []; let k = 0, beat = 0;
  const kinds = ['spread', 'pair', 'triple'];
  while (k < photos.length) {
    const left = photos.length - k;
    let want = [1, 2, 3][beat++ % 3];
    if (want === 1 && (photos[k].ratio || 1.5) < PORTRAIT) want = 2;
    const take = k > 0 && left <= 3 && left !== want ? left : Math.min(want, left);
    rows.push({ kind: kinds[take - 1], items: Array.from({ length: take }, (_, j) => k + j) });
    k += take;
  }
  return rows;
}
