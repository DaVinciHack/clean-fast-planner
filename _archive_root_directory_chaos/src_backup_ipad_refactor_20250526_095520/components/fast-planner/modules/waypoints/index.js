/**
 * Waypoints Module Index
 * 
 * Exports all waypoint-related modules for easy importing
 */

import WaypointInsertionManager from './WaypointInsertionManager';
import WaypointModeHandler from './WaypointModeHandler';
import WaypointUtils from './WaypointUtils';
import integration from './integration';
import ModeHandler from './ModeHandler';
import { initializeHandlers, reinitializeHandlers, getHandlers } from './mode-handler-fix';

// Initialize handlers automatically when this module is imported
// This ensures the handlers are available as early as possible
setTimeout(() => {
  console.log('🚀 Waypoints module: Auto-initializing map handlers');
  
  if (window.mapManager && window.waypointManager && window.platformManager) {
    console.log('🚀 Waypoints module: Managers available, initializing handlers');
    initializeHandlers();
  } else {
    console.log('🚀 Waypoints module: Managers not available yet, will try again later');
    
    // Try again in 2 seconds
    setTimeout(() => {
      if (window.mapManager && window.waypointManager && window.platformManager) {
        console.log('🚀 Waypoints module: Managers now available, initializing handlers');
        initializeHandlers();
      }
    }, 2000);
  }
}, 1000);

// Create a global emergency reset function
window.resetMapHandlers = () => {
  console.log('🚨 EMERGENCY: Manual handler reset requested');
  const handlers = reinitializeHandlers();
  if (handlers) {
    console.log('🚨 EMERGENCY: Handlers reset successfully');
    window.LoadingIndicator?.updateStatusIndicator('Map handlers reset. Try clicking again.', 'success');
    return true;
  } else {
    console.error('🚨 EMERGENCY: Failed to reset handlers');
    window.LoadingIndicator?.updateStatusIndicator('Failed to reset map handlers', 'error');
    return false;
  }
};

export {
  WaypointInsertionManager,
  WaypointModeHandler,
  WaypointUtils,
  integration,
  ModeHandler,
  initializeHandlers,
  reinitializeHandlers,
  getHandlers
};

// Also export individual functions from WaypointUtils for convenience
export const {
  isNavigationalWaypoint,
  createWaypointMetadata,
  createWaypointMarker
} = WaypointUtils;

// Export integration functions
export const {
  createWaypointInsertionManager,
  setupWaypointCallbacks,
  patchWaypointManager,
  toggleWaypointMode,
  categorizeRouteItems
} = integration;

export default {
  WaypointInsertionManager,
  WaypointModeHandler,
  WaypointUtils,
  integration,
  ModeHandler,
  initializeHandlers,
  reinitializeHandlers,
  getHandlers,
  // Convenience exports
  isNavigationalWaypoint,
  createWaypointMetadata,
  createWaypointMarker,
  createWaypointInsertionManager,
  setupWaypointCallbacks,
  patchWaypointManager,
  toggleWaypointMode,
  categorizeRouteItems
};