/**
 * fix-osdk-layer-loading.js
 * 
 * Emergency fix for OSDK client and layer flickering issues in Fast Planner
 */

(function() {
  console.log('🔧 APPLYING EMERGENCY OSDK & LAYER FIX');
  
  // Wait for components to be initialized
  const waitForComponents = setInterval(() => {
    if (window.platformManager && window.mapManager) {
      clearInterval(waitForComponents);
      console.log('🔧 Found required components, applying fixes...');
      
      // Apply fixes
      fixOSDKClientAccess();
      fixLayerZOrdering();
      fixPopupFlickering();
      fixWaypointLoading();
      
      console.log('✅ All fixes applied successfully!');
    }
  }, 500);
  
  // Set a timeout to stop checking after 30 seconds
  setTimeout(() => clearInterval(waitForComponents), 30000);
})();

/**
 * Ensures OSDK client is always available for waypoint loading
 */
function fixOSDKClientAccess() {
  if (!window.platformManager) return;
  
  console.log('🔧 Fixing OSDK client access for waypoint loading...');
  
  // Store original method
  const originalLoadWaypoints = window.platformManager.loadWaypointsFromFoundry;
  
  // Replace with enhanced version that ensures client is available
  window.platformManager.loadWaypointsFromFoundry = async function(client, regionName = "NORWAY") {
    console.log(`🔧 Enhanced loadWaypointsFromFoundry for ${regionName}`);
    
    // CRITICAL FIX: Always ensure we have a client
    if (!client) {
      console.warn('🔧 No client provided - attempting to get global client');
      
      // Try different sources for client
      if (window.client) {
        console.log('🔧 Using window.client as fallback');
        client = window.client;
      } else if (window.osdkClient) {
        console.log('🔧 Using window.osdkClient as fallback');
        client = window.osdkClient;
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
        
        // Return empty array to prevent errors
        return [];
      }
    }
    
    // Store client globally for future use
    window.osdkClient = client;
    
    console.log('🔧 OSDK client secured, proceeding with waypoint loading');
    return originalLoadWaypoints.call(this, client, regionName);
  };
  
  console.log('✅ OSDK client access fixed');
}

/**
 * Fixes layer Z-ordering to prevent flickering
 */
function fixLayerZOrdering() {
  if (!window.mapManager) return;
  
  console.log('🔧 Fixing layer Z-ordering...');
  
  const map = window.mapManager.getMap();
  if (!map) {
    console.error('❌ Map not available - will fix when map is ready');
    
    // Wait for map to be ready
    window.mapManager.onMapLoaded(() => {
      const map = window.mapManager.getMap();
      applyZOrdering(map);
    });
    return;
  }
  
  applyZOrdering(map);
  
  function applyZOrdering(map) {
    console.log('🔧 Applying Z-ordering to map layers...');
    
    // Define Z-index ordering for all layer types
    const zOrderings = {
      // Base map elements: 0-9
      'grid-labels': 5,
      'latitude-lines': 1,
      'longitude-lines': 2,
      
      // Platform layers: 10-29
      'platforms-layer': 10,
      'platforms-movable-layer': 11,
      'airfields-layer': 15,
      
      // Platform labels: 30-49
      'platforms-fixed-labels': 30,
      'platforms-movable-labels': 31,
      'airfields-labels': 35,
      
      // Route layers: 50-69
      'route-glow': 50,
      'route': 55,
      'route-arrows': 60,
      'leg-labels': 65,
      
      // Waypoint layers: 70-89 (highest for clicking)
      'waypoints-layer': 70,
      'waypoints-labels': 75,
      
      // Temporary layers: 90-99
      'drag-line': 90
    };
    
    // Apply z-ordering to all existing layers
    Object.entries(zOrderings).forEach(([layerId, zIndex]) => {
      if (map.getLayer(layerId)) {
        try {
          const layer = map.getLayer(layerId);
          const type = layer.type;
          
          if (type === 'circle') {
            map.setLayoutProperty(layerId, 'circle-sort-key', zIndex);
          } else if (type === 'symbol') {
            map.setLayoutProperty(layerId, 'symbol-sort-key', zIndex);
          } else if (type === 'line') {
            map.setLayoutProperty(layerId, 'line-sort-key', zIndex);
          }
          
          console.log(`🔧 Set z-index ${zIndex} for ${layerId} (${type})`);
        } catch (e) {
          console.warn(`❌ Error setting z-index for ${layerId}:`, e);
        }
      }
    });
    
    // Override addLayer to ensure all new layers get proper z-ordering
    const originalAddLayer = map.addLayer;
    map.addLayer = function(layerConfig, beforeId) {
      // Check if this layer has a z-ordering defined
      const zIndex = zOrderings[layerConfig.id];
      if (zIndex !== undefined) {
        // Apply z-ordering based on layer type
        if (layerConfig.type === 'circle') {
          layerConfig.layout = layerConfig.layout || {};
          layerConfig.layout['circle-sort-key'] = zIndex;
        } else if (layerConfig.type === 'symbol') {
          layerConfig.layout = layerConfig.layout || {};
          layerConfig.layout['symbol-sort-key'] = zIndex;
        } else if (layerConfig.type === 'line') {
          layerConfig.layout = layerConfig.layout || {};
          layerConfig.layout['line-sort-key'] = zIndex;
        }
        console.log(`🔧 Auto-applied z-index ${zIndex} to new layer ${layerConfig.id}`);
      } else {
        // Assign a default high z-index for unknown layers
        const defaultIndex = 100;
        if (layerConfig.type === 'circle') {
          layerConfig.layout = layerConfig.layout || {};
          layerConfig.layout['circle-sort-key'] = defaultIndex;
        } else if (layerConfig.type === 'symbol') {
          layerConfig.layout = layerConfig.layout || {};
          layerConfig.layout['symbol-sort-key'] = defaultIndex;
        } else if (layerConfig.type === 'line') {
          layerConfig.layout = layerConfig.layout || {};
          layerConfig.layout['line-sort-key'] = defaultIndex;
        }
        console.log(`🔧 Applied default z-index ${defaultIndex} to unknown layer ${layerConfig.id}`);
      }
      
      // Call original method
      return originalAddLayer.call(this, layerConfig, beforeId);
    };
    
    console.log('✅ Layer Z-ordering fixed');
  }
}

