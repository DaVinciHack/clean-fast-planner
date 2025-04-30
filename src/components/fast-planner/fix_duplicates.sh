#!/bin/bash

# Create a backup if not already created
if [ ! -f "/Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx.bak" ]; then
  cp /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx.bak
fi

# Remove our added declarations for functions that already exist in the file
# Create a temporary file
cp /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx.tmp

# Remove the duplicate function declarations
grep -n "const handleReserveFuelChange = (fuel)" /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx
grep -n "const handleDeckFuelFlowChange = (fuelFlow)" /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx
grep -n "const handleTaxiFuelChange = (fuel)" /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx
grep -n "const handleContingencyFuelPercentChange = (percent)" /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx
grep -n "const handlePassengerWeightChange = (weight)" /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx
grep -n "const handleDeckTimeChange = (time)" /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx

# Remove the duplicate functions but keep the unified handler function
sed -i '' -e '/const handleReserveFuelChange = (fuel) => {/,/};/d' /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx.tmp
sed -i '' -e '/const handleDeckFuelFlowChange = (fuelFlow) => {/,/};/d' /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx.tmp
sed -i '' -e '/const handleTaxiFuelChange = (fuel) => {/,/};/d' /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx.tmp
sed -i '' -e '/const handleContingencyFuelPercentChange = (percent) => {/,/};/d' /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx.tmp
sed -i '' -e '/const handlePassengerWeightChange = (weight) => {/,/};/d' /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx.tmp
sed -i '' -e '/const handleDeckTimeChange = (time) => {/,/};/d' /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx.tmp

# Copy the clean file back
mv /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx.tmp /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx

echo "Duplicate function declarations removed."