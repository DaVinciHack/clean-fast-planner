/**
 * PlatformManager.js
 * 
 * Handles loading, displaying, and interacting with platform/rig data
 */
import LoadingIndicator from './LoadingIndicator';

class PlatformManager {
  constructor(mapManager) {
    this.mapManager = mapManager;
    this.platforms = [];
    this.waypoints = []; // New array to store waypoints separately
    this.isVisible = true;
    this.waypointModeActive = false; // New flag to track waypoint insertion mode
    this.callbacks = {
      onPlatformsLoaded: null,
      onVisibilityChanged: null,
      onError: null,
      onWaypointsLoaded: null // New callback for when waypoints are loaded
    };
    // Flag to prevent duplicate source/layer creation
    this.skipNextClear = false;
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
        
        // Fetch for this region, explicitly excluding reporting points
        const result = await client(locationObject)
          .where({ 
            region: regionName,
            locationType: { $ne: "REPORTING POINT OFFSHORE" }
          })
          .fetchPage({
            $pageSize: 5000, // Increased to make sure we get everything
            $filter: `locationType ne 'REPORTING POINT ONSHORE'` // Also exclude onshore reporting points
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
            
            // Explicitly exclude reporting points
            if (type.includes("REPORTING POINT")) return false;
            
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
                (type.includes("OFFSHORE") && !type.includes("REPORTING"))) {
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
                
            // Skip unwanted navigation points ONLY if they're not any kind of platform
            if (!isPlatformOrVessel && 
                (upperType.includes('WAYPOINT') || 
                upperType.includes('REPORTING POINT') || 
                upperType.includes('FIX') ||
                upperType.includes('INTERSECTION') ||
                upperType.includes('NAVAID'))) {
              console.log(`Skipping navigation point: ${name} (${type})`);
              continue;
            }
            
            // Process item type without excessive logging
            
            // Skip reporting points explicitly
            if (upperType.includes('REPORTING POINT')) {
              continue;
            }
              
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
   * Clear all platforms from the map
   */
  clearPlatforms() {
    const map = this.mapManager.getMap();
    if (!map) return;
    
    console.log('Clearing all platforms from map');
    
    // Make sure the map is loaded before attempting to remove layers
    this.mapManager.onMapLoaded(() => {
      try {
        // Define all possible platform-related layer IDs
        const allLayers = [
          'platforms-layer',           // Main platform layer
          'platforms-fixed-layer',     // Fixed platforms layer
          'platforms-movable-layer',   // Movable platforms layer
          'platforms-labels',          // Main platform labels
          'platforms-fixed-labels',    // Fixed platform labels
          'platforms-movable-labels',  // Movable platform labels
          'airfields-layer',           // Airfields layer
          'airfields-labels'           // Airfield labels
        ];
        
        // First remove all layers
        for (const layerId of allLayers) {
          if (map.getLayer(layerId)) {
            try {
              map.removeLayer(layerId);
              console.log(`Successfully removed layer: ${layerId}`);
            } catch (e) {
              console.warn(`Error removing layer ${layerId}:`, e);
            }
          }
        }
        
        // Wait a moment before removing the source
        setTimeout(() => {
          // THEN remove the source (after all layers using it are gone)
          if (map.getSource('major-platforms')) {
            try {
              map.removeSource('major-platforms');
              console.log('Successfully removed source: major-platforms');
            } catch (e) {
              console.warn('Error removing source major-platforms:', e);
            }
          }
        }, 100);
        
        // Clear the platforms array
        this.platforms = [];
        
      } catch (error) {
        console.error('Error clearing platforms:', error);
      }
    });
  }
  
  /**
   * Add platforms to the map
   * @param {Array} platforms - Array of platform objects
   */
  addPlatformsToMap(platforms) {
    const map = this.mapManager.getMap();
    if (!map) return;
    
    // Count how many of each type for debugging
    const airfieldCount = platforms.filter(p => p.isAirfield).length;
    const platformCount = platforms.length - airfieldCount;
    
    console.log(`Adding ${platforms.length} locations to map: ${platformCount} platforms and ${airfieldCount} airfields`);
    
    // Store the platforms
    this.platforms = platforms;

    // Define the function to actually add layers/sources
    const addLayersAndSource = () => {
      const map = this.mapManager.getMap(); // Re-get map instance inside callback if needed
      if (!map) {
        console.error("Map became unavailable before adding platforms.");
        this.triggerCallback('onError', "Map became unavailable");
        return;
      }
      
      // Load airport icon if not already loaded
      // This ensures we have a proper airport icon even if the default style doesn't include it
      if (!map.hasImage('airport-icon')) {
        try {
          // Create a simple airport icon as fallback
          const size = 16;
          const halfSize = size / 2;
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          
          // Draw a blue circle
          ctx.beginPath();
          ctx.arc(halfSize, halfSize, halfSize - 2, 0, 2 * Math.PI);
          ctx.fillStyle = '#043277'; // Lighter blue
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.stroke();
          
          // Draw an "A" letter in white
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 8px sans-serif'; // Smaller A
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('A', halfSize, halfSize);
          
          map.addImage('airport-icon', { 
            data: ctx.getImageData(0, 0, size, size).data, 
            width: size, 
            height: size 
          });
          console.log('Created custom airport icon');
        } catch (error) {
          console.error('Error creating airport icon:', error);
        }
      }
      
      try {
        // CRITICAL FIX: Check if we should skip removing/recreating sources
        // to avoid the "already exists" error during region changes
        if (!this.skipNextClear) {
          console.log("Removing existing platform layers and sources...");
          // Remove existing layers first if they exist
          const platformLayers = [
            'platforms-layer',         // Check for old layer name too
            'platforms-fixed-layer',
            'platforms-movable-layer',
            'platforms-fixed-labels',
            'platforms-movable-labels',
            'airfields-layer',
            'airfields-labels'
          ];
          
          // First remove all layers
          platformLayers.forEach(layerId => {
            if (map.getLayer(layerId)) {
              try {
                map.removeLayer(layerId);
              } catch (e) {
                console.warn(`Error removing layer ${layerId}:`, e);
              }
            }
          });
          
          // IMPORTANT: Wait briefly before removing the source
          // This helps avoid "source in use" errors
          setTimeout(() => {
            // Then remove source
            if (map.getSource('major-platforms')) {
              try {
                map.removeSource('major-platforms');
              } catch (e) {
                console.warn("Error removing source:", e);
              }
            }
          }, 50);
        } else {
          console.log("SKIPPING source/layer removal due to skipNextClear flag");
          // Reset the flag for next time
          this.skipNextClear = false;
        }
        
        // Check if source already exists to prevent duplicate error
        const sourceExists = map.getSource('major-platforms');
        
        // Debug - check for specific platforms before mapping
        const debugPlatforms = ["ENLE", "ENWS", "ENWV", "ENZV"];
        console.log("CHECKING PLATFORMS IN MAP DATA:");
        debugPlatforms.forEach(name => {
          const found = platforms.find(p => p.name === name);
          if (found) {
            console.log(`🗺️ Found ${name} in map data at coordinates [${found.coordinates}]`);
          } else {
            console.log(`❓ ${name} NOT found in map data`);
          }
        });
        
        // Create GeoJSON data with isAirfield and isMovable properties
        console.log("Creating features for map display from", platforms.length, "platforms");
        
        // Count for debugging
        let fixedPlatformsCount = 0;
        let movablePlatformsCount = 0;
        let airfieldsCount = 0;
        
        const features = platforms.map(platform => {
          // Debug any platforms with invalid coordinates
          if (!Array.isArray(platform.coordinates) || platform.coordinates.length !== 2 ||
              typeof platform.coordinates[0] !== 'number' || typeof platform.coordinates[1] !== 'number') {
            console.log(`⚠️ Platform ${platform.name} has invalid coordinates: ${JSON.stringify(platform.coordinates)}`);
          }
          
          // Count by type for debugging
          if (platform.isAirfield) {
            airfieldsCount++;
          } else if (platform.isMovable) {
            movablePlatformsCount++;
          } else {
            fixedPlatformsCount++;
          }
          
          return {
            type: 'Feature',
            properties: {
              name: platform.name,
              operator: platform.operator || 'Unknown',
              isAirfield: !!platform.isAirfield, // Convert to boolean
              isMovable: !!platform.isMovable   // Convert to boolean
            },
            geometry: {
              type: 'Point',
              coordinates: platform.coordinates
            }
          };
        });
        
        // Debug log to verify we have features of each type
        console.log(`Created ${features.length} features for map:`);
        console.log(`- ${airfieldsCount} airfields`);
        console.log(`- ${fixedPlatformsCount} fixed platforms`);
        console.log(`- ${movablePlatformsCount} movable platforms`);
        
        console.log("Adding source with features data");
        // Add source
        // Add source only if it doesn't exist yet
        if (!sourceExists) {
          try {
            map.addSource('major-platforms', {
              type: 'geojson',
              data: {
                type: 'FeatureCollection',
                features: features
              }
            });
          } catch (e) {
            // If source already exists error, try to update it
            if (e.message && e.message.includes("already exists")) {
              console.log("Source already exists, trying to update data instead");
              try {
                const source = map.getSource('major-platforms');
                if (source && typeof source.setData === 'function') {
                  source.setData({
                    type: 'FeatureCollection',
                    features: features
                  });
                }
              } catch (updateError) {
                console.error("Error updating source data:", updateError);
              }
            }
          }
        } else {
          // If source exists, update its data
          try {
            const source = map.getSource('major-platforms');
            if (source && typeof source.setData === 'function') {
              source.setData({
                type: 'FeatureCollection',
                features: features
              });
            }
          } catch (updateError) {
            console.error("Error updating source data:", updateError);
          }
        }

        console.log("Adding fixed platforms layer");
        // Add FIXED platforms with teal ring and darker blue center
        map.addLayer({
          id: 'platforms-layer',  // Changed to match event handler in MapComponent
          type: 'circle',
          source: 'major-platforms',
          filter: ['all', 
                  ['==', ['get', 'isAirfield'], false],  // Not an airfield
                  ['==', ['get', 'isMovable'], false]    // Not a movable platform
                 ], 
          paint: {
            'circle-radius': 2,              // Slightly larger
            'circle-color': '#073b8e',       // Darker blue center
            'circle-stroke-width': 1,        // Thicker stroke for better visibility
            'circle-stroke-color': '#03bf42', // Teal ring
            'circle-opacity': 1              // Fully opaque
          }
        });
        
        console.log("Adding movable platforms layer");
        // Add MOVABLE platforms with orange ring and dark red center
        map.addLayer({
          id: 'platforms-movable-layer',
          type: 'circle',
          source: 'major-platforms',
          filter: ['all', 
                  ['==', ['get', 'isAirfield'], false],  // Not an airfield
                  ['==', ['get', 'isMovable'], true]     // Is a movable platform
                 ],
          paint: {
            'circle-radius': 2,              // Slightly larger
            'circle-color': '#ad0303',       // Dark red center
            'circle-stroke-width': 1,        // Thicker stroke for better visibility
            'circle-stroke-color': '#f2efef', // Orange ring
            'circle-opacity': 1              // Fully opaque
          }
        });

        // No debug layer - just use the regular platform layers
        
        // Add airfields with pin-style markers
        map.addLayer({
          id: 'airfields-layer',
          type: 'symbol',
          source: 'major-platforms',
          filter: ['==', ['get', 'isAirfield'], true], // Only airfields
          layout: {
            // Try to use our custom icon first, fallback to built-in if available
            'icon-image': map.hasImage('airport-icon') ? 'airport-icon' : 'airport-15',
            'icon-size': 1,                 // Make it slightly larger
            'icon-allow-overlap': true,       // Allow icons to overlap
            'icon-anchor': 'bottom',          // Anchor at bottom so it looks like a pin
            'icon-offset': [0, -5]            // Small offset to fine-tune position
          }
        });
        
        // Add platform labels for fixed platforms - white text
        map.addLayer({
          id: 'platforms-fixed-labels',
          type: 'symbol',
          source: 'major-platforms',
          filter: ['all', 
                  ['==', ['get', 'isAirfield'], false],  // Not an airfield
                  ['==', ['get', 'isMovable'], false]    // Not a movable platform
                 ],
          layout: {
            'text-field': ['get', 'name'],
            'text-size': 10,               // Slightly larger for readability
            'text-anchor': 'top',
            'text-offset': [0, 0.8],       // Moved further from the marker
            'text-allow-overlap': false,
            'text-ignore-placement': false,
            'symbol-sort-key': ['get', 'name']
          },
          paint: {
            'text-color': '#7192c4',       // White text
            'text-halo-color': '#000000',  
            'text-halo-width': 1           // Thicker halo for better contrast
          }
        });
        
        // Add platform labels for movable platforms - light orange text
        map.addLayer({
          id: 'platforms-movable-labels',
          type: 'symbol',
          source: 'major-platforms',
          filter: ['all', 
                  ['==', ['get', 'isAirfield'], false],  // Not an airfield
                  ['==', ['get', 'isMovable'], true]     // Is a movable platform
                 ],
          layout: {
            'text-field': ['get', 'name'],
            'text-size': 10,               // Slightly larger for readability
            'text-anchor': 'top',
            'text-offset': [0, 0.8],       // Moved further from the marker
            'text-allow-overlap': false,
            'text-ignore-placement': false,
            'symbol-sort-key': ['get', 'name']
          },
          paint: {
            'text-color': '#7192c4',       // Light orange text
            'text-halo-color': '#000000',  
            'text-halo-width': 1           // Thicker halo for better contrast
          }
        });
        
        // Add airfield labels - lighter blue text, closer to icon
        map.addLayer({
          id: 'airfields-labels',
          type: 'symbol',
          source: 'major-platforms',
          filter: ['==', ['get', 'isAirfield'], true], // Only airfields
          layout: {
            'text-field': ['get', 'name'],
            'text-size': 12,                // Larger text
            'text-anchor': 'top',
            'text-offset': [0, 0.6],       // Move text closer to icon
            'text-allow-overlap': false,
            'text-ignore-placement': false,
            'symbol-sort-key': ['get', 'name']
          },
          paint: {
            'text-color': '#66aaff',       // Lighter blue text
            'text-halo-color': '#000000',  
            'text-halo-width': 1.5         // Thicker halo for better visibility
          }
        });
        
        // Trigger callback
        this.triggerCallback('onPlatformsLoaded', platforms);
      } catch (error) {
        console.error('Error adding platforms to map:', error);
        this.triggerCallback('onError', error.message);
      }
    };

    // Use onMapLoaded to handle timing, whether map is already loaded or needs to wait
    console.log('Requesting to add layers/source, using onMapLoaded for timing.');
    this.mapManager.onMapLoaded(addLayersAndSource);
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
  
  /**
   * Load waypoints from Foundry OSDK
   * This function loads waypoints instead of platforms and rigs.
   * Used for waypoint insertion mode.
   * 
   * @param {Object} client - The OSDK client
   * @param {string} regionName - The region name to filter by
   * @returns {Promise} - Resolves when waypoints are loaded
   */
  async loadWaypointsFromFoundry(client, regionName = "GULF OF MEXICO") {
    // Show loading indicator
    const loaderId = LoadingIndicator.show('.route-stats-title', 
      `Loading waypoints for ${regionName}...`, 
      { position: 'bottom' });
    
    // Clear any existing waypoints first
    this.clearWaypoints();
    
    console.log(`Loading waypoints for region: ${regionName}`);
    
    try {
      // Check if we have a client
      if (!client) {
        console.warn("No OSDK client provided for waypoint loading");
        LoadingIndicator.updateText(loaderId, "No client available - reconnecting...");
        setTimeout(() => {
          LoadingIndicator.hide(loaderId);
        }, 2000);
        
        // Return empty array
        this.waypoints = [];
        this.triggerCallback('onWaypointsLoaded', []);
        return [];
      }
      
      console.log("Using OSDK client to load waypoints...");
      
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
        
        // Query specifically for waypoints and reporting points
        console.log(`Querying for waypoints and reporting points in ${regionName}`);
        
        // Update loading indicator
        LoadingIndicator.updateText(loaderId, `Querying for waypoints in ${regionName}...`);
        
        // Fetch waypoints - specifically look for reporting points and navigation points
        // Log the query we're about to make
        console.log(`Querying for waypoints with the following criteria:
          - region: ${regionName}
          - locationType: REPORTING POINT OFFSHORE, REPORTING POINT ONSHORE, WAYPOINT, or contains keywords like POINT, INTERSECTION, FIX, NAVAID
        `);
        
        // First try simpler query that just uses filter conditions directly
        const result = await client(locationObject)
          .where({
            region: regionName
          })
          .fetchPage({
            $pageSize: 5000,
            $filter: `locationType eq 'REPORTING POINT OFFSHORE' or locationType eq 'REPORTING POINT ONSHORE' or locationType eq 'WAYPOINT' or contains(locationType, 'POINT') or contains(locationType, 'INTERSECTION') or contains(locationType, 'FIX') or contains(locationType, 'NAVAID')`
          });
        
        console.log(`Found ${result.data ? result.data.length : 0} waypoints for region ${regionName}`);
        
        if (!result || !result.data || result.data.length === 0) {
          console.warn(`No waypoints found for region ${regionName}`);
          LoadingIndicator.updateText(loaderId, `No waypoints found for ${regionName}`);
          setTimeout(() => {
            LoadingIndicator.hide(loaderId);
          }, 2000);
          
          this.waypoints = [];
          this.triggerCallback('onWaypointsLoaded', []);
          return [];
        }
        
        // Log all location types for reference
        const allTypes = new Set();
        result.data.forEach(item => {
          if (item.locationType) {
            allTypes.add(item.locationType);
          }
        });
        console.log("Waypoint location types in results:", Array.from(allTypes));
        
        // Let's log the first few results to understand the data structure
        if (result.data && result.data.length > 0) {
          console.log("Sample waypoint data structure:", Object.keys(result.data[0]));
          console.log("First waypoint:", result.data[0]);
        }
        
        // Process waypoints
        const waypoints = [];
        let processedCount = 0;
        let skippedNoName = 0;
        let skippedNoCoords = 0;
        
        for (const item of result.data) {
          let name = '';
          let coords = null;
          let type = '';
          
          // Try to extract name
          if (item.locName) name = item.locName;
          else if (item.name) name = item.name;
          else if (item.location_name) name = item.location_name;
          else if (item.id) name = item.id.toString();
          else {
            skippedNoName++;
            continue; // Skip items with no identifiable name
          }
          
          // Try to extract coordinates
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
          
          // Skip if we couldn't get coordinates
          if (!coords) {
            skippedNoCoords++;
            console.log(`Skipping waypoint ${name} - no coordinates found`);
            continue;
          }
          
          // Try to determine type
          if (item.locationType) type = item.locationType;
          else if (item.type) type = item.type;
          else if (item.location_type) type = item.location_type;
          
          // Add to waypoints array
          waypoints.push({
            name: name,
            coordinates: coords,
            type: type || 'WAYPOINT'
          });
          processedCount++;
        }
        
        console.log(`Successfully processed ${processedCount} waypoints`);
        console.log(`Skipped ${skippedNoName} items with no name, ${skippedNoCoords} items with no coordinates`);
        
        // Log a few sample waypoints for verification
        if (waypoints.length > 0) {
          console.log("Sample processed waypoints:");
          waypoints.slice(0, 3).forEach((wp, i) => {
            console.log(`Waypoint ${i+1}: ${wp.name}, type: ${wp.type}, coordinates: [${wp.coordinates.join(', ')}]`);
          });
        }
        
        console.log(`Processed ${waypoints.length} waypoints`);
        
        // Store the waypoints
        this.waypoints = waypoints;
        
        // Add waypoints to the map
        this.addWaypointsToMap(waypoints);
        
        // Hide loading indicator
        LoadingIndicator.hide(loaderId);
        
        // Trigger callback
        this.triggerCallback('onWaypointsLoaded', waypoints);
        
        return waypoints;
        
      } catch (error) {
        console.error('OSDK API error loading waypoints:', error);
        
        LoadingIndicator.updateText(loaderId, `Error loading waypoints: ${error.message}`);
        setTimeout(() => {
          LoadingIndicator.hide(loaderId);
        }, 3000);
        
        this.waypoints = [];
        this.triggerCallback('onWaypointsLoaded', []);
        return [];
      }
    } catch (error) {
      console.error('General error loading waypoints:', error);
      
      LoadingIndicator.updateText(loaderId, `Error: ${error.message}`);
      setTimeout(() => {
        LoadingIndicator.hide(loaderId);
      }, 3000);
      
      this.waypoints = [];
      this.triggerCallback('onWaypointsLoaded', []);
      return [];
    }
  }
  
  /**
   * Clear all waypoints from the map
   */
  clearWaypoints() {
    const map = this.mapManager.getMap();
    if (!map) return;
    
    console.log('Clearing all waypoints from map');
    
    this.mapManager.onMapLoaded(() => {
      try {
        // Define waypoint layer IDs
        const waypontLayers = [
          'waypoints-layer',
          'waypoints-labels'
        ];
        
        // Remove layers
        for (const layerId of waypontLayers) {
          if (map.getLayer(layerId)) {
            try {
              map.removeLayer(layerId);
            } catch (e) {
              console.warn(`Error removing waypoint layer ${layerId}:`, e);
            }
          }
        }
        
        // Wait before removing source
        setTimeout(() => {
          if (map.getSource('waypoints-source')) {
            try {
              map.removeSource('waypoints-source');
            } catch (e) {
              console.warn('Error removing waypoints source:', e);
            }
          }
        }, 100);
        
        // Clear the waypoints array
        this.waypoints = [];
        
      } catch (error) {
        console.error('Error clearing waypoints:', error);
      }
    });
  }
  
  /**
   * Add waypoints to the map
   * @param {Array} waypoints - Array of waypoint objects
   */
  addWaypointsToMap(waypoints) {
    const map = this.mapManager.getMap();
    if (!map) {
      console.error("Cannot add waypoints: map is not initialized");
      return;
    }
    
    // Validate waypoints array
    if (!waypoints || !Array.isArray(waypoints) || waypoints.length === 0) {
      console.warn("No valid waypoints to add to map");
      return;
    }
    
    console.log(`Adding ${waypoints.length} waypoints to map`);
    
    // Store the waypoints
    this.waypoints = waypoints;
    
    // Define function to add layers/source
    const addWaypointLayers = () => {
      const map = this.mapManager.getMap();
      if (!map) {
        console.error("Map unavailable when adding waypoints");
        return;
      }
      
      try {
        // Remove existing waypoint layers/source if they exist
        const waypointLayers = ['waypoints-layer', 'waypoints-labels'];
        
        waypointLayers.forEach(layerId => {
          if (map.getLayer(layerId)) {
            map.removeLayer(layerId);
          }
        });
        
        // Wait a moment for layer removal to complete
        setTimeout(() => {
          if (map.getSource('waypoints-source')) {
            map.removeSource('waypoints-source');
          }
          
          // Create features for GeoJSON
          const features = waypoints.map(waypoint => ({
            type: 'Feature',
            properties: {
              name: waypoint.name,
              type: waypoint.type || 'WAYPOINT'
            },
            geometry: {
              type: 'Point',
              coordinates: waypoint.coordinates
            }
          }));
          
          // Add source
          map.addSource('waypoints-source', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: features
            }
          });
          
          // Add waypoints layer - use a tiny bright yellow circle with thin dark outline
          map.addLayer({
            id: 'waypoints-layer',
            type: 'circle',
            source: 'waypoints-source',
            paint: {
              'circle-radius': 2,                // Tiny circles (2 pixels)
              'circle-color': '#FFCC00',         // Bright yellow
              'circle-stroke-width': 1,          // Thin stroke
              'circle-stroke-color': '#000000',  // Black outline
              'circle-opacity': 1                // Fully opaque
            }
          });
          
          // Add waypoint labels with white text and dark outline, visible only at certain zoom levels
          map.addLayer({
            id: 'waypoints-labels',
            type: 'symbol',
            source: 'waypoints-source',
            layout: {
              'text-field': ['get', 'name'],
              // Only show labels at zoom level 10 and above (since waypoints are now tiny)
              'text-size': [
                'interpolate',
                ['linear'],
                ['zoom'],
                9, 0,      // Hide text at zoom level 9 and below
                10, 10,    // Show medium text at zoom level 10
                12, 12     // Show larger text at zoom level 12+
              ],
              'text-anchor': 'top',
              'text-offset': [0, 0.5],           // Keep labels closer to the tiny points
              'text-allow-overlap': false,
              'text-ignore-placement': false,
              'text-max-width': 10,              // Wider text wrapping for readability
              'text-letter-spacing': 0.05        // Slightly increased letter spacing for readability
            },
            paint: {
              'text-color': '#FFFFFF',           // White text for better visibility
              'text-halo-color': '#000000',      // Black halo for contrast
              'text-halo-width': 1.8             // Medium halo thickness
            }
          });
          
          // Set visibility based on current mode
          const visibility = this.waypointModeActive ? 'visible' : 'none';
          map.setLayoutProperty('waypoints-layer', 'visibility', visibility);
          map.setLayoutProperty('waypoints-labels', 'visibility', visibility);
          
          // Trigger callback
          this.triggerCallback('onWaypointsLoaded', waypoints);
          
        }, 100);
      } catch (error) {
        console.error('Error adding waypoints to map:', error);
      }
    };
    
    // Use onMapLoaded to handle timing
    this.mapManager.onMapLoaded(addWaypointLayers);
  }
  
  /**
   * Toggle between platform mode and waypoint mode
   * @param {boolean} waypointMode - Whether to show waypoints (true) or platforms (false)
   */
  toggleWaypointMode(waypointMode) {
    console.log(`Toggling waypoint mode: ${waypointMode ? 'ON' : 'OFF'}`);
    
    const map = this.mapManager.getMap();
    if (!map) {
      console.error("Cannot toggle waypoint mode: map is not initialized");
      return;
    }
    
    this.waypointModeActive = waypointMode;
    
    // Hide/show the appropriate layers based on mode
    this.mapManager.onMapLoaded(() => {
      try {
        // Check if waypoints have been loaded
        if (waypointMode && (!this.waypoints || this.waypoints.length === 0)) {
          console.warn("No waypoints loaded yet - waypoint layers may not be visible");
          // We'll still try to toggle layers, but let's add a UI message
          if (window.LoadingIndicator) {
            window.LoadingIndicator.updateStatusIndicator(
              "No waypoints found. Please reload or try a different region.", 
              "warning"
            );
          }
        }
        
        // Log current layers for debugging
        const layers = map.getStyle().layers.map(l => l.id);
        console.log("Available map layers:", layers);
        
        // Platform layers
        const platformLayers = [
          'platforms-layer',
          'platforms-movable-layer',
          'platforms-fixed-labels',
          'platforms-movable-labels',
          'airfields-layer',
          'airfields-labels'
        ];
        
        // Waypoint layers
        const waypointLayers = [
          'waypoints-layer',
          'waypoints-labels'
        ];
        
        // Show/hide layers based on mode
        if (waypointMode) {
          console.log("Setting waypoint mode ON - showing waypoint layers, hiding platform layers");
          
          // Hide platform layers
          platformLayers.forEach(layerId => {
            if (map.getLayer(layerId)) {
              console.log(`Hiding platform layer: ${layerId}`);
              map.setLayoutProperty(layerId, 'visibility', 'none');
            } else {
              console.log(`Platform layer not found: ${layerId}`);
            }
          });
          
          // Show waypoint layers if they exist
          let foundWaypointLayers = false;
          waypointLayers.forEach(layerId => {
            if (map.getLayer(layerId)) {
              console.log(`Showing waypoint layer: ${layerId}`);
              map.setLayoutProperty(layerId, 'visibility', 'visible');
              foundWaypointLayers = true;
            } else {
              console.log(`Waypoint layer not found: ${layerId}`);
            }
          });
          
          // If no waypoint layers were found but we have waypoints data, try adding them
          if (!foundWaypointLayers && this.waypoints && this.waypoints.length > 0) {
            console.log(`No waypoint layers found but we have ${this.waypoints.length} waypoints - adding to map now`);
            // Add waypoints to map if not already displayed
            this.addWaypointsToMap(this.waypoints);
          }
        } else {
          console.log("Setting waypoint mode OFF - showing platform layers, hiding waypoint layers");
          
          // Show platform layers
          platformLayers.forEach(layerId => {
            if (map.getLayer(layerId)) {
              console.log(`Showing platform layer: ${layerId}`);
              map.setLayoutProperty(layerId, 'visibility', 'visible');
            } else {
              console.log(`Platform layer not found: ${layerId}`);
            }
          });
          
          // Hide waypoint layers
          waypointLayers.forEach(layerId => {
            if (map.getLayer(layerId)) {
              console.log(`Hiding waypoint layer: ${layerId}`);
              map.setLayoutProperty(layerId, 'visibility', 'none');
            } else {
              console.log(`Waypoint layer not found: ${layerId}`);
            }
          });
        }
      } catch (error) {
        console.error('Error toggling waypoint mode:', error);
        
        // Show error message to user
        if (window.LoadingIndicator) {
          window.LoadingIndicator.updateStatusIndicator(
            `Error toggling waypoint mode: ${error.message}`, 
            "error"
          );
        }
      }
    });
  }
}

export default PlatformManager;