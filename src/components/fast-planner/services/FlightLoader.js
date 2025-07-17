/**
 * FlightLoader - Centralized Flight Loading Service
 * 
 * This service provides a single, unified way to extract and transform flight data
 * from Palantir OSDK objects into the format expected by FastPlannerApp.
 * 
 * Aviation Safety: Ensures all critical fields (especially fuel policy) are properly
 * extracted and validated before flight loading.
 */

/**
 * Extract waypoints from flight data
 * Separates navigation waypoints from landing stops using displayWaypoints field
 */
function extractWaypointsFromFlight(flight) {
  if (!flight._rawFlight?.displayWaypoints) {
    console.warn('FlightLoader: No displayWaypoints found in raw flight data');
    return [];
  }

  try {
    // displayWaypoints contains the complete route including navigation waypoints
    const displayWaypoints = flight._rawFlight.displayWaypoints;
    
    if (Array.isArray(displayWaypoints)) {
      console.log(`FlightLoader: Extracted ${displayWaypoints.length} waypoints from displayWaypoints`);
      return displayWaypoints;
    } else {
      console.warn('FlightLoader: displayWaypoints is not an array:', displayWaypoints);
      return [];
    }
  } catch (error) {
    console.error('FlightLoader: Error extracting waypoints:', error);
    return [];
  }
}

/**
 * Extract and transform flight data from Palantir OSDK flight object
 * 
 * Priority system for fuel policy:
 * 1. Flight-specific policyUuid (from _rawFlight.policyUuid)
 * 2. Fuel object policy (from fuelPlanId lookup)
 * 3. Aircraft default policy (handled in FastPlannerApp)
 * 4. Region default policy (handled in FastPlannerApp)
 * 
 * @param {Object} flight - Palantir flight object with _rawFlight data
 * @returns {Object} - Transformed flight data for FastPlannerApp
 */
