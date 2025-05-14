/**
 * waypoint-mode-debug.js
 * 
 * A tiny utility to help debug waypoint mode flag state.
 * Import this file to activate a global watcher for the waypoint mode flag.
 */

// Set up a watcher for the waypoint mode flag to detect any inconsistencies
export const setupWaypointModeWatcher = () => {
  console.log("CRITICAL FIX: Setting up waypoint mode watcher");
  
  // Store current flag state
  let lastKnownState = window.isWaypointModeActive || false;
  console.log(`CRITICAL FIX: Initial waypoint mode state: ${lastKnownState}`);
  
  // Set up an interval to check for changes
  const intervalId = setInterval(() => {
    const currentState = window.isWaypointModeActive || false;
    
    // If state changed, log it
    if (currentState !== lastKnownState) {
      console.log(`CRITICAL FIX: Waypoint mode flag changed: ${lastKnownState} -> ${currentState}`);
      
      // Log the stack trace to see what caused the change
      console.log("CRITICAL FIX: Waypoint mode flag change stack trace:");
      const error = new Error();
      console.log(error.stack);
      
      // Update last known state
      lastKnownState = currentState;
    }
  }, 1000);
  
  // Return the interval ID for cleanup
  return intervalId;
};

// Automatically set up the watcher if this file is imported
const watcherId = setupWaypointModeWatcher();

// Provide a function to clean up the watcher if needed
export const cleanupWaypointModeWatcher = () => {
  if (watcherId) {
    clearInterval(watcherId);
    console.log("CRITICAL FIX: Waypoint mode watcher cleared");
  }
};

// Export a function to manually check and repair the waypoint mode flag
export const checkAndRepairWaypointFlag = (uiState) => {
  const globalFlag = window.isWaypointModeActive || false;
  
  if (globalFlag !== uiState) {
    console.log(`CRITICAL FIX: Repairing waypoint mode flag discrepancy: UI=${uiState}, Global=${globalFlag}`);
    window.isWaypointModeActive = uiState;
    return true; // Flag was repaired
  }
  
  return false; // No repair needed
};

export default {
  setupWaypointModeWatcher,
  cleanupWaypointModeWatcher,
  checkAndRepairWaypointFlag
};
