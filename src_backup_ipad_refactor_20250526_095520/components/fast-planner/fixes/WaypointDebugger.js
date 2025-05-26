/**
 * WaypointDebugger.js
 * 
 * A utility module to help debug waypoint functionality in the Fast Planner.
 * Provides functions to verify and debug waypoint issues without any style changes.
 */

class WaypointDebugger {
  constructor() {
    console.log('WaypointDebugger: Initialized');
    this.setupGlobalHelpers();
  }

  /**
   * Make debugging functions available globally
   */
  setupGlobalHelpers() {
    // Make the debug methods available on the window
    window.waypointDebugger = this;

    // Add helper functions to the window object
    window.logWaypoints = () => this.logWaypoints();
    window.verifyWaypointMode = () => this.verifyWaypointMode();
    window.toggleWaypointMode = () => this.toggleWaypointMode();
    window.fixWaypointFlags = () => this.fixWaypointFlags();
  }

  /**
   * Log all waypoints to the console
   */
  logWaypoints() {
    if (!window.waypointManager) {
      console.error('waypointManager not found');
      return;
    }

    const waypoints = window.waypointManager.getWaypoints();
    
    console.log(`Current route has ${waypoints.length} points:`);
    console.table(waypoints.map((wp, idx) => ({
      index: idx,
      name: wp.name,
      isWaypoint: wp.isWaypoint === true ? 'YES' : 'NO',
      type: wp.type || 'UNKNOWN',
      coordinates: `[${wp.coords[0].toFixed(4)}, ${wp.coords[1].toFixed(4)}]`
    })));
    
    return waypoints;
  }

  /**
   * Verify the current waypoint mode state
   */
  verifyWaypointMode() {
    console.log('Waypoint mode active:', window.isWaypointModeActive === true ? 'YES' : 'NO');
    
    // Check if WaypointHandler exists and is properly enabled
    const waypointHandler = window.waypointHandler;
    if (waypointHandler) {
      console.log('WaypointHandler.isEnabled():', waypointHandler.isEnabled() ? 'YES' : 'NO');
      
      // Check if the states are consistent
      if (waypointHandler.isEnabled() !== (window.isWaypointModeActive === true)) {
        console.warn('WARNING: WaypointHandler state does not match global flag!');
        console.log('Would you like to fix this? Call window.fixWaypointFlags()');
      } else {
        console.log('✅ Waypoint mode flags are consistent');
      }
    } else {
      console.warn('WaypointHandler not found');
    }
    
    // Check if body has the waypoint-mode-active class
    const hasBodyClass = document.body.classList.contains('waypoint-mode-active');
    console.log('Body has waypoint-mode-active class:', hasBodyClass ? 'YES' : 'NO');
    
    // Check if map cursor style is set for waypoint mode
    const map = window.mapManager?.getMap();
    if (map) {
      const cursor = map.getCanvas().style.cursor;
      console.log('Map cursor style:', cursor || 'default');
    }
    
    return {
      globalFlag: window.isWaypointModeActive === true,
      handlerEnabled: waypointHandler ? waypointHandler.isEnabled() : null,
      bodyClass: hasBodyClass
    };
  }

  /**
   * Toggle waypoint mode programmatically
   */
  toggleWaypointMode() {
    const currentState = window.isWaypointModeActive === true;
    const newState = !currentState;
    
    console.log(`Toggling waypoint mode from ${currentState ? 'ON' : 'OFF'} to ${newState ? 'ON' : 'OFF'}`);
    
    // Set the global flag
    window.isWaypointModeActive = newState;
    
    // Update the WaypointHandler if available
    if (window.waypointHandler && typeof window.waypointHandler.setEnabled === 'function') {
      window.waypointHandler.setEnabled(newState);
    }
    
    // Update the body class
    if (newState) {
      document.body.classList.add('waypoint-mode-active');
    } else {
      document.body.classList.remove('waypoint-mode-active');
    }
    
    // Update map cursor if available
    const map = window.mapManager?.getMap();
    if (map) {
      map.getCanvas().style.cursor = newState ? 'crosshair' : '';
    }
    
    console.log(`Waypoint mode is now ${newState ? 'ON' : 'OFF'}`);
    
    return newState;
  }

  /**
   * Fix inconsistent waypoint flags
   */
  fixWaypointFlags() {
    const globalFlag = window.isWaypointModeActive === true;
    
    console.log(`Fixing waypoint flags, using global flag: ${globalFlag ? 'ON' : 'OFF'}`);
    
    // Update WaypointHandler
    if (window.waypointHandler && typeof window.waypointHandler.setEnabled === 'function') {
      window.waypointHandler.setEnabled(globalFlag);
    }
    
    // Update body class
    if (globalFlag) {
      document.body.classList.add('waypoint-mode-active');
    } else {
      document.body.classList.remove('waypoint-mode-active');
    }
    
    // Update map cursor
    const map = window.mapManager?.getMap();
    if (map) {
      map.getCanvas().style.cursor = globalFlag ? 'crosshair' : '';
    }
    
    console.log('Waypoint flags fixed');
    
    // Verify the fix
    return this.verifyWaypointMode();
  }
  
  /**
   * Test adding a waypoint programmatically
   */
  testAddWaypoint(coords) {
    if (!window.waypointManager) {
      console.error('waypointManager not found');
      return;
    }
    
    // Use coordinates from the center of the map if none provided
    if (!coords) {
      const map = window.mapManager?.getMap();
      if (map) {
        const center = map.getCenter();
        coords = [center.lng, center.lat];
      } else {
        console.error('No coordinates provided and map not available');
        return;
      }
    }
    
    // Get current waypoint mode
    const isWaypointMode = window.isWaypointModeActive === true;
    console.log(`Testing waypoint addition in ${isWaypointMode ? 'WAYPOINT' : 'NORMAL'} mode`);
    
    // Add the waypoint
    const waypoint = window.waypointManager.addWaypoint(
      coords, 
      isWaypointMode ? `Test Waypoint` : `Test Stop`,
      { isWaypoint: isWaypointMode, type: isWaypointMode ? 'WAYPOINT' : 'STOP' }
    );
    
    console.log('Added test point:', waypoint);
    
    // Log the current waypoints
    this.logWaypoints();
    
    return waypoint;
  }
}

// Initialize the debugger
const waypointDebugger = new WaypointDebugger();

// Instructions for use
console.log('WaypointDebugger initialized. Available commands:');
console.log('- window.logWaypoints() - List all waypoints');
console.log('- window.verifyWaypointMode() - Check waypoint mode state');
console.log('- window.toggleWaypointMode() - Toggle waypoint mode');
console.log('- window.fixWaypointFlags() - Fix inconsistent waypoint flags');
console.log('- window.waypointDebugger.testAddWaypoint() - Test adding a waypoint');

export default waypointDebugger;
