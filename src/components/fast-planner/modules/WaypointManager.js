/**
 * WaypointManager.js
 * 
 * Handles waypoint creation, deletion, and manipulation
 */

class WaypointManager {
  constructor(mapManager, platformManager = null) {
    this.mapManager = mapManager;
    this.platformManager = platformManager; // Store the platform manager reference
    this.waypoints = [];
    this.markers = [];
    this.callbacks = {
      onChange: null,
      onWaypointAdded: null,
      onWaypointRemoved: null,
      onRouteUpdated: null
    };
  }
  
  /**
   * Set the platform manager if not provided in constructor
   * @param {Object} platformManager - Platform manager instance
   */
  setPlatformManager(platformManager) {
    this.platformManager = platformManager;
  }
  
  /**
   * Set a callback function
   * @param {string} type - The callback type (onChange, onWaypointAdded, etc.)
   * @param {Function} callback - The callback function
   */
  setCallback(type, callback) {
    if (this.callbacks.hasOwnProperty(type)) {
      this.callbacks[type] = callback;
    }
  }
  
  /**
   * Trigger a callback if it exists
   * @param {string} type - The callback type
   * @param {*} data - The data to pass to the callback
   */
  triggerCallback(type, data) {
    if (this.callbacks[type]) {
      this.callbacks[type](data);
    }
  }
  
  /**
   * Add a waypoint to the route
   * @param {Array} coords - [lng, lat] coordinates
   * @param {string} name - The waypoint name
   * @returns {Object} - The added waypoint
   */
  addWaypoint(coords, name) {
    const map = this.mapManager.getMap();
    if (!map) {
      console.error('Cannot add waypoint: Map is not initialized');
      return null;
    }
    
    console.log(`Adding waypoint at coordinates: ${coords} with name: ${name || 'Unnamed'}`);
    
    // Create a unique ID for the waypoint
    const id = `waypoint-${Date.now()}`;
    
    // Create waypoint object
    const waypoint = {
      id: id,
      coords: coords,
      name: name || `Waypoint ${this.waypoints.length + 1}`,
      isNew: true // Mark as new for highlighting
    };
    
    // Add to waypoints array
    this.waypoints.push(waypoint);
    
    try {
      // Create marker on the map
      const marker = this.createWaypointMarker(coords, name);
      
      if (marker) {
        // Add drag end event to update route
        marker.on('dragend', () => {
          const lngLat = marker.getLngLat();
          const index = this.markers.indexOf(marker);
          if (index !== -1 && index < this.waypoints.length) {
            console.log(`Marker at index ${index} dragged to [${lngLat.lng}, ${lngLat.lat}]`);
            
            // Store the old coordinates for reference
            const oldCoords = this.waypoints[index].coords;
            
            // Update the waypoint coordinates
            this.waypoints[index].coords = [lngLat.lng, lngLat.lat];
            
            // Check for nearest platform to the new location and update name if found
            this.updateWaypointNameAfterDrag(index, [lngLat.lng, lngLat.lat]);
            
            // Update route with new waypoint
            this.updateRoute();
            
            // Trigger onChange callback to update UI
            this.triggerCallback('onChange', this.waypoints);
          }
        });
        
        this.markers.push(marker);
      } else {
        console.error('Failed to create waypoint marker');
      }
      
      // Update route - don't pass route stats here as they'll be calculated by the callback
      this.updateRoute(null);
      
      // Log the operation for debugging
      console.log(`Added waypoint ${waypoint.name} at the end, ID: ${id}`);
      
      // Trigger callbacks
      this.triggerCallback('onWaypointAdded', waypoint);
      this.triggerCallback('onChange', this.waypoints);
      
      return waypoint;
    } catch (error) {
      console.error('Error adding waypoint:', error);
      // Remove the waypoint if marker creation failed
      this.waypoints = this.waypoints.filter(wp => wp.id !== id);
      return null;
    }
  }
  
