/**
 * StopCardCalculator.js
 * 
 * Dedicated module for calculating stop card data for flight routes
 * based on waypoints, aircraft performance, and weather conditions.
 * 
 * IMPORTANT: This module NEVER uses hardcoded values for critical flight parameters.
 * All calculations rely on actual aircraft performance data from the selected aircraft.
 */

// Import the PassengerCalculator module for passenger calculations
import PassengerCalculator from '../passengers/PassengerCalculator';

// Import segment-aware utilities for refuel flight handling
import { detectLocationSegment, createSegmentFuelKey, parseSegmentFuelKey } from '../../../utilities/SegmentUtils.js';



/**
 * Calculate stop cards data for a route
 * Shows the fuel required to continue from each waypoint
 * This function now uses routeStats data when available for consistency
 * 
 * @param {Array} waypoints - Waypoints array
 * @param {Object} routeStats - Route statistics from RouteCalculator
 * @param {Object} selectedAircraft - Selected aircraft with performance data
 * @param {Object} weather - Weather data (windSpeed, windDirection)
 * @param {Object} options - Optional calculation parameters
 * @param {Array} weatherSegments - Weather segments data for rig detection
 * @param {Array} refuelStops - Array of refuel stop indices (e.g., [1, 3])
 * @param {boolean} waiveAlternates - Whether alternates are waived for VFR operations
 * @returns {Array} Array of stop card objects
 */
