/**
 * WeatherFuelIntegrationExample.js
 * 
 * Example showing how to integrate weather-based fuel calculations
 * with the existing Fast Planner fuel system.
 * 
 * This demonstrates the complete workflow from weather import to fuel display.
 */

import enhancedFuelManager from '../fuel';

/**
 * Example function showing how to integrate weather data with fuel calculations
 * @param {Array} weatherSegments - Weather segments from Palantir
 * @param {Array} waypoints - Current route waypoints
 * @param {Object} aircraft - Selected aircraft
 * @param {Object} importedPalantirFuel - Optional fuel data from Palantir
 */
export function integrateWeatherWithFuel(weatherSegments, waypoints, aircraft, importedPalantirFuel = null) {
  console.log("Starting weather-fuel integration...");
  
  try {
    // 1. Set the weather segments
    enhancedFuelManager.setWeatherSegments(weatherSegments);
    
    // 2. Set imported Palantir fuel for comparison (if available)
    if (importedPalantirFuel) {
      enhancedFuelManager.setPalantirFuel(importedPalantirFuel);
    }
    
    // 3. Set aircraft and waypoints
    enhancedFuelManager.setAircraft(aircraft);
    enhancedFuelManager.setWaypoints(waypoints);
    
    // 4. Get enhanced results with weather analysis
    const results = enhancedFuelManager.getEnhancedResults();
    
    // 5. Log the results for debugging
    console.log("Weather-enhanced fuel calculation results:", {
      fuelResults: results.fuelResults,
      weatherAnalysis: results.weatherAnalysis,
      hasWeatherData: results.hasWeatherData,
      palantirComparison: results.palantirComparison
    });
    
    // 6. Check for discrepancies with Palantir
    if (results.palantirComparison && !results.palantirComparison.matches) {
      console.warn("FUEL DISCREPANCY DETECTED:", results.palantirComparison.discrepancies);
      
      // Log specific differences for investigation
      results.palantirComparison.discrepancies.forEach(disc => {
        console.warn(`${disc.component}: Calculated=${disc.calculated}lbs, Palantir=${disc.palantir}lbs, Diff=${disc.difference}lbs (${disc.percentDiff}%)`);
      });
    }
    
    return results;
    
  } catch (error) {
    console.error("Error in weather-fuel integration:", error);
    throw error;
  }
}

/**
 * Example function for handling manual fuel mode when weather APIs fail
 * @param {Object} manualFuelValues - Manual fuel values from pilot input
 * @param {Array} waypoints - Current route waypoints  
 * @param {Object} aircraft - Selected aircraft
 */
export function useManualFuelMode(manualFuelValues, waypoints, aircraft) {
  console.log("Switching to manual fuel mode...");
  
  try {
    // 1. Enable manual fuel mode
    enhancedFuelManager.enableManualFuelMode(manualFuelValues);
    
    // 2. Set aircraft and waypoints
    enhancedFuelManager.setAircraft(aircraft);
    enhancedFuelManager.setWaypoints(waypoints);
    
    // 3. Get results with manual overrides
    const results = enhancedFuelManager.getEnhancedResults();
    
    console.log("Manual fuel calculation results:", {
      isManualMode: results.isManualMode,
      manualOverrides: results.manualOverrides,
      fuelResults: results.fuelResults
    });
    
    return results;
    
  } catch (error) {
    console.error("Error in manual fuel mode:", error);
    throw error;
  }
}

/**
 * Example function for switching back to automatic weather-based calculations
 */
export function returnToAutomaticFuelMode() {
  console.log("Returning to automatic fuel calculations...");
  
  enhancedFuelManager.disableManualFuelMode();
  
  // Recalculation will happen automatically if aircraft and waypoints are set
  const results = enhancedFuelManager.getEnhancedResults();
  
  console.log("Automatic fuel calculation restored:", {
    isManualMode: results.isManualMode,
    hasWeatherData: results.hasWeatherData
  });
  
  return results;
}

/**
 * Example function for updating fuel when route changes
 * @param {Array} newWaypoints - Updated waypoints
 */
export function updateFuelForRouteChange(newWaypoints) {
  console.log("Updating fuel for route change...");
  
  // Simply update waypoints - fuel will recalculate automatically
  enhancedFuelManager.setWaypoints(newWaypoints);
  
  const results = enhancedFuelManager.getEnhancedResults();
  
  // Get weather analysis for new route
  const weatherBreakdown = enhancedFuelManager.getWeatherFuelBreakdown();
  
  console.log("Fuel updated for new route:", {
    totalAraFuel: weatherBreakdown?.totalAraFuel || 0,
    totalApproachFuel: weatherBreakdown?.totalApproachFuel || 0,
    rigStops: weatherBreakdown?.rigStops?.length || 0
  });
  
  return results;
}

/**
 * Example function for getting manual fuel configuration for UI
 */
export function getManualFuelConfig() {
  const results = enhancedFuelManager.getEnhancedResults();
  return results.manualFuelConfig;
}

/**
 * Example weather segments for testing (matches Palantir format)
 */
export const exampleWeatherSegments = [
  {
    airportIcao: 'ENZV',
    isRig: false,
    ranking1: 1,
    ranking2: 2, // No special fuel required
    ranking3: 1,
    approachRanking: 3,
    warnings: null,
    araRequired: false,
    approachRequired: false
  },
  {
    airportIcao: 'ENLE', 
    isRig: true,
    ranking1: 3,
    ranking2: 8, // Triggers ARA fuel (ranking 8)
    ranking3: 4,
    approachRanking: null,
    warnings: 'High winds at rig',
    araRequired: false,
    approachRequired: false
  },
  {
    airportIcao: 'ENCN',
    isRig: false,
    ranking1: 2,
    ranking2: 10, // Triggers approach fuel (ranking 10)
    ranking3: 3,
    approachRanking: 8,
    warnings: 'Low visibility approach conditions',
    araRequired: false,
    approachRequired: false
  }
];

export default {
  integrateWeatherWithFuel,
  useManualFuelMode,
  returnToAutomaticFuelMode,
  updateFuelForRouteChange,
  getManualFuelConfig,
  exampleWeatherSegments
};