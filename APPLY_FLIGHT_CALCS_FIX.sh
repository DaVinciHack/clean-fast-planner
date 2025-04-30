#!/bin/bash
# Script to apply the enhanced FlightCalculations module

# Back up the original file
cp src/components/fast-planner/modules/calculations/FlightCalculations.js src/components/fast-planner/modules/calculations/FlightCalculations.js.bak

# Apply the fix
cp src/components/fast-planner/modules/calculations/FlightCalculations_fix.js src/components/fast-planner/modules/calculations/FlightCalculations.js

echo "Enhanced FlightCalculations module applied successfully"
echo "Please restart the application to see the changes"
