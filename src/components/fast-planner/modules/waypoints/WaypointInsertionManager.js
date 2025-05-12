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
        return false;
      }
      
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
      };
      
      // Add the click handler to the map
      // Note: We need to ensure the route layer ID matches what's used in the main app
      map.on('click', 'route-line-layer', this.routeClickHandler);
      
      console.log("WaypointInsertionManager: Route click handler set up");
    } catch (error) {
      console.error("WaypointInsertionManager: Error setting up route click handler:", error);
      this.triggerCallback('onError', error.message);
    }
  }
  
  /**
   * Remove event handler for route line clicks
   */
  removeRouteClickHandler() {
    try {
      if (this.routeClickHandler) {
        const map = this.mapManager.getMap();
        if (map) {
          map.off('click', 'route-line-layer', this.routeClickHandler);
        }
        this.routeClickHandler = null;
        console.log("WaypointInsertionManager: Route click handler removed");
      }
    } catch (error) {
      console.error("WaypointInsertionManager: Error removing route click handler:", error);
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