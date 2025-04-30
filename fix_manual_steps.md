# Manual Steps to Fix Flight Calculations

Follow these steps carefully to fix the flight calculations issue:

## 1. Update the FlightCalculations.js file

```bash
cp /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/modules/calculations/FlightCalculations.fix.js /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/modules/calculations/FlightCalculations.js
```

## 2. Fix the Handler Functions in ModularFastPlannerComponent.jsx

Open the file in a text editor:

```
/Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx
```

### 2.1 Add the handleFlightSettingChange function (after line ~82)

Add this after `const [reserveMethod, setReserveMethod] = useState('fixed');`:

```javascript
  /**
   * This function handles all flight settings changes
   * It updates the individual state variable, the flightSettings object,
   * and the flight calculations module
   */
  const handleFlightSettingChange = (settingName, value) => {
    console.log(`Updating flight setting: ${settingName} = ${value}`);
    
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
    }
  };

  const handlePassengerWeightChange = (weight) => {
    setPassengerWeight(weight);
    handleFlightSettingChange("passengerWeight", weight);
    
    // Recalculate route stats with the new passenger weight
    const wps = waypointManagerRef.current?.getWaypoints() || [];
    if (wps.length >= 2) {
      const coordinates = wps.map(wp => wp.coords);
      calculateRouteStats(coordinates);
    }
  };

  const handleReserveFuelChange = (fuel) => {
    setReserveFuel(fuel);
    handleFlightSettingChange("reserveFuel", fuel);
    
    // Recalculate route stats with the new reserve fuel
    const wps = waypointManagerRef.current?.getWaypoints() || [];
    if (wps.length >= 2) {
      const coordinates = wps.map(wp => wp.coords);
      calculateRouteStats(coordinates);
    }
  };

  const handleDeckTimeChange = (time) => {
    setDeckTimePerStop(time);
    handleFlightSettingChange("deckTimePerStop", time);
    
    // Recalculate route stats with the new deck time
    const wps = waypointManagerRef.current?.getWaypoints() || [];
    if (wps.length >= 2) {
      const coordinates = wps.map(wp => wp.coords);
      calculateRouteStats(coordinates);
    }
  };

  const handleDeckFuelFlowChange = (fuelFlow) => {
    setDeckFuelFlow(fuelFlow);
    handleFlightSettingChange("deckFuelFlow", fuelFlow);
    
    // Recalculate route stats with the new deck fuel flow
    const wps = waypointManagerRef.current?.getWaypoints() || [];
    if (wps.length >= 2) {
      const coordinates = wps.map(wp => wp.coords);
      calculateRouteStats(coordinates);
    }
  };

  const handleTaxiFuelChange = (fuel) => {
    setTaxiFuel(fuel);
    handleFlightSettingChange("taxiFuel", fuel);
    
    // Recalculate route stats with the new taxi fuel
    const wps = waypointManagerRef.current?.getWaypoints() || [];
    if (wps.length >= 2) {
      const coordinates = wps.map(wp => wp.coords);
      calculateRouteStats(coordinates);
    }
  };

  const handleContingencyFuelPercentChange = (percent) => {
    setContingencyFuelPercent(percent);
    handleFlightSettingChange("contingencyFuelPercent", percent);
    
    // Recalculate route stats with the new contingency fuel percentage
    const wps = waypointManagerRef.current?.getWaypoints() || [];
    if (wps.length >= 2) {
      const coordinates = wps.map(wp => wp.coords);
      calculateRouteStats(coordinates);
    }
  };

  const handlePayloadWeightChange = (weight) => {
    setPayloadWeight(weight);
    handleFlightSettingChange("payloadWeight", weight);
    
    // Recalculate route stats with the new payload weight
    const wps = waypointManagerRef.current?.getWaypoints() || [];
    if (wps.length >= 2) {
      const coordinates = wps.map(wp => wp.coords);
      calculateRouteStats(coordinates);
    }
  };
  
  // Function to sync all flight settings with the calculator
  const syncFlightCalculator = () => {
    if (flightCalculationsRef.current) {
      flightCalculationsRef.current.updateConfig({
        passengerWeight,
        reserveFuel,
        deckTimePerStop,
        deckFuelFlow,
        taxiFuel,
        contingencyFuelPercent,
        payloadWeight
      });
      console.log("Synchronized all flight settings with calculator");
    }
  };
```

### 2.2 Add the synchronization useEffect (after line ~775)

After the Initialize flight calculations module useEffect, add:

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
        contingencyFuelPercent,
        payloadWeight
      });
      
      console.log("Flight calculation settings synchronized with calculator module");
      
      // Recalculate route if we have waypoints
      const wps = waypointManagerRef.current?.getWaypoints() || [];
      if (wps.length >= 2) {
        const coordinates = wps.map(wp => wp.coords);
        calculateRouteStats(coordinates);
      }
    }
  }, [passengerWeight, reserveFuel, deckTimePerStop, deckFuelFlow, taxiFuel, contingencyFuelPercent, payloadWeight]);
```

### 2.3 Update the RightPanel component props (around line ~2530)

Find these props:
```javascript
onPassengerWeightChange={setPassengerWeight}
onReserveFuelChange={setReserveFuel}
onDeckTimeChange={setDeckTimePerStop}
```

Replace them with:
```javascript
onPassengerWeightChange={handlePassengerWeightChange}
onReserveFuelChange={handleReserveFuelChange}
onDeckTimeChange={handleDeckTimeChange}
```

### 2.4 IMPORTANT - Remove any duplicate handler functions

Search for these patterns and make sure you only have ONE of each function:
- `const handlePassengerWeightChange`
- `const handleReserveFuelChange`
- `const handleDeckTimeChange`
- `const handleDeckFuelFlowChange`
- `const handleTaxiFuelChange`
- `const handleContingencyFuelPercentChange`
- `const handlePayloadWeightChange`

If you find duplicates, remove them (keep only the versions we added above).

## 3. Test the Application

Save all changes and test the application. The flight settings should now properly affect the fuel calculations.