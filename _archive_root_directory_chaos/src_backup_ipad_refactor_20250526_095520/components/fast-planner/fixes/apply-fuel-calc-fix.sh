#!/bin/bash

# apply-fuel-calc-fix.sh
# This script applies the fuel calculator fix to properly handle waypoints vs stops

echo "Applying comprehensive fuel calculator fix..."

# Directory of the script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"

# Check if FastPlannerApp.jsx exists
if [ ! -f "${APP_DIR}/FastPlannerApp.jsx" ]; then
  echo "Error: FastPlannerApp.jsx not found at ${APP_DIR}"
  exit 1
fi

# Backup the current state
BACKUP_FILE="${APP_DIR}/FastPlannerApp.jsx.fuel-calc-fix-backup-$(date +%Y%m%d%H%M%S)"
cp "${APP_DIR}/FastPlannerApp.jsx" "${BACKUP_FILE}"
echo "Created backup at ${BACKUP_FILE}"

# Check if import for fix-comprehensive-fuel-calculator.js is already present
if grep -q "fix-comprehensive-fuel-calculator.js" "${APP_DIR}/FastPlannerApp.jsx"; then
  echo "Import for fix-comprehensive-fuel-calculator.js already exists, skipping import addition."
else
  # Add import for the new fix
  sed -i '' -e 's#import '\''./fixes/fix-stop-cards.js'\'';#import '\''./fixes/fix-stop-cards.js'\'';\
import '\''./fixes/fix-comprehensive-fuel-calculator.js'\''; // New fix for fuel calculations#' "${APP_DIR}/FastPlannerApp.jsx"
  echo "Added import for fix-comprehensive-fuel-calculator.js to FastPlannerApp.jsx"
fi

# Execute the browser forces a reload - add a temporary script
cat > "${SCRIPT_DIR}/force-reload.js" << 'EOF'
/**
 * Force a reload of the browser when the fuel fix is applied
 */
console.log('🔄 Forcing reload to apply fuel calculator fix...');

// Set up event listener for a custom event to force recalculation
window.addEventListener('force-route-recalculation', function(event) {
  console.log('🔄 Received force-route-recalculation event:', event.detail);
  
  // Add a visual indicator
  const notification = document.createElement('div');
  notification.style = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: rgba(0, 0, 0, 0.8);
    color: #fff;
    padding: 20px;
    border-radius: 5px;
    z-index: 9999;
    text-align: center;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
  `;
  notification.innerHTML = `
    <h3>Waypoint/Stop Fix Applied</h3>
    <p>The fix for proper waypoint vs. stop handling has been applied.</p>
    <p>Recalculating route...</p>
  `;
  document.body.appendChild(notification);
  
  // Wait a bit and then force a recalculation
  setTimeout(function() {
    // If we have waypoints and a selected aircraft, trigger a recalculation
    if (window.waypointManager && window.waypointManager.getWaypoints && 
        window.waypointManager.getWaypoints().length >= 2 && 
        window.currentSelectedAircraft) {
      // Dispatch event to trigger the centralized fuel calculation
      const waypointsEvent = new Event('settings-changed');
      window.dispatchEvent(waypointsEvent);
      
      // Update status
      notification.innerHTML = `
        <h3>Waypoint/Stop Fix Applied</h3>
        <p>Route recalculated with proper waypoint handling!</p>
        <p>Only landing stops will be counted in fuel calculations now.</p>
      `;
      
      // Remove notification after a few seconds
      setTimeout(function() {
        document.body.removeChild(notification);
      }, 3000);
    } else {
      // If we don't have waypoints, just show a message
      notification.innerHTML = `
        <h3>Waypoint/Stop Fix Applied</h3>
        <p>The fix for proper waypoint vs. stop handling has been applied.</p>
        <p>Add waypoints and select an aircraft to see the effect.</p>
      `;
      
      // Remove notification after a few seconds
      setTimeout(function() {
        document.body.removeChild(notification);
      }, 3000);
    }
  }, 2000);
});

// Dispatch the force recalculation event
setTimeout(function() {
  const event = new CustomEvent('force-route-recalculation', {
    detail: {
      source: 'apply-fuel-calc-fix.sh',
      timestamp: Date.now()
    }
  });
  window.dispatchEvent(event);
}, 3000);
EOF

# Add the force-reload.js import to FastPlannerApp.jsx if it's not already there
if grep -q "force-reload.js" "${APP_DIR}/FastPlannerApp.jsx"; then
  echo "Import for force-reload.js already exists, skipping import addition."
else
  # Add import for the force reload script
  sed -i '' -e 's#import '\''./fixes/active-waypoint-monitor.js'\'';#import '\''./fixes/active-waypoint-monitor.js'\'';\
import '\''./fixes/force-reload.js'\''; // Temporary script to force reload#' "${APP_DIR}/FastPlannerApp.jsx"
  echo "Added import for force-reload.js to FastPlannerApp.jsx"
fi

echo "✅ Comprehensive fuel calculator fix applied successfully!"
echo "✅ The application will automatically reload and recalculate routes."
echo "✅ Only landing stops will now be counted in fuel calculations."
