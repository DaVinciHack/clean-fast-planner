/**
 * RouteManager.js
 * 
 * Handles the creation, updating, and management of flight routes,
 * including legs, stops, and waypoints
 */

import { Flight, Leg, Stop, Waypoint } from '../models/FlightModel';

class RouteManager {
  /**
   * Initialize the RouteManager
   * @param {Object} mapManager - Map manager instance
   * @param {Object} platformManager - Platform manager instance (optional)
   */
  constructor(mapManager, platformManager = null) {
    this.mapManager = mapManager;
    this.platformManager = platformManager;
    this.currentFlight = null;
    this.editMode = 'stops'; // 'stops' or 'waypoints'
    this.markers = []; // All markers (both stops and waypoints)
    this.activeRoutes = []; // Visual representation of routes
    this.activeLegIndex = -1; // Currently active leg for waypoint editing
    
    // Callbacks
    this.callbacks = {
      onChange: null,
      onStopAdded: null,
      onWaypointAdded: null,
      onPointRemoved: null,
      onRouteUpdated: null
    };
    
    // Create global reference for use in event handlers
    window.routeManager = this;
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
   * @param {string} type - The callback type
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
   * Create a new flight
   * @param {string} name - Flight name/number
   * @param {Object} aircraft - Aircraft object
   * @returns {Flight} The new flight
   */
  createNewFlight(name, aircraft) {
    this.currentFlight = new Flight(`new-${Date.now()}`, name, aircraft, []);
    return this.currentFlight;
  }
  
  /**
   * Set the current flight
   * @param {Flight} flight - Flight object
   */
  setCurrentFlight(flight) {
    this.currentFlight = flight;
    this.updateMapDisplay();
    this.triggerCallback('onChange', this.currentFlight);
  }
  
  /**
   * Get the current flight
   * @returns {Flight} The current flight
   */
  getCurrentFlight() {
    return this.currentFlight;
  }
  
  /**
   * Set edit mode - 'stops' or 'waypoints'
   * @param {string} mode - 'stops' or 'waypoints'
   */
  setEditMode(mode) {
    if (mode !== 'stops' && mode !== 'waypoints') {
      console.error('Invalid edit mode:', mode);
      return;
    }
    
    this.editMode = mode;
    console.log(`Edit mode changed to: ${mode}`);
    
    // Update visual style of markers based on mode
    this.updateMapDisplay();
    
    // Dispatch event for other components to react to mode change
    const event = new CustomEvent('edit-mode-changed', { 
      detail: { mode: this.editMode } 
    });
    window.dispatchEvent(event);
  }
  
  /**
   * Get current edit mode
   * @returns {string} Current edit mode
   */
  getEditMode() {
    return this.editMode;
  }
  
  /**
   * Set the active leg for waypoint editing
   * @param {number} legIndex - Index of the leg
   */
  setActiveLeg(legIndex) {
    if (!this.currentFlight || !this.currentFlight.legs) {
      console.error('No flight or legs to set active');
      return;
    }
    
    if (legIndex < 0 || legIndex >= this.currentFlight.legs.length) {
      console.error('Invalid leg index:', legIndex);
      return;
    }
    
    this.activeLegIndex = legIndex;
    console.log(`Active leg set to: ${legIndex}`);
    
    // Update visual style to highlight active leg
    this.updateMapDisplay();
    
    // Switch to waypoints mode automatically
    this.setEditMode('waypoints');
  }
  
  /**
   * Add a stop to the route
   * @param {Array} coords - [lng, lat] coordinates
   * @param {string} name - Stop name
   * @returns {Stop} The added stop
   */
  addStop(coords, name) {
    if (!this.currentFlight) {
      console.error('No current flight to add stop to');
      return null;
    }
    
    if (!coords || coords.length !== 2) {
      console.error('Invalid coordinates for stop');
      return null;
    }
    
    console.log(`Adding stop at coordinates: ${coords} with name: ${name || 'Unnamed'}`);
    
    // Look up location by coordinates if name not provided or if using nearest platform
    let stopName = name;
    let locationType = 'UNKNOWN';
    let shouldSnapToNearby = !name; // Snap to nearby platform if no name provided
    
    if (shouldSnapToNearby && this.platformManager) {
      // Find nearest platform within 2nm
      const nearestPlatform = this.platformManager.findNearestPlatform(coords[1], coords[0], 2);
      
      if (nearestPlatform) {
        console.log(`Found nearest platform: ${nearestPlatform.name} (${nearestPlatform.distance.toFixed(2)} nm)`);
        stopName = nearestPlatform.name;
        locationType = nearestPlatform.type || 'RIG';
        
        // Update coords to exact platform position
        coords = [nearestPlatform.longitude, nearestPlatform.latitude];
      }
    }
    
    // If still no name, generate one
    if (!stopName) {
      const stopIndex = this.currentFlight.getAllStops().length;
      stopName = `Stop ${stopIndex + 1}`;
    }
    
    // Create stop object
    const stop = new Stop(stopName, coords[1], coords[0], locationType);
    
    // Create marker on the map
    const marker = this.createStopMarker(coords, stopName);
    this.markers.push(marker);
    
    // Add to flight - determine if it's the first stop or creating a new leg
    if (this.currentFlight.legs.length === 0) {
      // This is the first stop - create a dummy leg with just a departure
      const dummyLeg = new Leg(`leg-${Date.now()}`, stop, null);
      this.currentFlight.legs.push(dummyLeg);
    } else {
      // Check if the last leg has a destination
      const lastLeg = this.currentFlight.legs[this.currentFlight.legs.length - 1];
      
      if (!lastLeg.to) {
        // Last leg doesn't have a destination, set it
        lastLeg.to = stop;
      } else {
        // Last leg already has both stops, create a new leg
        const newLeg = new Leg(`leg-${Date.now()}`, lastLeg.to, stop);
        this.currentFlight.legs.push(newLeg);
      }
    }
    
    // Update the map display
    this.updateMapDisplay();
    
    // Trigger callbacks
    this.triggerCallback('onStopAdded', stop);
    this.triggerCallback('onChange', this.currentFlight);
    
    return stop;
  }
  
  /**
   * Add a waypoint to the active leg
   * @param {Array} coords - [lng, lat] coordinates
   * @param {string} name - Waypoint name
   * @returns {Waypoint} The added waypoint
   */
  addWaypoint(coords, name) {
    if (!this.currentFlight) {
      console.error('No current flight to add waypoint to');
      return null;
    }
    
    if (this.activeLegIndex < 0 || this.activeLegIndex >= this.currentFlight.legs.length) {
      console.error('No active leg to add waypoint to');
      return null;
    }
    
    const activeLeg = this.currentFlight.legs[this.activeLegIndex];
    
    if (!activeLeg.from || !activeLeg.to) {
      console.error('Active leg does not have both stops');
      return null;
    }
    
    if (!coords || coords.length !== 2) {
      console.error('Invalid coordinates for waypoint');
      return null;
    }
    
    console.log(`Adding waypoint at coordinates: ${coords} with name: ${name || 'Unnamed'}`);
    
    // Look up location by coordinates if name not provided or if using nearest platform
    let waypointName = name;
    let locationType = 'WAYPOINT';
    let shouldSnapToNearby = !name; // Snap to nearby platform if no name provided
    
    if (shouldSnapToNearby && this.platformManager) {
      // Find nearest platform within 2nm
      const nearestPlatform = this.platformManager.findNearestPlatform(coords[1], coords[0], 2);
      
      if (nearestPlatform) {
        console.log(`Found nearest platform: ${nearestPlatform.name} (${nearestPlatform.distance.toFixed(2)} nm)`);
        waypointName = nearestPlatform.name;
        locationType = nearestPlatform.type || 'RIG';
        
        // Update coords to exact platform position
        coords = [nearestPlatform.longitude, nearestPlatform.latitude];
      }
    }
    
    // If still no name, generate one
    if (!waypointName) {
      const wpIndex = activeLeg.waypoints.length;
      waypointName = `WP ${wpIndex + 1}`;
    }
    
    // Create waypoint object
    const waypoint = new Waypoint(waypointName, coords[1], coords[0], locationType);
    
    // Create marker on the map
    const marker = this.createWaypointMarker(coords, waypointName);
    this.markers.push(marker);
    
    // Determine the insertion point
    const insertIndex = this.findBestWaypointInsertionIndex(activeLeg, coords);
    
    // Add to leg waypoints at the right position
    activeLeg.waypoints.splice(insertIndex, 0, waypoint);
    
    // Update the map display
    this.updateMapDisplay();
    
    // Trigger callbacks
    this.triggerCallback('onWaypointAdded', waypoint);
    this.triggerCallback('onChange', this.currentFlight);
    
    return waypoint;
  }
  
  /**
   * Find best insertion index for a waypoint in a leg
   * @param {Leg} leg - The leg to add the waypoint to
   * @param {Array} coords - [lng, lat] coordinates
   * @returns {number} The best insertion index
   */
  findBestWaypointInsertionIndex(leg, coords) {
    if (!leg || !leg.from || !leg.to || !coords || coords.length !== 2) {
      return 0; // Default to beginning if invalid input
    }
    
    const allPoints = leg.getAllPoints();
    if (allPoints.length < 2) {
      return 0;
    }
    
    // Find the closest segment
    let minDistance = Infinity;
    let bestIndex = 0;
    
    for (let i = 0; i < allPoints.length - 1; i++) {
      const start = allPoints[i];
      const end = allPoints[i + 1];
      
      // Skip the from-to connection if there are waypoints
      if (i === 0 && leg.waypoints.length > 0) {
        continue;
      }
      
      // Calculate closest point on segment
      try {
        const segment = window.turf.lineString([
          [start.lon, start.lat],
          [end.lon, end.lat]
        ]);
        
        const point = window.turf.point(coords);
        const nearestPoint = window.turf.nearestPointOnLine(segment, point);
        
        if (nearestPoint.properties.dist < minDistance) {
          minDistance = nearestPoint.properties.dist;
          bestIndex = i;
        }
      } catch (error) {
        console.error('Error finding best insertion point:', error);
      }
    }
    
    // Return the index after the start point of the closest segment
    // This is the insertion index in the waypoints array
    // Convert from 'all points' index to 'waypoints' index
    // Example: If best segment is between from and wp1, insert at index 0 in waypoints
    return bestIndex;
  }
  
  /**
   * Create a marker for a stop
   * @param {Array} coords - [lng, lat] coordinates
   * @param {string} name - Stop name
   * @returns {Object} Marker object
   */
  createStopMarker(coords, name) {
    try {
      const map = this.mapManager.getMap();
      if (!map) {
        console.error('Cannot create stop marker: Map is not initialized');
        return null;
      }
      
      if (!window.mapboxgl) {
        console.error('Cannot create stop marker: MapboxGL is not loaded');
        return null;
      }
      
      // Create a larger marker with a custom color for stops
      const marker = new window.mapboxgl.Marker({
        color: '#e74c3c', // Red color for stops
        draggable: true,
        scale: 0.8 // Larger than waypoints
      })
        .setLngLat(coords)
        .addTo(map);
      
      // Add popup with name and coordinates
      const popup = new window.mapboxgl.Popup({
        closeButton: true,
        closeOnClick: false,
        offset: 25,
        className: 'stop-popup',
        maxWidth: '300px'
      });
      
      const displayName = name || 'Stop';
      
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
      
      // Add drag end event to update route
      marker.on('dragend', () => {
        this.handleMarkerDragEnd(marker);
      });
      
      // Store reference to original name and marker type
      marker.originalName = name;
      marker.isStop = true;
      
      return marker;
    } catch (error) {
      console.error('Error creating stop marker:', error);
      return null;
    }
  }
  
  /**
   * Create a marker for a waypoint
   * @param {Array} coords - [lng, lat] coordinates
   * @param {string} name - Waypoint name
   * @returns {Object} Marker object
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
      
      // Create a smaller marker with a custom color for waypoints
      const marker = new window.mapboxgl.Marker({
        color: '#3498db', // Blue color for waypoints
        draggable: true,
        scale: 0.6 // Smaller than stops
      })
        .setLngLat(coords)
        .addTo(map);
      
      // Add popup with name and coordinates
      const popup = new window.mapboxgl.Popup({
        closeButton: true,
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
      
      // Add drag end event to update route
      marker.on('dragend', () => {
        this.handleMarkerDragEnd(marker);
      });
      
      // Store reference to original name and marker type
      marker.originalName = name;
      marker.isStop = false;
      
      return marker;
    } catch (error) {
      console.error('Error creating waypoint marker:', error);
      return null;
    }
  }
  
  /**
   * Handle marker drag end event
   * @param {Object} marker - The marker that was dragged
   */
  handleMarkerDragEnd(marker) {
    if (!this.currentFlight) {
      console.error('No current flight to update after drag');
      return;
    }
    
    const markerIndex = this.markers.indexOf(marker);
    if (markerIndex === -1) {
      console.error('Marker not found in markers array');
      return;
    }
    
    const lngLat = marker.getLngLat();
    console.log(`Marker at index ${markerIndex} dragged to [${lngLat.lng}, ${lngLat.lat}]`);
    
    // Find the corresponding point in the flight
    const point = this.findPointByMarkerIndex(markerIndex);
    if (!point) {
      console.error('Could not find point corresponding to marker');
      return;
    }
    
    // Check for nearest platform to the new location and update name if found
    if (this.platformManager) {
      const nearestPlatform = this.platformManager.findNearestPlatform(lngLat.lat, lngLat.lng, 2);
      
      if (nearestPlatform) {
        console.log(`Found nearest platform after drag: ${nearestPlatform.name} (${nearestPlatform.distance.toFixed(2)} nm)`);
        
        // Update the point name with the platform name
        point.name = nearestPlatform.name;
        console.log(`Updated point name to: ${nearestPlatform.name}`);
        
        // Update marker.originalName for future reference
        marker.originalName = nearestPlatform.name;
      }
    }
    
    // Update point coordinates
    point.lat = lngLat.lat;
    point.lon = lngLat.lng;
    
    // Update the map display
    this.updateMapDisplay();
    
    // Trigger callbacks
    this.triggerCallback('onChange', this.currentFlight);
  }
  
  /**
   * Find a point in the flight by marker index
   * @param {number} markerIndex - Index in the markers array
   * @returns {Object|null} The point (stop or waypoint) or null if not found
   */
  findPointByMarkerIndex(markerIndex) {
    if (!this.currentFlight || markerIndex < 0 || markerIndex >= this.markers.length) {
      return null;
    }
    
    const marker = this.markers[markerIndex];
    if (!marker) return null;
    
    // Get all points in order
    const allPoints = [];
    
    // Collect all points from all legs
    this.currentFlight.legs.forEach((leg, legIndex) => {
      if (legIndex === 0) {
        // For first leg, add departure
        allPoints.push(leg.from);
      }
      
      // Add waypoints for this leg
      allPoints.push(...leg.waypoints);
      
      // Add destination if it exists
      if (leg.to) {
        allPoints.push(leg.to);
      }
    });
    
    // If marker count matches point count, use direct index
    if (this.markers.length === allPoints.length) {
      return allPoints[markerIndex];
    }
    
    // Otherwise, try to match by position
    const markerPos = marker.getLngLat();
    
    // Find point with closest position to marker
    let closestPoint = null;
    let closestDistance = Infinity;
    
    allPoints.forEach(point => {
      const distance = this.calculateDistance(
        markerPos.lat, markerPos.lng,
        point.lat, point.lon
      );
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestPoint = point;
      }
    });
    
    // Use a small threshold to ensure we're getting the right point
    if (closestDistance < 0.1) { // 0.1 nm threshold
      return closestPoint;
    }
    
    return null;
  }
  