const calculateStopCards = (waypoints, routeStats, selectedAircraft, weather, options = {}, weatherSegments = null, refuelStops = [], waiveAlternates = false, alternateStopCard = null) => {
  
  // console.log('🚨 STOPCARDCALCULATOR CALLED:', {
  //   waypoints: waypoints?.length,
  //   selectedAircraft: !!selectedAircraft,
  //   fuelPolicy: !!options?.fuelPolicy,
  //   reserveFuel: options?.reserveFuel
  // });
  
  // 🔍 LOG THE CALCULATED RESERVE FUEL AT THE END - MOVED TO AFTER CALCULATION
  
  // First, verify we have the necessary input data
  if (!waypoints || waypoints.length < 2 || !selectedAircraft) {
    console.error('StopCardCalculator: Missing required input data');
    return [];
  }
  
  // IMPROVED FIX: Filter out navigation waypoints ONLY for stop cards.
  // This doesn't affect route distance/time calculations.
  const landingStopsOnly = waypoints.filter(wp => {
    // Check if this is a navigation waypoint based on any property
    const isWaypoint = 
      wp.pointType === 'NAVIGATION_WAYPOINT' || // Explicit type
      wp.isWaypoint === true || // Legacy flag
      wp.type === 'WAYPOINT'; // Legacy type value
    
    // Keep only landing stops by excluding waypoints
    return !isWaypoint;
  });
  
  
  
  // If we've filtered out ALL waypoints, we need to keep at least first and last as landing stops
  if (landingStopsOnly.length === 0 && waypoints.length >= 2) {
    landingStopsOnly.push(waypoints[0]);
    if (waypoints.length > 1) {
      landingStopsOnly.push(waypoints[waypoints.length - 1]);
    }
  }
  
  // Log routeStats data if available
  if (routeStats) {
    // Route stats validation logic would go here
  }
  
  // 🛩️ REFUEL SEGMENTATION: Check if we need to segment the route at refuel stops
  const hasRefuelStops = refuelStops && refuelStops.length > 0;
  
  
  if (hasRefuelStops) {
    // DON'T call separate function - just use segment-aware logic within normal calculation
  }
  
  
  // IMPORTANT: Use only landing stops for stop cards, but keep route stats using all waypoints
  const stopsToProcess = landingStopsOnly;
  
  // Extract options with defaults for safety, but these should always be provided
  const {
    passengerWeight = 0,  // Default to 0 to make missing settings obvious
    taxiFuel = 0,         // Default to 0 to make missing settings obvious
    contingencyFuelPercent = 0, // Default to 0 to make missing settings obvious
    reserveFuel = 0,      // Default to 0 to make missing settings obvious
    deckTimePerStop = 0,  // Default to 0 to make missing settings obvious
    deckFuelFlow = 0,     // Default to 0 to make missing settings obvious
    extraFuel = 0,        // ❌ DEPRECATED: Global extra fuel (no longer used - use locationFuelOverrides)
    cargoWeight = 0,      // Cargo weight for payload calculations
    araFuel = 0,          // ARA fuel from weather analysis
    approachFuel = 0,     // Approach fuel from weather analysis
    fuelPolicy = null,    // NEW: Fuel policy for reserve fuel type detection
    locationFuelOverrides = {}  // NEW: Location-specific fuel overrides (ARA/approach)
  } = options;
  
  
  // ✅ EXTRA FUEL: Now uses location-specific fuel only (no global fallbacks)
  
  // 🔍 SPECIFIC DEBUG: Check for ST127-A_araFuel
  
  // ❌ REMOVED: Global extraFuel fallback - use location-specific fuel only
  // const extraFuelValue = Number(extraFuel) || 0;
  
  // ✅ SEGMENT-AWARE: Helper function to get location-specific fuel with segment detection
  const getLocationFuel = (waypoint, fuelType, cardIndex = null) => {
    const waypointName = waypoint?.name || waypoint?.stopName || waypoint?.location;
    if (!waypointName) return 0;
    
    // console.log('🔍 getLocationFuel CALLED:', {
    //   waypointName,
    //   fuelType,
    //   cardIndex,
    //   hasWeatherSegments: !!weatherSegments && weatherSegments.length > 0,
    //   hasFuelPolicy: !!fuelPolicy,
    //   availableKeys: Object.keys(locationFuelOverrides || {})
    // });
    
    // 🔍 SPECIAL ARA DEBUG: Extra logging for ARA fuel lookups
    // if (fuelType === 'araFuel') {
    //   console.log('🔍 ARA FUEL SPECIAL DEBUG:', {
    //     waypointName,
    //     cardIndex,
    //     expectedKey: cardIndex ? `${waypointName}_${cardIndex}_araFuel` : `${waypointName}_araFuel`,
    //     allOverrides: locationFuelOverrides,
    //     araKeys: Object.keys(locationFuelOverrides || {}).filter(k => k.includes('araFuel'))
    //   });
    // }
    
    
    // 🔧 EXACT MATCH ONLY: Use unique card-based naming system
    const cardIndexKey = cardIndex ? `${waypointName}_${cardIndex}_${fuelType}` : null;
    const cardIndexOverride = cardIndexKey ? locationFuelOverrides[cardIndexKey] : null;
    
    if (cardIndexOverride !== undefined && cardIndexOverride !== null) {
      // Handle both object format {value: X} and direct value format
      const overrideValue = (typeof cardIndexOverride === 'object' && cardIndexOverride.value !== undefined) 
        ? Number(cardIndexOverride.value) || 0
        : Number(cardIndexOverride) || 0;
      
      // console.log(`🔍 FUEL LOOKUP: ${cardIndexKey} = ${overrideValue} (found override)`);
      return overrideValue;
    }
    
    // console.log(`🔍 FUEL LOOKUP: ${cardIndexKey} = not found, checking weather...`);
    
    
    // 🚨 FIX: Check weather conditions for THIS SPECIFIC location
    if (!weatherSegments || weatherSegments.length === 0) {
      return 0;
    }
    
    // Find weather segment for this specific location
    const weatherSegment = weatherSegments.find(segment => 
      segment.airportIcao === waypointName ||
      segment.locationName === waypointName ||
      segment.location === waypointName ||
      segment.uniqueId === waypointName
    );
    
    if (!weatherSegment) {
      return 0;
    }
    
    const ranking = weatherSegment.ranking2;
    const isRig = weatherSegment.isRig;
    
    if (fuelType === 'araFuel') {
      // ARA fuel: Only for rigs with ranking 8 or 5
      if (isRig && (ranking === 8 || ranking === 5)) {
        // Check multiple possible property names in the fuel policy  
        let araAmount = 0;
        if (fuelPolicy?.fuelTypes?.araFuel?.default) {
          araAmount = fuelPolicy.fuelTypes.araFuel.default;
        } else if (fuelPolicy?.araFuelDefault) {
          araAmount = fuelPolicy.araFuelDefault;
        }
        
        console.log('🚨 ARA FUEL DEBUG:', {
          fuelPolicy: !!fuelPolicy,
          araFuelDefault: fuelPolicy?.araFuelDefault,
          fuelTypesPath: fuelPolicy?.fuelTypes?.araFuel?.default,
          currentPolicyPath: fuelPolicy?.currentPolicy?.fuelTypes?.araFuel?.default,
          finalAmount: araAmount,
          waypointName,
          ranking,
          isRig
        });
        return araAmount; // Only return OSDK value
      }
      return 0;
    } else if (fuelType === 'approachFuel') {
      // Approach fuel: Only for airports with ranking 10 or 5
      if (!isRig && (ranking === 10 || ranking === 5)) {
        // Check multiple possible property names in the fuel policy
        let approachAmount = 0;
        if (fuelPolicy?.fuelTypes?.approachFuel?.default) {
          approachAmount = fuelPolicy.fuelTypes.approachFuel.default;
        } else if (fuelPolicy?.approachFuelDefault) {
          approachAmount = fuelPolicy.approachFuelDefault;
        }
        
        // console.log('🚨 APPROACH FUEL DEBUG:', {
        //   fuelPolicy: !!fuelPolicy,
        //   approachFuelDefault: fuelPolicy?.approachFuelDefault,
        //   fuelTypesPath: fuelPolicy?.fuelTypes?.approachFuel?.default,
        //   currentPolicyPath: fuelPolicy?.currentPolicy?.fuelTypes?.approachFuel?.default,
        //   finalAmount: approachAmount,
        //   waypointName,
        //   ranking,
        //   isRig
        // });
        return approachAmount; // Only return OSDK value
      }
      return 0;
    } else if (fuelType === 'extraFuel') {
      // Extra fuel: Only check user overrides, no weather-based logic
      return 0;
    }
    
    return 0;
  };
  
  // ✅ SEGMENT-AWARE: Calculate fuel needed for FIRST SEGMENT ONLY
  const calculateSegmentLocationFuel = (fuelType, segmentNumber = 1) => {
    let total = 0;
    const debugInfo = [];
    
    // Look through all stops to find locations that need this fuel type in THIS SEGMENT
    stopsToProcess.forEach((waypoint, index) => {
      const waypointName = waypoint?.name || waypoint?.stopName || waypoint?.location;
      if (!waypointName) return;
      
      // 🛩️ REQUIREMENTS: Detect which segment this waypoint's fuel REQUIREMENTS belong to
      // 🔧 INDEXING FIX: Use consistent 1-based indexing (departure=1, subsequent=2,3,4...)
      const cardIndex = index + 1;
      const waypointSegment = detectLocationSegment(waypointName, stopsToProcess, refuelStops, 'requirements', cardIndex);
      const locationFuel = getLocationFuel(waypoint, fuelType, cardIndex);
      
      debugInfo.push(`${waypointName}(card${cardIndex},seg${waypointSegment}):${locationFuel}`);
      
      // Only include fuel for the specified segment
      if (waypointSegment === segmentNumber) {
        if (locationFuel > 0) {
          total += locationFuel;
        }
      }
    });
    
    if (fuelType === 'approachFuel') {
      console.log(`🔍 calculateSegmentLocationFuel(${fuelType}, ${segmentNumber}):`, debugInfo.join(', '), `= ${total}`);
    }
    
    return total;
  };
  
  // ✅ SEGMENT-AWARE: Calculate ARA fuel for SEGMENT 1 ONLY (departure fuel)
  let dynamicAraFuel = calculateSegmentLocationFuel('araFuel', 1);
  
  // ✅ SEGMENT-AWARE: Calculate extra fuel for SEGMENT 1 ONLY (departure fuel)
  const departureWaypoint = stopsToProcess[0];
  const departureExtraFuelOverride = getLocationFuel(departureWaypoint, 'extraFuel', 1);
  let dynamicExtraFuel = departureExtraFuelOverride; // Only use location-specific extra fuel, no global fallback
  
  // console.log(`🔍 INITIAL EXTRA FUEL: departure override=${departureExtraFuelOverride}, dynamicExtraFuel=${dynamicExtraFuel} (no global fallback)`);
  
  // 🚨 APPROACH FUEL FIX: Calculate approach fuel for final segment
  let dynamicApproachFuel = 0;
  let approachFuelSource = 'none';
  
  if (hasRefuelStops) {
    // With refuel stops: calculate approach fuel for FINAL SEGMENT (from last refuel to destination)
    const finalSegmentNumber = refuelStops.length + 1; // Last segment number
    dynamicApproachFuel = calculateSegmentLocationFuel('approachFuel', finalSegmentNumber);
    approachFuelSource = dynamicApproachFuel > 0 ? 'final_segment' : 'none';
    console.log(`🛩️ APPROACH FUEL: Final segment ${finalSegmentNumber} needs ${dynamicApproachFuel} lbs approach fuel`);
  } else {
    // No refuel stops: calculate approach fuel for destination normally
    const destinationWaypoint = stopsToProcess[stopsToProcess.length - 1];
    const destinationApproachFuel = getLocationFuel(destinationWaypoint, 'approachFuel', stopsToProcess.length);
    dynamicApproachFuel = destinationApproachFuel;
    approachFuelSource = destinationApproachFuel > 0 ? 'destination' : 'none';
  }
  
  if (waiveAlternates) {
  } else {
  }
  
  // ✅ AVIATION SAFETY: NO FALLBACKS - Either convert properly or FAIL SAFELY
  let calculatedReserveFuel = null; // Start with null - no dangerous defaults
  
  // ✅ ENHANCED DEBUG: Reserve fuel conversion with detailed logging
  console.log('🔍 RESERVE FUEL DEBUG:', {
    hasFuelPolicy: !!fuelPolicy,
    hasFuelTypes: !!fuelPolicy?.fuelTypes,
    hasReserveFuel: !!fuelPolicy?.fuelTypes?.reserveFuel,
    reserveType: fuelPolicy?.fuelTypes?.reserveFuel?.type,
    reserveDefault: fuelPolicy?.fuelTypes?.reserveFuel?.default,
    hasAircraftFuelBurn: !!selectedAircraft?.fuelBurn,
    aircraftFuelBurn: selectedAircraft?.fuelBurn,
    rawReserveFuel: reserveFuel
  });
  
  console.log('🚨 FUEL POLICY FULL OBJECT:', fuelPolicy);
  console.log('🚨 AIRCRAFT FULL OBJECT:', selectedAircraft);
  console.log('🚨 AIRCRAFT FUEL BURN:', selectedAircraft?.fuelBurn);
  
  if (fuelPolicy && fuelPolicy.fuelTypes?.reserveFuel && selectedAircraft?.fuelBurn) {
    const reserveType = fuelPolicy.fuelTypes.reserveFuel.type || 'fixed';
    const reservePolicyValue = fuelPolicy.fuelTypes.reserveFuel.default || reserveFuel;
    
    if (reserveType === 'time') {
      // Time-based: time (minutes) × fuel flow (lbs/hour) ÷ 60
      const timeMinutes = reservePolicyValue;
      const fuelFlowPerHour = selectedAircraft.fuelBurn;
      calculatedReserveFuel = Math.round((timeMinutes * fuelFlowPerHour) / 60);
      
    } else {
      // Fixed amount - use policy value as-is
      calculatedReserveFuel = reservePolicyValue;
    }
  } else {
    // 🛡️ FALLBACK: Use provided reserve fuel value if policy conversion fails
    console.warn('🟡 WARNING: Reserve fuel policy conversion failed, using provided value');
    console.warn('🟡 DETAILS:', {
      hasFuelPolicy: !!fuelPolicy,
      hasFuelTypes: !!fuelPolicy?.fuelTypes,
      hasReserveFuel: !!fuelPolicy?.fuelTypes?.reserveFuel,
      hasAircraftFuelBurn: !!selectedAircraft?.fuelBurn
    });
    
    // 🚨 TEMPORARY: Allow calculation without fuel policy for debugging
    console.warn('🟡 WARNING: Reserve fuel policy conversion failed, using provided value');
    console.warn('🟡 DETAILS:', {
      hasFuelPolicy: !!fuelPolicy,
      hasFuelTypes: !!fuelPolicy?.fuelTypes,
      hasReserveFuel: !!fuelPolicy?.fuelTypes?.reserveFuel,
      hasAircraftFuelBurn: !!selectedAircraft?.fuelBurn
    });
    
    // 🚨 AVIATION SAFETY: NO FALLBACKS - FAIL PROPERLY
    throw new Error('CRITICAL: No fuel policy data available from OSDK. Cannot calculate fuel requirements without verified policy data.');
  }
  
  // 🛡️ FINAL SAFETY CHECK: Ensure we have a valid converted value
  if (calculatedReserveFuel === null || calculatedReserveFuel === undefined || isNaN(calculatedReserveFuel)) {
    throw new Error('CRITICAL: Reserve fuel calculation failed. Invalid OSDK fuel policy data cannot be used for aviation calculations.');
  }
  
  // Log all received values for debugging
  // Debug logging would go here
  
  // Convert all calculation parameters to proper numeric values
  // ✅ TAXI FUEL FIX: Check for departure taxi fuel override first (like ARA fuel does)
  const departureTaxiFuelOverride = getLocationFuel(waypoints[0], 'taxiFuel', 1); // Departure is always card index 1
  const taxiFuelValue = departureTaxiFuelOverride || Number(taxiFuel);
  const passengerWeightValue = Number(passengerWeight);
  const contingencyFuelPercentValue = Number(contingencyFuelPercent);
  const reserveFuelValue = Number(calculatedReserveFuel); // ✅ Use converted reserve fuel
  
  // 🔍 LOG THE CALCULATED RESERVE FUEL RESULT
  console.log('🚨 CALCULATED RESERVE FUEL RESULT:', calculatedReserveFuel);
  const deckTimePerStopValue = Number(deckTimePerStop);
  const deckFuelFlowValue = Number(deckFuelFlow);
  
  // Log converted values for debugging
  // Debug logging would go here

  // Validate inputs
  if (!stopsToProcess || stopsToProcess.length < 2 || !selectedAircraft) {
    return [];
  }
  
  // 🚨 AVIATION SAFETY: REQUIRE aircraft performance data
  if (!selectedAircraft.cruiseSpeed || isNaN(Number(selectedAircraft.cruiseSpeed))) {
    throw new Error(`CRITICAL: Aircraft ${selectedAircraft.registration} missing cruise speed. OSDK aircraft data required for safe fuel calculations.`);
  }
  if (!selectedAircraft.fuelBurn || isNaN(Number(selectedAircraft.fuelBurn))) {
    throw new Error(`CRITICAL: Aircraft ${selectedAircraft.registration} missing fuel burn rate. OSDK aircraft data required for safe fuel calculations.`);
  }
  
  // 🚨 AVIATION SAFETY: REQUIRE weight data for passenger calculations  
  if (!selectedAircraft.usefulLoad || isNaN(Number(selectedAircraft.usefulLoad))) {
    throw new Error(`CRITICAL: Aircraft ${selectedAircraft.registration} missing useful load. OSDK aircraft data required for safe passenger calculations.`);
  }
  
  // Validate calculation parameters - Log warnings but don't fail
  if (isNaN(passengerWeightValue) || passengerWeightValue <= 0) {
    console.warn('StopCardCalculator: Invalid passengerWeight:', passengerWeight);
  }
  
  if (isNaN(taxiFuelValue)) {
    console.warn('StopCardCalculator: Invalid taxiFuel:', taxiFuel);
  }
  
  if (isNaN(contingencyFuelPercentValue) || contingencyFuelPercentValue < 0) {
    console.warn('StopCardCalculator: Invalid contingencyFuelPercent:', contingencyFuelPercent);
  }
  
  if (isNaN(reserveFuelValue)) {
    console.warn('StopCardCalculator: Invalid reserveFuel:', reserveFuel);
  }
  
  if (isNaN(deckTimePerStopValue) || deckTimePerStopValue < 0) {
    console.warn('StopCardCalculator: Invalid deckTimePerStop:', deckTimePerStop);
  }
  
  if (isNaN(deckFuelFlowValue) || deckFuelFlowValue < 0) {
    console.warn('StopCardCalculator: Invalid deckFuelFlow:', deckFuelFlow);
  }


  // Create data for each stop
  const cards = [];

  // Get aircraft data for calculations
  const aircraft = selectedAircraft;
  
  // 🔍 DEBUG: Log complete aircraft object to see all available fields
  // Debug logging would go here

  // Calculate total trip values
  let totalDistance = 0;
  let totalTripFuel = 0;
  const legDetails = [];
  
  // IMPORTANT: First check if we can use RouteCalculator's results directly
  // This helps ensure a single source of truth for calculations
  let useRouteStatsDirectly = false;
  
  if (routeStats && routeStats.legs && routeStats.legs.length > 0) {
    useRouteStatsDirectly = true;
    
    // 🚨 AVIATION SAFETY: REQUIRE route calculation data
    if (!routeStats.totalDistance || isNaN(parseFloat(routeStats.totalDistance))) {
      throw new Error(`CRITICAL: Missing total route distance. Route calculation required for safe fuel planning.`);
    }
    if (!routeStats.tripFuel || isNaN(Number(routeStats.tripFuel))) {
      throw new Error(`CRITICAL: Missing trip fuel calculation. Route calculation required for safe fuel planning.`);
    }
    
    totalDistance = parseFloat(routeStats.totalDistance);
    totalTripFuel = routeStats.tripFuel;
    
    // Map route stats legs to our internal format
    for (let i = 0; i < routeStats.legs.length; i++) {
      const leg = routeStats.legs[i];
      
      // Find waypoints corresponding to this leg
      const fromIndex = i;
      const toIndex = i + 1;
      
      // Ensure we have valid waypoints
      if (fromIndex >= stopsToProcess.length || toIndex >= stopsToProcess.length) {
        console.warn(`StopCardCalculator: Leg ${i} indices (${fromIndex}, ${toIndex}) out of range for stopsToProcess (${stopsToProcess.length})`);
        continue;
      }
      
      const fromWaypoint = stopsToProcess[fromIndex];
      const toWaypoint = stopsToProcess[toIndex];
      
      // Map the leg data
      legDetails.push({
        fromWaypoint,
        toWaypoint,
        distance: parseFloat(leg.distance),
        timeHours: leg.time || (leg.distance / aircraft.cruiseSpeed),
        fuel: leg.fuel || Math.round((leg.distance / aircraft.cruiseSpeed) * aircraft.fuelBurn),
        groundSpeed: leg.groundSpeed || aircraft.cruiseSpeed,
        headwind: parseFloat((leg.headwind || 0).toFixed(1))
      });
    }
  }
  
  // If not using route stats directly, calculate leg details ourselves
  if (!useRouteStatsDirectly) {
    
    // First, pre-calculate all leg details and total values for LANDING STOPS ONLY
    // but include all waypoints between landing stops
    for (let i = 0; i < stopsToProcess.length - 1; i++) {
      const fromWaypoint = stopsToProcess[i];
      const toWaypoint = stopsToProcess[i + 1];
      
      // Find the indices of these waypoints in the full waypoints array
      const fromIndex = waypoints.findIndex(wp => wp.id === fromWaypoint.id);
      const toIndex = waypoints.findIndex(wp => wp.id === toWaypoint.id);
      
      // Get all waypoints between these two landing stops (inclusive)
      const legWaypoints = [];
      if (fromIndex !== -1 && toIndex !== -1 && fromIndex < toIndex) {
        // Extract all waypoints in this leg
        for (let j = fromIndex; j <= toIndex; j++) {
          legWaypoints.push(waypoints[j]);
        }
      } else {
        // Fallback if we can't find the waypoints in the array
        legWaypoints.push(fromWaypoint, toWaypoint);
      }
      
      
      // Calculate the total leg distance by summing all segments
      let legDistance = 0;
      let legTimeHours = 0;
      let legFuel = 0;
      let totalLegGroundSpeed = 0;
      let totalLegHeadwind = 0;
      let segmentCount = 0;
      
      // Process each segment in the leg
      for (let j = 0; j < legWaypoints.length - 1; j++) {
        const segmentFrom = legWaypoints[j];
        const segmentTo = legWaypoints[j + 1];
        
        // Check for coordinates
        const fromHasCoords = (segmentFrom.lat && segmentFrom.lon) ||
                            (segmentFrom.coords && segmentFrom.coords.length === 2);
        const toHasCoords = (segmentTo.lat && segmentTo.lon) ||
                          (segmentTo.coords && segmentTo.coords.length === 2);
        
        if (!fromHasCoords || !toHasCoords) {
          console.error(`StopCardCalculator: Missing coordinates for segment in leg ${i+1}`, {
            segmentFrom: {
              name: segmentFrom.name,
              lat: segmentFrom.lat,
              lon: segmentFrom.lon,
              coords: segmentFrom.coords,
              hasCoords: fromHasCoords
            },
            segmentTo: {
              name: segmentTo.name,
              lat: segmentTo.lat,
              lon: segmentTo.lon,
              coords: segmentTo.coords,
              hasCoords: toHasCoords
            }
          });
          continue;
        }
        
        // Get segment coordinates
        const fromCoords = {
          lat: segmentFrom.lat || segmentFrom.coords[1],
          lon: segmentFrom.lon || segmentFrom.coords[0]
        };
        
        const toCoords = {
          lat: segmentTo.lat || segmentTo.coords[1],
          lon: segmentTo.lon || segmentTo.coords[0]
        };
        
        // Calculate segment distance
        let segmentDistance = 0;
        try {
          // Calculate using turf
          const from = window.turf.point([fromCoords.lon, fromCoords.lat]);
          const to = window.turf.point([toCoords.lon, toCoords.lat]);
          segmentDistance = window.turf.distance(from, to, { units: 'nauticalmiles' });
        } catch (error) {
          console.error(`StopCardCalculator: Error calculating segment distance in leg ${i+1}:`, error);
          continue;
        }
        
        // Calculate segment time and fuel with wind adjustments
        let segmentTimeHours = 0;
        let segmentFuel = 0;
        let segmentGroundSpeed = aircraft.cruiseSpeed;
        let segmentHeadwind = 0;
        
        // Calculate with wind if available
        if (window.WindCalculations) {
          try {
            const segmentDetails = window.WindCalculations.calculateLegWithWind(
              fromCoords,
              toCoords,
              segmentDistance,
              aircraft,
              weather
            );
            
            segmentTimeHours = segmentDetails.time;
            segmentFuel = Math.round(segmentDetails.fuel);
            segmentGroundSpeed = Math.round(segmentDetails.groundSpeed);
            segmentHeadwind = Math.round(segmentDetails.headwindComponent);
            
          } catch (error) {
            // Fallback to basic calculation
            console.error(`StopCardCalculator: Error calculating wind adjustments for segment in leg ${i+1}:`, error);
            segmentTimeHours = segmentDistance / aircraft.cruiseSpeed;
            segmentFuel = Math.round(segmentTimeHours * aircraft.fuelBurn);
            segmentGroundSpeed = aircraft.cruiseSpeed;
            segmentHeadwind = 0;
          }
        } else {
          // Basic calculation without wind
          segmentTimeHours = segmentDistance / aircraft.cruiseSpeed;
          segmentFuel = Math.round(segmentTimeHours * aircraft.fuelBurn);
          segmentGroundSpeed = aircraft.cruiseSpeed;
          segmentHeadwind = 0;
        }
        
        // Add segment values to leg totals
        legDistance += segmentDistance;
        legTimeHours += segmentTimeHours;
        legFuel += segmentFuel;
        totalLegGroundSpeed += segmentGroundSpeed;
        totalLegHeadwind += segmentHeadwind;
        segmentCount++;
      }
      
      // Calculate average ground speed and headwind for the leg
      const legGroundSpeed = segmentCount > 0 ? Math.round(totalLegGroundSpeed / segmentCount) : aircraft.cruiseSpeed;
      const headwindComponent = segmentCount > 0 ? parseFloat((totalLegHeadwind / segmentCount).toFixed(1)) : 0;
      
      
      // Update route totals
      totalDistance += legDistance;
      totalTripFuel += legFuel;
      
      // Store leg details for later use
      legDetails.push({
        fromWaypoint,
        toWaypoint,
        distance: legDistance,
        timeHours: legTimeHours,
        fuel: legFuel,
        groundSpeed: legGroundSpeed,
        headwind: headwindComponent
      });
    }
  }

  // Calculate auxiliary fuel values
  // Using our converted numeric values
  
  // Log the numeric values being used
  // Debug logging would go here

  // Calculate intermediate stops (for deck fuel)
  // Only count landing stops that are not departure or destination
  const landingStopsCount = landingStopsOnly.length;
  const intermediateStops = Math.max(0, landingStopsCount - 2);
  
  
  // 🔍 DEBUG: Check what fuel flow data we have from aircraft
  // Debug logging would go here
  
  // Calculate deck time and fuel using individual stop overrides
  let totalDeckTimeMinutes = 0;
  
  // 🔧 DECK TIME FIX: Check each intermediate stop for individual deck time overrides
  for (let i = 1; i < stopsToProcess.length - 1; i++) { // Skip departure (0) and destination (last)
    const stop = stopsToProcess[i];
    const stopName = stop?.name || stop?.stopName || stop?.location;
    const cardIndex = i + 1; // Convert to 1-based card index
    
    // Check for individual deck time override
    const individualDeckTime = getLocationFuel(stop, 'deckTime', cardIndex);
    const deckTimeForThisStop = individualDeckTime > 0 ? individualDeckTime : deckTimePerStopValue;
    
    totalDeckTimeMinutes += deckTimeForThisStop;
    
    console.log(`🔧 DECK TIME: ${stopName} (card ${cardIndex}) = ${deckTimeForThisStop} minutes (override: ${individualDeckTime})`);
  }
  
  const deckTimeHours = totalDeckTimeMinutes / 60; // Convert from minutes to hours
  console.log(`🔧 TOTAL DECK TIME: ${totalDeckTimeMinutes} minutes = ${deckTimeHours} hours`);
  
  // 🚨 AVIATION SAFETY: REQUIRE OSDK aircraft data - NO FALLBACKS ALLOWED
  if (!aircraft?.flatPitchFuelBurnDeckFuel) {
    throw new Error(`CRITICAL: Missing deck fuel flow data for aircraft ${aircraft?.registration || 'unknown'}. OSDK aircraft data required for safe fuel calculations.`);
  }
  const actualDeckFuelFlow = aircraft.flatPitchFuelBurnDeckFuel;
  const deckFuelValue = Math.round(deckTimeHours * actualDeckFuelFlow);
  
  // 🔍 DEBUG: Show what deck fuel flow is actually being used
  // Debug logging would go here
  
  // 🔍 DEBUG: Show the deck fuel calculation
  // Debug logging would go here

  // Calculate contingency fuel
  const contingencyFuelValue = Math.round((totalTripFuel * contingencyFuelPercentValue) / 100);
  
  // Log the calculated values with more detail
  // Debug logging would go here

  // Calculate total fuel required for the entire trip
  const totalFuelRequired = taxiFuelValue + totalTripFuel + contingencyFuelValue + dynamicAraFuel + deckFuelValue + dynamicApproachFuel + reserveFuelValue;

  // Create a departure card first
  if (waypoints.length >= 2) {
    const departureWaypoint = waypoints[0];
    
    // 🛩️ REFUEL LOGIC: Calculate departure fuel based on refuel stops
    let departureFuelNeeded;
    let departureComponentsCalculation;
    
    if (hasRefuelStops && refuelStops.length > 0) {
      // Find the first refuel stop index (1-based card index)
      const firstRefuelStopCardIndex = Math.min(...refuelStops);
      
      // 🔧 CRITICAL INDEX FIX: Convert card index to leg index for proper fuel calculation
      // Card index 2 means refuel at 2nd stop, so we need fuel for legs 0 to 1 (2 legs total)
      // But we want legs up to the refuel stop, which is firstRefuelStopCardIndex - 1
      const firstRefuelStopLegIndex = firstRefuelStopCardIndex - 1;
      
      console.log(`🔧 REFUEL INDEX FIX: Card ${firstRefuelStopCardIndex} → Leg index ${firstRefuelStopLegIndex}`);
      
      // Calculate fuel only to first refuel stop
      let tripFuelToFirstRefuel = 0;
      let deckFuelToFirstRefuel = 0;
      
      // Sum fuel for legs up to first refuel stop (using correct leg indexing)
      for (let i = 0; i < legDetails.length && i < firstRefuelStopLegIndex; i++) {
        tripFuelToFirstRefuel += legDetails[i].fuel;
        console.log(`🔧 REFUEL FUEL: Adding leg ${i} fuel: ${legDetails[i].fuel} lbs`);
      }
      
      // 🔧 DECK TIME FIX: Calculate deck fuel for stops before first refuel using individual overrides
      let deckTimeMinutesToFirstRefuel = 0;
      for (let i = 1; i < firstRefuelStopCardIndex; i++) { // Skip departure (0), count intermediate stops up to refuel card
        if (i < stopsToProcess.length) {
          const stop = stopsToProcess[i];
          const cardIndex = i + 1; // Convert to 1-based card index
          const individualDeckTime = getLocationFuel(stop, 'deckTime', cardIndex);
          const deckTimeForThisStop = individualDeckTime > 0 ? individualDeckTime : deckTimePerStopValue;
          deckTimeMinutesToFirstRefuel += deckTimeForThisStop;
          
          console.log(`🔧 REFUEL DECK TIME: ${stop?.name} (card ${cardIndex}) = ${deckTimeForThisStop} minutes`);
        }
      }
      deckFuelToFirstRefuel = Math.round((deckTimeMinutesToFirstRefuel / 60) * actualDeckFuelFlow);
      console.log(`🔧 REFUEL TOTAL DECK: ${deckTimeMinutesToFirstRefuel} minutes = ${deckFuelToFirstRefuel} lbs`);
      
      // Calculate contingency based on trip fuel to first refuel
      const contingencyToFirstRefuel = Math.round((tripFuelToFirstRefuel * contingencyFuelPercentValue) / 100);
      
      // 🛩️ AVIATION LOGIC: Get extra fuel for departure (will be consumed at first refuel stop)
      // Use ONLY departure-specific extra fuel (no global fallback)
      const segment1ExtraFuel = getLocationFuel(departureWaypoint, 'extraFuel', 1) || 0;
      
      // 🔧 APPROACH FUEL FIX: Calculate approach fuel for segment 1 (like ARA fuel)
      // Approach fuel should be carried from departure and consumed at airports that need it
      const updatedSegment1ApproachFuel = calculateSegmentLocationFuel('approachFuel', 1);
      console.log(`🔍 DEPARTURE APPROACH FUEL DEBUG: calculateSegmentLocationFuel('approachFuel', 1) = ${updatedSegment1ApproachFuel}`);
      const segment1ApproachFuel = updatedSegment1ApproachFuel;
      
      // 🛩️ VFR MODE: When alternates are waived, use minimal fuel for maximum passengers
      const segmentReserveFuel = waiveAlternates ? 0 : reserveFuelValue; // VFR: no reserve fuel required
      
      // For departure to first refuel: Taxi + Trip(to refuel) + Contingency(for refuel segment) + Reserve(VFR=0) + ARA(if needed) + Approach(if destination in segment) + Deck(for intermediate stops)
      departureFuelNeeded = taxiFuelValue + tripFuelToFirstRefuel + contingencyToFirstRefuel + deckFuelToFirstRefuel + segmentReserveFuel + segment1ExtraFuel;
      
      // ✅ SEGMENT-AWARE: Recalculate ARA fuel including user overrides for segment 1
      console.log(`🎯 DEBUG: Available fuel overrides:`, Object.keys(locationFuelOverrides));
      console.log(`🎯 DEBUG: Current refuel stops for segment detection:`, refuelStops);
      const updatedSegment1AraFuel = calculateSegmentLocationFuel('araFuel', 1);
      console.log(`🎯 DEBUG: calculateSegmentLocationFuel('araFuel', 1) returned:`, updatedSegment1AraFuel);
      
      // Add ARA fuel if needed for the route (always carried from departure)
      if (updatedSegment1AraFuel > 0) departureFuelNeeded += updatedSegment1AraFuel;
      
      // Add approach fuel only if destination is in first segment
      if (segment1ApproachFuel > 0) departureFuelNeeded += segment1ApproachFuel;
      
      departureComponentsCalculation = {
        taxi: taxiFuelValue,
        trip: tripFuelToFirstRefuel,
        contingency: contingencyToFirstRefuel,
        deck: deckFuelToFirstRefuel,
        reserve: segmentReserveFuel,  // ✅ VFR MODE: Use segment-specific reserve fuel
        ara: updatedSegment1AraFuel,
        approach: segment1ApproachFuel,  // ✅ SEGMENT-AWARE: Only approach fuel for segment 1
        extra: segment1ExtraFuel  // ✅ SEGMENT-AWARE: Use segment 1 extra fuel
      };
      
      console.log(`🚨 DEPARTURE COMPONENTS CALCULATED:`, departureComponentsCalculation);
      console.log(`🚨 DEPARTURE FUEL NEEDED:`, departureFuelNeeded);
      
    } else {
      // 🛩️ AVIATION LOGIC: Departure must carry extra fuel (will be consumed at refuel stops or destination)
      // Use ONLY departure-specific extra fuel (no global fallback)
      const departureExtraFuel = getLocationFuel(departureWaypoint, 'extraFuel', 1) || 0;
      
      // ✅ AVIATION CORRECT: Departure MUST carry approach fuel to destination (can't create fuel mid-flight)
      departureFuelNeeded = taxiFuelValue + totalTripFuel + contingencyFuelValue + dynamicAraFuel + deckFuelValue + dynamicApproachFuel + reserveFuelValue + departureExtraFuel;
      
      departureComponentsCalculation = {
        taxi: taxiFuelValue,
        trip: totalTripFuel,
        contingency: contingencyFuelValue,
        deck: deckFuelValue,
        reserve: reserveFuelValue,
        ara: dynamicAraFuel,
        approach: dynamicApproachFuel,  // ✅ AVIATION: Departure must carry approach fuel
        extra: departureExtraFuel  // 🛩️ AVIATION: Use calculated departure extra fuel
      };
      
    }
    
    // Calculate max passengers for departure using PassengerCalculator
    let departureMaxPassengers = 0;
    if (selectedAircraft) {
      // Use our dedicated PassengerCalculator module
      departureMaxPassengers = PassengerCalculator.calculateMaxPassengers(
        selectedAircraft, 
        departureFuelNeeded, 
        passengerWeightValue,
        cargoWeight
      );
    }
    
    // 🛩️ ALTERNATE FUEL LOGIC: Calculate alternate requirements when not waived
    let alternateRequirements = null;
    let shouldShowStrikethrough = false;
    
    if (hasRefuelStops && !waiveAlternates && alternateStopCard) {
      // 🛩️ Use the exact values from the already-calculated alternate card
      const alternateFuel = alternateStopCard.totalFuel;
      const alternatePassengers = alternateStopCard.maxPassengers;
      
      
      // 🚨 CRITICAL FIX: Don't override refuel-optimized departure fuel with alternate fuel
      // Refuel optimization already includes all required fuel (including ARA)
      const originalDepartureFuel = departureFuelNeeded;
      
      // Only use alternate fuel if it's actually higher (true alternate requirements)
      if (alternateFuel > departureFuelNeeded) {
        departureFuelNeeded = alternateFuel;
        departureMaxPassengers = alternatePassengers;
      } else {
        // Keep the refuel-optimized values that include ARA fuel
        console.log(`🛩️ KEEPING REFUEL-OPTIMIZED FUEL: ${departureFuelNeeded} lbs (includes ARA) vs alternate ${alternateFuel} lbs`);
      }
      
      // Determine if we're overriding an optimization (for UI indication)
      shouldShowStrikethrough = alternateFuel > originalDepartureFuel;
      
      
      alternateRequirements = {
        fuel: alternateFuel,
        passengers: alternatePassengers,
        isRequired: true // Always required when alternates are not waived
      };
      
    }
    
    // Create fuel components text for departure using calculated values - ONLY show > 0 values
    let fuelComponentsParts = [];
    
    // Always show these core components (they should never be 0 for a valid departure)
    if (departureComponentsCalculation.taxi > 0) {
      fuelComponentsParts.push(`Taxi:${departureComponentsCalculation.taxi}`);
    }
    if (departureComponentsCalculation.trip > 0) {
      fuelComponentsParts.push(`Trip:${departureComponentsCalculation.trip}`);
    }
    if (departureComponentsCalculation.contingency > 0) {
      fuelComponentsParts.push(`Cont:${departureComponentsCalculation.contingency}`);
    }
    
    // Only show optional components if > 0
    if (departureComponentsCalculation.ara > 0) {
      fuelComponentsParts.push(`ARA:${departureComponentsCalculation.ara}`);
    }
    
    if (departureComponentsCalculation.deck > 0) {
      fuelComponentsParts.push(`Deck:${departureComponentsCalculation.deck}`);
    }
    
    if (departureComponentsCalculation.approach > 0) {
      fuelComponentsParts.push(`Approach:${departureComponentsCalculation.approach}`);
    }
    
    if (departureComponentsCalculation.reserve > 0) {
      fuelComponentsParts.push(`Res:${departureComponentsCalculation.reserve}`);
    }
    
    if (departureComponentsCalculation.extra > 0) {
      fuelComponentsParts.push(`Extra:${departureComponentsCalculation.extra}`);
    }
    
    const departureFuelComponentsText = fuelComponentsParts.join(' ');
    
    // DEBUG: Log the fuel components for departure
    // Debug logging would go here
    
    // 🛡️ FUEL CAPACITY CHECK: Check if required fuel exceeds aircraft maximum capacity
    const aircraftMaxFuel = selectedAircraft.maxFuel || null;
    console.log(`🔍 FUEL CAPACITY DEBUG: Required=${Math.round(departureFuelNeeded)}, Max=${aircraftMaxFuel}, Aircraft:`, selectedAircraft);
    console.log(`🔍 COMPARISON DEBUG: aircraftMaxFuel=${aircraftMaxFuel}, departureFuelNeeded=${departureFuelNeeded}, comparison=${departureFuelNeeded > aircraftMaxFuel}`);
    const exceedsCapacity = aircraftMaxFuel && departureFuelNeeded > aircraftMaxFuel;
    console.log(`🔍 EXCEEDS CAPACITY: ${exceedsCapacity}`);
    const excessAmount = exceedsCapacity ? departureFuelNeeded - aircraftMaxFuel : 0;
    
    const fuelCapacityWarning = exceedsCapacity ? {
      exceedsCapacity: true,
      excessAmount: Math.round(excessAmount),
      requiredFuel: Math.round(departureFuelNeeded),
      maxCapacity: Math.round(aircraftMaxFuel)
    } : null;
    
    if (exceedsCapacity) {
      console.log(`🚨 FUEL CAPACITY WARNING: Required ${Math.round(departureFuelNeeded)} lbs exceeds aircraft capacity ${Math.round(aircraftMaxFuel)} lbs by ${Math.round(excessAmount)} lbs`);
    }
    
    // Create departure card with detailed console logging
    // ✅ ALTERNATE LOGIC: Already handled correctly at lines 795-801
    // No duplicate override needed - the proper logic already preserves refuel-optimized fuel
    
    const departureCard = {
      index: 1, // 🔧 INDEXING FIX: Use numeric index 1 for departure instead of 'D'
      id: departureWaypoint.id || 'departure',
      stopName: departureWaypoint.name,
      legDistance: '0.0',
      totalDistance: '0.0',
      legTime: 0,
      totalTime: 0,
      legFuel: 0,
      totalFuel: departureFuelNeeded,
      maxPassengers: departureMaxPassengers,
      maxPassengersDisplay: departureMaxPassengers,
      maxPassengersWeight: departureMaxPassengers * passengerWeightValue,
      groundSpeed: 0,
      headwind: 0,
      deckTime: deckTimeHours * 60, // Convert back to minutes for display
      deckFuel: deckFuelValue,
      fuelComponents: departureFuelComponentsText,
      fuelComponentsObject: {
        tripFuel: departureComponentsCalculation.trip,
        contingencyFuel: departureComponentsCalculation.contingency,
        taxiFuel: departureComponentsCalculation.taxi,
        araFuel: departureComponentsCalculation.ara,
        deckFuel: departureComponentsCalculation.deck,
        approachFuel: departureComponentsCalculation.approach,
        reserveFuel: departureComponentsCalculation.reserve,
        extraFuel: departureComponentsCalculation.extra
      },
      // Add wind information to all cards
      windInfo: weather ? `${weather.windDirection}°/${weather.windSpeed}kt` : 'No wind data',
      windData: {
        windSpeed: weather?.windSpeed || 0,
        windDirection: weather?.windDirection || 0,
        source: weather?.source || 'manual'
      },
      // Add alternate fuel requirements for UI display
      alternateRequirements: alternateRequirements,
      // Add fuel capacity warning for UI display
      fuelCapacityWarning: fuelCapacityWarning,
      shouldShowStrikethrough: shouldShowStrikethrough,
      isDeparture: true,
      isDestination: false
    };
    
    // Add the departure card to our cards array
    console.log(`🔍 DEPARTURE CARD DEBUG: fuelCapacityWarning=`, departureCard.fuelCapacityWarning);
    cards.push(departureCard);
  }

  // Now create cards for each intermediate stop and destination
  let cumulativeDistance = 0;
  let cumulativeTime = 0;
  
  // 🚨 FIX: Track cumulative fuel consumption through the route
  let cumulativeAraFuelConsumed = 0;
  let cumulativeApproachFuelConsumed = 0;

  for (let i = 0; i < legDetails.length; i++) {
    const legDetail = legDetails[i];
    const toWaypoint = legDetail.toWaypoint;

    // Create a unique ID for this stop
    const stopId = toWaypoint.id || `waypoint-${i+1}`;

    // Update cumulative values for distance and time (for display only)
    cumulativeDistance += legDetail.distance;
    cumulativeTime += legDetail.timeHours;
    
    // 🛩️ REFUEL LOGIC: Reset cumulative fuel consumption at refuel stops  
    const cardIndex = i + 2; // 🔧 INDEXING FIX: Start from 2 since departure is index 1 
    const isRefuelStop = refuelStops && refuelStops.includes(cardIndex);
    
    if (isRefuelStop) {
      // Reset fuel consumption tracking at refuel stops
      cumulativeAraFuelConsumed = 0;
      cumulativeApproachFuelConsumed = 0;
      
      // 🛩️ SEGMENT-BASED: Recalculate dynamic fuel for remaining segment
      // This treats the refuel stop as the start of a new "flight"
      
      // ✅ SEGMENT-AWARE: Calculate which segment starts AFTER this refuel stop
      const currentStopIndex = i + 2; // 🔧 INDEXING FIX: Convert to 1-based index (departure=1)
      let nextSegment = 1;
      
      if (hasRefuelStops && refuelStops.length > 0) {
        // Find which segment will start after this refuel stop
        const sortedRefuelStops = [...refuelStops].sort((a, b) => a - b);
        
        for (let refuelIndex of sortedRefuelStops) {
          if (currentStopIndex >= refuelIndex) {
            nextSegment++;
          } else {
            break;
          }
        }
      }
      
      
      // ✅ SEGMENT-AWARE: Calculate fuel for NEXT SEGMENT ONLY using segment-aware function
      const segmentAraFuel = calculateSegmentLocationFuel('araFuel', nextSegment);
      const segmentApproachFuel = calculateSegmentLocationFuel('approachFuel', nextSegment);
      
      // 🔧 EXTRA FUEL FIX: Calculate extra fuel for next segment (from refuel rig)
      const refuelExtraFuel = getLocationFuel(toWaypoint, 'extraFuel', cardIndex);
      const segmentExtraFuel = refuelExtraFuel; // Only use location-specific extra fuel, no global fallback
      
      // Update dynamic fuel values for this segment
      dynamicAraFuel = segmentAraFuel;
      dynamicApproachFuel = segmentApproachFuel;
      dynamicExtraFuel = segmentExtraFuel;
      
    }

    // 🛩️ REFUEL LOGIC: Calculate remaining fuel to next refuel stop or destination
    let remainingTripFuel = 0;
    let remainingIntermediateStops = 0;
    let calculationEndPoint = legDetails.length; // Default to end of route
    
    // Check if there are refuel stops ahead of current position
    if (hasRefuelStops && refuelStops.length > 0) {
      // Find the next refuel stop after current position
      const currentCardIndex = i + 2; // 🔧 INDEXING FIX: Convert to card index (departure=1, so start from 2)
      const nextRefuelStops = refuelStops.filter(refuelIndex => refuelIndex > currentCardIndex).sort((a, b) => a - b);
      
      if (nextRefuelStops.length > 0) {
        const nextRefuelStopCardIndex = nextRefuelStops[0]; // This is a 1-based card index
        calculationEndPoint = nextRefuelStopCardIndex - 1; // Convert to 0-based leg index
        
        console.log(`🔧 CALCULATION ENDPOINT: Current position=${currentCardIndex}, Next refuel card=${nextRefuelStopCardIndex}, Using leg endpoint=${calculationEndPoint}`);
      } else {
        console.log(`🔧 CALCULATION ENDPOINT: No more refuel stops, calculating to end of route`);
      }
    }
    
    // Calculate remaining trip fuel - sum of legs to calculation end point
    console.log(`🔧 TRIP FUEL CALCULATION: ${toWaypoint.name} - summing legs ${i + 1} to ${calculationEndPoint - 1}`);
    for (let j = i + 1; j < legDetails.length && j < calculationEndPoint; j++) {
      const legFuel = legDetails[j].fuel;
      remainingTripFuel += legFuel;
      console.log(`🔧 LEG ${j}: ${legDetails[j]?.fromWaypoint?.name} → ${legDetails[j]?.toWaypoint?.name} = ${legFuel} lbs`);
    }
    console.log(`🔧 TOTAL REMAINING TRIP FUEL: ${remainingTripFuel} lbs`);

    // 🔧 DECK FUEL FIX: Count actual intermediate rigs between current position and calculation end point
    remainingIntermediateStops = 0;
    for (let j = i + 1; j < legDetails.length && j < calculationEndPoint - 1; j++) {
      const nextWaypoint = legDetails[j]?.toWaypoint;
      if (nextWaypoint) {
        // Count all landing stops as potential deck fuel locations (rigs and airports)
        const isLandingStop = !nextWaypoint.isWaypoint && nextWaypoint.pointType !== 'NAVIGATION_WAYPOINT';
        if (isLandingStop) {
          remainingIntermediateStops++;
        }
      }
    }
    console.log(`🔧 DECK FUEL DEBUG: From leg ${i} to endpoint ${calculationEndPoint}, found ${remainingIntermediateStops} intermediate stops`);

    // 🔧 DECK TIME FIX: Calculate remaining deck fuel using individual overrides for remaining stops
    let remainingDeckTimeMinutes = 0;
    for (let j = i + 1; j < legDetails.length && j < calculationEndPoint - 1; j++) {
      const nextWaypoint = legDetails[j]?.toWaypoint;
      if (nextWaypoint) {
        const isLandingStop = !nextWaypoint.isWaypoint && nextWaypoint.pointType !== 'NAVIGATION_WAYPOINT';
        if (isLandingStop) {
          const cardIndex = j + 2; // Convert to 1-based card index for non-departure stops
          const individualDeckTime = getLocationFuel(nextWaypoint, 'deckTime', cardIndex);
          const deckTimeForThisStop = individualDeckTime > 0 ? individualDeckTime : deckTimePerStopValue;
          remainingDeckTimeMinutes += deckTimeForThisStop;
          
          console.log(`🔧 REMAINING DECK TIME: ${nextWaypoint?.name} (card ${cardIndex}) = ${deckTimeForThisStop} minutes`);
        }
      }
    }
    const remainingDeckTimeHours = remainingDeckTimeMinutes / 60;
    const remainingDeckFuel = Math.round(remainingDeckTimeHours * actualDeckFuelFlow);
    console.log(`🔧 REMAINING TOTAL DECK: ${remainingDeckTimeMinutes} minutes = ${remainingDeckFuel} lbs`);

    // 🔧 REFUEL SEGMENT FIX: Calculate contingency fuel directly for remaining trip fuel (not proportional)
    let remainingContingencyFuel = 0;
    if (remainingTripFuel > 0) {
      remainingContingencyFuel = Math.round((remainingTripFuel * contingencyFuelPercentValue) / 100);
      console.log(`🔧 SEGMENT CONTINGENCY: ${remainingTripFuel} lbs trip fuel × ${contingencyFuelPercentValue}% = ${remainingContingencyFuel} lbs contingency`);
    }
    

    // At the final destination, we only have reserve and unused contingency
    const isFinalDestination = i === legDetails.length - 1;
    
    // 🛩️ REFUEL LOGIC: Check if this stop is marked for refuel
    // The refuel stops array contains card indices, which for intermediate stops is (i + 2)
    // cardIndex already declared above for refuel reset logic
    
    // 🛩️ REFUEL LOGIC: If this is a refuel stop, treat it differently from final destination
    const shouldTreatAsFinal = isFinalDestination && !isRefuelStop;
    
    console.log(`🚨 FINAL CHECK: ${toWaypoint.name} - isFinalDestination=${isFinalDestination}, isRefuelStop=${isRefuelStop}, shouldTreatAsFinal=${shouldTreatAsFinal}`);

    // ✅ FINAL DESTINATION EXTRA FUEL: Calculate this for both final destinations and the old duplicate logic
    let finalExtraFuel = 0;
    if (isFinalDestination) {
      const locationExtraFuelOverride = getLocationFuel(toWaypoint, 'extraFuel', cardIndex);
      
      if (locationExtraFuelOverride > 0) {
        // User specifically added extra fuel at final destination
        finalExtraFuel = locationExtraFuelOverride;
        console.log(`🚨 FINAL EXTRA FUEL: ${toWaypoint.name} has location override = ${finalExtraFuel}`);
      } else {
        // Use segment-carried extra fuel (from last refuel stop or departure)
        const currentSegment = detectLocationSegment(toWaypoint.name, stopsToProcess, refuelStops, 'requirements', cardIndex);
        
        if (currentSegment === 1) {
          // Segment 1: use departure extra fuel
          finalExtraFuel = getLocationFuel(departureWaypoint, 'extraFuel', 1) || 0;
          console.log(`🚨 FINAL EXTRA FUEL: ${toWaypoint.name} in segment 1, using departure extra = ${finalExtraFuel}`);
        } else {
          // Segment 2+: find the refuel stop that starts this segment
          const sortedRefuelStops = [...refuelStops].sort((a, b) => a - b);
          const refuelStopIndex = sortedRefuelStops[currentSegment - 2]; // -2 because segment 1 is departure
          
          if (refuelStopIndex) {
            // Find the refuel stop waypoint
            const refuelWaypoint = stopsToProcess.find((wp, idx) => (idx + 1) === refuelStopIndex);
            finalExtraFuel = refuelWaypoint ? (getLocationFuel(refuelWaypoint, 'extraFuel', refuelStopIndex) || 0) : 0;
            console.log(`🚨 FINAL EXTRA FUEL: ${toWaypoint.name} in segment ${currentSegment}, using refuel stop ${refuelStopIndex} extra = ${finalExtraFuel}`);
          } else {
            finalExtraFuel = 0;
            console.log(`🚨 FINAL EXTRA FUEL: ${toWaypoint.name} in segment ${currentSegment}, no refuel stop found`);
          }
        }
      }
    }

    // Calculate the fuel needed at this stop to continue the journey
    let fuelNeeded;
    let fuelComponents;
    let fuelComponentsText;

    if (shouldTreatAsFinal) {
      // At the final destination, you have reserve fuel and unused contingency
      // For potential landing fuel, we should show the total contingency (from departure)
      // not just the remaining contingency for this leg
      // (finalExtraFuel already calculated above)
      
      fuelNeeded = reserveFuelValue + remainingContingencyFuel + finalExtraFuel;
      
      console.log(`🚨 FINAL DESTINATION: ${toWaypoint.name} - Res:${reserveFuelValue} + Cont:${remainingContingencyFuel} + Extra:${finalExtraFuel} = ${fuelNeeded}`);
      
      // 🛩️ FINAL DESTINATION: Create fuel components for landing fuel display
      fuelComponents = {
        tripFuel: 0, // No trip fuel needed at final destination
        contingencyFuel: remainingContingencyFuel,
        taxiFuel: 0, // No taxi fuel at destination
        araFuel: 0, // No ARA fuel needed at destination
        deckFuel: 0, // No deck fuel at destination
        approachFuel: 0, // No approach fuel needed at destination
        reserveFuel: reserveFuelValue,
        extraFuel: finalExtraFuel
      };
      
      // Create landing fuel components text with bracketed display
      let landingFuelParts = [];
      if (remainingContingencyFuel > 0) landingFuelParts.push(`Contingency:${remainingContingencyFuel}`);
      landingFuelParts.push(`Reserve:${reserveFuelValue}`);
      if (finalExtraFuel > 0) landingFuelParts.push(`Extra:${finalExtraFuel}`);
      
      fuelComponentsText = `Expected Landing Fuel (${landingFuelParts.join(' + ')})`;
      
    } else {
      // 🎯 SMART CONSUMPTION LOGIC: Calculate remaining weather fuel needed
      
      // Check weather segments to see if this location is a rig
      const weatherSegmentForLocation = weatherSegments?.find(segment => 
        segment.locationName === toWaypoint.name || 
        segment.location === toWaypoint.name ||
        segment.airportIcao === toWaypoint.name ||
        segment.uniqueId === toWaypoint.name
      );
      const isRigFromWeather = weatherSegmentForLocation?.isRig || false;
      
      // 🔍 FALLBACK RIG DETECTION: Check waypoint properties if weather data doesn't have isRig
      const isRigFromWaypoint = toWaypoint.type === 'rig' || 
                                toWaypoint.platformType === 'rig' ||
                                toWaypoint.name?.includes('ST') || // Common rig naming pattern
                                toWaypoint.name?.includes('GC') || // Gulf Coast rigs
                                toWaypoint.name?.includes('-A') || // Rig helidecks
                                false;
      
      const isRig = isRigFromWeather || isRigFromWaypoint;
      
      // Check if this location consumes ARA fuel (for rigs)
      const currentLocationConsumesAra = isRig;
      
      // Check if this location consumes approach fuel (airports with bad weather)
      const currentLocationConsumesApproach = weatherSegments && weatherSegments.some(segment => {
        const locationMatch = segment.airportIcao === toWaypoint.name || 
                             segment.locationName === toWaypoint.name ||
                             segment.location === toWaypoint.name ||
                             segment.uniqueId === toWaypoint.name;
        const isAirport = !segment.isRig; // Airports (not rigs) consume approach fuel
        const needsApproachFuel = segment.ranking2 === 10 || segment.ranking2 === 5; // Bad weather rankings
        return locationMatch && isAirport && needsApproachFuel;
      });
      
      console.log(`🔍 ARA DEBUG: ${toWaypoint.name}`, {
        isRigFromWeather,
        isRigFromWaypoint,
        isRig,
        currentLocationConsumesAra,
        currentLocationConsumesApproach,
        weatherSegmentForLocation: !!weatherSegmentForLocation,
        waypointType: toWaypoint.type,
        waypointPlatformType: toWaypoint.platformType
      });
      
      // 🛩️ AVIATION LOGIC: Check how much ARA/approach fuel THIS location consumes
      // This fuel is consumed ON APPROACH to this location, so it won't be in this location's summary
      const currentCardIndex = (i + 2); // 🔧 INDEXING FIX: Use consistent numeric indexing
      const araFuelNeededHere = currentLocationConsumesAra ? getLocationFuel(toWaypoint, 'araFuel', currentCardIndex) : 0;
      
      // console.log(`🔍 ARA FUEL LOOKUP: ${toWaypoint.name}`, {
      //   currentLocationConsumesAra,
      //   currentCardIndex,
      //   araFuelNeededHere,
      //   lookupKey: `${toWaypoint.name}_${currentCardIndex}_araFuel`
      // });
      
      
      
      // 🔧 REFUEL FIX: Don't add consumption at refuel stops to new segment's cumulative count
      // This prevents segment 1 ARA from contaminating segment 2 calculations
      if (currentLocationConsumesAra && araFuelNeededHere > 0 && !isRefuelStop) {
        cumulativeAraFuelConsumed += araFuelNeededHere;
        console.log(`🛩️ ARA CONSUMPTION: ${toWaypoint.name} consumes ${araFuelNeededHere} lbs, cumulative now ${cumulativeAraFuelConsumed}`);
      } else if (isRefuelStop) {
        console.log(`🔧 REFUEL STOP: ${toWaypoint.name} ARA consumption (${araFuelNeededHere}) NOT added to new segment cumulative`);
      }
      
      // 🛩️ AVIATION LOGIC: Calculate remaining fuel AFTER consumption at this location
      // This means the rig that just consumed ARA fuel won't show it in its summary
      const remainingAraFuel = Math.max(0, dynamicAraFuel - cumulativeAraFuelConsumed);
      
      
      // 🔧 APPROACH FUEL FIX: Make approach fuel work exactly like ARA fuel
      // Use existing currentLocationConsumesApproach variable (already declared above)
      
      // Get approach fuel needed at this specific location
      const approachFuelNeededHere = getLocationFuel(toWaypoint, 'approachFuel', cardIndex);
      
      // console.log(`🔍 APPROACH FUEL LOOKUP: ${toWaypoint.name}`, {
      //   currentLocationConsumesApproach,
      //   cardIndex,
      //   approachFuelNeededHere,
      //   lookupKey: `${toWaypoint.name}_${cardIndex}_approachFuel`
      // });
      
      // 🔧 REFUEL FIX: Don't add approach consumption at refuel stops to new segment's cumulative count
      if (currentLocationConsumesApproach && approachFuelNeededHere > 0 && !isRefuelStop) {
        cumulativeApproachFuelConsumed += approachFuelNeededHere;
        console.log(`🛩️ APPROACH CONSUMPTION: ${toWaypoint.name} consumes ${approachFuelNeededHere} lbs, cumulative now ${cumulativeApproachFuelConsumed}`);
      } else if (isRefuelStop && currentLocationConsumesApproach) {
        console.log(`🔧 REFUEL STOP: ${toWaypoint.name} approach consumption (${approachFuelNeededHere}) NOT added to new segment cumulative`);
      }
      
      // 🛩️ AVIATION LOGIC: Calculate remaining fuel AFTER consumption at this location
      const remainingApproachFuel = Math.max(0, dynamicApproachFuel - cumulativeApproachFuelConsumed);
      
      
      // 🛩️ AVIATION LOGIC: Extra fuel carry-through until refuel stop or destination
      // Get user override for extra fuel at this specific location first
      const locationExtraFuelOverride = getLocationFuel(toWaypoint, 'extraFuel', cardIndex);
      
      console.log(`🚨 EXTRA FUEL START: ${toWaypoint.name} (card ${cardIndex}) locationOverride=${locationExtraFuelOverride}, isRefuel=${isRefuelStop}`);
      
      // 🔧 SIMPLIFIED EXTRA FUEL: Use dynamic extra fuel from segment calculation
      // This should work like ARA/approach fuel - recalculated at refuel stops
      let remainingExtraFuel = 0;
      
      if (locationExtraFuelOverride > 0) {
        // User has specifically set extra fuel for this location
        remainingExtraFuel = locationExtraFuelOverride;
        console.log(`🚨 EXTRA FUEL: ${toWaypoint.name} has location override = ${remainingExtraFuel}`);
      } else {
        // 🔧 EXTRA FUEL FIX: Special logic for refuel stops vs intermediate stops
        if (isRefuelStop) {
          // 🛩️ REFUEL STOP: Only show extra fuel if specifically added at THIS refuel stop
          remainingExtraFuel = 0; // Start with 0 - no carrying over from previous segment
          console.log(`🚨 EXTRA FUEL: ${toWaypoint.name} is refuel stop, checking for local extra fuel only`);
        } else {
          // 🛩️ INTERMEDIATE STOP: Use extra fuel from current segment's fuel source
          const currentSegment = detectLocationSegment(toWaypoint.name, stopsToProcess, refuelStops, 'requirements', cardIndex);
          
          if (currentSegment === 1) {
            // Segment 1: use departure extra fuel
            remainingExtraFuel = getLocationFuel(departureWaypoint, 'extraFuel', 1) || 0;
            console.log(`🚨 EXTRA FUEL: ${toWaypoint.name} in segment 1, using departure extra = ${remainingExtraFuel}`);
          } else {
            // Segment 2+: find the refuel stop that starts this segment
            const sortedRefuelStops = [...refuelStops].sort((a, b) => a - b);
            const refuelStopIndex = sortedRefuelStops[currentSegment - 2]; // -2 because segment 1 is departure
            
            if (refuelStopIndex) {
              // Find the refuel stop waypoint
              const refuelWaypoint = stopsToProcess.find((wp, idx) => (idx + 1) === refuelStopIndex);
              remainingExtraFuel = refuelWaypoint ? (getLocationFuel(refuelWaypoint, 'extraFuel', refuelStopIndex) || 0) : 0;
              console.log(`🚨 EXTRA FUEL: ${toWaypoint.name} in segment ${currentSegment}, using refuel stop ${refuelStopIndex} extra = ${remainingExtraFuel}`);
            } else {
              remainingExtraFuel = 0;
              console.log(`🚨 EXTRA FUEL: ${toWaypoint.name} in segment ${currentSegment}, no refuel stop found`);
            }
          }
        }
      }
      
      // 🛩️ REFUEL LOGIC: Check if this is a refuel stop and calculate differently
      if (isRefuelStop) {
        // 🛩️ REFUEL STOP: Calculate fuel needed for NEXT segment only (not remaining route)
        
        // 🛩️ AVIATION LOGIC: At refuel stops, use the extra fuel calculated above (includes segment logic)
        // This could be from departure (segment 1) or from this refuel stop for next segment
        console.log(`🚨 REFUEL EXTRA FUEL: ${toWaypoint.name} using remainingExtraFuel = ${remainingExtraFuel}`);
        
        fuelNeeded = remainingTripFuel + remainingContingencyFuel + remainingAraFuel + remainingDeckFuel + remainingApproachFuel + reserveFuelValue + remainingExtraFuel;
        
        console.log(`🚨 REFUEL CALCULATION: ${toWaypoint.name} - Trip:${remainingTripFuel} + Cont:${remainingContingencyFuel} + ARA:${remainingAraFuel} + Deck:${remainingDeckFuel} + Approach:${remainingApproachFuel} + Res:${reserveFuelValue} + Extra:${remainingExtraFuel} = ${fuelNeeded}`);
        
        fuelComponents = {
          tripFuel: remainingTripFuel,
          contingencyFuel: remainingContingencyFuel,
          taxiFuel: 0, // No taxi fuel for intermediate stops
          araFuel: remainingAraFuel,
          deckFuel: remainingDeckFuel,
          approachFuel: remainingApproachFuel,
          reserveFuel: reserveFuelValue,
          extraFuel: remainingExtraFuel  // 🛩️ AVIATION: Use segment-aware extra fuel
        };
        
        // Create fuel components text for refuel stops
        let refuelFuelComponentsParts = [];
        if (remainingTripFuel > 0) refuelFuelComponentsParts.push(`Trip:${remainingTripFuel}`);
        if (remainingContingencyFuel > 0) refuelFuelComponentsParts.push(`Cont:${remainingContingencyFuel}`);
        if (remainingAraFuel > 0) refuelFuelComponentsParts.push(`ARA:${remainingAraFuel}`);
        if (remainingDeckFuel > 0) refuelFuelComponentsParts.push(`Deck:${remainingDeckFuel}`);
        if (remainingApproachFuel > 0) refuelFuelComponentsParts.push(`Approach:${remainingApproachFuel}`);
        if (reserveFuelValue > 0) refuelFuelComponentsParts.push(`Res:${reserveFuelValue}`);
        if (remainingExtraFuel > 0) refuelFuelComponentsParts.push(`Extra:${remainingExtraFuel}`);
        
        fuelComponentsText = refuelFuelComponentsParts.join(' ') + ' (refuel)';
        
      } else {
        // At intermediate stops, you need fuel for remaining legs, plus reserve
        // NOTE: Extra fuel is carried through intermediate stops (but consumed at refuel stops)
        fuelNeeded = remainingTripFuel + remainingContingencyFuel + remainingAraFuel + remainingDeckFuel + remainingApproachFuel + reserveFuelValue + remainingExtraFuel;
        
        fuelComponents = {
          tripFuel: remainingTripFuel,
          contingencyFuel: remainingContingencyFuel,
          araFuel: remainingAraFuel,  
          deckFuel: remainingDeckFuel,
          approachFuel: remainingApproachFuel,  
          reserveFuel: reserveFuelValue,
          extraFuel: remainingExtraFuel  // 🛩️ AVIATION: Extra fuel stays in aircraft
        };
        
        // Create fuel components text - ONLY show components > 0
        let intermediateParts = [];
        
        if (remainingTripFuel > 0) {
          intermediateParts.push(`Trip:${remainingTripFuel}`);
        }
        
        if (remainingContingencyFuel > 0) {
          intermediateParts.push(`Cont:${remainingContingencyFuel}`);
        }
        
        if (remainingAraFuel > 0) {
          intermediateParts.push(`ARA:${remainingAraFuel}`);
        }
        
        if (remainingDeckFuel > 0) {
          intermediateParts.push(`Deck:${remainingDeckFuel}`);
        }
        
        if (remainingApproachFuel > 0) {
          intermediateParts.push(`Approach:${remainingApproachFuel}`);
        }
        
        if (reserveFuelValue > 0) {
          intermediateParts.push(`Res:${reserveFuelValue}`);
        }
        
        // 🛩️ AVIATION: Only show extra fuel if present (it stays in aircraft)
        if (remainingExtraFuel > 0) {
          intermediateParts.push(`Extra:${remainingExtraFuel}`);
        }
        
        fuelComponentsText = intermediateParts.join(' ');
        
        // Log the intermediate stop fuel components
          // Debug logging removed
      } // 🛩️ REFUEL: Close the main else block for weather/refuel logic
    }

    // 🚨 EDGE CASE: Alternate fuel for intermediate stops before split point
    let intermediateAlternateRequirements = null;
    if (hasRefuelStops && !waiveAlternates && alternateStopCard) {
      const currentStopIndex = i + 2; // 🔧 INDEXING FIX: Convert to stop index (departure=1, so i+2)
      
      // Find the split point (where alternate route starts)
      // This should match the logic used in alternate card calculation
      let splitPointIndex = null;
      
      // TODO: Need to determine split point - for now assume it's where the refuel is
      const refuelStopIndices = refuelStops;
      if (refuelStopIndices.length > 0) {
        splitPointIndex = Math.min(...refuelStopIndices); // First refuel stop is split point
      }
      
      
      // If this stop is BEFORE the split point, it needs alternate fuel
      if (splitPointIndex && currentStopIndex < splitPointIndex) {
        
        // Calculate fuel needed: Trip (to split) + Alternate leg + Contingency + Deck + Reserve
        const tripFuelToSplit = remainingTripFuel; // This should be trip fuel to the split point
        const alternateLegFuel = alternateStopCard?.fuelComponentsObject?.altFuel || 0;
        const alternateContingency = Math.round((tripFuelToSplit + alternateLegFuel) * contingencyFuelPercentValue / 100);
        
        // ✅ EXTRA FUEL FIX: Use location-specific extra fuel, not global fallback
        const locationExtraFuel = getLocationFuel(toWaypoint, 'extraFuel', cardIndex) || 0;
        const intermediateAlternateFuel = tripFuelToSplit + alternateLegFuel + alternateContingency + remainingDeckFuel + reserveFuelValue + locationExtraFuel;
        
        // Override the fuel amount
        fuelNeeded = intermediateAlternateFuel;
        
        // Update fuel components to reflect alternate calculation
        fuelComponents = {
          tripFuel: tripFuelToSplit,
          alternateFuel: alternateLegFuel,
          contingencyFuel: alternateContingency,
          deckFuel: remainingDeckFuel,
          reserveFuel: reserveFuelValue,
          extraFuel: locationExtraFuel
        };
        
        // Update fuel components text
        let alternateParts = [`Trip:${tripFuelToSplit}`, `Alt:${alternateLegFuel}`, `Cont:${alternateContingency}`];
        if (remainingDeckFuel > 0) alternateParts.push(`Deck:${remainingDeckFuel}`);
        alternateParts.push(`Res:${reserveFuelValue}`);
        if (locationExtraFuel > 0) alternateParts.push(`Extra:${locationExtraFuel}`);
        fuelComponentsText = alternateParts.join(' ') + ' (alternate)';
        
        intermediateAlternateRequirements = {
          fuel: intermediateAlternateFuel,
          passengers: null, // Will be calculated below
          isRequired: true
        };
        
      }
    }

    // Calculate max passengers using our PassengerCalculator module
    let maxPassengers = 0;
    if (selectedAircraft) {
      // Use our dedicated PassengerCalculator module
      maxPassengers = PassengerCalculator.calculateMaxPassengers(
        selectedAircraft, 
        fuelNeeded, 
        passengerWeightValue,
        cargoWeight
      );
    }
    
    // Update intermediate alternate requirements with calculated passengers
    if (intermediateAlternateRequirements) {
      intermediateAlternateRequirements.passengers = maxPassengers;
    }

    // 🛩️ REFUEL LOGIC: Display logic for different stop types
    let displayMaxPassengers;
    if (shouldTreatAsFinal) {
      displayMaxPassengers = "Final Stop";
    } else if (isRefuelStop) {
      displayMaxPassengers = `${maxPassengers} (refuel)`;
    } else {
      displayMaxPassengers = maxPassengers;
    }
    
    const maxPassengersValue = shouldTreatAsFinal ? null : maxPassengers;
    const maxPassengersWeight = shouldTreatAsFinal ? null : (maxPassengers * passengerWeightValue);

    // Only the final waypoint is a destination
    const isDeparture = false; // We already added the departure card
    const isDestination = shouldTreatAsFinal; // 🛩️ REFUEL: Only true final destinations, not refuel stops

    // Initialize cardData before conditional assignment
    let cardData;
    
    if (shouldTreatAsFinal) {
      // CRITICAL FIX: Special handling for destination cards
      // Calculate expected landing fuel: Reserve + Unburnt contingency + Extra fuel
      let unburntContingencyFuel = 0;
      
      // 🚨 RACE CONDITION FIX: Guard against undefined values during loading
      if (refuelStops && Array.isArray(refuelStops) && refuelStops.length > 0 && legDetails && contingencyFuelPercentValue !== undefined) {
        // With refuels: only contingency from the last refuel stop to destination remains unburnt
        const lastRefuelStopIndex = Math.max(...refuelStops);
        
        // Calculate trip fuel from last refuel stop to destination
        let tripFuelFromLastRefuel = 0;
        for (let legIndex = lastRefuelStopIndex; legIndex < legDetails.length; legIndex++) {
          tripFuelFromLastRefuel += (legDetails[legIndex]?.fuel || 0);
        }
        
        // Contingency is only on the final segment (after last refuel)
        unburntContingencyFuel = Math.round((tripFuelFromLastRefuel * contingencyFuelPercentValue) / 100);
      } else if (totalTripFuel !== undefined && contingencyFuelPercentValue !== undefined) {
        // Without refuels: all contingency fuel remains unburnt at destination
        unburntContingencyFuel = Math.round((totalTripFuel * contingencyFuelPercentValue) / 100);
      } else {
      }
      const expectedLandingFuel = reserveFuelValue + unburntContingencyFuel + finalExtraFuel;
      
      // Update fuel components text for destination to show expected landing fuel breakdown
      const landingFuelParts = [`Reserve:${reserveFuelValue}`];
      if (unburntContingencyFuel > 0) {
        landingFuelParts.push(`UnburntCont:${unburntContingencyFuel}`);
      }
      if (finalExtraFuel > 0) {
        landingFuelParts.push(`Extra:${finalExtraFuel}`);
      }
      const destinationFuelComponentsText = `Expected Landing Fuel (${landingFuelParts.join(', ')}) [${expectedLandingFuel} lbs]`;
      
      console.log(`🚨 FINAL CARD CREATION: ${toWaypoint.name} - fuelNeeded=${fuelNeeded}, expectedLandingFuel=${expectedLandingFuel}`);
      
      // Always include all fuel component fields, even if they're zero
      cardData = {
        index: (i + 2), // 🔧 INDEXING FIX: Use consistent numeric indices (departure=1, so start from 2)
        id: stopId,
        stopName: toWaypoint.name,
        legDistance: legDetail.distance.toFixed(1),
        totalDistance: cumulativeDistance.toFixed(1),
        legTime: Number(legDetail.timeHours),
        totalTime: Number(cumulativeTime + (deckTimeHours)), // FIXED: Total time including deck stops
        // Add flight time separately for clarity
        flightTime: Number(cumulativeTime), // Flight time only
        legFuel: Number(legDetail.fuel),
        // The fuel shown is expected landing fuel (reserve + unburnt contingency + extra)
        totalFuel: Number(expectedLandingFuel),
        maxPassengers: maxPassengersValue,
        maxPassengersDisplay: displayMaxPassengers,
        maxPassengersWeight: maxPassengersWeight,
        groundSpeed: Number(legDetail.groundSpeed),
        headwind: Number(legDetail.headwind),
        deckTime: Number(remainingDeckTimeHours * 60), // Convert back to minutes for display
        deckFuel: Number(remainingDeckFuel),
        fuelComponents: destinationFuelComponentsText,
        // For destination cards, ensure all component fields exist
        fuelComponentsObject: {
          reserveFuel: reserveFuelValue,
          contingencyFuel: unburntContingencyFuel,
          extraFuel: finalExtraFuel,
          // Always include these with zero values for consistency
          tripFuel: 0,
          taxiFuel: 0,
          araFuel: 0,  // TODO: Smart distribution logic
          deckFuel: 0,
          approachFuel: 0  // TODO: Smart distribution logic
        },
        // Add wind information to all cards
        windInfo: weather ? `${weather.windDirection}°/${weather.windSpeed}kt` : 'No wind data',
        windData: {
          windSpeed: weather?.windSpeed || 0,
          windDirection: weather?.windDirection || 0,
          source: weather?.source || 'manual'
        },
        isDeparture: isDeparture,
        isDestination: isDestination,
        refuelMode: false // Final destinations are never refuel stops
      };
    } else {
      // Normal case for all non-destination cards (including refuel stops)
      cardData = {
        index: (i + 2), // 🔧 INDEXING FIX: Use consistent numeric indices (departure=1, so start from 2)
        id: stopId,
        stopName: toWaypoint.name,
        legDistance: legDetail.distance.toFixed(1),
        totalDistance: cumulativeDistance.toFixed(1),
        legTime: Number(legDetail.timeHours),
        totalTime: Number(cumulativeTime),
        // Add flight time separately for FinanceCard toggle consistency
        flightTime: Number(cumulativeTime), // Flight time only (no deck time for intermediate stops)
        legFuel: Number(legDetail.fuel),
        // The fuel shown is what's needed to continue from this point
        totalFuel: Number(fuelNeeded),
        maxPassengers: maxPassengersValue,
        maxPassengersDisplay: displayMaxPassengers,
        maxPassengersWeight: maxPassengersWeight,
        groundSpeed: Number(legDetail.groundSpeed),
        headwind: Number(legDetail.headwind),
        deckTime: Number(remainingDeckTimeHours * 60), // Convert back to minutes for display
        deckFuel: Number(remainingDeckFuel),
        fuelComponents: fuelComponentsText,
        fuelComponentsObject: fuelComponents,
        // Add wind information to all cards
        windInfo: weather ? `${weather.windDirection}°/${weather.windSpeed}kt` : 'No wind data',
        windData: {
          windSpeed: weather?.windSpeed || 0,
          windDirection: weather?.windDirection || 0,
          source: weather?.source || 'manual'
        },
        // Add alternate fuel requirements for intermediate stops  
        alternateRequirements: intermediateAlternateRequirements,
        shouldShowStrikethrough: false, // No strikethrough for intermediate stops
        isDeparture: isDeparture,
        isDestination: isDestination,
        refuelMode: isRefuelStop // Only true if this stop is actually marked for refuel
      };
    }

    cards.push(cardData);
  }

  // Double-check destination card for correctness
  const destinationCard = cards.find(card => card.isDestination);
  if (destinationCard) {
    
    // Fix any discrepancy between totalFuel and component sum for destination card
    const componentSum = Object.values(destinationCard.fuelComponentsObject).reduce((sum, val) => sum + (Number(val) || 0), 0);
    if (Math.abs(destinationCard.totalFuel - componentSum) > 1) {
      destinationCard.totalFuel = componentSum;
    }
  }

    // Validate fuel components on each card to prevent crashes
    const finalCards = cards.map(card => {
      // Ensure all cards have a fuelComponentsObject with valid numerical values
      if (!card.fuelComponentsObject) {
        // Create appropriate default fuelComponentsObject based on card type
        if (card.isDestination) {
          card.fuelComponentsObject = {
            reserveFuel: reserveFuelValue,
            contingencyFuel: 0,
            extraFuel: 0,
            tripFuel: 0,
            taxiFuel: 0,
            deckFuel: 0
          };
        } else if (card.isDeparture) {
          card.fuelComponentsObject = {
            tripFuel: totalTripFuel,
            contingencyFuel: contingencyFuelValue,
            taxiFuel: taxiFuelValue,
            deckFuel: deckFuelValue,
            reserveFuel: reserveFuelValue
          };
        } else {
          // Default for intermediate stops
          card.fuelComponentsObject = {
            tripFuel: 0,
            contingencyFuel: 0,
            taxiFuel: 0,
            deckFuel: 0,
            reserveFuel: 0
          };
        }
      } else {
        // Ensure all standard component fields exist with valid numeric values
        const standardComponents = ['tripFuel', 'contingencyFuel', 'taxiFuel', 'deckFuel', 'reserveFuel'];
        standardComponents.forEach(component => {
          if (card.fuelComponentsObject[component] === undefined) {
            card.fuelComponentsObject[component] = 0;
          } else {
            card.fuelComponentsObject[component] = Number(card.fuelComponentsObject[component]) || 0;
          }
        });
        
        // Special handling for destination card's extraFuel
        if (card.isDestination && card.fuelComponentsObject.extraFuel === undefined) {
          card.fuelComponentsObject.extraFuel = 0;
        } else if (card.isDestination) {
          card.fuelComponentsObject.extraFuel = Number(card.fuelComponentsObject.extraFuel) || 0;
        }
      }
      
      // Ensure totalFuel is a valid number
      if (isNaN(card.totalFuel)) {
        // Recompute from components
        card.totalFuel = Object.values(card.fuelComponentsObject).reduce((sum, val) => sum + (Number(val) || 0), 0);
      } else {
        card.totalFuel = Number(card.totalFuel) || 0;
      }
      
      // Ensure other numerical fields are valid
      card.deckFuel = Number(card.deckFuel) || 0;
      card.legFuel = Number(card.legFuel) || 0;
      card.headwind = parseFloat(Number(card.headwind).toFixed(1)) || 0;
      
      return card;
    });
  
    // Verify fuel consistency in all cards before returning them
    for (let i = 0; i < finalCards.length; i++) {
      const card = finalCards[i];
      if (card.fuelComponentsObject) {
        // Calculate the sum of all fuel components
        const componentSum = Object.values(card.fuelComponentsObject).reduce((sum, value) => sum + value, 0);
        
        // Check if there's a significant discrepancy
        const difference = Math.abs(componentSum - card.totalFuel);
        
        if (difference > 1) { // Allow 1 lb for rounding errors
          console.warn(`⚠️ Card ${i} (${card.isDeparture ? 'Departure' : card.isDestination ? 'Destination' : 'Intermediate'}) fuel mismatch detected:`, {
            totalFuel: card.totalFuel,
            componentSum,
            difference: componentSum - card.totalFuel,
            components: { ...card.fuelComponentsObject }
          });
          
          // 🚨 SKIP CORRECTION for cards with alternate requirements (departure or intermediate)
          if ((card.isDeparture || !card.isDestination) && card.alternateRequirements) {
          } else {
            // Correct the total fuel to match components
            card.totalFuel = componentSum;
          }
        }
      }
    }

    // CRITICAL FIX: Store leg details globally for WaypointManager BEFORE returning stop cards
    // This preserves the existing API while making leg data available
    if (legDetails && legDetails.length > 0) {
      // Store in window for WaypointManager to access real calculated times
      if (!window.currentRouteStats) {
        window.currentRouteStats = {};
      }
      
      // Format for WaypointManager
      window.currentRouteStats.legs = legDetails.map(leg => ({
        from: leg.fromWaypoint?.coords || null,
        to: leg.toWaypoint?.coords || null,
        distance: leg.distance,
        time: leg.timeHours, // Real wind-adjusted time
        fuel: leg.fuel,
        groundSpeed: leg.groundSpeed,
        headwind: leg.headwind
      }));
      
    }

    // 🔧 SAR FIX: Don't add alternate card here - it's handled by FlightUtilities
    // The alternateStopCard is passed in and used for calculations but added separately

    return finalCards;
};

