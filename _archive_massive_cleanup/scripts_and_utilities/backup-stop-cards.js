/**
 * This file contains a backup implementation of the stop cards generation function.
 * It can be imported and used if the regular generateStopCardsData function is failing.
 */

/**
 * Generates stop cards data from waypoints and route stats
 * This is a simplified version of the original function
 */
function generateBackupStopCards(waypoints, routeStats, selectedAircraft, weather = { windSpeed: 0, windDirection: 0 }) {
  // Only proceed if we have waypoints and an aircraft
  if (!waypoints || waypoints.length < 2 || !selectedAircraft) {
    console.log('Cannot generate stop cards: missing waypoints or aircraft');
    return [];
  }

  console.log('Generating backup stop cards with:', {
    waypointsCount: waypoints.length,
    aircraft: selectedAircraft.registration,
    distance: routeStats?.totalDistance || 0
  });

  const cards = [];
  
  // Add departure card
  cards.push({
    id: waypoints[0].id || 'departure',
    index: 0,
    stopName: waypoints[0].name || 'Departure',
    totalDistance: '0.0',
    totalTime: 0,
    totalFuel: routeStats?.totalFuel || 2000,
    maxPassengers: routeStats?.maxPassengers || 12,
    isDeparture: true,
    isDestination: false,
    fuelComponents: routeStats?.tripFuel ? 
      `Trip:${routeStats.tripFuel} Res:${routeStats.reserveFuel || 600} Cont:${routeStats.contingencyFuel || 100} Taxi:${routeStats.taxiFuel || 50} Deck:${routeStats.deckFuel || 250}` :
      'Fuel breakdown not available'
  });
  
  // Add intermediate stops (if any)
  for (let i = 1; i < waypoints.length - 1; i++) {
    const legDistance = routeStats?.legs && routeStats.legs[i-1] ? 
                      routeStats.legs[i-1].distance : 
                      (routeStats?.totalDistance || 100) / (waypoints.length - 1);
                      
    const legTime = routeStats?.legs && routeStats.legs[i-1] ? 
                  routeStats.legs[i-1].time : 
                  (routeStats?.timeHours || 1) / (waypoints.length - 1);
                  
    cards.push({
      id: waypoints[i].id || `waypoint-${i}`,
      index: i,
      stopName: waypoints[i].name || `Waypoint ${i}`,
      totalDistance: typeof legDistance === 'number' ? legDistance.toFixed(1) : `${legDistance}`,
      totalTime: legTime,
      totalFuel: 1500, // Estimated
      maxPassengers: routeStats?.maxPassengers || 15,
      isDeparture: false,
      isDestination: false,
      fuelComponents: 'Trip: Continuing Res: Required'
    });
  }
  
  // Add destination card
  cards.push({
    id: waypoints[waypoints.length - 1].id || 'destination',
    index: waypoints.length - 1,
    stopName: waypoints[waypoints.length - 1].name || 'Destination',
    totalDistance: routeStats?.totalDistance || '150.0',
    totalTime: routeStats?.timeHours || 1.0,
    totalFuel: routeStats?.reserveFuel || 700,
    maxPassengers: 0,
    maxPassengersDisplay: 'Final Stop',
    isDeparture: false,
    isDestination: true,
    fuelComponents: `Res:${routeStats?.reserveFuel || 600} Extra:${routeStats?.extraFuel || 100}`
  });
  
  console.log(`Generated ${cards.length} backup stop cards`);
  return cards;
}

export default generateBackupStopCards;