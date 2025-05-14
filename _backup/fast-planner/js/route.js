/**
 * Route handling code for Fast Planner
 */

// Route variables
let waypoints = [];
let markers = [];

/**
 * Add a waypoint to the route
 * @param {Array} coords Coordinates [lng, lat]
 * @param {string} name Optional name for the waypoint
 */
function addWaypoint(coords, name) {
  console.log(`Adding waypoint at ${coords} with name: ${name || 'Unnamed'}`);
  
  // Create a unique ID for the waypoint
  const id = `waypoint-${Date.now()}`;
  
  // Add to waypoints array
  waypoints.push({
    id: id,
    coords: coords,
    name: name || `Waypoint ${waypoints.length + 1}`
  });
  
  // Create marker on the map
  const marker = createWaypointMarker(coords, name);
  
  // Add drag end event to update route
  marker.on('dragend', function() {
    const lngLat = marker.getLngLat();
    const index = markers.indexOf(marker);
    if (index !== -1 && index < waypoints.length) {
      waypoints[index].coords = [lngLat.lng, lngLat.lat];
      updateRoute();
    }
  });
  
  markers.push(marker);
  
  // Update route and UI
  updateRoute();
  updateWaypointList();
}

/**
 * Add a waypoint at a specific index in the route
 * @param {Array} coords Coordinates [lng, lat]
 * @param {string} name Optional name for the waypoint
 * @param {number} index Index to insert at
 */
function addWaypointAtIndex(coords, name, index) {
  console.log(`Adding waypoint at ${coords} with name: ${name || 'Unnamed'} at index ${index}`);
  
  // Create a unique ID for the waypoint
  const id = `waypoint-${Date.now()}`;
  
  // Create the waypoint object
  const waypoint = {
    id: id,
    coords: coords,
    name: name || `Waypoint ${index + 1}`
  };
  
  // Create marker on the map
  const marker = createWaypointMarker(coords, name);
  
  // Add drag end event to update route
  marker.on('dragend', function() {
    const lngLat = marker.getLngLat();
    const markerIndex = markers.indexOf(marker);
    if (markerIndex !== -1 && markerIndex < waypoints.length) {
      waypoints[markerIndex].coords = [lngLat.lng, lngLat.lat];
      updateRoute();
    }
  });
  
  // Insert at specific index
  waypoints.splice(index, 0, waypoint);
  markers.splice(index, 0, marker);
  
  // Update route and UI
  updateRoute();
  updateWaypointList();
}

/**
 * Update the route line on the map
 */
function updateRoute() {
  // Remove existing route if it exists
  if (map.getSource('route')) {
    map.removeLayer('route');
    map.removeSource('route');
  }
  
  // If we have at least 2 waypoints, draw the route
  if (waypoints.length >= 2) {
    const coordinates = waypoints.map(wp => wp.coords);
    
    map.addSource('route', {
      'type': 'geojson',
      'data': {
        'type': 'Feature',
        'properties': {},
        'geometry': {
          'type': 'LineString',
          'coordinates': coordinates
        }
      }
    });
    
    // Add main route line
    map.addLayer({
      'id': 'route',
      'type': 'line',
      'source': 'route',
      'layout': {
        'line-join': 'round',
        'line-cap': 'round'
      },
      'paint': {
        'line-color': '#007bff', // Bright blue for the main route
        'line-width': 4
      }
    });
    
    // Calculate and update stats
    calculateRouteStats(coordinates);
  } else {
    // Reset stats if not enough waypoints
    resetRouteStats();
  }
}

/**
 * Calculate flight parameters using Foundry API if available
 * @param {Array} fromPoint Starting coordinates
 * @param {Array} toPoint Destination coordinates
 * @param {string} aircraftType Aircraft type ID
 * @param {Object} options Additional options
 * @returns {Promise<Object>} Calculation results
 */
async function calculateFlightParameters(fromPoint, toPoint, aircraftType, options = {}) {
  console.log('Calculating flight parameters...');
  
  // For now, we'll just return a response that triggers local calculation
  // In the future, this could call the OSDK client
  return {
    success: false,
    useLocalCalculation: true,
    message: 'Using local calculation',
    data: null
  };
}

/**
 * Calculate route statistics
 * @param {Array} coordinates Array of coordinate pairs
 */
