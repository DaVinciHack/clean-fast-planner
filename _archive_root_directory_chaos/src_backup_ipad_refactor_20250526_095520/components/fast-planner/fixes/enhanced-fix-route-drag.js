/**
 * enhanced-fix-route-drag.js
 * 
 * Enhanced fix for the route dragging issue where waypoints are incorrectly
 * added to the end of the waypoint list instead of at the proper position.
 * 
 * This fix completely replaces fix-route-drag.js with an improved implementation.
 */

(function() {
  console.log('🔄 Applying enhanced fix for route dragging and waypoint insertion');
  
  // Wait for all required objects to be available before applying fixes
  const checkInterval = setInterval(() => {
    if (!window.mapInteractionHandler || !window.waypointManager) {
      return;
    }
    
    clearInterval(checkInterval);
    console.log('🔄 Found required managers, applying enhanced route drag fix');
    
    // 1. Fix for WaypointManager.findPathInsertIndex method
    // This is critical for correctly determining where to insert new waypoints
    if (typeof window.waypointManager.findPathInsertIndex !== 'function') {
      console.error('🔄 findPathInsertIndex method not found on waypointManager');
      return;
    }
    
    const originalFindPathInsertIndex = window.waypointManager.findPathInsertIndex;
    
    // Override with enhanced version that does better logging and validation
    window.waypointManager.findPathInsertIndex = function(clickedPoint) {
      console.log(`🔄 Finding insert index for clicked point at [${clickedPoint.lng}, ${clickedPoint.lat}]`);
      
      // Handle cases with fewer than 2 waypoints
      if (this.waypoints.length < 2) {
        console.log('🔄 Route has fewer than 2 waypoints, appending to end');
        return this.waypoints.length;
      }
      
      let minDistance = Number.MAX_VALUE;
      let insertIndex = 1;
      let closestSegmentInfo = null;
      
      try {
        // First validate that we have all our dependencies
        if (!window.turf) {
          console.error('🔄 turf.js is not available, using default insert index');
          return Math.max(1, Math.min(this.waypoints.length - 1, Math.floor(this.waypoints.length / 2)));
        }
        
        // Iterate through segments to find the closest one
        for (let i = 0; i < this.waypoints.length - 1; i++) {
          const segment = window.turf.lineString([this.waypoints[i].coords, this.waypoints[i+1].coords]);
          const point = window.turf.point([clickedPoint.lng, clickedPoint.lat]);
          const nearestPoint = window.turf.nearestPointOnLine(segment, point, { units: 'nauticalmiles' });
          
          if (nearestPoint.properties.dist < minDistance) {
            minDistance = nearestPoint.properties.dist;
            insertIndex = i + 1;
            closestSegmentInfo = {
              segmentStart: i,
              segmentEnd: i + 1,
              nearestPoint: nearestPoint.geometry.coordinates,
              distance: nearestPoint.properties.dist
            };
          }
        }
        
        // Validate the result is sensible
        if (insertIndex < 1) {
          console.warn('🔄 Insert index was < 1, correcting to 1');
          insertIndex = 1;
        } else if (insertIndex > this.waypoints.length) {
          console.warn(`🔄 Insert index was > ${this.waypoints.length}, correcting to ${this.waypoints.length}`);
          insertIndex = this.waypoints.length;
        }
        
        console.log(`🔄 Found closest path segment between waypoints ${closestSegmentInfo.segmentStart} and ${closestSegmentInfo.segmentEnd}`);
        console.log(`🔄 Calculated insertion index: ${insertIndex}`);
        
        // Display the closest segment to make debugging easier
        console.log(`🔄 Segment [${closestSegmentInfo.segmentStart}]: ${this.waypoints[closestSegmentInfo.segmentStart].name}`);
        console.log(`🔄 Segment [${closestSegmentInfo.segmentEnd}]: ${this.waypoints[closestSegmentInfo.segmentEnd].name}`);
        
        return insertIndex;
      } catch (error) {
        console.error('🔄 Error finding path insert index:', error);
        
        // Fall back to the middle of the route as a safe default
        const defaultIndex = Math.max(1, Math.min(this.waypoints.length - 1, Math.floor(this.waypoints.length / 2)));
        console.log(`🔄 Using default insert index: ${defaultIndex}`);
        return defaultIndex;
      }
    };
    
    // 2. Fix the MapInteractionHandler.handleRouteDragComplete method
    // This is the method that actually adds the waypoint when a route is dragged
    if (typeof window.mapInteractionHandler.handleRouteDragComplete !== 'function') {
      console.error('🔄 handleRouteDragComplete method not found on mapInteractionHandler');
      return;
    }
    
    const originalHandleRouteDragComplete = window.mapInteractionHandler.handleRouteDragComplete;
    
    window.mapInteractionHandler.handleRouteDragComplete = function(insertIndex, coords, dragData = {}) {
      console.log(`🔄 Enhanced handleRouteDragComplete called with index: ${insertIndex}`);
      console.log(`🔄 Coordinates: [${coords[0]}, ${coords[1]}]`);
      console.log(`🔄 Drag data:`, dragData);
      
      // CRITICAL FIX: Get current waypoint mode and respect it
      const isWaypointMode = dragData.isWaypointMode === true || window.isWaypointModeActive === true;
      
      console.log(`🔄 Current waypoint mode: ${isWaypointMode ? 'WAYPOINT' : 'NORMAL'}`);
      
      // CRITICAL FIX: Validate insertion index is reasonable
      if (typeof insertIndex !== 'number' || insertIndex < 0) {
        console.error(`🔄 Invalid insertIndex: ${insertIndex}, will use 0 instead`);
        insertIndex = 0;
      }
      
      const waypointCount = this.waypointManager.getWaypoints().length;
      if (insertIndex > waypointCount) {
        console.error(`🔄 insertIndex (${insertIndex}) > waypointCount (${waypointCount}), will use ${waypointCount} instead`);
        insertIndex = waypointCount;
      }
      
      console.log(`🔄 Using final insertIndex: ${insertIndex}`);
      
      // CRITICAL FIX: Directly add the waypoint with the appropriate type based on mode
      try {
        if (isWaypointMode) {
          // In waypoint mode, add a navigation waypoint
          let nearestOsdkWp = null;
          if (this.platformManager && typeof this.platformManager.findNearestOsdkWaypoint === 'function') {
            nearestOsdkWp = this.platformManager.findNearestOsdkWaypoint(coords[1], coords[0], 5);
          }
          
          if (nearestOsdkWp) {
            console.log(`🔄 Snapping to OSDK Waypoint: ${nearestOsdkWp.name} at index ${insertIndex}`);
            this.waypointManager.addWaypointAtIndex(
              nearestOsdkWp.coordinates,
              nearestOsdkWp.name,
              insertIndex,
              { isWaypoint: true, type: 'WAYPOINT', pointType: 'NAVIGATION_WAYPOINT' }
            );
          } else {
            console.log(`🔄 Adding generic waypoint at index ${insertIndex}`);
            this.waypointManager.addWaypointAtIndex(
              coords,
              `Waypoint ${insertIndex + 1}`,
              insertIndex,
              { isWaypoint: true, type: 'WAYPOINT', pointType: 'NAVIGATION_WAYPOINT' }
            );
          }
          
          // CRITICAL: Add a debug check to verify insertion worked correctly
          setTimeout(() => {
            const waypointsAfter = this.waypointManager.getWaypoints();
            console.log(`🔄 DEBUG - Current waypoints (${waypointsAfter.length}): [${waypointsAfter.map(wp => wp.name).join(', ')}]`);
            console.log(`🔄 DEBUG - Waypoint at index ${insertIndex} is now: ${waypointsAfter[insertIndex]?.name || 'undefined'}`);
          }, 100);
          
          return; // Don't call the original method
        } else {
          // In normal mode, add a landing stop
          let nearestPlatform = null;
          if (this.platformManager && typeof this.platformManager.findNearestPlatform === 'function') {
            nearestPlatform = this.platformManager.findNearestPlatform(coords[1], coords[0], 5);
          }
          
          if (nearestPlatform) {
            console.log(`🔄 Snapping to Platform: ${nearestPlatform.name} at index ${insertIndex}`);
            this.waypointManager.addWaypointAtIndex(
              nearestPlatform.coordinates,
              nearestPlatform.name,
              insertIndex,
              { isWaypoint: false, type: 'STOP', pointType: 'LANDING_STOP' }
            );
          } else {
            console.log(`🔄 Adding generic stop at index ${insertIndex}`);
            this.waypointManager.addWaypointAtIndex(
              coords,
              `Stop ${insertIndex + 1}`,
              insertIndex,
              { isWaypoint: false, type: 'STOP', pointType: 'LANDING_STOP' }
            );
          }
          
          // CRITICAL: Add a debug check to verify insertion worked correctly
          setTimeout(() => {
            const waypointsAfter = this.waypointManager.getWaypoints();
            console.log(`🔄 DEBUG - Current waypoints (${waypointsAfter.length}): [${waypointsAfter.map(wp => wp.name).join(', ')}]`);
            console.log(`🔄 DEBUG - Waypoint at index ${insertIndex} is now: ${waypointsAfter[insertIndex]?.name || 'undefined'}`);
          }, 100);
          
          return; // Don't call the original method
        }
      } catch (err) {
        console.error('🔄 Error in enhanced handleRouteDragComplete:', err);
        
        // Fall back to original method if there was an error
        console.log('🔄 Falling back to original method due to error');
        return originalHandleRouteDragComplete.call(this, insertIndex, coords, dragData);
      }
    };
    
    console.log('✅ Successfully applied enhanced route drag fix. Dragging the route line should now correctly add waypoints at the proper position.');
    
    // Automatically call setupRouteDragging if it wasn't already set up
    if (window.waypointManager && !window.waypointManager._routeDragHandlers) {
      console.log('🔄 Automatically calling setupRouteDragging with enhanced handlers');
      window.waypointManager.setupRouteDragging(window.mapInteractionHandler.handleRouteDragComplete.bind(window.mapInteractionHandler));
    }
  }, 1000);
})();
