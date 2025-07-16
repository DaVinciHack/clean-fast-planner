/**
 * cleanIntegration.js
 * 
 * This module integrates the clean interaction controllers with 
 * the existing FastPlanner application without using patches or fixes.
 */

import InteractionController from './InteractionController';
import { showSuccess, showError } from './notifications';

// Create a singleton instance
const interactionController = new InteractionController();

// Make it available globally for consistency
window.interactionController = interactionController;

// Function to integrate the clean modules with the application
function integrateCleanModules() {
  console.log('Integrating clean interaction modules...');
  
  // Waiting for the required managers to be available in the window
  const checkForManagers = () => {
    if (!window.mapManager || !window.waypointManager) {
      console.log('Waiting for managers to be available...');
      setTimeout(checkForManagers, 1000);
      return;
    }
    
    // Initialize the controller with the managers
    interactionController.initialize(
      window.mapManager,
      window.waypointManager,
      window.platformManager
    );
    
    // Set up the callback to update the waypoints state in React
    interactionController.setCallback('onWaypointsChanged', waypoints => {
      if (window._setWaypointsState && typeof window._setWaypointsState === 'function') {
        window._setWaypointsState(waypoints);
      }
    });
    
    // Set up error handling
    interactionController.setCallback('onError', error => {
      console.error('Interaction error:', error);
      
      // Show error in UI if LoadingIndicator is available
      if (window.LoadingIndicator && window.LoadingIndicator.updateStatusIndicator) {
        window.LoadingIndicator.updateStatusIndicator(
          `Error: ${error.message}`,
          'error',
          5000
        );
      }
    });
    
    // Replace problematic methods with our clean implementations
    patchGlobalHandlers();
    
    console.log('Clean interaction modules integrated successfully');
    
    // Show success message
    if (window.LoadingIndicator && window.LoadingIndicator.updateStatusIndicator) {
      window.LoadingIndicator.updateStatusIndicator(
        'Clean interaction modules loaded',
        'success',
        3000
      );
    }
    
    // Custom notification removed - no longer showing debug messages
  };
  
  // Start checking for managers
  checkForManagers();
}

// Function to patch global handlers without breaking existing functionality
function patchGlobalHandlers() {
  // Make our functions available globally
  window.addWaypointClean = (waypointData) => {
    return interactionController.addWaypoint(waypointData);
  };
  
  // Fix the removeWaypointClean function to fall back to original implementation
  // if interactionController is not properly initialized
  window.removeWaypointClean = (waypointIdOrIndex) => {
    // Check if interactionController is properly initialized with required managers
    if (!interactionController || !interactionController.waypointManager) {
      console.log('Clean implementation not properly initialized, falling back to original implementation');
      // Return undefined to let the calling code fall back to original implementation
      return undefined;
    }
    return interactionController.removeWaypoint(waypointIdOrIndex);
  };
  
  window.setWaypointModeClean = (waypointMode) => {
    return interactionController.setWaypointMode(waypointMode);
  };
  
  // Store original toggleWaypointMode function
  if (window.toggleWaypointMode && typeof window.toggleWaypointMode === 'function') {
    window._originalToggleWaypointMode = window.toggleWaypointMode;
    
    // Replace with enhanced version
    window.toggleWaypointMode = function(active) {
      // Call our clean implementation
      interactionController.setWaypointMode(active);
      
      // Also call original for backward compatibility
      if (window._originalToggleWaypointMode) {
        return window._originalToggleWaypointMode(active);
      }
      
      return active;
    };
  }
  
  // Register React state setter when it becomes available
  window.registerWaypointsStateSetter = (setWaypointsFunction) => {
    window._setWaypointsState = setWaypointsFunction;
    console.log('Registered waypoints state setter function');
  };
}

// Register our clean modules to be used with the useEffect hook in FastPlannerApp
export function useCleanInteractions() {
  return {
    controller: interactionController,
    addWaypoint: interactionController.addWaypoint,
    removeWaypoint: interactionController.removeWaypoint,
    setWaypointMode: interactionController.setWaypointMode,
  };
}

// Export the controller for direct use
export { interactionController };

// Start the integration process automatically
// integrateCleanModules(); // DISABLED - Let MapInteractionHandler handle everything

// Export default function for explicit import and initialization
export default integrateCleanModules;