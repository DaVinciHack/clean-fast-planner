#!/bin/bash

# First, restore from our backup to get a clean state
cp /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx.bak /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx

# Now apply the fix for the FlightCalculations module
cp /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/modules/calculations/FlightCalculations.fix.js /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/modules/calculations/FlightCalculations.js

# Create a new approach - we'll add minimal changes needed to fix the issues
# First, find the handleFlightSettingChange function if it exists
if grep -q "handleFlightSettingChange" /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx; then
  echo "handleFlightSettingChange already exists, updating it"
else
  # Add the unified handler function after the reserveMethod state declaration
  sed -i '' -e '/const \[reserveMethod, setReserveMethod\] = useState/a\\
\\
  /**\\
   * This function handles all flight settings changes\\
   * It updates the individual state variable, the flightSettings object,\\
   * and the flight calculations module\\
   */\\
  const handleFlightSettingChange = (settingName, value) => {\\
    console.log(`Updating flight setting: ${settingName} = ${value}`);\\
    \\
    // Update the flightSettings object\\
    setFlightSettings(prevSettings => ({\\
      ...prevSettings,\\
      [settingName]: value\\
    }));\\
    \\
    // Update the flight calculations module if it exists\\
    if (flightCalculationsRef.current) {\\
      flightCalculationsRef.current.updateConfig({\\
        [settingName]: value\\
      });\\
    }\\
  };\\
' /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx
fi

# Find and update the handleDeckFuelFlowChange function
sed -i '' -e '/const handleDeckFuelFlowChange = (fuelFlow) => {/,/};/c\\
  const handleDeckFuelFlowChange = (fuelFlow) => {\\
    setDeckFuelFlow(fuelFlow);\\
    handleFlightSettingChange("deckFuelFlow", fuelFlow);\\
    \\
    // Recalculate route stats with the new deck fuel flow\\
    const wps = waypointManagerRef.current?.getWaypoints() || [];\\
    if (wps.length >= 2) {\\
      const coordinates = wps.map(wp => wp.coords);\\
      calculateRouteStats(coordinates);\\
    }\\
  };\\
' /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx

# Update the handleTaxiFuelChange function if it exists
sed -i '' -e '/const handleTaxiFuelChange = (fuel) => {/,/};/c\\
  const handleTaxiFuelChange = (fuel) => {\\
    setTaxiFuel(fuel);\\
    handleFlightSettingChange("taxiFuel", fuel);\\
    \\
    // Recalculate route stats with the new taxi fuel\\
    const wps = waypointManagerRef.current?.getWaypoints() || [];\\
    if (wps.length >= 2) {\\
      const coordinates = wps.map(wp => wp.coords);\\
      calculateRouteStats(coordinates);\\
    }\\
  };\\
' /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx

# Update the handleContingencyFuelPercentChange function if it exists
sed -i '' -e '/const handleContingencyFuelPercentChange = (percent) => {/,/};/c\\
  const handleContingencyFuelPercentChange = (percent) => {\\
    setContingencyFuelPercent(percent);\\
    handleFlightSettingChange("contingencyFuelPercent", percent);\\
    \\
    // Recalculate route stats with the new contingency fuel percentage\\
    const wps = waypointManagerRef.current?.getWaypoints() || [];\\
    if (wps.length >= 2) {\\
      const coordinates = wps.map(wp => wp.coords);\\
      calculateRouteStats(coordinates);\\
    }\\
  };\\
' /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx

# Update the handlePassengerWeightChange function
sed -i '' -e '/const handlePassengerWeightChange = (weight) => {/,/};/c\\
  const handlePassengerWeightChange = (weight) => {\\
    setPassengerWeight(weight);\\
    handleFlightSettingChange("passengerWeight", weight);\\
    \\
    // Recalculate route stats with the new passenger weight\\
    const wps = waypointManagerRef.current?.getWaypoints() || [];\\
    if (wps.length >= 2) {\\
      const coordinates = wps.map(wp => wp.coords);\\
      calculateRouteStats(coordinates);\\
    }\\
  };\\
' /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx

# Add or update the handleReserveFuelChange function
sed -i '' -e '/const handleReserveFuelChange = (fuel) => {/,/};/c\\
  const handleReserveFuelChange = (fuel) => {\\
    setReserveFuel(fuel);\\
    handleFlightSettingChange("reserveFuel", fuel);\\
    \\
    // Recalculate route stats with the new reserve fuel\\
    const wps = waypointManagerRef.current?.getWaypoints() || [];\\
    if (wps.length >= 2) {\\
      const coordinates = wps.map(wp => wp.coords);\\
      calculateRouteStats(coordinates);\\
    }\\
  };\\
