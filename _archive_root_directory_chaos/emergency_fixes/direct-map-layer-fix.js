/**
 * direct-map-layer-fix.js
 * 
 * Emergency fix for waypoint mode and layer flickering issues.
 * This can be pasted directly into the browser console.
 */

(function() {
  console.log('🚨 APPLYING EMERGENCY MAP LAYER FIX...');
  
  // Fix waypoint mode toggling
  if (window.platformManager) {
    // Enhanced platformManager.toggleWaypointMode
    const originalToggleWaypointMode = window.platformManager.toggleWaypointMode;
    window.platformManager.toggleWaypointMode = function(waypointMode) {
      console.log(`🚨 Emergency fix: toggleWaypointMode(${waypointMode})`);
      
      // Save state
      this.waypointModeActive = waypointMode;
      window.isWaypointModeActive = waypointMode;
      
      // Get map
      const map = this.mapManager?.getMap();
      if (!map) {
        console.error('Map not available');
        return;
      }
      
      // Platform & waypoint layers
      const platformLayers = [
        'platforms-layer',
        'platforms-movable-layer',
        'platforms-fixed-labels',
        'platforms-movable-labels',
        'airfields-layer',
        'airfields-labels'
      ];
      
      const waypointLayers = [
        'waypoints-layer',
        'waypoints-labels'
      ];
      
      // Toggle visibility immediately
      if (waypointMode) {
        // Hide platforms
        platformLayers.forEach(layer => {
          if (map.getLayer(layer)) map.setLayoutProperty(layer, 'visibility', 'none');
        });
        
        // Show/load waypoints
        if (this.waypoints?.length) {
          waypointLayers.forEach(layer => {
            if (map.getLayer(layer)) map.setLayoutProperty(layer, 'visibility', 'visible');
          });
        } else {
          // Force load waypoints
          const regionName = window.currentRegion?.id || window.currentRegion?.name || "NORWAY";
          this.loadWaypointsFromFoundry(window.client, regionName)
            .then(waypoints => {
              console.log(`Loaded ${waypoints.length} waypoints`);
              waypointLayers.forEach(layer => {
                if (map.getLayer(layer)) map.setLayoutProperty(layer, 'visibility', 'visible');
              });
            });
        }
      } else {
        // Show platforms
        platformLayers.forEach(layer => {
          if (map.getLayer(layer)) map.setLayoutProperty(layer, 'visibility', 'visible');
        });
        
        // Hide waypoints
        waypointLayers.forEach(layer => {
          if (map.getLayer(layer)) map.setLayoutProperty(layer, 'visibility', 'none');
        });
      }
      
      // Call original for completeness
      return originalToggleWaypointMode.call(this, waypointMode);
    };
    
    // Fix z-index ordering
    const fixLayerOrder = () => {
      const map = window.mapManager?.getMap();
      if (!map) return;
      
      // Set z-order for key layers
      const zOrder = {
        'platforms-layer': 10,
        'platforms-movable-layer': 11,
        'airfields-layer': 12,
        'platforms-fixed-labels': 20,
        'platforms-movable-labels': 21,
        'airfields-labels': 22,
        'waypoints-layer': 30,
        'waypoints-labels': 31,
        'route-glow': 40,
        'route': 41
      };
      
      Object.entries(zOrder).forEach(([layer, z]) => {
        if (map.getLayer(layer)) {
          const type = map.getLayer(layer).type;
          if (type === 'circle') map.setLayoutProperty(layer, 'circle-sort-key', z);
          else if (type === 'symbol') map.setLayoutProperty(layer, 'symbol-sort-key', z);
          else if (type === 'line') map.setLayoutProperty(layer, 'line-sort-key', z);
          console.log(`Set z-index ${z} for ${layer}`);
        }
      });
    };
    
    // Apply z-index fix
    fixLayerOrder();
    
    console.log('🚨 Emergency fix applied! Toggle waypoint mode to test.');
    
    // Force reload waypoints if in waypoint mode
    if (window.isWaypointModeActive) {
      console.log('Currently in waypoint mode, refreshing waypoints...');
      const regionName = window.currentRegion?.id || window.currentRegion?.name || "NORWAY";
      window.platformManager.loadWaypointsFromFoundry(window.client, regionName);
    }
  } else {
    console.error('🚨 platformManager not found! Emergency fix cannot be applied.');
  }
})();
