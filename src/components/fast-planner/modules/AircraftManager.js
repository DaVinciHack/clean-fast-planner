/**
 * AircraftManager.js
 * 
 * Handles loading, filtering, and management of aircraft data from Palantir OSDK.
 * Provides aircraft performance data for route calculations.
 */

class AircraftManager {
  constructor() {
    // Store all loaded aircraft data
    this.aircraftList = [];
    
    // Store filtered aircraft data (by region, type, etc.)
    this.filteredAircraft = [];
    
    // Store aircraft organized by region and type
    this.aircraftByRegion = {};
    
    // Store available types by region
    this.typesByRegion = {};
    
    // Track whether we've loaded all aircraft
    this.allAircraftLoaded = false;
    
    // Currently selected aircraft
    this.selectedAircraft = null;
    
    // Callbacks for different events
    this.callbacks = {
      onAircraftLoaded: null,     // When aircraft data is loaded
      onAircraftFiltered: null,   // When aircraft are filtered
      onAircraftSelected: null,   // When an aircraft is selected
      onError: null               // When an error occurs
    };
    
    // Default aircraft performance data by type
    this.defaultPerformanceData = {
      's92': {
        cruiseSpeed: 0, // knots
        fuelBurn: 0,   // lbs per hour
        maxFuel: 5000,    // lbs
        maxPassengers: 19,
        maxRange: 450,    // nm
        usefulLoad: 7000  // lbs
      },
      's76': {
        cruiseSpeed: 0, // knots
        fuelBurn: 0,    // lbs per hour
        maxFuel: 3000,    // lbs
        maxPassengers: 12,
        maxRange: 400,    // nm
        usefulLoad: 5000  // lbs
      },
      's76d': {
        cruiseSpeed: 0, // knots
        fuelBurn: 0,    // lbs per hour
        maxFuel: 3300,    // lbs
        maxPassengers: 12,
        maxRange: 420,    // nm
        usefulLoad: 5200  // lbs
      },
      'aw139': {
        cruiseSpeed: 0, // knots
        fuelBurn: 0,    // lbs per hour
        maxFuel: 4000,    // lbs
        maxPassengers: 15,
        maxRange: 400,    // nm
        usefulLoad: 6000  // lbs
      },
      'aw189': {
        cruiseSpeed: 0, // knots
        fuelBurn: 0,    // lbs per hour
        maxFuel: 4500,    // lbs
        maxPassengers: 16,
        maxRange: 430,    // nm
        usefulLoad: 6300  // lbs
      },
      'h175': {
        cruiseSpeed: 0, // knots
        fuelBurn: 0,    // lbs per hour
        maxFuel: 4200,    // lbs
        maxPassengers: 16,
        maxRange: 440,    // nm
        usefulLoad: 6500  // lbs
      },
      'h160': {
        cruiseSpeed: 0, // knots
        fuelBurn: 0,    // lbs per hour
        maxFuel: 3200,    // lbs
        maxPassengers: 12,
        maxRange: 420,    // nm
        usefulLoad: 4800  // lbs
      },
      'ec135': {
        cruiseSpeed: 0, // knots
        fuelBurn: 0,    // lbs per hour
        maxFuel: 2000,    // lbs
        maxPassengers: 7,
        maxRange: 350,    // nm
        usefulLoad: 3300  // lbs
      },
      'ec225': {
        cruiseSpeed: 0, // knots
        fuelBurn: 0,   // lbs per hour
        maxFuel: 4800,    // lbs
        maxPassengers: 19,
        maxRange: 450,    // nm
        usefulLoad: 6800  // lbs
      },
      'as350': {
        cruiseSpeed: 0, // knots
        fuelBurn: 0,    // lbs per hour
        maxFuel: 1500,    // lbs
        maxPassengers: 6,
        maxRange: 360,    // nm
        usefulLoad: 2500  // lbs
      },
      'a119': {
        cruiseSpeed: 0, // knots
        fuelBurn: 0,    // lbs per hour
        maxFuel: 1800,    // lbs
        maxPassengers: 7,
        maxRange: 380,    // nm
        usefulLoad: 3000  // lbs
      }
    };
  }