/**
 * Fixes popup flickering
 */
function fixPopupFlickering() {
  if (!window.mapboxgl) return;
  
  console.log('🔧 Fixing popup flickering...');
  
  // Add CSS to stabilize popups
  if (!document.getElementById('fixed-popup-styles')) {
    const style = document.createElement('style');
    style.id = 'fixed-popup-styles';
    style.textContent = `
      /* Fix popup flickering */
      .mapboxgl-popup {
        animation: none !important;
        transition: none !important;
        pointer-events: none;
      }
      
      .mapboxgl-popup-content {
        min-width: 100px !important;
        min-height: 30px !important;
        padding: 8px 10px !important;
        pointer-events: auto;
      }
      
      .mapboxgl-popup-tip {
        transition: none !important;
      }
      
      /* Style for landing stop popups */
      .stop-popup .mapboxgl-popup-content {
        border-left: 3px solid #FF4136 !important;
        background-color: rgba(255, 240, 240, 0.95);
      }
      
      /* Style for waypoint popups */
      .waypoint-popup .mapboxgl-popup-content {
        border-left: 3px solid #FFCC00 !important;
        background-color: rgba(255, 250, 230, 0.95);
      }
    `;
    document.head.appendChild(style);
  }
  
  // Override default Popup behavior
  const originalPopup = window.mapboxgl.Popup;
  window.mapboxgl.Popup = function(options = {}) {
    // Add our stable class to any popup
    const fixedOptions = {
      ...options,
      className: (options.className || '') + ' fixed-popup',
      closeOnClick: false, // Prevent close on map click
      offset: options.offset || 15 // Default offset
    };
    
    // Create the popup with fixed options
    const popup = new originalPopup(fixedOptions);
    
    // Override setHTML to add stable content wrapper
    const originalSetHTML = popup.setHTML;
    popup.setHTML = function(html) {
      // Add stable wrapper
      const wrappedHTML = `
        <div class="popup-content-stable">
          ${html}
        </div>
      `;
      return originalSetHTML.call(this, wrappedHTML);
    };
    
    return popup;
  };
  
  console.log('✅ Popup flickering fixed');
}

/**
 * Fixes waypoint loading in waypoint mode
 */
function fixWaypointLoading() {
  if (!window.platformManager) return;
  
  console.log('🔧 Fixing waypoint loading in waypoint mode...');
  
  // Store original method
  const originalToggleWaypointMode = window.platformManager.toggleWaypointMode;
  
  // Replace with improved version
  window.platformManager.toggleWaypointMode = function(waypointMode) {
    console.log(`🔧 Enhanced toggleWaypointMode(${waypointMode})`);
    
    // Save state
    this.waypointModeActive = waypointMode;
    window.isWaypointModeActive = waypointMode;
    
    // Get map
    const map = this.mapManager.getMap();
    if (!map) {
      console.error('Map not available');
      return;
    }
    
    // Define layer groups
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
    
    const setLayerVisibility = (layerId, visibility) => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', visibility);
      }
    };
    
    // If enabling waypoint mode
    if (waypointMode) {
      console.log('🔧 Enabling waypoint mode - hiding platforms, showing waypoints');
      
      // First hide platform layers
      platformLayers.forEach(layer => setLayerVisibility(layer, 'none'));
      
      // Check if we need to load waypoints
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
        let regionName = "NORWAY"; // Default
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
        
        // Get client from any available source
        const client = window.client || window.osdkClient;
        
        // Load waypoints in the background
        this.loadWaypointsFromFoundry(client, regionName)
          .then(waypoints => {
            console.log(`🔧 Loaded ${waypoints.length} waypoints`);
            
            // Make sure the layers are visible
            waypointLayers.forEach(layer => setLayerVisibility(layer, 'visible'));
            
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
        waypointLayers.forEach(layer => setLayerVisibility(layer, 'visible'));
      }
      
      // Add CSS classes for visual indication
      document.body.classList.add('waypoint-mode-active');
    } 
    // Disabling waypoint mode
    else {
      console.log('🔧 Disabling waypoint mode - showing platforms, hiding waypoints');
      
      // Show platform layers
      platformLayers.forEach(layer => setLayerVisibility(layer, 'visible'));
      
      // Hide waypoint layers
      waypointLayers.forEach(layer => setLayerVisibility(layer, 'none'));
      
      // Remove CSS classes
      document.body.classList.remove('waypoint-mode-active');
    }
    
    // Call original method to ensure other functionality is preserved
    return originalToggleWaypointMode.call(this, waypointMode);
  };
  
  console.log('✅ Waypoint loading fixed');
}
