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
