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
        // Remove our specific handlers if they exist
        if (this._boundClickHandler) {
          map.off('click', this._boundClickHandler);
          console.log('MapInteractionHandler: Removed old _boundClickHandler.');
        }
        if (this._boundRightClickHandler) {
          map.off('contextmenu', this._boundRightClickHandler);
          console.log('MapInteractionHandler: Removed old _boundRightClickHandler.');
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

      // 4. CONSOLIDATION: Removed WaypointManager.setupRouteDragging call
      // MapInteractionHandler now handles all route dragging via setupSeparateHandlers
      console.log('MapInteractionHandler: Using consolidated drag system via setupSeparateHandlers.');
      
      // Keep style change listener for waypoint layer restoration
      if (this.waypointManager && typeof this.waypointManager.setupStyleChangeListener === 'function') {
        this.waypointManager.setupStyleChangeListener();
        console.log('MapInteractionHandler: Waypoint style change listener set up.');
      }

      // 5. Mark as initialized
      this.isInitialized = true;
      console.log('MapInteractionHandler: Map interactions (re)initialized successfully.');
    });

    // The initial call to initialize() still returns true to indicate it's queued.
    console.log('MapInteractionHandler: Initialization queued with onMapLoaded.');
    
    // 🔧 EMERGENCY FIX: Also try direct initialization if map is available
    const map = this.mapManager.getMap();
    if (map) {
      console.log('🔧 EMERGENCY: Map available, starting route layer monitoring directly');
      setTimeout(() => {
        this.startRouteLayerMonitor(map);
      }, 1000);
    }
    
    return true;
  }

  /**
   * Setup separate event handlers like working drag-test
   */
  setupSeparateHandlers(map) {
    console.log('🔧 MapInteractionHandler: Setting up separate event handlers like drag-test...');
    
    // Debug indicator removed for production
    
    try {
      // 1. General map click handler (for background clicks - add waypoints)
      this._boundClickHandler = this.handleMapClick.bind(this);
      map.on('click', this._boundClickHandler);
      console.log('✅ General map click handler attached');
      
      // 2. Right-click handler for waypoint removal
      this._boundRightClickHandler = this.handleRightClick.bind(this);
      map.on('contextmenu', this._boundRightClickHandler);
      console.log('✅ Right-click handler attached');
      
      // Platform handlers will be added separately when platforms load
      
      // 3. Route-specific touch/mouse handlers for dragging
      const routeLayers = ['route', 'route-drag-detection-layer'];
      console.log('🔍 Checking for route layers...');
      
      let foundLayers = [];
      routeLayers.forEach(layer => {
        if (map.getLayer(layer)) {
          foundLayers.push(layer);
          // Mouse events for desktop
          map.on('mousedown', layer, this.handleLineMouseStart.bind(this));
          // Touch events for iPad
          map.on('touchstart', layer, this.handleLineTouchStart.bind(this));
          console.log(`✅ Route interaction handlers attached to ${layer} layer`);
        }
      });
      
      // Also check what layers DO exist
      const allLayers = map.getStyle().layers;
      const layerNames = allLayers.map(l => l.id);
      
      // Find any route-related layers
      const routeRelatedLayers = layerNames.filter(name => 
        name.includes('route') || name.includes('waypoint') || name.includes('platform')
      );
      
      console.log(`Found route layers: ${foundLayers.join(', ') || 'NONE'}`);
      console.log(`${foundLayers.length > 0 ? '✅ Drag handlers attached!' : '❌ No route layers found!'}`);
      
      // Start periodic check for route layers appearing
      this.startRouteLayerMonitor(map);
      
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

  // Debug indicator methods removed for production

  startRouteLayerMonitor(map) {
    // Clear any existing monitor
    if (this.routeLayerMonitor) {
      clearInterval(this.routeLayerMonitor);
    }
    
    let checkCount = 0;
    this.routeLayerMonitor = setInterval(() => {
      checkCount++;
      
      const allLayers = map.getStyle().layers;
      const layerNames = allLayers.map(l => l.id);
      const routeRelatedLayers = layerNames.filter(name => 
        name.includes('route') || name.includes('waypoint') || name.includes('platform')
      );
      
      if (routeRelatedLayers.length > 0) {
        // Route layers found! Set up drag handlers
        console.log(`🎉 ROUTE LAYERS FOUND! (check ${checkCount}) - ${routeRelatedLayers.join(', ')}`);
        console.log(`🔍 ALL LAYERS ON MAP:`, layerNames);
        
        // Set up drag handlers for the found route layers
        const routeLayers = ['route', 'route-drag-detection-layer'];
        let foundLayers = [];
        
        routeLayers.forEach(layer => {
          if (map.getLayer(layer)) {
            foundLayers.push(layer);
            // Mouse events for desktop
            map.on('mousedown', layer, this.handleLineMouseStart.bind(this));
            // Touch events for iPad
            map.on('touchstart', layer, this.handleLineTouchStart.bind(this));
            // Cursor hover
            map.on('mouseenter', layer, () => {
              map.getCanvas().style.cursor = 'pointer';
            });
            map.on('mouseleave', layer, () => {
              map.getCanvas().style.cursor = '';
            });
          }
        });
        
        console.log(`✅ DRAG HANDLERS ATTACHED! (check ${checkCount}) - Found layers: ${foundLayers.join(', ')}`);
        
        // Additional route layers get touch only
        routeRelatedLayers.forEach(layer => {
          if (!foundLayers.includes(layer) && layer.includes('route')) {
            map.on('touchstart', layer, this.handleLineTouchStart.bind(this));
          }
        });
        
        // ✅ CRITICAL FIX: Only stop monitoring if we actually attached handlers to draggable layers
        if (foundLayers.length > 0) {
          console.log(`✅ SUCCESS: Attached handlers to ${foundLayers.length} draggable layers - stopping monitor`);
          clearInterval(this.routeLayerMonitor);
          this.routeLayerMonitor = null;
        } else {
          console.log(`❌ CONTINUE: Found route-related layers but no draggable layers - continuing monitor`);
        }
      } else if (checkCount >= 50) {
        // Stop after 50 checks to prevent infinite loop
        console.log(`❌ STOPPING MONITOR: After ${checkCount} checks - preventing infinite loop`);
        clearInterval(this.routeLayerMonitor);
        this.routeLayerMonitor = null;
      }
    }, 500); // Check every 500ms
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
        
        // Add DOM touch events with optimized configuration for iPad responsiveness
        canvas.addEventListener('touchstart', this._boundTouchHandler, { 
          passive: false, // Allow preventDefault for better control
          capture: true   // Capture early in event chain
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
    
    let features = [];
    try {
      features = map.queryRenderedFeatures(point, { 
        layers: ['route', 'route-drag-detection-layer'] 
      });
    } catch (error) {
      console.warn('⚠️ queryRenderedFeatures error:', error);
      return; // Skip if query fails
    }
    
    if (features.length === 0) {
      console.log('❌ DOM touch not on route layers, ignoring');
      return;
    }
    
    console.log('📱 DOM touch on route detected');
    
    // 🎯 IMMEDIATE VISUAL FEEDBACK - Change cursor instantly on DOM touch
    map.getCanvas().style.cursor = 'grabbing';
    console.log('✅ INSTANT FEEDBACK: DOM cursor changed to grabbing on touch');
    
    // Try to prevent default (like drag-test)
    const lngLat = map.unproject(point);
    if (e.cancelable) {
      e.preventDefault();
      console.log('✅ e.preventDefault() called successfully on DOM touch');
    } else {
      console.warn('⚠️ DOM touch event not cancelable - cannot preventDefault()');
    }
    
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
    console.log('🚀 DRAG TEST: handleLineMouseStart called! Route drag should work now!');
    console.log('🚀 DRAG STARTED! Mouse down on route line detected.');
    
    // LOCK CHECK: Prevent route dragging when editing is locked
    if (this.isMapClicksDisabled || window.isEditLocked === true) {
      console.log('🔒 MapInteractionHandler: Ignoring route drag start - editing is locked');
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator('🔒 Flight is locked - Click unlock button to edit', 'warning', 2000);
      }
      return;
    }
    
    // ALTERNATE MODE CHECK: Prevent route dragging in alternate mode
    const isAlternateMode = window.isAlternateModeActive === true;
    if (isAlternateMode) {
      console.log('🎯 MapInteractionHandler: Ignoring route drag start - alternate mode is active');
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator('🎯 Alternate mode: Click to set split point or select alternate', 'info', 2000);
      }
      return;
    }
    
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
    
    // LOCK CHECK: Prevent route dragging when editing is locked
    if (this.isMapClicksDisabled || window.isEditLocked === true) {
      console.log('🔒 MapInteractionHandler: Ignoring route drag start - editing is locked');
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator('🔒 Flight is locked - Click unlock button to edit', 'warning', 2000);
      }
      return;
    }
    
    // ALTERNATE MODE CHECK: Prevent route dragging in alternate mode
    const isAlternateMode = window.isAlternateModeActive === true;
    if (isAlternateMode) {
      console.log('🎯 MapInteractionHandler: Ignoring route drag start - alternate mode is active');
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator('🎯 Alternate mode: Click to set split point or select alternate', 'info', 2000);
      }
      return;
    }
    
    if (e.points.length !== 1) {
      console.log('❌ Multi-touch detected, ignoring');
      return;
    }
    
    // 🎯 IMMEDIATE VISUAL FEEDBACK - Change cursor instantly on touch
    const map = this.mapManager.getMap();
    if (map) {
      map.getCanvas().style.cursor = 'grabbing';
      console.log('✅ INSTANT FEEDBACK: Cursor changed to grabbing on touch');
    }
    
    try {
      e.preventDefault();
      e.stopPropagation(); // Prevent event bubbling
      console.log('✅ e.preventDefault() called successfully on line touch');
    } catch (error) {
      console.warn('⚠️ e.preventDefault() failed on line touch:', error.message);
    }
    
    this.dragMode = 'insert';
    this.startDrag(e.lngLat, 'mapbox-touch');
    
    // Reuse the map reference from above
    map.on('touchmove', this.onMapboxDragMove.bind(this));
    map.once('touchend', this.onMapboxDragEnd.bind(this));
  }

  // Visual feedback methods removed - keeping only touch sensitivity improvements

  // REMOVED: Incomplete startDrag method - using complete implementation from drag-test below

  // REMOVED: Incomplete onMapboxDragMove method - using complete implementation from drag-test below

  // REMOVED: Incomplete updateDrag method - using complete implementation from drag-test below

  // REMOVED: Incomplete onMapboxDragEnd method - using complete implementation from drag-test below

  // REMOVED: Incomplete endDrag method - using complete implementation from drag-test below

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
        layers: ['waypoint-pins', 'route', 'route-drag-detection-layer', 'platforms-layer'] 
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
    // Removed overly aggressive drag blocking - drag now has its own protection
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
    } else if (e.preventDefault) {
      e.preventDefault();
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
    const isAlternateMode = window.isAlternateModeActive === true;
    
    if (this.callbacks.onMapClick) {
      this.triggerCallback('onMapClick', { lngLat: lngLat, coordinates: [lngLat.lng, lngLat.lat], mapClickSource: 'directClick', isWaypointMode: isWaypointMode });
    } else {
      // ALTERNATE MODE CHECK: Prevent adding waypoints to main route in alternate mode
      if (isAlternateMode) {
        console.log('🎯 MapInteractionHandler: Ignoring waypoint add - alternate mode is active');
        if (window.LoadingIndicator) {
          window.LoadingIndicator.updateStatusIndicator('🎯 Alternate mode: Click on route for split point or rig for alternate', 'info', 2000);
        }
        return;
      }
      
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
    console.log('🚀 DRAG STARTED! Setting up drag state...');
    
    this.isDragging = true;
    this.activeApproach = approach;
    this.dragStartCoord = [lngLat.lng, lngLat.lat];
    this.dragStartTime = Date.now(); // Track when drag started
    
    // Set flag to prevent click conflicts
    window._isRouteDragging = true;
    
    // Get current waypoints as original coordinates
    const waypoints = this.waypointManager.getWaypoints();
    this.originalLineCoordinates = waypoints.map(wp => {
      // Handle different coordinate formats
      if (wp.lng !== undefined && wp.lat !== undefined) {
        return [wp.lng, wp.lat];
      } else if (wp.coordinates && wp.coordinates.length >= 2) {
        return [wp.coordinates[0], wp.coordinates[1]];
      } else if (wp.coords && wp.coords.length >= 2) {
        return [wp.coords[0], wp.coords[1]];
      } else {
        console.warn('⚠️ Waypoint has unexpected coordinate format:', wp);
        return [0, 0]; // Fallback coordinates
      }
    });
    
    // Calculate the correct insertion index based on where user clicked
    this.dragInsertIndex = this.findClosestSegmentIndex(this.dragStartCoord, this.originalLineCoordinates);
    console.log(`🎯 DRAG INSERTION INDEX: ${this.dragInsertIndex} (clicked on segment ${this.dragInsertIndex - 1} to ${this.dragInsertIndex})`);
    
    const map = this.mapManager.getMap();
    if (map && map.getCanvas) {
      map.getCanvas().style.cursor = 'grabbing';
    }
    
    console.log(`🎯 DRAG ACTIVE! Mode: ${this.dragMode}, Approach: ${approach}, Insert Index: ${this.dragInsertIndex}`);
    
    console.log(`🎯 DRAG STARTED: mode=${this.dragMode}, approach=${approach}, insertIndex=${this.dragInsertIndex}`);
  }

  onMapboxDragMove(e) {
    if (!this.isDragging) return;
    
    // Throttle drag updates to reduce flashing
    const now = Date.now();
    if (this.lastDragUpdate && now - this.lastDragUpdate < 16) { // ~60fps
      return;
    }
    this.lastDragUpdate = now;
    
    console.log(`📍 Drag move: ${e.lngLat.lng.toFixed(4)}, ${e.lngLat.lat.toFixed(4)}`);
    console.log(`🎯 DRAGGING! Position: ${e.lngLat.lng.toFixed(4)}, ${e.lngLat.lat.toFixed(4)}`);
    this.updateDrag(e.lngLat);
  }

  updateDrag(lngLat) {
    if (!this.isDragging) return;
    
    const currentCoord = [lngLat.lng, lngLat.lat];
    
    if (this.dragMode === 'insert') {
      // Update drag line visualization
      this.updateDragLine(currentCoord);
      console.log(`🎯 Drag updated: ${currentCoord[0].toFixed(4)}, ${currentCoord[1].toFixed(4)}`);
    }
  }

  findClosestSegmentIndex(clickPoint, routeCoords) {
    // Find which segment the user clicked on
    let closestSegmentIndex = 1; // Default to insert after first point
    let minDistance = Infinity;
    
    for (let i = 0; i < routeCoords.length - 1; i++) {
      const segmentStart = routeCoords[i];
      const segmentEnd = routeCoords[i + 1];
      
      // Calculate distance from click point to this segment
      const distance = this.pointToSegmentDistance(clickPoint, segmentStart, segmentEnd);
      
      if (distance < minDistance) {
        minDistance = distance;
        closestSegmentIndex = i + 1; // Insert after this segment's start point
      }
    }
    
    return closestSegmentIndex;
  }
  
  pointToSegmentDistance(point, segmentStart, segmentEnd) {
    // Calculate the distance from a point to a line segment
    const A = point[0] - segmentStart[0];
    const B = point[1] - segmentStart[1];
    const C = segmentEnd[0] - segmentStart[0];
    const D = segmentEnd[1] - segmentStart[1];
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) {
      // Degenerate case: segment is actually a point
      return Math.sqrt(A * A + B * B);
    }
    
    let param = dot / lenSq;
    let xx, yy;
    
    if (param < 0) {
      xx = segmentStart[0];
      yy = segmentStart[1];
    } else if (param > 1) {
      xx = segmentEnd[0];
      yy = segmentEnd[1];
    } else {
      xx = segmentStart[0] + param * C;
      yy = segmentStart[1] + param * D;
    }
    
    const dx = point[0] - xx;
    const dy = point[1] - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }

  updateDragLine(currentCoord) {
    const map = this.mapManager.getMap();
    if (!map) return;

    try {
      // Create drag line with insertion point calculated from drag start
      const waypoints = this.waypointManager.getWaypoints();
      const routeCoords = waypoints.map(wp => {
        // Handle different coordinate formats
        if (wp.lng !== undefined && wp.lat !== undefined) {
          return [wp.lng, wp.lat];
        } else if (wp.coordinates && wp.coordinates.length >= 2) {
          return [wp.coordinates[0], wp.coordinates[1]];
        } else if (wp.coords && wp.coords.length >= 2) {
          return [wp.coords[0], wp.coords[1]];
        } else {
          console.warn('⚠️ Waypoint has unexpected coordinate format in updateDragLine:', wp);
          return [0, 0]; // Fallback coordinates
        }
      });
      
      // Use the stored insertion index from drag start
      const insertIndex = this.dragInsertIndex || Math.floor(routeCoords.length / 2);
      
      // Insert the current drag point at the calculated position
      const dragLineCoords = [...routeCoords];
      dragLineCoords.splice(insertIndex, 0, currentCoord);
      
      // Update drag line more efficiently - update source data instead of removing/adding
      if (map.getSource('drag-line')) {
        // Update existing drag line data
        map.getSource('drag-line').setData({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: dragLineCoords
          }
        });
      } else {
        // Create drag line for the first time
        map.addSource('drag-line', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: dragLineCoords
            }
          }
        });
        
        map.addLayer({
          id: 'drag-line',
          type: 'line',
          source: 'drag-line',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#FF0000',
            'line-width': 3,
            'line-dasharray': [2, 1.5],
            'line-opacity': 0.8
          }
        });
        
        // Hide original route only once
        map.setLayoutProperty('route', 'visibility', 'none');
        if (map.getLayer('route-glow')) {
          map.setLayoutProperty('route-glow', 'visibility', 'none');
        }
      }
    } catch (error) {
      console.error('❌ Error updating drag line:', error);
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
    
    const map = this.mapManager.getMap();
    
    // Clean up drag line
    if (map && map.getSource('drag-line')) {
      map.removeLayer('drag-line');
      map.removeSource('drag-line');
    }
    
    // Restore original route
    if (map) {
      map.setLayoutProperty('route', 'visibility', 'visible');
      if (map.getLayer('route-glow')) {
        map.setLayoutProperty('route-glow', 'visibility', 'visible');
      }
    }
    
    // Set drag just finished flag to prevent immediate clicks
    window._routeDragJustFinished = true;
    setTimeout(() => {
      window._routeDragJustFinished = false;
    }, 100);
    
    // Reset drag state
    this.isDragging = false;
    this.activeApproach = 'none';
    this.dragMode = 'none';
    this.dragStartCoord = null;
    window._isRouteDragging = false;
    
    if (map && map.getCanvas) {
      map.getCanvas().style.cursor = '';
    }
    
    // Remove event listeners
    if (map) {
      map.off('touchmove', this.onMapboxDragMove);
    }
    
    // Add waypoint at drag end location using calculated insertion index
    if (lngLat && this.waypointManager) {
      console.log(`🎯 Adding waypoint at drag end: ${lngLat.lng.toFixed(4)}, ${lngLat.lat.toFixed(4)}`);
      
      // 🛡️ DRAG PROTECTION 1: Check if drag was held long enough (minimum 200ms)
      const dragDuration = Date.now() - this.dragStartTime;
      if (dragDuration < 200) {
        console.log('🚫 DRAG TOO SHORT: Ignoring quick tap/click - not a real drag');
        return;
      }
      
      const coords = [lngLat.lng, lngLat.lat];
      
      // 🛡️ DRAG PROTECTION 2: Check if too close to existing waypoints
      const waypoints = this.waypointManager.getWaypoints();
      for (const wp of waypoints) {
        const wpCoords = wp.coordinates || [wp.lng, wp.lat];
        const distance = this.calculateDistance(coords[1], coords[0], wpCoords[1], wpCoords[0]);
        if (distance < 0.1) { // Less than 0.1 miles
          console.log('🚫 TOO CLOSE: New point too close to existing waypoint:', wp.name);
          return;
        }
      }
      
      // 🛢️ SNAP TO RIG: Check for nearby rigs within 2 miles
      const snapResult = this.findNearbyRig(coords, 2.0);
      
      let finalCoords = coords;
      let waypointName = `Waypoint ${Date.now()}`;
      
      if (snapResult) {
        console.log(`🛢️ SNAP: Found nearby rig "${snapResult.name}" within 2 miles - snapping to it`);
        finalCoords = snapResult.coordinates;
        waypointName = snapResult.name;
        
        // 🛡️ DRAG PROTECTION 3: Check for duplicate names in sequence
        const insertIndex = this.dragInsertIndex || Math.floor(waypoints.length / 2);
        if (insertIndex > 0 && waypoints[insertIndex - 1]?.name === waypointName) {
          console.log('🚫 DUPLICATE NAME: Same name as previous waypoint:', waypointName);
          return;
        }
        if (insertIndex < waypoints.length && waypoints[insertIndex]?.name === waypointName) {
          console.log('🚫 DUPLICATE NAME: Same name as next waypoint:', waypointName);
          return;
        }
      } else {
        console.log('🎯 No nearby rigs found - adding waypoint at drop location');
      }
      
      // Calculate insertion index based on drag start position
      const routeCoords = waypoints.map(wp => {
        // Handle different coordinate formats
        if (wp.lng !== undefined && wp.lat !== undefined) {
          return [wp.lng, wp.lat];
        } else if (wp.coordinates && wp.coordinates.length >= 2) {
          return [wp.coordinates[0], wp.coordinates[1]];
        } else if (wp.coords && wp.coords.length >= 2) {
          return [wp.coords[0], wp.coords[1]];
        } else {
          console.warn('⚠️ Waypoint has unexpected coordinate format in endDrag:', wp);
          return [0, 0]; // Fallback coordinates
        }
      });
      
      // Use the stored insertion index from drag start
      const insertIndex = this.dragInsertIndex || Math.floor(routeCoords.length / 2);
      
      try {
        this.waypointManager.addWaypointAtIndex(finalCoords, waypointName, insertIndex);
        console.log(`✅ Successfully added waypoint: ${waypointName} at index ${insertIndex}`);
      } catch (error) {
        console.error('❌ Error adding waypoint:', error);
      }
    }
  }

  /**
   * Find nearby rig within specified distance for snapping
   * @param {Array} coords - [lng, lat] coordinates to search around
   * @param {number} maxDistanceMiles - Maximum distance in miles
   * @returns {Object|null} - {name, coordinates} or null if no rig found
   */
  findNearbyRig(coords, maxDistanceMiles = 2.0) {
    const [dropLng, dropLat] = coords;
    
    // Get platform data from platform manager
    if (!this.platformManager) {
      console.log('🛢️ No platform manager available for rig snapping');
      return null;
    }
    
    const platforms = this.platformManager.getPlatforms();
    if (!platforms || platforms.length === 0) {
      console.log('🛢️ No platforms available for rig snapping');
      return null;
    }
    
    console.log(`🛢️ Checking ${platforms.length} platforms for snapping within ${maxDistanceMiles} miles`);
    
    let closestRig = null;
    let minDistance = Infinity;
    
    platforms.forEach(platform => {
      // Handle different coordinate formats
      let platLng, platLat;
      
      if (platform.lng !== undefined && platform.lat !== undefined) {
        platLng = platform.lng;
        platLat = platform.lat;
      } else if (platform.coordinates && platform.coordinates.length >= 2) {
        platLng = platform.coordinates[0];
        platLat = platform.coordinates[1];
      } else if (platform.longitude !== undefined && platform.latitude !== undefined) {
        platLng = platform.longitude;
        platLat = platform.latitude;
      } else {
        console.warn('🛢️ Platform has unexpected coordinate format:', platform);
        return; // Skip this platform
      }
      
      // Calculate distance using simple haversine approximation
      const distance = this.calculateDistance(dropLat, dropLng, platLat, platLng);
      
      if (distance <= maxDistanceMiles && distance < minDistance) {
        minDistance = distance;
        closestRig = {
          name: platform.name || platform.id || `Platform_${platform.objectId || 'Unknown'}`,
          coordinates: [platLng, platLat],
          distance: distance
        };
      }
    });
    
    if (closestRig) {
      console.log(`🛢️ Found closest rig: "${closestRig.name}" at ${closestRig.distance.toFixed(3)} miles`);
    }
    
    return closestRig;
  }

  /**
   * Calculate distance between two points in miles using haversine formula
   * @param {number} lat1 - Latitude of first point
   * @param {number} lng1 - Longitude of first point  
   * @param {number} lat2 - Latitude of second point
   * @param {number} lng2 - Longitude of second point
   * @returns {number} Distance in miles
   */
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
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