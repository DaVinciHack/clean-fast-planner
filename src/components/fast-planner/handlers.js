/**
 * Unified function to handle flight settings changes
 * Updates both individual state variables and the flight calculations module
 */
const handleFlightSettingChange = (settingName, value) => {
  console.log(`Updating flight setting: ${settingName} = ${value}`);
  
  // Update individual state variables (for backward compatibility)
  switch (settingName) {
    case 'passengerWeight':
      setPassengerWeight(value);
      break;
    case 'reserveFuel':
      setReserveFuel(value);
      break;
    case 'deckTimePerStop':
      setDeckTimePerStop(value);
      break;
    case 'deckFuelFlow':
      setDeckFuelFlow(value);
      break;
    case 'taxiFuel':
      setTaxiFuel(value);
      break;
    case 'contingencyFuelPercent':
      setContingencyFuelPercent(value);
      break;
    default:
      console.warn(`Unknown setting: ${settingName}`);
      break;
  }
  
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
    console.log(`Updated FlightCalculations module with ${settingName}: ${value}`);
  }
  
  // Recalculate route stats if a route exists
  const wps = waypointManagerRef.current?.getWaypoints() || [];
  if (wps.length >= 2) {
    console.log(`Recalculating route with updated ${settingName}`);
    const coordinates = wps.map(wp => wp.coords);
    calculateRouteStats(coordinates);
  }
};

// Update the existing handler functions to use the unified handler
const handlePassengerWeightChange = (weight) => {
  handleFlightSettingChange('passengerWeight', weight);
};

const handleReserveFuelChange = (fuel) => {
  handleFlightSettingChange('reserveFuel', fuel);
};

const handleDeckTimeChange = (time) => {
  handleFlightSettingChange('deckTimePerStop', time);
};

const handleDeckFuelFlowChange = (fuelFlow) => {
  handleFlightSettingChange('deckFuelFlow', fuelFlow);
};

const handleTaxiFuelChange = (fuel) => {
  handleFlightSettingChange('taxiFuel', fuel);
};

const handleContingencyFuelPercentChange = (percent) => {
  handleFlightSettingChange('contingencyFuelPercent', percent);
};

// This function should be called when using the calculateRouteStats function
// to ensure the most current settings are used
const syncFlightCalculator = () => {
  if (flightCalculationsRef.current) {
    flightCalculationsRef.current.updateConfig({
      passengerWeight,
      reserveFuel,
      deckTimePerStop,
      deckFuelFlow,
      taxiFuel,
      contingencyFuelPercent
    });
    console.log("Synchronized all flight settings with calculator");
  }
};