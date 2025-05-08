/**
 * ComprehensiveFuelCalculator.js
 *
 * This module orchestrates all fuel calculations for the Fast Planner,
 * combining results for both the top fuel display and the stop cards.
 */

import FuelIntegration from './FuelIntegration';
import StopCardCalculator from '../flight/StopCardCalculator';

/**
 * Calculate all necessary fuel data for the flight plan.
 *
 * @param {Array} waypoints - Array of waypoint objects.
 * @param {Object} selectedAircraft - Selected aircraft object with performance data.
 * @param {Object} flightSettings - Flight settings object.
 * @param {Object} weather - Weather data object.
 * @param {Object} routeStats - Current route statistics (may be needed by StopCardCalculator).
 * @returns {Object} An object containing enhanced fuel results and stop card data.
 */
const calculateAllFuelData = (waypoints, selectedAircraft, flightSettings, weather, routeStats) => {
  // Ensure required inputs are available
  if (!waypoints || waypoints.length < 2 || !selectedAircraft || !flightSettings) {
    console.warn('ComprehensiveFuelCalculator: Missing required inputs for calculation.');
    return { enhancedResults: null, stopCards: [] };
  }

  console.log('ComprehensiveFuelCalculator: Starting comprehensive fuel calculation with settings:', flightSettings);

  // Ensure all settings are properly converted to numeric values
  const numericSettings = {
    passengerWeight: Number(flightSettings.passengerWeight || 0),
    taxiFuel: Number(flightSettings.taxiFuel || 0),
    contingencyFuelPercent: Number(flightSettings.contingencyFuelPercent || 0),
    reserveFuel: Number(flightSettings.reserveFuel || 0),
    deckTimePerStop: Number(flightSettings.deckTimePerStop || 0),
    deckFuelFlow: Number(flightSettings.deckFuelFlow || 0),
    cargoWeight: Number(flightSettings.cargoWeight || 0)
  };

  console.log('ComprehensiveFuelCalculator: Using numeric settings:', numericSettings);

  // 1. Calculate enhanced fuel data for the top display
  const enhancedResults = FuelIntegration.calculateFuelRequirements(
    waypoints,
    selectedAircraft,
    weather,
    numericSettings
  );

  // 2. Calculate stop card data with the same numeric settings
  const stopCards = StopCardCalculator.calculateStopCards(
    waypoints,
    // StopCardCalculator also uses routeStats, pass it along
    routeStats,
    selectedAircraft,
    weather,
    numericSettings
  );

  console.log('ComprehensiveFuelCalculator: Calculation complete.', {
    hasEnhancedResults: enhancedResults ? true : false,
    stopCardCount: stopCards.length
  });

  // Return both sets of results
  return {
    enhancedResults: enhancedResults,
    stopCards: stopCards
  };
};

export default {
  calculateAllFuelData,
};