/**
 * Calculate alternate stop card data for alternate route
 * Shows the fuel required for: legs to split point + alternate leg
 * This represents the minimal fuel needed for alternate route capability
 * 
 * @param {Array} waypoints - Main route waypoints array
 * @param {Object} alternateRouteData - Alternate route information
 * @param {Object} routeStats - Route statistics from RouteCalculator
 * @param {Object} selectedAircraft - Selected aircraft with performance data
 * @param {Object} weather - Weather data (windSpeed, windDirection)
 * @param {Object} options - Calculation parameters (same as normal stop cards)
 * @returns {Object|null} Alternate stop card object or null if no alternate route
 */
const calculateAlternateStopCard = (waypoints, alternateRouteData, routeStats, selectedAircraft, weather, options = {}) => {
  
  // Helper function to get location-specific fuel (recreated for alternate calculations)
  const getLocationFuel = (waypoint, fuelType, cardIndex = null) => {
    const waypointName = waypoint?.name || waypoint?.stopName || waypoint?.location;
    if (!waypointName) return 0;
    
    const locationFuelOverrides = options?.locationFuelOverrides || {};
    const weatherSegments = options?.weatherSegments || [];
    const fuelPolicy = options?.fuelPolicy;
    
    // Check for override first
    const cardIndexKey = cardIndex ? `${waypointName}_${cardIndex}_${fuelType}` : null;
    const cardIndexOverride = cardIndexKey ? locationFuelOverrides[cardIndexKey] : null;
    
    if (cardIndexOverride !== undefined && cardIndexOverride !== null) {
      const overrideValue = (typeof cardIndexOverride === 'object' && cardIndexOverride.value !== undefined) 
        ? Number(cardIndexOverride.value) || 0
        : Number(cardIndexOverride) || 0;
      return overrideValue;
    }
    
    // Check weather conditions if no override
    if (fuelType === 'deckTime' && weatherSegments.length === 0) {
      return 0; // Return 0 for deck time if no override and no weather data
    }
    
    return 0; // Default return
  };
  
  // Verify we have the necessary input data
  if (!waypoints || waypoints.length < 2 || !selectedAircraft || !alternateRouteData) {
    return null;
  }
  
  // CRITICAL: Ensure aircraft has all required properties
  if (!selectedAircraft.cruiseSpeed || !selectedAircraft.fuelBurn) {
    console.error('🟠 AlternateStopCard: Aircraft missing critical cruiseSpeed or fuelBurn property');
    return null;
  }
  
  // Extract same settings as normal stop cards - using 0 for missing values to show problems immediately
  const {
    passengerWeight = 0,  // Default to 0 to make missing settings obvious
    cargoWeight = 0,      // 🟠 ADDED: Missing cargoWeight parameter
    taxiFuel = 0,         // Default to 0 to make missing settings obvious
    contingencyFuelPercent = 0, // Default to 0 to make missing settings obvious
    reserveFuel = 0,      // Default to 0 to make missing settings obvious
    deckTimePerStop = 0,  // Default to 0 to make missing settings obvious
    deckFuelFlow = 0,     // Default to 0 to make missing settings obvious
    extraFuel = 0,        // ❌ DEPRECATED: Global extra fuel (no longer used - use locationFuelOverrides)
    araFuel = 0,          // 🔧 FIXED: Missing araFuel parameter (was causing error)
    approachFuel = 0,     // 🔧 FIXED: Missing approachFuel parameter (was causing error)
    fuelPolicy = null     // 🔧 CRITICAL: Add fuel policy for reserve fuel conversion
  } = options;
  
  // 🔧 CRITICAL FIX: Use same reserve fuel conversion logic as main route
  let calculatedReserveFuel = null;
  
  if (fuelPolicy && fuelPolicy.fuelTypes?.reserveFuel && selectedAircraft?.fuelBurn) {
    const reserveType = fuelPolicy.fuelTypes.reserveFuel.type || 'fixed';
    const reservePolicyValue = fuelPolicy.fuelTypes.reserveFuel.default || reserveFuel;
    
    if (reserveType === 'time') {
      // Time-based: time (minutes) × fuel flow (lbs/hour) ÷ 60
      const timeMinutes = reservePolicyValue;
      const fuelFlowPerHour = selectedAircraft.fuelBurn;
      calculatedReserveFuel = Math.round((timeMinutes * fuelFlowPerHour) / 60);
      
    } else {
      // Fixed amount - use policy value as-is
      calculatedReserveFuel = reservePolicyValue;
    }
  } else {
    // Fallback: use raw value (this should match main route behavior)
    calculatedReserveFuel = reserveFuel;
  }

  // 🚨 AVIATION SAFETY: REQUIRE all fuel parameters - NO DEFAULTS
  if (taxiFuel === undefined || taxiFuel === null || isNaN(Number(taxiFuel))) {
    throw new Error(`CRITICAL: Missing taxi fuel value. Required for safe fuel calculations.`);
  }
  if (contingencyFuelPercent === undefined || contingencyFuelPercent === null || isNaN(Number(contingencyFuelPercent))) {
    throw new Error(`CRITICAL: Missing contingency fuel percentage. Required for safe fuel calculations.`);
  }
  if (!calculatedReserveFuel || isNaN(Number(calculatedReserveFuel))) {
    throw new Error(`CRITICAL: Missing reserve fuel value. Required for safe fuel calculations.`);
  }
  
  const taxiFuelValue = Number(taxiFuel);
  const passengerWeightValue = Number(passengerWeight) || 0; // Weight can be 0
  const contingencyFuelPercentValue = Number(contingencyFuelPercent);
  const reserveFuelValue = Number(calculatedReserveFuel);
  const deckTimePerStopValue = Number(deckTimePerStop) || 0; // Can be 0 if no deck stops
  const deckFuelFlowValue = Number(deckFuelFlow) || 0; // Can be 0 if no deck stops
  // ❌ REMOVED: Global extraFuel fallback - alternate should use departure-specific fuel only
  // const extraFuelValue = Number(extraFuel) || 0;
  
  // Find the split point in the waypoints
  const splitPointName = alternateRouteData.splitPoint;
  if (!splitPointName) {
    console.error('🟠 AlternateStopCard: No split point defined in alternate route data');
    return null;
  }
  
  // Filter to landing stops only (same logic as normal stop cards)
  const landingStopsOnly = waypoints.filter(wp => {
    const isWaypoint = 
      wp.pointType === 'NAVIGATION_WAYPOINT' || 
      wp.isWaypoint === true || 
      wp.type === 'WAYPOINT';
    return !isWaypoint;
  });
  
  let splitPointIndex = landingStopsOnly.findIndex(wp => 
    wp.name && wp.name.toUpperCase() === splitPointName.toUpperCase()
  );
  
  // If not found in landing stops, try searching in all waypoints
  if (splitPointIndex === -1) {
    
    const allWaypointsIndex = waypoints.findIndex(wp => 
      wp.name && wp.name.toUpperCase() === splitPointName.toUpperCase()
    );
    
    if (allWaypointsIndex !== -1) {
      
      // Find the corresponding landing stop index
      // Count how many landing stops come before this waypoint
      splitPointIndex = 0;
      for (let i = 0; i <= allWaypointsIndex && splitPointIndex < landingStopsOnly.length; i++) {
        const wp = waypoints[i];
        const isWaypoint = 
          wp.pointType === 'NAVIGATION_WAYPOINT' || 
          wp.isWaypoint === true || 
          wp.type === 'WAYPOINT';
        
        if (!isWaypoint) {
          if (wp.name && wp.name.toUpperCase() === splitPointName.toUpperCase()) {
            break;
          }
          splitPointIndex++;
        }
      }
      
    }
  }
  
  if (splitPointIndex === -1 || splitPointIndex >= landingStopsOnly.length) {
    console.error('🟠 AlternateStopCard: Split point not found or invalid index:', {
      splitPointName,
      splitPointIndex,
      landingStopsLength: landingStopsOnly.length
    });
    return null;
  }
  
  
  // Calculate fuel for legs TO the split point (not including the split point leg itself)
  let legsToSplitPointFuel = 0;
  let legsToSplitPointDistance = 0;
  let legsToSplitPointTime = 0;
  
  // Use route stats legs if available for consistency
  if (routeStats && routeStats.legs && routeStats.legs.length > 0) {
    
    // Sum up legs TO the split point (up to but not including split point index)
    for (let i = 0; i < Math.min(splitPointIndex, routeStats.legs.length); i++) {
      const leg = routeStats.legs[i];
      legsToSplitPointFuel += leg.fuel || 0;
      legsToSplitPointDistance += leg.distance || 0;
      legsToSplitPointTime += leg.time || 0;
      
    }
  } else {
    
    // 🎯 SINGLE SOURCE OF TRUTH: Use RouteCalculator for legs to split point as well
    if (splitPointIndex > 0) {
      try {
        // Import RouteCalculator - check what's available
        
        // Use the RouteCalculator instance (lowercase 'r') that's already initialized
        const routeCalculator = window.routeCalculator;
        
        if (!routeCalculator) {
          console.error('🟠 AlternateStopCard: RouteCalculator not available for legs to split point - falling back to simple calculation');
          
          // Fallback: simple calculation without RouteCalculator
          for (let i = 0; i < splitPointIndex; i++) {
            const fromWaypoint = landingStopsOnly[i];
            const toWaypoint = landingStopsOnly[i + 1];
            
            // Simple distance calculation
            if (fromWaypoint.coords && toWaypoint.coords) {
              try {
                const from = window.turf.point(fromWaypoint.coords);
                const to = window.turf.point(toWaypoint.coords);
                const distance = window.turf.distance(from, to, { units: 'nauticalmiles' });
                const time = distance / selectedAircraft.cruiseSpeed;
                const fuel = Math.round(time * selectedAircraft.fuelBurn);
                
                legsToSplitPointFuel += fuel;
                legsToSplitPointDistance += distance;
                legsToSplitPointTime += time;
              } catch (error) {
                console.error('🟠 AlternateStopCard: Error in fallback calculation:', error);
              }
            }
          }
          
        } else {
          // Create coordinates array for legs to split point
          const legsToSplitCoordinates = [];
          for (let i = 0; i <= splitPointIndex; i++) {
            const waypoint = landingStopsOnly[i];
            if (waypoint.coords) {
              legsToSplitCoordinates.push(waypoint.coords);
            } else if (waypoint.lat && waypoint.lon) {
              legsToSplitCoordinates.push([waypoint.lon, waypoint.lat]);
            }
          }
          
          if (legsToSplitCoordinates.length >= 2) {
            
            const legsToSplitStats = routeCalculator.calculateRouteStats(
              legsToSplitCoordinates,
              {
                selectedAircraft,
                weather,
                passengerWeight: passengerWeightValue,
                forceTimeCalculation: true
              }
            );
            
            
            if (legsToSplitStats && legsToSplitStats.tripFuel !== undefined) {
              legsToSplitPointFuel = legsToSplitStats.tripFuel;
              legsToSplitPointDistance = legsToSplitStats.totalDistance;
              legsToSplitPointTime = legsToSplitStats.timeHours; // FIX: Use timeHours instead of totalTime
            } else {
              console.error('🟠 AlternateStopCard: RouteCalculator returned invalid results for legs to split point');
              return null;
            }
          } else {
            console.error('🟠 AlternateStopCard: Not enough coordinates for legs to split point');
            return null;
          }
        }
        
      } catch (error) {
        console.error('🟠 AlternateStopCard: Error using RouteCalculator for legs to split point:', error);
        return null;
      }
    }
  }
  
  // 🎯 SINGLE SOURCE OF TRUTH: Use RouteCalculator for alternate route (same as main route)
  let alternateLegFuel = 0;
  let alternateLegDistance = 0;
  let alternateLegTime = 0;
  
  if (alternateRouteData.coordinates && alternateRouteData.coordinates.length >= 2) {
    
    try {
      // Use the RouteCalculator instance - same as main route uses
      const routeCalculator = window.routeCalculator;
      
      if (!routeCalculator) {
        console.error('🎯 AlternateStopCard: RouteCalculator not available');
        return null;
      }
      
      // Calculate JUST the alternate leg (split point to alternate destination) using RouteCalculator
      const splitPointCoords = alternateRouteData.coordinates[0]; // [lon, lat]
      const alternateDestCoords = alternateRouteData.coordinates[alternateRouteData.coordinates.length - 1]; // [lon, lat]
      
      // Create coordinates array for just the alternate leg
      const alternateLegCoordinates = [splitPointCoords, alternateDestCoords];
      
      const alternateLegStats = routeCalculator.calculateRouteStats(
        alternateLegCoordinates,
        {
          selectedAircraft,
          weather,
          passengerWeight: passengerWeightValue,
          forceTimeCalculation: true
        }
      );
      
      
      if (alternateLegStats && alternateLegStats.tripFuel !== undefined) {
        
        // Use RouteCalculator results for alternate leg only
        alternateLegDistance = alternateLegStats.totalDistance || 0;
        alternateLegTime = alternateLegStats.timeHours || 0; // FIX: Use timeHours consistently
        alternateLegFuel = alternateLegStats.tripFuel || 0;
      } else {
        console.error('🎯 AlternateStopCard: RouteCalculator returned invalid results for alternate leg');
        return null;
      }
      
    } catch (error) {
      console.error('🎯 AlternateStopCard: Error using RouteCalculator:', error);
      return null;
    }
  } else {
    console.error('🎯 AlternateStopCard: Invalid alternate route coordinates');
    return null;
  }
  
  // Calculate total trip fuel for alternate route
  const totalAlternateTripFuel = legsToSplitPointFuel + alternateLegFuel;
  
  // Calculate fuel components using same logic as normal stop cards
  const alternateContingencyFuel = Math.round((totalAlternateTripFuel * contingencyFuelPercentValue) / 100);
  
  // 🔧 DECK TIME FIX: Calculate deck fuel for intermediate stops TO the split point using individual overrides
  let alternateDeckTimeMinutes = 0;
  for (let i = 1; i < splitPointIndex; i++) { // Skip departure (0), count up to split point
    if (i < waypoints.length) {
      const stop = waypoints[i];
      const cardIndex = i + 1; // Convert to 1-based card index
      const individualDeckTime = getLocationFuel(stop, 'deckTime', cardIndex);
      const deckTimeForThisStop = individualDeckTime > 0 ? individualDeckTime : deckTimePerStopValue;
      alternateDeckTimeMinutes += deckTimeForThisStop;
      
      console.log(`🔧 ALTERNATE DECK TIME: ${stop?.name} (card ${cardIndex}) = ${deckTimeForThisStop} minutes`);
    }
  }
  const alternateDeckTimeHours = alternateDeckTimeMinutes / 60;
  const alternateDeckFuel = Math.round(alternateDeckTimeHours * deckFuelFlowValue);
  console.log(`🔧 ALTERNATE TOTAL DECK: ${alternateDeckTimeMinutes} minutes = ${alternateDeckFuel} lbs`);
  
  // 🚨 CRITICAL FIX: Calculate segment 1 ARA fuel for alternate card (same as main calculation)
  // Import the segment-aware utilities if not already available
  const { detectLocationSegment, createSegmentFuelKey } = options.segmentUtils || {};
  
  // Calculate segment 1 ARA fuel using the SAME logic as main departure calculation
  let alternateAraFuel = araFuel; // Start with passed value
  
  // 🚨 CRITICAL FIX: ALWAYS check for ARA fuel overrides, not just when locationFuelOverrides exists
  // This ensures refuel scenarios get ARA fuel correctly
  if (options.refuelStops || (options.locationFuelOverrides && Object.keys(options.locationFuelOverrides).length > 0)) {
    // Use the same segment calculation logic as main departure
    let segment1AraTotal = 0;
    
    // Look through all landing stops to find segment 1 ARA fuel requirements
    landingStopsOnly.forEach((waypoint, index) => {
      const waypointName = waypoint?.name || waypoint?.stopName || waypoint?.location;
      if (waypointName && options.refuelStops) {
        // Use the same segment detection logic
        if (detectLocationSegment) {
          const waypointSegment = detectLocationSegment(waypointName, landingStopsOnly, options.refuelStops, 'requirements', index + 1);
          
          console.log(`🔍 ALTERNATE CARD SEGMENT: ${waypointName} detected as segment ${waypointSegment}, refuelStops:`, options.refuelStops);
          
          if (waypointSegment === 1) {
            // Check for segment-aware ARA fuel override first
            const segmentKey = createSegmentFuelKey ? createSegmentFuelKey(waypointName, 'araFuel', 1) : null;
            const segmentOverride = segmentKey ? options.locationFuelOverrides[segmentKey] : null;
            
            if (segmentOverride && segmentOverride.value !== undefined) {
              const overrideValue = Number(segmentOverride.value) || 0;
              segment1AraTotal += overrideValue;
            } else {
              // 🚨 LEGACY COMPATIBILITY: Check for legacy override key (same as main calculation)
              const legacyKey = `${waypointName}_araFuel`;
              const legacyOverride = options.locationFuelOverrides[legacyKey];
              
              console.log(`🔍 ALTERNATE LEGACY CHECK: Looking for key '${legacyKey}', found:`, legacyOverride);
              
              if (legacyOverride !== undefined) {
                // Handle both object format {value: X} and direct value format
                const overrideValue = (typeof legacyOverride === 'object' && legacyOverride.value !== undefined) 
                  ? Number(legacyOverride.value) || 0
                  : Number(legacyOverride) || 0;
                
                if (overrideValue > 0) {
                  console.log(`🌦️ ALTERNATE CARD LEGACY ARA: ${waypointName} araFuel = ${overrideValue} lbs (legacy key)`);
                  segment1AraTotal += overrideValue;
                }
              }
            }
          }
        }
      }
    });
    
    console.log(`🎯 ALTERNATE CARD: segment1AraTotal = ${segment1AraTotal}, will set alternateAraFuel = ${segment1AraTotal > 0 ? segment1AraTotal : alternateAraFuel}`);
    
    if (segment1AraTotal > 0) {
      alternateAraFuel = segment1AraTotal;
    }
  }
  
  // ✅ CRITICAL FIX: Use segment-aware fuel logic for alternate card (same as main route)
  const departureWaypoint = landingStopsOnly[0];
  
  // 🔧 SEGMENT 1 → ALTERNATE CARD FLOW: Use proper getLocationFuel function
  const alternateExtraFuel = departureWaypoint ? 
    (getLocationFuel(departureWaypoint, 'extraFuel', 1) || 0) : 0;
    
  console.log(`🔧 ALTERNATE CARD: ${departureWaypoint?.name} extraFuel = ${alternateExtraFuel} lbs (segment-aware)`);
  
  // 🔧 CRITICAL ARA FIX: Check for current key format ARA fuel overrides in segment 1
  let totalUserAraFuel = 0;
  
  // Check all segment 1 locations for ARA fuel overrides using current key format
  if (departureWaypoint && landingStopsOnly.length > 0) {
    // Determine segment 1 boundary (up to first refuel stop)
    const firstRefuelCardIndex = options.refuelStops && options.refuelStops.length > 0 ? Math.min(...options.refuelStops) : landingStopsOnly.length;
    const segment1EndIndex = Math.min(firstRefuelCardIndex, landingStopsOnly.length);
    
    console.log(`🔧 ALTERNATE CARD: Checking segment 1 (cards 1 to ${segment1EndIndex}) for ARA fuel`);
    
    // Check all stops in segment 1 for ARA fuel overrides
    for (let i = 0; i < segment1EndIndex; i++) {
      const waypoint = landingStopsOnly[i];
      const cardIndex = i + 1; // Convert to 1-based card index
      
      // Use current key format: stopName_cardIndex_araFuel
      const currentFormatKey = `${waypoint.name || waypoint.stopName}_${cardIndex}_araFuel`;
      const currentOverride = options.locationFuelOverrides?.[currentFormatKey];
      
      if (currentOverride) {
        const araValue = typeof currentOverride === 'object' ? 
          (currentOverride.value || 0) : (currentOverride || 0);
        totalUserAraFuel += Number(araValue) || 0;
        console.log(`🔧 ALTERNATE CARD ARA: Found ${currentFormatKey} = ${araValue} lbs (card ${cardIndex})`);
      }
    }
  }
  
  console.log(`🔧 ALTERNATE CARD: Total user ARA fuel in segment 1 = ${totalUserAraFuel} lbs`);
  console.log(`🔧 ALTERNATE CARD: Existing alternateAraFuel = ${alternateAraFuel} lbs`);
  
  // 🔧 SEGMENT 1 → ALTERNATE CARD: Use higher of calculated ARA or user ARA overrides
  const finalAlternateAraFuel = Math.max(alternateAraFuel, totalUserAraFuel);
  
  console.log(`🔧 ALTERNATE CARD: Final ARA fuel = ${finalAlternateAraFuel} lbs (max of calculated vs user)`);
  
  // Calculate total fuel required for alternate route (using corrected ARA fuel)
  const totalAlternateFuel = taxiFuelValue + totalAlternateTripFuel + alternateContingencyFuel + finalAlternateAraFuel + alternateDeckFuel + approachFuel + reserveFuelValue + alternateExtraFuel;
  
  // Calculate max passengers using same logic as normal stop cards
  let maxPassengers = 0;
  if (selectedAircraft) {
    maxPassengers = PassengerCalculator.calculateMaxPassengers(
      selectedAircraft, 
      totalAlternateFuel, 
      passengerWeightValue,
      cargoWeight
    );
  }

  // Create fuel components text - CONSISTENT: Only show components > 0 (match main cards)
  let alternateParts = [];
  
  if (taxiFuelValue > 0) {
    alternateParts.push(`Taxi:${taxiFuelValue}`);
  }
  if (legsToSplitPointFuel > 0) {
    alternateParts.push(`Trip:${legsToSplitPointFuel}`);
  }
  if (alternateLegFuel > 0) {
    alternateParts.push(`Alt:${alternateLegFuel}`);
  }
  if (alternateContingencyFuel > 0) {
    alternateParts.push(`Cont:${alternateContingencyFuel}`);
  }
  if (finalAlternateAraFuel > 0) {
    alternateParts.push(`ARA:${finalAlternateAraFuel}`);
  }
  if (alternateDeckFuel > 0) {
    alternateParts.push(`Deck:${alternateDeckFuel}`);
  }
  if (approachFuel > 0) {
    alternateParts.push(`Approach:${approachFuel}`);
  }
  if (reserveFuelValue > 0) {
    alternateParts.push(`Res:${reserveFuelValue}`);
  }
  
  if (alternateExtraFuel > 0) {
    alternateParts.push(`Extra:${alternateExtraFuel}`);
  }
  
  const fuelComponentsText = alternateParts.join(' ');
  
  
  // Create route description
  const alternateDestination = alternateRouteData.name ? 
    alternateRouteData.name.replace(' (Alternate)', '').split(' ').pop() : 
    'Unknown';
  const routeDescription = `Legs to ${splitPointName} + Alternate to ${alternateDestination}`;
  
  // Calculate total distance and time with proper number handling
  const totalAlternateDistance = Number(legsToSplitPointDistance || 0) + Number(alternateLegDistance || 0);
  const totalAlternateTime = Number(legsToSplitPointTime || 0) + Number(alternateLegTime || 0);
  
  // Create the alternate stop card
  const alternateCard = {
    index: 'A',
    id: 'alternate-route',
    stopName: 'Alternate Route',
    legDistance: Number(alternateLegDistance || 0).toFixed(1),
    totalDistance: Number(totalAlternateDistance || 0).toFixed(1),
    legTime: Number(alternateLegTime || 0),
    totalTime: Number(totalAlternateTime || 0),
    legFuel: Number(alternateLegFuel || 0),
    totalFuel: Number(totalAlternateFuel || 0),
    maxPassengers: maxPassengers,
    maxPassengersDisplay: maxPassengers,
    maxPassengersWeight: maxPassengers * passengerWeightValue,
    groundSpeed: selectedAircraft.cruiseSpeed, // Average ground speed
    headwind: 0, // Could be calculated as average if needed
    deckTime: Number(alternateDeckTimeHours * 60), // Convert back to minutes
    deckFuel: Number(alternateDeckFuel),
    fuelComponents: fuelComponentsText,
    fuelComponentsObject: {
      tripFuel: legsToSplitPointFuel,  // PALANTIR MATCH: Legs to split point only
      altFuel: alternateLegFuel,       // PALANTIR MATCH: Alternate leg only
      totalTripFuel: totalAlternateTripFuel,  // Keep total for calculations
      contingencyFuel: alternateContingencyFuel,
      taxiFuel: taxiFuelValue,
      araFuel: finalAlternateAraFuel,  // 🔧 FIXED: Use corrected ARA fuel including user overrides
      deckFuel: alternateDeckFuel,
      approachFuel: approachFuel,  // Include weather fuel for alternate
      reserveFuel: reserveFuelValue,
      extraFuel: alternateExtraFuel  // 🔧 ADDED: Include extra fuel in components
    },
    isDeparture: false,
    isDestination: false,
    isAlternate: true, // Special flag for alternate cards
    routeDescription: routeDescription
  };
  
  
  return alternateCard;
};

