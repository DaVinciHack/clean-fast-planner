#!/bin/bash

# apply-region-waypoint-fix.sh
# Script to enhance region-waypoint integration to fix Norway waypoint loading issues

# Exit on error
set -e

# Directory of the script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$SCRIPT_DIR"

echo "Applying enhanced region-waypoint integration fix to the Fast Planner..."

# First, check that our fix files exist
if [ ! -f "${SCRIPT_DIR}/fixes/enhance-region-waypoint-handling.js" ]; then
  echo "Error: Required fix file not found: ${SCRIPT_DIR}/fixes/enhance-region-waypoint-handling.js"
  exit 1
fi

# Backup current FastPlannerApp.jsx
BACKUP_FILE="${APP_DIR}/FastPlannerApp.jsx.region-waypoint-fix-backup-$(date +%Y%m%d%H%M%S)"
cp "${APP_DIR}/FastPlannerApp.jsx" "${BACKUP_FILE}"
echo "Created backup at ${BACKUP_FILE}"

# Verify the imports are present
IMPORT_BLOCK_MODIFIED=$(grep -c "import './fixes/enhance-region-waypoint-handling.js" "${APP_DIR}/FastPlannerApp.jsx" || echo "0")

if [ "$IMPORT_BLOCK_MODIFIED" -eq "0" ]; then
  echo "Warning: The import statement for the region-waypoint integration fix was not found."
  echo "Adding import statement to FastPlannerApp.jsx..."
  
  # Add the import after the Norway waypoint fix
  sed -i '' 's/import .\/fixes\/fix-norway-waypoints.js.*$/&\nimport "\.\/fixes\/enhance-region-waypoint-handling.js"; \/\/ Enhanced fix for region-waypoint integration/' "${APP_DIR}/FastPlannerApp.jsx"
  
  echo "Import statement added."
else
  echo "Verified region-waypoint fix imports are present."
fi

echo "Enhanced region-waypoint fix applied successfully!"
echo ""
echo "This fix does the following:"
echo "1. Adds region-awareness to waypoint caching"
echo "2. Clears waypoint cache when switching between regions (e.g., Gulf to Norway)"
echo "3. Properly tracks active region for waypoint loading"
echo "4. Automatically resets waypoint mode when region changes"
echo ""
echo "Please restart your application for the changes to take effect."
echo "If you had the waypoint mode active, you'll need to toggle it again after region change."
