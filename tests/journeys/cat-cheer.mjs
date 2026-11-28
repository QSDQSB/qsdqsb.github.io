import { must } from './_lib.mjs';

export default { id: 'cat-cheer', name: 'The small cat raises its cup and speaks on the 404 and after subscribing, then nothing runs', async run({ page, go }) {
  // the cheer's own animations, not the 1.1 s fade-in (a transition)
  const moving = (sel) => page.evaluate((s) => document.querySelector(s)?.shadowRoot?.getAnimations().filter((a) => !(a instanceof CSSTransition)).length ?? -1, sel);
  const cheered = (sel) => page.waitForFunction((s) => document.querySelector(s)?.shadowRoot?.getAnimations().some((a) => !(a instanceof CSSTransition)), sel, { timeout: 5000 }).then(() => true, () => false);
  await go('/no-such-page-here/?motion=on', { expect: 404 });
  await page.locator('qsd-cat').scrollIntoViewIfNeeded();
  must(await cheered('qsd-cat'), 'the 404\'s cat did not cheer');
  const said = (sel) => page.evaluate((s) => document.querySelector(s)?.shadowRoot?.querySelector('.say.is-said')?.textContent || '', sel);
  must(await said('qsd-cat') === 'Aloha!', 'the 404\'s cat did not say "Aloha!"');
  await page.waitForTimeout(2400);
  must(await moving('qsd-cat') === 0, 'the 404\'s cat is still moving after its cheer');
  // a stand-in for the subscribe API: the journey never sends an address anywhere
  await page.route('**/api/subscribe', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }));
  await go('/posts/shihuqiao/?motion=on');
  await page.evaluate(() => { try { localStorage.removeItem('qsd-subscribe-done'); localStorage.removeItem('qsd-subscribe-dismissed'); } catch (e) {} });
  await page.locator('[data-subscribe-slip]').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
  await page.fill('.subscribe-slip__input', 'journey@example.test');
  await page.click('.subscribe-slip__send');
  must(await cheered('.subscribe-slip.is-done .subscribe-slip__cat'), 'no cat raised its cup after subscribing');
  const tall = await page.evaluate(() => document.querySelector('.subscribe-slip__cat').getBoundingClientRect().height);
  must(tall > 0, 'the thank-you\'s cat takes no room: it cannot be seen');
  must(await said('.subscribe-slip__cat') === 'Thank you!', 'the thank-you\'s cat did not say "Thank you!"');
} };
