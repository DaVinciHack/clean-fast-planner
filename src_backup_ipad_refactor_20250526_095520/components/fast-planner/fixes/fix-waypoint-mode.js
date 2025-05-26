/**
 * fix-waypoint-mode.js
 * 
 * A focused fix for the waypoint mode functionality in the Fast Planner application.
 * This ensures that when in waypoint mode, the app correctly adds waypoints (navigation points)
 * that are distinct from stops (landing locations).
 * 
 * The fix:
 * 1. Updates the WaypointHandler to properly create waypoints with correct styling
 * 2. Ensures the MapInteractionHandler correctly detects waypoint mode
 * 3. Adds proper visual distinction between waypoints and stops
 * 4. Makes waypoints visually distinguishable in the route
 */

/**
 * Apply the fixes to the existing code
 */
function applyWaypointModeFix() {
  console.log('⚠️ Applying waypoint mode fix...');
  
  // Fix 1: Ensure the global waypoint mode flag is properly set up
  if (window.isWaypointModeActive === undefined) {
    console.log('Setting up waypoint mode flag');
    window.isWaypointModeActive = false;
  }
  
  // Fix 2: Add CSS styles to clearly distinguish waypoints from stops
  addWaypointStyles();
  
  // Fix 3: Ensure WaypointHandler is properly initialized and available globally
  ensureWaypointHandlerAvailable();
  
  // Fix 4: Enhance MapInteractionHandler to properly handle waypoint mode
  enhanceMapInteractionHandler();
  
  console.log('✅ Waypoint mode fix applied successfully!');
  console.log('You can now toggle waypoint mode and add waypoints to the route.');
  console.log('- Waypoints appear as yellow markers, distinct from red stop markers');
  console.log('- Waypoints are considered navigation points, not landing spots');
}

/**
 * Add CSS styles to enhance waypoint visualization
 */
function addWaypointStyles() {
  if (document.getElementById('waypoint-mode-styles')) {
    return; // Styles already added
  }
  
  const styleSheet = document.createElement('style');
  styleSheet.id = 'waypoint-mode-styles';
  styleSheet.innerHTML = `
    /* Waypoint marker styling */
    .mapboxgl-marker[data-marker-type="waypoint"] {
      filter: drop-shadow(0 0 3px rgba(255, 204, 0, 0.9));
      cursor: pointer;
    }
    
    /* Stop marker styling */
    .mapboxgl-marker[data-marker-type="stop"] {
      filter: drop-shadow(0 0 2px rgba(255, 65, 54, 0.7));
      cursor: pointer;
    }
    
    /* Waypoint popup styling */
    .waypoint-popup .mapboxgl-popup-content {
      border-left: 4px solid #FFCC00;
      background-color: rgba(255, 250, 230, 0.95);
    }
    
    /* Stop popup styling */
    .stop-popup .mapboxgl-popup-content {
      border-left: 4px solid #FF4136;
      background-color: rgba(255, 240, 240, 0.95);
    }
    
    /* Waypoint mode indicator in the UI */
    .waypoint-mode-active .waypoint-mode-button {
      background-color: #FFCC00 !important;
      color: #000000 !important;
      font-weight: bold !important;
      box-shadow: 0 0 5px rgba(255, 204, 0, 0.7) !important;
    }
    
    /* Change cursor in waypoint mode */
    body.waypoint-mode-active .mapboxgl-canvas-container {
      cursor: crosshair;
    }
  `;
  
  document.head.appendChild(styleSheet);
  console.log('✅ Waypoint styles added to document');
}

/**
 * Ensure the WaypointHandler is available and properly initialized
 */
