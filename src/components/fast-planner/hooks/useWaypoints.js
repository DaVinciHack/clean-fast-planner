// src/components/fast-planner/hooks/useWaypoints.js

import { useState, useEffect, useCallback } from 'react';
import { interactionController } from '../modules/cleanIntegration';
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
    
    // CRITICAL: Handle multiple waypoints separated by spaces (e.g., "ENFL ENOW ENOR ENPL")
    if (typeof waypointData === 'string' && waypointData.includes(' ')) {
      const waypointNames = waypointData.trim().split(/\s+/).filter(name => name.length > 0);
      console.log(`🌐 Split into ${waypointNames.length} individual waypoints:`, waypointNames);
      
      // Process each waypoint individually
      for (let i = 0; i < waypointNames.length; i++) {
        const waypointName = waypointNames[i];
        
        try {
          // Recursively call addWaypoint for each individual waypoint
          await addWaypoint(waypointName);
          console.log(`🌐 Successfully added waypoint: ${waypointName}`);
        } catch (error) {
          console.error(`🌐 Error adding waypoint ${waypointName}:`, error);
          // Continue with other waypoints even if one fails
        }
        
        // Small delay between waypoints to avoid overwhelming the system
        if (i < waypointNames.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      console.log('🌐 MULTIPLE WAYPOINTS PROCESSING COMPLETE');
      return; // Exit early after processing all waypoints
    }
    
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
        
        // NEW: Check if the string looks like coordinates
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
            } else {
              console.log(`🌐 Platform "${waypointData}" not found in database`);
              
              // Instead of returning early, create a placeholder waypoint
              // This allows the flight loading to continue even if some waypoints aren't in the database
              console.log(`🌐 Creating placeholder waypoint for: ${waypointData}`);
              name = waypointData; // Use the provided name
              coords = null; // Will be handled later - maybe set a default or skip coordinates
              
              if (window.LoadingIndicator) {
                window.LoadingIndicator.updateStatusIndicator(
                  `Waypoint "${waypointData}" not found in database - added as placeholder`, 
                  'warning',
                  3000
                );
              }
            }
          } else {
            console.log('🌐 PlatformManager not available');
            // Create placeholder waypoint even without platform manager
            console.log(`🌐 Creating placeholder waypoint (no platform manager): ${waypointData}`);
            name = waypointData;
            coords = null;
            
            if (window.LoadingIndicator) {
              window.LoadingIndicator.updateStatusIndicator(
                `Platform manager not available - added "${waypointData}" as placeholder`, 
                'warning',
                3000
              );
            }
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

      // Handle the case where coordinates might be null (placeholder waypoints)
      if (!coords || !Array.isArray(coords) || coords.length !== 2) {
        if (coords === null && name) {
          // This is a placeholder waypoint - create it with default coordinates
          console.log(`🌐 Creating placeholder waypoint "${name}" with default coordinates`);
          coords = [0, 0]; // Default coordinates - will be updated if the waypoint is found later
          
          if (window.LoadingIndicator) {
            window.LoadingIndicator.updateStatusIndicator(
              `Created placeholder for "${name}" - coordinates need to be set manually`, 
              'warning',
              3000
            );
          }
        } else {
          // Invalid coordinates and not a placeholder
          console.log('🌐 Invalid coordinates provided:', coords);
          if (window.LoadingIndicator) {
            window.LoadingIndicator.updateStatusIndicator(`Invalid coordinates.`, 'error');
          }
          return;
        }
      }

      if (window.isWaypointModeActive === true) {
        isWaypoint = true;
      }
      
      
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
    console.log('🧹 Clearing route and alternate route data');
    if (waypointManagerRef.current) {
      // Clear the main route
      waypointManagerRef.current.clearRoute();
      
      // CRITICAL: Also clear alternate route data
      waypointManagerRef.current.clearAlternateRouteData();
      
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
        
        // 🚨 REMOVED: No cache manipulation - React state only
        
        console.log('✅ Route and alternate route cleared successfully');
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
    console.log(`🎯 WAYPOINT MODE: ${active ? 'ENTERING' : 'EXITING'} waypoint mode`);
    
    setWaypointModeActive(active);
    window.isWaypointModeActive = active;
    
    // CLEAN SOLUTION: Direct call to PlatformManager only
    console.log('🎯 WAYPOINT MODE: Clean direct call to PlatformManager');
    
    // Call PlatformManager directly for visibility toggle
    if (platformManagerRef.current && typeof platformManagerRef.current.toggleWaypointMode === 'function') {
      const client = window.client || window.osdkClient;
      const region = currentRegion?.name || window.currentRegion?.name || 'GULF OF MEXICO';
      platformManagerRef.current.toggleWaypointMode(active, client, region);
    } else {
      console.warn('🎯 WAYPOINT MODE: PlatformManager or toggleWaypointMode not available');
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
    mapInteractionHandlerRef,
    currentRegion,
    client
    // Note: currentRegion and client are back in dependencies to prevent stale closures
    // Double execution is now prevented by the execution guard in PlatformManager
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
