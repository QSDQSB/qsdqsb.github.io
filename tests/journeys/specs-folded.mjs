import { must } from './_lib.mjs';

export default { id: 'specs-folded', name: 'Folded away, the specs take no Tab', async run({ page, go }) {
  await go('/voyage/london/');
  await page.locator('.photobook-frame__print').first().click();
  await page.waitForFunction(() => document.querySelector('.photobook-lightbox')?.open, null, { timeout: 8000 }).catch(() => {});
  must(await page.evaluate(() => document.querySelector('.photobook-lightbox').classList.contains('has-specs')), 'the lightbox opened without its specs: nothing to fold');
  must(await page.locator('.photobook-specs a[href], .photobook-specs button').count() >= 1, 'the specs hold nothing a Tab could reach: the journey cannot tell');
  await page.keyboard.press('i');
  await page.waitForFunction(() => !document.querySelector('.photobook-lightbox').classList.contains('has-specs'), null, { timeout: 3000 }).catch(() => {});
  await page.waitForTimeout(700);
  for (let i = 0; i < 14; i++) {
    await page.keyboard.press('Tab');
    must(!(await page.evaluate(() => !!document.activeElement?.closest('.photobook-specs'))), 'Tab reached inside the folded specs, where nothing can be seen');
  }
} };
