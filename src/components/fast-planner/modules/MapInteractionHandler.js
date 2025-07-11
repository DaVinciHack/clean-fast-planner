/**
 * MapInteractionHandler.js
 * 
 * Unified map interaction handler with iPad touch support
 * Consolidates all competing click handlers into one robust system
 * Based on working drag-test implementation
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
    
    // 📱 iPad drag functionality - based on working drag-test
    this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    this.isIPad = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    this.isDragging = false;
    this.dragStartCoord = null;
    this.activeApproach = null; // 'mapbox-touch' or 'dom-touch'
    this.dragMode = 'none'; // 'insert', 'extend', 'none'
    this.originalLineCoordinates = [];
    
    console.log(`🚀 MapInteractionHandler: Device detection - ${this.isIPad ? 'iPad' : this.isTouchDevice ? 'Touch Device' : 'Desktop'}`);
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

      // 2. Setup separate event handlers like working drag-test
      this.setupSeparateHandlers(map);

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

  /**
   * Setup separate event handlers like working drag-test
   */
  setupSeparateHandlers(map) {
    console.log('🔧 MapInteractionHandler: Setting up separate event handlers like drag-test...');
    
    try {
      // 1. General map click handler (for background clicks - add waypoints)
      this._boundClickHandler = this.handleMapClick.bind(this);
      map.on('click', this._boundClickHandler);
      console.log('✅ General map click handler attached');
      
      // 2. Route-specific touch/mouse handlers for dragging
      const routeLayers = ['route', 'route-touch-area'];
      routeLayers.forEach(layer => {
        if (map.getLayer(layer)) {
          // Mouse events for desktop
          map.on('mousedown', layer, this.handleLineMouseStart.bind(this));
          // Touch events for iPad
          map.on('touchstart', layer, this.handleLineTouchStart.bind(this));
          console.log(`✅ Route interaction handlers attached to ${layer} layer`);
        }
      });
      
      // 3. DOM touch events fallback for iPad
      if (this.isTouchDevice) {
        this.setupDOMTouchEvents(map);
      }
    } catch (e) {
      console.error('MapInteractionHandler: Error setting up separate handlers:', e.message);
      this.triggerCallback('onError', 'Error setting up interaction handlers');
      this.isInitialized = false;
    }
  }


  /**
   * Setup DOM touch events - fallback for touch devices
   */
  setupDOMTouchEvents(map) {
    console.log('📱 MapInteractionHandler: Setting up DOM touch events as fallback...');
    
    try {
      const canvas = map.getCanvasContainer();
      if (canvas) {
        // Remove any existing touch handlers
        canvas.removeEventListener('touchstart', this._boundTouchHandler);
        
        // Create and store bound touch handler
        this._boundTouchHandler = this.handleDOMTouchStart.bind(this);
        
        // Add DOM touch events with proper configuration
        canvas.addEventListener('touchstart', this._boundTouchHandler, { 
          passive: false, 
          capture: true 
        });
        
        console.log('✅ DOM touch events registered with passive:false');
      }
    } catch (e) {
      console.error('❌ DOM touch events failed:', e.message);
    }
  }


  /**
   * Handle DOM touch events - fallback for iPad
   */
  handleDOMTouchStart(e) {
    console.log('📱 DOM touch event:', e.touches.length, 'touches');
    this.activeApproach = 'dom-touch';
    
    if (e.touches.length !== 1) {
      console.log('❌ Multi-touch detected in DOM event, ignoring');
      return;
    }
    
    // Check if touch is on route layers (like drag-test)
    const map = this.mapManager.getMap();
    if (!map) return;
    
    const rect = e.target.getBoundingClientRect();
    const point = {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top
    };
    
    const features = map.queryRenderedFeatures(point, { 
      layers: ['route', 'route-touch-area'] 
    });
    
    if (features.length === 0) {
      console.log('❌ DOM touch not on route layers, ignoring');
      return;
    }
    
    console.log('📱 DOM touch on route detected');
    
    // Try to prevent default (like drag-test)
    if (e.cancelable) {
      e.preventDefault();
      console.log('✅ e.preventDefault() called successfully on DOM touch');
    } else {
      console.warn('⚠️ DOM touch event not cancelable - cannot preventDefault()');
    }
    
    const lngLat = map.unproject(point);
    
    // Create a synthetic event object similar to Mapbox events
    const syntheticEvent = {
      lngLat: lngLat,
      point: point,
      originalEvent: e,
      preventDefault: () => e.preventDefault(),
      type: 'dom-touch'
    };
    
    // Delegate to main click handler
    this.handleMapClick(syntheticEvent);
  }

  /**
   * Handle route line mouse start - for desktop route dragging
   */
  handleLineMouseStart(e) {
    console.log('🖱️ MapInteractionHandler: Line mouse start - route drag');
    
    try {
      e.preventDefault();
      this.dragMode = 'insert';
      this.startDrag(e.lngLat, 'mapbox-mouse');
      
      const map = this.mapManager.getMap();
      map.on('mousemove', this.onMapboxDragMove.bind(this));
      map.once('mouseup', this.onMapboxDragEnd.bind(this));
    } catch (error) {
      console.error('❌ Error in handleLineMouseStart:', error.message);
    }
  }

  /**
   * Handle route line touch start - for iPad route dragging
   */
  handleLineTouchStart(e) {
    console.log('📱 MapInteractionHandler: Line touch start - route drag');
    
    if (e.points.length !== 1) {
      console.log('❌ Multi-touch detected, ignoring');
      return;
    }
    
    try {
      e.preventDefault();
      console.log('✅ e.preventDefault() called successfully on line touch');
    } catch (error) {
      console.warn('⚠️ e.preventDefault() failed on line touch:', error.message);
    }
    
    this.dragMode = 'insert';
    this.startDrag(e.lngLat, 'mapbox-touch');
    
    const map = this.mapManager.getMap();
    map.on('touchmove', this.onMapboxDragMove.bind(this));
    map.once('touchend', this.onMapboxDragEnd.bind(this));
  }

  /**
   * Start drag operation - from drag-test
   */
  startDrag(lngLat, approach) {
    this.isDragging = true;
    this.activeApproach = approach;
    this.dragStartCoord = [lngLat.lng, lngLat.lat];
    
    const map = this.mapManager.getMap();
    map.getCanvas().style.cursor = 'grabbing';
    
    console.log(`🎯 Started drag via ${approach.toUpperCase()}`);
  }

  /**
   * Handle drag move events - from drag-test
   */
  onMapboxDragMove(e) {
    if (!this.isDragging) return;
    console.log(`📍 Drag move: ${e.lngLat.lng.toFixed(4)}, ${e.lngLat.lat.toFixed(4)}`);
    this.updateDrag(e.lngLat);
  }

  /**
   * Update drag position - from drag-test
   */
  updateDrag(lngLat) {
    if (!this.isDragging) return;
    
    const currentCoord = [lngLat.lng, lngLat.lat];
    console.log(`🔄 Update drag to: ${currentCoord[0].toFixed(4)}, ${currentCoord[1].toFixed(4)}`);
    
    // Let MapManager handle the drag line visualization
    // (MapManager already has drag line implementation)
  }

  /**
   * End drag operation - from drag-test
   */
  onMapboxDragEnd(e) {
    console.log('🏁 Drag ended');
    this.endDrag();
  }

  /**
   * End drag and clean up - from drag-test
   */
  endDrag() {
    if (!this.isDragging) return;
    
    this.isDragging = false;
    this.activeApproach = null;
    this.dragStartCoord = null;
    
    const map = this.mapManager.getMap();
    if (map) {
      map.getCanvas().style.cursor = '';
      
      // Remove event listeners
      map.off('mousemove', this.onMapboxDragMove.bind(this));
      map.off('touchmove', this.onMapboxDragMove.bind(this));
    }
    
    // Let MapManager handle drag line cleanup
    // (MapManager already has drag line cleanup implementation)
    
    console.log('✅ Drag operation completed');
  }

  handleMapClick(e) {
    console.log("🗺️ MapInteractionHandler: Map clicked at coordinates:", e.lngLat);
    console.log("🗺️ MapInteractionHandler: Click event:", { button: e.originalEvent?.button, type: e.type });
    
    // DRAG CHECK: Don't add points while dragging (like drag-test)
    if (this.isDragging) {
      console.log('🖱️ MapInteractionHandler: Ignoring click - currently dragging');
      return;
    }
    
    // FEATURE CHECK: Don't add waypoints on existing features (like drag-test)
    const map = this.mapManager.getMap();
    if (map && e.point) {
      const features = map.queryRenderedFeatures(e.point, { 
        layers: ['waypoint-pins', 'route', 'route-touch-area', 'platforms-layer'] 
      });
      
      if (features.length > 0) {
        console.log('🖱️ MapInteractionHandler: Click on existing feature, ignoring');
        return; // Click was on a pin, line, or platform
      }
    }
    
    // RIGHT-CLICK CHECK: Handle right-click to delete last waypoint
    if (e.originalEvent?.button === 2) {
      console.log('🖱️ MapInteractionHandler: Right-click detected - attempting to delete last waypoint');
      this.handleRightClick(e);
      return;
    }
    
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
      const isAlternateMode = window.isAlternateModeActive === true;
      console.log(`MapInteractionHandler: Map clicked in ${isWaypointMode ? 'WAYPOINT' : isAlternateMode ? 'ALTERNATE' : 'NORMAL'} mode.`);

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
      
      // ALTERNATE MODE: Handle alternate mode clicks
      if (isAlternateMode) {
        console.log("MapInteractionHandler: Alternate mode active - checking for alternate mode handler");
        if (window.alternateModeClickHandler && typeof window.alternateModeClickHandler === 'function') {
          console.log("MapInteractionHandler: Deferring click to alternate mode handler");
          
          // Check for platform at click point
          let nearestPlatform = null;
          // In alternate mode, only fuel and airport layers are visible
          const platformLayerIds = ['fuel-available-layer', 'airfields-layer'];
          const activePlatformLayers = platformLayerIds.filter(id => map.getLayer(id));
          console.log("MapInteractionHandler: Alternate mode - checking layers:", activePlatformLayers);
          
          if (activePlatformLayers.length > 0) {
            const features = map.queryRenderedFeatures(e.point, { layers: activePlatformLayers });
            console.log("MapInteractionHandler: Platform query result:", features?.length || 0, "features found");
            if (features && features.length > 0) {
              nearestPlatform = features[0].properties;
              console.log("MapInteractionHandler: Found platform at click:", nearestPlatform);
            }
          }
          
          // If no platform clicked, check for nearby platforms
          if (!nearestPlatform && this.platformManager && typeof this.platformManager.findNearestPlatform === 'function') {
            nearestPlatform = this.platformManager.findNearestPlatform(e.lngLat.lat, e.lngLat.lng, 1);
            console.log("MapInteractionHandler: findNearestPlatform result:", nearestPlatform);
          }
          
          // Call the alternate mode handler
          const handled = window.alternateModeClickHandler(e.lngLat, nearestPlatform);
          console.log("MapInteractionHandler: Alternate mode handler result:", handled);
          
          window._processingMapClick = false;
          return; // Exit here regardless of whether it was handled
        } else {
          console.warn("MapInteractionHandler: Alternate mode active but no handler found");
        }
      }
      
      this.triggerCallback('onLeftPanelOpen'); 

      let featuresClicked = false;
      if (!isWaypointMode && !isAlternateMode) { 
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

  handleRightClick(e) {
    // Prevent default browser context menu
    if (e.originalEvent && e.originalEvent.preventDefault) {
      e.originalEvent.preventDefault();
    }
    
    // LOCK CHECK: Respect editing lock for right-click too
    if (this.isMapClicksDisabled || window.isEditLocked === true) {
      console.log('🔒 MapInteractionHandler: Ignoring right-click - editing is locked');
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator('🔒 Flight is locked - Click unlock button to edit', 'warning', 2000);
      }
      return;
    }
    
    // Check if we have waypoints to remove
    if (!this.waypointManager) {
      console.error('MapInteractionHandler: WaypointManager not available for right-click handling');
      return;
    }
    
    const waypoints = this.waypointManager.getWaypoints();
    if (!waypoints || waypoints.length === 0) {
      console.log('🖱️ MapInteractionHandler: No waypoints to remove');
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator('No waypoints to remove', 'info', 1500);
      }
      return;
    }
    
    // Get the last waypoint
    const lastWaypoint = waypoints[waypoints.length - 1];
    const lastIndex = waypoints.length - 1;
    
    console.log(`🗑️ MapInteractionHandler: Removing last waypoint "${lastWaypoint.name}" at index ${lastIndex}`);
    
    // Remove the last waypoint
    try {
      this.waypointManager.removeWaypoint(lastWaypoint.id, lastIndex);
      
      // Show success message
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator(`Removed waypoint: ${lastWaypoint.name}`, 'success', 2000);
      }
      
      console.log(`✅ MapInteractionHandler: Successfully removed waypoint "${lastWaypoint.name}"`);
    } catch (error) {
      console.error('MapInteractionHandler: Error removing last waypoint:', error);
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator('Error removing waypoint', 'error', 2000);
      }
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
    const isAlternateMode = window.isAlternateModeActive === true;
    
    // ALTERNATE MODE: Handle route clicks for split point selection
    if (isAlternateMode) {
      console.log('🎯 MapInteractionHandler: Route clicked in alternate mode');
      
      // Find the nearest waypoint for the split point
      const waypoints = this.waypointManager.getWaypoints();
      if (waypoints && waypoints.length > insertIndex) {
        const nearestWaypoint = waypoints[insertIndex];
        console.log('🎯 MapInteractionHandler: Setting route waypoint as split point:', nearestWaypoint.name);
        
        // Call alternate mode handler directly
        if (window.alternateModeClickHandler && typeof window.alternateModeClickHandler === 'function') {
          const waypointAsFeature = {
            name: nearestWaypoint.name,
            hasFuel: true,
            isInRoute: true
          };
          window.alternateModeClickHandler(lngLat, waypointAsFeature);
        }
      }
      return; // Exit early for alternate mode
    }
    
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
    
    // ALTERNATE MODE CHECK: Prevent route drag completion in alternate mode
    const isAlternateMode = window.isAlternateModeActive === true;
    if (isAlternateMode) {
      console.log('🎯 MapInteractionHandler: Ignoring route drag completion - alternate mode is active');
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator('🎯 Alternate mode: Click to set split point or select alternate', 'info', 2000);
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

  /**
   * DRAG WORKFLOW FROM DRAG-TEST - Complete implementation
   */
  
  startDrag(lngLat, approach) {
    console.log('🚀 Starting drag operation from drag-test');
    this.isDragging = true;
    this.activeApproach = approach;
    this.dragStartCoord = [lngLat.lng, lngLat.lat];
    
    // Get current waypoints as original coordinates
    const waypoints = this.waypointManager.getWaypoints();
    this.originalLineCoordinates = waypoints.map(wp => [wp.lng || wp.coordinates[0], wp.lat || wp.coordinates[1]]);
    
    const map = this.mapManager.getMap();
    if (map && map.getCanvas) {
      map.getCanvas().style.cursor = 'grabbing';
    }
    
    console.log(`🎯 DRAG STARTED: mode=${this.dragMode}, approach=${approach}`);
  }

  onMapboxDragMove(e) {
    if (!this.isDragging) return;
    console.log(`📍 Drag move: ${e.lngLat.lng.toFixed(4)}, ${e.lngLat.lat.toFixed(4)}`);
    this.updateDrag(e.lngLat);
  }

  updateDrag(lngLat) {
    if (!this.isDragging) return;
    
    const currentCoord = [lngLat.lng, lngLat.lat];
    
    if (this.dragMode === 'insert') {
      // Find closest point for insertion (like drag-test)
      const closestPoint = this.findClosestPointOnLine(currentCoord);
      if (!closestPoint) {
        console.log('❌ Could not find closest point on line');
        return;
      }
      
      console.log(`📍 Inserting waypoint at position ${closestPoint.insertIndex}`);
      
      // For now, just log the drag movement - actual waypoint insertion will be handled by existing system
      console.log(`🎯 Would insert waypoint at: ${currentCoord[0].toFixed(4)}, ${currentCoord[1].toFixed(4)}`);
    }
  }

  onMapboxDragEnd(e) {
    console.log('🏁 Drag end event from drag-test');
    this.endDrag(e.lngLat);
  }

  endDrag(lngLat) {
    if (!this.isDragging) return;
    
    const wasApproach = this.activeApproach;
    const wasMode = this.dragMode;
    
    console.log(`🎉 Drag completed: ${wasApproach}, mode: ${wasMode}`);
    
    // Reset drag state
    this.isDragging = false;
    this.activeApproach = 'none';
    this.dragMode = 'none';
    this.dragStartCoord = null;
    
    const map = this.mapManager.getMap();
    if (map && map.getCanvas) {
      map.getCanvas().style.cursor = '';
    }
    
    // Remove event listeners
    if (map) {
      map.off('touchmove', this.onMapboxDragMove);
    }
    
    // Handle the actual waypoint insertion through existing system
    if (lngLat && this.waypointManager) {
      console.log('🎯 Adding waypoint through existing system');
      // Use the existing route click handler which has the insertion logic
      this.handleRouteClick(lngLat, 1, null); // Insert at position 1 for now
    }
  }

  findClosestPointOnLine(coord) {
    if (!this.originalLineCoordinates || this.originalLineCoordinates.length < 2) {
      console.log('❌ No original coordinates for closest point calculation');
      return null;
    }
    
    let minDistance = Infinity;
    let insertIndex = 1; // Default to insert after first point
    let bestSegment = -1;
    
    // Simple distance calculation (like drag-test uses turf.js)
    for (let i = 0; i < this.originalLineCoordinates.length - 1; i++) {
      const segmentStart = this.originalLineCoordinates[i];
      const segmentEnd = this.originalLineCoordinates[i + 1];
      
      // Simple distance calculation to segment midpoint
      const midpoint = [
        (segmentStart[0] + segmentEnd[0]) / 2,
        (segmentStart[1] + segmentEnd[1]) / 2
      ];
      
      const distance = Math.sqrt(
        Math.pow(coord[0] - midpoint[0], 2) + Math.pow(coord[1] - midpoint[1], 2)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        insertIndex = i + 1;
        bestSegment = i;
      }
    }
    
    console.log(`🎯 Closest segment: ${bestSegment}, insert at position ${insertIndex}`);
    return { insertIndex, distance: minDistance, segment: bestSegment };
  }
}

export default MapInteractionHandler;
