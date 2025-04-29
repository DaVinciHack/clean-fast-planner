/**
 * AircraftManager.js
 * 
 * Handles loading, filtering, and management of aircraft data from Palantir OSDK.
 * Provides aircraft performance data for route calculations.
 */

import { orgUnitToRegionMap, getRegionFromOrgUnit, getOrgUnitFromRegion } from './regionMapping';

class AircraftManager {
  constructor() {
    // Store all loaded aircraft data
    this.aircraftList = [];
    
    // Store filtered aircraft data (by region, type, etc.)
    this.filteredAircraft = [];
    
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
        cruiseSpeed: 145, // knots
        fuelBurn: 1100,   // lbs per hour
        maxFuel: 5000,    // lbs
        maxPassengers: 19,
        maxRange: 450,    // nm
        usefulLoad: 7000  // lbs
      },
      's76': {
        cruiseSpeed: 140, // knots
        fuelBurn: 700,    // lbs per hour
        maxFuel: 3000,    // lbs
        maxPassengers: 12,
        maxRange: 400,    // nm
        usefulLoad: 5000  // lbs
      },
      's76d': {
        cruiseSpeed: 150, // knots
        fuelBurn: 730,    // lbs per hour
        maxFuel: 3300,    // lbs
        maxPassengers: 12,
        maxRange: 420,    // nm
        usefulLoad: 5200  // lbs
      },
      'aw139': {
        cruiseSpeed: 150, // knots
        fuelBurn: 850,    // lbs per hour
        maxFuel: 4000,    // lbs
        maxPassengers: 15,
        maxRange: 400,    // nm
        usefulLoad: 6000  // lbs
      },
      'aw189': {
        cruiseSpeed: 150, // knots
        fuelBurn: 950,    // lbs per hour
        maxFuel: 4500,    // lbs
        maxPassengers: 16,
        maxRange: 430,    // nm
        usefulLoad: 6300  // lbs
      },
      'h175': {
        cruiseSpeed: 150, // knots
        fuelBurn: 900,    // lbs per hour
        maxFuel: 4200,    // lbs
        maxPassengers: 16,
        maxRange: 440,    // nm
        usefulLoad: 6500  // lbs
      },
      'h160': {
        cruiseSpeed: 140, // knots
        fuelBurn: 700,    // lbs per hour
        maxFuel: 3200,    // lbs
        maxPassengers: 12,
        maxRange: 420,    // nm
        usefulLoad: 4800  // lbs
      },
      'ec135': {
        cruiseSpeed: 130, // knots
        fuelBurn: 550,    // lbs per hour
        maxFuel: 2000,    // lbs
        maxPassengers: 7,
        maxRange: 350,    // nm
        usefulLoad: 3300  // lbs
      },
      'ec225': {
        cruiseSpeed: 142, // knots
        fuelBurn: 1000,   // lbs per hour
        maxFuel: 4800,    // lbs
        maxPassengers: 19,
        maxRange: 450,    // nm
        usefulLoad: 6800  // lbs
      },
      'as350': {
        cruiseSpeed: 120, // knots
        fuelBurn: 400,    // lbs per hour
        maxFuel: 1500,    // lbs
        maxPassengers: 6,
        maxRange: 360,    // nm
        usefulLoad: 2500  // lbs
      },
      'a119': {
        cruiseSpeed: 135, // knots
        fuelBurn: 500,    // lbs per hour
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
   * Load aircraft data from Palantir OSDK
   * @param {Object} client - The OSDK client instance
   * @param {string} region - The region to filter by (optional)
   * @returns {Promise} - Resolves with the loaded aircraft data
   */
  async loadAircraftFromOSDK(client, region = null) {
    try {
      // EMERGENCY FIX: Hard-code the region if none is provided
      if (!region) {
        console.warn('NO REGION PROVIDED - USING GULF OF MEXICO AS DEFAULT');
        region = 'Gulf of Mexico';
      }
      
      // Get region display name and format it consistently
      let regionDisplayName = '';
      let orgUnitCode = '';
      
      if (typeof region === 'string') {
        regionDisplayName = region;
        orgUnitCode = getOrgUnitFromRegion(region);
      } else if (region && region.name) {
        regionDisplayName = region.name;
        orgUnitCode = getOrgUnitFromRegion(region.name);
      }
      
      console.log(`===== Loading aircraft data from OSDK for region: ${regionDisplayName} (orgUnit: ${orgUnitCode}) =====`);
      
      // Show loading overlay
      const loadingOverlay = document.getElementById('loading-overlay');
      if (loadingOverlay) {
        loadingOverlay.textContent = 'Loading aircraft data...';
        loadingOverlay.style.display = 'block';
      }
      
      // Check if client exists
      if (!client) {
        throw new Error('OSDK client is not provided');
      }
      
      // Log additional debugging information
      console.log('CLIENT STATE:', client ? 'EXISTS' : 'MISSING');
      console.log('REGION INFO:', { displayName: regionDisplayName, orgUnitCode });
      
      // Use the dynamic import to get the Asset interface
      const sdk = await import('@flight-app/sdk');
      
      // Log SDK keys to debug
      console.log('SDK keys:', Object.keys(sdk));
      
      // Log client details for debugging
      if (client) {
        console.log('Client type:', typeof client);
        console.log('Client methods:', Object.getOwnPropertyNames(client).filter(item => typeof client[item] === 'function'));
      }
      
      // Based on the screenshots, we're looking for Asset (not AircraftAsset)
      const Asset = sdk.Asset;
      
      if (!Asset) {
        throw new Error(`Required 'Asset' object not found in SDK: ${Object.keys(sdk).join(', ')}`);
      }
      
      console.log(`Querying aircraft data for region: ${regionDisplayName}`);
      
      // Build the query without a region filter first
      let query = client(Asset);
      
      // Only apply the where clause if we have a valid orgUnit code
      if (orgUnitCode && orgUnitCode.length > 0) {
        console.log(`Applying where clause with orgUnit: "${orgUnitCode}"`);
        // Use orgUnit for filtering instead of regionName
        query = query.where({
          orgUnit: orgUnitCode
        });
      }
      
      // Execute query - simplify and make it robust
      console.log('%c===== EXECUTING OSDK QUERY =====', 
        'background: #700; color: #fff; font-size: 16px; font-weight: bold;');
      
      console.log(`Final query parameters - Region: "${regionDisplayName}", orgUnit: "${orgUnitCode}"`);
      
      // Fetch the data with error handling
      console.log('Executing fetchPage query...');
      let response = { data: [] };
      
      try {
        response = await query.fetchPage({
          $pageSize: 100
        });
        
        if (!response || !response.data) {
          console.warn('Query returned no data or invalid response');
          response = { data: [] };
        } else {
          console.log(`Query returned ${response.data.length} aircraft`);
        }
      } catch (queryError) {
        console.error('ERROR EXECUTING OSDK QUERY:', queryError);
        
        // Try to extract useful information from the error
        let errorMessage = 'Unknown error executing OSDK query';
        if (queryError.message) {
          errorMessage = queryError.message;
        }
        
        // Create a user-visible error message
        let errorOverlay = document.getElementById('osdk-error-overlay');
        if (!errorOverlay) {
          errorOverlay = document.createElement('div');
          errorOverlay.id = 'osdk-error-overlay';
          errorOverlay.style.position = 'fixed';
          errorOverlay.style.top = '50%';
          errorOverlay.style.left = '50%';
          errorOverlay.style.transform = 'translate(-50%, -50%)';
          errorOverlay.style.backgroundColor = 'rgba(200,0,0,0.9)';
          errorOverlay.style.color = 'white';
          errorOverlay.style.padding = '20px';
          errorOverlay.style.borderRadius = '10px';
          errorOverlay.style.zIndex = '10000';
          errorOverlay.style.maxWidth = '80%';
          errorOverlay.style.textAlign = 'center';
          document.body.appendChild(errorOverlay);
        }
        
        errorOverlay.innerHTML = `
          <h3>Error Loading Aircraft Data</h3>
          <p>${errorMessage}</p>
          <p>Region: ${regionDisplayName}</p>
          <p>orgUnit: ${orgUnitCode}</p>
          <p>This may indicate an authentication issue or network problem.</p>
          <button style="padding: 10px; margin-top: 10px; cursor: pointer; background: #fff; color: #000; border: none; border-radius: 5px;" 
                  onclick="this.parentNode.style.display='none';">
            Close
          </button>
        `;
        
        // Return an empty response rather than throwing
        response = { data: [] };
      }
      
      // Process the response
      if (response && response.data) {
        // Log sample data to understand the structure
        if (response.data.length > 0) {
          console.log('Sample aircraft data structure:', Object.keys(response.data[0]).join(', '));
          console.log('Sample data for first aircraft:', JSON.stringify(response.data[0], null, 2));
          
          // CRITICAL: Check the actual region data that's coming back
          console.log('Checking orgUnits in returned aircraft data:');
          const orgUnitCounts = {};
          response.data.forEach(aircraft => {
            const orgUnit = aircraft.orgUnit || 'Unknown';
            orgUnitCounts[orgUnit] = (orgUnitCounts[orgUnit] || 0) + 1;
          });
          console.log('Aircraft counts by orgUnit in OSDK data:', orgUnitCounts);
        } else {
          console.warn('OSDK returned empty aircraft data array');
        }
        
        this.aircraftList = response.data.map(aircraft => {
          console.log('Processing aircraft:', aircraft);
          
          // Extract orgUnit and convert to display region
          let orgUnit = aircraft.orgUnit || '';
          let displayRegion = getRegionFromOrgUnit(orgUnit);
          
          // Extract registration from assetIdentifier with fallbacks
          let registration = aircraft.assetIdentifier || aircraft.registration || aircraft.tailNumber || '';
          
          // Exit early if no registration
          if (!registration) {
            console.warn('Skipping aircraft without registration:', aircraft);
            return null;
          }
          
          // Extract model type from acModelName or model with fallbacks
          let modelName = aircraft.acModelName || aircraft.model || aircraft.aircraftType || '';
          let modelType = '';
          
          // Determine aircraft type based on model name
          modelType = this.determineAircraftType(modelName);
          
          // Create a display registration with both registration and region
          const displayRegistration = `${registration} (${displayRegion})`;
          
          // Extract the properties using the exact field names from your property list
          return {
            assetId: aircraft.assetIdx || '',
            registration: displayRegistration, // Use the combined format
            rawRegistration: registration, // Keep the original registration
            modelName: modelName,
            modelType: modelType,
            maxPassengers: aircraft.maxPassengers || 0,
            cruiseSpeed: aircraft.cruseSpeed || 0,
            fuelBurn: aircraft.fuelBurn || 0,
            maxFuel: aircraft.maxFuelCapacity || 0,
            dryWeight: aircraft.dryOperatingWeightLbs || 0,
            usefulLoad: aircraft.usefulLoad || 0,
            company: aircraft.company || aircraft.orgName || 'Unknown',
            region: displayRegion, // Store display region name
            orgUnit: orgUnit, // Store original orgUnit code
            status: aircraft.acStatus || 'ACTIVE',
            rawData: aircraft // Keep the full data for reference
          };
        });
        
        // Filter out aircraft with invalid data or nulls from the map
        this.aircraftList = this.aircraftList.filter(aircraft => 
          aircraft && // Remove nulls from the map
          aircraft.registration && 
          aircraft.modelName && 
          (aircraft.status !== 'INACTIVE' && aircraft.status !== 'RETIRED')
        );
        
        console.log(`Processed ${this.aircraftList.length} valid aircraft`);
        
        // Log aircraft by region
        const regionCount = {};
        this.aircraftList.forEach(aircraft => {
          const region = aircraft.region || 'Unknown';
          regionCount[region] = (regionCount[region] || 0) + 1;
        });
        console.log('Aircraft by region:', regionCount);
        
        // Log aircraft types found
        const typeCount = {};
        this.aircraftList.forEach(aircraft => {
          const type = aircraft.modelType;
          typeCount[type] = (typeCount[type] || 0) + 1;
        });
        console.log('Aircraft by type:', typeCount);
        
        // Initial filtering (by region if provided)
        this.filteredAircraft = [...this.aircraftList];
        if (region) {
          this.filterAircraft(regionDisplayName);
        }
        
        // Trigger the callback with ALL aircraft first
        this.triggerCallback('onAircraftLoaded', this.aircraftList);
        
        // Then trigger the filtered callback
        this.triggerCallback('onAircraftFiltered', this.filteredAircraft);
        
        // Hide loading overlay
        if (loadingOverlay) {
          loadingOverlay.style.display = 'none';
        }
        
        return this.aircraftList;
      } else {
        console.warn('No aircraft data in response');
        this.aircraftList = [];
        this.triggerCallback('onAircraftLoaded', []);
        
        // Hide loading overlay
        if (loadingOverlay) {
          loadingOverlay.style.display = 'none';
        }
        
        return [];
      }
    } catch (error) {
      // Provide detailed error logging
      console.error('Error loading aircraft from OSDK:', error);
      
      if (error.message) {
        console.error('Error message:', error.message);
      }
      
      if (error.stack) {
        console.error('Error stack:', error.stack);
      }
      
      // Try to log more details about the SDK import
      try {
        import('@flight-app/sdk').then(sdk => {
          console.log('SDK exported keys:', Object.keys(sdk));
        }).catch(importError => {
          console.error('Error importing SDK:', importError);
        });
      } catch (importError) {
        console.error('Cannot import SDK for debugging:', importError);
      }
      
      // Trigger error callback
      this.triggerCallback('onError', error);
      
      // Hide loading overlay
      const loadingOverlay = document.getElementById('loading-overlay');
      if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
      }
      
      // No mock data, just return empty list
      this.aircraftList = [];
      this.triggerCallback('onAircraftLoaded', this.aircraftList);
      
      return this.aircraftList;
    }
  }

