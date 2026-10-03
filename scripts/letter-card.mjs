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
 * the card's rounded corners stand on what surrounds them in the mail. The card's foot, a hint for
 * a resting pointer, is left out: nothing in a letter can be hovered.
 *
 * Used by scripts/send-letter.mjs (--card <hex>), which attaches the picture inline (Content-ID),
 * as it does the crest. `--site` draws from another build, e.g. http://localhost:4000.
 */

import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { chromium } from 'playwright-core';
import { GROUND } from './letter-template.mjs';

const require = createRequire(import.meta.url);
const POST = '/posts/in-the-naming-of-light/';
export const CARD_WIDTH = 560; // the letter's column (letter-template.mjs), in CSS pixels

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
      const res = await route.fetch();
      const body = (await res.text()).replace(/(data-figure="reverie"[^>]*data-colour=")[0-9a-f]{6}"/i, `$1${six}"`);
      await route.fulfill({ response: res, body });
    });
    await page.goto(`${base}${POST}?motion=off`, { waitUntil: 'domcontentloaded' });
    // The card alone, a letter's column wide, on the letter's ground; nothing over it.
    await page.addStyleTag({ content: `
      html, body { background: ${GROUND}; }
      .masthead, .greedy-nav, #site-nav { visibility: hidden; }
      .colour-figure--reverie { width: ${CARD_WIDTH}px; max-width: none; margin: 40px auto; }
      .colour-figure--reverie .colour-plate { box-shadow: none; }
      .colour-figure--reverie .colour-plate__hint { display: none; }
      .colour-figure--reverie .palette-card { content-visibility: visible; }` });
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
    const png = await card.screenshot({ type: 'png' });
    const sharp = require('sharp');
    const jpeg = await sharp(png).flatten({ background: GROUND }).jpeg({ quality: 86, mozjpeg: true }).toBuffer();
    const { width, height } = await sharp(jpeg).metadata();
    return { jpeg, width: Math.round(width / 2), height: Math.round(height / 2), ...info };
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
  const file = out || `reverie-${card.hex.replace('#', '').toLowerCase()}.jpg`;
  writeFileSync(file, card.jpeg);
  console.log(`${file}  ${card.hex}${card.name ? ` ${card.name}` : ''}  ${card.width}×${card.height} in a letter, ${(card.jpeg.length / 1024).toFixed(0)} KB  → ${card.href}`);
}
