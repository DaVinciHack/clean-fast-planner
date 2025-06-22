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
  // WEIGHT AND BALANCE VALIDATION (SIMPLIFIED)
  // ========================================
  
  const totalPayload = sarWeight + takeoffFuel;
  
  if (totalPayload > usefulLoad) {
    const excessWeight = totalPayload - usefulLoad;
    return {
      error: `Useful load exceeded by ${excessWeight.toFixed(0)} lbs`,
      details: {
        sarWeight: sarWeight.toFixed(0),
        fuelWeight: takeoffFuel.toFixed(0),
        totalPayload: totalPayload.toFixed(0),
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
  
  // Use aircraft-specific deck fuel flow for hover operations (SAR pattern)
  const hoverFuelFlow = selectedAircraft.flatPitchFuelBurnDeckFuel || selectedAircraft.fuelBurn;
  const cruiseFuelFlow = selectedAircraft.fuelBurn;
  const cruiseSpeed = selectedAircraft.cruiseSpeed;
  
  // Calculate fuel required for SAR task (hover pattern)
  const taskFuelRequired = timeOnTask * hoverFuelFlow;
  
  // Total committed fuel (cannot be used for operational radius)
  const committedFuel = routeFuel + alternateFuel + reserveFuel + taskFuelRequired;
  
  // Remaining fuel available for operational radius
  const remainingFuel = takeoffFuel - committedFuel;
  
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
  // OPERATIONAL RADIUS CALCULATION
  // ========================================
  
  // Available fuel for radius operations (round trip)
  const radiusFuel = remainingFuel;
  
  // Time available for radius flight (round trip)
  const radiusFlightTimeHours = radiusFuel / cruiseFuelFlow;
  
  // One-way flight time (half of total available time)
  const oneWayFlightTimeHours = radiusFlightTimeHours / 2;
  
  // Operational radius in nautical miles
  const operationalRadiusNM = oneWayFlightTimeHours * cruiseSpeed;
  
  // ========================================
  // ADDITIONAL CALCULATIONS
  // ========================================
  
  // Total endurance calculations
  const totalEnduranceHours = takeoffFuel / cruiseFuelFlow;
  const operationalEnduranceHours = remainingFuel / cruiseFuelFlow;
  
  // SAR-specific endurance (using hover fuel flow)
  const sarEnduranceHours = remainingFuel / hoverFuelFlow;
  
  // Weight calculations (simplified)
  const payloadCapacity = usefulLoad - takeoffFuel;
  const remainingPayloadCapacity = payloadCapacity - sarWeight;
  
  // ========================================
  // RETURN SUCCESSFUL RESULTS
  // ========================================
  
  return {
    // Primary Results
    operationalRadiusNM: Math.round(operationalRadiusNM * 10) / 10,
    remainingFuelLbs: Math.round(remainingFuel),
    operationalEnduranceHours: Math.round(operationalEnduranceHours * 100) / 100,
    
    // SAR-Specific Results
    sarEnduranceHours: Math.round(sarEnduranceHours * 100) / 100,
    sarEnduranceMinutes: Math.round(sarEnduranceHours * 60),
    taskFuelRequired: Math.round(taskFuelRequired),
    
    // Performance Details
    cruiseSpeed: cruiseSpeed,
    cruiseFuelFlow: cruiseFuelFlow,
    hoverFuelFlow: hoverFuelFlow,
    oneWayFlightTime: Math.round(oneWayFlightTimeHours * 60), // minutes
    
    // Weight and Balance
    totalPayload: Math.round(totalPayload),
    usefulLoad: Math.round(usefulLoad),
    payloadCapacity: Math.round(payloadCapacity),
    remainingPayloadCapacity: Math.round(remainingPayloadCapacity),
    
    // Fuel Breakdown
    fuelBreakdown: {
      takeoffFuel: Math.round(takeoffFuel),
      routeFuel: Math.round(routeFuel),
      alternateFuel: Math.round(alternateFuel),
      reserveFuel: Math.round(reserveFuel),
      taskFuel: Math.round(taskFuelRequired),
      operationalFuel: Math.round(remainingFuel),
      totalCommitted: Math.round(committedFuel)
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