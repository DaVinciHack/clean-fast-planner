# Enhanced Fuel Calculator Integration Guide

## Overview

The Enhanced Fuel Calculator provides advanced fuel calculation functionality for the Fast Planner application. It improves upon the existing functionality with:

1. More accurate per-leg calculations with wind effects
2. Detailed fuel breakdown by stop
3. Maximum passenger capacity calculations
4. Zero fallback values - all calculations require actual aircraft data

## Files Structure

```
src/components/fast-planner/modules/calculations/fuel/
├── EnhancedFuelCalculator.js    - Core calculator module
├── FuelIntegration.js           - Integration with existing code
├── index.js                     - Export module and default instance
└── INTEGRATION_GUIDE.md         - This document

src/components/fast-planner/components/fuel/
├── EnhancedFuelDisplay.jsx      - UI component for fuel display
├── FuelStyles.css               - Styles for fuel components
└── index.js                     - Export UI components
```

## Integration Steps

Here's how to integrate the enhanced fuel calculator into the FastPlannerApp:

### 1. Import the Required Modules

Add these imports to your FastPlannerApp.jsx file:

```jsx
// Import enhanced fuel calculator modules
import enhancedFuelCalculator from './modules/calculations/fuel';
import FuelIntegration from './modules/calculations/fuel/FuelIntegration';
import { EnhancedFuelDisplay } from './components/fuel';
```

### 2. Initialize the Calculator

Add this to your initialization code or in a useEffect hook:

```jsx
// Initialize enhanced fuel calculator with settings
useEffect(() => {
  if (flightSettings) {
    FuelIntegration.initializeFuelCalculator({
      passengerWeight,
      taxiFuel,
      contingencyFuelPercent,
      reserveFuel,
      deckTimePerStop,
      deckFuelFlow
    });
  }
}, [passengerWeight, taxiFuel, contingencyFuelPercent, reserveFuel, deckTimePerStop, deckFuelFlow]);
```

### 3. Update the Route Calculation Logic

Modify your route calculation code to use the enhanced fuel calculator:

```jsx
// Calculate route statistics with enhanced fuel calculator
if (selectedAircraft && coordinates.length >= 2) {
  // First use existing route calculator for basic calculations
  const basicResults = routeCalculatorRef.current.calculateRouteStats(coordinates, {
    selectedAircraft,
    payloadWeight: cargoWeight || 0,
    reserveFuel,
    weather
  });
  
  // Then calculate enhanced fuel data
  const enhancedResults = FuelIntegration.calculateFuelRequirements(
    waypoints,
    selectedAircraft,
    weather,
    {
      passengerWeight,
      taxiFuel,
      contingencyFuelPercent,
      reserveFuel,
      deckTimePerStop,
      deckFuelFlow,
      cargoWeight
    }
  );
  
  // Combine results
  if (enhancedResults) {
    // The integration function already converts the format to match existing code
    setRouteStats(enhancedResults);
  } else {
    // Fall back to basic results if enhanced calculation fails
    setRouteStats(basicResults);
  }
}
```

### 4. Update Stop Cards Generation

Update your stop cards generation to use enhanced fuel data if available:

```jsx
// Generate stop cards with the new stats
let newStopCards;

// Check if we have enhanced results
if (calcResults.enhancedResults) {
  // Use the enhanced results directly
  newStopCards = calcResults.enhancedResults.fuelByStop.map(stop => ({
    index: stop.index,
    id: stop.waypoint,
    stopName: stop.waypoint,
    legDistance: stop.leg ? stop.leg.distance.toFixed(1) : '0.0',
    totalDistance: stop.index === 0 ? '0.0' : calcResults.totalDistance,
    legTime: stop.leg ? stop.leg.flightTimeHours : 0,
    totalTime: stop.index === 0 ? 0 : calcResults.totalTimeHours,
    legFuel: stop.leg ? stop.leg.fuelRequired : 0,
    totalFuel: stop.requiredFuel,
    maxPassengers: stop.maxPassengers,
    groundSpeed: stop.leg ? stop.leg.groundSpeed : 0,
    headwind: stop.leg ? stop.leg.windEffect : 0,
    deckTime: (calcResults.enhancedResults.auxiliaryFuel.deckTimePerStop * 
               calcResults.enhancedResults.auxiliaryFuel.intermediateStops),
    deckFuel: calcResults.enhancedResults.auxiliaryFuel.deckFuel
  }));
} else {
  // Fall back to existing stop cards generation
  newStopCards = generateStopCardsData(updatedWaypoints, calcResults, selectedAircraft, weather);
}

setStopCards(newStopCards);
```

### 5. Add the Enhanced Fuel Display Component

Replace or enhance your existing fuel display with the EnhancedFuelDisplay component:

```jsx
{/* Enhanced fuel display */}
{routeStats && routeStats.enhancedResults && (
  <EnhancedFuelDisplay
    fuelData={routeStats}
    selectedAircraft={selectedAircraft}
    onAdjustFuel={() => {/* handle fuel adjustment */}}
    onChangeAlternate={() => {/* handle alternate change */}}
  />
)}
```

## Important Safety Notes

1. **NEVER use fallback data**: The enhanced calculator will return `null` if any required aircraft data is missing. Always check for null results and display an error message rather than using fallback values.

2. **Validate aircraft data**: Ensure the aircraft object has all required properties (cruiseSpeed, fuelBurn, emptyWeight, maxTakeoffWeight, maxFuel) before passing it to the calculator.

3. **Validate calculations**: Log and verify the calculation results during testing to ensure they match expected values.

4. **Clear calculations when data changes**: Always recalculate when aircraft, waypoints, or settings change to ensure we're using the most current data.

5. **Display validation errors**: If calculation fails, display an error message to the user explaining what data is missing.

## Testing

You can test the enhanced fuel calculator independently by using the following code:

```javascript
// Import the calculator
import enhancedFuelCalculator from './modules/calculations/fuel';

// Test with sample data
const testResults = enhancedFuelCalculator.calculateFuelRequirements({
  waypoints: [/* array of waypoints */],
  aircraft: {/* aircraft object */},
  weather: {/* weather object */},
  cargoWeight: 0
});

// Log the results
console.log('Enhanced fuel calculation results:', testResults);
```

## Notes for Future Enhancements

1. **Performance Calculations**: The enhanced fuel calculator is designed to be extended with performance calculations, such as the S92 dropdown calculator.

2. **Weather Integration**: For more accurate calculations, consider integrating with a weather service to get real-time weather data along the route.

3. **Alternate Airport Logic**: Future versions could include dedicated alternate airport fuel calculations.

4. **Fuel Planning Optimization**: Add functionality to optimize fuel planning for maximum passenger capacity or maximum range.