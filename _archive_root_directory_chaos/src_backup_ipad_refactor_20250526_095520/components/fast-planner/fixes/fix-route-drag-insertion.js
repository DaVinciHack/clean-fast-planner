/**
 * fix-route-drag-insertion.js
 * 
 * Specifically fixes the issue where dragging the route line adds waypoints 
 * to the end of the list instead of inserting them at the correct position
 */

console.log('🛠️ Applying route drag insertion fix...');

// Check if fix already applied
if (!window._routeDragInsertionFixApplied) {
  window._routeDragInsertionFixApplied = true;
  
  // Apply the fix when required components are available
  function applyFixWhenReady() {
    // Check if required managers are available
    if (!window.waypointManager || !window.mapInteractionHandler) {
      console.log('🛠️ Waiting for required managers...');
      setTimeout(applyFixWhenReady, 1000);
      return;
    }
    
    console.log('🛠️ Required managers found, applying route drag insertion fix...');
    
    // First fix: handlRouteDragComplete in mapInteractionHandler
    if (window.mapInteractionHandler.handleRouteDragComplete) {
      const originalHandleRouteDragComplete = window.mapInteractionHandler.handleRouteDragComplete;
      
      window.mapInteractionHandler.handleRouteDragComplete = function(insertIndex, coords, dragData = {}) {
        console.log(`🛠️ Fixed handleRouteDragComplete called with index: ${insertIndex}`);
        
        try {
          // Validate insertion index
          if (insertIndex === undefined || insertIndex === null || insertIndex < 0) {
            console.log('🛠️ Invalid insertIndex, using 0 as fallback');
            insertIndex = 0;
          }
          
          const waypoints = window.waypointManager.getWaypoints();
          if (insertIndex > waypoints.length) {
            console.log(`🛠️ Insert index ${insertIndex} exceeds waypoint count ${waypoints.length}, clamping`);
            insertIndex = waypoints.length;
          }
          
          console.log(`🛠️ Using validated insertIndex: ${insertIndex}`);
          
          // Check if we're in waypoint mode
          const isWaypointMode = dragData.isWaypointMode === true || window.isWaypointModeActive === true;
          console.log(`🛠️ Route drag in ${isWaypointMode ? 'WAYPOINT' : 'NORMAL'} mode`);
          
          // Find nearest platform for snap if available
          let nearestPlatform = null;
          if (window.platformManager && typeof window.platformManager.findNearestPlatform === 'function') {
            nearestPlatform = window.platformManager.findNearestPlatform(coords[1], coords[0], 2);
          }
          
          // Generate a waypoint name
          let name;
          if (nearestPlatform && nearestPlatform.distance <= 2) {
            console.log(`🛠️ Found nearby platform: ${nearestPlatform.name}`);
            name = nearestPlatform.name;
            coords = nearestPlatform.coordinates || coords;
          } else {
            name = isWaypointMode ? `Waypoint ${insertIndex + 1}` : `Stop ${insertIndex + 1}`;
          }
          
          // IMPORTANT: Use addWaypointAtIndex directly to avoid any other issues
          console.log(`🛠️ Adding ${isWaypointMode ? 'waypoint' : 'stop'} at index ${insertIndex}: ${name}`);
          
          window.waypointManager.addWaypointAtIndex(
            coords,
            name,
            insertIndex,
            { 
              isWaypoint: isWaypointMode, 
              type: isWaypointMode ? 'WAYPOINT' : 'STOP',
              pointType: isWaypointMode ? 'NAVIGATION_WAYPOINT' : 'LANDING_STOP'
            }
          );
          
          // Notification
          if (window.LoadingIndicator) {
            window.LoadingIndicator.updateStatusIndicator(
              `Added ${name} at position ${insertIndex + 1}`,
              'success',
              3000
            );
          }
        } catch (error) {
          console.error('🛠️ Error in fixed handleRouteDragComplete:', error);
          // Fall back to original if our implementation fails
          originalHandleRouteDragComplete.call(this, insertIndex, coords, dragData);
        }
      };
      
      console.log('🛠️ Successfully patched handleRouteDragComplete');
    }
    
    // Second fix: Override setupRouteDragging to capture drags properly
    if (window.waypointManager.setupRouteDragging) {
      const originalSetupRouteDragging = window.waypointManager.setupRouteDragging;
      
      window.waypointManager.setupRouteDragging = function(callback) {
        console.log('🛠️ Setting up improved route dragging...');
        
        try {
          const map = this.mapManager.getMap();
          if (!map) {
            console.error('🛠️ Map not available for route dragging setup');
            return;
          }
          
          // Enhance the route for dragging
          if (map.getLayer('route')) {
            // Track drag state
            let isDragging = false;
            let dragStartPoint = null;
            
            // Handle drag start
            map.on('mousedown', 'route', (e) => {
              console.log('🛠️ Route drag started');
              isDragging = true;
              dragStartPoint = e.point;
              window._isRouteDragging = true;
              
              // Change cursor
              map.getCanvas().style.cursor = 'grab';
              
              // Prevent event propagation
              e.preventDefault();
              e.originalEvent.stopPropagation();
            });
            
            // Handle drag movement
            map.on('mousemove', (e) => {
              if (!isDragging) return;
              
              // Change cursor during drag
              map.getCanvas().style.cursor = 'grabbing';
            });
            
            // Handle drag end
            map.on('mouseup', (e) => {
              if (!isDragging) return;
              
              console.log('🛠️ Route drag ended');
              
              // Reset state
              isDragging = false;
              window._isRouteDragging = false;
              window._routeDragJustFinished = true;
              
              // Reset cursor
              map.getCanvas().style.cursor = '';
              
              // Only process if drag distance was significant
              if (dragStartPoint && Math.abs(e.point.x - dragStartPoint.x) + Math.abs(e.point.y - dragStartPoint.y) > 5) {
                // Find insert index
                let insertIndex = this.findPathInsertIndex(e.lngLat);
                console.log(`🛠️ Found insert index: ${insertIndex}`);
                
                // Call the callback
                if (typeof callback === 'function') {
                  callback(insertIndex, [e.lngLat.lng, e.lngLat.lat], {
                    isWaypointMode: window.isWaypointModeActive
                  });
                }
              }
              
              // Clear drag flag after a delay
              setTimeout(() => {
                window._routeDragJustFinished = false;
              }, 500);
            });
            
            // Add hover styling
            map.on('mouseenter', 'route', () => {
              if (!isDragging) {
                map.getCanvas().style.cursor = 'pointer';
              }
            });
            
            map.on('mouseleave', 'route', () => {
              if (!isDragging) {
                map.getCanvas().style.cursor = '';
              }
            });
            
            console.log('🛠️ Improved route dragging set up successfully');
          } else {
            console.log('🛠️ Route layer not found, using original setup');
            originalSetupRouteDragging.call(this, callback);
          }
        } catch (error) {
          console.error('🛠️ Error setting up improved route dragging:', error);
          // Fall back to original if our implementation fails
          originalSetupRouteDragging.call(this, callback);
        }
      };
      
      console.log('🛠️ Successfully patched setupRouteDragging');
      
      // Reinitialize route dragging with our improved implementation
      if (window.mapInteractionHandler && typeof window.mapInteractionHandler.handleRouteDragComplete === 'function') {
        try {
          window.waypointManager.setupRouteDragging(
            window.mapInteractionHandler.handleRouteDragComplete.bind(window.mapInteractionHandler)
          );
          console.log('🛠️ Route dragging reinitialized with improved implementation');
        } catch (error) {
          console.error('🛠️ Error reinitializing route dragging:', error);
        }
      }
    }
    
    // Third fix: Override findPathInsertIndex to ensure correct insertion point
    if (window.waypointManager.findPathInsertIndex) {
      const originalFindPathInsertIndex = window.waypointManager.findPathInsertIndex;
      
      window.waypointManager.findPathInsertIndex = function(lngLat) {
        console.log('🛠️ Enhanced findPathInsertIndex called');
        
        try {
          // Call original method
          const index = originalFindPathInsertIndex.call(this, lngLat);
          
          // Validate the result
          const waypoints = this.getWaypoints();
          if (index === undefined || index === null || index < 0) {
            console.log('🛠️ Invalid index returned, using 0 as fallback');
            return 0;
          }
          
          if (index > waypoints.length) {
            console.log(`🛠️ Index ${index} exceeds waypoint count ${waypoints.length}, clamping`);
            return waypoints.length;
          }
          
          console.log(`🛠️ Valid insert index: ${index}`);
          return index;
        } catch (error) {
          console.error('🛠️ Error in enhanced findPathInsertIndex:', error);
          // Return a safe fallback
          return 0;
        }
      };
      
      console.log('🛠️ Successfully patched findPathInsertIndex');
    }
    
    // Show notification that fix is applied
    if (window.LoadingIndicator) {
      window.LoadingIndicator.updateStatusIndicator(
        'Route drag insertion fix applied',
        'success',
        3000
      );
    }
    
    console.log('🛠️ Route drag insertion fix applied successfully');
  }
  
  // Start fixing
  applyFixWhenReady();
}

// Re-export the applyFixWhenReady function so it can be called manually if needed
export function applyRouteDragInsertionFix() {
  window._routeDragInsertionFixApplied = false; // Reset to force re-application
  applyFixWhenReady();
}

export default applyRouteDragInsertionFix;
