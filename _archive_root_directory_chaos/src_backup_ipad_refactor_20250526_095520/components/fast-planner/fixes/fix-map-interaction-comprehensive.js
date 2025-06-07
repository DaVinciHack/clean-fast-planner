/**
 * fix-map-interaction-comprehensive.js
 * 
 * Comprehensive fix for map click and drag issues including:
 * 1. Cleaning up overlapping click handlers
 * 2. Establishing a single source of truth for map interaction
 * 3. Fixing route drag and platform click functionality
 * 4. Preventing multiple waypoints from being added with a single click
 */

console.log('🔧 Applying comprehensive map interaction fix...');

// Track fix application to prevent duplicate handlers
window._mapInteractionFixApplied = false;

/**
 * Main function to fix map interaction handling
 */
function fixMapInteraction() {
  // Prevent multiple applications of the fix
  if (window._mapInteractionFixApplied) {
    console.log('🔧 Map interaction fix already applied, skipping');
    return;
  }

  // Wait for the required managers to be available
  if (!window.mapManager || !window.waypointManager || !window.mapInteractionHandler) {
    console.log('🔧 Waiting for required managers to be initialized...');
    setTimeout(fixMapInteraction, 1000);
    return;
  }

  console.log('🔧 Required managers found, applying fixes...');
  
  // First, clear any existing event handlers to avoid duplicates
  clearExistingClickHandlers();
  
  // Create a clean, single source of truth for map interactions
  setupMapInteractionHandler();
  
  // Fix route drag functionality
  fixRouteDragging();
  
  // Fix platform click issues
  fixPlatformClick();
  
  // Create a debug status indicator to show the fix is applied
  showFixAppliedMessage();
  
  // Mark as applied
  window._mapInteractionFixApplied = true;
}

/**
 * Clear all existing click handlers from the map
 */
function clearExistingClickHandlers() {
  try {
    const map = window.mapManager.getMap();
    if (!map) {
      console.error('🔧 Map not available, cannot clear handlers');
      return;
    }
    
    // First remove generic click handler
    map.off('click');
    
    // Then remove specific layer click handlers
    const potentialLayers = [
      'platforms-fixed-layer',
      'platforms-movable-layer',
      'airfields-layer',
      'platforms-layer',
      'route',
      'major-platforms'
    ];
    
    potentialLayers.forEach(layer => {
      if (map.getLayer(layer)) {
        try {
          map.off('click', layer);
          console.log(`🔧 Removed click handler from layer: ${layer}`);
        } catch (error) {
          console.log(`🔧 Could not remove handler from layer ${layer}: ${error.message}`);
        }
      }
    });
    
    console.log('🔧 Successfully cleared existing click handlers');
    
    // Disable hooks implementation during hook execution to prevent double waypoint adds
    window._hookHandlersDisabled = true;
    
    // Clear any global variable handlers that might be capturing clicks
    window._boundClickHandler = null;
    window._lastMapClickTime = 0;
    window._lastMapClickCoords = null;
    window._isAddingWaypoint = false;
    
  } catch (error) {
    console.error('🔧 Error clearing existing click handlers:', error);
  }
}

/**
 * Set up a clean MapInteractionHandler with proper event handling
 */
