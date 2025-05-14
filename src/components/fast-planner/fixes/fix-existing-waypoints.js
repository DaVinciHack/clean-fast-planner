/**
 * fix-existing-waypoints.js
 * 
 * A script to fix existing waypoints to ensure they all have the proper pointType.
 * This script runs once when the page loads to update any waypoints that were
 * created before the fix was applied.
 */

// Make the function globally accessible for monitoring
window.fixExistingWaypoints = function() {
  console.log('🛠️ Fixing existing waypoints to ensure proper pointType...');
  
  if (!window.waypointManager) {
    console.error('🛠️ Cannot fix waypoints: waypointManager not available');
    return false;
  }
  
  const waypoints = window.waypointManager.getWaypoints();
  if (!waypoints || waypoints.length === 0) {
    console.log('🛠️ No existing waypoints to fix');
    return true;
  }
  
  console.log(`🛠️ Found ${waypoints.length} existing waypoints to check`);
  
  let fixedCount = 0;
  
  // Process each waypoint to ensure it has proper pointType
  waypoints.forEach((waypoint, index) => {
    // Check if waypoint already has pointType
    if (!waypoint.pointType) {
      // Determine the proper pointType based on existing flags
      const isWaypoint = waypoint.isWaypoint === true || waypoint.type === 'WAYPOINT';
      waypoint.pointType = isWaypoint ? 'NAVIGATION_WAYPOINT' : 'LANDING_STOP';
      
      console.log(`🛠️ Added pointType to waypoint ${index}: ${waypoint.name} - ${waypoint.pointType}`);
      fixedCount++;
    }
  });
  
  console.log(`🛠️ Fixed ${fixedCount} waypoints with proper pointType`);
  
  // If we fixed any waypoints, update the UI
  if (fixedCount > 0) {
    try {
      // Trigger a route update to refresh the display
      window.waypointManager.updateRoute();
      
      // Force React to re-render by triggering the onChange callback
      window.waypointManager.triggerCallback('onChange', waypoints);
      
      console.log('🛠️ Updated route display with fixed waypoints');
      return true;
    } catch (error) {
      console.error('🛠️ Error updating route after fixing waypoints:', error);
      return false;
    }
  }
  
  return true;
};

// Create a retry mechanism for waypointManager
let fixAttempts = 0;
const maxFixAttempts = 20;
const fixInterval = 500; // ms

function attemptFix() {
  fixAttempts++;
  console.log(`🛠️ Attempting to fix existing waypoints (attempt ${fixAttempts}/${maxFixAttempts})...`);
  
  if (window.waypointManager) {
    return window.fixExistingWaypoints();
  } else {
    if (fixAttempts < maxFixAttempts) {
      setTimeout(attemptFix, fixInterval);
    } else {
      console.error('🛠️ Failed to fix existing waypoints after maximum attempts');
      return false;
    }
  }
}

// Run the fix after a delay to ensure the waypoint manager is initialized
setTimeout(attemptFix, 2000);

console.log('🛠️ Waypoint fix script loaded');

