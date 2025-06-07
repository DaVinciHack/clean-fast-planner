#!/bin/bash

# apply-complete-route-drag-fix.sh
# This script applies the complete route drag fix to the Fast Planner application

# Exit on error
set -e

# Directory of the script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"

# Create a backup of the FastPlannerApp.jsx file
BACKUP_FILE="${APP_DIR}/FastPlannerApp.jsx.route-drag-fix-backup-$(date +%Y%m%d%H%M%S)"
cp "${APP_DIR}/FastPlannerApp.jsx" "${BACKUP_FILE}"
echo "Created backup at ${BACKUP_FILE}"

# Apply our fix to FastPlannerApp.jsx
echo "Updating FastPlannerApp.jsx to include the complete route drag fix..."

# Prepare the new import line to add
NEW_IMPORT="import './fixes/complete-route-drag-fix.js'; // Complete fix for route drag issues"

# Find the line above which to add our import
MARKER_LINE="// Import enhanced fuel calculator modules"
LINE_NUM=$(grep -n "${MARKER_LINE}" "${APP_DIR}/FastPlannerApp.jsx" | cut -d: -f1)

if [ -z "$LINE_NUM" ]; then
  echo "Error: Could not find marker line in FastPlannerApp.jsx"
  exit 1
fi

# Insert our import above the marker line
sed -i '' "${LINE_NUM}i\\
${NEW_IMPORT}\\
" "${APP_DIR}/FastPlannerApp.jsx"

echo "Successfully updated FastPlannerApp.jsx"

# Ensure the fix file permissions are set correctly
chmod +x "${SCRIPT_DIR}/complete-route-drag-fix.js"
echo "Set execute permissions on fix file"

echo "Complete route drag fix has been applied successfully!"
echo ""
echo "To test the fix:"
echo "1. Reload the application in your browser"
echo "2. Create a route with at least 2 points"
echo "3. Drag the route line between two points to add a new point"
echo "4. Verify the new point is added at the correct position"
echo ""
echo "You can also run window.testRouteDragFix() in the browser console to test the fix automatically."
