#!/bin/bash

# apply-emergency-fix.sh
# This script applies the emergency OSDK and layer fix directly

# Exit on error
set -e

# Directory of the script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"

# Backup the current state
BACKUP_FILE="${APP_DIR}/FastPlannerApp.jsx.emergency-fix-backup-$(date +%Y%m%d%H%M%S)"
cp "${APP_DIR}/FastPlannerApp.jsx" "${BACKUP_FILE}"
echo "Created backup at ${BACKUP_FILE}"

# Create the emergency fix import statement
echo "Adding import for emergency OSDK layer fix..."

# Find the import section in FastPlannerApp.jsx
IMPORT_SECTION=$(grep -n "// Import waypoint functionality fixes" "${APP_DIR}/FastPlannerApp.jsx" | cut -d: -f1)

if [ -z "$IMPORT_SECTION" ]; then
  echo "Error: Could not find waypoint functionality imports section in FastPlannerApp.jsx"
  exit 1
fi

# Insert our new import line at the top of the imports section
sed -i '' "${IMPORT_SECTION}a\\
import '../../emergency-osdk-layer-fix.js'; // EMERGENCY FIX for OSDK client and layer flickering\\
" "${APP_DIR}/FastPlannerApp.jsx"

echo "Emergency fix applied! This should fix both the OSDK client issue and layer flickering."
echo "You can restart the application to see the changes."

# Also let the user know about the console option
echo ""
echo "ALTERNATIVE: If you prefer not to restart, you can use the emergency fix directly in the browser console:"
echo "1. Open browser developer tools (F12 or right-click -> Inspect)"
echo "2. Go to the Console tab"
echo "3. Copy and paste the contents of emergency-osdk-layer-fix.js"
echo "4. Press Enter to apply the fix without restarting"
