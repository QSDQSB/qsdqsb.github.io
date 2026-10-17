const test = require('node:test');
const assert = require('node:assert/strict');

const LETTER = {
  title: 'A Letter of "Wonders" & <Doubt>',
  excerpt: 'Where whispers dance on liquid streets.',
  url: 'https://qsdqsb.com/posts/example/',
  dateLine: 'August 2026',
};
const UNSUB = 'https://qsdqsb.com/api/unsubscribe?token=11111111-2222-4333-8444-555555555555';

test('HTML letter carries the personal unsubscribe link and escapes content', async () => {
  const { renderLetterHtml } = await import('../scripts/letter-template.mjs');
  const html = renderLetterHtml(LETTER, UNSUB);
  assert.ok(html.includes(UNSUB), 'unsubscribe URL present');
  assert.ok(html.includes('A Letter of &quot;Wonders&quot; &amp; &lt;Doubt&gt;'), 'title escaped');
  assert.ok(!html.includes('<Doubt>'), 'raw markup never leaks into the document');
  assert.ok(html.includes('https://qsdqsb.com/posts/example/'), 'read link present');
  assert.ok(html.includes('/terms/#email-subscription'), 'privacy link present');
});

test('text letter mirrors the essentials', async () => {
  const { renderLetterText } = await import('../scripts/letter-template.mjs');
  const text = renderLetterText(LETTER, UNSUB);
  assert.ok(text.includes(LETTER.title));
  assert.ok(text.includes(`Unsubscribe: ${UNSUB}`));
  assert.ok(text.includes('Sent because you subscribed at qsdqsb.com.'), 'the footnote says why it came');
  assert.ok(text.includes(`Onward: ${LETTER.url}`));
});

test('two recipients never share an unsubscribe link', async () => {
  const { renderLetterHtml } = await import('../scripts/letter-template.mjs');
  const a = renderLetterHtml(LETTER, 'https://qsdqsb.com/api/unsubscribe?token=aaaa');
  const b = renderLetterHtml(LETTER, 'https://qsdqsb.com/api/unsubscribe?token=bbbb');
  assert.ok(a.includes('token=aaaa') && !a.includes('token=bbbb'));
  assert.ok(b.includes('token=bbbb') && !b.includes('token=aaaa'));
});

test('welcome email carries the recipient unsubscribe link, the CTA target and privacy', async () => {
  const { renderWelcomeHtml } = await import('../scripts/letter-template.mjs');
  const html = renderWelcomeHtml({ siteUrl: 'https://qsdqsb.com' }, UNSUB);
  assert.ok(html.includes(UNSUB), 'unsubscribe URL present');
  assert.ok(html.includes('The door is open'), 'welcome title present');
  assert.ok(html.includes('href="https://qsdqsb.com"'), 'CTA points at the house');
  assert.ok(html.includes('/terms/#email-subscription'), 'privacy link present');
});

test('welcome falls back to the canonical site URL and mirrors in plaintext', async () => {
  const { renderWelcomeHtml, renderWelcomeText } = await import('../scripts/letter-template.mjs');
  const html = renderWelcomeHtml(undefined, UNSUB);
  assert.ok(html.includes('href="https://qsdqsb.com"'), 'default site URL used when none given');
  const text = renderWelcomeText(undefined, UNSUB);
  assert.ok(text.includes('The door is open.'));
  assert.ok(text.includes(`Unsubscribe: ${UNSUB}`));
  assert.ok(text.includes('Enter the house: https://qsdqsb.com'));
});

test('a letter carries its picture inline, linked, between its words and its way in', async () => {
  const { renderLetterHtml, renderLetterText } = await import('../scripts/letter-template.mjs');
  const figure = { cid: 'reverie-ce7d99', width: 560, height: 820, alt: 'Reverie in #CE7D99, Daphne Pink', href: 'https://qsdqsb.com/reverie/?c=ce7d99&from=rigi%2Fdscf5760' };
  const html = renderLetterHtml({ ...LETTER, figure }, UNSUB);
  assert.ok(html.includes('src="cid:reverie-ce7d99" width="560" height="820" alt="Reverie in #CE7D99, Daphne Pink"'), 'the picture, by its Content-ID, with its size and name');
  assert.ok(html.includes('href="https://qsdqsb.com/reverie/?c=ce7d99&amp;from=rigi%2Fdscf5760"'), 'it leads to its Reverie');
  assert.ok(html.indexOf('cid:reverie-ce7d99') > html.indexOf(LETTER.excerpt) && html.indexOf('cid:reverie-ce7d99') < html.indexOf('Onward'), 'after the words, before the way in');
  assert.ok(renderLetterText({ ...LETTER, figure }, UNSUB).includes(`${figure.alt}: ${figure.href}`), 'the text letter names it and its address');
  assert.ok(!renderLetterHtml(LETTER, UNSUB).includes('cid:reverie'), 'no picture unless one is given');
});

