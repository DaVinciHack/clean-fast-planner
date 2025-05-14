/**
 * CleanPlatformManager.js
 * 
 * A clean implementation of the _addOsdkWaypointsToMap method that properly
 * handles layer management without causing "already exists" errors.
 * 
 * This version replaces the need for multiple fix scripts.
 */

// Make sure this is applied only once
let patchApplied = false;

/**
 * Apply the clean implementation to PlatformManager
 */
function applyCleanImplementation() {
  if (patchApplied) return;
  
  console.log('🧹 Applying clean PlatformManager implementation...');
  
  // Wait for platform manager to be available
  const checkInterval = setInterval(() => {
    if (!window.platformManager) {
      console.log('🧹 Waiting for platformManager to be available...');
      return;
    }
    
    // Make sure MapLayerManager is available
    if (!window.MapLayerManager) {
      console.log('🧹 Waiting for MapLayerManager to be available...');
      return;
    }
    
    clearInterval(checkInterval);
    console.log('🧹 Ready to apply clean implementation to platformManager');
    
    // Replace the problematic method with our clean implementation
    window.platformManager._addOsdkWaypointsToMap = function() {
      console.log('🧹 Using clean _addOsdkWaypointsToMap implementation...');
      
      const layerManager = window.MapLayerManager;
      
      this.mapManager.onMapLoaded(() => {
        const map = this.mapManager.getMap();
        if (!map || !this.osdkWaypoints || this.osdkWaypoints.length === 0) {
          console.log("🧹 Map not ready or no OSDK waypoints to display");
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
        
        // Use the layerManager to safely add/update source
        layerManager.addSource(map, sourceId, {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: features
          }
        });
        
        // Add circle layer using the layerManager
        layerManager.addLayer(map, {
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
        
        // Add labels layer using the layerManager
        layerManager.addLayer(map, {
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
        
        console.log("🧹 OSDK waypoints added cleanly");
      });
    };
    
    // Also replace clearOsdkWaypointLayers with a clean implementation
    window.platformManager._clearOsdkWaypointLayers = function() {
      console.log('🧹 Using clean _clearOsdkWaypointLayers implementation...');
      
      const map = this.mapManager.getMap();
      if (!map) return;
      
      const layerManager = window.MapLayerManager;
      const sourceId = 'osdk-waypoints-source';
      const layerIds = ['osdk-waypoints-layer', 'osdk-waypoints-labels'];
      
      // Remove layers first
      layerIds.forEach(id => {
        layerManager.removeLayer(map, id);
      });
      
      // Wait briefly, then remove the source
      setTimeout(() => {
        layerManager.removeSource(map, sourceId);
      }, 100);
      
      // Clear the stored waypoints
      this.osdkWaypoints = [];
      this.osdkWaypointsVisible = false;
      
      console.log('🧹 OSDK waypoint layers cleared cleanly');
    };
    
    // Also fix the toggleWaypointMode method to properly handle layer visibility
    const originalToggleWaypointMode = window.platformManager.toggleWaypointMode;
    
    window.platformManager.toggleWaypointMode = function(active, client, regionName) {
      console.log(`🧹 Clean toggleWaypointMode(${active})`);
      
      // Store the waypointModeActive state
      this.waypointModeActive = active;
      
      // Update global flag for other components
      window.isWaypointModeActive = active;
      
      const map = this.mapManager.getMap();
      if (!map) {
        console.error("🧹 Map not available for toggleWaypointMode");
        return;
      }
      
      const layerManager = window.MapLayerManager;
      
      if (active) {
        // Entering waypoint mode - hide platforms, show waypoints
        console.log("🧹 Entering waypoint mode");
        
        // Hide platform layers
        const platformLayers = [
          'platforms-layer', 'platforms-fixed-layer', 'platforms-movable-layer',
          'platforms-fixed-labels', 'platforms-movable-labels',
          'airfields-layer', 'airfields-labels'
        ];
        
        platformLayers.forEach(id => {
          if (layerManager.layerExists(map, id)) {
            layerManager.setLayerVisibility(map, id, false);
          }
        });
        
        // Check if we have waypoints loaded
        if (this.osdkWaypoints && this.osdkWaypoints.length > 0) {
          console.log(`🧹 ${this.osdkWaypoints.length} waypoints already loaded, making visible`);
          
          // Set waypoint layers to visible
          this.osdkWaypointsVisible = true;
          
          const waypointLayers = ['osdk-waypoints-layer', 'osdk-waypoints-labels'];
          waypointLayers.forEach(id => {
            if (layerManager.layerExists(map, id)) {
              layerManager.setLayerVisibility(map, id, true);
            }
          });
          
          // Show success message
          if (window.LoadingIndicator) {
            window.LoadingIndicator.updateStatusIndicator(
              `Showing ${this.osdkWaypoints.length} navigation waypoints. Click to add to route.`,
              'success',
              3000
            );
          }
        } else {
          // Load waypoints if needed
          console.log("🧹 No waypoints loaded yet, loading from OSDK...");
          
          // Call the original implementation to handle loading
          return originalToggleWaypointMode.call(this, active, client, regionName);
        }
      } else {
        // Exiting waypoint mode - hide waypoints, show platforms
        console.log("🧹 Exiting waypoint mode");
        
        // Hide waypoint layers
        const waypointLayers = ['osdk-waypoints-layer', 'osdk-waypoints-labels'];
        this.osdkWaypointsVisible = false;
        
        waypointLayers.forEach(id => {
          if (layerManager.layerExists(map, id)) {
            layerManager.setLayerVisibility(map, id, false);
          }
        });
        
        // Show platform layers based on platform visibility setting
        if (this.isVisible) {
          const platformLayers = [
            'platforms-layer', 'platforms-fixed-layer', 'platforms-movable-layer',
            'platforms-fixed-labels', 'platforms-movable-labels',
            'airfields-layer', 'airfields-labels'
          ];
          
          platformLayers.forEach(id => {
            if (layerManager.layerExists(map, id)) {
              layerManager.setLayerVisibility(map, id, true);
            }
          });
        }
      }
    };
    
    // Fix the addPlatformsToMap method to properly handle layer conflicts
    const originalAddPlatformsToMap = window.platformManager.addPlatformsToMap;
    
    window.platformManager.addPlatformsToMap = function(platforms) {
      console.log('🧹 Using clean addPlatformsToMap implementation...');
      
      const layerManager = window.MapLayerManager;
      const map = this.mapManager.getMap();
      
      if (!map) {
        console.error("🧹 Map not available for addPlatformsToMap");
        return;
      }
      
      // Store the platforms
      this.platforms = platforms;
      
      // Define the function to add layers/sources
      const addLayersAndSource = () => {
        console.log(`🧹 Adding ${platforms.length} platforms to map`);
        
        // Create GeoJSON features
        const features = platforms.map(platform => {
          return {
            type: 'Feature',
            properties: {
              name: platform.name,
              operator: platform.operator || 'Unknown',
              isAirfield: !!platform.isAirfield,
              isMovable: !!platform.isMovable
            },
            geometry: {
              type: 'Point',
              coordinates: platform.coordinates
            }
          };
        });
        
        // Use layerManager to add/update source
        layerManager.addSource(map, 'major-platforms', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: features
          }
        });
        
        // Add FIXED platforms layer
        layerManager.addLayer(map, {
          id: 'platforms-layer',
          type: 'circle',
          source: 'major-platforms',
          filter: ['all', 
                  ['==', ['get', 'isAirfield'], false],
                  ['==', ['get', 'isMovable'], false]
                 ],
          paint: {
            'circle-radius': 2,
            'circle-color': '#073b8e',
            'circle-stroke-width': 1,
            'circle-stroke-color': '#03bf42',
            'circle-opacity': 1
          },
          layout: {
            'visibility': this.isVisible ? 'visible' : 'none'
          }
        });
        
        // Add MOVABLE platforms layer
        layerManager.addLayer(map, {
          id: 'platforms-movable-layer',
          type: 'circle',
          source: 'major-platforms',
          filter: ['all', 
                  ['==', ['get', 'isAirfield'], false],
                  ['==', ['get', 'isMovable'], true]
                 ],
          paint: {
            'circle-radius': 2,
            'circle-color': '#ad0303',
            'circle-stroke-width': 1,
            'circle-stroke-color': '#f2efef',
            'circle-opacity': 1
          },
          layout: {
            'visibility': this.isVisible ? 'visible' : 'none'
          }
        });
        
        // Add airfields layer
        layerManager.addLayer(map, {
          id: 'airfields-layer',
          type: 'symbol',
          source: 'major-platforms',
          filter: ['==', ['get', 'isAirfield'], true],
          layout: {
            'icon-image': map.hasImage('airport-icon') ? 'airport-icon' : 'airport-15',
            'icon-size': 1,
            'icon-allow-overlap': true,
            'icon-anchor': 'bottom',
            'icon-offset': [0, -5],
            'visibility': this.isVisible ? 'visible' : 'none'
          }
        });
        
        // Add platform labels (fixed)
        layerManager.addLayer(map, {
          id: 'platforms-fixed-labels',
          type: 'symbol',
          source: 'major-platforms',
          filter: ['all', 
                  ['==', ['get', 'isAirfield'], false],
                  ['==', ['get', 'isMovable'], false]
                 ],
          layout: {
            'text-field': ['get', 'name'],
            'text-size': 10,
            'text-anchor': 'top',
            'text-offset': [0, 0.8],
            'text-allow-overlap': false,
            'text-ignore-placement': false,
            'symbol-sort-key': ['get', 'name'],
            'visibility': this.isVisible ? 'visible' : 'none'
          },
          paint: {
            'text-color': '#7192c4',
            'text-halo-color': '#000000',
            'text-halo-width': 1
          }
        });
        
        // Add platform labels (movable)
        layerManager.addLayer(map, {
          id: 'platforms-movable-labels',
          type: 'symbol',
          source: 'major-platforms',
          filter: ['all', 
                  ['==', ['get', 'isAirfield'], false],
                  ['==', ['get', 'isMovable'], true]
                 ],
          layout: {
            'text-field': ['get', 'name'],
            'text-size': 10,
            'text-anchor': 'top',
            'text-offset': [0, 0.8],
            'text-allow-overlap': false,
            'text-ignore-placement': false,
            'symbol-sort-key': ['get', 'name'],
            'visibility': this.isVisible ? 'visible' : 'none'
          },
          paint: {
            'text-color': '#7192c4',
            'text-halo-color': '#000000',
            'text-halo-width': 1
          }
        });
        
        // Add airfield labels
        layerManager.addLayer(map, {
          id: 'airfields-labels',
          type: 'symbol',
          source: 'major-platforms',
          filter: ['==', ['get', 'isAirfield'], true],
          layout: {
            'text-field': ['get', 'name'],
            'text-size': 12,
            'text-anchor': 'top',
            'text-offset': [0, 0.6],
            'text-allow-overlap': false,
            'text-ignore-placement': false,
            'symbol-sort-key': ['get', 'name'],
            'visibility': this.isVisible ? 'visible' : 'none'
          },
          paint: {
            'text-color': '#66aaff',
            'text-halo-color': '#000000',
            'text-halo-width': 1.5
          }
        });
        
        // Trigger callback
        this.triggerCallback('onPlatformsLoaded', platforms);
      };
      
      // Make sure to use onMapLoaded for consistent timing
      this.mapManager.onMapLoaded(addLayersAndSource);
    };
    
    // Fix the clearPlatforms method
    window.platformManager.clearPlatforms = function() {
      console.log('🧹 Using clean clearPlatforms implementation...');
      
      const layerManager = window.MapLayerManager;
      const map = this.mapManager.getMap();
      
      if (!map) return;
      
      // Make sure the map is loaded before attempting to remove layers
      this.mapManager.onMapLoaded(() => {
        const layerIds = [
          'platforms-layer',
          'platforms-fixed-layer',
          'platforms-movable-layer',
          'platforms-labels',
          'platforms-fixed-labels',
          'platforms-movable-labels',
          'airfields-layer',
          'airfields-labels'
        ];
        
        // Remove layers first
        layerIds.forEach(id => {
          layerManager.removeLayer(map, id);
        });
        
        // Wait briefly, then remove the source
        setTimeout(() => {
          layerManager.removeSource(map, 'major-platforms');
        }, 100);
        
        // Clear the platforms array
        this.platforms = [];
      });
    };
    
    patchApplied = true;
    console.log('🧹 Clean PlatformManager implementation applied successfully');
    
    // Disable any emergency functions
    if (typeof window.emergencyShowWaypoints === 'function') {
      window.emergencyShowWaypoints = function() {
        console.log('🧹 Emergency waypoint function has been replaced with clean implementation');
        return Promise.resolve(false);
      };
    }
  }, 500);
}

// Start applying the implementation
applyCleanImplementation();

// Export nothing - this module is self-contained
export default {};
