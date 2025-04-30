# How to Fix Fuel Calculation Issues

We've fixed part of the fuel calculation problem by updating the `FlightSettings.jsx` component, but there are additional fixes needed to fully resolve the issue.

## Updated Components

1. ✅ **FlightSettings.jsx**: This component has been updated with improved change handling and a new "Update Calculations" button.

2. ✅ **RouteStatsCard.jsx**: This component has been updated to properly display values from the FlightCalculations module.

## Remaining Manual Fixes Needed

The remaining issues are in the `ModularFastPlannerComponent.jsx` file, which needs two specific sections updated:

### 1. Update the FlightCalculations useEffect Hook

Find this code section:
```javascript
// Initialize the flight calculations module
useEffect(() => {
  if (!flightCalculationsRef.current) {
    flightCalculationsRef.current = new FlightCalculations();
    
    // Set callback to receive calculation results
    flightCalculationsRef.current.setCallback('onCalculationComplete', (result) => {
      console.log('Flight calculations completed:', result);
    });
  }
  
  // Update the configuration when relevant state changes
  if (flightCalculationsRef.current) {
    flightCalculationsRef.current.updateConfig({
      passengerWeight,
      reserveFuel,
      deckTimePerStop,
      deckFuelFlow,
      taxiFuel,
      contingencyFuelPercent
    });
  }
}, [passengerWeight, reserveFuel, deckTimePerStop, deckFuelPerStop, deckFuelFlow, taxiFuel, contingencyFuelPercent]);
```

Replace it with this improved version:
```javascript
// Initialize the flight calculations module
useEffect(() => {
  if (!flightCalculationsRef.current) {
    flightCalculationsRef.current = new FlightCalculations();
    
    // Set up callback to receive calculation results
    flightCalculationsRef.current.setCallback('onCalculationComplete', (result) => {
      console.log('Flight calculations completed:', result);
      setRouteStats(result);
    });
  }
  
  // Update the configuration when relevant state changes
  if (flightCalculationsRef.current) {
    flightCalculationsRef.current.updateConfig({
      passengerWeight,
      reserveFuel,
      deckTimePerStop,
      deckFuelFlow,
      taxiFuel,
      contingencyFuelPercent
    });
    
    console.log('Updated FlightCalculations config:', {
      passengerWeight,
      reserveFuel,
      deckTimePerStop,
      deckFuelFlow,
      taxiFuel,
      contingencyFuelPercent
    });
    
    // Trigger a recalculation if we have a route
    const wps = waypointManagerRef.current?.getWaypoints() || [];
    if (wps.length >= 2) {
      console.log('Recalculating route after settings change');
      const coordinates = wps.map(wp => wp.coords);
      
      // Schedule the recalculation to happen after the state update
      setTimeout(() => {
        calculateRouteStats(coordinates);
      }, 0);
    }
  }
}, [passengerWeight, reserveFuel, deckTimePerStop, deckFuelFlow, taxiFuel, contingencyFuelPercent]);
```

### 2. Update the calculateRouteStats Function

Find the `calculateRouteStats` function and replace it with this improved version:
```javascript
// Calculate route statistics using our enhanced module
const calculateRouteStats = (coordinates, aircraft = null) => {
  console.log('calculateRouteStats called with', { 
    coordinates: coordinates?.length, 
    aircraft: aircraft?.registration 
  });
  
  if (!coordinates || coordinates.length < 2) {
    setRouteStats(null);
    return null;
  }
  
  // Ensure flight calculator is initialized
  if (!flightCalculationsRef.current) {
    flightCalculationsRef.current = new FlightCalculations();
    
    // Initialize with current settings
    flightCalculationsRef.current.updateConfig({
      passengerWeight,
      reserveFuel,
      deckTimePerStop,
      deckFuelFlow,
      taxiFuel,
      contingencyFuelPercent
    });
    
    console.log('Initialized FlightCalculations with settings:', {
      passengerWeight,
      reserveFuel,
      deckTimePerStop,
      deckFuelFlow,
      taxiFuel,
      contingencyFuelPercent
    });
    
    // Set up callback to receive calculation results
    flightCalculationsRef.current.setCallback('onCalculationComplete', (result) => {
      console.log('Flight calculations callback triggered with result:', result);
      setRouteStats(result);
    });
  } else {
    // Always update with latest settings before calculation
    flightCalculationsRef.current.updateConfig({
      passengerWeight,
      reserveFuel,
      deckTimePerStop,
      deckFuelFlow,
      taxiFuel,
      contingencyFuelPercent
    });
    
    console.log('Updated FlightCalculations before calculation with settings:', {
      passengerWeight,
      reserveFuel,
      deckTimePerStop,
      deckFuelFlow,
      taxiFuel,
      contingencyFuelPercent
    });
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
  } else {
    // Fallback to basic defaults if no data source available
    aircraftData = {
      cruiseSpeed: 145,
      fuelBurn: 1100,
      maxFuelCapacity: 5000,
      dryOperatingWeightLbs: 15000,
      usefulLoad: 7000,
      maxPassengers: 19
    };
  }
  
  // Additional calculation parameters
  const params = {
    payloadWeight
    // Any other parameters can be added here
  };
  
  console.log('Performing calculation with:', {
    aircraft: aircraftData,
    waypoints: coordinates.length,
    params,
    calculationSettings: flightCalculationsRef.current.config
  });
  
  // Perform the calculation
  const result = flightCalculationsRef.current.calculateFlightStats(coordinates, aircraftData, params);
  
  // Update state with the result
  if (result) {
    console.log('Setting routeStats with calculation result:', result);
    setRouteStats(result);
  }
  
  // Return the result for use by the caller
  return result;
};
```

## Testing After Manual Fixes

After making these changes:

1. Refresh the application
2. Create a route with multiple waypoints
3. Go to the Settings tab and change values:
   - Deck Time (e.g., from 5 to 10 minutes)
   - Reserve Fuel (e.g., from 600 to 800 lbs)
   - Deck Fuel Flow (e.g., from 400 to 500 lbs/hr) 
4. Click the "Update Calculations" button
5. Return to the main tab to verify the top card shows updated values

## What Do These Fixes Do?

1. **Ensure Settings Update**: The fixes make sure that when you change settings, the FlightCalculations module is updated with the new values
2. **Trigger Recalculation**: When settings change, the route is automatically recalculated
3. **Consistent Display**: The top card now consistently uses values from the FlightCalculations module

## Temporary Workaround

Until you can apply the full fixes, you can:

1. Use the "Update Calculations" button in the Settings tab after changing values
2. Manually make a small change to the route (add/move a waypoint) after changing settings to trigger a recalculation
