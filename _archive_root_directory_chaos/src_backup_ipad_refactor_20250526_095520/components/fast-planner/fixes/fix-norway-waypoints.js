/**
 * fix-norway-waypoints.js
 * 
 * This fix ensures that Norway waypoints are properly loaded from the OSDK.
 * It addresses an issue where only 10 waypoints are loaded instead of the full set.
 */

(function() {
  // Apply fixes without debug UIs or popups
  console.log('🇳🇴 Applying Norway waypoint loading fix - silent version');
  
  // Listen for region changes to clear waypoint cache
  // This is critical to ensure new waypoints are loaded when regions change
  window.addEventListener('regionChanged', (event) => {
    if (window.platformManager && window.platformManager.osdkWaypoints) {
      console.log('🇳🇴 Region changed - clearing waypoint cache');
      window.platformManager.osdkWaypoints = [];
    }
  });
  
  // Wait for the platformManager to be available before applying patches
  const waitForPlatformManager = setInterval(() => {
    if (!window.platformManager) return;
    
    // Clear the interval once we have platformManager
    clearInterval(waitForPlatformManager);
    
    console.log('🇳🇴 Found platformManager, applying fix to toggleWaypointMode');
    
    // Store the original method
    const originalToggleWaypointMode = window.platformManager.toggleWaypointMode;
    
    // Extend the method to ensure Norway waypoints are always loaded fresh
    window.platformManager.toggleWaypointMode = function(active, client, regionName) {
      console.log(`🇳🇴 Enhanced toggleWaypointMode called for region: ${regionName}`);
      
      // Set flags correctly
      this.waypointModeActive = active;
      window.isWaypointModeActive = active;
      
      // Get the map
      const map = this.mapManager.getMap();
      if (!map) {
        console.error("Map not available for toggleWaypointMode");
        return;
      }
      
      if (active) {
        // Entering waypoint mode
        // Hide normal platforms/airfields
        this._setPlatformLayersVisibility(false);
        
        // Check if this is Norway or we have too few waypoints
        const isNorwayRegion = regionName && 
          (typeof regionName === 'string' && regionName.toLowerCase() === 'norway' ||
           typeof regionName === 'object' && 
           (regionName.name?.toLowerCase() === 'norway' || 
            regionName.id?.toLowerCase() === 'norway'));
            
        const hasTooFewWaypoints = this.osdkWaypoints && 
                                   this.osdkWaypoints.length > 0 && 
                                   this.osdkWaypoints.length < 20;
        
        if (isNorwayRegion || hasTooFewWaypoints) {
          console.log('🇳🇴 Norway region or too few waypoints detected - forcing reload');
          
          // Clear existing waypoints to force reload
          this.osdkWaypoints = [];
          
          // Load waypoints for Norway
          return this.loadOsdkWaypointsFromFoundry(client, 'NORWAY')
            .then(waypoints => {
              console.log(`🇳🇴 Successfully loaded ${waypoints.length} waypoints for Norway`);
              
              // Make waypoints visible if still in waypoint mode
              if (this.waypointModeActive) {
                this._setOsdkWaypointLayerVisibility(true);
              }
              
              return waypoints;
            })
            .catch(error => {
              console.error('Error loading Norway waypoints:', error);
              
              // Don't leave the user hanging - show any waypoints we do have
              if (this.osdkWaypoints && this.osdkWaypoints.length > 0) {
                this._setOsdkWaypointLayerVisibility(true);
              }
              
              return this.osdkWaypoints || [];
            });
        }
        // For non-Norway regions or if we already have a good number of waypoints
        else if (this.osdkWaypoints && this.osdkWaypoints.length > 0) {
          console.log(`Showing ${this.osdkWaypoints.length} already loaded waypoints`);
          this._setOsdkWaypointLayerVisibility(true);
        } 
        // If no waypoints loaded yet, load them
        else {
          console.log('No waypoints loaded yet, loading from OSDK');
          
          // Validate client and region
          if (!client) {
            client = window.client || window.osdkClient;
            if (!client) {
              console.error('No OSDK client available - cannot load waypoints');
              return Promise.resolve([]);
            }
          }
          
          // Ensure uppercase for OSDK regions
          let formattedRegionName = regionName;
          if (typeof regionName === 'string') {
            if (regionName.toLowerCase() === 'norway') {
              formattedRegionName = 'NORWAY';
            } else if (regionName.toLowerCase() === 'gulf of mexico') {
              formattedRegionName = 'GULF OF MEXICO';
            }
          }
          
          return this.loadOsdkWaypointsFromFoundry(client, formattedRegionName)
            .then(waypoints => {
              console.log(`Successfully loaded ${waypoints.length} waypoints`);
              
              // Make waypoints visible if still in waypoint mode
              if (this.waypointModeActive) {
                this._setOsdkWaypointLayerVisibility(true);
              }
              
              return waypoints;
            })
            .catch(error => {
              console.error('Error loading waypoints:', error);
              return [];
            });
        }
      } else {
        // Exiting waypoint mode
        this._setOsdkWaypointLayerVisibility(false);
        this._setPlatformLayersVisibility(this.isVisible);
      }
      
      // Trigger callback
      this.triggerCallback('onVisibilityChanged', this.isVisible && !active);
    };
    
    console.log('🇳🇴 Successfully patched toggleWaypointMode method for Norway waypoint loading');
    
    // Also patch the loadOsdkWaypointsFromFoundry method to ensure proper region name format
    const originalLoadOsdkWaypoints = window.platformManager.loadOsdkWaypointsFromFoundry;
    
    window.platformManager.loadOsdkWaypointsFromFoundry = async function(client, regionName) {
      // Normalize region name for Norway
      if (regionName && typeof regionName === 'string' && 
         (regionName.toLowerCase() === 'norway' || 
          regionName.toLowerCase().includes('norway'))) {
        console.log('🇳🇴 Normalizing Norway region name to NORWAY');
        regionName = 'NORWAY';
      }
      
      // Call original method with fixed region name
      return originalLoadOsdkWaypoints.call(this, client, regionName);
    };
    
    console.log('🇳🇴 Successfully patched loadOsdkWaypointsFromFoundry method');
    
    // If already in waypoint mode in Norway, immediately refresh waypoints
    if (window.platformManager.waypointModeActive) {
      // Check if current region is Norway
      const currentRegion = window.currentRegion || {};
      const regionName = currentRegion.name || currentRegion.id || '';
      
      if (regionName.toLowerCase() === 'norway') {
        console.log('🇳🇴 Already in waypoint mode in Norway - applying fix immediately');
        
        // Get client
        const client = window.client || window.osdkClient;
        
        if (client) {
          console.log('🇳🇴 Forcing reload of Norway waypoints');
          
          // Clear waypoints and reload
          window.platformManager.osdkWaypoints = [];
          window.platformManager.loadOsdkWaypointsFromFoundry(client, 'NORWAY')
            .then(waypoints => {
              console.log(`🇳🇴 Successfully loaded ${waypoints.length} waypoints for Norway`);
              window.platformManager._setOsdkWaypointLayerVisibility(true);
            })
            .catch(error => {
              console.error('Error loading Norway waypoints:', error);
            });
        }
      }
    }
  }, 500);
  
  // Set a timeout to clear the interval if platformManager never becomes available
  setTimeout(() => {
    clearInterval(waitForPlatformManager);
  }, 30000);
})();
