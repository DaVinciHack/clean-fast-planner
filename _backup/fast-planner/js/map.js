/**
 * Map handling code for Fast Planner
 */

// Map variables
let map;
let markers = [];
let platformMarkers = [];
let chartVisible = true;

/**
 * Initialize the map
 */
function initMap() {
  console.log('Initializing map...');
  
  // Set Mapbox access token
  mapboxgl.accessToken = MAPBOX_CONFIG.accessToken;
  
  // Create map instance
  map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v11', // Use dark style to match theme
    center: MAPBOX_CONFIG.defaultCenter,
    zoom: MAPBOX_CONFIG.defaultZoom
  });
  
  // Add navigation controls
  map.addControl(new mapboxgl.NavigationControl(), 'top-left');
  
  // Set up event handlers once map is loaded
  map.on('load', () => {
    console.log('Map loaded');
    setupMapEventHandlers();
    
    // Add grid to map once loaded
    addGridToMap();
  });
  
  return map;
}

/**
 * Add grid lines to map
 */
function addGridToMap() {
  if (!map) return;
  console.log('Adding grid to map');
  
  // Set up a simple lat/long grid for Gulf of Mexico
  const latLines = [];
  const longLines = [];
  
  // Create latitude lines every 1 degree from 24° to 31° N
  for (let lat = 24; lat <= 31; lat++) {
    const line = {
      type: 'Feature',
      properties: {
        name: `${lat}°N`
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [-98, lat], // Western Gulf
          [-83, lat]  // Eastern Gulf
        ]
      }
    };
    latLines.push(line);
  }
  
  // Create longitude lines every 1 degree from -98° to -83° W
  for (let long = -98; long <= -83; long++) {
    const line = {
      type: 'Feature',
      properties: {
        name: `${Math.abs(long)}°W`
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [long, 24], // Southern Gulf
          [long, 31]  // Northern Gulf
        ]
      }
    };
    longLines.push(line);
  }
  
  // Add grid lines to map
  if (map.getSource('grid-lines')) {
    map.removeLayer('latitude-lines');
    map.removeLayer('longitude-lines');
    map.removeLayer('grid-labels');
    map.removeSource('grid-lines');
  }
  
  map.addSource('grid-lines', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: [...latLines, ...longLines]
    }
  });
  
  // Add latitude lines
  map.addLayer({
    id: 'latitude-lines',
    type: 'line',
    source: 'grid-lines',
    filter: ['all', ['has', 'name'], ['match', ['slice', ['get', 'name'], -1], ['N'], true, false]],
    paint: {
      'line-color': 'rgba(255, 255, 255, 0.2)',
      'line-width': 1,
      'line-dasharray': [3, 3]
    }
  });
  
  // Add longitude lines
  map.addLayer({
    id: 'longitude-lines',
    type: 'line',
    source: 'grid-lines',
    filter: ['all', ['has', 'name'], ['match', ['slice', ['get', 'name'], -1], ['W'], true, false]],
    paint: {
      'line-color': 'rgba(255, 255, 255, 0.2)',
      'line-width': 1,
      'line-dasharray': [3, 3]
    }
  });
  
  // Add grid labels
  map.addLayer({
    id: 'grid-labels',
    type: 'symbol',
    source: 'grid-lines',
    filter: ['has', 'name'],
    layout: {
      'text-field': ['get', 'name'],
      'text-size': 12,
      'text-offset': [0, -1],
      'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
      'text-radial-offset': 0.5,
      'text-justify': 'auto'
    },
    paint: {
      'text-color': 'rgba(255, 255, 255, 0.5)',
      'text-halo-color': 'rgba(0, 0, 0, 0.5)',
      'text-halo-width': 1
    }
  });
}

/**
 * Set up map event handlers
 */
function setupMapEventHandlers() {
  // Map click for adding waypoints
  map.on('click', (e) => {
    // Don't add waypoint if clicking on a platform marker
    const features = map.queryRenderedFeatures(e.point, { layers: ['platforms-layer'] });
    if (features.length > 0) {
      return; // Clicked on a platform, don't add waypoint
    }
    
    // Check if clicking on the route line
    const routeFeatures = map.queryRenderedFeatures(e.point, { layers: ['route'] });
    if (routeFeatures.length > 0) {
      // Find nearest rig to clicked point
      const nearestRig = findNearestRig(e.lngLat.lat, e.lngLat.lng);
      
      if (nearestRig) {
        // Find insertion index on the path
        const insertIndex = findPathInsertIndex(e.lngLat);
        // Add the rig as a waypoint at the appropriate position
        addWaypointAtIndex([nearestRig.lng, nearestRig.lat], nearestRig.name, insertIndex);
      } else {
        // No rig found, just add a waypoint at the clicked position on the path
        const insertIndex = findPathInsertIndex(e.lngLat);
        addWaypointAtIndex([e.lngLat.lng, e.lngLat.lat], null, insertIndex);
      }
      return;
    }
    
    // Regular map click, add waypoint at the end
    addWaypoint([e.lngLat.lng, e.lngLat.lat]);
  });
  
  // Handle clicks on platform markers
  map.on('click', 'platforms-layer', (e) => {
    const props = e.features[0].properties;
    const coordinates = e.features[0].geometry.coordinates.slice();
    
    // Use the platform coordinates for a waypoint
    addWaypoint(coordinates, props.name);
    
    // Create popup content
    const popupContent = `<strong>${props.name}</strong><br>
                         Operator: ${props.operator}<br>
                         Coordinates: ${coordinates[1].toFixed(4)}, ${coordinates[0].toFixed(4)}`;
    
    // Create popup
    new mapboxgl.Popup()
      .setLngLat(coordinates)
      .setHTML(popupContent)
      .addTo(map);
  });
  
  // Change cursor on hover over platforms
  map.on('mouseenter', 'platforms-layer', () => {
    map.getCanvas().style.cursor = 'pointer';
  });
  
  map.on('mouseleave', 'platforms-layer', () => {
    map.getCanvas().style.cursor = '';
  });
}

