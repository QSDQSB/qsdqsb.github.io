import { must } from './_lib.mjs';

export default { id: 'tags', name: 'A tag page shows its doors, a door opens its room, the room leads next door and Back retraces, and a tag in the address lands in its room', async run({ page, go }) {
  for (const at of ['/voyage-by-tags/', '/tags/']) {
    await go(at);
    const doors = page.locator('.tag-page > .tag-page__doors a.card');
    must(await doors.count() >= 5, `${at}: only ${await doors.count()} doors`);
    // A voyage's door is the dye vat of its photograph, and clears to the photograph under the pointer.
    if (at === '/voyage-by-tags/') {
      const vat = doors.first().locator('canvas.tag-page__vat');
      await vat.waitFor({ state: 'attached' });
      must(await page.locator('.tag-page > .tag-page__doors canvas.tag-page__vat').count() === await doors.count(), `${at}: a door has no vat`);
      await page.locator('.tag-page > .tag-page__doors .tag-page__door.is-poured').nth(await doors.count() - 1).waitFor({ state: 'attached' });
      await doors.first().hover();
      await page.waitForFunction((el) => getComputedStyle(el).opacity === '0', await vat.elementHandle());
      await page.mouse.move(0, 0);
      await page.waitForFunction((el) => getComputedStyle(el).opacity === '1', await vat.elementHandle());
    }
    const slug = (await doors.first().getAttribute('href')).slice(1);
    const room = page.locator(`.tag-page__room[id="${slug}"]`);
    await doors.first().click();
    await room.waitFor({ state: 'visible' });
    must(!(await doors.first().isVisible()), `${at}: the doors stayed over the room #${slug}`);
    // The room opens as a page does: its own hero where the page's stood, across the whole width.
    const hero = await room.locator('.tag-page__hero').boundingBox();
    must(!(await page.locator('body > .page__hero--overlay').isVisible()), `${at}: the page's hero stayed over the room's`);
    must(!!hero && Math.abs(hero.x) < 1 && Math.abs(hero.width - page.viewportSize().width) < 1, `${at}: the room's hero does not span the page (${hero && `${hero.x} + ${hero.width}`})`);
    must(await page.locator('.tag-page__room:visible').count() === 1, `${at}: more than one room is open`);
    must(await room.locator(':scope > a.card').count() >= 1, `${at}: the room #${slug} is empty`);
    const next = room.locator('.tag-page__next a.card').first();
    must(await next.count() === 1, `${at}: the room #${slug} leads nowhere`);
    const onward = (await next.getAttribute('href')).slice(1);
    await next.click();
    await page.locator(`.tag-page__room[id="${onward}"]`).waitFor({ state: 'visible' });
    must(!(await room.isVisible()), `${at}: #${slug} stayed open beside #${onward}`);
    await page.goBack();
    await room.waitFor({ state: 'visible' });
    await page.goBack();
    await doors.first().waitFor({ state: 'visible' });
    // As a tag under a post or a voyage arrives, from another page: straight into the room, and a cover there opens.
    await page.goto('about:blank');
    await go(`${at}#${slug}`);
    await room.waitFor({ state: 'visible' });
    const cover = room.locator(':scope > a.card').first();
    const href = await cover.getAttribute('href');
    await Promise.all([page.waitForURL(`**${href}`), cover.click()]);
    must(await page.locator('h1').count() >= 1, `${href} opened without a title`);
  }
} };
