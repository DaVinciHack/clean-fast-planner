// This is a console script to directly define the missing processWaypointResults function
// Copy and paste this into your browser console directly

// Step 1: Define the function globally
function processWaypointResults(result) {
  console.log("[Console Fix] Processing waypoint results", result?.data?.length || 0);
  
  // Check if we have data to process
  if (!result || !result.data || result.data.length === 0) {
    console.log("[Console Fix] No waypoint data returned to process");
    return [];
  }
  
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
        type: item.locationType || 'WAYPOINT',
        region: item.region || '',
        activeSite: item.activeSite || ''
      };
    })
    .filter(wp => wp !== null); // Remove null entries
  
  console.log(`[Console Fix] Processed ${waypoints.length} valid waypoints`);
  
  // Return the waypoints
  return waypoints;
}

// Step 2: Set the function on window to ensure global access
window.processWaypointResults = processWaypointResults;

// Step 3: Wait for platformManager to load and add the function there too
const waitForManager = setInterval(() => {
  if (window.platformManager) {
    clearInterval(waitForManager);
    
    // Add the function to the platformManager
    window.platformManager.processWaypointResults = processWaypointResults;
    
    console.log("[Console Fix] Attached processWaypointResults to platformManager");
    
    // If currently in waypoint mode, try to force waypoint reload
    if (window.platformManager.waypointModeActive) {
      console.log("[Console Fix] In waypoint mode, trying to reload waypoints");
      
      // Get client
      const client = window.client || window.osdkClient;
      
      // Get region
      const currentRegion = window.currentRegion || {};
      const regionName = currentRegion.osdkRegion || currentRegion.name || 'NORWAY';
      
      // Toggle waypoint mode off and on to force reload
      if (client) {
        window.platformManager.toggleWaypointMode(false);
        setTimeout(() => {
          window.platformManager.toggleWaypointMode(true, client, regionName);
        }, 500);
      }
    }
  }
}, 200);

// Timeout after 10 seconds
setTimeout(() => {
  clearInterval(waitForManager);
  console.log("[Console Fix] Timeout waiting for platformManager");
}, 10000);

console.log("[Console Fix] Function defined globally. Will attach to platformManager when available.");
