/**
 * FuelIntegration.js
 * 
 * This module integrates the enhanced fuel calculator with the existing
 * fuel calculation system in the Fast Planner application.
 */

import enhancedFuelCalculator from './index';

/**
 * Initialize the fuel calculator with the application's settings
 * @param {Object} settings - Application settings
 */
export function initializeFuelCalculator(settings) {
  if (!settings) return;
  
  console.log('FuelIntegration: Initializing fuel calculator with settings:', settings);
  
  enhancedFuelCalculator.updateConfig({
    passengerWeight: settings.passengerWeight || 220,
    taxiFuel: settings.taxiFuel || 50,
    contingencyFuelPercent: settings.contingencyFuelPercent || 10,
    reserveFuel: settings.reserveFuel || 500,
    deckTimePerStop: settings.deckTimePerStop || 5,
    deckFuelFlow: settings.deckFuelFlow || 400
  });
}

/**
 * Calculate fuel requirements using the enhanced calculator
 * @param {Array} waypoints - Array of waypoint objects
 * @param {Object} aircraft - Aircraft data
 * @param {Object} weather - Weather data
 * @param {Object} settings - Additional calculation settings
 * @returns {Object} Fuel calculation results
 */
export function calculateFuelRequirements(structuredLegs, aircraft, weather, settings = {}) { // Renamed waypoints to structuredLegs
  // Check if we have valid input data
  // The EnhancedFuelCalculator's validateInputData now checks structuredLegs.
  // We might still want a basic check here.
  if (!structuredLegs || !aircraft) { // Simplified check, as detailed validation is in EnhancedFuelCalculator
    console.error('FuelIntegration: Missing structuredLegs or aircraft data for calculation');
    return null;
  }
  if (!Array.isArray(structuredLegs)) {
    console.error('FuelIntegration: structuredLegs is not an array.');
    return null;
  }
  // Allow empty structuredLegs if no valid legs could be formed (e.g. < 2 stops)
  // EnhancedFuelCalculator should handle this.
  
  // Log the calculation request
  console.log('FuelIntegration: Calculating fuel requirements:', {
    legsCount: structuredLegs.length,
    aircraft: aircraft.registration,
    weather
  });
  
  // Update calculator settings if provided
  if (settings) {
    enhancedFuelCalculator.updateConfig(settings);
  }
  
  // Perform the calculation
  const results = enhancedFuelCalculator.calculateFuelRequirements({
    legs: structuredLegs, // Pass structuredLegs as 'legs'
    aircraft,
    weather,
    cargoWeight: settings.cargoWeight || 0
  });
  
  // Log if calculation failed
  if (!results) {
    console.error('FuelIntegration: Calculation failed, no results returned');
    return null;
  }
  
  // Convert the enhanced results to the format expected by the existing code
  return convertToExistingFormat(results, structuredLegs, aircraft); // Pass structuredLegs
}

/**
 * Convert the enhanced fuel calculation results to the format expected
 * by the existing code in FastPlannerApp.jsx
 * @param {Object} results - Enhanced fuel calculation results from EnhancedFuelCalculator
 * @param {Array} structuredLegs - The input array of leg objects.
 * @param {Object} aircraft - Aircraft data
 * @returns {Object} Results in the existing format
 */
