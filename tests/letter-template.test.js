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
  assert.ok(text.includes(`Read it: ${LETTER.url}`));
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
