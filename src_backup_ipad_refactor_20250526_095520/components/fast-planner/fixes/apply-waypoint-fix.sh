#!/bin/bash
# apply-waypoint-fix.sh
# 
# This script applies the waypoint mode fix to the Fast Planner application.
# It imports the fix module into the main application entry point.

# Define color codes for better output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Applying waypoint mode fix to Fast Planner...${NC}"

# Define paths
APP_PATH="/Users/duncanburbury/FastPlannerMaster/FastPlannerV5/src/components/fast-planner/FastPlannerApp.jsx"
BACKUP_PATH="/Users/duncanburbury/FastPlannerMaster/FastPlannerV5/src/components/fast-planner/FastPlannerApp.jsx.waypoint-fix-backup"

# Create a backup
cp "$APP_PATH" "$BACKUP_PATH"
echo -e "${GREEN}Created backup at: ${BACKUP_PATH}${NC}"

# Check if the fix import is already present
if grep -q "import './fixes/fix-waypoint-mode.js'" "$APP_PATH"; then
  echo -e "${YELLOW}Fix import already present, skipping...${NC}"
else
  # Add the import statement for the fix
  # Find the last import statement
  LAST_IMPORT_LINE=$(grep -n "import " "$APP_PATH" | tail -1 | cut -d: -f1)
  
  # Insert the fix import after the last import
  TEMP_FILE=$(mktemp)
  head -n $LAST_IMPORT_LINE "$APP_PATH" > "$TEMP_FILE"
  echo "" >> "$TEMP_FILE" # Add an empty line
  echo "// Import waypoint mode fix" >> "$TEMP_FILE"
  echo "import './fixes/fix-waypoint-mode.js';" >> "$TEMP_FILE"
  echo "" >> "$TEMP_FILE" # Add an empty line
  tail -n +$((LAST_IMPORT_LINE + 1)) "$APP_PATH" >> "$TEMP_FILE"
  
  # Replace the original file
  mv "$TEMP_FILE" "$APP_PATH"
  echo -e "${GREEN}Added fix import to FastPlannerApp.jsx${NC}"
fi

echo -e "${GREEN}Waypoint mode fix applied successfully!${NC}"
echo ""
echo -e "${YELLOW}Usage:${NC}"
echo "1. Reload the Fast Planner application"
echo "2. Use the 'Waypoint Mode' button to toggle between waypoint mode and normal mode"
echo "3. In waypoint mode, click on the map to add navigation waypoints (yellow markers)"
echo "4. In normal mode, click on the map to add stops (red markers)"
echo ""
echo -e "${YELLOW}Note:${NC} If you encounter any issues, you can restore the backup with:"
echo "cp \"$BACKUP_PATH\" \"$APP_PATH\""
