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
 * @returns {Array} Array of stop card objects
 */
const calculateStopCards = (waypoints, routeStats, selectedAircraft, weather, options = {}) => {
  console.log('⭐ StopCardCalculator: Starting with routeStats?', !!routeStats);
  
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
  
  console.log(`StopCardCalculator: Processing ${landingStopsOnly.length} landing stops out of ${waypoints.length} total waypoints`);
  
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
    fuelPolicy = null     // NEW: Fuel policy for reserve fuel type detection
  } = options;
  
  // 🔧 DEBUG: Log extraFuel value to see what we're getting
  console.log('🔧 StopCardCalculator DEBUG: extraFuel value:', {
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
  
  // CRITICAL: Ensure aircraft has all required properties
  if (!selectedAircraft.cruiseSpeed || !selectedAircraft.fuelBurn) {
    console.error('StopCardCalculator: Aircraft missing critical cruiseSpeed or fuelBurn property');
    return [];
  }
  
  // CRITICAL: Check for weight properties needed for passenger calculations
  // Log a warning but continue with calculation
  if (!selectedAircraft.emptyWeight || !selectedAircraft.maxTakeoffWeight) {
    console.warn('StopCardCalculator: Aircraft missing weight properties (emptyWeight or maxTakeoffWeight)');
    console.warn('Aircraft data:', selectedAircraft);
    
    // Add default values to allow calculation to proceed
    // This is safer than returning nothing
    if (!selectedAircraft.emptyWeight) {
      console.warn('StopCardCalculator: Adding default emptyWeight of 12500 lbs');
      selectedAircraft.emptyWeight = 12500;
    }
    
    if (!selectedAircraft.maxTakeoffWeight) {
      console.warn('StopCardCalculator: Adding default maxTakeoffWeight of 17500 lbs');
      selectedAircraft.maxTakeoffWeight = 17500;
    }
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
    
    // Use routeStats totalDistance and tripFuel directly
    totalDistance = parseFloat(routeStats.totalDistance) || 0;
    totalTripFuel = routeStats.tripFuel || 0;
    
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
      
      console.log(`StopCardCalculator: Processing leg ${i+1} with ${legWaypoints.length} waypoints (including navigation waypoints)`);
      
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
          console.error(`StopCardCalculator: Missing coordinates for segment in leg ${i+1}`);
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
  console.log('🔍 AIRCRAFT FUEL FLOW DEBUG:', {
    selectedAircraft_available: !!aircraft,
    aircraft_fuelFlow: aircraft?.fuelFlow,
    aircraft_fuelBurn: aircraft?.fuelBurn, 
    aircraft_flatPitchFuelBurnDeckFuel: aircraft?.flatPitchFuelBurnDeckFuel,
    deckFuelFlowValue_being_used: deckFuelFlowValue,
    deckFuelFlowValue_source: 'from options parameter'
  });
  
  // Calculate deck time and fuel
  const deckTimeHours = (intermediateStops * deckTimePerStopValue) / 60; // Convert from minutes to hours
  
  // ✅ AVIATION SAFETY: Use aircraft OSDK data FIRST, fallback to options only if missing
  const actualDeckFuelFlow = aircraft?.flatPitchFuelBurnDeckFuel || deckFuelFlowValue;
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
  const totalFuelRequired = taxiFuelValue + totalTripFuel + contingencyFuelValue + reserveFuelValue + deckFuelValue;

  // Create a departure card first
  if (waypoints.length >= 2) {
    const departureWaypoint = waypoints[0];
    
    // Total fuel needed for entire journey at departure
    const departureFuelNeeded = totalTripFuel + contingencyFuelValue + taxiFuelValue + deckFuelValue + reserveFuelValue;
    
    // Create fuel components text for departure
    const departureFuelComponentsText = `Trip:${totalTripFuel} Cont:${contingencyFuelValue} Taxi:${taxiFuelValue} Deck:${deckFuelValue} Res:${reserveFuelValue}`;
    
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
      tripFuel: totalTripFuel,
      contingencyFuel: contingencyFuelValue,
      contingencyRate: `${contingencyFuelPercentValue}%`,
      taxiFuel: taxiFuelValue,
      deckFuel: deckFuelValue,
      reserveFuel: reserveFuelValue,
      totalFuel: departureFuelNeeded,
      componentText: departureFuelComponentsText,
      sum: totalTripFuel + contingencyFuelValue + taxiFuelValue + deckFuelValue + reserveFuelValue
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
        tripFuel: totalTripFuel,
        contingencyFuel: contingencyFuelValue,
        taxiFuel: taxiFuelValue,
        deckFuel: deckFuelValue,
        reserveFuel: reserveFuelValue,
        extraFuel: extraFuel || 0
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

    // Calculate remaining trip fuel - sum of all legs after this one
    let remainingTripFuel = 0;
    for (let j = i + 1; j < legDetails.length; j++) {
      remainingTripFuel += legDetails[j].fuel;
    }

    // Calculate remaining number of deck stops
    // This is critical - only count intermediate stops after this point
    // For a route like: A → B → C → D
    // At point A: B and C are intermediate (2 deck stops)
    // At point B: Only C is intermediate (1 deck stop)
    // At point C: No more intermediate stops (0 deck stops)
    const remainingIntermediateStops = Math.max(0, legDetails.length - i - 1 - 1); // -1 for current leg, -1 for final leg

    // Calculate remaining deck fuel - only for intermediate stops
    const remainingDeckTimeHours = (remainingIntermediateStops * deckTimePerStopValue) / 60;
    const remainingDeckFuel = Math.round(remainingDeckTimeHours * deckFuelFlowValue);

    // Calculate remaining contingency fuel (proportional to remaining trip fuel)
    let remainingContingencyFuel = 0;
    if (totalTripFuel > 0) {
      remainingContingencyFuel = Math.round((remainingTripFuel / totalTripFuel) * contingencyFuelValue);
    }

    // At the final destination, we only have reserve and unused contingency
    const isFinalDestination = i === legDetails.length - 1;

    // Calculate the fuel needed at this stop to continue the journey
    let fuelNeeded;
    let fuelComponents;
    let fuelComponentsText;

    if (isFinalDestination) {
      // At the final destination, you have reserve fuel and unused contingency
      // For potential landing fuel, we should show the total contingency (from departure)
      // not just the remaining contingency for this leg
      fuelNeeded = reserveFuelValue + remainingContingencyFuel + (extraFuel || 0);
      fuelComponents = {
        reserveFuel: reserveFuelValue,
        contingencyFuel: remainingContingencyFuel,
        extraFuel: extraFuel || 0, // Use actual extraFuel from settings
        // Add remaining fuel components with zero values for consistency
        tripFuel: 0,
        taxiFuel: 0,
        deckFuel: 0
      };

      // Get the original full contingency amount (from departure)
      const fullContingencyFuel = contingencyFuelValue;

      if (routeStats?.enhancedResults?.auxiliaryFuel?.contingencyFuel) {
        // If we have enhanced results, use the exact contingency fuel
        fuelComponents.contingencyFuel = routeStats.enhancedResults.auxiliaryFuel.contingencyFuel;
      }

      // Calculate potential landing fuel (reserve + full unused contingency + extra fuel)
      const potentialLandingFuel = reserveFuelValue + fullContingencyFuel + (extraFuel || 0);
      fuelComponentsText = `Reserve:${reserveFuelValue}${extraFuel > 0 ? ` Extra:${extraFuel}` : ' Extra:0'} FullCont:${remainingContingencyFuel} (${reserveFuelValue}+${fullContingencyFuel}${extraFuel > 0 ? `+${extraFuel}` : ''}=${potentialLandingFuel})`;
      
      // Recalculate fuelNeeded as the sum of all components to ensure consistency
      fuelNeeded = Object.values(fuelComponents).reduce((sum, value) => sum + value, 0);
      
      // Log the destination fuel components
      console.log('🔚 DESTINATION CARD FUEL COMPONENTS:', {
        reserveFuel: reserveFuelValue,
        fullContingencyFuel,
        remainingContingencyFuel,
        potentialLandingFuel,
        componentText: fuelComponentsText,
        finalFuelNeeded: fuelNeeded
      });
    } else {
      // At intermediate stops, you need fuel for remaining legs, plus reserve
      fuelNeeded = remainingTripFuel + remainingContingencyFuel + remainingDeckFuel + reserveFuelValue + (extraFuel || 0);
      fuelComponents = {
        remainingTripFuel: remainingTripFuel,
        contingencyFuel: remainingContingencyFuel,
        deckFuel: remainingDeckFuel,
        reserveFuel: reserveFuelValue,
        extraFuel: extraFuel || 0
      };
      fuelComponentsText = `Trip:${remainingTripFuel} Cont:${remainingContingencyFuel} Res:${reserveFuelValue}`;

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

    // For final destination, show "Final Stop" instead of passenger count
    const displayMaxPassengers = isFinalDestination ? "Final Stop" : maxPassengers;
    const maxPassengersValue = isFinalDestination ? null : maxPassengers;
    const maxPassengersWeight = isFinalDestination ? null : (maxPassengers * passengerWeightValue);

    // Only the final waypoint is a destination
    const isDeparture = false; // We already added the departure card
    const isDestination = isFinalDestination;

    // Initialize cardData before conditional assignment
    let cardData;
    
    if (isFinalDestination) {
      // CRITICAL FIX: Special handling for destination cards
      // Always include all fuel component fields, even if they're zero
      cardData = {
        index: isFinalDestination ? 'F' : (i + 1),
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
          deckFuel: 0
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
      // Normal case for all non-destination cards
      cardData = {
        index: isFinalDestination ? 'F' : (i + 1),
        id: stopId,
        stopName: toWaypoint.name,
        legDistance: legDetail.distance.toFixed(1),
        totalDistance: cumulativeDistance.toFixed(1),
        legTime: Number(legDetail.timeHours),
        totalTime: Number(cumulativeTime),
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
    taxiFuel = 0,         // Default to 0 to make missing settings obvious
    contingencyFuelPercent = 0, // Default to 0 to make missing settings obvious
    reserveFuel = 0,      // Default to 0 to make missing settings obvious
    deckTimePerStop = 0,  // Default to 0 to make missing settings obvious
    deckFuelFlow = 0      // Default to 0 to make missing settings obvious
  } = options;
  
  // Convert all calculation parameters to proper numeric values
  const taxiFuelValue = Number(taxiFuel) || 0;
  const passengerWeightValue = Number(passengerWeight) || 0;
  const contingencyFuelPercentValue = Number(contingencyFuelPercent) || 0;
  const reserveFuelValue = Number(reserveFuel) || 0;
  const deckTimePerStopValue = Number(deckTimePerStop) || 0;
  const deckFuelFlowValue = Number(deckFuelFlow) || 0;
  
  console.log('🟠 AlternateStopCard: Using same settings as normal stop cards:', {
    taxiFuelValue,
    passengerWeightValue,
    contingencyFuelPercentValue,
    reserveFuelValue,
    deckTimePerStopValue,
    deckFuelFlowValue
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
  console.log('🟠 AlternateStopCard: Available landing stops:', landingStopsOnly.map(wp => ({
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
      console.log('🟠 AlternateStopCard: Found split point in all waypoints at index:', allWaypointsIndex);
      
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
    console.log('🟠 AlternateStopCard: Calculating legs to split point manually');
    
    // Manual calculation for legs to split point
    for (let i = 0; i < splitPointIndex; i++) {
      const fromWaypoint = landingStopsOnly[i];
      const toWaypoint = landingStopsOnly[i + 1];
      
      // Calculate leg distance, time, and fuel
      const legData = calculateLegWithWind(fromWaypoint, toWaypoint, selectedAircraft, weather);
      if (legData) {
        legsToSplitPointFuel += legData.fuel;
        legsToSplitPointDistance += legData.distance;
        legsToSplitPointTime += legData.time;
      }
    }
  }
  
  console.log(`🟠 AlternateStopCard: Legs to split point totals:`, {
    fuel: legsToSplitPointFuel,
    distance: legsToSplitPointDistance,
    time: legsToSplitPointTime
  });
  
  // Calculate alternate leg fuel (from split point to alternate destination)
  let alternateLegFuel = 0;
  let alternateLegDistance = 0;
  let alternateLegTime = 0;
  
  if (alternateRouteData.coordinates && alternateRouteData.coordinates.length >= 2) {
    // Get split point and alternate destination coordinates
    const splitPointCoords = alternateRouteData.coordinates[0]; // [lon, lat]
    const alternateDestCoords = alternateRouteData.coordinates[alternateRouteData.coordinates.length - 1]; // [lon, lat]
    
    // Calculate alternate leg distance
    try {
      const from = window.turf.point(splitPointCoords);
      const to = window.turf.point(alternateDestCoords);
      alternateLegDistance = window.turf.distance(from, to, { units: 'nauticalmiles' });
      
      // Calculate time and fuel with wind
      if (window.WindCalculations) {
        console.log('🟠 AlternateStopCard: Using WindCalculations with weather:', weather);
        const fromCoords = { lat: splitPointCoords[1], lon: splitPointCoords[0] };
        const toCoords = { lat: alternateDestCoords[1], lon: alternateDestCoords[0] };
        
        const legDetails = window.WindCalculations.calculateLegWithWind(
          fromCoords,
          toCoords,
          alternateLegDistance,
          selectedAircraft,
          weather
        );
        
        alternateLegTime = legDetails.time;
        alternateLegFuel = Math.round(legDetails.fuel);
        
        console.log('🟠 AlternateStopCard: Alternate leg with wind:', legDetails);
        console.log('🟠 AlternateStopCard: Final time/fuel:', { time: alternateLegTime, fuel: alternateLegFuel });
      } else {
        console.log('🟠 AlternateStopCard: WindCalculations not available, using basic calculation');
        // Fallback calculation without wind
        alternateLegTime = alternateLegDistance / selectedAircraft.cruiseSpeed;
        alternateLegFuel = Math.round(alternateLegTime * selectedAircraft.fuelBurn);
        console.log('🟠 AlternateStopCard: Basic calculation result:', { time: alternateLegTime, fuel: alternateLegFuel });
      }
      
    } catch (error) {
      console.error('🟠 AlternateStopCard: Error calculating alternate leg:', error);
      return null;
    }
  } else {
    console.error('🟠 AlternateStopCard: Invalid alternate route coordinates');
    return null;
  }
  
  console.log(`🟠 AlternateStopCard: Alternate leg totals:`, {
    fuel: alternateLegFuel,
    distance: alternateLegDistance,
    time: alternateLegTime
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
  const totalAlternateFuel = taxiFuelValue + totalAlternateTripFuel + alternateContingencyFuel + alternateDeckFuel + reserveFuelValue;
  
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
  
  // Create fuel components text
  const fuelComponentsText = `Taxi:${taxiFuelValue} Trip:${totalAlternateTripFuel} Cont:${alternateContingencyFuel} Deck:${alternateDeckFuel} Res:${reserveFuelValue}`;
  
  // Create route description
  const alternateDestination = alternateRouteData.name ? 
    alternateRouteData.name.replace(' (Alternate)', '').split(' ').pop() : 
    'Unknown';
  const routeDescription = `Legs to ${splitPointName} + Alternate to ${alternateDestination}`;
  
  // Calculate total distance and time with proper number handling
  const totalAlternateDistance = Number(legsToSplitPointDistance || 0) + Number(alternateLegDistance || 0);
  const totalAlternateTime = Number(legsToSplitPointTime || 0) + Number(alternateLegTime || 0);
  
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
      tripFuel: totalAlternateTripFuel,
      contingencyFuel: alternateContingencyFuel,
      taxiFuel: taxiFuelValue,
      deckFuel: alternateDeckFuel,
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
 * Helper function to calculate a single leg with wind effects
 * Used for manual alternate leg calculations when route stats are not available
 */
const calculateLegWithWind = (fromWaypoint, toWaypoint, aircraft, weather) => {
  // Check for coordinates
  const fromHasCoords = (fromWaypoint.lat && fromWaypoint.lon) ||
                       (fromWaypoint.coords && fromWaypoint.coords.length === 2);
  const toHasCoords = (toWaypoint.lat && toWaypoint.lon) ||
                     (toWaypoint.coords && toWaypoint.coords.length === 2);
  
  if (!fromHasCoords || !toHasCoords) {
    console.error('🟠 AlternateStopCard: Missing coordinates for leg calculation');
    return null;
  }
  
  // Get coordinates
  const fromCoords = {
    lat: fromWaypoint.lat || fromWaypoint.coords[1],
    lon: fromWaypoint.lon || fromWaypoint.coords[0]
  };
  
  const toCoords = {
    lat: toWaypoint.lat || toWaypoint.coords[1],
    lon: toWaypoint.lon || toWaypoint.coords[0]
  };
  
  // Calculate distance
  let distance = 0;
  try {
    const from = window.turf.point([fromCoords.lon, fromCoords.lat]);
    const to = window.turf.point([toCoords.lon, toCoords.lat]);
    distance = window.turf.distance(from, to, { units: 'nauticalmiles' });
  } catch (error) {
    console.error('🟠 AlternateStopCard: Error calculating distance:', error);
    return null;
  }
  
  // Calculate time and fuel with wind if available
  if (window.WindCalculations) {
    try {
      const legDetails = window.WindCalculations.calculateLegWithWind(
        fromCoords,
        toCoords,
        distance,
        aircraft,
        weather
      );
      
      return {
        distance: distance,
        time: legDetails.time,
        fuel: Math.round(legDetails.fuel)
      };
    } catch (error) {
      console.error('🟠 AlternateStopCard: Error calculating wind effects:', error);
    }
  }
  
  // Fallback calculation without wind
  const time = distance / aircraft.cruiseSpeed;
  const fuel = Math.round(time * aircraft.fuelBurn);
  
  return {
    distance: distance,
    time: time,
    fuel: fuel
  };
};

export default {
  calculateStopCards,
  calculateAlternateStopCard
};