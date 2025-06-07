// Script to manually test route display functionality
// This script should be run in the browser console when the map is loaded

console.log("🔍 Route display test script starting...");

function testRouteDisplay() {
  // Wait for key components to be available
  if (!window.waypointManager || !window.mapManager || !window.map) {
    console.log("❌ Required components not available yet. Run this script when the map is fully loaded.");
    return;
  }

  console.log("✅ Found required components for testing");
  console.log("📍 WaypointManager available:", !!window.waypointManager);
  console.log("🗺️ MapManager available:", !!window.mapManager);
  console.log("🌎 Map available:", !!window.map);

  // Check if any waypoints already exist
  const existingWaypoints = window.waypointManager.getWaypoints();
  console.log(`Found ${existingWaypoints.length} existing waypoints`);

  // Clear existing waypoints
  window.waypointManager.clearRoute();
  console.log("Cleared existing waypoints");

  // Create test waypoints
  // These example coordinates are in the Gulf of Mexico
  const testCoordinates = [
    [-90.0, 27.5], // First point
    [-89.5, 28.0], // Second point
    [-89.0, 27.8], // Third point
    [-88.5, 28.2]  // Fourth point
  ];

  // Add test waypoints
  console.log("Adding test waypoints...");
  testCoordinates.forEach((coords, index) => {
    window.waypointManager.addWaypoint(coords, `Test Stop ${index + 1}`);
  });

  // Create a mock route stats object
  const mockRouteStats = {
    distanceOnly: false,
    aircraft: {
      cruiseSpeed: 120, // Sample cruise speed in knots
      name: "Test Aircraft"
    },
    legs: testCoordinates.slice(0, -1).map((coords, index) => {
      return {
        from: coords,
        to: testCoordinates[index + 1],
        distance: 30 + (index * 5), // Sample distances
        time: 0.25 + (index * 0.1) // Sample times in hours
      };
    }),
    timeHours: 0.7, // Total time in hours
    estimatedTime: "00:42", // Formatted time
    tripFuel: 300, // Sample fuel amount
    totalFuel: 350 // Sample total fuel amount
  };

  // Force update the route with our mock stats
  console.log("Updating route with mock route stats...");
  window.waypointManager.updateRoute(mockRouteStats);

  // Log success
  console.log("✅ Test route creation completed. Check the map for the route display.");
  console.log("👀 Look for pill elements with route distance and time info");
  console.log("👀 Verify arrow directions follow the direction of the waypoints");

  // Center the map on our test route
  const bounds = new window.mapboxgl.LngLatBounds();
  testCoordinates.forEach(coord => bounds.extend(coord));
  window.map.fitBounds(bounds, { padding: 100, duration: 1000 });
}

// Run the test
testRouteDisplay();
