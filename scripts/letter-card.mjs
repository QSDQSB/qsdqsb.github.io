#!/usr/bin/env node
/**
 * letter-card.mjs — a colour's Reverie card, or a voyage's card, as a picture, for a letter.
 *
 *   node scripts/letter-card.mjs <hex> [--site https://qsdqsb.com] [--out card.jpg]
 *   node scripts/letter-card.mjs _voyage/<name>.md [--site …] [--out …]   (see "A voyage's card")
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

import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { chromium } from 'playwright-core';
import { GROUND } from './letter-template.mjs';
import { positionFor, shapeOf } from './photos/lib/cover.mjs';

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

/* ---------- A voyage's card ----------
 * The owner's pick of 2026-10-17 (A, "the magazine cover"), worked through four rounds against the
 * house's own eye (design-taste-frontend, preserve mode). One object: the voyage's cover, cut round
 * its focus by the site's own cover maths (scripts/photos/lib/cover.mjs), with its title and line at
 * the foot on the left, over the card's scrim and a hairline shadow (PRINCIPLES, Cards); and, as
 * the card's foot, the voyage's colours as QSD's Palette has them: the vat it pours (the mood) and
 * the bar (the composition). The line is the voyage card's own face, Playfair, upright (the owner,
 * 2026-10-17); Didot stays for figures. No eyebrow: the letter's kicker says what has come. A voyage
 * in parts has no palette of its own, so its card is the cover alone.
 */

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** A line as a reader sees it: no markdown emphasis marks (`___enchanted___`). */
export const plainLine = (s) => String(s || '').replace(/(\*{1,3}|_{1,3})(\S(?:.*?\S)?)\1/g, '$2');
// 4:3, the site's own "tall" cover shape: tall enough that a subject in the lower half still sits
// above the words, which stay at the foot on the left, as every voyage card sets its line.
const COVER_HEIGHT = 420;

