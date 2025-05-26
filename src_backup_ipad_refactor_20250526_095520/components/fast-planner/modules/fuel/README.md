# Fuel Calculation Module

## Overview
The fuel calculation module provides functionality for calculating fuel requirements and passenger capacity for flight routes. It considers various factors including aircraft performance, route distances, and operational requirements.

## Directory Structure
- `FuelCalculationManager.js` - Main coordination class
- `TripFuelCalculator.js` - Handles per-leg fuel calculations
- `AuxiliaryFuelCalculator.js` - Handles taxi, contingency, reserve, etc.
- `index.js` - Exports all calculation modules and a default manager instance

## UI Components
UI components are located in `/src/components/fast-planner/components/fuel/`:
- `FuelDisplayComponent.jsx` - Main display component for fuel data
- `LegFuelCard.jsx` - Component for individual leg fuel displays
- `FuelCalculationTester.jsx` - Test component for development
- `FuelStyles.css` - Styles for fuel components

## Context Integration
- `FuelContext.jsx` - React context for application-wide access

## Usage Example

### Basic Usage
```javascript
import fuelManager from './modules/fuel';

// Set aircraft
fuelManager.setAircraft({
  id: 'test-s92',
  type: 'S92',
  registration: 'LN-OPU',
  emptyWeight: 16300, // lbs
  maxTakeoffWeight: 26500, // lbs
  maxFuel: 5500, // lbs
  maxPayload: 5200, // lbs
  cruiseFuelFlow: 1500, // lbs/hr
  cruiseSpeed: 145, // knots
});

// Set waypoints
fuelManager.setWaypoints([
  { name: 'ENZV', coords: [5.2505, 60.4034], type: 'airport' },
  { name: 'ENLE', coords: [5.0623, 61.1056], type: 'rig' },
  { name: 'ENCN', coords: [6.3388, 62.7443], type: 'airport' },
  { name: 'ENZV', coords: [5.2505, 60.4034], type: 'airport' }
]);

// Update settings if needed
fuelManager.updateSettings({
  taxiFuel: 50,
  contingencyFuelPercent: 10,
  reserveMethod: 'fixed',
  reserveFuel: 500,
  deckTimePerStop: 5,
  deckFuelFlow: 400,
  passengerWeight: 220
});

// Calculate fuel requirements
const results = fuelManager.calculateFuelRequirements();

// Get maximum passenger capacity
const maxCapacity = fuelManager.getMaximumPassengerCapacity();
```

### Using the Context
```jsx
import { useFuel } from '../context/FuelContext';

function MyComponent() {
  const { 
    fuelResults, 
    passengerCapacity, 
    maxCapacity, 
    setAircraft, 
    setWaypoints 
  } = useFuel();
  
  // Use fuel data in your component
  return (
    <div>
      <h3>Maximum Passengers: {maxCapacity?.maxPassengers || 0}</h3>
      <h3>Required Fuel: {maxCapacity?.requiredFuel || 0} lbs</h3>
    </div>
  );
}
```

## Key Features

### Fuel Calculation
The module calculates the following fuel components:
- Trip fuel based on distance, time, and aircraft fuel flow
- Taxi fuel for ground operations
- Contingency fuel (percentage of trip fuel)
- Reserve fuel (fixed amount or percentage)
- Deck fuel for helicopter operations at rigs/platforms
- Total fuel requirements per leg and at each waypoint

### Passenger Capacity
The module calculates passenger capacity based on:
- Aircraft limitations (MTOW, empty weight, etc.)
- Required fuel at each stop
- Passenger weight setting

### Modular Design
The module follows a modular design with separation of concerns:
- `FuelCalculationManager` - Coordinates all calculations
- `TripFuelCalculator` - Handles trip fuel calculations
- `AuxiliaryFuelCalculator` - Handles auxiliary fuel calculations

## Future Enhancements
- Integration with weather data for wind effect calculations
- Performance calculations based on temperature and pressure
- S92 dropdown calculations based on deck height and weather
- More sophisticated alternate fuel planning