export function extractFlightData(flight) {
  console.log('FlightLoader: Starting flight data extraction');
  console.log('FlightLoader: Raw flight available:', !!flight._rawFlight);
  
  if (!flight._rawFlight) {
    console.error('FlightLoader: CRITICAL - No _rawFlight data available!');
    throw new Error('Flight data missing _rawFlight - cannot extract critical fields');
  }

  const rawFlight = flight._rawFlight;
  console.log('FlightLoader: Raw flight keys:', Object.keys(rawFlight));

  // Extract and validate critical fields
  const flightData = {
    // Basic flight identification
    flightId: flight.id,
    flightNumber: flight.flightNumber,
    
    // Waypoints and stops - critical for route reconstruction
    stops: flight.stops || [],
    waypoints: extractWaypointsFromFlight(flight),
    
    // 🛩️ FUEL POLICY - HIGHEST PRIORITY FIELD
    // PRIMARY: Extract from attached fuel object, FALLBACK: aircraft default
    policyUuid: (() => {
      console.log('FlightLoader: 🛩️ FUEL POLICY EXTRACTION - Starting comprehensive search...');
      
      // 🏆 PRIMARY PRIORITY: Attached fuel object policyUuid (main automation flow)
      console.log('FlightLoader: 🔍 Searching for attached fuel object...');
      
      // Check fuel object locations (ordered by most common first for automation)
      const fuelObjectSources = [
        // Most common automation locations first
        { obj: rawFlight, name: 'rawFlight.fuelPlan', path: 'fuelPlan' },
        { obj: flight, name: 'flight.fuelPlan', path: 'fuelPlan' },
        { obj: rawFlight, name: 'rawFlight.fuelObject', path: 'fuelObject' },
        { obj: flight, name: 'flight.fuelObject', path: 'fuelObject' },
        // Legacy locations last
        { obj: rawFlight, name: 'rawFlight.fuel', path: 'fuel' },
        { obj: flight, name: 'flight.fuel', path: 'fuel' }
      ];
      
      for (const source of fuelObjectSources) {
        const fuelObject = source.obj[source.path];
        if (fuelObject && typeof fuelObject === 'object') {
          console.log(`FlightLoader: ✅ Found fuel object at ${source.name}:`, fuelObject);
          console.log(`FlightLoader: Fuel object keys:`, Object.keys(fuelObject));
          
          // Check camelCase policyUuid
          if (fuelObject.policyUuid) {
            console.log('FlightLoader: 🎯 Found policyUuid (camelCase) in fuel object:', fuelObject.policyUuid);
            return fuelObject.policyUuid;
          }
          
          // Check snake_case policy_uuid
          if (fuelObject.policy_uuid) {
            console.log('FlightLoader: 🎯 Found policy_uuid (snake_case) in fuel object:', fuelObject.policy_uuid);
            return fuelObject.policy_uuid;
          }
          
          // Check for UUID pattern in any field
          const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          for (const [key, value] of Object.entries(fuelObject)) {
            if (typeof value === 'string' && uuidPattern.test(value)) {
              console.log(`FlightLoader: 🎯 Found UUID pattern in fuel object field "${key}":`, value);
              // Return the first UUID we find - this is likely the policy UUID
              return value;
            }
          }
          
          console.log(`FlightLoader: ❌ No policyUuid found in ${source.name}`);
        }
      }
      
      console.log('FlightLoader: ❌ No fuel object found in any standard location');
      
      // 🔄 FALLBACK: Check flight-level policy fields (legacy flights)
      if (rawFlight.policyUuid) {
        console.log('FlightLoader: 🔄 Found fallback policyUuid in rawFlight:', rawFlight.policyUuid);
        return rawFlight.policyUuid;
      }
      
      if (flight.policyUuid) {
        console.log('FlightLoader: 🔄 Found fallback policyUuid in flight:', flight.policyUuid);
        return flight.policyUuid;
      }
      
      console.log('FlightLoader: ❌ No policyUuid found anywhere - will use aircraft default');
      return null;
    })(),
    
    // Aircraft and crew assignments - check multiple possible locations for maximum compatibility
    aircraftId: flight.aircraftId || rawFlight.aircraftId || flight.aircraft || rawFlight.aircraft || null,
    captainId: flight.captainId,
    copilotId: flight.copilotId,
    medicId: flight.medicId,
    soId: flight.soId,
    rswId: flight.rswId,
    
    // 💾 FUEL DATA - Critical for fuel system restoration
    fuelPlanId: flight.fuelPlanId || rawFlight.fuelPlanId || flight.fuelPlan?.$primaryKey || rawFlight.fuelPlan?.$primaryKey,
    
    // 🌬️ WIND DATA - Use automation-calculated averages for accuracy
    windData: {
      windSpeed: rawFlight.avgWindSpeed || rawFlight.windSpeed || flight.avgWindSpeed || flight.windSpeed || 0,
      windDirection: rawFlight.avgWindDirection || rawFlight.windDirection || flight.avgWindDirection || flight.windDirection || 0,
      source: 'palantir_automation'
    },
    
    // Flight metadata
    etd: flight.date,
    region: flight.region,
    alternateLocation: flight.alternateLocation,
    
    // 🔄 ALTERNATE ROUTE DATA - Complete alternate route reconstruction
    alternateRouteData: extractAlternateRouteData(rawFlight),
    
    // Include raw flight for advanced processing
    _rawFlight: rawFlight
  };

  // Validation and logging
  console.log('FlightLoader: Extracted flight data:', {
    flightId: flightData.flightId,
    aircraftId: flightData.aircraftId,
    policyUuid: flightData.policyUuid,
    fuelPlanId: flightData.fuelPlanId,
    waypointCount: flightData.waypoints.length,
    stopsCount: flightData.stops.length,
    hasAlternateRoute: !!flightData.alternateRouteData,
    windSpeed: flightData.windData.windSpeed,
    windDirection: flightData.windData.windDirection
  });

  // Enhanced aircraft extraction logging
  console.log('FlightLoader: Aircraft extraction details:', {
    'flight.aircraftId': flight.aircraftId,
    'rawFlight.aircraftId': rawFlight.aircraftId,
    'flight.aircraft': flight.aircraft,
    'rawFlight.aircraft': rawFlight.aircraft,
    'final_aircraftId': flightData.aircraftId
  });

  // Enhanced fuel policy extraction logging (including snake_case checks)
  const fuelObjectCheck = flight.fuelObject || flight.fuel || rawFlight.fuelObject || rawFlight.fuel;
  console.log('FlightLoader: Fuel policy extraction details:', {
    'rawFlight.policyUuid': rawFlight.policyUuid,
    'rawFlight.policy_uuid': rawFlight.policy_uuid,
    'flight.policyUuid': flight.policyUuid,
    'flight.policy_uuid': flight.policy_uuid,
    'flight.fuelObject available': !!flight.fuelObject,
    'flight.fuel available': !!flight.fuel,
    'rawFlight.fuelObject available': !!rawFlight.fuelObject,
    'rawFlight.fuel available': !!rawFlight.fuel,
    'found fuel object': !!fuelObjectCheck,
    'fuelObject.policyUuid': fuelObjectCheck?.policyUuid,
    'fuelObject.policy_uuid': fuelObjectCheck?.policy_uuid,
    'flight.fuelPolicyUuid': flight.fuelPolicyUuid,
    'flight.fuel_policy_uuid': flight.fuel_policy_uuid,
    'rawFlight.fuelPolicyUuid': rawFlight.fuelPolicyUuid,
    'rawFlight.fuel_policy_uuid': rawFlight.fuel_policy_uuid,
    'final_policyUuid': flightData.policyUuid
  });
  
  // Show all available keys on flight object for debugging
  console.log('FlightLoader: Flight object keys:', Object.keys(flight));
  console.log('FlightLoader: Raw flight object keys:', Object.keys(rawFlight));
  
  // COMPREHENSIVE SEARCH: Look for ANY field that might contain fuel data
  console.log('FlightLoader: 🔍 COMPREHENSIVE FUEL OBJECT SEARCH:');
  
  // Check all fields on flight object for fuel-related data
  Object.keys(flight).forEach(key => {
    const value = flight[key];
    if (key.toLowerCase().includes('fuel') || (value && typeof value === 'object' && value.policyUuid)) {
      console.log(`FlightLoader: Found fuel-related field on flight.${key}:`, value);
      if (value && typeof value === 'object') {
        console.log(`FlightLoader: Keys in flight.${key}:`, Object.keys(value));
      }
    }
  });
  
  // Check all fields on rawFlight object for fuel-related data  
  Object.keys(rawFlight).forEach(key => {
    const value = rawFlight[key];
    if (key.toLowerCase().includes('fuel') || (value && typeof value === 'object' && value.policyUuid)) {
      console.log(`FlightLoader: Found fuel-related field on rawFlight.${key}:`, value);
      if (value && typeof value === 'object') {
        console.log(`FlightLoader: Keys in rawFlight.${key}:`, Object.keys(value));
      }
    }
  });
  
  // Look for the specific UUID the user mentioned in ANY field
  const targetUuid = '66ab621c-b381-4edf-824b-29e04f0fb61e';
  console.log(`FlightLoader: 🎯 SEARCHING FOR TARGET UUID: ${targetUuid}`);
  
  // Deep search in flight object
  const searchObject = (obj, path = '') => {
    Object.keys(obj).forEach(key => {
      const fullPath = path ? `${path}.${key}` : key;
      const value = obj[key];
      
      if (value === targetUuid) {
        console.log(`FlightLoader: 🎯 FOUND TARGET UUID at ${fullPath}:`, value);
      }
      
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        searchObject(value, fullPath);
      }
    });
  };
  
  searchObject(flight, 'flight');
  searchObject(rawFlight, 'rawFlight');
  
  // If we found a fuel object, show its keys too
  if (fuelObjectCheck) {
    console.log('FlightLoader: Fuel object keys:', Object.keys(fuelObjectCheck));
  }

  // Aviation safety validation
  if (!flightData.waypoints || flightData.waypoints.length === 0) {
    console.warn('FlightLoader: WARNING - No waypoints extracted! Flight may not load correctly.');
  }

  if (!flightData.policyUuid && !flightData.fuelPlanId) {
    console.warn('FlightLoader: WARNING - No fuel policy or fuel plan data! Will fall back to aircraft defaults.');
  }

  return flightData;
}

