/**
 * Fix for WaypointHandler.js
 * 
 * This fix ensures the WaypointHandler properly handles waypoint insertion
 * and communicates with other parts of the application.
 * 
 * Instructions:
 * 1. Apply these changes to the src/components/fast-planner/modules/WaypointHandler.js file
 */

// Modify the setEnabled method to properly update the global flag
// and ensure proper coordination with other handlers

/**
 * Enable or disable waypoint mode
 * @param {boolean} enabled - Whether to enable waypoint mode
 */
setEnabled(enabled) {
  console.log(`🟡 WaypointHandler: ${enabled ? 'Enabling' : 'Disabling'} waypoint mode`);
  
  // CRITICAL FIX: Update the global flag
  window.isWaypointModeActive = enabled;
  
  // Store the enabled state
  this.enabled = enabled;
  
  // Change the cursor to indicate mode
  if (this.map) {
    this.map.getCanvas().style.cursor = enabled ? 'crosshair' : '';
  }
  
  // CRITICAL FIX: Show status message to user
  if (window.LoadingIndicator) {
    window.LoadingIndicator.updateStatusIndicator(
      `${enabled ? 'Waypoint' : 'Normal'} mode activated. Click on the map to add ${enabled ? 'waypoints' : 'stops'}.`,
      enabled ? 'success' : 'info',
      5000 // Show for 5 seconds
    );
  }
  
  // Return the new state
  return this.enabled;
}

// Modify the handleWaypointClick method to properly handle waypoint insertion

/**
 * Handle map clicks for waypoints - this is a dedicated handler
 * that ONLY runs when a waypoint should be added
 * @param {Object} e - The click event
 */
handleWaypointClick(e) {
  // Only process if waypoint mode is enabled
  if (!this.enabled) return;
  
  console.log('🟡 WaypointHandler: Map clicked for waypoint');
  
  // CRITICAL FIX: Stop event propagation to prevent other handlers from firing
  e.stopPropagation();
  
  // Add a waypoint directly
  this.addWaypoint([e.lngLat.lng, e.lngLat.lat]);
  
  // CRITICAL FIX: Force redraw of route
  setTimeout(() => {
    if (this.waypointManager && this.waypointManager.updateRoute) {
      this.waypointManager.updateRoute();
    }
  }, 50);
}
