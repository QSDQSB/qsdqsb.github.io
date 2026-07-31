/**
 * Map Renderer - Leaflet Initialization & Interactive Logic
 *
 * Supports:
 * - Existing single-category map datasets
 * - Atlas datasets with multi-tag markers, lightweight quick-view popups,
 *   and a floating tag palette linking into the tag archive
 */

(function(root, factory) {
  const api = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  if (root) {
    root.MapRenderer = api;
  }
})(typeof window !== 'undefined' ? window : globalThis, function() {
  'use strict';

  const VIEWPORT_PRESETS = {
    world: { center: [20, 0], zoom: 2, minZoom: 1, maxZoom: 18 }
  };

  const TILE_LAYER = {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '© OpenStreetMap contributors, © CartoDB',
    maxZoom: 19
  };

  const ATLAS_POPUP_TAG_LIMIT = 3;
  const ATLAS_FALLBACK_COLOR = '#7d746d';
  const DEFAULT_BOUNDS_PADDING = [50, 50];
  const ATLAS_BOUNDS_PADDING = [64, 64];
  const TAG_ARCHIVE_PATH = '/voyage-by-tags/';

  // Interaction handlers unlocked when the reader activates the map. The
  // absence of scrollWheelZoom is deliberate — see activateMap().
  const ACTIVATION_HANDLERS = ['dragging', 'doubleClickZoom', 'touchZoom', 'boxZoom', 'keyboard'];

  function getViewportPreset(datasetName, viewportData) {
    if (viewportData) {
      const preset = buildPresetFromViewportData(viewportData);
      if (preset) return preset;
    }

    if (VIEWPORT_PRESETS[`city:${datasetName}`]) {
      return VIEWPORT_PRESETS[`city:${datasetName}`];
    }

    if (VIEWPORT_PRESETS[`country:${datasetName}`]) {
      return VIEWPORT_PRESETS[`country:${datasetName}`];
    }

    if (VIEWPORT_PRESETS[`continent:${datasetName}`]) {
      return VIEWPORT_PRESETS[`continent:${datasetName}`];
    }

    // No user-supplied viewport — leave the preset null so the load step
    // can fitBounds() to the actual feature collection. The L.map()
    // initialiser falls back to world center/zoom while loading.
    return null;
  }

  function buildPresetFromViewportData(viewportData) {
    if (!viewportData) return null;

    const preset = {};

    if (viewportData.center && Array.isArray(viewportData.center)) {
      preset.center = viewportData.center;
    }
    if (viewportData.zoom !== undefined) {
      preset.zoom = viewportData.zoom;
    }
    if (viewportData.minZoom !== undefined) {
      preset.minZoom = viewportData.minZoom;
    }
    if (viewportData.maxZoom !== undefined) {
      preset.maxZoom = viewportData.maxZoom;
    }

    return (preset.center || preset.zoom !== undefined) ? preset : null;
  }

  function createResetControl(map, initialPreset) {
    const ResetControl = L.Control.extend({
      options: {
        position: 'topleft'
      },

      onAdd: function() {
        const container = L.DomUtil.create('div', 'leaflet-control-reset leaflet-bar');
        const button = L.DomUtil.create('a', 'leaflet-control-reset-button', container);
        button.href = '#';
        button.title = 'Reset view';
        button.innerHTML = '<i class="fa-solid fa-arrow-rotate-left" aria-hidden="true"></i>';
        button.setAttribute('role', 'button');
        button.setAttribute('aria-label', 'Reset map view');

        L.DomEvent.on(button, 'click', L.DomEvent.stop);
        L.DomEvent.on(button, 'click', () => {
          // Effective initial view, in precedence order:
          //   1. `map._initialPreset` — the preset that was actually applied
          //      after fetch (combines the constructor-time `initialPreset`
          //      with any viewport carried in `geojson.properties.viewport`).
          //      Falls back to the constructor-time preset if the GeoJSON
          //      hasn't loaded yet (rare).
          //   2. fitMapBounds against the loaded GeoJSON (derived atlases
          //      with no curated viewport — reset = "back to cluster view").
          const effective = map._initialPreset || initialPreset;
          if (effective && effective.center && effective.zoom !== undefined) {
            map.setView(effective.center, effective.zoom, { animate: true, duration: 0.5 });
            return;
          }
          if (map._loadedGeoJSON) {
            fitMapBounds(map, map._loadedGeoJSON);
          }
        });

        return container;
      }
    });

    return new ResetControl();
  }

  function createFullscreenControl(mapContainer) {
    const FullscreenControl = L.Control.extend({
      options: {
        position: 'topleft'
      },

      onAdd: function() {
        const controlContainer = L.DomUtil.create('div', 'leaflet-control-fullscreen leaflet-bar');
        const button = L.DomUtil.create('a', 'leaflet-control-fullscreen-button', controlContainer);
        button.href = '#';
        button.title = 'Toggle fullscreen';
        button.innerHTML = '<i class="fa-solid fa-expand" aria-hidden="true"></i>';
        button.setAttribute('role', 'button');
        button.setAttribute('aria-label', 'Toggle fullscreen mode');

        L.DomEvent.on(button, 'click', L.DomEvent.stop);
        L.DomEvent.on(button, 'click', () => {
          toggleFullscreen(mapContainer);
        });

        this._onFullscreenChange = function() {
          const active = isCurrentlyFullscreen();
          button.classList.toggle('leaflet-fullscreen-active', active);
          button.innerHTML = active
            ? '<i class="fa-solid fa-compress" aria-hidden="true"></i>'
            : '<i class="fa-solid fa-expand" aria-hidden="true"></i>';
        };

        document.addEventListener('fullscreenchange', this._onFullscreenChange);
        document.addEventListener('webkitfullscreenchange', this._onFullscreenChange);
        document.addEventListener('mozfullscreenchange', this._onFullscreenChange);
        document.addEventListener('msfullscreenchange', this._onFullscreenChange);

        return controlContainer;
      },

      onRemove: function() {
        if (this._onFullscreenChange) {
          document.removeEventListener('fullscreenchange', this._onFullscreenChange);
          document.removeEventListener('webkitfullscreenchange', this._onFullscreenChange);
          document.removeEventListener('mozfullscreenchange', this._onFullscreenChange);
          document.removeEventListener('msfullscreenchange', this._onFullscreenChange);
        }
      }
    });

    return new FullscreenControl();
  }

  function isCurrentlyFullscreen() {
    return !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );
  }

  function toggleFullscreen(container) {
    if (isCurrentlyFullscreen()) {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      return;
    }

    if (container.requestFullscreen) {
      container.requestFullscreen();
    } else if (container.webkitRequestFullscreen) {
      container.webkitRequestFullscreen();
    } else if (container.mozRequestFullScreen) {
      container.mozRequestFullScreen();
    } else if (container.msRequestFullscreen) {
      container.msRequestFullscreen();
    }
  }

  // Click-to-activate veil. The map is inert until the reader chooses to
  // explore it, so scrolling the page over the map never zooms it. The veil
  // also doubles as the loading surface (a quiet "Charting…" state) before it
  // arms into the "Click to explore" affordance.
  function createActivationVeil(container) {
    if (!container || container.querySelector('.map-veil')) return null;
    const veil = document.createElement('div');
    veil.className = 'map-veil map-veil--loading';
    veil.setAttribute('aria-hidden', 'true');
    veil.innerHTML = buildActivationVeilInner('loading');
    container.appendChild(veil);
    return veil;
  }

  function armActivationVeil(map, container) {
    const veil = container ? container.querySelector('.map-veil') : null;
    if (!veil) return;

    veil.classList.remove('map-veil--loading');
    veil.classList.add('map-veil--ready');
    veil.innerHTML = buildActivationVeilInner('ready');
    veil.setAttribute('role', 'button');
    veil.setAttribute('tabindex', '0');
    veil.setAttribute('aria-label', 'Explore the map');
    veil.removeAttribute('aria-hidden');

    if (typeof L !== 'undefined' && L.DomEvent) {
      L.DomEvent.disableClickPropagation(veil);
    }

    const activate = () => activateMap(map, container);
    veil.addEventListener('click', activate);
    veil.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        activate();
      }
    });
  }

  function activateMap(map, container) {
    if (!map || !container || container.classList.contains('map-container--active')) {
      return;
    }
    container.classList.add('map-container--active');
    // Enable pan/pinch/keyboard/double-click zoom — but NOT scrollWheelZoom.
    // Even once activated, wheeling over the map scrolls the page rather than
    // trapping it; zoom is via the +/- controls, double-click, or pinch. This
    // keeps a long voyage page reliably scrollable end to end.
    ACTIVATION_HANDLERS.forEach((handler) => {
      if (map[handler] && typeof map[handler].enable === 'function') {
        map[handler].enable();
      }
    });
    // Enabling `keyboard` gives the container a tabindex, so move focus onto
    // the now-navigable map. Otherwise a reader who activated it from the
    // keyboard is stranded on the hidden veil. preventScroll stops the page
    // from jumping to the map on focus.
    if (typeof container.focus === 'function') {
      try {
        container.focus({ preventScroll: true });
      } catch (error) {
        container.focus();
      }
    }
  }

  function buildActivationVeilInner(state) {
    if (state === 'loading') {
      return '<span class="map-veil__status"><span class="map-veil__spinner" aria-hidden="true"></span>Charting…</span>';
    }
    return '<span class="map-veil__cta"><i class="fa-solid fa-compass" aria-hidden="true"></i><span>Click to explore</span></span>';
  }

  function init(container, options) {
    if (!container) {
      console.error('MapRenderer.init: No container provided');
      return;
    }

    if (container._leaflet_id) {
      console.warn('MapRenderer.init: container already has a Leaflet instance — skipping re-initialisation');
      return;
    }

    container.classList.add('map-container--booting');
    container.classList.remove('map-container--ready');

    const { geojsonPath, datasetName, viewport } = options || {};
    if (!geojsonPath) {
      showError(container, 'GeoJSON path not provided');
      return;
    }

    const viewportPreset = getViewportPreset(datasetName, viewport);
    const presetForInit = viewportPreset || VIEWPORT_PRESETS.world;
    const mapInstance = L.map(container, {
      center: presetForInit.center || [20, 0],
      zoom: presetForInit.zoom !== undefined ? presetForInit.zoom : 2,
      minZoom: presetForInit.minZoom || 1,
      maxZoom: presetForInit.maxZoom || 18,
      // The map rests until the reader activates it (see the veil below), so
      // plain page-scroll is never hijacked on a long voyage page. Every
      // interaction handler starts disabled and is enabled on activation.
      zoomControl: false,
      attributionControl: true,
      scrollWheelZoom: false,
      dragging: false,
      doubleClickZoom: false,
      touchZoom: false,
      boxZoom: false,
      keyboard: false,
      // SVG (not canvas) so the marker transitions in _map.scss actually take
      // effect — hover, selection and tag-filter changes ease instead of
      // snapping. Marker count per voyage is small, so SVG cost is negligible.
      preferCanvas: false
    });

    L.tileLayer(TILE_LAYER.url, {
      attribution: TILE_LAYER.attribution,
      maxZoom: TILE_LAYER.maxZoom,
      className: 'map-tiles'
    }).addTo(mapInstance);

    // FontAwesome control glyphs, matching the site's icon language.
    L.control.zoom({
      position: 'topleft',
      zoomInText: '<i class="fa-solid fa-plus" aria-hidden="true"></i>',
      zoomOutText: '<i class="fa-solid fa-minus" aria-hidden="true"></i>',
      zoomInTitle: 'Zoom in',
      zoomOutTitle: 'Zoom out'
    }).addTo(mapInstance);
    createResetControl(mapInstance, viewportPreset).addTo(mapInstance);
    createFullscreenControl(container).addTo(mapInstance);
    createActivationVeil(container);

    loadAndRenderGeoJSON(mapInstance, geojsonPath, container, viewportPreset);
  }

  function loadAndRenderGeoJSON(map, geojsonPath, container, viewportPreset) {
    const normalizedPath = geojsonPath.startsWith('/') ? geojsonPath : `/${geojsonPath}`;

    fetch(normalizedPath, { method: 'GET', credentials: 'same-origin' })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
      })
      .then((geojson) => {
        // Stash the loaded collection on the map so the reset control can
        // re-fit it when there is no explicit user-supplied preset.
        map._loadedGeoJSON = geojson;

        const atlasDataset = isAtlasDataset(geojson);
        if (atlasDataset) {
          renderAtlasMap(map, geojson, container);
        } else {
          // Every dataset scripts/geocode-maps.js generates carries
          // kind: 'voyage-atlas'; a non-atlas GeoJSON here means malformed
          // input, not a supported alternate format.
          console.error('MapRenderer: non-atlas GeoJSON dataset — nothing to render', geojson);
          showError(container, 'Map data is in an unsupported format.');
          return;
        }

        // Effective viewport precedence:
        //   1. viewportPreset (explicit include override)
        //   2. geojson.properties.viewport (new home for parent-voyage
        //      curated viewport, written by scripts/geocode-maps.js from
        //      the parent's `map: { center, zoom, minZoom, maxZoom }`)
        //   3. fitMapBounds (auto-fit to feature bounds)
        const datasetPreset = buildPresetFromViewportData(geojson.properties && geojson.properties.viewport);
        const effectivePreset = viewportPreset || datasetPreset;
        // Stash for the reset control so it knows where "initial view" is.
        map._initialPreset = effectivePreset;

        if (effectivePreset) {
          if (effectivePreset.minZoom !== undefined) map.setMinZoom(effectivePreset.minZoom);
          if (effectivePreset.maxZoom !== undefined) map.setMaxZoom(effectivePreset.maxZoom);
          if (effectivePreset.center && effectivePreset.zoom !== undefined) {
            map.setView(effectivePreset.center, effectivePreset.zoom);
          } else if (effectivePreset.center) {
            map.panTo(effectivePreset.center);
          } else {
            fitMapBounds(map, geojson);
          }
        } else {
          fitMapBounds(map, geojson);
        }

        scheduleMapEntrance(container, atlasDataset);
        armActivationVeil(map, container);
      })
      .catch((error) => {
        console.error('Failed to load GeoJSON:', error);
        container.classList.remove('map-container--booting');
        showError(container, `Could not load map data: ${error.message}`);
      });
  }

  function isAtlasDataset(geojson) {
    if (geojson && geojson.properties && geojson.properties.kind === 'voyage-atlas') {
      return true;
    }

    return Array.isArray(geojson.features) && geojson.features.some((feature) => {
      return Array.isArray(feature?.properties?.tags);
    });
  }

  function renderAtlasMap(map, geojson, container) {
    if (!geojson.features || geojson.features.length === 0) {
      showError(container, 'No atlas points found in dataset');
      return;
    }

    const markerGroup = L.featureGroup();
    const atlasState = {
      markers: [],
      drawerOpen: false,
      selectedMarker: null,
      activeTag: null,
      fallbackColor: geojson.properties?.fallbackColor || ATLAS_FALLBACK_COLOR,
      legendRoot: null
    };

    geojson.features.forEach((feature) => {
      const properties = feature.properties || {};
      const { geometry } = feature;
      if (!geometry || !Array.isArray(geometry.coordinates) || geometry.coordinates.length < 2) {
        console.warn('MapRenderer: Skipping atlas feature with missing coordinates', properties.title || properties.slug);
        return;
      }
      const [lng, lat] = geometry.coordinates;
      const defaultColor = properties.mainTagColor || properties.fallbackColor || atlasState.fallbackColor;
      const marker = L.circleMarker([lat, lng], {
        radius: 8,
        fillColor: defaultColor,
        color: '#ffffff',
        weight: 2,
        opacity: 0.95,
        fillOpacity: 0.78,
        className: 'marker-atlas'
      });

      marker._atlas = {
        defaultColor,
        tags: Array.isArray(properties.tags) ? properties.tags : [],
        tagColors: properties.tagColors || {},
        properties
      };

      marker.bindTooltip(properties.title || 'Untitled voyage', {
        permanent: false,
        direction: 'top',
        offset: [0, -10],
        className: 'map-tooltip'
      });

      marker.bindPopup(createAtlasPopupContent(properties), {
        closeButton: true,
        maxWidth: 320,
        minWidth: 220,
        className: 'map-popup map-popup--atlas'
      });

      marker.on('mouseover', function() {
        if (atlasState.selectedMarker !== this) {
          this.setStyle({ weight: 3, fillOpacity: 0.92 });
        }
      });

      marker.on('mouseout', function() {
        updateAtlasMarkerStyles(map);
      });

      marker.on('popupopen', function() {
        atlasState.selectedMarker = this;
        updateAtlasMarkerStyles(map);
      });

      marker.on('popupclose', function() {
        if (atlasState.selectedMarker === this) {
          atlasState.selectedMarker = null;
        }
        updateAtlasMarkerStyles(map);
      });

      marker.on('click', function() {
        atlasState.selectedMarker = this;
        updateAtlasMarkerStyles(map);
      });

      markerGroup.addLayer(marker);
      atlasState.markers.push(marker);
    });

    markerGroup.addTo(map);
    map._markerGroup = markerGroup;
    map._atlasState = atlasState;

    renderAtlasLegend(map, geojson, container);
    updateAtlasMarkerStyles(map);
    updateAtlasLegendState(map);
  }

  function createAtlasPopupContent(properties) {
    const title = properties.title || 'Untitled voyage';
    const excerpt = properties.excerpt || '';
    const dateDisplay = properties.dateDisplay || properties.date || '';
    const tags = Array.isArray(properties.tags) ? properties.tags : [];
    const visibleTags = tags.slice(0, ATLAS_POPUP_TAG_LIMIT);
    const remainingTagCount = Math.max(tags.length - visibleTags.length, 0);

    let html = '<div class="popup-content popup-content--atlas">';
    html += `<div class="popup-title">${escapeHtml(title)}</div>`;

    if (dateDisplay) {
      html += `<div class="popup-meta">${escapeHtml(dateDisplay)}</div>`;
    }

    if (excerpt) {
      html += `<div class="popup-description popup-description--static">${escapeHtml(excerpt)}</div>`;
    }

    if (visibleTags.length > 0) {
      html += '<div class="popup-tags">';
      html += visibleTags.map((tag) => {
        const color = properties.tagColors && properties.tagColors[tag] ? properties.tagColors[tag] : properties.fallbackColor || ATLAS_FALLBACK_COLOR;
        const href = `${TAG_ARCHIVE_PATH}#${slugifyTagArchiveFragment(tag)}`;
        return `<a class="popup-tag" href="${escapeHtml(href)}" style="--tag-color: ${escapeHtml(color)};">${escapeHtml(tag)}</a>`;
      }).join('');
      if (remainingTagCount > 0) {
        html += `<span class="popup-tag popup-tag--overflow">+${remainingTagCount}</span>`;
      }
      html += '</div>';
    }

    if (properties.url) {
      html += `<a class="popup-action" href="${escapeHtml(properties.url)}"><span>Open voyage</span><span aria-hidden="true">→</span></a>`;
    }

    html += '</div>';
    return html;
  }

  function scheduleMapEntrance(container, isAtlas) {
    container.classList.toggle('map-container--atlas-ready', !!isAtlas);

    if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') {
      container.classList.remove('map-container--booting');
      container.classList.add('map-container--ready');
      return;
    }

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        container.classList.remove('map-container--booting');
        container.classList.add('map-container--ready');
      });
    });
  }

  function renderAtlasLegend(map, geojson, container) {
    const tagEntries = buildAtlasLegendEntries(geojson);
    if (tagEntries.length === 0) {
      return;
    }

    const paletteId = `${container.id || 'map-container'}-tag-palette`;
    const legendHtml = buildAtlasLegendMarkup({
      tagEntries,
      drawerOpen: map._atlasState.drawerOpen,
      paletteId
    });

    container.insertAdjacentHTML('beforeend', legendHtml);
    const legendRoot = container.querySelector('.map-legend--atlas');
    const drawerRoot = container.querySelector('.map-legend-palette');
    const drawerToggle = legendRoot.querySelector('.legend-pill');
    const drawerClose = drawerRoot ? drawerRoot.querySelector('.legend-palette-close') : null;
    map._atlasState.legendRoot = legendRoot;
    map._atlasState.drawerRoot = drawerRoot;
    map._atlasState.drawerToggle = drawerToggle;
    map._atlasState.drawerClose = drawerClose;

    if (drawerRoot) {
      L.DomEvent.disableScrollPropagation(drawerRoot);
      L.DomEvent.disableClickPropagation(drawerRoot);
      bindAtlasDrawerEvents(map, container);
    }
  }

  function buildAtlasLegendEntries(geojson) {
    const tagMap = new Map();

    geojson.features.forEach((feature) => {
      const properties = feature.properties || {};
      const tags = Array.isArray(properties.tags) ? properties.tags : [];
      const tagColors = properties.tagColors || {};

      tags.forEach((tag) => {
        if (!tagMap.has(tag)) {
          tagMap.set(tag, {
            id: tag,
            label: tag,
            color: tagColors[tag] || properties.fallbackColor || ATLAS_FALLBACK_COLOR,
            count: 0
          });
        }
        tagMap.get(tag).count += 1;
      });
    });

    return Array.from(tagMap.values()).sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count;
      }
      return left.label.localeCompare(right.label);
    });
  }

  function buildAtlasLegendMarkup({ tagEntries, drawerOpen, paletteId }) {
    return `
      <div class="map-legend map-legend--atlas map-legend--atlas-pill">
        <button type="button" class="legend-pill${drawerOpen ? ' is-active' : ''}" aria-controls="${escapeHtml(paletteId)}" aria-expanded="${drawerOpen ? 'true' : 'false'}" aria-haspopup="dialog">
          <i class="fa-solid fa-tags" aria-hidden="true"></i><span>Tags</span>
        </button>
      </div>
      <div id="${escapeHtml(paletteId)}" class="map-legend-palette${drawerOpen ? ' is-open' : ''}"${drawerOpen ? '' : ' hidden'} tabindex="-1" role="dialog" aria-label="Browse voyage tags">
          <div class="legend-palette-header">
            <div class="legend-palette-title">Browse tags</div>
            <div class="legend-palette-actions">
              <button type="button" class="legend-palette-close" aria-label="Close tag palette">×</button>
            </div>
          </div>
          <div class="legend-palette-body">
            <div class="legend-group legend-group--palette">
              ${tagEntries.map(renderAtlasLegendItem).join('')}
            </div>
          </div>
      </div>
    `;
  }

  function renderAtlasLegendItem(tagEntry) {
    return `
      <button type="button" class="legend-item" data-tag="${escapeHtml(tagEntry.id)}">
        <span class="legend-color" style="background-color: ${escapeHtml(tagEntry.color)};"></span>
        <span class="legend-label">${escapeHtml(tagEntry.label)}</span>
        <span class="legend-count">${tagEntry.count}</span>
      </button>
    `;
  }

  function slugifyTagArchiveFragment(tag) {
    const normalized = String(tag ?? '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '');

    const slug = normalized
      .replace(/[^0-9A-Za-z]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase();

    return slug || 'tag';
  }

  function bindAtlasDrawerEvents(map, container) {
    const state = map._atlasState;
    if (!state.drawerRoot || !state.drawerToggle) return;

    state.drawerToggle.addEventListener('click', function() {
      setAtlasDrawerOpen(map, !state.drawerOpen);
    });

    if (state.drawerClose) {
      state.drawerClose.addEventListener('click', function() {
        setAtlasDrawerOpen(map, false);
      });
    }

    state.drawerRoot.addEventListener('click', function(event) {
      const item = event.target.closest('.legend-item[data-tag]');
      if (!item) return;
      const tag = item.dataset.tag;
      setAtlasActiveTag(map, state.activeTag === tag ? null : tag);
    });

    state.handleDocumentClick = function(event) {
      if (!state.drawerOpen) return;
      const target = event.target;
      if (state.drawerRoot.contains(target) || state.legendRoot.contains(target)) {
        return;
      }
      setAtlasDrawerOpen(map, false, true);
    };

    state.handleDocumentKeydown = function(event) {
      if (event.key !== 'Escape' || !state.drawerOpen) return;
      setAtlasDrawerOpen(map, false, true);
    };

    document.addEventListener('click', state.handleDocumentClick);
    document.addEventListener('keydown', state.handleDocumentKeydown);

    map.on('remove', function cleanupAtlasListeners() {
      document.removeEventListener('click', state.handleDocumentClick);
      document.removeEventListener('keydown', state.handleDocumentKeydown);
      map.off('remove', cleanupAtlasListeners);
    });
  }

  function setAtlasActiveTag(map, tag) {
    const state = map._atlasState;
    if (!state) return;
    state.activeTag = tag || null;
    updateAtlasMarkerStyles(map);
    updateAtlasLegendState(map);
  }

  function setAtlasDrawerOpen(map, open, restoreFocus) {
    const state = map._atlasState;
    if (!state || !state.drawerRoot || !state.drawerToggle) return;

    state.drawerOpen = !!open;
    state.drawerRoot.hidden = !state.drawerOpen;
    state.drawerRoot.classList.toggle('is-open', state.drawerOpen);
    state.drawerToggle.setAttribute('aria-expanded', state.drawerOpen ? 'true' : 'false');
    state.drawerToggle.classList.toggle('is-active', state.drawerOpen);

    if (state.drawerOpen) {
      const focusTarget = state.drawerClose || state.drawerRoot.querySelector('.legend-item[data-tag]');
      if (focusTarget) {
        focusTarget.focus();
      }
    } else if (restoreFocus) {
      state.drawerToggle.focus();
    }
  }

  function updateAtlasMarkerStyles(map) {
    const state = map._atlasState;
    if (!state) return;

    state.markers.forEach((marker) => {
      const atlasData = marker._atlas;
      const isSelected = state.selectedMarker === marker;
      marker.setStyle(resolveAtlasMarkerStyle({
        activeTag: state.activeTag,
        isSelected,
        tags: atlasData.tags,
        tagColors: atlasData.tagColors,
        defaultColor: atlasData.defaultColor,
        fallbackColor: state.fallbackColor
      }));
    });
  }

  function resolveAtlasMarkerStyle({ activeTag, isSelected, tags, tagColors, defaultColor, fallbackColor }) {
    const isMatch = !activeTag || tags.includes(activeTag);
    const fillColor = activeTag && isMatch
      ? (tagColors[activeTag] || defaultColor || fallbackColor)
      : defaultColor;

    if (isSelected && isMatch) {
      return {
        radius: 9,
        fillColor,
        color: '#ffffff',
        weight: 3,
        opacity: 0.98,
        fillOpacity: 0.95
      };
    }

    if (isSelected && !isMatch) {
      return {
        radius: 9,
        fillColor,
        color: '#ffffff',
        weight: 3,
        opacity: 0.74,
        fillOpacity: 0.5
      };
    }

    return {
      radius: 8,
      fillColor,
      color: '#ffffff',
      weight: 2,
      opacity: isMatch ? 0.95 : 0.35,
      fillOpacity: isMatch ? 0.78 : 0.18
    };
  }

  function updateAtlasLegendState(map) {
    const state = map._atlasState;
    if (!state || !state.legendRoot) return;

    if (state.drawerToggle) {
      state.drawerToggle.classList.toggle('is-active', state.drawerOpen);
      state.drawerToggle.setAttribute('aria-expanded', state.drawerOpen ? 'true' : 'false');
      state.drawerToggle.classList.toggle('has-filter', !!state.activeTag);
    }

    if (state.drawerRoot) {
      state.drawerRoot.classList.toggle('has-filter', !!state.activeTag);
      state.drawerRoot.querySelectorAll('.legend-item[data-tag]').forEach((item) => {
        item.classList.toggle('is-active', item.dataset.tag === state.activeTag);
      });
    }
  }

  function fitMapBounds(map, geojson) {
    if (!geojson.features || geojson.features.length === 0) return;

    const bounds = L.latLngBounds();
    geojson.features.forEach((feature) => {
      const [lng, lat] = feature.geometry.coordinates;
      bounds.extend([lat, lng]);
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: getMapBoundsPadding(geojson) });
    }
  }

  function getMapBoundsPadding(geojson) {
    return isAtlasDataset(geojson) ? ATLAS_BOUNDS_PADDING : DEFAULT_BOUNDS_PADDING;
  }

  function showError(container, message) {
    container.innerHTML = `
      <div class="map-error">
        <div style="text-align: center;">
          <i class="fa-solid fa-triangle-exclamation" style="font-size: 22px; margin-bottom: 8px; display: block;" aria-hidden="true"></i>
          <div>${escapeHtml(message)}</div>
        </div>
      </div>
    `;
  }

  function escapeHtml(text) {
    const value = String(text ?? '');
    if (typeof document !== 'undefined') {
      const div = document.createElement('div');
      div.textContent = value;
      return div.innerHTML;
    }

    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  return {
    init,
    ACTIVATION_HANDLERS,
    buildActivationVeilInner,
    buildAtlasLegendMarkup,
    createAtlasPopupContent,
    getMapBoundsPadding,
    resolveAtlasMarkerStyle,
    slugifyTagArchiveFragment
  };
});