function convertToExistingFormat(results, structuredLegs, aircraft) {
  // Extract needed values from results
  const { legResults, auxiliaryFuel, fuelByStop, maxCapacity } = results;
  
  // legResults.legDetails should now be an array of stop-to-stop leg summaries
  const formattedLegsOutput = legResults.legDetails.map((leg, index) => {
    const formattedTime = formatTime(leg.flightTimeHours);
    
    return {
      from: leg.from,
      to: leg.to,
      distance: leg.distance.toFixed(1),
      time: leg.flightTimeHours,
      timeFormatted: formattedTime,
      fuel: leg.fuelRequired,
      groundSpeed: leg.groundSpeed,
      headwind: leg.windEffect,
      // Include the full path waypoints for this leg if available, for debugging or detailed display
      fullPathWaypoints: leg.fullPathWaypoints || [],
      source: 'enhanced'
    };
  });
  
  // Create wind data object if applicable
  const windData = results.weather?.windSpeed > 0 && legResults.legDetails && legResults.legDetails.length > 0 ? {
    windSpeed: results.weather.windSpeed,
    windDirection: results.weather.windDirection,
    // Calculate avgHeadwind safely
    avgHeadwind: legResults.legDetails.reduce((sum, leg) => sum + (leg.windEffect || 0), 0) / legResults.legDetails.length
  } : null;
  
  // Format total time
  const totalTimeFormatted = formatTime(legResults.totalTime);

  // Determine number of actual stops.
  // If structuredLegs is [{dep:A, arr:B}, {dep:B, arr:C}], actual stops are A,B,C (3 stops).
  // This is structuredLegs.length + 1, assuming contiguous legs.
  // Or, more robustly, count unique stops from fuelByStop if available and accurate.
  // fuelByStop is an array where each item represents an actual stop.
  const numActualStops = fuelByStop ? fuelByStop.length : 0;
  
  // Build the result object
  return {
    // Distance and time fields
    totalDistance: legResults.totalDistance.toFixed(1),
    timeHours: legResults.totalTime,
    estimatedTime: totalTimeFormatted,
    
    // Fuel calculations
    fuelRequired: legResults.totalTripFuel,
    tripFuel: legResults.totalTripFuel,
    deckFuel: auxiliaryFuel.deckFuel,
    contingencyFuel: auxiliaryFuel.contingencyFuel,
    taxiFuel: auxiliaryFuel.taxiFuel,
    reserveFuel: auxiliaryFuel.reserveFuel,
    totalFuel: legResults.totalTripFuel + auxiliaryFuel.total,
    
    // Flight parameters
    // auxiliaryFuel.intermediateStops is now the count of stops where deck time is applied
    deckTimeMinutes: auxiliaryFuel.deckTimePerStop * auxiliaryFuel.intermediateStops, 
    totalTimeHours: legResults.totalTime + (auxiliaryFuel.deckTimePerStop * auxiliaryFuel.intermediateStops / 60),
    totalTimeFormatted, // Already formatted above
    
    // Weight calculations
    dryOperatingWeight: aircraft.emptyWeight,
    maxTakeoffWeight: aircraft.maxTakeoffWeight,
    usefulLoad: aircraft.maxFuel + (aircraft.maxPassengers || 19) * results.config.passengerWeight,
    usableLoad: aircraft.maxTakeoffWeight - aircraft.emptyWeight - (legResults.totalTripFuel + auxiliaryFuel.total),
    
    // Passenger calculation
    maxPassengers: aircraft.maxPassengers || 19,
    maxPassengersByWeight: maxCapacity.maxPassengers,
    calculatedPassengers: maxCapacity.maxPassengers,
    
    // Aircraft data reference
    aircraft,
    
    // Route data
    legs: formattedLegsOutput, // Use the formatted stop-to-stop leg summaries
    numStops: numActualStops > 0 ? numActualStops -1 : 0, // Number of segments/legs between actual stops
    intermediateStops: auxiliaryFuel.intermediateStops, // This is now correctly # of deck time applications
    
    // Wind data
    windAdjusted: windData !== null,
    windData,
    
    // Reference to full enhanced results
    enhancedResults: results,
    
    // Flag to indicate this came from the enhanced calculator
    source: 'enhanced-fuel-calculator'
  };
}

/**
 * Format time in hours to HH:MM format
 * @param {number} timeHours - Time in decimal hours
 * @returns {string} Formatted time string
 */
function formatTime(timeHours) {
  if (typeof timeHours !== 'number' || timeHours < 0) {
    return '00:00';
  }
  
  const hours = Math.floor(timeHours);
  const minutes = Math.floor((timeHours - hours) * 60);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

export default {
  initializeFuelCalculator,
  calculateFuelRequirements,
  calculator: enhancedFuelCalculator
};