  /**
   * Calculate distance between two points
   * @param {number} lat1 - Latitude of first point
   * @param {number} lon1 - Longitude of first point
   * @param {number} lat2 - Latitude of second point
   * @param {number} lon2 - Longitude of second point
   * @returns {number} Distance in nautical miles
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    if (window.turf) {
      try {
        return window.turf.distance(
          window.turf.point([lon1, lat1]),
          window.turf.point([lon2, lat2]),
          { units: 'nauticalmiles' }
        );
      } catch (error) {
        console.error('Error calculating distance with turf:', error);
      }
    }
    
    // Fallback calculation if turf is not available
    const R = 3440.065; // Earth radius in nautical miles
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
  
  /**
   * Convert degrees to radians
   * @param {number} degrees - Angle in degrees
   * @returns {number} Angle in radians
   */
  toRadians(degrees) {
    return degrees * Math.PI / 180;
  }
  
  /**
   * Update the map display to show the current flight
   */
  updateMapDisplay() {
    if (!this.currentFlight || !this.mapManager) {
      console.log('No flight or map manager to update display');
      return;
    }
    
    const map = this.mapManager.getMap();
    if (!map) {
      console.error('Map is not initialized');
      return;
    }
    
    // Clear existing markers
    this.markers.forEach(marker => {
      try {
        marker.remove();
      } catch (error) {
        console.error('Error removing marker:', error);
      }
    });
    this.markers = [];
    
    // Clear existing routes
    this.activeRoutes.forEach(layerId => {
      try {
        if (map.getLayer(layerId)) {
          map.removeLayer(layerId);
        }
        if (map.getSource(layerId)) {
          map.removeSource(layerId);
        }
      } catch (error) {
        console.error(`Error removing layer or source ${layerId}:`, error);
      }
    });
    this.activeRoutes = [];
    
    // If no flight or no legs, nothing to display
    if (!this.currentFlight || !this.currentFlight.legs || this.currentFlight.legs.length === 0) {
      return;
    }
    
    // Add markers for all stops and waypoints
    this.currentFlight.legs.forEach((leg, legIndex) => {
      // Add marker for departure on first leg only
      if (legIndex === 0 && leg.from) {
        const marker = this.createStopMarker(
          [leg.from.lon, leg.from.lat],
          leg.from.name
        );
        if (marker) this.markers.push(marker);
      }
      
      // Add markers for waypoints
      leg.waypoints.forEach((waypoint) => {
        const marker = this.createWaypointMarker(
          [waypoint.lon, waypoint.lat],
          waypoint.name
        );
        if (marker) this.markers.push(marker);
      });
      
      // Add marker for destination if it exists
      if (leg.to) {
        const marker = this.createStopMarker(
          [leg.to.lon, leg.to.lat],
          leg.to.name
        );
        if (marker) this.markers.push(marker);
      }
      
      // Draw route line for this leg
      if (leg.from && leg.to) {
        this.drawLegRoute(leg, legIndex);
      }
    });
    
    // Trigger callback to notify that the route has been updated
    this.triggerCallback('onRouteUpdated', this.currentFlight);
  }
  
