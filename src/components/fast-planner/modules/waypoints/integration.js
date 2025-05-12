/**
 * Waypoint Integration Module
 * 
 * Provides functions to connect the waypoint insertion functionality with
 * the existing FastPlannerApp.
 */

import WaypointInsertionManager from './WaypointInsertionManager';
import { isNavigationalWaypoint, createWaypointMarker } from './WaypointUtils';

/**
 * Create and initialize the waypoint insertion manager
 * @param {Object} mapManager - Map manager instance
 * @param {Object} waypointManager - Waypoint manager instance
 * @param {Object} platformManager - Platform manager instance
 * @returns {Object} - The initialized waypoint insertion manager
 */
export const createWaypointInsertionManager = (mapManager, waypointManager, platformManager) => {
  console.log("Creating WaypointInsertionManager...");
  
  const waypointInsertionManager = new WaypointInsertionManager(
    mapManager, 
    waypointManager, 
    platformManager
  );
  
  const initialized = waypointInsertionManager.initialize();
  
  if (!initialized) {
    console.error("Failed to initialize WaypointInsertionManager");
    return null;
  }
  
  console.log("WaypointInsertionManager initialized successfully");
  return waypointInsertionManager;
};

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
  
  // Set up callbacks
  waypointInsertionManager.setCallback('onWaypointInserted', (data) => {
    console.log("Waypoint inserted:", data);
    if (onWaypointInserted) {
      onWaypointInserted(data);
    }
  });
  
  waypointInsertionManager.setCallback('onWaypointRemoved', (data) => {
    console.log("Waypoint removed:", data);
    if (onWaypointRemoved) {
      onWaypointRemoved(data);
    }
  });
  
  waypointInsertionManager.setCallback('onError', (error) => {
    console.error("Waypoint insertion error:", error);
    if (onError) {
      onError(error);
    }
  });
  
  console.log("Waypoint callbacks set up successfully");
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
  const originalCreateWaypointMarker = waypointManager.createWaypointMarker;
  
  // Patch the addWaypointAtIndex method to handle metadata
  waypointManager.addWaypointAtIndex = function(coords, name, index, metadata = {}) {
    console.log(`Patched addWaypointAtIndex called with metadata:`, metadata);
    
    // Create a unique ID for the waypoint
    const id = `waypoint-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Create the waypoint object with metadata
    const waypoint = {
      id: id,
      coords: coords,
      name: name || `${metadata.isWaypoint ? 'Waypoint' : 'Stop'} ${index + 1}`,
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
    
    // Insert at specific index
    this.waypoints.splice(index, 0, waypoint);
    this.markers.splice(index, 0, marker);
    
    // Add marker to map
    const map = this.mapManager.getMap();
    if (map) {
      marker.addTo(map);
    }
    
    // Update route
    this.updateRoute(null);
    
    // Log the operation for debugging
    console.log(`Added ${waypoint.isWaypoint ? 'waypoint' : 'stop'} ${waypoint.name} at index ${index}, ID: ${id}`);
    
    // Trigger callbacks
    this.triggerCallback('onWaypointAdded', waypoint);
    this.triggerCallback('onChange', this.waypoints);
    
    return waypoint;
  };
  
  // Store a reference to the original method on the object
  waypointManager._originalAddWaypointAtIndex = originalAddWaypointAtIndex;
  waypointManager._originalCreateWaypointMarker = originalCreateWaypointMarker;
  
  console.log("WaypointManager successfully patched");
};

/**
 * Activate or deactivate waypoint mode
 * @param {Object} waypointInsertionManager - The waypoint insertion manager
 * @param {boolean} active - Whether to activate (true) or deactivate (false)
 */
export const toggleWaypointMode = (waypointInsertionManager, active) => {
  if (!waypointInsertionManager) {
    console.error("Cannot toggle: WaypointInsertionManager is null");
    return;
  }
  
  console.log(`Toggling waypoint mode: ${active ? 'ON' : 'OFF'}`);
  waypointInsertionManager.setActive(active);
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
  setupWaypointCallbacks,
  patchWaypointManager,
  toggleWaypointMode,
  categorizeRouteItems
};