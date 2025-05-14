/**
 * Fix for MapManager platform layer removal issues
 */

console.log('🛠️ Setting up map platform layer fix...');

// Function to safely remove layers
function safeRemoveLayer(map, layerId) {
  console.log(`🛠️ Safely removing layer: ${layerId}`);
  
  try {
    // Check if the layer exists first
    if (map && map.getLayer(layerId)) {
      console.log(`🛠️ Layer ${layerId} exists, removing...`);
      map.removeLayer(layerId);
    } else {
      console.log(`🛠️ Layer ${layerId} doesn't exist, skipping removal`);
    }
    
    // Try to remove the source too, but only if it exists and is no longer in use
    if (map && map.getSource(layerId)) {
      try {
        console.log(`🛠️ Attempting to remove source: ${layerId}`);
        map.removeSource(layerId);
      } catch (sourceError) {
        console.log(`🛠️ Could not remove source ${layerId}, might still be in use`);
        // This is expected in some cases, so we don't need to handle it
      }
    }
    
    return true;
  } catch (error) {
    console.error(`🛠️ Error removing layer ${layerId}:`, error);
    return false;
  }
}

// Monkey patch the MapManager.hideLayer method
function patchMapManagerHideLayers() {
  console.log('🛠️ Patching MapManager.hideLayer method...');
  
  // Wait for MapManager to be available
  const checkMapManager = () => {
    if (!window.mapManager) {
      console.log('🛠️ Waiting for mapManager to be available...');
      setTimeout(checkMapManager, 1000);
      return;
    }
    
    // Store the original hideLayer method
    const originalHideLayer = window.mapManager.hideLayer;
    
    // Replace with our enhanced version
    window.mapManager.hideLayer = function(layerId) {
      console.log(`🛠️ Enhanced hideLayer called for ${layerId}`);
      
      const map = this.getMap();
      if (!map) {
        console.error('🛠️ Cannot hide layer: Map is not initialized');
        return false;
      }
      
      // Use our safe removal function
      return safeRemoveLayer(map, layerId);
    };
    
    // Also patch the togglePlatformVisibility method
    if (window.mapManager.togglePlatformsVisibility) {
      const originalToggle = window.mapManager.togglePlatformsVisibility;
      
      window.mapManager.togglePlatformsVisibility = function(visible) {
        console.log(`🛠️ Enhanced togglePlatformsVisibility called with ${visible}`);
        
        try {
          const map = this.getMap();
          if (!map) {
            console.error('🛠️ Cannot toggle platforms: Map is not initialized');
            return false;
          }
          
          // Check if layers exist before attempting to toggle them
          if (visible) {
            // If showing, make sure sources exist first
            if (!map.getSource('platforms')) {
              console.log('🛠️ Cannot show platforms: Source does not exist');
              // Here we could re-add the sources and layers if needed
              return false;
            }
            
            // Show layers if they exist or can be added
            if (!map.getLayer('platforms-layer')) {
              console.log('🛠️ Adding platforms-layer...');
              try {
                map.addLayer({
                  id: 'platforms-layer',
                  type: 'symbol',
                  source: 'platforms',
                  layout: {
                    'icon-image': 'platform',
                    'icon-size': 0.5,
                    'text-field': ['get', 'name'],
                    'text-offset': [0, 1.2],
                    'text-size': 10
                  }
                });
              } catch (error) {
                console.error('🛠️ Error adding platforms-layer:', error);
              }
            } else {
              // If it exists, just make sure it's visible
              map.setLayoutProperty('platforms-layer', 'visibility', 'visible');
            }
            
            // Handle major-platforms similarly
            if (!map.getLayer('major-platforms')) {
              console.log('🛠️ Adding major-platforms layer...');
              try {
                map.addLayer({
                  id: 'major-platforms',
                  type: 'symbol',
                  source: 'major-platforms',
                  layout: {
                    'icon-image': 'airport',
                    'icon-size': 0.6,
                    'text-field': ['get', 'name'],
                    'text-offset': [0, 1.2],
                    'text-size': 12
                  }
                });
              } catch (error) {
                console.error('🛠️ Error adding major-platforms layer:', error);
              }
            } else {
              // If it exists, just make sure it's visible
              map.setLayoutProperty('major-platforms', 'visibility', 'visible');
            }
          } else {
            // When hiding, use our safe removal function
            safeRemoveLayer(map, 'platforms-layer');
            safeRemoveLayer(map, 'major-platforms');
          }
          
          return true;
        } catch (error) {
          console.error('🛠️ Error in togglePlatformsVisibility:', error);
          return false;
        }
      };
    }
    
    console.log('🛠️ MapManager methods successfully patched');
  };
  
  // Start checking for mapManager
  checkMapManager();
}

// Execute the patch
patchMapManagerHideLayers();

// Export a function to manually apply the patch
export default function applyMapManagerFixes() {
  return patchMapManagerHideLayers();
}