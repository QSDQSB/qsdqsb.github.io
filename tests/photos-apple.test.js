const test = require('node:test');
const assert = require('node:assert');

test('sameMoment matches a Photos date on this Mac\'s clock to the camera\'s local time', async () => {
  const { sameMoment } = await import('../scripts/photos/lib/apple-photos.mjs');
  const here = (iso) => { const d = new Date(iso); const p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`; };
  // Prague, UTC+2, as Photos shows it on whatever zone this Mac is in.
  assert.equal(sameMoment(here('2023-06-16T19:35:27+02:00'), '2023-06-16T19:35:27+02:00'), true);
  assert.equal(sameMoment(here('2023-06-16T19:35:28+02:00'), '2023-06-16T19:35:27+02:00'), false);
  // No offset recorded: a whole time zone apart, same minute and second.
  assert.equal(sameMoment('2023-06-16T18:35:27', '2023-06-16T19:35:27'), true);
  assert.equal(sameMoment('2023-06-16T18:34:27', '2023-06-16T19:35:27'), false);
  assert.equal(sameMoment('2021-11-25T17:29:16', '2023-06-16T19:35:27'), false);
  assert.equal(sameMoment(null, '2023-06-16T19:35:27'), false);
});
