#!/bin/bash

# Script to apply the route stats fix to FastPlannerApp.jsx

FILE_PATH="/Users/duncanburbury/FastPlannerMaster/FastPlannerV3/src/components/fast-planner/FastPlannerApp.jsx"
BACKUP_PATH="${FILE_PATH}.route-stats-backup"

# Create a backup
cp "$FILE_PATH" "$BACKUP_PATH"
echo "Created backup at $BACKUP_PATH"

# Find the line with the error message
ERROR_LINE=$(grep -n "Received invalid route stats with zero time" "$FILE_PATH" | cut -d':' -f1)

if [ -z "$ERROR_LINE" ]; then
  echo "Error line not found, searching for similar pattern"
  ERROR_LINE=$(grep -n "console.error('🔄 Received invalid route stats with zero time:" "$FILE_PATH" | cut -d':' -f1)
fi

if [ -z "$ERROR_LINE" ]; then
  echo "Could not find the error line. Fix not applied."
  exit 1
fi

echo "Found error line at line $ERROR_LINE"

# Find the validation block start and end
START_LINE=$(grep -n "Check if stats are valid before updating" "$FILE_PATH" | cut -d':' -f1)
if [ -z "$START_LINE" ]; then
  echo "Could not find the validation block start. Fix not applied."
  exit 1
fi

echo "Found validation block start at line $START_LINE"

# Extract line numbers for the validation block
RETURN_LINE=$(grep -n "return; // Don't update with invalid stats" "$FILE_PATH" | cut -d':' -f1)
if [ -z "$RETURN_LINE" ]; then
  echo "Could not find the validation block end. Fix not applied."
  exit 1
fi

echo "Found return statement at line $RETURN_LINE"

# Extract the end of the validation block
END_LINE=$((RETURN_LINE + 1))
BLOCK_PATTERN_START=$(sed -n "${START_LINE}p" "$FILE_PATH")
BLOCK_PATTERN_END=$(sed -n "${END_LINE}p" "$FILE_PATH")

echo "Validation block ends at line $END_LINE"
echo "Replacing validation block..."

# Create a temporary file with the fix applied
awk -v start="$START_LINE" -v end="$END_LINE" -v new_code="      // Check if stats are valid before updating
      if (!stats || !stats.timeHours || stats.timeHours === 0) {
        console.error('🔄 Received invalid route stats with zero time:', stats);
        
        // FIXED: Add manual time calculation when timeHours is zero
        if (stats && stats.totalDistance && selectedAircraft) {
          console.log('🔄 ATTEMPTING FIX: Manually calculating timeHours');
          const totalDistance = parseFloat