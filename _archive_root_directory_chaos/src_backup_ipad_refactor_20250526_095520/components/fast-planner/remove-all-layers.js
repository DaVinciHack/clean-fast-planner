/**
 * remove-all-layers.js
 * 
 * Simple script that just removes all problematic layers from the map.
 * No debugging, no extra functionality.
 */

(function() {
  // Wait for map to be available
  function checkForMap() {
    if (window.mapManager && window.mapManager.getMap()) {
      removeAllLayers(window.mapManager.getMap());
    } else {
      setTimeout(checkForMap, 500);
    }
  }

  // Remove all problematic layers
  function removeAllLayers(map) {
    // List of all problematic layers
    const layersToRemove = [
      'osdk-waypoints-layer',
      'osdk-waypoints-labels',
      'platforms-layer',
      'platforms-fixed-layer',
      'platforms-movable-layer',
      'platforms-fixed-labels',
      'platforms-movable-labels',
      'airfields-layer',
      'airfields-labels'
    ];

    // List of all problematic sources
    const sourcesToRemove = [
      'osdk-waypoints-source',
      'major-platforms'
    ];

    // First remove all layers
    layersToRemove.forEach(layer => {
      try {
        if (map.getLayer(layer)) {
          map.removeLayer(layer);
        }
      } catch (e) {
        // Ignore errors
      }
    });

    // Wait 100ms then remove sources
    setTimeout(() => {
      sourcesToRemove.forEach(source => {
        try {
          if (map.getSource(source)) {
            map.removeSource(source);
          }
        } catch (e) {
          // Ignore errors
        }
      });
    }, 100);
  }

  // Start checking for map
  checkForMap();
})();
