/**
 * fix-waypoint-toggle.js
 * 
 * A FOCUSED fix to ensure the waypoint mode toggle works correctly.
 * This addresses the core issue of waypoint functionality without any style changes.
 */

// Immediately execute the fix
(function() {
  console.log('Applying waypoint toggle fix');
  
  // Wait for FastPlannerApp to fully load
  setTimeout(() => {
    // Make sure there's a global waypointMode flag
    if (window.isWaypointModeActive === undefined) {
      window.isWaypointModeActive = false;
      console.log('Initialized global waypoint mode flag: OFF');
    }
    
    // Fix the toggleWaypointMode function
    const fixToggleWaypointMode = () => {
      // Find the original toggle function
      const original = window.toggleWaypointMode;
      
      // If it doesn't exist, create a global function
      window.toggleWaypointMode = function(active) {
        console.log(`Toggling waypoint mode: ${active}`);
        
        // Set the global flag
        window.isWaypointModeActive = active === true;
        
        // Log the change
        console.log(`Global waypoint mode flag set to: ${window.isWaypointModeActive}`);
        
        // Update WaypointHandler if available
        if (window.waypointHandler && typeof window.waypointHandler.setEnabled === 'function') {
          window.waypointHandler.setEnabled(active === true);
        }
        
        // If the original function exists, call it
        if (original && typeof original === 'function') {
          try {
            return original(active);
          } catch (err) {
            console.error('Error calling original toggleWaypointMode:', err);
          }
        }
        
        return active;
      };
      
      console.log('Waypoint toggle function has been fixed');
    };
    
    fixToggleWaypointMode();
    
    // Ensure all waypoint buttons activate the mode correctly
    setTimeout(() => {
      // Find any waypoint mode buttons by class or id
      const buttons = document.querySelectorAll('.waypoint-mode-button, #waypoint-mode-button, button:contains("Waypoint Mode")');
      
      if (buttons && buttons.length > 0) {
        console.log(`Found ${buttons.length} waypoint mode buttons`);
        
        buttons.forEach((button, index) => {
          // Get original click handler
          const originalClick = button.onclick;
          
          // Set new click handler
          button.onclick = function(e) {
            console.log('Waypoint button clicked');
            
            // Toggle the flag
            const newState = !window.isWaypointModeActive;
            window.isWaypointModeActive = newState;
            
            console.log(`Waypoint mode set to: ${newState ? 'ON' : 'OFF'}`);
            
            // Call window.toggleWaypointMode if available
            if (typeof window.toggleWaypointMode === 'function') {
              window.toggleWaypointMode(newState);
            }
            
            // Call original handler if available
            if (originalClick && typeof originalClick === 'function') {
              return originalClick.call(this, e);
            }
          };
          
          console.log(`Fixed waypoint button ${index + 1}`);
        });
      } else {
        console.log('No waypoint buttons found');
      }
    }, 1000);
  }, 500);
})();

// Add utility functions for debugging
window.debugWaypointMode = function() {
  console.log('Current waypoint mode:', window.isWaypointModeActive === true ? 'ON' : 'OFF');
  
  // Check if handler exists
  if (window.waypointHandler) {
    console.log('WaypointHandler state:', window.waypointHandler.isEnabled ? window.waypointHandler.isEnabled() : 'unknown');
  } else {
    console.log('WaypointHandler not found');
  }
  
  // Show all waypoints
  if (window.waypointManager) {
    const waypoints = window.waypointManager.getWaypoints();
    console.log(`Found ${waypoints.length} waypoints:`);
    console.table(waypoints.map((wp, i) => ({
      index: i,
      name: wp.name,
      isWaypoint: wp.isWaypoint === true,
      type: wp.type || 'unknown',
      coords: wp.coords ? `[${wp.coords[0].toFixed(4)}, ${wp.coords[1].toFixed(4)}]` : 'unknown'
    })));
  }
};

window.toggleDebugWaypointMode = function() {
  const newState = !window.isWaypointModeActive;
  window.isWaypointModeActive = newState;
  console.log(`Manually toggled waypoint mode to: ${newState ? 'ON' : 'OFF'}`);
  
  // Update WaypointHandler if available
  if (window.waypointHandler && typeof window.waypointHandler.setEnabled === 'function') {
    window.waypointHandler.setEnabled(newState);
    console.log(`Updated WaypointHandler.isEnabled() to: ${window.waypointHandler.isEnabled()}`);
  }
  
  return newState;
};
