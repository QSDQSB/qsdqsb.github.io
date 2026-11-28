const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const OLD = `import x from 'y';
const JOURNEYS = [
  { id: 'one', name: 'One', async run({ page, go }) {
    must(1, 'x');
  } },

  { id: 'two', phone: true, name: 'Two', async run({ page }) {
    await page.goto(base + '/');
  } },
];
`;

test('the old array splits into one module per journey, and a name it used to find in scope is passed in', async () => {
  const { journeyBlocks, journeyModule } = await import('../scripts/split-shared-files.mjs');
  const blocks = journeyBlocks(OLD);
  assert.deepStrictEqual(blocks.map((b) => b.id), ['one', 'two']);
  assert.strictEqual(journeyModule(blocks[0]), "import { must } from './_lib.mjs';\n\nexport default { id: 'one', name: 'One', async run({ page, go }) {\n  must(1, 'x');\n} };\n");
  assert.match(journeyModule(blocks[1]), /^export default \{ id: 'two', phone: true, name: 'Two', async run\(\{ page, base \}\) \{/);
  assert.throws(() => journeyBlocks('nothing here'), /old layout/);
});

test('every journey file is named for its id, and the shared one is the only underscore file', async () => {
  const dir = path.join(__dirname, 'journeys');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.mjs'));
  assert.ok(files.includes('_lib.mjs') && files.length > 1);
  for (const f of files.filter((n) => !n.startsWith('_'))) {
    const j = (await import(path.join(dir, f))).default;
    assert.strictEqual(`${j.id}.mjs`, f);
    assert.strictEqual(typeof j.run, 'function');
    assert.ok(j.name);
  }
});
