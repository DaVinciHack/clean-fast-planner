/**
 * auto-apply-fix.js
 * 
 * Automatically applies the waypoint vs. stop fix.
 */

console.log('Auto-apply waypoint vs. stop fix script loaded');

// Function to apply the fix
function applyWaypointStopFix() {
  console.log('Applying waypoint vs. stop fix...');
  
  try {
    // Enhance WaypointManager if available
    if (window.waypointManager) {
      console.log('Enhancing WaypointManager with proper point type enum...');
      
      // Store original methods to extend them
      const originalAddWaypoint = window.waypointManager.addWaypoint;
      
      // Override the addWaypoint method to use proper type enum
      window.waypointManager.addWaypoint = function(coords, name, options = {}) {
        // Determine if this is a waypoint by checking options OR the global flag
        const isWaypointOption = options && (options.isWaypoint === true || options.type === 'WAYPOINT');
        const isWaypointGlobal = window.isWaypointModeActive === true;
        const isWaypoint = isWaypointOption || isWaypointGlobal;
        
        // Use explicit point type enum instead of boolean flag
        const pointType = isWaypoint ? 'NAVIGATION_WAYPOINT' : 'LANDING_STOP';
        
        console.log(`Adding ${pointType} at coordinates: ${coords} with name: ${name || 'Unnamed'}`);
        
        // Extend options with our enhanced type
        const enhancedOptions = {
          ...options,
          isWaypoint: isWaypoint,
          type: isWaypoint ? 'WAYPOINT' : 'STOP',
          pointType: pointType
        };
        
        // Call the original method with our enhanced options
        return originalAddWaypoint.call(this, coords, name, enhancedOptions);
      };
      
      // Fix existing waypoints to ensure they have proper pointType
      const waypoints = window.waypointManager.getWaypoints();
      
      if (waypoints && waypoints.length > 0) {
        console.log(`Found ${waypoints.length} existing waypoints to fix`);
        
        let fixedCount = 0;
        
        // Process each waypoint to ensure it has proper pointType
        waypoints.forEach((waypoint, index) => {
          // Check if waypoint already has pointType
          if (!waypoint.pointType) {
            // Determine the proper pointType based on existing flags
            const isWaypoint = waypoint.isWaypoint === true || waypoint.type === 'WAYPOINT';
            waypoint.pointType = isWaypoint ? 'NAVIGATION_WAYPOINT' : 'LANDING_STOP';
            
            console.log(`Added pointType to waypoint ${index}: ${waypoint.pointType}`);
            fixedCount++;
          }
        });
        
        console.log(`Fixed ${fixedCount} waypoints with proper pointType`);
        
        // If we fixed any waypoints, update the UI
        if (fixedCount > 0) {
          // Trigger a route update to refresh the display
          window.waypointManager.updateRoute();
          
          // Force React to re-render by triggering the onChange callback
          window.waypointManager.triggerCallback('onChange', waypoints);
        }
      }
    }
    
    // Show success message
    setTimeout(() => {
      if (window.LoadingIndicator && window.LoadingIndicator.updateStatusIndicator) {
        window.LoadingIndicator.updateStatusIndicator(
          'Waypoint vs. Landing Stop distinction fix has been applied!',
          'success',
          5000
        );
      }
    }, 2000);
    
    console.log('Waypoint vs. stop fix applied successfully');
    return true;
  } catch (error) {
    console.error('Error applying waypoint vs. stop fix:', error);
    return false;
  }
}

// Apply the fix after a delay
setTimeout(applyWaypointStopFix, 2000);