  /**
   * Draw a route line for a leg
   * @param {Leg} leg - The leg to draw
   * @param {number} legIndex - Index of the leg in the flight
   */
  drawLegRoute(leg, legIndex) {
    if (!leg || !leg.from || !leg.to) {
      console.error('Cannot draw route for incomplete leg');
      return;
    }
    
    const map = this.mapManager.getMap();
    if (!map) {
      console.error('Map is not initialized');
      return;
    }
    
    // Get all points in this leg
    const coordinates = leg.getCoordinates();
    if (coordinates.length < 2) {
      console.error('Not enough coordinates to draw route');
      return;
    }
    
    // Create source ID and layer IDs
    const sourceId = `leg-${legIndex}-route`;
    const lineLayerId = `${sourceId}-line`;
    const glowLayerId = `${sourceId}-glow`;
    
    // Add source
    map.addSource(sourceId, {
      'type': 'geojson',
      'data': {
        'type': 'Feature',
        'properties': {
          'legIndex': legIndex,
          'isActive': legIndex === this.activeLegIndex
        },
        'geometry': {
          'type': 'LineString',
          'coordinates': coordinates
        }
      }
    });
    
    // Determine line color based on whether this is the active leg
    const lineColor = legIndex === this.activeLegIndex ? '#3498db' : '#007bff';
    
    // Add glow layer
    map.addLayer({
      'id': glowLayerId,
      'type': 'line',
      'source': sourceId,
      'layout': {
        'line-join': 'round',
        'line-cap': 'round',
        'visibility': 'visible',
        'line-sort-key': 0 // Ensure it appears below the main line
      },
      'paint': {
        'line-color': '#ffffff',
        'line-width': 10,
        'line-opacity': 0.15,
        'line-blur': 3
      }
    });
    
    // Add route line
    map.addLayer({
      'id': lineLayerId,
      'type': 'line',
      'source': sourceId,
      'layout': {
        'line-join': 'round',
        'line-cap': 'round',
        'line-sort-key': 1 // Ensure it appears above the glow but below symbols
      },
      'paint': {
        'line-color': lineColor,
        'line-width': 6,
        'line-opacity': 0.8
      }
    });
    
    // Store layer IDs for later removal
    this.activeRoutes.push(sourceId, lineLayerId, glowLayerId);
    
    // Add leg labels with distance, time, etc.
    this.addLegLabels(leg, legIndex);
  }
  
