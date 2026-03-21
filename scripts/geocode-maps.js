#!/usr/bin/env node

/**
 * Geocoding Preprocessing Script for Map Datasets
 * 
 * Reads all _data/maps/*.yml files, geocodes missing coordinates,
 * and generates derived GeoJSON cache files in assets/maps/
 * 
 * Usage: node scripts/geocode-maps.js
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const https = require('https');

// Configuration
const MAPS_DATA_DIR = path.join(__dirname, '../_data/maps');
const MAPS_CACHE_DIR = path.join(__dirname, '../assets/maps');
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'Jekyll-Maps-Geocoder/1.0';
const CACHE_FILE = path.join(__dirname, '.geocode-cache.json');

// Ensure output directory exists
if (!fs.existsSync(MAPS_CACHE_DIR)) {
  fs.mkdirSync(MAPS_CACHE_DIR, { recursive: true });
}

/**
 * Load or initialize geocoding cache (to avoid re-querying same locations)
 */
function loadGeocodeCache() {
  if (fs.existsSync(CACHE_FILE)) {
    const data = fs.readFileSync(CACHE_FILE, 'utf8');
    return JSON.parse(data);
  }
  return {};
}

/**
 * Save geocoding cache
 */
function saveGeocodeCache(cache) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

/**
 * Query Nominatim for coordinates (with caching)
 * Returns { lat, lng } or null if not found
 */
async function geocodeLocation(cityName, countryName, cache) {
  const cacheKey = `${cityName}|${countryName || ''}`.toLowerCase();
  
  // Check cache first
  if (cache[cacheKey]) {
    return cache[cacheKey];
  }

  // Build query
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
    } else {
      console.warn(`⚠️  Could not geocode: "${query}"`);
      cache[cacheKey] = null;
      return null;
    }
  } catch (error) {
    console.error(`❌ Geocoding error for "${query}":`, error.message);
    cache[cacheKey] = null;
    return null;
  }
}

/**
 * HTTP request to Nominatim API (with delay to respect rate limits)
 */
function nominatimSearch(query) {
  return new Promise((resolve, reject) => {
    // Add delay to respect API rate limits (1 request per second)
    setTimeout(() => {
      const params = new URLSearchParams({
        q: query,
        format: 'json',
        limit: 1,
        'accept-language': 'en'
      });

      const url = `${NOMINATIM_URL}?${params}`;
      
      https.get(url, { headers: { 'User-Agent': USER_AGENT } }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const results = JSON.parse(data);
            resolve(results[0] || null);
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', reject);
    }, 1100); // 1.1 second delay
  });
}

/**
 * Convert dataset to GeoJSON FeatureCollection
 */
function datasetToGeoJSON(datasetName, dataset) {
  const features = [];

  if (!dataset.cities || !Array.isArray(dataset.cities)) {
    console.warn(`⚠️  Dataset "${datasetName}" has no cities array`);
    return { type: 'FeatureCollection', features: [] };
  }

  // Build category map for color lookup
  const categoryMap = {};
  if (dataset.categories && Array.isArray(dataset.categories)) {
    dataset.categories.forEach(cat => {
      categoryMap[cat.id] = cat;
    });
  }

  // Convert each city to a GeoJSON feature
  dataset.cities.forEach((city, idx) => {
    if (!city.name) {
      console.warn(`⚠️  City at index ${idx} in "${datasetName}" missing required 'name'`);
      return;
    }

    if (!city.lat || !city.lng) {
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
        description: city.description || null
      },
      geometry: {
        type: 'Point',
        coordinates: [city.lng, city.lat] // GeoJSON uses [lng, lat]
      }
    });
  });

  return {
    type: 'FeatureCollection',
    features: features
  };
}

/**
 * Process a single map dataset
 */
async function processDataset(filePath, cache) {
  const fileName = path.basename(filePath, '.yml');
  console.log(`\n📍 Processing: ${fileName}`);

  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const dataset = yaml.load(fileContent);

    if (!dataset) {
      console.error(`❌ Failed to parse YAML: ${filePath}`);
      return;
    }

    // Geocode cities that are missing coordinates
    if (dataset.cities && Array.isArray(dataset.cities)) {
      for (const city of dataset.cities) {
        // Skip if already has coordinates
        if (city.lat !== undefined && city.lng !== undefined) {
          continue;
        }

        // Geocode from name + country
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

    // Convert to GeoJSON
    const geojson = datasetToGeoJSON(fileName, dataset);

    // Write GeoJSON cache file
    const outputPath = path.join(MAPS_CACHE_DIR, `${fileName}.geojson`);
    fs.writeFileSync(outputPath, JSON.stringify(geojson, null, 2));
    console.log(`  💾 Wrote: ${outputPath}`);
    console.log(`  📊 Features: ${geojson.features.length}`);

  } catch (error) {
    console.error(`❌ Error processing ${fileName}:`, error.message);
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🗺️  Map Geocoding Preprocessor');
  console.log('================================');
  console.log(`Data dir: ${MAPS_DATA_DIR}`);
  console.log(`Cache dir: ${MAPS_CACHE_DIR}`);

  // Check if maps directory exists
  if (!fs.existsSync(MAPS_DATA_DIR)) {
    console.error(`❌ Maps directory not found: ${MAPS_DATA_DIR}`);
    process.exit(1);
  }

  // Load geocoding cache
  const cache = loadGeocodeCache();

  // Find all .yml files in maps directory
  const mapFiles = fs.readdirSync(MAPS_DATA_DIR)
    .filter(f => f.endsWith('.yml'))
    .map(f => path.join(MAPS_DATA_DIR, f));

  if (mapFiles.length === 0) {
    console.warn('⚠️  No YAML map files found in _data/maps/');
    return;
  }

  console.log(`\n📂 Found ${mapFiles.length} map dataset(s)\n`);

  // Process each dataset
  for (const filePath of mapFiles) {
    await processDataset(filePath, cache);
  }

  // Save cache for next run
  saveGeocodeCache(cache);

  console.log('\n✅ Geocoding complete!');
  console.log(`💾 Geocode cache saved: ${CACHE_FILE}`);
}

// Run
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
