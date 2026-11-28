import { must } from './_lib.mjs';

export default { id: 'proclamation', phone: true, name: 'Every royal letter keeps its title on one line inside its frame on a phone, in both languages, and the arms and seal load', async run({ page, go }) {
  await go('/posts/war-declaration-to-boredom/');
  const letter = await page.evaluate(async () => {
    const frame = document.querySelector('div.proclamation--grand'), kind = frame && frame.querySelector('.proclamation-head__kind');
    if (!frame || !kind) return null;
    const arms = [...frame.querySelectorAll('.proclamation-head__arms, .proclamation-seal__arms')];
    for (const img of arms) { img.loading = 'eager'; if (!img.complete) await new Promise((done) => { img.onload = img.onerror = done; }); }
    // Every paper's title, in each language shown alone: one line, inside its frame.
    const panels = [...document.querySelectorAll('[data-bilingual-lang]')];
    const was = panels.map((p) => p.hidden);
    let bad = null;
    for (const shown of panels) {
      panels.forEach((p) => { p.hidden = p !== shown; });
      for (const f of shown.querySelectorAll('div.proclamation')) {
        const k = f.querySelector('.proclamation-head__kind');
        const range = document.createRange(); range.selectNodeContents(k);
        const t = range.getBoundingClientRect(), fr = f.getBoundingClientRect();
        const lines = Math.round(t.height / parseFloat(getComputedStyle(k).lineHeight));
        if (!bad && (lines !== 1 || t.left < fr.left + 8 || t.right > fr.right - 8)) bad = `${k.textContent.trim()} (${lines} lines)`;
      }
    }
    panels.forEach((p, i) => { p.hidden = was[i]; });
    return { bad, loaded: arms.length === 2 && arms.every((img) => img.naturalWidth > 0) };
  });
  must(letter, 'the post is not set as a letter: no frame or letterhead');
  must(!letter.bad, `a paper's title breaks or runs over its frame: ${letter.bad}`);
  must(letter.loaded, 'the arms or the seal did not load');
} };
