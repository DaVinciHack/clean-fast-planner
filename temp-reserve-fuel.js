  const handleReserveFuelChange = (fuel) => {
    setReserveFuel(fuel);
    
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

