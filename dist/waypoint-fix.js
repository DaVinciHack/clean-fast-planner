/**
 * Waypoint fix script - loaded directly in HTML
 * This script provides emergency fixes for waypoint functionality
 */

console.log('Waypoint fix script loaded');

// Create global functions for waypoint management
window.waypointFix = {
  // Initialize waypoint functionality
  initialize: function() {
    console.log('Initializing waypoint fix');
    
    // Add global flag for waypoint mode if not exists
    if (typeof window.isWaypointModeActive === 'undefined') {
      window.isWaypointModeActive = false;
    }
    
    // Check for map manager
    if (window.mapManager && window.mapManager.getMap()) {
      console.log('Map is ready, setting up click handler');
      this.setupClickHandler();
    } else {
      console.log('Map not ready, setting up listener');
      // Wait for map to be ready
      if (window.addEventListener) {
        window.addEventListener('map-ready', this.setupClickHandler.bind(this));
      }
    }
    
    // Make toggle function available globally
    window.toggleWaypointMode = function(active) {
      console.log('Toggling waypoint mode:', active);
      window.isWaypointModeActive = active;
      
      // Update UI
      if (window.LoadingIndicator && window.LoadingIndicator.updateStatusIndicator) {
        window.LoadingIndicator.updateStatusIndicator(
          `${active ? 'Waypoint' : 'Normal'} mode active`,
          'info'
        );
      }
      
      // Update map cursor
      if (window.mapManager && window.mapManager.getMap()) {
        const map = window.mapManager.getMap();
        map.getCanvas().style.cursor = active ? 'crosshair' : '';
      }
      
      return active;
    };
  },
  
  // Set up click handler for map
  setupClickHandler: function() {
    console.log('Setting up waypoint click handler');
    
    if (!window.mapManager || !window.mapManager.getMap()) {
      console.error('Map not available for click handler');
      return;
    }
    
    const map = window.mapManager.getMap();
    
    // Add click handler
    map.on('click', function(e) {
      // Check if in waypoint mode
      if (window.isWaypointModeActive) {
        console.log('Waypoint mode click:', e.lngLat);
        
        // Check if waypoint manager is available
        if (window.waypointManager) {
          // Add waypoint
          window.waypointManager.addWaypoint(
            [e.lngLat.lng, e.lngLat.lat],
            null,
            { isWaypoint: true, type: 'WAYPOINT' }
          );
        }
      }
    });
    
    console.log('Waypoint click handler set up');
  },
  
  // Force reinitialize waypoint handlers
  reinitialize: function() {
    console.log('Forcing reinitialization of waypoint functionality');
    
    // Clean up existing handlers
    if (window.mapManager && window.mapManager.getMap()) {
      const map = window.mapManager.getMap();
      map.off('click');
    }
    
    // Reinitialize
    this.initialize();
    
    // Update UI
    if (window.LoadingIndicator && window.LoadingIndicator.updateStatusIndicator) {
      window.LoadingIndicator.updateStatusIndicator(
        'Waypoint functionality reinitialized',
        'success'
      );
    }
  }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, initializing waypoint fix');
  window.waypointFix.initialize();
});

// Also try to initialize immediately in case DOM is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  console.log('Document already loaded, initializing waypoint fix immediately');
  window.waypointFix.initialize();
}
