#!/bin/bash

# Script to apply the waypoint mode fix
# This script modifies the MapInteractionHandler.js and WaypointHandler.js files
# to fix the issue with duplicate waypoints being added when in waypoint mode.

echo "Applying waypoint mode fix..."

# Path to the files - corrected paths
MAP_HANDLER_PATH="/Users/duncanburbury/FastPlannerMaster/FastPlannerV5/src/components/fast-planner/modules/MapInteractionHandler.js"
WAYPOINT_HANDLER_PATH="/Users/duncanburbury/FastPlannerMaster/FastPlannerV5/src/components/fast-planner/modules/WaypointHandler.js"

# Create backups
echo "Creating backups..."
cp "$MAP_HANDLER_PATH" "${MAP_HANDLER_PATH}.before-waypoint-fix"
cp "$WAYPOINT_HANDLER_PATH" "${WAYPOINT_HANDLER_PATH}.before-waypoint-fix"

echo "Backups created."

# Fix 1: Modify MapInteractionHandler.js to check for waypoint mode
echo "Fixing MapInteractionHandler.js..."

# Using sed to modify the file
# This adds a check at the beginning of the handleMapClick method
# to ignore clicks when in waypoint mode
sed -i '' 's/handleMapClick(e) {/handleMapClick(e) {\n  \/\/ CRITICAL FIX: Check if waypoint mode is active\n  if (window.waypointHandler \&\& window.waypointHandler.isEnabled()) {\n    console.log('"'"'🚫 MapInteractionHandler: Ignoring map click because waypoint mode is active'"'"');\n    return; \/\/ Completely ignore the click event\n  }\n/' "$MAP_HANDLER_PATH"

# Fix 2: Modify WaypointHandler.js to properly update the global flag
echo "Fixing WaypointHandler.js..."

# Using sed to modify the setEnabled method
sed -i '' 's/setEnabled(enabled) {/setEnabled(enabled) {\n  console.log(`🟡 WaypointHandler: ${enabled ? '"'"'Enabling'"'"' : '"'"'Disabling'"'"'} waypoint mode`);\n  \n  \/\/ CRITICAL FIX: Update the global flag\n  window.isWaypointModeActive = enabled;\n/' "$WAYPOINT_HANDLER_PATH"

# Using sed to modify the handleWaypointClick method
sed -i '' 's/handleWaypointClick(e) {/handleWaypointClick(e) {\n  \/\/ Only process if waypoint mode is enabled\n  if (!this.enabled) return;\n  \n  console.log('"'"'🟡 WaypointHandler: Map clicked for waypoint'"'"');\n  \n  \/\/ CRITICAL FIX: Stop event propagation to prevent other handlers from firing\n  e.stopPropagation();\n/' "$WAYPOINT_HANDLER_PATH"

# Add code to force route redraw after adding a waypoint
sed -i '' 's/this.addWaypoint(\[e.lngLat.lng, e.lngLat.lat\]);/this.addWaypoint(\[e.lngLat.lng, e.lngLat.lat\]);\n  \n  \/\/ CRITICAL FIX: Force redraw of route\n  setTimeout(() => {\n    if (this.waypointManager \&\& this.waypointManager.updateRoute) {\n      this.waypointManager.updateRoute();\n    }\n  }, 50);/' "$WAYPOINT_HANDLER_PATH"

echo "Fix applied successfully."
echo ""
echo "The fix makes the following changes:"
echo "1. MapInteractionHandler now checks if waypoint mode is active and ignores clicks"
echo "2. WaypointHandler now properly updates the global waypoint mode flag" 
echo "3. WaypointHandler now stops event propagation to prevent duplicate handlers"
echo ""
echo "Restart the app to see the changes."