/**
 * 🛩️ REFUEL SEGMENTATION: Calculate stop cards for routes with refuel stops
 * Each segment is treated as an independent flight for fuel calculations
 * 
 * @param {Array} waypoints - Landing stops waypoints array
 * @param {Object} routeStats - Route statistics from RouteCalculator
 * @param {Object} selectedAircraft - Selected aircraft with performance data
 * @param {Object} weather - Weather data (windSpeed, windDirection)
 * @param {Object} options - Optional calculation parameters
 * @param {Array} weatherSegments - Weather segments data for rig detection
 * @param {Array} refuelStops - Array of refuel stop indices (e.g., [1, 3])
 * @param {boolean} waiveAlternates - Whether alternates are waived for VFR operations
 * @returns {Array} Array of stop card objects
 */
const calculateSegmentedStopCards = (waypoints, routeStats, selectedAircraft, weather, options, weatherSegments, refuelStops, waiveAlternates, alternateStopCard = null) => {
  
  // Split waypoints into segments at refuel points
  const segments = splitWaypointsIntoSegments(waypoints, refuelStops);
  
  const allStopCards = [];
  
  // Calculate each segment independently
  for (let segmentIndex = 0; segmentIndex < segments.length; segmentIndex++) {
    const segment = segments[segmentIndex];
    
    // For each segment, calculate as if it's an independent flight
    const segmentWaypoints = segment.waypoints;
    const isFirstSegment = segmentIndex === 0;
    const isLastSegment = segmentIndex === segments.length - 1;
    
    // Calculate segment fuel requirements
    const segmentCards = calculateSingleSegment(
      segmentWaypoints,
      routeStats, 
      selectedAircraft,
      weather,
      options,
      weatherSegments,
      isFirstSegment,
      isLastSegment,
      waiveAlternates
    );
    
    // Add cards to our results, but handle special cases
    if (isFirstSegment) {
      // For first segment, handle departure fuel logic (MAX of segment vs alternate)
      allStopCards.push(...segmentCards);
    } else {
      // For subsequent segments, skip the departure card (it's a refuel stop)
      allStopCards.push(...segmentCards.slice(1));
    }
  }
  
  return allStopCards;
};

