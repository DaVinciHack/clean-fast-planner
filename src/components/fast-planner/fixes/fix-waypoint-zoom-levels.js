/**
 * fix-waypoint-zoom-levels.js
 * 
 * This fix adds zoom-level based styling for waypoints on the map
 * It sets a data-zoom-level attribute on the map container that CSS can target
 */

(function() {
  console.log('📍 Applying zoom-level based waypoint styling fix');
  
  // Wait for the map to be available
  const checkInterval = setInterval(() => {
    if (!window.mapManager || !window.mapManager.getMap) {
      return;
    }
    
    const map = window.mapManager.getMap();
    if (!map) {
      return;
    }
    
    clearInterval(checkInterval);
    
    console.log('📍 Found map, setting up zoom-level detection');
    
    // Function to update zoom level attribute
    const updateZoomLevelAttribute = () => {
      const currentZoom = map.getZoom();
      console.log(`📍 Map zoom changed to: ${currentZoom}`);
      
      // Set zoom level attribute for CSS targeting
      const zoomLevel = currentZoom < 9 ? 'low' : (currentZoom < 13 ? 'medium' : 'high');
      
      // Find the map container
      const mapContainer = map.getContainer();
      if (mapContainer) {
        mapContainer.setAttribute('data-zoom-level', zoomLevel);
        console.log(`📍 Set map container zoom level to: ${zoomLevel}`);
      }
    };
    
    // Set initial zoom level
    updateZoomLevelAttribute();
    
    // Update zoom level attribute on zoom change
    map.on('zoomend', updateZoomLevelAttribute);
    
    // Apply additional styling to make waypoints smaller
    const addSmallWaypointStyle = () => {
      // Check if style already exists
      if (document.getElementById('small-waypoint-style')) {
        return;
      }
      
      // Create style element
      const styleSheet = document.createElement('style');
      styleSheet.id = 'small-waypoint-style';
      styleSheet.innerHTML = `
        /* Override default waypoint marker size */
        .mapboxgl-marker {
          transform-origin: center;
        }
        
        /* Make the SVG pin markers smaller */
        .mapboxgl-marker svg {
          transform-origin: center;
          transform: scale(0.3) !important;
        }
        
        /* Make OSDK waypoint dots tiny (3px) */
        .mapboxgl-map circle[data-layer="osdk-waypoints-layer"] {
          r: 1.5 !important; /* SVG radius for 3px diameter */
        }
        
        /* Adjust OSDK waypoint sizes based on zoom */
        .mapboxgl-map[data-zoom-level="low"] circle[data-layer="osdk-waypoints-layer"] {
          r: 1.5 !important; /* 3px at low zoom */
        }
        
        .mapboxgl-map[data-zoom-level="medium"] circle[data-layer="osdk-waypoints-layer"] {
          r: 2.5 !important; /* 5px at medium zoom */
        }
        
        .mapboxgl-map[data-zoom-level="high"] circle[data-layer="osdk-waypoints-layer"] {
          r: 4 !important; /* 8px at high zoom */
        }
        
        /* Hide waypoint labels at low zoom */
        .mapboxgl-map[data-zoom-level="low"] .marker-label,
        .mapboxgl-map[data-zoom-level="low"] text[data-layer="osdk-waypoints-labels"] {
          display: none !important;
        }
        
        /* Show small labels at medium zoom */
        .mapboxgl-map[data-zoom-level="medium"] text[data-layer="osdk-waypoints-labels"] {
          font-size: 8px !important;
        }
        
        /* Show larger labels at high zoom */
        .mapboxgl-map[data-zoom-level="high"] text[data-layer="osdk-waypoints-labels"] {
          font-size: 10px !important;
        }
      `;
      
      // Add style to document
      document.head.appendChild(styleSheet);
      console.log('📍 Added small waypoint style to document');
    };
    
    // Apply small waypoint style
    addSmallWaypointStyle();
    
    console.log('✅ Successfully applied zoom-level based waypoint styling fix');
  }, 1000);
  
  // Set a timeout to clear the interval if map never becomes available
  setTimeout(() => {
    clearInterval(checkInterval);
  }, 30000);
})();
