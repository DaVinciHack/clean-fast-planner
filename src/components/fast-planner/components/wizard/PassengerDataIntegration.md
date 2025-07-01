# Passenger Data Integration with Fuel Optimization

## How the Wizard Passenger Data Flows to Fuel Optimization

### 1. Wizard Completion (FlightWizard.jsx)

When wizard completes, passenger data is passed to parent:

```javascript
onComplete({
  waypoints,
  aircraft: flightData.aircraft,
  departureTime: flightData.departureTime,
  passengers: flightData.passengers // Contains all passenger/weight data
});
```

### 2. FastPlannerApp.jsx Integration

In `FastPlannerApp.jsx`, update the wizard completion handler:

```javascript
const handleWizardComplete = (wizardData) => {
  console.log('Wizard completed with data:', wizardData);
  
  // Set waypoints
  if (wizardData.waypoints) {
    setWaypoints(wizardData.waypoints);
  }
  
  // Set aircraft
  if (wizardData.aircraft) {
    setSelectedAircraft(wizardData.aircraft);
  }
  
  // Set departure time
  if (wizardData.departureTime) {
    setDepartureTime(wizardData.departureTime);
  }
  
  // NEW: Set passenger data for fuel optimization
  if (wizardData.passengers && wizardData.passengers.enabled) {
    const passengerData = wizardData.passengers;
    
    // Extract passenger requirements for optimization
    const totalPassengers = Math.max(
      ...Object.values(passengerData.legData).map(leg => leg.passengerCount || 0)
    );
    
    // Set passenger requirements in app state
    setRequiredPassengers(totalPassengers); // NEW STATE VARIABLE
    setPassengerWeight(passengerData.standardWeight || 220);
    
    // Extract cargo weight (use maximum across legs)
    const maxCargoWeight = Math.max(
      ...Object.values(passengerData.legData).map(leg => leg.cargoWeight || 0)
    );
    setCargoWeight(maxCargoWeight);
    
    // Store detailed passenger data for fuel calculations
    setPassengerLegData(passengerData.legData); // NEW STATE VARIABLE
  }
  
  // Close wizard
  setShowWizard(false);
};
```

### 3. State Variables to Add in FastPlannerApp.jsx

Add these new state variables:

```javascript
// Existing state...
const [passengerWeight, setPassengerWeight] = useState(220);
const [cargoWeight, setCargoWeight] = useState(0);

// NEW: Add these for passenger optimization
const [requiredPassengers, setRequiredPassengers] = useState(0);
const [passengerLegData, setPassengerLegData] = useState({});
```

### 4. Pass Data to EnhancedStopCardsContainer

Update the props passed to `EnhancedStopCardsContainer`:

```javascript
<EnhancedStopCardsContainer
  // Existing props...
  passengerWeight={passengerWeight}
  cargoWeight={cargoWeight}
  
  // NEW: Add passenger optimization props
  requiredPassengers={requiredPassengers}
  passengerLegData={passengerLegData}
  
  // Other props...
/>
```

### 5. Fuel Optimization Trigger

In `EnhancedStopCardsContainer.jsx`, add the fuel optimization hook:

```javascript
import { useFuelStopOptimization } from '../hooks/useFuelStopOptimization';
import { FuelStopSuggestionUI, FuelStopNotification } from '../modules/optimization';

// Inside component:
const {
  suggestions,
  showSuggestionModal,
  showNotification,
  acceptSuggestion,
  dismissSuggestions,
  showDetailsModal
} = useFuelStopOptimization({
  selectedAircraft,
  waypoints,
  stopCards: displayStopCards,
  requiredPassengers, // From wizard
  availablePlatforms: /* get from platform manager */,
  alternateRouteData
}, {
  autoTrigger: true,
  onRouteModified: (waypoint, insertIndex) => {
    // Add fuel stop to route
    return waypointManager.addWaypoint(waypoint, insertIndex);
  }
});

// In the render:
return (
  <>
    {/* Existing stop cards */}
    
    {/* NEW: Fuel stop optimization UI */}
    <FuelStopNotification
      suggestion={suggestions?.suggestions?.[0]}
      onViewDetails={showDetailsModal}
      onDismiss={dismissSuggestions}
      isVisible={showNotification}
    />
    
    <FuelStopSuggestionUI
      suggestions={suggestions?.suggestions || []}
      overloadAnalysis={suggestions?.overloadAnalysis}
      onAcceptSuggestion={acceptSuggestion}
      onDismiss={dismissSuggestions}
      isVisible={showSuggestionModal}
    />
  </>
);
```

### 6. Complete User Journey

#### Step-by-Step User Experience:

1. **User starts wizard** → Clicks "Start Planning"
2. **Route setup** → Selects departure and landings
3. **Aircraft selection** → Chooses aircraft type and specific aircraft
4. **NEW: Passenger input** → 
   - "Will you be carrying passengers?"
   - If Yes: Shows each leg with passenger/weight inputs
   - "Departing Aberdeen: 15 passengers, 220 lbs each, 500 lbs cargo"
5. **Time selection** → Sets departure time
6. **Wizard completion** → Flight is created with passenger requirements

#### Automatic Optimization:

7. **Fuel calculation** → System calculates stop cards
8. **Overload detection** → Realizes 15 passengers > 12 available capacity
9. **Optimization trigger** → Fuel stop optimization runs automatically
10. **Suggestion popup** → "Add refuel at RIG-X to carry +3 passengers"
11. **User choice** → View details and add to route

### 7. Data Flow Diagram

```
Wizard Passenger Input
         ↓
FastPlannerApp State (requiredPassengers)
         ↓
EnhancedStopCardsContainer (stopCards calculation)
         ↓
Passenger Overload Detection (15 > 12)
         ↓
useFuelStopOptimization Hook
         ↓
FuelStopOptimizer Module
         ↓
Suggestion UI (Add RIG-X for +3 passengers)
         ↓
Route Modification (Insert fuel stop)
         ↓
Updated Flight Plan (Can now carry 15 passengers)
```

### 8. Testing the Integration

To test the complete flow:

1. Start wizard and create a route with multiple stops
2. Select an aircraft (e.g., S76 with 12 max passengers)
3. In passenger step, enter 15 passengers for first leg
4. Complete wizard
5. Watch for automatic fuel stop suggestion popup
6. Accept suggestion and see fuel stop added to route

The system will now provide intelligent fuel stop recommendations based on actual passenger requirements from the wizard! 🛩️