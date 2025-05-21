/**
 * WaypointModeHandler.js
 * 
 * A completely separate handler for waypoint insertion mode.
 * This is independent from the regular MapInteractionHandler when in waypoint mode.
 */

class WaypointModeHandler {
  constructor(mapManager, waypointManager, platformManager) {
    this.mapManager = mapManager;
    this.waypointManager = waypointManager;
    this.platformManager = platformManager;
    this.isActive = false;
    this.clickHandler = null;
    this.dragHandlers = {
      mousedown: null,
      mousemove: null,
      mouseup: null
    };
  }
  
  /**
   * Activate waypoint mode
   * Completely disables all existing map handlers and sets up dedicated waypoint handlers
   * @returns {boolean} - Success status
   */
  activate() {
    console.log("WaypointModeHandler: Activating waypoint mode");
    
    if (this.isActive) {
      console.log("WaypointModeHandler: Already active");
      return true;
    }
    
    const map = this.mapManager.getMap();
    if (!map) {
      console.error("WaypointModeHandler: Cannot activate, map is not initialized");
      return false;
    }
    
    try {
      // CRITICAL ADDITION: Force global flag to true
      window.isWaypointModeActive = true;
      console.log("CRITICAL FIX: Setting global waypoint mode flag to TRUE");
      
      // CRITICAL FIX: First check and store original methods if they haven't been already
      if (this.waypointManager && this.waypointManager.addWaypoint && !this._originalAddWaypoint) {
        console.log("CRITICAL FIX: Storing original addWaypoint method");
        this._originalAddWaypoint = this.waypointManager.addWaypoint;
        
        // Patch the addWaypoint method to ALWAYS add a waypoint in waypoint mode
        this.waypointManager.addWaypoint = (coords, name, metadata = {}) => {
          console.log("CRITICAL FIX: Using patched addWaypoint that forces isWaypoint=true");
          // Force isWaypoint = true in waypoint mode, no matter how it's called
          const waypointMetadata = { ...metadata, isWaypoint: true, type: 'WAYPOINT' };
          return this._originalAddWaypoint.call(this.waypointManager, coords, name, waypointMetadata);
        };
      } else {
        console.log("WARNING: Either addWaypoint doesn't exist or already stored original");
      }
      
      // Also patch the addWaypointAtIndex method
      if (this.waypointManager && this.waypointManager.addWaypointAtIndex && !this._originalAddWaypointAtIndex) {
        console.log("CRITICAL FIX: Storing original addWaypointAtIndex method");
        this._originalAddWaypointAtIndex = this.waypointManager.addWaypointAtIndex;
        
        // Patch the method to force the waypoint flag
        this.waypointManager.addWaypointAtIndex = (coords, name, index, metadata = {}) => {
          console.log(`CRITICAL FIX: Using patched addWaypointAtIndex that forces isWaypoint=true at index ${index}`);
          // Force isWaypoint = true in waypoint mode
          const waypointMetadata = { ...metadata, isWaypoint: true, type: 'WAYPOINT' };
          return this._originalAddWaypointAtIndex.call(
            this.waypointManager, 
            coords, 
            name, 
            index, 
            waypointMetadata
          );
        };
      } else {
        console.log("WARNING: Either addWaypointAtIndex doesn't exist or already stored original");
      }
      
      // STEP 1: Remove all existing click handlers from the map
      console.log("CRITICAL FIX: Removing ALL existing map click handlers");
      map.off('click');
      
      // Also remove any layer-specific handlers
      const layers = ['route', 'platforms-layer', 'platforms-fixed-layer', 
                      'platforms-movable-layer', 'airfields-layer', 'waypoints-layer'];
      
      layers.forEach(layer => {
        if (map.getLayer(layer)) {
          console.log(`CRITICAL FIX: Removing click handler from ${layer} layer`);
          map.off('click', layer);
        }
      });
      
      // Remove existing drag handlers
      map.off('mousedown');
      map.off('mousemove');
      map.off('mouseup');
      
      // STEP 2: Set up our dedicated waypoint click handler
      console.log("CRITICAL FIX: Setting up dedicated waypoint click handler");
      this.clickHandler = this.handleMapClick.bind(this);
      map.on('click', this.clickHandler);
      
      // STEP 3: Set up route line drag handler for waypoint insertion
      this.setupRouteDragHandlers(map);
      
      // STEP 4: Tell PlatformManager to switch to waypoint mode
      if (this.platformManager && typeof this.platformManager.toggleWaypointMode === 'function') {
        this.platformManager.toggleWaypointMode(true);
      }
      
      // STEP 5: Change map cursor to indicate waypoint mode
      map.getCanvas().style.cursor = 'crosshair';
      
      // Set active flag
      this.isActive = true;
      
      console.log("WaypointModeHandler: Waypoint mode activated successfully");
      return true;
    } catch (error) {
      console.error("WaypointModeHandler: Error activating waypoint mode:", error);
      this.deactivate(); // Try to clean up
      return false;
    }
  }
  
