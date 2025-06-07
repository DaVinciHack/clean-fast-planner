/**
 * fix-event-handlers.js
 * 
 * This fix ensures that only one map click handler is active at a time by 
 * modifying the MapInteractionHandler to check for existing handlers.
 */

console.log('🔧 Fixing map event handlers to prevent duplicates...');

/**
 * Wait for map manager to be available before applying fixes
 */
function waitForMapManager() {
  if (!window.mapManager || !window.mapManager.getMap() || !window.mapInteractionHandler) {
    setTimeout(waitForMapManager, 500);
    return;
  }
  
  fixMapInteractionHandler();
}

/**
 * Fix the MapInteractionHandler to prevent duplicate event handlers
 */
function fixMapInteractionHandler() {
  // Get references to the necessary objects
  const mapManager = window.mapManager;
  const mapInteractionHandler = window.mapInteractionHandler;
  const map = mapManager.getMap();
  
  if (!map || !mapInteractionHandler) {
    console.error('🔧 Cannot fix MapInteractionHandler: Missing required objects');
    return;
  }
  
  // Store the original initialize method
  const originalInitialize = mapInteractionHandler.initialize;
  
  // Replace with a version that prevents duplicate handlers
  mapInteractionHandler.initialize = function() {
    console.log('🔧 Using enhanced MapInteractionHandler.initialize to prevent duplicate event handlers');
    
    // Check for basic requirements
    if (!this.mapManager || !this.waypointManager) {
      console.error('MapInteractionHandler: Missing required managers');
      this.triggerCallback('onError', 'Missing required managers');
      return false;
    }
    
    const map = this.mapManager.getMap();
    if (!map) {
      console.error('MapInteractionHandler: Map is not initialized');
      this.triggerCallback('onError', 'Map is not initialized');
      return false;
    }
    
    // Initialize the waypoint mode flag if needed
    if (window.isWaypointModeActive !== true) {
      window.isWaypointModeActive = false;
    }
    
    // Clean up existing handler first to prevent duplicates
    if (this._boundClickHandler) {
      console.log('🔧 Removing existing click handler before adding new one');
      map.off('click', this._boundClickHandler);
    }
    
    // Add our single click handler
    this._boundClickHandler = this.handleMapClick.bind(this);
    map.on('click', this._boundClickHandler);
    
    // Also set up route dragging if needed
    if (typeof this.waypointManager.setupRouteDragging === 'function') {
      this.waypointManager.setupRouteDragging(this.handleRouteDragComplete.bind(this));
    }
    
    this.isInitialized = true;
    console.log('🔧 MapInteractionHandler initialized with singleton event handler');
    return true;
  };
  
  // Apply our fix by reinitializing with our fixed version
  mapInteractionHandler.initialize();
  
  console.log('🔧 MapInteractionHandler fixed to prevent duplicate event handlers');
  
  // Set up a global method to force reset of map handlers
  window.resetMapHandlers = function() {
    console.log('🔧 Manually resetting map handlers via global resetMapHandlers function');
    return mapInteractionHandler.initialize();
  };
}

// Wait for the map manager to be available before applying fixes
waitForMapManager();

export default fixMapInteractionHandler;
