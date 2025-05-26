#!/bin/bash

# apply-osdk-fix.sh
# Applies emergency fix for OSDK client and layer flickering

# Exit on error
set -e

# Directory of the script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"

# Backup the current state
BACKUP_FILE="${APP_DIR}/FastPlannerApp.jsx.osdk-fix-backup-$(date +%Y%m%d%H%M%S)"
cp "${APP_DIR}/FastPlannerApp.jsx" "${BACKUP_FILE}"
echo "Created backup at ${BACKUP_FILE}"

# Find line number for import insertion
IMPORT_LINE=$(grep -n "import './fixes/fix-map-layer-issues.js';" "${APP_DIR}/FastPlannerApp.jsx" | cut -d: -f1)

if [ -z "$IMPORT_LINE" ]; then
  # Try another common import line
  IMPORT_LINE=$(grep -n "import './fixes/fix-waypoint-functionality.js';" "${APP_DIR}/FastPlannerApp.jsx" | cut -d: -f1)
fi

if [ -z "$IMPORT_LINE" ]; then
  echo "Error: Could not find import line for insertion"
  exit 1
fi

# Create temporary file for new import line
echo "import './fixes/fix-osdk-layer-loading.js'; // EMERGENCY FIX for OSDK client issues" > "${SCRIPT_DIR}/temp_import.txt"

# Insert new import line before the target import
sed -i '' "${IMPORT_LINE}i\\
$(cat ${SCRIPT_DIR}/temp_import.txt)
" "${APP_DIR}/FastPlannerApp.jsx"

# Clean up temporary file
rm "${SCRIPT_DIR}/temp_import.txt"

echo "OSDK client and layer flickering fix applied!"
echo "Restart the application to see the changes."
