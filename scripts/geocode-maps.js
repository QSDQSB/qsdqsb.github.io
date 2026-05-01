#!/usr/bin/env node

/**
 * Geocoding Preprocessing Script for Map Datasets
 *
 * Reads manual _data/maps/*.yml files, geocodes missing coordinates,
 * generates derived GeoJSON cache files in assets/maps/,
 * and builds the mega voyage atlas directly from _voyage frontmatter.
 *
 * Usage: node scripts/geocode-maps.js
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const https = require('https');

const MAPS_DATA_DIR = path.join(__dirname, '../_data/maps');
const MAPS_CACHE_DIR = path.join(__dirname, '../assets/maps');
const VOYAGE_DIR = path.join(__dirname, '../_voyage');
const TAG_COLOURS_FILE = path.join(__dirname, '../_data/tag_colours.yml');
const ATLAS_OUTPUT_FILE = path.join(MAPS_CACHE_DIR, 'voyage-atlas.geojson');
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'Jekyll-Maps-Geocoder/1.0';
const CACHE_FILE = path.join(__dirname, '.geocode-cache.json');
const ATLAS_FALLBACK_COLOR = '#7d746d';
const PRIMARY_TAG_LIMIT = 7;

ensureDirectory(MAPS_CACHE_DIR);

function ensureDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function loadGeocodeCache() {
  if (fs.existsSync(CACHE_FILE)) {
    const data = fs.readFileSync(CACHE_FILE, 'utf8');
    return JSON.parse(data);
  }
  return {};
}

function saveGeocodeCache(cache) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

async function geocodeLocation(cityName, countryName, cache) {
  const cacheKey = `${cityName}|${countryName || ''}`.toLowerCase();

  if (cache[cacheKey] !== undefined) {
    return cache[cacheKey];
  }

  let query = cityName;
  if (countryName) {
    query += `, ${countryName}`;
  }

  try {
    const result = await nominatimSearch(query);
    if (result && result.lat && result.lon) {
      const coords = { lat: parseFloat(result.lat), lng: parseFloat(result.lon) };
      cache[cacheKey] = coords;
      return coords;
    }

    console.warn(`⚠️  Could not geocode: "${query}"`);
    cache[cacheKey] = null;
    return null;
  } catch (error) {
    console.error(`❌ Geocoding error for "${query}":`, error.message);
    cache[cacheKey] = null;
    return null;
  }
}

async function geocodeQuery(query, cache) {
  const normalizedQuery = String(query || '').trim().toLowerCase();
  if (!normalizedQuery) {
    return null;
  }

  if (cache[normalizedQuery] !== undefined) {
    return cache[normalizedQuery];
  }

  const prefixMatch = findPrefixCacheMatch(cache, normalizedQuery);
  if (prefixMatch) {
    cache[normalizedQuery] = prefixMatch;
    return prefixMatch;
  }

  try {
    const result = await nominatimSearch(query);
    if (result && result.lat && result.lon) {
      const coords = { lat: parseFloat(result.lat), lng: parseFloat(result.lon) };
      cache[normalizedQuery] = coords;
      return coords;
    }

    console.warn(`⚠️  Could not geocode atlas query: "${query}"`);
    cache[normalizedQuery] = null;
    return null;
  } catch (error) {
    console.error(`❌ Geocoding error for atlas query "${query}":`, error.message);
    cache[normalizedQuery] = null;
    return null;
  }
}

function findPrefixCacheMatch(cache, normalizedQuery) {
  const matches = Object.entries(cache)
    .filter(([key, value]) => key.startsWith(`${normalizedQuery}|`) && value && typeof value.lat === 'number' && typeof value.lng === 'number')
    .map(([, value]) => value);

  if (matches.length === 1) {
    return matches[0];
  }

  return null;
}

function nominatimSearch(query) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const params = new URLSearchParams({
        q: query,
        format: 'json',
        limit: 1,
        'accept-language': 'en',
      });

      const url = `${NOMINATIM_URL}?${params}`;

      https.get(url, { headers: { 'User-Agent': USER_AGENT } }, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const results = JSON.parse(data);
            resolve(results[0] || null);
          } catch (error) {
            reject(error);
          }
        });
      }).on('error', reject);
    }, 1100);
  });
}

function datasetToGeoJSON(datasetName, dataset) {
  const features = [];

  if (!dataset.cities || !Array.isArray(dataset.cities)) {
    console.warn(`⚠️  Dataset "${datasetName}" has no cities array`);
    return { type: 'FeatureCollection', features: [] };
  }

  const categoryMap = {};
  if (dataset.categories && Array.isArray(dataset.categories)) {
    dataset.categories.forEach((cat) => {
      categoryMap[cat.id] = cat;
    });
  }

  dataset.cities.forEach((city, idx) => {
    if (!city.name) {
      console.warn(`⚠️  City at index ${idx} in "${datasetName}" missing required 'name'`);
      return;
    }

    if (city.lat === undefined || city.lng === undefined) {
      console.warn(`⚠️  City "${city.name}" in "${datasetName}" missing coordinates (should be auto-geocoded)`);
      return;
    }

    const categoryInfo = categoryMap[city.category] || {};

    features.push({
      type: 'Feature',
      properties: {
        name: city.name,
        country: city.country || null,
        category: city.category || null,
        categoryLabel: categoryInfo.label || null,
        color: categoryInfo.color || '#FF6B6B',
        href: city.href || null,
        description: city.description || null,
      },
      geometry: {
        type: 'Point',
        coordinates: [city.lng, city.lat],
      },
    });
  });

  return {
    type: 'FeatureCollection',
    features,
  };
}

async function processDataset(filePath, cache) {
  const fileName = path.basename(filePath, '.yml');
  console.log(`\n📍 Processing: ${fileName}`);

  const fileContent = fs.readFileSync(filePath, 'utf8');
  const dataset = yaml.load(fileContent);

  if (!dataset) {
    throw new Error(`Failed to parse YAML: ${filePath}`);
  }

  if (dataset.cities && Array.isArray(dataset.cities)) {
    for (const city of dataset.cities) {
      if (city.lat !== undefined && city.lng !== undefined) {
        continue;
      }

      const coords = await geocodeLocation(city.name, city.country, cache);
      if (coords) {
        city.lat = coords.lat;
        city.lng = coords.lng;
        console.log(`  ✅ Geocoded: ${city.name} (${city.country || 'Unknown'}) → [${city.lat.toFixed(4)}, ${city.lng.toFixed(4)}]`);
      } else {
        console.warn(`  ⚠️  Failed to geocode: ${city.name}`);
      }
    }
  }

  const geojson = datasetToGeoJSON(fileName, dataset);
  const outputPath = path.join(MAPS_CACHE_DIR, `${fileName}.geojson`);
  fs.writeFileSync(outputPath, JSON.stringify(geojson, null, 2));
  console.log(`  💾 Wrote: ${outputPath}`);
  console.log(`  📊 Features: ${geojson.features.length}`);
}

function parseFrontMatter(markdown) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) {
    return {};
  }

  return yaml.load(match[1]) || {};
}

function loadVoyagePages(voyageDir = VOYAGE_DIR) {
  if (!fs.existsSync(voyageDir)) {
    return [];
  }

  return fs.readdirSync(voyageDir)
    .filter((fileName) => fileName.endsWith('.md'))
    .sort()
    .map((fileName) => {
      const filePath = path.join(voyageDir, fileName);
      const frontmatter = parseFrontMatter(fs.readFileSync(filePath, 'utf8'));
      return {
        fileName,
        filePath,
        slug: path.basename(fileName, '.md'),
        frontmatter,
      };
    });
}

function loadVoyageTagPalette(tagColoursFile = TAG_COLOURS_FILE) {
  const raw = fs.readFileSync(tagColoursFile, 'utf8');
  const data = yaml.load(raw) || {};
  return data.voyage_tag_colours || {};
}

function deriveVoyageUrl(page) {
  const permalink = page.frontmatter.permalink;
  if (permalink) {
    return permalink;
  }

  return `/voyage/${page.slug}/`;
}

function normalizeTags(frontmatterTags) {
  if (!Array.isArray(frontmatterTags)) {
    return [];
  }

  return frontmatterTags
    .map((tag) => String(tag || '').trim())
    .filter(Boolean);
}

function formatDateDisplay(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function buildAtlasTagColors(tags, tagPalette) {
  const tagColors = {};
  tags.forEach((tag) => {
    tagColors[tag] = tagPalette[tag] || ATLAS_FALLBACK_COLOR;
  });
  return tagColors;
}

function buildAtlasFeature(page, coords, tagPalette) {
  const frontmatter = page.frontmatter || {};
  const tags = normalizeTags(frontmatter.tags);
  const tagColors = buildAtlasTagColors(tags, tagPalette);
  const mainTag = tags[0] || null;
  const excerpt = frontmatter.description || frontmatter.excerpt || '';

  return {
    type: 'Feature',
    properties: {
      slug: page.slug,
      title: frontmatter.title || page.slug,
      url: deriveVoyageUrl(page),
      excerpt,
      date: frontmatter.date || null,
      dateDisplay: formatDateDisplay(frontmatter.date),
      tags,
      mainTag,
      mainTagColor: mainTag ? (tagColors[mainTag] || ATLAS_FALLBACK_COLOR) : ATLAS_FALLBACK_COLOR,
      tagColors,
      fallbackColor: ATLAS_FALLBACK_COLOR,
      primaryTagLimit: PRIMARY_TAG_LIMIT,
    },
    geometry: {
      type: 'Point',
      coordinates: [coords.lng, coords.lat],
    },
  };
}

async function resolveVoyageCoords(page, cache, geocodeFn) {
  const mapConfig = page.frontmatter.map || {};
  const hasLat = mapConfig.lat !== undefined;
  const hasLng = mapConfig.lng !== undefined;

  if (hasLat !== hasLng) {
    throw new Error(`${page.fileName} requires both map.lat and map.lng when manually setting atlas coordinates`);
  }

  if (hasLat && hasLng) {
    return {
      lat: Number(mapConfig.lat),
      lng: Number(mapConfig.lng),
    };
  }

  const query = String(mapConfig.query || page.frontmatter.title || '').trim();
  if (!query) {
    throw new Error(`${page.fileName} is missing a geocodable title or map.query override`);
  }

  const coords = await geocodeFn(query, cache, page);
  if (!coords) {
    throw new Error(`${page.fileName} could not be geocoded. Add map.query or explicit map.lat/map.lng.`);
  }

  return coords;
}

async function buildVoyageAtlasGeoJSON(pages, options = {}) {
  const cache = options.cache || {};
  const tagPalette = options.tagPalette || {};
  const geocodeFn = options.geocodeFn || geocodeQuery;
  const features = [];

  for (const page of pages) {
    const mapConfig = (page.frontmatter && page.frontmatter.map) || {};
    if (mapConfig.exclude === true) {
      continue;
    }

    const coords = await resolveVoyageCoords(page, cache, geocodeFn);
    features.push(buildAtlasFeature(page, coords, tagPalette));
  }

  if (features.length === 0) {
    throw new Error('Voyage atlas generation produced no atlas points');
  }

  return {
    type: 'FeatureCollection',
    properties: {
      kind: 'voyage-atlas',
      primaryTagLimit: PRIMARY_TAG_LIMIT,
      fallbackColor: ATLAS_FALLBACK_COLOR,
    },
    features,
  };
}

async function processVoyageAtlas(cache, options = {}) {
  const voyagePages = options.voyagePages || loadVoyagePages(options.voyageDir || VOYAGE_DIR);
  const tagPalette = options.tagPalette || loadVoyageTagPalette(options.tagColoursFile || TAG_COLOURS_FILE);
  const geocodeFn = options.geocodeFn || geocodeQuery;
  const outputPath = options.outputPath || ATLAS_OUTPUT_FILE;

  console.log('\n🧭 Building voyage atlas');
  console.log(`  📚 Source pages: ${voyagePages.length}`);

  const geojson = await buildVoyageAtlasGeoJSON(voyagePages, {
    cache,
    tagPalette,
    geocodeFn,
  });

  fs.writeFileSync(outputPath, JSON.stringify(geojson, null, 2));
  console.log(`  💾 Wrote: ${outputPath}`);
  console.log(`  📊 Atlas points: ${geojson.features.length}`);
  return geojson;
}

async function main() {
  console.log('🗺️  Map Geocoding Preprocessor');
  console.log('================================');
  console.log(`Data dir: ${MAPS_DATA_DIR}`);
  console.log(`Cache dir: ${MAPS_CACHE_DIR}`);

  if (!fs.existsSync(MAPS_DATA_DIR)) {
    throw new Error(`Maps directory not found: ${MAPS_DATA_DIR}`);
  }

  const cache = loadGeocodeCache();
  const mapFiles = fs.readdirSync(MAPS_DATA_DIR)
    .filter((fileName) => fileName.endsWith('.yml'))
    .map((fileName) => path.join(MAPS_DATA_DIR, fileName));

  if (mapFiles.length === 0) {
    console.warn('⚠️  No YAML map files found in _data/maps/');
  } else {
    console.log(`\n📂 Found ${mapFiles.length} map dataset(s)\n`);
    for (const filePath of mapFiles) {
      await processDataset(filePath, cache);
    }
  }

  await processVoyageAtlas(cache);

  saveGeocodeCache(cache);
  console.log('\n✅ Geocoding complete!');
  console.log(`💾 Geocode cache saved: ${CACHE_FILE}`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error.message);
    process.exit(1);
  });
}

module.exports = {
  ATLAS_FALLBACK_COLOR,
  PRIMARY_TAG_LIMIT,
  buildAtlasFeature,
  buildVoyageAtlasGeoJSON,
  datasetToGeoJSON,
  findPrefixCacheMatch,
  formatDateDisplay,
  geocodeLocation,
  geocodeQuery,
  loadGeocodeCache,
  loadVoyagePages,
  loadVoyageTagPalette,
  parseFrontMatter,
  processDataset,
  processVoyageAtlas,
  resolveVoyageCoords,
  saveGeocodeCache,
};
