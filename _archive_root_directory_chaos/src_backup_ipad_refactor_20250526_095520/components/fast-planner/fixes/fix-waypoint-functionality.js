/**
 * fix-waypoint-functionality.js
 * 
 * A focused fix for the critical waypoint functionality issues in the Fast Planner:
 * 1. Ensures waypoints are added as waypoints (not stops)
 * 2. Fixes drag operation to correctly add waypoints when in waypoint mode
 * 3. Ensures proper flags are set for OSDK integration
 */

(function() {
  console.log('🔧 Applying waypoint functionality fix - NO STYLE CHANGES');
  
  // Fix 1: Ensure global waypoint mode flag is correctly initialized
  window.isWaypointModeActive = window.isWaypointModeActive || false;
  
  // Fix 2: Fix WaypointManager.addWaypoint to properly respect waypoint vs stop mode
  fixWaypointManagerAddMethod();
  
  // Fix 3: Fix route drag functionality to respect waypoint mode
  fixRouteDragFunctionality();
  
  console.log('✅ Waypoint functionality fix applied. No style changes made.');
})();

/**
 * Fix the WaypointManager.addWaypoint method to properly handle waypoints vs stops
 */
function fixWaypointManagerAddMethod() {
  // Wait for WaypointManager to be available
  const waitForWaypointManager = setInterval(() => {
    if (!window.waypointManager) return;
    
    clearInterval(waitForWaypointManager);
    console.log('🔧 Found WaypointManager, applying fix to addWaypoint method');
    
    // Save original methods
    const originalAddWaypoint = window.waypointManager.addWaypoint;
    const originalAddWaypointAtIndex = window.waypointManager.addWaypointAtIndex;
    
    // Replace addWaypoint with fixed version
    window.waypointManager.addWaypoint = function(coords, name, options = {}) {
      // CRITICAL FIX: Always check global waypoint mode flag
      const globalWaypointMode = window.isWaypointModeActive === true;
      
      // If in waypoint mode or options explicitly set isWaypoint/type
      const isExplicitWaypoint = options && (options.isWaypoint === true || options.type === 'WAYPOINT');
      const isWaypoint = globalWaypointMode || isExplicitWaypoint;
      
      // Ensure waypoint properties are correctly set
      const enhancedOptions = {
        ...options,
        isWaypoint: isWaypoint,
        type: isWaypoint ? 'WAYPOINT' : 'STOP'
      };
      
      console.log(`🔧 Adding ${isWaypoint ? 'WAYPOINT' : 'STOP'} at coordinates: ${coords}`);
      
      // Call original method with enhanced options
      return originalAddWaypoint.call(this, coords, name, enhancedOptions);
    };
    
    // Replace addWaypointAtIndex with fixed version
    window.waypointManager.addWaypointAtIndex = function(coords, name, index, options = {}) {
      // CRITICAL FIX: Always check global waypoint mode flag
      const globalWaypointMode = window.isWaypointModeActive === true;
      
      // If in waypoint mode or options explicitly set isWaypoint/type
      const isExplicitWaypoint = options && (options.isWaypoint === true || options.type === 'WAYPOINT');
      const isWaypoint = globalWaypointMode || isExplicitWaypoint;
      
      // Ensure waypoint properties are correctly set
      const enhancedOptions = {
        ...options,
        isWaypoint: isWaypoint,
        type: isWaypoint ? 'WAYPOINT' : 'STOP'
      };
      
      console.log(`🔧 Adding ${isWaypoint ? 'WAYPOINT' : 'STOP'} at index ${index}`);
      
      // Call original method with enhanced options
      return originalAddWaypointAtIndex.call(this, coords, name, index, enhancedOptions);
    };
    
    console.log('✅ WaypointManager methods fixed');
  }, 100);
}

/**
 * Fix the route drag functionality to respect waypoint mode
 */
function fixRouteDragFunctionality() {
  // Wait for MapInteractionHandler to be available
  const waitForMapInteractionHandler = setInterval(() => {
    if (!window.mapInteractionHandler) return;
    
    clearInterval(waitForMapInteractionHandler);
    console.log('🔧 Found MapInteractionHandler, applying fix to route drag handling');
    
    // Save original method
    const originalHandleRouteDragComplete = window.mapInteractionHandler.handleRouteDragComplete;
    
    // Replace handleRouteDragComplete with fixed version
    window.mapInteractionHandler.handleRouteDragComplete = function(insertIndex, coords, dragData = {}) {
      // CRITICAL FIX: Check global waypoint mode flag
      const globalWaypointMode = window.isWaypointModeActive === true;
      
      // Add waypoint mode info to dragData if not already present
      const enhancedDragData = {
        ...dragData,
        isWaypointMode: globalWaypointMode
      };
      
      console.log(`🔧 Route drag in ${globalWaypointMode ? 'WAYPOINT' : 'NORMAL'} mode at index ${insertIndex}`);
      
      // Call original method with enhanced dragData
      return originalHandleRouteDragComplete.call(this, insertIndex, coords, enhancedDragData);
    };
    
    console.log('✅ Route drag handling fixed');
  }, 100);
}

/**
 * Helper to log the type of all waypoints in the route
 * Use this for debugging
 */
window.debugRouteWaypoints = function() {
  if (!window.waypointManager) {
    console.log('⚠️ WaypointManager not available');
    return;
  }
  
  const waypoints = window.waypointManager.getWaypoints();
  console.table(waypoints.map((wp, index) => ({
    index,
    name: wp.name,
    isWaypoint: wp.isWaypoint === true,
    type: wp.type || 'UNKNOWN'
  })));
  
  console.log('Current waypoint mode:', window.isWaypointModeActive === true ? 'WAYPOINT' : 'NORMAL');
};