/**
 * 🛩️ Split waypoints into segments at refuel stops
 */
const splitWaypointsIntoSegments = (waypoints, refuelStops) => {
  const segments = [];
  let currentStartIndex = 0;
  
  // Sort refuel stops to ensure proper order
  const sortedRefuelStops = [...refuelStops].sort((a, b) => a - b);
  
  for (const refuelStopIndex of sortedRefuelStops) {
    if (refuelStopIndex > currentStartIndex && refuelStopIndex < waypoints.length - 1) {
      // Create segment from current start to refuel stop
      const segmentWaypoints = waypoints.slice(currentStartIndex, refuelStopIndex + 1);
      segments.push({
        start: waypoints[currentStartIndex],
        end: waypoints[refuelStopIndex],
        waypoints: segmentWaypoints,
        startIndex: currentStartIndex,
        endIndex: refuelStopIndex,
        isRefuelEnd: true
      });
      currentStartIndex = refuelStopIndex;
    }
  }
  
  // Add final segment from last refuel stop to destination
  if (currentStartIndex < waypoints.length - 1) {
    const segmentWaypoints = waypoints.slice(currentStartIndex);
    segments.push({
      start: waypoints[currentStartIndex],
      end: waypoints[waypoints.length - 1],
      waypoints: segmentWaypoints,
      startIndex: currentStartIndex,
      endIndex: waypoints.length - 1,
      isRefuelEnd: false
    });
  }
  
  return segments;
};

