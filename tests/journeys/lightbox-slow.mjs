import { must } from './_lib.mjs';

export default { id: 'lightbox-slow', name: 'On a slow line each frame stands on its own placeholder, and only a frame that holds fetches its full print', async run({ page, go }) {
  // The photo host, slowed once `slow` is set: one light print (the first asked for after `gate` is
  // armed) is held until released, the rest arrive 2.5 s late; `asked` keeps what was asked for.
  let slow = false, gated = null, release = () => {}, asked = [];
  await page.route('https://img.qsdqsb.com/**', async (route) => {
    const url = route.request().url();
    asked.push(url);
    if (!slow) return route.continue().catch(() => {});
    if (gated === 'armed' && /\/960\.webp$/.test(url)) {
      gated = url;
      const held = new Promise((r) => { release = r; });
      const response = await route.fetch().catch(() => null);
      await held;
      return response ? route.fulfill({ response }).catch(() => {}) : route.abort().catch(() => {});
    }
    await new Promise((r) => setTimeout(r, 2500));
    return route.continue().catch(() => {});
  });
  await go('/voyage/london/');
  await page.locator('.photobook-frame__print').first().click();
  await page.waitForFunction(() => document.querySelector('.photobook-lightbox')?.open, null, { timeout: 8000 }).catch(() => {});
  must(await page.evaluate(() => document.querySelector('.photobook-lightbox')?.open === true), 'clicking a print did not open the lightbox');
  await page.waitForTimeout(1500);
  // Six quick steps: the frames passed fetch their light print and no more.
  asked = [];
  for (let i = 0; i < 6; i++) { await page.keyboard.press('ArrowRight'); await page.waitForTimeout(70); }
  await page.waitForTimeout(1500);
  const full = asked.filter((u) => /\.webp$/.test(u) && !/\/960\.webp$/.test(u));
  must(full.length <= 4, `six quick steps asked for ${full.length} full prints: the frames passed are being downloaded`);
  // What stands in the print's place, and whose placeholder it is (each frame's is on its print in the book).
  const state = () => page.evaluate(() => {
    const lb = document.querySelector('.photobook-lightbox'), at = Number((lb.querySelector('.photobook-lightbox__live').textContent.match(/, (\d+) of/) || [])[1]) - 1;
    const own = document.querySelector(`#photobook-book .photobook-frame[data-i="${at}"] .photobook-frame__print`)?.style.backgroundImage || '';
    const held = [...lb.querySelectorAll('.photobook-lightbox__held.is-on')].map((h) => h.style.backgroundImage);
    return { at, prints: lb.querySelectorAll('.photobook-lightbox__mat > img.is-on').length, held: held.length, own: held.length === 1 && !!own && held[0] === own };
  });
  slow = true;
  await page.keyboard.press('ArrowRight');             // the frame beside: fetched ahead already, so not slow
  await page.waitForTimeout(70);
  gated = 'armed';
  await page.keyboard.press('ArrowRight');             // frame A, not yet fetched: its light print is held back
  await page.waitForTimeout(600);
  const a = await state();
  must(a.prints === 0, "on a slow line the last frame's print stayed under the new frame's words");
  must(a.own, "the frame's own placeholder did not stand in its print's place while it loaded");
  await page.keyboard.press('ArrowRight');             // frame B, and A's print lands just after
  await page.waitForTimeout(60); release();
  await page.waitForTimeout(540);
  const b = await state();
  must(b.at === a.at + 1, 'the second step did not move on a frame');
  must(b.prints === 0 && b.own, "a passed frame's print, landing late, left its placeholder under the next frame's words");
  // Picture only has no mount to stand a placeholder on: the last print stays until the next is in hand.
  await page.waitForFunction(() => document.querySelectorAll('.photobook-lightbox__mat > img.is-on').length === 1, null, { timeout: 8000 }).catch(() => {});
  await page.keyboard.press('f');
  await page.waitForTimeout(300);
  const before = (await state()).at;
  await page.keyboard.press('ArrowRight');
  for (const ms of [300, 300, 300]) {
    await page.waitForTimeout(ms);
    const c = await page.evaluate(() => ({ on: document.querySelectorAll('.photobook-lightbox__mat > img.is-on').length, waiting: document.querySelectorAll('.photobook-lightbox__mat > img:not(.is-on)').length }));
    must((await state()).at === before + 1 && c.waiting >= 1, 'the step in picture only was not a slow one: the journey cannot tell');
    must(c.on >= 1, 'in picture only a step on a slow line emptied the screen');
  }
} };
