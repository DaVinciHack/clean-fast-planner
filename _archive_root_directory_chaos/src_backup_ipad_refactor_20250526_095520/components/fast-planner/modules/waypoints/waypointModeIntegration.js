/**
 * Waypoint Mode Integration
 * 
 * Provides functions to integrate the WaypointModeHandler with the main application.
 */

import WaypointModeHandler from './WaypointModeHandler';

/**
 * Create and initialize a WaypointModeHandler instance
 * @param {Object} mapManager - Map manager instance
 * @param {Object} waypointManager - Waypoint manager instance
 * @param {Object} platformManager - Platform manager instance
 * @returns {Object} The initialized WaypointModeHandler
 */
export const createWaypointModeHandler = (mapManager, waypointManager, platformManager) => {
  console.log("Creating WaypointModeHandler...");
  
  if (!mapManager || !waypointManager || !platformManager) {
    console.error("Cannot create WaypointModeHandler: Missing required managers");
    return null;
  }
  
  // Create the handler
  const waypointModeHandler = new WaypointModeHandler(
    mapManager,
    waypointManager,
    platformManager
  );
  
  console.log("WaypointModeHandler created successfully");
  return waypointModeHandler;
};

export const toggleWaypointMode = async (waypointModeHandler, mapInteractionHandler, active) => {
  console.log(`Critical fix: Toggling waypoint mode: ${active ? 'ON' : 'OFF'}`);
  
  if (!waypointModeHandler) {
    console.error("Cannot toggle waypoint mode: WaypointModeHandler is not initialized");
    return false;
  }
  
  try {
    // Set the global flag for waypoint mode
    window.isWaypointModeActive = active;
    
    if (active) {
      // CRITICAL FIX: First DISABLE the normal map interaction handler
      if (mapInteractionHandler) {
        console.log("Critical fix: Disabling normal map click handler first");
        const map = mapInteractionHandler.mapManager?.getMap();
        if (map) {
          // Remove main click handler
          map.off('click');
        }
      }
      
      // THEN activate waypoint mode
      const success = waypointModeHandler.activate();
      if (!success) {
        console.error("Failed to activate waypoint mode");
        // Restore normal interaction as fallback
        if (mapInteractionHandler) mapInteractionHandler.initialize();
        window.isWaypointModeActive = false;
        return false;
      }
      
      // Change cursor style
      document.body.style.cursor = 'crosshair';
    } else {
      // First deactivate waypoint mode
      const success = waypointModeHandler.deactivate();
      if (!success) {
        console.error("Failed to deactivate waypoint mode");
        // Still try to restore normal mode
      }
      
      // Restore cursor
      document.body.style.cursor = '';
      
      // CRITICAL FIX: Make absolutely sure the global flag is off
      window.isWaypointModeActive = false;
      
      // THEN re-initialize the normal map interaction handler
      if (mapInteractionHandler && typeof mapInteractionHandler.initialize === 'function') {
        console.log("Critical fix: Re-initializing normal map interaction handler");
        mapInteractionHandler.initialize();
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error toggling waypoint mode:", error);
    // Ensure normal mode is restored in case of error
    if (!active && mapInteractionHandler) {
      mapInteractionHandler.initialize();
      window.isWaypointModeActive = false;
    }
    return false;
  }
};

export default {
  createWaypointModeHandler,
  toggleWaypointMode
};