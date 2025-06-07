/**
 * CleanMapIntegration.js
 * 
 * This module replaces all the fixes with a clean implementation.
 * It loads the MapLayerManager utility and the clean versions of
 * core managers to prevent layer conflicts.
 */

import './CleanMapManager.js';
import './CleanPlatformManager.js';

/**
 * Remove all debug UI elements and emergency buttons
 */
function removeDebugUI() {
  // Elements to remove
  const selectors = [
    // Debug UI elements
    '.waypoint-stop-debug',
    '.waypoint-debug', 
    '.waypoint-stop-debug-monitor',
    '#waypoint-stop-debug-button',
    '.debug-popup', 
    '.fix-applied-popup',
    '#status-indicator-container',
    
    // Emergency buttons
    '#emergency-waypoint-btn',
    '.emergency-reset-button',
    '.emergency-fix-button'
  ];
  
  // Combined selector for efficiency
  const allElements = document.querySelectorAll(selectors.join(', '));
  
  // Remove all matches
  if (allElements.length > 0) {
    console.log(`🧹 Removing ${allElements.length} debug UI elements`);
    allElements.forEach(element => element.remove());
  }
}

/**
 * Disable emergency functions
 */
function disableEmergencyFixes() {
  const emergencyFunctions = [
    'emergencyShowWaypoints',
    'emergencyResetMapLayers',
    'emergencyFixWaypoints',
    'emergencyViewState'
  ];
  
  emergencyFunctions.forEach(funcName => {
    if (typeof window[funcName] === 'function') {
      console.log(`🧹 Disabling emergency function: ${funcName}`);
      window[funcName] = function() {
        console.log(`🧹 Emergency function ${funcName} has been disabled`);
        return Promise.resolve(false);
      };
    }
  });
}

/**
 * Initialize clean implementations
 */
function initializeCleanImplementation() {
  console.log('🧹 Initializing clean implementation...');
  
  // Remove debug UI
  removeDebugUI();
  
  // Set up scheduled cleanup for debug UI that might be added later
  const fastCleanupInterval = setInterval(removeDebugUI, 300);
  
  // After 3 seconds, switch to slower cleanup
  setTimeout(() => {
    clearInterval(fastCleanupInterval);
    setInterval(removeDebugUI, 3000);
    
    // Disable emergency fixes once the app has initialized
    disableEmergencyFixes();
  }, 3000);
  
  // Log success
  console.log('🧹 Clean implementation initialized successfully');
}

// Start initialization
initializeCleanImplementation();

// Export nothing - this module is self-contained
export default {};
