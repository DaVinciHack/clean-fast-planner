/**
 * WaypointHandler.js
 * 
 * A dedicated module to handle waypoints separately from stops
 */

class WaypointHandler {
  constructor(mapManager, waypointManager) {
    this.mapManager = mapManager;
    this.waypointManager = waypointManager;
    this.enabled = false;
    this.map = null;
    console.log('🟡 WaypointHandler: Created new instance');
  }
  
  /**
   * Initialize the waypoint handler
   * @returns {boolean} - Success status
   */
  initialize() {
    console.log('🟡 WaypointHandler: Initializing');
    
    // Get the map
    this.map = this.mapManager.getMap();
    if (!this.map) {
      console.error('🟡 WaypointHandler: Map not initialized');
      return false;
    }
    
    // IMPORTANT: Do NOT add a separate click handler to the map
    // We'll use the central event dispatcher model instead
    
    // Initialize with the current global state if available
    if (window.isWaypointModeActive === true) {
      console.log('🟡 WaypointHandler: Initializing in active state to match global flag');
      this.enabled = true;
    }
    
    console.log('🟡 WaypointHandler: Initialized successfully');
    return true;
  }
  
  /**
   * Handle map clicks for waypoints - this method is now called by MapInteractionHandler
   * @param {Object} e - The click event
   * @returns {boolean} - Whether the event was handled
   */
  handleWaypointClick(e) {
    // Only process if waypoint mode is enabled
    if (!this.enabled) {
      console.log('🟡 WaypointHandler: Not handling click - waypoint mode disabled');
      return false; // Not handled - let MapInteractionHandler take it
    }
    
    console.log('🟡 WaypointHandler: Handling map click for waypoint');
    
    // First check if nearest waypoint is available via platformManager
    let nearestWaypoint = null;
    let usedNearestWaypoint = false;
    
    try {
      if (this.waypointManager && this.waypointManager.platformManager &&
          typeof this.waypointManager.platformManager.findNearestWaypoint === 'function') {
        nearestWaypoint = this.waypointManager.platformManager.findNearestWaypoint(
          e.lngLat.lat, 
          e.lngLat.lng,
          5 // search radius in nautical miles
        );
        
        if (nearestWaypoint) {
          console.log(`🟡 WaypointHandler: Found nearest waypoint ${nearestWaypoint.name} at distance ${nearestWaypoint.distance.toFixed(2)} nm`);
          
          // Use the nearest waypoint instead of the clicked location
          this.addWaypoint(
            nearestWaypoint.coordinates, 
            nearestWaypoint.name,
            { isNearestWaypoint: true }
          );
          
          usedNearestWaypoint = true;
        }
      }
    } catch (error) {
      console.error('🟡 WaypointHandler: Error finding nearest waypoint:', error);
    }
    
    // If no nearest waypoint was found or used, add one at the clicked location
    if (!usedNearestWaypoint) {
      console.log('🟡 WaypointHandler: No nearest waypoint found, adding at clicked location');
      this.addWaypoint([e.lngLat.lng, e.lngLat.lat]);
    }
    
    // Force redraw of route
    setTimeout(() => {
      if (this.waypointManager && this.waypointManager.updateRoute) {
        this.waypointManager.updateRoute();
      }
    }, 50);
    
    // Return true to indicate the event was handled
    return true;
  }
  
  /**
   * Add a waypoint to the route
   * @param {Array} coords - [lng, lat] coordinates
   * @param {string} name - Optional name for the waypoint
   * @param {Object} options - Additional options
   */
  addWaypoint(coords, name, options = {}) {
    console.log('🟡 WaypointHandler: Adding waypoint at', coords);
    
    // Format the name
    const waypointCount = this.waypointManager.getWaypoints().filter(wp => wp.type === 'WAYPOINT').length;
    const displayName = name || `Waypoint ${waypointCount + 1}`;
    
    // Add the waypoint to the waypointManager with explicit type
    this.waypointManager.addWaypoint(coords, displayName, {
      isWaypoint: true,
      type: 'WAYPOINT',
      ...options
    });
    
    // Log success
    console.log('🟡 WaypointHandler: Waypoint added successfully');
  }
  
  /**
   * Enable or disable waypoint mode
   * @param {boolean} enabled - Whether to enable waypoint mode
   */
  setEnabled(enabled) {
    console.log(`🟡 WaypointHandler: ${enabled ? 'Enabling' : 'Disabling'} waypoint mode`);
    
    // Store the enabled state
    this.enabled = enabled;
    
    // Update the global flag
    window.isWaypointModeActive = enabled;
    
    // Change the cursor to indicate mode
    if (this.map) {
      this.map.getCanvas().style.cursor = enabled ? 'crosshair' : '';
    }
    
    // Also add or remove a CSS class to the body to indicate mode
    if (enabled) {
      document.body.classList.add('waypoint-mode-active');
    } else {
      document.body.classList.remove('waypoint-mode-active');
    }
    
    // Return the new state
    return this.enabled;
  }
  
  /**
   * Get the current enabled state
   * @returns {boolean} - Whether waypoint mode is enabled
   */
  isEnabled() {
    return this.enabled;
  }
}

export default WaypointHandler;