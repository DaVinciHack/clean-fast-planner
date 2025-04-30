# Manual Fix Instructions

Follow these step-by-step instructions to fix the flight calculations issue:

## Step 1: Back up the original files

```bash
# Backup ModularFastPlannerComponent.jsx
cp /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx.backup

# Backup FlightCalculations.js
cp /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/modules/calculations/FlightCalculations.js /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/modules/calculations/FlightCalculations.js.backup
```

## Step 2: Update the FlightCalculations.js file

```bash
# Copy the fixed FlightCalculations.js file
cp /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/modules/calculations/FlightCalculations.fix.js /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/modules/calculations/FlightCalculations.js
```

## Step 3: Open the ModularFastPlannerComponent.jsx file in a text editor

```bash
# Open the file in your preferred text editor, for example:
code /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx
```

## Step 4: Add the handler functions for flight settings

Find this section (around line 80):

```javascript
  const [taxiFuel, setTaxiFuel] = useState(50); // lbs of taxi fuel
  const [contingencyFuelPercent, setContingencyFuelPercent] = useState(10); // % of trip fuel
  const [reserveMethod, setReserveMethod] = useState('fixed');
  
  // Initialize managers
```

Add our new handler functions right after the `reserveMethod` state declaration:

```javascript
  const [taxiFuel, setTaxiFuel] = useState(50); // lbs of taxi fuel
  const [contingencyFuelPercent, setContingencyFuelPercent] = useState(10); // % of trip fuel
  const [reserveMethod, setReserveMethod] = useState('fixed');
  
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

  // This function synchronizes all flight settings with the calculator
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
  
  // Initialize managers
```

## Step 5: Find the flight calculations useEffect hook

Look for this section (around line 750-770):

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
        deckFuelFlow
      });
    }
  }, [passengerWeight, reserveFuel, deckTimePerStop, deckFuelPerStop, deckFuelFlow, taxiFuel, contingencyFuelPercent]);
```

Add our new useEffect hook right after this one:

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

## Step 6: Replace the calculateRouteStats function

Find the calculateRouteStats function (around line 777):

```javascript
  // Calculate route statistics using our enhanced module
  const calculateRouteStats = (coordinates) => {
    if (!coordinates || coordinates.length < 2) {
      setRouteStats(null);
      return null;
    }
    
    // ... (rest of the function)
```

Replace the entire function with our improved version:

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

## Step 7: Update the RightPanel component props

Find the RightPanel component in the render section (around line 2530-2540):

```javascript
        onDeckTimeChange={setDeckTimePerStop}
        onDeckFuelChange={setDeckFuelPerStop}
        onDeckFuelFlowChange={handleDeckFuelFlowChange}
        onPassengerWeightChange={setPassengerWeight}
        onCargoWeightChange={setCargoWeight}
        onTaxiFuelChange={handleTaxiFuelChange}
        onContingencyFuelPercentChange={handleContingencyFuelPercentChange}
        onReserveMethodChange={setReserveMethod}
```

Replace these handlers with our new ones:

```javascript
        onDeckTimeChange={handleDeckTimeChange}
        onDeckFuelChange={setDeckFuelPerStop}
        onDeckFuelFlowChange={handleDeckFuelFlowChange}
        onPassengerWeightChange={handlePassengerWeightChange}
        onCargoWeightChange={setCargoWeight}
        onTaxiFuelChange={handleTaxiFuelChange}
        onContingencyFuelPercentChange={handleContingencyFuelPercentChange}
        onReserveMethodChange={setReserveMethod}
```

## Step 8: Save the file and test

Save the ModularFastPlannerComponent.jsx file and test the application. The flight settings should now properly affect the calculations.

If you have any issues, you can always revert to the backup files.