  /**
   * Add labels to a leg route
   * @param {Leg} leg - The leg to label
   * @param {number} legIndex - Index of the leg in the flight
   */
  addLegLabels(leg, legIndex) {
    if (!leg || !leg.from || !leg.to) {
      console.error('Cannot add labels for incomplete leg');
      return;
    }
    
    const map = this.mapManager.getMap();
    if (!map) {
      console.error('Map is not initialized');
      return;
    }
    
    // Create source ID and layer ID
    const sourceId = `leg-${legIndex}-labels`;
    const layerId = `${sourceId}-layer`;
    
    // Calculate midpoint of the leg
    const from = [leg.from.lon, leg.from.lat];
    const to = [leg.to.lon, leg.to.lat];
    
    // Calculate distance
    let distance = 0;
    if (window.turf) {
      try {
        distance = window.turf.distance(
          window.turf.point(from),
          window.turf.point(to),
          { units: 'nauticalmiles' }
        );
      } catch (error) {
        console.error('Error calculating distance with turf:', error);
      }
    }
    
    // Find the midpoint
    let midpoint = null;
    if (window.turf) {
      try {
        const line = window.turf.lineString([from, to]);
        midpoint = window.turf.along(line, distance / 2, { units: 'nauticalmiles' });
      } catch (error) {
        console.error('Error calculating midpoint with turf:', error);
      }
    }
    
    // If midpoint calculation failed, use simple average
    if (!midpoint) {
      midpoint = {
        geometry: {
          coordinates: [
            (from[0] + to[0]) / 2,
            (from[1] + to[1]) / 2
          ]
        }
      };
    }
    
    // Calculate bearing
    let bearing = 0;
    if (window.turf) {
      try {
        bearing = window.turf.bearing(
          window.turf.point(from),
          window.turf.point(to)
        );
      } catch (error) {
        console.error('Error calculating bearing with turf:', error);
      }
    }
    
    // Create label text
    const distanceText = `${distance.toFixed(1)} nm`;
    
    // If we have additional leg data (time, fuel), include it
    let labelText = distanceText;
    if (leg.time) {
      const timeMinutes = Math.round(leg.time * 60);
      labelText += ` • ${timeMinutes}m`;
    }
    if (leg.fuel) {
      labelText += ` • ${Math.round(leg.fuel)} lbs`;
    }
    
    // Determine arrow based on direction
    const goingLeftToRight = to[0] > from[0];
    const leftArrow = '←';
    const rightArrow = '→';
    
    // Add arrow to the beginning or end
    if (!goingLeftToRight) {
      labelText = leftArrow + ' ' + labelText;
    } else {
      labelText = labelText + ' ' + rightArrow;
    }
    
    // Calculate adjusted bearing for text
    let textBearing = bearing + 90;
    if (textBearing > 90 && textBearing < 270) {
      textBearing = (textBearing + 180) % 360;
    }
    
    // Add source
    map.addSource(sourceId, {
      'type': 'geojson',
      'data': {
        'type': 'FeatureCollection',
        'features': [
          {
            'type': 'Feature',
            'geometry': {
              'type': 'Point',
              'coordinates': midpoint.geometry.coordinates
            },
            'properties': {
              'text': labelText,
              'bearing': bearing,
              'textBearing': textBearing
            }
          }
        ]
      }
    });
    
    // Add label layer
    map.addLayer({
      'id': layerId,
      'type': 'symbol',
      'source': sourceId,
      'layout': {
        'text-field': ['get', 'text'],
        'text-size': 11,
        'text-font': ['Arial Unicode MS Bold'],
        'text-offset': [0, -0.5],
        'text-anchor': 'center',
        'text-rotate': ['get', 'textBearing'],
        'text-rotation-alignment': 'map',
        'text-allow-overlap': true,
        'text-ignore-placement': true,
        'text-max-width': 30,
        'text-line-height': 1.0,
        'symbol-sort-key': 3
      },
      'paint': {
        'text-color': '#ffffff',
        'text-halo-color': '#000000',
        'text-halo-width': 3,
        'text-opacity': 0.9
      }
    });
    
    // Store layer IDs for later removal
    this.activeRoutes.push(sourceId, layerId);
  }
  
