// Replace the separate settings states with a unified settings state
const [settings, setSettings] = useState({
  passengerWeight: 220, // lbs per passenger including baggage
  contingencyFuelPercent: 10, // 10% contingency fuel
  taxiFuel: 50, // lbs
  reserveFuel: 600, // lbs
  deckTimePerStop: 5, // minutes
  deckFuelFlow: 400, // lbs per hour during deck operations
  deckFuelPerStop: 100, // lbs per stop
  cargoWeight: 0,
  reserveMethod: 'fixed'
});

// Handler for updating settings
const handleSettingsChange = (newSettings) => {
  // Update the settings object
  const updatedSettings = { ...settings, ...newSettings };
  setSettings(updatedSettings);
  
  // Update the flight calculations module if it exists
  if (flightCalculationsRef.current) {
    flightCalculationsRef.current.updateConfig(updatedSettings);
    
    // If we have waypoints and a route, recalculate with new settings
    if (waypoints.length >= 2) {
      const coordinates = waypoints.map(wp => wp.coords);
      calculateRouteStats(coordinates);
    }
  }
};

// Modify calculateRouteStats to use the settings object
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
  
  // Update with current settings
  flightCalculationsRef.current.updateConfig(settings);
  
  // Create aircraft data
  let aircraftData;
  
  if (selectedAircraft) {
    aircraftData = {
      cruiseSpeed: selectedAircraft.cruiseSpeed || selectedAircraft.cruseSpeed || 145,
      fuelBurn: selectedAircraft.fuelBurn || 1100,
      maxFuelCapacity: selectedAircraft.maxFuel || 5000,
      dryOperatingWeightLbs: selectedAircraft.dryOperatingWeightLbs || 15000,
      usefulLoad: selectedAircraft.usefulLoad || 7000,
      maxPassengers: selectedAircraft.maxPassengers || 19,
      ...selectedAircraft
    };
  } else {
    aircraftData = {
      cruiseSpeed: 145,
      fuelBurn: 1100,
      maxFuelCapacity: 5000,
      dryOperatingWeightLbs: 15000,
      usefulLoad: 7000,
      maxPassengers: 19
    };
  }
  
  // Calculate stats
  const result = flightCalculationsRef.current.calculateFlightStats(coordinates, aircraftData, { payloadWeight });
  
  return result;
};

// In the RightPanel component props, replace individual handlers with handleSettingsChange
<RightPanel
  // ...other props
  settings={settings}
  onSettingsChange={handleSettingsChange}
  // ...other props
/>

// In the RouteStatsCard component props, use settings instead of individual props
<RouteStatsCard
  routeStats={routeStats}
  selectedAircraft={selectedAircraft}
  waypoints={waypoints}
  settings={settings}
/>
