/**
 * MapInteractionHandler.js
 * 
 * Handles map click events and route interactions
 * Separates these concerns from the main FastPlannerApp component
 */

class MapInteractionHandler {
  constructor(mapManager, waypointManager, platformManager) {
    this.mapManager = mapManager;
    this.waypointManager = waypointManager;
    this.platformManager = platformManager;
    this.isInitialized = false;
    this.callbacks = {
      onLeftPanelOpen: null,
      onMapClick: null,
      onRouteClick: null,
      onPlatformClick: null,
      onError: null
    };
  }

  setCallback(type, callback) {
    if (this.callbacks.hasOwnProperty(type)) {
      this.callbacks[type] = callback;
    }
  }

  triggerCallback(type, data) {
    if (this.callbacks[type]) {
      this.callbacks[type](data);
    }
  }

  initialize() {
    console.log('🚨 MapInteractionHandler: Initializing map interaction handlers');
    if (!this.mapManager || !this.waypointManager || !this.platformManager) {
      console.error('MapInteractionHandler: Missing required managers');
      this.triggerCallback('onError', 'Missing required managers');
      return false;
    }
    const map = this.mapManager.getMap();
    if (!map) {
      console.error('MapInteractionHandler: Map is not initialized');
      this.triggerCallback('onError', 'Map is not initialized');
      return false;
    }
    if (window.isWaypointModeActive !== true) {
      window.isWaypointModeActive = false;
    }
    
    // Clean up any existing event handlers to prevent duplicates
    if (this._boundClickHandler) {
      console.log('MapInteractionHandler: Removing existing click handler');
      map.off('click', this._boundClickHandler);
      this._boundClickHandler = null;
    }
    
    // Bind and set up the click handler
    this._boundClickHandler = this.handleMapClick.bind(this);
    map.on('click', this._boundClickHandler);
    
    // Set up route dragging functionality
    console.log('MapInteractionHandler: Setting up route dragging');
    if (typeof this.waypointManager.setupRouteDragging === 'function') {
      // CRITICAL FIX: Make sure we're binding the handler properly
      const routeDragHandler = this.handleRouteDragComplete.bind(this);
      this.waypointManager.setupRouteDragging(routeDragHandler);
      
      // Add a global reference for debugging
      window._mapInteractionRouteDragHandler = routeDragHandler;
      console.log('MapInteractionHandler: Route drag handler registered');
    } else {
      console.error('MapInteractionHandler: waypointManager.setupRouteDragging is not a function');
    }
    
    this.isInitialized = true;
    console.log('MapInteractionHandler: Map interactions initialized successfully');
    return true;
  }

