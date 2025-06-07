/**
 * fix-osdk-waypoints.js
 * 
 * This is a targeted, one-time cleanup utility for the "osdk-waypoints-labels" layer already exists issue.
 * It does not add any new event handlers or redundant functionality.
 */

(function() {
  // Wait for map to be available
  const waitForMap = (callback) => {
    if (window.mapManager && window.mapManager.getMap()) {
      callback(window.mapManager.getMap());
      return;
    }
    
    // Check every 500ms for up to 10 seconds
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (window.mapManager && window.mapManager.getMap()) {
        clearInterval(interval);
        callback(window.mapManager.getMap());
      } else if (attempts >= 20) {
        // Give up after 10 seconds
        clearInterval(interval);
        console.log('Map not available after 10 seconds, giving up');
      }
    }, 500);
  };
  
  // Run the cleanup once when the map is loaded
  waitForMap((map) => {
    // Simple function to safely remove layers and sources
    const removeMapLayers = () => {
      // Define problematic layers and sources
      const layerIds = ['osdk-waypoints-layer', 'osdk-waypoints-labels'];
      const sourceId = 'osdk-waypoints-source';
      
      console.log('Checking for existing osdk-waypoints layers');
      
      // First remove all layers
      let layersRemoved = false;
      layerIds.forEach(id => {
        if (map.getLayer(id)) {
          console.log(`Removing layer: ${id}`);
          try {
            map.removeLayer(id);
            layersRemoved = true;
          } catch (e) {
            console.warn(`Error removing layer ${id}:`, e);
          }
        }
      });
      
      // Then remove source if layers were removed
      if (layersRemoved) {
        // Short delay to ensure layers are removed first
        setTimeout(() => {
          if (map.getSource(sourceId)) {
            console.log(`Removing source: ${sourceId}`);
            try {
              map.removeSource(sourceId);
            } catch (e) {
              console.warn(`Error removing source ${sourceId}:`, e);
            }
          }
        }, 100);
      }
    };
    
    // Run the cleanup immediately
    removeMapLayers();
    
    // Also run on style load event to catch cases where map style reloads
    map.on('style.load', removeMapLayers);
  });
})();
