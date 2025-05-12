/**
 * Waypoints Module Index
 * 
 * Exports all waypoint-related modules for easy importing
 */

import WaypointInsertionManager from './WaypointInsertionManager';
import WaypointUtils from './WaypointUtils';
import integration from './integration';

export {
  WaypointInsertionManager,
  WaypointUtils,
  integration
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
  WaypointUtils,
  integration,
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