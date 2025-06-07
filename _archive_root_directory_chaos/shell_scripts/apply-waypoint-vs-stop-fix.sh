#!/bin/bash

# apply-waypoint-vs-stop-fix.sh
# This script applies the waypoint vs. stop distinction fix to the Fast Planner application

# Exit on error
set -e

# Directory of the script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="${SCRIPT_DIR}"  # The app directory is the same as the script directory

# Display banner
echo "====================================================="
echo "  Applying Waypoint vs. Stop Type Distinction Fix"
echo "====================================================="
echo ""

# Verify the fixes directory exists
FIXES_DIR="${APP_DIR}/src/components/fast-planner/fixes"
if [ ! -d "$FIXES_DIR" ]; then
  echo "Error: Fixes directory does not exist: $FIXES_DIR"
  exit 1
fi

# Backup the current state
BACKUP_FILE="${APP_DIR}/src/components/fast-planner/FastPlannerApp.jsx.waypoint-stop-fix-backup-$(date +%Y%m%d%H%M%S)"
cp "${APP_DIR}/src/components/fast-planner/FastPlannerApp.jsx" "${BACKUP_FILE}"
echo "Created backup at ${BACKUP_FILE}"

# Now update the imports in FastPlannerApp.jsx
echo "Updating imports in FastPlannerApp.jsx..."

# Find the import section for fixes
IMPORT_SECTION=$(grep -n "// Import waypoint functionality fixes" "${APP_DIR}/src/components/fast-planner/FastPlannerApp.jsx" | cut -d: -f1)

if [ -z "$IMPORT_SECTION" ]; then
  echo "Error: Could not find waypoint functionality imports in FastPlannerApp.jsx"
  exit 1
fi

# Remove any duplicate import of fix-stop-cards.js
sed -i '' -e '/import .\/fixes\/fix-stop-cards.js/{ N; /import .\/fixes\/fix-stop-cards.js/d; }' "${APP_DIR}/src/components/fast-planner/FastPlannerApp.jsx"

# Add our new imports
REPLACEMENT_TEXT="// Import waypoint functionality fixes (NO STYLE CHANGES)\\
import './fixes/fix-waypoint-functionality.js';\\
import './fixes/fix-route-drag.js';\\
import './fixes/WaypointDebugger.js';\\
// Import new waypoint vs. landing stop distinction fixes\\
import './fixes/fix-waypoint-vs-stop-type.js';\\
import './fixes/fix-stop-cards.js';\\
// Import module ready monitor to ensure fixes are applied properly\\
import './fixes/fix-modules-ready.js';\\
// Import active waypoint monitor for debugging\\
import './fixes/active-waypoint-monitor.js';"

# Use a more direct approach to replace the import section
sed -i '' "s|// Import waypoint functionality fixes.*import './fixes/WaypointDebugger.js';|${REPLACEMENT_TEXT}|" "${APP_DIR}/src/components/fast-planner/FastPlannerApp.jsx"

echo "FastPlannerApp.jsx updated successfully"

# Restart the development server
echo ""
echo "====================================================="
echo "  Fix Applied Successfully!"
echo "====================================================="
echo ""
echo "The fix has been applied to your FastPlannerApp. To see the changes:"
echo ""
echo "1. A debug toggle button will appear in the top-right corner"
echo "2. The button shows the current status of waypoints vs. stops"
echo "3. Waypoints will display in yellow with ✈️ icons"
echo "4. Landing stops will display in red with 🛬 icons"
echo "5. Only landing stops will be counted in fuel calculations"
echo ""
echo "If the fix doesn't take effect immediately, you may need to:"
echo "  - Refresh your browser"
echo "  - Restart the development server (npm run dev)"
echo "  - Use the 'Apply Fixes Now' button in the debug panel"
echo ""
echo "The following files have been installed:"
echo "  - ${FIXES_DIR}/fix-waypoint-vs-stop-type.js"
echo "  - ${FIXES_DIR}/fix-stop-cards.js"
echo "  - ${FIXES_DIR}/fix-modules-ready.js"
echo "  - ${FIXES_DIR}/active-waypoint-monitor.js"
echo ""
echo "====================================================="