function setupMapInteractionHandler() {
  // Get references to required objects
  const map = window.mapManager.getMap();
  const mapInteractionHandler = window.mapInteractionHandler;
  
  if (!map || !mapInteractionHandler) {
    console.error('🔧 Map or MapInteractionHandler not available');
    return;
  }
  
  // Create clean implementation of addWaypoint with debouncing
  window.addWaypoint = function(waypointData) {
    // Debounce implementation to prevent multiple additions
    const now = Date.now();
    const lastClick = window._lastMapClickTime || 0;
    
    if (now - lastClick < 500) { // Ignore clicks within 500ms
      console.log('🔧 Ignoring rapid click');
      return false;
    }
    
    // Check if we're already processing a waypoint addition
    if (window._isAddingWaypoint) {
      console.log('🔧 Already adding a waypoint, ignoring');
      return false;
    }
    
    window._lastMapClickTime = now;
    window._isAddingWaypoint = true;
    
    console.log('🔧 Clean addWaypoint implementation called', waypointData);
    
    try {
      // Check if waypointManager is available
      if (!window.waypointManager) {
        console.error('🔧 waypointManager not available');
        window._isAddingWaypoint = false;
        return false;
      }
      
      // Determine coordinates and name from various input formats
      let coords, name, isWaypoint = false;
      
      // Check if we're in waypoint mode
      isWaypoint = window.isWaypointModeActive === true;
      
      // Extract coordinates based on input format
      if (Array.isArray(waypointData)) {
        coords = waypointData;
        name = null;
      } else if (typeof waypointData === 'string') {
        // It's a name - try to find a platform with this name
        if (window.platformManager) {
          const platform = window.platformManager.findPlatformByName(waypointData);
          if (platform) {
            coords = platform.coordinates;
            name = platform.name;
          } else {
            console.log(`🔧 Platform not found with name: ${waypointData}`);
            window._isAddingWaypoint = false;
            return false;
          }
        } else {
          console.log('🔧 Platform manager not available');
          window._isAddingWaypoint = false;
          return false;
        }
      } else if (waypointData && typeof waypointData === 'object') {
        // Extract from object
        if (waypointData.isWaypoint === true) {
          isWaypoint = true;
        }
        
        if (waypointData.coordinates) {
          coords = waypointData.coordinates;
        } else if (waypointData.coords) {
          coords = waypointData.coords;
        } else if (waypointData.lngLat) {
          coords = [waypointData.lngLat.lng, waypointData.lngLat.lat];
        } else if (waypointData.nearestRig && waypointData.nearestRig.distance <= 2) {
          // Use nearest rig if available and close enough
          if (waypointData.nearestRig.coordinates) {
            coords = waypointData.nearestRig.coordinates;
          } else if (waypointData.nearestRig.coords) {
            coords = waypointData.nearestRig.coords;
          } else if (waypointData.nearestRig.lng !== undefined && waypointData.nearestRig.lat !== undefined) {
            coords = [waypointData.nearestRig.lng, waypointData.nearestRig.lat];
          } else {
            // Use click coordinates as fallback
            if (waypointData.lngLat) {
              coords = [waypointData.lngLat.lng, waypointData.lngLat.lat];
            } else {
              console.error('🔧 No valid coordinates found in nearestRig or click data');
              window._isAddingWaypoint = false;
              return false;
            }
          }
          
          name = waypointData.nearestRig.name;
        } else {
          console.error('🔧 Invalid waypoint data format', waypointData);
          window._isAddingWaypoint = false;
          return false;
        }
        
        // Extract name if not already set
        if (!name && waypointData.name) {
          name = waypointData.name;
        }
      } else {
        console.error('🔧 Invalid waypoint data', waypointData);
        window._isAddingWaypoint = false;
        return false;
      }
      
      // Validate coordinates
      if (!coords || !Array.isArray(coords) || coords.length !== 2) {
        console.error('🔧 Invalid coordinates', coords);
        window._isAddingWaypoint = false;
        return false;
      }
      
      // Compare with last click coords to prevent duplicates
      if (window._lastMapClickCoords) {
        const [prevLng, prevLat] = window._lastMapClickCoords;
        const [newLng, newLat] = coords;
        
        // If clicks are very close together (within 0.001 degree), ignore
        if (Math.abs(prevLng - newLng) < 0.001 && Math.abs(prevLat - newLat) < 0.001) {
          console.log('🔧 Ignoring duplicate click at nearly same location');
          window._isAddingWaypoint = false;
          return false;
        }
      }
      
      // Store these coords for future comparison
      window._lastMapClickCoords = coords;
      
      console.log(`🔧 Adding ${isWaypoint ? 'waypoint' : 'stop'} at [${coords}] with name "${name || 'Unnamed'}"`);
      
      // Check if we have an insertIndex (for route clicks)
      if (waypointData && waypointData.insertIndex !== undefined) {
        // Add at specific index
        window.waypointManager.addWaypointAtIndex(
          coords,
          name,
          waypointData.insertIndex,
          { 
            isWaypoint: isWaypoint,
            type: isWaypoint ? 'WAYPOINT' : 'STOP',
            pointType: isWaypoint ? 'NAVIGATION_WAYPOINT' : 'LANDING_STOP'
          }
        );
      } else {
        // Add at the end
        window.waypointManager.addWaypoint(
          coords,
          name,
          { 
            isWaypoint: isWaypoint,
            type: isWaypoint ? 'WAYPOINT' : 'STOP',
            pointType: isWaypoint ? 'NAVIGATION_WAYPOINT' : 'LANDING_STOP'
          }
        );
      }
      
      // Show success message
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator(
          `Added ${name || (isWaypoint ? 'waypoint' : 'stop')} to route`,
          'success',
          3000
        );
      }
      
      // If we have a callback, call it
      if (window.mapInteractionHandler.callbacks && window.mapInteractionHandler.callbacks.onMapClick) {
        // Create a new object to avoid reference issues
        const callbackData = {
          ...waypointData,
          added: true,
          coords: coords,
          name: name,
          isWaypoint: isWaypoint
        };
        
        // Call the callback asynchronously to avoid blocking the UI
        setTimeout(() => {
          if (window.mapInteractionHandler.callbacks.onMapClick) {
            window.mapInteractionHandler.callbacks.onMapClick(callbackData);
          }
        }, 50);
      }
      
      // Get updated waypoints and update global reference
      const updatedWaypoints = window.waypointManager.getWaypoints();
      window.currentWaypoints = updatedWaypoints;
      
      // Dispatch a custom event to notify components
      const event = new CustomEvent('waypoints-updated', { 
        detail: { waypoints: updatedWaypoints }
      });
      window.dispatchEvent(event);
      
      window._isAddingWaypoint = false;
      return true;
    } catch (error) {
      console.error('🔧 Error in addWaypoint:', error);
      window._isAddingWaypoint = false;
      return false;
    }
  };
  
  // Replace the handleMapClick method with a clean implementation
  mapInteractionHandler.handleMapClick = function(e) {
    console.log('🔧 Clean handleMapClick implementation called', e);
    
    try {
      // Ignore click if route drag just finished
      if (window._routeDragJustFinished || window._isRouteDragging) {
        console.log('🔧 Ignoring click due to recent or active route drag');
        return;
      }
      
      // Check if in waypoint mode - direct handling
      const isWaypointMode = window.isWaypointModeActive === true;
      console.log(`🔧 Map clicked in ${isWaypointMode ? 'WAYPOINT' : 'NORMAL'} mode`);
      
      // Trigger left panel open callback if available
      if (this.callbacks && this.callbacks.onLeftPanelOpen) {
        this.callbacks.onLeftPanelOpen();
      }
      
      // Check for platforms first
      try {
        const map = this.mapManager.getMap();
        if (map) {
          const availableLayers = ['platforms-fixed-layer', 'platforms-movable-layer', 'airfields-layer', 'platforms-layer']
            .filter(layer => map.getLayer(layer));
          
          if (availableLayers.length > 0) {
            const platformFeatures = map.queryRenderedFeatures(e.point, { layers: availableLayers });
            if (platformFeatures && platformFeatures.length > 0) {
              console.log('🔧 Platform clicked, handling via platform click handler');
              this.handlePlatformClick({
                features: platformFeatures,
                lngLat: e.lngLat
              });
              return;
            }
          }
        }
      } catch (err) {
        console.error('🔧 Error checking for platform click:', err);
      }
      
      // Check for route click
      try {
        const map = this.mapManager.getMap();
        if (map && map.getLayer('route')) {
          const routeFeatures = map.queryRenderedFeatures(e.point, { layers: ['route'] });
          if (routeFeatures && routeFeatures.length > 0) {
            console.log('🔧 Route clicked, finding insert index');
            const insertIndex = this.waypointManager.findPathInsertIndex(e.lngLat);
            let nearestRig = null;
            
            if (this.platformManager && typeof this.platformManager.findNearestPlatform === 'function') {
              nearestRig = this.platformManager.findNearestPlatform(e.lngLat.lat, e.lngLat.lng);
            }
            
            console.log('🔧 Handling route click via route click handler');
            this.handleRouteClick(e.lngLat, insertIndex, nearestRig);
            return;
          }
        }
      } catch (err) {
        console.error('🔧 Error checking for route click:', err);
      }
      
      // Handle map background click (no platform or route)
      console.log('🔧 Map background clicked, adding waypoint directly');
      let nearestRig = null;
      if (this.platformManager && typeof this.platformManager.findNearestPlatform === 'function') {
        nearestRig = this.platformManager.findNearestPlatform(e.lngLat.lat, e.lngLat.lng, 2);
      }
      
      // Create click data with coordinates and nearest rig
      const clickData = {
        lngLat: e.lngLat,
        coordinates: [e.lngLat.lng, e.lngLat.lat],
        nearestRig: nearestRig,
        isWaypointMode: isWaypointMode
      };
      
      // Add waypoint using our global function
      window.addWaypoint(clickData);
    } catch (error) {
      console.error('🔧 Error in handleMapClick:', error);
    }
  };
  
  // Replace the handlePlatformClick method with a clean implementation
  mapInteractionHandler.handlePlatformClick = function(e) {
    console.log('🔧 Clean handlePlatformClick implementation called', e);
    
    try {
      // Check if platform is valid
      if (!e.features || e.features.length === 0) {
        console.log('🔧 No platform features found in click event');
        return;
      }
      
      // Get the platform data
      const platform = e.features[0].properties;
      console.log('🔧 Platform clicked:', platform);
      
      // Check if in waypoint mode
      const isWaypointMode = window.isWaypointModeActive === true;
      
      // Create a valid platform object with coordinates
      const platformData = {
        name: platform.name,
        coordinates: [e.lngLat.lng, e.lngLat.lat],
        type: platform.type || 'platform',
        isWaypointMode: isWaypointMode
      };
      
      // Add waypoint using our global function
      window.addWaypoint(platformData);
    } catch (error) {
      console.error('🔧 Error in handlePlatformClick:', error);
    }
  };
  
  // Replace the handleRouteClick method with a clean implementation
  mapInteractionHandler.handleRouteClick = function(lngLat, insertIndex, nearestRig) {
    console.log('🔧 Clean handleRouteClick implementation called', { lngLat, insertIndex, nearestRig });
    
    try {
      // Check if in waypoint mode
      const isWaypointMode = window.isWaypointModeActive === true;
      
      // Create route click data
      const routeClickData = {
        lngLat: lngLat,
        insertIndex: insertIndex,
        nearestRig: nearestRig,
        isWaypointMode: isWaypointMode
      };
      
      // Add waypoint using our global function
      window.addWaypoint(routeClickData);
    } catch (error) {
      console.error('🔧 Error in handleRouteClick:', error);
    }
  };
  
  // Override the initialize method to use our clean handlers
  const originalInitialize = mapInteractionHandler.initialize;
  mapInteractionHandler.initialize = function() {
    console.log('🔧 Clean initialize implementation called');
    
    try {
      // Remove any existing handlers
      const map = this.mapManager.getMap();
      if (!map) {
        console.error('🔧 Map not available, cannot initialize handlers');
        return false;
      }
      
      // Remove existing handlers
      map.off('click');
      
      // Add our clean map click handler
      const boundClickHandler = this.handleMapClick.bind(this);
      map.on('click', boundClickHandler);
      
      // Set up route dragging if available
      if (typeof this.waypointManager.setupRouteDragging === 'function') {
        this.waypointManager.setupRouteDragging(this.handleRouteDragComplete.bind(this));
      }
      
      console.log('🔧 Map interaction handler initialized successfully');
      return true;
    } catch (error) {
      console.error('🔧 Error in initialize:', error);
      return false;
    }
  };
  
  // Call initialize to set up the cleaned handlers
  mapInteractionHandler.initialize();
}

