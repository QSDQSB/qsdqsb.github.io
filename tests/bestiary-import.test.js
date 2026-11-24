// The Bestiary's importer (scripts/bestiary-import.mjs): a story's two texts come in, and nothing of its
// design notes, outline or drafting notes does. The one guard CI can run without the private repository.
const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const { pathToFileURL } = require('url');

const load = () => import(pathToFileURL(path.join(__dirname, '..', 'scripts', 'bestiary-import.mjs')).href);

const story = `# The Test Fable

## Overview
* Characters: [[The Test Cat]]

## Synopsis
A cat does a thing. SYNOPSIS-ONLY

## Design Notes

### Philosophical Concept
Leibniz, PSR. DESIGN-ONLY

## Outline

### I. Opening
OUTLINE-ONLY

## Content

### English Version
The first line.

---

The second passage, after a break.

### 中文版（草稿）
第一行。

---

## Notes after
NOTES-ONLY
`;

test('storyText takes the two texts and nothing of the notes', async () => {
  const { storyText } = await load();
  const t = storyText(story);
  assert.ok(t, 'no texts found');
  assert.match(t.en, /^The first line\./);
  assert.match(t.en, /The second passage, after a break\.$/);
  assert.equal(t.zh, '第一行。');
  for (const leak of ['SYNOPSIS-ONLY', 'DESIGN-ONLY', 'OUTLINE-ONLY', 'NOTES-ONLY', 'Leibniz']) {
    assert.ok(!t.en.includes(leak) && !t.zh.includes(leak), `${leak} came through`);
  }
});

test('a break inside a story stays; only the closing separator goes', async () => {
  const { storyText } = await load();
  const t = storyText(story);
  assert.match(t.en, /first line\.\n\n---\n\nThe second/);
  assert.ok(!t.zh.includes('---'));
});

test('a story with no Content section, or only one language, gives nothing', async () => {
  const { storyText } = await load();
  assert.equal(storyText('# T\n\n## Design Notes\nx\n'), null);
  assert.equal(storyText('# T\n\n## Content\n\n### English Version\nOnly English.\n'), null);
});
