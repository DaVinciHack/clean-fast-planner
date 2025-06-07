/**
 * Waypoint Integration Module
 * 
 * Provides functions to connect the waypoint insertion functionality with
 * the existing FastPlannerApp.
 */

import WaypointInsertionManager from './WaypointInsertionManager';
import WaypointModeHandler from './WaypointModeHandler';
import { isNavigationalWaypoint, createWaypointMarker } from './WaypointUtils';
// Import createWaypointModeHandler from waypointModeIntegration and alias toggleWaypointModeImpl
import { createWaypointModeHandler as createWaypointModeHandlerImported, toggleWaypointMode as toggleWaypointModeImpl } from './waypointModeIntegration';

/**
 * Create and initialize the waypoint insertion manager
 * @param {Object} mapManager - Map manager instance
 * @param {Object} waypointManager - Waypoint manager instance
 * @param {Object} platformManager - Platform manager instance
 * @returns {Object} - The initialized waypoint insertion manager
 */
export const createWaypointInsertionManager = (mapManager, waypointManager, platformManager) => {
  console.log("Creating WaypointInsertionManager...");
  
  // Add validation checks to ensure all dependencies are available
  if (!mapManager || !waypointManager || !platformManager) {
    console.error("Cannot create WaypointInsertionManager: Missing required managers");
    return null;
  }
  
  // Check if the map is ready - if not, we'll create a placeholder object
  const map = mapManager.getMap();
  if (!map) {
    console.log("Map not ready yet - creating placeholder WaypointInsertionManager");
    
    // Create placeholder object with delayed initialization
    const placeholderManager = {
      initialize: function() {
        console.log("Delayed initialization of WaypointInsertionManager...");
        
        // Get the map again
        const map = mapManager.getMap();
        if (!map) {
          console.error("Map still not ready for WaypointInsertionManager");
          return false;
        }
        
        console.log("Map now available, creating real WaypointInsertionManager");
        
        try {
          // Now create the real manager
          const realManager = new WaypointInsertionManager(
            mapManager, 
            waypointManager, 
            platformManager
          );
          
          // Initialize it
          const success = realManager.initialize();
          
          if (success) {
            console.log("WaypointInsertionManager successfully initialized on retry");
            
            // Copy all properties and methods from the real manager to this placeholder
            Object.assign(this, realManager);
            
            // Transfer any registered callbacks
            if (this._pendingCallbacks) {
              Object.entries(this._pendingCallbacks).forEach(([type, callbacks]) => {
                callbacks.forEach(callback => {
                  realManager.setCallback(type, callback);
                });
              });
            }
            
            return true;
          } else {
            console.error("Failed to initialize real WaypointInsertionManager on retry");
            return false;
          }
        } catch (error) {
          console.error("Error creating real WaypointInsertionManager:", error);
          return false;
        }
      },
      
      // Store callbacks for later
      _pendingCallbacks: {},
      
      // Placeholder setCallback method
      setCallback: function(type, callback) {
        console.log(`Registering ${type} callback for future WaypointInsertionManager`);
        if (!this._pendingCallbacks[type]) {
          this._pendingCallbacks[type] = [];
        }
        this._pendingCallbacks[type].push(callback);
      }
    };
    
    // Add a retry mechanism that will auto-initialize once the map is ready
    setTimeout(() => {
      console.log("Attempting delayed initialization of WaypointInsertionManager");
      placeholderManager.initialize();
    }, 2000);
    
    return placeholderManager;
  }
  
  // If map is ready, proceed with normal initialization
  try {
    console.log("Map ready, creating WaypointInsertionManager normally");
    const waypointInsertionManager = new WaypointInsertionManager(
      mapManager, 
      waypointManager, 
      platformManager
    );
    
    try {
      console.log("Initializing WaypointInsertionManager...");
      const initialized = waypointInsertionManager.initialize();
      
      if (!initialized) {
        console.error("Failed to initialize WaypointInsertionManager");
        return waypointInsertionManager; // Return the manager anyway for retry attempts
      }
      
      console.log("WaypointInsertionManager initialized successfully");
      return waypointInsertionManager;
    } catch (error) {
      console.error("Error initializing WaypointInsertionManager:", error);
      return waypointInsertionManager; // Return the manager anyway for retry attempts
    }
  } catch (error) {
    console.error("Error creating WaypointInsertionManager:", error);
    return null;
  }
};

/**
 * Create and initialize the waypoint mode handler
 * @param {Object} mapManager - Map manager instance
 * @param {Object} waypointManager - Waypoint manager instance
 * @param {Object} platformManager - Platform manager instance
 * @returns {Object} - The initialized waypoint mode handler
 */
