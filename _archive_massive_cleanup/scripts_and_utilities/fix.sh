#!/bin/bash

# Create a backup
cp -v /Users/duncanburbury/FastPlannerMaster/FastPlannerV3/src/components/fast-planner/FastPlannerApp.jsx /Users/duncanburbury/FastPlannerMaster/FastPlannerV3/src/components/fast-planner/FastPlannerApp.jsx.fix-backup2

# Find line numbers
START_LINE=$(grep -n "// Create departure card" /Users/duncanburbury/FastPlannerMaster/FastPlannerV3/src/components/fast-planner/FastPlannerApp.jsx | cut -d':' -f1)
END_LINE=$(grep -n "// Create cards for each subsequent stop" /Users/duncanburbury/FastPlannerMaster/FastPlannerV3/src/components/fast-planner/FastPlannerApp.jsx | cut -d':' -f1)

if [ -z "$START_LINE" ] || [ -z "$END_LINE" ]; then
  echo "Could not find the departure card section."
  exit 1
fi

echo "Found departure card section from line $START_LINE to $END_LINE"

# Create a temporary file with the fix applied
awk -v start="$START_LINE" -v end="$END_LINE" '
NR < start || NR > end {
  print $0
} 
NR == start {
  print "    // MODIFIED: Removed departure card section to fix stop cards functionality"
  print "    // Create cards for each stop"
}' /Users/duncanburbury/FastPlannerMaster/FastPlannerV3/src/components/fast-planner/FastPlannerApp.jsx > /tmp/fixed_file.jsx

# Replace the original file with the fixed version
mv /tmp/fixed_file.jsx /Users/duncanburbury/FastPlannerMaster/FastPlannerV3/src/components/fast-planner/FastPlannerApp.jsx

echo "Fix applied. The departure card section has been removed."
