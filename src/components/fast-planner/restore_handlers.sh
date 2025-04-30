#!/bin/bash

# Create a temporary file
cp /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx.tmp

# Find the line after handleFlightSettingChange and add our handler implementations
lineNum=$(grep -n "const handleFlightSettingChange = (settingName, value) => {" /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx | cut -d ':' -f 1)
endBlock=$(grep -n "  };" /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx | awk -v line=$lineNum '$1 > line {print $1}' | head -1 | cut -d ':' -f 1)

# Add the individual handler functions after the handleFlightSettingChange function
sed -i '' -e "${endBlock}a\\
\\
  // Update the existing handler functions to use the unified handler\\
  const handlePassengerWeightChange = (weight) => {\\
    handleFlightSettingChange('passengerWeight', weight);\\
  };\\
\\
  const handleReserveFuelChange = (fuel) => {\\
    handleFlightSettingChange('reserveFuel', fuel);\\
  };\\
\\
  const handleDeckTimeChange = (time) => {\\
    handleFlightSettingChange('deckTimePerStop', time);\\
  };\\
\\
  const handleDeckFuelFlowChange = (fuelFlow) => {\\
    handleFlightSettingChange('deckFuelFlow', fuelFlow);\\
  };\\
\\
  const handleTaxiFuelChange = (fuel) => {\\
    handleFlightSettingChange('taxiFuel', fuel);\\
  };\\
\\
  const handleContingencyFuelPercentChange = (percent) => {\\
    handleFlightSettingChange('contingencyFuelPercent', percent);\\
  };\\
\\
  // This function synchronizes all flight settings with the calculator\\
  const syncFlightCalculator = () => {\\
    if (flightCalculationsRef.current) {\\
      flightCalculationsRef.current.updateConfig({\\
        passengerWeight,\\
        reserveFuel,\\
        deckTimePerStop,\\
        deckFuelFlow,\\
        taxiFuel,\\
        contingencyFuelPercent\\
      });\\
      console.log(\"Synchronized all flight settings with calculator\");\\
    }\\
  };\\
" /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx.tmp

# Copy the file back
mv /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx.tmp /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx

echo "Handler functions restored."