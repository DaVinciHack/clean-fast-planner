#!/bin/bash

# This script removes the departure card section from the generateStopCardsData function
# while preserving the wind and fuel calculation improvements.

FILE_PATH="/Users/duncanburbury/FastPlannerMaster/FastPlannerV3/src/components/fast-planner/FastPlannerApp.jsx"
BACKUP_PATH="${FILE_PATH}.departure-card-fix"

# Create a backup
cp -v "$FILE_PATH" "$BACKUP_PATH"
echo "Created backup at $BACKUP_PATH"

# Find the line number of the departure card section
DEPARTURE_CARD_LINE=$(grep -n "// Create departure card" "$FILE_PATH" | cut -d':' -f1)

if [ -z "$DEPARTURE_CARD_LINE" ]; then
  echo "Could not find departure card section. It might have been removed already."
  exit 0
fi

echo "Found departure card section at line $DEPARTURE_CARD_LINE"

# Find the line number where we create normal stop cards
NORMAL_CARDS_LINE=$(grep -n "// Now create cards for each stop" "$FILE_PATH" | cut -d':' -f1)

if [ -z "$NORMAL_CARDS_LINE" ]; then
  echo "Could not find the section where normal stop cards are created."
  exit 1
fi

echo "Found normal cards section at line $NORMAL_CARDS_LINE"