  /**
   * Deactivate waypoint mode and restore normal handlers
   * @returns {boolean} - Success status
   */
  deactivate() {
    console.log("WaypointModeHandler: Deactivating waypoint mode");
    
    if (!this.isActive) {
      console.log("WaypointModeHandler: Already inactive");
      return true;
    }
    
    const map = this.mapManager.getMap();
    if (!map) {
      console.error("WaypointModeHandler: Cannot deactivate, map is not initialized");
      return false;
    }
    
    try {
      // CRITICAL: Clear any potential interval check
      if (this._checkIntervalId) {
        clearInterval(this._checkIntervalId);
        this._checkIntervalId = null;
      }
      
      // CRITICAL: Clear global flag to ensure we're in normal mode
      console.log("CRITICAL FIX: Explicitly clearing global waypoint mode flag");
      window.isWaypointModeActive = false;
      
      // CRITICAL ADDITION: Restore original addWaypoint method
      if (this.waypointManager && this._originalAddWaypoint) {
        console.log("CRITICAL FIX: Restoring original addWaypoint method");
        this.waypointManager.addWaypoint = this._originalAddWaypoint;
        this._originalAddWaypoint = null;
      } else {
        console.log("WARNING: No original addWaypoint method stored to restore");
      }
      
      // Also restore addWaypointAtIndex if we patched it
      if (this.waypointManager && this._originalAddWaypointAtIndex) {
        console.log("CRITICAL FIX: Restoring original addWaypointAtIndex method");
        this.waypointManager.addWaypointAtIndex = this._originalAddWaypointAtIndex;
        this._originalAddWaypointAtIndex = null;
      } else {
        console.log("WARNING: No original addWaypointAtIndex method stored to restore");
      }
      
      // Remove our waypoint handlers
      if (this.clickHandler) {
        console.log("CRITICAL FIX: Removing waypoint click handler");
        map.off('click', this.clickHandler);
        this.clickHandler = null;
      } else {
        console.log("WARNING: No waypoint click handler stored to remove");
      }
      
      // Remove drag handlers
      if (this.dragHandlers.mousedown) {
        console.log("CRITICAL FIX: Removing waypoint drag handlers");
        map.off('mousedown', this.dragHandlers.mousedown);
      }
      if (this.dragHandlers.mousemove) {
        map.off('mousemove', this.dragHandlers.mousemove);
      }
      if (this.dragHandlers.mouseup) {
        map.off('mouseup', this.dragHandlers.mouseup);
      }
      this.dragHandlers = { mousedown: null, mousemove: null, mouseup: null };
      
      // Tell PlatformManager to switch back to normal mode
      if (this.platformManager && typeof this.platformManager.toggleWaypointMode === 'function') {
        console.log("CRITICAL FIX: Telling PlatformManager to exit waypoint mode");
        this.platformManager.toggleWaypointMode(false);
      }
      
      // CRITICAL: Reset map cursor
      if (map && map.getCanvas) {
        map.getCanvas().style.cursor = '';
      }
      
      // Set inactive flag
      this.isActive = false;
      
      // Clean up any temporary drag lines
      if (map.getSource('waypoint-drag-line')) {
        if (map.getLayer('waypoint-drag-line')) {
          map.removeLayer('waypoint-drag-line');
        }
        map.removeSource('waypoint-drag-line');
      }
      
      // Make sure the route is visible
      if (map.getLayer('route')) {
        map.setLayoutProperty('route', 'visibility', 'visible');
      }
      if (map.getLayer('route-glow')) {
        map.setLayoutProperty('route-glow', 'visibility', 'visible');
      }
      
      console.log("WaypointModeHandler: Waypoint mode deactivated successfully");
      return true;
    } catch (error) {
      console.error("WaypointModeHandler: Error deactivating waypoint mode:", error);
      return false;
    }
  }
  
