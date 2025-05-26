#!/bin/bash

# apply-waypoint-types-complete-fix.sh
# This script applies the comprehensive waypoint types fix to the Fast Planner application

# Exit on error
set -e

# Directory of the script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"

# Backup the current state
BACKUP_FILE="${APP_DIR}/FastPlannerApp.jsx.waypoint-types-complete-fix-backup-$(date +%Y%m%d%H%M%S)"
cp "${APP_DIR}/FastPlannerApp.jsx" "${BACKUP_FILE}"
echo "Created backup at ${BACKUP_FILE}"

# Apply our fixes to import at the top of FastPlannerApp.jsx
echo "Updating imports in FastPlannerApp.jsx..."

# Find the import statement block for the waypoint functionality fixes
IMPORT_BLOCK=$(grep -n "// Import waypoint functionality fixes" "${APP_DIR}/FastPlannerApp.jsx" | cut -d: -f1)

if [ -z "$IMPORT_BLOCK" ]; then
  echo "Warning: Could not find waypoint functionality imports in FastPlannerApp.jsx"
  echo "Attempting to find any import statements..."
  
  # Try to find the last import statement in the file
  LAST_IMPORT=$(grep -n "import " "${APP_DIR}/FastPlannerApp.jsx" | tail -1 | cut -d: -f1)
  
  if [ -z "$LAST_IMPORT" ]; then
    echo "Error: Could not find any import statements. Cannot continue."
    exit 1
  fi
  
  # Use the line after the last import
  IMPORT_BLOCK=$((LAST_IMPORT + 1))
  echo "Using line after last import: $IMPORT_BLOCK"
  
  # Insert a new import block
  sed -i '' -e "${IMPORT_BLOCK}i\\
// Import waypoint functionality fixes\\
import './fixes/fix-complete-waypoint-types.js';\\
" "${APP_DIR}/FastPlannerApp.jsx"
else
  # Update the existing import block
  # First, check if our fix is already included
  if grep -q "fix-complete-waypoint-types.js" "${APP_DIR}/FastPlannerApp.jsx"; then
    echo "Fix already included in imports. Skipping update."
  else
    # Find the end of the import block
    END_IMPORT_BLOCK=$(tail -n +$IMPORT_BLOCK "${APP_DIR}/FastPlannerApp.jsx" | grep -n "import " | head -1 | cut -d: -f1)
    
    if [ -z "$END_IMPORT_BLOCK" ]; then
      # If no more imports after the block, just add to the block
      sed -i '' -e "${IMPORT_BLOCK}a\\
import './fixes/fix-complete-waypoint-types.js';\\
" "${APP_DIR}/FastPlannerApp.jsx"
    else
      # Insert before the next import block
      INSERT_LINE=$((IMPORT_BLOCK + END_IMPORT_BLOCK - 1))
      sed -i '' -e "${INSERT_LINE}i\\
import './fixes/fix-complete-waypoint-types.js';\\
" "${APP_DIR}/FastPlannerApp.jsx"
    fi
  fi
fi

echo "Fix applied successfully!"
echo "You should now reload the application to see the changes."
