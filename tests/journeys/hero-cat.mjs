import { must } from './_lib.mjs';

export default { id: 'hero-cat', name: "Home's cat keeps its size, moves, answers the pointer, and holds still when motion is off", async run({ page, go }) {
  const cat = () => page.evaluate(() => { const c = document.querySelector('qsd-cat'); const svg = c?.shadowRoot?.querySelector('svg.qc');
    return c && svg && { still: svg.classList.contains('qc-still'), stepping: !!c.raf, t: c.clock || 0, hovered: c.hovered, clicks: c.clicks }; });
  await go('/?mark=cat&motion=on');
  await page.waitForFunction(() => document.querySelector('qsd-cat')?.raf, null, { timeout: 5000 }).catch(() => {});
  const box = await page.locator('qsd-cat svg.qc').boundingBox();
  must(box && box.width <= 421 && box.height <= 421, `the cat is ${Math.round(box?.width)}px wide: --qsd-cat-size no longer holds it`);
  const a = await cat(); await page.waitForTimeout(600); const b = await cat();
  must(b?.stepping && b.t > a.t, 'the cat\'s idle loop is not being stepped');
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.45);
  await page.mouse.down(); await page.mouse.up();
  const c = await cat();
  must(c.hovered && c.clicks === 1, 'the cat did not answer a pointer over it and a click');
  // a phone turned sideways hides the band (display:none) and back shows it: the loop must stay stepped
  await page.evaluate(() => { document.querySelector('qsd-cat').style.display = 'none'; });
  await page.waitForTimeout(300);
  await page.evaluate(() => { document.querySelector('qsd-cat').style.display = ''; });
  await page.waitForTimeout(500);
  const e = await cat(); await page.waitForTimeout(400); const f = await cat();
  const native = await page.evaluate(() => document.querySelector('qsd-cat').shadowRoot.getAnimations().filter((a) => a instanceof CSSAnimation && a.playState === 'running').length);
  must(native === 0 && f.t > e.t, `after being hidden and shown the cat runs ${native} animations at full rate${f.t > e.t ? '' : ', and its loop has stopped'}`);
  await page.goto('about:blank');
  await go('/?mark=cat&motion=off');
  await page.waitForFunction(() => document.querySelector('qsd-cat')?.svg, null, { timeout: 5000 }).catch(() => {});
  const d = await cat();
  must(d?.still && !d.stepping, 'with motion off the cat still moves');
} };
