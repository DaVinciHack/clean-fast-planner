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
  console.log('ComprehensiveFuelCalculator: Original waypoints received:', JSON.parse(JSON.stringify(waypoints)));

  // Structure waypoints into legs, distinguishing stops from intermediate waypoints
  const legs = [];
  let currentLeg = null;
  const actualStopsForCards = [];

  if (waypoints && waypoints.length > 0) {
    waypoints.forEach((wp) => {
      const isNavWaypoint = 
        wp.pointType === 'NAVIGATION_WAYPOINT' ||
        wp.isWaypoint === true ||
        wp.type === 'WAYPOINT';

      if (!isNavWaypoint) { // This is a STOP
        if (currentLeg) {
          // This stop is the arrival for the current leg
          currentLeg.arrivalStop = wp;
          legs.push(currentLeg);
        }
        // Start a new leg with this stop as departure
        currentLeg = {
          departureStop: wp,
          arrivalStop: null, // Will be set by the next stop or if it's the last point
          intermediateWaypoints: []
        };
        actualStopsForCards.push(wp); // Add to list for stop cards
      } else { // This is an intermediate NAVIGATION WAYPOINT
        if (currentLeg) {
          currentLeg.intermediateWaypoints.push(wp);
        } else {
          // This implies a navigation waypoint appears before any stop.
          // This scenario should ideally be handled by UI logic ensuring routes start with a stop.
          // If not, these leading waypoints might be ignored or need special handling.
          console.warn('ComprehensiveFuelCalculator: Encountered an intermediate waypoint before the first stop. Waypoint:', wp);
          // For now, we'll assume the first point processed that's a stop will correctly initialize the first leg.
        }
      }
    });

    // If the loop finishes and currentLeg exists but has no arrivalStop,
    // it means the last point processed was a stop, and it started a new leg.
    // This "hanging" leg (with only a departure) is not a complete leg and should not be added to `legs`.
    // Or, if the route is just a single stop, currentLeg will exist with only a departure.
    // `legs` should only contain legs with both departure and arrival.

    // If there are no stops at all (e.g., only nav waypoints), legs will be empty.
    // In such a case, or if only one stop, we can't form legs.
    if (legs.length === 0 && actualStopsForCards.length >= 2) {
      // This could happen if all points are stops, e.g. A -> B -> C
      // The loop structure above correctly forms legs: A->B, then B->C
      // This block is more of a fallback or for specific edge cases.
      // Let's re-verify the primary loop logic for forming legs.
      // The primary loop:
      // Stop A: currentLeg = {dep: A, arr: null, int: []}, actualStopsForCards = [A]
      // Stop B: currentLeg.arr = B; legs.push({dep:A, arr:B, int:[]}); currentLeg = {dep: B, arr: null, int:[]}, actualStopsForCards = [A,B]
      // Stop C: currentLeg.arr = C; legs.push({dep:B, arr:C, int:[]}); currentLeg = {dep: C, arr: null, int:[]}, actualStopsForCards = [A,B,C]
      // This seems correct.
    }
  }
  
  console.log(`ComprehensiveFuelCalculator: Processed into ${legs.length} legs:`, JSON.parse(JSON.stringify(legs)));
  console.log(`ComprehensiveFuelCalculator: Actual stops for cards (${actualStopsForCards.length}):`, JSON.parse(JSON.stringify(actualStopsForCards)));

  // If no valid legs could be formed (e.g., < 2 stops), enhancedResults might be null.
  // FuelIntegration needs to handle an empty legs array gracefully.
  const enhancedResults = FuelIntegration.calculateFuelRequirements(
    legs, // Pass the structured legs
    selectedAircraft,
    weather,
    numericSettings
  );

  // Use actualStopsForCards for StopCardCalculator.
  // If actualStopsForCards is empty but waypoints exist (e.g. all nav waypoints),
  // StopCardCalculator might need a fallback (e.g. use first/last of original waypoints or show no cards).
  let stopsForCardCalc = actualStopsForCards;
  if (stopsForCardCalc.length === 0 && waypoints && waypoints.length >=2) {
    console.warn('ComprehensiveFuelCalculator: No actual stops identified for cards, but waypoints exist. Using first and last waypoint for cards as a fallback.');
    stopsForCardCalc = [waypoints[0], waypoints[waypoints.length - 1]];
  } else if (stopsForCardCalc.length === 1 && waypoints && waypoints.length > 0) {
    // If only one actual stop, but more waypoints, perhaps show card for that one stop.
    console.warn('ComprehensiveFuelCalculator: Only one actual stop identified. Stop cards might be limited.');
  }


  const stopCards = StopCardCalculator.calculateStopCards(
    stopsForCardCalc, 
    enhancedResults, // Pass enhancedResults as it might be more relevant now
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
