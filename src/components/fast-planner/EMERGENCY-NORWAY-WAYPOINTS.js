/**
 * EMERGENCY-NORWAY-WAYPOINTS.js
 * 
 * Run this code directly in your browser console when in Norway region
 * while in waypoint mode to force load ALL waypoint types.
 */

// Self-executing function to avoid global scope pollution
(async function() {
  console.log('%c EMERGENCY NORWAY WAYPOINT FIX', 'background: red; color: white; font-size: 20px;');

  if (!window.platformManager) {
    console.error('platformManager not found! Cannot run fix.');
    return;
  }

  if (!window.client && !window.osdkClient) {
    console.error('OSDK client not found! Cannot run fix.');
    return;
  }

  // Use available client
  const client = window.client || window.osdkClient;
  
  // Force region to be NORWAY
  const regionName = "NORWAY";
  
  try {
    // Import SDK
    const sdk = await import('@flight-app/sdk');
    console.log('SDK imported successfully');
    
    // Find location object
    let locationObject = null;
    if (sdk.AllGtLocationsV2) {
      locationObject = sdk.AllGtLocationsV2;
      console.log('Using AllGtLocationsV2');
    } else if (sdk.AllGtLocations) {
      locationObject = sdk.AllGtLocations;
      console.log('Using AllGtLocations');
    } else {
      // Look for any location-related objects
      const locationOptions = Object.keys(sdk).filter(key => 
        key.includes('Location') || key.includes('location')
      );
      
      if (locationOptions.length > 0) {
        locationObject = sdk[locationOptions[0]];
        console.log(`Using ${locationOptions[0]}`);
      } else {
        throw new Error('No location objects found in SDK');
      }
    }
    
    // Show loading message
    if (window.LoadingIndicator) {
      window.LoadingIndicator.updateStatusIndicator(
        "EMERGENCY FIX: Loading ALL waypoints for Norway...",
        'info',
        3000
      );
    }
    
    // DIRECT QUERY: Skip all filtering, get everything from NORWAY
    console.log('Making direct OSDK query for ALL locations in NORWAY...');
    const result = await client(locationObject)
      .where({ 
        region: "NORWAY"
      })
      .fetchPage({ $pageSize: 10000 });
    
    console.log(`Raw OSDK query returned ${result?.data?.length || 0} locations`);
    
    // Log all location types for analysis
    const typeCount = {};
    if (result?.data) {
      result.data.forEach(item => {
        if (item.locationType) {
          typeCount[item.locationType] = (typeCount[item.locationType] || 0) + 1;
        }
      });
    }
    console.log('Location types found:', typeCount);
    
    // Filter for ALL potential waypoints - this is deliberate to catch everything
    const allWaypoints = result.data
      .filter(item => {
        // Keep items with coordinates only
        if (!item.geoPoint) return false;
        
        // We want ALL navigation-related points, so be inclusive
        if (item.locationType) {
          const type = item.locationType.toUpperCase();
          return type.includes('WAYPOINT') || 
                 type.includes('REPORT') || 
                 type.includes('POINT') || 
                 type.includes('NAV') || 
                 type.includes('FIX') ||
                 type.includes('AIR') ||    // Include AIRports etc.
                 type.includes('INTERSECTION');
        }
        
        // Include items without locationType but with coordinates
        return true;
      })
      .map(item => {
        // Extract coordinates 
        let coordinates;
        if (item.geoPoint?.coordinates) {
          coordinates = item.geoPoint.coordinates;
        } else if (Array.isArray(item.geoPoint) && item.geoPoint.length === 2) {
          coordinates = item.geoPoint;
        } else if (item.geoPoint?.longitude !== undefined && item.geoPoint?.latitude !== undefined) {
          coordinates = [item.geoPoint.longitude, item.geoPoint.latitude];
        } else {
          return null; // Skip items with invalid coordinates
        }
        
        return {
          name: item.locName || item.name || 'Waypoint',
          coordinates: coordinates,
          type: item.locationType || 'WAYPOINT'
        };
      })
      .filter(wp => wp && wp.coordinates && wp.coordinates.length === 2);
    
    console.log(`Filtered to ${allWaypoints.length} waypoints`);
    
    // Store the waypoints directly in platformManager
    window.platformManager.osdkWaypoints = allWaypoints;
    console.log(`Updated platformManager.osdkWaypoints with ${allWaypoints.length} waypoints`);
    
    // Add waypoints to map
    if (window.platformManager._addOsdkWaypointsToMap) {
      window.platformManager._addOsdkWaypointsToMap();
      console.log('Added waypoints to map');
      
      // Make them visible
      if (window.platformManager._setOsdkWaypointLayerVisibility) {
        window.platformManager._setOsdkWaypointLayerVisibility(true);
        console.log('Made waypoints visible');
      }
    }
    
    // Update waypoint mode flag to ensure consistency
    window.platformManager.waypointModeActive = true;
    window.isWaypointModeActive = true;
    
    // Show success message
    if (window.LoadingIndicator) {
      window.LoadingIndicator.updateStatusIndicator(
        `EMERGENCY FIX: Loaded ${allWaypoints.length} waypoints for Norway! Click to add to route.`,
        'success',
        5000
      );
    }
    
    console.log('%c EMERGENCY FIX COMPLETE', 'background: green; color: white; font-size: 20px;');
    
  } catch (error) {
    console.error('EMERGENCY FIX ERROR:', error);
    
    // Show error message
    if (window.LoadingIndicator) {
      window.LoadingIndicator.updateStatusIndicator(
        `Error in emergency fix: ${error.message}`,
        'error',
        5000
      );
    }
  }
})();
