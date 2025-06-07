/**
 * test-mode-handler-fix.js
 * 
 * This script can be run from the browser console to test the mode handler fix
 */

// Import the fix
import { initializeHandlers, reinitializeHandlers, getHandlers } from './mode-handler-fix';

// Function to log the current state
function logState() {
  console.log('TEST: Current state:');
  console.log('- Map Manager:', !!window.mapManager);
  console.log('- Waypoint Manager:', !!window.waypointManager);
  console.log('- Platform Manager:', !!window.platformManager);
  console.log('- Mode Handlers:', !!getHandlers());
  console.log('- Toggle Function:', !!window.toggleMapMode);
}

// Function to test the fix
export function testModeHandlerFix() {
  console.log('TEST: Running mode handler fix test');
  
  // Log the initial state
  logState();
  
  // Check if managers are available
  if (!window.mapManager || !window.waypointManager || !window.platformManager) {
    console.error('TEST: Managers not available. Wait for app to initialize first!');
    return false;
  }
  
  // Initialize handlers
  console.log('TEST: Initializing handlers');
  const handlers = initializeHandlers();
  
  if (!handlers) {
    console.error('TEST: Failed to initialize handlers');
    return false;
  }
  
  // Test toggle function
  console.log('TEST: Testing toggle function');
  
  // Test waypoint mode
  console.log('TEST: Activating waypoint mode');
  window.toggleMapMode('waypoint');
  
  // Test normal mode
  console.log('TEST: Activating normal mode');
  window.toggleMapMode('normal');
  
  // Log final state
  console.log('TEST: Test completed');
  logState();
  
  return true;
}

// Make testing function available globally
window.testModeHandlerFix = testModeHandlerFix;

// Export the module
export default {
  testModeHandlerFix
};
