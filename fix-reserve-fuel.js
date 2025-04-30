// Updated handleReserveFuelChange function
const handleReserveFuelChange = (fuel) => {
  setReserveFuel(fuel);
  
  // IMPORTANT: Directly update the FlightCalculations module with the new reserve fuel
  if (flightCalculationsRef.current) {
    flightCalculationsRef.current.updateConfig({
      reserveFuel: fuel
    });
    
    console.log("Updated reserve fuel to:", fuel);
  }
  
  // Recalculate route stats with the new reserve fuel
  const wps = waypointManagerRef.current?.getWaypoints() || [];
  if (wps.length >= 2) {
    const coordinates = wps.map(wp => wp.coords);
    const stats = calculateRouteStats(coordinates);
    
    // CRITICAL FIX: Force update the route with new leg info
    if (waypointManagerRef.current) {
      setTimeout(() => {
        waypointManagerRef.current.updateRoute(stats);
      }, 50);
    }
  }
};
