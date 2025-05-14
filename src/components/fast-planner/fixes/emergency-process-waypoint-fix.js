/**
 * emergency-process-waypoint-fix.js
 * 
 * Direct emergency fix to inject the missing processWaypointResults function
 * into the PlatformManager.
 */

(function() {
  console.log('%c EMERGENCY PROCESS WAYPOINT FIX', 'background: #ff4500; color: white; font-size: 16px; padding: 4px 8px;');
  
  // Define the missing function
  function processWaypointResults(result) {
    console.log('🚨 Using emergency processWaypointResults function');
    
    // Check if we have data to process
    if (!result || !result.data || result.data.length === 0) {
      console.log("No waypoint data returned to process");
      return [];
    }
    
    console.log(`Processing ${result.data.length} waypoint results`);
    
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
    
    console.log(`Processed ${waypoints.length} valid waypoints`);
    
    // Log waypoint types for debugging
    const typeCount = {};
    waypoints.forEach(wp => {
      if (wp.type) {
        typeCount[wp.type] = (typeCount[wp.type] || 0) + 1;
      }
    });
    
    console.log("Waypoint types distribution:");
    Object.entries(typeCount)
      .sort((a, b) => b[1] - a[1]) // Sort by count descending
      .forEach(([type, count]) => {
        console.log(`- ${type}: ${count}`);
      });
    
    return waypoints;
  }
  
  // Wait for platformManager to be available
  const waitForPlatformManager = (timeout = 30000) => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const interval = setInterval(() => {
        if (window.platformManager) {
          clearInterval(interval);
          resolve(window.platformManager);
          return;
        }
        
        // Clear interval after timeout
        if (Date.now() - startTime > timeout) {
          clearInterval(interval);
          reject(new Error('Timeout waiting for platformManager'));
        }
      }, 100);
    });
  };
  
  // Immediately inject the function into the global scope for emergencies
  window.processWaypointResults = processWaypointResults;
  console.log('🚨 Injected processWaypointResults into global scope');
  
  // Also try to directly inject it into the platformManager
  waitForPlatformManager()
    .then(platformManager => {
      platformManager.processWaypointResults = processWaypointResults;
      console.log('🚨 Injected processWaypointResults directly into platformManager');
      
      // Fix Norway waypoint loading issue
      platformManager._lastRegion = null; // Force reload of waypoints
      
      if (platformManager.waypointModeActive) {
        console.log('🚨 Waypoint mode is active, forcing reload of waypoints');
        // Get current region
        const currentRegion = window.currentRegion || {};
        const regionName = currentRegion.osdkRegion || currentRegion.name || 'NORWAY';
        // Get client
        const client = window.client || window.osdkClient;
        
        if (client) {
          console.log(`🚨 Forcing reload of waypoints for ${regionName}`);
          platformManager.toggleWaypointMode(false);
          
          // Small delay, then turn it back on
          setTimeout(() => {
            platformManager.toggleWaypointMode(true, client, regionName);
          }, 500);
        }
      }
    })
    .catch(error => {
      console.error('🚨 Error injecting function:', error);
    });
  
  // Show a notification to the user
  if (window.LoadingIndicator) {
    window.LoadingIndicator.updateStatusIndicator(
      'Emergency waypoint fix applied. Try toggling waypoint mode now.',
      'success',
      5000
    );
  }
  
  console.log('%c EMERGENCY FIX APPLIED', 'background: #ff4500; color: white; font-size: 16px; padding: 4px 8px;');
})();
