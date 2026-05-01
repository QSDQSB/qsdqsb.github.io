const test = require('node:test');
const assert = require('node:assert/strict');

const {
  ATLAS_FALLBACK_COLOR,
  buildVoyageAtlasGeoJSON,
} = require('../scripts/geocode-maps.js');

test('buildVoyageAtlasGeoJSON geocodes from title by default and derives atlas properties', async () => {
  const calls = [];
  const geojson = await buildVoyageAtlasGeoJSON(
    [
      {
        fileName: 'rome.md',
        slug: 'rome',
        frontmatter: {
          title: 'Rome',
          excerpt: 'Where laurels dissolve into the inscriptions of obelisks',
          date: '2025-05-28',
          tags: ['🍝Italy', '🏰Baroque'],
        },
      },
    ],
    {
      cache: {},
      tagPalette: {
        '🍝Italy': '#a77772',
        '🏰Baroque': '#8c6b4d',
      },
      geocodeFn: async (query) => {
        calls.push(query);
        return { lat: 41.9028, lng: 12.4964 };
      },
    }
  );

  assert.deepEqual(calls, ['Rome']);
  assert.equal(geojson.features.length, 1);

  const [feature] = geojson.features;
  assert.deepEqual(feature.geometry.coordinates, [12.4964, 41.9028]);
  assert.equal(feature.properties.title, 'Rome');
  assert.equal(feature.properties.url, '/voyage/rome/');
  assert.equal(feature.properties.mainTag, '🍝Italy');
  assert.equal(feature.properties.mainTagColor, '#a77772');
  assert.deepEqual(feature.properties.tags, ['🍝Italy', '🏰Baroque']);
  assert.deepEqual(feature.properties.tagColors, {
    '🍝Italy': '#a77772',
    '🏰Baroque': '#8c6b4d',
  });
});

test('buildVoyageAtlasGeoJSON respects map.query and explicit coordinates precedence', async () => {
  const calls = [];

  const geojson = await buildVoyageAtlasGeoJSON(
    [
      {
        fileName: 'dragonstone.md',
        slug: 'dragonstone',
        frontmatter: {
          title: 'Dragonstone',
          description: 'San Juan de Gaztelugatxe',
          map: {
            query: 'Gaztelugatxe, Bakio, Spain',
          },
          tags: ['🌊Coastal'],
        },
      },
      {
        fileName: 'prague.md',
        slug: 'prague',
        frontmatter: {
          title: 'Prague',
          map: {
            lat: 50.0755,
            lng: 14.4378,
          },
          tags: ['🏰Baroque'],
        },
      },
    ],
    {
      cache: {},
      tagPalette: {
        '🌊Coastal': '#325473',
        '🏰Baroque': '#8c6b4d',
      },
      geocodeFn: async (query) => {
        calls.push(query);
        return { lat: 43.4472, lng: -2.7850 };
      },
    }
  );

  assert.deepEqual(calls, ['Gaztelugatxe, Bakio, Spain']);
  assert.equal(geojson.features.length, 2);
  assert.deepEqual(geojson.features[1].geometry.coordinates, [14.4378, 50.0755]);
});

test('buildVoyageAtlasGeoJSON excludes pages and rejects incomplete manual coordinates', async () => {
  await assert.rejects(
    () =>
      buildVoyageAtlasGeoJSON(
        [
          {
            fileName: 'broken.md',
            slug: 'broken',
            frontmatter: {
              title: 'Broken',
              map: { lat: 10 },
            },
          },
        ],
        {
          cache: {},
          tagPalette: {},
          geocodeFn: async () => ({ lat: 0, lng: 0 }),
        }
      ),
    /requires both map\.lat and map\.lng/
  );

  await assert.rejects(
    () =>
      buildVoyageAtlasGeoJSON(
        [
          {
            fileName: 'skip-me.md',
            slug: 'skip-me',
            frontmatter: {
              title: 'Skip Me',
              map: { exclude: true },
            },
          },
        ],
        {
          cache: {},
          tagPalette: {},
          geocodeFn: async () => ({ lat: 0, lng: 0 }),
        }
      ),
    /no atlas points/i
  );
});

test('buildVoyageAtlasGeoJSON falls back for unmapped tags', async () => {
  const geojson = await buildVoyageAtlasGeoJSON(
    [
      {
        fileName: 'paris.md',
        slug: 'paris',
        frontmatter: {
          title: 'Paris',
          tags: ['Unmapped'],
        },
      },
    ],
    {
      cache: {},
      tagPalette: {},
      geocodeFn: async () => ({ lat: 48.8566, lng: 2.3522 }),
    }
  );

  const [feature] = geojson.features;
  assert.equal(feature.properties.mainTagColor, ATLAS_FALLBACK_COLOR);
  assert.equal(feature.properties.tagColors.Unmapped, ATLAS_FALLBACK_COLOR);
});