async function calculateRouteStats(coordinates) {
  // Get current aircraft
  const aircraftType = document.getElementById('aircraft-type').value;
  
  // Get current inputs
  const payloadWeight = parseFloat(document.getElementById('payload-weight').value) || 0;
  const reserveFuel = parseFloat(document.getElementById('reserve-fuel').value) || 0;
  
  // Try to use Foundry calculation first
  try {
    const firstPoint = coordinates[0];
    const lastPoint = coordinates[coordinates.length - 1];
    
    // Show loading overlay
    document.getElementById('loading-overlay').textContent = 'Calculating route...';
    document.getElementById('loading-overlay').style.display = 'block';
    
    // Call Foundry API for calculation
    const result = await calculateFlightParameters(
      firstPoint, 
      lastPoint, 
      aircraftType,
      { payloadWeight, reserveFuel }
    );
    
    // Hide loading overlay
    document.getElementById('loading-overlay').style.display = 'none';
    
    if (result.success && !result.useLocalCalculation) {
      // Use API results
      updateRouteStatsDisplay(result.data);
      return;
    }
    
    // Fall back to local calculation if API failed or returned useLocalCalculation
    calculateRouteStatsLocally(coordinates);
    
  } catch (error) {
    console.error('Error calculating route stats:', error);
    document.getElementById('loading-overlay').style.display = 'none';
    
    // Fall back to local calculation
    calculateRouteStatsLocally(coordinates);
  }
}

/**
 * Calculate route statistics locally
 * @param {Array} coordinates Array of coordinate pairs
 */
function calculateRouteStatsLocally(coordinates) {
  console.log('Using local route calculations');
  
  // Get current aircraft and input values
  let aircraft;
  
  try {
    const aircraftId = document.getElementById('aircraft-type').value;
    // Get aircraft data from select value
    if (window.aircraftTypes && window.aircraftTypes[aircraftId]) {
      aircraft = window.aircraftTypes[aircraftId];
    } else {
      // Fallback to first available aircraft
      aircraft = Object.values(DEFAULT_AIRCRAFT_TYPES)[0];
    }
  } catch (error) {
    console.error('Error getting aircraft data:', error);
    aircraft = DEFAULT_AIRCRAFT_TYPES.s92; // Default to S-92
  }
  
  const payloadWeight = parseFloat(document.getElementById('payload-weight').value) || 0;
  const reserveFuel = parseFloat(document.getElementById('reserve-fuel').value) || 0;
  
  // Calculate total distance
  let totalDistance = 0;
  
  for (let i = 0; i < coordinates.length - 1; i++) {
    const from = turf.point(coordinates[i]);
    const to = turf.point(coordinates[i + 1]);
    const options = { units: 'nauticalmiles' };
    
    const segmentDistance = turf.distance(from, to, options);
    totalDistance += segmentDistance;
  }
  
  // Calculate time based on cruise speed (hours)
  const timeHours = totalDistance / aircraft.cruiseSpeed;
  
  // Format time as HH:MM
  const hours = Math.floor(timeHours);
  const minutes = Math.floor((timeHours - hours) * 60);
  const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  
  // Calculate fuel required (include reserve)
  const fuelRequired = Math.round((timeHours * aircraft.fuelBurn) + reserveFuel);
  
  // Calculate usable load
  const usableLoad = Math.max(0, aircraft.maxTakeoffWeight - aircraft.emptyWeight - fuelRequired - payloadWeight);
  
  // Calculate max passengers
  const maxPassengers = Math.floor(usableLoad / aircraft.passengerWeight);
  
  // Display results
  const result = {
    totalDistance: totalDistance.toFixed(1),
    estimatedTime: formattedTime,
    fuelRequired: fuelRequired,
    usableLoad: usableLoad,
    maxPassengers: maxPassengers
  };
  
  updateRouteStatsDisplay(result);
}

/**
 * Update route statistics display
 * @param {Object} stats Route statistics
 */
function updateRouteStatsDisplay(stats) {
  // Update fuel uplift value in the top card based on calculated fuel required
  const fuelUpliftValue = document.getElementById('fuel-uplift-value');
  if (fuelUpliftValue) {
    fuelUpliftValue.textContent = stats.fuelRequired || '0';
  }
  
  // Update route statistics in both the right panel (if it exists) and the top card
  const totalDistanceElements = document.querySelectorAll('[id="total-distance"]');
  const estimatedTimeElements = document.querySelectorAll('[id="estimated-time"]');
  const fuelRequiredElements = document.querySelectorAll('[id="fuel-required"]');
  const usableLoadElements = document.querySelectorAll('[id="usable-load"]');
  const maxPassengersElements = document.querySelectorAll('[id="max-passengers"]');
  
  totalDistanceElements.forEach(el => {
    el.textContent = stats.totalDistance || '0';
  });
  
  estimatedTimeElements.forEach(el => {
    el.textContent = stats.estimatedTime || '00:00';
  });
  
  fuelRequiredElements.forEach(el => {
    el.textContent = stats.fuelRequired || '0';
  });
  
  usableLoadElements.forEach(el => {
    el.textContent = stats.usableLoad || '0';
  });
  
  maxPassengersElements.forEach(el => {
    el.textContent = stats.maxPassengers || '0';
  });
}

