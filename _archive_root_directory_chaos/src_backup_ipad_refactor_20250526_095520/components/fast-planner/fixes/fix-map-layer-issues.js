/**
 * fix-map-layer-issues.js
 * 
 * Comprehensive fix for waypoint mode and layer flickering issues
 * This fix directly addresses problems with:
 * 1. Waypoints not loading when activating waypoint mode
 * 2. Labels flickering when hovering over platforms/waypoints
 * 3. Ensures proper layer ordering and visibility
 */

(function() {
  console.log('🔧 APPLYING CRITICAL MAP LAYER FIX...');
  
  // Fix the platform manager layer handling
  fixPlatformManagerLayers();
  
  // Fix map initialization sequence
  fixMapInitialization();
  
  // Fix waypoint mode toggling
  fixWaypointModeToggling();
  
  console.log('✅ Critical map layer fix applied');
})();

/**
 * Fixes the platform manager's layer management
 */
function fixPlatformManagerLayers() {
  // Wait for platform manager to be available
  const waitForPlatformManager = setInterval(() => {
    if (!window.platformManager) return;
    
    clearInterval(waitForPlatformManager);
    console.log('🔧 Found platformManager, fixing layer management');
    
    // --- Fix 1: Enhance addPlatformsToMap method ---
    const originalAddPlatformsToMap = window.platformManager.addPlatformsToMap;
    window.platformManager.addPlatformsToMap = function(platforms) {
      console.log(`🔧 Enhanced addPlatformsToMap called with ${platforms?.length || 0} platforms`);
      
      // Store current visibility settings before removing layers
      const layerVisibility = {};
      const map = this.mapManager.getMap();
      
      if (map) {
        const layersToTrack = [
          'platforms-layer',
          'platforms-movable-layer',
          'platforms-fixed-labels',
          'platforms-movable-labels',
          'airfields-layer',
          'airfields-labels'
        ];
        
        layersToTrack.forEach(layerId => {
          if (map.getLayer(layerId)) {
            const visibility = map.getLayoutProperty(layerId, 'visibility');
            layerVisibility[layerId] = visibility || 'visible';
          }
        });
      }
      
      // Force skip flag to false to ensure clean recreation of layers
      this.skipNextClear = false;
      
      // Call original method
      const result = originalAddPlatformsToMap.call(this, platforms);
      
      // Restore visibility settings
      setTimeout(() => {
        if (map) {
          Object.entries(layerVisibility).forEach(([layerId, visibility]) => {
            if (map.getLayer(layerId)) {
              map.setLayoutProperty(layerId, 'visibility', visibility);
            }
          });
          
          // Set z-index ordering for layers to prevent flickering
          setProperLayerOrdering(map);
        }
      }, 100);
      
      return result;
    };
    
    // --- Fix 2: Enhance clearPlatforms method ---
    const originalClearPlatforms = window.platformManager.clearPlatforms;
    window.platformManager.clearPlatforms = function() {
      console.log('🔧 Enhanced clearPlatforms called');
      
      const map = this.mapManager.getMap();
      if (!map) return;
      
      // Define all platform-related layers in correct removal order
      const allLayers = [
        'platforms-layer',
        'platforms-movable-layer',
        'platforms-fixed-labels',
        'platforms-movable-labels',
        'airfields-layer',
        'airfields-labels'
      ];
      
      // Use a more reliable approach to removing layers
      this.mapManager.onMapLoaded(() => {
        // First remove all layers
        allLayers.forEach(layerId => {
          try {
            if (map.getLayer(layerId)) {
              map.removeLayer(layerId);
              console.log(`Removed layer: ${layerId}`);
            }
          } catch (e) {
            console.warn(`Error removing layer ${layerId}:`, e);
          }
        });
        
        // Then try to remove the source after a delay
        setTimeout(() => {
          try {
            if (map.getSource('major-platforms')) {
              map.removeSource('major-platforms');
              console.log('Removed source: major-platforms');
            }
          } catch (e) {
            console.warn('Error removing major-platforms source:', e);
          }
        }, 200);
        
        // Clear the platforms array
        this.platforms = [];
      });
    };
    
    // --- Fix 3: Enhance loadWaypointsFromFoundry method ---
    const originalLoadWaypoints = window.platformManager.loadWaypointsFromFoundry;
    window.platformManager.loadWaypointsFromFoundry = async function(client, regionName = "NORWAY") {
      console.log(`🔧 Enhanced loadWaypointsFromFoundry for ${regionName}`);
      
      // Clear any existing waypoints first to ensure clean state
      this.clearWaypoints();
      
      try {
        // If no client provided, try to get from window
        if (!client && window.client) {
          client = window.client;
          console.log('🔧 Using window.client for waypoint loading');
        }
        
        // If still no client, show error and return
        if (!client) {
          console.error('🔧 No OSDK client available for waypoint loading');
          
          if (window.LoadingIndicator) {
            window.LoadingIndicator.updateStatusIndicator(
              'No connection to Foundry. Please refresh the page.',
              'error',
              5000
            );
          }
          
          return [];
        }
        
        // Attempt to import SDK with retry
        let sdk = null;
        let retries = 0;
        
        while (!sdk && retries < 3) {
          try {
            sdk = await import('@flight-app/sdk');
            console.log('🔧 Successfully imported flight-app SDK');
          } catch (e) {
            console.warn(`🔧 Failed to import SDK (attempt ${retries + 1}/3):`, e);
            retries++;
            // Wait a bit before retrying
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        
        if (!sdk) {
          console.error('🔧 Unable to import SDK after multiple attempts');
          return [];
        }
        
        // Find all objects that might contain waypoint data
        const locationObjects = [];
        
        // First priority: direct waypoint/reporting point objects
        const priorityObjects = [
          'ReportingPointsOffshore',
          'ReportingPointsAll', 
          'ReportingPoints',
          'Waypoints',
          'NavigationWaypoints'
        ];
        
        priorityObjects.forEach(key => {
          if (sdk[key]) {
            locationObjects.push({ key, object: sdk[key], priority: 1 });
          }
        });
        
        // Second priority: location objects with "location" in name
        Object.keys(sdk).forEach(key => {
          if ((key.includes('Location') || key.includes('location')) && 
              !locationObjects.some(item => item.key === key)) {
            locationObjects.push({ key, object: sdk[key], priority: 2 });
          }
        });
        
        // Sort by priority
        locationObjects.sort((a, b) => a.priority - b.priority);
        
        console.log(`🔧 Found ${locationObjects.length} potential location objects:`, 
          locationObjects.map(o => o.key).join(', '));
        
        // Try each object until we get results
        let result = null;
        
        for (const { key, object } of locationObjects) {
          try {
            console.log(`🔧 Attempting to query with ${key}...`);
            
            // Different query approaches depending on the object type
            if (key.includes('Reporting') || key.includes('Waypoint')) {
              // Direct query for waypoint-specific objects
              result = await client(object)
                .where({ region: regionName })
                .fetchPage({ $pageSize: 2000 });
            } else {
              // For general location objects, filter to waypoints on server side
              result = await client(object)
                .where({ 
                  region: regionName,
                  $or: [
                    { locationType: "REPORTING POINT OFFSHORE" },
                    { locationType: "REPORTING POINT ONSHORE" },
                    { locationType: "FIX" },
                    { locationType: "WAYPOINT" },
                    { locationType: "NAVAID" }
                  ]
                })
                .fetchPage({ $pageSize: 2000 });
                
              // If that doesn't work, try another approach
              if (!result?.data || result.data.length === 0) {
                console.log('🔧 No results with specific filters, trying broader query...');
                
                // Try a broader query and filter client-side
                result = await client(object)
                  .where({ region: regionName })
                  .fetchPage({ $pageSize: 5000 });
              }
            }
            
            if (result?.data && result.data.length > 0) {
              console.log(`🔧 Got ${result.data.length} results from ${key}, stopping search`);
              break;
            }
            
            console.log(`🔧 No results from ${key}, trying next object...`);
          } catch (e) {
            console.warn(`🔧 Error querying with ${key}:`, e);
          }
        }
        
        // If we didn't get any results, try the original method
        if (!result?.data || result.data.length === 0) {
          console.log('🔧 No results from any object, falling back to original method');
          return originalLoadWaypoints.call(this, client, regionName);
        }
        
        // Filter for waypoints on client side
        const waypoints = [];
        let processedCount = 0;
        
        for (const item of result.data) {
          // Skip if wrong region
          if (item.region && item.region !== regionName) continue;
          
          // Try to determine if this is a waypoint/reporting point
          const type = item.locationType || item.type || '';
          const upperType = type.toUpperCase();
          
          // Skip if clearly not a waypoint (platforms, etc.)
          if (upperType.includes('PLATFORM') || 
              upperType.includes('RIG') ||
              upperType.includes('AIRPORT') ||
              upperType.includes('HELIPORT') ||
              upperType.includes('AIRFIELD')) {
            continue;
          }
          
          // Get name
          let name = item.locName || item.name || item.location_name || '';
          if (!name) continue;
          
          // Get coordinates
          let coords = null;
          
          // Try geoPoint first
          if (item.geoPoint) {
            if (typeof item.geoPoint.longitude === 'number' && typeof item.geoPoint.latitude === 'number') {
              coords = [item.geoPoint.longitude, item.geoPoint.latitude];
            } else if (Array.isArray(item.geoPoint) && item.geoPoint.length === 2) {
              coords = item.geoPoint;
            } else if (item.geoPoint.coordinates && Array.isArray(item.geoPoint.coordinates)) {
              coords = item.geoPoint.coordinates;
            }
          }
          
          // Try direct lat/lon
          if (!coords) {
            if (item.LAT !== undefined && item.LON !== undefined) {
              coords = [parseFloat(item.LON), parseFloat(item.LAT)];
            } else if (item.lat !== undefined && item.lon !== undefined) {
              coords = [parseFloat(item.lon), parseFloat(item.lat)];
            } else if (item.latitude !== undefined && item.longitude !== undefined) {
              coords = [parseFloat(item.longitude), parseFloat(item.latitude)];
            }
          }
          
          // Skip if no coords
          if (!coords) continue;
          
          // Add to waypoints
          waypoints.push({
            name: name,
            coordinates: coords,
            type: type || 'WAYPOINT'
          });
          
          processedCount++;
        }
        
        console.log(`🔧 Successfully processed ${processedCount} waypoints`);
        
        // Store waypoints and add to map
        this.waypoints = waypoints;
        this.addWaypointsToMap(waypoints);
        
        // Explicitly ensure waypoint layers are visible when in waypoint mode
        if (this.waypointModeActive) {
          const map = this.mapManager.getMap();
          if (map) {
            setTimeout(() => {
              const waypointLayers = ['waypoints-layer', 'waypoints-labels'];
              waypointLayers.forEach(layerId => {
                if (map.getLayer(layerId)) {
                  map.setLayoutProperty(layerId, 'visibility', 'visible');
                }
              });
            }, 200);
          }
        }
        
        // Return the waypoints
        return waypoints;
      } catch (e) {
        console.error('🔧 Error in enhanced loadWaypointsFromFoundry:', e);
        return originalLoadWaypoints.call(this, client, regionName);
      }
    };
    
    // --- Fix 4: Enhance toggleWaypointMode method ---
    const originalToggleWaypointMode = window.platformManager.toggleWaypointMode;
    window.platformManager.toggleWaypointMode = function(waypointMode) {
      console.log(`🔧 Enhanced toggleWaypointMode(${waypointMode})`);
      
      // Store mode state
      this.waypointModeActive = waypointMode;
      
      const map = this.mapManager.getMap();
      if (!map) {
        console.error('Cannot toggle waypoint mode: Map not initialized');
        return;
      }
      
      // Define platform and waypoint layers
      const platformLayers = [
        'platforms-layer',
        'platforms-movable-layer',
        'platforms-fixed-labels',
        'platforms-movable-labels',
        'airfields-layer',
        'airfields-labels'
      ];
      
      const waypointLayers = [
        'waypoints-layer',
        'waypoints-labels'
      ];
      
      // Function to safely set layer visibility
      const setLayerVisibility = (layerId, visibility) => {
        try {
          if (map.getLayer(layerId)) {
            map.setLayoutProperty(layerId, 'visibility', visibility);
            console.log(`🔧 Set ${layerId} visibility to ${visibility}`);
          }
        } catch (e) {
          console.warn(`🔧 Error setting ${layerId} visibility:`, e);
        }
      };
      
      // Use onMapLoaded to ensure the map is ready
      this.mapManager.onMapLoaded(() => {
        // If enabling waypoint mode
        if (waypointMode) {
          console.log('🔧 Enabling waypoint mode - hiding platforms, showing waypoints');
          
          // Hide platform layers
          platformLayers.forEach(layerId => setLayerVisibility(layerId, 'none'));
          
          // Check if we have waypoints loaded
          if (!this.waypoints || this.waypoints.length === 0) {
            console.log('🔧 No waypoints loaded, triggering load...');
            
            // Show loading message
            if (window.LoadingIndicator) {
              window.LoadingIndicator.updateStatusIndicator(
                'Loading waypoints...',
                'info',
                3000
              );
            }
            
            // Determine region
            let regionName = "NORWAY";
            if (this.currentRegion) {
              if (typeof this.currentRegion === 'string') {
                regionName = this.currentRegion;
              } else if (this.currentRegion.name) {
                regionName = this.currentRegion.name;
              } else if (this.currentRegion.id) {
                regionName = this.currentRegion.id;
              }
            } else if (window.currentRegion) {
              if (typeof window.currentRegion === 'string') {
                regionName = window.currentRegion;
              } else if (window.currentRegion.name) {
                regionName = window.currentRegion.name;
              } else if (window.currentRegion.id) {
                regionName = window.currentRegion.id;
              }
            }
            
            // Load waypoints in the background
            this.loadWaypointsFromFoundry(window.client, regionName)
              .then(waypoints => {
                console.log(`🔧 Loaded ${waypoints.length} waypoints`);
                
                // Make sure the layers are visible
                waypointLayers.forEach(layerId => setLayerVisibility(layerId, 'visible'));
                
                if (window.LoadingIndicator) {
                  window.LoadingIndicator.updateStatusIndicator(
                    `Loaded ${waypoints.length} waypoints. Click to add to route.`,
                    'success',
                    3000
                  );
                }
              })
              .catch(e => {
                console.error('🔧 Error loading waypoints:', e);
                
                if (window.LoadingIndicator) {
                  window.LoadingIndicator.updateStatusIndicator(
                    'Error loading waypoints. Try refreshing the page.',
                    'error',
                    5000
                  );
                }
              });
          } else {
            console.log(`🔧 ${this.waypoints.length} waypoints already loaded, making visible`);
            
            // Show existing waypoint layers
            waypointLayers.forEach(layerId => setLayerVisibility(layerId, 'visible'));
          }
          
          // Add CSS classes for visual indication
          const mapContainer = document.getElementById('fast-planner-map');
          if (mapContainer) {
            mapContainer.classList.add('waypoint-mode');
          }
          document.body.classList.add('waypoint-mode-cursor');
        } 
        // Disabling waypoint mode
        else {
          console.log('🔧 Disabling waypoint mode - showing platforms, hiding waypoints');
          
          // Show platform layers
          platformLayers.forEach(layerId => setLayerVisibility(layerId, 'visible'));
          
          // Hide waypoint layers
          waypointLayers.forEach(layerId => setLayerVisibility(layerId, 'none'));
          
          // Remove CSS classes
          const mapContainer = document.getElementById('fast-planner-map');
          if (mapContainer) {
            mapContainer.classList.remove('waypoint-mode');
          }
          document.body.classList.remove('waypoint-mode-cursor');
        }
        
        // Ensure proper z-index ordering
        setProperLayerOrdering(map);
      });
      
      // Original method does more than just toggling visibility so still call it
      // But use our more reliable approach first to ensure visibility is set correctly
      return originalToggleWaypointMode.call(this, waypointMode);
    };
    
    // --- Fix 5: Enhance addWaypointsToMap method ---
    const originalAddWaypointsToMap = window.platformManager.addWaypointsToMap;
    window.platformManager.addWaypointsToMap = function(waypoints) {
      console.log(`🔧 Enhanced addWaypointsToMap called with ${waypoints?.length || 0} waypoints`);
      
      if (!waypoints || !Array.isArray(waypoints) || waypoints.length === 0) {
        console.warn('🔧 No valid waypoints to add to map');
        return;
      }
      
      // Store waypoints reference
      this.waypoints = waypoints;
      
      const map = this.mapManager.getMap();
      if (!map) {
        console.error('🔧 Cannot add waypoints: Map not initialized');
        return;
      }
      
      // Define a cleaner implementation to add waypoint layers
      const addWaypointLayersToMap = () => {
        try {
          // First remove any existing waypoint layers
          const waypointLayers = ['waypoints-layer', 'waypoints-labels'];
          
          waypointLayers.forEach(layerId => {
            if (map.getLayer(layerId)) {
              map.removeLayer(layerId);
            }
          });
          
          // Then remove source after a delay
          setTimeout(() => {
            if (map.getSource('waypoints-source')) {
              map.removeSource('waypoints-source');
            }
            
            // Now add the new source and layers
            try {
              // Create features for GeoJSON
              const features = waypoints.map(waypoint => ({
                type: 'Feature',
                properties: {
                  name: waypoint.name,
                  type: waypoint.type || 'WAYPOINT'
                },
                geometry: {
                  type: 'Point',
                  coordinates: waypoint.coordinates
                }
              }));
              
              // Add source
              map.addSource('waypoints-source', {
                type: 'geojson',
                data: {
                  type: 'FeatureCollection',
                  features: features
                },
                // Add options to improve performance
                buffer: 128,
                tolerance: 0.375
              });
              
              // Add waypoints layer
              map.addLayer({
                id: 'waypoints-layer',
                type: 'circle',
                source: 'waypoints-source',
                paint: {
                  'circle-radius': 3,
                  'circle-color': '#FFCC00',
                  'circle-stroke-width': 1,
                  'circle-stroke-color': '#000000',
                  'circle-opacity': 0.9
                },
                layout: {
                  // Explicitly set high z-index for proper rendering
                  'circle-sort-key': 10
                }
              });
              
              // Add labels layer
              map.addLayer({
                id: 'waypoints-labels',
                type: 'symbol',
                source: 'waypoints-source',
                layout: {
                  'text-field': ['get', 'name'],
                  'text-size': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    8, 0,
                    9, 8,
                    11, 10
                  ],
                  'text-anchor': 'top',
                  'text-offset': [0, 0.8],
                  'text-allow-overlap': false,
                  'text-ignore-placement': false,
                  'text-max-width': 10,
                  'text-letter-spacing': 0.05,
                  'symbol-sort-key': 10 // High z-index for proper rendering
                },
                paint: {
                  'text-color': '#FFCC00',
                  'text-halo-color': '#000000',
                  'text-halo-width': 2.0
                }
              });
              
              // Set initial visibility based on current mode
              const visibility = this.waypointModeActive ? 'visible' : 'none';
              map.setLayoutProperty('waypoints-layer', 'visibility', visibility);
              map.setLayoutProperty('waypoints-labels', 'visibility', visibility);
              
              console.log(`🔧 Added waypoint layers with visibility: ${visibility}`);
              
              // Set proper layer ordering
              setProperLayerOrdering(map);
              
              // Trigger callback
              this.triggerCallback('onWaypointsLoaded', waypoints);
            } catch (e) {
              console.error('🔧 Error adding waypoint layers:', e);
            }
          }, 100);
        } catch (e) {
          console.error('🔧 Error in addWaypointLayersToMap:', e);
        }
      };
      
      // Use onMapLoaded to ensure the map is ready
      this.mapManager.onMapLoaded(addWaypointLayersToMap);
    };
    
    console.log('✅ Platform manager layer handling fixed');
  }, 100);
}

/**
 * Fixes map initialization to ensure everything loads in the right order
 */
function fixMapInitialization() {
  // Wait for map manager to be available
  const waitForMapManager = setInterval(() => {
    if (!window.mapManager) return;
    
    clearInterval(waitForMapManager);
    console.log('🔧 Found mapManager, enhancing initialization...');
    
    // Enhance onMapLoaded method for more reliable callback execution
    const originalOnMapLoaded = window.mapManager.onMapLoaded;
    window.mapManager.onMapLoaded = function(callback) {
      if (typeof callback !== 'function') {
        console.error('🔧 onMapLoaded called with non-function:', callback);
        return;
      }
      
      if (this.isMapLoaded()) {
        // Map is already loaded, execute after a short delay
        // This slight delay helps with timing issues during rapid calls
        setTimeout(() => {
          try {
            callback();
          } catch (e) {
            console.error('🔧 Error in immediate onMapLoaded callback:', e);
          }
        }, 10);
      } else if (this.map) {
        // Map exists but not loaded, queue the callback
        console.log('🔧 Map not loaded, queuing callback properly');
        this._loadCallbacks.push(callback);
      } else {
        console.error('🔧 onMapLoaded called before map instance exists');
      }
    };
    
    console.log('✅ Map initialization sequence fixed');
  }, 100);
}

/**
 * Fixes waypoint mode toggling in FastPlannerApp
 */
function fixWaypointModeToggling() {
  // Monitor for toggleWaypointMode function
  const checkInterval = setInterval(() => {
    // Check if the function exists on window (it might get assigned there)
    if (typeof window.toggleWaypointMode === 'function') {
      clearInterval(checkInterval);
      fixToggleWaypointMode(window.toggleWaypointMode);
    } 
    // Otherwise check for the app instance
    else if (document.querySelector('.fast-planner-app')) {
      clearInterval(checkInterval);
      
      // Apply a mutation observer to catch the button click
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            const waypointButton = document.querySelector('button[data-waypoint-mode-button]');
            if (waypointButton && !waypointButton.hasAttribute('fixed-handler')) {
              console.log('🔧 Found waypoint mode button, enhancing click handler');
              
              // Mark as fixed
              waypointButton.setAttribute('fixed-handler', 'true');
              
              // Replace the click handler
              waypointButton.addEventListener('click', (e) => {
                // Stop event propagation
                e.stopPropagation();
                
                // Get current state from button
                const isActive = waypointButton.classList.contains('active');
                const newState = !isActive;
                
                console.log(`🔧 Manual waypoint button click handler: ${newState ? 'ACTIVATING' : 'DEACTIVATING'} waypoint mode`);
                
                // Update global flag
                window.isWaypointModeActive = newState;
                
                // Update UI
                if (newState) {
                  waypointButton.classList.add('active');
                } else {
                  waypointButton.classList.remove('active');
                }
                
                // Apply to platform manager directly
                if (window.platformManager) {
                  window.platformManager.toggleWaypointMode(newState);
                }
                
                // Apply to waypoint handler if available
                if (window.waypointHandler) {
                  window.waypointHandler.setEnabled(newState);
                }
                
                // Show feedback
                if (window.LoadingIndicator) {
                  window.LoadingIndicator.updateStatusIndicator(
                    `${newState ? 'Waypoint' : 'Normal'} mode activated`,
                    newState ? 'info' : 'success',
                    3000
                  );
                }
              }, true);
            }
          }
        });
      });
      
      // Start observing
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }, 200);
  
  // Stop checking after 10 seconds regardless
  setTimeout(() => clearInterval(checkInterval), 10000);
}

