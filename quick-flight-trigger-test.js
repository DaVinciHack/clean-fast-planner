// Quick test script to force flight loading trigger
// Copy and paste this into browser console

// Step 1: Force waypoint manager callback
if (window.waypointManager && window.currentFlightData?.waypoints) {
  console.log('🚀 FORCE: Triggering waypoint manager onChange callback...');
  const waypoints = window.currentFlightData.waypoints;
  window.waypointManager.triggerCallback('onChange', waypoints);
  console.log('✅ Triggered with', waypoints.length, 'waypoints');
}

// Step 2: Force React state update
if (window.setWaypoints && window.currentFlightData?.waypoints) {
  console.log('🚀 FORCE: Calling setWaypoints directly...');
  window.setWaypoints([...window.currentFlightData.waypoints]);
  console.log('✅ setWaypoints called');
}

// Step 3: Check if it worked
setTimeout(() => {
  const inputs = document.querySelectorAll('#route-input input');
  console.log('📊 RESULT: Left panel now has', inputs.length, 'inputs');
  if (inputs.length > 0) {
    console.log('🎉 SUCCESS: Left panel populated!');
  } else {
    console.log('❌ FAIL: Left panel still empty');
  }
}, 500);