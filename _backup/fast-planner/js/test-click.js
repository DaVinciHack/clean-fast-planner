// Simple test script to debug map clicks
console.log('Test click script loaded');

// Add a click event listener directly to the map div
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded in test click script');
  
  // Get the map element
  const mapElement = document.getElementById('map');
  if (mapElement) {
    console.log('Found map element');
    
    // Add a direct click handler
    mapElement.addEventListener('click', function(e) {
      console.log('Direct map element click:', e.clientX, e.clientY);
      
      // Create a visible marker at the click location to verify clicks
      const marker = document.createElement('div');
      marker.style.position = 'absolute';
      marker.style.left = (e.clientX - 5) + 'px';
      marker.style.top = (e.clientY - 5) + 'px';
      marker.style.width = '10px';
      marker.style.height = '10px';
      marker.style.borderRadius = '50%';
      marker.style.backgroundColor = 'red';
      marker.style.zIndex = '9999';
      document.body.appendChild(marker);
    });
  } else {
    console.error('Map element not found');
  }
  
  // Add handler for direct waypoint button
  const directWaypointBtn = document.getElementById('test-direct-waypoint');
  if (directWaypointBtn) {
    console.log('Found test direct waypoint button');
    
    directWaypointBtn.addEventListener('click', function() {
      console.log('Direct waypoint button clicked');
      
      // Hard-coded waypoint in Gulf of Mexico
      const coords = [-90.5, 27.5];
      
      // Try different methods of adding a waypoint
      console.log('Adding direct mapbox marker');
      
      // Method 1: Add marker directly using mapboxgl
      if (window.mapboxgl) {
        try {
          const map = window.FastPlanner ? window.FastPlanner.map : null;
          if (map) {
            // Create a marker directly with mapboxgl
            new mapboxgl.Marker({
              color: '#FF00FF' // Magenta
            })
              .setLngLat(coords)
              .addTo(map);
            
            console.log('Direct mapboxgl marker added successfully');
          } else {
            console.error('FastPlanner.map not available');
          }
        } catch (error) {
          console.error('Error adding direct mapboxgl marker:', error);
        }
      }
      
      // Method 2: Try to call the waypoint function directly
      console.log('Trying to call addWaypoint directly');
      try {
        if (window.addWaypoint && typeof window.addWaypoint === 'function') {
          window.addWaypoint(coords, 'Direct Test');
          console.log('Called window.addWaypoint successfully');
        } else if (window.FastPlanner && typeof window.FastPlanner.addWaypoint === 'function') {
          window.FastPlanner.addWaypoint(coords, 'Fast Planner Test');
          console.log('Called FastPlanner.addWaypoint successfully');
        } else {
          console.error('No addWaypoint function found');
        }
      } catch (error) {
        console.error('Error calling addWaypoint:', error);
      }
    });
  } else {
    console.error('Direct waypoint button not found');
  }
  
  // Listen for Mapbox map load event
  const checkForMap = setInterval(() => {
    if (window.FastPlanner && window.FastPlanner.map) {
      console.log('FastPlanner map found');
      clearInterval(checkForMap);
      
      const map = window.FastPlanner.map;
      
      // Make sure the map is fully loaded
      if (map.loaded()) {
        setupMapClickTest(map);
      } else {
        map.on('load', () => {
          setupMapClickTest(map);
        });
      }
    }
  }, 500);
  
  // Stop checking after 10 seconds
  setTimeout(() => clearInterval(checkForMap), 10000);
});

function setupMapClickTest(map) {
  console.log('Setting up map click test');
  
  // Add a simple click handler to the map
  map.on('click', (e) => {
    console.log('Mapbox map click:', e.lngLat.lat, e.lngLat.lng);
    
    // Add a marker
    new mapboxgl.Marker({
      color: '#00FF00'
    })
      .setLngLat(e.lngLat)
      .addTo(map);
  });
}
