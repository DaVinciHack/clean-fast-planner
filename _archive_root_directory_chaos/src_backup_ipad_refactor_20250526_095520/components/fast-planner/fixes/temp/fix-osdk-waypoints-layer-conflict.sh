#!/bin/bash

# fix-osdk-waypoints-layer-conflict.sh
# This script fixes the "Layer with id 'osdk-waypoints-labels' already exists on this map" error
# by modifying the PlatformManager to properly check for layer existence before adding

# Exit on error
set -e

# Directory of the script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"

# Print header
echo "========================================================"
echo "         OSDK Waypoints Layer Conflict Fix              "
echo "========================================================"
echo "This script will fix the 'Layer already exists' error by:"
echo "1. Creating a proper fix file for safe layer handling"
echo "2. Updating FastPlannerApp.jsx imports"
echo "3. Removing any emergency fix that might cause conflicts"
echo ""

# Create a backup of the current FastPlannerApp.jsx
BACKUP_FILE="${APP_DIR}/FastPlannerApp.jsx.layer-fix-backup-$(date +%Y%m%d%H%M%S)"
cp "${APP_DIR}/FastPlannerApp.jsx" "${BACKUP_FILE}"
echo "Created backup at ${BACKUP_FILE}"

# Copy our fix file into the fixes directory
echo "Installing OSDK waypoints layer fix file..."
cp "${SCRIPT_DIR}/temp/fix-osdk-waypoints-layer.js" "${APP_DIR}/fixes/"
echo "Fix file installed to ${APP_DIR}/fixes/fix-osdk-waypoints-layer.js"

# Add our fix to FastPlannerApp.jsx imports
echo "Updating imports in FastPlannerApp.jsx..."

# 1. Find any imports of emergency-waypoint-fix.js and comment them out
sed -i '' -e "s/import '\.\/fixes\/emergency-waypoint-fix\.js';/\/\/ REMOVED: import '\.\/fixes\/emergency-waypoint-fix\.js'; \/\/ Causing layer conflicts/g" "${APP_DIR}/FastPlannerApp.jsx"

# 2. Add our new fix after fix-map-layers.js
sed -i '' -e "/import '\.\/fixes\/fix-map-layers\.js';/a\\
// IMPORTANT NEW FIX: Fix for 'Layer already exists' error\\
import './fixes/fix-osdk-waypoints-layer.js';" "${APP_DIR}/FastPlannerApp.jsx"

echo "FastPlannerApp.jsx updated successfully."

# Instructions for the user
echo ""
echo "Fix has been applied successfully!"
echo "Please restart the application to see the changes."
echo ""
echo "If you still see the error, please check for any other sources"
echo "that might be adding the 'osdk-waypoints-labels' layer."
echo "========================================================"
