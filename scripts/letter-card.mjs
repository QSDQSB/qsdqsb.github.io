#!/usr/bin/env node
/**
 * letter-card.mjs — a colour's Reverie card as a picture, for a letter.
 *
 *   node scripts/letter-card.mjs <hex> [--site https://qsdqsb.com] [--out card.jpg]
 *
 * A letter cannot run the site's scripts: the dye is poured on a canvas by the colour pages' own
 * code (assets/js/colour/), and no mail client would draw it. So the card is drawn where it is
 * drawn for readers, in a post that carries one (In the Naming of Light), by a headless Chromium,
 * and kept as the picture it makes there: the dye, the hex and its name, the colours nearby and the
 * photographs that hold it. The colour asked for takes the place of the post's own (the page is
 * fetched and its card's data-colour changed before its script reads it), so any colour can be had.
 *
 * Kept: a JPEG 1120 px wide (two pixels to each of a letter's 560), on the letter's own ground so
 * the card's rounded corners stand on what surrounds them in the mail. Of its photographs only the
 * first, where the colour was found: a common colour has thirty, a picture ten thousand pixels tall,
 * and the count line already says how many there are. The card's foot, a hint for a resting
 * pointer, is left out: nothing in a letter can be hovered. A card that is not the colour asked
 * for, or too tall or heavy for a letter, is refused rather than kept.
 *
 * Used by scripts/send-letter.mjs (--card <hex>), which attaches the picture inline (Content-ID),
 * as it does the crest. `--site` draws from another build, e.g. http://localhost:4000. Alone, it
 * writes the picture to the system's temporary folder (or --out).
 */

import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { chromium } from 'playwright-core';
import { GROUND } from './letter-template.mjs';

const require = createRequire(import.meta.url);
const POST = '/posts/in-the-naming-of-light/';
export const CARD_WIDTH = 560; // the letter's column (letter-template.mjs), in CSS pixels
const MAX_HEIGHT = 1200, MAX_BYTES = 400 * 1024; // past these a letter is a download, and Outlook crops it

/**
 * @param {string} hex  six hex figures, with or without #
 * @returns {Promise<{ jpeg: Buffer, width: number, height: number, hex: string, name: string, href: string }>}
 *   the picture at twice the letter's pixels; its size as the letter shows it; the colour, its
 *   Ridgway name ('' when none lies close) and the absolute address of its Reverie.
 */
export async function reverieCard(hex, { site = 'https://qsdqsb.com' } = {}) {
  const six = String(hex).replace(/^#/, '').toLowerCase();
  if (!/^[0-9a-f]{6}$/.test(six)) throw new Error(`not a colour: ${hex}`);
  const base = site.replace(/\/$/, '');
  const browser = await chromium.launch();
  try {
    const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2, colorScheme: 'dark' })).newPage();
    // The post as served, its Reverie card set to the colour asked for.
    await page.route(`${base}${POST}*`, async (route) => {
      const res = await route.fetch(), served = await res.text();
      const body = served.replace(/(data-figure="reverie"[^>]*data-colour=")[0-9a-f]{6}"/i, `$1${six}"`);
      // A page whose card could not be found to recolour would draw its own colour as if asked.
      if (body === served && !served.includes(`data-colour="${six}"`)) { await route.abort(); return; }
      await route.fulfill({ response: res, body });
    });
    await page.goto(`${base}${POST}?motion=off`, { waitUntil: 'domcontentloaded' }).catch((e) => {
      throw new Error(`could not open ${base}${POST} with its Reverie card in #${six.toUpperCase()}`, { cause: e });
    });
    // The card alone, a letter's column wide, on the letter's ground; nothing over it.
    await page.addStyleTag({ content: `
      html, body { background: ${GROUND}; }
      .masthead, .greedy-nav, #site-nav { visibility: hidden; }
      .colour-figure--reverie { width: ${CARD_WIDTH}px; max-width: none; margin: 40px auto; }
      .colour-figure--reverie .colour-plate { box-shadow: none; }
      .colour-figure--reverie .colour-plate__hint { display: none; }
      .colour-figure--reverie .palette-card { content-visibility: visible; }
      .colour-figure--reverie .palette-cards > .palette-card:not(:first-child) { display: none; }
      /* the first print's ring in the card's own ink: ?motion=off would set it white (_colour.scss, colour-still) */
      html.motion-off .colour-figure--reverie .palette-card.is-from .palette-card__print img { outline-color: var(--photobook-ink-3); }` });
    const fig = page.locator('.colour-figure--reverie');
    await fig.scrollIntoViewIfNeeded();
    await page.waitForSelector('.colour-figure--reverie.is-drawn .reverie__dye.is-poured', { timeout: 30000 });
    // Its photographs, every one fetched now (they wait for the screen otherwise) and developed.
    await fig.evaluate((el) => el.querySelectorAll('img').forEach((im) => { im.loading = 'eager'; }));
    await page.waitForFunction(() => [...document.querySelectorAll('.colour-figure--reverie img')].every((im) => im.complete && im.naturalWidth), null, { timeout: 30000 });
    await page.waitForTimeout(800);
    const card = fig.locator('.reverie-card');
    const info = await card.evaluate((el) => ({
      hex: el.querySelector('.reverie__code').textContent.trim(),
      name: el.querySelector('.reverie__named').textContent.trim(),
      href: el.querySelector('.reverie-card__open').href,
    }));
    if (info.hex.toLowerCase() !== `#${six}`) throw new Error(`the card drew ${info.hex}, not #${six.toUpperCase()}`);
    const png = await card.screenshot({ type: 'png' });
    const sharp = require('sharp');
    const jpeg = await sharp(png).flatten({ background: GROUND }).jpeg({ quality: 86, mozjpeg: true }).toBuffer();
    const { width, height } = await sharp(jpeg).metadata();
    const shown = { width: Math.round(width / 2), height: Math.round(height / 2) };
    if (shown.height > MAX_HEIGHT || jpeg.length > MAX_BYTES) throw new Error(`the card is ${shown.width}×${shown.height}, ${(jpeg.length / 1024).toFixed(0)} KB: too large for a letter (at most ${MAX_HEIGHT} px tall, ${MAX_BYTES / 1024} KB)`);
    return { jpeg, ...shown, ...info };
  } finally {
    await browser.close();
  }
}

// As a command: the picture alone, to look at or to send by other means.
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const opt = (name) => { const i = args.indexOf(name); return i < 0 ? null : args.splice(i, 2)[1]; };
  const site = opt('--site') || undefined, out = opt('--out');
  const hex = args[0];
  if (!hex) { console.error('usage: node scripts/letter-card.mjs <hex> [--site URL] [--out card.jpg]'); process.exit(2); }
  const card = await reverieCard(hex, { site });
  const file = out || join(tmpdir(), `reverie-${card.hex.replace('#', '').toLowerCase()}.jpg`); // never beside the repo's files
  writeFileSync(file, card.jpeg);
  console.log(`${file}  ${card.hex}${card.name ? ` ${card.name}` : ''}  ${card.width}×${card.height} in a letter, ${(card.jpeg.length / 1024).toFixed(0)} KB  → ${card.href}`);
}
