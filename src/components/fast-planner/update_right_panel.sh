#!/bin/bash

# Create a temporary file
cp /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx.tmp

# Update the handlers in the RightPanel component
sed -i '' -e 's/onDeckTimeChange={setDeckTimePerStop}/onDeckTimeChange={handleDeckTimeChange}/g' /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx.tmp
sed -i '' -e 's/onPassengerWeightChange={setPassengerWeight}/onPassengerWeightChange={handlePassengerWeightChange}/g' /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx.tmp
sed -i '' -e 's/onReserveFuelChange={setReserveFuel}/onReserveFuelChange={handleReserveFuelChange}/g' /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx.tmp

# Copy the file back
mv /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx.tmp /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx

echo "RightPanel component handlers updated."