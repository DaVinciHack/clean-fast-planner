// Debug script to test flight loading trigger sequence
// Run this in browser console after flight loads but left panel is empty

console.log('🔬 DEBUG: Starting flight loading trigger sequence test...');

// Test 1: Check if flight data exists
console.log('📊 TEST 1: Flight data check');
console.log('  window.currentFlightData:', !!window.currentFlightData);
console.log('  window.loadedFlightData:', !!window.loadedFlightData);
if (window.currentFlightData) {
  console.log('  currentFlightData.waypoints:', window.currentFlightData.waypoints?.length || 0);
}

// Test 2: Check managers
console.log('📊 TEST 2: Manager check');
console.log('  window.waypointManager:', !!window.waypointManager);
console.log('  window.waypointManagerRef:', !!window.waypointManagerRef);
if (window.waypointManager) {
  console.log('  waypointManager.waypoints:', window.waypointManager.waypoints?.length || 0);
}

// Test 3: Check React state setters
console.log('📊 TEST 3: React state setters');
console.log('  window.setWaypoints:', typeof window.setWaypoints);
console.log('  window.setStopCards:', typeof window.setStopCards);

// Test 4: Manual trigger - what happens when we manually add a waypoint
console.log('📊 TEST 4: Manual waypoint addition simulation');
if (window.waypointManager && window.currentFlightData?.waypoints?.length > 0) {
  console.log('🚀 TRIGGERING: Manual waypoint manager update...');
  
  // Get the flight waypoints
  const flightWaypoints = window.currentFlightData.waypoints;
  console.log('  Flight waypoints to process:', flightWaypoints.length);
  
  // Method 1: Set waypoints in waypoint manager directly
  console.log('🔥 METHOD 1: Set waypoints in manager');
  window.waypointManager.waypoints = [...flightWaypoints];
  
  // Method 2: Trigger the onChange callback manually
  console.log('🔥 METHOD 2: Trigger onChange callback');
  if (window.waypointManager.callbacks?.onChange) {
    window.waypointManager.callbacks.onChange([...flightWaypoints]);
    console.log('  ✅ onChange callback triggered');
  } else {
    console.log('  ❌ onChange callback not found');
  }
  
  // Method 3: Call React setWaypoints directly
  console.log('🔥 METHOD 3: Direct React setWaypoints');
  if (window.setWaypoints) {
    window.setWaypoints([...flightWaypoints]);
    console.log('  ✅ setWaypoints called directly');
  } else {
    console.log('  ❌ setWaypoints not available');
  }
  
} else {
  console.log('❌ Cannot simulate - missing waypointManager or flight data');
}

// Test 5: Check if left panel responds
setTimeout(() => {
  console.log('📊 TEST 5: Left panel check (after 1 second)');
  const leftPanelInputs = document.querySelectorAll('#route-input input');
  console.log('  Left panel inputs found:', leftPanelInputs.length);
  leftPanelInputs.forEach((input, i) => {
    console.log(`  Input ${i}: "${input.value}"`);
  });
}, 1000);

console.log('🔬 DEBUG: Flight loading trigger test complete. Check results above.');