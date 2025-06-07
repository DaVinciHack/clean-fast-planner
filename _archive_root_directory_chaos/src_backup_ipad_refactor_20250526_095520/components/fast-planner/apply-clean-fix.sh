#!/bin/bash

# This script applies the clean function to FastPlannerApp.jsx

# First make a backup
cp -v /Users/duncanburbury/FastPlannerMaster/FastPlannerV3/src/components/fast-planner/FastPlannerApp.jsx /Users/duncanburbury/FastPlannerMaster/FastPlannerV3/src/components/fast-planner/FastPlannerApp.jsx.clean-fix-backup

# Find the generateStopCardsData function
FUNC_START=$(grep -n "const generateStopCardsData" /Users/duncanburbury/FastPlannerMaster/FastPlannerV3/src/components/fast-planner/FastPlannerApp.jsx | cut -d':' -f1)
if [ -z "$FUNC_START" ]; then
  echo "Could not find generateStopCardsData function"
  exit 1
fi

# Find the end of the function (return cards)
RETURN_LINE=$(grep -n "return cards" /Users/duncanburbury/FastPlannerMaster/FastPlannerV3/src/components/fast-planner/FastPlannerApp.jsx | cut -d':' -f1)
if [ -z "$RETURN_LINE" ]; then
  echo "Could not find end of function (return cards)"
  exit 1
fi

# Find the closing brace after the return statement
END_BRACE=$(sed -n "$RETURN_LINE,\$p" /Users/duncanburbury/FastPlannerMaster/FastPlannerV3/src/components/fast-planner/FastPlannerApp.jsx | grep -n "}" | head -1 | cut -d':' -f1)
if [ -z "$END_BRACE" ]; then
  echo "Could not find closing brace"
  exit 1
fi

# Calculate the actual line number of the end
FUNC_END=$((RETURN_LINE + END_BRACE - 1))

echo "Found function from line $FUNC_START to line $FUNC_END"

# Create a temporary file with the parts before the function
head -n $((FUNC_START-1)) /Users/duncanburbury/FastPlannerMaster/FastPlannerV3/src/components/fast-planner/FastPlannerApp.jsx > /tmp/part1.txt

# Add the clean function
echo "  // Generate stop cards data" > /tmp/part2.txt
cat /Users/duncanburbury/FastPlannerMaster/FastPlannerV3/src/components/fast-planner/clean-function.js >> /tmp/part2.txt

# Add the parts after the function
tail -n +$((FUNC_END+1)) /Users/duncanburbury/FastPlannerMaster/FastPlannerV3/src/components/fast-planner/FastPlannerApp.jsx > /tmp/part3.txt

# Combine all parts
cat /tmp/part1.txt /tmp/part2.txt /tmp/part3.txt > /Users/duncanburbury/FastPlannerMaster/FastPlannerV3/src/components/fast-planner/FastPlannerApp.jsx

echo "Successfully applied the clean function to FastPlannerApp.jsx"
