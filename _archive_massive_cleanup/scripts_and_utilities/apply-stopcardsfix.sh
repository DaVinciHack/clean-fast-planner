#!/bin/bash

# This script applies the fix from stopCardsDataFix.js to the FastPlannerApp.jsx file

# First, make a backup
cp -v /Users/duncanburbury/FastPlannerMaster/FastPlannerV3/src/components/fast-planner/FastPlannerApp.jsx /Users/duncanburbury/FastPlannerMaster/FastPlannerV3/src/components/fast-planner/FastPlannerApp.jsx.before-stopcardsfix

# Locate the start of the generateStopCardsData function
FUNC_START=$(grep -n "const generateStopCardsData" /Users/duncanburbury/FastPlannerMaster/FastPlannerV3/src/components/fast-planner/FastPlannerApp.jsx | cut -d':' -f1)
if [ -z "$FUNC_START" ]; then
  echo "Could not find generateStopCardsData function in FastPlannerApp.jsx"
  exit 1
fi

# Locate the end of the function (return cards statement)
FUNC_END=$(grep -n "return cards" /Users/duncanburbury/FastPlannerMaster/FastPlannerV3/src/components/fast-planner/FastPlannerApp.jsx | cut -d':' -f1)
if [ -z "$FUNC_END" ]; then
  echo "Could not find end of generateStopCardsData function in FastPlannerApp.jsx"
  exit 1
fi

# Find the closing brace after the return statement
BRACE_END=$(tail -n +$FUNC_END /Users/duncanburbury/FastPlannerMaster/FastPlannerV3/src/components/fast-planner/FastPlannerApp.jsx | grep -n "}" | head -1 | cut -d':' -f1)
if [ -z "$BRACE_END" ]; then
  echo "Could not find closing brace of generateStopCardsData function"
  exit 1
fi

# Calculate the actual line number of the closing brace
FUNC_END_LINE=$(($FUNC_END + $BRACE_END - 1))

echo "Found generateStopCardsData function from line $FUNC_START to line $FUNC_END_LINE"

# Extract the function definition for use in the replacement
FUNC_DEF=$(sed -n "${FUNC_START}p" /Users/duncanburbury/FastPlannerMaster/FastPlannerV3/src/components/fast-planner/FastPlannerApp.jsx)
echo "Function definition is: $FUNC_DEF"

# Extract the fixed function from stopCardsDataFix.js, but start from line 8 to skip the comments
FIXED_FUNC=$(tail -n +8 /Users/duncanburbury/FastPlannerMaster/FastPlannerV3/src/components/fast-planner/stopCardsDataFix.js)

# Create a temporary file with everything before the function
sed -n "1,$((FUNC_START-1))p" /Users/duncanburbury/FastPlannerMaster/FastPlannerV3/src/components/fast-planner/FastPlannerApp.jsx > /tmp/before_func.txt

# Create a temporary file with everything after the function
sed -n "$((FUNC_END_LINE+1)),\$p" /Users/duncanburbury/FastPlannerMaster/FastPlannerV3/src/components/fast-planner/FastPlannerApp.jsx > /tmp/after_func.txt

# Create the fixed file by combining the parts
cat /tmp/before_func.txt > /tmp/fixed_file.jsx
echo "$FIXED_FUNC" >> /tmp/fixed_file.jsx
cat /tmp/after_func.txt >> /tmp/fixed_file.jsx

# Replace the original file with the fixed version
cp -v /tmp/fixed_file.jsx /Users/duncanburbury/FastPlannerMaster/FastPlannerV3/src/components/fast-planner/FastPlannerApp.jsx

echo "Successfully applied the fix from stopCardsDataFix.js to FastPlannerApp.jsx"
