/**
 * PlatformManager.js
 * 
 * Handles loading, displaying, and interacting with platform/rig data
 */
import LoadingIndicator from './LoadingIndicator';

class PlatformManager {
  /**
   * Process waypoint results to extract valid waypoints
   * @param {Object} result - The OSDK query result
   * @returns {Array} - Array of waypoint objects
   */
  processWaypointResults(result) {
    console.log(`PlatformManager: Processing ${result?.data?.length || 0} waypoint results`);
    
    if (!result || !result.data || result.data.length === 0) {
      console.log("PlatformManager: No waypoint data to process");
      return [];
    }
    
    // Convert results to waypoint objects
    const waypoints = result.data
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
    
    console.log(`PlatformManager: Processed ${waypoints.length} valid waypoints`);
    
    return waypoints;
  }
  constructor(mapManager) {
    this.mapManager = mapManager;
    this.platforms = [];
    this.isVisible = true;
    this.callbacks = {
      onPlatformsLoaded: null,
      onVisibilityChanged: null,
      onError: null,
      onOsdkWaypointsLoaded: null // Added callback for OSDK waypoints
    };
    // Flag to prevent duplicate source/layer creation
    this.skipNextClear = false;
    this.osdkWaypoints = []; // To store loaded OSDK navigation waypoints
    this.osdkWaypointsVisible = false; // To track visibility of OSDK waypoints layer
    this.waypointModeActive = false; // To track if waypoint mode is active
  }
  
  /**
   * Set a callback function
   * @param {string} type - The callback type
   * @param {Function} callback - The callback function
   */
  setCallback(type, callback) {
    if (this.callbacks.hasOwnProperty(type)) {
      this.callbacks[type] = callback;
    }
  }
  
  /**
   * Trigger a callback if it exists
   * @param {string} type - The callback type
   * @param {*} data - The data to pass to the callback
   */
  triggerCallback(type, data) {
    if (this.callbacks[type]) {
      this.callbacks[type](data);
    }
  }
  
