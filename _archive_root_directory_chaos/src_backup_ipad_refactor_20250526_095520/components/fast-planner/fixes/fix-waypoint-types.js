/**
 * fix-waypoint-types.js
 * 
 * This fix ensures all waypoint types are correctly loaded from OSDK,
 * especially in Norway region where only some types are showing.
 */

(function() {
  console.log('🧭 Applying waypoint types fix');
  
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
  
  // Fix the loadOsdkWaypointsFromFoundry method in PlatformManager
  waitForObject('platformManager', (platformManager) => {
    console.log('🧭 Enhancing waypoint type handling in PlatformManager');
    
    // Patch the loadOsdkWaypointsFromFoundry method to use a broader range of waypoint types
    const originalMethod = platformManager.loadOsdkWaypointsFromFoundry;
    
    platformManager.loadOsdkWaypointsFromFoundry = async function(client, regionName) {
      // Save parameters for more advanced processing later
      this.waypointLoadParams = { client, regionName };
      
      try {
        // Call original method first to get its base functionality
        const waypoints = await originalMethod.call(this, client, regionName);
        
        // If we got a reasonable number of waypoints, return them
        if (waypoints && waypoints.length > 20) {
          console.log(`🧭 Got ${waypoints.length} waypoints from original method, using those`);
          return waypoints;
        }
        
        // If we got few or no waypoints, try a more comprehensive approach
        console.log(`🧭 Only got ${waypoints?.length || 0} waypoints from original method, trying expanded types`);
        
        // Build more comprehensive query that handles all possible waypoint types
        // Clean up any existing waypoint layers first
        this._clearOsdkWaypointLayers();
        
        // Import SDK again if needed
        const sdk = await import('@flight-app/sdk');
        let locationObject = sdk.AllGtLocationsV2 || sdk.AllGtLocations;
        
        // If specific objects aren't found, find any location-related object
        if (!locationObject) {
          const locationOptions = Object.keys(sdk).filter(key => 
            key.includes('Location') || key.includes('location')
          );
          
          if (locationOptions.length > 0) {
            locationObject = sdk[locationOptions[0]];
          } else {
            throw new Error('No location-related objects found in SDK for waypoints');
          }
        }
        
        // Expanded list of waypoint types for ALL regions
        const expandedWaypointTypes = [
          "WAYPOINT", 
          "waypoint",
          "REPORTING POINT OFFSHORE",
          "REPORTING POINT ONSHORE",
          "REPORTING POINT",
          "NAVAID",
          "FIX", 
          "INTERSECTION",
          "POINT",
          "WAYPOINT FOR HELICOPTERS",
          "CHECKPOINT"
        ];
        
        console.log(`🧭 Using expanded waypoint types: ${expandedWaypointTypes.join(', ')}`);
        
        // Make two separate queries - one with locationType filter, one without but limiting to active sites
        
        // Query 1: With specific waypoint types
        console.log(`🧭 Executing first OSDK query with specific waypoint types`);
        const query1Result = await client(locationObject)
          .where({ 
            region: regionName,
            locationType: { $in: expandedWaypointTypes }
          })
          .fetchPage({ $pageSize: 5000 });
        
        console.log(`🧭 First query returned ${query1Result?.data?.length || 0} results`);
        
        // Query 2: Without type filter but check for activeSite = "Active"
        console.log(`🧭 Executing second OSDK query for active sites`);
        const query2Result = await client(locationObject)
          .where({ 
            region: regionName,
            activeSite: "Active"
          })
          .fetchPage({ $pageSize: 5000 });
        
        console.log(`🧭 Second query returned ${query2Result?.data?.length || 0} results`);
        
        // Track already processed items by name to avoid duplicates
        const processedNames = new Set();
        
        // Process first query results (with locationType filter)
        let allWaypoints = [];
        
        if (query1Result?.data?.length > 0) {
          // Process waypoints from first query
          allWaypoints = query1Result.data
            .map(item => {
              // Skip if no coordinates or already processed
              if (processedNames.has(item.locName || item.name)) {
                return null;
              }
              
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
                return null; // Skip items without coordinates
              }
              
              // Add to processed names
              if (item.locName || item.name) {
                processedNames.add(item.locName || item.name);
              }
              
              // Create waypoint object
              return {
                name: item.locName || item.name || 'Waypoint',
                coordinates: coordinates,
                type: item.locationType || 'WAYPOINT' // Store original type
              };
            })
            .filter(wp => 
              // Filter out null entries and ensure coordinates are valid
              wp && wp.coordinates && wp.coordinates.length === 2 && 
              typeof wp.coordinates[0] === 'number' && 
              typeof wp.coordinates[1] === 'number'
            );
        }
        
        // Process second query results to find additional waypoints
        if (query2Result?.data?.length > 0) {
          // Log all location types found for diagnostic purposes
          const typesFound = {};
          query2Result.data.forEach(item => {
            if (item.locationType) {
              typesFound[item.locationType] = (typesFound[item.locationType] || 0) + 1;
            }
          });
          console.log("🧭 Additional location types found:", typesFound);
          
          // Look for location types that might be waypoints
          const potentialWaypointTypes = Object.keys(typesFound).filter(type => {
            const upperType = type.toUpperCase();
            return upperType.includes('WAYPOINT') || 
                  upperType.includes('POINT') || 
                  upperType.includes('FIX') || 
                  upperType.includes('NAV') ||
                  upperType.includes('REPORT');
          });
          
          console.log(`🧭 Found ${potentialWaypointTypes.length} potential additional waypoint types:`, potentialWaypointTypes);
          
          // Process additional waypoints from second query
          const additionalWaypoints = query2Result.data
            .filter(item => {
              // Check if this is a potential waypoint
              if (!item.locationType) return false;
              
              const upperType = item.locationType.toUpperCase();
              const isWaypointType = upperType.includes('WAYPOINT') || 
                                     upperType.includes('POINT') || 
                                     upperType.includes('FIX') || 
                                     upperType.includes('NAV') ||
                                     upperType.includes('REPORT');
              
              // Skip if not a waypoint type or already processed
              if (!isWaypointType || processedNames.has(item.locName || item.name)) {
                return false;
              }
              
              return true;
            })
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
                return null; // Skip items without coordinates
              }
              
              // Add to processed names
              if (item.locName || item.name) {
                processedNames.add(item.locName || item.name);
              }
              
              // Create waypoint object
              return {
                name: item.locName || item.name || 'Waypoint',
                coordinates: coordinates,
                type: item.locationType || 'WAYPOINT' // Store original type
              };
            })
            .filter(wp => 
              // Filter out null entries and ensure coordinates are valid
              wp && wp.coordinates && wp.coordinates.length === 2 && 
              typeof wp.coordinates[0] === 'number' && 
              typeof wp.coordinates[1] === 'number'
            );
          
          console.log(`🧭 Found ${additionalWaypoints.length} additional waypoints from second query`);
          
          // Combine with first query results
          allWaypoints = [...allWaypoints, ...additionalWaypoints];
        }
        
        console.log(`🧭 Total combined waypoints: ${allWaypoints.length}`);
        
        // Update class variable with combined waypoints
        this.osdkWaypoints = allWaypoints;
        
        // Add waypoints to map
        this._addOsdkWaypointsToMap();
        
        // Trigger callback
        this.triggerCallback('onOsdkWaypointsLoaded', this.osdkWaypoints);
        
        // Return the waypoints
        return this.osdkWaypoints;
      } catch (error) {
        console.error('🧭 Error in enhanced waypoint loading:', error);
        
        // Fall back to original method results if available
        if (this.osdkWaypoints && this.osdkWaypoints.length > 0) {
          return this.osdkWaypoints;
        }
        
        // Forward the error
        throw error;
      }
    };
    
    console.log('🧭 Successfully patched loadOsdkWaypointsFromFoundry method');
    
    // Add a retry function to allow reloading waypoints as needed
    platformManager.reloadWaypoints = function() {
      // Check if we have the parameters from the last load attempt
      if (!this.waypointLoadParams) {
        console.error('🧭 Cannot reload waypoints: No previous load parameters');
        return Promise.reject(new Error('No previous load parameters'));
      }
      
      console.log('🧭 Reloading waypoints with previous parameters');
      
      // Clear waypoint cache
      this.osdkWaypoints = [];
      
      // Reload using the same parameters as last time
      return this.loadOsdkWaypointsFromFoundry(
        this.waypointLoadParams.client,
        this.waypointLoadParams.regionName
      );
    };
    
    // If already in waypoint mode and we have few waypoints, force a reload
    if (platformManager.waypointModeActive && 
        platformManager.osdkWaypoints && 
        platformManager.osdkWaypoints.length < 20) {
      console.log('🧭 Already in waypoint mode with few waypoints - forcing reload');
      
      // Get current region
      const currentRegion = window.currentRegion || {};
      const regionName = currentRegion.osdkRegion || currentRegion.name || '';
      
      // Get client
      const client = window.client || window.osdkClient;
      
      if (client && regionName) {
        console.log(`🧭 Reloading waypoints for ${regionName}`);
        
        // Clear and reload
        platformManager.osdkWaypoints = [];
        
        platformManager.loadOsdkWaypointsFromFoundry(client, regionName)
          .then(waypoints => {
            console.log(`🧭 Successfully reloaded ${waypoints.length} waypoints`);
            
            // Show them if still in waypoint mode
            if (platformManager.waypointModeActive) {
              platformManager._setOsdkWaypointLayerVisibility(true);
              
              // Show success message
              if (window.LoadingIndicator) {
                window.LoadingIndicator.updateStatusIndicator(
                  `Loaded ${waypoints.length} navigation waypoints with enhanced types. Click to add to route.`,
                  'success',
                  5000
                );
              }
            }
          })
          .catch(error => {
            console.error('🧭 Error reloading waypoints:', error);
          });
      }
    }
  });
  
  console.log('🧭 Waypoint types fix applied');
})();
