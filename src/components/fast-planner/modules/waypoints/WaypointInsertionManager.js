/**
 * WaypointInsertionManager.js
 * 
 * A dedicated module for handling waypoint insertion into routes.
 * This allows adding waypoints (navigational points) as different entities from stops.
 */

class WaypointInsertionManager {
  constructor(mapManager, waypointManager, platformManager) {
    this.mapManager = mapManager;
    this.waypointManager = waypointManager; // The regular WaypointManager that handles the route
    this.platformManager = platformManager; // Used to access loaded waypoints
    
    // State
    this.isActive = false;
    this.callbacks = {
      onWaypointInserted: null,
      onWaypointRemoved: null,
      onWaypointOrderChanged: null,
      onError: null
    };
    
    // Store references to event handlers
    this.routeClickHandler = null;
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
   * Initialize waypoint insertion capability
   * @returns {boolean} - Success flag
   */
  initialize() {
    console.log("WaypointInsertionManager: Initializing...");
    
    try {
      // Check dependencies
      if (!this.mapManager || !this.waypointManager || !this.platformManager) {
        console.error("WaypointInsertionManager: Missing required dependencies");
        return false;
      }
      
      // Get map instance
      const map = this.mapManager.getMap();
      if (!map) {
        console.error("WaypointInsertionManager: Map not initialized");
        
        // Schedule a delayed retry - this is important for when the map is initializing
        console.log("WaypointInsertionManager: Will retry initialization in 2 seconds");
        setTimeout(() => {
          console.log("WaypointInsertionManager: Retrying initialization...");
          const map = this.mapManager.getMap();
          if (map) {
            console.log("WaypointInsertionManager: Map now available, completing initialization");
            // Just make the map globally available for debugging
            window._waypointInsertionMap = map;
            this.triggerCallback('onWaypointInserted', {
              status: "Map now available for waypoint insertion"
            });
          } else {
            console.error("WaypointInsertionManager: Map still not initialized after retry");
          }
        }, 2000);
        
        return false;
      }
      
      // Make sure we have turf.js available for distance calculations
      if (!window.turf) {
        console.warn("WaypointInsertionManager: Turf.js not available, some functionality may be limited");
        
        // Create a simple placeholder if turf is missing
        window.turf = window.turf || {};
        window.turf.distance = window.turf.distance || function(p1, p2, options) {
          // Simple approximation for nautical miles
          const lat1 = p1.geometry.coordinates[1];
          const lon1 = p1.geometry.coordinates[0];
          const lat2 = p2.geometry.coordinates[1];
          const lon2 = p2.geometry.coordinates[0];
          
          // Simple Euclidean distance (not accurate for long distances)
          const R = 3440.065; // Earth's radius in nautical miles
          const x = (lon2 - lon1) * Math.cos((lat1 + lat2) / 2);
          const y = lat2 - lat1;
          return Math.sqrt(x * x + y * y) * R * Math.PI / 180;
        };
        
        window.turf.point = window.turf.point || function(coords) {
          return {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: coords
            },
            properties: {}
          };
        };
        
        window.turf.lineString = window.turf.lineString || function(coords) {
          return {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: coords
            },
            properties: {}
          };
        };
        
        window.turf.nearestPointOnLine = window.turf.nearestPointOnLine || function(line, point) {
          // Extremely simplified version
          return {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: line.geometry.coordinates[0]
            },
            properties: {
              dist: 0.1
            }
          };
        };
      }
      
      // Just make the map globally available for debugging
      window._waypointInsertionMap = map;
      
