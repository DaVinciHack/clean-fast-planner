/**
 * emergency-waypoint-fix.js
 * 
 * This is an emergency fix for waypoint display issues, addressing source/layer
 * removal errors and timing issues with manager initialization.
 */

(function() {
  console.log('🚨 EMERGENCY: Applying emergency waypoint display fix');
  
  // Step 1: Fix for "Source cannot be removed while layer is using it" error
  // This function will be attached to map manager to safely remove layers and sources
  const safeRemoveLayersAndSources = (map, sourceId, layerIds) => {
    if (!map) return false;
    
    console.log(`🚨 Safe removal of layers for source "${sourceId}"`);
    
    // First remove all layers that might be using the source
    layerIds.forEach(layerId => {
      try {
        if (map.getLayer(layerId)) {
          console.log(`🚨 Removing layer: ${layerId}`);
          map.removeLayer(layerId);
        }
      } catch (e) {
        console.warn(`🚨 Could not remove layer ${layerId}:`, e.message);
      }
    });
    
    // Wait for layers to be fully removed before removing source
    return new Promise(resolve => {
      setTimeout(() => {
        try {
          if (map.getSource(sourceId)) {
            console.log(`🚨 Removing source: ${sourceId}`);
            map.removeSource(sourceId);
            console.log(`🚨 Successfully removed source: ${sourceId}`);
          }
          resolve(true);
        } catch (e) {
          console.warn(`🚨 Could not remove source ${sourceId}:`, e.message);
          resolve(false);
        }
      }, 500); // Longer 500ms delay to ensure layers are fully removed
    });
  };
  
  // Step 2: Add robust manager availability checks and waiting functions
  const managers = {
    mapManager: null,
    platformManager: null,
    waypointManager: null,
    regionManager: null
  };
  
  // Get all available managers and store them
  const refreshManagers = () => {
    managers.mapManager = window.mapManager || null;
    managers.platformManager = window.platformManager || null;
    managers.waypointManager = window.waypointManager || null;
    managers.regionManager = window.regionManager || null;
    
    const available = Object.entries(managers)
      .filter(([_, manager]) => manager !== null)
      .map(([name]) => name);
      
    console.log(`🚨 Available managers: ${available.join(', ') || 'none'}`);
    
    return available.length;
  };
  
  // Wait for specific manager with timeout
  const waitForManager = (managerName, callback, timeoutMs = 10000) => {
    const startTime = Date.now();
    
    console.log(`🚨 Waiting for ${managerName}...`);
    
    const checkInterval = setInterval(() => {
      // Check if manager is available
      managers[managerName] = window[managerName] || null;
      
      if (managers[managerName]) {
        clearInterval(checkInterval);
        console.log(`🚨 ${managerName} found!`);
        callback(managers[managerName]);
        return;
      }
      
      // Check for timeout
      if (Date.now() - startTime > timeoutMs) {
        clearInterval(checkInterval);
        console.warn(`🚨 Timeout waiting for ${managerName}`);
      }
    }, 200);
    
    return checkInterval;
  };
  
  // Wait for all required managers to be available
  const waitForAllManagers = (callback, timeoutMs = 20000) => {
    console.log('🚨 Waiting for all required managers...');
    
    const startTime = Date.now();
    const requiredManagers = ['mapManager', 'platformManager'];
    
    const checkInterval = setInterval(() => {
      // Refresh manager references
      refreshManagers();
      
      // Check if all required managers are available
      const allAvailable = requiredManagers.every(name => managers[name] !== null);
      
      if (allAvailable) {
        clearInterval(checkInterval);
        console.log('🚨 All required managers are available!');
        callback(managers);
        return;
      }
      
      // Check for timeout
      if (Date.now() - startTime > timeoutMs) {
        clearInterval(checkInterval);
        console.warn('🚨 Timeout waiting for all required managers');
      }
    }, 500);
    
    return checkInterval;
  };
  
  // Step 3: Fix for waypoint display issues
  const fixWaypointDisplay = () => {
    // Wait for all required managers
    waitForAllManagers(({ mapManager, platformManager }) => {
      if (!mapManager || !platformManager) {
        console.error('🚨 Required managers still not available after waiting');
        return;
      }
      
      const map = mapManager.getMap();
      if (!map) {
        console.error('🚨 Map is not available');
        return;
      }
      
      console.log('🚨 Installing emergency functions on platformManager');
      
      // Add safe layer removal function to platform manager
      platformManager.safeRemoveLayersAndSources = function(sourceId, layerIds) {
        return safeRemoveLayersAndSources(map, sourceId, layerIds);
      };
      
      // Patch _clearOsdkWaypointLayers to use safe removal
      const originalClearLayers = platformManager._clearOsdkWaypointLayers;
      platformManager._clearOsdkWaypointLayers = function() {
        console.log('🚨 Using safe layer removal in _clearOsdkWaypointLayers');
        
        // Use our safe removal function
        return this.safeRemoveLayersAndSources('osdk-waypoints-source', [
          'osdk-waypoints-layer',
          'osdk-waypoints-labels'
        ]);
      };
      
      // Create emergency function to display waypoints
      window.emergencyShowWaypoints = async () => {
        console.log('🚨 Emergency waypoint display triggered');
        
        if (!platformManager.osdkWaypoints || platformManager.osdkWaypoints.length === 0) {
          console.log('🚨 No waypoints loaded, attempting to load them now');
          
          // Try to load waypoints first
          try {
            if (!window.client) {
              console.error('🚨 No OSDK client available');
              return false;
            }
            
            // Get current region
            const currentRegion = window.currentRegion || {};
            const regionName = currentRegion.osdkRegion || currentRegion.name || '';
            
            if (!regionName) {
              console.error('🚨 No region selected');
              return false;
            }
            
            console.log(`🚨 Loading waypoints for ${regionName}`);
            
            // Show loading indicator
            if (window.LoadingIndicator) {
              window.LoadingIndicator.updateStatusIndicator(
                `Loading waypoints for ${regionName}...`,
                'info',
                5000
              );
            }
            
            // Load waypoints
            const waypoints = await platformManager.loadOsdkWaypointsFromFoundry(window.client, regionName);
            console.log(`🚨 Loaded ${waypoints.length} waypoints`);
          } catch (error) {
            console.error('🚨 Error loading waypoints:', error);
            
            // Show error to user
            if (window.LoadingIndicator) {
              window.LoadingIndicator.updateStatusIndicator(
                'Error loading waypoints. Check console for details.',
                'error',
                5000
              );
            }
            
            return false;
          }
        }
        
        // Ensure we have waypoints now
        if (!platformManager.osdkWaypoints || platformManager.osdkWaypoints.length === 0) {
          console.error('🚨 Still no waypoints after loading attempt');
          return false;
        }
        
        try {
          // First, safely clear any existing layers
          await platformManager._clearOsdkWaypointLayers();
          
          // Short delay after clearing
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Now create the data source for waypoints
          if (!map.getSource('osdk-waypoints-source')) {
            console.log('🚨 Creating waypoints source');
            
            // Create the source
            try {
              const features = platformManager.osdkWaypoints.map(wp => ({
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
              
              map.addSource('osdk-waypoints-source', {
                type: 'geojson',
                data: {
                  type: 'FeatureCollection',
                  features: features
                }
              });
              
              console.log(`🚨 Added source with ${features.length} waypoints`);
            } catch (e) {
              console.error('🚨 Error adding source:', e);
              return false;
            }
          } else {
            console.log('🚨 Source already exists, updating data');
            
            // Update existing source
            try {
              const features = platformManager.osdkWaypoints.map(wp => ({
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
              
              const source = map.getSource('osdk-waypoints-source');
              if (source && typeof source.setData === 'function') {
                source.setData({
                  type: 'FeatureCollection',
                  features: features
                });
                
                console.log(`🚨 Updated source with ${features.length} waypoints`);
              }
            } catch (e) {
              console.error('🚨 Error updating source data:', e);
            }
          }
          
          // Short delay after adding/updating source
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Add the waypoint layers
          console.log('🚨 Adding waypoint layers');
          
          // Circle layer
          if (!map.getLayer('osdk-waypoints-layer')) {
            try {
              map.addLayer({
                id: 'osdk-waypoints-layer',
                type: 'circle',
                source: 'osdk-waypoints-source',
                paint: {
                  'circle-radius': 4,
                  'circle-color': '#FFCC00', // Yellow
                  'circle-stroke-width': 1,
                  'circle-stroke-color': '#FFFFFF'
                },
                layout: {
                  'visibility': 'visible'
                }
              });
              
              console.log('🚨 Added waypoint circle layer');
            } catch (e) {
              console.error('🚨 Error adding circle layer:', e);
            }
          } else {
            // Make sure it's visible
            try {
              map.setLayoutProperty('osdk-waypoints-layer', 'visibility', 'visible');
            } catch (e) {
              console.warn('🚨 Error updating circle layer visibility:', e);
            }
          }
          
          // Label layer
          if (!map.getLayer('osdk-waypoints-labels')) {
            try {
              map.addLayer({
                id: 'osdk-waypoints-labels',
                type: 'symbol',
                source: 'osdk-waypoints-source',
                layout: {
                  'text-field': ['get', 'name'],
                  'text-size': 10,
                  'text-anchor': 'top',
                  'text-offset': [0, 0.5],
                  'text-allow-overlap': false,
                  'visibility': 'visible'
                },
                paint: {
                  'text-color': '#FFCC00',
                  'text-halo-color': '#000000',
                  'text-halo-width': 0.5
                }
              });
              
              console.log('🚨 Added waypoint labels layer');
            } catch (e) {
              console.error('🚨 Error adding labels layer:', e);
            }
          } else {
            // Make sure it's visible
            try {
              map.setLayoutProperty('osdk-waypoints-labels', 'visibility', 'visible');
            } catch (e) {
              console.warn('🚨 Error updating labels layer visibility:', e);
            }
          }
          
          // Update visibility flag
          platformManager.osdkWaypointsVisible = true;
          
          // Show success message
          if (window.LoadingIndicator) {
            window.LoadingIndicator.updateStatusIndicator(
              `Showing ${platformManager.osdkWaypoints.length} waypoints. Click any to add to route.`,
              'success',
              5000
            );
          }
          
          console.log('🚨 Emergency waypoint display successful');
          return true;
        } catch (error) {
          console.error('🚨 Error in emergency waypoint display:', error);
          return false;
        }
      };
      
      // Add emergency button to interface
      const addEmergencyButton = () => {
        // Check if button already exists
        if (document.getElementById('emergency-waypoint-btn')) {
          return;
        }
        
        const mapContainer = document.querySelector('.mapboxgl-map');
        if (!mapContainer) {
          console.warn('🚨 Map container not found for adding emergency button');
          setTimeout(addEmergencyButton, 1000);
          return;
        }
        
        // Create button
        const button = document.createElement('button');
        button.id = 'emergency-waypoint-btn';
        button.innerHTML = '🔴 SHOW WAYPOINTS';
        button.title = 'Emergency waypoint display';
        
        // Style button
        button.style.position = 'absolute';
        button.style.bottom = '100px';
        button.style.right = '10px';
        button.style.zIndex = '1000';
        button.style.backgroundColor = '#dc3545';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.borderRadius = '5px';
        button.style.padding = '10px';
        button.style.fontSize = '12px';
        button.style.fontWeight = 'bold';
        button.style.cursor = 'pointer';
        button.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        
        // Add click handler
        button.addEventListener('click', () => {
          button.innerHTML = '⏱️ LOADING...';
          button.disabled = true;
          
          window.emergencyShowWaypoints()
            .then(success => {
              if (success) {
                button.innerHTML = '✅ SUCCESS';
                setTimeout(() => {
                  button.style.display = 'none';
                }, 3000);
              } else {
                button.innerHTML = '❌ FAILED';
                button.disabled = false;
                setTimeout(() => {
                  button.innerHTML = '🔄 TRY AGAIN';
                }, 3000);
              }
            })
            .catch(error => {
              console.error('🚨 Error in emergency button click:', error);
              button.innerHTML = '❌ ERROR';
              button.disabled = false;
              setTimeout(() => {
                button.innerHTML = '🔄 TRY AGAIN';
              }, 3000);
            });
        });
        
        // Add to map container
        mapContainer.appendChild(button);
        console.log('🚨 Added emergency waypoint button to map');
      };
      
      // Add emergency button after a delay to ensure the map is rendered
      setTimeout(addEmergencyButton, 5000);
      
      console.log('🚨 Emergency waypoint fix installed successfully');
    });
  };
  
  // Install the fix
  fixWaypointDisplay();
  
  // Poll every 5 seconds for managers in case they weren't available initially
  let checkCounter = 0;
  const checkInterval = setInterval(() => {
    checkCounter++;
    
    const count = refreshManagers();
    
    // If we have all managers now, fix the waypoint display
    if (count >= 2) {
      console.log('🚨 Managers now available, applying fix');
      fixWaypointDisplay();
      clearInterval(checkInterval);
    }
    
    // Stop checking after 30 seconds (6 attempts)
    if (checkCounter > 6) {
      console.warn('🚨 Giving up waiting for managers after 30 seconds');
      clearInterval(checkInterval);
    }
  }, 5000);
  
  console.log('🚨 Emergency waypoint fix initialized and monitoring for managers');
})();
