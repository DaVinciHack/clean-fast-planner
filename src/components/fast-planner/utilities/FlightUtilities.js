// FlightUtilities.js
// Extracted utility functions from FastPlannerApp.jsx

import StopCardCalculator from '../modules/calculations/flight/StopCardCalculator.js';

/**
 * Generate stop cards data using StopCardCalculator - single source of truth
 */
export const generateStopCardsData = (waypoints, routeStats, selectedAircraft, weather, fuelPolicy, options = {}, weatherSegments = null) => {
  // Using StopCardCalculator directly - single source of truth
  
  // Get fuel policy for reserve fuel conversion
  const currentPolicy = fuelPolicy?.currentPolicy;
  
  // 🔧 SAR FIX: Calculate alternate card first if alternate route data exists
  let alternateStopCard = null;
  if (options.alternateRouteData && selectedAircraft) {
    console.log('🟠 generateStopCardsData: Calculating alternate stop card for SAR');
    try {
      alternateStopCard = StopCardCalculator.calculateAlternateStopCard(
        waypoints,
        options.alternateRouteData,
        routeStats,
        selectedAircraft,
        weather,
        {
          ...options,
          fuelPolicy: currentPolicy
        }
      );
      console.log('🟠 generateStopCardsData: Alternate card calculated:', !!alternateStopCard);
    } catch (error) {
      console.error('🟠 generateStopCardsData: Error calculating alternate card:', error);
    }
  }
  
  // Call StopCardCalculator directly with fuel policy AND alternate card
  const stopCards = StopCardCalculator.calculateStopCards(
    waypoints,
    routeStats, 
    selectedAircraft,
    weather,
    {
      ...options,
      fuelPolicy: currentPolicy
    },
    weatherSegments,
    options.refuelStops || [],
    options.waiveAlternates || false,
    alternateStopCard  // 🔧 SAR FIX: Pass alternate card to main calculation
  );
  
  
  // Return stop cards from StopCardCalculator
  
  // 🚨 AVIATION SAFETY: If StopCardCalculator returns empty array, CLEAR ALL FUEL DATA
  if (!stopCards || stopCards.length === 0) {
    // Silent during initialization - only log when we have waypoints but no stop cards
    if (waypoints?.length >= 2 && selectedAircraft) {
      console.warn('🚨 SAFETY: StopCardCalculator returned no data - clearing fuel displays');
    }
    return [];
  }
  
  // 🛡️ DEFENSIVE: Ensure stopCards is actually an array with valid objects
  if (!Array.isArray(stopCards)) {
    console.error('🚨 StopCardCalculator returned non-array:', typeof stopCards);
    return [];
  }
  
  // Calculate header totals from stop cards ONLY if we have valid data
  if (stopCards && stopCards.length > 0) {
    calculateHeaderTotals(stopCards, routeStats);
  }
  
  return stopCards || [];
};

/**
 * Calculate header totals from stop cards and route stats
 */
const calculateHeaderTotals = (stopCards, routeStats) => {
  let totalFuel = 0;
  let totalDistance = 0;
  let totalTime = 0;
  let maxPassengers = 0;
  
  // Use route stats as primary source for distance and time
  if (routeStats) {
    totalDistance = Number(routeStats.totalDistance) || 0;
    totalTime = Number(routeStats.timeHours) || Number(routeStats.estimatedTime) || 0;
    
    console.log('📊 Using route stats for header totals:', {
      totalDistance: routeStats.totalDistance,
      timeHours: routeStats.timeHours,
      estimatedTime: routeStats.estimatedTime
    });
  } else {
    // Fallback: Calculate from stop cards if route stats not available
    console.log('📊 Fallback: Calculating totals from stop cards');
    stopCards.forEach((card, index) => {
      if (!card) {
        console.warn(`⚠️ Null card at index ${index}`);
        return;
      }
      if (card.legDistance) totalDistance += Number(card.legDistance) || 0;
      if (card.legTime) totalTime += Number(card.legTime) || 0;
    });
  }
  
  // Always calculate fuel and passengers from stop cards
  stopCards.forEach((card, index) => {
    if (!card) {
      console.warn(`⚠️ Null card at index ${index}`);
      return;
    }
    if (card.totalFuel) totalFuel += Number(card.totalFuel) || 0;
    if (card.maxPassengers) maxPassengers = Math.max(maxPassengers, Number(card.maxPassengers) || 0);
  });
  
  console.log('📊 generateStopCardsData: Updated header totals:', {
    totalDistance: Math.round(totalDistance * 10) / 10,
    totalFuel: Math.round(totalFuel),
    totalTime: Math.round(totalTime * 100) / 100,
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
