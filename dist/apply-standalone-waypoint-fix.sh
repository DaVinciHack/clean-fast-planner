#!/bin/bash
# apply-standalone-waypoint-fix.sh
#
# This script applies the standalone waypoint fix to the Fast Planner application

echo "STANDALONE WAYPOINT FIX INSTALLER"
echo "================================="
echo "This will install a standalone fix for waypoint functionality"
echo "without modifying React code (which has been problematic)."
echo ""

# Ensure required files exist
check_files=(
  "/Users/duncanburbury/FastPlannerMaster/FastPlannerV5/public/waypoint-fix.js"
  "/Users/duncanburbury/FastPlannerMaster/FastPlannerV5/public/waypoint-fix-injection.html"
  "/Users/duncanburbury/FastPlannerMaster/FastPlannerV5/public/waypoint-manager-patch.js"
  "/Users/duncanburbury/FastPlannerMaster/FastPlannerV5/public/WAYPOINT_FIX_README.md"
)

missing_files=false
for file in "${check_files[@]}"; do
  if [ ! -f "$file" ]; then
    echo "ERROR: Missing required file: $file"
    missing_files=true
  fi
done

if [ "$missing_files" = true ]; then
  echo "Some required files are missing. Please ensure all fix files are in place."
  exit 1
fi

# Make sure waypoint-manager-patch.js is included in waypoint-fix.js
if ! grep -q "waypoint-manager-patch.js" "/Users/duncanburbury/FastPlannerMaster/FastPlannerV5/public/waypoint-fix.js"; then
  # Add the include to the waypoint-fix.js file
  sed -i "" '6i\
  // Load the WaypointManager patch\
  document.addEventListener("DOMContentLoaded", function() {\
    const script = document.createElement("script");\
    script.src = "/waypoint-manager-patch.js?v=" + Date.now();\
    script.type = "text/javascript";\
    document.head.appendChild(script);\
    console.log("WAYPOINT FIX: Loaded WaypointManager patch");\
  });
' "/Users/duncanburbury/FastPlannerMaster/FastPlannerV5/public/waypoint-fix.js"
  
  echo "Added WaypointManager patch reference to waypoint-fix.js"
fi

# Apply the fix to index.html
echo "Applying fix to index.html..."
bash /Users/duncanburbury/FastPlannerMaster/FastPlannerV5/public/apply-waypoint-fix.sh

echo ""
echo "STANDALONE WAYPOINT FIX INSTALLED!"
echo "=================================="
echo "The waypoint functionality should now work correctly."
echo ""
echo "NEXT STEPS:"
echo "1. Restart your development server"
echo "2. Test the waypoint functionality:"
echo "   - Click the 'Waypoint Mode' button"
echo "   - Add waypoints by clicking on the map"
echo "   - Verify that waypoints are properly added"
echo ""
echo "DEBUGGING:"
echo "If needed, use these functions in the browser console:"
echo "- window.debugWaypoints() - List all waypoints with their types"
echo "- window.setWaypointMode(true) - Enable waypoint mode"
echo "- window.setWaypointMode(false) - Disable waypoint mode"
echo ""
echo "For more information, see:"
echo "/Users/duncanburbury/FastPlannerMaster/FastPlannerV5/public/WAYPOINT_FIX_README.md"
