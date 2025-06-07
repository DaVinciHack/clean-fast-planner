/**
 * separate-mode-handler.js
 * 
 * A completely new approach to handling waypoint/normal modes
 * with entirely separate handlers.
 */

/**
 * Creates and returns two completely separate handlers:
 * - normalModeHandler: for regular stops
 * - waypointModeHandler: for waypoints
 * 
 * These handlers never modify each other's methods and have
 * completely separate click and event handlers.
 */
export function createSeparateHandlers(mapManager, waypointManager, platformManager) {
  if (!mapManager || !waypointManager || !platformManager) {
    console.error("Cannot create handlers: Missing required managers");
    return null;
  }
  
  // Get the map instance
  const map = mapManager.getMap();
  if (!map) {
    console.error("Cannot create handlers: Map is not initialized");
    
    // Create an event to inform other components
    window.dispatchEvent(new CustomEvent('map-initialization-error', {
      detail: { message: "Map is not initialized" }
    }));
    
    // Cache the managers for later initialization
    window._pendingModeHandlerManagers = {
      mapManager,
      waypointManager,
      platformManager
    };
    
    // Return null to indicate initialization failure
    return null;
  }
  
  // ============= NORMAL MODE HANDLER =============
  const normalModeHandler = {
    active: false,
    clickHandler: null,
    dragHandlers: {},
    
    // Normal mode click handler - completely separate function
    handleMapClick: function(e) {
      console.log('NORMAL MODE: Map click', e.lngLat);
      
      // Notify to show left panel
      if (platformManager.notifyLeftPanelOpen) {
        platformManager.notifyLeftPanelOpen();
      }
      
      try {
        // Check if clicking on a platform marker
        const platformFeatures = map.queryRenderedFeatures(e.point, { 
          layers: [
            'platforms-fixed-layer', 
            'platforms-movable-layer',
            'airfields-layer'
          ] 
        });

        if (platformFeatures && platformFeatures.length > 0) {
          console.log('NORMAL MODE: Clicked on platform:', platformFeatures[0].properties.name);
          const props = platformFeatures[0].properties;
          const coordinates = platformFeatures[0].geometry.coordinates.slice();

          // Add platform as STOP (not waypoint)
          waypointManager.addWaypoint(coordinates, props.name, {
            isWaypoint: false,
            type: 'STOP'
          });
          return;
        }
      } catch (err) {
        console.error('NORMAL MODE: Error handling platform click:', err);
      }

      try {
        // Check if clicking on the route line - first check if route exists
        if (map.getLayer('route')) {
          const routeFeatures = map.queryRenderedFeatures(e.point, { layers: ['route'] });
          if (routeFeatures && routeFeatures.length > 0) {
            console.log('NORMAL MODE: Clicked on route line');
            
            // Find where to insert on the path
            const insertIndex = waypointManager.findPathInsertIndex(e.lngLat);

            // Check for nearest rig
            const nearestRig = platformManager.findNearestPlatform(e.lngLat.lat, e.lngLat.lng);

            // Add as STOP (not waypoint)
            if (nearestRig && nearestRig.distance < 5) {
              waypointManager.addWaypointAtIndex(nearestRig.coordinates, nearestRig.name, insertIndex, {
                isWaypoint: false,
                type: 'STOP'
              });
            } else {
              waypointManager.addWaypointAtIndex([e.lngLat.lng, e.lngLat.lat], null, insertIndex, {
                isWaypoint: false,
                type: 'STOP'
              });
            }
            return;
          }
        }
      } catch (err) {
        console.error('NORMAL MODE: Error handling route click:', err);
      }

      // If clicking on map background, add as STOP
      try {
        const nearestRig = platformManager.findNearestPlatform(e.lngLat.lat, e.lngLat.lng, 5);
        
        if (nearestRig && nearestRig.distance < 5) {
          console.log(`NORMAL MODE: Using nearest rig: ${nearestRig.name}`);
          waypointManager.addWaypoint(nearestRig.coordinates, nearestRig.name, {
            isWaypoint: false,
            type: 'STOP'
          });
        } else {
          console.log('NORMAL MODE: Adding stop at clicked location');
          waypointManager.addWaypoint([e.lngLat.lng, e.lngLat.lat], null, {
            isWaypoint: false,
            type: 'STOP'
          });
        }
      } catch (err) {
        console.error('NORMAL MODE: Error handling map background click:', err);
      }
    },
    
    // Activate normal mode
    activate: function() {
      console.log('NORMAL MODE: Activating normal mode');
      
      // Skip if already active
      if (this.active) {
        console.log('NORMAL MODE: Already active');
        return true;
      }
      
      try {
        // Create a bound handler function
        this.clickHandler = this.handleMapClick.bind(this);
        
        // Add the click handler to the map
        map.on('click', this.clickHandler);
        
        // Show platforms
        if (platformManager && platformManager.toggleWaypointMode) {
          platformManager.toggleWaypointMode(false);
        }
        
        if (platformManager && platformManager.toggleVisibility) {
          platformManager.toggleVisibility(true);
        }
        
        // Change cursor back to default
        map.getCanvas().style.cursor = '';
        
        // Mark as active
        this.active = true;
        
        console.log('NORMAL MODE: Normal mode activated');
        return true;
      } catch (error) {
        console.error('NORMAL MODE: Error activating normal mode:', error);
        return false;
      }
    },
    
    // Deactivate normal mode
    deactivate: function() {
      console.log('NORMAL MODE: Deactivating normal mode');
      
      // Skip if already inactive
      if (!this.active) {
        console.log('NORMAL MODE: Already inactive');
        return true;
      }
      
      try {
        // Remove the click handler
        if (this.clickHandler) {
          map.off('click', this.clickHandler);
          this.clickHandler = null;
        }
        
        // Reset active flag
        this.active = false;
        
        console.log('NORMAL MODE: Normal mode deactivated');
        return true;
      } catch (error) {
        console.error('NORMAL MODE: Error deactivating normal mode:', error);
        return false;
      }
    }
  };
  
  // ============= WAYPOINT MODE HANDLER =============
  const waypointModeHandler = {
    active: false,
    clickHandler: null,
    dragHandlers: {},
    
    // Waypoint mode click handler - completely separate function
    handleMapClick: function(e) {
      console.log('WAYPOINT MODE: Map click', e.lngLat);
      
      try {
        // Check if clicking on a waypoint marker
        const waypointFeatures = map.queryRenderedFeatures(e.point, { 
          layers: ['waypoints-layer'] 
        });
        
        if (waypointFeatures && waypointFeatures.length > 0) {
          console.log('WAYPOINT MODE: Clicked on waypoint marker');
          const props = waypointFeatures[0].properties;
          const coordinates = waypointFeatures[0].geometry.coordinates;
          
          // Add the waypoint as an actual WAYPOINT
          waypointManager.addWaypoint(coordinates, props.name || 'Waypoint', {
            isWaypoint: true,
            type: 'WAYPOINT'
          });
          return;
        }
        
        // Find nearest waypoint to click location
        const nearestWaypoint = platformManager.findNearestWaypoint(e.lngLat.lat, e.lngLat.lng, 5);
        
        if (nearestWaypoint) {
          console.log(`WAYPOINT MODE: Adding nearest waypoint: ${nearestWaypoint.name}`);
          
          // Get coordinates in correct format
          const coordinates = nearestWaypoint.coordinates || 
                              nearestWaypoint.coords || 
                              [nearestWaypoint.lng, nearestWaypoint.lat];
          
          // Add as WAYPOINT
          waypointManager.addWaypoint(coordinates, nearestWaypoint.name, {
            isWaypoint: true,
            type: 'WAYPOINT'
          });
        } else {
          console.log('WAYPOINT MODE: No waypoint found near click location');
          
          // Show message to user
          if (window.LoadingIndicator) {
            window.LoadingIndicator.updateStatusIndicator(
              'No navigation waypoint found near click location. Try clicking on a yellow waypoint.',
              'warning'
            );
          }
        }
      } catch (error) {
        console.error('WAYPOINT MODE: Error handling map click:', error);
      }
    },
    
    // Waypoint mode route click handler
    handleRouteClick: function(e) {
      console.log('WAYPOINT MODE: Route click', e.lngLat);
      
      try {
        // Find closest point on route - first check if route exists
        if (map.getLayer('route')) {
          const routeFeatures = map.queryRenderedFeatures(e.point, { layers: ['route'] });
          if (!routeFeatures || routeFeatures.length === 0) return;
          
          // Find insert index
          const insertIndex = waypointManager.findPathInsertIndex(e.lngLat);
          
          // Find nearest waypoint
          const nearestWaypoint = platformManager.findNearestWaypoint(e.lngLat.lat, e.lngLat.lng, 5);
          
          if (nearestWaypoint) {
            console.log(`WAYPOINT MODE: Adding waypoint at route: ${nearestWaypoint.name}`);
            
            // Get coordinates in correct format
            const coordinates = nearestWaypoint.coordinates || 
                                nearestWaypoint.coords || 
                                [nearestWaypoint.lng, nearestWaypoint.lat];
            
            // Add at specific index as WAYPOINT
            waypointManager.addWaypointAtIndex(coordinates, nearestWaypoint.name, insertIndex, {
              isWaypoint: true,
              type: 'WAYPOINT'
            });
          } else {
            // Show message to user
            if (window.LoadingIndicator) {
              window.LoadingIndicator.updateStatusIndicator(
                'No navigation waypoint found near route click. Try clicking on a yellow waypoint.',
                'warning'
              );
            }
          }
        }
      } catch (error) {
        console.error('WAYPOINT MODE: Error handling route click:', error);
      }
    },
    
    // Activate waypoint mode
    activate: function() {
      console.log('WAYPOINT MODE: Activating waypoint mode');
      
      // Skip if already active
      if (this.active) {
        console.log('WAYPOINT MODE: Already active');
        return true;
      }
      
      try {
        // Remove any existing click handlers from the map
        map.off('click');
        
        // Load waypoints if not loaded already
        if (platformManager && platformManager.loadWaypointsFromFoundry) {
          console.log('WAYPOINT MODE: Loading waypoints from Foundry');
          
          // Show loading message
          if (window.LoadingIndicator) {
            window.LoadingIndicator.updateStatusIndicator('Loading waypoints...', 'info');
          }
          
          // Get the current region from platformManager if available
          const currentRegion = platformManager.currentRegion || 'NORWAY';
          
          // Load waypoints
          platformManager.loadWaypointsFromFoundry(window.client, currentRegion)
            .then(() => {
              console.log('WAYPOINT MODE: Waypoints loaded');
              
              // Show success message
              if (window.LoadingIndicator) {
                window.LoadingIndicator.updateStatusIndicator(
                  'Waypoints loaded. Click on yellow waypoint dots to add them to your route.',
                  'success'
                );
              }
            })
            .catch(error => {
              console.error('WAYPOINT MODE: Error loading waypoints:', error);
              
              // Show error message
              if (window.LoadingIndicator) {
                window.LoadingIndicator.updateStatusIndicator(
                  'Error loading waypoints. Please try again.',
                  'error'
                );
              }
            });
        }
        
        // Hide platforms when in waypoint mode
        if (platformManager && platformManager.toggleWaypointMode) {
          platformManager.toggleWaypointMode(true);
        }
        
        if (platformManager && platformManager.toggleVisibility) {
          platformManager.toggleVisibility(false);
        }
        
        // Create a bound handler function
        this.clickHandler = this.handleMapClick.bind(this);
        
        // Add the click handler to the map
        map.on('click', this.clickHandler);
        
        // Add route click handler
        map.on('click', 'route', this.handleRouteClick.bind(this));
        
        // Change cursor to crosshair for waypoint mode
        map.getCanvas().style.cursor = 'crosshair';
        
        // Mark as active
        this.active = true;
        
        console.log('WAYPOINT MODE: Waypoint mode activated');
        return true;
      } catch (error) {
        console.error('WAYPOINT MODE: Error activating waypoint mode:', error);
        return false;
      }
    },
    
    // Deactivate waypoint mode
    deactivate: function() {
      console.log('WAYPOINT MODE: Deactivating waypoint mode');
      
      // Skip if already inactive
      if (!this.active) {
        console.log('WAYPOINT MODE: Already inactive');
        return true;
      }
      
      try {
        // Remove the click handlers
        if (this.clickHandler) {
          map.off('click', this.clickHandler);
          this.clickHandler = null;
        }
        
        // Remove route click handler
        map.off('click', 'route');
        
        // Reset cursor
        map.getCanvas().style.cursor = '';
        
        // Reset active flag
        this.active = false;
        
        console.log('WAYPOINT MODE: Waypoint mode deactivated');
        return true;
      } catch (error) {
        console.error('WAYPOINT MODE: Error deactivating waypoint mode:', error);
        return false;
      }
    }
  };
  
  return {
    normalModeHandler,
    waypointModeHandler
  };
}

/**
 * Toggle between normal and waypoint modes
 * This function doesn't use any flags, it directly activates one handler
 * and deactivates the other.
 */
export function toggleMode(handlers, waypointMode) {
  console.log(`TOGGLE MODE: Switching to ${waypointMode ? 'waypoint' : 'normal'} mode`);
  
  if (!handlers || !handlers.normalModeHandler || !handlers.waypointModeHandler) {
    console.error('TOGGLE MODE: Missing handlers');
    return false;
  }
  
  try {
    if (waypointMode) {
      // First deactivate normal mode
      handlers.normalModeHandler.deactivate();
      
      // Then activate waypoint mode
      handlers.waypointModeHandler.activate();
    } else {
      // First deactivate waypoint mode
      handlers.waypointModeHandler.deactivate();
      
      // Then activate normal mode
      handlers.normalModeHandler.activate();
    }
    
    console.log(`TOGGLE MODE: Successfully switched to ${waypointMode ? 'waypoint' : 'normal'} mode`);
    return true;
  } catch (error) {
    console.error('TOGGLE MODE: Error toggling mode:', error);
    return false;
  }
}

export default {
  createSeparateHandlers,
  toggleMode
};
