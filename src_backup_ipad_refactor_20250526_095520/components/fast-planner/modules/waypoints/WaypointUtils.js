/**
 * WaypointUtils.js
 * 
 * Helper functions and utilities for waypoint management
 */

/**
 * Determines if a waypoint is a navigational waypoint (vs. a stop)
 * @param {Object} waypoint - The waypoint object to check
 * @returns {boolean} - True if it's a navigational waypoint
 */
export const isNavigationalWaypoint = (waypoint) => {
  if (!waypoint) return false;
  
  // Check explicitly set flag
  if (waypoint.isWaypoint !== undefined) {
    return !!waypoint.isWaypoint;
  }
  
  // Or check metadata if available
  if (waypoint.metadata && waypoint.metadata.isWaypoint !== undefined) {
    return !!waypoint.metadata.isWaypoint;
  }
  
  // Check if the name implies it's a waypoint (if no explicit flag)
  if (waypoint.name) {
    const uppercaseName = waypoint.name.toUpperCase();
    
    // Common indicators of navigational waypoints
    const waypointPrefixes = [
      'WP', 'WAYPOINT', 'FIX', 'NAV', 
      'POINT', 'REPORTING', 'RNAV'
    ];
    
    // Check if name starts with any common prefixes
    for (const prefix of waypointPrefixes) {
      if (uppercaseName.startsWith(prefix) || 
          uppercaseName.includes(` ${prefix}`)) {
        return true;
      }
    }
    
    // Check for common naming patterns - e.g., 5-character waypoint names
    // like "ALPHA" or coordinate-based names like "N5830W"
    if (/^[A-Z]{5}$/.test(uppercaseName) ||
        /^[NS]\d{2,4}[EW]\d{2,4}$/.test(uppercaseName)) {
      return true;
    }
  }
  
  // Default to false if no indicators are found
  return false;
};

/**
 * Create waypoint metadata object with proper structure for saving
 * @param {Object} waypoint - The original waypoint 
 * @param {boolean} isInsertedWaypoint - Whether it's an inserted navigation waypoint
 * @returns {Object} - Waypoint metadata for saving
 */
export const createWaypointMetadata = (waypoint, isInsertedWaypoint = false) => {
  return {
    id: waypoint.id,
    name: waypoint.name,
    coordinates: waypoint.coords,
    isWaypoint: isInsertedWaypoint,
    type: isInsertedWaypoint ? 'WAYPOINT' : 'STOP',
    legIndex: waypoint.legIndex || 0, // Include leg assignment for structured waypoints
    metadata: {
      isInserted: isInsertedWaypoint,
      originalType: waypoint.type || (isInsertedWaypoint ? 'WAYPOINT' : 'STOP'),
      timeStamp: Date.now()
    }
  };
};

/**
 * Create a map marker specific for waypoint type
 * @param {Array} coords - [lng, lat] coordinates 
 * @param {string} name - The waypoint name
 * @param {boolean} isNavigationalWaypoint - Whether it's a navigational waypoint
 * @returns {Object} - MapLibre marker object
 */
export const createWaypointMarker = (coords, name, isNavigationalWaypoint = false) => {
  try {
    if (!window.mapboxgl) {
      console.error('Cannot create waypoint marker: MapboxGL is not loaded');
      return null;
    }
    
    // Create a marker with appropriate styling based on waypoint type
    const marker = new window.mapboxgl.Marker({
      color: isNavigationalWaypoint ? "#0088ff" : "#FF4136", // Blue for nav waypoints, red for stops
      draggable: true,
      scale: isNavigationalWaypoint ? 0.4 : 0.6 // Smaller for nav waypoints
    })
      .setLngLat(coords);
    
    // Add popup with coordinates and name
    const popup = new window.mapboxgl.Popup({
      closeButton: true,
      closeOnClick: false,
      offset: isNavigationalWaypoint ? 10 : 15, // Smaller offset for nav waypoints
      className: isNavigationalWaypoint ? 'waypoint-popup' : 'stop-popup',
      maxWidth: '240px'
    });
    
    const displayName = name || (isNavigationalWaypoint ? 'Waypoint' : 'Stop');
    
    // Add favorite button to popup
    const popupContent = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
        <strong>${displayName}</strong>
        <span class="favorite-button" title="Add to favorites" style="cursor: pointer; font-size: 18px;" onclick="window.addToFavorites('${displayName}', [${coords}])">❤️</span>
      </div>
      <span class="coord-label">Lat:</span> <span class="coord-value">${coords[1].toFixed(5)}</span><br>
      <span class="coord-label">Lon:</span> <span class="coord-value">${coords[0].toFixed(5)}</span>
      ${isNavigationalWaypoint ? '<div style="font-size: 0.8em; color: #0088ff; margin-top: 5px;">Navigation Waypoint</div>' : ''}
    `;
    
    popup.setHTML(popupContent);
    
    // Show popup on hover
    const markerElement = marker.getElement();
    if (markerElement) {
      // Add class for CSS styling
      if (isNavigationalWaypoint) {
        markerElement.classList.add('waypoint-marker');
      }
      
      markerElement.addEventListener('mouseenter', () => {
        popup.setLngLat(marker.getLngLat()).addTo(map);
      });
      
      markerElement.addEventListener('mouseleave', () => {
        popup.remove();
      });
    }
    
    return marker;
  } catch (error) {
    console.error('Error creating waypoint marker:', error);
    return null;
  }
};

export default {
  isNavigationalWaypoint,
  createWaypointMetadata,
  createWaypointMarker
};