  /**
   * Handle adding a point from a map click
   * @param {Object} data - Click data with coordinates, etc.
   */
  handleMapClick(data) {
    // Allow clicks to add points only when not in route drag mode
    if (data && data.lngLat) {
      const coords = [data.lngLat.lng, data.lngLat.lat];
      
      // Process differently based on edit mode
      if (this.editMode === 'stops') {
        // In stops mode, add a stop
        this.addStop(coords);
      } else if (this.editMode === 'waypoints' && this.activeLegIndex >= 0) {
        // In waypoints mode with an active leg, add a waypoint
        this.addWaypoint(coords);
      } else {
        console.log('Cannot add waypoint: No active leg selected');
      }
    }
  }
  
  /**
   * Setup route dragging to add waypoints
   */
  setupRouteDragging() {
    const map = this.mapManager.getMap();
    if (!map) {
      console.error('Cannot setup route dragging: Map is not initialized');
      return;
    }
    
    console.log('Setting up route dragging functionality');
    
    let isDragging = false;
    let draggedLineCoordinates = [];
    let originalLineCoordinates = [];
    let dragStartPoint = null;
    let closestPointIndex = -1;
    let dragLineSource = null;
    let activeRouteLegIndex = -1;
    
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
            'line-color': '#ff0000',
            'line-width': 4,
            'line-dasharray': [2, 1]
          }
        });
        
        dragLineSource = map.getSource('drag-line');
      } catch (error) {
        console.error('Error adding drag line:', error);
      }
    };
    
    // Helper to find closest point on a line
    const findClosestPointOnLine = (mouseLngLat, mousePoint, legIndex) => {
      try {
        // Skip if we don't have a valid leg index or leg
        if (legIndex < 0 || !this.currentFlight || !this.currentFlight.legs || 
            legIndex >= this.currentFlight.legs.length) {
          return null;
        }
        
        // Get the leg and its coordinates
        const leg = this.currentFlight.legs[legIndex];
        if (!leg || !leg.from || !leg.to) {
          return null;
        }
        
        // Check if mouse is over a route feature
        const routeFeatures = map.queryRenderedFeatures(mousePoint, { 
          layers: [`leg-${legIndex}-route-line`] 
        });
        const isMouseOverRoute = routeFeatures && routeFeatures.length > 0;
        
        // Get coordinates from leg
        const coordinates = leg.getCoordinates();
        if (!coordinates || coordinates.length < 2) {
          return null;
        }
        
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
        
        // Convert distance to nautical miles
        const distanceNM = window.turf.distance(
          window.turf.point([mouseLngLat.lng, mouseLngLat.lat]),
          window.turf.point(closestPoint),
          { units: 'nauticalmiles' }
        );
        
        // Return if mouse is directly over the route or within distance threshold
        const maxDistanceThreshold = 0.5; // 0.5 nm threshold
        if (isMouseOverRoute || distanceNM < maxDistanceThreshold) {
          return { 
            point: closestPoint, 
            index: segmentIndex,
            distance: distanceNM,
            isDirectlyOver: isMouseOverRoute,
            legIndex: legIndex
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
      // Skip if right-click or if no flight or if in stops mode
      if (e.originalEvent.button === 2 || !this.currentFlight || this.editMode !== 'waypoints') {
        return;
      }
      
      // Check for platform markers and don't start drag if clicked on one
      const features = map.queryRenderedFeatures(e.point, { 
        layers: ['platforms-layer'] 
      });
      if (features.length > 0) return;
      
      // Try to find closest point on any leg route
      let closestInfo = null;
      let bestDistance = Infinity;
      
      for (let i = 0; i < this.currentFlight.legs.length; i++) {
        const legClosestInfo = findClosestPointOnLine(e.lngLat, e.point, i);
        if (legClosestInfo && legClosestInfo.distance < bestDistance) {
          closestInfo = legClosestInfo;
          bestDistance = legClosestInfo.distance;
        }
      }
      
      // If found a close point, start dragging
      if (closestInfo) {
        console.log('Starting route drag operation at segment:', closestInfo.index, 
                  'Distance:', closestInfo.distance.toFixed(2) + ' nm',
                  'Directly over route:', closestInfo.isDirectlyOver,
                  'Leg:', closestInfo.legIndex);
        
        // Set active leg
        this.setActiveLeg(closestInfo.legIndex);
        activeRouteLegIndex = closestInfo.legIndex;
        
        // Get the original route coordinates
        const leg = this.currentFlight.legs[closestInfo.legIndex];
        originalLineCoordinates = leg.getCoordinates();
        
        // Start dragging
        isDragging = true;
        dragStartPoint = closestInfo.point;
        closestPointIndex = closestInfo.index;
        
        // Make a copy of the coordinates for dragging
        draggedLineCoordinates = [...originalLineCoordinates];
        
        // Insert a new point at the drag location
        draggedLineCoordinates.splice(
          closestPointIndex + 1, 
          0, 
          closestInfo.point
        );
        
        // Add the temporary drag line
        addDragLine(draggedLineCoordinates);
        
        // Hide the original leg route during dragging
        try {
          map.setLayoutProperty(`leg-${closestInfo.legIndex}-route-line`, 'visibility', 'none');
          map.setLayoutProperty(`leg-${closestInfo.legIndex}-route-glow`, 'visibility', 'none');
        } catch (err) {
          console.error('Error hiding original route:', err);
        }
        
        // Change cursor to grabbing
        map.getCanvas().style.cursor = 'grabbing';
        
        // Prevent default behavior
        e.preventDefault();
      }
    });
    
    // Set up route hover effect
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
      } else if (this.editMode === 'waypoints') {
        // Check if mouse is over a route when not dragging
        let isOverAnyRoute = false;
        
        for (let i = 0; i < this.currentFlight.legs.length; i++) {
          const closestInfo = findClosestPointOnLine(e.lngLat, e.point, i);
          if (closestInfo && closestInfo.isDirectlyOver) {
            // Change cursor to indicate draggable route
            map.getCanvas().style.cursor = 'pointer';
            isOverAnyRoute = true;
            break;
          }
        }
        
        if (!isOverAnyRoute && map.getCanvas().style.cursor === 'pointer') {
          // Reset cursor if it was previously set by this handler
          const platformFeatures = map.queryRenderedFeatures(e.point, { 
            layers: ['platforms-layer'] 
          });
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
      
      // Show the original leg route again
      try {
        map.setLayoutProperty(`leg-${activeRouteLegIndex}-route-line`, 'visibility', 'visible');
        map.setLayoutProperty(`leg-${activeRouteLegIndex}-route-glow`, 'visibility', 'visible');
      } catch (err) {
        console.error('Error showing original route:', err);
      }
      
      // Add the new waypoint at the drag location
      if (activeRouteLegIndex >= 0 && activeRouteLegIndex < this.currentFlight.legs.length) {
        console.log('Route drag complete, adding new waypoint at segment:', closestPointIndex);
        this.addWaypoint([e.lngLat.lng, e.lngLat.lat]);
      }
      
      // Reset cursor
      map.getCanvas().style.cursor = '';
      
      // Reset variables
      draggedLineCoordinates = [];
      originalLineCoordinates = [];
      dragStartPoint = null;
      closestPointIndex = -1;
      dragLineSource = null;
      activeRouteLegIndex = -1;
    });
    
    // Cancel the drag if mouse leaves the map
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
      
      // Show the original leg route again
      try {
        map.setLayoutProperty(`leg-${activeRouteLegIndex}-route-line`, 'visibility', 'visible');
        map.setLayoutProperty(`leg-${activeRouteLegIndex}-route-glow`, 'visibility', 'visible');
      } catch (err) {
        console.error('Error showing original route:', err);
      }
      
      // Reset cursor
      map.getCanvas().style.cursor = '';
      
      // Reset variables
      draggedLineCoordinates = [];
      originalLineCoordinates = [];
      dragStartPoint = null;
      closestPointIndex = -1;
      dragLineSource = null;
      activeRouteLegIndex = -1;
    });
  }
  
  /**
   * Remove a point (stop or waypoint) from the flight
   * @param {string} name - Name of the point to remove
   * @param {number} legIndex - Optional leg index for waypoints
   * @returns {boolean} Whether removal was successful
   */
  removePoint(name, legIndex = -1) {
    if (!this.currentFlight) {
      console.error('No current flight to remove point from');
      return false;
    }
    
    // If leg index is specified, try to remove from that leg
    if (legIndex >= 0 && legIndex < this.currentFlight.legs.length) {
      const leg = this.currentFlight.legs[legIndex];
      
      // Check if it's a stop
      if (leg.from && leg.from.name === name) {
        // Cannot remove from stop of a leg with waypoints
        if (leg.waypoints.length > 0) {
          console.error('Cannot remove departure of a leg with waypoints');
          return false;
        }
        
        // If first leg, remove the entire leg
        if (legIndex === 0) {
          this.currentFlight.legs.splice(legIndex, 1);
        } else {
          // Reconnect previous leg to this leg's destination
          const prevLeg = this.currentFlight.legs[legIndex - 1];
          prevLeg.to = leg.to;
          
          // Remove this leg
          this.currentFlight.legs.splice(legIndex, 1);
        }
        
        this.updateMapDisplay();
        this.triggerCallback('onPointRemoved', { name, isStop: true });
        this.triggerCallback('onChange', this.currentFlight);
        return true;
      }
      
      if (leg.to && leg.to.name === name) {
        // Cannot remove to stop of a leg with waypoints
        if (leg.waypoints.length > 0) {
          console.error('Cannot remove destination of a leg with waypoints');
          return false;
        }
        
        // If last leg, remove the destination
        if (legIndex === this.currentFlight.legs.length - 1) {
          leg.to = null;
        } else {
          // Reconnect this leg to next leg's destination
          const nextLeg = this.currentFlight.legs[legIndex + 1];
          leg.to = nextLeg.to;
          
          // Remove the next leg
          this.currentFlight.legs.splice(legIndex + 1, 1);
        }
        
        this.updateMapDisplay();
        this.triggerCallback('onPointRemoved', { name, isStop: true });
        this.triggerCallback('onChange', this.currentFlight);
        return true;
      }
      
      // Check waypoints in this leg
      const waypointIndex = leg.waypoints.findIndex(wp => wp.name === name);
      if (waypointIndex !== -1) {
        leg.waypoints.splice(waypointIndex, 1);
        
        this.updateMapDisplay();
        this.triggerCallback('onPointRemoved', { name, isStop: false });
        this.triggerCallback('onChange', this.currentFlight);
        return true;
      }
    } else {
      // If no leg index, search all legs
      for (let i = 0; i < this.currentFlight.legs.length; i++) {
        const leg = this.currentFlight.legs[i];
        
        // Check stops
        if (leg.from && leg.from.name === name) {
          return this.removePoint(name, i);
        }
        
        if (leg.to && leg.to.name === name) {
          return this.removePoint(name, i);
        }
        
        // Check waypoints
        const waypointIndex = leg.waypoints.findIndex(wp => wp.name === name);
        if (waypointIndex !== -1) {
          return this.removePoint(name, i);
        }
      }
    }
    
    console.error(`Point ${name} not found`);
    return false;
  }
  
  /**
   * Clear the current flight
   */
  clearFlight() {
    if (!this.currentFlight) {
      console.log('No flight to clear');
      return;
    }
    
    // Remove all markers
    this.markers.forEach(marker => {
      try {
        marker.remove();
      } catch (error) {
        console.error('Error removing marker:', error);
      }
    });
    this.markers = [];
    
    // Clear all route layers
    const map = this.mapManager.getMap();
    if (map) {
      this.activeRoutes.forEach(layerId => {
        try {
          if (map.getLayer(layerId)) {
            map.removeLayer(layerId);
          }
          if (map.getSource(layerId)) {
            map.removeSource(layerId);
          }
        } catch (error) {
          console.error(`Error removing layer or source ${layerId}:`, error);
        }
      });
    }
    this.activeRoutes = [];
    
    // Create a new empty flight with the same name and aircraft
    const name = this.currentFlight.name;
    const aircraft = this.currentFlight.aircraft;
    this.currentFlight = new Flight(`new-${Date.now()}`, name, aircraft, []);
    
    // Reset active leg
    this.activeLegIndex = -1;
    
    // Trigger callbacks
    this.triggerCallback('onChange', this.currentFlight);
  }
  
  /**
   * Export flight data for Palantir OSDK
   * @returns {Object} Flight data for saving to Palantir
   */
  exportFlightData() {
    if (!this.currentFlight) {
      console.error('No flight to export');
      return null;
    }
    
    // Get stops array (location codes only)
    const stopCodes = this.currentFlight.getStopCodes();
    
    // Get labeled waypoints array for UI display
    const displayWaypoints = this.currentFlight.getDisplayWaypoints();
    
    // Get raw waypoints array for Palantir processing
    const combinedWaypoints = this.currentFlight.getCombinedWaypoints();
    
    // Return the data required for creating/editing flight in Palantir
    return {
      id: this.currentFlight.id,
      flightNumber: this.currentFlight.name,
      aircraftId: this.currentFlight.aircraft.id,
      stops: stopCodes,
      displayWaypoints: displayWaypoints,
      combinedWaypoints: combinedWaypoints,
      // Include alternate data if available
      alternateName: this.currentFlight.alternateName,
      alternateSplitPoint: this.currentFlight.alternateSplitPoint
    };
  }
}

export default RouteManager;