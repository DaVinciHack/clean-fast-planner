// Copy and paste these commands directly into the browser console
// to fix the map click handlers

// 1. Create a direct map click handler
(function() {
  console.log('🚨 EMERGENCY FIX: Applying direct map click handler');
  
  // Get required objects
  const map = window.mapManager?.getMap();
  const waypointManager = window.waypointManager;
  
  if (!map || !waypointManager) {
    console.error('🚨 EMERGENCY FIX: Required objects not available');
    return false;
  }
  
  // Remove all existing click handlers
  map.off('click');
  console.log('🚨 EMERGENCY FIX: Removed all existing click handlers');
  
  // Add a simple, direct click handler
  map.on('click', function(e) {
    console.log('🚨 EMERGENCY FIX: Map clicked at', e.lngLat);
    
    // Determine if we're in waypoint mode
    const isWaypointMode = window.isWaypointModeActive === true;
    console.log(`🚨 EMERGENCY FIX: Current mode is ${isWaypointMode ? 'WAYPOINT' : 'NORMAL'}`);
    
    // Add the waypoint/stop directly
    waypointManager.addWaypoint(
      [e.lngLat.lng, e.lngLat.lat],
      isWaypointMode ? `Waypoint ${waypointManager.getWaypoints().length + 1}` : `Stop ${waypointManager.getWaypoints().length + 1}`,
      { isWaypoint: isWaypointMode, type: isWaypointMode ? 'WAYPOINT' : 'STOP' }
    );
    
    // Show success message
    if (window.LoadingIndicator) {
      window.LoadingIndicator.updateStatusIndicator(
        `Added ${isWaypointMode ? 'waypoint' : 'stop'} at clicked location`,
        'success'
      );
    }
    
    // Open left panel
    window.dispatchEvent(new Event('open-left-panel'));
  });
  
  console.log('🚨 EMERGENCY FIX: Added direct map click handler');
  
  // Create a simple toggle function
  window.directToggleMode = function(mode) {
    window.isWaypointModeActive = (mode === 'waypoint');
    console.log(`🚨 EMERGENCY FIX: Set mode to ${mode.toUpperCase()}`);
    
    // Change cursor
    if (map) {
      map.getCanvas().style.cursor = window.isWaypointModeActive ? 'crosshair' : '';
    }
    
    // Show message
    if (window.LoadingIndicator) {
      window.LoadingIndicator.updateStatusIndicator(
        `${window.isWaypointModeActive ? 'Waypoint' : 'Normal'} mode activated`,
        'info'
      );
    }
  };
  
  // Add reset function
  window.resetMapClick = function() {
    // Call this function again to reset handlers
    console.log('🚨 EMERGENCY FIX: Resetting map click handlers');
    map.off('click');
    
    // Wait a bit then run the fix again by calling this function
    setTimeout(arguments.callee, 100);
  };
  
  // Show success message
  if (window.LoadingIndicator) {
    window.LoadingIndicator.updateStatusIndicator(
      'Emergency map click fix applied. Try clicking on the map now.',
      'success'
    );
  }
  
  return true;
})();

// 2. Add a reset button
(function() {
  // Create a button
  const button = document.createElement('button');
  button.innerText = 'Reset Map Click';
  button.style.position = 'fixed';
  button.style.bottom = '10px';
  button.style.left = '10px';
  button.style.zIndex = '9999';
  button.style.background = '#ff4136';
  button.style.color = 'white';
  button.style.padding = '5px 10px';
  button.style.border = 'none';
  button.style.borderRadius = '4px';
  button.style.cursor = 'pointer';
  button.style.fontWeight = 'bold';
  
  // Add click handler
  button.onclick = function() {
    if (window.resetMapClick) {
      window.resetMapClick();
    }
  };
  
  // Add to document
  document.body.appendChild(button);
})();

// Instructions:
// 1. After applying this fix, try clicking on the map in normal mode - it should add stops
// 2. Then use window.directToggleMode('waypoint') to switch to waypoint mode
// 3. Click again - it should add waypoints
// 4. Use window.directToggleMode('normal') to switch back to normal mode