  /**
   * Set a callback function
   * @param {string} type - The callback type (e.g., 'onAircraftLoaded')
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
   * Load ALL aircraft data from Palantir OSDK and organize by region
   * @param {Object} client - The OSDK client instance
   * @returns {Promise} - Resolves with the loaded aircraft data
   */
  async loadAircraftFromOSDK(client) {
    try {
      // Only fetch all aircraft once to improve performance
      if (this.allAircraftLoaded && this.aircraftList.length > 0) {
        console.log(`%c===== USING EXISTING AIRCRAFT DATA =====`, 'background: #00a; color: #fff; font-size: 16px; font-weight: bold;');
        console.log(`Using existing ${this.aircraftList.length} aircraft already loaded in memory`);
        
        // Just trigger the callback with the existing data
        this.triggerCallback('onAircraftLoaded', this.aircraftList);
        return this.aircraftList;
      }
      
      console.log(`%c===== LOADING ALL AIRCRAFT DATA FROM OSDK =====`, 'background: #00a; color: #fff; font-size: 16px; font-weight: bold;');
      
      // Use LoadingIndicator to show loading status in the top card
      // Instead of using the full-page overlay
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator('Loading aircraft data...');
      }
      
      // Check if client exists
      if (!client) {
        throw new Error('OSDK client is not provided');
      }
      
      try {
        // Use the dynamic import to get the Asset interface
        const sdk = await import('@flight-app/sdk');
        
        // Based on the screenshots, we're looking for Asset (not AircraftAsset)
        const Asset = sdk.Asset;
        
        if (!Asset) {
          throw new Error(`Required 'Asset' object not found in SDK: ${Object.keys(sdk).join(', ')}`);
        }
        
        console.log(`Querying ALL aircraft data from OSDK...`);
        
        // Query for ALL aircraft - no region filtering
        const query = client(Asset);
        
        // Fetch the data with larger page size to get all aircraft
        console.log('Executing fetchPage query for all aircraft...');
        const response = await query.fetchPage({
          $pageSize: 1000 // Increased to get all aircraft in one request
        });
        
        
        // Process the response
        if (response && response.data) {
          console.log(`%c===== PROCESSING AIRCRAFT DATA =====`, 'background: #070; color: #fff; font-size: 14px;');
          
          // Log sample data to understand the structure
          if (response.data.length > 0) {
          }
          
          // Process each aircraft and create standardized objects
          this.aircraftList = response.data.map(aircraft => {
            // Extract aircraft region from regionName field
            let region = aircraft.regionName || '';
            // Extract org unit field
            let orgUnit = aircraft.orgUnit || '';
            // Extract registration from assetIdentifier
            let registration = aircraft.assetIdentifier || '';
            // Extract model type from acModelName or model
            let modelName = aircraft.acModelName || aircraft.model || '';
            let modelType = '';
            
            // Determine aircraft type based on model name
            modelType = this.determineAircraftType(modelName);
            
            // Create a display registration with both registration and region
            const displayRegistration = `${registration} (${region})`;
            
            // Debug: Show what fields are actually available in OSDK data
            
            // Create standardized aircraft object
            return {
              assetId: aircraft.assetIdx || '',
              registration: displayRegistration, // Use the combined format
              rawRegistration: registration, // Keep the original registration
              assetIdentifier: aircraft.assetIdentifier || registration, // ✅ CLEAN ID for searches
              modelName: modelName,
              modelType: modelType,
              maxPassengers: aircraft.maxPassengers || 0,
              cruiseSpeed: aircraft.cruseSpeed || 0,
              fuelBurn: aircraft.fuelBurn || 0,
              flatPitchFuelBurnDeckFuel: aircraft.flatPitchFuelBurnDeckFuel, // ✅ CRITICAL: Deck fuel flow
              defaultFuelPolicyName: aircraft.defaultFuelPolicyName, // ✅ CRITICAL: Policy name from OSDK
              defaultFuelPolicyId: aircraft.defaultFuelPolicyId, // ✅ CRITICAL: Policy ID from OSDK  
              maxFuel: aircraft.maxFuelCapacity || 0,
              dryWeight: aircraft.dryOperatingWeightLbs || 0,
              usefulLoad: aircraft.usefulLoad || 0,
              company: aircraft.company || aircraft.orgName || 'Unknown',
              region: region,
              orgUnit: orgUnit, // Store the orgUnit field
              status: aircraft.acStatus || 'ACTIVE',
              rawData: aircraft // Keep the full data for reference
            };
          });
          
          // Filter out aircraft with invalid data, inactive status, or in long-term maintenance
          this.aircraftList = this.aircraftList.filter(aircraft => {
            // Check for required fields
            if (!aircraft.registration || !aircraft.modelName) {
              return false;
            }
            
            // Check for inactive statuses
            if (aircraft.status === 'INACTIVE' || aircraft.status === 'RETIRED') {
              return false;
            }
            
            // Check for long-term maintenance
            if (aircraft.status && 
                (aircraft.status.toUpperCase().includes('MAINTENANCE') || 
                 aircraft.status.toUpperCase().includes('REPAIR') || 
                 aircraft.status.toUpperCase().includes('OVERHAUL'))) {
              console.log(`Filtering out aircraft in maintenance: ${aircraft.registration}, Status: ${aircraft.status}`);
              return false;
            }
            
            return true;
          });
          
          console.log(`Processed ${this.aircraftList.length} valid aircraft`);
          
          // Now organize aircraft by region and type for quick access
          console.log(`Organizing aircraft by region and type...`);
          this.organizeAircraftByRegion();
          
          // Mark that we've loaded all aircraft
          this.allAircraftLoaded = true;
          
          // Trigger the callback with ALL aircraft
          console.log(`Triggering onAircraftLoaded callback with ${this.aircraftList.length} aircraft`);
          this.triggerCallback('onAircraftLoaded', this.aircraftList);
          
          // Update status and then clear loading status
          if (window.LoadingIndicator) {
            window.LoadingIndicator.updateStatusIndicator(`Loaded ${this.aircraftList.length} aircraft successfully`);
          }
          
          // Return the final aircraft list
          return this.aircraftList;
        } else {
          console.warn('No aircraft data in response');
          this.aircraftList = [];
          this.triggerCallback('onAircraftLoaded', []);
          
          // Update status and then clear loading status
          if (window.LoadingIndicator) {
            window.LoadingIndicator.updateStatusIndicator(`No aircraft data found`);
          }
          
          return [];
        }
      } catch (sdkError) {
        console.error('Error with SDK import or query:', sdkError);
        throw sdkError;
      }
    } catch (error) {
      // Provide detailed error logging
      console.error('Error loading aircraft from OSDK:', error);
      
      // Trigger error callback
      this.triggerCallback('onError', error);
      
      // Update status with error message
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator('Error loading aircraft data');
        window.LoadingIndicator.updateStatusIndicator('Please try again later');
      }
      
      // No mock data, just return empty list
      this.aircraftList = [];
      this.triggerCallback('onAircraftLoaded', this.aircraftList);
      
