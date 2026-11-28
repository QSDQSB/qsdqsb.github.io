import { must } from './_lib.mjs';

export default { id: 'focus-ring', name: 'By keyboard through a post, Home, a voyage and a fable every stop wears the brass ring (on parchment the fable\'s own), none the browser\'s own', async run({ page, go }) {
  for (const to of ['/posts/in-the-naming-of-light/', '/', '/voyage/barcelona/', '/bestiary/the-milk-plate/']) {
    await go(to);
    // Down to the foot too: the way on and the ending are where a keyboard reader ends up.
    for (const from of ['top', 'foot']) {
      if (from === 'foot') await page.evaluate(() => { const l = document.querySelectorAll('.site-colophon a'); l[0]?.focus(); });
      for (let i = 0; i < (from === 'top' ? 24 : 6); i++) {
        await page.keyboard.press(from === 'top' ? 'Tab' : 'Shift+Tab');
        const f = await page.evaluate(() => {
          const el = document.activeElement;
          if (!el || el === document.body) return null;
          // A field that clears its own outline hands the ring to its frame (the subscribe slip's).
          const cs = getComputedStyle(el.matches(".subscribe-slip__input") ? el.closest(".subscribe-slip__form") : el);
          // On a fable's paper the ring is the page's brass, whatever colour the fable gives it.
          const probe = document.createElement('i'); probe.style.color = 'var(--fable-brass)'; document.body.append(probe);
          const fable = document.body.classList.contains('fable-page') && !el.closest('.masthead, .skip-link') ? getComputedStyle(probe).color : null; probe.remove();
          return { what: `${el.tagName.toLowerCase()}.${[...el.classList].join('.')}`, style: cs.outlineStyle, colour: cs.outlineColor, width: parseFloat(cs.outlineWidth), fable };
        });
        if (!f) continue;
        const brass = f.fable ? f.colour.startsWith(f.fable.slice(0, -1)) : /195, 180, 152/.test(f.colour);
        must(f.style !== 'auto' && f.width > 0 && brass, `${to}: ${f.what} takes focus with ${f.style} ${f.width}px ${f.colour}, not the ${f.fable ? 'fable\'s' : 'brass'} ring`);
      }
    }
  }
} };
