/**
 * fix-route-drag.js
 * 
 * Focused fix ONLY for the route dragging issue where dragging the 
 * route line always adds stops regardless of waypoint mode.
 */

(function() {
  console.log('🔧 Applying targeted fix for route drag in waypoint mode');
  
  // Wait for MapInteractionHandler to be available
  const checkInterval = setInterval(() => {
    if (!window.mapInteractionHandler) return;
    
    clearInterval(checkInterval);
    console.log('Found MapInteractionHandler, applying route drag fix');
    
    // Check if handleRouteDragComplete exists
    if (typeof window.mapInteractionHandler.handleRouteDragComplete !== 'function') {
      console.error('handleRouteDragComplete method not found on MapInteractionHandler');
      return;
    }
    
    // Save original method
    const originalMethod = window.mapInteractionHandler.handleRouteDragComplete;
    
    // Override the method
    window.mapInteractionHandler.handleRouteDragComplete = function(insertIndex, coords, dragData = {}) {
      console.log('🔍 Route drag detected at index', insertIndex);
      
      // CRITICAL FIX: Get current waypoint mode and add to dragData
      const isWaypointMode = window.isWaypointModeActive === true;
      
      // Log for debugging
      console.log(`🔍 Current waypoint mode: ${isWaypointMode ? 'WAYPOINT' : 'NORMAL'}`);
      
      // Create enhanced drag data with explicit waypoint flag
      const enhancedDragData = {
        ...dragData,
        isWaypointMode: isWaypointMode
      };
      
      // If in waypoint mode, make sure waypoint is added properly
      if (isWaypointMode && window.waypointManager) {
        console.log('🔧 Adding waypoint directly in waypoint mode at index:', insertIndex);
        
        // Try to find nearest navigation waypoint if available
        let nearestWaypoint = null;
        try {
          if (window.platformManager && typeof window.platformManager.findNearestWaypoint === 'function') {
            nearestWaypoint = window.platformManager.findNearestWaypoint(coords[1], coords[0], 5);
          }
        } catch (error) {
          console.error('Error finding nearest waypoint:', error);
        }
        
        // CRITICAL FIX: Ensure the correct index is used for insertion
        // Double-check the insertion index is valid - sometimes it can be incorrect
        const waypointCount = window.waypointManager.getWaypoints().length;
        let finalInsertIndex = insertIndex;
        
        if (finalInsertIndex < 0) {
          finalInsertIndex = 0;
          console.warn('🔧 Fixed negative insertion index to 0');
        } else if (finalInsertIndex > waypointCount) {
          finalInsertIndex = waypointCount;
          console.warn(`🔧 Fixed out-of-bounds insertion index to ${waypointCount}`);
        }
        
        console.log(`🔧 Final insertion index: ${finalInsertIndex} (originally ${insertIndex})`);
        
        // Use nearest waypoint or custom waypoint
        if (nearestWaypoint && nearestWaypoint.distance < 5) {
          console.log('Found nearest waypoint:', nearestWaypoint.name);
          
          window.waypointManager.addWaypointAtIndex(
            nearestWaypoint.coordinates,
            nearestWaypoint.name,
            finalInsertIndex,
            { isWaypoint: true, type: 'WAYPOINT' }
          );
          
          // Return immediately to prevent original method from adding a stop
          return;
        } else {
          // No nearby waypoint, add a custom waypoint
          window.waypointManager.addWaypointAtIndex(
            coords,
            `Waypoint ${finalInsertIndex+1}`,
            finalInsertIndex,
            { isWaypoint: true, type: 'WAYPOINT' }
          );
          
          // Return immediately to prevent original method from adding a stop
          return;
        }
      }
      
      // If not in waypoint mode, call original method with enhanced data
      return originalMethod.call(this, insertIndex, coords, enhancedDragData);
    };
    
    console.log('✅ Route drag fix applied. Dragging the route line will now correctly add waypoints when in waypoint mode.');
  }, 100);
})();

// Add a test function to verify the fix
window.testRouteDragFix = function() {
  console.log('Testing route drag fix...');
  
  // Check if we have the necessary objects
  if (!window.mapInteractionHandler || !window.waypointManager) {
    console.error('Required objects not found. Make sure the app is fully loaded.');
    return false;
  }
  
  // Get current waypoint mode
  const isWaypointMode = window.isWaypointModeActive === true;
  console.log(`Current waypoint mode: ${isWaypointMode ? 'WAYPOINT' : 'NORMAL'}`);
  
  // Toggle to waypoint mode if needed
  if (!isWaypointMode) {
    console.log('Switching to waypoint mode for test');
    window.isWaypointModeActive = true;
    if (window.waypointHandler && typeof window.waypointHandler.setEnabled === 'function') {
      window.waypointHandler.setEnabled(true);
    }
  }
  
  // Get a waypoint count before the test
  const waypointsBefore = window.waypointManager.getWaypoints().filter(wp => wp.isWaypoint === true).length;
  console.log(`Waypoints before test: ${waypointsBefore}`);
  
  // Simulate a route drag operation
  console.log('Simulating route drag...');
  
  // Get map center as test coordinates
  let testCoords = [0, 0];
  if (window.mapManager && window.mapManager.getMap()) {
    const center = window.mapManager.getMap().getCenter();
    testCoords = [center.lng, center.lat];
  }
  
  // Call handleRouteDragComplete directly
  const insertIndex = window.waypointManager.getWaypoints().length > 0 ? 1 : 0;
  window.mapInteractionHandler.handleRouteDragComplete(insertIndex, testCoords, { isTest: true });
  
  // Check if a waypoint was added
  setTimeout(() => {
    const waypointsAfter = window.waypointManager.getWaypoints().filter(wp => wp.isWaypoint === true).length;
    console.log(`Waypoints after test: ${waypointsAfter}`);
    
    if (waypointsAfter > waypointsBefore) {
      console.log('✅ TEST PASSED! A waypoint was added correctly.');
      
      // List all waypoints
      const allWaypoints = window.waypointManager.getWaypoints();
      console.table(allWaypoints.map((wp, idx) => ({
        index: idx,
        name: wp.name,
        isWaypoint: wp.isWaypoint === true ? 'YES' : 'NO',
        type: wp.type || 'UNKNOWN'
      })));
      
      return true;
    } else {
      console.error('❌ TEST FAILED! No waypoint was added.');
      return false;
    }
  }, 100);
};
