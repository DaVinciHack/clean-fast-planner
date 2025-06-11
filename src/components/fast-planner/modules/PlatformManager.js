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
    this.airfieldsVisible = true;
    this.fixedPlatformsVisible = true;
    this.movablePlatformsVisible = true;
    this.blocksVisible = true; // New visibility state for blocks
    this.basesVisible = true; // New visibility state for bases
    this.fuelAvailableVisible = false; // New visibility state for fuel available overlay
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
            $pageSize: 20000, // Increased to handle 14K+ objects in Gulf of Mexico
            // Removed additional filter: no longer excluding reporting points
          });
        
        
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
            // Log a sample of platform names
            const samplePlatforms = result.data
              .filter(item => !item.ISAIRPORT && !item.isAirport)
              .slice(0, 5)
              .map(item => item.locName || "Unknown");
          }
        }
        
        
        // Double-check that we're getting the right region
        if (result.data && result.data.length > 0) {
          // Count items by region to verify filtering is working
          const regionCount = {};
          result.data.forEach(item => {
            if (item.region) {
              regionCount[item.region] = (regionCount[item.region] || 0) + 1;
            }
          });
        }
          
        
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
            .fetchPage({ $pageSize: 20000 }); // Increased to handle 14K+ airports in Gulf of Mexico
            
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
            
            // Log some sample airports
            
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
            "GULF OF MEXICO": [], // Removed KHUM - should now load properly with increased pageSize
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
        let fixedPlatformCount = 0; // Legacy counter (will be removed)
        let movablePlatformCount = 0;
        let airportsCount = 0;
        let platformsCount = 0; // New counter for fixed platforms
        let blocksCount = 0; // New counter for blocks
        let basesCount = 0; // New counter for bases
        let fuelAvailableCount = 0; // New counter for fuel available locations
        
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
          let isPlatform = false; // New property for fixed platforms
          let isBlocks = false; // New property for blocks
          let hasFuel = false; // New property for fuel availability
          let isBases = false; // New property for bases
          
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
              
            // First check for Bases using the isBase field (much cleaner!)
            if (item.isbase === 'Y' || 
                item.isbase === 'y' || 
                item.isbase === 'Yes' || 
                item.isbase === 'yes' || 
                item.isbase === 'YES' ||
                item.isbase === true ||
                item.isbase === 'true' ||
                item.isbase === 1 ||
                item.isbase === '1') {
              isBases = true;
              isAirfield = false;
              isMovable = false;
              isPlatform = false;
              isBlocks = false;
            }
            // Then check for airfields (including all airfield types)
            else if (item.ISAIRPORT === 'Yes' || item.isAirport === 'Yes' || 
                upperType.includes('AIRPORT') || 
                upperType.includes('AIRFIELD') ||  // This catches all AIRFIELD types
                upperType.includes('HELIPORT')) {
              isAirfield = true;
              isMovable = false;
              isPlatform = false;
              isBlocks = false;
              isBases = false;
            }
            // Check for Blocks (specific category)
            else if (upperType.includes('BLOCKS')) {
              isBlocks = true;
              isAirfield = false;
              isMovable = false;
              isPlatform = false;
              isBases = false;
            }
            // Check for Movable platforms (your specific requirements)
            else if (upperType.includes('JACK-UP RIG') ||
                    upperType.includes('MOVEABLE') ||
                    upperType.includes('SEMI-SUBMERSIBLE') ||
                    upperType.includes('SHIP') ||
                    upperType.includes('TENSION LEG PLATFORM') ||
                    // Legacy support for existing movable types
                    upperType.includes('MOVABLE') ||
                    upperType.includes('VESSEL') ||
                    upperType.includes('JACK-UP') ||
                    upperType.includes('JACKUP') ||
                    upperType.includes('DRILL SHIP')) {
              isMovable = true;
              isAirfield = false;
              isPlatform = false;
              isBlocks = false;
              isBases = false;
            }
            // Check for Fixed Platforms (your specific requirements)
            else if (upperType.includes('FIXED PLATFORM') ||
                    upperType === 'FIXED PLATFORM' ||
                    upperType.includes('PLATFORMS') ||
                    upperType.includes('RIGS') ||
                    upperType.includes('FPSO') ||
                    // Legacy support for existing fixed platform types
                    (upperType.includes('FIXED') && upperType.includes('PLATFORM')) ||
                    upperType.includes('STATIC')) {
              isPlatform = true;
              isAirfield = false;
              isMovable = false;
              isBlocks = false;
              isBases = false;
            }
            // Legacy platform type detection (for backward compatibility)
            else if (upperType.includes('PLATFORM') || 
                    upperType.includes('RIG') ||
                    upperType.includes('TLP') ||
                    upperType.includes('SPAR') ||
                    upperType.includes('DRILL') ||
                    upperType.includes('PRODUCTION') ||
                    upperType.includes('OIL') ||
                    upperType.includes('GAS') ||
                    upperType.includes('JACKET') ||
                    (upperType.includes('OFFSHORE') && !upperType.includes('REPORTING'))) {
              
              // Default to fixed platform for legacy types
              isPlatform = true;
              isAirfield = false;
              isMovable = false;
              isBlocks = false;
              isBases = false;
            }
            // Gulf of Mexico special case - X prefixed platforms
            else if (item.region === "GULF OF MEXICO" && 
                    (name.startsWith('X') || name.startsWith('K'))) {
              isPlatform = true; // Default Gulf of Mexico platforms to fixed platforms
              isAirfield = false;
              isMovable = false;
              isBlocks = false;
              isBases = false;
            }
            // Skip other types
            else {
              continue; 
            }
          }
          
          // Check for fuel availability (applies to all platform types)
          if (item.fuelAvailable === 'Y' || 
              item.fuelAvailable === 'Yes' || 
              item.fuelAvailable === 'YES' ||
              item.fuel_available === 'Y' ||
              item.fuel_available === 'Yes' ||
              item.fuel_available === 'YES') {
            hasFuel = true;
          }
          
          // Special handling for specific key locations (without excessive logging)
          if (name === 'ENZV' || name === 'SVG' || name.includes('STAVANGER') || name.includes('SOLA')) {
            isAirfield = true;
            isPlatform = false;
            isMovable = false;
            isBlocks = false;
            isBases = false;
            
            // Ensure ENZV has correct coordinates if found
            if (name === 'ENZV' && (!coords || coords[0] === 0 || coords[1] === 0)) {
              coords = [5.6316667, 58.8816667]; // Correct coordinates for ENZV
            }
          }
          
          if (name === 'KHUM' || name.includes('HOUMA')) {
            isAirfield = true;
            isPlatform = false;
            isMovable = false;
            isBlocks = false;
            isBases = false;
            
            // Ensure KHUM has correct coordinates if found
            if (name === 'KHUM' && (!coords || coords[0] === 0 || coords[1] === 0)) {
              coords = [-90.65383, 29.55583]; // Correct coordinates for KHUM
            }
          }
          
          // Count by type for debugging
          if (isAirfield) {
            airportsCount++;
          } else if (isPlatform) {
            platformsCount++;
            fixedPlatformCount++; // Keep legacy counter for now
            // Debug: Log fixed platform types
            if (platformsCount <= 3) { // Only log first few to avoid spam
              console.log(`Fixed Platform found: "${name}" with type: "${type}"`);
            }
          } else if (isMovable) {
            movablePlatformCount++;
          } else if (isBlocks) {
            blocksCount++;
            // Debug: Log ALL blocks found (temporarily increase limit)
          } else if (isBases) {
            basesCount++;
            // Debug: Log ALL bases found with their isBase field value
            const baseField = item.isbase !== undefined ? item.isbase : 'not found';
            console.log(`Base found: "${name}" with isBase field: "${baseField}" and type: "${type}"`);
          }
          
          if (hasFuel) {
            fuelAvailableCount++;
          }
          
          // Add the processed location with new categorization
          locations.push({
            name: name,
            coordinates: coords,
            operator: type || 'Unknown',
            isAirfield: isAirfield,
            isMovable: isMovable,
            isPlatform: isPlatform,
            isBlocks: isBlocks,
            isBases: isBases,
            hasFuel: hasFuel
          });
          
          // Mark as processed
          processedNames.add(name);
        }
        
        // Enhanced logging - show summary with new categories
        console.log(`Processed ${locations.length} locations:`);
        console.log(`  - ${airportsCount} airfields`);
        console.log(`  - ${platformsCount} platforms (fixed)`);
        console.log(`  - ${movablePlatformCount} movable platforms`);
        console.log(`  - ${blocksCount} blocks`);
        console.log(`  - ${basesCount} bases`);
        console.log(`  - ${fuelAvailableCount} locations with fuel available`);
        
        // Update loading indicator
        LoadingIndicator.updateText(loaderId, `Adding ${locations.length} locations to map...`);
        
        // Add to map even if few or no locations found - this will at least show what we got
        
        // Check if we have at least some locations
        if (locations.length > 0) {
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
   * Enhanced with safety checks and proper sequencing.
   * @private
   */
  _removePlatformLayersAndSource() {
    // Ensure map manager exists before trying to get the map
    if (!this.mapManager) {
      console.warn("PlatformManager: No map manager available for _removePlatformLayersAndSource");
      return;
    }
    
    const map = this.mapManager.getMap();
    
    // Ensure map is loaded and available
    if (!map) {
      console.warn("PlatformManager: Map not available for _removePlatformLayersAndSource");
      return;
    }

    // REMOVED: This check was preventing proper layer cleanup during a controlled region data reload.
    // The window.isRegionLoading flag (checked by interaction handlers) should suffice to pause user clicks.
    // PlatformManager needs to be able to clear its own layers during its refresh cycle.
    // if (window.regionState && window.regionState.isChangingRegion) {
    //   console.log("PlatformManager: Skipping layer removal during region change");
    //   return;
    // }

    const layerIds = [
      'platforms-fixed-labels',
      'platforms-movable-labels',
      'airfields-labels',
      'blocks-labels',           // New blocks labels
      'bases-labels',            // New bases labels
      'fuel-available-labels',   // New fuel available labels
      'platforms-fixed-layer',
      'platforms-movable-layer',
      'airfields-layer',
      'blocks-layer',            // New blocks layer
      'bases-layer',             // New bases layer
      'fuel-available-layer',    // New fuel available layer
      'platforms-layer' // Generic layer name, just in case it was used previously
    ];
    const sourceId = 'major-platforms';

    console.log("PlatformManager: Removing platform layers and source");

    // First, hide all layers to prevent visual flickering
    layerIds.forEach(layerId => {
      try {
        if (map.getLayer && typeof map.getLayer === 'function' && map.getLayer(layerId)) {
          map.setLayoutProperty(layerId, 'visibility', 'none');
        }
      } catch (e) {
        // Safely ignore errors when setting visibility
      }
    });

    // Then remove each layer with proper error handling
    // IMPORTANT: Remove in the correct order - labels first, then main layers
    for (const layerId of layerIds) {
      try {
        if (map.getLayer && typeof map.getLayer === 'function' && map.getLayer(layerId)) {
          map.removeLayer(layerId);
          console.log(`PlatformManager: Removed layer ${layerId}`);
        }
      } catch (e) {
        console.warn(`PlatformManager: Error removing layer ${layerId}: ${e.message}`);
      }
    }
    
    // Finally remove the source after all layers are removed
    try {
      if (map.getSource && typeof map.getSource === 'function' && map.getSource(sourceId)) {
        map.removeSource(sourceId);
        console.log(`PlatformManager: Removed source ${sourceId}`);
      }
    } catch (e) {
      console.warn(`PlatformManager: Error removing source ${sourceId}: ${e.message}`);
    }
  }
  
  /**
   * Clear all platforms from the map
   */
  clearPlatforms() {
    // Check map manager first
    if (!this.mapManager) {
      console.warn('PlatformManager: No map manager available for clearPlatforms');
      this.platforms = []; // Still clear the internal platform data
      return;
    }
    
    const map = this.mapManager.getMap();
    if (!map) {
      console.warn('PlatformManager: Map not available for clearPlatforms');
      this.platforms = []; // Still clear the internal platform data
      return;
    }
    
    console.log('PlatformManager: Clearing all platforms from map');
    
    // Check if the map is loaded before using onMapLoaded
    if (this.mapManager.isMapLoaded()) {
      // Map is loaded, directly remove layers and sources
      this._removePlatformLayersAndSource();
      this.platforms = []; // Clear the internal platform data
      console.log('PlatformManager: Platforms cleared from map and data store');
    } else {
      // Map is not loaded yet, queue it for when the map loads
      console.log('PlatformManager: Map not loaded, queuing platform clearing');
      this.mapManager.onMapLoaded(() => {
        this._removePlatformLayersAndSource();
        this.platforms = []; // Clear the internal platform data
        console.log('PlatformManager: Platforms cleared from map and data store (deferred)');
      });
    }
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

      this.platforms = platforms; // Store the platforms

      const sourceId = 'major-platforms';

      // Prepare features for GeoJSON source with enhanced categorization
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
          isPlatform: p.isPlatform || false,
          isBlocks: p.isBlocks || false,
          isBases: p.isBases || false,
          hasFuel: p.hasFuel || false,
          // Enhanced platform type categorization
          platformType: p.isAirfield ? 'airfield' : 
                       p.isPlatform ? 'fixed' :    // Fixed: use 'fixed' not 'platform'
                       p.isMovable ? 'movable' :
                       p.isBlocks ? 'blocks' :
                       p.isBases ? 'bases' : 'fixed'
        }
      }));

      const geoJsonData = {
        type: 'FeatureCollection',
        features: features
      };

      // Use the new centralized cleanup method
      this._removePlatformLayersAndSource(); // This removes old source and layers

      const addLayersForSource = () => {
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
                6, 0.8,    // Reduced from 1
                9, 1.5,    // Reduced from 2 
                12, 2.5,   // Reduced from 3
                15, 4      // Reduced from 5
              ],
              'circle-color': '#0a0f1e',       // Halfway between original and darker blue
              'circle-stroke-width': 2,
              'circle-stroke-color': '#2563eb', // Halfway between original and darker blue stroke
              'circle-opacity': 1
            },
            layout: { // Add visibility toggle
                'visibility': this.fixedPlatformsVisible ? 'visible' : 'none'
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
                8, 2.5,    // Reduced from 3
                11, 3.5,   // Reduced from 4
                14, 4.5,   // Reduced from 5
                17, 6      // Reduced from 7
              ],
              'circle-color': '#961212',       // Halfway between original and darker red
              'circle-stroke-width': 1,
              'circle-stroke-color': '#e5e7eb', // Halfway between original and darker light ring
              'circle-opacity': 1
            },
            layout: { // Add visibility toggle
                'visibility': this.movablePlatformsVisible ? 'visible' : 'none'
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
                7, 0.7,    // Reduced from 0.8
                10, 0.9,   // Reduced from 1.0
                13, 1.1,   // Reduced from 1.2
                16, 1.3    // Reduced from 1.5
              ],
              'icon-allow-overlap': true,
              'icon-anchor': 'bottom', // From backup for pin-style
              'icon-offset': [0, -5],  // From backup
              'visibility': this.airfieldsVisible ? 'visible' : 'none'
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
                8, 7,      // Very small at zoom 8
                9, 8,      // Small at zoom 9      // Smaller text at zoom 9
                10, 9,     // Small text at zoom 10
                12, 11,    // Medium text at zoom 12
                15, 13     // Larger text at high zoom     // Larger text at high zoom
              ],
              'text-offset': [0, 1.2],
              'text-anchor': 'top',
              'visibility': this.fixedPlatformsVisible ? 'visible' : 'none'},
            paint: {
              'text-color': '#ffffff',
              'text-halo-color': '#000000',
              'text-halo-width': 0.5,
              'text-opacity': [
                'interpolate', ['linear'], ['zoom'],
                7, 0,      // Hidden at zoom 7 and below
                7.5, 0.3,  // Start fading in at zoom 7.5
                8, 0.7,    // More visible at zoom 8
                8.5, 1     // Fully visible at zoom 8.5+       // Fully visible at zoom 9+      // Fully visible at zoom 10+      // Fully visible at zoom 12+
              ]
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
                            'visibility': this.movablePlatformsVisible ? 'visible' : 'none'},
            paint: {
              'text-color': '#ffffff',
              'text-halo-color': '#000000',
              'text-halo-width': 0.5,
              'text-opacity': [
                'interpolate', ['linear'], ['zoom'],
                7, 0,      // Hidden at zoom 7 and below
                7.5, 0.3,  // Start fading in at zoom 7.5
                8, 0.7,    // More visible at zoom 8
                8.5, 1     // Fully visible at zoom 8.5+       // Fully visible at zoom 9+      // Fully visible at zoom 10+      // Fully visible at zoom 12+
              ]
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
              'visibility': this.airfieldsVisible ? 'visible' : 'none'},
            paint: {
              'text-color': '#ffffff',
              'text-halo-color': '#000000',
              'text-halo-width': 0.5
            }
          });

          // Layer for Blocks (new category)
          map.addLayer({
            id: 'blocks-layer',
            type: 'circle',
            source: sourceId,
            filter: ['all', ['==', ['get', 'platformType'], 'blocks']],
            paint: { 
              'circle-radius': [
                'interpolate', ['linear'], ['zoom'],
                7, 1,      // Tiny dots at low zoom
                10, 1.5,   // Still tiny at medium zoom 
                13, 2,     // Small dots at high zoom
                16, 3      // Medium dots at very high zoom (much smaller than before)
              ],
              'circle-color': '#7B68EE',       // Brown color for blocks
              'circle-stroke-width': 0.5,     // Thinner stroke for tiny dots
              'circle-stroke-color': '#D2691E', // Lighter brown ring
              'circle-opacity': 1
            },
            layout: {
                'visibility': this.blocksVisible ? 'visible' : 'none'
            }
          });

          // Labels for Blocks
          map.addLayer({
            id: 'blocks-labels',
            type: 'symbol',
            source: sourceId,
            filter: ['all', ['==', ['get', 'platformType'], 'blocks']],
            layout: {
              'text-field': ['get', 'name'],
              'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
              'text-size': [
                'interpolate', ['linear'], ['zoom'],
                8, 6.5,    // Just a fraction bigger at zoom 8
                9, 7,      // Just a fraction bigger at zoom 9
                10, 7.5,   // Just a fraction bigger at zoom 10
                11, 8.5,   // Just a fraction bigger at zoom 11
                13, 9.5,   // Just a fraction bigger at zoom 13
                16, 11.5   // Just a fraction bigger at high zoom
              ],
              'text-offset': [0, 0.8],  // Closer to the tiny dots
              'text-anchor': 'top',
              'visibility': this.blocksVisible ? 'visible' : 'none'},
            paint: {
              'text-color': '#888888',    // Grey color for block labels
              'text-halo-color': '#000000',
              'text-halo-width': 0.5,
              'text-opacity': [
                'interpolate', ['linear'], ['zoom'],
                7, 0,      // Hidden at zoom 7 and below
                7.5, 0.3,  // Start fading in at zoom 7.5
                8, 0.7,    // More visible at zoom 8
                8.5, 1     // Fully visible at zoom 8.5+       // Fully visible at zoom 9+      // Fully visible at zoom 11+      // Fully visible at zoom 13+
              ]
            }
          });

          // Layer for Bases (new category) - bright purple/magenta rings
          map.addLayer({
            id: 'bases-layer',
            type: 'circle',
            source: sourceId,
            filter: ['all', ['==', ['get', 'platformType'], 'bases']],
            paint: { 
              'circle-radius': [
                'interpolate', ['linear'], ['zoom'],
                7, 5,      // Larger ring to go over airport rings
                10, 7,     // Medium ring
                13, 10,    // Larger ring
                16, 14     // Large ring at high zoom
              ],
              'circle-color': 'rgba(255, 105, 180, 0.3)',  // Transparent magenta fill
              'circle-stroke-width': 2,
              'circle-stroke-color': '#FF69B4',          // Bright magenta ring
              'circle-opacity': 0.6
            },
            layout: {
                'visibility': this.basesVisible ? 'visible' : 'none'
            }
          });

          // Labels for Bases
          map.addLayer({
            id: 'bases-labels',
            type: 'symbol',
            source: sourceId,
            filter: ['all', ['==', ['get', 'platformType'], 'bases']],
            layout: {
              'text-field': ['get', 'name'],
              'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
              'text-size': [
                'interpolate', ['linear'], ['zoom'],
                8, 7,      // Very small at zoom 8
                9, 8,      // Small at zoom 9
                10, 9,     // Small text at zoom 10
                12, 11,    // Medium text at zoom 12
                15, 13     // Larger text at high zoom
              ],
              'text-offset': [0, 1.2],  // Position below the ring
              'text-anchor': 'top',
              'visibility': this.basesVisible ? 'visible' : 'none'
            },
            paint: {
              'text-color': '#FFFFFF',    // White text
              'text-halo-color': '#000000',
              'text-halo-width': 1
            }
          });

          // Layer for Fuel Available Overlay (ring around platforms with fuel)
          map.addLayer({
            id: 'fuel-available-layer',
            type: 'circle',
            source: sourceId,
            filter: ['all', ['==', ['get', 'hasFuel'], true]],
            paint: { 
              'circle-radius': [
                'interpolate', ['linear'], ['zoom'],
                7, 3,      // Smaller ring to surround existing markers
                10, 4,     // Smaller ring
                13, 6,     // Medium ring  
                16, 8      // Smaller ring even at high zoom
              ],
              'circle-color': 'rgba(255, 215, 0, 0.05)', // Much more transparent gold fill
              'circle-stroke-width': 1.5,                // Thinner stroke
              'circle-stroke-color': '#FFD700',          // Bright gold ring (restored)
              'circle-opacity': 0.4                      // Keep lower opacity
            },
            layout: {
                'visibility': this.fuelAvailableVisible ? 'visible' : 'none'
            }
          });

          // Labels for Fuel Available (show platform name)
          map.addLayer({
            id: 'fuel-available-labels',
            type: 'symbol',
            source: sourceId,
            filter: ['all', ['==', ['get', 'hasFuel'], true]],
            layout: {
              'text-field': ['get', 'name'],  // Show platform name
              'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
              'text-size': [
                'interpolate', ['linear'], ['zoom'],
                8, 7,      // Very small at zoom 8
                9, 8,      // Small at zoom 9
                10, 9,     // Small text at zoom 10
                12, 11,    // Medium text at zoom 12
                15, 13     // Larger text at high zoom
              ],
              'text-offset': [0, -1.2],  // Position above the marker
              'text-anchor': 'bottom',
              'visibility': this.fuelAvailableVisible ? 'visible' : 'none'
            },
            paint: {
              'text-color': '#B8860B',    // Darker gold text (less bright)
              'text-halo-color': '#000000',
              'text-halo-width': 1
            }
          });
          
          console.log('PlatformManager: Platform layers added/updated.');
          
          // Ensure UI is synced with actual layer visibility
          this._syncUIWithLayers();
          
          // Set up style change listener for layer restoration
          this.setupStyleChangeListener();
          
          this.triggerCallback('onPlatformsLoaded', platforms);
        } catch (error) {
          console.error('PlatformManager: Error adding platform layers:', error);
          this.triggerCallback('onError', 'Error adding platform layers: ' + error.message);
        }
      }; // Function definition ends
      
      // Add new source
      try {
        map.addSource(sourceId, {
          type: 'geojson',
          data: geoJsonData,
          cluster: false
        });

        // Wait for the source to be ready before adding layers
        // This is crucial if addSource is async or if setData on an existing source is async
        if (map.isSourceLoaded(sourceId)) {
          addLayersForSource();
        } else {
          const onSourceData = (e) => {
            if (e.sourceId === sourceId && e.isSourceLoaded) {
              map.off('sourcedata', onSourceData); // Important to remove listener
              addLayersForSource();
            }
          };
          map.on('sourcedata', onSourceData);
        }
      } catch (error) {
        console.error('PlatformManager: Error adding platform source:', error);
        this.triggerCallback('onError', 'Error adding platform source: ' + error.message);
      }
    });
  }
  
  /**
   * Toggle visibility of all platforms and airfields
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
   * Toggle visibility of airfields only
   * @param {boolean} [visible] - If provided, set to this value instead of toggling
   * @returns {boolean} - The new visibility state for airfields
   */
  toggleAirfieldsVisibility(visible) {
    const map = this.mapManager.getMap();
    if (!map) return false;
    
    // Store airfields visibility state
    this.airfieldsVisible = visible !== undefined ? visible : !this.airfieldsVisible;
    
    try {
      // Airfield-specific layers
      const airfieldLayers = [
        'airfields-layer',    // Airfield markers
        'airfields-labels'    // Airfield labels
      ];
      
      const visibility = this.airfieldsVisible ? 'visible' : 'none';
      
      airfieldLayers.forEach(layerId => {
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(layerId, 'visibility', visibility);
        }
      });
      
      console.log(`Airfields visibility set to: ${visibility}`);
    } catch (error) {
      console.warn('Error toggling airfield visibility:', error);
    }
    
    return this.airfieldsVisible;
  }
  
  /**
   * Toggle visibility of fixed platforms only
   * @param {boolean} [visible] - If provided, set to this value instead of toggling
   * @returns {boolean} - The new visibility state for fixed platforms
   */
  toggleFixedPlatformsVisibility(visible) {
    const map = this.mapManager.getMap();
    if (!map) return false;
    
    // Store fixed platforms visibility state
    this.fixedPlatformsVisible = visible !== undefined ? visible : !this.fixedPlatformsVisible;
    
    try {
      // Fixed platform markers (always follow visibility setting)
      const fixedPlatformMarkers = [
        'platforms-layer',         // Legacy layer name
        'platforms-fixed-layer'    // Fixed platform markers
      ];
      
      const visibility = this.fixedPlatformsVisible ? 'visible' : 'none';
      
      fixedPlatformMarkers.forEach(layerId => {
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(layerId, 'visibility', visibility);
        }
      });
      
      // Fixed platform labels (zoom-dependent visibility)
      if (map.getLayer('platforms-fixed-labels')) {
        const visibility = this.fixedPlatformsVisible ? 'visible' : 'none';
        map.setLayoutProperty('platforms-fixed-labels', 'visibility', visibility);
        console.log(`PlatformManager: Platform labels visibility set to: ${visibility}`);
      }
      
      console.log(`Fixed platforms visibility set to: ${visibility}`);
    } catch (error) {
      console.warn('Error toggling fixed platform visibility:', error);
    }
    
    return this.fixedPlatformsVisible;
  }
  
  /**
   * Toggle visibility of movable platforms only
   * @param {boolean} [visible] - If provided, set to this value instead of toggling
   * @returns {boolean} - The new visibility state for movable platforms
   */
  toggleMovablePlatformsVisibility(visible) {
    const map = this.mapManager.getMap();
    if (!map) return false;
    
    // Store movable platforms visibility state
    this.movablePlatformsVisible = visible !== undefined ? visible : !this.movablePlatformsVisible;
    
    try {
      // Movable platform-specific layers
      const movablePlatformLayers = [
        'platforms-movable-layer',    // Movable platform markers
        'platforms-movable-labels'    // Movable platform labels
      ];
      
      const visibility = this.movablePlatformsVisible ? 'visible' : 'none';
      
      movablePlatformLayers.forEach(layerId => {
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(layerId, 'visibility', visibility);
        }
      });
      
      console.log(`Movable platforms visibility set to: ${visibility}`);
    } catch (error) {
      console.warn('Error toggling movable platform visibility:', error);
    }
    
    return this.movablePlatformsVisible;
  }

  /**
   * Toggle visibility of blocks only
   * @param {boolean} [visible] - If provided, set to this value instead of toggling
   * @returns {boolean} - The new visibility state for blocks
   */
  toggleBlocksVisibility(visible) {
    const map = this.mapManager.getMap();
    if (!map) return false;
    
    // Store blocks visibility state
    this.blocksVisible = visible !== undefined ? visible : !this.blocksVisible;
    
    try {
      // Blocks markers (always follow visibility setting)
      if (map.getLayer('blocks-layer')) {
        const visibility = this.blocksVisible ? 'visible' : 'none';
        map.setLayoutProperty('blocks-layer', 'visibility', visibility);
      }
      
      // Blocks labels (zoom-dependent visibility)
      if (map.getLayer('blocks-labels')) {
        const visibility = this.blocksVisible ? 'visible' : 'none';
        map.setLayoutProperty('blocks-labels', 'visibility', visibility);
        console.log(`PlatformManager: Block labels visibility set to: ${visibility}`);
      }
      
      console.log(`Blocks visibility set to: ${this.blocksVisible ? 'visible' : 'none'}`);
    } catch (error) {
      console.warn('Error toggling blocks visibility:', error);
    }
    
    return this.blocksVisible;
  }

  /**
   * Toggle visibility of fuel available locations overlay
   * @param {boolean} [visible] - If provided, set to this value instead of toggling
   * @returns {boolean} - The new visibility state for fuel available overlay
   */
  toggleFuelAvailableVisibility(visible) {
    const map = this.mapManager.getMap();
    if (!map) return false;
    
    // Store fuel available visibility state
    this.fuelAvailableVisible = visible !== undefined ? visible : !this.fuelAvailableVisible;
    
    try {
      // FUEL RINGS AND LABELS - Show both when fuel layer is enabled
      const fuelAvailableLayers = [
        'fuel-available-layer',        // Fuel rings
        'fuel-available-labels'        // Fuel labels (now show platform names)
      ];
      
      const visibility = this.fuelAvailableVisible ? 'visible' : 'none';
      
      fuelAvailableLayers.forEach(layerId => {
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(layerId, 'visibility', visibility);
        }
      });
      
      console.log(`Fuel available overlay and labels visibility set to: ${visibility}`);
    } catch (error) {
      console.warn('Error toggling fuel available visibility:', error);
    }
    
    return this.fuelAvailableVisible;
  }

  /**
   * Toggle visibility of bases only
   * @param {boolean} [visible] - If provided, set to this value instead of toggling
   * @returns {boolean} - The new visibility state for bases
   */
  toggleBasesVisibility(visible) {
    const map = this.mapManager.getMap();
    if (!map) return false;
    
    // Store bases visibility state
    this.basesVisible = visible !== undefined ? visible : !this.basesVisible;
    
    try {
      // Bases-specific layers
      const basesLayers = [
        'bases-layer',        // Bases markers
        'bases-labels'        // Bases labels
      ];
      
      const visibility = this.basesVisible ? 'visible' : 'none';
      
      basesLayers.forEach(layerId => {
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(layerId, 'visibility', visibility);
        }
      });
      
      console.log(`Bases visibility set to: ${visibility}`);
    } catch (error) {
      console.warn('Error toggling bases visibility:', error);
    }
    
    return this.basesVisible;
  }
  
  /**
   * Sync UI button states with actual layer visibility
   * Called after layers are created to ensure consistency
   */
  _syncUIWithLayers() {
    const map = this.mapManager.getMap();
    if (!map) return;
    
    console.log('PlatformManager: Syncing UI with layer visibility states');
    console.log('Initial states:', {
      airfields: this.airfieldsVisible,
      platforms: this.fixedPlatformsVisible, 
      movable: this.movablePlatformsVisible,
      blocks: this.blocksVisible,
      bases: this.basesVisible,
      fuel: this.fuelAvailableVisible
    });
    
    // Force update all layers to match internal states
    if (map.getLayer('airfields-layer')) {
      map.setLayoutProperty('airfields-layer', 'visibility', this.airfieldsVisible ? 'visible' : 'none');
    }
    if (map.getLayer('platforms-fixed-layer')) {
      map.setLayoutProperty('platforms-fixed-layer', 'visibility', this.fixedPlatformsVisible ? 'visible' : 'none');
    }
    if (map.getLayer('platforms-movable-layer')) {
      map.setLayoutProperty('platforms-movable-layer', 'visibility', this.movablePlatformsVisible ? 'visible' : 'none');
    }
    if (map.getLayer('blocks-layer')) {
      map.setLayoutProperty('blocks-layer', 'visibility', this.blocksVisible ? 'visible' : 'none');
    }
    if (map.getLayer('bases-layer')) {
      map.setLayoutProperty('bases-layer', 'visibility', this.basesVisible ? 'visible' : 'none');
    }
    if (map.getLayer('fuel-available-layer')) {
      map.setLayoutProperty('fuel-available-layer', 'visibility', this.fuelAvailableVisible ? 'visible' : 'none');
    }
    
    // CRITICAL FIX: Also sync the LABEL layers to match their parent layer states
    // This fixes the issue where labels don't reappear after layer recreation
    if (map.getLayer('platforms-fixed-labels')) {
      map.setLayoutProperty('platforms-fixed-labels', 'visibility', this.fixedPlatformsVisible ? 'visible' : 'none');
      console.log(`PlatformManager: Platform labels visibility synced to: ${this.fixedPlatformsVisible ? 'visible' : 'none'}`);
    }
    if (map.getLayer('platforms-movable-labels')) {
      map.setLayoutProperty('platforms-movable-labels', 'visibility', this.movablePlatformsVisible ? 'visible' : 'none');
    }
    if (map.getLayer('blocks-labels')) {
      map.setLayoutProperty('blocks-labels', 'visibility', this.blocksVisible ? 'visible' : 'none');
      console.log(`PlatformManager: Block labels visibility synced to: ${this.blocksVisible ? 'visible' : 'none'}`);
    }
    if (map.getLayer('airfields-labels')) {
      map.setLayoutProperty('airfields-labels', 'visibility', this.airfieldsVisible ? 'visible' : 'none');
    }
    if (map.getLayer('bases-labels')) {
      map.setLayoutProperty('bases-labels', 'visibility', this.basesVisible ? 'visible' : 'none');
    }
    if (map.getLayer('fuel-available-labels')) {
      map.setLayoutProperty('fuel-available-labels', 'visibility', this.fuelAvailableVisible ? 'visible' : 'none');
    }
    
    console.log('PlatformManager: Layer visibility sync completed');
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
      'airfields-labels',
      'blocks-layer',           // New blocks layer
      'blocks-labels',          // New blocks labels
      'bases-layer',            // New bases layer
      'bases-labels',           // New bases labels
      'fuel-available-layer',   // New fuel available overlay
      'fuel-available-labels'   // New fuel available labels
    ];
    
    // Just set visibility property instead of removing layers
    platformLayerIds.forEach(layerId => {
      if (map.getLayer(layerId)) {
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
          .fetchPage({ $pageSize: 20000 });
        
        console.log(`PlatformManager: First query returned ${result1?.data?.length || 0} results`);
        
        // Second query: Without locationType filter to get everything
        console.log(`PlatformManager: Second Norway query without locationType filter`);
        const result2 = await client(locationObject)
          .where({ region: regionName })
          .fetchPage({ $pageSize: 20000 });
        
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
          .fetchPage({ $pageSize: 20000 });
        
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
   * Get OSDK waypoints
   * @returns {Array} - Array of OSDK waypoint objects
   */
  getOsdkWaypoints() {
    return this.osdkWaypoints || [];
  }
  
  /**
   * Find a platform/base by exact name match
   * @param {string} name - Name to search for
   * @returns {Object|null} - Platform object or null if not found
   */
  findPlatformByName(name) {
    if (!this.platforms || !name) return null;
    
    const searchName = name.toUpperCase().trim();
    return this.platforms.find(platform => 
      platform.name && platform.name.toUpperCase().trim() === searchName
    ) || null;
  }
  
  /**
   * Find an OSDK waypoint by exact name match
   * @param {string} name - Name to search for
   * @returns {Object|null} - Waypoint object or null if not found
   */
  findWaypointByName(name) {
    if (!this.osdkWaypoints || !name) return null;
    
    const searchName = name.toUpperCase().trim();
    return this.osdkWaypoints.find(waypoint => 
      waypoint.name && waypoint.name.toUpperCase().trim() === searchName
    ) || null;
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
      return platform;
    } else {
      console.log(`PlatformManager: No platform found with name: ${normalizedName}`);
      return null;
    }
  }

  /**
   * Restore platform layers after a map style change
   * Called when the map style is switched (e.g., to 3D)
   */
  restoreLayersAfterStyleChange() {
    console.log('🔄 PlatformManager: Restoring layers after style change...');
    
    if (!this.mapManager || !this.mapManager.getMap()) {
      console.warn('PlatformManager: Cannot restore layers - map not available');
      return;
    }

    const map = this.mapManager.getMap();
    const currentStyle = this.mapManager.getCurrentStyle?.() || 'dark';
    console.log(`🔄 Restoring layers for style: ${currentStyle}`);

    // Clear any existing layers first to avoid conflicts
    this._removePlatformLayersAndSource();

    // Re-add platform layers if we have platforms loaded
    if (this.platforms && this.platforms.length > 0) {
      console.log(`🔄 Restoring ${this.platforms.length} platforms`);
      
      // Add a small delay to ensure style is fully loaded
      setTimeout(() => {
        try {
          // Use lightweight restoration instead of full addPlatformsToMap to avoid loops
          this._restorePlatformLayersOnly();
          console.log('✅ Platform layers restored successfully');
          
          // 🚁 DISABLED FOR DEMO - Keep original beautiful styling intact
          const currentStyle = this.mapManager.getCurrentStyle?.() || 'dark';
          
          // 🚁 DISABLED 3D RIGS - Keep normal 2D rigs in all modes for now
          console.log(`🔍 STYLE CHECK: Current style is "${currentStyle}", keeping 2D rigs in all modes`);
          
          // AGGRESSIVE CLEANUP: Remove ALL possible 3D layers
          this.removeAll3DLayers();
          
          // Always clean up any existing 3D rigs and keep normal 2D rigs visible  
          const map = this.mapManager.getMap();
          if (map) {
            
            // Always show the normal circle layers (2D rigs) regardless of map style
            const circleLayers = ['platforms-fixed-layer', 'platforms-movable-layer'];
            circleLayers.forEach(layerId => {
              if (map.getLayer(layerId)) {
                console.log(`ℹ️ Keeping circle layer visible: ${layerId} in ${currentStyle} mode`);
                map.setLayoutProperty(layerId, 'visibility', this.isVisible ? 'visible' : 'none');
              }
            });
          }
          
          console.log(`🚁 3D functionality disabled - keeping normal 2D rigs in all modes`);
          
        } catch (error) {
          console.error('❌ Error restoring platform layers:', error);
          // Try again with basic layer setup
          setTimeout(() => {
            this.addBasicPlatformLayers();
          }, 500);
        }
      }, 200);
    }

    // Re-add OSDK waypoints if we have them loaded
    if (this.osdkWaypoints && this.osdkWaypoints.length > 0) {
      console.log(`🔄 Restoring ${this.osdkWaypoints.length} OSDK waypoints`);
      setTimeout(() => {
        try {
          this.addOsdkWaypointsToMap();
        } catch (error) {
          console.error('❌ Error restoring OSDK waypoints:', error);
        }
      }, 300);
    }
  }

  /**
   * Enhanced 3D platform layer restoration - for 3D map styles
   */
  _restorePlatformLayersFor3D() {
    const map = this.mapManager.getMap();
    if (!map || !this.platforms || this.platforms.length === 0) return;

    console.log('🎯 3D Enhanced platform layer restoration');
    
    // Use the enhanced 3D rendering for beautiful rigs
    this.addBasicPlatformLayers();
    
    // 🚁 DISABLED: 3D rigs functionality - keeping normal 2D rigs for now
    // setTimeout(() => {
    //   console.log('🚁 Adding 3D rigs on top for enhanced 3D mode');
    //   this.add3DRigsOnTopOfExistingLayers();
    // }, 500);
    console.log('🚁 3D rigs disabled - keeping normal 2D platform layers');
  }

  /**
   * Lightweight platform layer restoration - just re-adds layers without triggering events
   */
  _restorePlatformLayersOnly() {
    const map = this.mapManager.getMap();
    if (!map || !this.platforms || this.platforms.length === 0) return;

    console.log('🔄 Lightweight platform layer restoration (no events)');
    
    const sourceId = 'major-platforms';

    // Prepare simplified GeoJSON data
    const features = this.platforms.map(p => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: p.coordinates
      },
      properties: {
        name: p.name,
        platformType: p.isAirfield ? 'airfield' : 
                     p.isMovable ? 'movable' : 
                     p.isBlocks ? 'blocks' :
                     p.isBases ? 'bases' : 'fixed'
      }
    }));

    const geoJsonData = {
      type: 'FeatureCollection',
      features: features
    };

    // Add source if it doesn't exist
    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, {
        type: 'geojson',
        data: geoJsonData
      });
    } else {
      // Update existing source
      map.getSource(sourceId).setData(geoJsonData);
    }

    // Add basic platform layers without complex configuration
    const basicLayers = [
      {
        id: 'platforms-fixed-basic',
        filter: ['==', ['get', 'platformType'], 'fixed'],
        color: '#1976D2'
      },
      {
        id: 'platforms-movable-basic',
        filter: ['==', ['get', 'platformType'], 'movable'],
        color: '#FF6B6B'
      },
      {
        id: 'airfields-basic',
        filter: ['==', ['get', 'platformType'], 'airfield'],
        color: '#4CAF50'
      }
    ];

    basicLayers.forEach(config => {
      if (!map.getLayer(config.id)) {
        map.addLayer({
          id: config.id,
          type: 'circle',
          source: sourceId,
          filter: config.filter,
          paint: {
            'circle-radius': 3,
            'circle-color': config.color,
            'circle-stroke-width': 1,
            'circle-stroke-color': '#ffffff'
          }
        });
      }
    });

    console.log('✅ Lightweight platform restoration complete');
  }

  /**
   * Add basic platform layers with style-compatible properties
   */
  addBasicPlatformLayers() {
    const map = this.mapManager.getMap();
    if (!map || !this.platforms || this.platforms.length === 0) return;

    // CRITICAL: Prevent multiple simultaneous calls
    if (this._addingBasicLayers) {
      console.log('ℹ️ Basic platform layers already being added, skipping');
      return;
    }
    this._addingBasicLayers = true;

    
    const sourceId = 'major-platforms';
    const currentStyle = this.mapManager.getCurrentStyle?.() || 'dark';

    // Prepare simplified GeoJSON data
    const features = this.platforms.map(p => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: p.coordinates
      },
      properties: {
        name: p.name,
        platformType: p.isAirfield ? 'airfield' : 
                     p.isMovable ? 'movable' : 
                     p.isBlocks ? 'blocks' :
                     p.isBases ? 'bases' : 'fixed',
        height: p.deckHeight || 85, // Default rig height in feet
        orientation: p.orientation || 0 // Platform orientation in degrees
      }
    }));

    const geoJsonData = {
      type: 'FeatureCollection',
      features: features
    };

    try {
      // Add source
      if (!map.getSource(sourceId)) {
        map.addSource(sourceId, {
          type: 'geojson',
          data: geoJsonData
        });
      }

      // Add simple circle layers with basic properties only
      const layerConfigs = [
        {
          id: 'platforms-fixed-layer-basic',
          filter: ['==', ['get', 'platformType'], 'fixed'],
          color: '#3B82F6'
        },
        {
          id: 'platforms-movable-layer-basic', 
          filter: ['==', ['get', 'platformType'], 'movable'],
          color: '#10B981'
        },
        {
          id: 'platforms-airfield-layer-basic',
          filter: ['==', ['get', 'platformType'], 'airfield'], 
          color: '#F59E0B'
        }
      ];

      layerConfigs.forEach(config => {
        if (!map.getLayer(config.id)) {
          map.addLayer({
            id: config.id,
            type: 'circle',
            source: sourceId,
            filter: config.filter,
            paint: {
              'circle-radius': currentStyle === '3d' ? 2 : 4, // Smaller radius in 3D mode
              'circle-color': config.color,
              'circle-stroke-width': 1,
              'circle-stroke-color': '#ffffff'
            }
          });
        }
      });

      // 🚁 DISABLED: 3D rig models - keeping normal circles for now
      // if (currentStyle === '3d' || currentStyle === 'satellite') {
      //   this.add3DRigModels();
      // }
      console.log(`ℹ️ 3D rig models disabled - keeping normal circle markers in ${currentStyle} mode`);

      console.log('✅ Basic platform layers added successfully');
      
      // DEBUG: Log all circle layers on the map to find the blue discs
      setTimeout(() => {
        const allLayers = map.getStyle().layers;
        const circleLayers = allLayers.filter(l => l.type === 'circle');
        console.log('🔍 DEBUG: All circle layers on map:', circleLayers.map(l => ({
          id: l.id,
          paint: l.paint,
          source: l.source
        })));
      }, 500);
      
      // CRITICAL: Reset the flag to allow future legitimate calls
      this._addingBasicLayers = false;
    } catch (error) {
      console.error('❌ Error adding basic platform layers:', error);
      // CRITICAL: Reset flag even on error
      this._addingBasicLayers = false;
    }
  }

  /**
   * 🚁 ADD 3D RIG MODELS - The magic happens here!
   */
  add3DRigModels() {
    
    const map = this.mapManager.getMap();
    if (!map) {
      return;
    }


    // CRITICAL: Prevent infinite loop by checking if 3D layer already exists
    if (map.getLayer('3d-rigs-layer')) {
      console.log('ℹ️ 3D rigs layer already exists, skipping creation');
      this._adding3DModels = false;
      return;
    }


    // CRITICAL: Add flag to prevent multiple simultaneous calls
    if (this._adding3DModels) {
      console.log('ℹ️ 3D models already being added, skipping');
      return;
    }
    this._adding3DModels = true;


    // Check if Three.js is available
    if (typeof THREE === 'undefined') {
      console.error('❌ Three.js not loaded! Cannot create 3D rigs');
      this._adding3DModels = false;
      return;
    }


    // Get platforms that should have 3D models
    const rigsFor3D = this.platforms.filter(p => 
      (p.isPlatform || p.isMovable || (!p.isAirfield && !p.isBases)) && 
      p.coordinates && p.coordinates.length === 2
    );

    console.log(`🛢️ Creating 3D models for ${rigsFor3D.length} rigs`);
    if (rigsFor3D.length > 0) {
    }

    if (rigsFor3D.length === 0) {
      console.log('ℹ️ No rigs found for 3D modeling');
      // Let's see why no rigs were found
      const breakdown = {
        isPlatform: this.platforms.filter(p => p.isPlatform).length,
        isMovable: this.platforms.filter(p => p.isMovable).length,
        notAirfieldOrBases: this.platforms.filter(p => !p.isAirfield && !p.isBases).length,
        hasCoordinates: this.platforms.filter(p => p.coordinates && p.coordinates.length === 2).length
      };
      this._adding3DModels = false;
      return;
    }

    // Remove existing 3D layer if it exists
    if (map.getLayer('3d-rigs-layer')) {
      map.removeLayer('3d-rigs-layer');
    }

    // Create modelData for the layer
    const modelData = rigsFor3D.map(rig => ({
      coordinates: rig.coordinates,
      name: rig.name,
      height: rig.deckHeight || 85,
      orientation: rig.orientation || 0
    }));

    // Add custom 3D layer for rigs
    try {
      map.addLayer({
        id: '3d-rigs-layer',
        type: 'custom',
        renderingMode: '3d',
      
      onAdd: function(map, gl) {
        console.log('🛢️ Initializing 3D rig layer...');
        
        try {
          // Initialize Three.js scene
          this.camera = new THREE.Camera();
          this.scene = new THREE.Scene();
          this.renderer = new THREE.WebGLRenderer({
            canvas: map.getCanvas(),
            context: gl,
            antialias: true
          });
          
          this.renderer.autoClear = false;
          this.map = map;

          // Create 3D rig models
          modelData.forEach((rig, index) => {
            try {
              this.createRigModel(rig, index);
            } catch (error) {
              console.error(`❌ Error creating rig model for ${rig.name}:`, error);
            }
          });

          console.log(`✅ 3D rig layer initialized with ${modelData.length} models`);
          
        } catch (error) {
          console.error('❌ Error initializing 3D rig layer:', error);
        }
      },

      render: function(gl, matrix) {
        // Add occasional debug to verify rendering is happening
        if (Math.random() < 0.001) { // Log 1 in 1000 renders
          console.log('🎨 3D rig render cycle active');
        }
        
        try {
          // Set up camera matrix
          const halfFov = this.map.transform.fov / 2;
          const cameraToCenterDistance = 0.5 / Math.tan(halfFov) * this.map.transform.height;
          const cameraTranslateZ = this.map.transform.worldSize * 0.5 + cameraToCenterDistance;
          
          this.camera.projectionMatrix = new THREE.Matrix4()
            .makePerspective(
              -this.map.transform.width / 2, 
              this.map.transform.width / 2,
              this.map.transform.height / 2, 
              -this.map.transform.height / 2,
              cameraToCenterDistance, 
              cameraTranslateZ * 2
            );

          // Render the scene
          this.renderer.resetState();
          this.renderer.render(this.scene, this.camera);
          
        } catch (error) {
          console.error('❌ Error rendering 3D rigs:', error);
        }
      },

      createRigModel: function(rig, index) {
        console.log(`🛢️ Creating 3D model for ${rig.name} at [${rig.coordinates}]`);
        
        try {
          // Create a simple oil rig structure
          const rigGroup = new THREE.Group();

          // Platform deck (main structure) - MUCH BIGGER
          const deckGeometry = new THREE.BoxGeometry(0.01, 0.01, 0.002); // 10x bigger
          const deckMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x444444,
            transparent: true,
            opacity: 0.8
          });
          const deck = new THREE.Mesh(deckGeometry, deckMaterial);
          rigGroup.add(deck);

          // Helipad (bright yellow circle) - MUCH BIGGER and HIGHER
          const helipadGeometry = new THREE.CylinderGeometry(0.003, 0.003, 0.0005, 8); // 10x bigger
          const helipadMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xFFFF00 // Bright yellow
          });
          const helipad = new THREE.Mesh(helipadGeometry, helipadMaterial);
          helipad.position.set(0.002, 0.002, 0.001); // Higher position
          rigGroup.add(helipad);

          // Add a tall tower structure for visibility
          const towerGeometry = new THREE.CylinderGeometry(0.0005, 0.0005, 0.005, 6);
          const towerMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xFF0000 // Red tower for visibility
          });
          const tower = new THREE.Mesh(towerGeometry, towerMaterial);
          tower.position.set(0, 0, 0.0025); // Centered and tall
          rigGroup.add(tower);

          // Position the rig at correct coordinates using Mapbox's coordinate system
          const [lng, lat] = rig.coordinates;
          
          // Convert to Mapbox coordinates
          const mercatorCoord = mapboxgl.MercatorCoordinate.fromLngLat([lng, lat], 0);
          
          rigGroup.position.x = mercatorCoord.x;
          rigGroup.position.y = mercatorCoord.y;
          rigGroup.position.z = mercatorCoord.z;

          // Scale for Mapbox world - EXTREMELY LARGE SCALE FOR TESTING
          const scale = mercatorCoord.meterInMercatorCoordinateUnits();
          const massiveScale = scale * 10000; // 10,000x bigger - impossible to miss!
          rigGroup.scale.set(massiveScale, massiveScale, massiveScale);


          this.scene.add(rigGroup);
          console.log(`✅ Added MASSIVE 3D model ${index + 1} for ${rig.name}`);
          
        } catch (error) {
          console.error(`❌ Error in createRigModel for ${rig.name}:`, error);
        }
      }
    });

      console.log('🛢️ 3D rig layer added to map');
      
    } catch (error) {
      console.error('❌ Error adding 3D rig layer:', error);
    } finally {
      // CRITICAL: Reset the flag to allow future legitimate calls
      this._adding3DModels = false;
    }
  }

  /**
   * Set up automatic layer restoration on style change
   */
  setupStyleChangeListener() {
    window.addEventListener('map-style-changed', (event) => {
      const { newStyle, is3D } = event.detail;
      console.log(`🔄 RESTORE: PlatformManager received style change event: ${newStyle}, is3D: ${is3D}`);
      
      // AGGRESSIVE CLEANUP: Remove ALL possible 3D layers first
      this.removeAll3DLayers();
      
      if (newStyle === '3d') {
        // 3D MODE: Keep rigs OFF for clean view (no clutter)
        console.log('🔄 RESTORE: 3D mode - keeping rigs OFF for clean view');
        
        // Restore weather circles and alternate lines in 3D mode too
        this.restoreWeatherFeatures();
      } else {
        // 2D MODE: Restore rigs for navigation
        console.log('🔄 RESTORE: 2D mode - restoring rigs for navigation');
        setTimeout(() => {
          if (this.platforms && this.platforms.length > 0) {
            this.addPlatformsToMap(this.platforms);
          }
          
          // Restore weather circles and alternate lines
          this.restoreWeatherFeatures();
        }, 500);
      }
    });
  }

  /**
   * Remove problematic 3D platform layers to prevent discs
   */
  removeAll3DLayers() {
    const map = this.mapManager?.getMap();
    if (!map) return;
    
    console.log('🧹 CLEANUP: Removing problematic 3D platform layers (keeping weather circles)');
    
    // DON'T remove weather circles - they are legitimate weather visualization
    // The "horrible discs" were from 3D platform layers, not weather circles
    
    // ONLY remove problematic 3D PLATFORM layers - NOT weather circles or alternate lines
    const problematic3DLayerIds = [
      // Three.js custom PLATFORM layers only
      '3d-rigs-layer',
      'additive-3d-rigs-layer', 
      'fixed-3d-rigs-layer',
      'blocks-3d-rigs-layer',
      'platforms-3d-rigs-layer',
      'all-3d-rigs-layer',
      
      // Simple 3D PLATFORM marker layers only
      'simple-3d-rigs',
      'simple-3d-rigs-base',
      'simple-3d-rigs-deck', 
      'simple-3d-rigs-helipad',
      'simple-3d-rigs-center',
      
      // Real 3D extrusion PLATFORM layers (these were the discs!)
      'real-3d-rigs',
      'real-3d-rigs-helipad',
      'fill-extrusion-rigs'
      
      // DON'T remove weather circles or alternate lines - they are legitimate aviation layers
    ];
    
    // Remove ONLY problematic platform layer IDs
    problematic3DLayerIds.forEach(layerId => {
      if (map.getLayer(layerId)) {
        console.log(`🧹 Removing problematic platform layer: ${layerId}`);
        map.removeLayer(layerId);
      }
    });
    
    // Remove ONLY problematic platform sources
    const problematic3DSourceIds = [
      'simple-3d-rigs-source',
      'real-3d-rigs-source', 
      'blocks-3d-rigs-source',
      'platforms-3d-rigs-source'
      // DON'T remove weather-circles-source or weather alternate line sources
    ];
    
    problematic3DSourceIds.forEach(sourceId => {
      if (map.getSource(sourceId)) {
        console.log(`🧹 Removing problematic platform source: ${sourceId}`);
        map.removeSource(sourceId);
      }
    });
    
    console.log('🧹 CLEANUP: Complete - only problematic 3D platform layers removed (weather preserved)');
  }

  /**
   * Restore weather circles and alternate lines after map style change
   */
  restoreWeatherFeatures() {
    console.log('🌤️ RESTORE: Restoring weather circles and alternate lines...');
    
    // Use the same auto-load logic from MapManager
    if (this.mapManager && typeof this.mapManager.autoLoadWeatherCircles === 'function') {
      console.log('🌤️ RESTORE: Using MapManager autoLoadWeatherCircles');
      setTimeout(() => {
        this.mapManager.autoLoadWeatherCircles();
      }, 200);
    } else {
      console.log('🌤️ RESTORE: MapManager autoLoadWeatherCircles not available, trying direct restore');
      
      // Direct approach - check for existing weather data
      if (window.loadedWeatherSegments?.length > 0) {
        console.log('🌤️ RESTORE: Found loadedWeatherSegments, creating weather layer');
        setTimeout(async () => {
          try {
            const { default: WeatherCirclesLayer } = await import('./layers/WeatherCirclesLayer');
            const weatherLayer = new WeatherCirclesLayer(this.mapManager?.getMap());
            
            await weatherLayer.addWeatherCircles(window.loadedWeatherSegments);
            window.currentWeatherCirclesLayer = weatherLayer;
            console.log('✅ RESTORE: Weather circles and alternate lines restored');
          } catch (error) {
            console.error('❌ RESTORE: Error restoring weather features:', error);
          }
        }, 300);
      } else {
        console.log('🌤️ RESTORE: No weather data available for restoration');
      }
    }
  }

  /**
   * 🚁 ADD SIMPLE 3D-LOOKING MARKERS - Simpler approach that will definitely work
   */
  addSimple3DMarkers() {
    
    const map = this.mapManager.getMap();
    if (!map) {
      return;
    }

    // Remove ALL existing simple 3D layers first
    const simpleLayersToRemove = [
      'simple-3d-rigs', 'simple-3d-rigs-base', 'simple-3d-rigs-deck', 
      'simple-3d-rigs-helipad', 'simple-3d-rigs-center'
    ];
    
    simpleLayersToRemove.forEach(layerId => {
      if (map.getLayer(layerId)) {
        console.log(`🧹 Removing existing simple layer: ${layerId}`);
        map.removeLayer(layerId);
      }
    });

    // Remove simple source if exists
    if (map.getSource('simple-3d-rigs-source')) {
      map.removeSource('simple-3d-rigs-source');
    }

    // Get some platforms for testing
    const rigsFor3D = this.platforms.filter(p => 
      (p.isPlatform || p.isMovable || (!p.isAirfield && !p.isBases)) && 
      p.coordinates && p.coordinates.length === 2
    ).slice(0, 10); // Just first 10 for testing

    console.log(`🛢️ Creating simple 3D markers for ${rigsFor3D.length} rigs`);

    if (rigsFor3D.length === 0) {
      console.log('ℹ️ No rigs found for simple 3D markers');
      return;
    }

    // Create GeoJSON for 3D-style markers
    const features = rigsFor3D.map(rig => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: rig.coordinates
      },
      properties: {
        name: rig.name,
        type: '3d-rig'
      }
    }));

    const geoJsonData = {
      type: 'FeatureCollection',
      features: features
    };

    // Add source
    if (!map.getSource('simple-3d-rigs-source')) {
      map.addSource('simple-3d-rigs-source', {
        type: 'geojson',
        data: geoJsonData
      });
    }

    // Add layered circles to simulate 3D oil rig structure
    
    // Layer 1: Platform base (largest, dark)
    map.addLayer({
      id: 'simple-3d-rigs-base',
      type: 'circle',
      source: 'simple-3d-rigs-source',
      paint: {
        'circle-radius': 18,
        'circle-color': '#333333', // Dark platform base
        'circle-stroke-width': 2,
        'circle-stroke-color': '#666666'
      }
    });

    // Layer 2: Platform deck (medium, gray)
    map.addLayer({
      id: 'simple-3d-rigs-deck',
      type: 'circle',
      source: 'simple-3d-rigs-source',
      paint: {
        'circle-radius': 12,
        'circle-color': '#666666', // Gray deck
        'circle-stroke-width': 1,
        'circle-stroke-color': '#888888'
      }
    });

    // Layer 3: Helipad (small, bright yellow - most important for pilots!)
    map.addLayer({
      id: 'simple-3d-rigs-helipad',
      type: 'circle',
      source: 'simple-3d-rigs-source',
      paint: {
        'circle-radius': 6,
        'circle-color': '#FFFF00', // Bright yellow helipad
        'circle-stroke-width': 2,
        'circle-stroke-color': '#FF0000' // Red border for visibility
      }
    });

    // Layer 4: Center marker (tiny, white)
    map.addLayer({
      id: 'simple-3d-rigs-center',
      type: 'circle',
      source: 'simple-3d-rigs-source',
      paint: {
        'circle-radius': 2,
        'circle-color': '#FFFFFF' // White center point
      }
    });

    console.log(`✅ Added ${rigsFor3D.length} layered 3D-style oil rig markers!`);
  }

  /**
   * 🛢️ ADD REAL 3D RIG MODELS - Using Mapbox native 3D extrusion instead of Three.js
   */
  addReal3DRigModels() {
    
    const map = this.mapManager.getMap();
    if (!map) {
      return;
    }

    // Clean up ALL existing real 3D layers
    const layersToRemove = ['real-3d-rigs', 'real-3d-rigs-helipad'];
    layersToRemove.forEach(layerId => {
      if (map.getLayer(layerId)) {
        console.log(`🧹 Removing existing layer: ${layerId}`);
        map.removeLayer(layerId);
      }
    });

    // Remove source if exists
    if (map.getSource('real-3d-rigs-source')) {
      map.removeSource('real-3d-rigs-source');
    }

    // Get platforms for 3D modeling
    const rigsFor3D = this.platforms.filter(p => 
      (p.isPlatform || p.isMovable || (!p.isAirfield && !p.isBases)) && 
      p.coordinates && p.coordinates.length === 2
    ).slice(0, 3); // Just 3 for testing

    console.log(`🛢️ Creating REAL 3D models for ${rigsFor3D.length} rigs using POLYGON geometry`);

    if (rigsFor3D.length === 0) {
      console.log('ℹ️ No rigs found for real 3D modeling');
      return;
    }

    // Create POLYGON features (required for fill-extrusion)
    const features = rigsFor3D.map(rig => {
      const [lng, lat] = rig.coordinates;
      // Create a square polygon around the rig coordinates
      const size = 0.001; // Platform size in degrees
      
      return {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [lng - size, lat - size],
            [lng + size, lat - size], 
            [lng + size, lat + size],
            [lng - size, lat + size],
            [lng - size, lat - size] // Close the polygon
          ]]
        },
        properties: {
          name: rig.name,
          type: 'oil-rig',
          height: (rig.deckHeight || 85) * 0.3 // Convert feet to meters and scale for visibility
        }
      };
    });

    const geoJsonData = {
      type: 'FeatureCollection',
      features: features
    };


    // Add source for real 3D rigs
    map.addSource('real-3d-rigs-source', {
      type: 'geojson',
      data: geoJsonData
    });

    // Add 3D extruded layer using Mapbox's native 3D support
    map.addLayer({
      id: 'real-3d-rigs',
      type: 'fill-extrusion',
      source: 'real-3d-rigs-source',
      paint: {
        'fill-extrusion-color': '#444444', // Dark gray platform
        'fill-extrusion-height': ['get', 'height'], // Use height property
        'fill-extrusion-base': 0,
        'fill-extrusion-opacity': 0.9
      }
    });

    // Add bright helipad markers on top
    map.addLayer({
      id: 'real-3d-rigs-helipad',
      type: 'circle',
      source: 'real-3d-rigs-source',
      paint: {
        'circle-radius': 8,
        'circle-color': '#FFFF00', // Bright yellow
        'circle-stroke-width': 2,
        'circle-stroke-color': '#FF0000'
      }
    });

    console.log(`✅ Added ${rigsFor3D.length} REAL 3D extruded oil rigs with POLYGON geometry!`);
  }

  /**
   * Generate rig module layout for realistic platform representation
   */
  generateRigModules(rig) {
    // This will eventually contain real module data for pilot orientation
    return {
      helipad: { position: 'northeast', size: 'standard' },
      drillFloor: { position: 'center', active: true },
      cranes: [{ position: 'southwest' }, { position: 'southeast' }],
      accommodations: { position: 'northwest', capacity: 150 },
      fuelStorage: { position: 'south', capacity: '5000bbl' }
    };
  }

  /**
   * 🛢️ FIXED THREE.JS APPROACH - Proper WebGL integration
   */
  addFixed3DRigModels() {
    console.log(`🚁 FIXED Three.js approach - proper WebGL context handling`);
    
    const map = this.mapManager.getMap();
    if (!map) {
      console.log(`❌ No map available`);
      return;
    }

    // Clean up existing Three.js layer
    if (map.getLayer('fixed-3d-rigs-layer')) {
      console.log('🧹 Removing existing Three.js layer');
      map.removeLayer('fixed-3d-rigs-layer');
    }

    // Check Three.js availability
    if (typeof THREE === 'undefined') {
      console.error('❌ Three.js not loaded!');
      return;
    }

    console.log(`✅ Three.js available: ${THREE.REVISION}`);

    // Get a few platforms for testing
    const rigsFor3D = this.platforms.filter(p => 
      (p.isPlatform || p.isMovable || (!p.isAirfield && !p.isBases)) && 
      p.coordinates && p.coordinates.length === 2
    ).slice(0, 2); // Just 2 for testing

    console.log(`🛢️ Creating ${rigsFor3D.length} Three.js rigs`);

    if (rigsFor3D.length === 0) {
      console.log('❌ No rigs found');
      return;
    }

    // Store rig data for the layer
    const rigData = rigsFor3D.map(rig => ({
      coordinates: rig.coordinates,
      name: rig.name,
      height: rig.deckHeight || 85
    }));

    // Add Three.js custom layer with FIXED integration
    map.addLayer({
      id: 'fixed-3d-rigs-layer',
      type: 'custom',
      renderingMode: '3d',
      
      onAdd: function(map, gl) {
        console.log('🚁 Initializing FIXED Three.js layer');
        
        // Create Three.js scene with proper WebGL context
        this.camera = new THREE.Camera();
        this.scene = new THREE.Scene();
        
        // CRITICAL: Use the existing WebGL context from Mapbox
        this.renderer = new THREE.WebGLRenderer({
          canvas: map.getCanvas(),
          context: gl,
          antialias: true
        });
        
        this.renderer.autoClear = false;
        this.map = map;

        // Create rig models with PROPER scaling
        rigData.forEach((rig, index) => {
          this.createBetterRigModel(rig, index);
        });

        console.log(`✅ FIXED Three.js layer initialized with ${rigData.length} models`);
      },

      render: function(gl, matrix) {
        // MUCH SIMPLER camera setup
        this.camera.projectionMatrix = new THREE.Matrix4().fromArray(matrix);
        
        // Render with minimal state changes
        this.renderer.resetState();
        this.renderer.render(this.scene, this.camera);
      },

      createBetterRigModel: function(rig, index) {
        console.log(`🛢️ Creating BETTER rig model for ${rig.name}`);
        
        const [lng, lat] = rig.coordinates;
        
        // Convert to world coordinates 
        const worldCoords = mapboxgl.MercatorCoordinate.fromLngLat([lng, lat], 0);
        
        // Create rig group
        const rigGroup = new THREE.Group();
        
        // ABSOLUTELY MASSIVE GEOMETRY
        const size = 0.01; // Large size in world space
        
        // Platform deck (bright color for visibility)
        const deckGeometry = new THREE.BoxGeometry(size, size, size * 0.3);
        const deckMaterial = new THREE.MeshBasicMaterial({ 
          color: 0xFF0000 // BRIGHT RED
        });
        const deck = new THREE.Mesh(deckGeometry, deckMaterial);
        rigGroup.add(deck);

        // Helipad tower (even brighter)
        const towerGeometry = new THREE.BoxGeometry(size * 0.3, size * 0.3, size);
        const towerMaterial = new THREE.MeshBasicMaterial({ 
          color: 0xFFFF00 // BRIGHT YELLOW
        });
        const tower = new THREE.Mesh(towerGeometry, towerMaterial);
        tower.position.z = size * 0.5;
        rigGroup.add(tower);

        // Position in world space
        rigGroup.position.x = worldCoords.x;
        rigGroup.position.y = worldCoords.y;
        rigGroup.position.z = 0;

        this.scene.add(rigGroup);
        console.log(`✅ Added MASSIVE rig model ${index + 1} for ${rig.name}`);
      }
    });

    console.log('🚁 FIXED Three.js layer added to map');
  }

  /**
   * 🛢️ REPLACE ALL CIRCLES WITH 3D RIGS - Different shapes for different rig types!
   */
  replaceCirclesWith3DRigs() {
    console.log(`🚁 REPLACING ALL CIRCLES WITH 3D RIGS!`);
    
    const map = this.mapManager.getMap();
    if (!map) {
      console.log(`❌ No map available`);
      return;
    }

    // Clean up existing Three.js layer
    if (map.getLayer('all-3d-rigs-layer')) {
      console.log('🧹 Removing existing all-3d-rigs layer');
      map.removeLayer('all-3d-rigs-layer');
    }

    // Check Three.js availability
    if (typeof THREE === 'undefined') {
      console.error('❌ Three.js not loaded!');
      return;
    }

    console.log(`✅ Three.js available: ${THREE.REVISION}`);

    // Get ALL platforms and categorize them
    const allRigs = this.platforms.filter(p => 
      p.coordinates && p.coordinates.length === 2
    ).slice(0, 200); // More rigs now that they're smaller!

    console.log(`🛢️ Creating 3D models for ${allRigs.length} rigs of different types`);

    if (allRigs.length === 0) {
      console.log('❌ No rigs found');
      return;
    }

    // Categorize rigs by type
    const rigsByType = {
      fuel: allRigs.filter(p => p.hasFuel || p.fuelAvailable),
      platforms: allRigs.filter(p => p.isPlatform && !p.hasFuel),
      blocks: allRigs.filter(p => p.isBlocks),
      mobile: allRigs.filter(p => p.isMovable),
      other: allRigs.filter(p => !p.hasFuel && !p.isPlatform && !p.isBlocks && !p.isMovable)
    };

    console.log(`🔍 Rig breakdown: Fuel:${rigsByType.fuel.length}, Platforms:${rigsByType.platforms.length}, Blocks:${rigsByType.blocks.length}, Mobile:${rigsByType.mobile.length}, Other:${rigsByType.other.length}`);

    // Store rig data for the layer
    const rigData = allRigs.map(rig => ({
      coordinates: rig.coordinates,
      name: rig.name,
      type: rig.hasFuel ? 'fuel' : 
            rig.isPlatform ? 'platform' :
            rig.isBlocks ? 'blocks' :
            rig.isMovable ? 'mobile' : 'other',
      height: rig.deckHeight || 85
    }));

    // Add Three.js custom layer for ALL rigs
    map.addLayer({
      id: 'all-3d-rigs-layer',
      type: 'custom',
      renderingMode: '3d',
      
      onAdd: function(map, gl) {
        console.log('🚁 Initializing ALL 3D RIGS layer');
        
        // Create Three.js scene
        this.camera = new THREE.Camera();
        this.scene = new THREE.Scene();
        
        // Use Mapbox's WebGL context
        this.renderer = new THREE.WebGLRenderer({
          canvas: map.getCanvas(),
          context: gl,
          antialias: true
        });
        
        this.renderer.autoClear = false;
        this.map = map;

        // Create different rig models for each type
        rigData.forEach((rig, index) => {
          this.createRigByType(rig, index);
        });

        console.log(`✅ ALL 3D RIGS layer initialized with ${rigData.length} models`);
      },

      render: function(gl, matrix) {
        // Simple camera setup
        this.camera.projectionMatrix = new THREE.Matrix4().fromArray(matrix);
        
        // Render all rigs
        this.renderer.resetState();
        this.renderer.render(this.scene, this.camera);
      },

      createRigByType: function(rig, index) {
        const [lng, lat] = rig.coordinates;
        
        // Convert to world coordinates 
        const worldCoords = mapboxgl.MercatorCoordinate.fromLngLat([lng, lat], 0);
        
        // Create rig group
        const rigGroup = new THREE.Group();
        const size = 0.00003; // Tiny size
        
        // Create REALISTIC oil rig structure instead of simple shapes
        this.createRealisticRig(rigGroup, rig.type, size);

        // Position in world space
        rigGroup.position.x = worldCoords.x;
        rigGroup.position.y = worldCoords.y;
        rigGroup.position.z = 0;

        this.scene.add(rigGroup);
        
        if (index < 10) { // Only log first 10 to avoid spam
          console.log(`✅ Added realistic ${rig.type} rig for ${rig.name}`);
        }
      },

      createRealisticRig: function(rigGroup, rigType, size) {
        // REALISTIC GRAY COLORS - much more muted
        const colors = {
          platform: 0x666666,    // Medium gray
          deck: 0x555555,        // Darker gray  
          legs: 0x444444,        // Dark gray
          helipad: 0xFFDD00,     // Muted yellow
          crane: 0x333333,       // Very dark gray
          tower: 0x777777        // Light gray
        };

        // 1. CONICAL BASE (main platform structure) - FIXED ORIENTATION
        const baseGeometry = new THREE.ConeGeometry(size * 1.2, size * 0.8, 8);
        const baseMaterial = new THREE.MeshBasicMaterial({ color: colors.platform });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.z = size * 0.4; // Sitting on seafloor
        rigGroup.add(base);

        // 2. MAIN PLATFORM DECK (flat on top of base)
        const deckGeometry = new THREE.CylinderGeometry(size * 1.0, size * 1.0, size * 0.15, 8);
        const deckMaterial = new THREE.MeshBasicMaterial({ color: colors.deck });
        const deck = new THREE.Mesh(deckGeometry, deckMaterial);
        deck.position.z = size * 0.85; // On top of cone
        rigGroup.add(deck);

        // 3. EXTENDED DECK on one side (helicopter landing area)
        const heliDeckGeometry = new THREE.BoxGeometry(size * 0.8, size * 0.8, size * 0.1);
        const heliDeckMaterial = new THREE.MeshBasicMaterial({ color: colors.deck });
        const heliDeck = new THREE.Mesh(heliDeckGeometry, heliDeckMaterial);
        heliDeck.position.x = size * 1.0; // Extended to one side
        heliDeck.position.z = size * 0.95; // Same level as main deck
        rigGroup.add(heliDeck);

        // 4. SUPPORT LEGS (4 legs going down to seafloor)
        const legGeometry = new THREE.CylinderGeometry(size * 0.08, size * 0.12, size * 0.8, 6);
        const legMaterial = new THREE.MeshBasicMaterial({ color: colors.legs });
        
        const legPositions = [
          { x: size * 0.6, y: size * 0.6 },   // Front right
          { x: size * 0.6, y: -size * 0.6 },  // Back right
          { x: -size * 0.6, y: size * 0.6 },  // Front left
          { x: -size * 0.6, y: -size * 0.6 }  // Back left
        ];

        legPositions.forEach(pos => {
          const leg = new THREE.Mesh(legGeometry, legMaterial);
          leg.position.x = pos.x;
          leg.position.y = pos.y;
          leg.position.z = size * 0.4; // From seafloor to platform
          rigGroup.add(leg);
        });

        // 5. HELIPAD (on the extended deck)
        const helipadGeometry = new THREE.CylinderGeometry(size * 0.3, size * 0.3, size * 0.05, 8);
        const helipadMaterial = new THREE.MeshBasicMaterial({ color: colors.helipad });
        const helipad = new THREE.Mesh(helipadGeometry, helipadMaterial);
        helipad.position.x = size * 1.0; // On the extended deck
        helipad.position.z = size * 1.0; // On top of extended deck
        rigGroup.add(helipad);

        // 6. DRILLING TOWER (vertical tower in center)
        if (rigType === 'platform' || rigType === 'fuel') {
          const towerGeometry = new THREE.BoxGeometry(size * 0.12, size * 0.12, size * 1.5);
          const towerMaterial = new THREE.MeshBasicMaterial({ color: colors.tower });
          const tower = new THREE.Mesh(towerGeometry, towerMaterial);
          tower.position.z = size * 1.6; // Tall tower above platform
          rigGroup.add(tower);
        }

        // 7. CRANE ARM (horizontal arm for lifting)
        if (rigType === 'platform') {
          const craneGeometry = new THREE.BoxGeometry(size * 1.2, size * 0.06, size * 0.06);
          const craneMaterial = new THREE.MeshBasicMaterial({ color: colors.crane });
          const crane = new THREE.Mesh(craneGeometry, craneMaterial);
          crane.position.y = size * 0.8; // Extending from one side
          crane.position.z = size * 1.3; // Above the deck
          rigGroup.add(crane);
        }
      }
    });

    console.log('🚁 ALL 3D RIGS layer added to map - NO MORE CIRCLES!');
  }

  /**
   * 🛢️ ADD 3D RIGS ON TOP - Don't touch the beautiful original 2D styling!
   */
  add3DRigsOnTopOfExistingLayers() {
    console.log(`🚁 ADDING 3D rigs ON TOP of existing beautiful layers!`);
    
    const map = this.mapManager.getMap();
    if (!map) {
      console.log(`❌ No map available`);
      return;
    }

    // Clean up ONLY our 3D layer (don't touch original 2D layers!)
    if (map.getLayer('additive-3d-rigs-layer')) {
      console.log('🧹 Removing only our 3D layer, keeping original beautiful styling');
      map.removeLayer('additive-3d-rigs-layer');
    }

    // Check Three.js availability
    if (typeof THREE === 'undefined') {
      console.error('❌ Three.js not loaded!');
      return;
    }

    console.log(`✅ Three.js available - adding 3D models ON TOP of original styling`);

    // Get ONLY BLOCKS for 3D rig replacement
    const rigsFor3D = this.platforms.filter(p => 
      p.isBlocks && p.coordinates && p.coordinates.length === 2
    ); // All blocks, no limit
    
    console.log(`🎯 BLOCKS ONLY: Found ${rigsFor3D.length} blocks to replace with 3D rigs`);

    console.log(`🛢️ Creating 3D models for ${rigsFor3D.length} rigs ON TOP of existing styling`);

    if (rigsFor3D.length === 0) {
      console.log('❌ No rigs found');
      return;
    }

    // Store rig data for the layer
    const rigData = rigsFor3D.map(rig => ({
      coordinates: rig.coordinates,
      name: rig.name,
      type: rig.hasFuel ? 'fuel' : 
            rig.isPlatform ? 'platform' :
            rig.isBlocks ? 'blocks' :
            rig.isMovable ? 'mobile' : 'other'
    }));

    // Add Three.js custom layer ADDITIVELY (don't replace anything)
    map.addLayer({
      id: 'additive-3d-rigs-layer',
      type: 'custom',
      renderingMode: '3d',
      
      onAdd: function(map, gl) {
        console.log('🚁 Initializing ADDITIVE 3D RIGS layer - keeping original styling!');
        
        // Create Three.js scene
        this.camera = new THREE.Camera();
        this.scene = new THREE.Scene();
        
        // Use Mapbox's WebGL context
        this.renderer = new THREE.WebGLRenderer({
          canvas: map.getCanvas(),
          context: gl,
          antialias: true
        });
        
        this.renderer.autoClear = false;
        this.map = map;

        // Create simple 3D models that complement the original styling
        rigData.forEach((rig, index) => {
          this.createSimple3DRig(rig, index);
        });

        console.log(`✅ ADDITIVE 3D RIGS layer initialized - original styling preserved!`);
      },

      render: function(gl, matrix) {
        // Simple camera setup
        this.camera.projectionMatrix = new THREE.Matrix4().fromArray(matrix);
        
        // Render 3D models on top of original styling
        this.renderer.resetState();
        this.renderer.render(this.scene, this.camera);
      },

      createSimple3DRig: function(rig, index) {
        const [lng, lat] = rig.coordinates;
        
        // Convert to world coordinates 
        const worldCoords = mapboxgl.MercatorCoordinate.fromLngLat([lng, lat], 0);
        
        // SUPER SIMPLE: One leg + flat top - FORCE VERTICAL ORIENTATION
        const rigGroup = new THREE.Group();
        const size = 0.000015; // Half the previous size (was 0.00003)
        
        // 1. ONE VERTICAL LEG (cylinder) - SHORTER LEG
        const legGeometry = new THREE.CylinderGeometry(size * 0.3, size * 0.3, size * 2, 6); // Reduced from size * 3 to size * 2
        const legMaterial = new THREE.MeshBasicMaterial({ color: 0x444444 }); // Dark gray
        const leg = new THREE.Mesh(legGeometry, legMaterial);
        
        // ROTATE CYLINDER TO BE VERTICAL (Three.js cylinders are horizontal by default)
        leg.rotation.x = Math.PI / 2; // Rotate 90 degrees to make it stand up
        leg.rotation.y = 0;
        leg.rotation.z = 0;
        leg.position.x = 0; // Centered
        leg.position.y = 0; // Centered  
        leg.position.z = size * 1; // Adjust for shorter leg
        rigGroup.add(leg);

        // 2. FLAT TOP (simple box on top) - ADJUST FOR SHORTER LEG
        const deckGeometry = new THREE.BoxGeometry(size * 1.5, size * 1.5, size * 0.2);
        const deckMaterial = new THREE.MeshBasicMaterial({ color: 0x888888 }); // Gray
        const deck = new THREE.Mesh(deckGeometry, deckMaterial);
        
        // FORCE HORIZONTAL ORIENTATION
        deck.rotation.x = 0; // No rotation - should be flat
        deck.rotation.y = 0; // No rotation
        deck.rotation.z = 0; // No rotation
        deck.position.x = 0; // Centered on leg
        deck.position.y = 0; // Centered on leg
        deck.position.z = size * 2.1; // On top of shorter leg
        rigGroup.add(deck);

        // 3. TINY GREEN HELIPAD DOT on top (cylinder lying FLAT on deck)
        const helipadGeometry = new THREE.CylinderGeometry(size * 0.3, size * 0.3, size * 0.05, 6);
        const helipadMaterial = new THREE.MeshBasicMaterial({ color: 0x00AA00 }); // Green
        const helipad = new THREE.Mesh(helipadGeometry, helipadMaterial);
        
        // ROTATE HELIPAD TO LIE FLAT (same rotation as the leg but opposite direction)
        helipad.rotation.x = Math.PI / 2; // Rotate 90 degrees to make it flat like a landing pad
        helipad.rotation.y = 0;
        helipad.rotation.z = 0;
        helipad.position.x = 0;
        helipad.position.y = 0;
        helipad.position.z = size * 2.25; // On top of deck
        rigGroup.add(helipad);

        // REMOVED: Nameplate boxes - too big and no text capability yet
        // TODO: Add proper text rendering later - Three.js text is complex

        // FORCE THE ENTIRE GROUP TO BE UPRIGHT
        rigGroup.rotation.x = 0;
        rigGroup.rotation.y = 0;
        rigGroup.rotation.z = 0;

        // Position in world space - MOVE ENTIRE RIG SO DECK IS AT GROUND LEVEL
        rigGroup.position.x = worldCoords.x;
        rigGroup.position.y = worldCoords.y;
        rigGroup.position.z = -size * 2.1; // Move rig DOWN by deck height so deck ends up at z=0
        
        this.scene.add(rigGroup);
        
        if (index < 5) {
          console.log(`✅ Added rig for ${rig.name} - deck should be at ground level for pin landing!`);
        }
      }
    });

    console.log('🚁 ADDITIVE 3D layer added - original beautiful styling PRESERVED!');
    
    // REMOVED: Flashing Mapbox labels - using physical nameplates instead
  }

  /**
   * 🎯 REPLACE ALL BLOCKS WITH 3D RIGS - Dedicated function for blocks only
   */
  replaceBlocksWith3DRigs() {
    console.log(`🎯 REPLACING ALL BLOCKS WITH 3D RIGS!`);
    
    const map = this.mapManager.getMap();
    if (!map) {
      console.log(`❌ No map available`);
      return;
    }

    // Clean up any existing 3D layers
    if (map.getLayer('blocks-3d-rigs-layer')) {
      console.log('🧹 Removing existing blocks 3D layer');
      map.removeLayer('blocks-3d-rigs-layer');
    }
    
    // IMPORTANT: Hide regular block layers so 3D rigs show instead
    const blockLayers = [
      'platforms-blocks-layer', 'platforms-blocks-layer-basic'
    ];
    
    blockLayers.forEach(layerId => {
      if (map.getLayer(layerId)) {
        console.log(`🙈 Hiding regular block layer: ${layerId}`);
        map.setLayoutProperty(layerId, 'visibility', 'none');
      }
    });

    // Check Three.js availability
    if (typeof THREE === 'undefined') {
      console.error('❌ Three.js not loaded!');
      return;
    }

    console.log(`✅ Three.js available - replacing blocks with 3D rigs`);

    // Get ONLY blocks for replacement
    const blocksFor3D = this.platforms.filter(p => 
      p.isBlocks && p.coordinates && p.coordinates.length === 2
    );
    
    console.log(`🎯 Found ${blocksFor3D.length} blocks to replace with 3D rigs`);

    if (blocksFor3D.length === 0) {
      console.log('❌ No blocks found');
      return;
    }

    // Store block data for the layer
    const rigData = blocksFor3D.map(block => ({
      coordinates: block.coordinates,
      name: block.name,
      type: 'block'
    }));

    // Add Three.js custom layer for blocks replacement
    map.addLayer({
      id: 'blocks-3d-rigs-layer',
      type: 'custom',
      renderingMode: '3d',
      
      onAdd: function(map, gl) {
        console.log('🎯 Initializing BLOCKS 3D RIGS layer');
        
        // Create Three.js scene
        this.camera = new THREE.Camera();
        this.scene = new THREE.Scene();
        
        // Use Mapbox's WebGL context
        this.renderer = new THREE.WebGLRenderer({
          canvas: map.getCanvas(),
          context: gl,
          antialias: true
        });
        
        this.renderer.autoClear = false;
        this.map = map;

        // Create 3D rigs for each block
        rigData.forEach((block, index) => {
          this.createBlockRig(block, index);
        });

        console.log(`✅ BLOCKS 3D RIGS layer initialized with ${rigData.length} rigs!`);
      },

      render: function(gl, matrix) {
        // Simple camera setup
        this.camera.projectionMatrix = new THREE.Matrix4().fromArray(matrix);
        
        // Render 3D rigs
        this.renderer.resetState();
        this.renderer.render(this.scene, this.camera);
      },

      createBlockRig: function(block, index) {
        const [lng, lat] = block.coordinates;
        
        // Convert to world coordinates 
        const worldCoords = mapboxgl.MercatorCoordinate.fromLngLat([lng, lat], 0);
        
        // Create SUPER SIMPLE and TINY 3D rig for blocks
        const rigGroup = new THREE.Group();
        const size = 0.00000015; // Another 10x smaller - microscopic for 14,000 rigs!
        
        // Just a simple platform deck - back to original simple shape
        const deckGeometry = new THREE.CylinderGeometry(size, size, size * 0.3, 8);
        const deckMaterial = new THREE.MeshBasicMaterial({ color: 0x444444 });
        const deck = new THREE.Mesh(deckGeometry, deckMaterial);
        deck.position.set(0, 0, 0);
        rigGroup.add(deck);
        
        // Use proper coordinate transformation like the working blocks
        const modelTransform = mapboxgl.MercatorCoordinate.fromLngLat([lng, lat], 0);
        const modelAsMatrix = new THREE.Matrix4()
          .makeTranslation(modelTransform.x, modelTransform.y, modelTransform.z)
          .scale(new THREE.Vector3(modelTransform.meterInMercatorCoordinateUnits(), 
                                   -modelTransform.meterInMercatorCoordinateUnits(), 
                                   modelTransform.meterInMercatorCoordinateUnits()));
        
        rigGroup.applyMatrix4(modelAsMatrix);
        
        this.scene.add(rigGroup);
        console.log(`✅ Added 3D rig for block: ${block.name}`);
      }
    });

    console.log('🎯 BLOCKS 3D RIGS layer added - blocks replaced with 3D rigs!');
  }

  /**
   * 🏗️ REPLACE ALL PLATFORMS WITH BIG 3D RIGS WITH TOWERS - Dedicated function for platforms
   */
  replacePlatformsWith3DRigs() {
    console.log(`🏗️ REPLACING ALL PLATFORMS WITH BIG 3D RIGS WITH TOWERS!`);
    
    const map = this.mapManager.getMap();
    if (!map) {
      console.log(`❌ No map available`);
      return;
    }

    // Clean up any existing platform 3D layers
    if (map.getLayer('platforms-3d-rigs-layer')) {
      console.log('🧹 Removing existing platforms 3D layer');
      map.removeLayer('platforms-3d-rigs-layer');
    }
    
    // IMPORTANT: Hide regular platform layers so 3D rigs show instead
    const platformLayers = [
      'platforms-fixed-layer', 'platforms-movable-layer', 'airfields-layer',
      'platforms-fixed-layer-basic', 'platforms-movable-layer-basic', 'platforms-airfield-layer-basic'
    ];
    
    platformLayers.forEach(layerId => {
      if (map.getLayer(layerId)) {
        console.log(`🙈 Hiding regular platform layer: ${layerId}`);
        map.setLayoutProperty(layerId, 'visibility', 'none');
      }
    });

    // Check Three.js availability
    if (typeof THREE === 'undefined') {
      console.error('❌ Three.js not loaded!');
      return;
    }

    console.log(`✅ Three.js available - replacing platforms with BIG 3D rigs with towers`);

    // Get ONLY platforms for replacement (isPlatform but not blocks, bases, etc.)
    const platformsFor3D = this.platforms.filter(p => 
      p.isPlatform && !p.isBlocks && !p.isBases && !p.isAirfield && p.coordinates && p.coordinates.length === 2
    );
    
    console.log(`🏗️ Found ${platformsFor3D.length} platforms to replace with big 3D rigs with towers`);

    if (platformsFor3D.length === 0) {
      console.log('❌ No platforms found');
      return;
    }

    // Store platform data for the layer
    const rigData = platformsFor3D.map(platform => ({
      coordinates: platform.coordinates,
      name: platform.name,
      type: 'platform',
      hasFuel: platform.hasFuel || false
    }));

    // Add Three.js custom layer for platform replacement
    map.addLayer({
      id: 'platforms-3d-rigs-layer',
      type: 'custom',
      renderingMode: '3d',
      
      onAdd: function(map, gl) {
        console.log('🏗️ Initializing PLATFORMS 3D RIGS layer with towers');
        
        // Create Three.js scene
        this.camera = new THREE.Camera();
        this.scene = new THREE.Scene();
        
        // Use Mapbox's WebGL context
        this.renderer = new THREE.WebGLRenderer({
          canvas: map.getCanvas(),
          context: gl,
          antialias: true
        });
        
        this.renderer.autoClear = false;
        this.map = map;

        // Create big 3D rigs with towers for each platform
        rigData.forEach((platform, index) => {
          this.createPlatformRigWithTower(platform, index);
        });

        console.log(`✅ PLATFORMS 3D RIGS layer initialized with ${rigData.length} big rigs with towers!`);
      },

      render: function(gl, matrix) {
        // Simple camera setup
        this.camera.projectionMatrix = new THREE.Matrix4().fromArray(matrix);
        
        // Render 3D rigs
        this.renderer.resetState();
        this.renderer.render(this.scene, this.camera);
      },

      createPlatformRigWithTower: function(platform, index) {
        const [lng, lat] = platform.coordinates;
        
        // Convert to world coordinates 
        const worldCoords = mapboxgl.MercatorCoordinate.fromLngLat([lng, lat], 0);
        
        // Create SIMPLE and SMALL 3D platform - same size as blocks but with light blue legs
        const rigGroup = new THREE.Group();
        const size = 0.00000015; // Same microscopic size as blocks
        
        // 1. Platform deck (same as blocks but different color)
        const deckGeometry = new THREE.CylinderGeometry(size, size, size * 0.3, 8);
        const deckMaterial = new THREE.MeshBasicMaterial({ 
          color: platform.hasFuel ? 0x666666 : 0x777777  // Slightly lighter than blocks
        });
        const deck = new THREE.Mesh(deckGeometry, deckMaterial);
        deck.position.set(0, 0, 0);
        rigGroup.add(deck);
        
        // 2. Light blue legs/pillars (what makes it different from blocks)
        const legGeometry = new THREE.CylinderGeometry(size * 0.2, size * 0.2, size * 1.5, 6);
        const legMaterial = new THREE.MeshBasicMaterial({ color: 0x87CEEB }); // Light blue
        const leg = new THREE.Mesh(legGeometry, legMaterial);
        leg.position.set(0, 0, -size * 0.75);
        rigGroup.add(leg);
        
        // 3. Light blue top indicator
        const topGeometry = new THREE.CylinderGeometry(size * 0.3, size * 0.3, size * 0.1, 6);
        const topMaterial = new THREE.MeshBasicMaterial({ color: 0x87CEEB }); // Light blue
        const top = new THREE.Mesh(topGeometry, topMaterial);
        top.position.set(0, 0, size * 0.2);
        rigGroup.add(top);
        
        // Use same coordinate transformation as blocks
        const modelTransform = mapboxgl.MercatorCoordinate.fromLngLat([lng, lat], 0);
        const modelAsMatrix = new THREE.Matrix4()
          .makeTranslation(modelTransform.x, modelTransform.y, modelTransform.z)
          .scale(new THREE.Vector3(modelTransform.meterInMercatorCoordinateUnits(), 
                                   -modelTransform.meterInMercatorCoordinateUnits(), 
                                   modelTransform.meterInMercatorCoordinateUnits()));
        
        rigGroup.applyMatrix4(modelAsMatrix);
        
        this.scene.add(rigGroup);
        console.log(`✅ Added BIG 3D rig with tower for platform: ${platform.name}`);
      }
    });

    console.log('🏗️ PLATFORMS 3D RIGS layer added - platforms replaced with big 3D rigs with towers!');
  }

  /**
   * 🚁 AUTO 3D RIGS - Enable all 3D rigs automatically when switching to 3D view
   */
  enableAuto3DRigs() {
    console.log('🚁 AUTO-ENABLING ALL 3D RIGS for 3D view...');
    
    const map = this.mapManager.getMap();
    if (!map) {
      console.log('❌ No map available');
      return;
    }

    // DEBUG: Check if we have platforms data
    console.log(`🔍 DEBUG: Have ${this.platforms?.length || 0} platforms in memory`);
    if (!this.platforms || this.platforms.length === 0) {
      console.log('❌ No platforms data available for 3D rigs');
      return;
    }

    // Clean up any existing 3D layers
    ['blocks-3d-rigs-layer', 'platforms-3d-rigs-layer', 'auto-3d-rigs-layer'].forEach(layerId => {
      if (map.getLayer(layerId)) {
        console.log(`🧹 Removing existing layer: ${layerId}`);
        map.removeLayer(layerId);
      }
    });

    // DON'T hide platform layers yet - wait until 3D objects are successfully created

    // Check Three.js availability
    if (typeof THREE === 'undefined') {
      console.error('❌ Three.js not loaded!');
      return;
    }

    console.log(`✅ Creating auto 3D rigs for all ${this.platforms.length} platforms`);

    // Get all platforms that have coordinates
    const allPlatformsFor3D = this.platforms.filter(p => 
      p.coordinates && p.coordinates.length === 2
    );
    
    if (allPlatformsFor3D.length === 0) {
      console.log('❌ No platforms with coordinates found');
      return;
    }

    // Add unified 3D layer for all platform types
    map.addLayer({
      id: 'auto-3d-rigs-layer',
      type: 'custom',
      renderingMode: '3d',
      
      onAdd: function(map, gl) {
        console.log('🚁 Initializing AUTO 3D RIGS layer');
        
        // Create Three.js scene
        this.camera = new THREE.Camera();
        this.scene = new THREE.Scene();
        
        // Use Mapbox's WebGL context
        this.renderer = new THREE.WebGLRenderer({
          canvas: map.getCanvas(),
          context: gl,
          antialias: true
        });
        
        this.renderer.autoClear = false;
        this.map = map;

        // Create 3D rigs for each platform with proper colors
        allPlatformsFor3D.forEach((platform, index) => {
          this.createColorCoded3DRig(platform, index);
        });

        console.log(`✅ AUTO 3D RIGS layer initialized with ${allPlatformsFor3D.length} rigs!`);
        
        // NOW hide the regular platform layers since 3D objects are successfully created
        const allPlatformLayers = [
          'platforms-fixed-layer', 'platforms-movable-layer', 'airfields-layer',
          'platforms-fixed-layer-basic', 'platforms-movable-layer-basic', 'platforms-airfield-layer-basic',
          'platforms-blocks-layer', 'platforms-blocks-layer-basic',
          'platforms-bases-layer', 'platforms-bases-layer-basic',
          'platforms-fuel-layer', 'platforms-fuel-layer-basic'
        ];
        
        allPlatformLayers.forEach(layerId => {
          if (map.getLayer(layerId)) {
            console.log(`🙈 Hiding regular layer: ${layerId}`);
            map.setLayoutProperty(layerId, 'visibility', 'none');
          }
        });
      },

      render: function(gl, matrix) {
        // DEBUG: Log render calls occasionally
        if (!this.renderCount) this.renderCount = 0;
        this.renderCount++;
        if (this.renderCount % 60 === 1) { // Log every 60 frames
          console.log(`🎬 Rendering 3D rigs frame ${this.renderCount}, scene has ${this.scene.children.length} children`);
        }
        
        // Simple camera setup - just use the matrix directly
        this.camera.projectionMatrix = new THREE.Matrix4().fromArray(matrix);
        this.camera.projectionMatrixInverse.copy(this.camera.projectionMatrix).invert();
        
        // Render 3D rigs
        this.renderer.resetState();
        this.renderer.render(this.scene, this.camera);
      },

      createColorCoded3DRig: function(platform, index) {
        const [lng, lat] = platform.coordinates;
        
        // DEBUG: Log every 1000th rig to track progress
        if (index % 1000 === 0) {
          console.log(`🔍 Creating 3D rig ${index}: ${platform.name} at [${lng}, ${lat}]`);
        }
        
        // FORCE DEBUG: Always log first 3 rigs to see coordinates
        if (index < 3) {
          console.log(`🔍 FORCE DEBUG rig ${index}: ${platform.name} at [${lng}, ${lat}]`);
        }
        
        // Create color-coded 3D rig based on platform type
        const rigGroup = new THREE.Group();
        const size = index < 10 ? 0.01 : 0.00015; // First 10 rigs are MASSIVE for testing
        
        // Determine colors based on platform type
        let deckColor = 0x555555; // Default gray
        let accentColor = 0x666666; // Default accent
        
        if (platform.isBlocks) {
          deckColor = 0x444444; // Dark gray for blocks
          accentColor = 0x555555;
        } else if (platform.isBases) {
          deckColor = 0x666666; // Medium gray for bases  
          accentColor = 0x777777;
        } else if (platform.isMovable) {
          deckColor = 0x8B0000; // Dark red for movable
          accentColor = 0xFF0000; // Bright red accent
        } else if (platform.hasFuel || platform.isFuel) {
          deckColor = 0xB8860B; // Dark gold for fuel
          accentColor = 0xFFD700; // Yellow accent
        } else if (platform.isPlatform) {
          deckColor = 0x555555; // Gray for platforms
          accentColor = 0x87CEEB; // Light blue accent
        }
        
        // 1. Main platform deck
        const deckGeometry = new THREE.CylinderGeometry(size, size, size * 0.3, 8);
        const deckMaterial = new THREE.MeshBasicMaterial({ color: deckColor });
        const deck = new THREE.Mesh(deckGeometry, deckMaterial);
        deck.position.set(0, 0, 0);
        rigGroup.add(deck);
        
        // 2. Accent indicator (different for each type)
        if (!platform.isBlocks) {
          // Add accent for non-blocks
          const accentGeometry = new THREE.CylinderGeometry(size * 0.3, size * 0.3, size * 0.1, 6);
          const accentMaterial = new THREE.MeshBasicMaterial({ color: accentColor });
          const accent = new THREE.Mesh(accentGeometry, accentMaterial);
          accent.position.set(0, 0, size * 0.2);
          rigGroup.add(accent);
        }
        
        // TEMPORARY DEBUG: Use simple positioning first to test if rendering works
        if (index < 10) {
          // Position first 10 rigs at center of view - should be impossible to miss
          const x = (index % 5) * 0.01 - 0.02; // Spread them out BIG
          const y = Math.floor(index / 5) * 0.01;
          const z = 1000; // Put them way above ground level
          
          rigGroup.position.set(x, y, z);
          console.log(`🔍 TEST positioning MASSIVE rig ${index} at center coords [${x}, ${y}, ${z}]`);
        } else {
          // Use proper coordinate transformation for the rest
          const modelTransform = mapboxgl.MercatorCoordinate.fromLngLat([lng, lat], 0);
          
          const modelAsMatrix = new THREE.Matrix4()
            .makeTranslation(modelTransform.x, modelTransform.y, modelTransform.z)
            .scale(new THREE.Vector3(modelTransform.meterInMercatorCoordinateUnits(), 
                                     -modelTransform.meterInMercatorCoordinateUnits(), 
                                     modelTransform.meterInMercatorCoordinateUnits()));
          
          rigGroup.applyMatrix4(modelAsMatrix);
        }
        
        this.scene.add(rigGroup);
        
        // DEBUG: Log scene stats for first few rigs
        if (index < 5) {
          console.log(`🔍 Scene children count after adding rig ${index}: ${this.scene.children.length}`);
        }
      }
    });

    console.log('🚁 AUTO 3D RIGS layer added - all platforms now showing as color-coded 3D rigs!');
  }
}

export default PlatformManager;