      console.log("WaypointInsertionManager: Successfully initialized");
      return true;
    } catch (error) {
      console.error("WaypointInsertionManager: Error in initialization:", error);
      this.triggerCallback('onError', error.message);
      return false;
    }
  }
  
  /**
   * Activate waypoint insertion mode
   * @param {boolean} active - Whether to activate (true) or deactivate (false)
   */
  setActive(active) {
    if (this.isActive === active) return; // No change
    
    console.log(`WaypointInsertionManager: ${active ? 'Activating' : 'Deactivating'} waypoint insertion mode`);
    
    this.isActive = active;
    
    // Handle map interactions differently when active
    if (active) {
      // Setup the route click handler when activating
      this.setupRouteClickHandler();
    } else {
      // Remove the route click handler when deactivating
      this.removeRouteClickHandler();
    }
  }
  
  /**
   * Set up event handler for route line clicks
   */
  setupRouteClickHandler() {
    console.log("WaypointInsertionManager: Setting up route click handler");
    
    // Remove existing handler if present
    this.removeRouteClickHandler();
    
    try {
      const map = this.mapManager.getMap();
      if (!map) {
        console.error("WaypointInsertionManager: Map not available for route click handler");
        return;
      }
      
      // Create a new click handler for the route line
      this.routeClickHandler = (e) => {
        // Handle route line clicks only when in waypoint insertion mode
        if (!this.isActive) return;
        
        console.log("WaypointInsertionManager: Route line clicked", e);
        
        // Extract click data
        const clickData = {
          lngLat: e.lngLat,
          point: e.point,
          features: e.features
        };
        
        // Find nearest waypoint from the platformManager
        this.findAndInsertNearestWaypoint(clickData);
        
        // Prevent event propagation to stop other handlers from running
        e.preventDefault();
        e.stopPropagation();
      };
      
      // Add the click handler to the map
      // CRITICAL FIX: Use the actual route layer ID used in the main app ('route')
      map.on('click', 'route', this.routeClickHandler);
      
      // Also set up route dragging in waypoint mode
      this.setupRouteDragging();
      
      console.log("WaypointInsertionManager: Route click handler set up");
    } catch (error) {
      console.error("WaypointInsertionManager: Error setting up route click handler:", error);
      this.triggerCallback('onError', error.message);
    }
  }
  
  /**
   * Set up route dragging functionality specifically for waypoint mode
   */
  setupRouteDragging() {
    const map = this.mapManager.getMap();
    if (!map) return;

    console.log('WaypointInsertionManager: Setting up route dragging for waypoint mode');

    let isDragging = false;
    let draggedLineCoordinates = [];
    let originalLineCoordinates = [];
    let dragStartPoint = null;
    let closestPointIndex = -1;
    let dragLineSource = null;

    // Function to add the temporary drag line - using yellow color for waypoint mode
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
            'line-color': '#FFC107', // Yellow for waypoint mode
            'line-width': 3, // 3px width as requested
            'line-dasharray': [2, 1.5] // Small dashes with slightly more gap
          }
        });

        dragLineSource = map.getSource('waypoint-drag-line');
      } catch (error) {
        console.error('Error adding waypoint drag line:', error);
      }
    };

    // Helper to find closest point on the line and the segment it belongs to
    const findClosestPointOnLine = (mouseLngLat, mousePoint) => {
      try {
        if (!map.getSource('route')) return null;
        
        // First check if the mouse is over a route feature using rendered features
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
        
        // If mouse is directly over the route or within distance threshold
        const maxDistanceThreshold = 0.05; // nautical miles - reduced for precise touch area
        
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

    // Setup mousedown event for starting the drag - SPECIFIC TO WAYPOINT MODE
    const waypointMouseDownHandler = (e) => {
      // Only handle this in waypoint mode
      if (!this.isActive) return;
      
      // Skip if no route or if clicking on a waypoint
      if (!map.getSource('route')) return;
      
      // Don't start drag if right-click
      if (e.originalEvent.button === 2) return;
      
      // Check for platform markers and don't start drag if clicked on one
      const waypointFeatures = map.queryRenderedFeatures(e.point, { layers: ['waypoints-layer'] });
      if (waypointFeatures.length > 0) return;
      
      // Find the closest point on the route line
      const mousePos = e.lngLat;
      const closestInfo = findClosestPointOnLine(mousePos, e.point);
      
      // If mouse is directly over the route or within distance threshold
      if (closestInfo) {
        console.log('WaypointInsertionManager: Starting route drag at segment:', closestInfo.index, 
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
        e.stopPropagation();
      }
    };

    // Set up mousemove handler for dragging - SPECIFIC TO WAYPOINT MODE
    const waypointMouseMoveHandler = (e) => {
      // Only handle this in waypoint mode
      if (!this.isActive) return;
      
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
          // (but don't reset if it might have been set by waypoint hover)
          const waypointFeatures = map.queryRenderedFeatures(e.point, { layers: ['waypoints-layer'] });
          if (waypointFeatures.length === 0) {
            map.getCanvas().style.cursor = '';
          }
        }
      }
    };

    // Setup mouseup handler for completing the drag - SPECIFIC TO WAYPOINT MODE
    const waypointMouseUpHandler = (e) => {
      // Only handle this in waypoint mode
      if (!this.isActive) return;
      
      if (!isDragging) return;
      
      // Clean up
      isDragging = false;
      
      // Remove the temporary drag line
      if (map.getSource('waypoint-drag-line')) {
        map.removeLayer('waypoint-drag-line');
        map.removeSource('waypoint-drag-line');
      }
      
      // Show the original route and glow again
      map.setLayoutProperty('route', 'visibility', 'visible');
      if (map.getLayer('route-glow')) {
        map.setLayoutProperty('route-glow', 'visibility', 'visible');
      }
      
      // Reset cursor
      map.getCanvas().style.cursor = '';
      
      // Find the nearest waypoint to where we dropped
      this.findAndInsertNearestWaypoint({
        lngLat: e.lngLat,
        insertIndex: closestPointIndex + 1
      });
      
      // Reset variables
      draggedLineCoordinates = [];
      originalLineCoordinates = [];
      dragStartPoint = null;
      closestPointIndex = -1;
      dragLineSource = null;
      
      // Prevent default behavior
      e.preventDefault();
      e.stopPropagation();
    };

    // Add the waypoint-specific handlers
    map.on('mousedown', waypointMouseDownHandler);
    map.on('mousemove', waypointMouseMoveHandler);
    map.on('mouseup', waypointMouseUpHandler);
    
    // Store handlers for removal later
    this.waypointDragHandlers = {
      mousedown: waypointMouseDownHandler,
      mousemove: waypointMouseMoveHandler,
      mouseup: waypointMouseUpHandler
    };
    
    console.log('WaypointInsertionManager: Route dragging for waypoint mode set up');
  }
  
  /**
   * Remove event handler for route line clicks and dragging
   */
  removeRouteClickHandler() {
    try {
      const map = this.mapManager.getMap();
      if (!map) return;
      
      // Remove the route click handler
      if (this.routeClickHandler) {
        // CRITICAL FIX: Use the correct layer ID 'route'
        map.off('click', 'route', this.routeClickHandler);
        this.routeClickHandler = null;
        console.log("WaypointInsertionManager: Route click handler removed");
      }
      
      // Remove waypoint drag handlers
      if (this.waypointDragHandlers) {
        map.off('mousedown', this.waypointDragHandlers.mousedown);
        map.off('mousemove', this.waypointDragHandlers.mousemove);
        map.off('mouseup', this.waypointDragHandlers.mouseup);
        this.waypointDragHandlers = null;
        console.log("WaypointInsertionManager: Waypoint drag handlers removed");
      }
      
      // Also make sure any temporary drag lines are removed
      if (map.getSource('waypoint-drag-line')) {
        if (map.getLayer('waypoint-drag-line')) {
          map.removeLayer('waypoint-drag-line');
        }
        map.removeSource('waypoint-drag-line');
      }
      
      // Restore the original route display if it was hidden
      if (map.getLayer('route')) {
        map.setLayoutProperty('route', 'visibility', 'visible');
      }
      if (map.getLayer('route-glow')) {
        map.setLayoutProperty('route-glow', 'visibility', 'visible');
      }
      
      // Reset cursor
      map.getCanvas().style.cursor = '';
    } catch (error) {
      console.error("WaypointInsertionManager: Error removing route handlers:", error);
    }
  }
  
  /**
   * Find the nearest waypoint to a click and insert it into the route
   * @param {Object} clickData - Data from the click event
   */
  findAndInsertNearestWaypoint(clickData) {
    console.log("WaypointInsertionManager: Finding nearest waypoint to click");
    
    try {
      // Extract click coordinates
      const lat = clickData.lngLat.lat;
      const lng = clickData.lngLat.lng;
      
      // Get route data to determine insertion index
      const waypoints = this.waypointManager.getWaypoints();
      const insertIndex = this.determineInsertionIndex(clickData, waypoints);
      
      if (insertIndex === -1) {
        console.warn("WaypointInsertionManager: Could not determine insertion index");
        return;
      }
      
      // Get waypoints from the platform manager
      const navWaypoints = this.platformManager.waypoints || [];
      
      if (navWaypoints.length === 0) {
        console.warn("WaypointInsertionManager: No navigation waypoints available");
        return;
      }
      
      // Find the nearest waypoint within a maximum distance (using turf.js)
      const maxDistance = 5; // nautical miles
      let nearestWaypoint = null;
      let minDistance = Number.MAX_VALUE;
      
      if (!window.turf) {
        console.error("WaypointInsertionManager: Turf.js not loaded");
        return;
      }
      
      navWaypoints.forEach(waypoint => {
        // Skip if waypoint has no coordinates
        if (!waypoint.coordinates || waypoint.coordinates.length !== 2) {
          return;
        }
        
        const coords = waypoint.coordinates;
        const distance = window.turf.distance(
          window.turf.point([lng, lat]),
          window.turf.point(coords),
          { units: 'nauticalmiles' }
        );
        
        if (distance < minDistance) {
          minDistance = distance;
          nearestWaypoint = {
            name: waypoint.name,
            type: waypoint.type || 'WAYPOINT',
            // Include both formats for better compatibility
            coords: coords,
            coordinates: coords,
            lat: coords[1],
            lng: coords[0],
            distance: distance,
            isWaypoint: true // Flag this as a waypoint, not a regular stop
          };
        }
      });
      
      // Only insert if within reasonable distance
      if (nearestWaypoint && minDistance <= maxDistance) {
        console.log(`WaypointInsertionManager: Found nearest waypoint ${nearestWaypoint.name} at distance ${nearestWaypoint.distance.toFixed(2)} nm`);
        this.insertWaypoint(nearestWaypoint, insertIndex);
      } else if (nearestWaypoint) {
        console.log(`WaypointInsertionManager: Nearest waypoint ${nearestWaypoint.name} is too far (${nearestWaypoint.distance.toFixed(2)} nm > ${maxDistance} nm)`);
      } else {
        console.log("WaypointInsertionManager: No waypoints found");
      }
    } catch (error) {
      console.error("WaypointInsertionManager: Error finding nearest waypoint:", error);
      this.triggerCallback('onError', error.message);
    }
  }
  
  /**
   * Determine the insertion index for a new waypoint
   * @param {Object} clickData - Data from the click event
   * @param {Array} waypoints - Current waypoints in the route
   * @returns {number} - The insertion index, or -1 if couldn't determine
   */
  determineInsertionIndex(clickData, waypoints) {
    // This is a simplified version - the full implementation would calculate
    // the nearest segment of the route to insert the waypoint
    
    // For now, we'll try to extract the insertion index from clickData if available
    if (clickData.insertIndex !== undefined) {
      return clickData.insertIndex;
    }
    
    // If insertIndex not provided, use a simple nearest-point calculation
    try {
      if (!window.turf || !waypoints || waypoints.length < 2) {
        return -1;
      }
      
      const clickPoint = window.turf.point([clickData.lngLat.lng, clickData.lngLat.lat]);
      
      // Find the closest segment of the route line
      let closestSegmentIndex = -1;
      let minDistance = Number.MAX_VALUE;
      
      for (let i = 0; i < waypoints.length - 1; i++) {
        const startPoint = window.turf.point(waypoints[i].coords);
        const endPoint = window.turf.point(waypoints[i + 1].coords);
        
        // Create a line segment
        const segment = window.turf.lineString([waypoints[i].coords, waypoints[i + 1].coords]);
        
        // Find nearest point on the segment
        const nearestPoint = window.turf.nearestPointOnLine(segment, clickPoint);
        
        if (nearestPoint.properties.dist < minDistance) {
          minDistance = nearestPoint.properties.dist;
          closestSegmentIndex = i;
        }
      }
      
      // Insert after the first point of the closest segment
      if (closestSegmentIndex !== -1) {
        return closestSegmentIndex + 1;
      }
      
      return -1;
    } catch (error) {
      console.error("WaypointInsertionManager: Error determining insertion index:", error);
      return -1;
    }
  }
  
  /**
   * Insert a waypoint into the route
   * @param {Object} waypoint - The waypoint to insert
   * @param {number} index - The index at which to insert the waypoint
   */
  insertWaypoint(waypoint, index) {
    console.log(`WaypointInsertionManager: Inserting waypoint ${waypoint.name} at index ${index}`);
    
    try {
      // Add the waypoint to the route via the waypointManager
      this.waypointManager.addWaypointAtIndex(
        waypoint.coords,
        waypoint.name,
        index,
        { isWaypoint: true } // Pass this flag to identify as a waypoint vs. regular stop
      );
      
      // Trigger callback with the inserted waypoint
      this.triggerCallback('onWaypointInserted', {
        waypoint,
        index
      });
      
      // Create a status message for the user
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator(
          `Added waypoint ${waypoint.name} to route`,
          'success'
        );
      }
      
      console.log(`WaypointInsertionManager: Successfully inserted waypoint ${waypoint.name}`);
    } catch (error) {
      console.error("WaypointInsertionManager: Error inserting waypoint:", error);
      this.triggerCallback('onError', error.message);
    }
  }
  
  /**
   * Remove a waypoint from the route
   * @param {string} waypointId - The ID of the waypoint to remove
   * @param {number} index - The index of the waypoint in the route
   */
  removeWaypoint(waypointId, index) {
    console.log(`WaypointInsertionManager: Removing waypoint with ID ${waypointId} at index ${index}`);
    
    try {
      // Remove the waypoint from the route via the waypointManager
      this.waypointManager.removeWaypoint(waypointId, index);
      
      // Trigger callback with the removed waypoint
      this.triggerCallback('onWaypointRemoved', {
        waypointId,
        index
      });
      
      console.log(`WaypointInsertionManager: Successfully removed waypoint at index ${index}`);
    } catch (error) {
      console.error("WaypointInsertionManager: Error removing waypoint:", error);
      this.triggerCallback('onError', error.message);
    }
  }
  
  /**
   * Reorder waypoints in the route
   * @param {string} draggedId - ID of waypoint being dragged
   * @param {string} dropTargetId - ID of waypoint being dropped onto
   */
  reorderWaypoints(draggedId, dropTargetId) {
    console.log(`WaypointInsertionManager: Reordering waypoint ${draggedId} to ${dropTargetId}`);
    
    try {
      // Reorder waypoints via the waypointManager
      this.waypointManager.reorderWaypoints(draggedId, dropTargetId);
      
      // Trigger callback with the reordered waypoints
      this.triggerCallback('onWaypointOrderChanged', {
        draggedId,
        dropTargetId
      });
      
      console.log(`WaypointInsertionManager: Successfully reordered waypoints`);
    } catch (error) {
      console.error("WaypointInsertionManager: Error reordering waypoints:", error);
      this.triggerCallback('onError', error.message);
    }
  }
  
  /**
   * Get the active state
   * @returns {boolean} - True if waypoint insertion mode is active
   */
  isWaypointInsertionActive() {
    return this.isActive;
  }
}

export default WaypointInsertionManager;