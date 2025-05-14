/**
 * WaypointInteractions.js
 * 
 * A clean, modular implementation for handling waypoints
 * with clear distinction between waypoints and stops.
 */

class WaypointInteractions {
  constructor(options = {}) {
    this.waypointManager = null;
    this.mapManager = null;
    this.platformManager = null;
    
    this.config = {
      waypointMode: false, // Default to normal mode (stops, not waypoints)
      debounceTime: 500,
      ...options
    };
    
    // Tracking state
    this.lastAddTime = 0;
    this.lastRemoveTime = 0;
    this.lastDragTime = 0;
    
    // Bound methods to maintain context
    this.addWaypoint = this.addWaypoint.bind(this);
    this.addWaypointAtIndex = this.addWaypointAtIndex.bind(this);
    this.removeWaypoint = this.removeWaypoint.bind(this);
    this.moveWaypoint = this.moveWaypoint.bind(this);
    this.setWaypointMode = this.setWaypointMode.bind(this);
    
    // Callbacks
    this.callbacks = {
      onWaypointAdded: null,
      onWaypointRemoved: null,
      onWaypointMoved: null,
      onWaypointError: null
    };
  }
  
  /**
   * Initialize with required managers
   */
  initialize(waypointManager, mapManager, platformManager) {
    if (!waypointManager) {
      console.error('Waypoint manager is required');
      return false;
    }
    
    this.waypointManager = waypointManager;
    this.mapManager = mapManager;
    this.platformManager = platformManager;
    
    console.log('WaypointInteractions successfully initialized');
    return true;
  }
  
  /**
   * Set waypoint mode (true for waypoints, false for stops)
   */
  setWaypointMode(waypointMode) {
    this.config.waypointMode = !!waypointMode;
    
    // Update the global flag for other components
    window.isWaypointModeActive = this.config.waypointMode;
    
    console.log(`Waypoint mode set to: ${this.config.waypointMode ? 'WAYPOINT' : 'STOP'}`);
    
    return this.config.waypointMode;
  }
  
  /**
   * Add a waypoint or stop based on current mode
   */
  addWaypoint(waypointData) {
    // Prevent rapid additions
    const now = Date.now();
    if (now - this.lastAddTime < this.config.debounceTime) {
      console.log('Debouncing waypoint addition');
      return null;
    }
    this.lastAddTime = now;
    
    if (!this.waypointManager) {
      this.triggerCallback('onWaypointError', new Error('Waypoint manager not initialized'));
      return null;
    }
    
    try {
      // Process waypoint data into a consistent format
      const { coords, name } = this.processWaypointData(waypointData);
      
      if (!coords) {
        this.triggerCallback('onWaypointError', new Error('Invalid coordinates'));
        return null;
      }
      
      // Determine if this should be a waypoint or stop based on current mode
      const isWaypoint = this.config.waypointMode;
      
      console.log(`Adding ${isWaypoint ? 'waypoint' : 'stop'} at [${coords}] with name: ${name || 'Unnamed'}`);
      
      // Add using the waypointManager with correct type information
      const waypoint = this.waypointManager.addWaypoint(coords, name, {
        isWaypoint: isWaypoint,
        type: isWaypoint ? 'WAYPOINT' : 'STOP',
        pointType: isWaypoint ? 'NAVIGATION_WAYPOINT' : 'LANDING_STOP'
      });
      
      // Trigger callback
      this.triggerCallback('onWaypointAdded', waypoint);
      
      return waypoint;
    } catch (error) {
      console.error('Error adding waypoint:', error);
      this.triggerCallback('onWaypointError', error);
      return null;
    }
  }
  