  /**
   * Load platform data from Foundry
   * @param {Object} client - The OSDK client
   * @param {string} regionName - The region name to filter by
   * @returns {Promise} - Resolves when platforms are loaded
   */
  async loadPlatformsFromFoundry(client, regionName = "GULF OF MEXICO") {
    // Show loading indicator
    const loaderId = LoadingIndicator.show('.route-stats-title', 
      `Loading platform data for ${regionName}...`, 
      { position: 'bottom' });
    
    // Only clear platforms if skipNextClear is false
    if (!this.skipNextClear) {
      // Clear any existing data first to ensure fresh load
      this.clearPlatforms();
    } else {
      console.log(`Skipping clearPlatforms due to skipNextClear flag for region: ${regionName}`);
      // Reset the flag for next time
      this.skipNextClear = false;
    }
    console.log(`Loading platforms for region: ${regionName}`);
    
    // Validate region name
    if (!regionName) {
      console.error("No region name provided - defaulting to GULF OF MEXICO");
      regionName = "GULF OF MEXICO";
    }
    const map = this.mapManager.getMap();
    if (!map) {
      LoadingIndicator.hide(loaderId);
      return Promise.reject(new Error('Map is not initialized'));
    }
    
    try {
      // Check if we have a client - but don't reject the promise
      if (!client) {
        console.warn("No OSDK client provided - this may be expected on region changes");
        
        // Update loading indicator
        LoadingIndicator.updateText(loaderId, "No client available - reconnecting...");
        setTimeout(() => {
          LoadingIndicator.hide(loaderId);
        }, 2000);
        
        // Return empty array instead of rejecting to prevent UI errors
        this.platforms = [];
        this.triggerCallback('onPlatformsLoaded', []);
        return [];
      }
      
      // We'll remove the problematic authentication check and rely on the client implementation
      // to handle authentication errors properly during the API call
      console.log("Using OSDK client to load platforms...");
      
      try {
        // Import the SDK
        const sdk = await import('@flight-app/sdk');
        
        // Find location object without excessive logging
        let locationObject = null;
        if (sdk.AllGtLocationsV2) {
          locationObject = sdk.AllGtLocationsV2;
        } else if (sdk.AllGtLocations) {
          locationObject = sdk.AllGtLocations;
        } else {
          // Look for any location-related objects
          const locationOptions = Object.keys(sdk).filter(key => 
            key.includes('Location') || key.includes('location')
          );
          
          if (locationOptions.length > 0) {
            locationObject = sdk[locationOptions[0]];
          } else {
            throw new Error('No location-related objects found in SDK');
          }
        }
        
        // Query for platforms and locations without excessive logging
        console.log(`Querying for platforms and airports in ${regionName}`);
        
        // Update loading indicator
        LoadingIndicator.updateText(loaderId, `Querying for platforms in ${regionName}...`);
        
        // Fetch for this region, including all location types
        const result = await client(locationObject)
          .where({ 
            region: regionName
            // Removed filter: locationType: { $ne: "REPORTING POINT OFFSHORE" }
          })
          .fetchPage({
            $pageSize: 5000, // Increased to make sure we get everything
            // Removed additional filter: no longer excluding reporting points
          });
        
        console.log(`Found ${result.data ? result.data.length : 0} total items for region ${regionName}`);
        
        // Then filter for fixed platforms on the client side to catch all variations
        if (result.data && result.data.length > 0) {
          // Before filtering, log all location types for reference
          const allTypes = new Set();
          result.data.forEach(item => {
            if (item.locationType) {
              allTypes.add(item.locationType);
            }
          });
          console.log("All location types in results:", Array.from(allTypes));
          
          // Filter to include only active items (for all types)
          const originalCount = result.data.length;
          
          // Update loading indicator
          LoadingIndicator.updateText(loaderId, `Filtering ${originalCount} locations...`);
          
          result.data = result.data.filter(item => {
            // CRITICAL FILTER: Only include items with activeSite = "Active"
            if (item.activeSite !== "Active") {
              return false;
            }
            
            if (!item.locationType) return false;
            
            const type = item.locationType.toUpperCase();
            
            // Don't exclude reporting points here anymore, let the specific layers handle them
            
            // Include all platform types
            if (type.includes("PLATFORM") || 
                type.includes("RIG") ||
                type.includes("VESSEL") ||
                type.includes("SHIP") ||
                type.includes("BLOCKS") ||
                type.includes("JACKUP") ||
                type.includes("MOVABLE") ||
                type.includes("MOVEABLE") ||
                type.includes("FPSO") ||
                type.includes("TLP") ||
                type.includes("SPAR") ||
                type.includes("DRILL") ||
                type.includes("PRODUCTION") ||
                type.includes("OIL") ||
                type.includes("GAS") ||
                type.includes("JACKET") ||
                (type.includes("OFFSHORE"))) {
              return true;
            }
            
            // Include airports/airfields
            if (item.ISAIRPORT === 'Yes' || item.isAirport === 'Yes' ||
                type.includes('AIRPORT') || 
                type.includes('AIRFIELD') || 
                type.includes('BASE') || 
                type.includes('HELIPORT')) {
              return true;
            }
            
            // For Gulf of Mexico, be more inclusive with platform detection
            if (item.region === "GULF OF MEXICO" && 
                (item.name?.startsWith('X') || item.locName?.startsWith('X'))) {
              return true;
            }
            
            // Exclude everything else
            return false;
          });
          
          console.log(`Filtered from ${originalCount} to ${result.data.length} ACTIVE items (platforms and airports)`);
          
          // Log how many inactive items were filtered out
          const inactiveCount = originalCount - result.data.length;
          console.log(`Filtered out ${inactiveCount} inactive items (activeSite ≠ "Active")`);
          
          // Check platform count by region to ensure we're getting data for all regions
          let platformCountByRegion = {};
          result.data.forEach(item => {
            if (item.region) {
              platformCountByRegion[item.region] = (platformCountByRegion[item.region] || 0) + 1;
            }
          });
          console.log(`Platform count by region after filtering:`, platformCountByRegion);
          
          // Check for key platforms in Norway as a sanity check
          if (regionName === "NORWAY") {
            const criticalPlatforms = ["ENLE", "ENWS", "ENWV"];
            criticalPlatforms.forEach(platform => {
              const found = result.data.some(item => item.locName === platform);
              console.log(`Platform ${platform} found in filtered results: ${found}`);
            });
          } 
          // Check for platforms in Gulf of Mexico
          else if (regionName === "GULF OF MEXICO") {
            console.log(`Gulf of Mexico platform count: ${result.data.filter(item => !item.ISAIRPORT && !item.isAirport).length}`);
            // Log a sample of platform names
            const samplePlatforms = result.data
              .filter(item => !item.ISAIRPORT && !item.isAirport)
              .slice(0, 5)
              .map(item => item.locName || "Unknown");
            console.log(`Sample Gulf of Mexico platforms: ${samplePlatforms.join(", ")}`);
          }
        }
        
        console.log(`Found ${result.data ? result.data.length : 0} items for region: ${regionName}`);
        
        // Double-check that we're getting the right region
        if (result.data && result.data.length > 0) {
          // Count items by region to verify filtering is working
          const regionCount = {};
          result.data.forEach(item => {
            if (item.region) {
              regionCount[item.region] = (regionCount[item.region] || 0) + 1;
            }
          });
          console.log("Region distribution in results:", regionCount);
        }
          
        console.log(`Query returned ${result.data ? result.data.length : 0} results`);
        
        // Always run specific queries for our key locations regardless of other results
        console.log("Running specific queries for critical locations...");
        
        // Track what we've already found
        const existingNames = new Set();
        if (result.data) {
          result.data.forEach(item => {
            if (item.locName) {
              existingNames.add(item.locName);
            }
          });
        }
        
        // Always query for airfields/airports in THIS SPECIFIC region
        try {
          console.log(`Specifically searching for airports in REGION: "${regionName}"`);
          
          // Simpler, more direct query to ensure proper filtering
          const airportResult = await client(locationObject)
            .where({ 
              region: regionName,
              // We'll filter by type on the client side instead
            })
            .fetchPage({ $pageSize: 3000 }); // Increased from 2000 to ensure we get all airports
            
          // Filter for airports on client side
          let airports = [];
          if (airportResult.data && airportResult.data.length > 0) {
            airports = airportResult.data.filter(item => {
              if (!item) return false;
              
              // Check ISAIRPORT flag
              if (item.ISAIRPORT === 'Yes' || item.isAirport === 'Yes') 
                return true;
                
              // Check locationType
              if (item.locationType) {
                const type = item.locationType.toUpperCase();
                return type.includes('AIRPORT') || 
                       type.includes('AIRFIELD') || 
                       type.includes('BASE') ||
                       type.includes('HELIPORT');
              }
              
              return false;
            });
          }
            
          if (airports.length > 0) {
            console.log(`Found ${airports.length} airports in region ${regionName}`);
            
            // Log some sample airports
            console.log("Sample airports:", airports.slice(0, 5).map(a => a.locName || 'Unknown'));
            
            // Combine results
            if (!result.data) {
              result.data = [];
            }
            
            // Add only new items
            for (const airport of airports) {
              if (airport.locName && !existingNames.has(airport.locName)) {
                result.data.push(airport);
                existingNames.add(airport.locName);
              }
            }
          } else {
            console.log(`No airports found in region ${regionName}`);
          }
        } catch (err) {
          console.warn("Error in airport-specific query:", err);
        }
        
        // Only search for critical locations in the current region
        try {
          // Map of critical locations to the regions they should be in
          const criticalLocationsByRegion = {
            "GULF OF MEXICO": ["KHUM"],
            "NORWAY": ["ENZV", "SVG", "STAVANGER", "SOLA"]
          };
          
          // Get critical locations for this region
          const criticalLocations = criticalLocationsByRegion[regionName] || [];
          
          // No need for special case platform handling anymore since our filter is now correctly
          // detecting all platform types including our key fixed platforms
          console.log(`Using standard filtering for all platform types in ${regionName}`);
          
          if (criticalLocations.length > 0) {
            console.log(`Looking for critical locations in ${regionName}: ${criticalLocations.join(', ')}`);
            
            for (const locName of criticalLocations) {
              if (!existingNames.has(locName)) {
                console.log(`Specifically searching for ${locName} in ${regionName}...`);
                
                const specificResult = await client(locationObject)
                  .where({ 
                    region: regionName,
                    locName: locName 
                  })
                  .fetchPage({ $pageSize: 10 });
                  
                if (specificResult.data && specificResult.data.length > 0) {
                  console.log(`Found ${locName} in ${regionName}!`);
                  
                  if (!result.data) {
                    result.data = [];
                  }
                  
                  for (const item of specificResult.data) {
                    if (item.locName && !existingNames.has(item.locName)) {
                      result.data.push(item);
                      existingNames.add(item.locName);
                    }
                  }
                } else {
                  console.log(`${locName} not found in ${regionName} specific search`);
                }
              }
            }
          } else {
            console.log(`No critical locations defined for region: ${regionName}`);
          }
        } catch (err) {
          console.warn("Error in critical location search:", err);
        }
        
        if (!result || !result.data) {
          console.error("No result data returned from API");
          return Promise.reject(new Error("No data returned from API"));
        }
        
        console.log(`Successfully fetched ${result.data.length} items`);
        
        // Log the structure of the data to understand what we're working with
        if (result.data.length > 0) {
          const sample = result.data[0];
          console.log("Sample data structure:", Object.keys(sample));
          console.log("Sample item:", sample);
          
          // Try to identify potential coordinate fields
          const potentialCoordFields = [];
          for (const key of Object.keys(sample)) {
            const value = sample[key];
            // Look for objects with latitude/longitude or array coordinates
            if (value && typeof value === 'object') {
              if (value.latitude !== undefined && value.longitude !== undefined) {
                potentialCoordFields.push(key);
              }
              if (Array.isArray(value) && value.length === 2 && 
                  typeof value[0] === 'number' && typeof value[1] === 'number') {
                potentialCoordFields.push(key);
              }
              if (value.coordinates && Array.isArray(value.coordinates)) {
                potentialCoordFields.push(key);
              }
            }
          }
          console.log("Potential coordinate fields:", potentialCoordFields);
        }
        
        // Process data with improved type classification 
        const locations = [];
        const processedNames = new Set(); // Track processed items to avoid duplicates
        
        // Update loading indicator
        LoadingIndicator.updateText(loaderId, `Processing ${result.data ? result.data.length : 0} locations...`);
        
        // Debug counters
        let fixedPlatformCount = 0;
        let movablePlatformCount = 0;
        let airportsCount = 0; // Changed name to avoid duplicate declaration
        
        // First, log what types are available in the data
        const typeCount = {};
        if (result.data) {
          result.data.forEach(item => {
            if (item.locationType) {
              typeCount[item.locationType] = (typeCount[item.locationType] || 0) + 1;
            }
          });
        }
        console.log("Location types in results:", typeCount);
        
        if (!result.data || result.data.length === 0) {
          console.warn("No data returned for processing");
          return [];
        }
        
        for (const item of result.data) {
          // CRITICAL: Skip items from other regions
          if (item.region && item.region !== regionName) {
            console.log(`Skipping item from wrong region: ${item.locName} (${item.region})`);
            continue;
          }
          
          let name = '';
          let coords = null;
          let type = '';
          let isAirfield = false;
          let isMovable = false; // New property to track if this is a movable platform
          
          // Try to extract name
          if (item.locName) name = item.locName;
          else if (item.name) name = item.name;
          else if (item.location_name) name = item.location_name;
          else if (item.id) name = item.id.toString();
          else continue; // Skip items with no identifiable name
          
          // Skip duplicates
          if (processedNames.has(name)) {
            continue;
          }
          
          // Try to extract coordinates
          // First check for geoPoint field
          if (item.geoPoint) {
            if (typeof item.geoPoint.longitude === 'number' && typeof item.geoPoint.latitude === 'number') {
              coords = [item.geoPoint.longitude, item.geoPoint.latitude];
            } else if (Array.isArray(item.geoPoint) && item.geoPoint.length === 2) {
              coords = item.geoPoint;
            } else if (item.geoPoint.coordinates && Array.isArray(item.geoPoint.coordinates)) {
              coords = item.geoPoint.coordinates;
            }
          }
          
          // Check for direct lat/lon fields
          if (!coords) {
            if (item.LAT !== undefined && item.LON !== undefined) {
              coords = [parseFloat(item.LON), parseFloat(item.LAT)];
            } else if (item.lat !== undefined && item.lon !== undefined) {
              coords = [parseFloat(item.lon), parseFloat(item.lat)];
            } else if (item.latitude !== undefined && item.longitude !== undefined) {
              coords = [parseFloat(item.longitude), parseFloat(item.latitude)];
            }
          }
          
          // Skip if we still couldn't get coordinates
          if (!coords) {
            console.log(`Skipping ${name} - no coordinates found`);
            continue;
          }
          
          // Try to determine type
          if (item.locationType) type = item.locationType;
          else if (item.type) type = item.type;
          else if (item.location_type) type = item.location_type;
          
          // Final filter for unwanted types - skip waypoints and reporting points
          if (type) {
            const upperType = type.toUpperCase();
            
            // CRITICAL CHECKS for platform type identification
            // First check if it's any kind of platform/rig/vessel
            const isPlatformOrVessel = 
                upperType.includes('PLATFORM') || 
                upperType.includes('RIG') ||
                upperType.includes('VESSEL') ||
                upperType.includes('SHIP') ||
                upperType.includes('JACKUP') ||
                upperType.includes('FPSO') ||
                upperType.includes('TLP') ||
                upperType.includes('SPAR') ||
                upperType.includes('DRILL') ||
                upperType.includes('OFFSHORE');
            
            // Determine if it's specifically a fixed platform    
            const isFixedPlatform = 
                (upperType.includes('FIXED') && upperType.includes('PLATFORM')) ||
                (upperType === 'FIXED PLATFORM');
                
            // Don't skip navigation points in waypoint mode
            if (window.isWaypointModeActive !== true && 
                !isPlatformOrVessel && 
                (upperType.includes('WAYPOINT') || 
                upperType.includes('REPORTING POINT') || 
                upperType.includes('FIX') ||
                upperType.includes('INTERSECTION') ||
                upperType.includes('NAVAID'))) {
              console.log(`Skipping navigation point: ${name} (${type})`);
              continue;
            }
            
            // Process item type without excessive logging
            
            // Don't skip reporting points anymore
              
            // First check for airfields (take priority over platform detection)
            if (item.ISAIRPORT === 'Yes' || item.isAirport === 'Yes' || 
                upperType.includes('AIRPORT') || 
                upperType.includes('AIRFIELD') || 
                upperType.includes('BASE') || 
                upperType.includes('HELIPORT')) {
              isAirfield = true;
              isMovable = false;
            }
            // Check for platform types
            else if (upperType.includes('PLATFORM') || 
                    upperType.includes('RIG') ||
                    upperType.includes('VESSEL') ||
                    upperType.includes('SHIP') ||
                    upperType.includes('BLOCKS') ||
                    upperType.includes('JACKUP') ||
                    upperType.includes('FPSO') ||
                    upperType.includes('TLP') ||
                    upperType.includes('SPAR') ||
                    upperType.includes('DRILL') ||
                    upperType.includes('PRODUCTION') ||
                    upperType.includes('OIL') ||
                    upperType.includes('GAS') ||
                    upperType.includes('JACKET') ||
                    (upperType.includes('OFFSHORE') && !upperType.includes('REPORTING'))) {
              
              isAirfield = false;
              
              // Check if it's a movable platform
              if (upperType.includes('MOVABLE') || 
                  upperType.includes('MOVEABLE') || 
                  upperType.includes('SHIP') || 
                  upperType.includes('VESSEL') ||
                  upperType.includes('JACK-UP') ||
                  upperType.includes('JACKUP') ||
                  upperType.includes('DRILL SHIP') ||
                  upperType.includes('SEMI-SUBMERSIBLE')) {
                isMovable = true;
              } 
              // Fixed platform detection
              else if (upperType.includes('FIXED') || upperType.includes('STATIC')) {
                isMovable = false;
              }
              // Default case for other platforms - treat as fixed
              else {
                isMovable = false;
              }
            }
            // Gulf of Mexico special case - X prefixed platforms
            else if (item.region === "GULF OF MEXICO" && 
                    (name.startsWith('X') || name.startsWith('K'))) {
              isAirfield = false;
              isMovable = false;
            }
            // Skip other types
            else {
              continue; 
            }
          }
          
          // Special handling for specific key locations (without excessive logging)
          if (name === 'ENZV' || name === 'SVG' || name.includes('STAVANGER') || name.includes('SOLA')) {
            isAirfield = true;
            
            // Ensure ENZV has correct coordinates if found
            if (name === 'ENZV' && (!coords || coords[0] === 0 || coords[1] === 0)) {
              coords = [5.6316667, 58.8816667]; // Correct coordinates for ENZV
            }
          }
          
          if (name === 'KHUM' || name.includes('HOUMA')) {
            isAirfield = true;
            
            // Ensure KHUM has correct coordinates if found
            if (name === 'KHUM' && (!coords || coords[0] === 0 || coords[1] === 0)) {
              coords = [-90.65383, 29.55583]; // Correct coordinates for KHUM
            }
          }
          
          // Count by type for debugging
          if (isAirfield) {
            airportsCount++; // Updated variable name
          } else if (isMovable) {
            movablePlatformCount++;
          } else {
            fixedPlatformCount++;
          }
          
          // Add the processed location
          locations.push({
            name: name,
            coordinates: coords,
            operator: type || 'Unknown',
            isAirfield: isAirfield,
            isMovable: isMovable
          });
          
          // Mark as processed
          processedNames.add(name);
        }
        
        // Simplified logging - just show summary
        console.log(`Processed ${locations.length} locations (${airportsCount} airports, ${fixedPlatformCount} fixed platforms, ${movablePlatformCount} movable platforms)`);
        
        // Update loading indicator
        LoadingIndicator.updateText(loaderId, `Adding ${locations.length} locations to map...`);
        
        // Add to map even if few or no locations found - this will at least show what we got
        
        // Check if we have at least some locations
        if (locations.length > 0) {
          console.log(`Adding ${locations.length} locations to map`);
          this.addPlatformsToMap(locations);
          
          // Hide loading indicator after adding to map (the map loading will show its own indicator)
          LoadingIndicator.hide(loaderId);
          return locations;
        } else {
          console.warn("No valid locations found with coordinates");
          
          // Update loading indicator
          LoadingIndicator.updateText(loaderId, "No locations found for this region");
          setTimeout(() => {
            LoadingIndicator.hide(loaderId);
          }, 2000);
          
          // Create empty array to avoid errors in the UI
          this.platforms = [];
          this.triggerCallback('onPlatformsLoaded', []);
          return [];
        }
        
      } catch (error) {
        console.error('OSDK API error:', error);
        
        // Update loading indicator with error
        LoadingIndicator.updateText(loaderId, `Error loading platforms: ${error.message}`);
        setTimeout(() => {
          LoadingIndicator.hide(loaderId);
        }, 3000);
        
        // Even on error, don't throw so the app won't crash
        console.warn("Error occurred, returning empty locations array");
        
        // Create empty array to avoid errors in the UI
        this.platforms = [];
        this.triggerCallback('onPlatformsLoaded', []);
        return [];
      }
    } catch (error) {
      console.error('General error in loadPlatformsFromFoundry:', error);
      
      // Update loading indicator with error
      LoadingIndicator.updateText(loaderId, `Error: ${error.message}`);
      setTimeout(() => {
        LoadingIndicator.hide(loaderId);
      }, 3000);
      
      // Create empty array to avoid errors in the UI
      this.platforms = [];
      this.triggerCallback('onPlatformsLoaded', []);
      return [];
    }
  }