/**
 * Add platform data to map
 * @param {Array<Object>} platforms Array of platform objects
 */
function addPlatformsToMap(platforms) {
  console.log(`Adding ${platforms.length} platforms to map`);
  
  // Remove existing platform layers if they exist
  if (map.getLayer('platforms-layer')) {
    map.removeLayer('platforms-layer');
  }
  if (map.getLayer('platforms-labels')) {
    map.removeLayer('platforms-labels');
  }
  if (map.getSource('major-platforms')) {
    map.removeSource('major-platforms');
  }
  
  // Create GeoJSON data
  const platformFeatures = platforms.map(platform => ({
    type: 'Feature',
    properties: {
      name: platform.name,
      operator: platform.operator || 'Unknown'
    },
    geometry: {
      type: 'Point',
      coordinates: platform.coordinates
    }
  }));
  
  // Add platforms to map
  map.addSource('major-platforms', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: platformFeatures
    }
  });
  
  // Add platform markers
  map.addLayer({
    id: 'platforms-layer',
    type: 'circle',
    source: 'major-platforms',
    paint: {
      'circle-radius': 5,
      'circle-color': '#ff9800',
      'circle-stroke-width': 1,
      'circle-stroke-color': '#ffffff'
    }
  });
  
  // Add platform labels
  map.addLayer({
    id: 'platforms-labels',
    type: 'symbol',
    source: 'major-platforms',
    layout: {
      'text-field': ['concat', ['get', 'name'], '\n', ['get', 'operator']],
      'text-size': 14,
      'text-anchor': 'top',
      'text-offset': [0, 0.8]
    },
    paint: {
      'text-color': '#ffffff',
      'text-halo-color': '#000000',
      'text-halo-width': 1
    }
  });
  
  // Fit map to include all platforms
  fitMapToPlatforms(platforms);
}

/**
 * Fit map to show all platforms
 * @param {Array<Object>} platforms Array of platform objects
 */
function fitMapToPlatforms(platforms) {
  if (!platforms || platforms.length === 0) {
    return;
  }
  
  // Find bounds of all platforms
  const lngs = platforms.map(p => p.coordinates[0]);
  const lats = platforms.map(p => p.coordinates[1]);
  
  const bounds = [
    [Math.min(...lngs) - 0.5, Math.min(...lats) - 0.5], // Southwest
    [Math.max(...lngs) + 0.5, Math.max(...lats) + 0.5]  // Northeast
  ];
  
  // Fit map to bounds
  map.fitBounds(bounds, {
    padding: 50,
    maxZoom: 10
  });
}

/**
 * Toggle visibility of platforms and aviation grid
 */
function toggleChartVisibility() {
  chartVisible = !chartVisible;
  
  // Toggle visibility of platform layers
  const platformLayers = ['platforms-layer', 'platforms-labels'];
  const visibility = chartVisible ? 'visible' : 'none';
  
  platformLayers.forEach(layerId => {
    if (map.getLayer(layerId)) {
      map.setLayoutProperty(layerId, 'visibility', visibility);
    }
  });
  
  // Update button text
  const toggleButton = document.getElementById('toggle-chart');
  if (toggleButton) {
    toggleButton.textContent = chartVisible ? 'Hide Rigs' : 'Show Rigs';
  }
}

/**
 * Create a custom marker for a waypoint
 * @param {Array} coords Coordinates [lng, lat]
 * @param {string} name Optional name for the waypoint
 * @returns {Object} Marker object
 */
function createWaypointMarker(coords, name) {
  const marker = new mapboxgl.Marker({
    color: "#FF9800", // Using orange from SAR style
    draggable: true
  })
    .setLngLat(coords)
    .addTo(map);
  
  // Add popup with coordinates
  const popup = new mapboxgl.Popup({
    closeButton: true,
    closeOnClick: false,
    offset: 25
  });
  
  const popupContent = `
    <strong>${name || 'Waypoint'}</strong><br>
    Lat: ${coords[1].toFixed(5)}, Lon: ${coords[0].toFixed(5)}
  `;
  
  popup.setHTML(popupContent);
  
  // Show popup on hover
  marker.getElement().addEventListener('mouseenter', () => {
    popup.setLngLat(marker.getLngLat()).addTo(map);
  });
  
  marker.getElement().addEventListener('mouseleave', () => {
    popup.remove();
  });
  
  return marker;
}