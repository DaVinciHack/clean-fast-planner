/**
 * emergency-osdk-layer-fix.js
 * 
 * Emergency fix for waypoint loading and label flickering issues
 * - Fixes OSDK client not being provided to waypoint loading
 * - Fixes layer conflicts and flickering labels
 * - Ensures proper z-ordering of layers
 */

(function() {
  console.log('🚨 EMERGENCY OSDK & LAYER FIX ACTIVATED');
  
  // First fix: Ensure OSDK client is always available for waypoint loading
  fixOSDKClientAvailability();
  
  // Second fix: Fix layer conflicts and flickering
  fixLayerConflicts();
  
  console.log('✅ Emergency fix applied!');
})();

/**
 * Ensures OSDK client is always available for waypoint loading
 */
function fixOSDKClientAvailability() {
  // Check if we have the platform manager
  if (!window.platformManager) {
    console.error('❌ platformManager not available - fix cannot be applied');
    return;
  }
  
  console.log('🔧 Fixing OSDK client availability for waypoint loading...');
  
  // Store the original loadWaypointsFromFoundry method
  const originalLoadWaypoints = window.platformManager.loadWaypointsFromFoundry;
  
  // Override with a safer version that ensures client is available
  window.platformManager.loadWaypointsFromFoundry = async function(client, regionName = "NORWAY") {
    // CRITICAL FIX #1: Always ensure we have a client
    if (!client) {
      console.warn('🔧 No client provided - attempting to get global client');
      
      // Try different sources for client
      if (window.client) {
        client = window.client;
        console.log('🔧 Using window.client as fallback');
      } else if (window.osdkClient) {
        client = window.osdkClient;
        console.log('🔧 Using window.osdkClient as fallback');
      } else {
        // Last resort - try to get client from auth context
        try {
          if (window.auth && window.auth.getOSDKClient) {
            client = window.auth.getOSDKClient();
            console.log('🔧 Using client from auth context');
          }
        } catch (e) {
          console.error('🔧 Error getting client from auth:', e);
        }
      }
      
      // If still no client, show error
      if (!client) {
        console.error('❌ NO OSDK CLIENT AVAILABLE - Cannot load waypoints');
        
        // Show visible error to user
        if (window.LoadingIndicator) {
          window.LoadingIndicator.updateStatusIndicator(
            'Cannot load waypoints: No connection to OSDK. Try refreshing the page.',
            'error',
            5000
          );
        }
        
        // Return empty array to prevent further errors
        return [];
      }
    }
    
    console.log('🔧 OSDK client secured. Loading waypoints...');
    
    // CRITICAL FIX #2: Store the client globally to ensure it's available for future calls
    window.osdkClient = client;
    
    // Call the original method with the secured client
    return originalLoadWaypoints.call(this, client, regionName);
  };
  
  // Also fix toggleWaypointMode to ensure it handles missing client
  const originalToggleWaypointMode = window.platformManager.toggleWaypointMode;
  
  window.platformManager.toggleWaypointMode = function(waypointMode) {
    console.log(`🔧 Fixed toggleWaypointMode(${waypointMode})`);
    
    // Set flags
    this.waypointModeActive = waypointMode;
    window.isWaypointModeActive = waypointMode;
    
    // If enabling waypoint mode, ensure we have OSDK client
    if (waypointMode) {
      // Get any available client
      let client = window.client || window.osdkClient;
      
      // Try to get client from other sources if needed
      if (!client && window.auth && window.auth.getOSDKClient) {
        try {
          client = window.auth.getOSDKClient();
        } catch (e) {
          console.error('🔧 Error getting client from auth:', e);
        }
      }
      
      // Store globally
      if (client) {
        window.osdkClient = client;
      }
    }
    
    // Call original method
    return originalToggleWaypointMode.call(this, waypointMode);
  };
  
  console.log('✅ OSDK client availability fixed');
}

/**
 * Fixes layer conflicts and flickering labels
 */
