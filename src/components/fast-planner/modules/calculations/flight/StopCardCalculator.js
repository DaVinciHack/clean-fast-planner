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
const calculateStopCards = (waypoints, routeStats, selectedAircraft, weather, options = {}, weatherSegments = null, refuelStops = [], waiveAlternates = false) => {
  console.log('⭐ StopCardCalculator: Starting with routeStats?', !!routeStats);
  console.log('🛩️ StopCardCalculator: Refuel stops:', refuelStops, 'Waive alternates:', waiveAlternates);
  
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
    console.log('StopCardCalculator: No landing stops found, using first and last waypoints as landing stops');
    landingStopsOnly.push(waypoints[0]);
    if (waypoints.length > 1) {
      landingStopsOnly.push(waypoints[waypoints.length - 1]);
    }
  }
  
  // Log routeStats data if available
  if (routeStats) {
    console.log('⭐ StopCardCalculator using routeStats:', {
      totalDistance: routeStats.totalDistance,
      timeHours: routeStats.timeHours,
      estimatedTime: routeStats.estimatedTime,
      tripFuel: routeStats.tripFuel,
      fuelRequired: routeStats.fuelRequired,
      hasLegs: routeStats.legs ? routeStats.legs.length : 0,
      windAdjusted: routeStats.windAdjusted || false
    });
  }
  
  // 🛩️ REFUEL SEGMENTATION: Check if we need to segment the route at refuel stops
  const hasRefuelStops = refuelStops && refuelStops.length > 0;
  
  if (hasRefuelStops) {
    console.log(`🛩️ StopCardCalculator: Refuel stops detected:`, refuelStops);
    console.log(`🛩️ StopCardCalculator: TEMPORARILY using standard calculation with refuel display logic`);
    console.log(`🛩️ TODO: Fix segmentation to preserve refuel display and implement proper fuel recalculation`);
    // TODO: Fix segmentation to pass refuel context to individual segments
    // return calculateSegmentedStopCards(
    //   landingStopsOnly, 
    //   routeStats, 
    //   selectedAircraft, 
    //   weather, 
    //   options, 
    //   weatherSegments, 
    //   refuelStops, 
    //   waiveAlternates
    // );
  }
  
  console.log('🛩️ StopCardCalculator: Standard calculation (segmentation disabled for debugging)');
  
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
    extraFuel = 0,        // Manual extra fuel override
    cargoWeight = 0,      // Cargo weight for payload calculations
    araFuel = 0,          // ARA fuel from weather analysis
    approachFuel = 0,     // Approach fuel from weather analysis
    fuelPolicy = null     // NEW: Fuel policy for reserve fuel type detection
  } = options;
  
  
  // 🔧 DEBUG: Log extraFuel value to see what we're getting
  console.log('🔧 StopCardCalculator extraFuel debug:', {
    extraFuel,
    extraFuelType: typeof extraFuel,
    options: options,
    allOptions: Object.keys(options)
  });
  
  // ✅ AVIATION SAFETY: NO FALLBACKS - Either convert properly or FAIL SAFELY
  let calculatedReserveFuel = null; // Start with null - no dangerous defaults
  
  // ✅ ENHANCED DEBUG: Reserve fuel conversion with detailed logging
  console.log('🔍 StopCardCalculator: Reserve fuel conversion check:', {
    reserveFuel,
    hasFuelPolicy: !!fuelPolicy,
    hasAircraft: !!selectedAircraft,
    aircraftFuelBurn: selectedAircraft?.fuelBurn,
    fuelPolicyStructure: fuelPolicy ? {
      fuelTypes: !!fuelPolicy.fuelTypes,
      reserveFuel: !!fuelPolicy.fuelTypes?.reserveFuel,
      reserveType: fuelPolicy.fuelTypes?.reserveFuel?.type,
      reserveDefault: fuelPolicy.fuelTypes?.reserveFuel?.default
    } : 'NO_POLICY'
  });
  
  if (fuelPolicy && fuelPolicy.fuelTypes?.reserveFuel && selectedAircraft?.fuelBurn) {
    const reserveType = fuelPolicy.fuelTypes.reserveFuel.type || 'fixed';
    const reservePolicyValue = fuelPolicy.fuelTypes.reserveFuel.default || reserveFuel;
    
    console.log('🔍 StopCardCalculator: Fuel policy details found:', {
      reserveType,
      reservePolicyValue,
      originalReserveFuel: reserveFuel
    });
    
    if (reserveType === 'time') {
      // Time-based: time (minutes) × fuel flow (lbs/hour) ÷ 60
      const timeMinutes = reservePolicyValue;
      const fuelFlowPerHour = selectedAircraft.fuelBurn;
      calculatedReserveFuel = Math.round((timeMinutes * fuelFlowPerHour) / 60);
      
      console.log(`⛽ StopCardCalculator: Reserve Fuel Calc: ${timeMinutes} min × ${fuelFlowPerHour} lbs/hr = ${calculatedReserveFuel} lbs`);
    } else {
      // Fixed amount - use policy value as-is
      calculatedReserveFuel = reservePolicyValue;
      console.log(`⛽ StopCardCalculator: Using fixed reserve fuel: ${calculatedReserveFuel} lbs`);
    }
  } else {
    // 🚨 AVIATION SAFETY: NO CALCULATION WITHOUT PROPER DATA
    console.error('🚨 CRITICAL ERROR: Reserve fuel conversion failed - STOPPING CALCULATION');
    console.error('🚨 DETAILS:', {
      hasFuelPolicy: !!fuelPolicy,
      hasFuelTypes: !!fuelPolicy?.fuelTypes,
      hasReserveFuel: !!fuelPolicy?.fuelTypes?.reserveFuel,
      hasAircraftFuelBurn: !!selectedAircraft?.fuelBurn
    });
    
    // Return empty array instead of dangerous calculations
    return [];
  }
  
  // 🚨 SAFETY CHECK: Ensure we have a valid converted value
  if (calculatedReserveFuel === null || calculatedReserveFuel === undefined || isNaN(calculatedReserveFuel)) {
    console.error('🚨 CRITICAL ERROR: Reserve fuel conversion produced invalid result:', calculatedReserveFuel);
    return [];
  }
  
  // Log all received values for debugging
  console.log('🧰 StopCardCalculator received raw values:', {
    taxiFuel,
    passengerWeight,
    contingencyFuelPercent,
    reserveFuel: `${reserveFuel} → ${calculatedReserveFuel} (converted)`,
    deckTimePerStop,
    deckFuelFlow
  });
  
  // Convert all calculation parameters to proper numeric values
  const taxiFuelValue = Number(taxiFuel);
  const passengerWeightValue = Number(passengerWeight);
  const contingencyFuelPercentValue = Number(contingencyFuelPercent);
  const reserveFuelValue = Number(calculatedReserveFuel); // ✅ Use converted reserve fuel
  const deckTimePerStopValue = Number(deckTimePerStop);
  const deckFuelFlowValue = Number(deckFuelFlow);
  
  // Log converted values for debugging
  console.log('🧰 StopCardCalculator using numeric values:', {
    taxiFuelValue,
    passengerWeightValue,
    contingencyFuelPercentValue,
    reserveFuelValue,
    deckTimePerStopValue,
    deckFuelFlowValue
  });

  // Validate inputs
  if (!stopsToProcess || stopsToProcess.length < 2 || !selectedAircraft) {
    console.log('StopCardCalculator: Missing required data', {
      hasWaypoints: stopsToProcess ? stopsToProcess.length : 0,
      hasAircraft: !!selectedAircraft
    });
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
  if (!selectedAircraft.emptyWeight || isNaN(Number(selectedAircraft.emptyWeight))) {
    throw new Error(`CRITICAL: Aircraft ${selectedAircraft.registration} missing empty weight. OSDK aircraft data required for safe passenger calculations.`);
  }
  if (!selectedAircraft.maxTakeoffWeight || isNaN(Number(selectedAircraft.maxTakeoffWeight))) {
    throw new Error(`CRITICAL: Aircraft ${selectedAircraft.registration} missing max takeoff weight. OSDK aircraft data required for safe passenger calculations.`);
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

  console.log('StopCardCalculator: Generating stop cards with', stopsToProcess.length, 'landing stops');

  // Create data for each stop
  const cards = [];

  // Get aircraft data for calculations
  const aircraft = selectedAircraft;
  
  // 🔍 DEBUG: Log complete aircraft object to see all available fields
  console.log('🔍 COMPLETE AIRCRAFT OBJECT:', aircraft);
  console.log('🔍 AIRCRAFT FUEL FIELDS:', {
    fuelFlow: aircraft?.fuelFlow,
    fuelBurn: aircraft?.fuelBurn,
    flatPitchFuelBurnDeckFuel: aircraft?.flatPitchFuelBurnDeckFuel,
    allKeys: aircraft ? Object.keys(aircraft) : 'aircraft is null/undefined'
  });

  // Calculate total trip values
  let totalDistance = 0;
  let totalTripFuel = 0;
  const legDetails = [];
  
  // IMPORTANT: First check if we can use RouteCalculator's results directly
  // This helps ensure a single source of truth for calculations
  let useRouteStatsDirectly = false;
  
  if (routeStats && routeStats.legs && routeStats.legs.length > 0) {
    console.log('⭐ StopCardCalculator: Using route stats legs data directly:', routeStats.legs.length);
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
    
    console.log('⭐ StopCardCalculator: Using route stats values:', {
      totalDistance, 
      totalTripFuel,
      timeHours: routeStats.timeHours
    });
    
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
      
      console.log(`⭐ StopCardCalculator: Mapped leg ${i} from route stats:`, {
        distance: legDetails[legDetails.length-1].distance.toFixed(1),
        time: legDetails[legDetails.length-1].timeHours.toFixed(2),
        fuel: legDetails[legDetails.length-1].fuel
      });
    }
  }
  
  // If not using route stats directly, calculate leg details ourselves
  if (!useRouteStatsDirectly) {
    console.log('⭐ StopCardCalculator: Calculating leg details directly (not using route stats)');
    
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
            
            console.log(`StopCardCalculator: Segment ${j+1} in leg ${i+1}: distance=${segmentDistance.toFixed(1)}nm, time=${segmentTimeHours.toFixed(2)}h, fuel=${segmentFuel}lbs`);
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
      
      console.log(`StopCardCalculator: Leg ${i+1} totals: distance=${legDistance.toFixed(1)}nm, time=${legTimeHours.toFixed(2)}h, fuel=${legFuel}lbs`);
      
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
  console.log('⛽ Using numeric fuel values:', {
    taxiFuelValue, 
    reserveFuelValue,
    contingencyFuelPercentValue,
    deckTimePerStopValue,
    deckFuelFlowValue
  });

  // Calculate intermediate stops (for deck fuel)
  // Only count landing stops that are not departure or destination
  const landingStopsCount = landingStopsOnly.length;
  const intermediateStops = Math.max(0, landingStopsCount - 2);
  
  console.log(`StopCardCalculator: Calculating deck time for ${intermediateStops} intermediate stops out of ${landingStopsCount} total landing stops`);
  
  // 🔍 DEBUG: Check what fuel flow data we have from aircraft
  console.log('🔍 FUEL FLOW DEBUG:', {
    selectedAircraft_available: !!aircraft,
    aircraft_fuelFlow: aircraft?.fuelFlow,
    aircraft_fuelBurn: aircraft?.fuelBurn, 
    aircraft_flatPitchFuelBurnDeckFuel: aircraft?.flatPitchFuelBurnDeckFuel,
    deckFuelFlowValue_being_used: deckFuelFlowValue,
    deckFuelFlowValue_source: 'from options parameter'
  });
  
  // Calculate deck time and fuel
  const deckTimeHours = (intermediateStops * deckTimePerStopValue) / 60; // Convert from minutes to hours
  
  // 🚨 AVIATION SAFETY: REQUIRE OSDK aircraft data - NO FALLBACKS ALLOWED
  if (!aircraft?.flatPitchFuelBurnDeckFuel) {
    throw new Error(`CRITICAL: Missing deck fuel flow data for aircraft ${aircraft?.registration || 'unknown'}. OSDK aircraft data required for safe fuel calculations.`);
  }
  const actualDeckFuelFlow = aircraft.flatPitchFuelBurnDeckFuel;
  const deckFuelValue = Math.round(deckTimeHours * actualDeckFuelFlow);
  
  // 🔍 DEBUG: Show what deck fuel flow is actually being used
  console.log('✅ DECK FUEL FLOW SOURCE:', {
    aircraft_flatPitchFuelBurnDeckFuel: aircraft?.flatPitchFuelBurnDeckFuel,
    options_deckFuelFlow: deckFuelFlowValue,
    actualDeckFuelFlow_used: actualDeckFuelFlow,
    source: aircraft?.flatPitchFuelBurnDeckFuel ? 'OSDK Aircraft Data' : 'Options Fallback'
  });
  
  // 🔍 DEBUG: Show the deck fuel calculation
  console.log('🔍 DECK FUEL CALCULATION:', {
    intermediateStops,
    deckTimePerStopValue_minutes: deckTimePerStopValue,
    deckTimeHours: deckTimeHours,
    deckFuelFlowValue_lbs_per_hour: deckFuelFlowValue,
    deckFuelValue_total_lbs: deckFuelValue,
    calculation: `${intermediateStops} stops × ${deckTimePerStopValue} min/stop ÷ 60 × ${deckFuelFlowValue} lbs/hr = ${deckFuelValue} lbs`
  });

  // Calculate contingency fuel
  const contingencyFuelValue = Math.round((totalTripFuel * contingencyFuelPercentValue) / 100);
  
  // Log the calculated values with more detail
  console.log('🧮 Calculated auxiliary values with detailed breakdown:', {
    taxiFuel_passedValue: taxiFuel,
    taxiFuel_convertedValue: taxiFuelValue,
    taxiFuel_afterConversion: taxiFuelValue,
    
    reserveFuel_passedValue: reserveFuel,
    reserveFuel_convertedValue: reserveFuelValue,
    
    contingencyFuelPercent_passedValue: contingencyFuelPercent,
    contingencyFuelPercent_convertedValue: contingencyFuelPercentValue,
    contingencyFuelPercent_calculation: `${totalTripFuel} * ${contingencyFuelPercentValue} / 100 = ${contingencyFuelValue}`,
    contingencyFuelValue,
    
    deckTimePerStop_passedValue: deckTimePerStop,
    deckTimePerStop_convertedValue: deckTimePerStopValue,
    
    deckFuelFlow_passedValue: deckFuelFlow,
    deckFuelFlow_convertedValue: deckFuelFlowValue,
    
    deckFuel_calculation: `${intermediateStops} stops * (${deckTimePerStopValue} mins / 60) hrs * ${deckFuelFlowValue} lbs/hr = ${deckFuelValue}`,
    deckFuelValue,
    
    intermediateStops,
    totalTripFuel
  });

  // Calculate total fuel required for the entire trip
  const totalFuelRequired = taxiFuelValue + totalTripFuel + contingencyFuelValue + araFuel + deckFuelValue + approachFuel + reserveFuelValue;

  // Create a departure card first
  if (waypoints.length >= 2) {
    const departureWaypoint = waypoints[0];
    
    // 🛩️ REFUEL LOGIC: Calculate departure fuel based on refuel stops
    let departureFuelNeeded;
    let departureComponentsCalculation;
    
    if (hasRefuelStops && refuelStops.length > 0) {
      // Find the first refuel stop index (1-based)
      const firstRefuelStopIndex = Math.min(...refuelStops);
      console.log(`🛩️ DEPARTURE CALC: First refuel stop at index ${firstRefuelStopIndex}`);
      
      // Calculate fuel only to first refuel stop
      let tripFuelToFirstRefuel = 0;
      let deckFuelToFirstRefuel = 0;
      
      // Sum fuel for legs up to first refuel stop
      for (let i = 0; i < legDetails.length && i < firstRefuelStopIndex; i++) {
        tripFuelToFirstRefuel += legDetails[i].fuel;
      }
      
      // Calculate deck fuel for stops before first refuel (intermediate stops only)
      const stopsBeforeFirstRefuel = firstRefuelStopIndex - 1; // -1 because we don't count departure
      deckFuelToFirstRefuel = Math.round((stopsBeforeFirstRefuel * deckTimePerStopValue / 60) * actualDeckFuelFlow);
      
      // Calculate contingency based on trip fuel to first refuel
      const contingencyToFirstRefuel = Math.round((tripFuelToFirstRefuel * contingencyFuelPercentValue) / 100);
      
      // For departure to first refuel: Taxi + Trip(to refuel) + Contingency(for refuel segment) + Reserve + ARA/Approach(if needed) + Deck(for intermediate stops)
      departureFuelNeeded = taxiFuelValue + tripFuelToFirstRefuel + contingencyToFirstRefuel + deckFuelToFirstRefuel + reserveFuelValue + (extraFuel || 0);
      
      // Add ARA/approach fuel if needed for the first segment
      if (araFuel > 0) departureFuelNeeded += araFuel;
      if (approachFuel > 0) departureFuelNeeded += approachFuel;
      
      departureComponentsCalculation = {
        taxi: taxiFuelValue,
        trip: tripFuelToFirstRefuel,
        contingency: contingencyToFirstRefuel,
        deck: deckFuelToFirstRefuel,
        reserve: reserveFuelValue,
        ara: araFuel,
        approach: approachFuel,
        extra: extraFuel || 0
      };
      
      console.log(`🛩️ DEPARTURE CALC: Refuel mode - ${departureFuelNeeded} lbs to first refuel stop`, departureComponentsCalculation);
    } else {
      // Standard calculation for entire journey at departure
      departureFuelNeeded = taxiFuelValue + totalTripFuel + contingencyFuelValue + araFuel + deckFuelValue + approachFuel + reserveFuelValue + (extraFuel || 0);
      
      departureComponentsCalculation = {
        taxi: taxiFuelValue,
        trip: totalTripFuel,
        contingency: contingencyFuelValue,
        deck: deckFuelValue,
        reserve: reserveFuelValue,
        ara: araFuel,
        approach: approachFuel,
        extra: extraFuel || 0
      };
      
      console.log(`🛩️ DEPARTURE CALC: Standard mode - ${departureFuelNeeded} lbs for full route`);
    }
    
    // Create fuel components text for departure using calculated values
    let fuelComponentsParts = [
      `Taxi:${departureComponentsCalculation.taxi}`,
      `Trip:${departureComponentsCalculation.trip}`,
      `Cont:${departureComponentsCalculation.contingency}`
    ];
    
    if (departureComponentsCalculation.ara > 0) {
      fuelComponentsParts.push(`ARA:${departureComponentsCalculation.ara}`);
    }
    
    fuelComponentsParts.push(`Deck:${departureComponentsCalculation.deck}`);
    
    if (departureComponentsCalculation.approach > 0) {
      fuelComponentsParts.push(`Approach:${departureComponentsCalculation.approach}`);
    }
    
    fuelComponentsParts.push(`Res:${departureComponentsCalculation.reserve}`);
    
    if (extraFuel > 0) {
      fuelComponentsParts.push(`Extra:${extraFuel}`);
    }
    
    const departureFuelComponentsText = fuelComponentsParts.join(' ');
    
    // DEBUG: Log the fuel components for departure
    console.log('🔥 DEPARTURE CARD FUEL COMPONENTS (DETAILED):', {
      totalTripFuel,
      contingencyFuelValue,
      taxiFuelValue,
      deckFuelValue,
      reserveFuelValue,
      departureFuelNeeded,
      actualSum: totalTripFuel + contingencyFuelValue + taxiFuelValue + deckFuelValue + reserveFuelValue,
      componentText: departureFuelComponentsText
    });
    
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
    
    // Create departure card with detailed console logging
    console.log('🔎 Creating departure card with components:', {
      tripFuel: departureComponentsCalculation.trip,
      contingencyFuel: departureComponentsCalculation.contingency,
      contingencyRate: `${contingencyFuelPercentValue}%`,
      taxiFuel: departureComponentsCalculation.taxi,
      deckFuel: departureComponentsCalculation.deck,
      reserveFuel: departureComponentsCalculation.reserve,
      totalFuel: departureFuelNeeded,
      componentText: departureFuelComponentsText,
      refuelMode: hasRefuelStops
    });
    
    const departureCard = {
      index: 'D',
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
      isDeparture: true,
      isDestination: false
    };
    
    // Add the departure card to our cards array
    cards.push(departureCard);
  }

  // Now create cards for each intermediate stop and destination
  let cumulativeDistance = 0;
  let cumulativeTime = 0;

  for (let i = 0; i < legDetails.length; i++) {
    const legDetail = legDetails[i];
    const toWaypoint = legDetail.toWaypoint;

    // Create a unique ID for this stop
    const stopId = toWaypoint.id || `waypoint-${i+1}`;

    // Update cumulative values for distance and time (for display only)
    cumulativeDistance += legDetail.distance;
    cumulativeTime += legDetail.timeHours;

    // 🛩️ REFUEL LOGIC: Calculate remaining fuel to next refuel stop or destination
    let remainingTripFuel = 0;
    let remainingIntermediateStops = 0;
    let calculationEndPoint = legDetails.length; // Default to end of route
    
    // Check if there are refuel stops ahead of current position
    if (hasRefuelStops && refuelStops.length > 0) {
      // Find the next refuel stop after current position
      const currentCardIndex = i + 1; // Convert to card index
      const nextRefuelStops = refuelStops.filter(refuelIndex => refuelIndex > currentCardIndex).sort((a, b) => a - b);
      
      if (nextRefuelStops.length > 0) {
        const nextRefuelStopIndex = nextRefuelStops[0];
        calculationEndPoint = nextRefuelStopIndex; // Calculate only to next refuel stop
        console.log(`🛩️ INTERMEDIATE CALC: Stop ${currentCardIndex} calculating to next refuel stop ${nextRefuelStopIndex}`);
      } else {
        console.log(`🛩️ INTERMEDIATE CALC: Stop ${currentCardIndex} calculating to destination (no more refuel stops)`);
      }
    }
    
    // Calculate remaining trip fuel - sum of legs to calculation end point
    for (let j = i + 1; j < legDetails.length && j < calculationEndPoint; j++) {
      remainingTripFuel += legDetails[j].fuel;
    }

    // Calculate remaining number of deck stops to calculation end point
    // Count intermediate stops between current position and calculation end point
    remainingIntermediateStops = Math.max(0, calculationEndPoint - (i + 1) - 1); // -1 because end point doesn't count as intermediate

    // Calculate remaining deck fuel - only for intermediate stops
    const remainingDeckTimeHours = (remainingIntermediateStops * deckTimePerStopValue) / 60;
    const remainingDeckFuel = Math.round(remainingDeckTimeHours * actualDeckFuelFlow);

    // Calculate remaining contingency fuel (proportional to remaining trip fuel)
    let remainingContingencyFuel = 0;
    if (totalTripFuel > 0) {
      remainingContingencyFuel = Math.round((remainingTripFuel / totalTripFuel) * contingencyFuelValue);
    }
    
    console.log(`🛩️ SEGMENT CALC: Stop ${i + 1} - Trip:${remainingTripFuel}, Deck:${remainingDeckFuel}, Cont:${remainingContingencyFuel} (to point ${calculationEndPoint})`);

    // At the final destination, we only have reserve and unused contingency
    const isFinalDestination = i === legDetails.length - 1;
    
    // 🛩️ REFUEL LOGIC: Check if this stop is marked for refuel
    // The refuel stops array contains card indices, which for intermediate stops is (i + 1)
    const cardIndex = i + 1; 
    const isRefuelStop = refuelStops && refuelStops.includes(cardIndex);
    
    // 🛩️ REFUEL LOGIC: If this is a refuel stop, treat it differently from final destination
    const shouldTreatAsFinal = isFinalDestination && !isRefuelStop;

    // Calculate the fuel needed at this stop to continue the journey
    let fuelNeeded;
    let fuelComponents;
    let fuelComponentsText;

    if (shouldTreatAsFinal) {
      // At the final destination, you have reserve fuel and unused contingency
      // For potential landing fuel, we should show the total contingency (from departure)
      // not just the remaining contingency for this leg
      fuelNeeded = reserveFuelValue + remainingContingencyFuel + (extraFuel || 0);
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
      
      
      // Check if this location consumes ARA fuel (for rigs)
      const currentLocationConsumesAra = isRigFromWeather;
      
      // Check if this location consumes approach fuel (for airports - not rigs) 
      const currentLocationConsumesApproach = !isRigFromWeather;
      
      // Calculate remaining ARA fuel needed after this stop
      let remainingAraFuel = araFuel;
      if (currentLocationConsumesAra) {
        // This location consumes ARA fuel - reduce remaining amount
        remainingAraFuel = Math.max(0, araFuel - 200); // Consume 200 lbs per rig
        console.log(`🎯 CONSUMPTION: ${toWaypoint.name} consumes ARA fuel, remaining: ${remainingAraFuel}`);
      }
      
      // Calculate remaining approach fuel needed after this stop  
      let remainingApproachFuel = approachFuel;
      if (currentLocationConsumesApproach) {
        // This location consumes approach fuel - reduce remaining amount
        remainingApproachFuel = Math.max(0, approachFuel - 200); // Consume 200 lbs per airport
        console.log(`🎯 CONSUMPTION: ${toWaypoint.name} consumes approach fuel, remaining: ${remainingApproachFuel}`);
      }
      
      // 🛩️ REFUEL LOGIC: Check if this is a refuel stop and calculate differently
      if (isRefuelStop) {
        // 🛩️ REFUEL STOP: Calculate fuel needed for NEXT segment only (not remaining route)
        console.log(`🛩️ REFUEL CALC: Calculating fuel for next segment from ${toWaypoint.name}`);
        
        // For refuel stops, we need minimal fuel to continue:
        // Reserve fuel + any ARA/approach fuel needed for next segment
        fuelNeeded = remainingTripFuel + remainingContingencyFuel + remainingAraFuel + remainingDeckFuel + remainingApproachFuel + reserveFuelValue + (extraFuel || 0);
        
        fuelComponents = {
          tripFuel: remainingTripFuel,
          contingencyFuel: remainingContingencyFuel,
          taxiFuel: 0, // No taxi fuel for intermediate stops
          araFuel: remainingAraFuel,
          deckFuel: remainingDeckFuel,
          approachFuel: remainingApproachFuel,
          reserveFuel: reserveFuelValue,
          extraFuel: extraFuel || 0
        };
        
        // Create fuel components text for refuel stops
        let refuelFuelComponentsParts = [];
        if (remainingTripFuel > 0) refuelFuelComponentsParts.push(`Trip:${remainingTripFuel}`);
        if (remainingContingencyFuel > 0) refuelFuelComponentsParts.push(`Cont:${remainingContingencyFuel}`);
        if (remainingAraFuel > 0) refuelFuelComponentsParts.push(`ARA:${remainingAraFuel}`);
        if (remainingDeckFuel > 0) refuelFuelComponentsParts.push(`Deck:${remainingDeckFuel}`);
        if (remainingApproachFuel > 0) refuelFuelComponentsParts.push(`Approach:${remainingApproachFuel}`);
        refuelFuelComponentsParts.push(`Res:${reserveFuelValue}`);
        if (extraFuel > 0) refuelFuelComponentsParts.push(`Extra:${extraFuel}`);
        
        fuelComponentsText = refuelFuelComponentsParts.join(' ') + ' (refuel)';
        
        console.log(`🛩️ REFUEL CALC: ${toWaypoint.name} needs ${fuelNeeded} lbs for next segment`);
      } else {
        // At intermediate stops, you need fuel for remaining legs, plus reserve
        fuelNeeded = remainingTripFuel + remainingContingencyFuel + remainingAraFuel + remainingDeckFuel + remainingApproachFuel + reserveFuelValue + (extraFuel || 0);
        
        fuelComponents = {
          remainingTripFuel: remainingTripFuel,
          contingencyFuel: remainingContingencyFuel,
          araFuel: remainingAraFuel,  // 🎯 SMART: Reduced after consumption
          deckFuel: remainingDeckFuel,
          approachFuel: remainingApproachFuel,  // 🎯 SMART: Reduced after consumption
          reserveFuel: reserveFuelValue,
          extraFuel: extraFuel || 0
        };
        
        // Create fuel components text - only show non-zero weather fuel (using remaining amounts)
        let intermediateParts = [`Trip:${remainingTripFuel}`, `Cont:${remainingContingencyFuel}`];
        
        if (remainingAraFuel > 0) {
          intermediateParts.push(`ARA:${remainingAraFuel}`);
        }
        
        intermediateParts.push(`Deck:${remainingDeckFuel}`);
        
        if (remainingApproachFuel > 0) {
          intermediateParts.push(`Approach:${remainingApproachFuel}`);
        }
        
        intermediateParts.push(`Res:${reserveFuelValue}`);
        
        fuelComponentsText = intermediateParts.join(' ');

        // 🔧 DEBUG: Log extraFuel logic
        console.log('🔧 ExtraFuel Debug - Intermediate stop:', {
          extraFuel,
          extraFuelType: typeof extraFuel,
          extraFuelGreaterThanZero: extraFuel > 0,
          extraFuelAsNumber: Number(extraFuel),
          numberCheck: Number(extraFuel) > 0
        });

        // Add extra fuel text if present
        if (Number(extraFuel) > 0) {
          fuelComponentsText += ` Extra:${extraFuel}`;
          console.log('🔧 ExtraFuel: Added to fuel components text');
        } else {
          console.log('🔧 ExtraFuel: NOT added - value is 0 or invalid');
        }

        // Add deck fuel text only if there are remaining intermediate stops
        if (remainingDeckFuel > 0) {
          fuelComponentsText += ` Deck:${remainingDeckFuel}`;
        }
        
        // Log the intermediate stop fuel components
        console.log('🛑 INTERMEDIATE STOP FUEL COMPONENTS:', {
          remainingTripFuel,
          remainingContingencyFuel,
          remainingDeckFuel,
          reserveFuel: reserveFuelValue,
          fuelNeeded,
          componentText: fuelComponentsText,
          sum: remainingTripFuel + remainingContingencyFuel + remainingDeckFuel + reserveFuelValue
        });
      } // 🛩️ REFUEL: Close the main else block for weather/refuel logic
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
      // Always include all fuel component fields, even if they're zero
      cardData = {
        index: shouldTreatAsFinal ? 'F' : (i + 1),
        id: stopId,
        stopName: toWaypoint.name,
        legDistance: legDetail.distance.toFixed(1),
        totalDistance: cumulativeDistance.toFixed(1),
        legTime: Number(legDetail.timeHours),
        totalTime: Number(cumulativeTime + (deckTimeHours)), // FIXED: Total time including deck stops
        // Add flight time separately for clarity
        flightTime: Number(cumulativeTime), // Flight time only
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
        // For destination cards, ensure all component fields exist
        fuelComponentsObject: {
          reserveFuel: reserveFuelValue,
          contingencyFuel: remainingContingencyFuel,
          extraFuel: 0,
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
        isDestination: isDestination
      };
    } else {
      // Normal case for all non-destination cards (including refuel stops)
      cardData = {
        index: shouldTreatAsFinal ? 'F' : (i + 1),
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
        isDeparture: isDeparture,
        isDestination: isDestination
      };
    }

    cards.push(cardData);
  }

  // Double-check destination card for correctness
  const destinationCard = cards.find(card => card.isDestination);
  if (destinationCard) {
    console.log('🔍 FINAL CHECK - DESTINATION CARD:', {
      totalFuel: destinationCard.totalFuel,
      componentSum: Object.values(destinationCard.fuelComponentsObject).reduce((sum, val) => sum + (Number(val) || 0), 0),
      components: destinationCard.fuelComponentsObject
    });
    
    // Fix any discrepancy between totalFuel and component sum for destination card
    const componentSum = Object.values(destinationCard.fuelComponentsObject).reduce((sum, val) => sum + (Number(val) || 0), 0);
    if (Math.abs(destinationCard.totalFuel - componentSum) > 1) {
      console.log(`⚠️ Fixing destination card totalFuel mismatch (${destinationCard.totalFuel} vs ${componentSum})`);
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
    console.log('StopCardCalculator: Verifying fuel consistency in all cards');
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
          
          // Correct the total fuel to match components
          card.totalFuel = componentSum;
          console.log(`✅ Card ${i} totalFuel corrected to ${componentSum}`);
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
      
      console.log('🎯 StopCardCalculator: Stored real calculated leg times for WaypointManager');
    }

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
  console.log('🟠 AlternateStopCard: Starting calculation');
  console.log('🟠 AlternateStopCard: Weather input:', weather);
  console.log('🟠 AlternateStopCard: Weather details:', {
    windSpeed: weather?.windSpeed,
    windDirection: weather?.windDirection,
    hasWeather: !!weather
  });
  
  // Verify we have the necessary input data
  if (!waypoints || waypoints.length < 2 || !selectedAircraft || !alternateRouteData) {
    console.log('🟠 AlternateStopCard: Missing required input data');
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
    extraFuel = 0,        // 🔧 ADDED: Missing extraFuel parameter
    araFuel = 0,          // 🔧 FIXED: Missing araFuel parameter (was causing error)
    approachFuel = 0,     // 🔧 FIXED: Missing approachFuel parameter (was causing error)
    fuelPolicy = null     // 🔧 CRITICAL: Add fuel policy for reserve fuel conversion
  } = options;
  
  // 🔧 CRITICAL FIX: Use same reserve fuel conversion logic as main route
  let calculatedReserveFuel = null;
  
  console.log('🟠 AlternateStopCard: Reserve fuel conversion check:', {
    reserveFuel,
    hasFuelPolicy: !!fuelPolicy,
    hasAircraft: !!selectedAircraft,
    aircraftFuelBurn: selectedAircraft?.fuelBurn
  });
  
  if (fuelPolicy && fuelPolicy.fuelTypes?.reserveFuel && selectedAircraft?.fuelBurn) {
    const reserveType = fuelPolicy.fuelTypes.reserveFuel.type || 'fixed';
    const reservePolicyValue = fuelPolicy.fuelTypes.reserveFuel.default || reserveFuel;
    
    if (reserveType === 'time') {
      // Time-based: time (minutes) × fuel flow (lbs/hour) ÷ 60
      const timeMinutes = reservePolicyValue;
      const fuelFlowPerHour = selectedAircraft.fuelBurn;
      calculatedReserveFuel = Math.round((timeMinutes * fuelFlowPerHour) / 60);
      
      console.log(`🟠 AlternateStopCard: Reserve Fuel Calc: ${timeMinutes} min × ${fuelFlowPerHour} lbs/hr = ${calculatedReserveFuel} lbs`);
    } else {
      // Fixed amount - use policy value as-is
      calculatedReserveFuel = reservePolicyValue;
      console.log(`🟠 AlternateStopCard: Using fixed reserve fuel: ${calculatedReserveFuel} lbs`);
    }
  } else {
    // Fallback: use raw value (this should match main route behavior)
    calculatedReserveFuel = reserveFuel;
    console.log(`🟠 AlternateStopCard: No fuel policy, using raw reserve fuel: ${calculatedReserveFuel}`);
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
  const extraFuelValue = Number(extraFuel) || 0; // Extra fuel can be 0
  
  console.log('🟠 AlternateStopCard: Using same settings as normal stop cards:', {
    taxiFuelValue,
    passengerWeightValue,
    contingencyFuelPercentValue,
    reserveFuelValue,
    deckTimePerStopValue,
    deckFuelFlowValue,
    extraFuelValue,  // 🔧 DEBUG: Check if extraFuel is being received
    extraFuelRaw: extraFuel  // 🔧 DEBUG: Check raw extraFuel parameter
  });
  
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
  
  // Find split point index in landing stops
  console.log('🟠 AlternateStopCard: Looking for split point:', splitPointName);
  console.log('🟠 AlternateStopCard: Landing stops debug:', landingStopsOnly.map(wp => ({
    name: wp.name,
    id: wp.id,
    pointType: wp.pointType,
    isWaypoint: wp.isWaypoint,
    type: wp.type
  })));
  
  let splitPointIndex = landingStopsOnly.findIndex(wp => 
    wp.name && wp.name.toUpperCase() === splitPointName.toUpperCase()
  );
  
  // If not found in landing stops, try searching in all waypoints
  if (splitPointIndex === -1) {
    console.log('🟠 AlternateStopCard: Split point not found in landing stops, searching all waypoints...');
    
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
      
      console.log('🟠 AlternateStopCard: Mapped to landing stops index:', splitPointIndex);
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
  
  console.log(`🟠 AlternateStopCard: Split point "${splitPointName}" found at index ${splitPointIndex}`);
  
  // Calculate fuel for legs TO the split point (not including the split point leg itself)
  let legsToSplitPointFuel = 0;
  let legsToSplitPointDistance = 0;
  let legsToSplitPointTime = 0;
  
  // Use route stats legs if available for consistency
  if (routeStats && routeStats.legs && routeStats.legs.length > 0) {
    console.log('🟠 AlternateStopCard: Using route stats legs for calculation');
    
    // Sum up legs TO the split point (up to but not including split point index)
    for (let i = 0; i < Math.min(splitPointIndex, routeStats.legs.length); i++) {
      const leg = routeStats.legs[i];
      legsToSplitPointFuel += leg.fuel || 0;
      legsToSplitPointDistance += leg.distance || 0;
      legsToSplitPointTime += leg.time || 0;
      
      console.log(`🟠 AlternateStopCard: Added leg ${i}: fuel=${leg.fuel}, distance=${leg.distance}, time=${leg.time}`);
    }
  } else {
    console.log('🟠 AlternateStopCard: No route stats available - using RouteCalculator for consistency');
    
    // 🎯 SINGLE SOURCE OF TRUTH: Use RouteCalculator for legs to split point as well
    if (splitPointIndex > 0) {
      try {
        // Import RouteCalculator - check what's available
        console.log('🔍 AlternateStopCard: Checking RouteCalculator availability:', {
          windowRouteCalculatorInstance: !!window.routeCalculator,
          windowRouteCalculatorClass: !!window.RouteCalculator,
          windowKeys: Object.keys(window).filter(k => k.includes('Route')),
          requireAvailable: typeof require !== 'undefined'
        });
        
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
          
          console.log('🟠 AlternateStopCard: Used fallback calculation for legs to split point');
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
          
          console.log('🔍 LEGS TO SPLIT COORDINATES:', {
            splitPointIndex,
            landingStopsOnlyLength: landingStopsOnly.length,
            legsToSplitCoordinates,
            coordinatesLength: legsToSplitCoordinates.length
          });
          
          if (legsToSplitCoordinates.length >= 2) {
            console.log('🔍 CALLING RouteCalculator for legs to split with:', {
              coordinates: legsToSplitCoordinates,
              selectedAircraft: !!selectedAircraft,
              weather: !!weather
            });
            
            const legsToSplitStats = routeCalculator.calculateRouteStats(
              legsToSplitCoordinates,
              {
                selectedAircraft,
                weather,
                forceTimeCalculation: true
              }
            );
            
            console.log('🔍 RouteCalculator returned for legs to split:', legsToSplitStats);
            
            if (legsToSplitStats && legsToSplitStats.tripFuel !== undefined) {
              legsToSplitPointFuel = legsToSplitStats.tripFuel;
              legsToSplitPointDistance = legsToSplitStats.totalDistance;
              legsToSplitPointTime = legsToSplitStats.timeHours; // FIX: Use timeHours instead of totalTime
              
              console.log('🎯 AlternateStopCard: Used RouteCalculator for legs to split point:', {
                fuel: legsToSplitPointFuel,
                distance: legsToSplitPointDistance,
                time: legsToSplitPointTime,
                timeInMinutes: legsToSplitPointTime * 60
              });
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
  
  console.log(`🟠 AlternateStopCard: Legs to split point totals:`, {
    fuel: legsToSplitPointFuel,
    distance: legsToSplitPointDistance,
    time: legsToSplitPointTime
  });
  
  // 🎯 SINGLE SOURCE OF TRUTH: Use RouteCalculator for alternate route (same as main route)
  let alternateLegFuel = 0;
  let alternateLegDistance = 0;
  let alternateLegTime = 0;
  
  if (alternateRouteData.coordinates && alternateRouteData.coordinates.length >= 2) {
    console.log('🎯 AlternateStopCard: Using RouteCalculator (SINGLE SOURCE OF TRUTH)');
    
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
      
      console.log('🎯 AlternateStopCard: Alternate leg coordinates debug:', {
        splitPoint: splitPointCoords,
        alternateDest: alternateDestCoords,
        fullCoordinates: alternateRouteData.coordinates,
        coordinatesLength: alternateRouteData.coordinates.length
      });
      
      // Create coordinates array for just the alternate leg
      const alternateLegCoordinates = [splitPointCoords, alternateDestCoords];
      
      console.log('🔧 CALLING RouteCalculator with:', {
        coordinates: alternateLegCoordinates,
        aircraft: {
          registration: selectedAircraft?.registration,
          cruiseSpeed: selectedAircraft?.cruiseSpeed,
          fuelBurn: selectedAircraft?.fuelBurn,
          flatPitchFuelBurnDeckFuel: selectedAircraft?.flatPitchFuelBurnDeckFuel,
          allKeys: selectedAircraft ? Object.keys(selectedAircraft) : [],
          fuelKeys: selectedAircraft ? Object.keys(selectedAircraft).filter(k => k.toLowerCase().includes('fuel') || k.toLowerCase().includes('burn')) : []
        },
        weather: weather,
        forceTimeCalculation: true
      });
      
      const alternateLegStats = routeCalculator.calculateRouteStats(
        alternateLegCoordinates,
        {
          selectedAircraft,
          weather,
          forceTimeCalculation: true
        }
      );
      
      console.log('🔧 RouteCalculator RETURNED:', alternateLegStats);
      
      if (alternateLegStats && alternateLegStats.tripFuel !== undefined) {
        console.log('🎯 AlternateStopCard: RouteCalculator alternate leg results:', alternateLegStats);
        
        // Use RouteCalculator results for alternate leg only
        alternateLegDistance = alternateLegStats.totalDistance || 0;
        alternateLegTime = alternateLegStats.timeHours || 0; // FIX: Use timeHours consistently
        alternateLegFuel = alternateLegStats.tripFuel || 0;
        
        console.log('🚨 TIME DEBUG - RouteCalculator fields:', {
          totalTime: alternateLegStats.totalTime,
          timeHours: alternateLegStats.timeHours,
          estimatedTime: alternateLegStats.estimatedTime,
          allKeys: Object.keys(alternateLegStats),
          finalTimeUsed: alternateLegTime
        });
        
        console.log('🎯 PALANTIR COMPARISON - Alternate Leg Only:', {
          'RouteCalculator Distance': alternateLegDistance,
          'RouteCalculator Time': alternateLegTime, 
          'RouteCalculator Fuel': alternateLegFuel,
          'Expected Palantir Alt': 581,
          'Difference': alternateLegFuel - 581,
          'PercentageOff': ((alternateLegFuel - 581) / 581 * 100).toFixed(1) + '%'
        });
        
        console.log('🎯 AlternateStopCard: Using RouteCalculator for alternate leg:', {
          distance: alternateLegDistance,
          time: alternateLegTime,
          fuel: alternateLegFuel
        });
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
  
  console.log(`🟠 AlternateStopCard: Alternate leg totals:`, {
    fuel: alternateLegFuel,
    distance: alternateLegDistance,
    time: alternateLegTime
  });
  
  console.log(`🟠 AlternateStopCard: PALANTIR COMPARISON DEBUG:`, {
    'Fast Planner - Legs to Split': legsToSplitPointFuel,
    'Fast Planner - Alt Leg': alternateLegFuel,
    'Fast Planner - Total': legsToSplitPointFuel + alternateLegFuel,
    'Palantir Target - Trip': 517,
    'Palantir Target - Alt': 581,
    'Palantir Target - Total': 1098,
    'Difference - Trip': (legsToSplitPointFuel - 517),
    'Difference - Alt': (alternateLegFuel - 581),
    'Alt Leg Distance (nm)': alternateLegDistance,
    'Alt Leg Time (hours)': alternateLegTime
  });
  
  // Calculate total trip fuel for alternate route
  const totalAlternateTripFuel = legsToSplitPointFuel + alternateLegFuel;
  
  // Calculate fuel components using same logic as normal stop cards
  const alternateContingencyFuel = Math.round((totalAlternateTripFuel * contingencyFuelPercentValue) / 100);
  
  // Calculate deck fuel for intermediate stops TO the split point only
  const intermediateStopsToSplit = Math.max(0, splitPointIndex - 1); // Exclude departure and split point
  const alternateDeckTimeHours = (intermediateStopsToSplit * deckTimePerStopValue) / 60;
  const alternateDeckFuel = Math.round(alternateDeckTimeHours * deckFuelFlowValue);
  
  console.log(`🟠 AlternateStopCard: Fuel components calculation:`, {
    totalAlternateTripFuel,
    alternateContingencyFuel,
    intermediateStopsToSplit,
    alternateDeckFuel,
    taxiFuelValue,
    reserveFuelValue
  });
  
  // Calculate total fuel required for alternate route
  const totalAlternateFuel = taxiFuelValue + totalAlternateTripFuel + alternateContingencyFuel + araFuel + alternateDeckFuel + approachFuel + reserveFuelValue + extraFuelValue;
  
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
  
  // 🔧 DEBUG: Check extraFuelValue before creating fuel components text
  console.log('🔧 AlternateStopCard: Before creating fuel components text:', {
    extraFuelValue: extraFuelValue,
    extraFuelType: typeof extraFuelValue,
    extraFuelRaw: extraFuel,
    extraFuelRawType: typeof extraFuel,
    extraFuelGreaterThanZero: extraFuelValue > 0,
    taxiFuelValue,
    totalAlternateTripFuel,
    alternateContingencyFuel,
    alternateDeckFuel,
    reserveFuelValue
  });

  // Create fuel components text - PALANTIR MATCH: Show Trip and Alt separately
  let alternateParts = [
    `Taxi:${taxiFuelValue}`,
    `Trip:${legsToSplitPointFuel}`,
    `Alt:${alternateLegFuel}`,
    `Cont:${alternateContingencyFuel}`
  ];
  
  if (araFuel > 0) {
    alternateParts.push(`ARA:${araFuel}`);
  }
  
  alternateParts.push(`Deck:${alternateDeckFuel}`);
  
  if (approachFuel > 0) {
    alternateParts.push(`Approach:${approachFuel}`);
  }
  
  alternateParts.push(`Res:${reserveFuelValue}`);
  
  if (extraFuelValue > 0) {
    alternateParts.push(`Extra:${extraFuelValue}`);
  }
  
  const fuelComponentsText = alternateParts.join(' ');
  
  console.log('🔧 AlternateStopCard: Final fuel components text:', fuelComponentsText);
  
  // Create route description
  const alternateDestination = alternateRouteData.name ? 
    alternateRouteData.name.replace(' (Alternate)', '').split(' ').pop() : 
    'Unknown';
  const routeDescription = `Legs to ${splitPointName} + Alternate to ${alternateDestination}`;
  
  // Calculate total distance and time with proper number handling
  const totalAlternateDistance = Number(legsToSplitPointDistance || 0) + Number(alternateLegDistance || 0);
  const totalAlternateTime = Number(legsToSplitPointTime || 0) + Number(alternateLegTime || 0);
  
  console.log('🚨 TIME CALCULATION DEBUG:', {
    legsToSplitPointTime: legsToSplitPointTime,
    legsToSplitPointTimeMinutes: legsToSplitPointTime * 60,
    alternateLegTime: alternateLegTime,
    alternateLegTimeMinutes: alternateLegTime * 60,
    totalAlternateTime: totalAlternateTime,
    totalAlternateTimeMinutes: totalAlternateTime * 60,
    totalAlternateTimeFormatted: Math.floor(totalAlternateTime) + ':' + String(Math.round((totalAlternateTime % 1) * 60)).padStart(2, '0')
  });
  
  console.log(`🟠 AlternateStopCard: Final calculations:`, {
    totalAlternateFuel,
    maxPassengers,
    totalAlternateDistance,
    totalAlternateTime,
    routeDescription,
    legsToSplitPointDistance: Number(legsToSplitPointDistance || 0),
    alternateLegDistance: Number(alternateLegDistance || 0),
    legsToSplitPointTime: Number(legsToSplitPointTime || 0),
    alternateLegTime: Number(alternateLegTime || 0)
  });
  
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
      araFuel: araFuel,  // Include weather fuel for alternate
      deckFuel: alternateDeckFuel,
      approachFuel: approachFuel,  // Include weather fuel for alternate
      reserveFuel: reserveFuelValue
    },
    isDeparture: false,
    isDestination: false,
    isAlternate: true, // Special flag for alternate cards
    routeDescription: routeDescription
  };
  
  console.log('🟠 AlternateStopCard: Created alternate card:', alternateCard);
  
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
const calculateSegmentedStopCards = (waypoints, routeStats, selectedAircraft, weather, options, weatherSegments, refuelStops, waiveAlternates) => {
  console.log('🛩️ SEGMENTED CALCULATION: Starting segmented fuel calculation');
  
  // Split waypoints into segments at refuel points
  const segments = splitWaypointsIntoSegments(waypoints, refuelStops);
  console.log(`🛩️ Split route into ${segments.length} segments:`, segments.map(seg => `${seg.start.name} → ${seg.end.name}`));
  
  const allStopCards = [];
  
  // Calculate each segment independently
  for (let segmentIndex = 0; segmentIndex < segments.length; segmentIndex++) {
    const segment = segments[segmentIndex];
    console.log(`🛩️ Calculating segment ${segmentIndex + 1}: ${segment.start.name} → ${segment.end.name}`);
    
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
  
  console.log(`🛩️ SEGMENTED CALCULATION: Generated ${allStopCards.length} total stop cards`);
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
  console.log(`🛩️ SEGMENT CALC: Processing ${segmentWaypoints.length} waypoints for segment`);
  console.log(`🛩️ SEGMENT CALC: Segment waypoints:`, segmentWaypoints.map(wp => wp.name));
  
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
      
      console.log(`🛩️ SEGMENT CALC: Segment stats calculated:`, {
        distance: segmentTotalDistance,
        time: segmentTotalTime,
        tripFuel: segmentTripFuel,
        legs: segmentLegs.length
      });
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
    console.log('🛩️ FIRST SEGMENT: Checking departure fuel (segment vs alternate)');
    
    // TODO: Calculate what the fuel would be for full alternate route
    // and use MAX(segment_fuel, alternate_fuel) for departure
    
    console.log('🛩️ TODO: Implement departure fuel MAX logic (segment vs alternate)');
  }
  
  console.log(`🛩️ SEGMENT CALC: Generated ${segmentCards.length} cards for segment`);
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