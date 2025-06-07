/**
 * Ensure useManagers.js properly handles the addWaypoint function
 */

console.log('🔄 Setting up addWaypoint handler fix...');

// Function to patch useManagers.js behavior
function patchAddWaypointHandling() {
  // First ensure window.addWaypoint is available
  if (!window.addWaypoint) {
    window.addWaypoint = function(waypointData) {
      console.log('🔄 Global addWaypoint called with:', waypointData);
      
      try {
        // Try to use waypointManager directly
        if (window.waypointManager && typeof window.waypointManager.addWaypoint === 'function') {
          console.log('🔄 Using waypointManager.addWaypoint');
          
          // Check if in waypoint mode 
          const isWaypointMode = window.isWaypointModeActive === true;
          
          // Extract coordinates
          let coords, name;
          
          if (Array.isArray(waypointData)) {
            coords = waypointData;
            name = null;
          } else if (waypointData && typeof waypointData === 'object') {
            if (waypointData.coordinates) {
              coords = waypointData.coordinates;
            } else if (waypointData.coords) {
              coords = waypointData.coords;
            } else if (waypointData.lngLat) {
              coords = [waypointData.lngLat.lng, waypointData.lngLat.lat];
            } else {
              console.error('🔄 Invalid waypoint data format:', waypointData);
              return;
            }
            
            name = waypointData.name;
          } else {
            console.error('🔄 Invalid waypoint data:', waypointData);
            return;
          }
          
          // Add the waypoint
          window.waypointManager.addWaypoint(
            coords,
            name,
            { 
              isWaypoint: isWaypointMode,
              type: isWaypointMode ? 'WAYPOINT' : 'STOP'
            }
          );
          
          // Get updated waypoints and update global reference
          const updatedWaypoints = window.waypointManager.getWaypoints();
          window.currentWaypoints = updatedWaypoints;
          
          // Show success message
          if (window.LoadingIndicator) {
            window.LoadingIndicator.updateStatusIndicator(
              `Added ${name || 'waypoint'} to route`,
              'success',
              3000
            );
          }
          
          // Dispatch a custom event to notify components
          const event = new CustomEvent('waypoints-updated', { 
            detail: { waypoints: updatedWaypoints }
          });
          window.dispatchEvent(event);
          
          return true;
        }
        
        // Try mapInteractionHandler as a fallback
        if (window.mapInteractionHandler && typeof window.mapInteractionHandler.addWaypoint === 'function') {
          console.log('🔄 Using mapInteractionHandler.addWaypoint');
          return window.mapInteractionHandler.addWaypoint(waypointData);
        }
        
        console.error('🔄 No method available to add waypoint');
        return false;
      } catch (error) {
        console.error('🔄 Error in global addWaypoint:', error);
        return false;
      }
    };
    
    console.log('🔄 Created global addWaypoint function');
  }
  
  // Create a local helper for onMapClick to add waypoint
  window.handleMapClick = function(e) {
    console.log('🔄 Global handleMapClick called');
    
    const clickData = {
      lngLat: e.lngLat,
      point: e.point
    };
    
    return window.addWaypoint(clickData);
  };
  
  // Create a local helper for onPlatformClick
  window.handlePlatformClick = function(e) {
    console.log('🔄 Global handlePlatformClick called');
    
    // Extract platform data
    const platform = e.features[0].properties;
    
    const platformData = {
      name: platform.name,
      coordinates: [e.lngLat.lng, e.lngLat.lat]
    };
    
    return window.addWaypoint(platformData);
  };
  
  // Now patch the MapInteractionHandler if it exists
  if (window.mapInteractionHandler) {
    // Ensure onMapClick callback uses our global function
    if (window.mapInteractionHandler.callbacks && 
        typeof window.mapInteractionHandler.callbacks.onMapClick !== 'function') {
      console.log('🔄 Setting onMapClick callback to use global addWaypoint');
      window.mapInteractionHandler.callbacks.onMapClick = window.addWaypoint;
    }
    
    // Ensure onPlatformClick callback uses our global function
    if (window.mapInteractionHandler.callbacks && 
        typeof window.mapInteractionHandler.callbacks.onPlatformClick !== 'function') {
      console.log('🔄 Setting onPlatformClick callback to use global addWaypoint');
      window.mapInteractionHandler.callbacks.onPlatformClick = window.addWaypoint;
    }
    
    // Ensure handleMapClick uses our global function if missing
    if (typeof window.mapInteractionHandler.handleMapClick !== 'function') {
      console.log('🔄 Setting handleMapClick to use global handler');
      window.mapInteractionHandler.handleMapClick = window.handleMapClick;
    }
    
    // Ensure handlePlatformClick uses our global function if missing
    if (typeof window.mapInteractionHandler.handlePlatformClick !== 'function') {
      console.log('🔄 Setting handlePlatformClick to use global handler');
      window.mapInteractionHandler.handlePlatformClick = window.handlePlatformClick;
    }
    
    // Add direct addWaypoint method if missing
    if (typeof window.mapInteractionHandler.addWaypoint !== 'function') {
      console.log('🔄 Adding addWaypoint method to mapInteractionHandler');
      window.mapInteractionHandler.addWaypoint = window.addWaypoint;
    }
    
    console.log('🔄 Patched MapInteractionHandler methods');
  }
}

// Run the patch on load and when required dependencies are loaded
window.addEventListener('load', () => {
  console.log('🔄 Window loaded, checking for MapInteractionHandler...');
  
  // First attempt when page loads
  setTimeout(patchAddWaypointHandling, 1000);
  
  // Second attempt after map initialization
  setTimeout(patchAddWaypointHandling, 3000);
  
  // Final attempt after all managers are loaded
  setTimeout(patchAddWaypointHandling, 6000);
});

// Listen for the reinitialize-map-handlers event to apply our patch
window.addEventListener('reinitialize-map-handlers', () => {
  console.log('🔄 Applying addWaypoint fixes after map handler reinitialization');
  setTimeout(patchAddWaypointHandling, 500);
});

// Export function to manually apply the patch
export default patchAddWaypointHandling;