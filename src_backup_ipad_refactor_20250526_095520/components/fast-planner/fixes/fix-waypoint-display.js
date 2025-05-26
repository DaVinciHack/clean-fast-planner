/**
 * fix-waypoint-display.js
 * 
 * This fix addresses the issue where waypoints are successfully loaded from OSDK
 * but are not being displayed on the map.
 * 
 * The main issues fixed:
 * 1. Improves map readiness checking before adding layers
 * 2. Implements retry logic with delays if initial attempts fail
 * 3. Creates a more robust method to add waypoint layers to the map
 * 4. Adds a global reload function for manual triggering
 */

(function() {
  console.log('🗺️ Applying waypoint display fix');
  
  // Wait for platform manager to be available
  const waitForPlatformManager = setInterval(() => {
    if (!window.platformManager) return;
    
    clearInterval(waitForPlatformManager);
    
    console.log('🗺️ Found platformManager, enhancing waypoint display functions');
    
    // Replace the _addOsdkWaypointsToMap function with a more robust version
    window.platformManager._addOsdkWaypointsToMap = function() {
      const map = this.mapManager?.getMap();
      if (!map) {
        console.warn("🗺️ Map not ready, will retry adding waypoints in 500ms");
        setTimeout(() => this._addOsdkWaypointsToMap(), 500);
        return;
      }
      
      if (!this.osdkWaypoints || this.osdkWaypoints.length === 0) {
        console.log("🗺️ No OSDK waypoints to display");
        return;
      }
      
      console.log(`🗺️ Attempting to add ${this.osdkWaypoints.length} waypoints to map...`);
      
      // Define a function to add waypoints once map is fully ready
      const addWaypointsWhenReady = () => {
        console.log('🗺️ Map ready, adding waypoints');
        
        try {
          // Define constants
          const sourceId = 'osdk-waypoints-source';
          const layerId = 'osdk-waypoints-layer';
          const labelsLayerId = 'osdk-waypoints-labels';
          
          // PART 1: Remove existing layers if they exist
          const cleanupLayers = () => {
            return new Promise((resolve) => {
              try {
                const layersToRemove = [layerId, labelsLayerId];
                
                layersToRemove.forEach(id => {
                  if (map.getLayer(id)) {
                    try {
                      map.removeLayer(id);
                      console.log(`🗺️ Removed existing layer: ${id}`);
                    } catch (e) {
                      console.warn(`🗺️ Error removing layer ${id}:`, e);
                    }
                  }
                });
                
                // Delay before removing source to ensure layers are removed first
                setTimeout(() => {
                  if (map.getSource(sourceId)) {
                    try {
                      map.removeSource(sourceId);
                      console.log(`🗺️ Removed existing source: ${sourceId}`);
                    } catch (e) {
                      console.warn(`🗺️ Error removing source ${sourceId}:`, e);
                    }
                  }
                  resolve();
                }, 100);
              } catch (error) {
                console.warn('🗺️ Non-critical error during cleanup:', error);
                resolve(); // Continue despite error
              }
            });
          };
          
          // PART 2: Add a new data source
          const addDataSource = () => {
            return new Promise((resolve, reject) => {
              try {
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
                
                // Add source if it doesn't exist
                if (!map.getSource(sourceId)) {
                  map.addSource(sourceId, {
                    type: 'geojson',
                    data: {
                      type: 'FeatureCollection',
                      features: features
                    }
                  });
                  console.log(`🗺️ Added source with ${features.length} features`);
                } else {
                  // Update existing source
                  const source = map.getSource(sourceId);
                  if (source && typeof source.setData === 'function') {
                    source.setData({
                      type: 'FeatureCollection',
                      features: features
                    });
                    console.log(`🗺️ Updated existing source with ${features.length} features`);
                  }
                }
                resolve();
              } catch (error) {
                console.error('🗺️ Error adding source:', error);
                reject(error);
              }
            });
          };
          
          // PART 3: Add waypoint layers
          const addWaypointLayers = () => {
            return new Promise((resolve, reject) => {
              try {
                // Add circle layer for waypoints if it doesn't exist
                if (!map.getLayer(layerId)) {
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
                  console.log(`🗺️ Added waypoint circles layer with visibility: ${this.osdkWaypointsVisible ? 'visible' : 'none'}`);
                } else {
                  // Update visibility of existing layer
                  map.setLayoutProperty(layerId, 'visibility', this.osdkWaypointsVisible ? 'visible' : 'none');
                  console.log(`🗺️ Updated visibility of existing waypoint layer: ${this.osdkWaypointsVisible ? 'visible' : 'none'}`);
                }
                
                // Add labels layer for waypoints if it doesn't exist
                if (!map.getLayer(labelsLayerId)) {
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
                  console.log(`🗺️ Added waypoint labels layer with visibility: ${this.osdkWaypointsVisible ? 'visible' : 'none'}`);
                } else {
                  // Update visibility of existing layer
                  map.setLayoutProperty(labelsLayerId, 'visibility', this.osdkWaypointsVisible ? 'visible' : 'none');
                  console.log(`🗺️ Updated visibility of existing labels layer: ${this.osdkWaypointsVisible ? 'visible' : 'none'}`);
                }
                
                resolve();
              } catch (error) {
                console.error('🗺️ Error adding layers:', error);
                reject(error);
              }
            });
          };
          
          // Execute all steps in sequence with delays between them
          cleanupLayers()
            .then(() => {
              // Add delay between cleanup and adding new source
              return new Promise(resolve => setTimeout(resolve, 200));
            })
            .then(() => {
              return addDataSource();
            })
            .then(() => {
              // Add delay between adding source and layers
              return new Promise(resolve => setTimeout(resolve, 100));
            })
            .then(() => {
              return addWaypointLayers();
            })
            .then(() => {
              console.log('🗺️ Successfully added OSDK waypoints to map');
              
              // Ensure visibility flag is set
              this.osdkWaypointsVisible = true;
              
              // Trigger callback
              if (this.callbacks?.onOsdkWaypointsDisplayed) {
                this.callbacks.onOsdkWaypointsDisplayed(this.osdkWaypoints);
              }
              
              // Log success for user
              if (window.LoadingIndicator && this.osdkWaypoints.length > 0) {
                window.LoadingIndicator.updateStatusIndicator(
                  `Showing ${this.osdkWaypoints.length} waypoints. Click to add to route.`,
                  'success',
                  5000
                );
              }
            })
            .catch(error => {
              console.error('🗺️ Error in waypoint display sequence:', error);
              
              // Show error to user
              if (window.LoadingIndicator) {
                window.LoadingIndicator.updateStatusIndicator(
                  'Error displaying waypoints. Try toggling waypoint mode again.',
                  'error',
                  5000
                );
              }
              
              // Try again after a delay with a simpler approach
              setTimeout(() => {
                console.log('🗺️ Retrying waypoint display with simpler approach...');
                this._addWaypointsSimpleMethod();
              }, 1000);
            });
        } catch (error) {
          console.error('🗺️ Unexpected error in addWaypointsWhenReady:', error);
          
          // Force another attempt with a simpler approach after delay
          setTimeout(() => {
            this._addWaypointsSimpleMethod();
          }, 1500);
        }
      };
      
      // Check if map is fully loaded
      if (map.loaded()) {
        console.log('🗺️ Map already loaded, adding waypoints immediately');
        addWaypointsWhenReady();
      } else {
        // Wait for map to load
        console.log('🗺️ Map not fully loaded, listening for load event');
        
        // Set timeout in case load event never fires
        const loadTimeout = setTimeout(() => {
          console.log('🗺️ Map load event timed out, trying anyway');
          addWaypointsWhenReady();
        }, 3000);
        
        // Listen for load event
        map.once('load', () => {
          clearTimeout(loadTimeout);
          console.log('🗺️ Map load event fired, adding waypoints');
          addWaypointsWhenReady();
        });
      }
    };
    
    // Add a simpler backup method as a last resort
    window.platformManager._addWaypointsSimpleMethod = function() {
      try {
        console.log('🗺️ Using simpler method to add waypoints...');
        
        const map = this.mapManager?.getMap();
        if (!map) {
          console.warn("🗺️ Map not available for simple method");
          return;
        }
        
        if (!this.osdkWaypoints || this.osdkWaypoints.length === 0) {
          console.warn("🗺️ No waypoints to display with simple method");
          return;
        }
        
        // Simplest possible approach - clear everything first
        try {
          // Remove any existing waypoint layers
          if (map.getLayer('osdk-waypoints-layer')) {
            map.removeLayer('osdk-waypoints-layer');
          }
          
          if (map.getLayer('osdk-waypoints-labels')) {
            map.removeLayer('osdk-waypoints-labels');
          }
          
          // Force longer delay before removing source
          setTimeout(() => {
            try {
              if (map.getSource('osdk-waypoints-source')) {
                map.removeSource('osdk-waypoints-source');
              }
              
              // Now add a fresh source and layers
              setTimeout(() => {
                try {
                  // Create features
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
                  
                  // Add source
                  map.addSource('osdk-waypoints-source', {
                    type: 'geojson',
                    data: {
                      type: 'FeatureCollection',
                      features: features
                    }
                  });
                  
                  // Add waypoint circles
                  map.addLayer({
                    id: 'osdk-waypoints-layer',
                    type: 'circle',
                    source: 'osdk-waypoints-source',
                    paint: {
                      'circle-radius': [
                        'interpolate', ['linear'], ['zoom'],
                        7, 1,      // Small 1px dots at low zoom
                        10, 2,     // Medium 2px dots at medium zoom 
                        13, 3,     // Larger 3px dots at high zoom
                        16, 5      // Very large 5px dots at very high zoom
                      ],
                      'circle-color': '#FFCC00',
                      'circle-stroke-width': 1,
                      'circle-stroke-color': '#FFFFFF'
                    },
                    layout: {
                      'visibility': 'visible'
                    }
                  });
                  
                  // Add waypoint labels
                  map.addLayer({
                    id: 'osdk-waypoints-labels',
                    type: 'symbol',
                    source: 'osdk-waypoints-source',
                    layout: {
                      'text-field': ['get', 'name'],
                      'text-size': [
                        'interpolate', ['linear'], ['zoom'],
                        8, 0,      // No label below zoom level 8
                        9, 8,      // Small labels at zoom level 9
                        12, 10,    // Medium labels at zoom level 12
                        15, 12     // Larger labels at zoom level 15+
                      ],
                      'text-anchor': 'top',
                      'text-offset': [0, 0.5],
                      'text-allow-overlap': false,
                      'visibility': 'visible'
                    },
                    paint: {
                      'text-color': '#FFCC00',
                      'text-halo-color': '#000000',
                      'text-halo-width': 1.5
                    }
                  });
                  
                  console.log('🗺️ Simple method: added waypoints successfully');
                  
                  // Update the visibility flag
                  this.osdkWaypointsVisible = true;
                  
                  // Show success to user
                  if (window.LoadingIndicator) {
                    window.LoadingIndicator.updateStatusIndicator(
                      `Showing ${this.osdkWaypoints.length} waypoints with backup method.`,
                      'success',
                      3000
                    );
                  }
                } catch (error) {
                  console.error('🗺️ Simple method: Error adding source and layers:', error);
                }
              }, 300);
            } catch (error) {
              console.error('🗺️ Simple method: Error removing source:', error);
            }
          }, 300);
        } catch (error) {
          console.error('🗺️ Simple method: Error removing layers:', error);
        }
      } catch (error) {
        console.error('🗺️ Error in simple waypoint method:', error);
      }
    };
    
    // Update the setOsdkWaypointLayerVisibility function to ensure it creates layers if needed
    const originalSetOsdkWaypointLayerVisibility = window.platformManager._setOsdkWaypointLayerVisibility;
    
    window.platformManager._setOsdkWaypointLayerVisibility = function(visible) {
      console.log(`🗺️ Enhanced _setOsdkWaypointLayerVisibility called with visible=${visible}`);
      
      const map = this.mapManager?.getMap();
      if (!map) {
        console.warn("🗺️ Map not available for visibility change");
        return;
      }
      
      // First check if the layers exist
      const waypointLayerExists = map.getLayer('osdk-waypoints-layer');
      const labelsLayerExists = map.getLayer('osdk-waypoints-labels');
      
      // If we're trying to make them visible but they don't exist, create them
      if (visible && (!waypointLayerExists || !labelsLayerExists)) {
        console.log('🗺️ Waypoint layers not found but should be visible - creating them now');
        
        // Check if we have waypoints loaded
        if (this.osdkWaypoints && this.osdkWaypoints.length > 0) {
          // Create the layers
          this._addOsdkWaypointsToMap();
        } else {
          console.warn('🗺️ No waypoints loaded to display');
          
          // Check if toggling visibility was triggered by entering waypoint mode
          if (this.waypointModeActive && window.client) {
            console.log('🗺️ In waypoint mode but no waypoints - triggering load');
            
            // Get current region
            const currentRegion = window.currentRegion || {};
            const regionName = currentRegion.osdkRegion || currentRegion.name || '';
            
            if (regionName) {
              console.log(`🗺️ Loading waypoints for region: ${regionName}`);
              
              // Show loading indicator
              if (window.LoadingIndicator) {
                window.LoadingIndicator.updateStatusIndicator(
                  `Loading waypoints for ${regionName}...`,
                  'info',
                  3000
                );
              }
              
              // Load waypoints
              this.loadOsdkWaypointsFromFoundry(window.client, regionName)
                .then(waypoints => {
                  console.log(`🗺️ Loaded ${waypoints.length} waypoints`);
                  
                  // Force making them visible
                  this.osdkWaypointsVisible = true;
                  
                  // Add to map
                  this._addOsdkWaypointsToMap();
                })
                .catch(error => {
                  console.error('🗺️ Error loading waypoints:', error);
                  
                  // Show error to user
                  if (window.LoadingIndicator) {
                    window.LoadingIndicator.updateStatusIndicator(
                      'Error loading waypoints. Try toggling waypoint mode again.',
                      'error',
                      5000
                    );
                  }
                });
            }
          }
        }
        
        // Update the visibility flag regardless
        this.osdkWaypointsVisible = visible;
        
        return;
      }
      
      // If layers exist, just change visibility
      const visibility = visible ? 'visible' : 'none';
      const waypointLayers = [
        'osdk-waypoints-layer',
        'osdk-waypoints-labels'
      ];
      
      // Set visibility property for each layer
      let layersFound = false;
      waypointLayers.forEach(layerId => {
        if (map.getLayer(layerId)) {
          try {
            map.setLayoutProperty(layerId, 'visibility', visibility);
            console.log(`🗺️ Set ${layerId} visibility to ${visibility}`);
            layersFound = true;
          } catch (e) {
            console.warn(`🗺️ Error setting visibility for ${layerId}:`, e);
          }
        } else {
          console.log(`🗺️ Layer ${layerId} not found on map for visibility change`);
        }
      });
      
      // Store visibility state
      this.osdkWaypointsVisible = visible;
      console.log(`🗺️ OSDK waypoint layer visibility set to: ${visibility}`);
    };
    
    // Add global functions to force waypoint display
    window.forceWaypointDisplay = () => {
      console.log('🗺️ Manual waypoint display requested');
      
      if (!window.platformManager) {
        console.error('🗺️ Platform manager not available');
        return false;
      }
      
      if (!window.platformManager.osdkWaypoints || window.platformManager.osdkWaypoints.length === 0) {
        console.error('🗺️ No waypoints loaded to display');
        return false;
      }
      
      // Force waypoints to be visible
      window.platformManager.osdkWaypointsVisible = true;
      
      // Force creation of waypoint layers
      window.platformManager._addOsdkWaypointsToMap();
      
      return true;
    };
    
    // Add a function to reload waypoints
    window.reloadWaypoints = () => {
      console.log('🗺️ Manual waypoint reload requested');
      
      if (!window.platformManager) {
        console.error('🗺️ Platform manager not available');
        return false;
      }
      
      // Get current region
      const currentRegion = window.currentRegion || {};
      const regionName = currentRegion.osdkRegion || currentRegion.name || '';
      
      if (!regionName) {
        console.error('🗺️ No region selected');
        return false;
      }
      
      if (!window.client) {
        console.error('🗺️ No OSDK client available');
        return false;
      }
      
      // Show loading indicator
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator(
          `Reloading waypoints for ${regionName}...`,
          'info',
          3000
        );
      }
      
      // Clear existing waypoints
      window.platformManager.osdkWaypoints = [];
      
      // Load waypoints
      window.platformManager.loadOsdkWaypointsFromFoundry(window.client, regionName)
        .then(waypoints => {
          console.log(`🗺️ Reloaded ${waypoints.length} waypoints`);
          
          // Force making them visible
          window.platformManager.osdkWaypointsVisible = true;
          
          // Add to map
          window.platformManager._addOsdkWaypointsToMap();
          
          return true;
        })
        .catch(error => {
          console.error('🗺️ Error reloading waypoints:', error);
          
          // Show error to user
          if (window.LoadingIndicator) {
            window.LoadingIndicator.updateStatusIndicator(
              'Error reloading waypoints.',
              'error',
              5000
            );
          }
          
          return false;
        });
      
      return true;
    };
    
    // Add a manual display button to the map
    const addEmergencyButton = () => {
      // Check if button already exists
      if (document.getElementById('manual-waypoint-display-btn')) {
        return;
      }
      
      const mapContainer = document.querySelector('.mapboxgl-map');
      if (!mapContainer) {
        console.warn('🗺️ Map container not found for adding emergency button');
        return;
      }
      
      // Create button container
      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'waypoint-fix-buttons';
      buttonContainer.style.position = 'absolute';
      buttonContainer.style.bottom = '30px';
      buttonContainer.style.right = '10px';
      buttonContainer.style.zIndex = '10';
      buttonContainer.style.display = 'flex';
      buttonContainer.style.flexDirection = 'column';
      buttonContainer.style.gap = '5px';
      
      // Create display button
      const displayButton = document.createElement('button');
      displayButton.id = 'manual-waypoint-display-btn';
      displayButton.innerHTML = '🛠️ Show Waypoints';
      displayButton.title = 'Manually force waypoints to display';
      displayButton.style.backgroundColor = '#FFCC00';
      displayButton.style.color = '#000';
      displayButton.style.border = 'none';
      displayButton.style.borderRadius = '4px';
      displayButton.style.padding = '5px 10px';
      displayButton.style.cursor = 'pointer';
      displayButton.style.fontWeight = 'bold';
      displayButton.style.opacity = '0.8';
      displayButton.style.fontSize = '12px';
      
      // Add hover effect
      displayButton.onmouseover = () => {
        displayButton.style.opacity = '1';
      };
      displayButton.onmouseout = () => {
        displayButton.style.opacity = '0.8';
      };
      
      // Add click handler
      displayButton.onclick = () => {
        const success = window.forceWaypointDisplay();
        if (success) {
          if (window.LoadingIndicator) {
            window.LoadingIndicator.updateStatusIndicator(
              'Manual waypoint display triggered successfully.',
              'success',
              3000
            );
          }
          
          // Hide the button after successful display
          setTimeout(() => {
            displayButton.style.display = 'none';
          }, 3000);
        } else {
          if (window.LoadingIndicator) {
            window.LoadingIndicator.updateStatusIndicator(
              'Failed to display waypoints manually. Try reloading.',
              'error',
              3000
            );
          }
        }
      };
      
      // Create reload button
      const reloadButton = document.createElement('button');
      reloadButton.id = 'manual-waypoint-reload-btn';
      reloadButton.innerHTML = '🔄 Reload Waypoints';
      reloadButton.title = 'Reload waypoints from OSDK';
      reloadButton.style.backgroundColor = '#007bff';
      reloadButton.style.color = '#fff';
      reloadButton.style.border = 'none';
      reloadButton.style.borderRadius = '4px';
      reloadButton.style.padding = '5px 10px';
      reloadButton.style.cursor = 'pointer';
      reloadButton.style.fontWeight = 'bold';
      reloadButton.style.opacity = '0.8';
      reloadButton.style.fontSize = '12px';
      
      // Add hover effect
      reloadButton.onmouseover = () => {
        reloadButton.style.opacity = '1';
      };
      reloadButton.onmouseout = () => {
        reloadButton.style.opacity = '0.8';
      };
      
      // Add click handler
      reloadButton.onclick = () => {
        const success = window.reloadWaypoints();
        if (success) {
          // Hide button after successful reload
          setTimeout(() => {
            buttonContainer.style.display = 'none';
          }, 3000);
        }
      };
      
      // Add buttons to container
      buttonContainer.appendChild(displayButton);
      buttonContainer.appendChild(reloadButton);
      
      // Add container to map
      mapContainer.appendChild(buttonContainer);
    };
    
    // Wait for map container to be available then add buttons
    setTimeout(addEmergencyButton, 3000);
    
    // If already in waypoint mode, force display of waypoints
    if (window.platformManager.waypointModeActive && 
        window.platformManager.osdkWaypoints && 
        window.platformManager.osdkWaypoints.length > 0) {
      console.log('🗺️ Already in waypoint mode with waypoints - forcing display');
      window.platformManager.osdkWaypointsVisible = true;
      window.platformManager._addOsdkWaypointsToMap();
    }
  }, 500);
  
  // Set a timeout to clear the interval if platformManager never becomes available
  setTimeout(() => {
    clearInterval(waitForPlatformManager);
  }, 30000);
  
  console.log('🗺️ Waypoint display fix initialized');
})();