      return this.aircraftList;
    }
  }
  
  /**
   * Organize aircraft by region and type for quick filtering
   * Called after loading all aircraft data
   */
  organizeAircraftByRegion() {
    console.log(`%c===== ORGANIZING AIRCRAFT BY REGION AND TYPE =====`, 'background: #005; color: #fff; font-size: 14px;');
    
    // Clear the existing data
    this.aircraftByRegion = {};
    this.typesByRegion = {};
    
    // First count aircraft by region for logging
    const regionCount = {};
    
    // Count aircraft by region AND type
    const typeCountByRegion = {};
    
    // Create a set of all known aircraft types
    const allKnownTypes = new Set();
    
    // Log raw aircraft data to diagnose issues
    console.log(`Total aircraft in raw list: ${this.aircraftList.length}`);
    
    // Log a sample aircraft to check structure
    if (this.aircraftList.length > 0) {
      console.log('Sample aircraft structure:', {
        region: this.aircraftList[0].region,
        type: this.aircraftList[0].modelType,
        registration: this.aircraftList[0].registration
      });
    }
    
    // Check active status before organizing
    const activeAircraft = this.aircraftList.filter(aircraft => 
      aircraft.status !== 'INACTIVE' && aircraft.status !== 'RETIRED'
    );
    console.log(`Total active aircraft: ${activeAircraft.length} of ${this.aircraftList.length}`);
    
    // Process all aircraft
    this.aircraftList.forEach(aircraft => {
      const region = aircraft.region || 'Unknown';
      const type = aircraft.modelType || 'S92';
      
      // Track all known types
      allKnownTypes.add(type);
      
      // Count aircraft by region
      regionCount[region] = (regionCount[region] || 0) + 1;
      
      // Count by region and type
      if (!typeCountByRegion[region]) {
        typeCountByRegion[region] = {};
      }
      typeCountByRegion[region][type] = (typeCountByRegion[region][type] || 0) + 1;
      
      // Initialize region in aircraftByRegion if not exists
      if (!this.aircraftByRegion[region]) {
        this.aircraftByRegion[region] = {
          all: [], // All aircraft in this region
          byType: {} // Aircraft by type in this region
        };
      }
      
      // Add to all aircraft for this region
      this.aircraftByRegion[region].all.push(aircraft);
      
      // Add to byType for this region
      if (!this.aircraftByRegion[region].byType[type]) {
        this.aircraftByRegion[region].byType[type] = [];
      }
      this.aircraftByRegion[region].byType[type].push(aircraft);
      
      // Update typesByRegion
      if (!this.typesByRegion[region]) {
        this.typesByRegion[region] = [];
      }
      if (!this.typesByRegion[region].includes(type)) {
        this.typesByRegion[region].push(type);
      }
    });
    
    // Print detailed aircraft counts by type for GULF OF MEXICO
    if (typeCountByRegion['GULF OF MEXICO']) {
      console.log(`%c===== GULF OF MEXICO AIRCRAFT BY TYPE =====`, 'background: #00a; color: #fff;');
      Object.entries(typeCountByRegion['GULF OF MEXICO']).forEach(([type, count]) => {
        console.log(`${type}: ${count} aircraft`);
      });
      
      // Add detailed debugging for all aircraft in Gulf of Mexico
      console.log(`%c===== DETAILED AIRCRAFT INSPECTION IN GULF OF MEXICO =====`, 'background: #f00; color: #fff;');
      
      // Get specific registrations to check
      const registrationsToCheck = [
        'N145JW', 'N290BG', 'N293BG', 'N524PB', 'N592BG',
        'N692BG', 'N806AP', 'N920VH', 'N92EH'
      ];
      
      // Find all these registrations in the aircraft list
      console.log('CHECKING SPECIFIC REGISTRATIONS:');
      registrationsToCheck.forEach(reg => {
        const matches = this.aircraftList.filter(aircraft => 
          aircraft.registration.includes(reg)
        );
        
        
        matches.forEach(aircraft => {
          console.log(`  - Registration: ${aircraft.registration}`);
          console.log(`    Type: ${aircraft.modelType}`);
          console.log(`    Model Name: ${aircraft.modelName}`);
          console.log(`    Region: ${aircraft.region}`);
          console.log(`    Status: ${aircraft.status}`);
        });
      });
      
      // Get all S92 aircraft in Gulf of Mexico
      const s92AircraftInGOM = this.aircraftList.filter(aircraft => 
        aircraft.modelType === 'S92' && 
        this.regionsMatch(aircraft.region, 'GULF OF MEXICO')
      );
      
      
      // Print the details of each S92 aircraft
      s92AircraftInGOM.forEach(aircraft => {
        console.log(`Registration: ${aircraft.registration}`);
        console.log(`Type: ${aircraft.modelType}`);
        console.log(`Model Name: ${aircraft.modelName}`);
        console.log(`Region: ${aircraft.region}`);
        console.log(`Status: ${aircraft.status}`);
        console.log('---------');
      });
      
      // Count each unique type in Gulf of Mexico
      const actualTypeCounts = {};
      this.aircraftList.filter(a => this.regionsMatch(a.region, 'GULF OF MEXICO'))
                       .forEach(a => {
                         actualTypeCounts[a.modelType] = (actualTypeCounts[a.modelType] || 0) + 1;
                       });
      
      console.log('Actual type counts in Gulf of Mexico:', actualTypeCounts);
    }
    
    // Also check flexible region matches for alternate region names
    const regionAliases = {
      'GULF OF MEXICO': ['US', 'GOM', 'MEXICO', 'UNITED STATES'],
      'NIGERIA': ['WEST AFRICA', 'AFRICAN'],
      'UNITED KINGDOM': ['UK', 'BRITAIN', 'SCOTLAND'],
      'TRINIDAD AND TOBAGO': ['TRINIDAD', 'TOBAGO'],
      'BRAZIL': ['BRAZIL EAST', 'BRAZILIAN', 'SOUTH AMERICA'],
      'NORWAY': ['NORWEGIAN', 'SCANDINAVIAN'],
      'NETHERLANDS': ['DUTCH', 'HOLLAND'],
      'IRELAND': ['IRISH']
    };
    
    // For each region with aliases, ensure aircraft can be found with either name
    Object.entries(regionAliases).forEach(([primaryRegion, aliases]) => {
      if (this.aircraftByRegion[primaryRegion]) {
        // For each alias, create a reference to the primary region's data
        aliases.forEach(alias => {
          if (!this.aircraftByRegion[alias] && alias !== primaryRegion) {
            // Reference the primary region's data
            this.aircraftByRegion[alias] = this.aircraftByRegion[primaryRegion];
            this.typesByRegion[alias] = [...this.typesByRegion[primaryRegion]];
            console.log(`Created alias mapping: ${alias} -> ${primaryRegion} with ${this.aircraftByRegion[primaryRegion].all.length} aircraft`);
          }
        });
      }
    });
    
    // For each known region, ensure we have complete byType collections
    Object.keys(this.aircraftByRegion).forEach(region => {
      allKnownTypes.forEach(type => {
        if (!this.aircraftByRegion[region].byType[type]) {
          this.aircraftByRegion[region].byType[type] = [];
        }
      });
    });
    
    // Log a summary of aircraft by region
    console.log('Aircraft counts by region:', regionCount);
    console.log(`Total regions with aircraft: ${Object.keys(this.aircraftByRegion).length}`);
    console.log(`Total known aircraft types: ${allKnownTypes.size}`);
    
    // Log detailed breakdown of aircraft by type for each region
    Object.keys(this.aircraftByRegion).forEach(region => {
      console.log(`Region: ${region} - ${this.aircraftByRegion[region].all.length} total aircraft`);
      const typeCount = {};
      Object.keys(this.aircraftByRegion[region].byType).forEach(type => {
        const count = this.aircraftByRegion[region].byType[type].length;
        if (count > 0) {
          typeCount[type] = count;
        }
      });
      console.log(`Types available in ${region}:`, typeCount);
    });
  }

  /**
   * Format region name to match OSDK format
   * @param {string} region - The region ID (e.g., 'gulf-of-mexico')
   * @returns {string} - The formatted region name
   */
  formatRegionForOSDK(region) {
    if (!region) return '';
    
    console.log(`Formatting region: "${region}"`);
    
    // Map of region IDs to OSDK region names
    const regionMap = {
      'gulf-of-mexico': 'GULF OF MEXICO',
      'gom': 'GULF OF MEXICO',
      'gulf of mexico': 'GULF OF MEXICO',
      'gulf-mexico': 'GULF OF MEXICO',
      'norway': 'NORWAY',
      'united-kingdom': 'UNITED KINGDOM',
      'uk': 'UNITED KINGDOM',
      'west-africa': 'NIGERIA', // Updated to match actual data
      'nigeria': 'NIGERIA',
      'brazil': 'BRAZIL',
      'brazil-east': 'BRAZIL EAST',
      'australia': 'AUSTRALIA',
      'us': 'GULF OF MEXICO', // Alias
      'usa': 'GULF OF MEXICO', // Alias
      'united-states': 'GULF OF MEXICO', // Alias
      'united states': 'GULF OF MEXICO', // Alias
      'netherlands': 'NETHERLANDS',
      'trinidad': 'TRINIDAD AND TOBAGO',
      'trinidad-and-tobago': 'TRINIDAD AND TOBAGO',
      'ireland': 'IRELAND'
    };
    
    // First check if we are passing a region that's already in the correct format
    const upperRegion = region.toUpperCase();
    
    // If the uppercase version is already a known region name, use it
    if (Object.values(regionMap).includes(upperRegion)) {
      console.log(`Region already in correct format: "${upperRegion}"`);
      return upperRegion;
    }
    
    // Check if direct mapping exists
    const lowerRegion = region.toLowerCase();
    if (regionMap[lowerRegion]) {
      console.log(`Direct mapping found for "${region}": "${regionMap[lowerRegion]}"`);
      return regionMap[lowerRegion];
    }
    
    // If no direct mapping, try to find a close match
    for (const [key, value] of Object.entries(regionMap)) {
      if (lowerRegion.includes(key) || key.includes(lowerRegion)) {
        console.log(`No exact region match for "${region}", using "${value}" as closest match`);
        return value;
      }
    }
    
    // Default: convert to uppercase
    console.log(`No region mapping found for "${region}", defaulting to uppercase: "${upperRegion}"`);
    return upperRegion;
  }

  /**
   * Determine aircraft type from model name
   * @param {string} modelName - The aircraft model name
   * @returns {string} - The aircraft type
   */
  determineAircraftType(modelName) {
    // If no model name provided, return UNKNOWN instead of defaulting to S92
    if (!modelName) {
      console.log('No model name provided, using UNKNOWN type');
      return 'UNKNOWN';
    }
    
    // Convert to uppercase for consistent matching
    const model = modelName.toUpperCase();
    
    // Type mapping table for all known aircraft types
    const typeMap = {
      // Sikorsky types
      'S92': 'S92',
      'S-92': 'S92',
      'S92A': 'S92',
      'S76': 'S76',
      'S-76': 'S76',
      'S76D': 'S76D',
      'S-76D': 'S76D',
      'S76C': 'S76',
      'S-76C': 'S76',
      'SIKORSKY': 'S92', // Default Sikorsky to S92
      
      // Leonardo/AgustaWestland types
      'AW139': 'AW139',
      'AW-139': 'AW139',
      'AW189': 'AW189',
      'AW-189': 'AW189',
      'AGUSTA': 'AW139', // Default Agusta to AW139
      'LEONARDO': 'AW139', // Default Leonardo to AW139
      'AGUSTAWESTLAND': 'AW139',
      'AGUSTA WESTLAND': 'AW139',
      'A119': 'A119',
      
      // Airbus/Eurocopter types
      'H175': 'H175',
      'H-175': 'H175',
      'H160': 'H160',
      'H-160': 'H160',
      'EC135': 'EC135',
      'EC-135': 'EC135',
      'EC225': 'EC225',
      'EC-225': 'EC225',
      'AS350': 'AS350',
      'AS-350': 'AS350',
      'AIRBUS': 'H175' // Default Airbus to H175
    };
    
    // Check for ASXXX format in the model name, where XXX is a number
    if (model.includes('AS3') || model.includes('AS5')) {
      console.log(`Detected Airbus AS series in model name: ${modelName}`);
      // For AS350, AS355, etc.
      if (model.includes('AS350') || model.includes('AS-350')) {
        return 'AS350';
      }
    }
    
    // Check for specific model numbers that indicate type
    if (model.includes('AW119')) {
      return 'A119';
    }
    
    // Parse the display format we're seeing in the dropdown
    // e.g. extract S92 from "N228BJ (GULF OF MEXICO) | S92"
    const regExMatch = model.match(/\| (\w+\d+\w*)$/);
    if (regExMatch && regExMatch[1]) {
      return regExMatch[1];
    }
    
    // Try to match with type map
    for (const [key, value] of Object.entries(typeMap)) {
      if (model.includes(key)) {
        return value;
      }
    }
    
    // Extract any pattern that looks like an aircraft type
    // Look for common patterns like: letter(s) + number(s) + optional letter(s)
    const typePattern = model.match(/[A-Z]+\d+[A-Z]*/g);
    if (typePattern && typePattern.length > 0) {
      const extractedType = typePattern[0];
      console.log(`Extracted potential type ${extractedType} from ${modelName}`);
      
      // Check if it's in our known types
      for (const [key, value] of Object.entries(typeMap)) {
        if (extractedType.includes(key) || key.includes(extractedType)) {
          console.log(`Matched extracted type ${extractedType} to known type ${value}`);
          return value;
        }
      }
      
      // If we extracted something but don't recognize it, use it as the type
      console.log(`Using extracted but unrecognized type: ${extractedType}`);
      return extractedType;
    }
    
    // Use the actual model name instead of defaulting to S92
    console.log(`Unrecognized aircraft model: "${modelName}" - using as type`);
    
    // Extract the first part of the model name if it's too long
    const simplifiedModel = modelName.split(' ')[0];
    return simplifiedModel;
  }

  /**
   * NEVER USE THIS METHOD - Mock data should not be used
   * @deprecated Always use loadAircraftFromOSDK instead
   * @param {string} region - The region to filter by (optional)
   */
  async loadStaticAircraftData(region = null) {
    console.error('⚠️ IMPORTANT - NEVER USE STATIC AIRCRAFT DATA! ⚠️');
    console.error('Static aircraft data should never be used. Real aircraft data should be loaded from OSDK.');
    
    // Return empty list
    this.aircraftList = [];
    
    // Trigger callback with empty list
    this.triggerCallback('onAircraftLoaded', this.aircraftList);
    
    return this.aircraftList;
  }

  /**
   * Get aircraft for a specific region from memory
   * @param {string} region - Region ID to filter by
   * @returns {Array} - Array of aircraft in that region
   */
  getAircraftByRegion(region) {
    if (!region) return this.aircraftList;
    
    // Format region for consistency
    const formattedRegion = this.formatRegionForOSDK(region);
    
    // Special handling for Gulf of Mexico - log all aircraft in this region
    if (formattedRegion === 'GULF OF MEXICO') {
      console.log(`%c===== ALL AIRCRAFT IN GULF OF MEXICO =====`, 'background: #00a; color: #fff;');
      
      // Find all aircraft that match this region
      const gulfAircraft = this.aircraftList.filter(aircraft => 
        this.regionsMatch(aircraft.region, formattedRegion)
      );
      
      console.log(`Total aircraft in Gulf of Mexico: ${gulfAircraft.length}`);
      
      // Print basic info for each aircraft
      gulfAircraft.forEach(aircraft => {
        console.log(`- ${aircraft.registration} (${aircraft.modelType}): Status=${aircraft.status || 'Unknown'}`);
      });
    }
    
    // Check if we have pre-organized data for this region
    if (this.aircraftByRegion[formattedRegion]) {
      const result = this.aircraftByRegion[formattedRegion].all;
      return result;
    }
    
    // If not found in organized data, use flexible matching
    console.log(`Region ${formattedRegion} not found in pre-organized data, using flexible matching`);
    
    const matchedAircraft = this.aircraftList.filter(aircraft => {
      // Check region property with flexible matching
      if (aircraft.region && this.regionsMatch(aircraft.region, formattedRegion)) {
        return true;
      }
      
      // Check orgUnit property with flexible matching
      if (aircraft.orgUnit && this.regionsMatch(aircraft.orgUnit, formattedRegion)) {
        return true;
      }
      
      // Check registration which might contain region
      const matchRegex = /\(([^)]+)\)/;
      const match = aircraft.registration.match(matchRegex);
      const displayedRegion = match ? match[1] : '';
      
      return this.regionsMatch(displayedRegion, formattedRegion);
    });
    
    
    // Store the results for future use
    if (matchedAircraft.length > 0 && !this.aircraftByRegion[formattedRegion]) {
      this.aircraftByRegion[formattedRegion] = {
        all: matchedAircraft,
        byType: {}
      };
      
      // Organize by type
      const types = {};
      matchedAircraft.forEach(aircraft => {
        const type = aircraft.modelType;
        if (!types[type]) {
          types[type] = [];
        }
        types[type].push(aircraft);
      });
      
      this.aircraftByRegion[formattedRegion].byType = types;
      
      // Update types for this region
      this.typesByRegion[formattedRegion] = Object.keys(types);
      
      console.log(`Added ${formattedRegion} to organized data with ${matchedAircraft.length} aircraft`);
      console.log(`Types in ${formattedRegion}:`, this.typesByRegion[formattedRegion]);
    }
    
    return matchedAircraft;
  }
  
  /**
   * Get available aircraft types for a specific region
   * @param {string} region - Region ID
   * @returns {Array} - Array of available aircraft types in that region
   */
  getAvailableTypesInRegion(region) {
    if (!region) return this.getAvailableTypes();
    
    // Format region for consistency
    const formattedRegion = this.formatRegionForOSDK(region);
    
    // Get from pre-calculated data if available
    if (this.typesByRegion[formattedRegion]) {
      // Filter to only include types that actually have aircraft
      const typesWithAircraft = this.typesByRegion[formattedRegion].filter(type => {
        const hasAircraft = this.aircraftByRegion[formattedRegion] && 
                           this.aircraftByRegion[formattedRegion].byType[type] && 
                           this.aircraftByRegion[formattedRegion].byType[type].length > 0;
        return hasAircraft;
      });
      
      return typesWithAircraft;
    }
    
    // Try flexible region matching to find region
    console.log(`Region ${formattedRegion} not found in pre-calculated data, trying flexible matching`);
    
    // Try each known region and check if it matches
    for (const knownRegion of Object.keys(this.typesByRegion)) {
      if (this.regionsMatch(knownRegion, formattedRegion)) {
        
        // Filter to only include types that actually have aircraft
        const typesWithAircraft = this.typesByRegion[knownRegion].filter(type => {
          const hasAircraft = this.aircraftByRegion[knownRegion] && 
                             this.aircraftByRegion[knownRegion].byType[type] && 
                             this.aircraftByRegion[knownRegion].byType[type].length > 0;
          return hasAircraft;
        });
        
        
        // Store for future use
        this.typesByRegion[formattedRegion] = typesWithAircraft;
        
        return typesWithAircraft;
      }
    }
    
    // If no matching region found in pre-calculated data, compute it now
    console.log(`No matching region found, computing types for ${formattedRegion}`);
    const aircraftInRegion = this.getAircraftByRegion(region);
    const types = [...new Set(aircraftInRegion.map(aircraft => aircraft.modelType))].filter(Boolean);
    
    // Store for future use
    this.typesByRegion[formattedRegion] = types;
    
    console.log(`Computed ${types.length} types for ${formattedRegion}:`, types);
    return types;
  }
  
  /**
   * Filter aircraft by region and type - enhanced memory-based implementation
   * @param {string} region - Region to filter by
   * @param {string} type - Aircraft type to filter by (optional)
   * @returns {Array} - Filtered aircraft array
   */
  filterAircraft(region = null, type = null) {
    console.log(`%c===== FILTERING AIRCRAFT =====`, 'background: #ff0; color: #000; font-size: 16px; font-weight: bold;');
    console.log(`Region: "${region}", Type: "${type}"`);
    
    // Log filtering operation
    console.log(`Filtering aircraft for ${region || 'all regions'}${type ? `, type: ${type}` : ''}`);

    
    // STEP 1: First filter by region
    let filtered = [];
    let formattedRegion = null;
    
    if (region) {
      formattedRegion = this.formatRegionForOSDK(region);
      console.log(`Formatted region name: "${formattedRegion}"`);
      
      // Check if we have pre-organized data for this exact region
      if (this.aircraftByRegion[formattedRegion] && this.aircraftByRegion[formattedRegion].all) {
        filtered = [...this.aircraftByRegion[formattedRegion].all];
        console.log(`Using pre-organized data: ${filtered.length} aircraft in ${formattedRegion}`);
      } else {
        // Try to find a matching region using flexible matching
        console.log(`Region "${formattedRegion}" not found in pre-organized data, trying flexible matching`);
        
        // Try each known region and check if it matches
        let matchFound = false;
        for (const knownRegion of Object.keys(this.aircraftByRegion)) {
          if (this.regionsMatch(knownRegion, formattedRegion)) {
            filtered = [...this.aircraftByRegion[knownRegion].all];
            console.log(`Using data from matched region: ${filtered.length} aircraft in ${knownRegion}`);
            
            // Create an alias for faster future access
            this.aircraftByRegion[formattedRegion] = this.aircraftByRegion[knownRegion];
            this.typesByRegion[formattedRegion] = this.typesByRegion[knownRegion] || [];
            
            matchFound = true;
            break;
          }
        }
        
        // If no pre-organized match, fall back to manual filtering
        if (!matchFound) {
          console.log(`No matching pre-organized region found, using manual filtering`);
          filtered = this.aircraftList.filter(aircraft => this.regionsMatch(aircraft.region, formattedRegion));
          console.log(`Manually filtered to ${filtered.length} aircraft for region "${formattedRegion}"`);
        }
      }
    } else {
      // No region specified, use all aircraft
      filtered = [...this.aircraftList];
      console.log(`No region specified, using all ${filtered.length} aircraft`);
    }
    
    // STEP 2: Filter by type if specified and not empty
    if (type && type !== 'all' && type !== '') {
      // Try to use pre-organized type data if available
      if (formattedRegion && 
          this.aircraftByRegion[formattedRegion] && 
          this.aircraftByRegion[formattedRegion].byType && 
          this.aircraftByRegion[formattedRegion].byType[type]) {
        
        filtered = [...this.aircraftByRegion[formattedRegion].byType[type]];
        console.log(`Using pre-organized type data: ${filtered.length} ${type} aircraft in ${formattedRegion}`);
      } else {
        // Filter manually using flexible type matching
        console.log(`Filtering by type "${type}" using flexible matching`);
        
        // First try direct type match
        const directMatches = filtered.filter(aircraft => aircraft.modelType === type);
        
        if (directMatches.length > 0) {
          filtered = directMatches;
        } else {
          // Fall back to flexible type matching
          console.log(`No direct matches for type ${type}, using flexible matching`);
          filtered = filtered.filter(aircraft => {
            // Check modelType with flexible matching
            if (this.typesMatch(aircraft.modelType, type)) {
              return true;
            }
            
            // Check for type in registration
            const typeRegex = /\|\s*(\S+)$/;
            const match = aircraft.registration.match(typeRegex);
            const displayedType = match ? match[1] : '';
            
            // Use flexible matching on displayed type or model name
            return this.typesMatch(displayedType, type) || 
                  (aircraft.modelName && this.typesMatch(aircraft.modelName, type));
          });
          
        }
      }
    }
    
    // Additional detailed logging for S92 after filtering for Gulf of Mexico
    if (formattedRegion === 'GULF OF MEXICO' && (type === 'S92' || !type)) {
      const s92Aircraft = filtered.filter(aircraft => aircraft.modelType === 'S92');
      console.log(`%c===== S92 AIRCRAFT AFTER FILTERING (count: ${s92Aircraft.length}) =====`, 'background: #f00; color: #fff;');
      
      // Show each S92 aircraft in detail
      s92Aircraft.forEach(aircraft => {
        console.log(`- Registration: ${aircraft.registration}`);
        console.log(`  Model: ${aircraft.modelName}`);
        console.log(`  Type: ${aircraft.modelType}`);
        console.log(`  Region: ${aircraft.region}`);
        console.log(`  Status: ${aircraft.status || 'Unknown'}`);
      });
      
      // Look for potential duplicates
      const registrations = s92Aircraft.map(a => a.registration);
      const uniqueRegs = new Set(registrations);
      
      if (registrations.length !== uniqueRegs.size) {
        console.log(`%c⚠️ WARNING: FOUND DUPLICATE REGISTRATIONS IN S92 AIRCRAFT`, 'background: #f00; color: #ff0; font-weight: bold;');
        // Find the duplicates
        const counts = {};
        registrations.forEach(reg => {
          counts[reg] = (counts[reg] || 0) + 1;
        });
        
        for (const [reg, count] of Object.entries(counts)) {
          if (count > 1) {
            console.log(`Registration ${reg} appears ${count} times!`);
          }
        }
      }
    }
    
    // Temporarily cache the results in this.filteredAircraft for quick access
    this.filteredAircraft = filtered;
    
    // Create a temporary overlay to display the results
    this.showFilteringResults(filtered.length, region, type);
    
    // STEP 3: Create type buckets for the UI even if filtering by a specific type
    // This allows the UI to show counts for all types even when a specific type is selected
    const typeBuckets = {};
    
    // If we've filtered by region only (no type filter)
    if (region && !type && formattedRegion && this.aircraftByRegion[formattedRegion]) {
      // Use pre-calculated type buckets
      console.log(`Using pre-calculated type buckets for region ${formattedRegion}`);
      
      // Get all type buckets for this region
      Object.keys(this.aircraftByRegion[formattedRegion].byType).forEach(typeKey => {
        typeBuckets[typeKey] = this.aircraftByRegion[formattedRegion].byType[typeKey];
      });
    } else {
      // Create type buckets from the filtered aircraft
      console.log(`Creating type buckets from filtered aircraft`);
      
      // Build a map of known types with empty arrays
      const allTypes = this.getAvailableTypes();
      allTypes.forEach(typeKey => {
        typeBuckets[typeKey] = [];
      });
      
      // Group filtered aircraft by type
      filtered.forEach(aircraft => {
        const aircraftType = aircraft.modelType || 'S92';
        if (!typeBuckets[aircraftType]) {
          typeBuckets[aircraftType] = [];
        }
        typeBuckets[aircraftType].push(aircraft);
      });
    }
    
    // Trigger the callback with additional info for the UI
    const callbackData = {
      filtered: this.filteredAircraft,
      byType: typeBuckets
    };
    
    this.triggerCallback('onAircraftFiltered', this.filteredAircraft);
    
    return this.filteredAircraft;
  }
  
  /**
   * Show filtering results in the console
   * @param {number} count - Number of aircraft after filtering
   * @param {string} region - Region filter applied
   * @param {string} type - Type filter applied
   */
  showFilteringResults(count, region, type) {
    // Just log to console to avoid any issues
    const regionText = region ? this.formatRegionForOSDK(region) : 'All Regions';
    const typeText = type ? type : 'All Types';
    
    console.log(`Aircraft filtered: ${count} aircraft found for ${regionText}, ${typeText}`);
    
    // Only attempt to update the status indicator if it exists and is working properly
    try {
      if (window.LoadingIndicator && typeof window.LoadingIndicator.updateStatusIndicator === 'function') {
        window.LoadingIndicator.updateStatusIndicator(`Found: ${count} aircraft`);
      }
    } catch (e) {
      console.error('Error updating status indicator:', e);
    }
  }
  
  /**
   * Filter aircraft by region specifically - alias for filterAircraft
   * @param {string} region - The region ID to filter by
   * @param {string} type - Optional aircraft type
   * @returns {Array} - The filtered aircraft list
   */
  filterAircraftByRegion(region, type = null) {
    console.log(`Filtering aircraft by region: ${region}`);
    return this.filterAircraft(region, type);
  }

  /**
   * Reset aircraft filtering for region changes
   * Clears the filtered aircraft and prepares for new region data
   * but doesn't clear our permanent data
   */
  resetAircraftForRegion() {
    console.log('Resetting filtered aircraft for region change');
    this.filteredAircraft = [];
    
    // We won't clear the main aircraftList or our organized data
    // but we'll trigger the callback to reset the UI
    this.triggerCallback('onAircraftFiltered', []);
  }
  
  /**
   * Get counts of aircraft by type for a specific region
   * @param {string} region - Region ID to get counts for
   * @returns {Object} - Object with type keys and count values
   */
  getAircraftCountsByType(region) {
    if (!region) return {};
    
    // Format region for consistency
    const formattedRegion = this.formatRegionForOSDK(region);
    
    // Use the pre-organized data if available
    if (this.aircraftByRegion[formattedRegion]) {
      const typeCounts = {};
      Object.keys(this.aircraftByRegion[formattedRegion].byType).forEach(type => {
        typeCounts[type] = this.aircraftByRegion[formattedRegion].byType[type].length;
      });
      return typeCounts;
    }
    
    // If not available, calculate it now
    const aircraftInRegion = this.getAircraftByRegion(region);
    
    // Group by type and count
    const typeCounts = {};
    aircraftInRegion.forEach(aircraft => {
      const type = aircraft.modelType || 'S92';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    
    return typeCounts;
  }
  
  /**
   * Get all available aircraft types across all regions
   * @returns {Array} - Array of available aircraft types
   */
  getAvailableTypes() {
    // Get unique aircraft types from all aircraft
    const types = [...new Set(this.aircraftList.map(aircraft => aircraft.modelType))];
    return types.filter(type => type); // Remove null/undefined
  }

  /**
   * Get aircraft by registration
   * @param {string} registration - The aircraft registration
   * @returns {Object} - The aircraft data or null if not found
   */
  getAircraftByRegistration(registration) {
    return this.aircraftList.find(aircraft => aircraft.registration === registration) || null;
  }

  /**
   * Select an aircraft by registration
   * @param {string} registration - The aircraft registration
   */
  selectAircraft(registration) {
    const aircraft = this.getAircraftByRegistration(registration);
    if (aircraft) {
      this.selectedAircraft = aircraft;
      this.triggerCallback('onAircraftSelected', aircraft);
    } else {
      console.warn(`Aircraft with registration ${registration} not found`);
    }
  }

  /**
   * Get performance data for an aircraft type
   * @param {string} type - The aircraft type
   * @param {string} registration - Specific aircraft registration (optional)
   * @returns {Object} - Performance data
   */
  getPerformanceData(type, registration = null) {
    // Try to get data for specific aircraft if registration is provided
    if (registration) {
      const aircraft = this.getAircraftByRegistration(registration);
      if (aircraft) {
        return {
          cruiseSpeed: aircraft.cruiseSpeed || this.defaultPerformanceData[type]?.cruiseSpeed || 145,
          fuelBurn: aircraft.fuelBurn || this.defaultPerformanceData[type]?.fuelBurn || 1100,
          maxFuel: aircraft.maxFuel || this.defaultPerformanceData[type]?.maxFuel || 5000,
          maxPassengers: aircraft.maxPassengers || this.defaultPerformanceData[type]?.maxPassengers || 19,
          usefulLoad: aircraft.usefulLoad || this.defaultPerformanceData[type]?.usefulLoad || 7000
        };
      }
    }
    
    // Fall back to default data for the type
    return this.defaultPerformanceData[type] || this.defaultPerformanceData['s92']; // Default to S-92
  }

  /**
   * Calculate performance for a route
   * @param {string} aircraftType - The aircraft type
   * @param {Array} coordinates - Array of waypoint coordinates
   * @param {Object} params - Additional parameters (payload, fuel, etc.)
   * @returns {Object} - Calculated performance data
   */
  calculateRoutePerformance(aircraftType, coordinates, params = {}) {
    // Get performance data for the aircraft type
    const aircraft = this.getPerformanceData(aircraftType, params.registration);
    
    // Extract parameters with defaults
    const payloadWeight = params.payloadWeight || 2000; // lbs
    const reserveFuel = params.reserveFuel || 600; // lbs
    
    // Calculate total distance
    let totalDistance = 0;
    for (let i = 0; i < coordinates.length - 1; i++) {
      const [lng1, lat1] = coordinates[i];
      const [lng2, lat2] = coordinates[i + 1];
      
      // Use Haversine formula to calculate distance
      const R = 3440.07; // Earth radius in nautical miles
      const dLat = this.toRad(lat2 - lat1);
      const dLon = this.toRad(lng2 - lng1);
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * 
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;
      
      totalDistance += distance;
    }
    
    // Calculate flight time
    const flightTime = totalDistance / aircraft.cruiseSpeed; // hours
    
    // Calculate fuel required
    const fuelRequired = (flightTime * aircraft.fuelBurn) + reserveFuel;
    
    // Calculate remaining useful load
    const usableLoad = aircraft.usefulLoad - fuelRequired;
    
    // Calculate max passengers (assuming 200 lbs per passenger including baggage)
    const passengerWeightWithBaggage = 200; // lbs per passenger
    const maxPassengers = Math.floor((usableLoad - payloadWeight) / passengerWeightWithBaggage);
    
    // Format time as HH:MM
    const hours = Math.floor(flightTime);
    const minutes = Math.round((flightTime - hours) * 60);
    const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    return {
      totalDistance: Math.round(totalDistance),
      flightTime: flightTime,
      formattedTime: formattedTime,
      fuelRequired: Math.round(fuelRequired),
      usableLoad: Math.round(usableLoad),
      maxPassengers: Math.max(0, maxPassengers), // Ensure it's not negative
      aircraft: aircraft
    };
  }
  
  /**
   * Helper method to check if two regions match using flexible matching
   * @param {string} region1 - First region name
   * @param {string} region2 - Second region name
   * @returns {boolean} - True if regions are considered a match
   */
  regionsMatch(region1, region2) {
    if (!region1 || !region2) return false;
    
    // Convert to uppercase for comparison
    const r1 = region1.toUpperCase().trim();
    const r2 = region2.toUpperCase().trim();
    
    // Direct match
    if (r1 === r2) return true;
    
    // Check if one contains the other
    if (r1.includes(r2) || r2.includes(r1)) return true;
    
    // Special case mappings
    const regionAliases = {
      'GULF OF MEXICO': ['US', 'GOM', 'MEXICO', 'UNITED STATES'],
      'NIGERIA': ['WEST AFRICA', 'AFRICAN'],
      'UNITED KINGDOM': ['UK', 'BRITAIN', 'SCOTLAND'],
      'TRINIDAD AND TOBAGO': ['TRINIDAD', 'TOBAGO'],
      'BRAZIL': ['BRAZIL EAST', 'BRAZILIAN', 'SOUTH AMERICA'],
      'NORWAY': ['NORWEGIAN', 'SCANDINAVIAN'],
      'NETHERLANDS': ['DUTCH', 'HOLLAND'],
      'IRELAND': ['IRISH']
    };
    
    // Check region aliases
    for (const [key, aliases] of Object.entries(regionAliases)) {
      // If r1 is the key, check if r2 is in aliases
      if (r1 === key && aliases.some(alias => r2.includes(alias))) return true;
      
      // If r2 is the key, check if r1 is in aliases
      if (r2 === key && aliases.some(alias => r1.includes(alias))) return true;
      
      // If r1 contains any alias, check if r2 is the key
      if (aliases.some(alias => r1.includes(alias)) && r2 === key) return true;
      
      // If r2 contains any alias, check if r1 is the key
      if (aliases.some(alias => r2.includes(alias)) && r1 === key) return true;
    }
    
    return false;
  }
  
  /**
   * Helper method to check if two aircraft types match using flexible matching
   * @param {string} type1 - First aircraft type
   * @param {string} type2 - Second aircraft type
   * @returns {boolean} - True if types are considered a match
   */
  typesMatch(type1, type2) {
    if (!type1 || !type2) return false;
    
    // Convert to uppercase for comparison
    const t1 = type1.toUpperCase().trim();
    const t2 = type2.toUpperCase().trim();
    
    // Direct match
    if (t1 === t2) return true;
    
    // Extract basic type pattern (letters followed by numbers)
    const t1Base = t1.match(/^[A-Z]+\d+/);
    const t2Base = t2.match(/^[A-Z]+\d+/);
    
    // If we have base patterns and they match
    if (t1Base && t2Base && t1Base[0] === t2Base[0]) return true;
    
    // Check if one type contains the other
    if (t1.includes(t2) || t2.includes(t1)) return true;
    
    // Type families and variations
    const typeFamilies = {
      'S92': ['S92A', 'S-92', 'S-92A', 'SIKORSKY 92'],
      'S76': ['S76D', 'S76C', 'S-76', 'S-76C', 'S-76D', 'SIKORSKY 76'],
      'AW139': ['AW-139', 'AGUSTA 139', 'AGUSTA WESTLAND 139'],
      'AW189': ['AW-189', 'AGUSTA 189', 'AGUSTA WESTLAND 189'],
      'H175': ['H-175', 'EC175', 'EC-175', 'AIRBUS 175'],
      'H160': ['H-160', 'EC160', 'EC-160', 'AIRBUS 160'],
      'EC135': ['EC-135', 'EUROCOPTER 135', 'H135', 'H-135'],
      'EC225': ['EC-225', 'H225', 'H-225', 'EUROCOPTER 225'],
      'AS350': ['AS-350', 'EUROCOPTER 350', 'H125', 'H-125']
    };
    
    // Check type families
    for (const [key, variations] of Object.entries(typeFamilies)) {
      // If t1 is the key, check if t2 is in variations
      if (t1 === key && variations.some(v => t2.includes(v))) return true;
      
      // If t2 is the key, check if t1 is in variations
      if (t2 === key && variations.some(v => t1.includes(v))) return true;
      
      // If t1 is in variations, check if t2 is the key
      if (variations.some(v => t1.includes(v)) && t2 === key) return true;
      
      // If t2 is in variations, check if t1 is the key
      if (variations.some(v => t2.includes(v)) && t1 === key) return true;
    }
    
    return false;
  }

  /**
   * Convert degrees to radians
   * @param {number} degrees - Angle in degrees
   * @returns {number} - Angle in radians
   */
  toRad(degrees) {
    return degrees * (Math.PI / 180);
  }
}

export default AircraftManager;