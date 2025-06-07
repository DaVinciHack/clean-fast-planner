/**
 * EMERGENCY-MAP-CLICK-FIX.js
 * 
 * Direct fix for map click snapping and route drag issues
 * This file applies direct monkey patches to the critical functions
 */

console.log("🚨 LOADING EMERGENCY MAP CLICK FIX");

// Wait for window.mapInteractionHandler to be available
const applyFixes = () => {
  if (!window.mapInteractionHandler) {
    console.log("⏳ Waiting for mapInteractionHandler to be available...");
    setTimeout(applyFixes, 500);
    return;
  }

  console.log("🔧 APPLYING EMERGENCY FIXES TO MAP INTERACTION HANDLER");

  // -------- FIX #1: DIRECTLY PATCH HANDLE MAP CLICK --------
  const originalHandleMapClick = window.mapInteractionHandler.handleMapClick;
  window.mapInteractionHandler.handleMapClick = function(e) {
    console.log("🛠️ USING PATCHED MAP CLICK HANDLER");
    
    // Prevent duplicate clicks
    if (window._processingMapClick === true) {
      console.log('PATCH: Ignoring duplicate click - already processing');
      return;
    }
    
    // Immediately set processing flag to prevent duplicates
    window._processingMapClick = true;
    
    try {
      // Special processing for routing
      if (window._routeDragJustFinished || window._isRouteDragging) {
        console.log('PATCH: Click event ignored due to recent/active route drag.');
        window._processingMapClick = false;
        return; 
      }
      
      // Check global waypoint mode
      const isWaypointMode = window.isWaypointModeActive === true;
      console.log(`PATCH: Map clicked in ${isWaypointMode ? 'WAYPOINT' : 'NORMAL'} mode.`);
      
      // Get required references
      const map = this.mapManager.getMap();
      if (!map) {
        window._processingMapClick = false;
        return;
      }
      
      // IMPROVED LOGIC: First check for nearest platform within 5nm
      let nearestRig = null;
      if (this.platformManager && typeof this.platformManager.findNearestPlatform === 'function') {
        nearestRig = this.platformManager.findNearestPlatform(e.lngLat.lat, e.lngLat.lng, 5);
        
        if (nearestRig) {
          console.log(`PATCH: Found nearest platform: ${nearestRig.name} at ${nearestRig.distance.toFixed(2)}nm`);
        }
      }
      
      // In waypoint mode, check for nearest waypoint
      let nearestWaypoint = null;
      if (isWaypointMode && this.platformManager && 
          typeof this.platformManager.findNearestOsdkWaypoint === 'function') {
        nearestWaypoint = this.platformManager.findNearestOsdkWaypoint(e.lngLat.lat, e.lngLat.lng, 5);
        
        if (nearestWaypoint) {
          console.log(`PATCH: Found nearest waypoint: ${nearestWaypoint.name} at ${nearestWaypoint.distance.toFixed(2)}nm`);
        }
      }
      
      // First trigger panel open callback
      if (this.callbacks.onLeftPanelOpen) {
        this.callbacks.onLeftPanelOpen();
      }
      
      // IMPROVED LOGIC: Prioritize proper callbacks with nearest facility info
      if (isWaypointMode && nearestWaypoint && nearestWaypoint.distance <= 5) {
        // Use nearest waypoint in waypoint mode
        console.log(`PATCH: Using nearest waypoint ${nearestWaypoint.name} in waypoint mode`);
        
        // Show user feedback
        if (window.LoadingIndicator && window.LoadingIndicator.updateStatusIndicator) {
          window.LoadingIndicator.updateStatusIndicator(
            `Adding waypoint: ${nearestWaypoint.name} (${nearestWaypoint.distance.toFixed(1)} nm away)`,
            'success',
            2000
          );
        }
        
        // Use the platform click callback with waypoint info
        if (this.callbacks.onPlatformClick) {
          this.callbacks.onPlatformClick({
            coordinates: nearestWaypoint.coordinates,
            name: nearestWaypoint.name,
            lngLat: { lng: nearestWaypoint.coordinates[0], lat: nearestWaypoint.coordinates[1] },
            isWaypointMode: true,
            distance: nearestWaypoint.distance
          });
        }
      }
      else if (nearestRig && nearestRig.distance <= 5) {
        // Use nearest platform - this works in both modes
        console.log(`PATCH: Using nearest platform ${nearestRig.name} at ${nearestRig.distance.toFixed(2)}nm`);
        
        // Show user feedback
        if (window.LoadingIndicator && window.LoadingIndicator.updateStatusIndicator) {
          window.LoadingIndicator.updateStatusIndicator(
            `Adding ${isWaypointMode ? 'waypoint' : 'stop'}: ${nearestRig.name} (${nearestRig.distance.toFixed(1)} nm away)`,
            'success',
            2000
          );
        }
        
        // Use the platform click callback - THIS IS KEY FOR PROPER NAMING
        if (this.callbacks.onPlatformClick) {
          this.callbacks.onPlatformClick({
            coordinates: nearestRig.coordinates,
            name: nearestRig.name,
            lngLat: { lng: nearestRig.coordinates[0], lat: nearestRig.coordinates[1] },
            isWaypointMode: isWaypointMode,
            distance: nearestRig.distance
          });
        }
      }
      else {
        // Regular map click (no nearby facility)
        if (this.callbacks.onMapClick) {
          this.callbacks.onMapClick({
            lngLat: e.lngLat,
            coordinates: [e.lngLat.lng, e.lngLat.lat],
            mapClickSource: 'directClick',
            isWaypointMode: isWaypointMode
          });
        }
      }
    } catch (err) {
      console.error('PATCH: Error in patched handleMapClick:', err);
      // Try original method as fallback
      try {
        originalHandleMapClick.call(this, e);
      } catch (fallbackErr) {
        console.error('PATCH: Fallback error:', fallbackErr);
      }
    } finally {
      // Always clear processing flag when done
      setTimeout(() => {
        window._processingMapClick = false;
        console.log('PATCH: Click processing complete, cleared flag');
      }, 300);
    }
  };

  // -------- FIX #2: DIRECTLY PATCH HANDLE ROUTE DRAG COMPLETE --------
  // This fixes the issue where dragging adds two waypoints
  const originalHandleRouteDragComplete = window.mapInteractionHandler.handleRouteDragComplete;
  window.mapInteractionHandler._isProcessingRouteDrag = false; // New flag to prevent duplication
  
  window.mapInteractionHandler.handleRouteDragComplete = function(insertIndex, coords, dragData = {}) {
    console.log(`PATCH: Route drag at index ${insertIndex}`);
    
    // CRITICAL FIX: Use a class property to track drag processing state
    // This ensures we don't add multiple waypoints during a single drag operation
    if (window.mapInteractionHandler._isProcessingRouteDrag) {
      console.log('PATCH: Already processing a route drag, ignoring duplicate call');
      return;
    }
    
    // Set flag directly on the handler instance
    window.mapInteractionHandler._isProcessingRouteDrag = true;
    
    try {
      const isWaypointMode = dragData.isWaypointMode === true || window.isWaypointModeActive === true;
      
      // Validate insertIndex
      if (insertIndex === undefined || insertIndex === null || isNaN(parseInt(insertIndex))) {
        console.error(`PATCH: Invalid insertIndex: ${insertIndex}`);
        insertIndex = 0;
      }
      
      // Convert to integer
      insertIndex = parseInt(insertIndex);
      
      // Ensure within bounds
      const waypointCount = this.waypointManager.getWaypoints().length;
      if (insertIndex < 0) insertIndex = 0;
      if (insertIndex > waypointCount) insertIndex = waypointCount;
      
      console.log(`PATCH: Using validated index ${insertIndex}`);
      
      // IMPROVED SNAPPING - Find nearest facility based on mode
      if (isWaypointMode) {
        // Try to find nearest waypoint
        let nearestWaypoint = null;
        if (this.platformManager && typeof this.platformManager.findNearestOsdkWaypoint === 'function') {
          nearestWaypoint = this.platformManager.findNearestOsdkWaypoint(coords[1], coords[0], 5);
        }
        
        if (nearestWaypoint && nearestWaypoint.distance <= 5) {
          console.log(`PATCH: Snapping route drag to waypoint: ${nearestWaypoint.name}`);
          
          // Show user feedback
          if (window.LoadingIndicator && window.LoadingIndicator.updateStatusIndicator) {
            window.LoadingIndicator.updateStatusIndicator(
              `Added waypoint: ${nearestWaypoint.name} (${nearestWaypoint.distance.toFixed(1)} nm away)`,
              'success',
              2000
            );
          }
          
          // Add at the correct position with the right name
          this.waypointManager.addWaypointAtIndex(
            nearestWaypoint.coordinates,
            nearestWaypoint.name,
            insertIndex,
            { isWaypoint: true, type: 'WAYPOINT' }
          );
        } else {
          // No nearby waypoint, add generic one
          this.waypointManager.addWaypointAtIndex(
            coords,
            `Waypoint ${insertIndex + 1}`,
            insertIndex,
            { isWaypoint: true, type: 'WAYPOINT' }
          );
        }
      } else {
        // Regular mode - try to find nearest platform
        let nearestPlatform = null;
        if (this.platformManager && typeof this.platformManager.findNearestPlatform === 'function') {
          nearestPlatform = this.platformManager.findNearestPlatform(coords[1], coords[0], 5);
        }
        
        if (nearestPlatform && nearestPlatform.distance <= 5) {
          console.log(`PATCH: Snapping route drag to platform: ${nearestPlatform.name}`);
          
          // Show user feedback
          if (window.LoadingIndicator && window.LoadingIndicator.updateStatusIndicator) {
            window.LoadingIndicator.updateStatusIndicator(
              `Added stop: ${nearestPlatform.name} (${nearestPlatform.distance.toFixed(1)} nm away)`,
              'success',
              2000
            );
          }
          
          // Add at the correct position with the right name
          this.waypointManager.addWaypointAtIndex(
            nearestPlatform.coordinates,
            nearestPlatform.name,
            insertIndex,
            { isWaypoint: false, type: 'STOP' }
          );
        } else {
          // No nearby platform, add generic stop
          this.waypointManager.addWaypointAtIndex(
            coords,
            `Stop ${insertIndex + 1}`,
            insertIndex,
            { isWaypoint: false, type: 'STOP' }
          );
        }
      }
      
      console.log(`PATCH: Route drag complete, added waypoint at index ${insertIndex}`);
    } catch (err) {
      console.error('PATCH: Error in patched handleRouteDragComplete:', err);
      // Don't call original as fallback - this would cause double waypoint addition
    } finally {
      // Always clear processing flag after a delay
      setTimeout(() => {
        window.mapInteractionHandler._isProcessingRouteDrag = false;
        console.log('PATCH: Route drag processing complete, cleared flag');
      }, 300);
    }
  };

  console.log("🔧 EMERGENCY FIXES APPLIED SUCCESSFULLY");
  
  // Add a visual indicator that the patch is active
  const addVisualIndicator = () => {
    if (document.getElementById('emergency-fix-indicator')) return;
    
    const indicator = document.createElement('div');
    indicator.id = 'emergency-fix-indicator';
    indicator.style.position = 'fixed';
    indicator.style.bottom = '10px';
    indicator.style.right = '10px';
    indicator.style.backgroundColor = '#4CAF50';
    indicator.style.color = 'white';
    indicator.style.padding = '5px 10px';
    indicator.style.borderRadius = '5px';
    indicator.style.fontSize = '12px';
    indicator.style.zIndex = '9999';
    indicator.style.opacity = '0.8';
    indicator.textContent = 'Map Click Fix Active';
    
    document.body.appendChild(indicator);
    
    // Make it fade out after 5 seconds
    setTimeout(() => {
      indicator.style.transition = 'opacity 1s';
      indicator.style.opacity = '0';
      
      // Remove it after fade out
      setTimeout(() => {
        if (indicator.parentNode) {
          indicator.parentNode.removeChild(indicator);
        }
      }, 1000);
    }, 5000);
  };
  
  // Add the indicator
  addVisualIndicator();
};

// Start applying fixes
applyFixes();