/**
 * Fix route drag functionality
 */
function fixRouteDragging() {
  try {
    if (!window.waypointManager || !window.mapManager) {
      console.log('🔧 Waypoint manager or map manager not available, cannot fix route dragging');
      return;
    }
    
    // Add a function to track route drag state
    window.setRouteDragState = function(isDragging) {
      window._isRouteDragging = isDragging;
      
      if (isDragging) {
        // If starting a drag, set the flag
        window._routeDragStartTime = Date.now();
      } else {
        // If ending a drag, set the just finished flag and clear it after a delay
        window._routeDragJustFinished = true;
        setTimeout(() => {
          window._routeDragJustFinished = false;
        }, 500);
      }
    };
    
    // Clean implementation of setupRouteDragging
    if (typeof window.waypointManager.setupRouteDragging === 'function') {
      // Store the original method
      const originalSetupRouteDragging = window.waypointManager.setupRouteDragging;
      
      // Replace with clean implementation
      window.waypointManager.setupRouteDragging = function(callback) {
        console.log('🔧 Clean setupRouteDragging implementation called');
        
        try {
          // Get map
          const map = this.mapManager.getMap();
          if (!map) {
            console.error('🔧 Map not available, cannot set up route dragging');
            return;
          }
          
          const onDragStart = (e) => {
            // Set drag state flag
            window.setRouteDragState(true);
          };
          
          const onDrag = (e) => {
            // Update UI during drag if needed
          };
          
          const onDragEnd = (e) => {
            // Reset drag state
            window.setRouteDragState(false);
            
            try {
              // Get insert index for the drag point
              const insertIndex = this.findPathInsertIndex(e.lngLat);
              
              // Call the callback with the drag data
              if (typeof callback === 'function') {
                callback(insertIndex, [e.lngLat.lng, e.lngLat.lat], {
                  isWaypointMode: window.isWaypointModeActive
                });
              }
            } catch (error) {
              console.error('🔧 Error in route drag end handling:', error);
            }
          };
          
          // Set up the route line for dragging
          if (map.getLayer('route')) {
            map.on('mouseenter', 'route', () => {
              map.getCanvas().style.cursor = 'pointer';
            });
            
            map.on('mouseleave', 'route', () => {
              map.getCanvas().style.cursor = '';
            });
            
            map.on('mousedown', 'route', onDragStart);
            map.on('mouseup', 'route', onDragEnd);
          }
          
          console.log('🔧 Route dragging set up successfully');
        } catch (error) {
          console.error('🔧 Error setting up route dragging:', error);
        }
      };
      
      // Reinitialize route dragging with the clean implementation
      if (window.mapInteractionHandler && typeof window.mapInteractionHandler.handleRouteDragComplete === 'function') {
        window.waypointManager.setupRouteDragging(window.mapInteractionHandler.handleRouteDragComplete.bind(window.mapInteractionHandler));
      }
    }
  } catch (error) {
    console.error('🔧 Error fixing route dragging:', error);
  }
}

