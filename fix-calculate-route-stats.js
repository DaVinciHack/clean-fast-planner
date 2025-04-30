// ISSUE: calculateRouteStats might not be passing all settings to FlightCalculations
// FIX: Update to ensure all settings are passed

// Find the function in ModularFastPlannerComponent.jsx
// Around line 777 (const calculateRouteStats = (coordinates) => {...)
// And fix it as follows:

const calculateRouteStats = (coordinates) => {
  if (!coordinates || coordinates.length < 2) {
    setRouteStats(null);
    return null;
  }
  
  // Ensure flight calculator is initialized
  if (!flightCalculationsRef.current) {
    flightCalculationsRef.current = new FlightCalculations();
    
    // Set callback
    flightCalculationsRef.current.setCallback('onCalculationComplete', (result) => {
      setRouteStats(result);
    });
  }
  
  // IMPORTANT: Update with ALL current settings
  if (flightCalculationsRef.current) {
    flightCalculationsRef.current.updateConfig({
      passengerWeight,
      reserveFuel,
      deckTimePerStop,
      deckFuelFlow,
      taxiFuel,
      contingencyFuelPercent,
      deckFuelPerStop, // Add this
      cargoWeight      // Add this
    });
    
    // Log the settings being used for calculation
    console.log("Calculate route stats - using settings:", {
      passengerWeight,
      reserveFuel,
      deckTimePerStop,
      deckFuelFlow,
      taxiFuel,
      contingencyFuelPercent,
      deckFuelPerStop,
      cargoWeight
    });
  }
  
  // Rest of the function - create aircraft data and call calculateFlightStats...
  // [Existing code continues]
};
