/**
 * fix-complete-waypoint-types.js
 * 
 * Comprehensive fix to ensure all waypoint types in Norway are properly loaded
 * from the OSDK. This addresses various filtering issues and ensures
 * offshore reporting points are included.
 */

(function() {
  console.log('%c COMPREHENSIVE WAYPOINT TYPES FIX', 'background: #00578a; color: white; font-size: 16px; padding: 4px 8px;');
  
  // Wait for platformManager to be available
  const waitForPlatformManager = (callback, timeout = 30000) => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      if (window.platformManager) {
        clearInterval(interval);
        callback(window.platformManager);
        return;
      }
      
      // Clear interval after timeout
      if (Date.now() - startTime > timeout) {
        clearInterval(interval);
        console.error('Timeout waiting for platformManager');
      }
    }, 500);
  };

  // Define a helper function to process waypoint results
  // This is a critical fix - missing processWaypointResults function
  const processWaypointResults = (result) => {
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
        
        // Create waypoint object with additional diagnostic fields
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
  };
  
  // Apply fixes to PlatformManager's loadOsdkWaypointsFromFoundry method
  waitForPlatformManager((platformManager) => {
    console.log('PlatformManager found, applying comprehensive waypoint fixes');
    
    // Inject the processWaypointResults function into the platformManager
    platformManager.processWaypointResults = processWaypointResults;
    
    // Store original methods
    const originalLoadOsdkWaypoints = platformManager.loadOsdkWaypointsFromFoundry;
    
    // PATCH 1: Fix the loadOsdkWaypointsFromFoundry method 
    platformManager.loadOsdkWaypointsFromFoundry = async function(client, regionName) {
      console.log(`ENHANCED: Loading waypoints for region: ${regionName}`);
      
      // Clean up any existing waypoint layers first
      this._clearOsdkWaypointLayers();
      
      // Normalize region name
      if (regionName && typeof regionName === 'string') {
        if (regionName.toLowerCase() === 'norway' || 
            regionName.toLowerCase().includes('norway')) {
          console.log('Normalizing Norway region name to NORWAY');
          regionName = 'NORWAY';
        } else if (regionName.toLowerCase() === 'gulf of mexico' || 
                   regionName.toLowerCase().includes('gulf')) {
          regionName = 'GULF OF MEXICO';
        }
      }
      
      // Show loading indicator
      const loaderId = window.LoadingIndicator ? 
                      window.LoadingIndicator.show('.route-stats-title', 
                        `Loading navigation waypoints for ${regionName}...`, 
                        { position: 'bottom' }) : null;
      
      try {
        // Import SDK
        const sdk = await import('@flight-app/sdk');
        let locationObject = sdk.AllGtLocationsV2 || sdk.AllGtLocations;
        
        // If specific objects aren't found, find any location-related object
        if (!locationObject) {
          const locationOptions = Object.keys(sdk).filter(key => 
            key.includes('Location') || key.includes('location')
          );
          
          if (locationOptions.length > 0) {
            locationObject = sdk[locationOptions[0]];
            console.log(`Using ${locationOptions[0]} for waypoints`);
          } else {
            throw new Error('No location-related objects found in SDK');
          }
        }
        
        console.log(`Using SDK object for waypoints: ${locationObject.name || 'Unknown'}`);
        
        // Store client reference for later use if needed
        window.osdkClient = client;
        
        // Create two separate queries to ensure we get all waypoint types
        // This approach is specifically designed to get offshore reporting points
        
        // --- QUERY 1: Using location type filters ---
        // Define a comprehensive list of waypoint types
        const allWaypointTypes = [
          "WAYPOINT", 
          "waypoint",
          "REPORTING POINT OFFSHORE",  // Critical - explicitly include offshore points
          "REPORTING POINT ONSHORE",
          "REPORTING POINT",
          "NAVAID",
          "FIX", 
          "INTERSECTION",
          "POINT",
          "WAYPOINT FOR HELICOPTERS",
          "CHECKPOINT",
          "VRP",
          "VISUAL REFERENCE POINT"
        ];
        
        console.log(`Query 1: Executing with location types: ${allWaypointTypes.join(', ')}`);
        
        const query1Result = await client(locationObject)
          .where({ 
            region: regionName,
            locationType: { $in: allWaypointTypes }
          })
          .fetchPage({ $pageSize: 5000 });
        
        console.log(`Query 1: Returned ${query1Result?.data?.length || 0} results with type filter`);
        
        // --- QUERY 2: Without type filter for comprehensive results ---
        console.log(`Query 2: Executing general query without type filter`);
        
        const query2Result = await client(locationObject)
          .where({ region: regionName })
          .fetchPage({ $pageSize: 5000 });
        
        console.log(`Query 2: Returned ${query2Result?.data?.length || 0} results without type filter`);
        
        // Process and log all location types from the results for diagnostics
        const allTypes = {};
        if (query2Result?.data) {
          query2Result.data.forEach(item => {
            if (item.locationType) {
              allTypes[item.locationType] = (allTypes[item.locationType] || 0) + 1;
            }
          });
        }
        console.log('All location types found in results:', allTypes);
        
        // Track processed items to avoid duplicates
        const processedNames = new Set();
        let allWaypoints = [];
        
        // Process results from Query 1 (with type filter)
        if (query1Result?.data && query1Result.data.length > 0) {
          const waypointsFromQuery1 = query1Result.data
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
              
              // Skip if coordinates are invalid
              if (!coordinates || coordinates.length !== 2 || 
                  typeof coordinates[0] !== 'number' || typeof coordinates[1] !== 'number') {
                return null;
              }
              
              // Get name
              const name = item.locName || item.name || 'Waypoint';
              
              // Add to processed names
              processedNames.add(name);
              
              // Create waypoint object
              return {
                name: name,
                coordinates: coordinates,
                type: item.locationType || 'WAYPOINT', // Store original type
                region: item.region || regionName,
                activeSite: item.activeSite || 'Unknown'
              };
            })
            .filter(wp => wp !== null); // Remove null entries
          
          console.log(`Processed ${waypointsFromQuery1.length} waypoints from query 1`);
          allWaypoints = waypointsFromQuery1;
        }
        
        // Now process results from Query 2 (without type filter)
        if (query2Result?.data && query2Result.data.length > 0) {
          // Filter to include only navigation-related points
          const waypointsFromQuery2 = query2Result.data
            .filter(item => {
              // Skip if already processed or no location type
              if (!item.locationType || processedNames.has(item.locName || item.name)) {
                return false;
              }
              
              // Check if it's a navigation point type
              const type = item.locationType.toUpperCase();
              return type.includes('WAYPOINT') || 
                     type.includes('POINT') || 
                     type.includes('FIX') || 
                     type.includes('INTERSECTION') ||
                     type.includes('NAVAID') ||
                     type.includes('REPORT');
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
              
              // Skip if coordinates are invalid
              if (!coordinates || coordinates.length !== 2 || 
                  typeof coordinates[0] !== 'number' || typeof coordinates[1] !== 'number') {
                return null;
              }
              
              // Get name
              const name = item.locName || item.name || 'Waypoint';
              
              // Add to processed names
              processedNames.add(name);
              
              // Create waypoint object
              return {
                name: name,
                coordinates: coordinates,
                type: item.locationType || 'WAYPOINT', // Store original type
                region: item.region || regionName,
                activeSite: item.activeSite || 'Unknown'
              };
            })
            .filter(wp => wp !== null); // Remove null entries
          
          console.log(`Processed ${waypointsFromQuery2.length} additional waypoints from query 2`);
          
          // Combine results
          allWaypoints = [...allWaypoints, ...waypointsFromQuery2];
        }
        
        // Special handling for Norway if we don't get enough waypoints
        if (regionName === 'NORWAY' && allWaypoints.length < 50) {
          console.warn('Not enough waypoints found for Norway, attempting emergency load');
          
          if (loaderId) {
            window.LoadingIndicator.updateText(loaderId, 'Not enough waypoints found, trying emergency load...');
          }
          
          // Create a third query specifically for Norway with no filters whatsoever
          try {
            const emergencyResult = await client(locationObject)
              .where({ region: 'NORWAY' })
              .fetchPage({ $pageSize: 10000 });
            
            console.log(`Emergency query returned ${emergencyResult?.data?.length || 0} results`);
            
            // Process ALL items looking for potential waypoints
            if (emergencyResult?.data && emergencyResult.data.length > 0) {
              const emergencyWaypoints = emergencyResult.data
                .filter(item => {
                  // Skip if already processed or no coordinates
                  if (!item.geoPoint || processedNames.has(item.locName || item.name)) {
                    return false;
                  }
                  
                  // If it has a locationType, check if it's navigation-related
                  if (item.locationType) {
                    const type = item.locationType.toUpperCase();
                    return type.includes('WAYPOINT') || 
                           type.includes('POINT') || 
                           type.includes('FIX') || 
                           type.includes('INTERSECTION') ||
                           type.includes('NAVAID') ||
                           type.includes('REPORT');
                  }
                  
                  // No type, but it has coordinates - include as potential waypoint
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
                  
                  // Skip if coordinates are invalid
                  if (!coordinates || coordinates.length !== 2 || 
                      typeof coordinates[0] !== 'number' || typeof coordinates[1] !== 'number') {
                    return null;
                  }
                  
                  // Get name
                  const name = item.locName || item.name || 'Waypoint';
                  
                  // Add to processed names
                  processedNames.add(name);
                  
                  // Create waypoint object
                  return {
                    name: name,
                    coordinates: coordinates,
                    type: item.locationType || 'WAYPOINT', // Store original type
                    region: item.region || regionName,
                    activeSite: item.activeSite || 'Unknown'
                  };
                })
                .filter(wp => wp !== null); // Remove null entries
              
              console.log(`Emergency processed ${emergencyWaypoints.length} additional waypoints`);
              
              // Combine results
              allWaypoints = [...allWaypoints, ...emergencyWaypoints];
            }
          } catch (err) {
            console.error('Error in emergency Norway waypoint load:', err);
          }
        }
        
        console.log(`Final waypoint count: ${allWaypoints.length}`);
        
        // Log waypoint type distribution
        const typeCount = {};
        allWaypoints.forEach(wp => {
          if (wp.type) {
            typeCount[wp.type] = (typeCount[wp.type] || 0) + 1;
          }
        });
        
        // Log sorted by count
        console.log('Final waypoint type distribution:');
        Object.entries(typeCount)
          .sort((a, b) => b[1] - a[1]) // Sort by count descending
          .forEach(([type, count]) => {
            console.log(`- ${type}: ${count}`);
          });
        
        // Update the class variable
        this.osdkWaypoints = allWaypoints;
        
        // Add waypoints to map
        this._addOsdkWaypointsToMap();
        
        // Hide loading indicator
        if (loaderId) {
          window.LoadingIndicator.hide(loaderId);
        }
        
        // Show success message
        if (window.LoadingIndicator) {
          window.LoadingIndicator.updateStatusIndicator(
            `Loaded ${allWaypoints.length} navigation waypoints for ${regionName}. Click to add to route.`,
            'success',
            5000
          );
        }
        
        // Trigger callback
        this.triggerCallback('onOsdkWaypointsLoaded', this.osdkWaypoints);
        
        // Return the waypoints
        return this.osdkWaypoints;
      } catch (error) {
        console.error('Error loading OSDK waypoints:', error);
        
        // Hide loading indicator with error
        if (loaderId) {
          window.LoadingIndicator.updateText(loaderId, `Error: ${error.message}`);
          setTimeout(() => window.LoadingIndicator.hide(loaderId), 3000);
        }
        
        // Trigger error callback
        this.triggerCallback('onError', "Error loading OSDK waypoints: " + error.message);
        
        // Clear waypoints on error
        this.osdkWaypoints = [];
        
        // Reject the promise
        throw error;
      }
    };
    
    console.log('Successfully patched loadOsdkWaypointsFromFoundry method');
    
    // PATCH 2: Also fix the toggleWaypointMode method to ensure proper loading
    const originalToggleWaypointMode = platformManager.toggleWaypointMode;
    
    platformManager.toggleWaypointMode = function(active, client, regionName) {
      console.log(`ENHANCED: Toggling waypoint mode to ${active ? 'ON' : 'OFF'}`);
      
      // Set flags
      this.waypointModeActive = active;
      window.isWaypointModeActive = active;
      
      const map = this.mapManager.getMap();
      if (!map) {
        console.error("Map not available for toggleWaypointMode");
        return;
      }
      
      if (active) {
        // Entering waypoint mode
        console.log("Entering waypoint mode - hiding platforms, showing waypoints");
        
        // Hide normal platforms and airfields
        this._setPlatformLayersVisibility(false);
        
        // Check if we need to reload waypoints (if none or too few exist)
        if (!this.osdkWaypoints || this.osdkWaypoints.length < 20) {
          console.log("No waypoints loaded or too few, loading from OSDK...");
          
          // Get client if not provided
          if (!client) {
            client = window.client || window.osdkClient;
          }
          
          if (!client) {
            console.error("No OSDK client available - cannot load waypoints");
            
            // Show error
            if (window.LoadingIndicator) {
              window.LoadingIndicator.updateStatusIndicator(
                'Cannot load waypoints: No connection to OSDK. Try refreshing the page.',
                'error',
                5000
              );
            }
            return;
          }
          
          // Ensure we have a region name
          if (!regionName) {
            if (this.currentRegion) {
              regionName = typeof this.currentRegion === 'string' ? 
                          this.currentRegion : 
                          (this.currentRegion.name || this.currentRegion.id);
            } else if (window.currentRegion) {
              regionName = typeof window.currentRegion === 'string' ? 
                          window.currentRegion : 
                          (window.currentRegion.name || 
                           window.currentRegion.id || 
                           window.currentRegion.regionName);
            } else {
              regionName = "NORWAY"; // Default
            }
          }
          
          console.log(`Loading waypoints for ${regionName}`);
          
          // Call our enhanced method to load waypoints
          return this.loadOsdkWaypointsFromFoundry(client, regionName)
            .then(waypoints => {
              console.log(`Successfully loaded ${waypoints.length} waypoints`);
              
              // If still in waypoint mode, make waypoints visible
              if (this.waypointModeActive) {
                this._setOsdkWaypointLayerVisibility(true);
              }
              
              return waypoints;
            })
            .catch(error => {
              console.error("Error loading waypoints:", error);
              return [];
            });
        } else {
          // We already have waypoints, just make them visible
          console.log(`Already have ${this.osdkWaypoints.length} waypoints, making visible`);
          this._setOsdkWaypointLayerVisibility(true);
        }
      } else {
        // Exiting waypoint mode
        this._setOsdkWaypointLayerVisibility(false);
        this._setPlatformLayersVisibility(this.isVisible);
      }
      
      // Trigger visibility change callback
      this.triggerCallback('onVisibilityChanged', this.isVisible && !active);
    };
    
    console.log('Successfully patched toggleWaypointMode method');
    
    // If we're already in waypoint mode, immediately reload waypoints
    if (platformManager.waypointModeActive) {
      console.log('Currently in waypoint mode, forcing waypoint reload');
      
      // Get current region
      const currentRegion = window.currentRegion || {};
      const regionName = currentRegion.name || currentRegion.id || '';
      
      // Get client
      const client = window.client || window.osdkClient;
      
      if (client) {
        console.log(`Forcing reload of waypoints for ${regionName}`);
        
        // Clear waypoints cache and reload
        platformManager.osdkWaypoints = [];
        
        // Load with enhanced method
        platformManager.loadOsdkWaypointsFromFoundry(client, regionName)
          .then(waypoints => {
            console.log(`Successfully reloaded ${waypoints.length} waypoints`);
            
            // Make them visible if still in waypoint mode
            if (platformManager.waypointModeActive) {
              platformManager._setOsdkWaypointLayerVisibility(true);
            }
          })
          .catch(error => {
            console.error("Error reloading waypoints:", error);
          });
      }
    }
  });
  
  console.log('%c WAYPOINT TYPES FIX COMPLETE', 'background: #00578a; color: white; font-size: 16px; padding: 4px 8px;');
})();