  /**
   * Add a waypoint at a specific index
   */
  addWaypointAtIndex(waypointData, index) {
    // Prevent rapid additions
    const now = Date.now();
    if (now - this.lastAddTime < this.config.debounceTime) {
      console.log('Debouncing waypoint addition at index');
      return null;
    }
    this.lastAddTime = now;
    
    if (!this.waypointManager) {
      this.triggerCallback('onWaypointError', new Error('Waypoint manager not initialized'));
      return null;
    }
    
    try {
      // Process waypoint data into a consistent format
      const { coords, name } = this.processWaypointData(waypointData);
      
      if (!coords) {
        this.triggerCallback('onWaypointError', new Error('Invalid coordinates'));
        return null;
      }
      
      // Validate index
      if (index === undefined || index === null || isNaN(index) || index < 0) {
        index = this.waypointManager.getWaypoints().length;
      }
      
      // Determine if this should be a waypoint or stop based on current mode
      const isWaypoint = this.config.waypointMode;
      
      // IMPORTANT: Add extra information to log - include entire waypoint data
      console.log(`Adding ${isWaypoint ? 'waypoint' : 'stop'} at index ${index} with:`, {
        coords,
        name: name || 'Unnamed',
        isWaypoint,
        originalData: waypointData
      });
      
      // Check for specific cases - we may need to find the nearest point
      let finalCoords = coords;
      let finalName = name;
      let foundNearbyPoint = false;
      
      // If we're adding directly from coordinates (no name yet), try to find a nearby point
      if (!finalName && this.platformManager) {
        try {
          if (isWaypoint) {
            // In waypoint mode, check for nearest waypoint
            if (typeof this.platformManager.findNearestOsdkWaypoint === 'function') {
              const nearestWaypoint = this.platformManager.findNearestOsdkWaypoint(coords[1], coords[0], 5);
              
              if (nearestWaypoint && nearestWaypoint.distance <= 5) {
                console.log(`Found nearby waypoint ${nearestWaypoint.name} (${nearestWaypoint.distance.toFixed(2)}nm away)`);
                finalCoords = nearestWaypoint.coordinates;
                finalName = nearestWaypoint.name;
                foundNearbyPoint = true;
                
                // Show feedback
                if (window.LoadingIndicator && window.LoadingIndicator.updateStatusIndicator) {
                  window.LoadingIndicator.updateStatusIndicator(
                    `Snapped to waypoint: ${finalName} (${nearestWaypoint.distance.toFixed(1)} nm away)`,
                    'success',
                    2000
                  );
                }
              }
            }
          }
          
          // If we didn't find a waypoint (or not in waypoint mode), check for nearest platform
          if (!foundNearbyPoint && typeof this.platformManager.findNearestPlatform === 'function') {
            const nearestPlatform = this.platformManager.findNearestPlatform(coords[1], coords[0], 5);
            
            if (nearestPlatform && nearestPlatform.distance <= 5) {
              console.log(`Found nearby platform ${nearestPlatform.name} (${nearestPlatform.distance.toFixed(2)}nm away)`);
              finalCoords = nearestPlatform.coordinates;
              finalName = nearestPlatform.name;
              foundNearbyPoint = true;
              
              // Show feedback
              if (window.LoadingIndicator && window.LoadingIndicator.updateStatusIndicator) {
                window.LoadingIndicator.updateStatusIndicator(
                  `Snapped to ${finalName} (${nearestPlatform.distance.toFixed(1)} nm away)`,
                  'success',
                  2000
                );
              }
            }
          }
        } catch (error) {
          console.error('Error finding nearest point:', error);
        }
      }
      
      // If we still don't have a name, use a generic one
      if (!finalName) {
        finalName = isWaypoint ? `Waypoint ${index + 1}` : `Stop ${index + 1}`;
      }
      
      // Add using the waypointManager with correct type information
      const waypoint = this.waypointManager.addWaypointAtIndex(finalCoords, finalName, index, {
        isWaypoint: isWaypoint,
        type: isWaypoint ? 'WAYPOINT' : 'STOP',
        pointType: isWaypoint ? 'NAVIGATION_WAYPOINT' : 'LANDING_STOP'
      });
      
      // Trigger callback
      this.triggerCallback('onWaypointAdded', waypoint);
      
      return waypoint;
    } catch (error) {
      console.error('Error adding waypoint at index:', error);
      this.triggerCallback('onWaypointError', error);
      return null;
    }
  }
  
  /**
   * Remove a waypoint by ID or index
   */
  removeWaypoint(waypointIdOrIndex) {
    // Prevent rapid removals
    const now = Date.now();
    if (now - this.lastRemoveTime < this.config.debounceTime) {
      console.log('Debouncing waypoint removal');
      return false;
    }
    this.lastRemoveTime = now;
    
    if (!this.waypointManager) {
      this.triggerCallback('onWaypointError', new Error('Waypoint manager not initialized'));
      return false;
    }
    
    try {
      const waypoints = this.waypointManager.getWaypoints();
      let id, index;
      
      // Determine if we have an ID or an index
      if (typeof waypointIdOrIndex === 'string') {
        // It's an ID
        id = waypointIdOrIndex;
        index = waypoints.findIndex(wp => wp.id === id);
      } else if (typeof waypointIdOrIndex === 'number') {
        // It's an index
        index = waypointIdOrIndex;
        id = waypoints[index]?.id;
      } else {
        console.error('Invalid waypoint identifier:', waypointIdOrIndex);
        return false;
      }
      
      // Only proceed if we have a valid ID and index
      if (id && index !== -1) {
        console.log(`Removing waypoint with ID ${id} at index ${index}`);
        
        // Store waypoint info for the callback
        const removedWaypoint = {...waypoints[index]};
        
        // Remove the waypoint
        const result = this.waypointManager.removeWaypoint(id, index);
        
        if (result) {
          // Trigger callback
          this.triggerCallback('onWaypointRemoved', {
            index,
            id,
            waypoint: removedWaypoint
          });
        }
        
        return result;
      }
      
      return false;
    } catch (error) {
      console.error('Error removing waypoint:', error);
      this.triggerCallback('onWaypointError', error);
      return false;
    }
  }
  
