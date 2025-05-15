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
        color: isWaypoint ? "turquoise" : "#FF4136", // Turquoise for waypoints, red for stops
        draggable: true,
        scale: 0.5 // Make them small (50% of normal size) for better visibility
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
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
          <strong style="color: ${isWaypoint ? '#825500' : '#333333'}">${displayName}</strong>
          <span class="favorite-button" title="Add to favorites" style="cursor: pointer; font-size: 18px;" onclick="window.addToFavorites('${displayName}', [${coords[0]}, ${coords[1]}])">❤️</span>
        </div>
        <span class="coord-label">Lat:</span> <span class="coord-value">${coords[1].toFixed(5)}</span><br>
        <span class="coord-label">Lon:</span> <span class="coord-value">${coords[0].toFixed(5)}</span>
        <div style="margin-top: 5px; font-size: 10px; padding: 1px 4px; background-color: ${isWaypoint ? '#FFCC00' : '#FF4136'}; color: #333; display: inline-block; border-radius: 3px;">
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
        
        // Show popup on mouseenter (hover)
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
      
      // Return the created marker
      return marker;
      
    } catch (error) { 
      console.error('Error creating waypoint marker:', error);
      return null; 
    }
  }
  
  createArrowsAlongLine(allWaypointsCoordinates, routeStats = null) {
    if (!allWaypointsCoordinates || allWaypointsCoordinates.length < 2) return { type: 'FeatureCollection', features: [] };
    const features = []; const turf = window.turf; if (!turf) { console.error("Turf.js is not available."); return { type: 'FeatureCollection', features: [] }; }
    const currentDisplayStats = routeStats || window.currentRouteStats;
    if (currentDisplayStats && currentDisplayStats.legs && currentDisplayStats.legs.length > 0) {
      currentDisplayStats.legs.forEach((leg, index) => {
        if (!leg.departureCoords || !leg.arrivalCoords) return;
        const startPointCoords = leg.departureCoords; const endPointCoords = leg.arrivalCoords;
        const legDistanceNm = parseFloat(leg.distance); const legBearing = turf.bearing(turf.point(startPointCoords), turf.point(endPointCoords));
        const midPoint = turf.along(turf.lineString([startPointCoords, endPointCoords]), legDistanceNm * 0.5, { units: 'nauticalmiles' });
        const distanceText = `${legDistanceNm.toFixed(1)} nm`; let timeText = leg.timeFormatted || '00:00';
        if (currentDisplayStats.windAdjusted && typeof leg.windEffect === 'number' && Math.abs(leg.windEffect) > 1) timeText += '*';
        const goingLeftToRight = endPointCoords[0] > startPointCoords[0];
        let labelText = `${!goingLeftToRight ? '← ' : ''}${distanceText}${timeText ? ` • ${timeText}` : ''}${goingLeftToRight ? ' →' : ''}`;
        let adjustedBearing = legBearing + 90; if (adjustedBearing > 90 && adjustedBearing < 270) adjustedBearing = (adjustedBearing + 180) % 360;
        features.push({ type: 'Feature', geometry: midPoint.geometry, properties: { isLabel: true, bearing: legBearing, textBearing: adjustedBearing, text: labelText, legIndex: index }});
      });
    } else { console.warn('⚓ createArrowsAlongLine: No structured leg data in routeStats.'); }
    return { type: 'FeatureCollection', features: features };
  }
  
  removeWaypoint(id, index) {
    if (index === undefined || index < 0 || index >= this.waypoints.length) {
      index = this.waypoints.findIndex(wp => wp.id === id);
      if (index === -1) { console.error(`WaypointManager: Cannot find waypoint with ID ${id}`); return; }
    }
    const removedWaypoint = this.waypoints[index];
    if (this.markers[index]) { try { this.markers[index].remove(); } catch (error) { console.error('Error removing marker:', error); }}
    this.markers.splice(index, 1); this.waypoints.splice(index, 1);
    this.updateRoute();
    if (removedWaypoint) this.triggerCallback('onWaypointRemoved', removedWaypoint);
    this.triggerCallback('onChange', this.waypoints);
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

    // Ensure routeStats are available or fall back to global
    if (routeStats) {
      // Simplified time calculation logic (can be expanded if needed)
      if ((!routeStats.timeHours || routeStats.timeHours === 0) && routeStats.totalDistance) {
        const cruiseSpeed = routeStats.aircraft?.cruiseSpeed || window.currentSelectedAircraft?.cruiseSpeed || 135;
        const totalDistanceNum = parseFloat(routeStats.totalDistance);
        if (totalDistanceNum > 0 && cruiseSpeed > 0) {
          const timeHours = totalDistanceNum / cruiseSpeed;
          const hours = Math.floor(timeHours);
          const minutes = Math.floor((timeHours - hours) * 60);
          routeStats.timeHours = timeHours;
          routeStats.estimatedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        }
      }
      window.currentRouteStats = {...(window.currentRouteStats || {}), ...routeStats};
    } else if (window.currentRouteStats) {
      routeStats = window.currentRouteStats;
    }

    const routeSourceId = 'route';
    const routeArrowsSourceId = 'route-arrows';
    const routeLayerId = 'route';
    const routeGlowLayerId = 'route-glow';
    const routeArrowsLayerId = 'route-arrows';
    const legLabelsLayerId = 'leg-labels';

    if (this.waypoints.length >= 2) {
      const coordinates = this.waypoints.map(wp => wp.coords);
      const routeGeoJson = { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coordinates }};
      const arrowsData = this.createArrowsAlongLine(coordinates, routeStats);

      // Update or add route source and layers
      if (map.getSource(routeSourceId)) {
        map.getSource(routeSourceId).setData(routeGeoJson);
      } else {
        map.addSource(routeSourceId, { type: 'geojson', data: routeGeoJson });
        map.addLayer({ id: routeLayerId, type: 'line', source: routeSourceId, layout: { 'line-join': 'round', 'line-cap': 'round', 'line-sort-key': 1 }, paint: { 'line-color': '#007bff', 'line-width': 6, 'line-opacity': 0.8 }});
        map.addLayer({ id: routeGlowLayerId, type: 'line', source: routeSourceId, layout: { 'line-join': 'round', 'line-cap': 'round', 'visibility': 'visible', 'line-sort-key': 0 }, paint: { 'line-color': '#ffffff', 'line-width': 10, 'line-opacity': 0.15, 'line-blur': 3 }, filter: ['==', '$type', 'LineString']}, routeLayerId);
      }

      // Update or add arrows source and layers
      if (map.getSource(routeArrowsSourceId)) {
        map.getSource(routeArrowsSourceId).setData(arrowsData);
      } else {
        map.addSource(routeArrowsSourceId, { type: 'geojson', data: arrowsData });
        if (!map.hasImage('arrow-icon')) {
          const size = 24; const canvas = document.createElement('canvas'); canvas.width = size; canvas.height = size; const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, size, size); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(size/2, 0); ctx.lineTo(size, size); ctx.lineTo(size/2, size*0.7); ctx.lineTo(0, size); ctx.closePath(); ctx.fill();
          map.addImage('arrow-icon', { data: ctx.getImageData(0, 0, size, size).data, width: size, height: size });
        }
        map.addLayer({ id: routeArrowsLayerId, type: 'symbol', source: routeArrowsSourceId, layout: { 'symbol-placement': 'point', 'icon-image': 'arrow-icon', 'icon-size': 0.5, 'icon-rotate': ['get', 'bearing'], 'icon-rotation-alignment': 'map', 'icon-allow-overlap': true, 'icon-ignore-placement': true, 'symbol-sort-key': 2, 'visibility': 'none' }, paint: { 'icon-opacity': 0 }, filter: ['!', ['has', 'isLabel']]}); // Initially hidden, controlled by zoom/logic
        map.addLayer({ id: legLabelsLayerId, type: 'symbol', source: routeArrowsSourceId, layout: { 'symbol-placement': 'point', 'text-field': ['get', 'text'], 'text-size': 11, 'text-font': ['Arial Unicode MS Bold'], 'text-offset': [0, -0.5], 'text-anchor': 'center', 'text-rotate': ['get', 'textBearing'], 'text-rotation-alignment': 'map', 'text-allow-overlap': true, 'text-ignore-placement': true, 'text-max-width': 30, 'text-line-height': 1.0, 'symbol-sort-key': 3 }, paint: { 'text-color': '#ffffff', 'text-halo-color': '#000000', 'text-halo-width': 3, 'text-opacity': 0.9 }, filter: ['has', 'isLabel']});
      }
      
      // Ensure layers exist before trying to set visibility (e.g. for arrows)
      if (map.getLayer(routeArrowsLayerId)) {
          // Example: Show arrows only at certain zoom levels (can be expanded)
          const currentZoom = map.getZoom();
          map.setLayoutProperty(routeArrowsLayerId, 'visibility', currentZoom > 7 ? 'visible' : 'none');
      }


      this.triggerCallback('onRouteUpdated', { waypoints: this.waypoints, coordinates: coordinates });
      if (window.routeCalculator && typeof window.routeCalculator.calculateDistanceOnly === 'function') {
        window.routeCalculator.calculateDistanceOnly(coordinates);
      }
    } else {
      // No waypoints or only one, remove route display
      [routeGlowLayerId, routeLayerId, routeArrowsLayerId, legLabelsLayerId].forEach(layerId => {
        if (map.getLayer(layerId)) map.removeLayer(layerId);
      });
      [routeSourceId, routeArrowsSourceId].forEach(sourceId => {
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      });
      this.triggerCallback('onRouteUpdated', { waypoints: [], coordinates: [] });
    }
  }
  
  _removeRouteLayersAndSources() {
    const map = this.mapManager.getMap();
    if (!map || !this.mapManager.isMapLoaded()) return;

    const layerIds = ['route-glow', 'route', 'route-arrows', 'leg-labels'];
    const sourceIds = ['route', 'route-arrows'];

    layerIds.forEach(layerId => {
      if (map.getLayer(layerId)) {
        try {
          map.removeLayer(layerId);
        } catch (e) {
          console.warn(`Error removing layer ${layerId}: ${e.message}`);
        }
      }
    });

    sourceIds.forEach(sourceId => {
      if (map.getSource(sourceId)) {
        try {
          map.removeSource(sourceId);
        } catch (e) {
          console.warn(`Error removing source ${sourceId}: ${e.message}`);
        }
      }
    });
  }

  clearRoute() {
    this.markers.forEach(marker => marker.remove());
    this.markers = [];
    this.waypoints = [];
    
    this._removeRouteLayersAndSources(); // Use the helper method
    
    this.triggerCallback('onChange', this.waypoints);
    // Also explicitly trigger onRouteUpdated with empty data to clear any UI dependent on it
    this.triggerCallback('onRouteUpdated', { waypoints: [], coordinates: [] }); 
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
            'line-color': isWaypointMode ? '#FFCC00' : '#FF4136', // Yellow for waypoints, red for stops
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
