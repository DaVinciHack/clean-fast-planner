#!/bin/bash

# apply-waypoint-types-fix.sh
# Script to fix the waypoint types issue to show all types, including REPORTING POINT OFFSHORE

# Exit on error
set -e

# Directory of the script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$SCRIPT_DIR"

echo "Applying waypoint types fix to the Fast Planner..."

# First, check that our fix file exists
if [ ! -f "${SCRIPT_DIR}/fixes/fix-waypoint-types.js" ]; then
  echo "Error: Required fix file not found: ${SCRIPT_DIR}/fixes/fix-waypoint-types.js"
  exit 1
fi

# Backup current FastPlannerApp.jsx
BACKUP_FILE="${APP_DIR}/FastPlannerApp.jsx.waypoint-types-fix-backup-$(date +%Y%m%d%H%M%S)"
cp "${APP_DIR}/FastPlannerApp.jsx" "${BACKUP_FILE}"
echo "Created backup at ${BACKUP_FILE}"

# Verify the imports are present
IMPORT_BLOCK_MODIFIED=$(grep -c "import './fixes/fix-waypoint-types.js" "${APP_DIR}/FastPlannerApp.jsx" || echo "0")

if [ "$IMPORT_BLOCK_MODIFIED" -eq "0" ]; then
  echo "Warning: The import statement for the waypoint types fix was not found."
  echo "Adding import statement to FastPlannerApp.jsx..."
  
  # Add the import after the enhance-region-waypoint-handling.js import
  sed -i '' 's/import .\/fixes\/enhance-region-waypoint-handling.js.*$/&\nimport "\.\/fixes\/fix-waypoint-types.js"; \/\/ Fix for loading all waypoint types/' "${APP_DIR}/FastPlannerApp.jsx"
  
  echo "Import statement added."
else
  echo "Verified waypoint types fix imports are present."
fi

echo "Waypoint types fix applied successfully!"
echo ""
echo "This fix does the following:"
echo "1. Expands the types of waypoints loaded from OSDK to include all relevant types"
echo "2. Makes two separate OSDK queries to ensure all waypoint types are included"
echo "3. Adds a reloadWaypoints function to PlatformManager for forcing a reload"
echo "4. Automatically triggers a reload if few waypoints are found"
echo ""
echo "Please refresh your browser to apply the changes."
echo "If you currently have waypoint mode active, deactivate and reactivate it to see the fix in action."