  /**
   * Move a waypoint by dragging
   */
  moveWaypoint(waypointId, newCoords) {
    // Prevent rapid moves
    const now = Date.now();
    if (now - this.lastDragTime < this.config.debounceTime) {
      console.log('Debouncing waypoint move');
      return false;
    }
    this.lastDragTime = now;
    
    if (!this.waypointManager) {
      this.triggerCallback('onWaypointError', new Error('Waypoint manager not initialized'));
      return false;
    }
    
    try {
      const waypoints = this.waypointManager.getWaypoints();
      const index = waypoints.findIndex(wp => wp.id === waypointId);
      
      if (index === -1) {
        console.error(`Waypoint with ID ${waypointId} not found`);
        return false;
      }
      
      // Get the original waypoint for comparison
      const originalWaypoint = {...waypoints[index]};
      
      // Update the coordinates
      waypoints[index].coords = newCoords;
      
      // Update the name if it was a platform-based name and we have the platformManager
      if (this.platformManager && typeof this.platformManager.findNearestPlatform === 'function') {
        const nearestPlatform = this.platformManager.findNearestPlatform(newCoords[1], newCoords[0], 1);
        
        if (nearestPlatform && nearestPlatform.distance < 1) {
          console.log(`Waypoint moved near platform ${nearestPlatform.name}`);
          waypoints[index].name = nearestPlatform.name;
        }
      }
      
      // Update the route
      this.waypointManager.updateRoute();
      
      // Trigger a change event
      if (typeof this.waypointManager.triggerCallback === 'function') {
        this.waypointManager.triggerCallback('onChange', waypoints);
      }
      
      // Trigger our own callback
      this.triggerCallback('onWaypointMoved', {
        id: waypointId,
        index,
        oldCoords: originalWaypoint.coords,
        newCoords,
        waypoint: waypoints[index]
      });
      
      return true;
    } catch (error) {
      console.error('Error moving waypoint:', error);
      this.triggerCallback('onWaypointError', error);
      return false;
    }
  }
  
