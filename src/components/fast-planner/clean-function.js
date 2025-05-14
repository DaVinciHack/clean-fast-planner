const generateStopCardsData = (waypoints, routeStats, selectedAircraft, weather = { windSpeed: 0, windDirection: 0 }) => {
  if (!waypoints || waypoints.length < 2 || !selectedAircraft) {
    console.log('generateStopCardsData: Missing required data', {
      hasWaypoints: waypoints ? waypoints.length : 0,
      hasAircraft: !!selectedAircraft
    });
    return [];
  }

  console.log('Generating stop cards with', waypoints.length, 'waypoints');
  
  // Create data for each stop
  const cards = [];
  
  // Get aircraft data for calculations
  const aircraft = selectedAircraft;
  
  // Calculate total trip values
  let totalDistance = 0;
  let totalTripFuel = 0;
  const legDetails = [];
  
  // First, pre-calculate all leg details and total values
  for (let i = 0; i < waypoints.length - 1; i++) {
    const fromWaypoint = waypoints[i];
    const toWaypoint = waypoints[i + 1];
    
    // Calculate leg distance
    let legDistance = 0;
    if (routeStats && routeStats.legs && routeStats.legs[i]) {
      legDistance = parseFloat(routeStats.legs[i].distance);
    } else if (window.turf) {
      // Calculate using turf
      const from = window.turf.point(fromWaypoint.coords);
      const to = window.turf.point(toWaypoint.coords);
      legDistance = window.turf.distance(from, to, { units: 'nauticalmiles' });
    }
    
    // Calculate leg time and fuel with wind adjustments
    let legTimeHours = 0;
    let legFuel = 0;
    let legGroundSpeed = aircraft.cruiseSpeed;
    let headwindComponent = 0;
    
    // Check for coordinates
    const fromHasCoords = (fromWaypoint.lat && fromWaypoint.lon) || 
                        (fromWaypoint.coords && fromWaypoint.coords.length === 2);
    const toHasCoords = (toWaypoint.lat && toWaypoint.lon) || 
                        (toWaypoint.coords && toWaypoint.coords.length === 2);
    
    if (fromHasCoords && toHasCoords) {
      // Create lat/lon objects
      const fromCoords = {
        lat: fromWaypoint.lat || fromWaypoint.coords[1],
        lon: fromWaypoint.lon || fromWaypoint.coords[0]
      };
      
      const toCoords = {
        lat: toWaypoint.lat || toWaypoint.coords[1],
        lon: toWaypoint.lon || toWaypoint.coords[0]
      };
      
      // Calculate with wind if available
      if (window.WindCalculations) {
        try {
          const legDetails = window.WindCalculations.calculateLegWithWind(
            fromCoords,
            toCoords,
            legDistance,
            aircraft,
            weather
          );
          
          legTimeHours = legDetails.time;
          legFuel = Math.round(legDetails.fuel);
          legGroundSpeed = Math.round(legDetails.groundSpeed);
          headwindComponent = Math.round(legDetails.headwindComponent);
        } catch (error) {
          // Fallback to basic calculation
          legTimeHours = legDistance / aircraft.cruiseSpeed;
          legFuel = Math.round(legTimeHours * aircraft.fuelBurn);
          legGroundSpeed = aircraft.cruiseSpeed;
          headwindComponent = 0;
        }
      } else {
        // Basic calculation
        legTimeHours = legDistance / aircraft.cruiseSpeed;
        legFuel = Math.round(legTimeHours * aircraft.fuelBurn);
        legGroundSpeed = aircraft.cruiseSpeed;
        headwindComponent = 0;
      }
    } else {
      // Simple calculation
      legTimeHours = legDistance / aircraft.cruiseSpeed;
      legFuel = Math.round(legTimeHours * aircraft.fuelBurn);
    }
    
    // Update totals
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
  
  // Calculate auxiliary fuel values
  const taxiFuelValue = 50;
  const reserveFuelValue = 600;
  
  // Calculate intermediate stops (for deck fuel)
  const intermediateStops = Math.max(0, waypoints.length - 2);
  const deckTimeHours = (intermediateStops * 5) / 60; // Convert from minutes to hours
  const deckFuelValue = Math.round(deckTimeHours * 400);
  
  // Calculate contingency fuel
  const contingencyFuelValue = Math.round((totalTripFuel * 10) / 100);
  
  // Calculate total fuel required for the entire trip
  const totalFuelRequired = taxiFuelValue + totalTripFuel + contingencyFuelValue + reserveFuelValue + deckFuelValue;
  
  // CHANGE: Only create stop cards for actual waypoints, not adding a departure card
  // This matches the original behavior before the changes
  
  // Now create cards for each stop - these show the fuel needed to continue the journey
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
    const remainingIntermediateStops = Math.max(0, legDetails.length - i - 1);
    
    // Calculate remaining deck fuel
    const remainingDeckTimeHours = (remainingIntermediateStops * 5) / 60;
    const remainingDeckFuel = Math.round(remainingDeckTimeHours * 400);
    
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
      fuelNeeded = reserveFuelValue + remainingContingencyFuel;
      fuelComponents = {
        reserveFuel: reserveFuelValue,
        contingencyFuel: remainingContingencyFuel,
        extraFuel: 0 // Can be used for alternate or holding fuel
      };
      
      if (routeStats?.enhancedResults?.auxiliaryFuel?.contingencyFuel) {
        // If we have enhanced results, use the exact contingency fuel
        fuelComponents.contingencyFuel = routeStats.enhancedResults.auxiliaryFuel.contingencyFuel;
      }
      
      fuelComponentsText = `Reserve:${reserveFuelValue} Extra:0 FullCont:${remainingContingencyFuel}`;
    } else {
      // At intermediate stops, you need fuel for remaining legs, plus reserve
      fuelNeeded = remainingTripFuel + remainingContingencyFuel + remainingDeckFuel + reserveFuelValue;
      fuelComponents = {
        remainingTripFuel: remainingTripFuel,
        contingencyFuel: remainingContingencyFuel,
        deckFuel: remainingDeckFuel,
        reserveFuel: reserveFuelValue
      };
      fuelComponentsText = `Trip:${remainingTripFuel} Cont:${remainingContingencyFuel} Res:${reserveFuelValue}`;
      
      // Add deck fuel text only if there are remaining intermediate stops
      if (remainingDeckFuel > 0) {
        fuelComponentsText += ` Deck:${remainingDeckFuel}`;
      }
    }
    
    // Calculate max passengers based on remaining fuel needed
    let maxPassengers = 0;
    if (selectedAircraft) {
      const usableLoad = Math.max(
        0, 
        selectedAircraft.maxTakeoffWeight - 
        selectedAircraft.emptyWeight - 
        fuelNeeded
      );
      maxPassengers = Math.floor(usableLoad / 220);
      
      // Ensure we don't exceed aircraft capacity
      maxPassengers = Math.min(maxPassengers, selectedAircraft.maxPassengers || 19);
    }
    
    // For final destination, show "Final Stop" instead of passenger count
    const displayMaxPassengers = isFinalDestination ? "Final Stop" : maxPassengers;
    const maxPassengersValue = isFinalDestination ? null : maxPassengers;
    const maxPassengersWeight = isFinalDestination ? null : (maxPassengers * 220);
    
    // First waypoint is departure, last is destination
    const isDeparture = i === 0;
    const isDestination = isFinalDestination;
    
    // Create the card data
    const cardData = {
      index: i + 1, // +1 because the original index started at 1
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
      isDeparture: isDeparture,
      isDestination: isDestination
    };
    
    console.log(`Stop card ${i+1} data:`, {
      stopName: cardData.stopName,
      isDeparture: cardData.isDeparture,
      isDestination: cardData.isDestination
    });
    
    cards.push(cardData);
  }
  
  console.log(`Generated ${cards.length} stop cards`);
  return cards;
}