function fixLayerConflicts() {
  console.log('🔧 Fixing layer conflicts and flickering labels...');
  
  // Check if we have the map manager
  if (!window.mapManager) {
    console.error('❌ mapManager not available - layer fix cannot be applied');
    return;
  }
  
  const map = window.mapManager.getMap();
  if (!map) {
    console.error('❌ Map not available - layer fix cannot be applied');
    return;
  }
  
  // CRITICAL FIX #1: Remove and recreate problematic layers
  function recreateLayersWithCorrectOrder() {
    console.log('🔧 Recreating layers with correct z-order...');
    
    // Define layers to fix
    const layersToFix = [
      // Platform layers
      'platforms-layer',
      'platforms-movable-layer',
      'platforms-fixed-labels',
      'platforms-movable-labels',
      'airfields-layer',
      'airfields-labels',
      
      // Waypoint layers
      'waypoints-layer',
      'waypoints-labels'
    ];
    
    // Save layer data and properties
    const savedLayerInfo = {};
    
    layersToFix.forEach(layerId => {
      try {
        if (map.getLayer(layerId)) {
          const layer = map.getLayer(layerId);
          const visibility = map.getLayoutProperty(layerId, 'visibility') || 'visible';
          
          // Save layer info for recreation
          savedLayerInfo[layerId] = {
            type: layer.type,
            source: layer.source,
            visibility: visibility,
            // Add more properties as needed
          };
          
          // Remove layer
          map.removeLayer(layerId);
          console.log(`🔧 Removed layer: ${layerId}`);
        }
      } catch (e) {
        console.warn(`❌ Error handling layer ${layerId}:`, e);
      }
    });
    
    // Wait a moment before recreating
    setTimeout(() => {
      // Recreate layers with correct z-ordering
      Object.entries(savedLayerInfo).forEach(([layerId, info], index) => {
        try {
          if (map.getSource(info.source)) {
            // Recreate layer with z-index based on layer type
            let zIndex = index * 10; // Base z-index
            
            // Adjust based on layer type
            if (layerId.includes('label')) zIndex += 5; // Labels higher
            if (layerId.includes('waypoint')) zIndex += 100; // Waypoints above platforms
            
            // Create new layer with proper z-index
            if (info.type === 'circle') {
              map.addLayer({
                id: layerId,
                type: 'circle',
                source: info.source,
                layout: {
                  'visibility': info.visibility,
                  'circle-sort-key': zIndex
                },
                paint: {
                  'circle-radius': layerId.includes('waypoint') ? 3 : 2,
                  'circle-color': layerId.includes('waypoint') ? '#FFCC00' : '#073b8e',
                  'circle-stroke-width': 1,
                  'circle-stroke-color': layerId.includes('waypoint') ? '#000000' : '#03bf42',
                  'circle-opacity': 1
                }
              });
            } else if (info.type === 'symbol') {
              map.addLayer({
                id: layerId,
                type: 'symbol',
                source: info.source,
                layout: {
                  'visibility': info.visibility,
                  'text-field': ['get', 'name'],
                  'text-size': 10,
                  'text-anchor': 'top',
                  'text-offset': [0, 0.8],
                  'text-allow-overlap': false,
                  'text-ignore-placement': false,
                  'symbol-sort-key': zIndex
                },
                paint: {
                  'text-color': layerId.includes('waypoint') ? '#FFCC00' : '#7192c4',
                  'text-halo-color': '#000000',
                  'text-halo-width': 1
                }
              });
            }
            
            console.log(`🔧 Recreated layer ${layerId} with z-index ${zIndex}`);
          } else {
            console.warn(`❌ Source missing for layer ${layerId}`);
          }
        } catch (e) {
          console.error(`❌ Error recreating layer ${layerId}:`, e);
        }
      });
      
      // Force a map render update
      map.triggerRepaint();
      
      console.log('✅ Layers recreated with proper z-ordering');
      
      // Update UI in case of waypoint mode
      if (window.isWaypointModeActive) {
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
        
        // Show waypoints, hide platforms
        platformLayers.forEach(layerId => {
          if (map.getLayer(layerId)) {
            map.setLayoutProperty(layerId, 'visibility', 'none');
          }
        });
        
        waypointLayers.forEach(layerId => {
          if (map.getLayer(layerId)) {
            map.setLayoutProperty(layerId, 'visibility', 'visible');
          }
        });
      }
    }, 200);
  }
  
  // CRITICAL FIX #2: Permanently fix the layer addition and popup creation
  function fixPlatformPopups() {
    if (!window.mapboxgl) return;
    
    // Save original Popup class
    const originalPopup = window.mapboxgl.Popup;
    
    // Override with a fixed version that prevents flicker
    window.mapboxgl.Popup = function(options = {}) {
      // Add stable animation and prevent rapid show/hide
      const fixedOptions = {
        ...options,
        className: (options.className || '') + ' fixed-popup', // Add class for CSS
        offset: options.offset || 15
      };
      
      // Create popup with fixed options
      const popup = new originalPopup(fixedOptions);
      
      // Override setHTML to prevent flickering
      const originalSetHTML = popup.setHTML;
      popup.setHTML = function(html) {
        // Add wrapper to prevent flicker
        const wrappedHTML = `
          <div class="popup-content-stable" style="min-width: 100px;">
            ${html}
          </div>
        `;
        return originalSetHTML.call(this, wrappedHTML);
      };
      
      return popup;
    };
    
    // Add CSS to help with flickering
    if (!document.getElementById('fixed-popup-styles')) {
      const style = document.createElement('style');
      style.id = 'fixed-popup-styles';
      style.textContent = `
        /* Fixed popup styles */
        .fixed-popup {
          animation: none !important;
          transition: none !important;
        }
        
        .fixed-popup .mapboxgl-popup-content {
          padding: 8px 10px;
          min-width: 100px;
        }
        
        .fixed-popup .mapboxgl-popup-tip {
          transition: none !important;
        }
        
        /* Stabilize the popup content */
        .popup-content-stable {
          min-height: 40px;
          display: block;
        }
        
        /* Fix waypoint styles */
        .waypoint-popup .mapboxgl-popup-content {
          border-left: 3px solid #FFCC00 !important;
          background-color: rgba(255, 250, 230, 0.95);
        }
        
        /* Fix stop styles */
        .stop-popup .mapboxgl-popup-content {
          border-left: 3px solid #FF4136 !important;
          background-color: rgba(255, 240, 240, 0.95);
        }
      `;
      document.head.appendChild(style);
    }
  }
  
  // CRITICAL FIX #3: Fix the event handling for waypoint mode
  function fixWaypointModeHandling() {
    // Check if WaypointHandler exists
    if (window.waypointHandler) {
      // Fix the event processing
      const originalHandleWaypointClick = window.waypointHandler.handleWaypointClick;
      
      window.waypointHandler.handleWaypointClick = function(e) {
        console.log('🔧 Fixed waypoint click handler...');
        
        // Skip if not enabled
        if (!this.enabled) return false;
        
        // CRITICAL: Make sure to prevent default and propagation
        if (e.originalEvent) {
          e.originalEvent.preventDefault();
          e.originalEvent.stopPropagation();
        }
        
        try {
          // Original functionality
          return originalHandleWaypointClick.call(this, e);
        } catch (error) {
          console.error('❌ Error in waypoint click handler:', error);
          
          // Fallback implementation
          if (this.waypointManager) {
            this.waypointManager.addWaypoint(
              [e.lngLat.lng, e.lngLat.lat],
              `Waypoint ${this.waypointManager.waypoints.length + 1}`,
              { isWaypoint: true, type: 'WAYPOINT' }
            );
          }
          
          return true;
        }
      };
      
      console.log('✅ WaypointHandler fixed');
    }
  }
  
  // Apply all the fixes
  recreateLayersWithCorrectOrder();
  fixPlatformPopups();
  fixWaypointModeHandling();
  
  console.log('✅ Layer conflicts and flickering fixed');
  
  // Force reload waypoints if in waypoint mode
  if (window.isWaypointModeActive && window.platformManager) {
    console.log('🔄 Currently in waypoint mode, reloading waypoints...');
    
    // Show loading indicator
    if (window.LoadingIndicator) {
      window.LoadingIndicator.updateStatusIndicator(
        'Reloading waypoints...',
        'info',
        3000
      );
    }
    
    // Determine region
    let regionName = "NORWAY";
    if (window.platformManager.currentRegion) {
      if (typeof window.platformManager.currentRegion === 'string') {
        regionName = window.platformManager.currentRegion;
      } else if (window.platformManager.currentRegion.name) {
        regionName = window.platformManager.currentRegion.name;
      } else if (window.platformManager.currentRegion.id) {
        regionName = window.platformManager.currentRegion.id;
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
    
    // Force reload all waypoints with any available client
    setTimeout(() => {
      window.platformManager.loadWaypointsFromFoundry(
        window.client || window.osdkClient, 
        regionName
      );
    }, 300);
  }
}
