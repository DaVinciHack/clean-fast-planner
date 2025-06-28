/**
 * SARCalculations.js
 * 
 * Search and Rescue calculation engine using real OSDK aircraft performance data.
 * Calculates operational radius, endurance, and fuel requirements for SAR operations.
 * 
 * @aviation-safety: Uses only real OSDK aircraft data, no dummy performance values
 * @data-integrity: All calculations validated against aircraft limitations
 */

/**
 * Calculate SAR operational radius and endurance
 * @param {Object} params - Calculation parameters
 * @param {number} params.takeoffFuel - Total fuel on board at takeoff (lbs)
 * @param {number} params.sarWeight - SAR equipment and rescue load weight (lbs)
 * @param {number} params.timeOnTask - Required time on search task (hours)
 * @param {Object} params.selectedAircraft - REAL OSDK aircraft data
 * @param {number} params.routeFuel - Fuel required for main route (lbs)
 * @param {number} params.alternateFuel - Fuel required for alternate route (lbs)
 * @param {number} params.reserveFuel - Required reserve fuel (lbs)
 * @param {Object} params.fuelPolicy - Fuel policy data for reserve calculations
 * @returns {Object} SAR calculation results or error
 */
export const calculateOperationalRadius = (params) => {
  const {
    takeoffFuel = 0,
    sarWeight = 0,
    timeOnTask = 1.0,
    selectedAircraft,
    routeFuel = 0,
    alternateFuel = 0,
    reserveFuel = 0,
    fuelPolicy = null
  } = params;
  
  // ========================================
  // CRITICAL AIRCRAFT DATA VALIDATION
  // ========================================
  
  if (!selectedAircraft) {
    return {
      error: 'No aircraft selected',
      category: 'aircraft',
      severity: 'critical'
    };
  }
  
  // Validate essential performance properties
  if (!selectedAircraft.cruiseSpeed || selectedAircraft.cruiseSpeed <= 0) {
    return {
      error: `Aircraft ${selectedAircraft.registration || 'unknown'} missing cruise speed data`,
      category: 'performance',
      severity: 'critical'
    };
  }
  
  if (!selectedAircraft.fuelBurn || selectedAircraft.fuelBurn <= 0) {
    return {
      error: `Aircraft ${selectedAircraft.registration || 'unknown'} missing fuel burn rate data`,
      category: 'performance',
      severity: 'critical'
    };
  }
  
  // Validate useful load (simpler approach)
  const usefulLoad = selectedAircraft.usefulLoad || 0;
  
  if (!usefulLoad || usefulLoad <= 0) {
    return {
      error: `Aircraft ${selectedAircraft.registration || 'unknown'} missing useful load data`,
      category: 'weight',
      severity: 'critical'
    };
  }
  
  // ========================================
  // WEIGHT AND BALANCE VALIDATION (CORRECTED)
  // ========================================
  
  // Useful Load = Fuel + Payload + Crew
  // Available payload = Useful Load - Fuel Weight
  const availablePayload = usefulLoad - takeoffFuel;
  
  if (sarWeight > availablePayload) {
    const excessWeight = sarWeight - availablePayload;
    return {
      error: `Useful load exceeded by ${excessWeight.toFixed(0)} lbs`,
      details: {
        sarWeight: sarWeight.toFixed(0),
        fuelWeight: takeoffFuel.toFixed(0),
        availablePayload: availablePayload.toFixed(0),
        usefulLoad: usefulLoad.toFixed(0),
        excessWeight: excessWeight.toFixed(0)
      },
      category: 'weight',
      severity: 'critical'
    };
  }
  
  // ========================================
  // FUEL REQUIREMENTS CALCULATION
  // ========================================
  
  // Use full fuel burn for SAR operations (intensive work - hovering, maneuvering, searching)
  const sarFuelFlow = selectedAircraft.fuelBurn; // Full fuel burn rate for SAR work
  const cruiseFuelFlow = selectedAircraft.fuelBurn;
  const cruiseSpeed = selectedAircraft.cruiseSpeed;
  
  console.log('🚁 SAR: Fuel burn rates from aircraft:', {
    fuelBurn: selectedAircraft.fuelBurn,
    sarFuelFlow: sarFuelFlow,
    cruiseFuelFlow: cruiseFuelFlow,
    timeOnTask: timeOnTask,
    aircraftRegistration: selectedAircraft.registration
  });
  
  // Calculate fuel required for SAR task (using full fuel burn)
  const taskFuelRequired = timeOnTask * sarFuelFlow;
  
  console.log('🚁 SAR: Task fuel calculation:', {
    timeOnTask: timeOnTask,
    sarFuelFlow: sarFuelFlow,
    taskFuelRequired: taskFuelRequired
  });
  
  // Total committed fuel (cannot be used for operational radius)
  // NOTE: taskFuelRequired is NOT included here - it's consumed DURING the search pattern,
  // not during the flight to/from the search area
  const committedFuel = routeFuel + alternateFuel + reserveFuel;
  
  console.log('🚁 SAR Fuel Breakdown - BEFORE radius calculation:', {
    takeoffFuel: takeoffFuel.toFixed(0),
    routeFuel: routeFuel.toFixed(0),
    alternateFuel: alternateFuel.toFixed(0),
    reserveFuel: reserveFuel.toFixed(0),
    committedFuel: committedFuel.toFixed(0),
    taskFuelRequired: taskFuelRequired.toFixed(0)
  });
  
  // Remaining fuel available for operational radius
  const remainingFuel = takeoffFuel - committedFuel;
  
  console.log('🚁 SAR: Remaining fuel after committed fuel:', remainingFuel.toFixed(0));
  
  if (remainingFuel <= 0) {
    return {
      error: `Insufficient fuel for SAR operations`,
      details: {
        takeoffFuel: takeoffFuel.toFixed(0),
        routeFuel: routeFuel.toFixed(0),
        alternateFuel: alternateFuel.toFixed(0),
        reserveFuel: reserveFuel.toFixed(0),
        taskFuel: taskFuelRequired.toFixed(0),
        totalRequired: committedFuel.toFixed(0),
        shortfall: Math.abs(remainingFuel).toFixed(0)
      },
      category: 'fuel',
      severity: 'critical'
    };
  }
  
  // ========================================
  // OPERATIONAL RADIUS CALCULATION (CORRECTED)
  // ========================================
  
  // SAR operational logic (CORRECTED):
  // 1. If no route: Round trip from current position (out and back to same point)
  // 2. If route exists: SAR from final destination, return to base OR alternate (whichever uses less fuel)
  // 3. Reserve fuel ALWAYS required for safety
  
  console.log('🚁 SAR Calculation - determining operational scenario:', {
    hasRoute: routeFuel > 0,
    hasAlternate: alternateFuel > 0,
    routeFuel,
    alternateFuel,
    reserveFuel,
    takeoffFuel
  });
  
  // Determine operational scenario and fuel calculations
  let isRoundTripScenario = false;
  let fuelRemainingAtDestination = 0;
  let returnFuelRequired = 0;
  
  if (routeFuel <= 0) {
    // SCENARIO 1: No route planned - round trip scenario (out and back to same point)
    isRoundTripScenario = true;
    fuelRemainingAtDestination = remainingFuel; // All remaining fuel available
    console.log('🚁 SAR: SCENARIO 1 - Round trip from current position');
  } else {
    // SCENARIO 2: Route exists - SAR from final destination
    // Calculate fuel remaining when we reach the destination
    const fuelAfterRoute = takeoffFuel - routeFuel - reserveFuel;
    fuelRemainingAtDestination = fuelAfterRoute;
    
    console.log('🚁 SAR: SCENARIO 2 - Route calculation:', {
      takeoffFuel,
      routeFuel,
      reserveFuel,
      fuelAfterRoute: fuelRemainingAtDestination
    });
    
    // Check if we have enough fuel to reach destination
    if (fuelRemainingAtDestination <= 0) {
      return {
        error: `Insufficient fuel to reach destination`,
        details: {
          takeoffFuel: takeoffFuel.toFixed(0),
          routeFuelRequired: routeFuel.toFixed(0),
          reserveFuel: reserveFuel.toFixed(0),
          shortfall: Math.abs(fuelRemainingAtDestination).toFixed(0)
        },
        category: 'fuel',
        severity: 'critical'
      };
    }
    
    // Determine most efficient return route
    if (alternateFuel > 0 && alternateFuel < routeFuel) {
      // Alternate is more fuel efficient than returning to base
      returnFuelRequired = alternateFuel;
      console.log('🚁 SAR: SCENARIO 2A - SAR from destination, return via ALTERNATE (more efficient):', {
        fuelAtDestination: fuelRemainingAtDestination,
        returnViaAlternate: alternateFuel,
        returnViaBase: routeFuel,
        savings: routeFuel - alternateFuel
      });
    } else {
      // Return to original base (no alternate or alternate is further)
      returnFuelRequired = routeFuel;
      console.log('🚁 SAR: SCENARIO 2B - SAR from destination, return to BASE:', {
        fuelAtDestination: fuelRemainingAtDestination,
        returnToBase: routeFuel,
        alternateOption: alternateFuel > 0 ? alternateFuel : 'none'
      });
    }
  }
  
  let radiusFuel, oneWayFlightTimeHours, operationalRadiusNM;
  
  if (isRoundTripScenario) {
    // SCENARIO 1: Round trip from current position
    // Available fuel for TOTAL trip (out + back) minus task fuel
    const totalAvailableForTrip = fuelRemainingAtDestination - taskFuelRequired;
    
    if (totalAvailableForTrip <= 0) {
      return {
        error: `Insufficient fuel for SAR operations`,
        details: {
          remainingFuel: fuelRemainingAtDestination.toFixed(0),
          taskFuelRequired: taskFuelRequired.toFixed(0),
          shortfall: Math.abs(totalAvailableForTrip).toFixed(0)
        },
        category: 'fuel',
        severity: 'critical'
      };
    }
    
    // Half the fuel for outbound, half for return
    radiusFuel = totalAvailableForTrip;
    const radiusFlightTimeHours = radiusFuel / cruiseFuelFlow;
    oneWayFlightTimeHours = radiusFlightTimeHours / 2;
    operationalRadiusNM = oneWayFlightTimeHours * cruiseSpeed;
    
    console.log('🚁 SAR SCENARIO 1 - Round Trip Calculation:', {
      fuelRemainingAtDestination,
      taskFuelRequired,
      totalAvailableForTrip,
      radiusFlightTimeHours,
      oneWayFlightTimeHours,
      operationalRadiusNM
    });
    
  } else {
    // SCENARIO 2: SAR from destination with optimized return
    // Available fuel for radius operations = fuel at destination MINUS task fuel MINUS return fuel
    const fuelForSAROperations = fuelRemainingAtDestination - taskFuelRequired - returnFuelRequired;
    
    if (fuelForSAROperations <= 0) {
      return {
        error: `Insufficient fuel for SAR operations from destination`,
        details: {
          fuelAtDestination: fuelRemainingAtDestination.toFixed(0),
          taskFuelRequired: taskFuelRequired.toFixed(0),
          returnFuelRequired: returnFuelRequired.toFixed(0),
          shortfall: Math.abs(fuelForSAROperations).toFixed(0),
          scenario: alternateFuel > 0 && alternateFuel < routeFuel ? 'return via alternate' : 'return to base'
        },
        category: 'fuel',
        severity: 'critical'
      };
    }
    
    // Time available for radius flight (round trip to/from search area)
    radiusFuel = fuelForSAROperations;
    const radiusFlightTimeHours = radiusFuel / cruiseFuelFlow;
    
    // One-way flight time (half of total available time)
    oneWayFlightTimeHours = radiusFlightTimeHours / 2;
    
    // Operational radius in nautical miles
    operationalRadiusNM = oneWayFlightTimeHours * cruiseSpeed;
    
    console.log('🚁 SAR SCENARIO 2 - From Destination Calculation:', {
      fuelRemainingAtDestination,
      taskFuelRequired,
      returnFuelRequired,
      fuelForSAROperations: radiusFuel,
      radiusFlightTimeHours,
      oneWayFlightTimeHours,
      operationalRadiusNM,
      returnStrategy: alternateFuel > 0 && alternateFuel < routeFuel ? 'ALTERNATE' : 'BASE'
    });
  }
  
  // ========================================
  // ADDITIONAL CALCULATIONS
  // ========================================
  
  // Total endurance calculations
  const totalEnduranceHours = takeoffFuel / cruiseFuelFlow;
  const operationalEnduranceHours = radiusFuel / cruiseFuelFlow; // Time for radius ops only
  
  // SAR-specific endurance = fuel available for SAR task / SAR fuel flow
  // This is the ACTUAL time you can spend on station doing SAR work
  const sarEnduranceHours = taskFuelRequired / sarFuelFlow;
  
  // Weight calculations (corrected for useful load)
  const payloadCapacity = usefulLoad - takeoffFuel;
  const remainingPayloadCapacity = payloadCapacity - sarWeight;
  
  // ========================================
  // RETURN SUCCESSFUL RESULTS
  // ========================================
  
  return {
    // Primary Results
    operationalRadiusNM: Math.round(operationalRadiusNM * 10) / 10,
    remainingFuelLbs: Math.round(radiusFuel), // Fuel available for radius ops only
    operationalEnduranceHours: Math.round(operationalEnduranceHours * 100) / 100,
    
    // SAR-Specific Results
    sarEnduranceHours: Math.round(sarEnduranceHours * 100) / 100,
    sarEnduranceMinutes: Math.round(sarEnduranceHours * 60),
    taskFuelRequired: Math.round(taskFuelRequired),
    
    // Performance Details
    cruiseSpeed: cruiseSpeed,
    cruiseFuelFlow: cruiseFuelFlow,
    sarFuelFlow: sarFuelFlow,
    oneWayFlightTime: Math.round(oneWayFlightTimeHours * 60), // minutes
    
    // Weight and Balance (using useful load concept)
    totalWeight: Math.round(sarWeight + takeoffFuel), // Total weight carried
    usefulLoad: Math.round(usefulLoad),
    availablePayload: Math.round(payloadCapacity), // Available for SAR equipment after fuel
    remainingPayloadCapacity: Math.round(remainingPayloadCapacity),
    
    // Fuel Breakdown
    fuelBreakdown: {
      takeoffFuel: Math.round(takeoffFuel),
      routeFuel: Math.round(routeFuel),
      alternateFuel: Math.round(alternateFuel),
      reserveFuel: Math.round(reserveFuel),
      taskFuel: Math.round(taskFuelRequired),
      operationalFuel: Math.round(radiusFuel), // Only fuel for radius operations
      totalCommitted: Math.round(committedFuel + taskFuelRequired) // Include task fuel in committed
    },
    
    // Aircraft Information
    aircraftInfo: {
      registration: selectedAircraft.registration || selectedAircraft.rawRegistration || 'Unknown',
      modelType: selectedAircraft.modelType || selectedAircraft.modelName || 'Unknown',
      usefulLoad: Math.round(usefulLoad),
      maxFuel: selectedAircraft.maxFuel || 'Unknown'
    },
    
    // Status
    success: true,
    validatedAt: new Date().toISOString()
  };
};

