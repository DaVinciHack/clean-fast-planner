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
    this._routeDragHandlers = null; // To store references to drag handlers
  }
  


  // Calculate if pill should be visible based on segment length
  _calculatePillVisibility(map, segment, pillWidth = 120) {
    if (!map || !segment || !segment.coordinates || segment.coordinates.length < 2) return false;
    
    // Get the two points of the segment
    const point1 = map.project(segment.coordinates[0]);
    const point2 = map.project(segment.coordinates[1]);
    
    // Calculate pixel distance
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    const pixelDistance = Math.sqrt(dx * dx + dy * dy);
    
    // Pill should only be visible if line segment is longer than pill
    // Add some padding to avoid edge cases
    return pixelDistance > (pillWidth + 20);
  }

  setPlatformManager(platformManager) {
    this.platformManager = platformManager;
  }
  
  setCallback(type, callback) {
    if (this.callbacks.hasOwnProperty(type)) {
      this.callbacks[type] = callback;
    }
  }
  
  triggerCallback(type, data) {
    if (this.callbacks[type]) {
      this.callbacks[type](data);
    }
  }
  
  addWaypoint(coords, name, options = {}) {
    const map = this.mapManager.getMap();
    if (!map) {
      console.error('Cannot add waypoint: Map is not initialized');
      return null;
    }
    
    // CRITICAL FIX: Ensure coords is valid and properly formatted
    if (!coords || !Array.isArray(coords) || coords.length !== 2 || 
        typeof coords[0] !== 'number' || typeof coords[1] !== 'number') {
      console.error('Invalid coordinates format:', coords);
      return null;
    }
    
    // Determine if this is a waypoint or a stop
    const isWaypointOption = options && (options.isWaypoint === true || options.type === 'WAYPOINT');
    const isWaypointGlobal = window.isWaypointModeActive === true;
    const isWaypoint = isWaypointOption || isWaypointGlobal;
    const pointType = isWaypoint ? 'NAVIGATION_WAYPOINT' : 'LANDING_STOP';
    
    console.log(`WaypointManager.addWaypoint: Adding ${pointType} at [${coords}] with name: ${name || 'Unnamed'}`);
    
    // Create unique ID for this waypoint
    const id = `waypoint-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const allCurrentWaypoints = this.getWaypoints();
    const legIndex = this._calculateLegIndex(isWaypoint, allCurrentWaypoints.length, allCurrentWaypoints);
    
    // CRITICAL FIX: Improved waypoint naming and coordinate snapping
    console.log(`[WM.addWaypoint] Received name: "${name}", options:`, options);
    let waypointName = name;
    let snappedCoords = [...coords]; // Create a copy to avoid reference issues
    
    // If no name provided, try to find nearby waypoint or platform to snap to
    if (!waypointName) {
      console.log(`[WM.addWaypoint] waypointName is initially falsy. Attempting to find/snap name. isWaypoint: ${isWaypoint}`);
      // For navigation waypoints, try to snap to nearest OSDK waypoint
      if (isWaypoint && this.platformManager) {
        let nearestNavWaypoint = null;
        
        // Try using findNearestOsdkWaypoint if available (preferred method)
        if (typeof this.platformManager.findNearestOsdkWaypoint === 'function') {
          nearestNavWaypoint = this.platformManager.findNearestOsdkWaypoint(coords[1], coords[0], 2);
        } 
        // Fall back to older findNearestWaypoint if available
        else if (typeof this.platformManager.findNearestWaypoint === 'function') { 
          nearestNavWaypoint = this.platformManager.findNearestWaypoint(coords[1], coords[0], 2);
        }
        
        // If found a nearby waypoint, use its name and coordinates
        if (nearestNavWaypoint) {
          waypointName = nearestNavWaypoint.name;
          snappedCoords = nearestNavWaypoint.coordinates || nearestNavWaypoint.coords || coords;
          console.log(`Snapped to navigation waypoint: ${waypointName} at [${snappedCoords}]`);
          
          // Show feedback to user
          if (window.LoadingIndicator && window.LoadingIndicator.updateStatusIndicator) {
            window.LoadingIndicator.updateStatusIndicator(
              `Snapped to waypoint: ${waypointName}`,
              'success',
              2000
            );
          }
        } else {
          // Default name for navigation waypoints
          waypointName = `Waypoint ${this.waypoints.length + 1}`;
          console.log(`[WM.addWaypoint] Defaulted to navigation waypoint name: "${waypointName}"`);
        }
      } 
      // For stops, try to snap to nearest platform
      else if (!isWaypoint && this.platformManager) {
        let nearestPlatform = null;
        
        if (typeof this.platformManager.findNearestPlatform === 'function') {
          nearestPlatform = this.platformManager.findNearestPlatform(coords[1], coords[0], 2);
        }
        
        // If found a nearby platform, use its name and coordinates
        if (nearestPlatform) {
          waypointName = nearestPlatform.name;
          snappedCoords = nearestPlatform.coordinates || nearestPlatform.coords || coords;
          console.log(`Snapped to platform: ${waypointName} at [${snappedCoords}]`);
          
          // Show feedback to user
          if (window.LoadingIndicator && window.LoadingIndicator.updateStatusIndicator) {
            window.LoadingIndicator.updateStatusIndicator(
              `Snapped to ${waypointName}`,
              'success',
              2000
            );
          }
        } else {
          // Default name for stops
          waypointName = `Stop ${this.waypoints.length + 1}`;
          console.log(`[WM.addWaypoint] Defaulted to stop name: "${waypointName}"`);
        }
      } else {
        // Default names if platformManager not available
        waypointName = isWaypoint ? `Waypoint ${this.waypoints.length + 1}` : `Stop ${this.waypoints.length + 1}`;
        console.log(`[WM.addWaypoint] PlatformManager not available or not applicable, defaulted to: "${waypointName}"`);
      }
    } else {
      console.log(`[WM.addWaypoint] Using provided waypointName: "${waypointName}"`);
    }
    
    // Create the waypoint object with explicit type information
    const waypoint = {
      id: id,
      coords: snappedCoords,
      name: waypointName,
      isNew: true,
      // Keep these for backward compatibility
      isWaypoint: isWaypoint, 
      type: isWaypoint ? 'WAYPOINT' : 'STOP',
      // Use explicit point type enum for clearer distinction
      pointType: pointType,
      legIndex: legIndex,
      // Include any additional properties from options
      ...options
    };
    
    // Add the waypoint to our array
    this.waypoints.push(waypoint);
    
    try {
      // Create the marker with the proper options
      const markerOptions = { 
        ...options, 
        isWaypoint: isWaypoint, 
        type: isWaypoint ? 'WAYPOINT' : 'STOP',
        pointType: pointType // Pass the explicit point type
      };
      
      const marker = this.createWaypointMarker(snappedCoords, waypointName, markerOptions);
      
      // Set up marker drag handling
      if (marker) {
        marker.on('dragend', () => {
          const lngLat = marker.getLngLat();
          const index = this.markers.indexOf(marker);
          if (index !== -1 && index < this.waypoints.length) {
            this.waypoints[index].coords = [lngLat.lng, lngLat.lat];
            this.updateWaypointNameAfterDrag(index, [lngLat.lng, lngLat.lat]);
            this.updateRoute();
            this.triggerCallback('onChange', this.waypoints);
          }
        });
        this.markers.push(marker);
      } else { 
        console.error('Failed to create waypoint marker'); 
      }
      
      // Update the route display
      this.updateRoute(null);
      
      // Notify listeners
      this.triggerCallback('onWaypointAdded', waypoint);
      this.triggerCallback('onChange', this.waypoints);
      
      return waypoint;
    } catch (error) {
      console.error('Error adding waypoint:', error);
      // Clean up if there was an error
      this.waypoints = this.waypoints.filter(wp => wp.id !== id);
      return null;
    }
  }
  
  updateWaypointNameAfterDrag(index, newCoords) {
    // Validate inputs
    if (!this.waypoints[index] || !newCoords || 
        !Array.isArray(newCoords) || newCoords.length !== 2 || 
        typeof newCoords[0] !== 'number' || typeof newCoords[1] !== 'number') {
      console.error('Invalid arguments to updateWaypointNameAfterDrag');
      return;
    }
    
    // Get platform manager - try from window or from our stored reference
    const platformMgr = window.platformManager || this.platformManager;
    if (!platformMgr) {
      console.warn('No platform manager available for waypoint name update');
      return;
    }
    
    try {
      const currentWaypoint = this.waypoints[index];
      let potentialName = null;
      
      // IMPROVED: Very clear type-based handling with consistent naming
      if (currentWaypoint.pointType === 'NAVIGATION_WAYPOINT') {
        // For navigation waypoints, use OSDK waypoint finder if available
        if (typeof platformMgr.findNearestOsdkWaypoint === 'function') {
          const nearestOsdkWp = platformMgr.findNearestOsdkWaypoint(newCoords[1], newCoords[0], 2);
          if (nearestOsdkWp) {
            potentialName = nearestOsdkWp.name;
            console.log(`Snapped waypoint to: ${potentialName}`);
            
            // Show feedback to user
            if (window.LoadingIndicator && window.LoadingIndicator.updateStatusIndicator) {
              window.LoadingIndicator.updateStatusIndicator(
                `Snapped to ${potentialName}`,
                'success',
                1500
              );
            }
          }
        }
      } 
      else if (currentWaypoint.pointType === 'LANDING_STOP') {
        // For landing stops, use platform finder if available
        if (typeof platformMgr.findNearestPlatform === 'function') {
          const nearestPlatform = platformMgr.findNearestPlatform(newCoords[1], newCoords[0], 2);
          if (nearestPlatform) {
            potentialName = nearestPlatform.name;
            console.log(`Snapped stop to: ${potentialName}`);
            
            // Show feedback to user
            if (window.LoadingIndicator && window.LoadingIndicator.updateStatusIndicator) {
              window.LoadingIndicator.updateStatusIndicator(
                `Snapped to ${potentialName}`,
                'success',
                1500
              );
            }
          }
        }
      }
      
      // If we found a name to snap to, use it
      if (potentialName) {
        this.waypoints[index].name = potentialName;
      } 
      // Otherwise, only update auto-generated names
      else if (this.waypoints[index].name.startsWith('Waypoint ') || 
               this.waypoints[index].name.startsWith('Stop ')) {
        // Use type-based naming with correct index
        const isWaypoint = currentWaypoint.pointType === 'NAVIGATION_WAYPOINT' || 
                           currentWaypoint.isWaypoint === true;
        
        this.waypoints[index].name = `${isWaypoint ? 'Waypoint' : 'Stop'} ${index + 1}`;
      }
      
      // Always update the marker popup to reflect any name changes
      this.updateMarkerPopup(index);
      
    } catch (error) { 
      console.error('Error updating waypoint name after drag:', error); 
    }
  }
  
  // Helper method to update a marker's popup content after name changes
  updateMarkerPopup(index) {
    if (!this.waypoints[index] || !this.markers[index]) return;
    
    try {
      const waypoint = this.waypoints[index];
      const marker = this.markers[index];
      const coords = waypoint.coords;
      const name = waypoint.name;
      const isWaypoint = waypoint.pointType === 'NAVIGATION_WAYPOINT' || waypoint.isWaypoint === true;
      
      // Remove any existing popup
      if (marker._popup) {
        marker._popup.remove();
      }
      
      // Create a new popup with updated content
      const map = this.mapManager.getMap();
      if (!map || !window.mapboxgl) return;
      
      const popup = new window.mapboxgl.Popup({ 
        closeButton: true, 
        closeOnClick: false,
        offset: 15,
        className: isWaypoint ? 'waypoint-popup' : 'stop-popup',
        maxWidth: '240px'
      });
      
      const displayName = name || (isWaypoint ? 'Navigation Waypoint' : 'Landing Stop');
      
      const popupContent = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
          <strong style="color: ${isWaypoint ? '#825500' : '#333333'}">${displayName}</strong>
          <span class="favorite-button" title="Add to favorites" style="cursor: pointer; font-size: 18px;" onclick="window.addToFavorites('${displayName}', [${coords}])">❤️</span>
        </div>
        <span class="coord-label">Lat:</span> <span class="coord-value">${coords[1].toFixed(5)}</span><br>
        <span class="coord-label">Lon:</span> <span class="coord-value">${coords[0].toFixed(5)}</span>
        <div style="margin-top: 5px; font-size: 10px; padding: 1px 4px; background-color: ${isWaypoint ? '#FFCC00' : '#FF4136'}; color: #333; display: inline-block; border-radius: 3px;">
          ${isWaypoint ? 'NAVIGATION WAYPOINT' : 'LANDING STOP'}
        </div>
      `;
      
      popup.setHTML(popupContent);
      
      // Attach the popup to the marker
      marker.setPopup(popup);
      
    } catch (error) {
      console.error('Error updating marker popup:', error);
    }
  }
  
  addWaypointAtIndex(coords, name, index, options = {}) {
    const map = this.mapManager.getMap();
    if (!map) return null;
    
    // CRITICAL FIX: Ensure coords is valid and properly formatted
    if (!coords || !Array.isArray(coords) || coords.length !== 2 || 
        typeof coords[0] !== 'number' || typeof coords[1] !== 'number') {
      console.error('Invalid coordinates format:', coords);
      return null;
    }
    
    // Validate index is a proper number
    if (typeof index !== 'number' || isNaN(index)) {
      console.warn(`Invalid index type: ${typeof index}. Converting to number.`);
      index = parseInt(index) || 0;
    }
    
    // Ensure index is within bounds
    if (index < 0) {
      console.warn(`Index ${index} is negative. Using 0 instead.`);
      index = 0;
    }
    if (index > this.waypoints.length) {
      console.warn(`Index ${index} is beyond end of waypoints (${this.waypoints.length}). Using end index.`);
      index = this.waypoints.length;
    }
    
    // Determine if this is a waypoint or a stop
    const isWaypointOption = options && (options.isWaypoint === true || options.type === 'WAYPOINT');
    const isWaypointGlobal = window.isWaypointModeActive === true;
    const isWaypoint = isWaypointOption || isWaypointGlobal;
    const pointType = isWaypoint ? 'NAVIGATION_WAYPOINT' : 'LANDING_STOP';
    
    console.log(`WaypointManager.addWaypointAtIndex: Adding ${pointType} at index ${index} at [${coords}] with name: ${name || 'Unnamed'}`);
    
    // Create unique ID for this waypoint
    const id = `waypoint-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const allCurrentWaypoints = [...this.getWaypoints()]; 
    const legIndex = this._calculateLegIndex(isWaypoint, index, allCurrentWaypoints);
    
    // CRITICAL FIX: Improved waypoint naming and coordinate snapping
    console.log(`[WM.addWaypointAtIndex] Received name: "${name}", index: ${index}, options:`, options);
    let waypointName = name;
    let snappedCoords = [...coords]; // Create a copy to avoid reference issues
    
    // If no name provided, try to find nearby waypoint or platform to snap to
    if (!waypointName) {
      console.log(`[WM.addWaypointAtIndex] waypointName is initially falsy. Attempting to find/snap name. isWaypoint: ${isWaypoint}`);
      // For navigation waypoints, try to snap to nearest OSDK waypoint
      if (isWaypoint && this.platformManager) {
        let nearestNavWaypoint = null;
        
        // Try using findNearestOsdkWaypoint if available (preferred method)
        if (typeof this.platformManager.findNearestOsdkWaypoint === 'function') {
          nearestNavWaypoint = this.platformManager.findNearestOsdkWaypoint(coords[1], coords[0], 2);
        } 
        // Fall back to older findNearestWaypoint if available
        else if (typeof this.platformManager.findNearestWaypoint === 'function') { 
          nearestNavWaypoint = this.platformManager.findNearestWaypoint(coords[1], coords[0], 2);
        }
        
        // If found a nearby waypoint, use its name and coordinates
        if (nearestNavWaypoint) {
          waypointName = nearestNavWaypoint.name;
          snappedCoords = nearestNavWaypoint.coordinates || nearestNavWaypoint.coords || coords;
          console.log(`Snapped to navigation waypoint: ${waypointName} at [${snappedCoords}]`);
          
          // Show feedback to user
          if (window.LoadingIndicator && window.LoadingIndicator.updateStatusIndicator) {
            window.LoadingIndicator.updateStatusIndicator(
              `Snapped to waypoint: ${waypointName}`,
              'success',
              2000
            );
          }
        } else {
          // Default name for navigation waypoints
          waypointName = `Waypoint ${index + 1}`;
          console.log(`[WM.addWaypointAtIndex] Defaulted to navigation waypoint name: "${waypointName}"`);
        }
      } 
      // For stops, try to snap to nearest platform
      else if (!isWaypoint && this.platformManager) {
        let nearestPlatform = null;
        
        if (typeof this.platformManager.findNearestPlatform === 'function') {
          nearestPlatform = this.platformManager.findNearestPlatform(coords[1], coords[0], 2);
        }
        
        // If found a nearby platform, use its name and coordinates
        if (nearestPlatform) {
          waypointName = nearestPlatform.name;
          snappedCoords = nearestPlatform.coordinates || nearestPlatform.coords || coords;
          console.log(`Snapped to platform: ${waypointName} at [${snappedCoords}]`);
          
          // Show feedback to user
          if (window.LoadingIndicator && window.LoadingIndicator.updateStatusIndicator) {
            window.LoadingIndicator.updateStatusIndicator(
              `Snapped to ${waypointName}`,
              'success',
              2000
            );
          }
        } else {
          // Default name for stops
          waypointName = `Stop ${index + 1}`;
          console.log(`[WM.addWaypointAtIndex] Defaulted to stop name: "${waypointName}"`);
        }
      } else {
        // Default names if platformManager not available
        waypointName = isWaypoint ? `Waypoint ${index + 1}` : `Stop ${index + 1}`;
        console.log(`[WM.addWaypointAtIndex] PlatformManager not available or not applicable, defaulted to: "${waypointName}"`);
      }
    } else {
      console.log(`[WM.addWaypointAtIndex] Using provided waypointName: "${waypointName}"`);
    }
    
    // Create the waypoint object with explicit type information
    const waypoint = {
      id: id,
      coords: snappedCoords,
      name: waypointName,
      isNew: true,
      // Keep these for backward compatibility
      isWaypoint: isWaypoint, 
      type: isWaypoint ? 'WAYPOINT' : 'STOP',
      // Use explicit point type enum for clearer distinction
      pointType: pointType,
      legIndex: legIndex,
      // Include any additional properties from options
      ...options
    };
    
    // Create the marker with the proper options
    const markerOptions = { 
      ...options, 
      isWaypoint: isWaypoint, 
      type: isWaypoint ? 'WAYPOINT' : 'STOP',
      pointType: pointType // Pass the explicit point type
    };
    
    const marker = this.createWaypointMarker(snappedCoords, waypointName, markerOptions);
    
    if (!marker) {
      console.error('Failed to create waypoint marker');
      return null;
    }
    
    // Set up marker drag handling
    marker.on('dragend', () => {
      const lngLat = marker.getLngLat();
      const markerIndex = this.markers.indexOf(marker);
      if (markerIndex !== -1 && markerIndex < this.waypoints.length) {
        this.waypoints[markerIndex].coords = [lngLat.lng, lngLat.lat];
        this.updateWaypointNameAfterDrag(markerIndex, [lngLat.lng, lngLat.lat]);
        this.updateRoute();
        this.triggerCallback('onChange', this.waypoints);
      }
    });
    
    // Add the waypoint and marker at the specified index
    try {
      this.waypoints.splice(index, 0, waypoint);
      this.markers.splice(index, 0, marker);
      
      console.log(`Successfully added ${pointType} at index ${index}: ${waypointName}`);
    } catch (error) {
      console.error('Error adding waypoint at index:', error);
      
      // Fallback to adding at end if splice fails
      this.waypoints.push(waypoint);
      this.markers.push(marker);
      console.log(`Fallback: Added ${pointType} at end: ${waypointName}`);
    }
    
    // Update the route display
    this.updateRoute(null);
    
    // Notify listeners
    this.triggerCallback('onWaypointAdded', waypoint);
    this.triggerCallback('onChange', this.waypoints);
    
    return waypoint;
  }
  
  createWaypointMarker(coords, name, options = {}) {
    try {
      const map = this.mapManager.getMap();
      
      // Validate essential requirements
      if (!map) {
        console.error('Cannot create waypoint marker: Map is not initialized');
        return null;
      }
      
      if (!window.mapboxgl) {
        console.error('Cannot create waypoint marker: mapboxgl not found');
        return null;
      }
      
      // Validate coordinates
      if (!coords || coords.length !== 2 || typeof coords[0] !== 'number' || typeof coords[1] !== 'number') {
        console.error('Invalid coordinates format for waypoint marker:', coords);
        return null;
      }
      
      // Determine if this is a waypoint or a stop based on multiple possible sources
      // with very clear precedence order
      const isWaypoint = 
        options.pointType === 'NAVIGATION_WAYPOINT' || // First check explicit point type (preferred)
        options.isWaypoint === true ||                // Then check isWaypoint flag
        options.type === 'WAYPOINT' ||                // Then check type string
        window.isWaypointModeActive === true;         // Finally use global waypoint mode flag
      
      // Create marker with appropriate styling based on type
      const marker = new window.mapboxgl.Marker({ 
        color: isWaypoint ? "#BA55D3" : "#FF4136", // Medium purple for waypoints, red for stops
        draggable: true,
        scale: isWaypoint ? 0.4 : 0.5, // Make waypoints slightly smaller than stops but still visible
        anchor: 'center' // Explicitly set the anchor to center
      })
      .setLngLat(coords)
      .addTo(map);
      
      // Create popup with enhanced styling and information
      const popup = new window.mapboxgl.Popup({
        closeButton: true,
        closeOnClick: false,
        offset: 15,
        className: isWaypoint ? 'waypoint-popup' : 'stop-popup',
        maxWidth: '240px'
      });
      
      // Format the name or use a default
      const displayName = name || (isWaypoint ? 'Navigation Waypoint' : 'Landing Stop');
      
      // Create enhanced popup content with clear styling differences
      const popupContent = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <strong style="color: ${isWaypoint ? '#e0e0e0' : '#e0e0e0'}; font-size: 13px;">${displayName}</strong>
          <span class="favorite-button" title="Add to favorites" style="cursor: pointer; font-size: 16px;" onclick="window.addToFavorites('${displayName}', [${coords[0]}, ${coords[1]}])">❤️</span>
        </div>
        <div style="margin-bottom: 4px;">
          <span style="color: ${isWaypoint ? '#e0e0e0' : '#e0e0e0'}; opacity: 0.8;">Lat: ${coords[1].toFixed(5)}</span>
        </div>
        <div style="margin-bottom: 6px;">
          <span style="color: ${isWaypoint ? '#e0e0e0' : '#e0e0e0'}; opacity: 0.8;">Lon: ${coords[0].toFixed(5)}</span>
        </div>
        <div style="display: inline-block; margin-top: 2px; font-size: 9px; color: ${isWaypoint ? '#e0e0e0' : '#e0e0e0'}; opacity: 0.7;">
          ${isWaypoint ? 'NAVIGATION WAYPOINT' : 'LANDING STOP'}
        </div>
      `;
      
      // Set the popup HTML content
      popup.setHTML(popupContent);
      
      // Add data-marker-type attribute to the marker element for CSS styling
      const markerElement = marker.getElement();
      if (markerElement) {
        // Add clear CSS class for styling
        markerElement.setAttribute('data-marker-type', isWaypoint ? 'waypoint' : 'stop');
        
        if (isWaypoint) {
          // Use click instead of hover for waypoints
          markerElement.addEventListener('click', () => {
            popup.setLngLat(marker.getLngLat()).addTo(map);
          });
        } else {
          // Normal hover behavior for stops
          markerElement.addEventListener('mouseenter', () => {
            // Only show popup if zoom level is sufficient (avoid cluttering the map)
            const currentZoom = map.getZoom();
            if (currentZoom >= 9) { // Only show labels when zoomed in enough
              popup.setLngLat(marker.getLngLat()).addTo(map);
            }
          });
          
          // Hide popup on mouseleave
          markerElement.addEventListener('mouseleave', () => {
            popup.remove();
          });
        }
      }
      
      // Return the created marker
      return marker;
      
    } catch (error) { 
      console.error('Error creating waypoint marker:', error);
      return null; 
    }
  }
  
  /**
   * Create 3D flight path with curved routes and drop shadows
   * @param {Array} coordinates - Array of [lng, lat] coordinates
   * @returns {Object} - { mainPath: GeoJSON, dropShadow: GeoJSON }
   */
  create3DFlightPath(coordinates) {
    if (!coordinates || coordinates.length < 2) {
      return {
        mainPath: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coordinates }},
        dropShadow: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coordinates }}
      };
    }

    const turf = window.turf;
    if (!turf) {
      console.warn("Turf.js not available for 3D flight path");
      return {
        mainPath: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coordinates }},
        dropShadow: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coordinates }}
      };
    }

    try {
      const curvedCoordinates = [];
      const shadowCoordinates = [];

      // Process each segment to create curved flight paths
      for (let i = 0; i < coordinates.length - 1; i++) {
        const start = coordinates[i];
        const end = coordinates[i + 1];
        
        // Calculate distance to determine curve height
        const startPoint = turf.point(start);
        const endPoint = turf.point(end);
        const distance = turf.distance(startPoint, endPoint, { units: 'nauticalmiles' });
        
        // Create curved segment for main flight path
        const curvedSegment = this.createCurvedSegment(start, end, distance);
        
        // Add curved points (skip first point if not the first segment to avoid duplication)
        if (i === 0) {
          curvedCoordinates.push(...curvedSegment);
        } else {
          curvedCoordinates.push(...curvedSegment.slice(1));
        }
        
        // Create straight shadow segment (ground projection)
        if (i === 0) {
          shadowCoordinates.push(start, end);
        } else {
          shadowCoordinates.push(end);
        }
      }

      return {
        mainPath: {
          type: 'Feature',
          properties: { isFlightPath: true },
          geometry: { type: 'LineString', coordinates: curvedCoordinates }
        },
        dropShadow: {
          type: 'Feature', 
          properties: { isDropShadow: true },
          geometry: { type: 'LineString', coordinates: shadowCoordinates }
        }
      };

    } catch (error) {
      console.warn("Error creating 3D flight path, falling back to simple line:", error);
      return {
        mainPath: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coordinates }},
        dropShadow: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coordinates }}
      };
    }
  }

  /**
   * Create a curved segment between two points (takeoff/landing arc)
   * @param {Array} start - [lng, lat] start coordinate
   * @param {Array} end - [lng, lat] end coordinate  
   * @param {number} distance - Distance in nautical miles
   * @returns {Array} - Array of curved coordinates
   */
  createCurvedSegment(start, end, distance) {
    const numPoints = Math.max(15, Math.min(30, Math.floor(distance / 3))); // More points for smoother curves
    const curvedPoints = [];
    
    // IMPROVED: Curve height based on distance with better scaling for short segments
    // Shorter segments get proportionally less curve
    let maxCurveOffset;
    if (distance < 10) {
      maxCurveOffset = distance * 0.002; // Very subtle for short hops
    } else if (distance < 50) {
      maxCurveOffset = distance * 0.004; // Moderate for medium distances
    } else {
      maxCurveOffset = Math.min(0.1, distance * 0.006); // Max for long distances
    }
    
    console.log(`🚀 Creating curved segment: distance=${distance}nm, curveOffset=${maxCurveOffset}, points=${numPoints}`);
    
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints; // Progress along the segment (0 to 1)
      
      // Linear interpolation between start and end points
      const lng = start[0] + (end[0] - start[0]) * t;
      const lat = start[1] + (end[1] - start[1]) * t;
      
      // Create flight arc: always curves UP (toward top of screen) for consistent 3D camera view
      // Using sine curve for smooth takeoff/landing feel
      const curveHeight = Math.sin(t * Math.PI) * maxCurveOffset;
      
      // FIXED: Always apply curve in the UP direction (positive latitude offset)
      // This ensures all curves go "up" toward the top of screen regardless of flight direction
      curvedPoints.push([lng, lat + curveHeight]); // Simple upward curve
    }
    
    return curvedPoints;
  }

  /**
   * Calculate bearing between two points
   * @param {Array} start - [lng, lat]
   * @param {Array} end - [lng, lat]
   * @returns {number} - Bearing in degrees
   */
  calculateBearing(start, end) {
    const turf = window.turf;
    if (turf) {
      return turf.bearing(turf.point(start), turf.point(end));
    }
    
    // Fallback calculation if turf not available
    const dLng = end[0] - start[0];
    const dLat = end[1] - start[1];
    return Math.atan2(dLng, dLat) * (180 / Math.PI);
  }

  createArrowsAlongLine(allWaypointsCoordinates, routeStats = null, flightPathData = null) {
    console.log("⭐ Creating route labels with distance and time information");
    console.log("⭐ Flight path data available:", !!flightPathData);
    
    if (!allWaypointsCoordinates || allWaypointsCoordinates.length < 2) {
      return { type: 'FeatureCollection', features: [] };
    }
    
    const features = []; 
    const turf = window.turf; 
    
    if (!turf) { 
      console.error("Turf.js is not available."); 
      return { type: 'FeatureCollection', features: [] }; 
    }
    
    // Robust validation of coordinates
    const validCoordinates = allWaypointsCoordinates.filter(coords => {
      return Array.isArray(coords) && 
             coords.length === 2 && 
             typeof coords[0] === 'number' && 
             typeof coords[1] === 'number' &&
             !isNaN(coords[0]) && 
             !isNaN(coords[1]);
    });
    
    if (validCoordinates.length < 2) {
      console.error("Not enough valid coordinates for route labels");
      return { type: 'FeatureCollection', features: [] };
    }
    
    // Find landing stops (non-waypoints) if we have waypoint information
    // This helps us identify leg boundaries (stop to stop)
    let legBoundaries = [];
    
    if (this.waypoints && this.waypoints.length > 0) {
      // Find waypoints that are landing stops
      const landingStops = this.waypoints.filter(wp => 
        wp.pointType === 'LANDING_STOP' || 
        (!wp.pointType && !wp.isWaypoint && wp.type !== 'WAYPOINT')
      );
      
      // Map these to indices in the coordinates array
      if (landingStops.length > 0) {
        legBoundaries = landingStops.map(stop => {
          // Find the index of this stop's coordinates in the validCoordinates array
          const coordStr = JSON.stringify(stop.coords);
          return validCoordinates.findIndex(coord => 
            JSON.stringify(coord) === coordStr
          );
        }).filter(idx => idx !== -1); // Remove any not found (-1)
        
        // Sort the indices to ensure they're in ascending order
        legBoundaries.sort((a, b) => a - b);
        
        // Ensure the first waypoint is included if it's not already
        if (legBoundaries.length > 0 && legBoundaries[0] !== 0) {
          legBoundaries.unshift(0);
        }
        
        // Ensure the last waypoint is included if it's not already
        const lastIndex = validCoordinates.length - 1;
        if (legBoundaries.length > 0 && legBoundaries[legBoundaries.length - 1] !== lastIndex) {
          legBoundaries.push(lastIndex);
        }
        
        // Log the complete, sorted leg boundaries for debugging
        console.log(`⭐ Sorted leg boundaries at indices:`, legBoundaries);
        
        console.log(`⭐ Found ${legBoundaries.length} leg boundaries at indices:`, legBoundaries);
      }
    }
    
    // If no leg boundaries found or invalid, treat each waypoint as a boundary
    if (legBoundaries.length < 2) {
      console.log("⭐ No leg boundaries found, using individual segments");
      
      // Process each segment as its own leg
      for (let i = 0; i < validCoordinates.length - 1; i++) {
        try {
          const startPointCoords = validCoordinates[i];
          const endPointCoords = validCoordinates[i + 1];
          
          // Create point objects
          const fromPoint = turf.point(startPointCoords);
          const toPoint = turf.point(endPointCoords);
          
          // Calculate distance
          const legDistance = turf.distance(
            fromPoint, 
            toPoint,
            { units: 'nauticalmiles' }
          );
          
          // Calculate time if we have routeStats with legs
          let legTime = null;
          if (routeStats && routeStats.legs && i < routeStats.legs.length) {
            legTime = routeStats.legs[i].time;
            console.log(`Found time for segment ${i} from routeStats: ${legTime}`);
          } 
          else if (window.currentRouteStats && window.currentRouteStats.legs && i < window.currentRouteStats.legs.length) {
            legTime = window.currentRouteStats.legs[i].time;
            console.log(`Found time for segment ${i} from window.currentRouteStats: ${legTime}`);
          }
          // As a last resort, calculate time based on aircraft speed
          else if (window.currentRouteStats && window.currentRouteStats.aircraft && window.currentRouteStats.aircraft.cruiseSpeed) {
            legTime = legDistance / window.currentRouteStats.aircraft.cruiseSpeed;
            console.log(`Estimated time for segment ${i} based on aircraft speed: ${legTime}`);
          }
          
          // Create label with distance and time (if available)
          const distanceText = `${legDistance.toFixed(1)} nm`;
          
          let labelText;
          if (legTime !== null) {
            // Format the time
            const hours = Math.floor(legTime);
            const minutes = Math.floor((legTime - hours) * 60);
            const timeText = `${hours > 0 ? hours + 'h' : ''}${minutes > 0 ? ' ' + minutes + 'm' : (hours > 0 ? '' : '0m')}`;
            
            // Combine distance and time on same line with dash separator
            labelText = `${distanceText} - ${timeText}`;
          } else {
            // Distance only
            labelText = distanceText;
          }
          
          // Add directional arrows consistently based on segment direction
          // Force arrows to always be present and in the right direction
          const goingLeftToRight = startPointCoords[0] < endPointCoords[0];
          if (goingLeftToRight) {
            labelText = `${labelText} →`; // Simple right-pointing arrow for left-to-right segments
          } else {
            labelText = `← ${labelText}`; // Simple left-pointing arrow for right-to-left segments
          }
          
          // Calculate bearing for alignment
          const legBearing = turf.bearing(fromPoint, toPoint);
          
          // Create linestring for midpoint calculation
          const line = turf.lineString([startPointCoords, endPointCoords]);
          
          // Find first quarter point for label placement (better attachment to line)
          const midPoint = turf.along(
            line, 
            legDistance * 0.25, // Position at first quarter instead of middle
            { units: 'nauticalmiles' }
          );
          
          // Calculate text orientation based on bearing
          // Normalize bearing to 0-359 range
          let textBearing = legBearing;
          while (textBearing < 0) textBearing += 360;
          textBearing = textBearing % 360;
          
          // Flip text if it would be upside down (bearings > 180 degrees)
          if (textBearing > 180 && textBearing <= 360) {
            // Flip the bearing 180 degrees to make text right-side up
            textBearing = (textBearing + 180) % 360;
            
            // Also flip the arrow direction for consistency
            // DISABLED: Don't flip arrows, as this makes them inconsistent with direction
            // Arrows should always point in the direction of travel
            // if (labelText.includes('→')) {
            //   labelText = labelText.replace(' →', '');
            //   labelText = `← ${labelText}`;
            // } else if (labelText.includes('←')) {
            //   labelText = labelText.replace('← ', '');
            //   labelText = `${labelText} →`;
            // }
          }
            
          // Calculate if pill should be shown based on segment length
          const shouldShowPill = (() => {
            try {
              if (!map) return false;
              
              // For segments, calculate the actual distance
              if (legSegment && legSegment.geometry && legSegment.geometry.coordinates) {
                const coords = legSegment.geometry.coordinates;
                if (coords.length >= 2) {
                  // Project the coordinates to screen pixels
                  const p1 = map.project(coords[0]);
                  const p2 = map.project(coords[coords.length - 1]);
                  
                  // Calculate pixel distance
                  const dx = p2.x - p1.x;
                  const dy = p2.y - p1.y;
                  const pixelDistance = Math.sqrt(dx * dx + dy * dy);
                  
                  // Only show pill if segment is longer than 135 pixels (refined threshold)
                  return pixelDistance > 135;
                }
              }
              
              // For simple two-point segments
              if (segmentCoordinates && segmentCoordinates.length >= 2) {
                const p1 = map.project(segmentCoordinates[0]);
                const p2 = map.project(segmentCoordinates[1]);
                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const pixelDistance = Math.sqrt(dx * dx + dy * dy);
                
                // Only show if line is longer than pill (135px refined threshold)
                return pixelDistance > 135;
              }
              
              return false; // Default to hidden if no valid coordinates
            } catch (e) {
              console.warn('Error calculating pill visibility:', e);
              return false; // Default to hidden on error
            }
          })();
          
          if (!shouldShowPill) {
            continue; // Skip this pill if segment is too short
          }

          features.push({
            type: 'Feature',
            geometry: midPoint.geometry,
            properties: {
              isLabel: true,
              text: labelText,
              // Use the adjusted bearing that ensures text is never upside down
              bearing: textBearing,
              segmentDistance: legDistance,
              legIndex: i
            }
          });
        } catch (err) {
          console.error(`Error creating label for segment ${i}:`, err);
        }
      }
    } 
    // Process by legs (stop to stop)
    else {
      console.log("⭐ Processing labels by legs (stop to stop)");
      
      // Process each leg (between consecutive leg boundaries)
      for (let legIdx = 0; legIdx < legBoundaries.length - 1; legIdx++) {
        try {
          const startIdx = legBoundaries[legIdx];
          const endIdx = legBoundaries[legIdx + 1];
          
          // Skip invalid legs
          if (startIdx < 0 || endIdx >= validCoordinates.length || startIdx >= endIdx) {
            console.warn(`Skipping invalid leg: ${startIdx} to ${endIdx}`);
            continue;
          }
          
          // Get the coordinates for the start and end of this leg
          const legStartCoords = validCoordinates[startIdx];
          const legEndCoords = validCoordinates[endIdx];
          
          // Find all segments in this leg
          const legSegments = [];
          let totalLegDistance = 0;
          let longestSegmentIdx = -1;
          let longestSegmentLength = 0;
          
          // Calculate each segment in this leg and find the longest one
          for (let i = startIdx; i < endIdx; i++) {
            const segStartCoords = validCoordinates[i];
            const segEndCoords = validCoordinates[i + 1];
            
            // Skip if the segment is invalid
            if (!segStartCoords || !segEndCoords) {
              console.warn(`Skipping invalid segment in leg ${legIdx}: ${i} to ${i+1}`);
              continue;
            }
            
            // Calculate segment distance
            const segFrom = turf.point(segStartCoords);
            const segTo = turf.point(segEndCoords);
            const segDistance = turf.distance(segFrom, segTo, { units: 'nauticalmiles' });
            
            // Calculate segment bearing
            const segBearing = turf.bearing(segFrom, segTo);
            
            // Track this segment
            legSegments.push({
              startIdx: i,
              endIdx: i + 1,
              startCoords: segStartCoords,
              endCoords: segEndCoords,
              distance: segDistance,
              bearing: segBearing
            });
            
            // Update total leg distance
            totalLegDistance += segDistance;
            
            // Check if this is the longest segment
            if (segDistance > longestSegmentLength) {
              longestSegmentLength = segDistance;
              longestSegmentIdx = legSegments.length - 1;
            }
          }
          
          // Skip legs with no segments
          if (legSegments.length === 0) {
            console.warn(`Leg ${legIdx} has no valid segments`);
            continue;
          }
          
          // If we couldn't find a longest segment, use the first one
          if (longestSegmentIdx === -1) {
            longestSegmentIdx = 0;
          }
          
          // Get the longest segment for label placement
          const longestSegment = legSegments[longestSegmentIdx];
          
          // Calculate time for this leg from applicable sources
          let legTime = null;
          
          // Get time from all potential sources, with careful prioritization
          
          // FIRST OPTION: Try to get time directly from routeStats legs by index
          if (routeStats && routeStats.legs && legIdx < routeStats.legs.length) {
            legTime = routeStats.legs[legIdx].time;
            console.log(`Found time for leg ${legIdx} directly from routeStats: ${legTime}`);
          }
          // SECOND OPTION: Try from window.currentRouteStats by index
          else if (window.currentRouteStats && window.currentRouteStats.legs && 
                  legIdx < window.currentRouteStats.legs.length) {
            legTime = window.currentRouteStats.legs[legIdx].time;
            console.log(`Found time for leg ${legIdx} from window.currentRouteStats: ${legTime}`);
          }
          // THIRD OPTION: Try coordinate matching from routeStats
          else if (routeStats && routeStats.legs) {
            // Look for a matching leg by coordinates
            for (let i = 0; i < routeStats.legs.length; i++) {
              const leg = routeStats.legs[i];
              if (leg.from && leg.to &&
                  JSON.stringify(leg.from) === JSON.stringify(legStartCoords) && 
                  JSON.stringify(leg.to) === JSON.stringify(legEndCoords)) {
                legTime = leg.time;
                console.log(`Found time for leg ${legIdx} by coordinate match in routeStats: ${legTime}`);
                break;
              }
            }
          }
          // FOURTH OPTION: Try coordinate matching from window.currentRouteStats
          else if (window.currentRouteStats && window.currentRouteStats.legs) {
            // Look for a matching leg by coordinates
            for (let i = 0; i < window.currentRouteStats.legs.length; i++) {
              const leg = window.currentRouteStats.legs[i];
              if (leg.from && leg.to &&
                  JSON.stringify(leg.from) === JSON.stringify(legStartCoords) && 
                  JSON.stringify(leg.to) === JSON.stringify(legEndCoords)) {
                legTime = leg.time;
                console.log(`Found time for leg ${legIdx} by coordinate match in window.currentRouteStats: ${legTime}`);
                break;
              }
            }
          }
          // LAST RESORT: Calculate time based on aircraft cruise speed
          else if (window.currentRouteStats && window.currentRouteStats.aircraft && 
                  window.currentRouteStats.aircraft.cruiseSpeed) {
            // Make sure we have valid cruise speed
            const cruiseSpeed = parseFloat(window.currentRouteStats.aircraft.cruiseSpeed);
            if (!isNaN(cruiseSpeed) && cruiseSpeed > 0) {
              // Estimate time based on distance and aircraft speed
              legTime = totalLegDistance / cruiseSpeed;
              console.log(`Estimated time for leg ${legIdx} based on aircraft speed: ${legTime}`);
            }
          }
          
          console.log(`Leg ${legIdx} final time value: ${legTime !== null ? legTime : 'null'}`);
          
          // Create a line for the longest segment for label placement
          const line = turf.lineString([longestSegment.startCoords, longestSegment.endCoords]);
          
          // Position at first quarter for better line attachment (instead of middle)
          const labelPosition = 0.25; // First quarter position
          
          // For multi-leg routes, add a slight offset to prevent label overlap
          let labelOffset = 0;
          if (legBoundaries.length > 3) { // If we have 3+ legs (complex route)
            if (legIdx === 0) {
              labelOffset = -0.05; // First leg: slightly earlier
            } else if (legIdx === legBoundaries.length - 2) {
              labelOffset = 0.05; // Last leg: slightly later
            }
          }
          
          const midPoint = turf.along(
            line, 
            longestSegment.distance * (labelPosition + labelOffset), 
            { units: 'nauticalmiles' }
          );
          
          // Create label with distance and time
          const distanceText = `${totalLegDistance.toFixed(1)} nm`;
          
          let labelText;
          if (legTime !== null) {
            // Format the time
            const hours = Math.floor(legTime);
            const minutes = Math.floor((legTime - hours) * 60);
            const timeText = `${hours > 0 ? hours + 'h' : ''}${minutes > 0 ? ' ' + minutes + 'm' : (hours > 0 ? '' : '0m')}`;
            
            // Combine distance and time on same line with dash separator
            labelText = `${distanceText} - ${timeText}`;
          } else {
            // Distance only
            labelText = distanceText;
          }
          
          // Arrow direction always follows the route order
          const goingLeftToRight = longestSegment.startCoords[0] < longestSegment.endCoords[0];
          if (goingLeftToRight) {
            labelText = `${labelText} →`; // Simple right-pointing arrow
          } else {
            labelText = `← ${labelText}`; // Simple left-pointing arrow
          }
          
          // Calculate text orientation based on bearing
          let textBearing = longestSegment.bearing;
          while (textBearing < 0) textBearing += 360;
          textBearing = textBearing % 360;
          
          // Flip text if it would be upside down (bearings > 180 degrees)
          if (textBearing > 180 && textBearing <= 360) {
            // Flip the bearing 180 degrees to make text right-side up
            textBearing = (textBearing + 180) % 360;
          }
          
          // Add the leg number as a prefix (without the # symbol)
          // No leg prefix - removed for cleaner appearance
          let legPrefix = '';
          
          // Calculate if leg pill should be shown based on pixel distance
          const shouldShowLegPill = (() => {
            try {
              if (!this.mapManager || !this.mapManager.map) return false;
              
              const map = this.mapManager.map;
              
              // Use the longest segment coordinates for pixel distance calculation
              const startCoords = longestSegment.startCoords;
              const endCoords = longestSegment.endCoords;
              
              if (!startCoords || !endCoords) {
                return false; // No valid coordinates
              }
              
              // Project coordinates to screen pixels
              const p1 = map.project(startCoords);
              const p2 = map.project(endCoords);
              
              // Calculate pixel distance between endpoints
              const dx = p2.x - p1.x;
              const dy = p2.y - p1.y;
              const pixelDistance = Math.sqrt(dx * dx + dy * dy);
              
              // Leg pill visibility threshold: 135px refined threshold
              // Only show pill if line segment is longer than the pill itself
              return pixelDistance > 135;
              
            } catch (e) {
              console.warn('Error calculating leg pill visibility:', e);
              return false; // Default to hidden on error
            }
          })();
          
          if (!shouldShowLegPill) {
            console.log(`⭐ Skipping leg ${legIdx} pill - segment too short for display`);
            continue; // Skip this leg pill if segment is too short
          }
          
          // Add feature for the leg label
          features.push({
            type: 'Feature',
            geometry: midPoint.geometry,
            properties: {
              isLabel: true,
              text: legPrefix + labelText,
              bearing: textBearing, // Use adjusted bearing to keep text right-side up
              segmentDistance: totalLegDistance,
              legDistance: totalLegDistance,
              legTime: legTime,
              legIndex: legIdx,
              isLeg: true
            }
          });
        } catch (err) {
          console.error(`Error creating label for leg ${legIdx}:`, err);
        }
      }
    }
    
    console.log(`⭐ Created ${features.length} route labels`);
    console.log("Sample feature:", features.length > 0 ? JSON.stringify(features[0].properties) : "No features created");
    return { type: 'FeatureCollection', features: features };
  }
  
  removeWaypoint(id, index) {
    if (index === undefined || index < 0 || index >= this.waypoints.length) {
      index = this.waypoints.findIndex(wp => wp.id === id);
      if (index === -1) { 
        console.error(`WaypointManager: Cannot find waypoint with ID ${id}`); 
        return; 
      }
    }
    
    // Store reference to the waypoint being removed
    const removedWaypoint = this.waypoints[index];
    
    // Remove marker from map
    if (this.markers[index]) { 
      try { 
        this.markers[index].remove(); 
      } catch (error) { 
        console.error('Error removing marker:', error); 
      }
    }
    
    // Remove from internal arrays
    this.markers.splice(index, 1); 
    this.waypoints.splice(index, 1);
    
    // Update route display
    this.updateRoute();
    
    // Trigger callbacks in the correct order
    if (removedWaypoint) {
      // First notify about the specific removal
      this.triggerCallback('onWaypointRemoved', removedWaypoint);
      
      // Then notify that the overall waypoints collection changed
      // This is critical for the UI to update properly
      this.triggerCallback('onChange', this.waypoints);
      
      console.log(`WaypointManager: Waypoint removed and callbacks triggered, ID: ${id}, index: ${index}`);
    }
  }

  _calculateLegIndex(newPointIsNavWaypoint, insertionIndexInAllWaypoints, allCurrentWaypointsBeforeInsertion) {
    if (!newPointIsNavWaypoint) return undefined;
    const currentStops = allCurrentWaypointsBeforeInsertion.filter(wp => wp.pointType === 'LANDING_STOP');
    if (currentStops.length === 0) return 0;
    let lastStopBeforeInsertion = null;
    for (let i = insertionIndexInAllWaypoints - 1; i >= 0; i--) {
      if (allCurrentWaypointsBeforeInsertion[i].pointType === 'LANDING_STOP') {
        lastStopBeforeInsertion = allCurrentWaypointsBeforeInsertion[i];
        break;
      }
    }
    if (lastStopBeforeInsertion) return currentStops.indexOf(lastStopBeforeInsertion);
    return 0;
  }
  
  updateRoute(routeStats = null) {
    const map = this.mapManager.getMap();
    if (!map || !this.mapManager.isMapLoaded()) {
      // console.log("WaypointManager.updateRoute: Map not ready.");
      return;
    }

    // CRITICAL SAFETY FIX: Never use any routeStats object that has time or fuel values without an aircraft
    if (routeStats) {
      // If using routeStats directly, log that fact
      console.log("⭐ WaypointManager.updateRoute called with routeStats:", {
        hasAircraft: routeStats.aircraft ? true : false,
        timeHours: routeStats.timeHours,
        estimatedTime: routeStats.estimatedTime,
        hasLegs: routeStats.legs ? routeStats.legs.length : 0
      });
      
      // Check if routeStats has non-zero values for time or fuel without an aircraft 
      if ((!routeStats.distanceOnly && !routeStats.aircraft) && 
          (routeStats.timeHours || routeStats.estimatedTime !== '00:00' || 
           routeStats.fuelRequired || routeStats.tripFuel)) {
        console.error('⚠️ SAFETY ALERT: RouteStats contains time or fuel values without an aircraft!');
        
        // Force correct the routeStats
        routeStats.timeHours = 0;
        routeStats.estimatedTime = '00:00';
        routeStats.fuelRequired = 0;
        routeStats.tripFuel = 0;
      }
      
      // Update global state - Make a proper deep copy to ensure data is preserved
      // But use setTimeout to prevent causing a React update cycle
      if (!window.currentRouteStats) {
        window.currentRouteStats = {};
      }
      
      // Create a new object to avoid reference issues
      const updatedStats = {...window.currentRouteStats};
      
      // Add important properties from routeStats
      if (routeStats.timeHours) updatedStats.timeHours = routeStats.timeHours;
      if (routeStats.estimatedTime) updatedStats.estimatedTime = routeStats.estimatedTime;
      if (routeStats.tripFuel) updatedStats.tripFuel = routeStats.tripFuel;
      if (routeStats.totalFuel) updatedStats.totalFuel = routeStats.totalFuel;
      if (routeStats.aircraft) updatedStats.aircraft = routeStats.aircraft;
      if (routeStats.legs) updatedStats.legs = [...routeStats.legs];
      
      // Use setTimeout to break the React update cycle
      setTimeout(() => {
        window.currentRouteStats = updatedStats;
        
        // Log the updated window.currentRouteStats for debugging
        console.log("⭐ window.currentRouteStats updated:", {
          timeHours: window.currentRouteStats.timeHours,
          estimatedTime: window.currentRouteStats.estimatedTime,
          tripFuel: window.currentRouteStats.tripFuel,
          totalFuel: window.currentRouteStats.totalFuel,
          hasAircraft: window.currentRouteStats.aircraft ? true : false,
          hasLegs: window.currentRouteStats.legs ? window.currentRouteStats.legs.length : 0
        });
      }, 0);
    } else if (window.currentRouteStats) {
      // If using global state, ensure this also has zeros for safety
      if (!window.currentRouteStats.aircraft) {
        const updatedStats = {...window.currentRouteStats};
        updatedStats.timeHours = 0;
        updatedStats.estimatedTime = '00:00';
        updatedStats.fuelRequired = 0;
        updatedStats.tripFuel = 0;
        
        // Use setTimeout to avoid update cycles
        setTimeout(() => {
          window.currentRouteStats = updatedStats;
        }, 0);
      }
      
      routeStats = window.currentRouteStats;
      
      // Log that we're using global state
      console.log("⭐ WaypointManager.updateRoute using window.currentRouteStats:", {
        hasAircraft: routeStats.aircraft ? true : false,
        timeHours: routeStats.timeHours,
        estimatedTime: routeStats.estimatedTime,
        hasLegs: routeStats.legs ? routeStats.legs.length : 0
      });
    }

    const routeSourceId = 'route';
    const routeArrowsSourceId = 'route-arrows';
    const routeLayerId = 'route';
    const routeGlowLayerId = 'route-glow';
    const routeArrowsLayerId = 'route-arrows';
    const legLabelsLayerId = 'leg-labels';
    
    console.log("DEBUG: Updating route with", routeStats, "and", this.waypoints.length, "waypoints");

    if (this.waypoints.length >= 2) {
      const coordinates = this.waypoints.map(wp => wp.coords);
      
      // Create 3D flight path with curves and drop shadows
      const flightPathData = this.create3DFlightPath(coordinates);
      const routeGeoJson = flightPathData.mainPath;
      const shadowGeoJson = flightPathData.dropShadow;
      
      // Add debugging logs
      console.log("⭐ Creating route with coordinates:", coordinates.length);
      console.log("⭐ Curved path coordinates:", routeGeoJson.geometry.coordinates.length);
      
      // Pass original waypoint coordinates to pill creation (pills work with waypoint logic)
      // But store curved path for reference
      const arrowsData = this.createArrowsAlongLine(coordinates, routeStats, flightPathData);
      
      // Debug the arrows data
      console.log("⭐ Arrow data features:", arrowsData.features ? arrowsData.features.length : 0);
      if (arrowsData.features && arrowsData.features.length > 0) {
        console.log("⭐ Sample feature:", JSON.stringify(arrowsData.features[0].properties));
      }

      // Update or add route sources and layers
      const routeShadowSourceId = 'route-shadow-source';
      const routeShadowLayerId = 'route-shadow';
      
      if (map.getSource(routeSourceId)) {
        map.getSource(routeSourceId).setData(routeGeoJson);
      } else {
        map.addSource(routeSourceId, { type: 'geojson', data: routeGeoJson });
      }
      
      // Add or update drop shadow source
      if (map.getSource(routeShadowSourceId)) {
        map.getSource(routeShadowSourceId).setData(shadowGeoJson);
      } else {
        map.addSource(routeShadowSourceId, { type: 'geojson', data: shadowGeoJson });
        
        // Enhanced shadow system - wider, blurred base for pills
        map.addLayer({ 
          id: routeShadowLayerId, 
          type: 'line', 
          source: routeShadowSourceId, 
          layout: { 
            'line-join': 'round', 
            'line-cap': 'round', 
            'line-sort-key': -2 // Render behind everything else
          }, 
          paint: { 
            'line-color': '#000000', // Black shadow
            'line-width': 12, // Much wider to accommodate pills
            'line-opacity': 0.3, // Semi-transparent shadow
            'line-blur': 5, // Heavy blur for shadow base effect
            'line-translate': [0, 3] // Offset shadow down only
          }
        });
      }
      
      if (!map.getLayer(routeLayerId)) {
        // Clean, narrow flight line: bright blue, clean curves
        map.addLayer({ 
          id: routeLayerId, 
          type: 'line', 
          source: routeSourceId, 
          layout: { 
            'line-join': 'round', 
            'line-cap': 'round', 
            'line-sort-key': 2 // Render above shadow system
          }, 
          paint: { 
            'line-color': '#1e8ffe', // Bright blue color
            'line-width': 5, // Narrower for cleaner look
            'line-opacity': 1.0 // Full opacity
          }
        });
        
        // Subtle glow effect for narrow flight line
        if (!map.getLayer(routeGlowLayerId)) {
          map.addLayer({ 
            id: routeGlowLayerId, 
            type: 'line', 
            source: routeSourceId, 
            layout: { 
              'line-join': 'round', 
              'line-cap': 'round', 
              'visibility': 'visible', 
              'line-sort-key': 1 // Between shadow and main line
            }, 
            paint: { 
              'line-color': '#ffffff',
              'line-width': 8, // Wider than main line for glow
              'line-opacity': 0.15, // Very subtle glow
              'line-blur': 3 // Soft blur for glow effect
            }, 
            filter: ['==', '$type', 'LineString']
          }, routeLayerId);
        }
      }

      // Update or add arrows source and layers
      if (map.getSource(routeArrowsSourceId)) {
        map.getSource(routeArrowsSourceId).setData(arrowsData);
      } else {
        map.addSource(routeArrowsSourceId, { type: 'geojson', data: arrowsData });
        
        // Create invisible pill for text background blur effect only
        if (!map.hasImage('pill-image')) {
          // Create a completely transparent pill for text background blur
          const pillHeight = 120; 
          const pillWidth = 20;   
          const canvas = document.createElement('canvas');
          canvas.width = pillWidth;
          canvas.height = pillHeight;
          const ctx = canvas.getContext('2d');
          
          // Clear canvas - make completely transparent
          ctx.clearRect(0, 0, pillWidth, pillHeight);
          
          // Create a subtle semi-transparent background for text readability
          const radius = pillWidth / 2;
          
          // Very subtle dark background - barely visible, just for text contrast
          ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'; // Very transparent black
          ctx.beginPath();
          ctx.arc(radius, radius, radius, Math.PI, 0);
          ctx.lineTo(pillWidth, pillHeight - radius);
          ctx.arc(radius, pillHeight - radius, radius, 0, Math.PI);
          ctx.lineTo(0, radius);
          ctx.closePath();
          ctx.fill();
          
          // Add the image to the map
          const imageData = ctx.getImageData(0, 0, pillWidth, pillHeight);
          console.log("⭐ Adding pill image. Width:", pillWidth, "Height:", pillHeight);
          
          // Remove existing image if there is one
          if (map.hasImage('pill-image')) {
            map.removeImage('pill-image');
          }
          
          map.addImage('pill-image', { 
            data: imageData.data, 
            width: pillWidth, 
            height: pillHeight,
            sdf: false // Not an SDF image
          });
        }
        
        // Add invisible text background layer (just for readability, no visible pill)
        map.addLayer({
          id: 'route-pills',
          type: 'symbol',
          source: routeArrowsSourceId,
          layout: {
            'symbol-placement': 'point',
            'icon-image': 'pill-image',
            'icon-size': 1.0, // Normal size for subtle background
            'icon-rotate': ['get', 'bearing'],
            'icon-rotation-alignment': 'map',
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
            'symbol-sort-key': -1,
            'icon-padding': 1
          },
          paint: {
            'icon-opacity': 0.6, // Subtle background for text readability
            'icon-halo-color': 'rgba(0, 0, 0, 0.4)', // Very subtle dark halo for blur
            'icon-halo-width': 4, // Wider blur for text background effect
            'icon-halo-blur': 6, // Heavy blur for smooth background
            'icon-translate': [0, 0] // Centered perfectly on shadow line
          },
          filter: ['has', 'isLabel']
        });
        
        // Add text with enhanced readability on blurred background
        map.addLayer({
          id: legLabelsLayerId,
          type: 'symbol',
          source: routeArrowsSourceId,
          layout: {
            'symbol-placement': 'point',
            'text-field': ['get', 'text'],
            'text-size': 14, // Larger text for better readability
            'text-font': ['Arial Unicode MS Bold'],
            'text-rotate': ['-', ['get', 'bearing'], 90],
            'text-rotation-alignment': 'map',
            'text-allow-overlap': true,
            'text-ignore-placement': true,
            'symbol-sort-key': 1, // Render above background blur
            'text-anchor': 'center', 
            'text-justify': 'center',
            'visibility': 'visible'
          },
          paint: {
            'text-color': '#ffffff', // White text for maximum contrast
            'text-opacity': 1.0,
            'text-halo-color': 'rgba(0, 0, 0, 0.8)', // Strong dark halo for contrast
            'text-halo-width': 2, // Wide halo for readability on any background
            'text-halo-blur': 1, // Slight blur for smooth halo
            'text-translate': [0, 0] // Perfectly centered on shadow line
          },
          filter: ['has', 'isLabel']
        });
      }
      
      // Make all pills and labels visible - no filtering based on length or zoom

      // Add zoom listener to recalculate pill visibility
      if (!this._zoomHandler) {
        this._zoomHandler = () => {
          // Debounce to avoid too many updates
          if (this._zoomTimeout) clearTimeout(this._zoomTimeout);
          this._zoomTimeout = setTimeout(() => {
            this.updateRoute();
          }, 100);
        };
        map.on('zoom', this._zoomHandler);
      }

      if (map.getLayer('route-pills')) {
        map.setLayoutProperty('route-pills', 'visibility', 'visible');
        // Clear any filters that might be hiding pills
        map.setFilter('route-pills', ['has', 'isLabel']);
      }
      
      if (map.getLayer(legLabelsLayerId)) {
        map.setLayoutProperty(legLabelsLayerId, 'visibility', 'visible');
        // Clear any filters that might be hiding labels
        map.setFilter(legLabelsLayerId, ['has', 'isLabel']);
      }
      
      if (map.getLayer(routeArrowsLayerId)) {
        map.setLayoutProperty(routeArrowsLayerId, 'visibility', 'visible');
      }
      
      // No need for event handlers - just make everything visible

      // Make sure we trigger both callbacks to fully update the UI
      this.triggerCallback('onRouteUpdated', { waypoints: this.waypoints, coordinates: coordinates });
      this.triggerCallback('onChange', this.waypoints);
      
      // Also update global state for components that depend on it
      if (window.routeCalculator && typeof window.routeCalculator.calculateDistanceOnly === 'function') {
        window.routeCalculator.calculateDistanceOnly(coordinates);
      }
    } else {
      // No waypoints or only one, remove route display
      [routeGlowLayerId, routeLayerId, routeArrowsLayerId, legLabelsLayerId, 'route-pills'].forEach(layerId => {
        if (map.getLayer(layerId)) map.removeLayer(layerId);
      });
      [routeSourceId, routeArrowsSourceId].forEach(sourceId => {
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      });
      
      // Ensure we trigger callbacks even when removing the route
      this.triggerCallback('onRouteUpdated', { waypoints: [], coordinates: [] });
      this.triggerCallback('onChange', this.waypoints);
    }
  }
  
  _removeRouteLayersAndSources() {
    // Safely get map object
    let map = null;
    try {
      if (!this.mapManager) {
        console.warn('WaypointManager: mapManager is not available for _removeRouteLayersAndSources');
        return;
      }
      
      map = this.mapManager.getMap();
      if (!map) {
        console.warn('WaypointManager: map is not available for _removeRouteLayersAndSources');
        return;
      }
      
      // Check if map is loaded and has functions we need
      if (!this.mapManager.isMapLoaded() || 
          typeof map.getLayer !== 'function' || 
          typeof map.getSource !== 'function') {
        console.warn('WaypointManager: map is not fully loaded for _removeRouteLayersAndSources');
        return;
      }
    } catch (error) {
      console.error('WaypointManager: Error accessing map in _removeRouteLayersAndSources:', error);
      return;
    }

    const layerIds = ['route-glow', 'route', 'route-arrows', 'leg-labels', 'route-pills'];
    const sourceIds = ['route', 'route-arrows'];

    // Try to remove layers first
    layerIds.forEach(layerId => {
      try {
        if (map.getLayer(layerId)) {
          map.removeLayer(layerId);
        }
      } catch (e) {
        console.warn(`WaypointManager: Error removing layer ${layerId}: ${e.message}`);
      }
    });

    // Then try to remove sources
    sourceIds.forEach(sourceId => {
      try {
        if (map.getSource(sourceId)) {
          map.removeSource(sourceId);
        }
      } catch (e) {
        console.warn(`WaypointManager: Error removing source ${sourceId}: ${e.message}`);
      }
    });
  }

  clearRoute() {
    console.log('WaypointManager: Clearing route and markers');
    
    // Safely remove all markers
    try {
      if (this.markers && Array.isArray(this.markers)) {
        this.markers.forEach(marker => {
          try {
            if (marker && typeof marker.remove === 'function') {
              marker.remove();
            }
          } catch (e) {
            console.warn('Error removing marker:', e);
          }
        });
      }
    } catch (error) {
      console.error('Error clearing markers:', error);
    }
    
    // Reset internal arrays
    this.markers = [];
    this.waypoints = [];
    
    // Safely remove route layers and sources
    try {
      this._removeRouteLayersAndSources();
    } catch (error) {
      console.error('Error removing route layers/sources:', error);
    }
    
    // Always trigger callbacks, even if there were errors
    try {
      this.triggerCallback('onChange', this.waypoints);
      this.triggerCallback('onRouteUpdated', { waypoints: [], coordinates: [] });
    } catch (callbackError) {
      console.error('Error in clearRoute callbacks:', callbackError);
    }
  }
  
  reorderWaypoints(draggedId, dropTargetId) {
    const draggedIndex = this.waypoints.findIndex(wp => wp.id === draggedId);
    const dropTargetIndex = this.waypoints.findIndex(wp => wp.id === dropTargetId);
    if (draggedIndex === -1 || dropTargetIndex === -1) { console.error('Invalid waypoint IDs for reordering'); return; }
    const [movedWaypoint] = this.waypoints.splice(draggedIndex, 1);
    const [movedMarker] = this.markers.splice(draggedIndex, 1);
    this.waypoints.splice(dropTargetIndex, 0, movedWaypoint);
    this.markers.splice(dropTargetIndex, 0, movedMarker);
    this.updateRoute();
    this.triggerCallback('onChange', this.waypoints);
  }
  
  /**
   * Helper function to check if a waypoint is a navigation waypoint or landing stop
   * This consolidates all the different ways this can be identified
   * @param {Object} waypoint - The waypoint object to check
   * @returns {boolean} - True if it's a navigation waypoint, false if it's a landing stop
   */
  isNavigationWaypoint(waypoint) {
    if (!waypoint) return false;
    
    // Check in order of priority:
    // 1. First check the explicit point type (this is the most reliable indicator)
    if (waypoint.pointType === 'NAVIGATION_WAYPOINT') return true;
    if (waypoint.pointType === 'LANDING_STOP') return false;
    
    // 2. Check the isWaypoint boolean flag (older method)
    if (typeof waypoint.isWaypoint === 'boolean') return waypoint.isWaypoint;
    
    // 3. Check the type string (older method)
    if (waypoint.type === 'WAYPOINT') return true;
    if (waypoint.type === 'STOP') return false;
    
    // 4. As a fallback default, treat it as a landing stop
    return false;
  }
  
  /**
   * Get all waypoints of a specific type (navigation waypoints or landing stops)
   * @param {string} type - Either 'NAVIGATION_WAYPOINT' or 'LANDING_STOP'
   * @returns {Array} - Array of waypoints of the specified type
   */
  getWaypointsByType(type) {
    if (type === 'NAVIGATION_WAYPOINT') {
      return this.waypoints.filter(wp => this.isNavigationWaypoint(wp));
    } else if (type === 'LANDING_STOP') {
      return this.waypoints.filter(wp => !this.isNavigationWaypoint(wp));
    } else {
      console.error(`Invalid waypoint type requested: ${type}`);
      return [];
    }
  }
  
  /**
   * Count waypoints of each type (useful for debugging and UI display)
   * @returns {Object} - Object with counts for each type
   */
  countWaypointsByType() {
    const counts = {
      all: this.waypoints.length,
      navigationWaypoints: 0,
      landingStops: 0
    };
    
    this.waypoints.forEach(waypoint => {
      if (this.isNavigationWaypoint(waypoint)) {
        counts.navigationWaypoints++;
      } else {
        counts.landingStops++;
      }
    });
    
    return counts;
  }
  
  findPathInsertIndex(clickedPoint) {
    // Check if we have enough waypoints to determine a path
    if (this.waypoints.length < 2) {
      console.log('Not enough waypoints to find insert index, returning end position');
      return this.waypoints.length;
    }
    
    // Ensure we have turf.js available for calculations
    if (!window.turf) {
      console.error('Turf.js library not available for path calculations');
      return this.waypoints.length;
    }
    
    // Validate clickedPoint format
    if (!clickedPoint || typeof clickedPoint.lng !== 'number' || typeof clickedPoint.lat !== 'number') {
      console.error('Invalid clicked point format:', clickedPoint);
      return this.waypoints.length;
    }
    
    let minDistance = Number.MAX_VALUE; 
    let insertIndex = 1;
    let closestSegmentInfo = null;
    
    try {
      // Check each segment of the route to find the closest one
      for (let i = 0; i < this.waypoints.length - 1; i++) {
        // Get coordinates for this segment
        const segmentStart = this.waypoints[i].coords;
        const segmentEnd = this.waypoints[i+1].coords;
        
        // Skip invalid segments
        if (!segmentStart || !segmentEnd || 
            !Array.isArray(segmentStart) || !Array.isArray(segmentEnd) ||
            segmentStart.length !== 2 || segmentEnd.length !== 2) {
          console.warn(`Skipping invalid segment between waypoints ${i} and ${i+1}`);
          continue;
        }
        
        // Create a line segment and point to measure distance
        const segment = window.turf.lineString([segmentStart, segmentEnd]);
        const point = window.turf.point([clickedPoint.lng, clickedPoint.lat]);
        
        // Find the nearest point on this segment
        const nearestPoint = window.turf.nearestPointOnLine(segment, point, { units: 'nauticalmiles' });
        
        // If this is the closest segment so far, update our tracking variables
        if (nearestPoint.properties.dist < minDistance) { 
          minDistance = nearestPoint.properties.dist; 
          insertIndex = i + 1;
          closestSegmentInfo = {
            segmentStart: i,
            segmentEnd: i + 1,
            nearestPoint: nearestPoint.geometry.coordinates,
            distance: nearestPoint.properties.dist
          };
        }
      }
      
      // Log detailed information about the closest segment for debugging
      if (closestSegmentInfo) {
        console.log(`Found closest path segment between waypoints ${closestSegmentInfo.segmentStart} and ${closestSegmentInfo.segmentEnd}`);
        console.log(`Distance to nearest point: ${closestSegmentInfo.distance.toFixed(2)} nautical miles`);
        console.log(`Insertion index will be: ${insertIndex}`);
      } else {
        console.warn('No valid closest segment found - using end of route');
        insertIndex = this.waypoints.length;
      }
      
    } catch (error) { 
      console.error('Error finding path insert index:', error); 
      return this.waypoints.length; 
    }
    
    return insertIndex;
  }
  
  getWaypoints() { return this.waypoints; }
  getWaypointById(id) { return this.waypoints.find(wp => wp.id === id) || null; }
  updateWaypointName(id, name) {
    const waypoint = this.getWaypointById(id);
    if (waypoint) { waypoint.name = name; this.triggerCallback('onChange', this.waypoints); }
  }
  
  /**
   * Refresh the route display and labels - useful when layer visibility changes
   * This ensures route labels are restored after platform layer toggles
   */
  refreshRouteDisplay() {
    console.log('WaypointManager.refreshRouteDisplay: Refreshing route display and labels');
    
    const map = this.mapManager.getMap();
    if (!map || !this.mapManager.isMapLoaded()) {
      console.log('WaypointManager.refreshRouteDisplay: Map not ready, skipping refresh');
      return;
    }
    
    // If we have waypoints, trigger a route update to restore labels
    if (this.waypoints && this.waypoints.length >= 2) {
      console.log(`WaypointManager.refreshRouteDisplay: Refreshing route with ${this.waypoints.length} waypoints`);
      
      // Force update the route which will recreate all labels and sources
      this.updateRoute();
      
      // Ensure route and label layers are visible
      const layersToShow = ['route', 'route-glow', 'route-pills', 'leg-labels', 'route-arrows'];
      layersToShow.forEach(layerId => {
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(layerId, 'visibility', 'visible');
        }
      });
      
      console.log('WaypointManager.refreshRouteDisplay: Route display refreshed successfully');
    } else {
      console.log('WaypointManager.refreshRouteDisplay: No route to refresh (less than 2 waypoints)');
    }
  }

  setupRouteDragging(onRoutePointAdded) {
    const map = this.mapManager.getMap();
    if (!map) return;
    console.log('Setting up route dragging functionality...');
    
    // Clean up any existing handlers to prevent duplicates
    if (this._routeDragHandlers) {
      map.off('mousedown', this._routeDragHandlers.mousedown);
      map.off('mousemove', this._routeDragHandlers.mousemove);
      map.off('mouseup', this._routeDragHandlers.mouseup);
      map.off('mouseout', this._routeDragHandlers.mouseout);
      this._routeDragHandlers = null;
      console.log('Removed existing route drag handlers');
    }
    
    // Store original handler in global for debugging
    window._originalRouteDragHandler = onRoutePointAdded;
    
    // Create a wrapped handler that ensures insertion happens directly
    const wrappedHandler = (insertIndex, coords, dragData = {}) => {
      console.log(`WaypointManager.setupRouteDragging -> wrappedHandler called with insertIndex=${insertIndex}, coords: ${JSON.stringify(coords)}, dragData: ${JSON.stringify(dragData)}`);
      
      // The `onRoutePointAdded` is `MapInteractionHandler.handleRouteDragComplete`.
      // Let `MapInteractionHandler` be responsible for all logic related to determining
      // snapping, naming, and calling `waypointManager.addWaypointAtIndex`.
      // This `wrappedHandler`'s job is just to pass the raw drag results.
      if (typeof onRoutePointAdded === 'function') {
        console.log(`WaypointManager.setupRouteDragging -> wrappedHandler: Calling onRoutePointAdded (MapInteractionHandler.handleRouteDragComplete)`);
        onRoutePointAdded(insertIndex, coords, dragData);
      } else {
        console.error('WaypointManager.setupRouteDragging -> wrappedHandler: onRoutePointAdded callback is not a function!');
      }
    };
    
    // Save the wrapped handler for debugging
    window._wrappedRouteDragHandler = wrappedHandler;
    
    // Drag state variables
    let isDragging = false;
    let draggedLineCoordinates = [];
    let originalLineCoordinates = [];
    let dragStartPoint = null;
    let closestPointIndex = -1;
    let dragLineSource = null;
    
    // Helper to add the drag line visualization
    const addDragLine = (coordinates) => {
      try {
        // Remove existing line if present
        if (map.getSource('drag-line')) { 
          map.removeLayer('drag-line'); 
          map.removeSource('drag-line'); 
        }
        
        // Add the new line source
        map.addSource('drag-line', { 
          type: 'geojson', 
          data: { 
            type: 'Feature', 
            properties: {}, 
            geometry: { 
              type: 'LineString', 
              coordinates: coordinates 
            }
          }
        });
        
        // Use different styling based on current mode
        const isWaypointMode = window.isWaypointModeActive === true;
        
        // Add the line layer
        map.addLayer({ 
          id: 'drag-line', 
          type: 'line', 
          source: 'drag-line', 
          layout: { 
            'line-join': 'round', 
            'line-cap': 'round' 
          }, 
          paint: { 
            'line-color': isWaypointMode ? '#BA55D3' : '#FF4136', // Medium purple for waypoints, red for stops
            'line-width': 4,
            'line-dasharray': [2, 1] // Dashed line
          }
        });
        
        // Store a reference to the line source for updating
        dragLineSource = map.getSource('drag-line');
      } catch (error) { 
        console.error('Error adding drag line:', error); 
      }
    };
    
    // Helper to find the closest point on the route line
    const findClosestPointOnLine = (mouseLngLat, mousePoint) => {
      try {
        // Check if we have a route to work with
        if (!map.getSource('route')) return null;
        
        // Check if mouse is directly over the route
        const routeFeatures = map.queryRenderedFeatures(mousePoint, { layers: ['route'] });
        const isMouseOverRoute = routeFeatures && routeFeatures.length > 0;
        
        // Get the route source data
        const routeSource = map.getSource('route');
        if (!routeSource || !routeSource._data) return null;
        
        // Get route coordinates
        const coordinates = routeSource._data.geometry.coordinates;
        if (!coordinates || coordinates.length < 2) return null;
        
        // Find the closest segment
        let minDistance = Infinity;
        let closestPoint = null;
        let segmentIndex = -1;
        
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
        
        // Calculate distance in nautical miles
        const distanceNM = window.turf.distance(
          window.turf.point([mouseLngLat.lng, mouseLngLat.lat]),
          window.turf.point(closestPoint),
          { units: 'nauticalmiles' }
        );
        
        // Return result if close enough or directly over the route
        if (isMouseOverRoute || distanceNM < 0.5) {
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
    
    // Mouse down handler - start the drag operation
    const handleMouseDown = (e) => {
      // Skip if no route or if right-click (context menu)
      if (!map.getSource('route') || e.originalEvent.button === 2) return;
      
      // Skip if clicking on a platform
      const platformLayerIds = ['platforms-fixed-layer', 'platforms-movable-layer', 'airfields-layer'].filter(id => map.getLayer(id));
      if (platformLayerIds.length > 0) {
        const platformFeatures = map.queryRenderedFeatures(e.point, { layers: platformLayerIds });
        if (platformFeatures.length > 0) return;
      }
      
      // Find the closest point on the route
      const closestInfo = findClosestPointOnLine(e.lngLat, e.point);
      
      if (closestInfo) {
        // Set global flag for other components to check
        window._isRouteDragging = true;
        console.log('Starting route drag operation at segment:', closestInfo.index);
        
        // Get the route source
        const routeSource = map.getSource('route');
        if (!routeSource || !routeSource._data) return;
        
        // Start the drag operation
        originalLineCoordinates = [...routeSource._data.geometry.coordinates];
        isDragging = true;
        dragStartPoint = closestInfo.point;
        closestPointIndex = closestInfo.index;
        
        // Create the modified line coordinates with a new point
        draggedLineCoordinates = [...originalLineCoordinates];
        draggedLineCoordinates.splice(closestPointIndex + 1, 0, closestInfo.point);
        
        // Add the visualization
        addDragLine(draggedLineCoordinates);
        
        // Hide the original route during dragging
        map.setLayoutProperty('route', 'visibility', 'none');
        if (map.getLayer('route-glow')) {
          map.setLayoutProperty('route-glow', 'visibility', 'none');
        }
        
        // Change the cursor
        map.getCanvas().style.cursor = 'grabbing';
        
        // Prevent default handling
        e.preventDefault();
      }
    };
    
    // Mouse move handler - update the drag line
    const handleMouseMove = (e) => {
      if (isDragging) {
        // Update the dragged point position
        draggedLineCoordinates[closestPointIndex + 1] = [e.lngLat.lng, e.lngLat.lat];
        
        // Update the visualization
        if (dragLineSource) {
          dragLineSource.setData({
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: draggedLineCoordinates
            }
          });
        }
      } else {
        // When not dragging, handle cursor style changes on hover
        const closestInfo = findClosestPointOnLine(e.lngLat, e.point);
        
        if (closestInfo && closestInfo.isDirectlyOver) {
          map.getCanvas().style.cursor = 'pointer';
        } else if (map.getCanvas().style.cursor === 'pointer') {
          // Check if over a platform, if not reset cursor
          const platformLayerIds = ['platforms-fixed-layer', 'platforms-movable-layer', 'airfields-layer'].filter(id => map.getLayer(id));
          let onPlatform = false;
          if (platformLayerIds.length > 0) {
            const platformFeatures = map.queryRenderedFeatures(e.point, { layers: platformLayerIds });
            if (platformFeatures.length > 0) {
              onPlatform = true;
            }
          }
          if (!onPlatform) {
            map.getCanvas().style.cursor = '';
          }
        }
      }
    };
    
    // Mouse up handler - complete the drag operation
    const handleMouseUp = (e) => {
      if (!isDragging) return;
      
      // Set flags for other components
      window._routeDragJustFinished = true;
      
      // Prevent event propagation
      e.preventDefault();
      if (e.originalEvent && typeof e.originalEvent.stopPropagation === 'function') {
        e.originalEvent.stopPropagation();
      }
      if (e.originalEvent && typeof e.originalEvent.stopImmediatePropagation === 'function') {
        e.originalEvent.stopImmediatePropagation();
      }
      
      // End the drag operation
      isDragging = false;
      
      // Clean up the visualization
      if (map.getSource('drag-line')) {
        map.removeLayer('drag-line');
        map.removeSource('drag-line');
      }
      
      // Show the original route again
      map.setLayoutProperty('route', 'visibility', 'visible');
      if (map.getLayer('route-glow')) {
        map.setLayoutProperty('route-glow', 'visibility', 'visible');
      }
      
      // Check if we're in waypoint mode
      const isWaypointMode = window.isWaypointModeActive === true;
      
      // Validate the insertion index before using it
      let validatedInsertIndex = closestPointIndex + 1;
      
      // Ensure index is within valid bounds
      if (validatedInsertIndex < 0) {
        validatedInsertIndex = 0;
      }
      if (validatedInsertIndex > this.waypoints.length) {
        validatedInsertIndex = this.waypoints.length;
      }
      
      console.log(`Route drag completed in ${isWaypointMode ? 'WAYPOINT' : 'NORMAL'} mode with index ${validatedInsertIndex}`);
      
      // Use our wrapped handler that directly adds the waypoint
      wrappedHandler(validatedInsertIndex, [e.lngLat.lng, e.lngLat.lat], { 
        isWaypointMode: isWaypointMode,
        lngLat: e.lngLat,
        point: e.point, // Add the pixel point
        originalIndex: closestPointIndex + 1
      });
      
      // Reset cursor style
      map.getCanvas().style.cursor = '';
      
      // Clean up variables
      draggedLineCoordinates = [];
      originalLineCoordinates = [];
      dragStartPoint = null;
      closestPointIndex = -1;
      dragLineSource = null;
      
      // Reset global flags after a short delay
      setTimeout(() => {
        window._isRouteDragging = false;
        window._routeDragJustFinished = false;
      }, 50);
    };
    
    // Mouse out handler - cancel dragging if mouse leaves the map
    const handleMouseOut = () => {
      if (!isDragging) return;
      
      console.log('Mouse left map area, canceling route drag');
      
      // End the drag operation
      isDragging = false;
      
      // Clean up the visualization
      if (map.getSource('drag-line')) {
        map.removeLayer('drag-line');
        map.removeSource('drag-line');
      }
      
      // Show the original route again
      map.setLayoutProperty('route', 'visibility', 'visible');
      if (map.getLayer('route-glow')) {
        map.setLayoutProperty('route-glow', 'visibility', 'visible');
      }
      
      // Reset cursor style
      map.getCanvas().style.cursor = '';
      
      // Clean up variables
      draggedLineCoordinates = [];
      originalLineCoordinates = [];
      dragStartPoint = null;
      closestPointIndex = -1;
      dragLineSource = null;
      
      // Reset global flags
      window._isRouteDragging = false;
      window._routeDragJustFinished = false;
    };
    
    // Set up the event handlers
    map.on('mousedown', handleMouseDown);
    map.on('mousemove', handleMouseMove);
    map.on('mouseup', handleMouseUp);
    map.on('mouseout', handleMouseOut);
    
    // Store references to the handlers for later cleanup
    this._routeDragHandlers = {
      mousedown: handleMouseDown,
      mousemove: handleMouseMove,
      mouseup: handleMouseUp,
      mouseout: handleMouseOut
    };
    
    console.log('Route dragging functionality set up successfully');
  }
}

export default WaypointManager;
