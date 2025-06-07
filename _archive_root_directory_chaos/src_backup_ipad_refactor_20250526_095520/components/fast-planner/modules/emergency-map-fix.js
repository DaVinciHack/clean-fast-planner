/**
 * emergency-map-fix.js
 * 
 * This is a direct, focused fix for the map click issue that bypasses
 * all existing handlers and implements a simple, reliable click handler
 */

// Flag to track if the fix has been applied
let fixApplied = false;

/**
 * Apply the emergency fix directly
 * This completely bypasses all existing handlers and implements
 * a simple, reliable click handler on the map
 */
export function applyEmergencyFix() {
  console.log('🚑 EMERGENCY MAP FIX: Starting application');
  
  // Check if we already applied the fix
  if (fixApplied) {
    console.log('🚑 EMERGENCY MAP FIX: Fix already applied');
    return false;
  }
  
  // Check if required global objects exist
  if (!window.mapManager || !window.waypointManager) {
    console.error('🚑 EMERGENCY MAP FIX: Required global managers not available');
    return false;
  }
  
  try {
    // Get the map instance
    const map = window.mapManager.getMap();
    if (!map) {
      console.error('🚑 EMERGENCY MAP FIX: Map not initialized');
      return false;
    }
    
    console.log('🚑 EMERGENCY MAP FIX: Got map instance');
    
    // Completely remove ALL existing click handlers from the map
    // This is a brute force approach that ensures we start with a clean slate
    map.off('click');
    console.log('🚑 EMERGENCY MAP FIX: Removed all existing click handlers');
    
    // Add a single, reliable click handler for normal mode
    const handleMapClick = (e) => {
      console.log('🚑 EMERGENCY MAP FIX: Map clicked at', e.lngLat);
      
      // Get required objects
      const waypointManager = window.waypointManager;
      
      try {
        // Determine if we're in waypoint mode using the global flag
        const isWaypointMode = window.isWaypointModeActive === true;
        console.log(`🚑 EMERGENCY MAP FIX: Current mode: ${isWaypointMode ? 'WAYPOINT' : 'NORMAL'}`);
        
        // Process the click based on mode
        if (isWaypointMode) {
          console.log('🚑 EMERGENCY MAP FIX: In waypoint mode - adding a WAYPOINT');
          
          // In waypoint mode, add waypoint
          waypointManager.addWaypoint(
            [e.lngLat.lng, e.lngLat.lat],
            `Waypoint ${waypointManager.getWaypoints().length + 1}`,
            { isWaypoint: true, type: 'WAYPOINT' }
          );
        } else {
          console.log('🚑 EMERGENCY MAP FIX: In normal mode - adding a STOP');
          
          // In normal mode, add stop
          waypointManager.addWaypoint(
            [e.lngLat.lng, e.lngLat.lat],
            `Stop ${waypointManager.getWaypoints().length + 1}`,
            { isWaypoint: false, type: 'STOP' }
          );
        }
        
        // Open left panel
        window.dispatchEvent(new Event('open-left-panel'));
        
        // Show success message
        if (window.LoadingIndicator) {
          window.LoadingIndicator.updateStatusIndicator(
            `Added ${isWaypointMode ? 'waypoint' : 'stop'} at clicked location`,
            'success'
          );
        }
      } catch (error) {
        console.error('🚑 EMERGENCY MAP FIX: Error handling map click:', error);
        
        // Show error message
        if (window.LoadingIndicator) {
          window.LoadingIndicator.updateStatusIndicator(
            `Error adding ${isWaypointMode ? 'waypoint' : 'stop'}: ${error.message}`,
            'error'
          );
        }
      }
    };
    
    // Add our simple, reliable click handler to the map
    map.on('click', handleMapClick);
    console.log('🚑 EMERGENCY MAP FIX: Added simplified click handler');
    
    // Create an overly simple toggle function for waypoint mode
    window.toggleMapMode = (mode) => {
      console.log(`🚑 EMERGENCY MAP FIX: Toggling to ${mode} mode`);
      
      // Set the global flag directly
      window.isWaypointModeActive = (mode === 'waypoint');
      
      // Change the cursor based on mode
      if (map) {
        map.getCanvas().style.cursor = window.isWaypointModeActive ? 'crosshair' : '';
      }
      
      // Show status message
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator(
          `${window.isWaypointModeActive ? 'Waypoint' : 'Normal'} mode activated`,
          'info'
        );
      }
      
      return true;
    };
    
    // Mark the fix as applied
    fixApplied = true;
    
    // Add an emergency reset button to make it easy to reapply the fix
    addEmergencyResetButton();
    
    // Show success message
    if (window.LoadingIndicator) {
      window.LoadingIndicator.updateStatusIndicator(
        'Emergency map fix applied. Map clicking should now work reliably.',
        'success'
      );
    }
    
    console.log('🚑 EMERGENCY MAP FIX: Fix successfully applied');
    return true;
  } catch (error) {
    console.error('🚑 EMERGENCY MAP FIX: Error applying fix:', error);
    return false;
  }
}

/**
 * Add an emergency reset button to the DOM
 */
function addEmergencyResetButton() {
  try {
    // Check if the button already exists
    let button = document.getElementById('emergency-reset-button');
    if (button) {
      console.log('🚑 EMERGENCY MAP FIX: Reset button already exists');
      return;
    }
    
    // Create the button
    button = document.createElement('button');
    button.id = 'emergency-reset-button';
    button.innerText = 'Reset Map Clicking';
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
    button.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
    
    // Add click handler
    button.onclick = () => {
      console.log('🚑 EMERGENCY MAP FIX: Reset button clicked');
      
      // Reset the fix and reapply
      fixApplied = false;
      applyEmergencyFix();
    };
    
    // Add the button to the document
    document.body.appendChild(button);
    console.log('🚑 EMERGENCY MAP FIX: Added reset button');
  } catch (error) {
    console.error('🚑 EMERGENCY MAP FIX: Error adding reset button:', error);
  }
}

// Make functions available globally
window.emergencyMapFix = {
  apply: applyEmergencyFix,
  reset: () => {
    fixApplied = false;
    applyEmergencyFix();
  }
};

// Export the module
export default {
  applyEmergencyFix
};