  /**
   * Process various waypoint data formats into a consistent format
   */
  processWaypointData(waypointData) {
    let coords = null;
    let name = null;
    
    if (Array.isArray(waypointData)) {
      // Direct coordinates array: [lng, lat]
      coords = waypointData;
      
      // IMPROVEMENT: For direct coordinate arrays, try to find the nearest platform or waypoint
      try {
        if (this.platformManager) {
          const isWaypointMode = this.config.waypointMode;
          
          // In waypoint mode, first try to find nearest waypoint
          if (isWaypointMode && typeof this.platformManager.findNearestOsdkWaypoint === 'function') {
            const nearestWaypoint = this.platformManager.findNearestOsdkWaypoint(coords[1], coords[0], 5);
            
            if (nearestWaypoint && nearestWaypoint.distance <= 5) {
              console.log(`WaypointInteractions: Found nearby waypoint ${nearestWaypoint.name} (${nearestWaypoint.distance.toFixed(2)}nm away)`);
              coords = nearestWaypoint.coordinates;
              name = nearestWaypoint.name;
              
              // Show feedback to user about snapping
              if (window.LoadingIndicator && window.LoadingIndicator.updateStatusIndicator) {
                window.LoadingIndicator.updateStatusIndicator(
                  `Snapped to waypoint: ${name} (${nearestWaypoint.distance.toFixed(1)} nm away)`,
                  'success',
                  2000
                );
              }
              
              return { coords, name };
            }
          }
          
          // If not in waypoint mode or no waypoint found, try to find nearest platform
          if (typeof this.platformManager.findNearestPlatform === 'function') {
            const nearestPlatform = this.platformManager.findNearestPlatform(coords[1], coords[0], 5);
            
            if (nearestPlatform && nearestPlatform.distance <= 5) {
              console.log(`WaypointInteractions: Found nearby platform ${nearestPlatform.name} (${nearestPlatform.distance.toFixed(2)}nm away)`);
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
              
              return { coords, name };
            }
          }
        }
      } catch (error) {
        console.error('WaypointInteractions: Error finding nearest point:', error);
      }
    } else if (typeof waypointData === 'string') {
      // It's just a name - try to find a location with that name
      name = waypointData;
      
      if (this.platformManager) {
        const platform = this.platformManager.findPlatformByName(waypointData);
        
        if (platform) {
          coords = platform.coordinates;
          name = platform.name;
        }
      }
    } else if (waypointData && typeof waypointData === 'object') {
      // Extract coordinates from various possible formats
      if (waypointData.coordinates) {
        coords = waypointData.coordinates;
      } else if (waypointData.coords) {
        coords = waypointData.coords;
      } else if (waypointData.lngLat) {
        coords = [waypointData.lngLat.lng, waypointData.lngLat.lat];
        
        // If we have lngLat, also check for nearest platform/waypoint
        try {
          if (this.platformManager) {
            const isWaypointMode = this.config.waypointMode;
            
            // In waypoint mode, first try to find nearest waypoint
            if (isWaypointMode && typeof this.platformManager.findNearestOsdkWaypoint === 'function') {
              const nearestWaypoint = this.platformManager.findNearestOsdkWaypoint(coords[1], coords[0], 5);
              
              if (nearestWaypoint && nearestWaypoint.distance <= 5) {
                console.log(`WaypointInteractions: Found nearby waypoint ${nearestWaypoint.name} (${nearestWaypoint.distance.toFixed(2)}nm away)`);
                coords = nearestWaypoint.coordinates;
                name = nearestWaypoint.name;
                
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
            if (!name && typeof this.platformManager.findNearestPlatform === 'function') {
              const nearestPlatform = this.platformManager.findNearestPlatform(coords[1], coords[0], 5);
              
              if (nearestPlatform && nearestPlatform.distance <= 5) {
                console.log(`WaypointInteractions: Found nearby platform ${nearestPlatform.name} (${nearestPlatform.distance.toFixed(2)}nm away)`);
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
        } catch (error) {
          console.error('WaypointInteractions: Error finding nearest point:', error);
        }
      } else if (waypointData.nearestPlatform && waypointData.nearestPlatform.distance <= 5) {
        // Use nearest platform if available
        const nearestPlatform = waypointData.nearestPlatform;
        
        if (nearestPlatform.coordinates) {
          coords = nearestPlatform.coordinates;
        } else if (nearestPlatform.coords) {
          coords = nearestPlatform.coords;
        }
        
        name = nearestPlatform.name;
      } else if (waypointData.nearestWaypoint && waypointData.nearestWaypoint.distance <= 5) {
        // Use nearest waypoint if available
        const nearestWaypoint = waypointData.nearestWaypoint;
        
        if (nearestWaypoint.coordinates) {
          coords = nearestWaypoint.coordinates;
        } else if (nearestWaypoint.coords) {
          coords = nearestWaypoint.coords;
        }
        
        name = nearestWaypoint.name;
      } else if (waypointData.nearestRig && waypointData.nearestRig.distance <= 5) {
        // For backward compatibility - use nearest rig if available
        const nearestRig = waypointData.nearestRig;
        
        if (nearestRig.coordinates) {
          coords = nearestRig.coordinates;
        } else if (nearestRig.coords) {
          coords = nearestRig.coords;
        }
        
        name = nearestRig.name;
      }
      
      // Extract name if provided
      if (!name && waypointData.name) {
        name = waypointData.name;
      }
    }
    
    return { coords, name };
  }
  
  /**
   * Set callback for specific events
   */
  setCallback(eventName, callback) {
    if (typeof callback !== 'function') {
      console.error(`Invalid callback for ${eventName}`);
      return;
    }
    
    if (this.callbacks.hasOwnProperty(eventName)) {
      this.callbacks[eventName] = callback;
      console.log(`Set callback for ${eventName}`);
    } else {
      console.error(`Unknown event name: ${eventName}`);
    }
  }
  
  /**
   * Trigger a callback with data
   */
  triggerCallback(eventName, data) {
    if (this.callbacks.hasOwnProperty(eventName) && typeof this.callbacks[eventName] === 'function') {
      try {
        this.callbacks[eventName](data);
      } catch (error) {
        console.error(`Error in ${eventName} callback:`, error);
        
        // If there's an error callback, trigger it
        if (eventName !== 'onWaypointError' && 
            this.callbacks.onWaypointError && 
            typeof this.callbacks.onWaypointError === 'function') {
          this.callbacks.onWaypointError(error);
        }
      }
    }
  }
}

export default WaypointInteractions;