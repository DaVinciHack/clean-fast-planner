/**
 * EMERGENCY RESET SCRIPT
 * 
 * 1. Copy this entire file's content
 * 2. Open your browser's developer console (F12 or Ctrl+Shift+I)
 * 3. Paste and press Enter to execute
 * 
 * This will force reset the application to normal mode by:
 * - Setting the global waypoint mode flag to false
 * - Removing all map click handlers
 * - Re-initializing the normal map interaction handler
 */

(function() {
  console.log("%c 🚨 EMERGENCY RESET SCRIPT EXECUTING... 🚨", "font-size: 20px; color: red; background: yellow; padding: 5px;");
  
  try {
    // 1. Force global flag to false
    window.isWaypointModeActive = false;
    console.log("%c ✅ Set global flag to false", "color: green");
    
    // 2. Try to access necessary modules and managers
    const managers = {
      mapManager: window.mapManager || (window.app && window.app.mapManager),
      waypointManager: window.waypointManager || (window.app && window.app.waypointManager),
      mapInteractionHandler: window.mapInteractionHandler || (window.app && window.app.mapInteractionHandler)
    };
    
    console.log("%c 📦 Found available managers:", "color: blue", managers);
    
    // 3. Find the map instance
    let mapInstance = null;
    if (managers.mapManager && managers.mapManager.getMap) {
      mapInstance = managers.mapManager.getMap();
      console.log("%c ✅ Found map instance", "color: green");
    } else {
      console.log("%c ❌ Could not find map instance", "color: red");
    }
    
    // 4. Remove all click handlers
    if (mapInstance) {
      mapInstance.off('click');
      console.log("%c ✅ Removed all click handlers", "color: green");
      
      // Remove any layer-specific handlers
      ['route', 'platforms-layer', 'platforms-fixed-layer', 
       'platforms-movable-layer', 'airfields-layer', 'waypoints-layer'].forEach(layer => {
        if (mapInstance.getLayer(layer)) {
          mapInstance.off('click', layer);
        }
      });
      
      // Reset the cursor
      document.body.style.cursor = '';
      mapInstance.getCanvas().style.cursor = '';
    }
    
    // 5. Restore original methods if they were patched
    if (managers.waypointManager) {
      if (managers.waypointManager._originalAddWaypoint) {
        console.log("%c ✅ Restoring original addWaypoint method", "color: green");
        managers.waypointManager.addWaypoint = managers.waypointManager._originalAddWaypoint;
        managers.waypointManager._originalAddWaypoint = null;
      }
      
      if (managers.waypointManager._originalAddWaypointAtIndex) {
        console.log("%c ✅ Restoring original addWaypointAtIndex method", "color: green");
        managers.waypointManager.addWaypointAtIndex = managers.waypointManager._originalAddWaypointAtIndex;
        managers.waypointManager._originalAddWaypointAtIndex = null;
      }
    }
    
    // 6. Re-initialize map interaction handler
    if (managers.mapInteractionHandler && managers.mapInteractionHandler.initialize) {
      console.log("%c ✅ Re-initializing map interaction handler", "color: green");
      managers.mapInteractionHandler.initialize();
    } else {
      console.log("%c ❌ Could not re-initialize map interaction handler", "color: red");
    }
    
    // 7. Try to force UI update if possible
    try {
      console.log("%c 🔍 Looking for React app root...", "color: blue");
      
      // Find potential React root elements
      const rootElements = [
        document.getElementById('fast-planner-app'),
        document.getElementById('app'),
        document.querySelector('.fast-planner-container'),
        document.querySelector('#root')
      ].filter(Boolean);
      
      console.log("%c 🔍 Found potential root elements:", "color: blue", rootElements);
      
      if (rootElements.length > 0) {
        console.log("%c ⚠️ Attempting to update React state (may not work)", "color: orange");
        // This is not a reliable way to update React state
        // It's just a last resort emergency measure
      }
    } catch (err) {
      console.log("%c ❌ Could not update React state", "color: red", err);
    }
    
    console.log("%c 🚨 EMERGENCY RESET COMPLETE 🚨", "font-size: 20px; color: green; background: #eee; padding: 5px;");
    console.log("%c Please try clicking on the map now. If issues persist, reload the page.", "font-style: italic;");
    
  } catch (error) {
    console.error("%c ❌ ERROR DURING RESET:", "color: red; font-weight: bold", error);
    console.log("%c Please reload the page to fully reset the application.", "font-weight: bold");
  }
})();