/**
 * Extract alternate route data from raw flight
 * Handles GeoJSON conversion and validation
 */
function extractAlternateRouteData(rawFlight) {
  if (!rawFlight.alternateFullRouteGeoShape) {
    console.log('FlightLoader: No alternate route data found');
    return null;
  }

  try {
    console.log('FlightLoader: Extracting alternate route data');
    
    const alternateGeoShape = rawFlight.alternateFullRouteGeoShape.toGeoJson ? 
      rawFlight.alternateFullRouteGeoShape.toGeoJson() : rawFlight.alternateFullRouteGeoShape;
    
    if (!alternateGeoShape?.coordinates) {
      console.warn('FlightLoader: Alternate route GeoShape has no coordinates');
      return null;
    }

    const alternateData = {
      coordinates: alternateGeoShape.coordinates,
      splitPoint: rawFlight.alternateSplitPoint || null,
      name: rawFlight.alternateName || 'Alternate Route',
      geoPoint: rawFlight.alternateGeoPoint || null,
      legIds: rawFlight.alternateLegIds || []
    };
    
    console.log('FlightLoader: Successfully extracted alternate route:', {
      coordinateCount: alternateData.coordinates.length,
      splitPoint: alternateData.splitPoint,
      name: alternateData.name
    });
    
    return alternateData;
  } catch (error) {
    console.error('FlightLoader: Error extracting alternate route data:', error);
    return null;
  }
}

