/**
 * SingleModeHandler.js
 * 
 * A clean, simple implementation of map interaction modes
 * with proper initialization sequencing
 */

/**
 * Create a mode handler that properly manages normal and waypoint modes
 * with clean separation and initialization
 * 
 * @param {Object} mapManager - The map manager instance
 * @param {Object} waypointManager - The waypoint manager instance
 * @param {Object} platformManager - The platform manager instance
 * @returns {Object} The mode handler with activate and toggle methods
 */
export function createModeHandler(mapManager, waypointManager, platformManager) {
  console.log('Creating mode handler...');
  
  if (!mapManager || !waypointManager || !platformManager) {
    console.error('Cannot create mode handler: Missing required managers');
    return null;
  }
  
  // Create a state object to track the current state
  const state = {
    isInitialized: false,
    currentMode: 'normal', // 'normal' or 'waypoint'
    normalClickHandler: null,
    waypointClickHandler: null
  };
  
  /**
   * Wait for the map to be fully initialized before setting up handlers
   * @returns {Promise<Object>} A promise that resolves to the map instance
   */
  const waitForMap = () => {
    return new Promise((resolve, reject) => {
      if (!mapManager) {
        reject(new Error('Map manager not available'));
        return;
      }
      
      // Function to check if map is ready
      const checkMap = () => {
        const map = mapManager.getMap();
        
        if (map && typeof map.on === 'function' && mapManager.isMapLoaded()) {
          console.log('Map is ready for mode handler');
          resolve(map);
        } else {
          console.log('Map not ready, waiting...');
          setTimeout(checkMap, 500);
        }
      };
      
      // Start checking
      checkMap();
    });
  };
  
  /**
   * Normal mode click handler
   * @param {Object} e - The click event
   */
  const handleNormalModeClick = (e) => {
    console.log('Normal mode click:', e.lngLat);
    
    try {
      const map = mapManager.getMap();
      
      // Check if clicking on a platform marker
      const platformFeatures = map.queryRenderedFeatures(e.point, { 
        layers: [
          'platforms-fixed-layer', 
          'platforms-movable-layer',
          'airfields-layer'
        ] 
      });

      if (platformFeatures && platformFeatures.length > 0) {
        console.log('Clicked on platform:', platformFeatures[0].properties.name);
        const props = platformFeatures[0].properties;
        const coordinates = platformFeatures[0].geometry.coordinates.slice();

        // Add platform as STOP (not waypoint)
        waypointManager.addWaypoint(coordinates, props.name, {
          isWaypoint: false,
          type: 'STOP'
        });
        return;
      }
      
      // Check if clicking on the route line
      const routeFeatures = map.queryRenderedFeatures(e.point, { layers: ['route'] });
      if (routeFeatures && routeFeatures.length > 0) {
        console.log('Clicked on route line');
        
        // Find where to insert on the path
        const insertIndex = waypointManager.findPathInsertIndex(e.lngLat);

        // Check for nearest rig
        const nearestRig = platformManager.findNearestPlatform(e.lngLat.lat, e.lngLat.lng, 5);

        // Add as STOP (not waypoint)
        if (nearestRig && nearestRig.distance < 5) {
          waypointManager.addWaypointAtIndex(nearestRig.coordinates, nearestRig.name, insertIndex, {
            isWaypoint: false,
            type: 'STOP'
          });
        } else {
          waypointManager.addWaypointAtIndex([e.lngLat.lng, e.lngLat.lat], null, insertIndex, {
            isWaypoint: false,
            type: 'STOP'
          });
        }
        return;
      }
      
      // If clicking on map background, add as STOP
      const nearestRig = platformManager.findNearestPlatform(e.lngLat.lat, e.lngLat.lng, 5);
      
      if (nearestRig && nearestRig.distance < 5) {
        console.log(`Using nearest platform: ${nearestRig.name}`);
        waypointManager.addWaypoint(nearestRig.coordinates, nearestRig.name, {
          isWaypoint: false,
          type: 'STOP'
        });
      } else {
        console.log('Adding stop at clicked location');
        waypointManager.addWaypoint([e.lngLat.lng, e.lngLat.lat], null, {
          isWaypoint: false,
          type: 'STOP'
        });
      }
    } catch (err) {
      console.error('Error in normal mode click handler:', err);
    }
  };
  
  /**
   * Waypoint mode click handler
   * @param {Object} e - The click event
   */
  const handleWaypointModeClick = (e) => {
    console.log('Waypoint mode click:', e.lngLat);
    
    try {
      const map = mapManager.getMap();
      
      // Check if clicking on a waypoint marker
      const waypointFeatures = map.queryRenderedFeatures(e.point, { 
        layers: ['osdk-waypoints-layer'] 
      });
      
      if (waypointFeatures && waypointFeatures.length > 0) {
        console.log('Clicked on waypoint marker');
        const props = waypointFeatures[0].properties;
        const coordinates = waypointFeatures[0].geometry.coordinates;
        
        // Add the waypoint as an actual WAYPOINT
        waypointManager.addWaypoint(coordinates, props.name || 'Waypoint', {
          isWaypoint: true,
          type: 'WAYPOINT'
        });
        return;
      }
      
      // Find nearest waypoint to click location
      const nearestWaypoint = platformManager.findNearestOsdkWaypoint(e.lngLat.lat, e.lngLat.lng, 5);
      
      if (nearestWaypoint) {
        console.log(`Adding nearest waypoint: ${nearestWaypoint.name}`);
        
        // Get coordinates in correct format
        const coordinates = nearestWaypoint.coordinates || 
                          nearestWaypoint.coords || 
                          [nearestWaypoint.lng, nearestWaypoint.lat];
        
        // Add as WAYPOINT
        waypointManager.addWaypoint(coordinates, nearestWaypoint.name, {
          isWaypoint: true,
          type: 'WAYPOINT'
        });
      } else {
        console.log('No waypoint found near click location');
        
        // Show message to user
        if (window.LoadingIndicator) {
          window.LoadingIndicator.updateStatusIndicator(
            'No navigation waypoint found near click location. Try clicking on a yellow waypoint.',
            'warning'
          );
        }
      }
    } catch (err) {
      console.error('Error in waypoint mode click handler:', err);
    }
  };
  
  /**
   * Waypoint mode route click handler
   * @param {Object} e - The click event
   */
  const handleWaypointRouteClick = (e) => {
    console.log('Waypoint mode route click:', e.lngLat);
    
    try {
      // Find insert index for the waypoint
      const insertIndex = waypointManager.findPathInsertIndex(e.lngLat);
      
      // Find nearest waypoint
      const nearestWaypoint = platformManager.findNearestOsdkWaypoint(e.lngLat.lat, e.lngLat.lng, 5);
      
      if (nearestWaypoint) {
        console.log(`Adding waypoint at route: ${nearestWaypoint.name}`);
        
        // Get coordinates in correct format
        const coordinates = nearestWaypoint.coordinates || 
                          nearestWaypoint.coords || 
                          [nearestWaypoint.lng, nearestWaypoint.lat];
        
        // Add at specific index as WAYPOINT
        waypointManager.addWaypointAtIndex(coordinates, nearestWaypoint.name, insertIndex, {
          isWaypoint: true,
          type: 'WAYPOINT'
        });
      } else {
        // Show message to user
        if (window.LoadingIndicator) {
          window.LoadingIndicator.updateStatusIndicator(
            'No navigation waypoint found near route click. Try clicking on a yellow waypoint.',
            'warning'
          );
        }
      }
    } catch (err) {
      console.error('Error in waypoint route click handler:', err);
    }
  };
  
  /**
   * Initialize the mode handler
   * @returns {Promise<boolean>} A promise that resolves to true if initialization succeeded
   */
  const initialize = async () => {
    if (state.isInitialized) {
      console.log('Mode handler already initialized');
      return true;
    }
    
    try {
      // Wait for the map to be ready
      const map = await waitForMap();
      
      // Clear any existing click handlers
      map.off('click');
      map.off('click', 'route');
      
      // Create bound handlers
      state.normalClickHandler = handleNormalModeClick;
      state.waypointClickHandler = handleWaypointModeClick;
      
      // Mark as initialized
      state.isInitialized = true;
      
      // Activate the initial mode (normal by default)
      activateMode('normal');
      
      // Make the toggle function available globally
      window.toggleMapMode = (mode) => toggleMode(mode);
      window.isWaypointModeActive = false; // Initialize global flag
      
      console.log('Mode handler initialized successfully');
      return true;
    } catch (err) {
      console.error('Failed to initialize mode handler:', err);
      return false;
    }
  };
  
  /**
   * Activate a specific mode
   * @param {string} mode - The mode to activate ('normal' or 'waypoint')
   * @returns {boolean} True if activation succeeded
   */
  const activateMode = (mode) => {
    if (!state.isInitialized) {
      console.warn('Mode handler not initialized, cannot activate mode');
      return false;
    }
    
    const map = mapManager.getMap();
    if (!map) {
      console.error('Map not available, cannot activate mode');
      return false;
    }
    
    // Update the current mode
    state.currentMode = mode;
    
    // Update the global flag
    window.isWaypointModeActive = (mode === 'waypoint');
    
    try {
      // First remove all click handlers
      map.off('click');
      map.off('click', 'route');
      
      if (mode === 'waypoint') {
        console.log('Activating waypoint mode');
        
        // Change map cursor
        map.getCanvas().style.cursor = 'crosshair';
        
        // Toggle platform and waypoint layers
        if (platformManager && typeof platformManager.toggleWaypointMode === 'function') {
          platformManager.toggleWaypointMode(true);
        }
        
        // Add click handlers
        map.on('click', state.waypointClickHandler);
        map.on('click', 'route', handleWaypointRouteClick);
        
        // Show message
        if (window.LoadingIndicator) {
          window.LoadingIndicator.updateStatusIndicator(
            'Waypoint mode active. Click on yellow waypoints to add them to your route.',
            'info',
            3000
          );
        }
      } else {
        console.log('Activating normal mode');
        
        // Reset cursor
        map.getCanvas().style.cursor = '';
        
        // Toggle platform and waypoint layers
        if (platformManager && typeof platformManager.toggleWaypointMode === 'function') {
          platformManager.toggleWaypointMode(false);
        }
        
        // Add click handler
        map.on('click', state.normalClickHandler);
        
        // Show message
        if (window.LoadingIndicator) {
          window.LoadingIndicator.updateStatusIndicator(
            'Normal mode active. Click on the map or platforms to add stops.',
            'info',
            3000
          );
        }
      }
      
      return true;
    } catch (err) {
      console.error(`Error activating ${mode} mode:`, err);
      return false;
    }
  };
  
  /**
   * Toggle between normal and waypoint modes
   * @param {string} targetMode - The mode to switch to ('normal' or 'waypoint')
   * @returns {boolean} True if toggle succeeded
   */
  const toggleMode = (targetMode) => {
    console.log(`Toggling to ${targetMode} mode`);
    
    if (!state.isInitialized) {
      // Try to initialize the handler first
      initialize().then((success) => {
        if (success) {
          activateMode(targetMode);
        }
      });
      return false;
    }
    
    return activateMode(targetMode);
  };
  
  // Start initialization when created
  initialize();
  
  // Return the public API
  return {
    initialize,
    activateMode,
    toggleMode,
    getCurrentMode: () => state.currentMode,
    isInitialized: () => state.isInitialized
  };
}

export default createModeHandler;
