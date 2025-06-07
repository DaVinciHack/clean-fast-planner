/**
 * osdk-loader-fix.js
 * 
 * Fixes OSDK loading while preventing MapBox layer conflicts
 */

(function() {
  console.log('🔧 APPLYING OSDK LOADER FIX');

  // Define the timer and max wait time
  let checkTimer = null;
  const maxWaitTime = 30000; // 30 seconds max wait
  const startTime = Date.now();
  
  // Function to patch the PlatformManager
  function applyPlatformManagerPatches() {
    if (!window.platformManager) {
      // Check if we've waited too long
      if (Date.now() - startTime > maxWaitTime) {
        console.error('🔧 Timed out waiting for platformManager');
        clearInterval(checkTimer);
        return;
      }
      
      console.log('🔧 Waiting for platformManager to be available...');
      return; // Wait for next interval
    }
    
    console.log('🔧 platformManager found, applying patches...');
    clearInterval(checkTimer);
    
    // Patch the _addOsdkWaypointsToMap method to prevent layer creation
    if (typeof window.platformManager._addOsdkWaypointsToMap === 'function') {
      console.log('🔧 Patching _addOsdkWaypointsToMap method...');
      
      // Store original method for reference
      const originalAddWaypoints = window.platformManager._addOsdkWaypointsToMap;
      
      // Replace with our disabled version
      window.platformManager._addOsdkWaypointsToMap = function() {
        console.log('🔒 DISABLED: OSDK waypoint map layer creation is disabled to prevent layer conflicts');
        
        // Skip the layer creation but still trigger callbacks
        if (this.osdkWaypoints && this.osdkWaypoints.length > 0) {
          this.triggerCallback('onOsdkWaypointsLoaded', this.osdkWaypoints);
          console.log(`🔒 Waypoints are available for route planning (${this.osdkWaypoints.length}), but not displayed on map`);
        }
        
        return;
      };
      
      console.log('✅ Successfully patched _addOsdkWaypointsToMap method');
    } else {
      console.warn('🔧 _addOsdkWaypointsToMap method not found on platformManager');
    }
    
    // Patch the addPlatformsToMap method to prevent layer creation
    if (typeof window.platformManager.addPlatformsToMap === 'function') {
      console.log('🔧 Patching addPlatformsToMap method...');
      
      // Store original method for reference
      const originalAddPlatforms = window.platformManager.addPlatformsToMap;
      
      // Replace with our disabled version
      window.platformManager.addPlatformsToMap = function(platforms) {
        console.log('🔒 DISABLED: Platform map layer creation is disabled to prevent layer conflicts');
        
        // Store the platforms but don't add them to the map
        this.platforms = platforms;
        
        // Still trigger callback to allow the application to continue
        this.triggerCallback('onPlatformsLoaded', platforms);
        
        // Log platforms are available for route planning
        if (platforms && platforms.length > 0) {
          console.log(`🔒 Platforms are available for route planning (${platforms.length}), but not displayed on map`);
        }
        
        return;
      };
      
      console.log('✅ Successfully patched addPlatformsToMap method');
    } else {
      console.warn('🔧 addPlatformsToMap method not found on platformManager');
    }
    
    // Make sure the OSDK loading methods are still enabled
    if (typeof window.platformManager.loadOsdkWaypointsFromFoundry === 'function') {
      console.log('✅ loadOsdkWaypointsFromFoundry method is available - OSDK data loading is working');
    } else {
      console.error('❌ loadOsdkWaypointsFromFoundry method not found - OSDK data loading might be broken');
    }
    
    // Ensure the removeLayers function is executed
    removeAllProblemLayers();
    
    console.log('✅ OSDK LOADER FIX SUCCESSFULLY APPLIED');
  }
  
  // Function to remove problem layers
  function removeAllProblemLayers() {
    if (!window.mapManager || !window.mapManager.getMap()) {
      console.log('🔧 Map not available yet for layer removal');
      return;
    }
    
    const map = window.mapManager.getMap();
    console.log('🔧 Removing problematic layers from map...');
    
    // List of all problematic layers
    const layersToRemove = [
      'osdk-waypoints-layer',
      'osdk-waypoints-labels',
      'platforms-layer',
      'platforms-fixed-layer',
      'platforms-movable-layer',
      'platforms-fixed-labels',
      'platforms-movable-labels',
      'airfields-layer',
      'airfields-labels'
    ];

    // List of all problematic sources
    const sourcesToRemove = [
      'osdk-waypoints-source',
      'major-platforms'
    ];

    // First remove all layers
    layersToRemove.forEach(layer => {
      try {
        if (map.getLayer(layer)) {
          map.removeLayer(layer);
          console.log(`🔧 Removed layer: ${layer}`);
        }
      } catch (e) {
        // Ignore errors
      }
    });

    // Wait 100ms then remove sources
    setTimeout(() => {
      sourcesToRemove.forEach(source => {
        try {
          if (map.getSource(source)) {
            map.removeSource(source);
            console.log(`🔧 Removed source: ${source}`);
          }
        } catch (e) {
          // Ignore errors
        }
      });
      
      console.log('✅ Problem layers removed successfully');
    }, 100);
  }
  
  // Start checking for platformManager
  checkTimer = setInterval(applyPlatformManagerPatches, 500);
  
  // Also set up a check for the map and remove layers if it becomes available
  let mapCheckTimer = setInterval(() => {
    if (window.mapManager && window.mapManager.getMap()) {
      removeAllProblemLayers();
      clearInterval(mapCheckTimer);
    }
  }, 1000);
  
  // Set up a timeout to clear the intervals if they run too long
  setTimeout(() => {
    clearInterval(checkTimer);
    clearInterval(mapCheckTimer);
  }, maxWaitTime);
})();