/**
 * Calculate maximum SAR equipment weight for given fuel and time requirements
 * @param {Object} params - Calculation parameters
 * @param {number} params.takeoffFuel - Total fuel on board (lbs)
 * @param {number} params.timeOnTask - Required time on task (hours)
 * @param {Object} params.selectedAircraft - OSDK aircraft data
 * @param {number} params.routeFuel - Route fuel requirement (lbs)
 * @param {number} params.alternateFuel - Alternate fuel requirement (lbs)
 * @param {number} params.reserveFuel - Reserve fuel requirement (lbs)
 * @returns {Object} Maximum equipment weight calculation
 */
export const calculateMaxSARWeight = (params) => {
  const {
    takeoffFuel = 0,
    timeOnTask = 1.0,
    selectedAircraft,
    routeFuel = 0,
    alternateFuel = 0,
    reserveFuel = 0
  } = params;
  
  if (!selectedAircraft) {
    return { error: 'No aircraft selected' };
  }
  
  const usefulLoad = selectedAircraft.usefulLoad || 0;
  
  if (!usefulLoad || usefulLoad <= 0) {
    return { error: 'Aircraft missing useful load data' };
  }
  
  // Calculate maximum SAR weight allowed
  const maxSARWeight = usefulLoad - takeoffFuel;
  
  return {
    maxSARWeight: Math.round(maxSARWeight),
    usefulLoad: Math.round(usefulLoad),
    takeoffFuel: Math.round(takeoffFuel),
    success: true
  };
};

