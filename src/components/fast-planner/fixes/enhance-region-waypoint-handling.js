/**
 * enhance-region-waypoint-handling.js
 * 
 * This fix enhances the integration between RegionManager and PlatformManager
 * to properly handle waypoint caching between region switches.
 * 
 * The issue: When switching from Gulf of Mexico to Norway, the application doesn't
 * clear waypoint cache, and incorrectly thinks it already has Norway waypoints.
 */

(function() {
  console.log('🌎 Applying enhanced region-waypoint handling fix');
  
  // Function to wait for an object to be available
  const waitForObject = (objectName, callback, timeout = 30000) => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      if (window[objectName]) {
        clearInterval(interval);
        callback(window[objectName]);
        return;
      }
      
      // Clear interval after timeout
      if (Date.now() - startTime > timeout) {
        clearInterval(interval);
        console.log(`Timeout waiting for ${objectName}`);
      }
    }, 500);
  };
  
  // 1. Create a global region tracking flag
  if (!window.regionCacheFlags) {
    window.regionCacheFlags = {
      lastRegion: null,
      waypointsLoaded: false
    };
  }
  
  // 2. Fix the PlatformManager to add region awareness to waypoint loading
  waitForObject('platformManager', (platformManager) => {
    console.log('🌎 Enhancing PlatformManager with region-aware waypoint handling');
    
    // Patch the loadOsdkWaypointsFromFoundry method to store region info
    const originalLoadOsdkWaypoints = platformManager.loadOsdkWaypointsFromFoundry;
    
    platformManager.loadOsdkWaypointsFromFoundry = async function(client, regionName) {
      // Store the region name we're loading waypoints for
      console.log(`🌎 Loading waypoints for region: ${regionName}`);
      this.currentWaypointRegion = regionName;
      
      // Update global flag
      window.regionCacheFlags.lastRegion = regionName;
      window.regionCacheFlags.waypointsLoaded = false;
      
      // Call original method
      const result = await originalLoadOsdkWaypoints.call(this, client, regionName);
      
      // Update flag on success
      if (result && result.length > 0) {
        window.regionCacheFlags.waypointsLoaded = true;
      }
      
      return result;
    };
    
    // Enhance toggleWaypointMode to check region
    const originalToggleWaypointMode = platformManager.toggleWaypointMode;
    
    platformManager.toggleWaypointMode = function(active, client, regionName) {
      // Important: Check if region has changed or waypoints region doesn't match current region
      const regionChanged = 
        (this.currentWaypointRegion && regionName && this.currentWaypointRegion !== regionName) || 
        (window.regionCacheFlags.lastRegion && regionName && window.regionCacheFlags.lastRegion !== regionName);
      
      // If region changed or we have no waypoints for current region, clear cache
      if (regionChanged || (!window.regionCacheFlags.waypointsLoaded && active)) {
        console.log(`🌎 Region mismatch detected. Expected ${regionName}, had ${this.currentWaypointRegion}. Clearing waypoint cache.`);
        
        // Clear waypoint cache
        this.osdkWaypoints = [];
        this.currentWaypointRegion = regionName;
        window.regionCacheFlags.lastRegion = regionName;
        window.regionCacheFlags.waypointsLoaded = false;
      }
      
      // Call original method
      return originalToggleWaypointMode.call(this, active, client, regionName);
    };
  });
  
  // 3. Fix RegionManager to explicitly clear waypoint cache on region change
  waitForObject('regionManager', (regionManager) => {
    console.log('🌎 Enhancing RegionManager to clear waypoint cache on region change');
    
    // Patch the setRegion method
    const originalSetRegion = regionManager.setRegion;
    
    regionManager.setRegion = function(regionId) {
      console.log(`🌎 RegionManager: Setting region to ${regionId}`);
      
      // Call original method
      const region = originalSetRegion.call(this, regionId);
      
      // Get the region name for waypoints
      let regionName = null;
      if (region) {
        // Try to get OSDK region name
        regionName = region.osdkRegion || region.name || regionId;
      }
      
      // Clear waypoint cache if platformManager exists
      if (window.platformManager) {
        console.log(`🌎 Clearing waypoint cache for region change to: ${regionName}`);
        window.platformManager.osdkWaypoints = [];
        window.platformManager.currentWaypointRegion = regionName;
        window.platformManager.osdkWaypointsVisible = false;
        
        // Update global flag
        window.regionCacheFlags.lastRegion = regionName;
        window.regionCacheFlags.waypointsLoaded = false;
        
        // Update waypointModeActive flag
        if (window.platformManager.waypointModeActive) {
          console.log('🌎 Deactivating waypoint mode due to region change');
          window.platformManager.waypointModeActive = false;
          window.isWaypointModeActive = false;
        }
      }
      
      // Dispatch an event for other components to listen to
      const regionChangeEvent = new CustomEvent('regionChanged', {
        detail: { region: region, regionId: regionId, regionName: regionName }
      });
      window.dispatchEvent(regionChangeEvent);
      
      return region;
    };
  });
  
  // 4. Special case for startup - check for wrong waypoint region on initial load
  waitForObject('platformManager', (platformManager) => {
    // If already in waypoint mode, check region
    if (platformManager.waypointModeActive && window.currentRegion) {
      const regionName = window.currentRegion.osdkRegion || window.currentRegion.name;
      
      // Force reload if region mismatch
      if (platformManager.currentWaypointRegion !== regionName) {
        console.log(`🌎 Startup fix: Detected waypoint region mismatch. Had ${platformManager.currentWaypointRegion}, now in ${regionName}`);
        
        // Get client
        const client = window.client || window.osdkClient;
        
        // Clear and reload
        platformManager.osdkWaypoints = [];
        platformManager.currentWaypointRegion = regionName;
        platformManager.osdkWaypointsVisible = false;
        window.regionCacheFlags.lastRegion = regionName;
        window.regionCacheFlags.waypointsLoaded = false;
        
        // Exit waypoint mode and wait for user to activate again
        platformManager.waypointModeActive = false;
        window.isWaypointModeActive = false;
        
        console.log('🌎 Startup fix: Waypoint mode was automatically deactivated due to region mismatch. Please toggle it again.');
        
        // Show message to user
        if (window.LoadingIndicator && window.LoadingIndicator.updateStatusIndicator) {
          window.LoadingIndicator.updateStatusIndicator(
            'Waypoint mode was deactivated due to region change. Please toggle it again.',
            'info',
            5000
          );
        }
      }
    }
  });
  
  console.log('🌎 Enhanced region-waypoint handling fix applied');
})();
