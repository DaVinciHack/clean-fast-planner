/**
 * restore-platforms.js
 * 
 * Restores the platform display functionality completely
 */

(function() {
  console.log('🔄 RESTORING PLATFORM DISPLAY FUNCTIONALITY');
  
  // Wait for platform manager to be available
  let checkInterval = setInterval(() => {
    if (!window.platformManager || !window.mapManager || !window.mapManager.getMap()) {
      return; // Wait for next interval
    }
    
    // Found platform manager, apply the fix and clear interval
    clearInterval(checkInterval);
    console.log('🔄 Found platformManager and map, restoring functionality');
    
    // Completely restore the addPlatformsToMap method with original implementation
    window.platformManager.addPlatformsToMap = function(platforms) {
      console.log(`🔄 Adding ${platforms.length} platforms to map`);
      const map = this.mapManager.getMap();
      if (!map) {
        console.error('Map not available');
        return;
      }
      
      // Store the platforms
      this.platforms = platforms;
      
      try {
        // Process features for different platform types
        const features = [];
        const fixedPlatformFeatures = [];
        const movablePlatformFeatures = [];
        const airfieldFeatures = [];
        
        platforms.forEach(platform => {
          const { name, coordinates, isAirfield, isMovable } = platform;
          
          // Skip platforms with invalid coordinates
          if (!coordinates || coordinates.length !== 2) return;
          
          const feature = {
            type: 'Feature',
            properties: {
              name: name,
              operator: platform.operator || 'Unknown',
              type: isAirfield ? 'airfield' : (isMovable ? 'movable' : 'fixed')
            },
            geometry: {
              type: 'Point',
              coordinates: coordinates
            }
          };
          
          // Add to the appropriate array based on type
          if (isAirfield) {
            airfieldFeatures.push(feature);
          } else if (isMovable) {
            movablePlatformFeatures.push(feature);
          } else {
            fixedPlatformFeatures.push(feature);
          }
          
          // Also add to the main features array
          features.push(feature);
        });
        
        // First remove existing layers if they exist
        const layersToRemove = [
          'platforms-layer',
          'platforms-labels',
          'platforms-fixed-layer',
          'platforms-fixed-labels',
          'platforms-movable-layer',
          'platforms-movable-labels',
          'airfields-layer',
          'airfields-labels'
        ];
        
        layersToRemove.forEach(layer => {
          if (map.getLayer(layer)) {
            try {
              map.removeLayer(layer);
            } catch (e) {
              console.warn(`Error removing layer ${layer}:`, e);
            }
          }
        });
        
        // Wait a moment before removing the source
        setTimeout(() => {
          // Remove the source if it exists
          if (map.getSource('major-platforms')) {
            try {
              map.removeSource('major-platforms');
            } catch (e) {
              console.warn('Error removing source major-platforms:', e);
            }
          }
          
          // Add the source with all features
          try {
            map.addSource('major-platforms', {
              type: 'geojson',
              data: {
                type: 'FeatureCollection',
                features: features
              }
            });
            
            // Add fixed platform layer
            if (fixedPlatformFeatures.length > 0) {
              map.addLayer({
                id: 'platforms-fixed-layer',
                type: 'circle',
                source: 'major-platforms',
                paint: {
                  'circle-radius': 4,
                  'circle-color': '#FF4136', // Red
                  'circle-stroke-width': 1,
                  'circle-stroke-color': '#FFFFFF'
                },
                filter: ['==', ['get', 'type'], 'fixed']
              });
              
              // Add platform labels
              map.addLayer({
                id: 'platforms-fixed-labels',
                type: 'symbol',
                source: 'major-platforms',
                layout: {
                  'text-field': ['get', 'name'],
                  'text-size': 10,
                  'text-anchor': 'top',
                  'text-offset': [0, 0.8],
                  'text-allow-overlap': false
                },
                paint: {
                  'text-color': '#FF4136',
                  'text-halo-color': '#FFFFFF',
                  'text-halo-width': 1
                },
                filter: ['==', ['get', 'type'], 'fixed']
              });
            }
            
            // Add movable platform layer
            if (movablePlatformFeatures.length > 0) {
              map.addLayer({
                id: 'platforms-movable-layer',
                type: 'circle',
                source: 'major-platforms',
                paint: {
                  'circle-radius': 4,
                  'circle-color': '#FF851B', // Orange
                  'circle-stroke-width': 1,
                  'circle-stroke-color': '#FFFFFF'
                },
                filter: ['==', ['get', 'type'], 'movable']
              });
              
              // Add platform labels
              map.addLayer({
                id: 'platforms-movable-labels',
                type: 'symbol',
                source: 'major-platforms',
                layout: {
                  'text-field': ['get', 'name'],
                  'text-size': 10,
                  'text-anchor': 'top',
                  'text-offset': [0, 0.8],
                  'text-allow-overlap': false
                },
                paint: {
                  'text-color': '#FF851B',
                  'text-halo-color': '#FFFFFF',
                  'text-halo-width': 1
                },
                filter: ['==', ['get', 'type'], 'movable']
              });
            }
            
            // Add airfields layer
            if (airfieldFeatures.length > 0) {
              map.addLayer({
                id: 'airfields-layer',
                type: 'circle',
                source: 'major-platforms',
                paint: {
                  'circle-radius': 5,
                  'circle-color': '#0074D9', // Blue
                  'circle-stroke-width': 1,
                  'circle-stroke-color': '#FFFFFF'
                },
                filter: ['==', ['get', 'type'], 'airfield']
              });
              
              // Add airfield labels
              map.addLayer({
                id: 'airfields-labels',
                type: 'symbol',
                source: 'major-platforms',
                layout: {
                  'text-field': ['get', 'name'],
                  'text-size': 11,
                  'text-anchor': 'top',
                  'text-offset': [0, 0.8],
                  'text-allow-overlap': false
                },
                paint: {
                  'text-color': '#0074D9',
                  'text-halo-color': '#FFFFFF',
                  'text-halo-width': 1
                },
                filter: ['==', ['get', 'type'], 'airfield']
              });
            }
            
            console.log('✅ Successfully added all platform layers to map');
          } catch (error) {
            console.error('Error adding platforms to map:', error);
          }
        }, 100);
      } catch (error) {
        console.error('Error processing platforms:', error);
      }
      
      // Trigger the callback
      this.triggerCallback('onPlatformsLoaded', platforms);
    };
    
    // Force reload platforms
    if (window.platformManager && window.client) {
      try {
        const currentRegion = window.regionManager?.getCurrentRegion() || { name: 'NORWAY' };
        const regionName = currentRegion.osdkRegion || currentRegion.name;
        
        console.log(`🔄 Forcing reload of platforms for ${regionName}...`);
        window.platformManager.loadPlatformsFromFoundry(window.client, regionName);
      } catch (error) {
        console.error('Error reloading platforms:', error);
      }
    }
  }, 1000);
  
  // Stop checking after 30 seconds
  setTimeout(() => {
    clearInterval(checkInterval);
  }, 30000);
})();