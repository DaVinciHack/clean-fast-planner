#!/bin/bash

# This script:
# 1. Restores the FastPlannerApp.jsx file from git
# 2. Makes a targeted change to fix the stop cards by removing the departure card code

# Create a final backup of the current state
cp -v /Users/duncanburbury/FastPlannerMaster/FastPlannerV3/src/components/fast-planner/FastPlannerApp.jsx /Users/duncanburbury/FastPlannerMaster/FastPlannerV3/src/components/fast-planner/FastPlannerApp.jsx.final-backup

# Move to the project directory
cd /Users/duncanburbury/FastPlannerMaster/FastPlannerV3/

# Step 1: Reset the file to the last git commit
git checkout -- src/components/fast-planner/FastPlannerApp.jsx
echo "Restored FastPlannerApp.jsx from git"

# Step 2: Search for the departure card section
DEPARTURE_START=$(grep -n "// Create departure card" src/components/fast-planner/FastPlannerApp.jsx | cut -d':' -f1)
if [ -z "$DEPARTURE_START" ]; then
    echo "No departure card section found, already fixed"
    exit 0
fi

NEXT_SECTION_START=$(grep -n "// Now create cards for each stop" src/components/fast-planner/FastPlannerApp.jsx | cut -d':' -f1)
if [ -z "$NEXT_SECTION_START" ]; then
    echo "Could not find section after departure card"
    exit 1
fi

echo "Found departure card section from line $DEPARTURE_START to $NEXT_SECTION_START"

# Step 3: Remove the departure card section
sed -i.sed-backup "${DEPARTURE_START},${NEXT_SECTION_START}s/^/\/\/ REMOVED: /" src/components/fast-planner/FastPlannerApp.jsx

echo "Fixed the stop cards by commenting out the departure card section"
echo "The application should now display stop cards correctly"