/**
 * 🛩️ Calculate fuel requirements for a single segment
 */
const calculateSingleSegment = (segmentWaypoints, routeStats, selectedAircraft, weather, options, weatherSegments, isFirstSegment, isLastSegment, waiveAlternates) => {
  
  // Create segment-specific routeStats by extracting relevant legs
  let segmentRouteStats = null;
  if (routeStats && routeStats.legs) {
    // Calculate which legs belong to this segment
    const segmentLegs = extractSegmentLegs(segmentWaypoints, routeStats.legs);
    
    if (segmentLegs.length > 0) {
      // Calculate segment totals
      const segmentTotalDistance = segmentLegs.reduce((sum, leg) => sum + parseFloat(leg.distance), 0);
      const segmentTotalTime = segmentLegs.reduce((sum, leg) => sum + parseFloat(leg.time || 0), 0);
      const segmentTripFuel = segmentLegs.reduce((sum, leg) => sum + parseInt(leg.fuel || 0), 0);
      
      segmentRouteStats = {
        ...routeStats,
        totalDistance: segmentTotalDistance,
        timeHours: segmentTotalTime,
        tripFuel: segmentTripFuel,
        legs: segmentLegs,
        windAdjusted: routeStats.windAdjusted || false
      };
    }
  }
  
  // Call the main calculation function with no refuel stops (to avoid recursion)
  // This calculates the segment as if it's a complete independent flight
  const segmentCards = calculateStopCards(
    segmentWaypoints,
    segmentRouteStats,
    selectedAircraft,
    weather,
    options,
    weatherSegments,
    [], // No refuel stops for individual segments
    false // waiveAlternates handled at segment level
  );
  
  // Handle special logic for first segment departure fuel
  if (isFirstSegment && !waiveAlternates) {
    
    // TODO: Calculate what the fuel would be for full alternate route
    // and use MAX(segment_fuel, alternate_fuel) for departure
    
  }
  
  return segmentCards;
};

/**
 * 🛩️ Extract legs that belong to a specific segment based on waypoints
 */
const extractSegmentLegs = (segmentWaypoints, allLegs) => {
  if (!segmentWaypoints || segmentWaypoints.length < 2 || !allLegs) {
    return [];
  }
  
  // For now, return a proportional subset of legs
  // TODO: Implement proper waypoint-to-leg matching
  const segmentLength = segmentWaypoints.length - 1; // Number of legs in segment
  const totalLegs = allLegs.length;
  
  // Simple approach: take proportional legs from the start
  // This is a simplified implementation - we'll improve this
  const startIndex = 0; // TODO: Calculate proper start index based on segment position
  const endIndex = Math.min(segmentLength, totalLegs);
  
  return allLegs.slice(startIndex, endIndex);
};


export default {
  calculateStopCards,
  calculateAlternateStopCard
};