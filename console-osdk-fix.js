/**
 * EMERGENCY CONSOLE FIX
 * 
 * Copy and paste this entire script into your browser's JavaScript console
 * when viewing the Fast Planner application.
 * (Press F12 or right-click → Inspect → Console tab)
 */

// Immediately invoked function to avoid global variable pollution
(function() {
  console.log('🚨 EMERGENCY CONSOLE FIX FOR OSDK CLIENT AND LAYER ISSUES');
  
  // Fix 1: Ensure OSDK client is properly passed to waypoint loading
  if (window.platformManager) {
    // Fix loadWaypointsFromFoundry to ensure client is available
    const originalLoad = window.platformManager.loadWaypointsFromFoundry;
    window.platformManager.loadWaypointsFromFoundry = function(client, regionName = "NORWAY") {
      console.log(`🚨 Fixed loadWaypointsFromFoundry for ${regionName}`);
      
      // Ensure we have a client
      if (!client) {
        client = window.client || window.osdkClient;
        console.log(`🚨 Using ${client ? 'available' : 'NO'} client`);
      }
      
      // Store globally for future use
      if (client) window.osdkClient = client;
      
      return originalLoad.call(this, client, regionName);
    };
    
    // Fix toggleWaypointMode to handle layer visibility properly
    const originalToggle = window.platformManager.toggleWaypointMode;
    window.platformManager.toggleWaypointMode = function(waypointMode) {
      console.log(`🚨 Fixed toggleWaypointMode(${waypointMode})`);
      
      // Set flags
      this.waypointModeActive = waypointMode;
      window.isWaypointModeActive = waypointMode;
      
      // Handle layer visibility directly
      const map = this.mapManager?.getMap();
      if (map) {
        // Toggle visibility
        if (waypointMode) {
          // Hide platforms
          ['platforms-layer', 'platforms-movable-layer', 'platforms-fixed-labels', 
           'platforms-movable-labels', 'airfields-layer', 'airfields-labels'].forEach(layer => {
            if (map.getLayer(layer)) map.setLayoutProperty(layer, 'visibility', 'none');
          });
          
          // Load/show waypoints
          if (!this.waypoints?.length) {
            const client = window.client || window.osdkClient;
            const region = window.currentRegion?.id || window.currentRegion?.name || "NORWAY";
            this.loadWaypointsFromFoundry(client, region);
          } else {
            // Show existing waypoints
            ['waypoints-layer', 'waypoints-labels'].forEach(layer => {
              if (map.getLayer(layer)) map.setLayoutProperty(layer, 'visibility', 'visible');
            });
          }
        } else {
          // Show platforms
          ['platforms-layer', 'platforms-movable-layer', 'platforms-fixed-labels', 
           'platforms-movable-labels', 'airfields-layer', 'airfields-labels'].forEach(layer => {
            if (map.getLayer(layer)) map.setLayoutProperty(layer, 'visibility', 'visible');
          });
          
          // Hide waypoints
          ['waypoints-layer', 'waypoints-labels'].forEach(layer => {
            if (map.getLayer(layer)) map.setLayoutProperty(layer, 'visibility', 'none');
          });
        }
      }
      
      // Call original method
      const result = originalToggle.call(this, waypointMode);
      
      return result;
    };
  } else {
    console.error('🚨 platformManager not found!');
  }
  
  // Fix 2: Add CSS to fix popup flickering
  const style = document.createElement('style');
  style.textContent = `
    .mapboxgl-popup {
      animation: none !important;
      transition: none !important;
    }
    .mapboxgl-popup-content {
      min-width: 100px !important;
      min-height: 30px !important;
    }
    .stop-popup .mapboxgl-popup-content {
      border-left: 3px solid #FF4136 !important;
    }
    .waypoint-popup .mapboxgl-popup-content {
      border-left: 3px solid #FFCC00 !important;
    }
  `;
  document.head.appendChild(style);
  
  // Fix 3: Force reload waypoints if in waypoint mode
  if (window.isWaypointModeActive && window.platformManager) {
    console.log('🚨 Currently in waypoint mode, forcing reload of waypoints');
    
    if (window.LoadingIndicator) {
      window.LoadingIndicator.updateStatusIndicator(
        'Reloading waypoints...',
        'info',
        3000
      );
    }
    
    // Get current region
    const region = window.currentRegion?.id || 
                  window.currentRegion?.name || 
                  window.platformManager.currentRegion || 
                  "NORWAY";
    
    // Force reload with any available client
    window.platformManager.loadWaypointsFromFoundry(
      window.client || window.osdkClient, 
      region
    ).then(waypoints => {
      console.log(`🚨 Loaded ${waypoints.length} waypoints successfully`);
      
      // Force show waypoint layers
      const map = window.mapManager?.getMap();
      if (map) {
        ['waypoints-layer', 'waypoints-labels'].forEach(layer => {
          if (map.getLayer(layer)) map.setLayoutProperty(layer, 'visibility', 'visible');
        });
      }
    });
  }
  
  console.log('🚨 Emergency fix applied! Try toggling waypoint mode again.');
})();
