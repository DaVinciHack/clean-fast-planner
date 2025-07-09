// Auto-fix script for flight loading callback issue
// Add this to index.html to automatically fix flight loading when it happens

console.log('🔧 AUTO-FLIGHT-LOADING-FIX: Loading flight callback auto-fix...');

// Monitor for flight loading completion
let flightLoadingWatcher = null;

function checkAndFixFlightLoading() {
  // Check if we have the conditions for broken flight loading
  if (window.waypointManager && 
      window.waypointManager.waypoints && 
      window.waypointManager.waypoints.length > 0 && 
      !window.waypointManager.callbacks?.onChange) {
    
    console.log('🔧 AUTO-FLIGHT-LOADING-FIX: Detected broken flight loading callback');
    console.log('🔧 WaypointManager has', window.waypointManager.waypoints.length, 'waypoints but no onChange callback');
    
    // Force the callback connection like manual waypoint addition does
    if (window.waypointManager.callbacks) {
      console.log('🔧 AUTO-FLIGHT-LOADING-FIX: Forcing callback connection...');
      
      // Create a dummy callback that forces React state update
      window.waypointManager.callbacks.onChange = function(waypoints) {
        console.log('🔧 AUTO-FLIGHT-LOADING-FIX: Callback triggered with', waypoints.length, 'waypoints');
        
        // Force React state update if setWaypoints is available
        if (window.setWaypoints) {
          console.log('🔧 AUTO-FLIGHT-LOADING-FIX: Calling setWaypoints');
          window.setWaypoints([...waypoints]);
        }
      };
      
      // Trigger the callback with current waypoints
      if (window.waypointManager.callbacks.onChange) {
        window.waypointManager.callbacks.onChange(window.waypointManager.waypoints);
        console.log('🔧 AUTO-FLIGHT-LOADING-FIX: Flight loading callback fixed!');
        return true;
      }
    }
  }
  
  return false;
}

// Start monitoring after page loads
function startFlightLoadingMonitoring() {
  console.log('🔧 AUTO-FLIGHT-LOADING-FIX: Starting flight loading monitoring...');
  
  flightLoadingWatcher = setInterval(() => {
    if (checkAndFixFlightLoading()) {
      // Fixed! Stop monitoring for a bit
      clearInterval(flightLoadingWatcher);
      
      // Resume monitoring after 5 seconds in case another flight loads
      setTimeout(() => {
        startFlightLoadingMonitoring();
      }, 5000);
    }
  }, 1000);
}

// Start monitoring when page is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startFlightLoadingMonitoring);
} else {
  startFlightLoadingMonitoring();
}

// Also check immediately in case we're loaded after a flight
setTimeout(checkAndFixFlightLoading, 2000);

console.log('🔧 AUTO-FLIGHT-LOADING-FIX: Flight loading auto-fix script loaded');