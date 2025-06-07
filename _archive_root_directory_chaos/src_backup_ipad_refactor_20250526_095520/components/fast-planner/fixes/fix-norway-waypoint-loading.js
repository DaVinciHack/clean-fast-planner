/**
 * fix-norway-waypoint-loading.js
 * 
 * This fix addresses an issue where Norway only loads 10 waypoints
 * instead of the thousands it should have. It forces reloading waypoints
 * when in Norway and clears any cached waypoints.
 */

(function() {
  console.log('🇳🇴 Applying Norway waypoint loading fix');
  
  // Function to patch PlatformManager's toggleWaypointMode method
  function patchPlatformManager() {
    // Wait for platformManager to be available
    const waitForPlatformManager = setInterval(() => {
      if (!window.platformManager) return;
      
      clearInterval(waitForPlatformManager);
      console.log('🇳🇴 Found PlatformManager, applying fix to toggleWaypointMode method');
      
      // Save original method
      const originalToggleWaypointMode = window.platformManager.toggleWaypointMode;
      
      // Replace toggleWaypointMode with fixed version
      window.platformManager.toggleWaypointMode = function(active, client, regionName) {
        console.log(`🇳🇴 PATCHED: Toggling waypoint mode to ${active} for region ${regionName}`);
        this.waypointModeActive = active;
        
        // Update global flag for other components to check
        window.isWaypointModeActive = active;
        
        const map = this.mapManager.getMap();
        if (!map) {
          console.error("PlatformManager: Map not available for toggleWaypointMode.");
          return;
        }
    
        if (active) {
          // Entering waypoint mode
          console.log("PlatformManager: Entering waypoint mode - hiding platforms, showing waypoints");
          this._setPlatformLayersVisibility(false); // Hide normal platforms and airfields
          
          // CRITICAL FIX: For Norway, always force reload of waypoints
          const isNorwayRegion = regionName && 
                                (regionName.toLowerCase() === "norway" || 
                                 (typeof regionName === 'object' && 
                                  (regionName.name?.toLowerCase() === "norway" || 
                                   regionName.id?.toLowerCase() === "norway")));
                                   
          // Also force reload if we have too few waypoints (likely incomplete)
          const hasTooFewWaypoints = this.osdkWaypoints && 
                                     this.osdkWaypoints.length > 0 && 
                                     this.osdkWaypoints.length < 20;
                                     
          if (isNorwayRegion || hasTooFewWaypoints) {
            console.log("🇳🇴 CRITICAL FIX: Forcing reload of waypoints for Norway or due to low waypoint count");
            
            // Clear the existing waypoints to force reload
            this.osdkWaypoints = [];
            
            // Continue to load waypoints as usual
            this.loadOsdkWaypointsFromFoundry(client, "NORWAY").then(waypoints => {
              console.log(`🇳🇴 Successfully loaded ${waypoints.length} waypoints for Norway`);
              
              // If still in waypoint mode, make the waypoints visible
              if (this.waypointModeActive) {
                this._setOsdkWaypointLayerVisibility(true);
                
                // Show success message
                if (window.LoadingIndicator) {
                  window.LoadingIndicator.updateStatusIndicator(
                    `Loaded ${waypoints.length} navigation waypoints for Norway. Click to add to route.`,
                    'success',
                    3000
                  );
                }
              }
            }).catch(error => {
              console.error("PlatformManager: Error loading waypoints:", error);
              
              // Show error to user
              if (window.LoadingIndicator) {
                window.LoadingIndicator.updateStatusIndicator(
                  `Error loading waypoints: ${error.message}. Try refreshing the page.`,
                  'error',
                  5000
                );
              }
            });
          }
          // Original code for non-Norway regions or if we already have waypoints
          else if (this.osdkWaypoints && this.osdkWaypoints.length > 0) {
            console.log(`PlatformManager: ${this.osdkWaypoints.length} waypoints already loaded, making visible`);
            this._setOsdk