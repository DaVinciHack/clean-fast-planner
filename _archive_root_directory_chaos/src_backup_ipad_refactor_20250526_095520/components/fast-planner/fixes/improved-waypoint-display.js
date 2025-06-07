/**
 * improved-waypoint-display.js
 * 
 * This fix improves waypoint display and labels based on zoom level:
 * 1. Makes waypoint dots smaller (1px instead of 3px)
 * 2. Hides labels on high-level zoom
 * 3. Shows labels at medium zoom level
 * 4. Makes labels bigger as user zooms in closer
 * 5. Only affects waypoints, not airports or rigs
 */

(function() {
  console.log('📍 Applying improved waypoint display and label fix');
  
  // Wait for platformManager and map to be available
  const checkInterval = setInterval(() => {
    if (!window.platformManager || !window.mapManager || !window.mapManager.getMap) {
      return;
    }
    
    const map = window.mapManager.getMap();
    if (!map) {
      return;
    }
    
    clearInterval(checkInterval);
    
    console.log('📍 Found map and platformManager, enhancing waypoint display');
    
    // 1. Override the default waypoint styling in the layer definition
    const enhanceWaypointLayers = () => {
      // This function overrides the _addOsdkWaypointsToMap method
      // but only modifies the paint and layout properties
      const originalAddOsdkWaypointsToMap = window.platformManager._addOsdkWaypointsToMap;
      
      window.platformManager._addOsdkWaypointsToMap = function() {
        try {
          const map = this.mapManager?.getMap();
          if (!map) {
            console.error("📍 Map not available");
            return null;
          }
          
          // Only override the method if we have the original
          if (typeof originalAddOsdkWaypointsToMap !== 'function') {
            console.error('📍 Original _addOsdkWaypointsToMap method not found');
            return;
          }
          
          // Call the original method first to set up layers
          const result = originalAddOsdkWaypointsToMap.call(this);
          
          // Wait a short time for layers to be created
          setTimeout(() => {
            try {
              // Get current zoom level to set initial visibility
              const currentZoom = map.getZoom();
              const labelsVisible = currentZoom >= 9;
              
              // Update circle layer style for waypoints
              if (map.getLayer('osdk-waypoints-layer')) {
                // Update paint properties for waypoint circles
                map.setPaintProperty('osdk-waypoints-layer', 'circle-radius', 1); // Smaller dots
                map.setPaintProperty('osdk-waypoints-layer', 'circle-color', '#FFCC00');
                map.setPaintProperty('osdk-waypoints-layer', 'circle-stroke-width', 1);
                map.setPaintProperty('osdk-waypoints-layer', 'circle-stroke-color', '#FFFFFF');
                
                console.log('📍 Updated waypoint circle styles to be smaller');
              }
              
              // Update labels layer
              if (map.getLayer('osdk-waypoints-labels')) {
                // Set initial visibility based on zoom level
                const initialVisibility = labelsVisible ? 'visible' : 'none';
                map.setLayoutProperty('osdk-waypoints-labels', 'visibility', initialVisibility);
                
                // Update label styles
                map.setLayoutProperty('osdk-waypoints-labels', 'text-size', [
                  'interpolate', ['linear'], ['zoom'],
                  // zoom level, text size
                  8, 0,      // No label below zoom level 8
                  9, 8,      // Small labels at zoom level 9
                  12, 10,    // Medium labels at zoom level 12
                  15, 12     // Larger labels at zoom level 15+
                ]);
                
                // Make text more visible with better halo
                map.setPaintProperty('osdk-waypoints-labels', 'text-halo-width', 1.5);
                map.setPaintProperty('osdk-waypoints-labels', 'text-halo-color', 'rgba(0, 0, 0, 0.8)');
                
                console.log('📍 Updated waypoint label styles with zoom-level scaling');
              }
            } catch (error) {
              console.error('📍 Error updating waypoint layer styles:', error);
            }
          }, 500);
          
          return result;
        } catch (error) {
          console.error('📍 Error in enhanced _addOsdkWaypointsToMap:', error);
          
          // Fall back to original method if enhanced version fails
          if (typeof originalAddOsdkWaypointsToMap === 'function') {
            return originalAddOsdkWaypointsToMap.call(this);
          }
        }
      };
    };
    
    // 2. Set up zoom change handler to show/hide labels
    const setupZoomHandler = () => {
      // Function to update label visibility based on zoom level
      const updateLabelVisibility = () => {
        const currentZoom = map.getZoom();
        console.log(`📍 Map zoom changed to: ${currentZoom}`);
        
        // Show labels only when zoomed in enough (zoom level >= 9)
        const labelsVisible = currentZoom >= 9;
        
        // Update labels layer visibility if it exists
        if (map.getLayer('osdk-waypoints-labels')) {
          map.setLayoutProperty(
            'osdk-waypoints-labels', 
            'visibility', 
            labelsVisible ? 'visible' : 'none'
          );
          
          console.log(`📍 Set waypoint labels visibility: ${labelsVisible ? 'visible' : 'hidden'}`);
        }
        
        // Set a data attribute on the map container for CSS targeting
        const mapContainer = map.getContainer();
        if (mapContainer) {
          const zoomLevel = currentZoom < 9 ? 'low' : (currentZoom < 12 ? 'medium' : 'high');
          mapContainer.setAttribute('data-zoom-level', zoomLevel);
        }
      };
      
      // Set initial label visibility
      updateLabelVisibility();
      
      // Update visibility when zoom changes
      map.on('zoomend', updateLabelVisibility);
      
      console.log('📍 Set up zoom handler for waypoint label visibility');
    };
    
    // 3. Apply CSS styles for marker labels
    const applyMarkerStyles = () => {
      // Check if styles already exist
      if (document.getElementById('waypoint-zoom-styles')) {
        return;
      }
      
      // Create style element
      const styleSheet = document.createElement('style');
      styleSheet.id = 'waypoint-zoom-styles';
      styleSheet.innerHTML = `
        /* Waypoint marker size based on zoom level */
        .mapboxgl-map[data-zoom-level="low"] .mapboxgl-marker[data-marker-type="waypoint"] svg {
          transform: scale(0.1) !important; /* Tiny at low zoom */
        }
        
        .mapboxgl-map[data-zoom-level="medium"] .mapboxgl-marker[data-marker-type="waypoint"] svg {
          transform: scale(0.2) !important; /* Medium at medium zoom */
        }
        
        .mapboxgl-map[data-zoom-level="high"] .mapboxgl-marker[data-marker-type="waypoint"] svg {
          transform: scale(0.4) !important; /* Larger at high zoom */
        }
        
        /* Waypoint label visibility and size based on zoom level */
        .waypoint-label {
          display: none; /* Hidden by default */
          position: absolute;
          bottom: 10px;
          left: 50%;
          transform: translateX(-50%);
          background-color: rgba(36, 43, 52, 0.8);
          color: white;
          padding: 2px 4px;
          border-radius: 2px;
          white-space: nowrap;
          pointer-events: none;
          border: 1px solid rgba(30, 143, 254, 0.5);
          text-align: center;
          z-index: 1;
        }
        
        /* Hide labels at low zoom */
        .mapboxgl-map[data-zoom-level="low"] .waypoint-label {
          display: none !important;
        }
        
        /* Show small labels at medium zoom */
        .mapboxgl-map[data-zoom-level="medium"] .waypoint-label {
          display: block !important;
          font-size: 8px !important;
        }
        
        /* Show larger labels at high zoom */
        .mapboxgl-map[data-zoom-level="high"] .waypoint-label {
          display: block !important;
          font-size: 10px !important;
          padding: 3px 5px !important;
        }
      `;
      
      // Add style to document
      document.head.appendChild(styleSheet);
      console.log('📍 Added waypoint zoom-based styles to document');
    };
    
    // 4. Apply all the fixes
    enhanceWaypointLayers();
    setupZoomHandler();
    applyMarkerStyles();
    
    // 5. If waypoints are already showing, force refresh them to apply new styles
    if (window.platformManager.osdkWaypoints && 
        window.platformManager.osdkWaypoints.length > 0 &&
        window.platformManager.osdkWaypointsVisible) {
      console.log('📍 Refreshing existing waypoints to apply new styles');
      
      // Force refresh of waypoint layers
      setTimeout(() => {
        window.platformManager._addOsdkWaypointsToMap();
      }, 1000);
    }
    
    console.log('✅ Successfully applied improved waypoint display and label fix');
  }, 1000);
  
  // Set a timeout to clear the interval if dependencies never become available
  setTimeout(() => {
    clearInterval(checkInterval);
  }, 30000);
})();