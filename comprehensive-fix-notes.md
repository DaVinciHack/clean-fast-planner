# Comprehensive Fix Notes for Fuel Calculation Issues

## Problem Diagnosis

1. The fuel calculation updates are working in the `FlightCalculations.js` module, but the changes in the UI (like deck time, reserve fuel, etc.) aren't being properly connected to the calculation module.

2. The `RouteStatsCard` component isn't consistently using the values from the calculation module. It sometimes calculates values on its own rather than using pre-calculated values.

## Key Areas Fixed

1. **RouteStatsCard.jsx**:
   - Updated to prioritize using the values directly from the `routeStats` object
   - Added debug logging to track the data being passed
   - Fixed `totalDeckTime`, `totalDeckFuel`, and `totalFuel` calculations
   - Updated `calculateMaxPassengers` to use `calculatedPassengers` from flight calculations

2. In `ModularFastPlannerComponent.jsx`, the following handlers need updating:
   - `handleReserveFuelChange`
   - `handleDeckTimeChange`
   - `handleDeckFuelChange`
   - `handleDeckFuelFlowChange`
   - `handleTaxiFuelChange`
   - `handleContingencyFuelPercentChange`
   - `handlePassengerWeightChange`
   - `handleCargoWeightChange`

   Each of these handlers should:
   1. Update the state variable
   2. Directly update the `flightCalculationsRef.current` module with the new value
   3. Recalculate the route stats
   4. Force an update of the route display

3. **Next Steps**:
   - If you notice that a specific setting is not properly updating the calculation, check its handler
   - Ensure that all handlers are calling `flightCalculationsRef.current.updateConfig` with the updated value
   - Check that the `calculateRouteStats` function is passing all settings to the `FlightCalculations` module

## Example Implementation for `handleReserveFuelChange`

```javascript
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
```

## Example Implementation for `calculateRouteStats`

Ensure it's properly passing all settings to the FlightCalculations module:

```javascript
// Update with ALL current settings
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
```
