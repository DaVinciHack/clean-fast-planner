# Weather-Based Fuel Calculation System

## Overview

This enhanced fuel calculation system integrates weather-based fuel requirements with the existing Fast Planner fuel calculations. It uses the same logic as Palantir's fuel system to determine ARA (Additional Reserve Allowance) and approach fuel requirements based on weather segment rankings.

## Key Features

### 1. Weather-Aware Fuel Calculations
- **ARA Fuel**: Automatically added for rigs when weather ranking2 = 8 or 5
- **Approach Fuel**: Automatically added for airports when weather ranking2 = 10 or 5
- **Live Updates**: Fuel recalculates when routes or weather conditions change
- **Palantir Consistency**: Uses identical logic to Palantir's fuel calculation system

### 2. Manual Override Capability
- **Manual Mode**: Complete pilot control when weather APIs fail
- **Validation**: Input validation with safety checks
- **Fallback**: Ensures application remains usable without weather data

### 3. Palantir Integration
- **Fuel Comparison**: Compare calculated fuel with imported Palantir fuel
- **Discrepancy Detection**: Identify and investigate fuel differences
- **Import Support**: Import fuel data from Palantir for comparison

## Architecture

### Core Components

1. **WeatherFuelAnalyzer**: Analyzes weather segments using Palantir's logic
2. **ManualFuelOverride**: Provides manual fuel override capabilities
3. **EnhancedFuelManager**: Integrates weather analysis with existing fuel system

### Integration Flow

```
Weather Segments (from Palantir)
        ↓
WeatherFuelAnalyzer
        ↓
ARA/Approach Fuel Determination
        ↓
EnhancedFuelManager
        ↓
Combined with Existing Fuel Calculations
        ↓
Live Fuel Display with Weather Adjustments
```

## Usage Examples

### Basic Weather Integration
```javascript
import enhancedFuelManager from './modules/fuel';

// Set weather segments from Palantir
enhancedFuelManager.setWeatherSegments(weatherSegments);

// Set aircraft and route
enhancedFuelManager.setAircraft(selectedAircraft);
enhancedFuelManager.setWaypoints(routeWaypoints);

// Get enhanced results with weather-based fuel
const results = enhancedFuelManager.getEnhancedResults();
```

### Manual Fuel Mode
```javascript
// When weather APIs fail
enhancedFuelManager.enableManualFuelMode({
  araFuel: 200,        // Manual ARA fuel
  approachFuel: 200,   // Manual approach fuel
  taxiFuel: 50,        // Manual taxi fuel
  reserveFuel: 500     // Manual reserve fuel
});
```

### Palantir Comparison
```javascript
// Import fuel data from Palantir
enhancedFuelManager.setPalantirFuel(importedFuelData);

// Check for discrepancies
const comparison = enhancedFuelManager.getPalantirComparison();
if (!comparison.matches) {
  console.warn("Fuel discrepancy detected:", comparison.discrepancies);
}
```

## Weather Ranking Logic

The system uses Palantir's weather ranking logic:

### ARA Fuel (for Rigs)
- **Triggered when**: Weather segment `ranking2 === 8` or `ranking2 === 5`
- **Amount**: Configurable per policy (default: 200 lbs per rig)
- **Applied to**: Each rig requiring ARA fuel

### Approach Fuel (for Airports)  
- **Triggered when**: Weather segment `ranking2 === 10` or `ranking2 === 5`
- **Amount**: Configurable per policy (default: 200 lbs per airport)
- **Applied to**: Each airport requiring approach fuel

## Implementation Benefits

### 1. Aviation Safety
- **No Shortcuts**: Proper fuel calculations using real weather data
- **Palantir Consistency**: Same logic as production Palantir system
- **Manual Fallback**: Always usable even if weather APIs fail

### 2. Live Updates
- **Dynamic Recalculation**: Fuel updates when routes change
- **Weather Integration**: Responds to weather updates automatically
- **Real-time Display**: Shows current fuel requirements

### 3. Pilot Control
- **Manual Override**: Complete control when needed
- **Comparison**: Compare with Palantir calculations
- **Validation**: Built-in safety checks and warnings

## Integration with Fast Planner

The enhanced fuel system integrates seamlessly with the existing Fast Planner:

1. **Drop-in Replacement**: Uses same interface as existing FuelCalculationManager
2. **Backward Compatible**: Works with existing fuel display components
3. **Enhanced Results**: Adds weather analysis without breaking existing functionality

## Configuration

### Weather Fuel Defaults
```javascript
const weatherFuelConfig = {
  araFuelDefault: 200,     // lbs per rig requiring ARA
  approachFuelDefault: 200 // lbs per airport requiring approach fuel
};
```

### Manual Fuel Fields
- Taxi Fuel (0-200 lbs)
- Contingency Fuel (5-20% of trip fuel)
- Reserve Fuel (200-1000 lbs) 
- ARA Fuel (0-500 lbs)
- Approach Fuel (0-500 lbs)
- Deck Fuel per Stop (50-300 lbs)
- Passenger Weight (180-250 lbs)

## Next Steps

1. **Test Integration**: Test with real weather data from Palantir
2. **UI Components**: Create UI components for manual fuel override
3. **Validation**: Compare results with Palantir fuel calculations
4. **Documentation**: Document specific fuel policies and their values

This system ensures pilots always have accurate fuel calculations while maintaining the flexibility and safety required for helicopter operations in challenging weather conditions.