  /**
   * Dedicated function to remove platform layers and source.
   * Ensures layers are removed before the source to prevent errors.
   * @private
   */
  _removePlatformLayersAndSource() {
    const map = this.mapManager.getMap();
    // Ensure map is loaded and available
    if (!map || !this.mapManager.isMapLoaded()) {
      // console.log("PlatformManager: Map not ready for _removePlatformLayersAndSource, or no map.");
      return;
    }

    const layerIds = [
      'platforms-fixed-layer',
      'platforms-movable-layer',
      'airfields-layer',
      'platforms-fixed-labels',
      'platforms-movable-labels',
      'airfields-labels',
      'platforms-layer' // Generic layer name, just in case it was used previously
    ];
    const sourceId = 'major-platforms';

    // console.log("PlatformManager: Attempting to remove platform layers and source.");

    layerIds.forEach(layerId => {
      if (map.getLayer(layerId)) {
        try {
          map.removeLayer(layerId);
          // console.log(`PlatformManager: Removed layer ${layerId}`);
        } catch (e) {
          // console.warn(`PlatformManager: Error removing layer ${layerId}: ${e.message}`);
        }
      }
    });
    
    // It's crucial to ensure layers are removed before the source.
    // A small timeout can help, but a more robust solution might involve checking layer removal status.
    if (map.getSource(sourceId)) {
      try {
        map.removeSource(sourceId);
        // console.log(`PlatformManager: Removed source ${sourceId}`);
      } catch (e) {
        // console.warn(`PlatformManager: Error removing source ${sourceId}: ${e.message}`);
      }
    }
  }
  