  handleMapClick(e) {
    // Prevent duplicate clicks
    if (window._processingMapClick === true) {
      console.log('MapInteractionHandler: Ignoring duplicate click - already processing');
      return;
    }
    
    if (window._routeDragJustFinished || window._isRouteDragging) {
      console.log('MapInteractionHandler: Click event ignored due to recent/active route drag.');
      return; 
    }
    
    // Immediately set processing flag to prevent duplicates
    window._processingMapClick = true;
    
    try {
      console.log('MapInteractionHandler: Handling map click event');
      
      // Handle clicks in waypoint mode
      if (window.isWaypointModeActive === true) {
        const waypointHandler = window.waypointHandler || this.getWaypointHandler();
        if (waypointHandler && typeof waypointHandler.handleWaypointClick === 'function') {
          const handledByDedicatedHandler = waypointHandler.handleWaypointClick(e);
          if (handledByDedicatedHandler) {
            console.log('MapInteractionHandler: Event handled by dedicated WaypointHandler.');
            window._processingMapClick = false; // Clear flag before returning
            return;
          }
        }
      }

      const isWaypointMode = window.isWaypointModeActive === true;
      console.log(`MapInteractionHandler: Map clicked in ${isWaypointMode ? 'WAYPOINT' : 'NORMAL'} mode.`);
      
      // Ensure required managers are available
      if (!this.mapManager || !this.waypointManager || !this.platformManager) {
        window._processingMapClick = false; // Clear flag before returning
        return;
      }
      
      const map = this.mapManager.getMap();
      if (!map) {
        window._processingMapClick = false; // Clear flag before returning
        return;
      }
      
      // Trigger left panel open callback
      this.triggerCallback('onLeftPanelOpen');

      // CRITICAL FIX: First check for nearest platform/waypoint BEFORE checking if the click is directly on a feature
      // This ensures snapping behavior is consistent regardless of zoom level or pixel-perfect clicks
      
      try {
        // First priority: Find nearest rig or waypoint depending on mode
        let nearestPoint = null;
        let nearestPointType = '';
        
        if (isWaypointMode && typeof this.platformManager.findNearestOsdkWaypoint === 'function') {
          // In waypoint mode, first try to find the nearest waypoint
          const nearestWaypoint = this.platformManager.findNearestOsdkWaypoint(e.lngLat.lat, e.lngLat.lng, 5);
          
          if (nearestWaypoint && nearestWaypoint.distance <= 5) {
            console.log(`MapInteractionHandler: Found nearby waypoint ${nearestWaypoint.name} (${nearestWaypoint.distance.toFixed(2)}nm away)`);
            nearestPoint = nearestWaypoint;
            nearestPointType = 'waypoint';
          }
        }
        
        // If no waypoint found or not in waypoint mode, try to find nearest platform
        if (!nearestPoint && typeof this.platformManager.findNearestPlatform === 'function') {
          const nearestRig = this.platformManager.findNearestPlatform(e.lngLat.lat, e.lngLat.lng, 5);
          
          if (nearestRig && nearestRig.distance <= 5) {
            console.log(`MapInteractionHandler: Found nearby platform ${nearestRig.name} (${nearestRig.distance.toFixed(2)}nm away)`);
            nearestPoint = nearestRig;
            nearestPointType = 'platform';
          }
        }
        
        // If we found a nearest point (rig or waypoint), use it
        if (nearestPoint) {
          console.log(`MapInteractionHandler: Using nearest ${nearestPointType}: ${nearestPoint.name}`);
          
          // Show feedback to user about snapping
          if (window.LoadingIndicator && window.LoadingIndicator.updateStatusIndicator) {
            window.LoadingIndicator.updateStatusIndicator(
              `Snapped to ${nearestPoint.name} (${nearestPoint.distance.toFixed(1)} nm away)`,
              'success',
              2000
            );
          }
          
          // Use the appropriate callback
          if (this.callbacks.onPlatformClick) {
            console.log(`MapInteractionHandler: Triggering onPlatformClick callback for nearest ${nearestPointType}`);
            
            this.triggerCallback('onPlatformClick', {
              coordinates: nearestPoint.coordinates || nearestPoint.coords,
              name: nearestPoint.name,
              lngLat: { 
                lng: (nearestPoint.coordinates || nearestPoint.coords)[0], 
                lat: (nearestPoint.coordinates || nearestPoint.coords)[1] 
              },
              isWaypointMode: isWaypointMode,
              distance: nearestPoint.distance,
              // Add the point as both nearestRig and nearestWaypoint to ensure compatibility
              nearestRig: nearestPointType === 'platform' ? nearestPoint : null,
              nearestWaypoint: nearestPointType === 'waypoint' ? nearestPoint : null
            });
            
            window._processingMapClick = false; // Clear flag before returning
            return;
          }
        }
      } catch (err) {
        console.error('MapInteractionHandler: Error finding nearest point:', err);
      }
      
      try {
        // Second priority: Check if click is directly on a platform
        const availableLayers = ['platforms-fixed-layer', 'platforms-movable-layer', 'airfields-layer', 'platforms-layer'].filter(layer => map.getLayer(layer));
        if (availableLayers.length > 0) {
          const platformFeatures = map.queryRenderedFeatures(e.point, { layers: availableLayers });
          if (platformFeatures && platformFeatures.length > 0) {
            const feature = platformFeatures[0]; // Get the first feature
            const props = feature.properties;
            const coordinates = feature.geometry.coordinates.slice();
            
            // Use callback pattern instead of direct addition
            if (this.callbacks.onPlatformClick) {
              console.log('MapInteractionHandler: Triggering onPlatformClick callback for direct platform click');
              
              // CONSTRUCT A consistent object
              const platformData = {
                name: props.name,
                coordinates: coordinates,
                lat: coordinates[1],
                lng: coordinates[0],
                coords: coordinates, 
                distance: 0 // Direct click means distance is 0
              };

              this.triggerCallback('onPlatformClick', {
                coordinates: coordinates, // Keep this for direct access if needed
                name: props.name,         // Keep this for direct access if needed
                lngLat: { lng: coordinates[0], lat: coordinates[1] },
                isWaypointMode: isWaypointMode,
                nearestRig: platformData, // Pass the constructed platformData as nearestRig
                nearestWaypoint: null // Explicitly null if it's a platform click
              });
              window._processingMapClick = false; // Clear flag before returning
              return;
            }
          }
        }
      } catch (err) { 
        console.error('MapInteractionHandler: Error handling platform click:', err);
      }

      try {
        // Third priority: Check if click is on the route
        if (map.getLayer('route')) {
          const routeFeatures = map.queryRenderedFeatures(e.point, { layers: ['route'] });
          if (routeFeatures && routeFeatures.length > 0) {
            const insertIndex = this.waypointManager.findPathInsertIndex(e.lngLat);
            
            // Find the nearest point for the route click too
            let nearestRig = null;
            if (typeof this.platformManager.findNearestPlatform === 'function') {
              nearestRig = this.platformManager.findNearestPlatform(e.lngLat.lat, e.lngLat.lng, 5);
            }
            
            let nearestWaypoint = null;
            if (isWaypointMode && typeof this.platformManager.findNearestOsdkWaypoint === 'function') {
              nearestWaypoint = this.platformManager.findNearestOsdkWaypoint(e.lngLat.lat, e.lngLat.lng, 5);
            }
            
            // Use callback pattern instead of direct addition
            if (this.callbacks.onRouteClick) {
              console.log('MapInteractionHandler: Triggering onRouteClick callback');
              this.triggerCallback('onRouteClick', {
                lngLat: e.lngLat,
                insertIndex: insertIndex,
                nearestRig: nearestRig,
                nearestWaypoint: nearestWaypoint,
                isWaypointMode: isWaypointMode
              });
              window._processingMapClick = false; // Clear flag before returning
              return;
            }
          }
        }
      } catch (err) { 
        console.error('MapInteractionHandler: Error handling route click:', err);
      }

      // Fourth priority: It's a click on the map background with no nearby facility
      try {
        if (this.callbacks.onMapClick) {
          console.log('MapInteractionHandler: Triggering onMapClick callback for map background');
          this.triggerCallback('onMapClick', {
            lngLat: e.lngLat,
            coordinates: [e.lngLat.lng, e.lngLat.lat],
            mapClickSource: 'directClick',
            isWaypointMode: isWaypointMode
          });
        }
      } catch (err) {
        console.error('MapInteractionHandler: Error handling map background click:', err);
        // Fallback for error cases
        if (this.callbacks.onMapClick) {
          console.log('MapInteractionHandler: Triggering fallback onMapClick callback');
          this.triggerCallback('onMapClick', {
            lngLat: e.lngLat,
            coordinates: [e.lngLat.lng, e.lngLat.lat],
            mapClickSource: 'fallback',
            isWaypointMode: isWaypointMode
          });
        }
      }
    } finally {
      // Always clear processing flag when done, even if there was an error
      setTimeout(() => {
        window._processingMapClick = false;
        console.log('MapInteractionHandler: Click processing complete, cleared flag');
      }, 300); // Small delay to prevent rapid firing
    }
  }