test('a line from the piece takes the excerpt\'s place, and the inbox\'s preview', async () => {
  const { renderLetterHtml, renderLetterText } = await import('../scripts/letter-template.mjs');
  const quote = '所以这个颜色的名字背后，是一个逃离太阳的人。';
  const html = renderLetterHtml({ ...LETTER, quote }, UNSUB);
  assert.ok(html.includes(quote) && !html.includes(LETTER.excerpt), 'the line, not the excerpt');
  assert.ok(html.indexOf(quote) < html.indexOf('</div>'), 'the inbox preview is the line');
  assert.ok(html.includes("'Songti SC'"), 'Chinese in a Song face');
  const text = renderLetterText({ ...LETTER, quote }, UNSUB);
  assert.ok(text.includes(quote) && !text.includes(LETTER.excerpt));
});

test('a quote of two paragraphs keeps its links, escapes its words and says it is Chinese', async () => {
  const { renderLetterHtml, renderLetterText } = await import('../scripts/letter-template.mjs');
  const quote = ['记一下两个功能：[Palette](https://qsdqsb.com/palette/) 和 [Reverie](https://qsdqsb.com/reverie/)。', 'Light <b>& snow</b>.'];
  const html = renderLetterHtml({ ...LETTER, quote }, UNSUB);
  assert.ok(html.includes('<a href="https://qsdqsb.com/palette/" style="color:#c3b498;text-decoration:underline;">Palette</a>'), 'a link in the line');
  assert.ok(html.includes('Light &lt;b&gt;&amp; snow&lt;/b&gt;.'), 'words escaped');
  assert.equal((html.match(/lang="zh-Hans"/g) || []).length, 1, 'only the Chinese paragraph is marked Chinese');
  const text = renderLetterText({ ...LETTER, quote }, UNSUB);
  assert.ok(text.includes('Palette (https://qsdqsb.com/palette/) 和 Reverie (https://qsdqsb.com/reverie/)'), 'the text letter spells the links out');
});

test('a letter says what kind of thing has come, small above its title', async () => {
  const { renderLetterHtml, renderLetterText } = await import('../scripts/letter-template.mjs');
  const html = renderLetterHtml({ ...LETTER, kicker: 'Fresh ink from QSD' }, UNSUB);
  const body = html.indexOf('<body');
  assert.ok(html.indexOf('Fresh ink from QSD') < html.indexOf('A Letter of', body), 'above the title');
  assert.ok(renderLetterText({ ...LETTER, kicker: 'Fresh ink from QSD' }, UNSUB).includes('FRESH INK FROM QSD\nA Letter of'));
  assert.ok(!renderLetterHtml(LETTER, UNSUB).includes('letter-spacing:3px;text-transform:uppercase;color:#8a8d8f'), 'none unless given');
});

test('a quote may carry its English beneath it, quieter, and never without the quote', async () => {
  const { renderLetterHtml, renderLetterText } = await import('../scripts/letter-template.mjs');
  const quote = '写了一篇日志：[Palette](https://qsdqsb.com/palette/)。', gloss = 'A diary entry: [Palette](https://qsdqsb.com/palette/).';
  const html = renderLetterHtml({ ...LETTER, quote, gloss }, UNSUB);
  assert.ok(html.indexOf('写了一篇日志') < html.indexOf('A diary entry'), 'the English beneath the Chinese');
  assert.ok(/lang="en" style="[^"]*font-style:italic/.test(html), 'in italic, said to be English');
  assert.ok(html.includes('<a href="https://qsdqsb.com/palette/" style="color:#8a8d8f;text-decoration:underline;">Palette</a>'), 'its links in its own grey');
  assert.ok(!renderLetterHtml({ ...LETTER, gloss }, UNSUB).includes('A diary entry'), 'no English for a quote that is not there');
  assert.ok(renderLetterText({ ...LETTER, quote, gloss }, UNSUB).includes('A diary entry: Palette (https://qsdqsb.com/palette/).'));
});