function ensureWaypointHandlerAvailable() {
  // Check if waypoint handler exists
  if (!window.waypointHandler) {
    console.log('🔍 WaypointHandler not found, initializing...');
    
    // Try to find mapManager and waypointManager
    const mapManager = window.mapManager;
    const waypointManager = window.waypointManager;
    
    if (!mapManager || !waypointManager) {
      console.error('❌ Cannot initialize WaypointHandler: mapManager or waypointManager not found');
      return;
    }
    
    // Check if WaypointHandler class is available in the global scope
    const WaypointHandlerClass = window.WaypointHandler;
    
    if (WaypointHandlerClass) {
      // Create a new instance
      window.waypointHandler = new WaypointHandlerClass(mapManager, waypointManager);
      window.waypointHandler.initialize();
      console.log('✅ Created new WaypointHandler instance');
    } else {
      // Try to create a minimal version of WaypointHandler
      console.log('⚠️ WaypointHandler class not found, creating minimal implementation');
      
      window.waypointHandler = {
        enabled: false,
        map: mapManager.getMap(),
        waypointManager: waypointManager,
        
        initialize() {
          console.log('WaypointHandler: Minimal implementation initialized');
          return true;
        },
        
        setEnabled(enabled) {
          this.enabled = enabled;
          window.isWaypointModeActive = enabled;
          
          // Add/remove body class for styling
          if (enabled) {
            document.body.classList.add('waypoint-mode-active');
          } else {
            document.body.classList.remove('waypoint-mode-active');
          }
          
          // Change cursor style
          if (this.map) {
            this.map.getCanvas().style.cursor = enabled ? 'crosshair' : '';
          }
          
          console.log(`WaypointHandler: Waypoint mode ${enabled ? 'enabled' : 'disabled'}`);
          return this.enabled;
        },
        
        isEnabled() {
          return this.enabled;
        },
        
        handleWaypointClick(e) {
          if (!this.enabled) return false;
          
          console.log('WaypointHandler: Processing waypoint click');
          
          // Add a waypoint at the clicked location
          this.waypointManager.addWaypoint(
            [e.lngLat.lng, e.lngLat.lat],
            `Waypoint ${this.waypointManager.getWaypoints().filter(wp => wp.type === 'WAYPOINT').length + 1}`,
            { isWaypoint: true, type: 'WAYPOINT' }
          );
          
          // Force redraw of route
          setTimeout(() => {
            if (this.waypointManager && this.waypointManager.updateRoute) {
              this.waypointManager.updateRoute();
            }
          }, 50);
          
          return true;
        }
      };
      
      console.log('✅ Created minimal WaypointHandler implementation');
    }
  } else {
    console.log('✅ WaypointHandler already exists');
  }
}

/**
 * Enhance the MapInteractionHandler to properly handle waypoint mode
 */
function enhanceMapInteractionHandler() {
  const mapInteractionHandler = window.mapInteractionHandler;
  
  if (!mapInteractionHandler) {
    console.error('❌ MapInteractionHandler not found');
    return;
  }
  
  console.log('🔍 Enhancing MapInteractionHandler...');
  
  // Save the original handleMapClick method to call later
  const originalHandleMapClick = mapInteractionHandler.handleMapClick;
  
  // Override the handleMapClick method to properly handle waypoint mode
  mapInteractionHandler.handleMapClick = function(e) {
    console.log('🎯 Enhanced MapInteractionHandler: Handling map click');
    
    // Check for waypoint mode
    const isWaypointMode = window.isWaypointModeActive === true;
    console.log(`Click detected in ${isWaypointMode ? 'WAYPOINT' : 'NORMAL'} mode`);
    
    // If in waypoint mode, prioritize the waypoint handler
    if (isWaypointMode) {
      const waypointHandler = window.waypointHandler;
      
      if (waypointHandler && typeof waypointHandler.handleWaypointClick === 'function') {
        // Try to handle with the waypoint handler
        const handled = waypointHandler.handleWaypointClick(e);
        
        if (handled) {
          console.log('Click handled by WaypointHandler');
          window._clickHandledByWaypointHandler = true;
          return; // Stop processing the click event
        }
      }
    }
    
    // If not in waypoint mode or waypoint handler didn't handle it, 
    // call the original method
    window._clickHandledByWaypointHandler = false;
    
    // Call the original method
    if (originalHandleMapClick) {
      originalHandleMapClick.call(this, e);
    }
  };
  
  console.log('✅ MapInteractionHandler enhanced successfully');
}

// Apply the fixes immediately when this script is loaded
applyWaypointModeFix();

// Export the function in case we need to apply it manually
export default applyWaypointModeFix;
