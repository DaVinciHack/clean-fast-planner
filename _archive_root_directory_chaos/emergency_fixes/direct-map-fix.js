/**
 * DIRECT MAP FIX
 * Copy and paste this ENTIRE script into your browser console
 * and press Enter to apply the fix.
 */

// Define a simplified handler to replace the MapInteractionHandler
class SimpleMapHandler {
  constructor() {
    // Get global managers
    this.mapManager = window.mapManager;
    this.waypointManager = window.waypointManager;
    
    if (!this.mapManager || !this.waypointManager) {
      console.error('DIRECT FIX: Required global managers not available');
      return;
    }
    
    // Initialize immediately
    this.initialize();
  }
  
  /**
   * Initialize map click handlers
   */
  initialize() {
    console.log('DIRECT FIX: Initializing');
    
    // Get the map
    const map = this.mapManager.getMap();
    if (!map) {
      console.error('DIRECT FIX: Map not initialized');
      return false;
    }
    
    // Remove existing click handlers
    console.log('DIRECT FIX: Removing existing click handlers');
    map.off('click');
    
    // Add our simple click handler
    console.log('DIRECT FIX: Adding simple click handler');
    map.on('click', this.handleMapClick.bind(this));
    
    // Setup for route dragging
    if (typeof this.waypointManager.setupRouteDragging === 'function') {
      console.log('DIRECT FIX: Setting up route dragging');
      this.waypointManager.setupRouteDragging(this.handleRouteDrag.bind(this));
    }
    
    // Create toggle function
    window.simpleToggleMode = this.toggleMode.bind(this);
    
    // Show success message
    if (window.LoadingIndicator) {
      window.LoadingIndicator.updateStatusIndicator(
        'Direct map fix applied. Try clicking on the map now.',
        'success'
      );
    }
    
    console.log('DIRECT FIX: Initialized successfully. Use window.simpleToggleMode("waypoint") to switch modes.');
    return true;
  }
  
  /**
   * Handle map click events
   */
  handleMapClick(e) {
    console.log('DIRECT FIX: Map clicked at', e.lngLat);
    
    // Determine mode
    const isWaypointMode = window.isWaypointModeActive === true;
    
    // Add waypoint or stop based on mode
    this.waypointManager.addWaypoint(
      [e.lngLat.lng, e.lngLat.lat],
      isWaypointMode ? `Waypoint ${this.waypointManager.getWaypoints().length + 1}` : `Stop ${this.waypointManager.getWaypoints().length + 1}`,
      { isWaypoint: isWaypointMode, type: isWaypointMode ? 'WAYPOINT' : 'STOP' }
    );
    
    // Try to open left panel
    try {
      window.dispatchEvent(new Event('open-left-panel'));
      document.querySelector('.left-panel-toggle-button')?.click();
    } catch (error) {
      console.log('DIRECT FIX: Could not open left panel automatically');
    }
    
    // Show success message
    if (window.LoadingIndicator) {
      window.LoadingIndicator.updateStatusIndicator(
        `Added ${isWaypointMode ? 'waypoint' : 'stop'} at clicked location`,
        'success'
      );
    }
  }
  
  /**
   * Handle route drag events
   */
  handleRouteDrag(insertIndex, coords) {
    console.log('DIRECT FIX: Route dragged at', coords);
    
    // Determine mode
    const isWaypointMode = window.isWaypointModeActive === true;
    
    // Add waypoint or stop based on mode
    this.waypointManager.addWaypointAtIndex(
      coords,
      isWaypointMode ? `Waypoint ${this.waypointManager.getWaypoints().length + 1}` : `Stop ${this.waypointManager.getWaypoints().length + 1}`,
      insertIndex,
      { isWaypoint: isWaypointMode, type: isWaypointMode ? 'WAYPOINT' : 'STOP' }
    );
    
    // Show success message
    if (window.LoadingIndicator) {
      window.LoadingIndicator.updateStatusIndicator(
        `Added ${isWaypointMode ? 'waypoint' : 'stop'} by dragging route`,
        'success'
      );
    }
  }
  
  /**
   * Toggle between normal and waypoint modes
   */
  toggleMode(mode) {
    console.log(`DIRECT FIX: Toggling to ${mode} mode`);
    
    // Set the global flag
    window.isWaypointModeActive = (mode === 'waypoint');
    
    // Change the cursor
    const map = this.mapManager.getMap();
    if (map) {
      map.getCanvas().style.cursor = window.isWaypointModeActive ? 'crosshair' : '';
    }
    
    // Show message
    if (window.LoadingIndicator) {
      window.LoadingIndicator.updateStatusIndicator(
        `${window.isWaypointModeActive ? 'Waypoint' : 'Normal'} mode activated`,
        'info'
      );
    }
    
    return true;
  }
}

// Create and add a reset button
function addResetButton() {
  // Create button
  const button = document.createElement('button');
  button.innerText = 'Reset Map Click';
  button.style.position = 'fixed';
  button.style.bottom = '10px';
  button.style.left = '10px';
  button.style.zIndex = '9999';
  button.style.background = '#ff4136';
  button.style.color = 'white';
  button.style.padding = '5px 10px';
  button.style.border = 'none';
  button.style.borderRadius = '4px';
  button.style.cursor = 'pointer';
  
  // Add click handler
  button.onclick = () => {
    console.log('DIRECT FIX: Resetting map click handlers');
    new SimpleMapHandler();
  };
  
  // Add to document
  document.body.appendChild(button);
}

// Apply the fix immediately
(function() {
  console.log('DIRECT FIX: Applying direct map click fix');
  
  // Create the handler
  const handler = new SimpleMapHandler();
  
  // Add reset button
  addResetButton();
  
  // Return success message
  return 'DIRECT FIX: Map click fix applied. Use window.simpleToggleMode("waypoint") to switch to waypoint mode.';
})();
