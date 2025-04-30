#!/bin/bash

# Create a temporary file
cp /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx.tmp

# Add the handlePayloadWeightChange function with the unified handler pattern
# Find the line with "const handleContingencyFuelPercentChange"
lineNum=$(grep -n "const handleContingencyFuelPercentChange" /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx | cut -d ':' -f 1)

# Add the new handler after that section
insertLine=$((lineNum + 4))
sed -i '' -e "${insertLine}a\\
  const handlePayloadWeightChange = (weight) => {\\
    handleFlightSettingChange('payloadWeight', weight);\\
  };\\
" /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx.tmp

# Copy the file back
mv /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx.tmp /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx

echo "Added missing handlePayloadWeightChange function."