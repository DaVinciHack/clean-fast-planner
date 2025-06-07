#!/bin/bash

# apply-waypoint-stop-fix.sh
# 
# This script copies our waypoint fix files to the right location in the running application

# Exit on error
set -e

echo "Applying waypoint vs. stop fix to running application..."

# Base directory where the fix files are located
BASE_DIR=$(dirname "$0")
PUBLIC_DIR="${BASE_DIR}/public"

# Copy direct-waypoint-vs-stop-fix.js to the public directory
echo "Copying direct-waypoint-vs-stop-fix.js to public directory..."
cp "${BASE_DIR}/direct-waypoint-vs-stop-fix.js" "${PUBLIC_DIR}/"

# Confirm that the files are in place
echo "Checking that the fix files are in place..."
if [ -f "${PUBLIC_DIR}/direct-waypoint-vs-stop-fix.js" ]; then
  echo "✅ direct-waypoint-vs-stop-fix.js is in place"
else
  echo "❌ direct-waypoint-vs-stop-fix.js is missing!"
  exit 1
fi

if [ -f "${PUBLIC_DIR}/waypoint-stop-debug.js" ]; then
  echo "✅ waypoint-stop-debug.js is in place"
else
  echo "❌ waypoint-stop-debug.js is missing!"
  exit 1
fi

if [ -f "${PUBLIC_DIR}/auto-apply-fix.js" ]; then
  echo "✅ auto-apply-fix.js is in place"
else
  echo "❌ auto-apply-fix.js is missing!"
  exit 1
fi

# Print instructions for the user
echo ""
echo "Waypoint vs. Stop fix files are now in place."
echo "To apply the fix:"
echo "1. Open http://localhost:8080 in your browser"
echo "2. The fix will be automatically applied when the page loads"
echo "3. Check the debug monitor in the top-right corner for status"
echo ""
echo "If the debug monitor is not visible, you can manually load it by adding this to your browser console:"
echo "const script = document.createElement('script'); script.src = '/waypoint-stop-debug.js'; document.head.appendChild(script);"
echo ""
echo "For more information, see WAYPOINT_STOP_FIX_README.md"

echo "Fix application complete!"
