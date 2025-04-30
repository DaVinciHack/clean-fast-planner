#!/bin/bash

# Create a backup of the original file
cp /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx.bak

# Extract the parts of the file before and after the calculateRouteStats function
head -n 776 /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx > /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/temp_before_calc_stats.js
sed -n '859,$p' /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx > /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/temp_after_calc_stats.js

# Insert the sync useEffect between them
sed -i '' -e '775s/$/ \n/' /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/temp_before_calc_stats.js
cat /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/temp_sync_effect.js >> /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/temp_before_calc_stats.js

# Combine them with the new calculateRouteStats function
cat /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/temp_before_calc_stats.js /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/temp_calculate_route_stats.js /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/temp_after_calc_stats.js > /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx.new

# Update the RightPanel handlers
sed -i '' -e '2532,2537s/onDeckTimeChange={setDeckTimePerStop}.*onTaxiFuelChange={handleTaxiFuelChange}/onDeckTimeChange={handleDeckTimeChange}\n        onDeckFuelChange={setDeckFuelPerStop}\n        onDeckFuelFlowChange={handleDeckFuelFlowChange}\n        onPassengerWeightChange={handlePassengerWeightChange}\n        onCargoWeightChange={setCargoWeight}\n        onTaxiFuelChange={handleTaxiFuelChange}/' /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx.new

# Replace the original file
mv /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx.new /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx

# Add handler functions
sed -i '' -e '81a\
  \
  /**\
   * Unified function to handle flight settings changes\
   * Updates both individual state variables and the flight calculations module\
   */\
  const handleFlightSettingChange = (settingName, value) => {\
    console.log(`Updating flight setting: ${settingName} = ${value}`);\
    \
    // Update individual state variables (for backward compatibility)\
    switch (settingName) {\
      case '\''passengerWeight'\'':\
        setPassengerWeight(value);\
        break;\
      case '\''reserveFuel'\'':\
        setReserveFuel(value);\
        break;\
      case '\''deckTimePerStop'\'':\
        setDeckTimePerStop(value);\
        break;\
      case '\''deckFuelFlow'\'':\
        setDeckFuelFlow(value);\
        break;\
      case '\''taxiFuel'\'':\
        setTaxiFuel(value);\
        break;\
      case '\''contingencyFuelPercent'\'':\
        setContingencyFuelPercent(value);\
        break;\
      default:\
        console.warn(`Unknown setting: ${settingName}`);\
        break;\
    }\
    \
    // Update the flightSettings object\
    setFlightSettings(prevSettings => ({\
      ...prevSettings,\
      [settingName]: value\
    }));\
    \
    // Update the flight calculations module if it exists\
    if (flightCalculationsRef.current) {\
      flightCalculationsRef.current.updateConfig({\
        [settingName]: value\
      });\
      console.log(`Updated FlightCalculations module with ${settingName}: ${value}`);\
    }\
    \
    // Recalculate route stats if a route exists\
    const wps = waypointManagerRef.current?.getWaypoints() || [];\
    if (wps.length >= 2) {\
      console.log(`Recalculating route with updated ${settingName}`);\
      const coordinates = wps.map(wp => wp.coords);\
      calculateRouteStats(coordinates);\
    }\
  };\
\
  // Update the existing handler functions to use the unified handler\
  const handlePassengerWeightChange = (weight) => {\
    handleFlightSettingChange('\''passengerWeight'\'', weight);\
  };\
\
  const handleReserveFuelChange = (fuel) => {\
    handleFlightSettingChange('\''reserveFuel'\'', fuel);\
  };\
\
  const handleDeckTimeChange = (time) => {\
    handleFlightSettingChange('\''deckTimePerStop'\'', time);\
  };\
\
  const handleDeckFuelFlowChange = (fuelFlow) => {\
    handleFlightSettingChange('\''deckFuelFlow'\'', fuelFlow);\
  };\
\
  const handleTaxiFuelChange = (fuel) => {\
    handleFlightSettingChange('\''taxiFuel'\'', fuel);\
  };\
\
  const handleContingencyFuelPercentChange = (percent) => {\
    handleFlightSettingChange('\''contingencyFuelPercent'\'', percent);\
  };\
\
  // This function synchronizes all flight settings with the calculator\
  const syncFlightCalculator = () => {\
    if (flightCalculationsRef.current) {\
      flightCalculationsRef.current.updateConfig({\
        passengerWeight,\
        reserveFuel,\
        deckTimePerStop,\
        deckFuelFlow,\
        taxiFuel,\
        contingencyFuelPercent\
      });\
      console.log("Synchronized all flight settings with calculator");\
    }\
  };\
' /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx

# Clean up temporary files
rm /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/temp_*.js

echo "Fixes applied successfully!"