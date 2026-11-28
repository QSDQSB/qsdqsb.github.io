import { must } from './_lib.mjs';

export default { id: 'no-flash', name: 'Words are never drawn shown and then made to rise, even on a slow line', async run({ page, base }) {
  // On a real line the page paints before its deferred scripts arrive. The head holds the blocks
  // from the first frame (_includes/head/custom.html), so the arrival is the first thing a reader
  // sees of them; without the hold they were drawn, then hidden, then made to rise (the flash).
  const first = () => page.evaluate(() => {
    const el = [...document.querySelector('.page__content').children].find((x) => x.textContent.trim() && !x.matches('.sidebar__right, script, style'));
    return parseFloat(getComputedStyle(el).opacity);
  });
  // Not `go`: it waits for the deferred scripts, and this looks at the page while it is waiting.
  const open = (to) => page.goto(base + to, { waitUntil: 'commit' }).then(() => page.waitForSelector('.page__content', { state: 'attached' }));
  await page.route('**/scroll-animations.js', async (route) => { await new Promise((r) => setTimeout(r, 1500)); await route.continue().catch(() => {}); });
  await open('/about/?motion=on');
  await page.waitForTimeout(500);
  const before = await first();
  must(before < 0.05, `before the script came, About's first block was drawn at ${before} (it would then be hidden and rise: a flash)`);
  await page.waitForTimeout(2200);
  must(await first() > 0.99, "once the script came, About's first block did not arrive");
  // On a line slower than the hold (the script after four seconds), the words the hold gave up
  // stay shown when the script comes: they are not hidden again to rise.
  await page.unroute('**/scroll-animations.js');
  await page.route('**/scroll-animations.js', async (route) => { await new Promise((r) => setTimeout(r, 5200)); await route.continue().catch(() => {}); });
  await open('/about/?motion=on');
  await page.waitForTimeout(4600);
  must(await first() > 0.99, "with the script late, About's first block was not shown when the hold gave out");
  let lowest = 1;
  for (let i = 0; i < 20; i++) { lowest = Math.min(lowest, await first()); await page.waitForTimeout(100); }
  must(lowest > 0.99, `with the script late, About's first block was shown, then dropped to ${lowest.toFixed(2)} when the script came (the flash, later)`);
  // And should the script never come, the words show of themselves.
  await page.unroute('**/scroll-animations.js');
  await page.route('**/scroll-animations.js', (route) => route.abort());
  await open('/about/?motion=on');
  await page.waitForTimeout(5000);
  must(await first() > 0.99, 'with the script blocked, About stayed blank after five seconds');
} };
