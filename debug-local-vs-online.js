// Debug script to compare local vs online flight loading
// Run this in console after flight loads (both locally and online)

console.log('🔬 LOCAL vs ONLINE DEBUG - Flight Loading Analysis');
console.log('='.repeat(60));

// 1. Flight Data Structure
console.log('📊 1. FLIGHT DATA STRUCTURE:');
if (window.currentFlightData) {
  console.log('  ✅ currentFlightData exists');
  console.log('  - displayWaypoints:', window.currentFlightData.displayWaypoints?.length || 'NONE');
  console.log('  - waypoints:', window.currentFlightData.waypoints?.length || 'NONE');
  console.log('  - stops:', window.currentFlightData.stops?.length || 'NONE');
  console.log('  - _rawFlight:', !!window.currentFlightData._rawFlight);
  
  if (window.currentFlightData._rawFlight) {
    console.log('  - _rawFlight.displayWaypoints:', window.currentFlightData._rawFlight.displayWaypoints?.length || 'NONE');
  }
  
  // Show first waypoint as example
  if (window.currentFlightData.waypoints?.length > 0) {
    console.log('  - First waypoint sample:', window.currentFlightData.waypoints[0]);
  }
} else {
  console.log('  ❌ currentFlightData MISSING');
}

// 2. Manager States
console.log('\n📊 2. MANAGER STATES:');
console.log('  - waypointManager:', !!window.waypointManager);
console.log('  - waypointManager.waypoints:', window.waypointManager?.waypoints?.length || 0);
console.log('  - waypointManager.callbacks:', !!window.waypointManager?.callbacks);
console.log('  - waypointManager.callbacks.onChange:', !!window.waypointManager?.callbacks?.onChange);

// 3. React State
console.log('\n📊 3. REACT STATE:');
console.log('  - setWaypoints function:', typeof window.setWaypoints);
console.log('  - setStopCards function:', typeof window.setStopCards);

// 4. Left Panel State
console.log('\n📊 4. LEFT PANEL STATE:');
const leftPanelInputs = document.querySelectorAll('#route-input input');
console.log('  - Input fields found:', leftPanelInputs.length);
leftPanelInputs.forEach((input, i) => {
  console.log(`  - Input ${i}: "${input.value}"`);
});

// 5. Authentication State
console.log('\n📊 5. AUTHENTICATION STATE:');
console.log('  - isAuthenticated:', window.isAuthenticated);
console.log('  - userName:', window.userName);
console.log('  - client:', !!window.client);

// 6. Timing Check
console.log('\n📊 6. TIMING CHECK:');
console.log('  - Page loaded time:', performance.now(), 'ms');
console.log('  - DOM ready state:', document.readyState);

// 7. Console Logs Check
console.log('\n📊 7. RECENT CONSOLE ACTIVITY:');
console.log('  Check for recent flight loading logs above this message');
console.log('  Look for: "🔥 FLIGHT LOAD", "handleFlightLoad", "Priority 1/2/3"');

console.log('\n🔬 DEBUG COMPLETE');
console.log('📝 Copy this output and compare local vs online results');