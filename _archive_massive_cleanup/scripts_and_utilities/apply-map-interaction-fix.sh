#!/bin/bash

# Script to apply the comprehensive map interaction fix

echo "Applying comprehensive map interaction fix..."

# Directory of the script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FIX_FILE="${SCRIPT_DIR}/fixes/fix-map-interaction-comprehensive.js"
APP_FILE="${SCRIPT_DIR}/FastPlannerApp.jsx"

# Check if the fix file exists
if [ ! -f "$FIX_FILE" ]; then
  echo "ERROR: Fix file not found at $FIX_FILE"
  exit 1
fi

# Backup the current state
BACKUP_FILE="${APP_FILE}.map-interaction-fix-backup-$(date +%Y%m%d%H%M%S)"
cp "${APP_FILE}" "${BACKUP_FILE}"
echo "Created backup at ${BACKUP_FILE}"

# Update FastPlannerApp.jsx to include the fix
echo "Updating FastPlannerApp.jsx to include the comprehensive fix..."

# Find the import statement for essential fixes
IMPORT_BLOCK=$(grep -n "// Import essential fixes" "${APP_FILE}" | cut -d: -f1)

if [ -z "$IMPORT_BLOCK" ]; then
  echo "Error: Could not find essential fixes import block in FastPlannerApp.jsx"
  exit 1
fi

# Update the import block to include our fix
sed -i '' -e "${IMPORT_BLOCK},+20s#.*fix-add-waypoint.js.*#// IMPORTANT: Consolidated fix for map click issues\nimport './fixes/fix-map-interaction-comprehensive.js'; // Comprehensive fix for map interaction issues#" "${APP_FILE}"

echo "Successfully added comprehensive map interaction fix to FastPlannerApp.jsx"

# Update the fix file's permissions if needed
chmod +x "$FIX_FILE"

echo "Fix applied successfully! Please reload the page to see changes."
