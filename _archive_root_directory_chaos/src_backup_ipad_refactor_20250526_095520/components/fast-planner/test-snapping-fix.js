/**
 * test-snapping-fix.js
 * 
 * This script tests if our waypoint snapping fix is working properly.
 * Run it in the console after the application has loaded to test the snapping behavior.
 */

// Function to test map click with various scenarios
function testMapClickSnapping() {
  console.log('=== TESTING MAP CLICK SNAPPING ===');
  
  // Get the map interaction handler
  const handler = window.mapInteractionHandler;
  
  if (!handler) {
    console.error('Map interaction handler not found!');
    return;
  }
  
  // Mock a map click event
  const mockClick = {
    lngLat: { lat: 58.8, lng: 5.6 },  // Near Stavanger
    point: { x: 100, y: 100 }
  };
  
  // Register a temporary callback to see what's triggered
  const originalCallback = handler.callbacks.onPlatformClick;
  
  let callbackData = null;
  handler.callbacks.onPlatformClick = (data) => {
    console.log('onPlatformClick callback received data:', data);
    callbackData = data;
    
    // Call original callback if exists
    if (originalCallback) originalCallback(data);
  };
  
  // Test normal mode
  console.log('Testing in normal mode (stop)...');
  window.isWaypointModeActive = false;
  handler.handleMapClick(mockClick);
  
  // Delay to allow the snapping to complete, then test waypoint mode
  setTimeout(() => {
    console.log('Testing in waypoint mode...');
    window.isWaypointModeActive = true;
    handler.handleMapClick(mockClick);
    
    // Restore the original callback
    setTimeout(() => {
      handler.callbacks.onPlatformClick = originalCallback;
      console.log('Test complete, restored original callback');
      
      console.log(`
=== TEST RESULTS ===
If the test worked correctly, you should have seen:
1. A message about finding a nearby platform or waypoint
2. A message about snapping to that point
3. The correct coordinates and name in the callback data

This should happen in both normal mode and waypoint mode.
      `);
    }, 1000);
  }, 1000);
}

// Function to test direct waypoint addition with snapping
function testDirectWaypointAddition() {
  console.log('=== TESTING DIRECT WAYPOINT ADDITION SNAPPING ===');
  
  // Get references to managers
  const waypointManager = window.waypointManager;
  const platformManager = window.platformManager;
  
  if (!waypointManager || !platformManager) {
    console.error('Required managers not found!');
    return;
  }
  
  // Coordinates near a known platform - Stavanger area
  const testCoords = [5.6, 58.8];
  
  // Track waypoints before and after
  const waypointsBefore = waypointManager.getWaypoints().length;
  
  console.log(`Current waypoints: ${waypointsBefore}`);
  console.log('Adding waypoint near Stavanger area...');
  
  // Use our fix in useWaypoints hook through window.addWaypointClean if available
  if (window.addWaypointClean) {
    window.addWaypointClean(testCoords);
  } else {
    // Try via the window.addWaypoint function if available
    if (typeof window.addWaypoint === 'function') {
      window.addWaypoint(testCoords);
    } else {
      // Fallback to direct waypointManager method
      waypointManager.addWaypoint(testCoords, null, {
        isWaypoint: window.isWaypointModeActive === true
      });
    }
  }
  
  // Check after a short delay
  setTimeout(() => {
    const waypointsAfter = waypointManager.getWaypoints().length;
    const lastWaypoint = waypointManager.getWaypoints()[waypointsAfter - 1];
    
    console.log(`
=== DIRECT ADDITION TEST RESULTS ===
Waypoints before: ${waypointsBefore}
Waypoints after: ${waypointsAfter}
Last waypoint: ${JSON.stringify(lastWaypoint, null, 2)}

If the test worked correctly:
1. A new waypoint should have been added
2. The new waypoint should have snapped to a nearby platform or waypoint
3. The waypoint name should match the nearest platform or waypoint name
    `);
  }, 1000);
}

// Run tests with a delay between them
console.log('Starting snapping fix tests...');
testMapClickSnapping();

setTimeout(() => {
  testDirectWaypointAddition();
}, 3000);