// Remove the re-declaration of createWaypointModeHandler. We will use the imported one.
// export const createWaypointModeHandler = (mapManager, waypointManager, platformManager) => {
//   return createWaypointModeHandler(mapManager, waypointManager, platformManager);
// };

/**
 * Set up event handlers and callbacks for waypoint insertion
 * @param {Object} waypointInsertionManager - The waypoint insertion manager
 * @param {Function} onWaypointInserted - Callback when a waypoint is inserted
 * @param {Function} onWaypointRemoved - Callback when a waypoint is removed
 * @param {Function} onError - Callback when an error occurs
 */
export const setupWaypointCallbacks = (
  waypointInsertionManager, 
  onWaypointInserted, 
  onWaypointRemoved,
  onError
) => {
  if (!waypointInsertionManager) {
    console.error("Cannot setup callbacks: WaypointInsertionManager is null");
    return;
  }
  
  console.log("Setting up waypoint callbacks...");
  
  // Check if setCallback method exists (it might be a placeholder or deferred implementation)
  if (typeof waypointInsertionManager.setCallback !== 'function') {
    console.error("Cannot setup callbacks: setCallback method not found on WaypointInsertionManager");
    
    // Store callbacks globally for later retrieval
    if (!window._pendingWaypointCallbacks) {
      window._pendingWaypointCallbacks = {
        onWaypointInserted: [],
        onWaypointRemoved: [],
        onError: []
      };
    }
    
    // Store the callbacks for later use
    if (onWaypointInserted) window._pendingWaypointCallbacks.onWaypointInserted.push(onWaypointInserted);
    if (onWaypointRemoved) window._pendingWaypointCallbacks.onWaypointRemoved.push(onWaypointRemoved);
    if (onError) window._pendingWaypointCallbacks.onError.push(onError);
    
    console.log("Stored callbacks for later when WaypointInsertionManager is fully initialized");
    return;
  }
  
  // Set up callbacks
  try {
    if (onWaypointInserted) {
      waypointInsertionManager.setCallback('onWaypointInserted', (data) => {
        console.log("Waypoint inserted:", data);
        onWaypointInserted(data);
      });
    }
    
    if (onWaypointRemoved) {
      waypointInsertionManager.setCallback('onWaypointRemoved', (data) => {
        console.log("Waypoint removed:", data);
        onWaypointRemoved(data);
      });
    }
    
    if (onError) {
      waypointInsertionManager.setCallback('onError', (error) => {
        console.error("Waypoint insertion error:", error);
        onError(error);
      });
    }
    
    console.log("Waypoint callbacks set up successfully");
  } catch (error) {
    console.error("Error setting up waypoint callbacks:", error);
    
    // Set a retry for later if there was an error
    setTimeout(() => {
      console.log("Retrying waypoint callback setup...");
      if (waypointInsertionManager && typeof waypointInsertionManager.setCallback === 'function') {
        setupWaypointCallbacks(waypointInsertionManager, onWaypointInserted, onWaypointRemoved, onError);
      }
    }, 2000);
  }
};

/**
 * Patch WaypointManager to handle waypoints vs. stops differently
 * @param {Object} waypointManager - The original waypoint manager
 */
