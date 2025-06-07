#!/bin/bash

# apply-map-layer-fix.sh
# This script applies the comprehensive fix for map layer issues in Fast Planner

# Exit on error
set -e

# Directory of the script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"

# Backup the current state
BACKUP_FILE="${APP_DIR}/FastPlannerApp.jsx.map-layer-fix-backup-$(date +%Y%m%d%H%M%S)"
cp "${APP_DIR}/FastPlannerApp.jsx" "${BACKUP_FILE}"
echo "Created backup at ${BACKUP_FILE}"

# Add the import line for our new fix at the top of the imports section
echo "Adding import for map layer fix..."

# Find the import section in FastPlannerApp.jsx
IMPORT_SECTION=$(grep -n "// Import waypoint functionality fixes" "${APP_DIR}/FastPlannerApp.jsx" | cut -d: -f1)

if [ -z "$IMPORT_SECTION" ]; then
  echo "Error: Could not find waypoint functionality imports section in FastPlannerApp.jsx"
  exit 1
fi

# Insert our new import line after the section heading
sed -i '' "${IMPORT_SECTION}a\\
import './fixes/fix-map-layer-issues.js'; // CRITICAL FIX for map layers and waypoint mode\\
" "${APP_DIR}/FastPlannerApp.jsx"

echo "Fix successfully applied!"
echo "The map layer issues and waypoint mode problems should now be fixed."

# Run the app (if it's not already running)
echo "Starting Fast Planner app..."
cd "${APP_DIR}/../.."
npm start &
