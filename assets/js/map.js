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
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=cb1_3xht_1_28f15964527989c65928bbcd',
    attribution: '© OpenStreetMap contributors, © CartoDB',
    maxZoom: 19
  };

  const ATLAS_FALLBACK_COLOR = '#7d746d';
  const DEFAULT_BOUNDS_PADDING = [50, 50];
  const ATLAS_BOUNDS_PADDING = [64, 64];

  // The map's interaction handlers: on from the start under a pointer, on a touch screen once the map
  // is unfolded. scrollWheelZoom is never among them, so a wheel over the map always scrolls the page.
  const ACTIVATION_HANDLERS = ['dragging', 'doubleClickZoom', 'touchZoom', 'boxZoom', 'keyboard'];
  // The site's one answer to "has this reader asked for stillness?" (_includes/head/custom.html).
  const still = () => typeof window !== 'undefined' && !!(window.QSD && window.QSD.motionOff && window.QSD.motionOff());
  // The stylesheet's own test for a touch screen (responsive-coarse-pointer, _responsive-policy.scss).
  const touch = () => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(hover: none), (pointer: coarse)').matches;

  // The controls' marks: hairlines in ink, as every icon on the site (decisions/0012, line 5).
  const ICONS = {
    plus: 'M12 5v14M5 12h14',
    minus: 'M5 12h14',
    reset: 'M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4v4h4',
    expand: 'M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5',
    compress: 'M9 4v5H4M20 9h-5V4M15 20v-5h5M4 15h5v5',
    close: 'M6 6l12 12M18 6L6 18',
    tag: 'M3.5 3.5h7.8l9.2 9.2-7.8 7.8-9.2-9.2zM8 8h.01'
  };
  const icon = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${ICONS[name]}"/></svg>`;

  function getViewportPreset(viewportData) {
    if (viewportData) {
      const preset = buildPresetFromViewportData(viewportData);
      if (preset) return preset;
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

  // Back to the page's own view (the index), else to the parts, fitted again.
  function resetView(map, preset, animate) {
    if (preset && preset.center && preset.zoom !== undefined) {
      map.setView(preset.center, preset.zoom, { animate, duration: 0.5 });
    } else if (map._loadedGeoJSON) {
      fitMapBounds(map, map._loadedGeoJSON, { animate });
    }
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
        button.innerHTML = icon('reset');
        button.setAttribute('role', 'button');
        button.setAttribute('aria-label', 'Reset map view');

        L.DomEvent.on(button, 'click', L.DomEvent.stop);
        L.DomEvent.on(button, 'click', () => resetView(map, initialPreset, !still()));

        return container;
      }
    });

    return new ResetControl();
  }

  // Under a pointer, the Fullscreen API. On a touch screen the same button folds an unfolded map
  // back (it shows only then, as a close mark): see setUnfolded.
  function createFullscreenControl(map, mapContainer) {
    const FullscreenControl = L.Control.extend({
      options: {
        position: 'topleft'
      },

      onAdd: function() {
        const controlContainer = L.DomUtil.create('div', 'leaflet-control-fullscreen leaflet-bar');
        const button = L.DomUtil.create('a', 'leaflet-control-fullscreen-button', controlContainer);
        button.href = '#';
        button.title = 'Toggle fullscreen';
        button.innerHTML = icon('expand');
        button.setAttribute('role', 'button');
        button.setAttribute('aria-label', 'Toggle fullscreen mode');

        L.DomEvent.on(button, 'click', L.DomEvent.stop);
        L.DomEvent.on(button, 'click', () => {
          if (mapContainer.classList.contains('map-container--unfolded')) setUnfolded(map, mapContainer, false);
          else toggleFullscreen(mapContainer);
        });

        this._onFullscreenChange = function() {
          const active = isCurrentlyFullscreen();
          button.classList.toggle('leaflet-fullscreen-active', active);
          button.innerHTML = icon(active ? 'compress' : 'expand');
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

  function setHandlers(map, on) {
    ACTIVATION_HANDLERS.forEach((handler) => {
      if (map[handler]) map[handler][on ? 'enable' : 'disable']();
    });
  }

  // On a touch screen the small map is a preview: a finger on its way down the page scrolls past it,
  // and a tap unfolds it across the whole screen. The unfolding is the stylesheet's
  // (.map-container--unfolded), so it works where the Fullscreen API does not: on an iPhone.
  function makeFoldable(map, container) {
    container.classList.add('map-container--foldable');
    const open = L.DomUtil.create('button', 'map-unfold', container);
    open.type = 'button';
    open.innerHTML = '<span>Explore the map</span>';
    L.DomEvent.disableClickPropagation(open);
    open.addEventListener('click', () => setUnfolded(map, container, true));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') setUnfolded(map, container, false);
    });
  }

  function setUnfolded(map, container, on) {
    if (container.classList.contains('map-container--unfolded') === on) return;
    // Unfolded, the map stands at the body's own level: inside the page's column (#main, a size
    // container) a fixed box would be held to the column and stay under the masthead.
    if (on) {
      container._fold = container._fold || document.createComment('map');
      container.before(container._fold);
      document.body.appendChild(container);
    } else if (container._fold) {
      container._fold.replaceWith(container);
    }
    container.classList.toggle('map-container--unfolded', on);
    document.documentElement.classList.toggle('map-unfolded', on);
    setHandlers(map, on);
    hideStrip(map, container);
    const button = container.querySelector('.leaflet-control-fullscreen-button');
    if (button) {
      button.innerHTML = icon(on ? 'close' : 'expand');
      button.setAttribute('aria-label', on ? 'Close the map' : 'Toggle fullscreen mode');
    }
    map.invalidateSize({ animate: false });
    // A new size, so the first view again: the preview's fit is not the whole screen's.
    resetView(map, map._preset, false);
    const focusTarget = on ? button : container.querySelector('.map-unfold');
    if (focusTarget) focusTarget.focus({ preventScroll: true });
  }

  function init(container, options) {
    if (!container) {
      console.error('MapRenderer.init: No container provided');
      return;
    }

    if (container._leaflet_id || container._mapPending) {
      console.warn('MapRenderer.init: container already has a Leaflet instance — skipping re-initialisation');
      return;
    }

    container.classList.add('map-container--booting');
    container.classList.remove('map-container--ready');

    const { geojsonPath, viewport, parts } = options || {};
    if (!geojsonPath) {
      showError(container, 'GeoJSON path not provided');
      return;
    }

    // The map starts (its data, then its tiles) as the reader nears it: under a
    // voyage's part cards it sits far below the fold, and a reader who never
    // scrolls that far pays for none of it.
    if (typeof IntersectionObserver === 'undefined') {
      start(container, geojsonPath, viewport, parts);
      return;
    }
    container._mapPending = true;
    const near = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      near.disconnect();
      container._mapPending = false;
      start(container, geojsonPath, viewport, parts);
    }, { rootMargin: '600px 0px' });
    near.observe(container);
  }

  function start(container, geojsonPath, viewport, parts) {
    const viewportPreset = getViewportPreset(viewport);
    const presetForInit = viewportPreset || VIEWPORT_PRESETS.world;
    const mapInstance = L.map(container, {
      center: presetForInit.center || [20, 0],
      zoom: presetForInit.zoom !== undefined ? presetForInit.zoom : 2,
      minZoom: presetForInit.minZoom || 1,
      maxZoom: presetForInit.maxZoom || 18,
      // Every interaction handler starts disabled: under a pointer they are enabled once the data is
      // in, on a touch screen when the map is unfolded (setUnfolded).
      zoomControl: false,
      attributionControl: true,
      scrollWheelZoom: false,
      dragging: false,
      doubleClickZoom: false,
      touchZoom: false,
      boxZoom: false,
      keyboard: false,
      // Leaflet's own zoom and fade animations: off for a reader who asked for stillness.
      zoomAnimation: !still(),
      fadeAnimation: !still(),
      markerZoomAnimation: !still(),
      // SVG (not canvas) so the marker transitions in _map.scss actually take
      // effect — hover, selection and tag-filter changes ease instead of
      // snapping. Marker count per voyage is small, so SVG cost is negligible.
      preferCanvas: false
    });

    // Leaflet has no setting for a pan (the arrow keys, panTo): for a reader who
    // asked for stillness each lands at once, as the zooms above do.
    if (still()) {
      const panBy = mapInstance.panBy;
      mapInstance.panBy = function (offset, panOptions) {
        return panBy.call(this, offset, Object.assign({}, panOptions, { animate: false }));
      };
    }

    // The tiles are laid once the view is known (loadAndRenderGeoJSON): added
    // here, they were fetched for the whole world and then again for the voyage.
    const tiles = L.tileLayer(TILE_LAYER.url, {
      attribution: TILE_LAYER.attribution,
      maxZoom: TILE_LAYER.maxZoom,
      className: 'map-tiles'
    });

    L.control.zoom({
      position: 'topleft',
      zoomInText: icon('plus'),
      zoomOutText: icon('minus'),
      zoomInTitle: 'Zoom in',
      zoomOutTitle: 'Zoom out'
    }).addTo(mapInstance);
    mapInstance._preset = viewportPreset;
    createResetControl(mapInstance, viewportPreset).addTo(mapInstance);
    createFullscreenControl(mapInstance, container).addTo(mapInstance);

    loadAndRenderGeoJSON(mapInstance, geojsonPath, container, viewportPreset, tiles, parts);
  }

  function loadAndRenderGeoJSON(map, geojsonPath, container, viewportPreset, tiles, parts) {
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
        if (!atlasDataset) {
          // Every dataset scripts/geocode-maps.js generates carries
          // kind: 'voyage-atlas'; a non-atlas GeoJSON here means malformed
          // input, not a supported alternate format.
          console.error('MapRenderer: non-atlas GeoJSON dataset — nothing to render', geojson);
          showError(container, 'Map data is in an unsupported format.');
          return;
        }
        renderAtlasMap(map, geojson, container);

        // The index of voyages opens on the view its page names (Europe). A voyage in parts opens
        // close, on its parts, whatever its `map:` centre and zoom: only its zoom limits are kept.
        const limits = buildPresetFromViewportData(geojson.properties && geojson.properties.viewport) || {};
        if (limits.minZoom !== undefined) map.setMinZoom(limits.minZoom);
        if (limits.maxZoom !== undefined) map.setMaxZoom(limits.maxZoom);
        // The first view is set at once, so the tiles that follow are asked for at one view only.
        if (viewportPreset && viewportPreset.center && viewportPreset.zoom !== undefined) {
          map.setView(viewportPreset.center, viewportPreset.zoom, { animate: false });
        } else {
          fitMapBounds(map, geojson, { animate: false });
        }
        if (parts) nameParts(map);
        if (tiles) tiles.addTo(map);

        scheduleMapEntrance(container, atlasDataset);
        if (touch()) makeFoldable(map, container);
        else setHandlers(map, true);
      })
      .catch((error) => {
        console.error('Failed to load GeoJSON:', error);
        container.classList.remove('map-container--booting');
        showError(container, `Could not load map data: ${error.message}`);
      });
  }

  function isAtlasDataset(geojson) {
    return !!(geojson && geojson.properties && geojson.properties.kind === 'voyage-atlas');
  }

  function renderAtlasMap(map, geojson, container) {
    if (!geojson.features || geojson.features.length === 0) {
      showError(container, 'No atlas points found in dataset');
      return;
    }

    const markerGroup = L.featureGroup();
    const onTouch = touch();
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
        className: 'marker-atlas',
        // A marker's click is its own: on a touch screen it opens the strip, which a click on the map closes.
        bubblingMouseEvents: false
      });

      marker._atlas = {
        defaultColor,
        tags: Array.isArray(properties.tags) ? properties.tags : [],
        tagColors: properties.tagColors || {},
        properties
      };

      // A marker opens its label: under a pointer as it passes over (a click keeps it open), on a
      // touch screen as a strip of words along the map's foot, clear of its buttons. Either leads on.
      if (onTouch) {
        marker.on('click', () => showStrip(map, container, marker));
      } else {
        marker.on('mouseover', () => openLabel(map, marker, false));
        marker.on('mouseout', () => closeLabelSoon(map));
        marker.on('click', () => openLabel(map, marker, true));
      }

      markerGroup.addLayer(marker);
      atlasState.markers.push(marker);
    });

    markerGroup.addTo(map);
    map._markerGroup = markerGroup;
    map._atlasState = atlasState;

    if (onTouch) map.on('click', () => hideStrip(map, container));
    else map.on('popupclose', () => {
      atlasState.pinned = false;
      atlasState.selectedMarker = null;
      updateAtlasMarkerStyles(map);
    });

    renderAtlasLegend(map, geojson, container);
    updateAtlasMarkerStyles(map);
    updateAtlasLegendState(map);
  }

  // One label for the whole map, moved from marker to marker. It stays while the pointer is on it,
  // so the pointer can travel from the marker to the label and follow it.
  function openLabel(map, marker, pin) {
    const state = map._atlasState;
    clearTimeout(state.closeTimer);
    if (!state.label) {
      state.label = L.popup({ closeButton: false, autoPan: false, minWidth: 0, className: 'map-popup map-popup--atlas', offset: [0, -6] });
      state.label.on('add', () => {
        const el = state.label.getElement();
        if (!el || el._labelBound) return;
        el._labelBound = true;
        el.addEventListener('mouseenter', () => clearTimeout(state.closeTimer));
        el.addEventListener('mouseleave', () => closeLabelSoon(map));
      });
    }
    if (state.selectedMarker !== marker) {
      state.label.setLatLng(marker.getLatLng()).setContent(createAtlasPopupContent(marker._atlas.properties));
      state.label.openOn(map);
      state.selectedMarker = marker;
      updateAtlasMarkerStyles(map);
    }
    if (pin) state.pinned = true;
  }

  function closeLabelSoon(map) {
    const state = map._atlasState;
    clearTimeout(state.closeTimer);
    if (state.pinned) return;
    state.closeTimer = setTimeout(() => map.closePopup(state.label), 250);
  }

  function showStrip(map, container, marker) {
    let strip = container.querySelector('.map-strip');
    if (!strip) {
      strip = L.DomUtil.create('div', 'map-strip', container);
      L.DomEvent.disableClickPropagation(strip);
    }
    strip.innerHTML = createAtlasPopupContent(marker._atlas.properties, true);
    strip.hidden = false;
    map._atlasState.selectedMarker = marker;
    updateAtlasMarkerStyles(map);
  }

  function hideStrip(map, container) {
    const strip = container.querySelector('.map-strip');
    if (strip) strip.hidden = true;
    if (map._atlasState) {
      map._atlasState.selectedMarker = null;
      updateAtlasMarkerStyles(map);
    }
  }

  // A voyage in parts writes each part's name beside its marker, as places are written on a map.
  // Each name takes the first place, of right, left, below and above its marker, that keeps clear of
  // the markers and of the names already set, and inside the map; set again at every zoom.
  const NAME_PLACES = [['right', 0], ['left', 0], ['right', 1], ['left', 1], ['right', -1], ['left', -1]];

  function nameParts(map) {
    map._atlasState.markers.forEach((marker) => {
      marker.bindTooltip(escapeHtml(marker._atlas.properties.title || ''), {
        permanent: true,
        interactive: false,
        direction: 'right',
        offset: [12, 0],
        className: 'map-name'
      });
    });
    placeNames(map);
    map.on('zoomend resize', () => placeNames(map));
  }

  function placeNames(map) {
    const size = map.getSize();
    const markers = map._atlasState.markers.map((m) => ({ m, p: map.latLngToContainerPoint(m.getLatLng()) }));
    const taken = markers.map(({ p }) => [p.x - 10, p.y - 10, p.x + 10, p.y + 10]);
    const clear = (b) => b[0] >= 0 && b[1] >= 0 && b[2] <= size.x && b[3] <= size.y
      && !taken.some((t) => b[0] < t[2] && b[2] > t[0] && b[1] < t[3] && b[3] > t[1]);
    markers.sort((a, b) => a.p.y - b.p.y).forEach(({ m, p }) => {
      const tip = m.getTooltip();
      const el = tip && tip.getElement();
      if (!el) return;
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const box = ([side, row]) => {
        const x = side === 'right' ? p.x + 12 : p.x - 12 - w;
        const y = p.y - h / 2 + row * (h / 2 + 6);
        return [x, y, x + w, y + h];
      };
      // A name with no clear place waits, unwritten, for a closer view; its marker still opens its label.
      const found = NAME_PLACES.find((c) => clear(box(c)));
      el.classList.toggle('is-crowded', !found);
      if (!found) return;
      taken.push(box(found));
      tip.options.direction = found[0];
      tip.options.offset = L.point(found[0] === 'right' ? 12 : -12, found[1] * (h / 2 + 6));
      tip.update();
    });
  }

  // A label: the voyage's name and when, leading to it, with no arrow. The strip on a touch screen
  // also says so in words.
  function createAtlasPopupContent(properties, words) {
    const title = properties.title || 'Untitled voyage';
    const date = properties.dateDisplay || '';
    const inner = `<span class="popup-title">${escapeHtml(title)}</span>`
      + (date ? `<span class="popup-meta">${escapeHtml(date)}</span>` : '')
      + (words ? '<span class="popup-action">Open voyage</span>' : '');
    return properties.url
      ? `<a class="popup-content popup-content--atlas" href="${escapeHtml(properties.url)}">${inner}</a>`
      : `<div class="popup-content popup-content--atlas">${inner}</div>`;
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
    map._atlasState.legendRoot = legendRoot;
    map._atlasState.drawerRoot = drawerRoot;
    map._atlasState.drawerToggle = drawerToggle;

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
          ${icon('tag')}<span>Tags</span>
        </button>
      </div>
      <div id="${escapeHtml(paletteId)}" class="map-legend-palette${drawerOpen ? ' is-open' : ''}"${drawerOpen ? '' : ' hidden'} tabindex="-1" role="dialog" aria-label="Browse voyage tags">
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
      <button type="button" class="legend-item" data-tag="${escapeHtml(tagEntry.id)}" aria-pressed="false">
        <span class="legend-color" style="background-color: ${escapeHtml(tagEntry.color)};"></span>
        <span class="legend-label">${escapeHtml(tagEntry.label)}</span>
        <span class="legend-count">${tagEntry.count}</span>
      </button>
    `;
  }

  function bindAtlasDrawerEvents(map, container) {
    const state = map._atlasState;
    if (!state.drawerRoot || !state.drawerToggle) return;

    state.drawerToggle.addEventListener('click', function() {
      setAtlasDrawerOpen(map, !state.drawerOpen);
    });

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
      const focusTarget = state.drawerRoot.querySelector('.legend-item[data-tag]');
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
        item.setAttribute('aria-pressed', item.dataset.tag === state.activeTag ? 'true' : 'false');
      });
    }
  }

  function fitMapBounds(map, geojson, options) {
    if (!geojson.features || geojson.features.length === 0) return;

    const bounds = L.latLngBounds();
    geojson.features.forEach((feature) => {
      const [lng, lat] = feature.geometry.coordinates;
      bounds.extend([lat, lng]);
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds, Object.assign({ padding: getMapBoundsPadding(geojson) }, options));
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
    buildAtlasLegendMarkup,
    createAtlasPopupContent,
    getMapBoundsPadding,
    resolveAtlasMarkerStyle
  };
});
