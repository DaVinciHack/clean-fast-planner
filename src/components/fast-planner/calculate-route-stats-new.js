  // Calculate route statistics using the enhanced FlightCalculations module
  const calculateRouteStats = (coordinates) => {
    if (!coordinates || coordinates.length < 2) {
      setRouteStats(null);
      return null;
    }
    
    // Ensure flight calculator is initialized
    if (!flightCalculationsRef.current) {
      flightCalculationsRef.current = new FlightCalculations();
    }
    
    // Sync all current flight settings with the calculator
    if (flightCalculationsRef.current) {
      flightCalculationsRef.current.updateConfig({
        passengerWeight,
        reserveFuel,
        deckTimePerStop,
        deckFuelFlow,
        taxiFuel,
        contingencyFuelPercent,
        payloadWeight: payloadWeight + cargoWeight
      });
      console.log("Synchronized all flight settings with calculator");
    }
    
    // Use S92 as default type if no type is selected
    let calculationAircraftType = aircraftType || 'S92';
    
    // If we have a selected aircraft from the third field, use that data
    if (selectedAircraft) {
      calculationAircraftType = selectedAircraft.modelType || 'S92';
    }
    
    // Create aircraft data object for calculations
    let aircraftData;
    
    if (selectedAircraft) {
      // Use selected aircraft data with fallbacks
      aircraftData = {
        // Use correct field names with fallbacks
        cruiseSpeed: selectedAircraft.cruiseSpeed || selectedAircraft.cruseSpeed || 145,
        fuelBurn: selectedAircraft.fuelBurn || 1100,
        maxFuelCapacity: selectedAircraft.maxFuel || selectedAircraft.maxFuelCapacity || 5000,
        dryOperatingWeightLbs: selectedAircraft.dryOperatingWeightLbs || 15000,
        usefulLoad: selectedAircraft.usefulLoad || 7000,
        maxPassengers: selectedAircraft.maxPassengers || 19,
        // Include all other properties
        ...selectedAircraft
      };
    } else if (routeCalculatorRef.current) {
      // Get default aircraft data from RouteCalculator if no aircraft selected
      const defaultAircraft = routeCalculatorRef.current.getAircraftType(calculationAircraftType.toLowerCase());
      aircraftData = {
        cruiseSpeed: defaultAircraft.cruiseSpeed,
        fuelBurn: defaultAircraft.fuelBurn,
        maxFuelCapacity: defaultAircraft.maxFuel,
        dryOperatingWeightLbs: defaultAircraft.emptyWeight,
        usefulLoad: defaultAircraft.usefulLoad || 7000,
        maxPassengers: defaultAircraft.maxPassengers || 19,
        modelType: calculationAircraftType
      };
    } else {
      // Fallback to basic defaults if no data source available
      aircraftData = {
        cruiseSpeed: 145,
        fuelBurn: 1100,
        maxFuelCapacity: 5000,
        dryOperatingWeightLbs: 15000,
        usefulLoad: 7000,
        maxPassengers: 19,
        modelType: calculationAircraftType
      };
    }
    
    console.log("Calculating route stats with aircraft data:", {
      type: calculationAircraftType,
      cruiseSpeed: aircraftData.cruiseSpeed,
      fuelBurn: aircraftData.fuelBurn
    });
    
    // Calculate with the enhanced flight calculations module
    const stats = flightCalculationsRef.current.calculateFlightStats(
      coordinates, 
      aircraftData,
      { 
        payloadWeight: payloadWeight + cargoWeight
        // No need to pass other settings as they've been synced already
      }
    );
    
    // Update route stats state
    setRouteStats(stats);
    
    // Store route stats globally for access by WaypointManager
    window.currentRouteStats = stats;
    
    return stats;
  };