  /**
   * Handle map click events in waypoint mode
   * @param {Object} e - The map click event
   */
  handleMapClick(e) {
    if (window.isRegionLoading === true) {
      console.log('WaypointModeHandler: Ignoring click - region is loading/changing.');
      if (window.LoadingIndicator) window.LoadingIndicator.updateStatusIndicator('Map interactions paused during region update...', 'info', 1500);
      return;
    }
    // Only process if we're active
    if (!this.isActive) return;
    
    console.log("DIRECT FIX: WaypointModeHandler handling map click in waypoint mode", e.lngLat);
    
    try {
      const map = this.mapManager.getMap();
      if (!map) return;
      
      // 1. Check if clicking on a waypoint marker
      const waypointFeatures = map.queryRenderedFeatures(e.point, { 
        layers: ['waypoints-layer'] 
      });
      
      if (waypointFeatures && waypointFeatures.length > 0) {
        console.log("DIRECT FIX: Clicked on waypoint marker");
        const props = waypointFeatures[0].properties;
        const coordinates = waypointFeatures[0].geometry.coordinates;
        
        // Get the waypoint name from properties
        const name = props.name || 'Waypoint';
        
        // DIRECT FIX: Force isWaypoint flag to true and add explicit type
        const waypointData = {
          coordinates: coordinates,
          name: name,
          isWaypoint: true,
          type: 'WAYPOINT'
        };
        
        console.log("DIRECT FIX: Adding clicked waypoint with forced waypoint flag", waypointData);
        
        // Add to route with explicit isWaypoint flag
        this.addWaypointToRoute(coordinates, name, true);
        
        // Show success message
        this.showStatusMessage(`Added waypoint ${name} to route`, 'success');
        
        // Prevent further handling
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      
      // 2. Check for nearest waypoint to click location
      console.log("DIRECT FIX: Looking for nearest OSDK waypoint to click location");
      
      const nearestWaypoint = this.platformManager.findNearestOsdkWaypoint( // Use findNearestOsdkWaypoint
        e.lngLat.lat, 
        e.lngLat.lng, 
        5 // Max distance in nautical miles
      );
      
      if (nearestWaypoint) {
        console.log(`DIRECT FIX: Found nearest waypoint: ${nearestWaypoint.name} (${nearestWaypoint.distance.toFixed(2)} nm)`);
        
        // Add to the route with forced isWaypoint flag
        const waypointCoordinates = nearestWaypoint.coordinates || 
                                      nearestWaypoint.coords || 
                                      [nearestWaypoint.lng, nearestWaypoint.lat];
                                      
        console.log("DIRECT FIX: Adding nearest waypoint with forced waypoint flag");
        this.addWaypointToRoute(
          waypointCoordinates, 
          nearestWaypoint.name,
          true // isWaypoint - forced to true
        );
        
        // Show success message
        this.showStatusMessage(
          `Added waypoint ${nearestWaypoint.name} to route`,
          'success'
        );
      } else {
        // No nearby waypoint
        this.showStatusMessage(
          'No navigation waypoint found near click location. Try clicking on a yellow waypoint dot.',
          'warning'
        );
      }
      
      // Prevent further handling
      e.preventDefault();
      e.stopPropagation();
    } catch (error) {
      console.error("WaypointModeHandler: Error handling map click:", error);
      
      // Show error message
      this.showStatusMessage(
        `Error: ${error.message}`,
        'error'
      );
    }
  }
  
  /**
   * Set up handlers for route drag in waypoint mode
   * @param {Object} map - The map instance
   */
  setupRouteDragHandlers(map) {
    console.log("WaypointModeHandler: Setting up route drag handlers");
    
    let isDragging = false;
    let draggedLineCoordinates = [];
    let originalLineCoordinates = [];
    let closestPointIndex = -1;
    let dragLineSource = null;
    
    // Create a temp drag line for visual feedback
    const addDragLine = (coordinates) => {
      try {
        if (map.getSource('waypoint-drag-line')) {
          map.removeLayer('waypoint-drag-line');
          map.removeSource('waypoint-drag-line');
        }
        
        map.addSource('waypoint-drag-line', {
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
          'id': 'waypoint-drag-line',
          'type': 'line',
          'source': 'waypoint-drag-line',
          'layout': {
            'line-join': 'round',
            'line-cap': 'round'
          },
          'paint': {
            'line-color': '#BA55D3', // Medium purple for waypoint mode
            'line-width': 4,
            'line-dasharray': [2, 1] // Dashed line for visual distinction
          }
        });
        
        dragLineSource = map.getSource('waypoint-drag-line');
      } catch (error) {
        console.error("WaypointModeHandler: Error adding drag line:", error);
      }
    };
    
    // Function to find the closest point on the route line
    const findClosestPointOnLine = (mouseLngLat, mousePoint) => {
      if (!map.getSource('route')) return null;
      
      // Check if mouse is directly over the route
      const routeFeatures = map.queryRenderedFeatures(mousePoint, { layers: ['route'] });
      const isMouseOverRoute = routeFeatures && routeFeatures.length > 0;
      
      // Get route coordinates
      const routeSource = map.getSource('route');
      if (!routeSource || !routeSource._data) return null;
      
      const coordinates = routeSource._data.geometry.coordinates;
      if (!coordinates || coordinates.length < 2) return null;
      
      // Find the closest point and segment
      let minDistance = Infinity;
      let closestPoint = null;
      let segmentIndex = -1;
      
      // Check each segment
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
      
      // Convert to nautical miles
      const distanceNM = window.turf.distance(
        window.turf.point([mouseLngLat.lng, mouseLngLat.lat]),
        window.turf.point(closestPoint),
        { units: 'nauticalmiles' }
      );
      
      // Return if close enough or directly over the route
      const maxDistanceThreshold = 0.5; // nautical miles
      if (isMouseOverRoute || distanceNM < maxDistanceThreshold) {
        return {
          point: closestPoint,
          index: segmentIndex,
          distance: distanceNM,
          isDirectlyOver: isMouseOverRoute
        };
      }
      
      return null;
    };
    
    // MouseDown handler
    const handleMouseDown = (e) => {
      if (!this.isActive) return;
      
      // Skip if no route exists or right-click
      if (!map.getSource('route') || e.originalEvent.button === 2) return;
      
      // Don't start drag if clicking on a waypoint marker
      const waypointFeatures = map.queryRenderedFeatures(e.point, { 
        layers: ['waypoints-layer']
      });
      if (waypointFeatures.length > 0) return;
      
      // Find closest point on route
      const mouseLngLat = e.lngLat;
      const closestInfo = findClosestPointOnLine(mouseLngLat, e.point);
      
      if (closestInfo) {
        console.log("WaypointModeHandler: Starting route drag at segment:", 
                    closestInfo.index, "Distance:", closestInfo.distance.toFixed(2));
        
        // Get current route coordinates
        const routeSource = map.getSource('route');
        if (!routeSource || !routeSource._data) return;
        
        originalLineCoordinates = [...routeSource._data.geometry.coordinates];
        
        // Start dragging
        isDragging = true;
        closestPointIndex = closestInfo.index;
        
        // Create a copy for dragging and insert the new point
        draggedLineCoordinates = [...originalLineCoordinates];
        draggedLineCoordinates.splice(
          closestPointIndex + 1, 
          0, 
          closestInfo.point
        );
        
        // Add temporary drag line
        addDragLine(draggedLineCoordinates);
        
        // Hide the original route during dragging
        map.setLayoutProperty('route', 'visibility', 'none');
        if (map.getLayer('route-glow')) {
          map.setLayoutProperty('route-glow', 'visibility', 'none');
        }
        
        // Change cursor
        map.getCanvas().style.cursor = 'grabbing';
        
        // Prevent default
        e.preventDefault();
      }
    };
    
    // MouseMove handler
    const handleMouseMove = (e) => {
      if (!this.isActive) return;
      
      if (isDragging) {
        // Update drag line with new mouse position
        draggedLineCoordinates[closestPointIndex + 1] = [e.lngLat.lng, e.lngLat.lat];
        
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
        // If not dragging, check if mouse is over the route for cursor change
        const closestInfo = findClosestPointOnLine(e.lngLat, e.point);
        
        if (closestInfo && closestInfo.isDirectlyOver) {
          map.getCanvas().style.cursor = 'pointer';
        } else if (map.getCanvas().style.cursor === 'pointer') {
          // Only reset if cursor was previously set by this handler
          const waypointFeatures = map.queryRenderedFeatures(e.point, { 
            layers: ['waypoints-layer'] 
          });
          if (waypointFeatures.length === 0) {
            map.getCanvas().style.cursor = '';
          }
        }
      }
    };
    
    // MouseUp handler
    const handleMouseUp = (e) => {
      if (!this.isActive || !isDragging) return;
      
      // Clean up drag state
      isDragging = false;
      
      // Remove temp drag line
      if (map.getSource('waypoint-drag-line')) {
        map.removeLayer('waypoint-drag-line');
        map.removeSource('waypoint-drag-line');
      }
      
      // Show original route again
      map.setLayoutProperty('route', 'visibility', 'visible');
      if (map.getLayer('route-glow')) {
        map.setLayoutProperty('route-glow', 'visibility', 'visible');
      }
      
      // Reset cursor
      map.getCanvas().style.cursor = '';
      
      try {
        // Find nearest OSDK waypoint to where we dropped
        const nearestWaypoint = this.platformManager.findNearestOsdkWaypoint( // Use findNearestOsdkWaypoint
          e.lngLat.lat, 
          e.lngLat.lng,
          5 // Max distance in nautical miles
        );
        
        if (nearestWaypoint) {
          console.log(`WaypointModeHandler: Found nearest waypoint after drag: ${nearestWaypoint.name}`);
          
          // Insert the waypoint at the correct index
          this.addWaypointToRouteAtIndex(
            nearestWaypoint.coordinates,
            nearestWaypoint.name,
            closestPointIndex + 1,
            true // isWaypoint
          );
          
          // Show success message
          this.showStatusMessage(
            `Added waypoint ${nearestWaypoint.name} to route`,
            'success'
          );
        } else {
          // No nearby waypoint
          this.showStatusMessage(
            'No waypoint found near drag end position. Try dragging closer to a waypoint.',
            'warning'
          );
        }
      } catch (error) {
        console.error("WaypointModeHandler: Error handling route drag complete:", error);
        
        // Show error message
        this.showStatusMessage(
          `Error: ${error.message}`,
          'error'
        );
      }
      
      // Reset all drag variables
      draggedLineCoordinates = [];
      originalLineCoordinates = [];
      closestPointIndex = -1;
      dragLineSource = null;
      
      // Prevent default
      e.preventDefault();
    };
    
    // Add event handlers to map
    map.on('mousedown', handleMouseDown);
    map.on('mousemove', handleMouseMove);
    map.on('mouseup', handleMouseUp);
    
    // Store handlers for later removal
    this.dragHandlers = {
      mousedown: handleMouseDown,
      mousemove: handleMouseMove,
      mouseup: handleMouseUp
    };
    
    console.log("WaypointModeHandler: Route drag handlers set up");
  }
  
  /**
   * Add a waypoint to the route
   * @param {Array} coordinates - [lng, lat] of the waypoint
   * @param {string} name - Waypoint name
   * @param {boolean} isWaypoint - Flag to mark as a waypoint (not a regular stop)
   * @returns {Object|null} - The created waypoint or null if failed
   */
  addWaypointToRoute(coordinates, name, isWaypoint = true) {
    // DIRECT FIX: Always force isWaypoint to true in waypoint mode
    console.log(`DIRECT FIX: addWaypointToRoute called in waypoint mode - forcing isWaypoint=true`);
    
    if (!this.waypointManager) {
      console.error("WaypointModeHandler: Missing waypoint manager");
      return null;
    }
    
    try {
      // Create waypoint object with explicit flags
      const waypoint = {
        coords: coordinates,
        name: name || "Waypoint",
        isWaypoint: true,
        type: "WAYPOINT"
      };
      
      // Explicitly create metadata with isWaypoint flag
      const forceWaypointMetadata = {
        isWaypoint: true,
        type: "WAYPOINT"
      };
      
      // Add the waypoint with the isWaypoint flag
      console.log(`DIRECT FIX: Adding waypoint with explicit metadata:`, forceWaypointMetadata);
      const newWaypoint = this.waypointManager.addWaypoint(coordinates, name, forceWaypointMetadata);
      
      console.log(`WaypointModeHandler: Successfully added waypoint ${name}`);
      return newWaypoint;
    } catch (error) {
      console.error("WaypointModeHandler: Error adding waypoint:", error);
      return null;
    }
  }
  
  /**
   * Add a waypoint to the route at a specific index
   * @param {Array} coordinates - [lng, lat] of the waypoint
   * @param {string} name - Waypoint name
   * @param {number} index - Index to insert at
   * @param {boolean} isWaypoint - Flag to mark as a waypoint (not a regular stop)
   * @returns {Object|null} - The created waypoint or null if failed
   */
  addWaypointToRouteAtIndex(coordinates, name, index, isWaypoint = true) {
    // DIRECT FIX: Always force isWaypoint to true in waypoint mode
    console.log(`DIRECT FIX: addWaypointToRouteAtIndex at index ${index} called in waypoint mode - forcing isWaypoint=true`);
    
    if (!this.waypointManager) {
      console.error("WaypointModeHandler: Missing waypoint manager");
      return null;
    }
    
    try {
      // Create waypoint object with explicit flags
      const waypoint = {
        coords: coordinates,
        name: name || "Waypoint",
        isWaypoint: true,
        type: "WAYPOINT"
      };
      
      // Explicitly create metadata with isWaypoint flag
      const forceWaypointMetadata = {
        isWaypoint: true,
        type: "WAYPOINT"
      };
      
      // Add the waypoint with the isWaypoint flag at the specified index
      console.log(`DIRECT FIX: Adding waypoint at index ${index} with explicit metadata:`, forceWaypointMetadata);
      const newWaypoint = this.waypointManager.addWaypointAtIndex(
        coordinates, 
        name,
        index,
        forceWaypointMetadata
      );
      
      console.log(`WaypointModeHandler: Successfully added waypoint ${name} at index ${index}`);
      return newWaypoint;
    } catch (error) {
      console.error("WaypointModeHandler: Error adding waypoint at index:", error);
      return null;
    }
  }
  
  /**
   * Show a status message to the user
   * @param {string} message - The message to show
   * @param {string} type - The message type (success, error, warning, info)
   */
  showStatusMessage(message, type = 'info') {
    if (window.LoadingIndicator && window.LoadingIndicator.updateStatusIndicator) {
      window.LoadingIndicator.updateStatusIndicator(message, type);
    } else {
      console.log(`WaypointModeHandler: ${type.toUpperCase()}: ${message}`);
    }
  }
  
  /**
   * Check if waypoint mode is active
   * @returns {boolean} - True if active
   */
  isWaypointModeActive() {
    return this.isActive;
  }
  
  /**
   * Toggle waypoint mode on/off
   * @param {boolean} active - Whether to activate (true) or deactivate (false)
   * @returns {boolean} - The new state
   */
  toggle(active) {
    if (active === this.isActive) {
      return this.isActive; // No change needed
    }
    
    if (active) {
      this.activate();
    } else {
      this.deactivate();
    }
    
    return this.isActive;
  }
}

export default WaypointModeHandler;
