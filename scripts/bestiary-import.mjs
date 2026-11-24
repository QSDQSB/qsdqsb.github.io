#!/usr/bin/env node
/**
 * The Bestiary's fables, brought in from their own repository (QSDQSB/dolomite-errata-bestiary).
 *
 * The fables are written there, in two languages, beside their design notes, which are never
 * published: the philosophy that found a story stays out of it. This copies only a story's text,
 * its "### English Version" and its "### 中文版", into the fable's page here, between the markers
 * below. The front matter (the cover, the line, the names) is this site's and is never touched.
 *
 *   node scripts/bestiary-import.mjs                     # refresh every fable from ../dolomite-errata-bestiary
 *   node scripts/bestiary-import.mjs --from <dir>        # the bestiary's checkout elsewhere
 *   node scripts/bestiary-import.mjs --check             # is every fable as its story stands? (writes nothing)
 *   node scripts/bestiary-import.mjs --new "<NN. Title>" # start a fable: a page with its front matter to finish
 *
 * Exit codes: 0 done, or every fable matches · 1 a fable differs from its story, or a story is
 * missing · 2 usage, or the bestiary's checkout is not there.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, '_bestiary');
const BEGIN = '<!-- bestiary:text · from the bestiary\'s repository by scripts/bestiary-import.mjs: edit the story there, not here -->';
const END = '<!-- /bestiary:text -->';

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const value = (name) => { const i = args.indexOf(name); return i === -1 ? null : args[i + 1]; };
const usage = (why) => { console.error(`bestiary: ${why}\nSee the head of scripts/bestiary-import.mjs.`); process.exit(2); };

const from = path.resolve(value('--from') || path.join(ROOT, '..', 'dolomite-errata-bestiary'));
if (!fs.existsSync(path.join(from, 'stories'))) usage(`no bestiary checkout at ${from} (git clone https://github.com/QSDQSB/dolomite-errata-bestiary next to this one, or pass --from)`);

/** A story's two texts: what follows "### English Version" and "### 中文版" under "## Content". */
export function storyText(markdown) {
  const content = markdown.split(/^## Content\s*$/m)[1];
  if (!content) return null;
  const sections = {};
  for (const part of content.split(/^### /m).slice(1)) {
    const [heading, ...rest] = part.split('\n');
    const body = rest.join('\n').split(/^## /m)[0].replace(/^---\s*$/gm, '').trim();
    if (/^English Version/i.test(heading)) sections.en = body;
    else if (/^中文版/.test(heading)) sections.zh = body;
  }
  return sections.en && sections.zh ? sections : null;
}

function block({ en, zh }) {
  for (const [lang, text] of Object.entries({ en, zh })) {
    if (/\{[{%]/.test(text)) usage(`the ${lang} text holds a Liquid tag ({{ or {%), which Jekyll would run`);
  }
  return [
    BEGIN,
    '<div data-bilingual>',
    '<section data-bilingual-lang="EN" lang="en" markdown="1">',
    '',
    en,
    '',
    '</section>',
    '<section data-bilingual-lang="中" lang="zh" markdown="1">',
    '',
    zh,
    '',
    '</section>',
    '</div>',
    END,
  ].join('\n');
}

const frontOf = (text) => text.match(/^---\n[\s\S]*?\n---\n/);
const sourceOf = (front) => (front.match(/^source:\s*"?(.+?)"?\s*(#.*)?$/m) || [])[1];

function refresh(check) {
  const pages = fs.existsSync(DIR) ? fs.readdirSync(DIR).filter((f) => f.endsWith('.md')).sort() : [];
  let differ = 0;
  for (const file of pages) {
    const page = fs.readFileSync(path.join(DIR, file), 'utf8');
    const front = frontOf(page);
    const source = front && sourceOf(front[0]);
    if (!source) { console.error(`bestiary: _bestiary/${file} names no source: story`); differ += 1; continue; }
    const storyPath = path.join(from, source);
    if (!fs.existsSync(storyPath)) { console.error(`bestiary: _bestiary/${file}: no ${source} in the bestiary`); differ += 1; continue; }
    const text = storyText(fs.readFileSync(storyPath, 'utf8'));
    if (!text) { console.error(`bestiary: ${source} has no English Version and 中文版 under ## Content`); differ += 1; continue; }
    const rest = page.slice(front[0].length);
    const start = rest.indexOf(BEGIN);
    const end = rest.indexOf(END);
    const before = start === -1 ? '' : rest.slice(0, start);
    const after = end === -1 ? '\n' : rest.slice(end + END.length);
    const next = front[0] + before + block(text) + after;
    if (next === page) continue;
    differ += 1;
    if (check) console.error(`bestiary: _bestiary/${file} differs from ${source}`);
    else { fs.writeFileSync(path.join(DIR, file), next); console.log(`bestiary: _bestiary/${file} ← ${source}`); }
  }
  if (check) {
    if (differ) { console.error('Bring them in: node scripts/bestiary-import.mjs'); process.exit(1); }
    console.log(`bestiary: all ${pages.length} fables match their stories.`);
  } else if (!differ) console.log(`bestiary: all ${pages.length} fables already match their stories.`);
}

/** The Chinese name a character's or a place's file gives (its front matter's `mandarin:`). */
function mandarin(kind, name) {
  const file = path.join(from, kind, `${name}.md`);
  if (!fs.existsSync(file)) return '';
  return (fs.readFileSync(file, 'utf8').match(/^mandarin:\s*(.+)$/m) || [])[1]?.trim() || '';
}

function start(name) {
  const source = `stories/${name.replace(/\.md$/, '')}.md`;
  const storyPath = path.join(from, source);
  if (!fs.existsSync(storyPath)) usage(`no ${source} in the bestiary`);
  const story = fs.readFileSync(storyPath, 'utf8');
  const [, num, title] = path.basename(source, '.md').match(/^(\d+)\.\s+(.+)$/) || [];
  if (!num) usage(`${source} is not named "NN. Title.md"`);
  const links = (label) => [...((story.match(new RegExp(`^\\* ${label}:(.*)$`, 'm')) || [])[1] || '').matchAll(/\[\[([^\]]+)\]\]/g)].map((m) => m[1]);
  const creature = links('Characters')[0] || '';
  const place = links('Locations')[0] || '';
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const out = path.join(DIR, `${slug}.md`);
  if (fs.existsSync(out)) usage(`_bestiary/${slug}.md is there already`);
  const q = (s) => JSON.stringify(s);
  const front = [
    '---',
    `title: ${q(title)}`,
    'title_zh: "" # the Chinese title: the owner\'s',
    `number: ${Number(num)}`,
    `creature: ${q(creature)}`,
    `creature_zh: ${q(mandarin('characters', creature))}`,
    `place: ${q(place)}`,
    `place_zh: ${q(mandarin('locations', place))}`,
    'excerpt: "" # the line under the title: a sentence of the story\'s own',
    'line_zh: "" # the same sentence from the 中文版',
    'seo_description: ""',
    'header:',
    '  overlay_image: "" # a photograph of the place: https://img.qsdqsb.com/t/<hash>/1920.webp # <gallery>/<slug>',
    '  overlay_filter: 0.3',
    'cover_position: "50% 50%"',
    `source: ${q(source)}`,
    '---',
    '',
  ].join('\n');
  fs.mkdirSync(DIR, { recursive: true });
  fs.writeFileSync(out, front + BEGIN + '\n' + END + '\n');
  console.log(`bestiary: _bestiary/${slug}.md started; finish its front matter, then run this again without --new.`);
}

if (value('--new')) start(value('--new'));
else refresh(flag('--check'));
