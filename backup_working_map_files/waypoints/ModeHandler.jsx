import React from 'react';

/**
 * SIMPLIFIED MODE HANDLER
 * 
 * This component is now a no-op since waypoint mode is handled directly 
 * by PlatformManager through useWaypoints hook - no competing systems needed.
 */
const ModeHandler = ({ 
  mapManagerRef, 
  waypointManagerRef, 
  platformManagerRef, 
  initialMode = 'normal'
}) => {
  // Return null since all waypoint mode functionality is now handled 
  // directly by useWaypoints → PlatformManager
  return null;
};

export default ModeHandler;