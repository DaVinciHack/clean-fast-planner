// src/components/fast-planner/hooks/useWaypoints.js

import { useState, useEffect } from 'react';
import { interactionController } from '../cleanIntegration';

/**
 * Custom hook for managing waypoints and route data
 */
const useWaypoints = ({
  waypointManagerRef,
  platformManagerRef,
  setWaypoints,
  // Add client and currentRegion from FastPlannerApp
  client, 
  currentRegion 
}) => {
  // State for waypoint mode
  const [waypointModeActive, setWaypointModeActive] = useState(false);

  // Register the setWaypoints function with the clean implementation
  useEffect(() => {
    if (typeof window.registerWaypointsStateSetter === 'function') {
      window.registerWaypointsStateSetter(setWaypoints);
      console.log('Registered waypoints state setter with clean implementation');
    }
  }, [setWaypoints]);

  /**
   * Adds a waypoint to the route
   * Uses the clean implementation if available, falls back to original
   */
  const addWaypoint = async (waypointData) => {
    console.log('🌐 Adding waypoint with data:', waypointData);
    
    // Try to use the clean implementation first
    if (window.addWaypointClean && typeof window.addWaypointClean === 'function') {
      console.log('🌐 Using clean implementation for addWaypoint');
      const waypoint = window.addWaypointClean(waypointData);
      
      // The clean implementation will handle state updates through the registered function
      return waypoint;
    }
    
    // Fall back to the original implementation if clean one isn't available
    if (waypointManagerRef.current) {
      // Original implementation
      let coords, name, isWaypoint = false;

      if (Array.isArray(waypointData)) {
        coords = waypointData;
        name = null;
        
        // CRITICAL FIX: For direct coordinate arrays, try to find the nearest platform or waypoint
        if (platformManagerRef.current) {
          const isInWaypointMode = window.isWaypointModeActive === true;
          
          // In waypoint mode, first try to find nearest waypoint
          if (isInWaypointMode && typeof platformManagerRef.current.findNearestOsdkWaypoint === 'function') {
            const nearestWaypoint = platformManagerRef.current.findNearestOsdkWaypoint(coords[1], coords[0], 5);
            
            if (nearestWaypoint && nearestWaypoint.distance <= 5) {
              console.log(`🌐 Found nearby waypoint ${nearestWaypoint.name} (${nearestWaypoint.distance.toFixed(2)}nm away)`);
              coords = nearestWaypoint.coordinates;
              name = nearestWaypoint.name;
              isWaypoint = true;
              
              // Show feedback to user about snapping
              if (window.LoadingIndicator && window.LoadingIndicator.updateStatusIndicator) {
                window.LoadingIndicator.updateStatusIndicator(
                  `Snapped to waypoint: ${name} (${nearestWaypoint.distance.toFixed(1)} nm away)`,
                  'success',
                  2000
                );
              }
            }
          }
          
          // If not in waypoint mode or no waypoint found, try to find nearest platform
          if (!name && typeof platformManagerRef.current.findNearestPlatform === 'function') {
            const nearestPlatform = platformManagerRef.current.findNearestPlatform(coords[1], coords[0], 5);
            
            if (nearestPlatform && nearestPlatform.distance <= 5) {
              console.log(`🌐 Found nearby platform ${nearestPlatform.name} (${nearestPlatform.distance.toFixed(2)}nm away)`);
              coords = nearestPlatform.coordinates;
              name = nearestPlatform.name;
              
              // Show feedback to user about snapping
              if (window.LoadingIndicator && window.LoadingIndicator.updateStatusIndicator) {
                window.LoadingIndicator.updateStatusIndicator(
                  `Snapped to ${name} (${nearestPlatform.distance.toFixed(1)} nm away)`,
                  'success',
                  2000
                );
              }
            }
          }
        }
      } else if (typeof waypointData === 'string') {
        name = waypointData;
        
        if (platformManagerRef.current) {
          const platform = platformManagerRef.current.findPlatformByName(waypointData);
          if (platform) {
            coords = platform.coordinates;
            name = platform.name;
          } else {
            if (window.LoadingIndicator) {
              window.LoadingIndicator.updateStatusIndicator(`Platform "${waypointData}" not found.`, 'error');
            }
            return;
          }
        } else {
          return;
        }
      } else if (waypointData && typeof waypointData === 'object') {
        if (waypointData.isWaypoint === true) {
          isWaypoint = true;
        }
        
        if (waypointData.coordinates) {
          coords = waypointData.coordinates;
        } else if (waypointData.coords) {
          coords = waypointData.coords;
        } else if (waypointData.lngLat) {
          coords = [waypointData.lngLat.lng, waypointData.lngLat.lat];
        } else if (waypointData.nearestRig && waypointData.nearestRig.distance <= 5) {
          if (waypointData.nearestRig.coordinates) {
            coords = waypointData.nearestRig.coordinates;
          } else if (waypointData.nearestRig.coords) {
            coords = waypointData.nearestRig.coords;
          } else {
            return;
          }
          name = waypointData.nearestRig.name;
        } else if (waypointData.nearestWaypoint && waypointData.nearestWaypoint.distance <= 5) {
          // IMPROVED: Handle nearest waypoint data if provided
          if (waypointData.nearestWaypoint.coordinates) {
            coords = waypointData.nearestWaypoint.coordinates;
          } else if (waypointData.nearestWaypoint.coords) {
            coords = waypointData.nearestWaypoint.coords;
          } else {
            return;
          }
          name = waypointData.nearestWaypoint.name;
          isWaypoint = true;
        } else {
          return;
        }
        
        if (!name && waypointData.name) {
          name = waypointData.name;
        }
      } else {
        return;
      }

      if (!coords || !Array.isArray(coords) || coords.length !== 2) {
        if (window.LoadingIndicator) {
          window.LoadingIndicator.updateStatusIndicator(`Invalid coordinates.`, 'error');
        }
        return;
      }

      if (window.isWaypointModeActive === true) {
        isWaypoint = true;
      }
      
      console.log(`🌐 Adding ${isWaypoint ? 'waypoint' : 'stop'} at [${coords}] with name: "${name || 'Unnamed'}"`);
      
      waypointManagerRef.current.addWaypoint(coords, name, { 
        isWaypoint: isWaypoint,
        type: isWaypoint ? 'WAYPOINT' : 'STOP',
        pointType: isWaypoint ? 'NAVIGATION_WAYPOINT' : 'LANDING_STOP'
      });

      const updatedWaypoints = waypointManagerRef.current.getWaypoints();
      
      await new Promise(resolve => {
        setWaypoints([...updatedWaypoints]);
        setTimeout(resolve, 0);
      });
      
      console.log(`🌐 Updated waypoints array with ${updatedWaypoints.length} items`);
    }
  };

  /**
   * Removes a waypoint from the route
   * Uses the clean implementation if available, falls back to original
   */
  const removeWaypoint = (waypointIdOrIndex) => {
    // Try to use the clean implementation first, but only if it's properly initialized
    if (window.removeWaypointClean && typeof window.removeWaypointClean === 'function') {
      console.log('Using clean implementation for removeWaypoint');
      // Call the clean implementation and check if it handled the request
      const result = window.removeWaypointClean(waypointIdOrIndex);
      // If the clean implementation returned something other than undefined, it handled the request
      if (result !== undefined) {
        return result;
      }
      console.log('Clean implementation did not handle the request, falling back to original implementation');
    }
    
    // Fall back to the original implementation
    if (waypointManagerRef.current) {
      const waypoints = waypointManagerRef.current.getWaypoints();
      let id, index;

      if (typeof waypointIdOrIndex === 'string') {
        id = waypointIdOrIndex;
        index = waypoints.findIndex(wp => wp.id === id);
      } else if (typeof waypointIdOrIndex === 'number') {
        index = waypointIdOrIndex;
        id = waypoints[index]?.id;
      } else {
        console.error('Invalid waypoint identifier:', waypointIdOrIndex);
        return;
      }

      if (id && index !== -1) {
        waypointManagerRef.current.removeWaypoint(id, index);
        setWaypoints([...waypointManagerRef.current.getWaypoints()]);
      }
    }
  };

  /**
   * Updates the name of a waypoint
   */
  const updateWaypointName = (index, name) => {
    if (waypointManagerRef.current) {
      waypointManagerRef.current.updateWaypointName(index, name);
      setWaypoints([...waypointManagerRef.current.getWaypoints()]);
    }
  };

  /**
   * Clears all waypoints from the route
   */
  const clearRoute = () => {
    if (waypointManagerRef.current) {
      waypointManagerRef.current.clearRoute();
      setWaypoints([]);
    }
  };

  /**
   * Reorders waypoints via drag and drop
   */
  const reorderWaypoints = (draggedId, dropTargetId) => {
    if (waypointManagerRef.current && draggedId && dropTargetId) {
      waypointManagerRef.current.reorderWaypoints(draggedId, dropTargetId);
      setWaypoints([...waypointManagerRef.current.getWaypoints()]);
    }
  };

  /**
   * Toggles waypoint insertion mode
   * Uses the clean implementation if available, falls back to original
   */
  const toggleWaypointMode = (active) => {
    // Try to use the clean implementation first
    if (window.setWaypointModeClean && typeof window.setWaypointModeClean === 'function') {
      console.log('Using clean implementation for toggleWaypointMode');
      window.setWaypointModeClean(active);
      
      // Update our local state to stay in sync
      setWaypointModeActive(active);
      // REMOVED 'return;' TO ALLOW ORIGINAL LOGIC TO RUN AS WELL
    }
    
    // Original implementation (or the part that handles PlatformManager)
    // This will now run even if the clean implementation was called.
    console.log(`Toggling waypoint insertion mode (useWaypoints): ${active ? 'ON' : 'OFF'}`);
    
    setWaypointModeActive(active);
    window.isWaypointModeActive = active;
    
    if (platformManagerRef.current) {
      // Use client and currentRegion passed as props
      const regionIdentifier = currentRegion ? currentRegion.osdkRegion || currentRegion.name : null;
      
      if (platformManagerRef.current.toggleWaypointMode) {
        // Pass the client and regionIdentifier from props
        platformManagerRef.current.toggleWaypointMode(active, client, regionIdentifier);
      } else {
        if (platformManagerRef.current) {
          platformManagerRef.current.waypointModeActive = active;
        }
      }
    }
    
    if (window.waypointHandler) {
      window.waypointHandler.setEnabled(active);
    }
    
    if (typeof window.toggleMapMode === 'function') {
      window.toggleMapMode(active ? 'waypoint' : 'normal');
    }
    
    if (window.LoadingIndicator) {
      window.LoadingIndicator.updateStatusIndicator(
        `${active ? 'Waypoint' : 'Normal'} mode activated.`,
        active ? 'success' : 'info',
        3000
      );
    }
  };

  return {
    waypointModeActive,
    setWaypointModeActive,
    addWaypoint,
    removeWaypoint,
    updateWaypointName,
    clearRoute,
    reorderWaypoints,
    toggleWaypointMode
  };
};

export default useWaypoints;
