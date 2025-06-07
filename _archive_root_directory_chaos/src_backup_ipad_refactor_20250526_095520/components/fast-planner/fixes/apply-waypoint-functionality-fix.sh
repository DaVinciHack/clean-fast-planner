#!/bin/bash
# apply-waypoint-functionality-fix.sh
# 
# This script applies ONLY the functional fixes to waypoint handling
# No style changes are made

# Define color codes for better output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Applying waypoint FUNCTIONALITY fixes to Fast Planner...${NC}"

# Define paths
APP_PATH="/Users/duncanburbury/FastPlannerMaster/FastPlannerV5/src/components/fast-planner/FastPlannerApp.jsx"
BACKUP_PATH="/Users/duncanburbury/FastPlannerMaster/FastPlannerV5/src/components/fast-planner/FastPlannerApp.jsx.functionality-fix-backup"

# Create a backup
cp "$APP_PATH" "$BACKUP_PATH"
echo -e "${GREEN}Created backup at: ${BACKUP_PATH}${NC}"

# Check if the fix import is already present
if grep -q "import './fixes/fix-waypoint-functionality.js'" "$APP_PATH"; then
  echo -e "${YELLOW}Fix import already present, skipping...${NC}"
else
  # Add the import statement for the fix
  # Find the last import statement
  LAST_IMPORT_LINE=$(grep -n "import " "$APP_PATH" | tail -1 | cut -d: -f1)
  
  # Insert the fix import after the last import
  TEMP_FILE=$(mktemp)
  head -n $LAST_IMPORT_LINE "$APP_PATH" > "$TEMP_FILE"
  echo "" >> "$TEMP_FILE" # Add an empty line
  echo "// Import waypoint functionality fix (NO STYLE CHANGES)" >> "$TEMP_FILE"
  echo "import './fixes/fix-waypoint-functionality.js';" >> "$TEMP_FILE"
  echo "" >> "$TEMP_FILE" # Add an empty line
  tail -n +$((LAST_IMPORT_LINE + 1)) "$APP_PATH" >> "$TEMP_FILE"
  
  # Replace the original file
  mv "$TEMP_FILE" "$APP_PATH"
  echo -e "${GREEN}Added fix import to FastPlannerApp.jsx${NC}"
fi

echo -e "${GREEN}Waypoint functionality fix applied!${NC}"
echo ""
echo -e "${YELLOW}Key fixes:${NC}"
echo "1. Ensures waypoints are properly tagged when added in waypoint mode" 
echo "2. Fixes route drag to correctly create waypoints or stops based on mode"
echo "3. Ensures global waypoint mode flag is properly recognized"
echo ""
echo -e "${YELLOW}Usage after applying fix:${NC}"
echo "1. Reload the Fast Planner application"
echo "2. When in waypoint mode, waypoints will be properly created as waypoints, not stops"
echo "3. For debugging, open browser console and type: window.debugRouteWaypoints()"
echo ""
echo -e "${YELLOW}Note:${NC} If you need to restore the backup:"
echo "cp \"$BACKUP_PATH\" \"$APP_PATH\""