/**
 * Calculate minimum fuel required for given SAR parameters
 * @param {Object} params - Calculation parameters  
 * @returns {Object} Minimum fuel calculation
 */
export const calculateMinimumFuel = (params) => {
  const {
    sarWeight = 0,
    timeOnTask = 1.0,
    selectedAircraft,
    routeFuel = 0,
    alternateFuel = 0,
    reserveFuel = 0,
    desiredRadiusNM = 25
  } = params;
  
  if (!selectedAircraft) {
    return { error: 'No aircraft selected' };
  }
  
  if (!selectedAircraft.cruiseSpeed || !selectedAircraft.fuelBurn) {
    return { error: 'Aircraft missing performance data' };
  }
  
  const hoverFuelFlow = selectedAircraft.flatPitchFuelBurnDeckFuel || selectedAircraft.fuelBurn;
  const cruiseFuelFlow = selectedAircraft.fuelBurn;
  const cruiseSpeed = selectedAircraft.cruiseSpeed;
  
  // Calculate fuel for desired radius (round trip)
  const radiusFlightTimeHours = (desiredRadiusNM / cruiseSpeed) * 2;
  const radiusFuel = radiusFlightTimeHours * cruiseFuelFlow;
  
  // Calculate task fuel
  const taskFuel = timeOnTask * hoverFuelFlow;
  
  // Total minimum fuel required
  const minimumFuel = routeFuel + alternateFuel + reserveFuel + taskFuel + radiusFuel;
  
  return {
    minimumFuel: Math.round(minimumFuel),
    fuelBreakdown: {
      routeFuel: Math.round(routeFuel),
      alternateFuel: Math.round(alternateFuel),  
      reserveFuel: Math.round(reserveFuel),
      taskFuel: Math.round(taskFuel),
      radiusFuel: Math.round(radiusFuel)
    },
    radiusFlightTime: Math.round(radiusFlightTimeHours * 60), // minutes
    success: true
  };
};

export default {
  calculateOperationalRadius,
  calculateMaxSARWeight,
  calculateMinimumFuel
};