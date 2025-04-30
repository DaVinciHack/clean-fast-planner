# Flight Calculations Fix Patch

This patch fixes the issue with flight settings not being properly synchronized with the flight calculations module.

## Steps to Apply the Fix

1. Make sure you've backed up the original file (we've already created a backup at `ModularFastPlannerComponent.jsx.backup_before_fix`)

2. We already replaced the `FlightCalculations.js` file with our fixed version

3. Now, you need to make three main changes to the `ModularFastPlannerComponent.jsx` file:

   A. Add the new unified flight settings handlers
   B. Replace the `calculateRouteStats` function 
   C. Add a new `useEffect` hook for syncing flight settings

## Additions and Replacements

### A. Add these handler functions after the state declarations (around line 120)

```javascript
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
```

### B. Replace the calculateRouteStats function (around line 777)

Find the `const calculateRouteStats = (coordinates) => {` function and replace it with:

```javascript
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
```

### C. Add this useEffect hook after the flight calculations initialization useEffect (around line 770)

```javascript
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
```

## After Making Changes

After applying these changes, the flight settings should be properly synchronized with the calculations, and the fuel calculations will accurately reflect the settings specified in the UI.