#!/bin/bash

# apply-manual-fixes.sh
# This script manually replaces the existing route drag fix and adds our new marker size fix

# Exit on error
set -e

# Directory of the script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"

# Backup the current state
BACKUP_FILE="${APP_DIR}/FastPlannerApp.jsx.waypoint-fixes-backup-$(date +%Y%m%d%H%M%S)"
cp "${APP_DIR}/FastPlannerApp.jsx" "${BACKUP_FILE}"
echo "Created backup at ${BACKUP_FILE}"

# Use sed to replace the import of fix-route-drag.js with our enhanced version and add the marker size fix
echo "Updating imports in FastPlannerApp.jsx..."

# First, replace the import of fix-route-drag.js with our enhanced version
sed -i '' -e "s/import '.\/fixes\/fix-route-drag.js';/import '.\/fixes\/enhanced-fix-route-drag.js';/" "${APP_DIR}/FastPlannerApp.jsx"

# Now, add the marker size fix right after the enhanced route drag import
sed -i '' -e "/import '.\/fixes\/enhanced-fix-route-drag.js';/a\\
import '.\/fixes\/fix-waypoint-marker-size.js'; // Import waypoint marker size fix" "${APP_DIR}/FastPlannerApp.jsx"

echo "✅ Successfully updated imports in FastPlannerApp.jsx!"
echo "Applied two fixes:"
echo "1. Enhanced route drag fix - Ensures waypoints are added at the correct position when dragging the route line"
echo "2. Waypoint marker size fix - Makes pins smaller and shows labels only when zoomed in"

# Make the script executable
chmod +x "${SCRIPT_DIR}/apply-manual-fixes.sh"
