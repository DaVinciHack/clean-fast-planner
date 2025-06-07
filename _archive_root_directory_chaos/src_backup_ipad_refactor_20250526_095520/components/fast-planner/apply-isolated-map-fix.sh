#!/bin/bash

# Script to apply the isolated map interactions fix

echo "Applying isolated map interactions fix..."

# Directory of the script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FIX_FILE="${SCRIPT_DIR}/fixes/isolated-map-interactions.js"
APP_FILE="${SCRIPT_DIR}/FastPlannerApp.jsx"

# Check if the fix file exists
if [ ! -f "$FIX_FILE" ]; then
  echo "ERROR: Fix file not found at $FIX_FILE"
  exit 1
fi

# Backup the current state
BACKUP_FILE="${APP_FILE}.isolated-map-fix-backup-$(date +%Y%m%d%H%M%S)"
cp "${APP_FILE}" "${BACKUP_FILE}"
echo "Created backup at ${BACKUP_FILE}"

# Update FastPlannerApp.jsx to include the fix
echo "Updating FastPlannerApp.jsx to include the isolated map interactions fix..."

# Find the import statement for essential fixes
IMPORT_BLOCK=$(grep -n "// Import essential fixes" "${APP_FILE}" | cut -d: -f1)

if [ -z "$IMPORT_BLOCK" ]; then
  echo "Error: Could not find essential fixes import block in FastPlannerApp.jsx"
  exit 1
fi

# Update the import block to include our fix
sed -i '' -e "${IMPORT_BLOCK},+20s#.*map-interaction.*#// CRITICAL: Completely isolated map interactions\n// This fix overrides ALL other click handlers and provides a single source of truth\nimport './fixes/isolated-map-interactions.js';#" "${APP_FILE}"

echo "Successfully added isolated map interactions fix to FastPlannerApp.jsx"

# Update the fix file's permissions if needed
chmod +x "$FIX_FILE"

echo "Fix applied successfully! Please reload the page to see changes."
