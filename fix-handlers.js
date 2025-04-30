// ISSUE: The handlers update the state but don't directly update the FlightCalculations module
// FIX: Add explicit updates to the FlightCalculations module in each handler

// 1. Fix handleDeckFuelFlowChange
const handleDeckFuelFlowChange = (fuelFlow) => {
  setDeckFuelFlow(fuelFlow);
  
  // IMPORTANT: Directly update the FlightCalculations module
  if (flightCalculationsRef.current) {
    flightCalculationsRef.current.updateConfig({
      deckFuelFlow: fuelFlow
    });
    
    console.log("Updated deck fuel flow to:", fuelFlow);
  }
  
  // Recalculate route stats with the new deck fuel flow
  const wps = waypointManagerRef.current?.getWaypoints() || [];
  if (wps.length >= 2) {
    const coordinates = wps.map(wp => wp.coords);
    const stats = calculateRouteStats(coordinates);
    
    // Force update the route with new leg info
    if (waypointManagerRef.current) {
      setTimeout(() => {
        waypointManagerRef.current.updateRoute(stats);
      }, 50);
    }
  }
};

// 2. Fix handleTaxiFuelChange
const handleTaxiFuelChange = (fuel) => {
  setTaxiFuel(fuel);
  
  // IMPORTANT: Directly update the FlightCalculations module
  if (flightCalculationsRef.current) {
    flightCalculationsRef.current.updateConfig({
      taxiFuel: fuel
    });
    
    console.log("Updated taxi fuel to:", fuel);
  }
  
  // Recalculate route stats with the new taxi fuel
  const wps = waypointManagerRef.current?.getWaypoints() || [];
  if (wps.length >= 2) {
    const coordinates = wps.map(wp => wp.coords);
    const stats = calculateRouteStats(coordinates);
    
    // Force update the route with new leg info
    if (waypointManagerRef.current) {
      setTimeout(() => {
        waypointManagerRef.current.updateRoute(stats);
      }, 50);
    }
  }
};

// 3. Fix handleContingencyFuelPercentChange
const handleContingencyFuelPercentChange = (percent) => {
  setContingencyFuelPercent(percent);
  
  // IMPORTANT: Directly update the FlightCalculations module
  if (flightCalculationsRef.current) {
    flightCalculationsRef.current.updateConfig({
      contingencyFuelPercent: percent
    });
    
    console.log("Updated contingency fuel % to:", percent);
  }
  
  // Recalculate route stats with the new contingency percent
  const wps = waypointManagerRef.current?.getWaypoints() || [];
  if (wps.length >= 2) {
    const coordinates = wps.map(wp => wp.coords);
    const stats = calculateRouteStats(coordinates);
    
    // Force update the route with new leg info
    if (waypointManagerRef.current) {
      setTimeout(() => {
        waypointManagerRef.current.updateRoute(stats);
      }, 50);
    }
  }
};

// 4. Create handleDeckTimeChange function
const handleDeckTimeChange = (time) => {
  setDeckTimePerStop(time);
  
  // IMPORTANT: Directly update the FlightCalculations module
  if (flightCalculationsRef.current) {
    flightCalculationsRef.current.updateConfig({
      deckTimePerStop: time
    });
    
    console.log("Updated deck time to:", time);
  }
  
  // Recalculate route stats with the new deck time
  const wps = waypointManagerRef.current?.getWaypoints() || [];
  if (wps.length >= 2) {
    const coordinates = wps.map(wp => wp.coords);
    const stats = calculateRouteStats(coordinates);
    
    // Force update the route with new leg info
    if (waypointManagerRef.current) {
      setTimeout(() => {
        waypointManagerRef.current.updateRoute(stats);
      }, 50);
    }
  }
};

// 5. Create handleDeckFuelChange function
const handleDeckFuelChange = (fuel) => {
  setDeckFuelPerStop(fuel);
  
  // IMPORTANT: Directly update the FlightCalculations module
  if (flightCalculationsRef.current) {
    flightCalculationsRef.current.updateConfig({
      deckFuelPerStop: fuel
    });
    
    console.log("Updated deck fuel to:", fuel);
  }
  
  // Recalculate route stats with the new deck fuel
  const wps = waypointManagerRef.current?.getWaypoints() || [];
  if (wps.length >= 2) {
    const coordinates = wps.map(wp => wp.coords);
    const stats = calculateRouteStats(coordinates);
    
    // Force update the route with new leg info
    if (waypointManagerRef.current) {
      setTimeout(() => {
        waypointManagerRef.current.updateRoute(stats);
      }, 50);
    }
  }
};

// 6. Create handlePassengerWeightChange function
const handlePassengerWeightChange = (weight) => {
  setPassengerWeight(weight);
  
  // IMPORTANT: Directly update the FlightCalculations module
  if (flightCalculationsRef.current) {
    flightCalculationsRef.current.updateConfig({
      passengerWeight: weight
    });
    
    console.log("Updated passenger weight to:", weight);
  }
  
  // Recalculate route stats with the new passenger weight
  const wps = waypointManagerRef.current?.getWaypoints() || [];
  if (wps.length >= 2) {
    const coordinates = wps.map(wp => wp.coords);
    const stats = calculateRouteStats(coordinates);
    
    // Force update the route with new leg info
    if (waypointManagerRef.current) {
      setTimeout(() => {
        waypointManagerRef.current.updateRoute(stats);
      }, 50);
    }
  }
};

// 7. Create handleCargoWeightChange function
const handleCargoWeightChange = (weight) => {
  setCargoWeight(weight);
  
  // IMPORTANT: Directly update the FlightCalculations module
  if (flightCalculationsRef.current) {
    flightCalculationsRef.current.updateConfig({
      cargoWeight: weight
    });
    
    console.log("Updated cargo weight to:", weight);
  }
  
  // Recalculate route stats with the new cargo weight
  const wps = waypointManagerRef.current?.getWaypoints() || [];
  if (wps.length >= 2) {
    const coordinates = wps.map(wp => wp.coords);
    const stats = calculateRouteStats(coordinates);
    
    // Force update the route with new leg info
    if (waypointManagerRef.current) {
      setTimeout(() => {
        waypointManagerRef.current.updateRoute(stats);
      }, 50);
    }
  }
};

// 8. RouteStatsCard update - ensure it uses the proper data from FlightCalculations
// In the RouteStatsCard.jsx - modify the values used to display:
// - Make sure to use stats.deckTimeMinutes directly rather than calculating
// - Make sure to use stats.totalFuel directly rather than calculating
// - Make sure to use stats.calculatedPassengers directly rather than calculating