  handlePlatformClick(coordinates, name) {
    const isWaypointMode = window.isWaypointModeActive === true;
    if (this.callbacks.onPlatformClick) {
      this.triggerCallback('onPlatformClick', { coordinates, name, isWaypointMode });
    } else {
      this.waypointManager.addWaypoint(coordinates, name, { isWaypoint: isWaypointMode, type: isWaypointMode ? 'WAYPOINT' : 'STOP' });
    }
  }

  handleRouteClick(lngLat, insertIndex, nearestRig) {
    const isWaypointMode = window.isWaypointModeActive === true;
    
    // IMPROVED: If we don't have a nearest rig yet, try to find one within 5nm
    if (!nearestRig && this.platformManager) {
      try {
        if (typeof this.platformManager.findNearestPlatform === 'function') {
          nearestRig = this.platformManager.findNearestPlatform(lngLat.lat, lngLat.lng, 5);
          
          if (nearestRig) {
            console.log(`MapInteractionHandler: Found nearby platform for route click: ${nearestRig.name} (${nearestRig.distance.toFixed(2)}nm away)`);
          }
        }
      } catch (error) {
        console.error('Error finding nearest platform:', error);
      }
    }
    
    // IMPROVED: In waypoint mode, always try to find nearest waypoint
    let nearestWaypoint = null;
    if (isWaypointMode && this.platformManager) {
      try {
        if (typeof this.platformManager.findNearestOsdkWaypoint === 'function') {
          nearestWaypoint = this.platformManager.findNearestOsdkWaypoint(lngLat.lat, lngLat.lng, 5);
          
          if (nearestWaypoint) {
            console.log(`MapInteractionHandler: Found nearby waypoint for route click: ${nearestWaypoint.name} (${nearestWaypoint.distance.toFixed(2)}nm away)`);
          }
        }
      } catch (error) {
        console.error('Error finding nearest waypoint:', error);
      }
    }
    
    if (this.callbacks.onRouteClick) {
      console.log(`MapInteractionHandler: Triggering onRouteClick callback with insertIndex: ${insertIndex}`);
      this.triggerCallback('onRouteClick', { 
        lngLat, 
        insertIndex, 
        nearestRig, 
        nearestWaypoint, // Add nearby waypoint information
        isWaypointMode 
      });
    } else {
      let name = null;
      let coordsToUse = [lngLat.lng, lngLat.lat];
      
      // In waypoint mode, prioritize nearby waypoints
      if (isWaypointMode && nearestWaypoint && nearestWaypoint.distance < 5) {
        name = nearestWaypoint.name;
        coordsToUse = nearestWaypoint.coordinates || nearestWaypoint.coords || coordsToUse;
        
        // Show feedback
        if (window.LoadingIndicator && window.LoadingIndicator.updateStatusIndicator) {
          window.LoadingIndicator.updateStatusIndicator(
            `Snapped to waypoint: ${name} (${nearestWaypoint.distance.toFixed(1)} nm away)`,
            'success',
            2000
          );
        }
      }
      // Otherwise check for nearby rig/platform
      else if (nearestRig && nearestRig.distance < 5) {
        name = nearestRig.name;
        coordsToUse = nearestRig.coordinates || nearestRig.coords || coordsToUse;
        
        // Show feedback
        if (window.LoadingIndicator && window.LoadingIndicator.updateStatusIndicator) {
          window.LoadingIndicator.updateStatusIndicator(
            `Snapped to ${name} (${nearestRig.distance.toFixed(1)} nm away)`,
            'success',
            2000
          );
        }
      } else {
        name = isWaypointMode ? `Waypoint ${insertIndex}` : `Stop ${insertIndex}`;
      }
      
      console.log(`MapInteractionHandler: Adding ${isWaypointMode ? 'waypoint' : 'stop'} '${name}' at index ${insertIndex}`);
      this.waypointManager.addWaypointAtIndex(
        coordsToUse, 
        name, 
        insertIndex, 
        { isWaypoint: isWaypointMode, type: isWaypointMode ? 'WAYPOINT' : 'STOP' }
      );
    }
  }

