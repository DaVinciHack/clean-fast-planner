#!/bin/bash

# Create a backup of the original file
cp /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx.final_backup

# Create a temporary file
cp /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx.tmp

# Remove any duplicate function declarations for handlePayloadWeightChange
sed -i '' -e '/const handlePayloadWeightChange = (weight) => {/,/};/d' /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx.tmp

# Find the syncFlightCalculator function to add our handlers before it
lineNum=$(grep -n "const syncFlightCalculator" /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx.tmp | head -1 | cut -d ':' -f 1)
insertLine=$((lineNum - 1))

# Add all handler functions in order, with consistent formatting
sed -i '' -e "${insertLine}a\\
  // Handle payload weight changes\\
  const handlePayloadWeightChange = (weight) => {\\
    // Update the state directly\\
    setPayloadWeight(weight);\\
    \\
    // Also update through the unified handler\\
    handleFlightSettingChange('payloadWeight', weight);\\
  };\\
" /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx.tmp

# Copy the file back
mv /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx.tmp /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx

echo "Final fixes applied successfully."