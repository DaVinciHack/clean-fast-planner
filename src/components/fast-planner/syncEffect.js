// Ensure flight calculation settings are synchronized with the module
useEffect(() => {
  if (flightCalculationsRef.current) {
    // Sync all state values to the calculator when they change
    flightCalculationsRef.current.updateConfig({
      passengerWeight,
      reserveFuel,
      deckTimePerStop,
      deckFuelFlow,
      taxiFuel,
      contingencyFuelPercent
    });
    
    console.log("Flight calculation settings synchronized with calculator module");
    
    // Recalculate route if we have waypoints
    const wps = waypointManagerRef.current?.getWaypoints() || [];
    if (wps.length >= 2) {
      const coordinates = wps.map(wp => wp.coords);
      calculateRouteStats(coordinates);
    }
  }
}, [passengerWeight, reserveFuel, deckTimePerStop, deckFuelFlow, taxiFuel, contingencyFuelPercent]);