/**
 * Fix platform click issues
 */
function fixPlatformClick() {
  try {
    const map = window.mapManager.getMap();
    if (!map || !window.mapInteractionHandler) {
      console.log('🔧 Map or MapInteractionHandler not available, cannot fix platform click');
      return;
    }
    
    // Get all platform-related layers
    const platformLayers = [
      'platforms-fixed-layer',
      'platforms-movable-layer',
      'airfields-layer',
      'platforms-layer',
      'major-platforms'
    ].filter(layer => map.getLayer(layer));
    
    // Remove any existing platform click handlers
    platformLayers.forEach(layer => {
      map.off('click', layer);
    });
    
    // Add clean platform click handlers
    platformLayers.forEach(layer => {
      map.on('click', layer, (e) => {
        if (window.mapInteractionHandler && typeof window.mapInteractionHandler.handlePlatformClick === 'function') {
          // Call platform click handler with the event
          window.mapInteractionHandler.handlePlatformClick(e);
        }
      });
      
      // Add hover styling
      map.on('mouseenter', layer, () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      
      map.on('mouseleave', layer, () => {
        map.getCanvas().style.cursor = '';
      });
    });
    
    console.log('🔧 Platform click handlers fixed');
  } catch (error) {
    console.error('🔧 Error fixing platform click:', error);
  }
}

/**
 * Show a message indicating the fix has been applied
 */
function showFixAppliedMessage() {
  // Check if we have the LoadingIndicator
  if (window.LoadingIndicator && window.LoadingIndicator.updateStatusIndicator) {
    window.LoadingIndicator.updateStatusIndicator(
      'Map interaction fix applied successfully',
      'success',
      5000
    );
  } else {
    // Create a simple notification
    const notification = document.createElement('div');
    notification.className = 'fix-applied-popup';
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.left = '50%';
    notification.style.transform = 'translateX(-50%)';
    notification.style.backgroundColor = 'rgba(46, 204, 113, 0.9)';
    notification.style.color = 'white';
    notification.style.padding = '10px 20px';
    notification.style.borderRadius = '5px';
    notification.style.zIndex = '9999';
    notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    notification.textContent = 'Map interaction fix applied successfully';
    
    document.body.appendChild(notification);
    
    // Remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode === document.body) {
        document.body.removeChild(notification);
      }
    }, 5000);
  }
}

// Run the fix immediately and on window load
fixMapInteraction();

window.addEventListener('load', () => {
  console.log('🔧 Window loaded, applying map interaction fix...');
  setTimeout(fixMapInteraction, 1000);
});

// Also attach to any custom events that might trigger map initialization
window.addEventListener('map-initialized', fixMapInteraction);
window.addEventListener('reinitialize-map-handlers', fixMapInteraction);

// Export function to manually apply the fix
export default fixMapInteraction;
