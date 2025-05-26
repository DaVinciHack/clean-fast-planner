#!/bin/bash
# apply-all-waypoint-fixes.sh
# 
# Applies all critical waypoint functionality fixes without style changes:
# 1. Fix waypoint detection and creation
# 2. Fix route dragging to properly add waypoints in waypoint mode
# 3. Add debug utilities

# Define color codes for better output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Applying ALL waypoint functionality fixes to Fast Planner...${NC}"

# Define paths
APP_PATH="/Users/duncanburbury/FastPlannerMaster/FastPlannerV5/src/components/fast-planner/FastPlannerApp.jsx"
BACKUP_PATH="/Users/duncanburbury/FastPlannerMaster/FastPlannerV5/src/components/fast-planner/FastPlannerApp.jsx.all-fixes-backup"

# Create a backup
cp "$APP_PATH" "$BACKUP_PATH"
echo -e "${GREEN}Created backup at: ${BACKUP_PATH}${NC}"

# Create a temporary file for modifications
TEMP_FILE=$(mktemp)

# Find the last import statement
LAST_IMPORT_LINE=$(grep -n "import " "$APP_PATH" | tail -1 | cut -d: -f1)

# Copy the file up to the last import
head -n $LAST_IMPORT_LINE "$APP_PATH" > "$TEMP_FILE"
echo "" >> "$TEMP_FILE"  # Add an empty line

# Add the fix imports
echo "// Import waypoint functionality fixes (NO STYLE CHANGES)" >> "$TEMP_FILE"
echo "import './fixes/fix-waypoint-functionality.js';" >> "$TEMP_FILE"
echo "import './fixes/fix-route-drag.js';" >> "$TEMP_FILE"
echo "import './fixes/WaypointDebugger.js';" >> "$TEMP_FILE"
echo "" >> "$TEMP_FILE"  # Add an empty line

# Copy the rest of the file
tail -n +$((LAST_IMPORT_LINE + 1)) "$APP_PATH" >> "$TEMP_FILE"

# Replace the original file
mv "$TEMP_FILE" "$APP_PATH"

echo -e "${GREEN}All waypoint fixes applied!${NC}"

echo ""
echo -e "${YELLOW}Applied fixes:${NC}"
echo "1. Proper waypoint creation in waypoint mode (fix-waypoint-functionality.js)"
echo "2. Route drag fix for waypoint mode (fix-route-drag.js)"
echo "3. Debugging utilities for verification (WaypointDebugger.js)"
echo ""
echo -e "${YELLOW}Debugging commands:${NC}"
echo "After loading the app, open the browser console (F12) and use:"
echo "- window.logWaypoints() - List all waypoints with type info"
echo "- window.verifyWaypointMode() - Check if waypoint mode is working"
echo "- window.testRouteDragFix() - Test if route dragging is fixed"
echo ""
echo -e "${YELLOW}To use these fixes:${NC}"
echo "1. Restart the Fast Planner application"
echo "2. Toggle 'Waypoint Mode' button to add waypoints"
echo "3. When dragging the route line in waypoint mode, waypoints will be added (not stops)"
echo ""
echo -e "${YELLOW}To restore the original version:${NC}"
echo "cp \"$BACKUP_PATH\" \"$APP_PATH\""
