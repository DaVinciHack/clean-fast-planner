// FlightUtilities.js
// Extracted utility functions from FastPlannerApp.jsx

import StopCardCalculator from '../modules/calculations/flight/StopCardCalculator.js';

/**
 * Generate stop cards data using StopCardCalculator - single source of truth
 */
export const generateStopCardsData = (waypoints, routeStats, selectedAircraft, weather, fuelPolicy, options = {}) => {
  console.log('🎯 generateStopCardsData: Using StopCardCalculator directly - single source of truth');
  
  // Get fuel policy for reserve fuel conversion
  const currentPolicy = fuelPolicy?.currentPolicy;
  
  // Call StopCardCalculator directly with fuel policy
  const stopCards = StopCardCalculator.calculateStopCards(
    waypoints,
    routeStats, 
    selectedAircraft,
    weather,
    {
      ...options,
      fuelPolicy: currentPolicy
    }
  );
  
  console.log('✅ generateStopCardsData: StopCardCalculator returned', stopCards?.length || 0, 'cards');
  
  // 🚨 AVIATION SAFETY: If StopCardCalculator returns empty array, CLEAR ALL FUEL DATA
  if (!stopCards || stopCards.length === 0) {
    console.error('🚨 CRITICAL SAFETY: StopCardCalculator returned no data - CLEARING ALL FUEL DISPLAYS');
    return [];
  }
  
  // 🛡️ DEFENSIVE: Ensure stopCards is actually an array with valid objects
  if (!Array.isArray(stopCards)) {
    console.error('🚨 StopCardCalculator returned non-array:', typeof stopCards);
    return [];
  }
  
  // Calculate header totals from stop cards ONLY if we have valid data
  if (stopCards && stopCards.length > 0) {
    calculateHeaderTotals(stopCards);
  }
  
  return stopCards || [];
};

/**
 * Calculate header totals from stop cards
 */
const calculateHeaderTotals = (stopCards) => {
  let totalFuel = 0;
  let totalDistance = 0;
  let totalTime = 0;
  let maxPassengers = 0;
  
  stopCards.forEach((card, index) => {
    if (!card) {
      console.warn(`⚠️ Null card at index ${index}`);
      return;
    }
    if (card.totalFuel) totalFuel += Number(card.totalFuel) || 0;
    if (card.distance) totalDistance += Number(card.distance) || 0;
    if (card.time) totalTime += Number(card.time) || 0;
    if (card.maxPassengers) maxPassengers = Math.max(maxPassengers, Number(card.maxPassengers) || 0);
  });
  
  console.log('📊 generateStopCardsData: Updated header totals:', {
    totalDistance: Math.round(totalDistance * 10) / 10,
    totalFuel: Math.round(totalFuel),
    maxPassengers: maxPassengers
  });
  
  // Trigger header update
  if (typeof window.triggerRouteStatsUpdate === 'function') {
    window.triggerRouteStatsUpdate();
  }
};

/**
 * Determine split point for new flights
 */
export const determineNewFlightSplitPoint = (currentWaypoints) => {
  console.log('🎯 Determining split point for new flight');
  console.log('🎯 Current waypoints:', currentWaypoints?.length || 0);
  
  if (!currentWaypoints || currentWaypoints.length === 0) {
    console.log('🎯 No waypoints available, using default split point: ENXW');
    return "ENXW"; // Default fallback
  }
  
  // Find the first landing point (stop)
  for (let i = 0; i < currentWaypoints.length; i++) {
    const waypoint = currentWaypoints[i];
    const waypointName = waypoint.name || waypoint.id || '';
    
    console.log(`🎯 Checking waypoint ${i}: ${waypointName}`);
    
    // Skip departure point
    if (waypointName.includes('(Dep)')) {
      console.log('🎯 Skipping departure point');
      continue;
    }
    
    // Look for first landing point (Stop or Des)
    if (waypointName.includes('(Stop') || waypointName.includes('(Des)')) {
      const splitPoint = waypointName.split(' (')[0].trim();
      console.log(`🎯 Found first landing point as split point: ${splitPoint}`);
      return splitPoint;
    }
    
    // If waypoint doesn't have labels, assume stops are any waypoint after departure
    if (i > 0) {
      const splitPoint = waypointName.trim();
      console.log(`🎯 Using waypoint ${i} as split point (no labels): ${splitPoint}`);
      return splitPoint;
    }
  }
  
  // Fallback: use last waypoint if no stops found
  if (currentWaypoints.length > 0) {
    const lastWaypoint = currentWaypoints[currentWaypoints.length - 1];
    const splitPoint = (lastWaypoint.name || lastWaypoint.id || '').split(' (')[0].trim();
    console.log(`🎯 Using last waypoint as split point: ${splitPoint}`);
    return splitPoint;
  }
  
  console.log('🎯 No suitable waypoints found, using default: ENXW');
  return "ENXW"; // Ultimate fallback
};
