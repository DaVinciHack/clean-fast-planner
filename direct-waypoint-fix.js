// DIRECT WAYPOINT MODE FIX
// Copy and paste this entire script into your browser console

(function() {
  console.log('🚨 DIRECT WAYPOINT MODE FIX: Running...');
  
  // 1. Override window.isWaypointModeActive to always work
  console.log('🚨 Setting up waypoint mode handling...');
  Object.defineProperty(window, 'isWaypointModeActive', {
    value: false,
    writable: true,
    configurable: true
  });
  
  // 2. Create a direct map click handler
  console.log('🚨 Creating direct map click handler...');
  
  // Function to handle map clicks in a simple, reliable way
  const handleMapClick = function(e) {
    // Get the current waypoint mode status
    const isWaypointMode = window.isWaypointModeActive === true;
    console.log(`🚨 Map clicked in ${isWaypointMode ? 'WAYPOINT' : 'NORMAL'} mode`);
    
    // Get required objects
    const waypointManager = window.waypointManager;
    if (!waypointManager) {
      console.error('🚨 waypointManager not available');
      return;
    }
    
    // Add waypoint/stop based on mode
    waypointManager.addWaypoint(
      [e.lngLat.lng, e.lngLat.lat],
      isWaypointMode ? `Waypoint ${waypointManager.getWaypoints().length + 1}` : `Stop ${waypointManager.getWaypoints().length + 1}`,
      { isWaypoint: isWaypointMode, type: isWaypointMode ? 'WAYPOINT' : 'STOP' }
    );
    
    // Ensure left panel is visible
    try {
      document.querySelector('.left-panel-toggle-button')?.click();
    } catch (err) {
      console.log('Left panel toggle not found');
    }
    
    console.log(`🚨 Added ${isWaypointMode ? 'waypoint' : 'stop'} at [${e.lngLat.lng}, ${e.lngLat.lat}]`);
  };
  
  // 3. Apply the fix to the map
  console.log('🚨 Applying fix to map...');
  const map = window.mapManager?.getMap();
  if (!map) {
    console.error('🚨 Map not available');
    return false;
  }
  
  // Remove existing click handlers
  map.off('click');
  console.log('🚨 Removed existing click handlers');
  
  // Add our simple click handler
  map.on('click', handleMapClick);
  console.log('🚨 Added new click handler');
  
  // 4. Create a direct toggle function
  console.log('🚨 Creating direct toggle function...');
  window.toggleDirectWaypointMode = function(mode) {
    // Convert to boolean
    const active = mode === 'waypoint' || mode === true;
    
    // Set the global flag
    window.isWaypointModeActive = active;
    
    // Set cursor style
    if (map) {
      map.getCanvas().style.cursor = active ? 'crosshair' : '';
    }
    
    // Update UI to reflect current mode
    try {
      // Find the button in the DOM
      const waypointButton = document.querySelector('#add-waypoints');
      if (waypointButton) {
        // Update button style
        waypointButton.style.backgroundColor = active ? '#00cc66' : '#0066cc';
        waypointButton.style.fontWeight = active ? 'bold' : 'normal';
        waypointButton.style.border = active ? '2px solid #ffcc00' : 'none';
        
        // Update button text
        waypointButton.textContent = active ? '✅ WAYPOINT MODE ACTIVE' : 'Add Insert Waypoints';
      }
    } catch (err) {
      console.error('Error updating UI:', err);
    }
    
    // Show message
    try {
      const message = `${active ? 'Waypoint' : 'Normal'} mode activated`;
      const toast = document.createElement('div');
      toast.style.position = 'fixed';
      toast.style.bottom = '20px';
      toast.style.left = '50%';
      toast.style.transform = 'translateX(-50%)';
      toast.style.backgroundColor = active ? 'rgba(0, 204, 102, 0.9)' : 'rgba(0, 123, 255, 0.9)';
      toast.style.color = 'white';
      toast.style.padding = '10px 20px';
      toast.style.borderRadius = '5px';
      toast.style.zIndex = '1000';
      toast.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
      toast.textContent = message;
      document.body.appendChild(toast);
      
      // Remove after 1.5 seconds
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 1500);
    } catch (err) {
      console.error('Error showing toast:', err);
    }
    
    console.log(`🚨 Set mode to ${active ? 'WAYPOINT' : 'NORMAL'}`);
    return active;
  };
  
  // 5. Connect the waypoint mode button
  console.log('🚨 Connecting waypoint mode button...');
  try {
    const waypointButton = document.querySelector('#add-waypoints');
    if (waypointButton) {
      // Replace the click handler
      waypointButton.onclick = function() {
        // Toggle mode
        const currentMode = window.isWaypointModeActive;
        window.toggleDirectWaypointMode(!currentMode);
      };
      console.log('🚨 Waypoint button connected');
    } else {
      console.error('🚨 Waypoint button not found');
    }
  } catch (err) {
    console.error('Error connecting button:', err);
  }
  
  // 6. Add a reset button
  console.log('🚨 Adding reset button...');
  try {
    // Create a button
    const resetButton = document.createElement('button');
    resetButton.innerText = 'Reset Map Click';
    resetButton.style.position = 'fixed';
    resetButton.style.bottom = '10px';
    resetButton.style.left = '10px';
    resetButton.style.zIndex = '9999';
    resetButton.style.background = '#ff4136';
    resetButton.style.color = 'white';
    resetButton.style.padding = '5px 10px';
    resetButton.style.border = 'none';
    resetButton.style.borderRadius = '4px';
    resetButton.style.cursor = 'pointer';
    
    // Add click handler
    resetButton.onclick = function() {
      // Remove all click handlers
      map.off('click');
      
      // Add our handler again
      map.on('click', handleMapClick);
      
      // Show success message
      const toast = document.createElement('div');
      toast.style.position = 'fixed';
      toast.style.bottom = '20px';
      toast.style.left = '50%';
      toast.style.transform = 'translateX(-50%)';
      toast.style.backgroundColor = 'rgba(0, 123, 255, 0.9)';
      toast.style.color = 'white';
      toast.style.padding = '10px 20px';
      toast.style.borderRadius = '5px';
      toast.style.zIndex = '1000';
      toast.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
      toast.textContent = 'Map click handler reset';
      document.body.appendChild(toast);
      
      // Remove after 1.5 seconds
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 1500);
    };
    
    // Add to document
    document.body.appendChild(resetButton);
    console.log('🚨 Reset button added');
  } catch (err) {
    console.error('Error adding reset button:', err);
  }
  
  // 7. Show success message
  try {
    const toast = document.createElement('div');
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.backgroundColor = 'rgba(0, 204, 102, 0.9)';
    toast.style.color = 'white';
    toast.style.padding = '10px 20px';
    toast.style.borderRadius = '5px';
    toast.style.zIndex = '1000';
    toast.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    toast.style.fontWeight = 'bold';
    toast.textContent = 'Waypoint Mode Fix Applied!';
    document.body.appendChild(toast);
    
    // Remove after 3 seconds
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 3000);
  } catch (err) {
    console.error('Error showing success toast:', err);
  }
  
  console.log('🚨 DIRECT WAYPOINT MODE FIX: Applied successfully');
  return true;
})();
