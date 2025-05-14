/**
 * SimpleMapHandler.js
 * 
 * A simplified map interaction handler that doesn't depend on problematic functions
 */

class SimpleMapHandler {
  constructor(mapManager, waypointManager) {
    this.mapManager = mapManager;
    this.waypointManager = waypointManager;
    this.isInitialized = false;
    this.callback = null;
  }
  
  /**
   * Initialize with a callback function
   * @param {Function} callback - Function to call when a waypoint is added
   * @returns {boolean} - Success status
   */
  initialize(callback) {
    console.log('SimpleMapHandler: Initializing');
    
    this.callback = callback;
    
    // Make sure we have the required managers
    if (!this.mapManager || !this.waypointManager) {
      console.error('SimpleMapHandler: Missing required managers');
      return false;
    }
    
    // Get the map instance
    const map = this.mapManager.getMap();
    if (!map) {
      console.error('SimpleMapHandler: Map is not initialized');
      return false;
    }
    
    // Remove existing click handlers
    console.log('SimpleMapHandler: Removing existing click handlers');
    map.off('click');
    
    // Add our simple click handler
    console.log('SimpleMapHandler: Adding simple click handler');
    map.on('click', this.handleMapClick.bind(this));
    
    // Set up route dragging via the waypoint manager
    if (typeof this.waypointManager.setupRouteDragging === 'function') {
      console.log('SimpleMapHandler: Setting up route dragging');
      this.waypointManager.setupRouteDragging(this.handleRouteDrag.bind(this));
    }
    
    // Mark as initialized
    this.isInitialized = true;
    console.log('SimpleMapHandler: Initialized successfully');
    return true;
  }
  
  /**
   * Handle map click events
   * @param {Object} e - The click event
   */
  handleMapClick(e) {
    console.log('SimpleMapHandler: Map clicked at', e.lngLat);
    
    // Make sure waypointManager exists
    if (!this.waypointManager) {
      console.error('SimpleMapHandler: waypointManager not initialized');
      return;
    }
    
    // Determine if we're in waypoint mode using the global flag
    const isWaypointMode = window.isWaypointModeActive === true;
    console.log(`SimpleMapHandler: Current mode: ${isWaypointMode ? 'WAYPOINT' : 'NORMAL'}`);
    
    // Add the waypoint directly without checking for platforms
    this.waypointManager.addWaypoint(
      [e.lngLat.lng, e.lngLat.lat],
      isWaypointMode ? `Waypoint ${this.waypointManager.getWaypoints().length + 1}` : `Stop ${this.waypointManager.getWaypoints().length + 1}`,
      { isWaypoint: isWaypointMode, type: isWaypointMode ? 'WAYPOINT' : 'STOP' }
    );
    
    // Call the callback if it exists
    if (this.callback) {
      this.callback({
        coordinates: [e.lngLat.lng, e.lngLat.lat],
        isWaypoint: isWaypointMode
      });
    }
    
    // Open left panel by dispatching an event
    window.dispatchEvent(new Event('open-left-panel'));
    
    // Show a success message
    if (window.LoadingIndicator) {
      window.LoadingIndicator.updateStatusIndicator(
        `Added ${isWaypointMode ? 'waypoint' : 'stop'} at clicked location`,
        'success'
      );
    }
  }
  
  /**
   * Handle route drag events
   * @param {number} insertIndex - Index to insert the new waypoint
   * @param {Array} coords - [lng, lat] coordinates
   */
  handleRouteDrag(insertIndex, coords) {
    console.log('SimpleMapHandler: Route dragged at', coords);
    
    // Make sure waypointManager exists
    if (!this.waypointManager) {
      console.error('SimpleMapHandler: waypointManager not initialized');
      return;
    }
    
    // Determine if we're in waypoint mode using the global flag
    const isWaypointMode = window.isWaypointModeActive === true;
    
    // Add the waypoint directly
    this.waypointManager.addWaypointAtIndex(
      coords,
      isWaypointMode ? `Waypoint ${this.waypointManager.getWaypoints().length + 1}` : `Stop ${this.waypointManager.getWaypoints().length + 1}`,
      insertIndex,
      { isWaypoint: isWaypointMode, type: isWaypointMode ? 'WAYPOINT' : 'STOP' }
    );
    
    // Call the callback if it exists
    if (this.callback) {
      this.callback({
        coordinates: coords,
        isWaypoint: isWaypointMode,
        insertIndex: insertIndex
      });
    }
    
    // Show a success message
    if (window.LoadingIndicator) {
      window.LoadingIndicator.updateStatusIndicator(
        `Added ${isWaypointMode ? 'waypoint' : 'stop'} by dragging route`,
        'success'
      );
    }
  }
  
  /**
   * Toggle between normal and waypoint modes
   * @param {string} mode - 'normal' or 'waypoint'
   */
  toggleMode(mode) {
    console.log(`SimpleMapHandler: Toggling to ${mode} mode`);
    
    // Set the global flag
    window.isWaypointModeActive = (mode === 'waypoint');
    
    // Change the cursor based on mode
    const map = this.mapManager.getMap();
    if (map) {
      map.getCanvas().style.cursor = window.isWaypointModeActive ? 'crosshair' : '';
    }
    
    // Show a message
    if (window.LoadingIndicator) {
      window.LoadingIndicator.updateStatusIndicator(
        `${window.isWaypointModeActive ? 'Waypoint' : 'Normal'} mode activated`,
        'info'
      );
    }
    
    return true;
  }
}

export default SimpleMapHandler;