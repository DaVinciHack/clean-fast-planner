// src/components/fast-planner/hooks/useWaypoints.js

import { useState, useEffect, useCallback } from 'react';
import { interactionController } from '../cleanIntegration';
import { parseCoordinates, looksLikeCoordinates } from '../utils/coordinateParser';

/**
 * Custom hook for managing waypoints and route data
 */
const useWaypoints = ({
  waypointManagerRef,
  platformManagerRef,
  mapInteractionHandlerRef, // Added mapInteractionHandlerRef
  setWaypoints,
  client, 
  currentRegion, // This prop will now receive the active region from RegionContext via FastPlannerApp
  setRouteStats,
  setStopCards
}) => {
  // State for waypoint mode
  const [waypointModeActive, setWaypointModeActive] = useState(false);

  // Effect to update the state whenever the waypoint manager's waypoints change
  useEffect(() => {
    if (waypointManagerRef.current) {
      // Set up a callback to synchronize state when waypoints change
      waypointManagerRef.current.setCallback('onChange', (updatedWaypoints) => {
        console.log('WaypointManager onChange callback triggered with', updatedWaypoints.length, 'waypoints');
        
        // Update React state with a copy of the waypoints array to ensure proper re-rendering
        setWaypoints([...updatedWaypoints]);
      });
      
      return () => {
        // Clean up by clearing the callback when component unmounts
        if (waypointManagerRef.current) {
          waypointManagerRef.current.setCallback('onChange', null);
        }
      };
    }
  }, [waypointManagerRef, setWaypoints]);

  /**
   * Adds a waypoint to the route
   * Uses the clean implementation if available, falls back to original
   */
  const addWaypoint = useCallback(async (waypointData) => {
    console.log('=== 🌐 useWaypoints: addWaypoint called ===');
    console.log('🌐 Input data:', waypointData);
    console.log('🌐 Input type:', typeof waypointData);
    console.log('🌐 waypointManagerRef.current available:', !!waypointManagerRef.current);
    console.log('🌐 platformManagerRef.current available:', !!platformManagerRef.current);
    
    // Try to use the clean implementation first - TEMPORARILY DISABLED FOR COORDINATE TESTING
    if (false && window.addWaypointClean && typeof window.addWaypointClean === 'function') {
      console.log('🌐 Using clean implementation for addWaypoint');
      try {
        // Make sure to properly await the call since the implementation might be async
        const waypoint = await window.addWaypointClean(waypointData);
        
        // The clean implementation will handle state updates through the registered function
        return waypoint;
      } catch (error) {
        console.error('Error using clean implementation:', error);
        // Continue to fallback if the clean implementation fails
      }
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
        console.log('🌐 Processing string input:', waypointData);
        name = waypointData;
        
        // NEW: Check if the string looks like coordinates
        console.log('🌐 Checking if input looks like coordinates...');
        const looksLike = looksLikeCoordinates(waypointData);
        console.log('🌐 looksLikeCoordinates result:', looksLike);
        
        if (looksLike) {
          console.log('🌐 Input looks like coordinates, parsing:', waypointData);
          const parseResult = parseCoordinates(waypointData);
          
          if (parseResult.isValid) {
            coords = parseResult.coordinates;
            console.log(`🌐 Successfully parsed coordinates: ${parseResult.format} -> [${coords}]`);
            
            // Show feedback to user about successful parsing
            if (window.LoadingIndicator && window.LoadingIndicator.updateStatusIndicator) {
              window.LoadingIndicator.updateStatusIndicator(
                `Coordinates parsed: ${parseResult.format}`,
                'success',
                2000
              );
            }
            
            // Generate a name based on the coordinates
            name = `${coords[1].toFixed(6)}, ${coords[0].toFixed(6)}`;
          } else {
            console.log('🌐 Failed to parse coordinates:', parseResult.error);
            if (window.LoadingIndicator && window.LoadingIndicator.updateStatusIndicator) {
              window.LoadingIndicator.updateStatusIndicator(
                `Invalid coordinate format: ${parseResult.error}`,
                'error',
                3000
              );
            }
            return;
          }
        } else {
          // Original logic: try to find platform by name
          if (platformManagerRef.current) {
            const platform = platformManagerRef.current.findPlatformByName(waypointData);
            if (platform) {
              coords = platform.coordinates;
              name = platform.name;
              console.log(`🌐 Found platform by name: ${name} at [${coords}]`);
            } else {
              console.log(`🌐 Platform "${waypointData}" not found`);
              if (window.LoadingIndicator) {
                window.LoadingIndicator.updateStatusIndicator(`Platform "${waypointData}" not found.`, 'error');
              }
              return;
            }
          } else {
            console.log('🌐 PlatformManager not available');
            return;
          }
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

      // Use setTimeout to batch state updates and avoid synchronization issues
      await new Promise(resolve => {
        setTimeout(() => {
          // Get the updated waypoints
          const updatedWaypoints = waypointManagerRef.current.getWaypoints();
          
          // Update the state with the new waypoints
          setWaypoints([...updatedWaypoints]);
          
          console.log(`🌐 Updated waypoints array with ${updatedWaypoints.length} items`);
          resolve();
        }, 0);
      });
    }
  }, [waypointManagerRef, platformManagerRef, setWaypoints]);

  /**
   * Removes a waypoint from the route
   * Uses the clean implementation if available, falls back to original
   */
  const removeWaypoint = useCallback((waypointIdOrIndex) => {
    console.log('removeWaypoint called with:', waypointIdOrIndex);
    
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
        console.log(`Removing waypoint id=${id}, index=${index}`);
        
        // First get a copy of the current waypoints before removal
        const currentWaypoints = [...waypointManagerRef.current.getWaypoints()];
        
        // Remove from the map and internal state
        waypointManagerRef.current.removeWaypoint(id, index);
        
        // Get the updated waypoints immediately after removal
        const updatedWaypoints = waypointManagerRef.current.getWaypoints();
        
        // Force an immediate state update
        setWaypoints([...updatedWaypoints]);
        
        console.log(`Waypoint removed immediately, new count: ${updatedWaypoints.length}`);
        
        // Add a second update with a small delay to ensure UI is in sync
        setTimeout(() => {
          // Get the waypoints again to ensure we have the latest state
          const finalWaypoints = waypointManagerRef.current.getWaypoints();
          
          // Only update if there was a change to avoid unnecessary re-renders
          if (JSON.stringify(finalWaypoints) !== JSON.stringify(updatedWaypoints)) {
            setWaypoints([...finalWaypoints]);
            console.log(`Waypoint list updated again with delay, count: ${finalWaypoints.length}`);
          }
        }, 50);
      }
    }
  }, [waypointManagerRef, setWaypoints]);

  /**
   * Updates the name of a waypoint
   */
  const updateWaypointName = useCallback((index, name) => {
    console.log(`Updating waypoint name at index ${index} to: ${name}`);
    
    if (waypointManagerRef.current) {
      waypointManagerRef.current.updateWaypointName(index, name);
      
      // Use setTimeout to batch state updates and avoid synchronization issues
      setTimeout(() => {
        // Get the updated waypoints
        const updatedWaypoints = waypointManagerRef.current.getWaypoints();
        
        // Update the state with the new waypoints
        setWaypoints([...updatedWaypoints]);
        
        console.log(`Waypoint name updated, waypoints:`, updatedWaypoints.length);
      }, 0);
    }
  }, [waypointManagerRef, setWaypoints]);

  /**
   * Clears all waypoints from the route
   */
  const clearRoute = useCallback(() => {
    if (waypointManagerRef.current) {
      waypointManagerRef.current.clearRoute();
      
      // Use a single batched update to avoid re-render cascades
      // This prevents the infinite loop when called from effects
      setTimeout(() => {
        // Reset waypoints first
        setWaypoints([]);
        
        // Then reset other route-related state in FastPlannerApp
        if (typeof setRouteStats === 'function') {
          setRouteStats(null);
        }
        
        if (typeof setStopCards === 'function') {
          setStopCards([]);
        }
        
        // Reset global state
        window.currentRouteStats = null;
      }, 0);
    }
  }, [waypointManagerRef, setWaypoints, setRouteStats, setStopCards]);

  /**
   * Reorders waypoints via drag and drop
   */
  const reorderWaypoints = useCallback((draggedId, dropTargetId) => {
    console.log(`Reordering waypoints: draggedId=${draggedId}, dropTargetId=${dropTargetId}`);
    
    if (waypointManagerRef.current && draggedId && dropTargetId) {
      waypointManagerRef.current.reorderWaypoints(draggedId, dropTargetId);
      
      // Use setTimeout to batch state updates and avoid synchronization issues
      setTimeout(() => {
        // Get the updated waypoints
        const updatedWaypoints = waypointManagerRef.current.getWaypoints();
        
        // Update the state with the new waypoints
        setWaypoints([...updatedWaypoints]);
        
        console.log(`Waypoints reordered, count: ${updatedWaypoints.length}`);
      }, 0);
    }
  }, [waypointManagerRef, setWaypoints]);

  /**
   * Toggles waypoint insertion mode
   * Uses the clean implementation if available, falls back to original
   */
  const toggleWaypointMode = useCallback((active) => {
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
    
    // Manage interaction handlers
    if (window.waypointHandler && typeof window.waypointHandler.toggle === 'function') {
      window.waypointHandler.toggle(active); // Use toggle method
      
      if (!active) { // If deactivating waypoint mode
        // Re-initialize the main MapInteractionHandler to restore its listeners
        if (mapInteractionHandlerRef && mapInteractionHandlerRef.current && typeof mapInteractionHandlerRef.current.initialize === 'function') {
          console.log('useWaypoints: Waypoint mode deactivated. Re-initializing MapInteractionHandler.');
          mapInteractionHandlerRef.current.initialize();
        } else {
          console.warn('useWaypoints: mapInteractionHandlerRef not available to re-initialize after deactivating waypoint mode.');
        }
      }
    } else if (window.waypointHandler) {
      // Fallback for older setEnabled logic if toggle doesn't exist, though less ideal
      console.warn('useWaypoints: window.waypointHandler.toggle not found, attempting setEnabled.');
      if (typeof window.waypointHandler.setEnabled === 'function') {
        window.waypointHandler.setEnabled(active);
      }
       if (!active) { // If deactivating waypoint mode
        if (mapInteractionHandlerRef && mapInteractionHandlerRef.current && typeof mapInteractionHandlerRef.current.initialize === 'function') {
          console.log('useWaypoints: Waypoint mode deactivated (via setEnabled). Re-initializing MapInteractionHandler.');
          mapInteractionHandlerRef.current.initialize();
        }
      }
    } else {
      console.warn('useWaypoints: window.waypointHandler not found or does not have a toggle/setEnabled method.');
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
  }, [
    setWaypointModeActive,
    platformManagerRef,
    currentRegion,
    client,
    mapInteractionHandlerRef
  ]);

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
