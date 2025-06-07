#!/bin/bash

# emergency-fix.sh - Apply all critical fixes to resolve application lockups

# Exit on error
set -e

echo "🚨 Applying emergency fixes to Fast Planner..."

# Directory of the script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"

# Backup the current FastPlannerApp.jsx
BACKUP_FILE="${APP_DIR}/FastPlannerApp.jsx.emergency-fix-backup-$(date +%Y%m%d%H%M%S)"
cp "${APP_DIR}/FastPlannerApp.jsx" "${BACKUP_FILE}"
echo "📄 Created backup at ${BACKUP_FILE}"

# Fix the imports section to use our safer versions
echo "🔧 Updating imports in FastPlannerApp.jsx..."

# Find the import statements section
IMPORT_FIXES_BLOCK=$(grep -n "// Import essential fixes" "${APP_DIR}/FastPlannerApp.jsx" | cut -d: -f1)

if [ -z "$IMPORT_FIXES_BLOCK" ]; then
  echo "❌ Error: Could not find essential fixes import section in FastPlannerApp.jsx"
  exit 1
fi

# Update the import section with our safer versions
sed -i '' -e "${IMPORT_FIXES_BLOCK},+20s#// CRITICAL:.*#// CRITICAL: Simple map click fix that prevents duplicate clicks\\
import './fixes/simple-map-click-fix.js';\\
// CRITICAL: Our new fixes to solve the interaction issues\\
import './fixes/fix-conflict-resolver.js';\\
import './fixes/safe-waypoint-handler.js';\\
import './fixes/fix-hook-dependencies.js';\\
// Emergency reset button that appears if the app locks up\\
import './fixes/emergency-reset-button.js';#" "${APP_DIR}/FastPlannerApp.jsx"

echo "✅ Updated imports successfully"

# Ensure our fix files exist
echo "🔍 Checking for existence of fix files..."

# List of required fix files
FIX_FILES=(
  "fix-conflict-resolver.js"
  "safe-waypoint-handler.js"
  "fix-hook-dependencies.js"
  "emergency-reset-button.js"
)

# Check each file
for file in "${FIX_FILES[@]}"; do
  if [ ! -f "${APP_DIR}/fixes/${file}" ]; then
    echo "❌ Error: Fix file '${file}' not found. Critical fixes are missing."
    exit 1
  fi
done

echo "✅ All required fix files found"

# Apply any CSS fixes that may be necessary
echo "🎨 Applying CSS fixes..."

# Create CSS fixes if needed
if [ ! -f "${APP_DIR}/fixes/emergency-css-fixes.css" ]; then
  echo "🔧 Creating emergency CSS fixes..."
  
  cat > "${APP_DIR}/fixes/emergency-css-fixes.css" << 'EOF'
/* Emergency CSS fixes to prevent UI issues */

/* Ensure panels are above the map */
.left-panel, .right-panel, .route-stats-card {
  z-index: 100 !important;
  pointer-events: auto !important;
  position: relative !important;
}

/* Ensure child elements receive clicks */
.left-panel *, .right-panel *, .route-stats-card * {
  pointer-events: auto !important;
}

/* Prevent click events from getting delayed */
.maplibregl-canvas, .mapboxgl-canvas {
  touch-action: none !important;
}

/* Ensure map controls always work */
.maplibregl-ctrl-group, .mapboxgl-ctrl-group {
  z-index: 101 !important;
  pointer-events: auto !important;
}

/* Emergency reset button */
#emergency-reset-button {
  z-index: 10000 !important;
}
EOF
  
  echo "✅ Created emergency CSS fixes"
  
  # Import the CSS file
  if grep -q "emergency-css-fixes.css" "${APP_DIR}/FastPlannerApp.jsx"; then
    echo "📝 CSS imports already exist"
  else
    # Find the CSS imports line
    CSS_IMPORT_LINE=$(grep -n "./FastPlannerStyles.css" "${APP_DIR}/FastPlannerApp.jsx" | cut -d: -f1)
    
    if [ -n "$CSS_IMPORT_LINE" ]; then
      # Add our CSS import after the existing CSS import
      sed -i '' -e "${CSS_IMPORT_LINE}a\\
import './fixes/emergency-css-fixes.css'; // Emergency CSS fixes" "${APP_DIR}/FastPlannerApp.jsx"
      
      echo "✅ Added emergency CSS import"
    else
      echo "⚠️ Warning: Could not find CSS import line, skipping CSS import"
    fi
  fi
else
  echo "📝 Emergency CSS fixes already exist"
fi

echo "🎉 Emergency fixes have been applied successfully!"
echo "🔄 You may need to restart the application for all fixes to take effect."
echo "🚨 If the application is still locked up, use the Emergency Reset button that will appear after 15 seconds of inactivity."
