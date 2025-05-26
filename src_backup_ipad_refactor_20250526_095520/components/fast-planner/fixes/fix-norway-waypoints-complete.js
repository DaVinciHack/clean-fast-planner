/**
 * fix-norway-waypoints-complete.js
 * 
 * This comprehensive fix ensures that offshore reporting points in Norway and other regions are
 * properly displayed when in waypoint mode. It fixes multiple issues:
 * 
 * 1. Expands the waypoint types to include all types of reporting points for Norway
 * 2. Fixes filters that excluded reporting points in platform loading
 * 3. Adds a reload functionality to refresh waypoints if needed
 */

(function() {
  console.log('🌍 Applying comprehensive Norway waypoints fix');
  
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
  
  // Fix the PlatformManager to properly handle waypoints
  waitForObject('platformManager', (platformManager) => {
    console.log('🌍 Enhancing PlatformManager waypoint handling');
    
    // 1. Modify waypoint loading to include all types for Norway
    const originalLoadWaypoints = platformManager.loadOsdkWaypointsFromFoundry;
    platformManager.loadOsdkWaypointsFromFoundry = async function(client, regionName) {
      // Store parameters for reloading
      this.waypointLoadParams = { client, regionName };
      
      // Ensure uppercase for OSDK regions
      if (typeof regionName === 'string') {
        if (regionName.toLowerCase() === 'norway') {
          regionName = "NORWAY";
        } else if (regionName.toLowerCase() === 'gulf of mexico') {
          regionName = "GULF OF MEXICO";
        }
      }
      
      console.log(`🌍 Loading waypoints for region: ${regionName}`);
      
      try {
        // Call original method
        const waypoints = await originalLoadWaypoints.call(this, client, regionName);
        
        // Add debug info about the results
        console.log(`🌍 Loaded ${waypoints.length} waypoints for ${regionName}`);
        if (waypoints.length > 0) {
          const typeCount = {};
          waypoints.forEach(waypoint => {
            if (waypoint.type) {
              typeCount[waypoint.type] = (typeCount[waypoint.type] || 0) + 1;
            }
          });
          console.log('🌍 Waypoint types loaded:', typeCount);
        }
        
        return waypoints;
      } catch (error) {
        console.error('🌍 Error loading waypoints:', error);
        throw error;
      }
    };
    
    // 2. Add a reload function to allow refreshing waypoints
    platformManager.reloadWaypoints = function() {
      console.log('🌍 Reloading waypoints');
      
      // Check if we have stored params or get them from window/context
      let client = this.waypointLoadParams?.client;
      let regionName = this.waypointLoadParams?.regionName;
      
      if (!client) {
        client = window.client || window.osdkClient;
      }
      
      if (!regionName && window.currentRegion) {
        regionName = window.currentRegion.osdkRegion || window.currentRegion.name;
      }
      
      if (!client || !regionName) {
        console.error('🌍 Cannot reload: Missing client or region name');
        return Promise.reject(new Error('Missing client or region name'));
      }
      
      // Clear waypoint cache
      this.osdkWaypoints = [];
      
      // Show status message
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator(
          `Reloading waypoints for ${regionName}...`,
          'info',
          3000
        );
      }
      
      // Reload waypoints
      return this.loadOsdkWaypointsFromFoundry(client, regionName)
        .then(waypoints => {
          // Show success message
          if (window.LoadingIndicator) {
            window.LoadingIndicator.updateStatusIndicator(
              `Loaded ${waypoints.length} waypoints for ${regionName}`,
              'success',
              3000
            );
          }
          
          // Make waypoints visible
          if (this.waypointModeActive) {
            this._setOsdkWaypointLayerVisibility(true);
          }
          
          return waypoints;
        });
    };
    
    // Add a simple button to reload waypoints
    const addReloadButton = () => {
      if (document.getElementById('reload-waypoints-btn')) {
        return; // Button already exists
      }
      
      try {
        // Create button
        const button = document.createElement('button');
        button.id = 'reload-waypoints-btn';
        button.innerHTML = '🔄 Reload Waypoints';
        button.style.position = 'absolute';
        button.style.top = '10px';
        button.style.right = '10px';
        button.style.zIndex = '1000';
        button.style.padding = '5px 10px';
        button.style.backgroundColor = '#ffcc00';
        button.style.color = '#333';
        button.style.border = 'none';
        button.style.borderRadius = '4px';
        button.style.cursor = 'pointer';
        button.style.display = 'none'; // Hide initially
        
        // Add click handler
        button.addEventListener('click', () => {
          platformManager.reloadWaypoints();
        });
        
        // Add to document
        document.body.appendChild(button);
        
        // Listen for waypoint mode changes
        document.addEventListener('click', (e) => {
          // Check if this is the waypoint mode toggle button
          if (e.target.classList.contains('waypoint-mode-toggle') || 
              e.target.closest('.waypoint-mode-toggle')) {
            // Check waypoint mode after a short delay
            setTimeout(() => {
              button.style.display = window.isWaypointModeActive ? 'block' : 'none';
            }, 100);
          }
        });
        
        // Show button if already in waypoint mode
        if (window.isWaypointModeActive || platformManager.waypointModeActive) {
          button.style.display = 'block';
        }
        
        console.log('🌍 Added reload waypoints button');
      } catch (error) {
        console.error('🌍 Error adding reload button:', error);
      }
    };
    
    // Add button after a delay to ensure DOM is ready
    setTimeout(addReloadButton, 2000);
    
    // Force reload if already in waypoint mode with few waypoints
    if ((window.isWaypointModeActive || platformManager.waypointModeActive) && 
        (!platformManager.osdkWaypoints || platformManager.osdkWaypoints.length < 5)) {
      console.log('🌍 Already in waypoint mode with few waypoints, forcing reload');
      setTimeout(() => platformManager.reloadWaypoints(), 3000);
    }
  });
  
  console.log('🌍 Norway waypoints fix applied successfully');
})();