  /**
   * Updates a waypoint's name after it has been dragged to a new location
   * @param {number} index - The index of the waypoint
   * @param {Array} newCoords - [lng, lat] new coordinates
   */
  updateWaypointNameAfterDrag(index, newCoords) {
    // Skip if we don't have access to a platform manager
    if (!window.platformManager && !this.platformManager) {
      console.log('No platform manager available to check for nearby locations');
      return;
    }
    
    const platformMgr = window.platformManager || this.platformManager;
    
    try {
      // Use findNearestPlatform to check if we're now near a platform
      const nearestPlatform = platformMgr.findNearestPlatform(newCoords[1], newCoords[0], 2);
      
      if (nearestPlatform) {
        console.log(`Found nearest platform after drag: ${nearestPlatform.name} (${nearestPlatform.distance.toFixed(2)} nm)`);
        
        // Update the waypoint name with the platform name
        this.waypoints[index].name = nearestPlatform.name;
        console.log(`Updated waypoint name to: ${nearestPlatform.name}`);
      } else {
        // If not near a platform, check if the current name is a generated one
        // and update the number if needed
        const currentName = this.waypoints[index].name;
        if (currentName.startsWith('Waypoint ')) {
          this.waypoints[index].name = `Waypoint ${index + 1}`;
        }
        // If it has a custom name, leave it as is
      }
    } catch (error) {
      console.error('Error updating waypoint name after drag:', error);
    }
  }
  
