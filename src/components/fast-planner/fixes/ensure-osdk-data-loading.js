/**
 * ensure-osdk-data-loading.js
 * 
 * Ensures OSDK data loading works without enabling map layers
 */

(function() {
  console.log('🔍 Ensuring OSDK data is loaded for waypoint functionality');
  
  // Wait for platform manager to be available
  let checkTimer = null;
  const maxWaitTime = 30000; // 30 seconds max wait
  const startTime = Date.now();
  
  // Function to check for and trigger OSDK data loading
  function ensureOsdkDataLoaded() {
    // Wait for platformManager and regionManager to be available
    if (!window.platformManager || !window.regionManager || !window.client) {
      // Check if we've waited too long
      if (Date.now() - startTime > maxWaitTime) {
        console.error('🔍 Timed out waiting for managers or client');
        clearInterval(checkTimer);
        return;
      }
      
      console.log('🔍 Waiting for required components to be available...');
      return; // Wait for next interval
    }
    
    console.log('🔍 Found required components, ensuring OSDK data is loaded');
    clearInterval(checkTimer);
    
    // Get the current region
    let currentRegion = null;
    
    try {
      currentRegion = window.regionManager.getCurrentRegion();
      console.log(`🔍 Current region: ${currentRegion ? currentRegion.name : 'None'}`);
    } catch (error) {
      console.error('🔍 Error getting current region:', error);
    }
    
    // If no current region, check for global references
    if (!currentRegion) {
      console.log('🔍 No current region from regionManager, checking window.currentRegion');
      currentRegion = window.currentRegion;
    }
    
    // Still no region, use default
    if (!currentRegion) {
      console.log('🔍 No current region available, using default: NORWAY');
      currentRegion = { name: 'NORWAY', osdkRegion: 'NORWAY' };
    }
    
    // Determine the OSDK region name to use
    const regionName = currentRegion.osdkRegion || currentRegion.name || 'NORWAY';
    console.log(`🔍 Using region name for OSDK: ${regionName}`);
    
    // Ensure OSDK client is available
    const client = window.client || window.osdkClient;
    if (!client) {
      console.error('🔍 No OSDK client available, cannot load data');
      return;
    }
    
    // Check if the loadOsdkWaypointsFromFoundry method exists
    if (typeof window.platformManager.loadOsdkWaypointsFromFoundry === 'function') {
      console.log('🔍 Found loadOsdkWaypointsFromFoundry method, calling it...');
      
      // Call the method to load OSDK waypoints
      window.platformManager.loadOsdkWaypointsFromFoundry(client, regionName)
        .then(waypoints => {
          console.log(`✅ Successfully loaded ${waypoints.length} OSDK waypoints for ${regionName}`);
          window.osdkWaypointsLoaded = true;
        })
        .catch(error => {
          console.error('❌ Error loading OSDK waypoints:', error);
        });
    } else {
      console.error('❌ loadOsdkWaypointsFromFoundry method not found on platformManager');
    }
    
    // Also load platforms data if not already loaded
    if (window.platformManager.platforms.length === 0) {
      console.log('🔍 No platforms loaded, loading platforms data...');
      
      if (typeof window.platformManager.loadPlatformsFromFoundry === 'function') {
        window.platformManager.loadPlatformsFromFoundry(client, regionName)
          .then(platforms => {
            console.log(`✅ Successfully loaded ${platforms.length} platforms for ${regionName}`);
          })
          .catch(error => {
            console.error('❌ Error loading platforms:', error);
          });
      }
    } else {
      console.log(`🔍 ${window.platformManager.platforms.length} platforms already loaded`);
    }
  }
  
  // Start checking for managers
  checkTimer = setInterval(ensureOsdkDataLoaded, 2000);
  
  // Set up a timeout to clear the interval if it runs too long
  setTimeout(() => {
    clearInterval(checkTimer);
  }, maxWaitTime);
})();