  /**
   * Clear all platforms from the map
   */
  clearPlatforms() {
    const map = this.mapManager.getMap();
    if (!map) {
      console.log('PlatformManager: Map not available for clearPlatforms.');
      return;
    }
    
    console.log('PlatformManager: Clearing all platforms from map.');
    
    this.mapManager.onMapLoaded(() => {
      this._removePlatformLayersAndSource();
      this.platforms = []; // Clear the internal platform data
      // console.log('PlatformManager: Platforms cleared from map and data store.');
    });
  }
  
  /**
   * Add platforms to the map
   * @param {Array} platforms - Array of platform objects
   */
  addPlatformsToMap(platforms) {
    this.mapManager.onMapLoaded(() => {
      const map = this.mapManager.getMap();
      if (!map) {
        console.error("PlatformManager: Map not ready in addPlatformsToMap (inside onMapLoaded).");
        this.triggerCallback('onError', 'Map not ready to add platforms');
        return;
      }

      console.log(`PlatformManager: Adding/updating ${platforms.length} platforms on map.`);
      this.platforms = platforms; // Store the platforms

      const sourceId = 'major-platforms';

      // Prepare features for GeoJSON source
      const features = platforms.map(p => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: p.coordinates
        },
        properties: {
          name: p.name,
          operator: p.operator,
          isAirfield: p.isAirfield || false,
          isMovable: p.isMovable || false,
          platformType: p.isAirfield ? 'airfield' : (p.isMovable ? 'movable' : 'fixed')
        }
      }));

      const geoJsonData = {
        type: 'FeatureCollection',
        features: features
      };

      // Use the new centralized cleanup method
      this._removePlatformLayersAndSource();
      