test("a voyage's card leads its letter, carrying the title and line the text then leaves out", async () => {
  const { renderLetterHtml } = await import('../scripts/letter-template.mjs');
  const figure = { cid: 'voyage-lungern', width: 560, height: 466, href: 'https://qsdqsb.com/voyage/lungern/', alt: 'Lungern: Where gilded poplars dapple turquoise water', carriesTitle: true };
  const html = renderLetterHtml({ ...LETTER, title: 'Lungern', excerpt: 'Where gilded poplars dapple turquoise water', kicker: 'New prints from QSD', figure }, UNSUB);
  const body = html.slice(html.indexOf('<body'));
  assert.ok(body.indexOf('New prints from QSD') < body.indexOf('cid:voyage-lungern'), 'under the kicker');
  assert.ok(body.indexOf('cid:voyage-lungern') < body.indexOf('Onward'), 'before the way in');
  assert.ok(!body.includes('font-size:30px'), 'no title in text');
  assert.ok(!body.includes('font-style:italic;font-size:17px'), 'no line in text: the picture and its alt text say it');
  const reverie = renderLetterHtml({ ...LETTER, figure: { ...figure, carriesTitle: false } }, UNSUB);
  assert.ok(reverie.includes('font-size:30px'), 'a card that carries no title leaves the title in text');
});

test("a voyage's card is drawn from its page's own words, cover and palette", async () => {
  const { mkdtempSync, mkdirSync, writeFileSync } = require('node:fs');
  const { join } = require('node:path');
  const { tmpdir } = require('node:os');
  const { voyageCardData, voyageCardHtml } = await import('../scripts/letter-card.mjs');
  const root = mkdtempSync(join(tmpdir(), 'voyage-card-'));
  for (const d of ['_voyage', '_subvoyage/isles', '_data/photos/isles', '_data/photo_manifests']) mkdirSync(join(root, d), { recursive: true });
  const put = (f, s) => writeFileSync(join(root, f), typeof s === 'string' ? s : JSON.stringify(s));
  put('_voyage/lake.md', '---\ntitle: "Lake <One>"\nexcerpt: "Where water & ___enchanted___ light"\ngallery_name: "lake"\n---\n');
  put('_data/photos/lake.yml', 'cover:\n  photo: dscf1\n  focus: [0.4, 0.7]\nphotos: {}\n');
  put('_data/photo_manifests/lake.json', { photos: [{ slug: 'dscf1', url: 'https://img.qsdqsb.com/t/abc', ratio: 1.5 }] });
  // A voyage in parts: its cover is a part's frame, and it has no palette of its own.
  put('_voyage/isles.md', '---\ntitle: Isles\nsubgalleries: true\n---\n');
  put('_data/photos/isles.yml', 'cover:\n  photo: north/dscf2\n  focus: [0.5, 0.3]\n');
  put('_data/photo_manifests/isles_north.json', { photos: [{ slug: 'dscf2', url: 'https://img.qsdqsb.com/t/def', ratio: 1.5 }] });
  // A part: its own address under its parent, its own palette.
  put('_subvoyage/isles/north.md', '---\ntitle: North\ngallery_name: "isles/north"\n---\n');
  put('_data/photos/isles/north.yml', 'cover:\n  photo: dscf2\n  focus: [0.5, 0.5]\n');
  put('_data/photo_manifests/palettes.json', { voyages: [
    { g: 'lake', palette: [{ hex: '#3a7d7b', pc: 58, accent: false }, { hex: '#d6b252', pc: 2, accent: true }] },
    { g: 'isles/north', palette: [{ hex: '#223344', pc: 100, accent: false }] },
  ] });
  const d = voyageCardData('_voyage/lake.md', { root });
  assert.equal(d.path, '/voyage/lake/');
  assert.equal(d.cover, 'https://img.qsdqsb.com/t/abc/1280.webp');
  assert.equal(d.excerpt, 'Where water & enchanted light', 'no markdown marks on the card');
  assert.equal(d.palette.length, 2);
  const html = voyageCardHtml(d, null);
  assert.ok(html.includes('Lake &lt;One&gt;') && html.includes('Where water &amp; enchanted light'), 'words escaped');
  const { positionFor } = await import('../scripts/photos/lib/cover.mjs');
  assert.ok(html.includes(positionFor([0.4, 0.7], 1.5, 560 / 420)), "cut by the site's own cover maths");
  assert.ok(/\.lv-words \{[^}]*\bbottom: 24px/.test(html), 'the line at the foot, as the cards set it');
  assert.ok(html.includes('flex:58;background:#3a7d7b'), 'the bar in its shares');
  assert.ok(!html.includes('class="lv-vat"'), 'no vat when none was poured');
  const parts = voyageCardData('_voyage/isles.md', { root });
  assert.equal(parts.cover, 'https://img.qsdqsb.com/t/def/1280.webp', "a voyage in parts takes its part's frame");
  assert.equal(parts.palette.length, 0);
  assert.ok(!voyageCardHtml(parts, null).includes('class="lv-foot"'), 'and its card is the cover alone');
  const part = voyageCardData(join(root, '_subvoyage/isles/north.md'), { root });
  assert.equal(part.path, '/voyage/isles/north/', 'a part, by an absolute path too');
  assert.equal(part.palette.length, 1);
  assert.throws(() => voyageCardData('_posts/x.md', { root }), /not a voyage/);
});
