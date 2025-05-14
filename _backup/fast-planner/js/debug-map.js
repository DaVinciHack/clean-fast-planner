console.log("Debug map.js loaded");

function testMapObject() {
  // Check what map object is available
  if (typeof mapboxgl === 'undefined') {
    console.error("MAPBOX IS NOT DEFINED");
    return;
  }
  
  console.log("Mapbox is defined");
  
  // Check if there's a map instance we can access
  let mapInstance = null;
  
  // Try various ways to access the map
  if (window.map) {
    mapInstance = window.map;
    console.log("Found map as window.map");
  } else if (window.FastPlanner && window.FastPlanner.map) {
    mapInstance = window.FastPlanner.map;
    console.log("Found map as window.FastPlanner.map");
  } else {
    console.error("NO MAP INSTANCE FOUND");
    return;
  }
  
  // Test map instance by adding a marker at a fixed position
  try {
    new mapboxgl.Marker({color: "#FF0000"})
      .setLngLat([0, 0])
      .addTo(mapInstance);
    console.log("Successfully added test marker at 0,0");
    
    // Try to add a marker at Gulf of Mexico
    new mapboxgl.Marker({color: "#00FF00"})
      .setLngLat([-90.5, 27.5])
      .addTo(mapInstance);
    console.log("Successfully added test marker at Gulf of Mexico");
  } catch (error) {
    console.error("ERROR ADDING MARKER:", error);
  }
}

// Run the test function on page load
window.addEventListener('load', function() {
  console.log("Window loaded, running map test");
  
  // Add test button
  const testBtn = document.createElement('button');
  testBtn.textContent = "Test Map Object";
  testBtn.style.position = "fixed";
  testBtn.style.top = "10px";
  testBtn.style.left = "50%";
  testBtn.style.transform = "translateX(-50%)";
  testBtn.style.zIndex = "9999";
  testBtn.style.padding = "10px";
  testBtn.style.backgroundColor = "red";
  testBtn.style.color = "white";
  testBtn.style.fontWeight = "bold";
  testBtn.style.border = "none";
  testBtn.style.borderRadius = "5px";
  testBtn.style.cursor = "pointer";
  
  testBtn.addEventListener('click', function() {
    console.log("Test map button clicked");
    testMapObject();
  });
  
  document.body.appendChild(testBtn);
  
  // Test if we can detect clicks directly on map element
  const mapElement = document.getElementById('map');
  if (mapElement) {
    console.log("Found map element");
    
    mapElement.addEventListener('click', function(e) {
      console.log("Direct DOM click on map element", e.clientX, e.clientY);
      
      // Add visual marker at click position
      const marker = document.createElement('div');
      marker.style.position = "absolute";
      marker.style.width = "20px";
      marker.style.height = "20px";
      marker.style.backgroundColor = "red";
      marker.style.borderRadius = "50%";
      marker.style.top = (e.clientY - 10) + "px";
      marker.style.left = (e.clientX - 10) + "px";
      marker.style.zIndex = "9999";
      
      document.body.appendChild(marker);
    }, true); // Using capture phase to catch all events
  }
});