  /**
   * Format region name to match OSDK format
   * @param {string|object} region - The region ID (e.g., 'gulf-of-mexico') or region object
   * @returns {string} - The formatted region name
   */
  formatRegionForOSDK(region) {
    if (!region) return '';
    
    // CRITICAL FIX: Handle different region parameter types
    let regionId = region;
    
    // If region is an object, extract the appropriate property
    if (typeof region === 'object' && region !== null) {
      regionId = region.name || region.id || '';
      console.log(`Extracted region identifier "${regionId}" from region object`);
    }
    
    // Convert to string just in case
    regionId = String(regionId);
    
    // For display purposes, maintain proper case (title case)
    return regionId;
  }

  /**
   * Determine aircraft type from model name
   * @param {string} modelName - The aircraft model name
   * @returns {string} - The aircraft type
   */
  determineAircraftType(modelName) {
    if (!modelName) return 'S92'; // Default to S92 if no model name
    
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
    
    // Parse the display format we're seeing in the dropdown
    // e.g. extract S92 from "N228BJ (GULF OF MEXICO) | S92"
    const regExMatch = model.match(/\| (\w+\d+\w*)$/);
    if (regExMatch && regExMatch[1]) {
      console.log(`Found type ${regExMatch[1]} via regex from ${modelName}`);
      return regExMatch[1];
    }
    
    // Try to match with type map
    for (const [key, value] of Object.entries(typeMap)) {
      if (model.includes(key)) {
        console.log(`Found type ${value} by matching key ${key} in ${modelName}`);
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
      
      // If we extracted something but don't recognize it, use it anyway
      console.log(`Using extracted but unrecognized type: ${extractedType}`);
      return extractedType;
    }
    
    // Log unrecognized model types with less verbosity
    console.log(`Unrecognized aircraft model: "${modelName}" - defaulting to S92`);
    
    return 'S92'; // Default to S92 if no match
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
   * Filter aircraft by various criteria
   * @param {string} region - Filter by region
   * @param {string} type - Filter by aircraft type
   * @param {string} status - Filter by status
   */
  filterAircraft(region = null, type = null, status = 'ACTIVE') {
    // Create a prominent debug message to track when this is called
    console.log(`%c===== FILTERING AIRCRAFT =====`, 'background: #ff0; color: #000; font-size: 16px; font-weight: bold;');
    console.log(`Region: "${region}", Type: "${type}", Status: "${status}"`);
    
    // CRITICAL FIX: Validate region parameter
    if (!region) {
      console.error('Region parameter is required for filtering');
      this.filteredAircraft = [];
      this.triggerCallback('onAircraftFiltered', []);
      this.showFilteringResults(0, region, type, true);
      return [];
    }
    
    // Display the current state of aircraftList
    console.log(`Total aircraft before filtering: ${this.aircraftList.length}`);
    
    // IMPORTANT: First check if we have any aircraft at all to filter
    if (this.aircraftList.length === 0) {
      console.warn('⚠️ No aircraft in the main list - cannot filter empty list');
      this.filteredAircraft = [];
      this.triggerCallback('onAircraftFiltered', []);
      
      // Show a notification about the empty list
      this.showFilteringResults(0, region, type, true);
      
      return [];
    }
    
    // Show sample of aircraft to debug data structure
    if (this.aircraftList.length > 0) {
      console.log('Sample aircraft before filtering:');
      for (let i = 0; i < Math.min(5, this.aircraftList.length); i++) {
        const ac = this.aircraftList[i];
        console.log(`- ${ac.registration}`);
        console.log(`  Region: "${ac.region}"`);
        console.log(`  OrgUnit: "${ac.orgUnit}"`);
        console.log(`  Type: "${ac.modelType}"`);
        console.log(`  Model: "${ac.modelName}"`);
      }
    }
    
    // Start filtering with a fresh copy of the list
    let filtered = [...this.aircraftList];
    
    // Filter by region if specified (which should always be the case)
    if (region) {
      console.log(`Filtering by region: "${region}"`);
      
      // Get the region as a normalized display name
      const regionDisplayName = this.formatRegionForOSDK(region);
      
      // Show all regions present in the aircraft data for debugging
      const uniqueRegions = [...new Set(this.aircraftList.map(ac => ac.region))];
      console.log('Unique regions in aircraft data:', uniqueRegions);
      
      // DEBUG: Show count of aircraft by region for troubleshooting
      const regionCounts = {};
      this.aircraftList.forEach(ac => {
        const region = ac.region || 'UNKNOWN';
        regionCounts[region] = (regionCounts[region] || 0) + 1;
      });
      console.log('Aircraft counts by region:', regionCounts);
      
      // Get the orgUnit code for the selected region for additional matching
      const orgUnitCode = getOrgUnitFromRegion(regionDisplayName);
      console.log(`Looking for aircraft with region: "${regionDisplayName}" (orgUnit: "${orgUnitCode}")`);
      
      // IMPROVED FILTERING: Apply region matching using both display name and orgUnit
      filtered = filtered.filter(aircraft => {
        // Skip if no region data
        if (!aircraft.region && !aircraft.orgUnit) {
          return false;
        }
        
        // 1. Match by display region (most user-friendly)
        if (aircraft.region && this.regionsMatch(aircraft.region, regionDisplayName)) {
          console.log(`✅ REGION DISPLAY MATCH: ${aircraft.registration}, region: "${aircraft.region}"`);
          return true;
        }
        
        // 2. Match by orgUnit code (most reliable)
        if (aircraft.orgUnit && aircraft.orgUnit === orgUnitCode) {
          console.log(`✅ ORGUNIT MATCH: ${aircraft.registration}, orgUnit: "${aircraft.orgUnit}"`);
          return true;
        }
        
        // 3. Check registration which often contains region in parentheses
        if (aircraft.registration && aircraft.registration.includes(regionDisplayName)) {
          console.log(`✅ REGISTRATION MATCH: ${aircraft.registration} contains region`);
          return true;
        }
        
        return false;
      });
      
      // Enhanced debugging for region filtering results
      if (filtered.length === 0) {
        console.warn(`⚠️ NO AIRCRAFT FOUND for region: "${regionDisplayName}" (orgUnit: "${orgUnitCode}")`);
        // List all available regions to help diagnose the issue
        const availableRegions = [...new Set(this.aircraftList.map(ac => ac.region))];
        console.log('Available regions in aircraft data:', availableRegions);
        const availableOrgUnits = [...new Set(this.aircraftList.map(ac => ac.orgUnit))];
        console.log('Available orgUnits in aircraft data:', availableOrgUnits);
      } else {
        console.log(`✅ Found ${filtered.length} aircraft for region: "${regionDisplayName}" (orgUnit: "${orgUnitCode}")`);
      }
      
      console.log(`After region filter: ${filtered.length} aircraft`);
    }
    
    // Filter by type if specified
    if (type) {
      console.log(`Filtering by type: "${type}"`);
      
      // Log type information for all aircraft before filtering
      console.log('Aircraft type information:');
      const typeInfo = {};
      filtered.forEach(aircraft => {
        const modelType = aircraft.modelType || 'UNKNOWN';
        typeInfo[modelType] = (typeInfo[modelType] || 0) + 1;
      });
      console.log('Count by model type:', typeInfo);
      
      // SIMPLIFIED TYPE FILTERING:
      // Use direct comparison with the model type property
      filtered = filtered.filter(aircraft => {
        if (!aircraft.modelType) return false;
        
        // Get exact matches first
        if (aircraft.modelType === type) {
          console.log(`✅ MATCH: Aircraft ${aircraft.registration} has exact type "${type}"`);
          return true;
        }
        
        // Fall back to checking model name
        if (aircraft.modelName && aircraft.modelName.includes(type)) {
          console.log(`✅ MATCH: Aircraft ${aircraft.registration} has type "${type}" in model name`);
          return true;
        }
        
        // Check registration for type at the end (e.g., "N123AB (REGION) | S92")
        if (aircraft.registration && aircraft.registration.endsWith(`| ${type}`)) {
          console.log(`✅ MATCH: Aircraft ${aircraft.registration} has type at end of registration`);
          return true;
        }
        
        return false;
      });
      
      console.log(`After type filter: ${filtered.length} aircraft`);
    }
    
    // Set the filtered aircraft list
    this.filteredAircraft = filtered;
    
    // Enhanced debug logging
    if (this.filteredAircraft.length > 0) {
      console.log("%c✅ Filtered Aircraft Results:", "color: green; font-weight: bold;");
      console.log(`Found ${this.filteredAircraft.length} aircraft matching criteria`);
      
      // Group results by type for easier viewing
      const resultsByType = {};
      this.filteredAircraft.forEach(aircraft => {
        const type = aircraft.modelType || 'Unknown';
        if (!resultsByType[type]) resultsByType[type] = [];
        resultsByType[type].push(aircraft);
      });
      
      // Log counts by type
      Object.keys(resultsByType).forEach(type => {
        console.log(`- Type ${type}: ${resultsByType[type].length} aircraft`);
      });
      
      // Log first 5 aircraft for verification
      console.log('Sample aircraft after filtering:');
      for (let i = 0; i < Math.min(5, this.filteredAircraft.length); i++) {
        const ac = this.filteredAircraft[i];
        console.log(`- ${ac.registration} (Type: ${ac.modelType}, Region: ${ac.region}, OrgUnit: ${ac.orgUnit})`);
      }
    } else {
      console.warn("%c⚠️ NO AIRCRAFT FOUND", "color: red; font-weight: bold; font-size: 14px;");
      console.log(`Filter criteria - Region: "${region}", Type: "${type}"`);
      
      // Show what aircraft are available for debugging
      console.log("Available aircraft in main list by region:");
      const regionCounts = {};
      this.aircraftList.forEach(ac => {
        const region = ac.region || 'UNKNOWN';
        regionCounts[region] = (regionCounts[region] || 0) + 1;
      });
      console.log(regionCounts);
    }
    
    // Create a temporary overlay to display the results
    this.showFilteringResults(filtered.length, region, type);
    
    // Trigger the callback with the filtered results
    this.triggerCallback('onAircraftFiltered', this.filteredAircraft);
    
    return this.filteredAircraft;
  }
  
  /**
   * Show filtering results in a temporary overlay for debugging
   * @param {number} count - Number of aircraft after filtering
   * @param {string} region - Region filter applied
   * @param {string} type - Type filter applied
   * @param {boolean} emptyList - Whether the main aircraft list is empty
   */
  showFilteringResults(count, region, type, emptyList = false) {
    // Get or create an overlay element
    let overlay = document.getElementById('debug-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'debug-overlay';
      overlay.style.position = 'fixed';
      overlay.style.top = '10px';
      overlay.style.right = '10px';
      overlay.style.backgroundColor = 'rgba(0,0,0,0.8)';
      overlay.style.color = 'white';
      overlay.style.padding = '10px';
      overlay.style.borderRadius = '5px';
      overlay.style.zIndex = '9999';
      overlay.style.fontSize = '14px';
      overlay.style.fontFamily = 'monospace';
      overlay.style.maxWidth = '400px';
      overlay.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
      document.body.appendChild(overlay);
    }
    
    // Create the message
    const regionText = region ? `Region: ${this.formatRegionForOSDK(region)}` : 'All Regions';
    const typeText = type ? `Type: ${type}` : 'All Types';
    
    // Different message if the main list is empty
    if (emptyList) {
      overlay.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 5px; color: #FFC107;">⚠️ Aircraft Data Not Loaded</div>
        <div>${regionText}</div>
        <div>${typeText}</div>
        <div style="margin-top: 5px; font-weight: bold; color: #F44336">
          No aircraft data available - please reload data
        </div>
        <div style="font-size: 12px; margin-top: 10px;">This message will disappear in 8 seconds</div>
      `;
      
      // Show for longer since this is an error state
      setTimeout(() => {
        if (overlay && overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      }, 8000);
    } else {
      overlay.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 5px;">Aircraft Filtering Results:</div>
        <div>${regionText}</div>
        <div>${typeText}</div>
        <div style="margin-top: 5px; font-weight: bold; color: ${count > 0 ? '#4CAF50' : '#F44336'}">
          Found: ${count} aircraft
        </div>
        <div style="font-size: 12px; margin-top: 10px;">This message will disappear in 5 seconds</div>
      `;
      
      // Auto-hide after 5 seconds for normal results
      setTimeout(() => {
        if (overlay && overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      }, 5000);
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
   */
  resetAircraftForRegion() {
    console.log('Resetting aircraft data for region change');
    this.filteredAircraft = [];
    
    // We won't clear the main aircraftList since it contains data for all regions
    // But we'll trigger the callback to reset the UI
    this.triggerCallback('onAircraftFiltered', []);
    
    // Output the current state for debugging
    console.log('Current aircraft list state after reset:');
    console.log(`- Total aircraft: ${this.aircraftList.length}`);
    
    // Output aircraft by region for debugging
    if (this.aircraftList.length > 0) {
      const regionCounts = {};
      this.aircraftList.forEach(aircraft => {
        const region = aircraft.region || 'Unknown';
        regionCounts[region] = (regionCounts[region] || 0) + 1;
      });
      console.log('Aircraft by region:', regionCounts);
    }
  }
  
  /**
   * Get all available aircraft types
   * @returns {Array} - Array of available aircraft types
   */
  getAvailableTypes() {
    // Get unique aircraft types
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