  /**
   * Add a waypoint at a specific index in the route
   * @param {Array} coords - [lng, lat] coordinates
   * @param {string} name - The waypoint name
   * @param {number} index - The index to insert at
   * @returns {Object} - The added waypoint
   */
  addWaypointAtIndex(coords, name, index) {
    const map = this.mapManager.getMap();
    if (!map) return null;
    
    // Create a unique ID for the waypoint
    const id = `waypoint-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Create the waypoint object
    const waypoint = {
      id: id,
      coords: coords,
      name: name || `Stop ${index + 1}`,
      isNew: true // Mark as new for highlighting
    };
    
    // Create marker on the map
    const marker = this.createWaypointMarker(coords, name);
    
    // Add drag end event to update route
    marker.on('dragend', () => {
      const lngLat = marker.getLngLat();
      const markerIndex = this.markers.indexOf(marker);
      if (markerIndex !== -1 && markerIndex < this.waypoints.length) {
        this.waypoints[markerIndex].coords = [lngLat.lng, lngLat.lat];
        this.updateRoute();
      }
    });
    
    // Insert at specific index
    this.waypoints.splice(index, 0, waypoint);
    this.markers.splice(index, 0, marker);
    
    // Update route - don't pass route stats here as they'll be calculated by the callback
    this.updateRoute(null);
    
    // Log the operation for debugging
    console.log(`Added waypoint ${waypoint.name} at index ${index}, ID: ${id}`);
    
    // Ensure we trigger callbacks in this order:
    // 1. First onWaypointAdded for the specific waypoint
    // 2. Then onChange for the entire waypoints array
    this.triggerCallback('onWaypointAdded', waypoint);
    this.triggerCallback('onChange', this.waypoints);
    
    return waypoint;
  }
  
  /**
   * Create a custom marker for a waypoint
   * @param {Array} coords - [lng, lat] coordinates
   * @param {string} name - The waypoint name
   * @returns {Object} - The created marker
   */
  createWaypointMarker(coords, name) {
    try {
      const map = this.mapManager.getMap();
      if (!map) {
        console.error('Cannot create waypoint marker: Map is not initialized');
        return null;
      }
      
      if (!window.mapboxgl) {
        console.error('Cannot create waypoint marker: MapboxGL is not loaded');
        return null;
      }
      
      // Ensure coordinates are valid
      if (!coords || coords.length !== 2 || 
          typeof coords[0] !== 'number' || typeof coords[1] !== 'number') {
        console.error('Invalid coordinates for waypoint marker:', coords);
        return null;
      }
      
      console.log(`Creating waypoint marker at ${coords} with name ${name || 'Unnamed'}`);
      
      // Create a smaller pin marker with a custom color
      const marker = new window.mapboxgl.Marker({
        color: "#FF4136", // Bright red color for better visibility
        draggable: true,
        scale: 0.6 // Keep them small (60% of normal size)
      })
        .setLngLat(coords)
        .addTo(map);
      
      // Add popup with coordinates and name - now with a close button and favorite button
      const popup = new window.mapboxgl.Popup({
        closeButton: true, // Add close button
        closeOnClick: false,
        offset: 15, // Smaller offset for smaller marker
        className: 'waypoint-popup',
        maxWidth: '240px'
      });
      
      const displayName = name || 'Waypoint';
      
      // Add favorite button to popup
      const popupContent = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
          <strong>${displayName}</strong>
          <span class="favorite-button" title="Add to favorites" style="cursor: pointer; font-size: 18px;" onclick="window.addToFavorites('${displayName}', [${coords}])">❤️</span>
        </div>
        <span class="coord-label">Lat:</span> <span class="coord-value">${coords[1].toFixed(5)}</span><br>
        <span class="coord-label">Lon:</span> <span class="coord-value">${coords[0].toFixed(5)}</span>
      `;
      
      popup.setHTML(popupContent);
      
      // Show popup on hover
      const markerElement = marker.getElement();
      if (markerElement) {
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
  }
  
  /**
   * Create arrow markers along a route line
   * @param {Array} coordinates - Array of [lng, lat] coordinates
   * @param {Object} routeStats - Route statistics
   * @returns {Object} - GeoJSON feature collection of arrow markers
   */
  createArrowsAlongLine(coordinates, routeStats = null) {
    if (!coordinates || coordinates.length < 2) {
      return {
        type: 'FeatureCollection',
        features: []
      };
    }
    
    const features = [];
    
    // Process each segment of the route
    for (let i = 0; i < coordinates.length - 1; i++) {
      const startPoint = coordinates[i];
      const endPoint = coordinates[i + 1];
      
      // Calculate distance of this segment
      const distance = window.turf.distance(
        window.turf.point(startPoint),
        window.turf.point(endPoint),
        { units: 'nauticalmiles' }
      );
      
      // Calculate bearing between points
      const bearing = window.turf.bearing(
        window.turf.point(startPoint),
        window.turf.point(endPoint)
      );
      
      // Find the midpoint of the segment
      const midpointFraction = 0.5;
      const midPoint = window.turf.along(
        window.turf.lineString([startPoint, endPoint]),
        distance * midpointFraction,
        { units: 'nauticalmiles' }
      );
      
      // Calculate leg time and fuel if aircraft data is available
      let legTime = null;
      let legFuel = null;
      
      // Try to get aircraft data from routeStats or window.currentRouteStats
      const stats = routeStats || window.currentRouteStats;
      if (stats && stats.aircraft) {
        const speed = stats.aircraft.cruiseSpeed || 145;
        const timeHours = distance / speed;
        
        // Format time as minutes only, rounded to the nearest minute
        const totalMinutes = Math.round(timeHours * 60);
        legTime = `${totalMinutes}m`;
        
        // Calculate fuel for this leg
        const fuelBurn = stats.aircraft.fuelBurn || 1100;
        legFuel = Math.round(timeHours * fuelBurn);
      }
      
      // Format distance value
      let distanceText = `${distance.toFixed(1)} nm`;
      
      // Format leg time value (enhanced)
      let timeText = legTime ? `${legTime}` : "";
      
      // Format fuel value (enhanced)
      let fuelText = legFuel ? `${legFuel} lbs` : "";
      
      // Create a clear, enhanced label with more information
      // Shows distance, time, and fuel on separate lines for better readability
      let labelText = '';
      
      // Always show distance
      labelText += distanceText;
      
      // Add time if available
      if (timeText) {
        labelText += `\n${timeText}`;
      }
      
      // Add fuel if available
      if (fuelText) {
        labelText += `\n${fuelText}`;
      }
      
      // Add arrow indicator
      labelText += ' ➜';
      
      // Determine the adjusted bearing for text orientation
      // Make the text parallel to the line and ensure it's never upside down
      let adjustedBearing = bearing;
      
      // First make it parallel to the flight path by rotating 90 degrees
      adjustedBearing += 90;
      
      // Ensure text is always right-side up
      // If the text would be upside down (90° to 270°), flip it to be right-side up
      if (adjustedBearing > 90 && adjustedBearing < 270) {
        adjustedBearing = (adjustedBearing + 180) % 360;
      }
      
      // Add label feature with the adjusted bearing
      features.push({
        type: 'Feature',
        geometry: midPoint.geometry,
        properties: {
          isLabel: true,
          bearing: bearing,           // Original bearing for reference
          textBearing: adjustedBearing, // Adjusted bearing for text orientation
          text: labelText,
          legIndex: i
        }
      });
    }
    
    return {
      type: 'FeatureCollection',
      features: features
    };
  }
  
  /**
   * Remove a waypoint by ID and index
   * @param {string} id - The waypoint ID
   * @param {number} index - The waypoint index
   */
  removeWaypoint(id, index) {
    console.log(`WaypointManager: Removing waypoint with ID ${id} at index ${index}`);
    
    // If index is not provided or invalid, find it from the ID
    if (index === undefined || index < 0 || index >= this.waypoints.length) {
      console.log(`WaypointManager: Invalid index ${index}, searching by ID`);
      index = this.waypoints.findIndex(wp => wp.id === id);
      
      if (index === -1) {
        console.error(`WaypointManager: Cannot find waypoint with ID ${id}`);
        return;
      }
    }
    
    // Find the waypoint for callback before removing
    const removedWaypoint = this.waypoints[index];
    
    // Remove the marker from the map
    if (this.markers[index]) {
      console.log(`WaypointManager: Removing marker at index ${index}`);
      try {
        this.markers[index].remove();
      } catch (error) {
        console.error('Error removing marker:', error);
      }
    } else {
      console.warn(`WaypointManager: No marker found at index ${index}`);
    }
    
    // Remove from arrays
    this.markers.splice(index, 1);
    this.waypoints.splice(index, 1);
    
    console.log(`WaypointManager: After removal, ${this.waypoints.length} waypoints and ${this.markers.length} markers remain`);
    
    // Update route
    this.updateRoute();
    
    // Trigger callbacks
    if (removedWaypoint) {
      this.triggerCallback('onWaypointRemoved', removedWaypoint);
    }
    this.triggerCallback('onChange', this.waypoints);
  }
  
  /**
   * Update the route line on the map
   * @param {Object} routeStats - Optional route statistics to use for leg labels
   */
  updateRoute(routeStats = null) {
    const map = this.mapManager.getMap();
    if (!map) return;
    
    // Remove existing route, glow, and arrows if they exist
    if (map.getSource('route')) {
      if (map.getLayer('route-glow')) {
        map.removeLayer('route-glow');
      }
      if (map.getLayer('route')) {
        map.removeLayer('route');
      }
      map.removeSource('route');
    }
    
    // Remove existing arrows and labels if they exist
    if (map.getSource('route-arrows')) {
      if (map.getLayer('route-arrows')) {
        map.removeLayer('route-arrows');
      }
      if (map.getLayer('leg-labels')) {
        map.removeLayer('leg-labels');
      }
      map.removeSource('route-arrows');
    }
    
    // If we have at least 2 waypoints, draw the route
    if (this.waypoints.length >= 2) {
      const coordinates = this.waypoints.map(wp => wp.coords);
      
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
      
      // Add main route line (make it wider for easier interaction)
      map.addLayer({
        'id': 'route',
        'type': 'line',
        'source': 'route',
        'layout': {
          'line-join': 'round',
          'line-cap': 'round',
          'line-sort-key': 1 // Ensure it appears above the glow but below symbols
        },
        'paint': {
          'line-color': '#007bff', // Bright blue for the main route
          'line-width': 6,         // Wider line for easier grabbing
          'line-opacity': 0.8      // Slightly transparent
        }
      });
      
      // Add a "glow" effect around the route to make it more visible
      map.addLayer({
        'id': 'route-glow',
        'type': 'line',
        'source': 'route',
        'layout': {
          'line-join': 'round',
          'line-cap': 'round',
          'visibility': 'visible',
          'line-sort-key': 0 // Ensure it appears below the main line
        },
        'paint': {
          'line-color': '#ffffff',  // White glow
          'line-width': 10,         // Wider than the main route
          'line-opacity': 0.15,     // Very transparent
          'line-blur': 3            // Blur effect for glow
        },
        'filter': ['==', '$type', 'LineString']
      }, 'route'); // Insert below the main route
      
      // Access route stats from global state if not provided
      const stats = routeStats || window.currentRouteStats;
      
      // Create a GeoJSON source for the route arrows and leg labels
      const arrowsData = this.createArrowsAlongLine(coordinates, stats);
      
      // Add a source for the arrows and labels
      map.addSource('route-arrows', {
        'type': 'geojson',
        'data': arrowsData
      });
      
      // Use a custom arrow image or create one
      // First check if we've already loaded the arrow image
      if (!map.hasImage('arrow-icon')) {
        // Create a canvas to draw the arrow
        const size = 24;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // Draw a simple arrow
        ctx.clearRect(0, 0, size, size);
        
        // Draw an arrow shape
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(size/2, 0);       // Top center
        ctx.lineTo(size, size);      // Bottom right
        ctx.lineTo(size/2, size*0.7); // Middle bottom
        ctx.lineTo(0, size);         // Bottom left
        ctx.closePath();
        ctx.fill();
        
        // Add the image to the map
        map.addImage('arrow-icon', { 
          data: ctx.getImageData(0, 0, size, size).data, 
          width: size, 
          height: size 
        });
      }
      
      // Since we now include arrows in the text labels, we'll disable the separate arrow markers
      // We'll keep the layer definition but make it invisible in case we want to revert this change
      map.addLayer({
        'id': 'route-arrows',
        'type': 'symbol',
        'source': 'route-arrows',
        'layout': {
          'symbol-placement': 'point',
          'icon-image': 'arrow-icon', // Custom arrow icon
          'icon-size': 0.5,
          'icon-rotate': ['get', 'bearing'],
          'icon-rotation-alignment': 'map',
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
          'symbol-sort-key': 2, // Ensure arrows appear above the line
          'visibility': 'none'  // Hide the arrows since they're now in the labels
        },
        'paint': {
          'icon-opacity': 0
        },
        'filter': ['!', ['has', 'isLabel']] // Only show arrows, not labels
      });
      
      // Add a layer for the leg labels with direct text property
      map.addLayer({
        'id': 'leg-labels',
        'type': 'symbol',
        'source': 'route-arrows',
        'layout': {
          'symbol-placement': 'point',
          'text-field': ['get', 'text'], // Use direct text field
          'text-size': 12,               // Slightly larger text for better readability
          'text-font': ['Arial Unicode MS Bold'],
          'text-offset': [0, -0.5],      // Position closer to the line
          'text-anchor': 'center',
          'text-rotate': ['get', 'textBearing'], // Use the adjusted bearing for proper orientation
          'text-rotation-alignment': 'map',
          'text-allow-overlap': true,
          'text-ignore-placement': true,
          'text-max-width': 12,          // Allow text to wrap to multiple lines
          'text-line-height': 1.2,       // Add some line spacing for multiline text
          'symbol-sort-key': 3           // Ensure labels appear above everything
        },
        'paint': {
          'text-color': '#ffffff',
          'text-halo-color': '#000000',
          'text-halo-width': 3,         // Thicker halo for better readability
          'text-opacity': 0.9
        },
        'filter': ['has', 'isLabel']     // Only show labels, not arrows
      });
      
      // Trigger route updated callback with coordinates
      const routeData = {
        waypoints: this.waypoints,
        coordinates: coordinates
      };
      this.triggerCallback('onRouteUpdated', routeData);
      
      // Always calculate basic distance even when no aircraft is selected
      // This ensures distance is displayed regardless of aircraft selection
      if (window.routeCalculator) {
        window.routeCalculator.calculateDistanceOnly(coordinates);
      }
    }
  }
  
  /**
   * Clear all waypoints and the route
   */
  clearRoute() {
    const map = this.mapManager.getMap();
    
    // Remove all markers
    this.markers.forEach(marker => {
      marker.remove();
    });
    
    this.markers = [];
    this.waypoints = [];
    
    // Remove route, glow, and arrows from map
    if (map) {
      // Remove route layers and source
      if (map.getSource('route')) {
        if (map.getLayer('route-glow')) {
          map.removeLayer('route-glow');
        }
        if (map.getLayer('route')) {
          map.removeLayer('route');
        }
        map.removeSource('route');
      }
      
      // Remove arrow layers, leg labels, and source
      if (map.getSource('route-arrows')) {
        if (map.getLayer('route-arrows')) {
          map.removeLayer('route-arrows');
        }
        if (map.getLayer('leg-labels')) {
          map.removeLayer('leg-labels');
        }
        map.removeSource('route-arrows');
      }
    }
    
    // Trigger callbacks
    this.triggerCallback('onChange', this.waypoints);
  }
  
  /**
   * Reorder waypoints based on drag and drop
   * @param {string} draggedId - The ID of the waypoint being dragged
   * @param {string} dropTargetId - The ID of the waypoint being dropped onto
   */
  reorderWaypoints(draggedId, dropTargetId) {
    const draggedIndex = this.waypoints.findIndex(wp => wp.id === draggedId);
    const dropTargetIndex = this.waypoints.findIndex(wp => wp.id === dropTargetId);
    
    if (draggedIndex === -1 || dropTargetIndex === -1) {
      console.error('Invalid waypoint IDs for reordering');
      return;
    }
    
    // Get the waypoint and marker being moved
    const movedWaypoint = this.waypoints[draggedIndex];
    const movedMarker = this.markers[draggedIndex];
    
    // Remove from current position
    this.waypoints.splice(draggedIndex, 1);
    this.markers.splice(draggedIndex, 1);
    
    // Insert at new position
    this.waypoints.splice(dropTargetIndex, 0, movedWaypoint);
    this.markers.splice(dropTargetIndex, 0, movedMarker);
    
    // Update route
    this.updateRoute();
    
    // Trigger callbacks
    console.log(`Reordered waypoint ${movedWaypoint.name} from index ${draggedIndex} to ${dropTargetIndex}`);
    this.triggerCallback('onChange', this.waypoints);
  }
  
  /**
   * Find the insertion index for a new waypoint when clicking on a path
   * @param {Object} clickedPoint - The clicked point {lng, lat}
   * @returns {number} - The index to insert at
   */
  findPathInsertIndex(clickedPoint) {
    if (this.waypoints.length < 2) return this.waypoints.length;
    
    let minDistance = Number.MAX_VALUE;
    let insertIndex = 1;
    
    try {
      for (let i = 0; i < this.waypoints.length - 1; i++) {
        const segment = window.turf.lineString([
          this.waypoints[i].coords,
          this.waypoints[i + 1].coords
        ]);
        
        const point = window.turf.point([clickedPoint.lng, clickedPoint.lat]);
        const nearestPoint = window.turf.nearestPointOnLine(segment, point, { units: 'nauticalmiles' });
        
        if (nearestPoint.properties.dist < minDistance) {
          minDistance = nearestPoint.properties.dist;
          insertIndex = i + 1;
        }
      }
    } catch (error) {
      console.error('Error finding path insert index:', error);
      // Default to adding at the end if there's an error
      return this.waypoints.length;
    }
    
    return insertIndex;
  }
  
  /**
   * Get all waypoints
   * @returns {Array} - Array of waypoint objects
   */
  getWaypoints() {
    return this.waypoints;
  }
  
  /**
   * Get a waypoint by ID
   * @param {string} id - The waypoint ID
   * @returns {Object|null} - The waypoint or null if not found
   */
  getWaypointById(id) {
    return this.waypoints.find(wp => wp.id === id) || null;
  }
  
  /**
   * Update a waypoint's name
   * @param {string} id - The waypoint ID
   * @param {string} name - The new name
   */
  updateWaypointName(id, name) {
    const waypoint = this.getWaypointById(id);
    if (waypoint) {
      waypoint.name = name;
      this.triggerCallback('onChange', this.waypoints);
    }
  }

  /**
   * Set up route dragging functionality
   * @param {Function} onRoutePointAdded - Callback when a new point is added via drag
   */
  setupRouteDragging(onRoutePointAdded) {
    const map = this.mapManager.getMap();
    if (!map) return;

    console.log('Setting up route dragging functionality');

    let isDragging = false;
    let draggedLineCoordinates = [];
    let originalLineCoordinates = [];
    let dragStartPoint = null;
    let closestPointIndex = -1;
    let dragLineSource = null;

    // Function to add the temporary drag line
    const addDragLine = (coordinates) => {
      try {
        if (map.getSource('drag-line')) {
          map.removeLayer('drag-line');
          map.removeSource('drag-line');
        }
        
        map.addSource('drag-line', {
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
        
        map.addLayer({
          'id': 'drag-line',
          'type': 'line',
          'source': 'drag-line',
          'layout': {
            'line-join': 'round',
            'line-cap': 'round'
          },
          'paint': {
            'line-color': '#ff0000', // Red for the dragging line
            'line-width': 4,
            'line-dasharray': [2, 1] // Dashed line for the temp route
          }
        });

        dragLineSource = map.getSource('drag-line');
      } catch (error) {
        console.error('Error adding drag line:', error);
      }
    };

    // Helper to find closest point on the line and the segment it belongs to
    const findClosestPointOnLine = (mouseLngLat, mousePoint) => {
      try {
        if (!map.getSource('route')) return null;
        
        // First check if the mouse is over a route feature using rendered features
        // This is more accurate than calculating distance and works better for user interaction
        const routeFeatures = map.queryRenderedFeatures(mousePoint, { layers: ['route'] });
        const isMouseOverRoute = routeFeatures && routeFeatures.length > 0;
        
        const routeSource = map.getSource('route');
        if (!routeSource || !routeSource._data) return null;
        
        const coordinates = routeSource._data.geometry.coordinates;
        if (!coordinates || coordinates.length < 2) return null;
        
        let minDistance = Infinity;
        let closestPoint = null;
        let segmentIndex = -1;
        
        // Check each segment of the line
        for (let i = 0; i < coordinates.length - 1; i++) {
          const line = window.turf.lineString([coordinates[i], coordinates[i + 1]]);
          const point = window.turf.point([mouseLngLat.lng, mouseLngLat.lat]);
          const snapped = window.turf.nearestPointOnLine(line, point);
          
          if (snapped.properties.dist < minDistance) {
            minDistance = snapped.properties.dist;
            closestPoint = snapped.geometry.coordinates;
            segmentIndex = i;
          }
        }
        
        // Convert distance to nautical miles for easy comparison
        const distanceNM = window.turf.distance(
          window.turf.point([mouseLngLat.lng, mouseLngLat.lat]),
          window.turf.point(closestPoint),
          { units: 'nauticalmiles' }
        );
        
        // If mouse is directly over the route (pixel-perfect), return regardless of distance
        // Otherwise use a more generous distance threshold (0.5 nautical miles)
        const maxDistanceThreshold = 0.5; // More generous distance in nautical miles
        
        if (isMouseOverRoute || distanceNM < maxDistanceThreshold) {
          return { 
            point: closestPoint, 
            index: segmentIndex,
            distance: distanceNM,
            isDirectlyOver: isMouseOverRoute
          };
        }
        
        return null;
      } catch (error) {
        console.error('Error finding closest point on line:', error);
        return null;
      }
    };

    // Setup mousedown event for starting the drag
    map.on('mousedown', (e) => {
      // Skip if no route or if clicking on a waypoint
      if (!map.getSource('route')) return;
      
      // Don't start drag if right-click
      if (e.originalEvent.button === 2) return;
      
      // Check for platform markers and don't start drag if clicked on one
      const platformFeatures = map.queryRenderedFeatures(e.point, { layers: ['platforms-layer'] });
      if (platformFeatures.length > 0) return;
      
      // Find the closest point on the route line
      const mousePos = e.lngLat;
      const closestInfo = findClosestPointOnLine(mousePos, e.point);
      
      // If mouse is directly over the route or within distance threshold
      if (closestInfo) {
        console.log('Starting route drag operation at segment:', closestInfo.index, 
                   'Distance:', closestInfo.distance.toFixed(2) + ' nm',
                   'Directly over route:', closestInfo.isDirectlyOver);
        
        // Get the original route coordinates
        const routeSource = map.getSource('route');
        if (!routeSource || !routeSource._data) return;
        originalLineCoordinates = [...routeSource._data.geometry.coordinates];
        
        // Start dragging
        isDragging = true;
        dragStartPoint = closestInfo.point;
        closestPointIndex = closestInfo.index;
        
        // Make a copy of the coordinates for dragging
        draggedLineCoordinates = [...originalLineCoordinates];
        
        // Insert a new point at the drag location, right after the closest segment start
        draggedLineCoordinates.splice(
          closestPointIndex + 1, 
          0, 
          closestInfo.point
        );
        
        // Add the temporary drag line
        addDragLine(draggedLineCoordinates);
        
        // Hide the original route and glow during dragging
        map.setLayoutProperty('route', 'visibility', 'none');
        if (map.getLayer('route-glow')) {
          map.setLayoutProperty('route-glow', 'visibility', 'none');
        }
        
        // Change cursor to grabbing
        map.getCanvas().style.cursor = 'grabbing';
        
        // Prevent default behavior
        e.preventDefault();
      }
    });

    // Set up route hover effect to make it clear it can be dragged
    map.on('mousemove', (e) => {
      if (isDragging) {
        // Update the position of the dragged point
        draggedLineCoordinates[closestPointIndex + 1] = [e.lngLat.lng, e.lngLat.lat];
        
        // Update the drag line
        if (dragLineSource) {
          dragLineSource.setData({
            'type': 'Feature',
            'properties': {},
            'geometry': {
              'type': 'LineString',
              'coordinates': draggedLineCoordinates
            }
          });
        }
      } else {
        // Check if mouse is over the route when not dragging
        const closestInfo = findClosestPointOnLine(e.lngLat, e.point);
        
        if (closestInfo && closestInfo.isDirectlyOver) {
          // Change cursor to indicate draggable route
          map.getCanvas().style.cursor = 'pointer';
        } else if (map.getCanvas().style.cursor === 'pointer') {
          // Reset cursor if it was previously set by this handler
          // (but don't reset if it might have been set by platform hover)
          const platformFeatures = map.queryRenderedFeatures(e.point, { layers: ['platforms-layer'] });
          if (platformFeatures.length === 0) {
            map.getCanvas().style.cursor = '';
          }
        }
      }
    });

    // Setup mouseup for completing the drag
    map.on('mouseup', (e) => {
      if (!isDragging) return;
      
      // Clean up
      isDragging = false;
      
      // Remove the temporary drag line
      if (map.getSource('drag-line')) {
        map.removeLayer('drag-line');
        map.removeSource('drag-line');
      }
      
      // Show the original route and glow again
      map.setLayoutProperty('route', 'visibility', 'visible');
      if (map.getLayer('route-glow')) {
        map.setLayoutProperty('route-glow', 'visibility', 'visible');
      }
      
      // Call the callback with the segment index and new point
      if (onRoutePointAdded && typeof onRoutePointAdded === 'function') {
        console.log('Route drag complete, adding new point at index:', closestPointIndex + 1);
        onRoutePointAdded(closestPointIndex + 1, [e.lngLat.lng, e.lngLat.lat]);
      }
      
      // Reset cursor
      map.getCanvas().style.cursor = '';
      
      // Reset variables
      draggedLineCoordinates = [];
      originalLineCoordinates = [];
      dragStartPoint = null;
      closestPointIndex = -1;
      dragLineSource = null;
    });

    // Cancel the drag operation if the mouse leaves the map
    map.on('mouseout', () => {
      if (!isDragging) return;
      
      console.log('Mouse left map area, canceling route drag');
      
      // Clean up
      isDragging = false;
      
      // Remove the temporary drag line
      if (map.getSource('drag-line')) {
        map.removeLayer('drag-line');
        map.removeSource('drag-line');
      }
      
      // Show the original route and glow again
      map.setLayoutProperty('route', 'visibility', 'visible');
      if (map.getLayer('route-glow')) {
        map.setLayoutProperty('route-glow', 'visibility', 'visible');
      }
      
      // Reset cursor
      map.getCanvas().style.cursor = '';
      
      // Reset variables
      draggedLineCoordinates = [];
      originalLineCoordinates = [];
      dragStartPoint = null;
      closestPointIndex = -1;
      dragLineSource = null;
    });
  }
}

export default WaypointManager;
