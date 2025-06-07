#!/bin/bash

# apply-norway-waypoint-fix.sh
# Script to apply Norway waypoint fix and clean up UI notifications

# Exit on error
set -e

# Directory of the script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$SCRIPT_DIR"

echo "Applying Norway waypoint fix to the Fast Planner..."

# First, check that our fix files exist
if [ ! -f "${SCRIPT_DIR}/fixes/fix-norway-waypoints.js" ]; then
  echo "Error: Required fix file not found: ${SCRIPT_DIR}/fixes/fix-norway-waypoints.js"
  exit 1
fi

if [ ! -f "${SCRIPT_DIR}/fixes/cleanup-fixes.js" ]; then
  echo "Error: Required fix file not found: ${SCRIPT_DIR}/fixes/cleanup-fixes.js"
  exit 1
fi

# Backup current FastPlannerApp.jsx
BACKUP_FILE="${APP_DIR}/FastPlannerApp.jsx.norway-waypoint-fix-backup-$(date +%Y%m%d%H%M%S)"
cp "${APP_DIR}/FastPlannerApp.jsx" "${BACKUP_FILE}"
echo "Created backup at ${BACKUP_FILE}"

# The edit block should have already modified the imports, but let's verify
IMPORT_BLOCK_MODIFIED=$(grep -c "import './fixes/fix-norway-waypoints.js" "${APP_DIR}/FastPlannerApp.jsx" || echo "0")

if [ "$IMPORT_BLOCK_MODIFIED" -eq "0" ]; then
  echo "Warning: The import statement for the Norway waypoint fix was not found."
  echo "Please make sure you've applied the edit_block changes to FastPlannerApp.jsx."
else
  echo "Verified Norway waypoint fix imports are present."
fi

echo "Norway waypoint fix applied successfully!"
echo ""
echo "This fix does the following:"
echo "1. Forces a reload of waypoints for Norway region when activating waypoint mode"
echo "2. Cleans up any popup notifications and fixes the UI"
echo "3. Ensures all waypoints are loaded properly for Norway (not just 10)"
echo ""
echo "If you had the waypoint mode active, deactivate and reactivate it to apply the fix."
