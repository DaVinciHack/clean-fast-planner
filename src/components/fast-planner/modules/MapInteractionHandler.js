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
    this.isMapClicksDisabled = false; // Lock state for map interactions
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

  /**
   * Lock Methods - Disable/Enable Map Click Interactions
   */
  disableMapClicks() {
    this.isMapClicksDisabled = true;
    console.log('🚫 MapInteractionHandler: Map clicks disabled');
  }

  enableMapClicks() {
    this.isMapClicksDisabled = false;
    console.log('✅ MapInteractionHandler: Map clicks enabled');
  }

  initialize() {
    console.log('🚨 MapInteractionHandler: Attempting to initialize map interaction handlers');
    if (!this.mapManager || !this.waypointManager || !this.platformManager) {
      console.error('MapInteractionHandler: Missing required managers for initialization.');
      this.triggerCallback('onError', 'Missing required managers for MapInteractionHandler');
      return false; 
    }

    this.mapManager.onMapLoaded(() => {
      console.log('🗺️ MapInteractionHandler: Map is loaded, (re)initializing click handlers.');
      const map = this.mapManager.getMap();
      if (!map) {
        console.error('MapInteractionHandler: Map not available for (re)initializing click handlers.');
        this.triggerCallback('onError', 'Map not available for MapInteractionHandler init');
        this.isInitialized = false; // Can't initialize if no map
        return;
      }

      // 1. AGGRESSIVE CLEANUP: Remove ALL click handlers to prevent duplicates
      if (typeof map.off === 'function') {
        // Remove our specific handler if it exists
        if (this._boundClickHandler) {
          map.off('click', this._boundClickHandler);
          console.log('MapInteractionHandler: Removed old _boundClickHandler.');
        }
        
        // Remove ALL click handlers to clean up any orphaned handlers from emergency fixes
        const existingHandlers = map._listeners?.click?.length || 0;
        if (existingHandlers > 0) {
          console.log(`🧹 MapInteractionHandler: Removing ${existingHandlers} existing click handlers to prevent duplicates`);
          map.off('click');
        }
      }

      // 2. Create and store the new bound click handler
      this._boundClickHandler = this.handleMapClick.bind(this);

      // 3. Attach the new click handler
      try {
        map.on('click', this._boundClickHandler);
        const finalHandlerCount = map._listeners?.click?.length || 0;
        console.log(`✅ MapInteractionHandler: Attached new handler. Total click handlers: ${finalHandlerCount}`);
      } catch (e) {
        console.error('MapInteractionHandler: Error attaching new _boundClickHandler:', e.message);
        this.triggerCallback('onError', 'Error attaching map click handler');
        this.isInitialized = false; // Failed to initialize
        return;
      }

      // 4. Setup route dragging (assuming WaypointManager handles its own listener idempotency)
      console.log('MapInteractionHandler: Setting up route dragging.');
      if (this.waypointManager && typeof this.waypointManager.setupRouteDragging === 'function') {
        const routeDragHandler = this.handleRouteDragComplete.bind(this);
        this.waypointManager.setupRouteDragging(routeDragHandler);
        window._mapInteractionRouteDragHandler = routeDragHandler; // Consider if this global is necessary
        console.log('MapInteractionHandler: Route drag handler registered/updated.');
        
        // Setup style change listener for waypoint layer restoration
        if (typeof this.waypointManager.setupStyleChangeListener === 'function') {
          this.waypointManager.setupStyleChangeListener();
          console.log('MapInteractionHandler: Waypoint style change listener set up.');
        }
      } else {
        console.error('MapInteractionHandler: waypointManager.setupRouteDragging not available.');
      }

      // 5. Mark as initialized
      this.isInitialized = true;
      console.log('MapInteractionHandler: Map interactions (re)initialized successfully.');
    });

    // The initial call to initialize() still returns true to indicate it's queued.
    console.log('MapInteractionHandler: Initialization queued with onMapLoaded.');
    return true;
  }

  handleMapClick(e) {
    // LOCK CHECK: Prevent map clicks when editing is locked
    if (this.isMapClicksDisabled || window.isEditLocked === true) {
      console.log('🔒 MapInteractionHandler: Ignoring click - editing is locked');
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator('🔒 Flight is locked - Click unlock button to edit', 'warning', 2000);
      }
      return;
    }
    
    // SEPARATE HANDLERS CHECK: If separate mode handlers are active, defer to them
    if (window.toggleMapMode && typeof window.toggleMapMode === 'function') {
      console.log('🔄 MapInteractionHandler: Separate mode handlers are active, deferring click handling');
      return;
    }
    
    if (window.isRegionLoading === true) {
      console.log('MapInteractionHandler: Ignoring click - region is loading/changing.');
      if (window.LoadingIndicator) window.LoadingIndicator.updateStatusIndicator('Map interactions paused during region update...', 'info', 1500);
      return;
    }
    if (window._processingMapClick === true) {
      console.log('MapInteractionHandler: Ignoring duplicate click - already processing');
      return;
    }
    if (window._routeDragJustFinished || window._isRouteDragging) {
      console.log('MapInteractionHandler: Click event ignored due to recent/active route drag.');
      return; 
    }
    window._processingMapClick = true;
    
    try {
      const isWaypointMode = window.isWaypointModeActive === true;
      console.log(`MapInteractionHandler: Map clicked in ${isWaypointMode ? 'WAYPOINT' : 'NORMAL'} mode.`);

      if (!this.mapManager || !this.waypointManager || !this.platformManager) {
        console.error('MapInteractionHandler: Essential managers missing!');
        window._processingMapClick = false; return;
      }
      const map = this.mapManager.getMap();
      if (!map) {
        console.error('MapInteractionHandler: Map instance not available!');
        window._processingMapClick = false; return;
      }
      
      // Enhanced logging for region change debugging
      if (window.debugRegionChange) { // A temporary flag you can set in console for verbose logging
        console.log('[DEBUG Region Change] Map Click Received. Waypoint Mode:', isWaypointMode);
        console.log('[DEBUG Region Change] PlatformManager All Platforms:', JSON.stringify(this.platformManager.getPlatforms().map(p=>p.name)));
        console.log('[DEBUG Region Change] PlatformManager OSDK Waypoints:', JSON.stringify(this.platformManager.osdkWaypoints.map(p=>p.name)));
      }

      if (isWaypointMode) {
        const waypointHandler = window.waypointHandler || this.getWaypointHandler(); 
        if (waypointHandler && typeof waypointHandler.handleMapClick === 'function') {
            console.log("MapInteractionHandler: Deferring click to active WaypointModeHandler.");
            waypointHandler.handleMapClick(e); 
            window._processingMapClick = false; 
            return; 
        } else {
            console.warn("MapInteractionHandler: WaypointModeHandler not found or handleMapClick not available, proceeding with generic OSDK check for click.");
            const osdkWaypointLayers = ['osdk-waypoints-layer'].filter(id => map.getLayer(id));
            if (osdkWaypointLayers.length > 0) {
              const features = map.queryRenderedFeatures(e.point, { layers: osdkWaypointLayers });
              if (features && features.length > 0) {
                const feature = features[0];
                const props = feature.properties;
                const coordinates = feature.geometry.coordinates.slice();
                if (this.callbacks.onPlatformClick) { // Re-using onPlatformClick for OSDK waypoints for simplicity
                  this.triggerCallback('onPlatformClick', {
                    name: props.name,
                    coordinates: coordinates,
                    lngLat: { lng: coordinates[0], lat: coordinates[1] },
                    isWaypointMode: true, 
                    nearestWaypoint: { name: props.name, coordinates: coordinates, distance: 0, type: props.type },
                    nearestRig: null
                  });
                  window._processingMapClick = false; return;
                }
              }
            }
        }
      }
      
      this.triggerCallback('onLeftPanelOpen'); 

      let featuresClicked = false;
      if (!isWaypointMode) { 
          const platformLayerIds = ['platforms-layer', 'platforms-fixed-layer', 'platforms-movable-layer', 'airfields-layer'];
          const activePlatformLayers = platformLayerIds.filter(id => map.getLayer(id));
          
          if (window.debugRegionChange) {
            console.log('[DEBUG Region Change] Active platform layers for query:', activePlatformLayers);
          }

          if (activePlatformLayers.length > 0) {
              const platformFeatures = map.queryRenderedFeatures(e.point, { layers: activePlatformLayers });
              if (window.debugRegionChange) {
                console.log('[DEBUG Region Change] queryRenderedFeatures result:', platformFeatures);
              }
              if (platformFeatures.length > 0) {
                  const feature = platformFeatures[0];
                  console.log(`MapInteractionHandler: Clicked on platform ${feature.properties.name} in normal mode.`);
                  this.handlePlatformClick(feature.geometry.coordinates.slice(), feature.properties.name);
                  featuresClicked = true;
              } else {
                 if (window.debugRegionChange) console.log('[DEBUG Region Change] No features found by queryRenderedFeatures.');
              }
          } else {
            if (window.debugRegionChange) console.log('[DEBUG Region Change] No active platform layers found to query.');
          }
      }

      if (!featuresClicked) {
          if (window.debugRegionChange) console.log('[DEBUG Region Change] No specific feature clicked, treating as background click.');
          console.log("MapInteractionHandler: No specific feature clicked, treating as background click.");
          this.handleMapBackgroundClick(e.lngLat);
      }

    } finally {
      setTimeout(() => {
        window._processingMapClick = false;
      }, 300);
    }
  }

  handlePlatformClick(coordinates, name) {
    if (this.callbacks.onPlatformClick) {
      this.triggerCallback('onPlatformClick', { coordinates, name, isWaypointMode: false });
    } else {
      this.waypointManager.addWaypoint(coordinates, name, { isWaypoint: false, type: 'STOP', pointType: 'LANDING_STOP' });
    }
  }

  handleRouteClick(lngLat, insertIndex, nearestRig) { 
    const isWaypointMode = window.isWaypointModeActive === true;
    let nearestWaypoint = null;

    if (isWaypointMode) {
      if (this.platformManager && typeof this.platformManager.findNearestOsdkWaypoint === 'function') {
        nearestWaypoint = this.platformManager.findNearestOsdkWaypoint(lngLat.lat, lngLat.lng, 5);
      }
    } else { 
      if (!nearestRig && this.platformManager && typeof this.platformManager.findNearestPlatform === 'function') {
        nearestRig = this.platformManager.findNearestPlatform(lngLat.lat, lngLat.lng, 5);
      }
    }
    
    if (this.callbacks.onRouteClick) {
      this.triggerCallback('onRouteClick', { lngLat, insertIndex, nearestRig, nearestWaypoint, isWaypointMode });
    } else {
      let nameToUse = null;
      let coordsToUse = [lngLat.lng, lngLat.lat];
      let pointOptions = { isWaypoint: isWaypointMode, type: isWaypointMode ? 'WAYPOINT' : 'STOP', pointType: isWaypointMode ? 'NAVIGATION_WAYPOINT' : 'LANDING_STOP' };

      if (isWaypointMode && nearestWaypoint) {
        nameToUse = nearestWaypoint.name;
        coordsToUse = nearestWaypoint.coordinates || nearestWaypoint.coords;
        if (window.LoadingIndicator) window.LoadingIndicator.updateStatusIndicator(`Snapped to waypoint: ${nameToUse}`, 'success', 2000);
      } else if (!isWaypointMode && nearestRig) {
        nameToUse = nearestRig.name;
        coordsToUse = nearestRig.coordinates || nearestRig.coords;
        if (window.LoadingIndicator) window.LoadingIndicator.updateStatusIndicator(`Snapped to ${nameToUse}`, 'success', 2000);
      } else {
        nameToUse = isWaypointMode ? `Waypoint ${insertIndex + 1}` : `Stop ${insertIndex + 1}`;
      }
      this.waypointManager.addWaypointAtIndex(coordsToUse, nameToUse, insertIndex, pointOptions);
    }
  }

  handleMapBackgroundClick(lngLat) {
    const isWaypointMode = window.isWaypointModeActive === true;
    if (this.callbacks.onMapClick) {
      this.triggerCallback('onMapClick', { lngLat: lngLat, coordinates: [lngLat.lng, lngLat.lat], mapClickSource: 'directClick', isWaypointMode: isWaypointMode });
    } else {
      const name = isWaypointMode ? `Waypoint ${this.waypointManager.getWaypoints().length + 1}` : `Stop ${this.waypointManager.getWaypoints().length + 1}`;
      this.waypointManager.addWaypoint([lngLat.lng, lngLat.lat], name, { isWaypoint: isWaypointMode, type: isWaypointMode ? 'WAYPOINT' : 'STOP', pointType: isWaypointMode ? 'NAVIGATION_WAYPOINT' : 'LANDING_STOP' });
    }
  }

  handleRouteDragComplete(insertIndex, coords, dragData = {}) {
    console.log(`MapInteractionHandler.handleRouteDragComplete: Received insertIndex: ${insertIndex}, coords: ${JSON.stringify(coords)}, dragData: ${JSON.stringify(dragData)}`);
    
    // LOCK CHECK: Prevent route drag completion when editing is locked
    if (this.isMapClicksDisabled || window.isEditLocked === true) {
      console.log('🔒 MapInteractionHandler: Ignoring route drag completion - editing is locked');
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator('🔒 Flight is locked - Click unlock button to edit', 'warning', 2000);
      }
      return;
    }
    
    if (window._processingRouteDrag === true) {
      console.log('MapInteractionHandler: Ignoring duplicate route drag - already processing');
      return;
    }
    window._processingRouteDrag = true;
    
    try {
      const isWaypointMode = window.isWaypointModeActive === true;
      console.log(`MapInteractionHandler: Mode determined by window.isWaypointModeActive: ${isWaypointMode ? 'WAYPOINT' : 'NORMAL'}`);
      if (dragData) { 
          console.log(`MapInteractionHandler: Contextual dragData.isWaypointMode: ${dragData.isWaypointMode}`);
      }

      if (insertIndex === undefined || insertIndex === null || isNaN(parseInt(insertIndex))) {
        console.error(`MapInteractionHandler: Invalid insertIndex: ${insertIndex}, defaulting to 0.`);
        insertIndex = 0;
      }
      insertIndex = parseInt(insertIndex);
      
      if (!this.waypointManager || typeof this.waypointManager.addWaypointAtIndex !== 'function') {
        console.error('MapInteractionHandler: WaypointManager or addWaypointAtIndex is missing.');
        window._processingRouteDrag = false;
        return;
      }
      
      const currentWaypoints = this.waypointManager.getWaypoints();
      const waypointCount = Array.isArray(currentWaypoints) ? currentWaypoints.length : 0;
      if (insertIndex < 0) insertIndex = 0;
      if (insertIndex > waypointCount) insertIndex = waypointCount;
      
      console.log(`MapInteractionHandler: Using validated insertIndex: ${insertIndex}`);
      
      const map = this.mapManager.getMap(); // Get map instance for queryRenderedFeatures

      if (isWaypointMode) {
        let snappedToFeature = false;
        // Priority 1: Check for a direct feature hit at the drag-end point
        if (map && dragData.point && typeof dragData.point.x === 'number' && typeof dragData.point.y === 'number') {
            const osdkWaypointLayers = ['osdk-waypoints-layer'].filter(id => map.getLayer(id));
            if (osdkWaypointLayers.length > 0) {
                // Query a larger bounding box around the drag end point
                const pixelRadius = 15; // Increased to 15-pixel radius
                const queryBBox = [
                  [dragData.point.x - pixelRadius, dragData.point.y - pixelRadius],
                  [dragData.point.x + pixelRadius, dragData.point.y + pixelRadius]
                ];
                console.log(`MapInteractionHandler (Waypoint Mode): Querying rendered features in BBox:`, queryBBox, `on layers:`, osdkWaypointLayers);
                const features = map.queryRenderedFeatures(queryBBox, { layers: osdkWaypointLayers });
                
                if (features && features.length > 0) {
                    console.log(`MapInteractionHandler (Waypoint Mode): Found ${features.length} features in BBox query.`);
                    let closestFeature = null;
                    let minDistance = Infinity;

                    if (window.turf) {
                        const dragEndPt = window.turf.point(coords);
                        features.forEach(f => {
                            const featurePt = window.turf.point(f.geometry.coordinates);
                            const dist = window.turf.distance(dragEndPt, featurePt, { units: 'kilometers' }); // turf.distance is fine
                            if (dist < minDistance) {
                                minDistance = dist;
                                closestFeature = f;
                            }
                        });
                    } else {
                        // Fallback if turf is not available, just take the first feature
                        console.warn("Turf.js not available, taking the first feature from queryRenderedFeatures.");
                        closestFeature = features[0];
                    }

                    if (closestFeature) {
                        const props = closestFeature.properties;
                        const featureCoords = closestFeature.geometry.coordinates.slice();
                        console.log(`MapInteractionHandler (Waypoint Mode): Snapping to CLOSEST OSDK Waypoint via queryRenderedFeatures: ${props.name} at index ${insertIndex}`);
                        if (window.LoadingIndicator) window.LoadingIndicator.updateStatusIndicator(`Snapped to waypoint: ${props.name} (direct drop)`, 'success', 2000);
                        this.waypointManager.addWaypointAtIndex(
                            featureCoords, 
                            props.name, 
                            insertIndex, 
                            { isWaypoint: true, type: 'WAYPOINT', pointType: 'NAVIGATION_WAYPOINT' }
                        );
                        snappedToFeature = true;
                    }
                }
            }
        }

        // Priority 2: If no feature found via queryRenderedFeatures, try findNearestOsdkWaypoint
        if (!snappedToFeature) {
            let nearestOsdkWp = null;
            const searchRadiusNM = 25; 
            if (this.platformManager && typeof this.platformManager.findNearestOsdkWaypoint === 'function') {
              nearestOsdkWp = this.platformManager.findNearestOsdkWaypoint(coords[1], coords[0], searchRadiusNM);
            }
            
            if (nearestOsdkWp && nearestOsdkWp.distance < searchRadiusNM) {
              console.log(`MapInteractionHandler (Waypoint Mode): Snapping to OSDK Waypoint via findNearest (fallback): ${nearestOsdkWp.name} (dist: ${nearestOsdkWp.distance.toFixed(1)}nm) at index ${insertIndex}`);
              if (window.LoadingIndicator) window.LoadingIndicator.updateStatusIndicator(`Snapped to waypoint: ${nearestOsdkWp.name} (${nearestOsdkWp.distance.toFixed(1)} nm away)`, 'success', 2000);
              this.waypointManager.addWaypointAtIndex(
                nearestOsdkWp.coordinates, 
                nearestOsdkWp.name, 
                insertIndex, 
                { isWaypoint: true, type: 'WAYPOINT', pointType: 'NAVIGATION_WAYPOINT' }
              );
            } else {
              console.log(`MapInteractionHandler (Waypoint Mode): No nearby OSDK waypoint (direct or findNearest within ${searchRadiusNM}nm), adding generic waypoint at index ${insertIndex}`);
              const genericName = `Waypoint ${insertIndex + 1}`;
              this.waypointManager.addWaypointAtIndex(
                coords, 
                genericName, 
                insertIndex, 
                { isWaypoint: true, type: 'WAYPOINT', pointType: 'NAVIGATION_WAYPOINT' }
              );
            }
        }
      } else {
        // NORMAL MODE: Only look for platforms (rigs/airports)
        let nearestPlatform = null;
        const searchRadiusPlatformsNM = 10; 
        if (this.platformManager && typeof this.platformManager.findNearestPlatform === 'function') {
          nearestPlatform = this.platformManager.findNearestPlatform(coords[1], coords[0], searchRadiusPlatformsNM);
        }
        
        if (nearestPlatform && nearestPlatform.distance < searchRadiusPlatformsNM) {
          console.log(`MapInteractionHandler (Normal Mode): Snapping to Platform: ${nearestPlatform.name} (dist: ${nearestPlatform.distance.toFixed(1)}nm) at index ${insertIndex}`);
          if (window.LoadingIndicator) window.LoadingIndicator.updateStatusIndicator(`Snapped to ${nearestPlatform.name} (${nearestPlatform.distance.toFixed(1)} nm away)`, 'success', 2000);
          this.waypointManager.addWaypointAtIndex(
            nearestPlatform.coordinates, 
            nearestPlatform.name, 
            insertIndex, 
            { isWaypoint: false, type: 'STOP', pointType: 'LANDING_STOP' }
          );
        } else {
          console.log(`MapInteractionHandler (Normal Mode): No nearby platform within ${searchRadiusPlatformsNM}nm, adding generic stop at index ${insertIndex}`);
          const genericName = `Stop ${insertIndex + 1}`;
          this.waypointManager.addWaypointAtIndex(
            coords, 
            genericName, 
            insertIndex, 
            { isWaypoint: false, type: 'STOP', pointType: 'LANDING_STOP' }
          );
        }
      }
      console.log(`MapInteractionHandler: Add operation completed for index ${insertIndex}.`);
    } catch (err) {
      console.error('MapInteractionHandler: Error in handleRouteDragComplete snapping logic:', err);
      const fallbackIsWaypoint = window.isWaypointModeActive === true; 
      this.waypointManager.addWaypointAtIndex(
        coords, 
        fallbackIsWaypoint ? `Wpt ${insertIndex + 1}` : `Stop ${insertIndex + 1}`, 
        insertIndex, 
        { isWaypoint: fallbackIsWaypoint, type: fallbackIsWaypoint ? 'WAYPOINT' : 'STOP', pointType: fallbackIsWaypoint ? 'NAVIGATION_WAYPOINT' : 'LANDING_STOP'}
      );
    } finally {
      setTimeout(() => {
        window._processingRouteDrag = false;
        console.log('MapInteractionHandler: Route drag processing complete, cleared flag');
      }, 300);
    }
  }
  
  addClickedPoint(lngLat) {
    const isWaypointMode = window.isWaypointModeActive === true;
    if (this.callbacks.onMapClick) {
      this.triggerCallback('onMapClick', { lngLat: lngLat, coordinates: [lngLat.lng, lngLat.lat], mapClickSource: 'fallback', isWaypointMode: isWaypointMode });
    } else {
      if (this.waypointManager) {
        this.waypointManager.addWaypoint([lngLat.lng, lngLat.lat], isWaypointMode ? `Waypoint ${this.waypointManager.getWaypoints().length + 1}` : `Stop ${this.waypointManager.getWaypoints().length + 1}`, { isWaypoint: isWaypointMode, type: isWaypointMode ? 'WAYPOINT' : 'STOP', pointType: isWaypointMode ? 'NAVIGATION_WAYPOINT' : 'LANDING_STOP' });
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
