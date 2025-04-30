# Fixing the Flight Calculations Issue

## Problem Identified:
- Two separate calculation paths are being used
- The AW139 details (12 seats) aren't being properly used in calculations
- We're getting mixed numbers from different calculation sources

## Solution:

### 1. Fix the calculateRouteStats function

The main issue is in the `calculateRouteStats` function. We need to modify it to ONLY use the FlightCalculations module and not do any calculations on its own.

1. First, find the `calculateRouteStats` function (around line 780)
2. Replace the entire function with this simplified version that delegates ALL calculations to the FlightCalculations module:

```javascript
const calculateRouteStats = (coordinates) => {
  if (!coordinates || coordinates.length < 2) {
    setRouteStats(null);
    return null;
  }
  
  // Ensure flight calculator is initialized
  if (!flightCalculationsRef.current) {
    flightCalculationsRef.current = new FlightCalculations();
    
    // Update with current settings
    flightCalculationsRef.current.updateConfig({
      passengerWeight,
      reserveFuel,
      deckTimePerStop,
      deckFuelFlow,
      taxiFuel,
      contingencyFuelPercent,
      payloadWeight
    });
  }
  
  // Get aircraft data
  let aircraftData = selectedAircraft;
  
  // If no aircraft is selected, get default data
  if (!aircraftData && aircraftType && routeCalculatorRef.current) {
    const defaultAircraft = routeCalculatorRef.current.getAircraftType(aircraftType.toLowerCase());
    aircraftData = defaultAircraft;
  }
  
  // Log what we're using for calculations
  console.log("Using aircraft for calculations:", aircraftData?.registration || "default aircraft", 
              "with max passengers:", aircraftData?.maxPassengers || "unknown");
  
  // Simply delegate ALL calculation to the FlightCalculations module
  const stats = flightCalculationsRef.current.calculateFlightStats(
    coordinates, 
    aircraftData || {}, // Pass the actual aircraft data
    { 
      payloadWeight: payloadWeight + cargoWeight
    }
  );
  
  // Update route stats state
  setRouteStats(stats);
  window.currentRouteStats = stats;
  
  return stats;
};
```

### 2. Make sure the aircraft data is being passed correctly

Check the aircraft selection logic to ensure we're correctly setting the `selectedAircraft` state:

1. Find where the aircraft is selected (where `setSelectedAircraft` is called)
2. Add debug logging to see what aircraft data is being selected:

```javascript
// After selecting an aircraft
console.log("Selected aircraft:", {
  registration: aircraft.registration,
  modelType: aircraft.modelType,
  maxPassengers: aircraft.maxPassengers,
  cruiseSpeed: aircraft.cruiseSpeed || aircraft.cruseSpeed
});
setSelectedAircraft(aircraft);
```

### 3. Check the RouteStatsCard component

Make sure the RouteStatsCard is using the correct stats from our calculations:

1. Find the RouteStatsCard component rendering
2. Make sure it's using all fields from the routeStats object correctly

These changes will ensure we're only using one calculation source (the FlightCalculations module) and that we're passing the correct aircraft data to it.
