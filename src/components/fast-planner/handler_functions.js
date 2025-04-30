  /**
   * This function handles all flight settings changes
   * It updates the individual state variable, the flightSettings object,
   * and the flight calculations module
   */
  const handleFlightSettingChange = (settingName, value) => {
    console.log(`Updating flight setting: ${settingName} = ${value}`);
    
    // Update the flightSettings object
    setFlightSettings(prevSettings => ({
      ...prevSettings,
      [settingName]: value
    }));
    
    // Update the flight calculations module if it exists
    if (flightCalculationsRef.current) {
      flightCalculationsRef.current.updateConfig({
        [settingName]: value
      });
    }
  };

  const handlePassengerWeightChange = (weight) => {
    setPassengerWeight(weight);
    handleFlightSettingChange("passengerWeight", weight);
    
    // Recalculate route stats with the new passenger weight
    const wps = waypointManagerRef.current?.getWaypoints() || [];
    if (wps.length >= 2) {
      const coordinates = wps.map(wp => wp.coords);
      calculateRouteStats(coordinates);
    }
  };

  const handleReserveFuelChange = (fuel) => {
    setReserveFuel(fuel);
    handleFlightSettingChange("reserveFuel", fuel);
    
    // Recalculate route stats with the new reserve fuel
    const wps = waypointManagerRef.current?.getWaypoints() || [];
    if (wps.length >= 2) {
      const coordinates = wps.map(wp => wp.coords);
      calculateRouteStats(coordinates);
    }
  };

  const handleDeckTimeChange = (time) => {
    setDeckTimePerStop(time);
    handleFlightSettingChange("deckTimePerStop", time);
    
    // Recalculate route stats with the new deck time
    const wps = waypointManagerRef.current?.getWaypoints() || [];
    if (wps.length >= 2) {
      const coordinates = wps.map(wp => wp.coords);
      calculateRouteStats(coordinates);
    }
  };

  const handleDeckFuelFlowChange = (fuelFlow) => {
    setDeckFuelFlow(fuelFlow);
    handleFlightSettingChange("deckFuelFlow", fuelFlow);
    
    // Recalculate route stats with the new deck fuel flow
    const wps = waypointManagerRef.current?.getWaypoints() || [];
    if (wps.length >= 2) {
      const coordinates = wps.map(wp => wp.coords);
      calculateRouteStats(coordinates);
    }
  };

  const handleTaxiFuelChange = (fuel) => {
    setTaxiFuel(fuel);
    handleFlightSettingChange("taxiFuel", fuel);
    
    // Recalculate route stats with the new taxi fuel
    const wps = waypointManagerRef.current?.getWaypoints() || [];
    if (wps.length >= 2) {
      const coordinates = wps.map(wp => wp.coords);
      calculateRouteStats(coordinates);
    }
  };

  const handleContingencyFuelPercentChange = (percent) => {
    setContingencyFuelPercent(percent);
    handleFlightSettingChange("contingencyFuelPercent", percent);
    
    // Recalculate route stats with the new contingency fuel percentage
    const wps = waypointManagerRef.current?.getWaypoints() || [];
    if (wps.length >= 2) {
      const coordinates = wps.map(wp => wp.coords);
      calculateRouteStats(coordinates);
    }
  };

  const handlePayloadWeightChange = (weight) => {
    setPayloadWeight(weight);
    handleFlightSettingChange("payloadWeight", weight);
    
    // Recalculate route stats with the new payload weight
    const wps = waypointManagerRef.current?.getWaypoints() || [];
    if (wps.length >= 2) {
      const coordinates = wps.map(wp => wp.coords);
      calculateRouteStats(coordinates);
    }
  };
  
  // Function to sync all flight settings with the calculator
  const syncFlightCalculator = () => {
    if (flightCalculationsRef.current) {
      flightCalculationsRef.current.updateConfig({
        passengerWeight,
        reserveFuel,
        deckTimePerStop,
        deckFuelFlow,
        taxiFuel,
        contingencyFuelPercent,
        payloadWeight
      });
      console.log("Synchronized all flight settings with calculator");
    }
  };