      // Add new source and layers directly after cleanup
      try {
        // Load airport icon if not already loaded (from backup)
        if (!map.hasImage('airport-icon')) {
          try {
            const size = 16;
            const halfSize = size / 2;
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            
            ctx.beginPath();
            ctx.arc(halfSize, halfSize, halfSize - 2, 0, 2 * Math.PI);
            ctx.fillStyle = '#043277'; // Lighter blue from backup
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.stroke();
            
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 8px sans-serif'; // Smaller A from backup
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('A', halfSize, halfSize);
            
            map.addImage('airport-icon', { 
              data: ctx.getImageData(0, 0, size, size).data, 
              width: size, 
              height: size 
            });
            console.log('PlatformManager: Created custom airport icon');
          } catch (error) {
            console.error('PlatformManager: Error creating airport icon:', error);
          }
        }

        console.log(`PlatformManager: Adding source ${sourceId}`);
        map.addSource(sourceId, {
            type: 'geojson',
            data: geoJsonData,
            cluster: false
          });

          // Layer for Fixed Platforms (styled circle from backup)
          map.addLayer({
            id: 'platforms-fixed-layer', // Keep current ID
            type: 'circle', // Changed from symbol
            source: sourceId,
            filter: ['all', 
                     ['==', ['get', 'platformType'], 'fixed']
                    ], 
            paint: { 
              // Responsive size based on zoom level
              'circle-radius': [
                'interpolate', ['linear'], ['zoom'],
                7, 2,      // Small dots at low zoom
                10, 3,     // Medium dots at medium zoom 
                13, 4,     // Larger dots at high zoom
                16, 6      // Very large dots at very high zoom
              ],
              'circle-color': '#073b8e',       // Darker blue center
              'circle-stroke-width': 1,
              'circle-stroke-color': '#03bf42', // Teal ring
              'circle-opacity': 1
            },
            layout: { // Add visibility toggle
                'visibility': this.isVisible ? 'visible' : 'none'
            }
          });

          // Layer for Movable Platforms (styled circle from backup)
          map.addLayer({
            id: 'platforms-movable-layer',
            type: 'circle', // Changed from symbol
            source: sourceId,
            filter: ['all', 
                     ['==', ['get', 'platformType'], 'movable']
                    ],
            paint: { 
              // Responsive size based on zoom level
              'circle-radius': [
                'interpolate', ['linear'], ['zoom'],
                7, 2,      // Small dots at low zoom
                10, 3,     // Medium dots at medium zoom 
                13, 4,     // Larger dots at high zoom
                16, 6      // Very large dots at very high zoom
              ],
              'circle-color': '#ad0303',       // Dark red center
              'circle-stroke-width': 1,
              'circle-stroke-color': '#f2efef', // Light ring
              'circle-opacity': 1
            },
            layout: { // Add visibility toggle
                'visibility': this.isVisible ? 'visible' : 'none'
            }
          });

          // Layer for Airfields/Heliports (using custom/fallback icon from backup)
          map.addLayer({
            id: 'airfields-layer',
            type: 'symbol',
            source: sourceId,
            filter: ['all', ['==', ['get', 'platformType'], 'airfield']],
            layout: {
              'icon-image': map.hasImage('airport-icon') ? 'airport-icon' : 'airport-15', // Logic from backup
              'icon-size': [
                'interpolate', ['linear'], ['zoom'],
                7, 0.8,    // Small icon at low zoom
                10, 1.0,   // Normal size at medium zoom 
                13, 1.2,   // Larger icon at high zoom
                16, 1.5    // Very large icon at very high zoom
              ],
              'icon-allow-overlap': true,
              'icon-anchor': 'bottom', // From backup for pin-style
              'icon-offset': [0, -5],  // From backup
              'visibility': this.isVisible ? 'visible' : 'none'
            }
          });
          
          // Labels for Fixed Platforms
          map.addLayer({
            id: 'platforms-fixed-labels',
            type: 'symbol',
            source: sourceId,
            filter: ['all', ['==', ['get', 'platformType'], 'fixed']],
            layout: {
              'text-field': ['get', 'name'],
              'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
              'text-size': [
                'interpolate', ['linear'], ['zoom'],
                7, 9,      // Small text at low zoom
                10, 11,    // Medium text at medium zoom 
                13, 13,    // Larger text at high zoom
                16, 15     // Very large text at very high zoom
              ],
              'text-offset': [0, 1.2],
              'text-anchor': 'top',
              'visibility': this.isVisible ? 'visible' : 'none'
            },
            paint: {
              'text-color': '#ffffff',
              'text-halo-color': '#000000',
              'text-halo-width': 0.5
            }
          });

          // Labels for Movable Platforms
          map.addLayer({
            id: 'platforms-movable-labels',
            type: 'symbol',
            source: sourceId,
            filter: ['all', ['==', ['get', 'platformType'], 'movable']],
            layout: {
              'text-field': ['get', 'name'],
              'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
              'text-size': [
                'interpolate', ['linear'], ['zoom'],
                7, 9,      // Small text at low zoom
                10, 11,    // Medium text at medium zoom 
                13, 13,    // Larger text at high zoom
                16, 15     // Very large text at very high zoom
              ],
              'text-offset': [0, 1.2],
              'text-anchor': 'top',
              'visibility': this.isVisible ? 'visible' : 'none'
            },
            paint: {
              'text-color': '#ffffff',
              'text-halo-color': '#000000',
              'text-halo-width': 0.5
            }
          });

          // Labels for Airfields
          map.addLayer({
            id: 'airfields-labels',
            type: 'symbol',
            source: sourceId,
            filter: ['all', ['==', ['get', 'platformType'], 'airfield']],
            layout: {
              'text-field': ['get', 'name'],
              'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
              'text-size': [
                'interpolate', ['linear'], ['zoom'],
                7, 9,      // Small text at low zoom
                10, 11,    // Medium text at medium zoom 
                13, 13,    // Larger text at high zoom
                16, 15     // Very large text at very high zoom
              ],
              'text-offset': [0, 1.2],
              'text-anchor': 'top',
              'visibility': this.isVisible ? 'visible' : 'none'
            },
            paint: {
              'text-color': '#ffffff',
              'text-halo-color': '#000000',
              'text-halo-width': 0.5
            }
          });
          console.log('PlatformManager: Platform layers added/updated.');
          this.triggerCallback('onPlatformsLoaded', platforms);

        } catch (error) {
          console.error('PlatformManager: Error adding platform source/layers:', error);
          this.triggerCallback('onError', 'Error adding platform layers: ' + error.message);
        }
    });
  }
  
  /**
   * Toggle visibility of platforms
   * @returns {boolean} - The new visibility state
   */
  toggleVisibility() {
    const map = this.mapManager.getMap();
    if (!map) return this.isVisible;
    
    this.isVisible = !this.isVisible;
    
    try {
      // Toggle visibility of all platform and airfield layers
      const allLayers = [
        'platforms-layer',             // Main fixed platforms layer
        'platforms-fixed-layer',       // Alternative fixed platforms layer
        'platforms-movable-layer',     // Movable platforms layer
        'platforms-fixed-labels',      // Fixed platform labels
        'platforms-movable-labels',    // Movable platform labels
        'airfields-layer',             // Airfield markers
        'airfields-labels'             // Airfield labels
      ];
      const visibility = this.isVisible ? 'visible' : 'none';
      
      allLayers.forEach(layerId => {
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(layerId, 'visibility', visibility);
        }
      });
    } catch (error) {
      console.warn('Error toggling platform visibility:', error);
    }
    
    this.triggerCallback('onVisibilityChanged', this.isVisible);
    return this.isVisible;
  }

  /**
   * Helper to set visibility of main platform/airport layers
   * @param {boolean} visible - True to show, false to hide
   */
  _setPlatformLayersVisibility(visible) {
    const map = this.mapManager.getMap();
    if (!map) return;
    
    const visibility = visible ? 'visible' : 'none';
    const platformLayerIds = [
      'platforms-layer',
      'platforms-fixed-layer',
      'platforms-movable-layer',
      'platforms-fixed-labels',
      'platforms-movable-labels',
      'airfields-layer',
      'airfields-labels'
    ];
    
    // Just set visibility property instead of removing layers
    platformLayerIds.forEach(layerId => {
      if (map.getLayer(layerId)) {
        console.log(`PlatformManager: Layer ${layerId} found. Setting visibility to ${visibility}.`);
        try {
          map.setLayoutProperty(layerId, 'visibility', visibility);
          console.log(`PlatformManager: Successfully set ${layerId} visibility to ${visibility}.`);
        } catch (e) {
          console.error(`PlatformManager: Error setting visibility for ${layerId}:`, e);
        }
      } else {
        console.log(`PlatformManager: Layer ${layerId} NOT found for platform visibility change.`);
      }
    });
    
    console.log(`Platform layers visibility set to: ${visibility}`);
  }

  /**
   * Helper to set visibility of OSDK waypoint layer
   * @param {boolean} visible - True to show, false to hide
   */
  _setOsdkWaypointLayerVisibility(visible) {
    const map = this.mapManager.getMap();
    if (!map) return;
    
    const visibility = visible ? 'visible' : 'none';
    const waypointLayers = [
      'osdk-waypoints-layer',
      'osdk-waypoints-labels'
    ];
    
    // Set visibility property for each layer
    let layersFound = false;
    waypointLayers.forEach(layerId => {
      if (map.getLayer(layerId)) {
        console.log(`PlatformManager: Layer ${layerId} found. Setting visibility to ${visibility}.`);
        try {
          map.setLayoutProperty(layerId, 'visibility', visibility);
          console.log(`PlatformManager: Successfully set ${layerId} visibility to ${visibility}.`);
          layersFound = true;
        } catch (e) {
          console.error(`PlatformManager: Error setting visibility for ${layerId}:`, e);
        }
      } else {
        console.log(`PlatformManager: Layer ${layerId} NOT found for OSDK waypoint visibility change.`);
      }
    });
    
    // Store visibility state
    this.osdkWaypointsVisible = visible;
    console.log(`OSDK waypoint layer visibility set to: ${visibility}`);
    
    // If no layers were found but we have waypoints and want to make them visible,
    // call _addOsdkWaypointsToMap to create the layers
    if (!layersFound && visible && this.osdkWaypoints && this.osdkWaypoints.length > 0) {
      console.log("No waypoint layers found but have waypoints. Creating layers now...");
      this._addOsdkWaypointsToMap();
    }
  }

  /**
   * Toggle waypoint mode for platform display.
   * Hides regular platforms/airports and shows OSDK navigation waypoints.
   * @param {boolean} active - True to activate waypoint mode, false to deactivate.
   * @param {Object} client - The OSDK client, required if waypoints need to be loaded.
   * @param {string} regionName - The current region name, required if waypoints need to be loaded.
   */
  toggleWaypointMode(active, client, regionName) {
    console.log(`PlatformManager: ENTERING toggleWaypointMode. Active: ${active}, Region: ${regionName}`);
    this.waypointModeActive = active;
    window.isWaypointModeActive = active;

    this.mapManager.onMapLoaded(() => {
      const map = this.mapManager.getMap();
      console.log(`PlatformManager: toggleWaypointMode (inside onMapLoaded) - map instance:`, map ? 'Exists' : 'NULL');
      if (!map) {
        console.error("PlatformManager: Map not available for toggleWaypointMode even after onMapLoaded. Exiting.");
        return;
      }

      if (active) {
      // Entering waypoint mode
      console.log("PlatformManager: Entering waypoint mode - hiding platforms, showing waypoints");
      this._setPlatformLayersVisibility(false); // Hide normal platforms and airfields
      
      // Check if we already have waypoints loaded
      if (this.osdkWaypoints && this.osdkWaypoints.length > 0) {
        console.log(`PlatformManager: ${this.osdkWaypoints.length} waypoints already loaded, making visible`);
        this._setOsdkWaypointLayerVisibility(true);
        
        // Show success message
        if (window.LoadingIndicator) {
          window.LoadingIndicator.updateStatusIndicator(
            `Showing ${this.osdkWaypoints.length} navigation waypoints. Click to add to route.`,
            'success',
            3000
          );
        }
      } else {
        console.log("PlatformManager: No waypoints loaded yet. Loading from OSDK...");
        
        // Validate client and region name
        if (!client) {
          console.warn("PlatformManager: No client provided - attempting to find global client");
          client = window.client || window.osdkClient;
        }
        
        if (!client) {
          console.error("PlatformManager: No OSDK client available - cannot load waypoints");
          
          // Show error to user
          if (window.LoadingIndicator) {
            window.LoadingIndicator.updateStatusIndicator(
              'Cannot load waypoints: No connection to OSDK. Try refreshing the page.',
              'error',
              5000
            );
          }
          return;
        }
        
        // Validate region name
        if (!regionName) {
          console.warn("PlatformManager: No region name provided, using default");
          
          // Try to get region name from various sources
          if (this.currentRegion) {
            regionName = typeof this.currentRegion === 'string' ? 
                        this.currentRegion : 
                        (this.currentRegion.name || this.currentRegion.id);
          } else if (window.currentRegion) {
            regionName = typeof window.currentRegion === 'string' ? 
                        window.currentRegion : 
                        (window.currentRegion.name || window.currentRegion.id);
          } else {
            // Default to NORWAY which has good waypoint data
            regionName = "NORWAY";
          }
        }
        
        // Convert region names to standard format
        // Ensure upper case for OSDK regions (GULF OF MEXICO, NORWAY)
        if (regionName && typeof regionName === 'string' && 
            (regionName.toLowerCase() === 'norway' || 
             regionName.toLowerCase() === 'gulf of mexico')) {
          regionName = regionName.toUpperCase();
        }
        
        console.log(`PlatformManager: Loading waypoints for ${regionName} using OSDK client...`);
        
        // Show loading message
        if (window.LoadingIndicator) {
          window.LoadingIndicator.updateStatusIndicator(
            `Loading navigation waypoints for ${regionName}...`,
            'info',
            3000
          );
        }
        
        // Load waypoints with standardized region name
        this.loadOsdkWaypointsFromFoundry(client, regionName).then(waypoints => {
          console.log(`PlatformManager: Successfully loaded ${waypoints.length} waypoints`);
          
          // If still in waypoint mode, make the waypoints visible
          if (this.waypointModeActive) {
            this._setOsdkWaypointLayerVisibility(true);
            
            // Show success message
            if (window.LoadingIndicator) {
              window.LoadingIndicator.updateStatusIndicator(
                `Loaded ${waypoints.length} navigation waypoints. Click to add to route.`,
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
    } else {
      // Exiting waypoint mode
      console.log("PlatformManager: Exiting waypoint mode - hiding waypoints, showing platforms");
      this._setOsdkWaypointLayerVisibility(false); // Hide OSDK waypoints
      this._setPlatformLayersVisibility(this.isVisible); // Restore normal platform/airfield visibility
    }
    
      // Trigger visibility change callback
      this.triggerCallback('onVisibilityChanged', this.isVisible && !active);
    }); // End of onMapLoaded wrapper
  }

  /**
   * Clear OSDK waypoint layers from the map
   */
  _clearOsdkWaypointLayers() {
    const map = this.mapManager.getMap();
    if (!map) return;

    const sourceId = 'osdk-waypoints-source';
    const layerIds = [
      'osdk-waypoints-layer',
      'osdk-waypoints-labels'
    ];

    // First remove all layers that use the source
    layerIds.forEach(layerId => {
      if (map.getLayer(layerId)) {
        try {
          console.log(`Removing layer: ${layerId}`);
          map.removeLayer(layerId);
        } catch (e) {
          console.warn(`Error removing layer ${layerId}:`, e);
        }
      }
    });
    
    // Then remove the source
    if (map.getSource(sourceId)) {
      try {
        // console.log(`Removing source: ${sourceId}`);
        map.removeSource(sourceId);
      } catch (e) {
        console.warn(`Error removing source ${sourceId}:`, e.message);
        // If "source in use", it implies layers weren't fully removed or are still being processed.
      }
    }
    
    // Clear the stored waypoints
    this.osdkWaypoints = [];
    console.log("PlatformManager: Cleared OSDK waypoint layers and data.");
  }

  /**
   * Load OSDK navigational waypoints from Foundry
   * @param {Object} client - The OSDK client
   * @param {string} regionName - The region name to filter by
   * @returns {Promise<Array>} - Resolves with array of loaded waypoints
   */
  async loadOsdkWaypointsFromFoundry(client, regionName) {
    // Clean up any existing waypoint layers first
    this._clearOsdkWaypointLayers();

    // Validate parameters
    if (!client) {
      console.error("PlatformManager: No OSDK client provided for waypoint loading");
      return Promise.reject(new Error("OSDK client is required"));
    }
    
    if (!regionName) {
      console.warn("PlatformManager: No region name provided - defaulting to NORWAY");
      regionName = "NORWAY";
    }
    
    // Ensure uppercase for OSDK regions
    if (typeof regionName === 'string') {
      if (regionName.toLowerCase() === 'norway') {
        regionName = "NORWAY";
      } else if (regionName.toLowerCase() === 'gulf of mexico') {
        regionName = "GULF OF MEXICO";
      }
    }
    
    console.log(`PlatformManager: Loading OSDK waypoints for region: ${regionName}`);
    
    // Show loading indicator
    const loaderId = LoadingIndicator.show('.route-stats-title', 
      `Loading navigation waypoints for ${regionName}...`, 
      { position: 'bottom' });

    try {
      // Import the SDK
      const sdk = await import('@flight-app/sdk');
      let locationObject = sdk.AllGtLocationsV2 || sdk.AllGtLocations;
      
      // If the specific objects aren't found, try to find any location-related object
      if (!locationObject) {
         const locationOptions = Object.keys(sdk).filter(key => 
           key.includes('Location') || key.includes('location')
         );
         
         if (locationOptions.length > 0) {
           locationObject = sdk[locationOptions[0]];
           console.log(`PlatformManager: Using ${locationOptions[0]} for waypoints`);
         } else {
           throw new Error('No location-related objects found in SDK for waypoints');
         }
      }

      // Define comprehensive waypoint location types for each region
      let waypointLocationTypes;
      
      // Use different types based on region - include ALL possible waypoint types for Norway
      if (regionName === "NORWAY") {
        // For Norway, we need to be VERY inclusive with waypoint types
        waypointLocationTypes = [
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
          "CHECKPOINT",
          "NAVAID"
        ];
      } else if (regionName === "GULF OF MEXICO") {
        waypointLocationTypes = [
          "WAYPOINT", 
          "waypoint",
          "REPORTING POINT OFFSHORE",
          "REPORTING POINT ONSHORE",
          "REPORTING POINT",
          "NAVAID",
          "FIX", 
          "INTERSECTION",
          "POINT",
          "WAYPOINT FOR HELICOPTERS"
        ];
      } else {
        // Default for other regions - be inclusive with all types
        waypointLocationTypes = [
          "WAYPOINT",
          "waypoint",
          "REPORTING POINT OFFSHORE",
          "REPORTING POINT ONSHORE",
          "REPORTING POINT",
          "INTERSECTION",
          "FIX",
          "NAVAID"
        ];
      }
      
      console.log(`PlatformManager: Querying for ${regionName} waypoints with types: ${waypointLocationTypes.join(', ')}`);
      
      // Store client reference to global for later use if needed
      window.osdkClient = client;

      // For Norway, make two queries to be extra thorough
      let result;
      if (regionName === "NORWAY") {
        console.log(`PlatformManager: Using special Norway waypoint loading logic`);
        
        // First query: With locationType filter
        console.log(`PlatformManager: First Norway query with locationType filter`);
        const result1 = await client(locationObject)
          .where({ 
            region: regionName,
            locationType: { $in: waypointLocationTypes }
          })
          .fetchPage({ $pageSize: 5000 });
        
        console.log(`PlatformManager: First query returned ${result1?.data?.length || 0} results`);
        
        // Second query: Without locationType filter to get everything
        console.log(`PlatformManager: Second Norway query without locationType filter`);
        const result2 = await client(locationObject)
          .where({ region: regionName })
          .fetchPage({ $pageSize: 5000 });
        
        console.log(`PlatformManager: Second query returned ${result2?.data?.length || 0} results`);
        
        // Combine results, avoiding duplicates
        const combinedData = [];
        const processedNames = new Set();
        
        // Add items from first query
        if (result1?.data) {
          for (const item of result1.data) {
            const name = item.locName || item.name;
            if (name) {
              processedNames.add(name);
              combinedData.push(item);
            }
          }
        }
        
        // Add items from second query if not already included
        if (result2?.data) {
          for (const item of result2.data) {
            const name = item.locName || item.name;
            if (name && !processedNames.has(name)) {
              // Check if it's a navigation point type before adding
              const type = (item.locationType || '').toUpperCase();
              if (type.includes('WAYPOINT') || 
                  type.includes('POINT') || 
                  type.includes('FIX') || 
                  type.includes('INTERSECTION') ||
                  type.includes('NAVAID')) {
                combinedData.push(item);
                processedNames.add(name);
              }
            }
          }
        }
        
        console.log(`PlatformManager: Combined ${combinedData.length} unique results for Norway`);
        
        // Create a result object similar to the OSDK response
        result = { data: combinedData };
      }
      else {
        // For other regions, use normal query
        console.log(`PlatformManager: Executing OSDK query for waypoints in ${regionName}`);
        result = await client(locationObject)
          .where({ 
            region: regionName,
            locationType: { $in: waypointLocationTypes }
          })
          .fetchPage({ $pageSize: 5000 });
        
        console.log(`PlatformManager: OSDK query returned ${result?.data?.length || 0} raw results`);
      }
      
      this.osdkWaypoints = this.processWaypointResults(result);

      console.log(`PlatformManager: Loaded ${this.osdkWaypoints.length} OSDK waypoints for ${regionName}.`);
      
      if (this.waypointModeActive) { // If waypoint mode is active when waypoints are loaded
        this.osdkWaypointsVisible = true; // Set them to be visible
      }
      this._addOsdkWaypointsToMap(); // Add them to the map (this will respect osdkWaypointsVisible)
      this.triggerCallback('onOsdkWaypointsLoaded', this.osdkWaypoints);
      
      // Hide loading indicator
      if (loaderId) {
        LoadingIndicator.hide(loaderId);
      }
      return this.osdkWaypoints; // Return the loaded waypoints

    } catch (error) {
      console.error("PlatformManager: Error loading OSDK waypoints:", error);
      
      // Hide loading indicator with error
      if (loaderId) {
        LoadingIndicator.updateText(loaderId, `Error: ${error.message}`);
        setTimeout(() => LoadingIndicator.hide(loaderId), 3000);
      }
      
      // Trigger error callback
      this.triggerCallback('onError', "Error loading OSDK waypoints: " + error.message);
      
      // Clear waypoints on error
      this.osdkWaypoints = [];
      
      // Reject the promise to inform caller of the error
      return Promise.reject(error);
    }
  }

  /**
   * Add OSDK waypoints to the map
   */
  _addOsdkWaypointsToMap() {
    this.mapManager.onMapLoaded(() => {
      const map = this.mapManager.getMap();
      if (!map || !this.mapManager.isMapLoaded() || !this.osdkWaypoints || this.osdkWaypoints.length === 0) {
        // console.log("PlatformManager: Map not ready, or no OSDK waypoints to display for _addOsdkWaypointsToMap.");
        return;
      }

      const sourceId = 'osdk-waypoints-source';
      const layerId = 'osdk-waypoints-layer';
      const labelsLayerId = 'osdk-waypoints-labels';

      // Create features from waypoints
      const features = this.osdkWaypoints.map(wp => ({
        type: 'Feature',
        properties: {
          name: wp.name,
          type: wp.type
        },
        geometry: {
          type: 'Point',
          coordinates: wp.coordinates
        }
      }));

      // Ensure existing OSDK waypoint layers and source are cleared first
      this._clearOsdkWaypointLayers(); // This is now more synchronous

      // Proceed to add the new source and layers
      try {
        // Add source if it doesn't exist (it should have been cleared by _clearOsdkWaypointLayers)
        if (!map.getSource(sourceId)) {
          map.addSource(sourceId, {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: features
            }
          });
        } else {
           // If source somehow still exists, update its data. This shouldn't happen if _clearOsdkWaypointLayers is effective.
          console.warn(`PlatformManager: Source ${sourceId} still exists in _addOsdkWaypointsToMap. Attempting to set data.`);
          map.getSource(sourceId).setData({ type: 'FeatureCollection', features: features });
        }
        
        // Add waypoint circles layer if it doesn't exist
        if (!map.getLayer(layerId)) {
          map.addLayer({
            id: layerId,
            type: 'circle',
            source: sourceId,
            paint: {
              'circle-radius': 1, // Changed from 3 to 1 to make dots much smaller
              'circle-color': '#FFCC00', // Yellow
              'circle-stroke-width': 1,
              'circle-stroke-color': '#FFFFFF'
            },
            layout: {
              'visibility': this.osdkWaypointsVisible ? 'visible' : 'none'
            }
          });
        }
        
        // Add waypoint labels layer if it doesn't exist
        if (!map.getLayer(labelsLayerId)) {
          map.addLayer({
            id: labelsLayerId,
            type: 'symbol',
            source: sourceId,
            layout: {
              'text-field': ['get', 'name'],
              'text-size': 9,
              'text-anchor': 'top',
              'text-offset': [0, 0.5],
              'text-allow-overlap': false,
              'visibility': this.osdkWaypointsVisible ? 'visible' : 'none'
            },
            paint: {
              'text-color': '#FFCC00',
              'text-halo-color': '#000000',
              'text-halo-width': 0.5
            }
          });
        }
        
        // console.log(`Successfully added/updated ${features.length} OSDK waypoints to map`);
      } catch (e) {
        console.error("Error adding OSDK waypoint source/layers in _addOsdkWaypointsToMap:", e.message);
      }
    });
  }

  /**
   * Find the nearest OSDK navigational waypoint to a given coordinate
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {number} maxDistance - Maximum distance in nautical miles
   * @returns {Object|null} - The nearest OSDK waypoint or null if not found
   */
  findNearestOsdkWaypoint(lat, lng, maxDistance = 5) {
    if (!this.osdkWaypoints || this.osdkWaypoints.length === 0) {
      // console.log('PlatformManager: No OSDK waypoints loaded, cannot find nearest OSDK waypoint');
      return null;
    }
    
    if (!window.turf) {
      console.error('PlatformManager: Turf.js not loaded');
      return null;
    }
    
    try {
      let nearestWaypoint = null;
      let minDistance = Number.MAX_VALUE;
      
      this.osdkWaypoints.forEach(waypoint => {
        if (!waypoint.coordinates || waypoint.coordinates.length !== 2) {
          return;
        }
        
        const coords = waypoint.coordinates;
        const distance = window.turf.distance(
          window.turf.point([lng, lat]),
          window.turf.point(coords),
          { units: 'nauticalmiles' }
        );
        
        if (distance < minDistance) {
          minDistance = distance;
          nearestWaypoint = {
            name: waypoint.name,
            type: waypoint.type, // Original OSDK type
            coords: coords,
            coordinates: coords,
            lat: coords[1],
            lng: coords[0],
            distance: distance,
            isWaypoint: true // Mark as a navigational waypoint for consistency
          };
        }
      });
      
      if (minDistance <= maxDistance) {
        // console.log(`PlatformManager: Found nearest OSDK waypoint ${nearestWaypoint.name} at distance ${nearestWaypoint.distance.toFixed(2)} nm`);
        return nearestWaypoint;
      } else if (nearestWaypoint) {
        // console.log(`PlatformManager: Nearest OSDK waypoint ${nearestWaypoint.name} is too far (${nearestWaypoint.distance.toFixed(2)} nm > ${maxDistance} nm)`);
      }
    } catch (error) {
      console.error('PlatformManager: Error finding nearest OSDK waypoint:', error);
    }
    
    return null;
  }
  
  /**
   * Find the nearest platform to a given coordinate
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {number} maxDistance - Maximum distance in nautical miles
   * @returns {Object|null} - The nearest platform or null if not found
   */
  findNearestPlatform(lat, lng, maxDistance = 5) {
    if (!this.platforms || this.platforms.length === 0) {
      console.log('PlatformManager: No platforms loaded, cannot find nearest platform');
      return null;
    }
    
    if (!window.turf) {
      console.error('PlatformManager: Turf.js not loaded');
      return null;
    }
    
    try {
      let nearestPlatform = null;
      let minDistance = Number.MAX_VALUE;
      
      this.platforms.forEach(platform => {
        // Skip if platform has no coordinates
        if (!platform.coordinates || platform.coordinates.length !== 2) {
          return;
        }
        
        const coords = platform.coordinates;
        const distance = window.turf.distance(
          window.turf.point([lng, lat]),
          window.turf.point(coords),
          { units: 'nauticalmiles' }
        );
        
        if (distance < minDistance) {
          minDistance = distance;
          nearestPlatform = {
            name: platform.name,
            operator: platform.operator,
            // Include both formats for better compatibility
            coords: coords,
            coordinates: coords,
            lat: coords[1],
            lng: coords[0],
            distance: distance
          };
        }
      });
      
      // Only return if within reasonable distance
      if (minDistance <= maxDistance) {
        console.log(`PlatformManager: Found nearest platform ${nearestPlatform.name} at distance ${nearestPlatform.distance.toFixed(2)} nm`);
        return nearestPlatform;
      } else if (nearestPlatform) {
        console.log(`PlatformManager: Nearest platform ${nearestPlatform.name} is too far (${nearestPlatform.distance.toFixed(2)} nm > ${maxDistance} nm)`);
      }
    } catch (error) {
      console.error('PlatformManager: Error finding nearest platform:', error);
    }
    
    return null;
  }
  
  /**
   * Get all platforms
   * @returns {Array} - Array of platform objects
   */
  getPlatforms() {
    return this.platforms;
  }
  
  /**
   * Get visibility state
   * @returns {boolean} - True if platforms are visible
   */
  getVisibility() {
    return this.isVisible;
  }
  
  /**
   * Search platforms by name
   * @param {string} query - The search query
   * @param {number} limit - Maximum number of results to return
   * @returns {Array} - Array of matching platforms
   */
  searchPlatformsByName(query, limit = 5) {
    if (!query || !this.platforms || this.platforms.length === 0) {
      return [];
    }
    
    const normalizedQuery = query.toLowerCase().trim();
    
    // If empty query after trimming, return empty array
    if (!normalizedQuery) {
      return [];
    }
    
    // First look for exact matches
    const exactMatches = this.platforms.filter(platform => 
      platform.name.toLowerCase() === normalizedQuery
    );
    
    // Then look for platforms whose names start with the query
    const startsWithMatches = this.platforms.filter(platform => 
      platform.name.toLowerCase().startsWith(normalizedQuery) &&
      !exactMatches.includes(platform)
    );
    
    // Finally look for platforms whose names contain the query
    const containsMatches = this.platforms.filter(platform => 
      platform.name.toLowerCase().includes(normalizedQuery) &&
      !exactMatches.includes(platform) &&
      !startsWithMatches.includes(platform)
    );
    
    // Combine results with priority: exact > starts with > contains
    const results = [
      ...exactMatches,
      ...startsWithMatches,
      ...containsMatches
    ].slice(0, limit);
    
    return results;
  }
  
  /**
   * Find a single platform by name (exact or close match)
   * @param {string} name - The platform name to find
   * @returns {Object|null} - The platform object or null if not found
   */
  findPlatformByName(name) {
    if (!name || !this.platforms || this.platforms.length === 0) {
      return null;
    }
    
    const normalizedName = name.toLowerCase().trim();
    
    // If empty name after trimming, return null
    if (!normalizedName) {
      return null;
    }
    
    console.log(`PlatformManager: Looking for platform with name: ${normalizedName}`);
    
    // First try exact match
    let platform = this.platforms.find(p => 
      p.name.toLowerCase() === normalizedName
    );
    
    // If not found, try case-insensitive match
    if (!platform) {
      platform = this.platforms.find(p => 
        p.name.toLowerCase().includes(normalizedName)
      );
    }
    
    if (platform) {
      console.log(`PlatformManager: Found platform "${platform.name}" at coordinates [${platform.coordinates}]`);
      return platform;
    } else {
      console.log(`PlatformManager: No platform found with name: ${normalizedName}`);
      return null;
    }
  }
}

export default PlatformManager;
