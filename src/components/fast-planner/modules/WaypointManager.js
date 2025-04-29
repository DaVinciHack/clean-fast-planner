/**
 * WaypointManager.js
 * 
 * Handles waypoint creation, deletion, and manipulation
 */

class WaypointManager {
  constructor(mapManager) {
    this.mapManager = mapManager;
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
            this.waypoints[index].coords = [lngLat.lng, lngLat.lat];
            this.updateRoute();
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
        color: "#40c8f0", // Turquoise/light blue 
        draggable: true,
        scale: 0.6 // Make it smaller (60% of normal size)
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
      
      // Determine number of arrows based on segment length
      let numArrows = 2; // Default to 2 arrows per segment
      
      // If segment is short (less than 5 nm), only use 1 arrow
      if (distance < 5) {
        numArrows = 1;
      }
      
      // Calculate positions for arrows along the segment
      for (let j = 1; j <= numArrows; j++) {
        // Calculate fraction based on number of arrows
        // For 1 arrow: place at 0.5 (middle)
        // For 2 arrows: place at 0.33 and 0.66
        const fraction = (j) / (numArrows + 1);
        
        // Find the point a fraction of the way along the segment
        const arrowPoint = window.turf.along(
          window.turf.lineString([startPoint, endPoint]),
          distance * fraction,
          { units: 'nauticalmiles' }
        );
        
        // Add arrow feature at this point
        features.push({
          type: 'Feature',
          geometry: arrowPoint.geometry,
          properties: {
            bearing: bearing
          }
        });
      }
      
      // Add leg info label at middle of the segment
      if (distance >= 2) { // Only add labels for segments longer than 2 nm
        // Calculate time for this leg if aircraft speed is available
        let legTime = '';
        let legFuel = '';
        
        if (routeStats && routeStats.aircraft && routeStats.aircraft.cruiseSpeed) {
          const speed = routeStats.aircraft.cruiseSpeed;
          const timeHours = distance / speed;
          
          // Format time as MM:SS for this leg
          const minutes = Math.floor(timeHours * 60);
          const seconds = Math.floor((timeHours * 60 - minutes) * 60);
          legTime = `${minutes}m${seconds.toString().padStart(2, '0')}s`;
          
          // Calculate fuel for this leg
          if (routeStats.aircraft.fuelBurn) {
            const fuelBurn = routeStats.aircraft.fuelBurn;
            legFuel = Math.round(timeHours * fuelBurn);
          }
        }
        
        // Find the midpoint of the segment
        const midpointFraction = 0.5;
        const midPoint = window.turf.along(
          window.turf.lineString([startPoint, endPoint]),
          distance * midpointFraction,
          { units: 'nauticalmiles' }
        );
        
        // Add label feature at midpoint with leg info
        const props = {
          isLabel: true,
          bearing: bearing,
          distance: distance.toFixed(1),
          legIndex: i
        };
        
        // Only add time and fuel if they exist
        if (legTime) props.time = legTime;
        if (legFuel) props.fuel = legFuel;
        
        features.push({
          type: 'Feature',
          geometry: midPoint.geometry,
          properties: props
        });
      }
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
    // Remove the marker
    if (this.markers[index]) {
      this.markers[index].remove();
    }
    
    // Remove from arrays
    this.markers.splice(index, 1);
    const removedWaypoint = this.waypoints.find(wp => wp.id === id);
    this.waypoints = this.waypoints.filter(wp => wp.id !== id);
    
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
      
      // Add a layer for the arrows
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
          'symbol-sort-key': 2 // Ensure arrows appear above the line
        },
        'paint': {
          'icon-opacity': 0.9
        },
        'filter': ['!', ['has', 'isLabel']] // Only show arrows, not labels
      });
      
      // Add a layer for the leg labels
      map.addLayer({
        'id': 'leg-labels',
        'type': 'symbol',
        'source': 'route-arrows',
        'layout': {
          'symbol-placement': 'point',
          'text-field': [
            'concat',
            ['get', 'distance'], ' nm',
            ['has', 'time'], ['\n', ['get', 'time']], [''],
            ['has', 'fuel'], ['\n', ['get', 'fuel'], ' lbs'], ['']
          ],
          'text-size': 12,
          'text-font': ['Arial Unicode MS Bold'],
          'text-offset': [0, 0.5],
          'text-anchor': 'center',
          'text-rotate': ['get', 'bearing'],
          'text-rotation-alignment': 'map',
          'text-allow-overlap': true,
          'text-ignore-placement': true,
          'symbol-sort-key': 3 // Ensure labels appear above everything
        },
        'paint': {
          'text-color': '#ffffff',
          'text-halo-color': '#000000',
          'text-halo-width': 2
        },
        'filter': ['has', 'isLabel'] // Only show labels, not arrows
      });
      
      // Trigger route updated callback
      this.triggerCallback('onRouteUpdated', {
        waypoints: this.waypoints,
        coordinates: coordinates
      });
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
}

export default WaypointManager;
