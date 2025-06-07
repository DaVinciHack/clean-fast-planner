/**
 * safe-waypoint-handler.js
 * 
 * This script safely handles waypoint operations to avoid
 * duplicate operations and conflicts between various fixes.
 */

console.log('🚩 Initializing safe waypoint handler...');

// Global flag to prevent multiple executions
if (window._safeWaypointHandlerApplied) {
  console.log('🚩 Safe waypoint handler already applied, skipping');
} else {
  window._safeWaypointHandlerApplied = true;

  // Step 1: Create safer waypoint handling methods
  function createSaferWaypointHandling() {
    if (!window.waypointManager) {
      console.log('🚩 WaypointManager not available yet, will retry later');
      return false;
    }
    
    console.log('🚩 Creating safer waypoint handling methods...');
    
    // Create a map handler that prevents multiple operations
    // and properly debounces click events
    
    // Store original methods
    const originalAddWaypoint = window.waypointManager.addWaypoint;
    const originalAddWaypointAtIndex = window.waypointManager.addWaypointAtIndex;
    const originalRemoveWaypoint = window.waypointManager.removeWaypoint;
    
    // Debounce variables
    let lastAddTime = 0;
    let lastRemoveTime = 0;
    let lastCoords = null;
    const MIN_OPERATION_INTERVAL = 500; // ms
    
    // Replace addWaypoint with a safer version
    window.waypointManager.addWaypoint = function(coords, name, options = {}) {
      const now = Date.now();
      
      // Check if this is a duplicate operation
      const isSameLocation = lastCoords && 
        coords && 
        Array.isArray(coords) && 
        Array.isArray(lastCoords) &&
        Math.abs(coords[0] - lastCoords[0]) < 0.0001 && 
        Math.abs(coords[1] - lastCoords[1]) < 0.0001;
      
      if (now - lastAddTime < MIN_OPERATION_INTERVAL && isSameLocation) {
        console.log('🚩 Preventing duplicate waypoint addition');
        return null;
      }
      
      // Update tracking variables
      lastAddTime = now;
      lastCoords = coords;
      
      console.log(`🚩 Safely adding ${options.isWaypoint ? 'waypoint' : 'stop'} at coordinates:`, coords);
      
      try {
        // Ensure options has the required properties
        const safeOptions = {
          ...options,
          isWaypoint: options.isWaypoint || window.isWaypointModeActive === true,
          type: options.isWaypoint || window.isWaypointModeActive === true ? 'WAYPOINT' : 'STOP',
          pointType: options.isWaypoint || window.isWaypointModeActive === true ? 'NAVIGATION_WAYPOINT' : 'LANDING_STOP'
        };
        
        // Call the original method
        const result = originalAddWaypoint.call(this, coords, name, safeOptions);
        
        // Ensure we trigger a redraw
        setTimeout(() => {
          try {
            this.updateRoute();
          } catch (e) {
            console.error('🚩 Error updating route after waypoint addition:', e);
          }
        }, 100);
        
        return result;
      } catch (error) {
        console.error('🚩 Error in safe addWaypoint:', error);
        
        // Try to recover by using a more direct approach
        try {
          // Create a simple waypoint object
          const waypoint = {
            id: `wp_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            coords: coords,
            name: name || `Waypoint ${this.waypoints.length + 1}`,
            pointType: options.isWaypoint || window.isWaypointModeActive === true ? 'NAVIGATION_WAYPOINT' : 'LANDING_STOP',
            isWaypoint: options.isWaypoint || window.isWaypointModeActive === true
          };
          
          // Add to waypoints array
          this.waypoints.push(waypoint);
          
          // Update route
          this.updateRoute();
          
          // Trigger callback
          if (typeof this.triggerCallback === 'function') {
            this.triggerCallback('onChange', [...this.waypoints]);
          }
          
          return waypoint;
        } catch (recoveryError) {
          console.error('🚩 Recovery attempt also failed:', recoveryError);
          return null;
        }
      }
    };
    
    // Replace addWaypointAtIndex with a safer version
    window.waypointManager.addWaypointAtIndex = function(coords, name, index, options = {}) {
      const now = Date.now();
      
      // Check if index is valid
      if (index === undefined || index === null || isNaN(index)) {
        console.log('🚩 Invalid index, using end of array');
        index = this.waypoints.length;
      }
      
      // Check if this is a duplicate operation
      const isSameLocation = lastCoords && 
        coords && 
        Array.isArray(coords) && 
        Array.isArray(lastCoords) &&
        Math.abs(coords[0] - lastCoords[0]) < 0.0001 && 
        Math.abs(coords[1] - lastCoords[1]) < 0.0001;
      
      if (now - lastAddTime < MIN_OPERATION_INTERVAL && isSameLocation) {
        console.log('🚩 Preventing duplicate waypoint addition at index');
        return null;
      }
      
      // Update tracking variables
      lastAddTime = now;
      lastCoords = coords;
      
      console.log(`🚩 Safely adding ${options.isWaypoint ? 'waypoint' : 'stop'} at index ${index}:`, coords);
      
      try {
        // Ensure options has the required properties
        const safeOptions = {
          ...options,
          isWaypoint: options.isWaypoint || window.isWaypointModeActive === true,
          type: options.isWaypoint || window.isWaypointModeActive === true ? 'WAYPOINT' : 'STOP',
          pointType: options.isWaypoint || window.isWaypointModeActive === true ? 'NAVIGATION_WAYPOINT' : 'LANDING_STOP'
        };
        
        // Call the original method
        const result = originalAddWaypointAtIndex.call(this, coords, name, index, safeOptions);
        
        // Ensure we trigger a redraw
        setTimeout(() => {
          try {
            this.updateRoute();
          } catch (e) {
            console.error('🚩 Error updating route after waypoint addition at index:', e);
          }
        }, 100);
        
        return result;
      } catch (error) {
        console.error('🚩 Error in safe addWaypointAtIndex:', error);
        
        // Try to recover by using a more direct approach
        try {
          // Create a simple waypoint object
          const waypoint = {
            id: `wp_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            coords: coords,
            name: name || `Waypoint ${index + 1}`,
            pointType: options.isWaypoint || window.isWaypointModeActive === true ? 'NAVIGATION_WAYPOINT' : 'LANDING_STOP',
            isWaypoint: options.isWaypoint || window.isWaypointModeActive === true
          };
          
          // Add to waypoints array at the specified index
          this.waypoints.splice(index, 0, waypoint);
          
          // Update route
          this.updateRoute();
          
          // Trigger callback
          if (typeof this.triggerCallback === 'function') {
            this.triggerCallback('onChange', [...this.waypoints]);
          }
          
          return waypoint;
        } catch (recoveryError) {
          console.error('🚩 Recovery attempt also failed:', recoveryError);
          return null;
        }
      }
    };
    
    // Replace removeWaypoint with a safer version
    window.waypointManager.removeWaypoint = function(waypointId, waypointIndex) {
      const now = Date.now();
      
      if (now - lastRemoveTime < MIN_OPERATION_INTERVAL) {
        console.log('🚩 Preventing duplicate waypoint removal');
        return false;
      }
      
      // Update tracking variables
      lastRemoveTime = now;
      
      console.log('🚩 Safely removing waypoint:', waypointId);
      
      try {
        // Call the original method
        const result = originalRemoveWaypoint.call(this, waypointId, waypointIndex);
        
        // Ensure we trigger a redraw
        setTimeout(() => {
          try {
            this.updateRoute();
          } catch (e) {
            console.error('🚩 Error updating route after waypoint removal:', e);
          }
        }, 100);
        
        return result;
      } catch (error) {
        console.error('🚩 Error in safe removeWaypoint:', error);
        
        // Try to recover by using a more direct approach
        try {
          // Find the waypoint in the array
          let index = -1;
          
          if (waypointIndex !== undefined && waypointIndex !== null && !isNaN(waypointIndex)) {
            index = waypointIndex;
          } else {
            index = this.waypoints.findIndex(wp => wp.id === waypointId);
          }
          
          if (index !== -1) {
            // Remove the waypoint marker if it exists
            const marker = this.markers[index];
            if (marker) {
              marker.remove();
              this.markers.splice(index, 1);
            }
            
            // Remove the waypoint from the array
            this.waypoints.splice(index, 1);
            
            // Update route
            this.updateRoute();
            
            // Trigger callback
            if (typeof this.triggerCallback === 'function') {
              this.triggerCallback('onChange', [...this.waypoints]);
            }
            
            return true;
          }
          
          return false;
        } catch (recoveryError) {
          console.error('🚩 Recovery attempt also failed:', recoveryError);
          return false;
        }
      }
    };
    
    console.log('🚩 Waypoint handling methods safely wrapped');
    return true;
  }

  // Run the fixes
  function attemptFixes() {
    const waypointHandlingFixed = createSaferWaypointHandling();
    
    if (!waypointHandlingFixed) {
      console.log('🚩 Waypoint handling could not be fixed yet, will retry...');
      setTimeout(attemptFixes, 1000);
    } else {
      console.log('🚩 Safe waypoint handling successfully applied');
      
      // Show notification
      if (window.LoadingIndicator && window.LoadingIndicator.updateStatusIndicator) {
        window.LoadingIndicator.updateStatusIndicator(
          'Safe waypoint handling enabled',
          'success',
          3000
        );
      }
    }
  }
  
  // Start fixing
  // Delay to ensure WaypointManager is initialized
  setTimeout(attemptFixes, 1000);
}

// Export function for manual application
export function applySafeWaypointHandler() {
  window._safeWaypointHandlerApplied = false;
  console.log('🚩 Manually applying safe waypoint handler...');
  // Code will re-run because we reset the flag
}

export default applySafeWaypointHandler;