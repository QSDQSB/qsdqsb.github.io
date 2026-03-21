/**
 * Map Renderer - Leaflet Initialization & Interactive Logic
 * 
 * Handles:
 * - Leaflet map initialization with viewport logic
 * - GeoJSON loading and marker rendering
 * - Category-based styling and legend
 * - Popup display and interaction
 * - Optional category filtering
 */

window.MapRenderer = (function() {
  'use strict';

  // Viewport presets for semantic scopes
  const VIEWPORT_PRESETS = {
    world: { center: [20, 0], zoom: 2, minZoom: 1, maxZoom: 18 }  };

  // Tile layer configuration (dark, minimalist aesthetic)
  const TILE_LAYER = {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '© OpenStreetMap contributors, © CartoDB',
    maxZoom: 19
  };

  /**
   * Look up viewport preset based on dataset name and optional viewport data
   * Prioritizes viewport data from YAML, falls back to VIEWPORT_PRESETS
   */
  function getViewportPreset(datasetName, viewportData) {
    // If viewport data is provided from YAML, use it
    if (viewportData) {
      const preset = buildPresetFromViewportData(viewportData);
      if (preset) return preset;
    }
    
    // Try specific 'city:' prefix first (most specific)
    if (VIEWPORT_PRESETS[`city:${datasetName}`]) {
      return VIEWPORT_PRESETS[`city:${datasetName}`];
    }
    
    // Try 'country:' prefix
    if (VIEWPORT_PRESETS[`country:${datasetName}`]) {
      return VIEWPORT_PRESETS[`country:${datasetName}`];
    }
    
    // Try 'continent:' prefix
    if (VIEWPORT_PRESETS[`continent:${datasetName}`]) {
      return VIEWPORT_PRESETS[`continent:${datasetName}`];
    }
    
    // Fall back to world view
    return VIEWPORT_PRESETS.world;
  }

  /**
   * Build viewport preset from YAML viewport data
   * Supports format: { scope: 'city', city: 'rome', center: [...], zoom: N, ... }
   */
  function buildPresetFromViewportData(viewportData) {
    if (!viewportData) return null;
    
    const preset = {};
    
    // Use explicit center/zoom if provided
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
    
    // Return preset only if it has meaningful values
    return (preset.center || preset.zoom !== undefined) ? preset : null;
  }

  /**
   * Apply viewport preset to map
   */
  function applyViewportPreset(map, preset) {
    if (!preset) return;
    
    map.setView(preset.center, preset.zoom, { animate: false });
    
    if (preset.minZoom !== undefined) {
      map.options.minZoom = preset.minZoom;
    }
    if (preset.maxZoom !== undefined) {
      map.options.maxZoom = preset.maxZoom;
    }
  }

  /**
   * Create a custom Reset View control
   * Returns map to initial viewport and zoom
   */
  function createResetControl(map, initialPreset) {
    const ResetControl = L.Control.extend({
      options: {
        position: 'topleft'
      },

      onAdd: function(map) {
        const container = L.DomUtil.create('div', 'leaflet-control-reset leaflet-bar');
        const button = L.DomUtil.create('a', 'leaflet-control-reset-button', container);
        button.href = '#';
        button.title = 'Reset view';
        button.innerHTML = '⟲';
        button.setAttribute('role', 'button');
        button.setAttribute('aria-label', 'Reset map view');

        L.DomEvent.on(button, 'click', L.DomEvent.stop);
        L.DomEvent.on(button, 'click', () => {
          if (initialPreset && initialPreset.center && initialPreset.zoom !== undefined) {
            map.setView(initialPreset.center, initialPreset.zoom, { animate: true, duration: 0.5 });
          }
        });

        return container;
      }
    });

    return new ResetControl();
  }

  /**
   * Create a custom Fullscreen control
   * Uses native Fullscreen API with fallbacks
   */
  function createFullscreenControl(mapContainer) {
    const FullscreenControl = L.Control.extend({
      options: {
        position: 'topleft'
      },

      onAdd: function(map) {
        const controlContainer = L.DomUtil.create('div', 'leaflet-control-fullscreen leaflet-bar');
        const button = L.DomUtil.create('a', 'leaflet-control-fullscreen-button', controlContainer);
        button.href = '#';
        button.title = 'Toggle fullscreen';
        button.innerHTML = '⛶';
        button.setAttribute('role', 'button');
        button.setAttribute('aria-label', 'Toggle fullscreen mode');

        L.DomEvent.on(button, 'click', L.DomEvent.stop);
        L.DomEvent.on(button, 'click', () => {
          toggleFullscreen(mapContainer, button);
        });

        // Listen for fullscreen changes
        document.addEventListener('fullscreenchange', updateFullscreenButton);
        document.addEventListener('webkitfullscreenchange', updateFullscreenButton);
        document.addEventListener('mozfullscreenchange', updateFullscreenButton);
        document.addEventListener('msfullscreenchange', updateFullscreenButton);

        function updateFullscreenButton() {
          const isFullscreen = isCurrentlyFullscreen();
          button.classList.toggle('leaflet-fullscreen-active', isFullscreen);
        }

        return controlContainer;
      }
    });

    return new FullscreenControl();
  }

  /**
   * Check if element is currently in fullscreen
   */
  function isCurrentlyFullscreen() {
    return !!(document.fullscreenElement ||
              document.webkitFullscreenElement ||
              document.mozFullScreenElement ||
              document.msFullscreenElement);
  }

  /**
   * Toggle fullscreen mode for map container
   */
  function toggleFullscreen(container) {
    if (isCurrentlyFullscreen()) {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    } else {
      // Enter fullscreen
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
  }

  /**
   * Initialize a map instance
   * @param {HTMLElement} container - DOM element for map
   * @param {Object} options - Configuration options
   */
  function init(container, options) {
    if (!container) {
      console.error('MapRenderer.init: No container provided');
      return;
    }

    const { geojsonPath, datasetName, viewport } = options || {};

    if (!geojsonPath) {
      showError(container, 'GeoJSON path not provided');
      return;
    }

    // Get viewport preset (prioritizes YAML viewport data)
    const viewportPreset = getViewportPreset(datasetName, viewport);

    // Initialize Leaflet map with viewport preset
    const mapInstance = L.map(container, {
      center: viewportPreset.center || [20, 0],
      zoom: viewportPreset.zoom || 2,
      minZoom: viewportPreset.minZoom || 1,
      maxZoom: viewportPreset.maxZoom || 18,
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: true,
      preferCanvas: true
    });

    // Add tile layer
    L.tileLayer(TILE_LAYER.url, {
      attribution: TILE_LAYER.attribution,
      maxZoom: TILE_LAYER.maxZoom,
      className: 'map-tiles'
    }).addTo(mapInstance);

    // Add custom Reset View control
    createResetControl(mapInstance, viewportPreset).addTo(mapInstance);

    // Add custom Fullscreen control
    createFullscreenControl(container).addTo(mapInstance);

    // Load and render GeoJSON
    // Pass viewportPreset so it can decide whether to call fitBounds
    loadAndRenderGeoJSON(mapInstance, geojsonPath, datasetName, container, viewportPreset);
  }

  /**
   * Load GeoJSON file and render markers
   */
  function loadAndRenderGeoJSON(map, geojsonPath, datasetName, container, viewportPreset) {
    // Ensure path doesn't have double slashes and uses absolute path
    const normalizedPath = geojsonPath.startsWith('/') ? geojsonPath : '/' + geojsonPath;
    
    fetch(normalizedPath, { method: 'GET', credentials: 'same-origin' })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
      })
      .then(geojson => {
        renderMarkers(map, geojson, container);
        renderLegend(map, geojson, container);
        
        // Only fit bounds if viewport preset does NOT have explicit zoom
        // If preset has zoom, it takes priority (don't override with fitBounds)
        const hasExplicitZoom = viewportPreset && viewportPreset.zoom !== undefined;
        if (!hasExplicitZoom) {
          fitMapBounds(map, geojson);
        }
      })
      .catch(error => {
        console.error('Failed to load GeoJSON:', error);
        showError(container, `Could not load map data: ${error.message}`);
      });
  }

  /**
   * Render markers from GeoJSON features
   */
  function renderMarkers(map, geojson, container) {
    if (!geojson.features || geojson.features.length === 0) {
      showError(container, 'No cities found in dataset');
      return;
    }

    // Create feature group for markers
    const markerGroup = L.featureGroup();

    // Render each feature as a CircleMarker
    geojson.features.forEach(feature => {
      const { properties, geometry } = feature;
      const { coordinates } = geometry;
      const [lng, lat] = coordinates;

      // Create CircleMarker with category color
      const markerColor = properties.color || '#FF6B6B';
      const marker = L.circleMarker([lat, lng], {
        radius: 8,
        fillColor: markerColor,
        color: '#ffffff',
        weight: 2,
        opacity: 0.9,
        fillOpacity: 0.75,
        className: `marker-${properties.category || 'default'}`
      });

      marker.bindPopup(createPopupContent(properties), {
        closeButton: false,
        maxWidth: 280,
        minWidth: 180,
        className: 'map-popup'
      });

      // Optional: Tooltip on hover (shows city name)
      marker.bindTooltip(properties.name, {
        permanent: false,
        direction: 'top',
        offset: [0, -10],
        className: 'map-tooltip'
      });

      // Show popup on hover
      marker.on('mouseover', function() {
        this.setStyle({ weight: 3, fillOpacity: 0.9 });
        this.openPopup();
      });

      marker.on('mouseout', function() {
        this.setStyle({ weight: 2, fillOpacity: 0.75 });
        this.closePopup();
      });

      // Show description on popup hover, navigate on popup click
      marker.on('popupopen', function() {
        const popup = this.getPopup();
        if (popup) {
          const content = popup.getElement();
          if (content) {
            const description = content.querySelector('.popup-description');
            
            // Show description on hover
            if (description) {
              content.addEventListener('mouseenter', function() {
                description.style.display = 'block';
              });
              content.addEventListener('mouseleave', function() {
                description.style.display = 'none';
              });
            }
            
            // Navigate to href on click
            if (properties.href) {
              content.style.cursor = 'pointer';
              content.addEventListener('click', function(e) {
                // Don't navigate if clicking close button or a link inside
                if (e.target.closest('.leaflet-popup-close-button') || e.target.tagName === 'A') {
                  return;
                }
                window.location.href = properties.href;
              });
            }
          }
        }
      });

      markerGroup.addLayer(marker);
    });

    markerGroup.addTo(map);
    map._markerGroup = markerGroup;
  }

  /**
   * Create popup content HTML
   */
  function createPopupContent(properties) {
    const { name, description, href } = properties;

    let html = '<div class="popup-content">';
    
    // City name (title)
    html += `<div class="popup-title">${escapeHtml(name)}</div>`;

    // Description (hidden by default, shown on hover)
    if (description) {
      html += `<div class="popup-description" style="display: none;">${escapeHtml(description)}</div>`;
    }

    html += '</div>';
    return html;
  }

  /**
   * Render legend from GeoJSON metadata
   */
  function renderLegend(map, geojson, container) {
    // Extract unique categories from features
    const categoriesMap = {};

    geojson.features.forEach(feature => {
      const { category, categoryLabel, color } = feature.properties;
      if (category && !categoriesMap[category]) {
        categoriesMap[category] = {
          label: categoryLabel || category,
          color: color || '#FF6B6B'
        };
      }
    });

    const categories = Object.entries(categoriesMap);
    if (categories.length === 0) {
      return; // No categories to display
    }

    // Create legend element
    const legendHtml = `
      <div class="map-legend">
        <div class="legend-title">Categories</div>
        ${categories.map(([catId, catData]) => `
          <div class="legend-item active" data-category="${catId}">
            <div class="legend-color" style="background-color: ${catData.color};"></div>
            <span class="legend-label">${escapeHtml(catData.label)}</span>
          </div>
        `).join('')}
      </div>
    `;

    // Insert legend into container
    container.insertAdjacentHTML('beforeend', legendHtml);

    // Optional: Add category filtering (click legend items to toggle)
    const legendItems = container.querySelectorAll('.legend-item');
    legendItems.forEach(item => {
      item.addEventListener('click', function() {
        const category = this.dataset.category;
        toggleCategoryFilter(map, category, this);
      });
    });
  }

  /**
   * Toggle visibility of markers by category
   */
  function toggleCategoryFilter(map, category, legendItem) {
    const markerGroup = map._markerGroup;
    if (!markerGroup) return;

    const isActive = legendItem.classList.toggle('active');
    legendItem.classList.toggle('inactive', !isActive);

    markerGroup.eachLayer(marker => {
      const markerCategory = marker.options.className?.replace('marker-', '');
      if (markerCategory === category) {
        isActive ? marker.setOpacity(1) : marker.setOpacity(0.2);
      }
    });
  }

  /**
   * Fit map bounds to all markers
   * Respects the map's current zoom constraints (no forced zoom limit)
   */
  function fitMapBounds(map, geojson) {
    if (!geojson.features || geojson.features.length === 0) return;

    const bounds = L.latLngBounds();
    geojson.features.forEach(feature => {
      const { coordinates } = feature.geometry;
      const [lng, lat] = coordinates;
      bounds.extend([lat, lng]);
    });

    if (bounds.isValid()) {
      // Let fitBounds naturally fit the markers without restricting maxZoom
      // This respects the preset's zoom constraints and allows reset to work as expected
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }

  /**
   * Display error message in map container
   */
  function showError(container, message) {
    const errorHtml = `
      <div class="map-error">
        <div style="text-align: center;">
          <div style="font-size: 24px; margin-bottom: 8px;">⚠️</div>
          <div>${escapeHtml(message)}</div>
        </div>
      </div>
    `;
    container.innerHTML = errorHtml;
  }

  /**
   * Utility: Escape HTML special characters
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Public API
  return {
    init: init
  };
})();