  handleMapBackgroundClick(lngLat) {
    const isWaypointMode = window.isWaypointModeActive === true;
    if (this.callbacks.onMapClick) {
      this.triggerCallback('onMapClick', { lngLat: lngLat, coordinates: [lngLat.lng, lngLat.lat], mapClickSource: 'directClick', isWaypointMode: isWaypointMode });
    } else {
      const name = isWaypointMode ? `Waypoint ${this.waypointManager.getWaypoints().length + 1}` : `Stop ${this.waypointManager.getWaypoints().length + 1}`;
      this.waypointManager.addWaypoint([lngLat.lng, lngLat.lat], name, { isWaypoint: isWaypointMode, type: isWaypointMode ? 'WAYPOINT' : 'STOP' });
    }
  }

  handleRouteDragComplete(insertIndex, coords, dragData = {}) {
    console.log(`MapInteractionHandler.handleRouteDragComplete: Received insertIndex: ${insertIndex}, coords: ${coords}`);
    
    // Prevent duplicate processing
    if (window._processingRouteDrag === true) {
      console.log('MapInteractionHandler: Ignoring duplicate route drag - already processing');
      return;
    }
    
    // Set flag to prevent duplicate processing
    window._processingRouteDrag = true;
    
    try {
      const isWaypointMode = dragData.isWaypointMode === true || window.isWaypointModeActive === true;
      console.log(`MapInteractionHandler: Drag in ${isWaypointMode ? 'WAYPOINT' : 'NORMAL'} mode at insertion index ${insertIndex}`);
      
      // VALIDATION: Ensure insertIndex is valid
      if (insertIndex === undefined || insertIndex === null || isNaN(parseInt(insertIndex))) {
        console.error(`MapInteractionHandler: Invalid insertIndex: ${insertIndex}`);
        insertIndex = 0; // Default to beginning as a fallback
      }
      
      // Convert to integer to ensure safe comparison
      insertIndex = parseInt(insertIndex);
      
      // Verify waypoint manager exists
      if (!this.waypointManager || typeof this.waypointManager.addWaypointAtIndex !== 'function') {
        console.error('MapInteractionHandler: Cannot add waypoint - waypointManager missing or invalid');
        return;
      }
      
      // Check current waypoint count to validate insertIndex is in range
      const currentWaypoints = this.waypointManager.getWaypoints();
      const waypointCount = Array.isArray(currentWaypoints) ? currentWaypoints.length : 0;
      
      // Ensure insert index is within valid range (0 to waypoint count)
      if (insertIndex < 0) {
        console.warn(`MapInteractionHandler: Correcting negative insertIndex to 0`);
        insertIndex = 0;
      } else if (insertIndex > waypointCount) {
        console.warn(`MapInteractionHandler: Correcting out-of-range insertIndex ${insertIndex} to ${waypointCount}`);
        insertIndex = waypointCount;
      }
      
      console.log(`MapInteractionHandler: Using validated insertIndex: ${insertIndex}`);
      
      // CRITICAL FIX: First try to find the nearest waypoint/platform to snap to
      let foundNearbyPoint = false;
      
      try {
        if (isWaypointMode) {
          // In waypoint mode, first try to find an OSDK waypoint to snap to
          let nearestOsdkWp = null;
          if (typeof this.platformManager.findNearestOsdkWaypoint === 'function') {
            nearestOsdkWp = this.platformManager.findNearestOsdkWaypoint(coords[1], coords[0], 5);
          }
          
          if (nearestOsdkWp && nearestOsdkWp.distance < 5) {
            foundNearbyPoint = true;
            console.log(`MapInteractionHandler: Snapping to OSDK Waypoint: ${nearestOsdkWp.name} at index ${insertIndex}`);
            
            // Show user feedback that we're snapping
            if (window.LoadingIndicator && window.LoadingIndicator.updateStatusIndicator) {
              window.LoadingIndicator.updateStatusIndicator(
                `Snapped to waypoint: ${nearestOsdkWp.name} (${nearestOsdkWp.distance.toFixed(1)} nm away)`,
                'success',
                2000
              );
            }
            
            this.waypointManager.addWaypointAtIndex(
              nearestOsdkWp.coordinates, 
              nearestOsdkWp.name, 
              insertIndex, 
              { isWaypoint: true, type: 'WAYPOINT', pointType: 'NAVIGATION_WAYPOINT' }
            );
          }
        }
        
        // If not in waypoint mode or no nearby waypoint found, try to find a platform
        if (!foundNearbyPoint) {
          let nearestPlatform = null;
          if (typeof this.platformManager.findNearestPlatform === 'function') {
            // Explicitly use 5nm radius for snapping
            nearestPlatform = this.platformManager.findNearestPlatform(coords[1], coords[0], 5);
          }
          
          if (nearestPlatform && nearestPlatform.distance < 5) {
            foundNearbyPoint = true;
            console.log(`MapInteractionHandler: Snapping to Platform: ${nearestPlatform.name} at index ${insertIndex}`);
            
            // Show user feedback that we're snapping
            if (window.LoadingIndicator && window.LoadingIndicator.updateStatusIndicator) {
              window.LoadingIndicator.updateStatusIndicator(
                `Snapped to ${nearestPlatform.name} (${nearestPlatform.distance.toFixed(1)} nm away)`,
                'success',
                2000
              );
            }
            
            // Use the platform's coordinates and name
            this.waypointManager.addWaypointAtIndex(
              nearestPlatform.coordinates, 
              nearestPlatform.name, 
              insertIndex, 
              { 
                isWaypoint: isWaypointMode, 
                type: isWaypointMode ? 'WAYPOINT' : 'STOP',
                pointType: isWaypointMode ? 'NAVIGATION_WAYPOINT' : 'LANDING_STOP'  
              }
            );
          }
        }
        
        // If no nearby point was found, add a generic waypoint/stop
        if (!foundNearbyPoint) {
          console.log(`MapInteractionHandler: No nearby point found, adding generic ${isWaypointMode ? 'waypoint' : 'stop'} at index ${insertIndex}`);
          
          const genericName = isWaypointMode ? 
            `Waypoint ${insertIndex + 1}` : 
            `Stop ${insertIndex + 1}`;
            
          this.waypointManager.addWaypointAtIndex(
            coords, 
            genericName, 
            insertIndex, 
            { 
              isWaypoint: isWaypointMode, 
              type: isWaypointMode ? 'WAYPOINT' : 'STOP',
              pointType: isWaypointMode ? 'NAVIGATION_WAYPOINT' : 'LANDING_STOP' 
            }
          );
        }
        
        console.log(`MapInteractionHandler: Successfully added ${isWaypointMode ? 'waypoint' : 'stop'} at index ${insertIndex}`);
        
      } catch (err) {
        console.error('MapInteractionHandler: Error handling route drag completion:', err);
        
        // Fallback - still use addWaypointAtIndex with the validated insertIndex
        try {
          console.log(`MapInteractionHandler: Using fallback insert at index ${insertIndex}`);
          this.waypointManager.addWaypointAtIndex(
            coords, 
            isWaypointMode ? `Wpt ${insertIndex + 1}` : `Stop ${insertIndex + 1}`, 
            insertIndex, 
            { 
              isWaypoint: isWaypointMode, 
              type: isWaypointMode ? 'WAYPOINT' : 'STOP',
              pointType: isWaypointMode ? 'NAVIGATION_WAYPOINT' : 'LANDING_STOP'
            }
          );
        } catch (fallbackError) {
          console.error('MapInteractionHandler: Fallback error:', fallbackError);
        }
      }
    } finally {
      // Always clear processing flag, even if there was an error
      setTimeout(() => {
        window._processingRouteDrag = false;
        console.log('MapInteractionHandler: Route drag processing complete, cleared flag');
      }, 300); // Small delay to prevent rapid firing
    }
  }
  