/**
 * Fix a specific toggleWaypointMode function
 */
function fixToggleWaypointMode(originalFunction) {
  console.log('🔧 Enhancing toggleWaypointMode function');
  
  window.toggleWaypointMode = function(active) {
    console.log(`🔧 Enhanced toggleWaypointMode(${active})`);
    
    // Update global flag immediately
    window.isWaypointModeActive = active;
    
    // Call platformManager directly if original function fails
    try {
      // Call original function
      const result = originalFunction(active);
      
      // Double check platformManager was called
      if (window.platformManager) {
        window.platformManager.toggleWaypointMode(active);
      }
      
      return result;
    } catch (e) {
      console.error('🔧 Error in original toggleWaypointMode:', e);
      
      // Fallback implementation
      if (window.platformManager) {
        window.platformManager.toggleWaypointMode(active);
      }
      
      if (window.waypointHandler) {
        window.waypointHandler.setEnabled(active);
      }
      
      // Show status
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator(
          `${active ? 'Waypoint' : 'Normal'} mode ${active ? 'activated' : 'deactivated'}`,
          'info',
          3000
        );
      }
    }
  };
}

/**
 * Helper function to set proper z-index ordering for all layers
 * Prevents flickering by giving each layer type a distinct z-index range
 */
function setProperLayerOrdering(map) {
  if (!map) return;
  
  try {
    // Define layers and their sort keys (z-index equivalent)
    const layerSortKeys = {
      // Base map and grid layers: 0-9
      
      // Platform layers: 10-19
      'platforms-layer': 10,
      'platforms-movable-layer': 11,
      'airfields-layer': 12,
      
      // Platform labels: 20-29
      'platforms-fixed-labels': 20,
      'platforms-movable-labels': 21,
      'airfields-labels': 22,
      
      // Waypoint layers: 30-39
      'waypoints-layer': 30,
      'waypoints-labels': 31,
      
      // Route layers: 40-49
      'route-glow': 40,
      'route': 41,
      'route-arrows': 42,
      'leg-labels': 43
    };
    
    // Apply sort keys to each layer
    Object.entries(layerSortKeys).forEach(([layerId, sortKey]) => {
      if (map.getLayer(layerId)) {
        // Different property depending on layer type
        const layerType = map.getLayer(layerId).type;
        
        if (layerType === 'circle') {
          map.setLayoutProperty(layerId, 'circle-sort-key', sortKey);
        } else if (layerType === 'symbol') {
          map.setLayoutProperty(layerId, 'symbol-sort-key', sortKey);
        } else if (layerType === 'line') {
          map.setLayoutProperty(layerId, 'line-sort-key', sortKey);
        }
        
        console.log(`🔧 Set z-index ${sortKey} for layer ${layerId}`);
      }
    });
  } catch (e) {
    console.warn('🔧 Error setting layer ordering:', e);
  }
}