/** The voyage page's own words and pictures, read from the repository as the build reads them. */
export function voyageCardData(voyagePath, { root = ROOT } = {}) {
  const yaml = require('js-yaml');
  const sub = voyagePath.match(/(?:^|\/)_subvoyage\/(.+)\.md$/), own = voyagePath.match(/(?:^|\/)_voyage\/([^/]+)\.md$/);
  if (!sub && !own) throw new Error(`not a voyage: ${voyagePath}`);
  const src = readFileSync(resolve(root, voyagePath), 'utf8');
  const fm = yaml.load(src.split(/^---\s*$/m)[1]) || {};
  const slug = sub ? sub[1] : own[1];
  const gallery = fm.gallery_name || null;
  // The cover: in the gallery's own YAML, or, for a voyage in parts, its parent's (photo: part/slug).
  const authored = (g) => { const f = join(root, '_data/photos', `${g}.yml`); return existsSync(f) ? yaml.load(readFileSync(f, 'utf8')) || {} : {}; };
  const yml = authored(gallery || slug);
  if (!yml.cover?.photo) throw new Error(`${voyagePath} has no cover in _data/photos/${gallery || slug}.yml, so it has no card: pass --no-card`);
  const [part, frame] = yml.cover.photo.includes('/') ? yml.cover.photo.split('/') : [null, yml.cover.photo];
  const coverGallery = part ? `${gallery || slug}/${part}` : gallery || slug;
  const manifest = join(root, '_data/photo_manifests', `${coverGallery.replace(/\//g, '_')}.json`);
  if (!existsSync(manifest)) throw new Error(`no fetched manifest for ${coverGallery} (npm run photos:fetch)`);
  const photo = JSON.parse(readFileSync(manifest, 'utf8')).photos.find((p) => p.slug === frame);
  if (!photo) throw new Error(`${coverGallery} has no processed ${frame}`);
  const palettes = join(root, '_data/photo_manifests/palettes.json');
  const voyage = gallery && existsSync(palettes) ? JSON.parse(readFileSync(palettes, 'utf8')).voyages.find((v) => v.g === gallery) : null;
  // A crop authored for the card's shape (4:3) wins over the focus, as on the site.
  const crop = Object.entries(yml.cover.crops || {}).find(([k]) => shapeOf(k) === 'tall');
  return {
    title: String(fm.title || ''),
    excerpt: plainLine(fm.excerpt),
    path: `/voyage/${slug}/`,
    gallery,
    cover: `${photo.url}/1280.webp`,
    ratio: photo.ratio || (photo.w && photo.h ? photo.w / photo.h : 1.5),
    focus: crop ? crop[1] : yml.cover.focus || [0.5, 0.5],
    palette: voyage ? voyage.palette.map(({ hex, pc }) => ({ hex, pc })) : [],
  };
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/** The card as a page of the site (its stylesheet gives the faces), the letter's column wide. */
export function voyageCardHtml(d, vat) {
  const pos = positionFor(d.focus, d.ratio, CARD_WIDTH / COVER_HEIGHT);
  const bar = d.palette.map((c) => `<i style="flex:${Number(c.pc)};background:${esc(c.hex)}"></i>`).join('');
  return `<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="/assets/css/main.css">
<style>
  html, body { margin: 0; background: ${GROUND}; }
  .lv { width: ${CARD_WIDTH}px; padding-bottom: 6px; color: #e4e5e5; }
  .lv-card { border-radius: 18px; overflow: hidden; background: #1a1a1a; }
  .lv-cover { position: relative; height: ${COVER_HEIGHT}px; background: #222 url("${esc(d.cover)}") ${pos}/cover no-repeat; }
  .lv-scrim { position: absolute; inset: 0; background: linear-gradient(to top, rgba(10,10,10,0.8) 0%, rgba(10,10,10,0.42) 24%, rgba(10,10,10,0) 46%); }
  .lv-words { position: absolute; left: 28px; right: 28px; bottom: 24px; text-shadow: 0 1px 1px rgba(0,0,0,0.35); }
  .lv-title { font: 700 44px/1 "Playfair Display", Georgia, serif; letter-spacing: 0.015em; margin: 0; }
  .lv-lede { font: 400 20px/1.3 "Playfair Display", Georgia, serif; margin: 10px 0 0; color: rgba(228,229,229,0.9); }
  .lv-foot { display: flex; align-items: center; gap: 18px; padding: 14px 28px; }
  .lv-vat { width: 48px; height: 48px; flex: none; border-radius: 50%; display: block; }
  .lv-bar { flex: 1; display: flex; height: 8px; border-radius: 3px; overflow: hidden; box-shadow: inset 0 0 0 1px rgba(255,255,255,0.08); }
  .lv-bar i { display: block; height: 100%; }
</style>
<div class="lv"><div class="lv-card"><div class="lv-cover"><div class="lv-scrim"></div><div class="lv-words"><h1 class="lv-title">${esc(d.title)}</h1>${d.excerpt ? `<p class="lv-lede">${esc(d.excerpt)}</p>` : ''}</div></div>
${bar ? `<div class="lv-foot">${vat ? `<img class="lv-vat" alt="" src="${vat}">` : ''}<div class="lv-bar">${bar}</div></div>` : ''}</div></div>`;
}

/**
 * @param {string} voyagePath  e.g. _voyage/lungern.md
 * @returns {Promise<{ jpeg: Buffer, width: number, height: number, title: string, excerpt: string, href: string }>}
 */
export async function voyageCard(voyagePath, { site = 'https://qsdqsb.com', root = ROOT } = {}) {
  const d = voyageCardData(voyagePath, { root });
  const base = site.replace(/\/$/, '');
  const browser = await chromium.launch();
  try {
    const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2, colorScheme: 'dark' })).newPage();
    let vat = null;
    if (d.palette.length) {
      // The vat as QSD's Palette pours it for this voyage, kept as the picture it makes there.
      await page.goto(`${base}/palette/?motion=off#${d.gallery}`, { waitUntil: 'networkidle' });
      const canvas = page.locator(`.palette-voyage__vat[data-g="${d.gallery}"] canvas`).first();
      await canvas.scrollIntoViewIfNeeded();
      await page.waitForTimeout(2500);
      const png = await canvas.screenshot();
      const { channels } = await require('sharp')(png).stats();
      if (channels.slice(0, 3).every((c) => c.stdev < 2)) throw new Error(`the vat for ${d.gallery} drew nothing on ${base}/palette/`);
      vat = `data:image/png;base64,${png.toString('base64')}`;
    }
    // The card, served from the site's own origin so its stylesheet's faces resolve.
    const at = `${base}/__letter-voyage-card.html`;
    await page.route(at, (route) => route.fulfill({ contentType: 'text/html', body: voyageCardHtml(d, vat) }));
    await page.goto(at, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const loaded = await page.evaluate(() => document.fonts.check('700 44px "Playfair Display"'));
    if (!loaded) throw new Error(`the card's faces did not load from ${base}`);
    const png = await page.locator('.lv').screenshot({ type: 'png' });
    const sharp = require('sharp');
    const jpeg = await sharp(png).flatten({ background: GROUND }).jpeg({ quality: 86, mozjpeg: true }).toBuffer();
    const { width, height } = await sharp(jpeg).metadata();
    const shown = { width: Math.round(width / 2), height: Math.round(height / 2) };
    if (shown.height > MAX_HEIGHT || jpeg.length > MAX_BYTES) throw new Error(`the card is ${shown.width}×${shown.height}, ${(jpeg.length / 1024).toFixed(0)} KB: too large for a letter`);
    return { jpeg, ...shown, title: d.title, excerpt: d.excerpt, href: `${base}${d.path}` };
  } finally {
    await browser.close();
  }
}

// As a command: the picture alone, to look at or to send by other means.
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const opt = (name) => { const i = args.indexOf(name); return i < 0 ? null : args.splice(i, 2)[1]; };
  const site = opt('--site') || undefined, out = opt('--out');
  const what = args[0];
  if (!what) { console.error('usage: node scripts/letter-card.mjs <hex | _voyage/name.md> [--site URL] [--out card.jpg]'); process.exit(2); }
  if (/\.md$/.test(what)) {
    const card = await voyageCard(what, { site });
    const file = out || join(tmpdir(), `voyage-${what.replace(/^.*\/|\.md$/g, '')}.jpg`); // never beside the repo's files
    writeFileSync(file, card.jpeg);
    console.log(`${file}  ${card.title}  ${card.width}×${card.height} in a letter, ${(card.jpeg.length / 1024).toFixed(0)} KB  → ${card.href}`);
  } else {
    const card = await reverieCard(what, { site });
    const file = out || join(tmpdir(), `reverie-${card.hex.replace('#', '').toLowerCase()}.jpg`); // never beside the repo's files
    writeFileSync(file, card.jpeg);
    console.log(`${file}  ${card.hex}${card.name ? ` ${card.name}` : ''}  ${card.width}×${card.height} in a letter, ${(card.jpeg.length / 1024).toFixed(0)} KB  → ${card.href}`);
  }
}