export const patchWaypointManager = (waypointManager) => {
  if (!waypointManager) {
    console.error("Cannot patch: WaypointManager is null");
    return;
  }
  
  console.log("Patching WaypointManager to handle waypoints vs. stops...");
  
  // Store original methods that we're going to patch
  const originalAddWaypointAtIndex = waypointManager.addWaypointAtIndex;
  const originalAddWaypoint = waypointManager.addWaypoint; // Store the original addWaypoint method too
  const originalCreateWaypointMarker = waypointManager.createWaypointMarker;
  
  // First patch the regular addWaypoint method which is the underlying method
  waypointManager.addWaypoint = function(coords, name, metadata = {}) {
    console.log(`Patched addWaypoint called with metadata:`, metadata);
    
    // Check global waypoint mode flag to force waypoint type
    if (window.isWaypointModeActive) {
      console.log("Waypoint mode is active - forcing isWaypoint = true");
      metadata = { ...metadata, isWaypoint: true, type: 'WAYPOINT' };
    }
    
    // Create a unique ID for the waypoint
    const id = `waypoint-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Create the waypoint object with metadata
    const waypoint = {
      id: id,
      coords: coords,
      name: name || `${metadata.isWaypoint ? 'Waypoint' : 'Stop'} ${this.waypoints.length + 1}`,
      isNew: true, // Mark as new for highlighting
      // Add the metadata to identify waypoint type
      isWaypoint: metadata.isWaypoint,
      type: metadata.isWaypoint ? 'WAYPOINT' : 'STOP',
      // Store additional metadata
      metadata: {
        ...metadata,
        insertTime: Date.now()
      }
    };
    
    // Create marker with the appropriate style for the waypoint type
    const marker = createWaypointMarker(coords, name, metadata.isWaypoint || false);
    
    // Add drag end event to update route
    marker.on('dragend', () => {
      const lngLat = marker.getLngLat();
      const markerIndex = this.markers.indexOf(marker);
      if (markerIndex !== -1 && markerIndex < this.waypoints.length) {
        this.waypoints[markerIndex].coords = [lngLat.lng, lngLat.lat];
        this.updateRoute();
      }
    });
    
    // Add to the end of the route
    this.waypoints.push(waypoint);
    this.markers.push(marker);
    
    // Add marker to map
    const map = this.mapManager.getMap();
    if (map) {
      marker.addTo(map);
    }
    
    // Update route
    this.updateRoute(null);
    
    // Log the operation for debugging
    console.log(`Added ${waypoint.isWaypoint ? 'waypoint' : 'stop'} ${waypoint.name}, ID: ${id}`);
    
    // Trigger callbacks
    this.triggerCallback('onWaypointAdded', waypoint);
    this.triggerCallback('onChange', this.waypoints);
    
    return waypoint;
  };
  
  // Next patch the addWaypointAtIndex method to use our patched addWaypoint
  waypointManager.addWaypointAtIndex = function(coords, name, index, metadata = {}) {
    console.log(`Patched addWaypointAtIndex called with metadata:`, metadata);
    
    // Check global waypoint mode flag to force waypoint type
    if (window.isWaypointModeActive) {
      console.log("Waypoint mode is active - forcing isWaypoint = true");
      metadata = { ...metadata, isWaypoint: true, type: 'WAYPOINT' };
    }
    
    // Create a waypoint using our patched addWaypoint method
    const waypoint = this.addWaypoint(coords, name, metadata);
    
    // If we didn't add at the end, we need to move it to the right position
    if (index !== this.waypoints.length - 1) {
      // Remove from the end
      this.waypoints.pop();
      this.markers.pop();
      
      // Insert at specific index
      this.waypoints.splice(index, 0, waypoint);
      this.markers.splice(index, 0, waypoint.marker);
      
      // Update route again after reordering
      this.updateRoute(null);
      
      console.log(`Moved waypoint ${waypoint.name} to index ${index}`);
    }
    
    return waypoint;
  };
  
  // Store references to the original methods on the object
  waypointManager._originalAddWaypointAtIndex = originalAddWaypointAtIndex;
  waypointManager._originalAddWaypoint = originalAddWaypoint;
  waypointManager._originalCreateWaypointMarker = originalCreateWaypointMarker;
  
  console.log("WaypointManager successfully patched");
  
  // Add a simple method to check if the manager was properly patched
  waypointManager.isPatchedForWaypoints = true;
};

/**
 * Toggle waypoint mode
 * @param {Object} waypointModeHandler - The waypoint mode handler
 * @param {Object} mapInteractionHandler - The regular map interaction handler
 * @param {boolean} active - Whether to activate (true) or deactivate (false)
 * @returns {Promise<boolean>} - Promise that resolves to the new state
 */
export const toggleWaypointMode = (waypointModeHandler, mapInteractionHandler, active) => {
  return toggleWaypointModeImpl(waypointModeHandler, mapInteractionHandler, active);
};

/**
 * Get the list of route items, separating waypoints from stops
 * @param {Array} items - The combined list of waypoints and stops
 * @returns {Object} - Separated lists { waypoints, stops }
 */
export const categorizeRouteItems = (items) => {
  if (!items || !Array.isArray(items)) {
    return { waypoints: [], stops: [] };
  }
  
  const waypoints = [];
  const stops = [];
  
  // Categorize each item
  items.forEach(item => {
    if (isNavigationalWaypoint(item)) {
      waypoints.push(item);
    } else {
      stops.push(item);
    }
  });
  
  return { waypoints, stops };
};

export default {
  createWaypointInsertionManager,
  createWaypointModeHandler: createWaypointModeHandlerImported, // Export the imported version
  setupWaypointCallbacks,
  patchWaypointManager,
  toggleWaypointMode,
  categorizeRouteItems
};
