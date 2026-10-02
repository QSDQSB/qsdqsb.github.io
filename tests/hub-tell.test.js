'use strict';

// The command centre tells Claude when the owner taps (the `comments` capability). The page's
// script is run in a real browser against a stand-in for the viewer's runtime that behaves as the
// contract says: `anchorFor` resolves later, and `sendToClaude` takes plain data only. Skipped
// where no browser is installed (CI runs the fast gate without one).

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');

const stub = (can, fail) => `
  window.__sent = []; window.__store = {};
  window.claude = { use: (name) => Promise.resolve(
    name === 'db' ? { doc: (p) => ({ set: (v) => { window.__store[p] = v; return Promise.resolve(); }, delete: () => Promise.resolve() }),
                      collection: () => ({ add: () => Promise.resolve(), onSnapshot: (cb) => { setTimeout(() => cb({ docs: [], metadata: { fromCache: true } }), 20); } }) }
    : name === 'comments' ? { canSendToClaude: () => Promise.resolve(${JSON.stringify(can)}), anchorFor: () => Promise.resolve({ path: 'x', x: 0, y: 0 }),
        sendToClaude: (t) => { if (t.anchor && typeof t.anchor.then === 'function') return Promise.reject({ code: 'invalid' }); window.__sent.push(t); return ${fail ? `Promise.reject({ code: ${JSON.stringify(fail)} })` : `Promise.resolve({ threadId: 'T1', commentId: 'C' })`}; } }
    : null) };`;

test('a tap on the command centre tells a listening session, once, by id and letter only', async (t) => {
  let chromium;
  try { ({ chromium } = require('playwright-core')); } catch { return t.skip('playwright-core is not installed'); }
  let browser;
  try { browser = await chromium.launch(); } catch { return t.skip('no Chromium to run the page in'); }

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hub-tell-'));
  try {
    // A plan of its own with one open call, so there is something to tap whatever the owner's queue holds.
    const plan = path.join(dir, 'plan');
    fs.cpSync(path.join(ROOT, '_plan'), plan, { recursive: true });
    const env = { ...process.env, PLAN_DIR: plan };
    assert.strictEqual(spawnSync('node', [path.join(ROOT, 'scripts/plan.mjs'), 'ask', 'A call for the test?', '--body', 'One line.', '--option', 'A*: This.', '--option', 'B: That.'], { env, encoding: 'utf8' }).status, 0);
    const out = path.join(dir, 'hub.html');
    assert.strictEqual(spawnSync('node', [path.join(ROOT, 'scripts/hub-page.mjs'), '--out', out], { env, encoding: 'utf8' }).status, 0);
    const doc = path.join(dir, 'page.html');
    fs.writeFileSync(doc, `<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1"><style>[hidden]{display:none!important}body{margin:0}</style></head><body>${fs.readFileSync(out, 'utf8')}</body></html>`);

    const open = async (can, fail) => {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const page = await context.newPage();
      const errors = []; page.on('pageerror', (e) => errors.push(e.message));
      await page.addInitScript(stub(can, fail));
      await page.goto(`file://${doc}`);
      await page.waitForTimeout(400);
      const call = await page.evaluate(() => [...document.querySelectorAll('.call')].find((c) => /A call for the test/.test(c.textContent)).id);
      const state = () => page.evaluate(() => { const b = document.getElementById('tell'), r = b.getBoundingClientRect(); return { heard: document.getElementById('heard-text').textContent, button: !b.hidden, onScreen: b.hidden || (r.left >= 0 && r.right <= innerWidth), sent: window.__sent }; });
      const tap = async (o) => { await page.click(`.opt[data-q="${call}"][data-o="${o}"]`); await page.waitForTimeout(250); };
      return { page, call, state, tap, errors, close: () => context.close() };
    };

    // A session is listening: the first tap is told at once; the next waits; the button sends it, into the same thread.
    let v = await open('available', null);
    await v.tap('A');
    let s = await v.state();
    assert.strictEqual(s.sent.length, 1, 'the anchor is waited for, then one comment is sent');
    assert.ok(s.sent[0].anchor && !s.sent[0].threadId);
    assert.strictEqual(s.sent[0].text, `Answers changed on the command centre: ${v.call}: A. Please read this page's store and record them in the plan.`);
    assert.match(s.heard, /^Claude was told at /);
    await v.tap('B');
    s = await v.state();
    assert.strictEqual(s.sent.length, 1, 'not told twice within twenty seconds');
    assert.ok(s.button && s.onScreen, 'the button is offered, where a phone can reach it');
    // A note is told by its id; its words stay in the store.
    await v.page.fill(`#note-${v.call}`, 'a private reason'); await v.page.press(`#note-${v.call}`, 'Tab'); await v.page.waitForTimeout(250);
    await v.page.click('#tell'); await v.page.waitForTimeout(250);
    s = await v.state();
    assert.strictEqual(s.sent.length, 2);
    assert.strictEqual(s.sent[1].threadId, 'T1', 'the same thread is written to again');
    assert.ok(!s.sent.some((m) => m.text.includes('private')), 'the words of a note are never sent');
    assert.deepStrictEqual(v.errors, []);
    await v.close();

    // Nobody is listening: nothing is sent, and the page says the answers are kept.
    v = await open('no_session', null);
    await v.tap('A');
    s = await v.state();
    assert.strictEqual(s.sent.length, 0);
    assert.match(s.heard, /^No Claude session is listening just now\./);
    assert.ok(!s.button);
    await v.close();

    // Refused for good in this view: the button goes, and the page says it is off.
    v = await open('available', 'forbidden');
    await v.tap('A');
    s = await v.state();
    assert.match(s.heard, /switched off here/);
    assert.ok(!s.button);
    await v.close();

    // Leave not yet given: the button stays, with what to do.
    v = await open('available', 'consent_required');
    await v.tap('A');
    s = await v.state();
    assert.match(s.heard, /allow this page to comment as you/);
    assert.ok(s.button && s.onScreen);
    await v.close();
  } finally {
    await browser.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
