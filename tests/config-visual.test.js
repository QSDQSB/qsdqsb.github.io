const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const yaml = require('js-yaml');

// The seeded visual build layers _config_visual.yml over _config.yml, and a list in the second
// replaces the first's. Its `include` repeats the live one by hand, so an entry added to the live
// list and not here would drop out of the build that the pixel diff, the journeys and the
// served-files check all judge.
test("the visual build's include holds every entry of the live one", () => {
  const read = (f) => yaml.load(fs.readFileSync(path.join(__dirname, '..', f), 'utf8'));
  const live = read('_config.yml').include || [];
  const visual = read('_config_visual.yml').include || [];
  for (const entry of live) assert.ok(visual.includes(entry), `_config_visual.yml's include lacks ${entry}`);
});
