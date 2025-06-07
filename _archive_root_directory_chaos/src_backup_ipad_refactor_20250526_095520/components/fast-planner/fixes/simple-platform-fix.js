/**
 * simple-platform-fix.js
 * 
 * A minimal fix that keeps platforms visible but prevents layer conflicts
 */

(function() {
  console.log('🛠️ Applying minimal platform fix');
  
  // Wait for platform manager to be available
  let checkInterval = setInterval(() => {
    if (!window.platformManager) {
      return; // Wait for next interval
    }
    
    // Found platform manager, apply the fix and clear interval
    clearInterval(checkInterval);
    console.log('🛠️ Found platformManager, applying minimal fix');
    
    // Only patch the _addOsdkWaypointsToMap method to prevent conflicts
    // but leave the regular platforms visible
    if (typeof window.platformManager._addOsdkWaypointsToMap === 'function') {
      const originalMethod = window.platformManager._addOsdkWaypointsToMap;
      
      window.platformManager._addOsdkWaypointsToMap = function() {
        console.log('🛠️ Skipping OSDK waypoint layer creation to prevent conflicts');
        // Store waypoints in memory but don't add to map
        if (this.osdkWaypoints && this.osdkWaypoints.length > 0) {
          this.triggerCallback('onOsdkWaypointsLoaded', this.osdkWaypoints);
        }
        return;
      };
      
      console.log('✅ Successfully applied minimal fix for OSDK waypoint layers');
    }
    
    // Make sure client is available for OSDK data loading
    if (!window.client && window.osdkClient) {
      window.client = window.osdkClient;
    }
    
    // Force reload platforms if empty
    if (window.platformManager.platforms.length === 0 && window.client) {
      const currentRegion = window.regionManager?.getCurrentRegion() || { name: 'NORWAY' };
      const regionName = currentRegion.osdkRegion || currentRegion.name;
      
      console.log(`🛠️ Reloading platforms for ${regionName}...`);
      window.platformManager.loadPlatformsFromFoundry(window.client, regionName);
    }
    
  }, 1000);
  
  // Stop checking after 30 seconds
  setTimeout(() => {
    clearInterval(checkInterval);
  }, 30000);
})();