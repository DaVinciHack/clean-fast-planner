/**
 * PlatformManager.js
 * 
 * Handles loading, displaying, and interacting with platform/rig data
 */

class PlatformManager {
  constructor(mapManager) {
    this.mapManager = mapManager;
    this.platforms = [];
    this.isVisible = true;
    this.callbacks = {
      onPlatformsLoaded: null,
      onVisibilityChanged: null,
      onError: null
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
      return Promise.reject(new Error('Map is not initialized'));
    }
    
    try {
      // Check if we have a client - but don't reject the promise
      if (!client) {
        console.warn("No OSDK client provided - this may be expected on region changes");
        
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
        
        // Add to map even if few or no locations found - this will at least show what we got
        
        // Check if we have at least some locations
        if (locations.length > 0) {
          console.log(`Adding ${locations.length} locations to map`);
          this.addPlatformsToMap(locations);
          return locations;
        } else {
          console.warn("No valid locations found with coordinates");
          
          // Create empty array to avoid errors in the UI
          this.platforms = [];
          this.triggerCallback('onPlatformsLoaded', []);
          return [];
        }
        
      } catch (error) {
        console.error('OSDK API error:', error);
        
        // Even on error, don't throw so the app won't crash
        console.warn("Error occurred, returning empty locations array");
        
        // Create empty array to avoid errors in the UI
        this.platforms = [];
        this.triggerCallback('onPlatformsLoaded', []);
        return [];
      }
    } catch (error) {
      console.error('General error in loadPlatformsFromFoundry:', error);
      
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
        'platforms-fixed-layer',
        'platforms-movable-layer', 
        'platforms-fixed-labels',
        'platforms-movable-labels',
        'airfields-layer',
        'airfields-labels'
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
    if (!this.platforms || this.platforms.length === 0) return null;
    
    if (!window.turf) {
      console.error('Turf.js not loaded');
      return null;
    }
    
    try {
      let nearestPlatform = null;
      let minDistance = Number.MAX_VALUE;
      
      this.platforms.forEach(platform => {
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
            coords: coords,
            lat: coords[1],
            lng: coords[0],
            distance: distance
          };
        }
      });
      
      // Only return if within reasonable distance
      if (minDistance <= maxDistance) {
        return nearestPlatform;
      }
    } catch (error) {
      console.error('Error finding nearest platform:', error);
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
}

export default PlatformManager;