/**
 * Enhanced fuel policy extraction with full priority system
 * 
 * @param {Object} flightData - Already extracted flight data
 * @param {Object} fuelPolicy - Current fuel policy hook
 * @param {Object} selectedAircraft - Currently selected aircraft
 * @returns {Object} - Fuel policy resolution result
 */
export function resolveFuelPolicy(flightData, fuelPolicy, selectedAircraft) {
  console.log('FlightLoader: Starting fuel policy resolution');
  console.log('FlightLoader: Available policies:', fuelPolicy.availablePolicies?.length);
  
  let selectedPolicy = null;
  let source = 'none';

  // Priority 1: Flight-specific policy UUID
  if (flightData.policyUuid && fuelPolicy.availablePolicies?.length > 0) {
    selectedPolicy = fuelPolicy.availablePolicies.find(p => p.uuid === flightData.policyUuid);
    if (selectedPolicy) {
      console.log('FlightLoader: Found flight-specific policy:', selectedPolicy.name);
      source = 'flight';
    } else {
      console.warn('FlightLoader: Flight policyUuid not found in available policies:', flightData.policyUuid);
    }
  }

  // Priority 2: Aircraft default policy (if no flight policy found)
  if (!selectedPolicy && selectedAircraft && fuelPolicy.availablePolicies?.length > 0) {
    console.log('FlightLoader: Trying aircraft default policy');
    console.log('FlightLoader: Aircraft defaultFuelPolicyId:', selectedAircraft.defaultFuelPolicyId);
    console.log('FlightLoader: Aircraft defaultFuelPolicyName:', selectedAircraft.defaultFuelPolicyName);
    
    // NEW: Try to find policy by UUID first (modern aircraft data format)
    if (selectedAircraft.defaultFuelPolicyId) {
      selectedPolicy = fuelPolicy.availablePolicies.find(p => p.uuid === selectedAircraft.defaultFuelPolicyId);
      if (selectedPolicy) {
        console.log('FlightLoader: Found aircraft default policy by UUID:', selectedPolicy.name, selectedPolicy.uuid);
        source = 'aircraft';
      } else {
        console.warn('FlightLoader: Aircraft policy not found by UUID:', selectedAircraft.defaultFuelPolicyId);
        console.warn('FlightLoader: Available policy UUIDs:', fuelPolicy.availablePolicies.map(p => `${p.name}: ${p.uuid}`));
      }
    }
    
    // FALLBACK: Try to find policy by name (legacy aircraft data format)
    if (!selectedPolicy && selectedAircraft.defaultFuelPolicyName) {
      selectedPolicy = fuelPolicy.availablePolicies.find(p => p.name === selectedAircraft.defaultFuelPolicyName);
      if (selectedPolicy) {
        console.log('FlightLoader: Found aircraft default policy by name:', selectedPolicy.name);
        source = 'aircraft';
      } else {
        console.warn('FlightLoader: Aircraft policy not found by name:', selectedAircraft.defaultFuelPolicyName);
        console.warn('FlightLoader: Available policy names:', fuelPolicy.availablePolicies.map(p => p.name));
      }
    }
  }

  // Priority 3: Current policy from region (if no flight or aircraft policy)
  if (!selectedPolicy && fuelPolicy.currentPolicy) {
    console.log('FlightLoader: Using current region policy as fallback:', fuelPolicy.currentPolicy.name);
    selectedPolicy = fuelPolicy.currentPolicy;
    source = 'region';
  }

  return {
    policy: selectedPolicy,
    source: source,
    success: !!selectedPolicy
  };
}

