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

// REMOVED: mode-handler-fix import - replaced with clean PlatformManager direct calls
// No more auto-initialization needed since we have clean single-path waypoint mode

export {
  WaypointInsertionManager,
  WaypointModeHandler,
  WaypointUtils,
  integration,
  ModeHandler
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