  addClickedPoint(lngLat) {
    console.log(`MapInteractionHandler: FALLBACK - Adding direct point at [${lngLat.lng}, ${lngLat.lat}]`);
    const isWaypointMode = window.isWaypointModeActive === true;
    if (this.callbacks.onMapClick) {
      this.triggerCallback('onMapClick', { lngLat: lngLat, coordinates: [lngLat.lng, lngLat.lat], mapClickSource: 'fallback', isWaypointMode: isWaypointMode });
    } else {
      if (this.waypointManager) {
        this.waypointManager.addWaypoint([lngLat.lng, lngLat.lat], isWaypointMode ? `Waypoint ${this.waypointManager.getWaypoints().length + 1}` : `Stop ${this.waypointManager.getWaypoints().length + 1}`, { isWaypoint: isWaypointMode, type: isWaypointMode ? 'WAYPOINT' : 'STOP' });
      }
    }
  }
  
  getWaypointHandler() {
    if (window.fastPlannerApp && window.fastPlannerApp.waypointHandlerRef && window.fastPlannerApp.waypointHandlerRef.current) {
      return window.fastPlannerApp.waypointHandlerRef.current;
    }
    if (window.waypointHandler) {
      return window.waypointHandler;
    }
    return null;
  }
}

export default MapInteractionHandler;
