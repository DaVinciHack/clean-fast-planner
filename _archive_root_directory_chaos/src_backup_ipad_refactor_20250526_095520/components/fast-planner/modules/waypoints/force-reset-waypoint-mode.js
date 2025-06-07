/**
 * force-reset-waypoint-mode.js
 * 
 * Emergency fix for waypoint mode not turning off properly.
 * This file forces waypoint mode back to normal state.
 */

// Force reset function to completely restore normal mode
export function forceResetToNormalMode() {
  console.log("🚨 EMERGENCY FIX: Forcing reset to normal mode");
  
  try {
    // 1. Force global flag to false
    window.isWaypointModeActive = false;
    console.log("🚨 Set global flag to false");
    
    // 2. Find the map instance
    let mapInstance = null;
    if (window.mapManager && window.mapManager.getMap) {
      mapInstance = window.mapManager.getMap();
      console.log("🚨 Found map instance");
    }
    
    if (mapInstance) {
      // 3. Remove ALL click handlers from the map
      console.log("🚨 Removing all click handlers");
      mapInstance.off('click');
      
      // 4. Remove any layer-specific handlers
      const layers = ['route', 'platforms-layer', 'platforms-fixed-layer', 
                      'platforms-movable-layer', 'airfields-layer', 'waypoints-layer'];
      
      layers.forEach(layer => {
        if (mapInstance.getLayer(layer)) {
          console.log(`🚨 Removing click handler from ${layer} layer`);
          mapInstance.off('click', layer);
        }
      });
      
      // 5. Remove all drag handlers
      console.log("🚨 Removing all drag handlers");
      mapInstance.off('mousedown');
      mapInstance.off('mousemove');
      mapInstance.off('mouseup');
      
      // 6. Reset cursor
      console.log("🚨 Resetting cursor");
      document.body.style.cursor = '';
      if (mapInstance.getCanvas) {
        mapInstance.getCanvas().style.cursor = '';
      }
    }
    
    // 7. If we have access to the managers, reset them
    if (window.mapInteractionHandler && window.mapInteractionHandler.initialize) {
      console.log("🚨 Re-initializing the map interaction handler");
      window.mapInteractionHandler.initialize();
    }
    
    // 8. Restore platforms visibility if needed
    if (window.platformManager && window.platformManager.toggleVisibility) {
      console.log("🚨 Ensuring platforms are visible");
      window.platformManager.toggleVisibility(true);
    }
    
    // 9. Force restore any patched methods in waypointManager
    if (window.waypointManager) {
      console.log("🚨 Checking for _originalAddWaypoint method");
      if (window.waypointManager._originalAddWaypoint) {
        console.log("🚨 Restoring original addWaypoint method");
        window.waypointManager.addWaypoint = window.waypointManager._originalAddWaypoint;
        window.waypointManager._originalAddWaypoint = null;
      }
      
      if (window.waypointManager._originalAddWaypointAtIndex) {
        console.log("🚨 Restoring original addWaypointAtIndex method");
        window.waypointManager.addWaypointAtIndex = window.waypointManager._originalAddWaypointAtIndex;
        window.waypointManager._originalAddWaypointAtIndex = null;
      }
    }
    
    // 10. Update the UI state if possible
    try {
      const appRoot = document.querySelector('#fast-planner-app');
      if (appRoot && appRoot.__reactInternalInstance$) {
        console.log("🚨 Attempting to update React component state");
        // This is not a reliable way to update React state, but it's an emergency measure
        if (appRoot.__reactInternalInstance$._currentElement._owner._instance) {
          const component = appRoot.__reactInternalInstance$._currentElement._owner._instance;
          if (component.setWaypointModeActive) {
            component.setWaypointModeActive(false);
            console.log("🚨 Updated React component state");
          }
        }
      }
    } catch (err) {
      console.log("🚨 Could not update React component state:", err);
    }
    
    console.log("🚨 Force reset to normal mode complete. Please reload the page if issues persist.");
    return true;
  } catch (error) {
    console.error("🚨 Error during force reset:", error);
    return false;
  }
}

// Force reset function to activate waypoint mode properly
export function forceActivateWaypointMode() {
  console.log("🚨 EMERGENCY FIX: Forcing waypoint mode activation");
  
  try {
    // 1. Force global flag to true
    window.isWaypointModeActive = true;
    console.log("🚨 Set global flag to true");
    
    // 2. Find the map instance
    let mapInstance = null;
    if (window.mapManager && window.mapManager.getMap) {
      mapInstance = window.mapManager.getMap();
      console.log("🚨 Found map instance");
    }
    
    if (mapInstance) {
      // 3. Remove ALL click handlers from the map
      console.log("🚨 Removing all click handlers");
      mapInstance.off('click');
    }
    
    // 4. Try to force update UI state if possible
    try {
      const appRoot = document.querySelector('#fast-planner-app');
      if (appRoot && appRoot.__reactInternalInstance$) {
        console.log("🚨 Attempting to update React component state");
        // This is not a reliable way to update React state, but it's an emergency measure
        if (appRoot.__reactInternalInstance$._currentElement._owner._instance) {
          const component = appRoot.__reactInternalInstance$._currentElement._owner._instance;
          if (component.setWaypointModeActive) {
            component.setWaypointModeActive(true);
            console.log("🚨 Updated React component state");
          }
        }
      }
    } catch (err) {
      console.log("🚨 Could not update React component state:", err);
    }
    
    console.log("🚨 Force activation of waypoint mode complete");
    return true;
  } catch (error) {
    console.error("🚨 Error during force activation:", error);
    return false;
  }
}

// Export a toggle function that forces the correct state
export function forceToggleWaypointMode(active) {
  if (active) {
    return forceActivateWaypointMode();
  } else {
    return forceResetToNormalMode();
  }
}

// Make these functions globally available for emergency console use
window.forceResetToNormalMode = forceResetToNormalMode;
window.forceActivateWaypointMode = forceActivateWaypointMode;
window.forceToggleWaypointMode = forceToggleWaypointMode;

export default {
  forceResetToNormalMode,
  forceActivateWaypointMode,
  forceToggleWaypointMode
};