/**
 * Apply resolved fuel policy to the fuel policy hook with retry mechanism
 * This handles timing issues where policies haven't loaded yet
 */
export function applyFuelPolicy(policyResolution, fuelPolicy) {
  if (policyResolution.success && policyResolution.policy) {
    console.log(`FlightLoader: Applying fuel policy from ${policyResolution.source}:`, policyResolution.policy.name);
    fuelPolicy.selectPolicy(policyResolution.policy);
    return true;
  } else {
    console.warn('FlightLoader: No suitable fuel policy found - this may cause fuel calculation issues');
    return false;
  }
}

/**
 * Apply fuel policy with retry mechanism for timing issues
 * This waits for fuel policies to load, then finds and applies the correct policy
 */
export function applyFuelPolicyWithRetry(flightData, fuelPolicy, selectedAircraft, maxRetries = 10, retryDelay = 500) {
  console.log('FlightLoader: 🔄 Starting fuel policy application with retry mechanism');
  console.log('FlightLoader: Target policyUuid:', flightData.policyUuid);
  
  return new Promise((resolve) => {
    let attempt = 0;
    
    const tryApplyPolicy = () => {
      attempt++;
      console.log(`FlightLoader: 🔄 Attempt ${attempt}/${maxRetries} to apply fuel policy`);
      console.log('FlightLoader: Available policies count:', fuelPolicy.availablePolicies?.length || 0);
      
      // Check if fuel policies have loaded
      if (!fuelPolicy.availablePolicies || fuelPolicy.availablePolicies.length === 0) {
        if (attempt < maxRetries) {
          console.log(`FlightLoader: 🕒 Policies not loaded yet, retrying in ${retryDelay}ms...`);
          setTimeout(tryApplyPolicy, retryDelay);
          return;
        } else {
          console.warn('FlightLoader: ❌ Max retries reached, fuel policies never loaded');
          resolve(false);
          return;
        }
      }
      
      // Try to resolve and apply the policy now that policies are loaded
      const policyResolution = resolveFuelPolicy(flightData, fuelPolicy, selectedAircraft);
      
      if (policyResolution.success) {
        console.log(`FlightLoader: ✅ SUCCESS: Applied fuel policy from ${policyResolution.source}:`, policyResolution.policy.name);
        const applied = applyFuelPolicy(policyResolution, fuelPolicy);
        resolve(applied);
      } else if (attempt < maxRetries) {
        console.log(`FlightLoader: 🔄 Policy resolution failed, retrying in ${retryDelay}ms...`);
        setTimeout(tryApplyPolicy, retryDelay);
      } else {
        console.warn('FlightLoader: ❌ Max retries reached, could not resolve fuel policy');
        resolve(false);
      }
    };
    
    // Start the retry process
    tryApplyPolicy();
  });
}

export default {
  extractFlightData,
  resolveFuelPolicy,
  applyFuelPolicy,
  applyFuelPolicyWithRetry
};