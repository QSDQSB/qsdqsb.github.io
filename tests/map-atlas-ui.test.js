const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  buildAtlasLegendMarkup,
  createAtlasPopupContent,
  getMapBoundsPadding,
  resolveAtlasMarkerStyle,
  slugifyTagArchiveFragment,
} = require('../assets/js/map.js');

const mapStylesheet = fs.readFileSync(path.join(__dirname, '..', '_sass', '_map.scss'), 'utf8');

test('buildAtlasLegendMarkup renders a quiet hero tags pill with a hidden floating palette', () => {
  const markup = buildAtlasLegendMarkup({
    tagEntries: [
      { id: 'historic', label: 'Historic', color: '#6e5240', count: 11 },
      { id: 'coastal', label: 'Coastal', color: '#325473', count: 4 },
      { id: 'bridges', label: 'Bridges', color: '#5a506f', count: 3 },
    ],
    lockedTag: null,
    drawerOpen: false,
    paletteId: 'voyage-tag-palette',
  });

  assert.match(markup, /class="map-legend map-legend--atlas map-legend--atlas-pill"/);
  assert.match(markup, /class="legend-pill"/);
  assert.match(markup, />\s*Tags\s*</);
  assert.match(markup, /class="map-legend-palette"/);
  assert.match(markup, /aria-controls="voyage-tag-palette"/);
  assert.match(markup, /class="map-legend-palette" hidden/);
  assert.match(markup, /type="button" class="legend-item"[^>]*data-tag="historic"/);
  assert.match(markup, /type="button" class="legend-item"[^>]*data-tag="coastal"/);
  assert.doesNotMatch(markup, /class="legend-title"/);
  assert.doesNotMatch(markup, /class="legend-reset"/);
  assert.doesNotMatch(markup, /Clear filter/);
});

test('buildAtlasLegendMarkup renders palette tags as local filter buttons, not archive links', () => {
  const markup = buildAtlasLegendMarkup({
    tagEntries: [
      { id: 'QSD\'s Favourite', label: 'QSD\'s Favourite', color: '#6e5240', count: 11 },
      { id: '🌴 Tropical (≈hot as hell)', label: '🌴 Tropical (≈hot as hell)', color: '#325473', count: 4 },
    ],
    drawerOpen: true,
    paletteId: 'voyage-tag-palette',
  });

  assert.match(markup, /class="legend-group legend-group--palette"/);
  assert.match(markup, /type="button" class="legend-item"[^>]*data-tag="QSD&#39;s Favourite"/);
  assert.match(markup, /type="button" class="legend-item"/);
  assert.doesNotMatch(markup, /href="\/voyage-by-tags\/#qsd-s-favourite"/);
  assert.doesNotMatch(markup, /legend-palette-clear/);
});

test('slugifyTagArchiveFragment matches the tag archive anchor format for representative tags', () => {
  assert.equal(slugifyTagArchiveFragment('Historic'), 'historic');
  assert.equal(slugifyTagArchiveFragment('QSD\'s Favourite'), 'qsd-s-favourite');
  assert.equal(slugifyTagArchiveFragment('🌴 Tropical (≈hot as hell)'), 'tropical-hot-as-hell');
});

test('resolveAtlasMarkerStyle keeps selected non-matching markers visually anchored', () => {
  const selectedNonMatch = resolveAtlasMarkerStyle({
    activeTag: 'historic',
    isSelected: true,
    tags: ['coastal'],
    tagColors: { coastal: '#325473' },
    defaultColor: '#325473',
    fallbackColor: '#7d746d',
  });
  const unselectedNonMatch = resolveAtlasMarkerStyle({
    activeTag: 'historic',
    isSelected: false,
    tags: ['coastal'],
    tagColors: { coastal: '#325473' },
    defaultColor: '#325473',
    fallbackColor: '#7d746d',
  });
  const selectedMatch = resolveAtlasMarkerStyle({
    activeTag: 'historic',
    isSelected: true,
    tags: ['historic', 'coastal'],
    tagColors: { historic: '#6e5240', coastal: '#325473' },
    defaultColor: '#325473',
    fallbackColor: '#7d746d',
  });

  assert.equal(selectedNonMatch.fillColor, '#325473');
  assert.equal(selectedMatch.fillColor, '#6e5240');
  assert.ok(selectedNonMatch.opacity > unselectedNonMatch.opacity);
  assert.ok(selectedNonMatch.fillOpacity > unselectedNonMatch.fillOpacity);
  assert.ok(selectedNonMatch.weight > unselectedNonMatch.weight);
  assert.ok(selectedMatch.weight >= selectedNonMatch.weight);
});

test('createAtlasPopupContent keeps the atlas popup lightweight and structured', () => {
  const html = createAtlasPopupContent({
    title: 'Rome',
    dateDisplay: '2024',
    excerpt: 'An evening walk through the old city.',
    tags: ['historic', 'italy', 'sunset', 'food', 'streets'],
    tagColors: {
      historic: '#6e5240',
      italy: '#47733f',
      sunset: '#9b5f41',
      food: '#7a5d33',
      streets: '#5f6477',
    },
    url: '/voyage/rome/',
  });

  assert.match(html, /class="popup-title"/);
  assert.match(html, />Rome</);
  assert.match(html, /class="popup-meta"/);
  assert.match(html, /class="popup-description popup-description--static"/);
  assert.match(html, /class="popup-tags"/);
  // Tags are now clickable archive links (first 3 shown, ATLAS_POPUP_TAG_LIMIT = 3)
  assert.match(html, /href="\/voyage-by-tags\/#historic"/);
  assert.match(html, /href="\/voyage-by-tags\/#italy"/);
  assert.match(html, /\+2/); // 5 tags − 3 visible = 2 overflow
  assert.match(html, /Open voyage/);
});

test('getMapBoundsPadding gives atlas maps more breathing room than default maps', () => {
  assert.deepEqual(getMapBoundsPadding({ properties: { kind: 'voyage-atlas' }, features: [] }), [64, 64]);
  assert.deepEqual(getMapBoundsPadding({ features: [] }), [50, 50]);
});

test('atlas palette stylesheet gives the tag list real spacing and isolated scrolling', () => {
  assert.match(mapStylesheet, /\.legend-palette-body\s*\{[\s\S]*overflow-y:\s*auto;/);
  assert.match(mapStylesheet, /\.legend-palette-body\s*\{[\s\S]*overscroll-behavior:\s*contain;/);
  assert.match(mapStylesheet, /\.legend-group--palette\s*\{[\s\S]*display:\s*grid;/);
  assert.match(mapStylesheet, /\.legend-group--palette\s*\{[\s\S]*gap:\s*2px;/);
});

test('atlas polish no longer animates the leaflet map pane or control container', () => {
  assert.doesNotMatch(mapStylesheet, /\.map-container\s+\.leaflet-map-pane,\s*[\s\S]*transition:\s*opacity 0\.24s ease-out, transform 0\.24s ease-out;/);
  assert.doesNotMatch(mapStylesheet, /\.map-container--booting\s+\.leaflet-map-pane,/);
  assert.doesNotMatch(mapStylesheet, /\.map-container--booting\s+\.leaflet-control-container,/);
  assert.doesNotMatch(mapStylesheet, /\.map-container--ready\s+\.leaflet-map-pane,/);
  assert.doesNotMatch(mapStylesheet, /\.map-container--ready\s+\.leaflet-control-container,/);
});
