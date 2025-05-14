#!/bin/bash

# apply-waypoint-drag-size-fix.sh
# This script applies both the enhanced route drag fix and waypoint marker size fix

# Exit on error
set -e

# Directory of the script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"

# Backup the current state
BACKUP_FILE="${APP_DIR}/FastPlannerApp.jsx.waypoint-drag-size-fix-backup-$(date +%Y%m%d%H%M%S)"
cp "${APP_DIR}/FastPlannerApp.jsx" "${BACKUP_FILE}"
echo "Created backup at ${BACKUP_FILE}"

# Update imports in FastPlannerApp.jsx
echo "Updating imports in FastPlannerApp.jsx..."

# Find the import statement block for the waypoint functionality fixes
IMPORT_BLOCK=$(grep -n "// Import waypoint functionality fixes" "${APP_DIR}/FastPlannerApp.jsx" | cut -d: -f1)

if [ -z "$IMPORT_BLOCK" ]; then
  echo "Error: Could not find waypoint functionality imports in FastPlannerApp.jsx"
  exit 1
fi

# Update the import block to include our new fixes instead of the old fix-route-drag
sed -i '' -e "${IMPORT_BLOCK},+15s#import './fixes/fix-route-drag.js';#// Enhanced fixes for dragging and marker size\nimport './fixes/enhanced-fix-route-drag.js';\nimport './fixes/fix-waypoint-marker-size.js';#" "${APP_DIR}/FastPlannerApp.jsx"

echo "Updated imports successfully"

# Make script executable
chmod +x "${SCRIPT_DIR}/apply-waypoint-drag-size-fix.sh"

echo "✅ Successfully applied waypoint drag and size fixes!"
echo "These fixes should ensure proper waypoint insertion when dragging and make waypoint pins smaller with labels only showing when zoomed in."
