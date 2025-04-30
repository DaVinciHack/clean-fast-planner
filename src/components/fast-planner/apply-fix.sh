#!/bin/bash

# Make this script executable
# chmod +x apply-fix.sh

# Step 1: Back up the original files
echo "Creating backups..."
cp /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx.backup
cp /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/modules/calculations/FlightCalculations.js /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/modules/calculations/FlightCalculations.js.backup

# Step 2: Update the FlightCalculations.js file
echo "Updating FlightCalculations.js..."
cp /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/modules/calculations/FlightCalculations.fix.js /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/modules/calculations/FlightCalculations.js

echo "Fix applied!"
echo ""
echo "To fully fix the issue, follow the detailed instructions in MANUAL_FIX_INSTRUCTIONS.md"
echo "This will help you update the ModularFastPlannerComponent.jsx file with the necessary changes."