' /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx

# Add or update the handleDeckTimeChange function
sed -i '' -e '/const handleDeckTimeChange = (time) => {/,/};/c\\
  const handleDeckTimeChange = (time) => {\\
    setDeckTimePerStop(time);\\
    handleFlightSettingChange("deckTimePerStop", time);\\
    \\
    // Recalculate route stats with the new deck time\\
    const wps = waypointManagerRef.current?.getWaypoints() || [];\\
    if (wps.length >= 2) {\\
      const coordinates = wps.map(wp => wp.coords);\\
      calculateRouteStats(coordinates);\\
    }\\
  };\\
' /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx

# Add the handlePayloadWeightChange function
if ! grep -q "const handlePayloadWeightChange = (weight) =>" /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx; then
  # Add it after the handleReserveFuelChange function
  sed -i '' -e '/const handleReserveFuelChange = (fuel) => {/,/};/!b;/};/a\\
\\
  const handlePayloadWeightChange = (weight) => {\\
    setPayloadWeight(weight);\\
    handleFlightSettingChange("payloadWeight", weight);\\
    \\
    // Recalculate route stats with the new payload weight\\
    const wps = waypointManagerRef.current?.getWaypoints() || [];\\
    if (wps.length >= 2) {\\
      const coordinates = wps.map(wp => wp.coords);\\
      calculateRouteStats(coordinates);\\
    }\\
  };\\
' /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx
else
  echo "handlePayloadWeightChange already exists"
fi

# Add the syncFlightCalculator function
if ! grep -q "const syncFlightCalculator = () =>" /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx; then
  # Add it after all the handler functions
  sed -i '' -e '/const handleContingencyFuelPercentChange = (percent) => {/,/};/!b;/};/a\\
\\
  // Function to sync all flight settings with the calculator\\
  const syncFlightCalculator = () => {\\
    if (flightCalculationsRef.current) {\\
      flightCalculationsRef.current.updateConfig({\\
        passengerWeight,\\
        reserveFuel,\\
        deckTimePerStop,\\
        deckFuelFlow,\\
        taxiFuel,\\
        contingencyFuelPercent,\\
        payloadWeight\\
      });\\
      console.log("Synchronized all flight settings with calculator");\\
    }\\
  };\\
' /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx
else
  echo "syncFlightCalculator already exists"
fi

# Add synchronization useEffect
if ! grep -q "Ensure flight calculation settings are synchronized with the module" /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx; then
  # Find a good place to add it - after the flight calculations module initialization
  sed -i '' -e '/Initialize the flight calculations module/,/\]);/!b;/\]);/a\\
\\
  // Ensure flight calculation settings are synchronized with the module\\
  useEffect(() => {\\
    if (flightCalculationsRef.current) {\\
      // Sync all state values to the calculator when they change\\
      flightCalculationsRef.current.updateConfig({\\
        passengerWeight,\\
        reserveFuel,\\
        deckTimePerStop,\\
        deckFuelFlow,\\
        taxiFuel,\\
        contingencyFuelPercent,\\
        payloadWeight\\
      });\\
      \\
      console.log("Flight calculation settings synchronized with calculator module");\\
      \\
      // Recalculate route if we have waypoints\\
      const wps = waypointManagerRef.current?.getWaypoints() || [];\\
      if (wps.length >= 2) {\\
        const coordinates = wps.map(wp => wp.coords);\\
        calculateRouteStats(coordinates);\\
      }\\
    }\\
  }, [passengerWeight, reserveFuel, deckTimePerStop, deckFuelFlow, taxiFuel, contingencyFuelPercent, payloadWeight]);\\
' /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx
else
  echo "Synchronization useEffect already exists"
fi

# Replace the RightPanel component handlers
sed -i '' -e 's/onPassengerWeightChange={setPassengerWeight}/onPassengerWeightChange={handlePassengerWeightChange}/g' /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx
sed -i '' -e 's/onReserveFuelChange={setReserveFuel}/onReserveFuelChange={handleReserveFuelChange}/g' /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx
sed -i '' -e 's/onDeckTimeChange={setDeckTimePerStop}/onDeckTimeChange={handleDeckTimeChange}/g' /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx
sed -i '' -e 's/onPayloadWeightChange={handlePayloadChange}/onPayloadWeightChange={handlePayloadWeightChange}/g' /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx

echo "Comprehensive fixes applied successfully."