/**
 * fix-osdk-waypoints-layer.js
 * 
 * This fix addresses the "Layer with id 'osdk-waypoints-labels' already exists on this map" error
 * by modifying the PlatformManager to check for existing layers before trying to add them.
 */

(function() {
  console.log('🔧 Applying OSDK waypoints layer fix...');
  
  // Wait for PlatformManager to be available
  const checkInterval = setInterval(() => {
    if (!window.platformManager) {
      console.log('🔧 Waiting for platformManager to become available...');
      return;
    }
    
    // Clear interval since we found platformManager
    clearInterval(checkInterval);
    
    console.log('🔧 Found platformManager, applying fix...');
    
    // Store the original method
    const originalAddOsdkWaypointsToMap = window.platformManager._addOsdkWaypointsToMap;
    
    // Replace with fixed version
    window.platformManager._addOsdkWaypointsToMap = function() {
      console.log('🔧 Using fixed _addOsdkWaypointsToMap method...');
      
      this.mapManager.onMapLoaded(() => {
        const map = this.mapManager.getMap();
        if (!map || !this.osdkWaypoints || this.osdkWaypoints.length === 0) {
          console.log("🔧 Map not ready or no OSDK waypoints to display.");
          return;
        }

        const sourceId = 'osdk-waypoints-source';
        const layerId = 'osdk-waypoints-layer';
        const labelsLayerId = 'osdk-waypoints-labels';

        // Create features from waypoints
        const features = this.osdkWaypoints.map(wp => ({
          type: 'Feature',
          properties: {
            name: wp.name,
            type: wp.type
          },
          geometry: {
            type: 'Point',
            coordinates: wp.coordinates
          }
        }));

        // Safely remove existing layers first
        if (map.getLayer(layerId)) {
          console.log(`🔧 Removing existing layer: ${layerId}`);
          try { map.removeLayer(layerId); } catch (e) { console.warn(`Error removing layer ${layerId}:`, e); }
        }
        
        if (map.getLayer(labelsLayerId)) {
          console.log(`🔧 Removing existing layer: ${labelsLayerId}`);
          try { map.removeLayer(labelsLayerId); } catch (e) { console.warn(`Error removing layer ${labelsLayerId}:`, e); }
        }
        
        // CRITICAL FIX: Use a longer timeout to ensure layers are fully removed
        setTimeout(() => {
          // Check if source exists - if it does, update it instead of recreating
          if (map.getSource(sourceId)) {
            console.log(`🔧 Source ${sourceId} already exists - updating data instead of recreating`);
            try {
              // Update existing source data instead of recreating
              const source = map.getSource(sourceId);
              if (source && typeof source.setData === 'function') {
                source.setData({
                  type: 'FeatureCollection',
                  features: features
                });
              }
            } catch (e) {
              console.warn(`🔧 Error updating source ${sourceId}:`, e);
            }
          } else {
            // Only add the source if it doesn't already exist
            console.log(`🔧 Source ${sourceId} doesn't exist - creating new source`);
            try {
              map.addSource(sourceId, {
                type: 'geojson',
                data: {
                  type: 'FeatureCollection',
                  features: features
                }
              });
            } catch (e) {
              console.error(`🔧 Error adding source ${sourceId}:`, e);
              // If we get an "already exists" error, try to update the source instead
              if (e.message && e.message.includes("already exists")) {
                console.log("🔧 Got 'already exists' error - attempting to update source data instead");
                try {
                  const source = map.getSource(sourceId);
                  if (source && typeof source.setData === 'function') {
                    source.setData({
                      type: 'FeatureCollection',
                      features: features
                    });
                  }
                } catch (updateError) {
                  console.error("🔧 Error updating source data:", updateError);
                  return; // Bail out if we can't update the source
                }
              } else {
                return; // Bail out for other errors
              }
            }
          }

          // CRITICAL FIX: Double-check that layers don't exist before adding them
          if (!map.getLayer(layerId)) {
            console.log(`🔧 Adding layer: ${layerId}`);
            try {
              map.addLayer({
                id: layerId,
                type: 'circle',
                source: sourceId,
                paint: {
                  'circle-radius': 3,
                  'circle-color': '#FFCC00', // Yellow
                  'circle-stroke-width': 1,
                  'circle-stroke-color': '#FFFFFF'
                },
                layout: {
                  'visibility': this.osdkWaypointsVisible ? 'visible' : 'none'
                }
              });
            } catch (e) {
              console.error(`🔧 Error adding layer ${layerId}:`, e);
              if (e.message && e.message.includes("already exists")) {
                console.log(`🔧 Layer ${layerId} already exists - updating visibility`);
                try {
                  map.setLayoutProperty(layerId, 'visibility', 
                    this.osdkWaypointsVisible ? 'visible' : 'none');
                } catch (layoutError) {
                  console.warn(`🔧 Error updating visibility for ${layerId}:`, layoutError);
                }
              }
            }
          } else {
            console.log(`🔧 Layer ${layerId} already exists - updating visibility`);
            try {
              map.setLayoutProperty(layerId, 'visibility', 
                this.osdkWaypointsVisible ? 'visible' : 'none');
            } catch (e) {
              console.warn(`🔧 Error updating visibility for ${layerId}:`, e);
            }
          }
          
          // CRITICAL FIX: Double-check that labels layer doesn't exist before adding it
          if (!map.getLayer(labelsLayerId)) {
            console.log(`🔧 Adding layer: ${labelsLayerId}`);
            try {
              map.addLayer({
                id: labelsLayerId,
                type: 'symbol',
                source: sourceId,
                layout: {
                  'text-field': ['get', 'name'],
                  'text-size': 9,
                  'text-anchor': 'top',
                  'text-offset': [0, 0.5],
                  'text-allow-overlap': false,
                  'visibility': this.osdkWaypointsVisible ? 'visible' : 'none'
                },
                paint: {
                  'text-color': '#FFCC00',
                  'text-halo-color': '#000000',
                  'text-halo-width': 0.5
                }
              });
            } catch (e) {
              console.error(`🔧 Error adding layer ${labelsLayerId}:`, e);
              if (e.message && e.message.includes("already exists")) {
                console.log(`🔧 Layer ${labelsLayerId} already exists - updating visibility`);
                try {
                  map.setLayoutProperty(labelsLayerId, 'visibility', 
                    this.osdkWaypointsVisible ? 'visible' : 'none');
                } catch (layoutError) {
                  console.warn(`🔧 Error updating visibility for ${labelsLayerId}:`, layoutError);
                }
              }
            }
          } else {
            console.log(`🔧 Layer ${labelsLayerId} already exists - updating visibility`);
            try {
              map.setLayoutProperty(labelsLayerId, 'visibility', 
                this.osdkWaypointsVisible ? 'visible' : 'none');
            } catch (e) {
              console.warn(`🔧 Error updating visibility for ${labelsLayerId}:`, e);
            }
          }
          
          console.log("🔧 OSDK waypoints display update complete");
        }, 300); // Increased timeout for layer removal to complete
      });
    };
    
    console.log('🔧 Successfully patched _addOsdkWaypointsToMap method');
    
    // Also disable emergency fix if it exists
    if (typeof window.emergencyShowWaypoints === 'function') {
      console.log('🔧 Disabling emergency waypoint function to prevent conflicts');
      // Replace with no-op function that logs a message
      window.emergencyShowWaypoints = function() {
        console.log('🔧 Emergency waypoint function has been disabled to prevent layer conflicts');
        return Promise.resolve(false);
      };
    }
    
    // Remove emergency button if it exists
    const emergencyButton = document.getElementById('emergency-waypoint-btn');
    if (emergencyButton) {
      console.log('🔧 Removing emergency waypoint button');
      emergencyButton.remove();
    }

    // Fix was successfully applied
    console.log('✅ OSDK waypoints layer fix successfully applied');
  }, 500);
})();