/**
 * Reset route statistics
 */
function resetRouteStats() {
  const stats = {
    totalDistance: '0',
    estimatedTime: '00:00',
    fuelRequired: '0',
    usableLoad: '0',
    maxPassengers: '0'
  };
  
  updateRouteStatsDisplay(stats);
}

/**
 * Update waypoint list in the UI
 */
function updateWaypointList() {
  const waypointListElement = document.getElementById('waypoint-list');
  if (!waypointListElement) return;
  
  waypointListElement.innerHTML = '';
  
  waypoints.forEach((waypoint, index) => {
    const waypointElement = document.createElement('div');
    waypointElement.className = 'waypoint-item';
    
    const nameElement = document.createElement('div');
    nameElement.textContent = waypoint.name || `Waypoint ${index + 1}`;
    
    const coordsElement = document.createElement('div');
    coordsElement.textContent = `${waypoint.coords[1].toFixed(4)}, ${waypoint.coords[0].toFixed(4)}`;
    
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'X';
    deleteButton.className = 'control-button';
    deleteButton.style.padding = '2px 5px';
    deleteButton.style.marginLeft = '5px';
    deleteButton.onclick = () => removeWaypoint(waypoint.id, index);
    
    waypointElement.appendChild(nameElement);
    waypointElement.appendChild(coordsElement);
    waypointElement.appendChild(deleteButton);
    
    waypointListElement.appendChild(waypointElement);
  });
  
  // Also update the stops panel
  updateStopsPanel();
}

/**
 * Update the stops panel with current waypoints
 */
function updateStopsPanel() {
  const stopsContainer = document.getElementById('stops-container');
  if (!stopsContainer) return;
  
  stopsContainer.innerHTML = '';
  
  waypoints.forEach((waypoint, index) => {
    const stopEntry = document.createElement('div');
    stopEntry.className = 'stop-entry';
    stopEntry.dataset.id = waypoint.id;
    
    const stopInput = document.createElement('input');
    stopInput.type = 'text';
    stopInput.value = waypoint.name || `Stop ${index + 1}`;
    stopInput.placeholder = 'Enter stop name';
    stopInput.addEventListener('change', (e) => {
      waypoint.name = e.target.value;
      updateWaypointList();
    });
    
    const coordsElement = document.createElement('div');
    coordsElement.className = 'coordinates';
    coordsElement.textContent = `Lat: ${waypoint.coords[1].toFixed(5)}, Lon: ${waypoint.coords[0].toFixed(5)}`;
    
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'stop-controls';
    
    const dragHandle = document.createElement('div');
    dragHandle.className = 'drag-handle';
    dragHandle.innerHTML = '☰';
    
    const removeButton = document.createElement('div');
    removeButton.className = 'remove-stop';
    removeButton.innerHTML = '✖';
    removeButton.addEventListener('click', () => removeWaypoint(waypoint.id, index));
    
    controlsDiv.appendChild(dragHandle);
    controlsDiv.appendChild(removeButton);
    
    stopEntry.appendChild(stopInput);
    stopEntry.appendChild(coordsElement);
    stopEntry.appendChild(controlsDiv);
    
    stopsContainer.appendChild(stopEntry);
  });
  
  // Initialize drag and drop functionality
  initDragAndDrop();
}

/**
 * Initialize drag and drop for stops
 */
function initDragAndDrop() {
  const stopsContainer = document.getElementById('stops-container');
  if (!stopsContainer) return;
  
  // Use native HTML5 drag and drop
  const stopEntries = stopsContainer.querySelectorAll('.stop-entry');
  
  stopEntries.forEach(entry => {
    entry.setAttribute('draggable', true);
    
    entry.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', entry.dataset.id);
      entry.classList.add('dragging');
    });
    
    entry.addEventListener('dragend', () => {
      entry.classList.remove('dragging');
    });
    
    entry.addEventListener('dragover', (e) => {
      e.preventDefault();
    });
    
    entry.addEventListener('dragenter', (e) => {
      e.preventDefault();
      entry.classList.add('drag-over');
    });
    
    entry.addEventListener('dragleave', () => {
      entry.classList.remove('drag-over');
    });
    
    entry.addEventListener('drop', (e) => {
      e.preventDefault();
      entry.classList.remove('drag-over');
      
      const draggedId = e.dataTransfer.getData('text/plain');
      const dropTargetId = entry.dataset.id;
      
      if (draggedId !== dropTargetId) {
        reorderWaypoints(draggedId, dropTargetId);
      }
    });
  });
}

