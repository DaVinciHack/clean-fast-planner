/**
 * DIRECT WAYPOINT MANAGER FIX
 * 
 * This file is included by our standalone waypoint-fix.js script.
 * It directly patches the WaypointManager prototype to ensure
 * waypoint types are properly handled regardless of React state.
 */

// Wait for WaypointManager to be available
const patchWaypointManager = function() {
  if (!window.waypointManager) {
    console.log('WaypointManager not available yet, waiting...');
    setTimeout(patchWaypointManager, 500);
    return;
  }
  
  console.log('Found WaypointManager, applying direct patches...');
  
  // Store the original addWaypoint method
  const originalAddWaypoint = window.waypointManager.addWaypoint;
  
  // Replace with our fixed version
  window.waypointManager.addWaypoint = function(coords, name, options = {}) {
    // Get the current waypoint mode
    const isWaypointMode = window.isWaypointModeActive === true;
    
    // Check if explicitly set in options
    const isExplicitWaypoint = options && (options.isWaypoint === true || options.type === 'WAYPOINT');
    
    // Use explicit setting or global mode
    const isWaypoint = isExplicitWaypoint || isWaypointMode;
    
    // Create enhanced options with correct flags
    const enhancedOptions = {
      ...options,
      isWaypoint: isWaypoint,
      type: isWaypoint ? 'WAYPOINT' : 'STOP'
    };
    
    console.log(`PATCHED addWaypoint: Adding ${isWaypoint ? 'WAYPOINT' : 'STOP'} at ${coords}`);
    
    // Call the original method with fixed options
    return originalAddWaypoint.call(this, coords, name, enhancedOptions);
  };
  
  // Store the original addWaypointAtIndex method
  const originalAddWaypointAtIndex = window.waypointManager.addWaypointAtIndex;
  
  // Replace with our fixed version
  window.waypointManager.addWaypointAtIndex = function(coords, name, index, options = {}) {
    // Get the current waypoint mode
    const isWaypointMode = window.isWaypointModeActive === true;
    
    // Check if explicitly set in options
    const isExplicitWaypoint = options && (options.isWaypoint === true || options.type === 'WAYPOINT');
    
    // Use explicit setting or global mode
    const isWaypoint = isExplicitWaypoint || isWaypointMode;
    
    // Create enhanced options with correct flags
    const enhancedOptions = {
      ...options,
      isWaypoint: isWaypoint,
      type: isWaypoint ? 'WAYPOINT' : 'STOP'
    };
    
    console.log(`PATCHED addWaypointAtIndex: Adding ${isWaypoint ? 'WAYPOINT' : 'STOP'} at index ${index}`);
    
    // Call the original method with fixed options
    return originalAddWaypointAtIndex.call(this, coords, name, index, enhancedOptions);
  };
  
  console.log('WaypointManager patches applied successfully!');
  
  // Setup a MutationObserver to catch WaypointManager replacement
  const observer = new MutationObserver(function(mutations) {
    if (window.waypointManager && 
        window.waypointManager.addWaypoint !== window.waypointManager.addWaypoint) {
      console.log('WaypointManager was replaced! Re-applying patches...');
      patchWaypointManager();
    }
  });
  
  // Start observing
  observer.observe(document, { subtree: true, childList: true });
};

// Start the patching process
patchWaypointManager();
