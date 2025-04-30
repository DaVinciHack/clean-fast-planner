#!/bin/bash

# Create a temporary file
cp /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx.tmp

# Fix the handlePayloadWeightChange function
sed -i '' -e 's/const handlePayloadWeightChange/const handlePayloadWeightChange = (weight) => {/g' /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx.tmp

# Add closing bracket to handlePayloadWeightChange function
sed -i '' -e '1488s/};/};};/g' /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx.tmp

# Copy the file back
mv /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx.tmp /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx

echo "Fixed handlePayloadWeightChange function."