# Fuel Stop Optimization Module

A standalone module for optimizing fuel stops to maximize passenger capacity in the FastPlanner application.

## Overview

This module automatically detects when required passengers exceed aircraft capacity and suggests optimal fuel stops along the route. It maintains aviation safety standards by using only real platform fuel capability data and proper flight planning principles.

## Key Features

- **Automatic Detection**: Triggers when required passengers > available passengers
- **Corridor Search**: Finds fuel-capable platforms within 10nm of route
- **Smart Optimization**: Balances passenger gain vs route deviation
- **Aviation Safety**: No dummy data - only verified fuel capabilities
- **Route Preservation**: Adds fuel stops without changing existing destinations
- **Split Point Aware**: Considers alternate route requirements for IFR flights

## Module Structure

```
/optimization/
├── FuelStopOptimizer.js           # Main optimization engine
├── CorridorSearcher.js            # Route corridor geometry
├── PlatformEvaluator.js           # Platform assessment & search
├── OptimizationScorer.js          # Scoring and ranking logic
├── FuelStopOptimizationManager.js # High-level orchestration
├── FuelStopSuggestionUI.js        # React UI components
├── useFuelStopOptimization.js     # React integration hook
└── index.js                       # Module exports
```

## Quick Integration

### 1. Basic Usage with React Hook

```javascript
import { useFuelStopOptimization } from '../hooks/useFuelStopOptimization';
import { FuelStopSuggestionUI, FuelStopNotification } from '../modules/optimization';

const MyFlightComponent = () => {
  const {
    suggestions,
    showSuggestionModal,
    showNotification,
    acceptSuggestion,
    dismissSuggestions,
    showDetailsModal
  } = useFuelStopOptimization(flightConfiguration, {
    autoTrigger: true,
    onRouteModified: (waypoint, insertIndex) => {
      // Your route modification logic here
      return waypointManager.addWaypoint(waypoint, insertIndex);
    }
  });

  return (
    <>
      {/* Your existing component */}
      
      {/* Fuel stop notification */}
      <FuelStopNotification
        suggestion={suggestions?.suggestions?.[0]}
        onViewDetails={showDetailsModal}
        onDismiss={dismissSuggestions}
        isVisible={showNotification}
      />
      
      {/* Fuel stop suggestion modal */}
      <FuelStopSuggestionUI
        suggestions={suggestions?.suggestions || []}
        overloadAnalysis={suggestions?.overloadAnalysis}
        onAcceptSuggestion={acceptSuggestion}
        onDismiss={dismissSuggestions}
        isVisible={showSuggestionModal}
      />
    </>
  );
};
```

### 2. Manual Integration

```javascript
import { FuelStopOptimizationManager } from '../modules/optimization';

const optimizationManager = new FuelStopOptimizationManager();

// Set up callbacks
optimizationManager.setCallbacks({
  onSuggestionsReady: (suggestions) => {
    console.log('Fuel stop suggestions:', suggestions);
    // Show UI with suggestions
  },
  onError: (error) => {
    console.error('Optimization error:', error);
  }
});

// Trigger optimization
const result = await optimizationManager.checkAndOptimize({
  selectedAircraft,
  waypoints,
  stopCards,
  requiredPassengers: 15,
  availablePlatforms: platformManager.getAllPlatforms(),
  alternateRouteData
});
```

## Configuration Requirements

The module requires the following flight configuration data:

```javascript
const flightConfiguration = {
  // Required
  selectedAircraft: { /* aircraft object */ },
  waypoints: [ /* waypoint array */ ],
  stopCards: [ /* calculated stop cards */ ],
  requiredPassengers: 15,
  
  // Platform data (at least one source)
  availablePlatforms: [ /* platform array */ ],
  platformManager: { /* platform manager instance */ },
  
  // Optional
  alternateRouteData: { splitPoint: '...' },
  flightSettings: { /* flight settings */ },
  settings: { autoOptimizeFuelStops: true }
};
```

## Algorithm Logic

### 1. Detection Phase
- Compares required passengers vs available passengers on each leg
- Identifies the problematic leg (usually first leg with most fuel)
- Calculates passenger shortage amount

### 2. Search Phase
- Creates 10nm-wide corridor from departure toward split point/destination
- Searches all location objects for fuel-capable rigs
- Filters by operational status and fuel availability

### 3. Optimization Phase
- Scores each platform based on:
  - Route deviation (minimize)
  - Distance from split point (closer is better)
  - Passenger capacity improvement
  - Fuel efficiency
- Returns top 2 suggestions

### 4. Implementation Phase
- Presents suggestions to user with clear benefits
- Allows user to accept or dismiss
- Inserts fuel stop waypoint at optimal route position

## Aviation Safety Standards

- ✅ Only uses real platform fuel capability data
- ✅ No dummy or fallback data that could mislead pilots
- ✅ Maintains minimum fuel reserves at all times
- ✅ Respects aircraft fuel capacity limits
- ✅ Considers alternate route requirements
- ✅ Validates operational status of fuel platforms

## Integration Points

### EnhancedStopCardsContainer
Add to passenger calculation logic:
```javascript
const { suggestions, showNotification } = useFuelStopOptimization({
  selectedAircraft,
  waypoints,
  stopCards: displayStopCards,
  requiredPassengers,
  availablePlatforms: /* get from platform manager */
});
```

### WaypointManager
Implement route modification:
```javascript
const addFuelStopWaypoint = (waypoint, insertIndex) => {
  return waypointManager.addWaypoint({
    ...waypoint,
    refuelStop: true,
    autoInserted: true
  }, insertIndex);
};
```

## User Experience Flow

1. **Detection**: User enters route with high passenger requirement
2. **Analysis**: System detects passenger overload automatically
3. **Notification**: Small notification appears: "Fuel stop suggested to carry +3 passengers"
4. **Details**: User clicks "View Details" to see options
5. **Selection**: User chooses between 1-2 fuel stop options
6. **Confirmation**: "Add to Route" inserts the fuel stop
7. **Result**: Route updated with fuel stop, passenger capacity increased

## Testing

The module includes comprehensive console logging for debugging:
- Passenger overload detection
- Platform search results
- Optimization scoring
- Route modification status

Enable with: `console.log` statements throughout codebase.

## Performance

- Lightweight: Only processes when passenger overload detected
- Efficient: Uses existing platform data without additional API calls
- Non-blocking: Async processing with loading indicators
- Cached: Avoids re-processing identical configurations