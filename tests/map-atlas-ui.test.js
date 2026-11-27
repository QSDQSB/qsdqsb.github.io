const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  ACTIVATION_HANDLERS,
  buildAtlasLegendMarkup,
  createAtlasPopupContent,
  getMapBoundsPadding,
  resolveAtlasMarkerStyle,
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
  assert.match(markup, /<svg viewBox="0 0 24 24" aria-hidden="true">[\s\S]*<\/svg><span>Tags<\/span>/);
  // One slim list: no title bar repeating the button, no close mark of its own.
  assert.doesNotMatch(markup, /legend-palette-header|Browse tags|legend-palette-close/);
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

test('createAtlasPopupContent is a label, as on a map: a name and a date, leading to the voyage', () => {
  const properties = {
    title: 'Rome',
    dateDisplay: 'May 2025',
    excerpt: 'An evening walk through the old city.',
    tags: ['historic', 'italy'],
    tagColors: { historic: '#6e5240', italy: '#47733f' },
    url: '/voyage/rome/',
  };
  const label = createAtlasPopupContent(properties);
  assert.match(label, /^<a class="popup-content popup-content--atlas" href="\/voyage\/rome\/">/);
  assert.match(label, /class="popup-title">Rome</);
  assert.match(label, /class="popup-meta">May 2025</);
  assert.doesNotMatch(label, /popup-description|popup-tag|→|Open voyage/);

  // On a touch screen the strip along the map's foot says it in words, still with no arrow.
  const strip = createAtlasPopupContent(properties, true);
  assert.match(strip, /class="popup-action">Open voyage</);
  assert.doesNotMatch(strip, /→/);
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

test('the awake map never traps page scroll (no scrollWheelZoom) but pans, pinches and takes the keyboard', () => {
  // The map is awake from the start under a pointer, and a wheel over it still scrolls the page.
  assert.ok(!ACTIVATION_HANDLERS.includes('scrollWheelZoom'),
    'scrollWheelZoom must stay disabled so the long voyage page is always scrollable');
  // Pan, pinch and keyboard navigation are restored on activation.
  assert.ok(ACTIVATION_HANDLERS.includes('dragging'));
  assert.ok(ACTIVATION_HANDLERS.includes('touchZoom'));
  assert.ok(ACTIVATION_HANDLERS.includes('keyboard'));
});

test('atlas map frame drops the hard 2px widget border for the on-system glass card language', () => {
  // The old widget frame was `border: 2px solid $border-color` — gone now.
  assert.doesNotMatch(mapStylesheet, /border:\s*2px solid \$border-color/);
  // Replaced by the borderless-glass card language: fluid radius, hairline,
  // shared soft-depth shadow.
  assert.match(mapStylesheet, /border-radius:\s*clamp\(0\.6rem, 1\.2vw, 1rem\);/);
  assert.match(mapStylesheet, /box-shadow:\s*\$shadow-soft;/);
});

test('atlas polish no longer animates the leaflet map pane or control container', () => {
  assert.doesNotMatch(mapStylesheet, /\.map-container\s+\.leaflet-map-pane,\s*[\s\S]*transition:\s*opacity 0\.24s ease-out, transform 0\.24s ease-out;/);
  assert.doesNotMatch(mapStylesheet, /\.map-container--booting\s+\.leaflet-map-pane,/);
  assert.doesNotMatch(mapStylesheet, /\.map-container--booting\s+\.leaflet-control-container,/);
  assert.doesNotMatch(mapStylesheet, /\.map-container--ready\s+\.leaflet-map-pane,/);
  assert.doesNotMatch(mapStylesheet, /\.map-container--ready\s+\.leaflet-control-container,/);
});

test('a touch screen unfolds the map with the stylesheet, which an iPhone can do, and folds it back', () => {
  assert.match(mapStylesheet, /\.map-container\.map-container--unfolded\s*\{[\s\S]*?position:\s*fixed;[\s\S]*?inset:\s*0;/);
  assert.match(mapStylesheet, /\.map-container--unfolded \.map-unfold\s*\{\s*display:\s*none;/);
  assert.doesNotMatch(mapStylesheet, /\.map-veil/);
});
