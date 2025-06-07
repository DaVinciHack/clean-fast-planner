/**
 * fix-process-waypoint-results.js
 * 
 * This fix adds the missing processWaypointResults function to PlatformManager.
 * The function is called during waypoint loading but isn't defined in the original code.
 */

(function() {
  console.log('🛠️ Applying fix for missing processWaypointResults function');
  
  // Define the missing processWaypointResults function
  const processWaypointResults = function(result) {
    // Check if we have data to process
    if (!result || !result.data || result.data.length === 0) {
      console.log("🛠️ No waypoint data returned to process");
      return [];
    }
    
    console.log(`🛠️ Processing ${result.data.length} waypoint results`);
    
    // Convert results to waypoint objects
    const waypoints = result.data
      // Convert each item to a waypoint object
      .map(item => {
        // Extract coordinates
        let coordinates;
        if (item.geoPoint?.coordinates) {
          coordinates = item.geoPoint.coordinates;
        } else if (item.geoPoint) {
          coordinates = item.geoPoint;
        } else if (item.longitude !== undefined && item.latitude !== undefined) {
          coordinates = [item.longitude, item.latitude];
        } else if (item.lon !== undefined && item.lat !== undefined) {
          coordinates = [item.lon, item.lat];
        } else {
          // Skip items without coordinates
          return null;
        }
        
        // Skip if coordinates are invalid
        if (!coordinates || coordinates.length !== 2 || 
            typeof coordinates[0] !== 'number' || typeof coordinates[1] !== 'number') {
          return null;
        }
        
        // Create waypoint object
        return {
          name: item.locName || item.name || 'Waypoint',
          coordinates: coordinates,
          type: item.locationType || 'WAYPOINT', // Store original type
          region: item.region || '',
          activeSite: item.activeSite || ''
        };
      })
      .filter(wp => wp !== null); // Remove null entries
    
    console.log(`🛠️ Processed ${waypoints.length} valid waypoints`);
    
    // Log waypoint types for debugging
    const typeCount = {};
    waypoints.forEach(wp => {
      if (wp.type) {
        typeCount[wp.type] = (typeCount[wp.type] || 0) + 1;
      }
    });
    
    console.log("🛠️ Waypoint types distribution:");
    Object.entries(typeCount)
      .sort((a, b) => b[1] - a[1]) // Sort by count descending
      .forEach(([type, count]) => {
        console.log(`- ${type}: ${count}`);
      });
    
    return waypoints;
  };
  
  // Wait for the platformManager to be available
  const waitForPlatformManager = setInterval(() => {
    if (!window.platformManager) return;
    
    // Clear the interval once we have platformManager
    clearInterval(waitForPlatformManager);
    
    console.log('🛠️ Found platformManager, adding processWaypointResults function');
    
    // Add the function to platformManager
    window.platformManager.processWaypointResults = processWaypointResults;
    
    // Also add it globally to handle any direct calls
    window.processWaypointResults = processWaypointResults;
    
    console.log('🛠️ Successfully added processWaypointResults function');
    
    // If already in waypoint mode, force refresh
    if (window.platformManager.waypointModeActive && window.platformManager.osdkWaypoints?.length > 0) {
      console.log('🛠️ Already in waypoint mode with waypoints loaded, making them visible');
      window.platformManager._setOsdkWaypointLayerVisibility(true);
    }
  }, 200);
  
  // Set a timeout to clear the interval if platformManager never becomes available
  setTimeout(() => {
    clearInterval(waitForPlatformManager);
  }, 10000);
})();