/**
 * Reorder waypoints after drag and drop
 * @param {string} draggedId ID of the dragged waypoint
 * @param {string} dropTargetId ID of the waypoint being dropped onto
 */
function reorderWaypoints(draggedId, dropTargetId) {
  // Find indices
  const draggedIndex = waypoints.findIndex(wp => wp.id === draggedId);
  const dropTargetIndex = waypoints.findIndex(wp => wp.id === dropTargetId);
  
  if (draggedIndex === -1 || dropTargetIndex === -1) return;
  
  // Get the waypoint being moved
  const waypoint = waypoints[draggedIndex];
  
  // Get the marker being moved
  const marker = markers[draggedIndex];
  
  // Remove from current position
  waypoints.splice(draggedIndex, 1);
  markers.splice(draggedIndex, 1);
  
  // Insert at new position
  waypoints.splice(dropTargetIndex, 0, waypoint);
  markers.splice(dropTargetIndex, 0, marker);
  
  // Update route and UI
  updateRoute();
  updateWaypointList();
}

/**
 * Find the nearest rig to a given coordinate
 * @param {number} lat Latitude
 * @param {number} lng Longitude
 * @returns {Object|null} Nearest rig or null if none found
 */
function findNearestRig(lat, lng) {
  // Check if we have platforms data
  if (!map.getSource('major-platforms')) return null;
  
  // Get platforms data
  const platformSource = map.getSource('major-platforms');
  const platforms = platformSource._data.features;
  
  if (!platforms || platforms.length === 0) return null;
  
  let nearestPlatform = null;
  let minDistance = Number.MAX_VALUE;
  
  platforms.forEach(platform => {
    const coords = platform.geometry.coordinates;
    const distance = turf.distance(
      turf.point([lng, lat]),
      turf.point(coords),
      { units: 'nauticalmiles' }
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      nearestPlatform = {
        name: platform.properties.name,
        operator: platform.properties.operator,
        coords: coords,
        lat: coords[1],
        lng: coords[0]
      };
    }
  });
  
  // Only return if within reasonable distance (e.g. 10nm)
  return minDistance <= 10 ? nearestPlatform : null;
}

/**
 * Find insertion index for a new waypoint when clicking on a path
 * @param {Object} clickedPoint Point where the user clicked
 * @returns {number} Index to insert the new waypoint
 */
function findPathInsertIndex(clickedPoint) {
  if (waypoints.length < 2) return waypoints.length;
  
  let minDistance = Number.MAX_VALUE;
  let insertIndex = 1;
  
  for (let i = 0; i < waypoints.length - 1; i++) {
    const segment = turf.lineString([
      waypoints[i].coords,
      waypoints[i + 1].coords
    ]);
    
    const point = turf.point([clickedPoint.lng, clickedPoint.lat]);
    const nearestPoint = turf.nearestPointOnLine(segment, point, { units: 'nauticalmiles' });
    
    if (nearestPoint.properties.dist < minDistance) {
      minDistance = nearestPoint.properties.dist;
      insertIndex = i + 1;
    }
  }
  
  return insertIndex;
}

/**
 * Remove a waypoint
 * @param {string} id Waypoint ID
 * @param {number} index Waypoint index
 */
function removeWaypoint(id, index) {
  console.log(`Removing waypoint: ${id} at index ${index}`);
  
  // Remove the marker
  if (markers[index]) {
    markers[index].remove();
  }
  
  // Remove from arrays
  markers.splice(index, 1);
  waypoints = waypoints.filter(wp => wp.id !== id);
  
  // Update route and UI
  updateRoute();
  updateWaypointList();
}

/**
 * Clear the entire route
 */
function clearRoute() {
  console.log('Clearing route');
  
  // Remove all markers
  markers.forEach(marker => {
    marker.remove();
  });
  
  markers = [];
  waypoints = [];
  
  // Remove route from map
  if (map.getSource('route')) {
    map.removeLayer('route');
    map.removeSource('route');
  }
  
  // Reset stats and UI
  resetRouteStats();
  updateWaypointList();
}