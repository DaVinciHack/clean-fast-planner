/**
 * MapInteractions.js
 * 
 * A clean, modular implementation of map interactions
 * that properly handles event propagation and prevents
 * conflicts with panel interactions.
 */

class MapInteractions {
  constructor(options = {}) {
    this.map = null;
    this.waypointManager = null;
    this.platformManager = null;
    this.config = {
      enableDrag: true,
      enableMapClick: true,
      debounceTime: 500,
      ...options
    };
    
    // Tracking state
    this.lastClickTime = 0;
    this.lastClickCoords = null;
    this.isDragging = false;
    this.isRouteDragging = false;
    
    // Bound methods to maintain proper 'this' context
    this.handleMapClick = this.handleMapClick.bind(this);
    this.handleRightClick = this.handleRightClick.bind(this);
    this.handlePlatformClick = this.handlePlatformClick.bind(this);
    this.handleRouteClick = this.handleRouteClick.bind(this);
    this.setupEventHandlers = this.setupEventHandlers.bind(this);
    this.removeEventHandlers = this.removeEventHandlers.bind(this);
    
    // Callbacks
    this.callbacks = {
      onMapClick: null,
      onPlatformClick: null,
      onRouteClick: null,
      onError: null
    };
  }
  
  /**
   * Initialize with required dependencies
   */
  initialize(mapInstance, waypointManager, platformManager) {
    if (!mapInstance) {
      console.error('Map instance is required for MapInteractions');
      this.triggerCallback('onError', new Error('Map instance is required'));
      return false;
    }
    
    // Wait for map to be fully loaded
    if (typeof mapInstance.on !== 'function') {
      console.error('Invalid map instance provided: missing .on method');
      this.triggerCallback('onError', new Error('Invalid map instance'));
      return false;
    }
    
    this.map = mapInstance;
    this.waypointManager = waypointManager;
    this.platformManager = platformManager;
    
    // Check if the map is fully loaded and has needed methods
    if (typeof this.map.getLayer !== 'function' || 
        typeof this.map.addLayer !== 'function') {
      console.warn('Map instance may not be fully initialized yet');
      
      // Set up event handlers when map is loaded
      if (!this.map.loaded()) {
        console.log('Map not loaded yet, waiting for load event');
        this.map.once('load', () => {
          console.log('Map load event fired, setting up event handlers');
          this.setupEventHandlers();
        });
      } else {
        // Map is loaded but doesn't have expected methods
        console.error('Map is loaded but missing required methods');
        this.triggerCallback('onError', new Error('Invalid map state'));
        return false;
      }
    } else {
      // Map is already loaded, set up event handlers
      this.setupEventHandlers();
    }
    
    // Flag as initialized for global tracking
    window.mapHandlersInitialized = true;
    
    console.log('MapInteractions successfully initialized');
    return true;
  }
  
  /**
   * Set up map event handlers with clean separation
   */
  setupEventHandlers() {
    if (!this.map) {
      console.error('Map not available for setupEventHandlers');
      return false;
    }
    
    const map = this.map;
    
    try {
      // Map click handler
      if (this.config.enableMapClick) {
        // First remove any existing handlers to prevent duplicates
        map.off('click', this.handleMapClick);
        map.on('click', this.handleMapClick);
        console.log('Added map click handler');
        
        // 🖱️ RIGHT-CLICK: Add separate contextmenu handler for right-click detection
        map.off('contextmenu', this.handleRightClick);
        map.on('contextmenu', this.handleRightClick);
        console.log('Added map right-click (contextmenu) handler');
      }
      
      // Set up platform layer handlers if they exist or when they're created
      const setupPlatformHandlers = () => {
        const platformLayers = [
          'platforms-fixed-layer',
          'platforms-movable-layer',
          'airfields-layer'
        ];
        
        // Check if any platform layers exist
        const layerExists = platformLayers.some(layer => map.getLayer(layer));
        
        if (layerExists) {
          // Setup handlers for each layer
          platformLayers.forEach(layerId => {
            if (map.getLayer(layerId)) {
              // First remove any existing handlers to prevent duplicates
              map.off('click', layerId, this.handlePlatformClick);
              map.on('click', layerId, this.handlePlatformClick);
              
              // Add hover effect
              map.off('mouseenter', layerId);
              map.on('mouseenter', layerId, () => {
                map.getCanvas().style.cursor = 'pointer';
              });
              
              map.off('mouseleave', layerId);
              map.on('mouseleave', layerId, () => {
                map.getCanvas().style.cursor = '';
              });
              
              console.log(`Added handlers for platform layer: ${layerId}`);
            }
          });
        } else {
          // No platform layers yet - wait for source events
          console.log('No platform layers exist yet, will listen for them to be added');
          
          // Listen for sourcedata event to detect when layers are added
          const sourceDataListener = (e) => {
            if (e.sourceID === 'major-platforms' || e.sourceId === 'major-platforms') {
              // Check if layers now exist
              const nowExists = platformLayers.some(layer => map.getLayer(layer));
              if (nowExists) {
                console.log('Platform layers detected, adding handlers');
                map.off('sourcedata', sourceDataListener);
                setupPlatformHandlers();
              }
            }
          };
          
          // Add the listener
          map.on('sourcedata', sourceDataListener);
        }
      };
      
      // Call function to set up platform handlers
      setupPlatformHandlers();
      
      // Set up route layer handlers
      const setupRouteHandlers = () => {
        // Check if any route layer exists - updated with actual layer names
        const routeLayers = ['route', 'route-pills', 'route-drag-detection-layer'];
        const hasRouteLayer = routeLayers.some(layerId => map.getLayer(layerId));
        
        if (hasRouteLayer) {
          // Register route click handlers on all route layers
          routeLayers.forEach(layerId => {
            if (map.getLayer(layerId)) {
              console.log(`🎯 MapInteractions: Registering click handler on layer: ${layerId}`);
              map.off('click', layerId, this.handleRouteClick);
              map.on('click', layerId, this.handleRouteClick);
            }
          });
          
          // Setup route drag functionality if enabled
          if (this.config.enableDrag) {
            this.setupRouteDragHandlers();
          }
          
          // Add hover effect for route
          map.off('mouseenter', 'route');
          map.on('mouseenter', 'route', () => {
            if (!this.isDragging) {
              map.getCanvas().style.cursor = 'pointer';
            }
          });
          
          map.off('mouseleave', 'route');
          map.on('mouseleave', 'route', () => {
            if (!this.isDragging) {
              map.getCanvas().style.cursor = '';
            }
          });
          
          console.log('Added route handlers');
        } else {
          // No route layer yet - wait for it to be added
          console.log('No route layer exists yet, will listen for it to be added');
          
          // Listen for sourcedata event to detect when the route layer is added
          const sourceDataListener = (e) => {
            if (e.sourceID === 'route' || e.sourceId === 'route') {
              if (map.getLayer('route')) {
                console.log('Route layer detected, adding handlers');
                map.off('sourcedata', sourceDataListener);
                setupRouteHandlers();
              }
            }
          };
          
          // Add the listener
          map.on('sourcedata', sourceDataListener);
        }
      };
      
      // Call function to set up route handlers
      setupRouteHandlers();
      
      // Add event listeners to panels to prevent event propagation
      this.setupPanelEventHandlers();
      
      return true;
    } catch (error) {
      console.error('Error setting up map event handlers:', error);
      return false;
    }
  }
  
  /**
   * Add event handlers to panels to prevent click events from reaching the map
   */
  setupPanelEventHandlers() {
    // Find all panels
    const panels = document.querySelectorAll('.left-panel, .right-panel, .route-stats-card');
    
    panels.forEach(panel => {
      if (!panel._mapInteractionHandler) {
        panel._mapInteractionHandler = true;
        
        // Prevent clicks from propagating to map
        panel.addEventListener('click', e => {
          e.stopPropagation();
        }, true);
        
        // Prevent mousedown from propagating to map
        panel.addEventListener('mousedown', e => {
          e.stopPropagation();
        }, true);
        
        console.log(`Added event handlers to panel: ${panel.className}`);
      }
    });
    
    // Add global CSS to ensure panels are above map and receive events
    if (!document.getElementById('map-interactions-css')) {
      const style = document.createElement('style');
      style.id = 'map-interactions-css';
      style.innerHTML = `
        .left-panel, .right-panel, .route-stats-card {
          position: relative;
          z-index: 10;
          pointer-events: auto;
        }
        
        .left-panel *, .right-panel *, .route-stats-card * {
          pointer-events: auto;
        }
      `;
      document.head.appendChild(style);
    }
  }
  
  /**
   * Set up dragging handlers for the route
   */
  setupRouteDragHandlers() {
    const map = this.map;
    
    // Track drag state
    map.on('mousedown', 'route', e => {
      // Prevent the event from propagating to the map
      e.preventDefault();
      e.originalEvent.stopPropagation();
      
      this.isDragging = true;
      this.isRouteDragging = true;
      this.dragStartPoint = e.point;
      
      // Change cursor
      map.getCanvas().style.cursor = 'grab';
    });
    
    // Update cursor during drag
    map.on('mousemove', e => {
      if (this.isDragging) {
        map.getCanvas().style.cursor = 'grabbing';
      }
    });
    
    // Handle drag completion
    map.on('mouseup', e => {
      if (!this.isDragging || !this.isRouteDragging) return;
      
      // Reset state
      this.isDragging = false;
      this.isRouteDragging = false;
      
      // Reset cursor
      map.getCanvas().style.cursor = '';
      
      // Only process if drag distance was significant
      if (this.dragStartPoint && 
          Math.abs(e.point.x - this.dragStartPoint.x) + 
          Math.abs(e.point.y - this.dragStartPoint.y) > 5) {
        
        // Find the insert index (only if waypointManager is available)
        if (this.waypointManager && typeof this.waypointManager.findPathInsertIndex === 'function') {
          const insertIndex = this.waypointManager.findPathInsertIndex(e.lngLat);
          
          console.log(`Found route insert index: ${insertIndex}`);
          
          // Trigger the callback with all necessary information
          this.triggerCallback('onRouteClick', {
            lngLat: e.lngLat,
            point: e.point,
            insertIndex: insertIndex,
            isDragOperation: true
          });
        }
      }
      
      // Clear drag state
      this.dragStartPoint = null;
    });
  }
  
  /**
   * Handle map click events
   */
  handleMapClick(e) {
    // LOCK CHECK: Prevent map clicks when editing is locked
    if (window.isEditLocked === true) {
      console.log('🔒 MapInteractions: Ignoring click - editing is locked');
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator('🔒 Flight is locked - Click unlock button to edit', 'warning', 2000);
      }
      return;
    }
    
    // Prevent rapid clicks
    const now = Date.now();
    if (now - this.lastClickTime < this.config.debounceTime) {
      console.log('Debouncing map click');
      return;
    }
    this.lastClickTime = now;
    
    // Don't handle if panels are clicked
    if (this.isClickOnPanel(e.originalEvent)) {
      console.log('Click detected on panel, ignoring');
      return;
    }
    
    // Skip if dragging route
    if (this.isRouteDragging) {
      console.log('Ignoring map click during route drag');
      return;
    }
    
    console.log('Map clicked at:', e.lngLat);
    
    // Check if there's a platform near the click point
    let nearestPlatform = null;
    if (this.platformManager && typeof this.platformManager.findNearestPlatform === 'function') {
      nearestPlatform = this.platformManager.findNearestPlatform(e.lngLat.lat, e.lngLat.lng, 1);
      
      if (nearestPlatform && nearestPlatform.distance < 1) {
        console.log(`Found platform ${nearestPlatform.name} near click`);
      }
    }
    
    // Store the click coordinates
    this.lastClickCoords = [e.lngLat.lng, e.lngLat.lat];
    
    // Trigger the callback with all necessary information
    this.triggerCallback('onMapClick', {
      lngLat: e.lngLat,
      point: e.point,
      nearestPlatform: nearestPlatform
    });
  }
  
  /**
   * Handle right-click to delete the last waypoint
   */
  handleRightClick(e) {
    // Prevent default browser context menu
    e.preventDefault();
    console.log('🖱️ MapInteractions: Right-click contextmenu event received');
    
    // LOCK CHECK: Respect editing lock for right-click too
    if (window.isEditLocked === true) {
      console.log('🔒 MapInteractions: Ignoring right-click - editing is locked');
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator('🔒 Flight is locked - Click unlock button to edit', 'warning', 2000);
      }
      return;
    }
    
    // Check if we have waypoints to remove - try multiple sources
    let waypointManager = this.waypointManager;
    
    // If not available directly, try to get from window global
    if (!waypointManager && window.waypointManager) {
      waypointManager = window.waypointManager;
      console.log('🔍 MapInteractions: Using global window.waypointManager');
    }
    
    if (!waypointManager) {
      console.error('MapInteractions: WaypointManager not available for right-click handling');
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator('❌ WaypointManager not available', 'error', 2000);
      }
      return;
    }
    
    const waypoints = waypointManager.getWaypoints();
    if (!waypoints || waypoints.length === 0) {
      console.log('🖱️ MapInteractions: No waypoints to remove');
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator('No waypoints to remove', 'info', 1500);
      }
      return;
    }
    
    // Get the last waypoint
    const lastWaypoint = waypoints[waypoints.length - 1];
    const lastIndex = waypoints.length - 1;
    
    console.log(`🗑️ MapInteractions: Removing last waypoint "${lastWaypoint.name}" at index ${lastIndex}`);
    
    // Remove the last waypoint
    try {
      waypointManager.removeWaypoint(lastWaypoint.id, lastIndex);
      
      // Show success message
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator(`✅ Removed waypoint: ${lastWaypoint.name}`, 'success', 2000);
      }
      
      console.log(`✅ MapInteractions: Successfully removed waypoint "${lastWaypoint.name}"`);
    } catch (error) {
      console.error('MapInteractions: Error removing last waypoint:', error);
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator('❌ Error removing waypoint', 'error', 2000);
      }
    }
  }
  
  /**
   * Check if a click is on a panel element
   */
  isClickOnPanel(event) {
    // Check if the click target is a panel or inside a panel
    const target = event.target;
    
    // Walk up the DOM tree to find if any parent is a panel
    let element = target;
    while (element) {
      if (element.classList && 
          (element.classList.contains('left-panel') || 
           element.classList.contains('right-panel') || 
           element.classList.contains('route-stats-card'))) {
        return true;
      }
      element = element.parentElement;
    }
    
    return false;
  }
  
  /**
   * Handle platform click events
   */
  handlePlatformClick(e) {
    // LOCK CHECK: Prevent platform clicks when editing is locked
    if (window.isEditLocked === true) {
      console.log('🔒 MapInteractions: Ignoring platform click - editing is locked');
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator('🔒 Flight is locked - Click unlock button to edit', 'warning', 2000);
      }
      return;
    }
    
    // Prevent rapid clicks
    const now = Date.now();
    if (now - this.lastClickTime < this.config.debounceTime) {
      console.log('Debouncing platform click');
      return;
    }
    this.lastClickTime = now;
    
    // Prevent the event from propagating to the map
    e.preventDefault();
    e.originalEvent.stopPropagation();
    
    console.log('Platform clicked:', e.features[0].properties);
    
    // Get platform data from the feature
    const platformData = e.features[0].properties;
    
    // Store the click coordinates
    this.lastClickCoords = [e.lngLat.lng, e.lngLat.lat];
    
    // Trigger the callback with all necessary information
    this.triggerCallback('onPlatformClick', {
      lngLat: e.lngLat,
      properties: platformData,
      name: platformData.name || platformData.Name || 'Unknown Platform'
    });
  }
  
  /**
   * Handle route click events
   */
  handleRouteClick(e) {
    // Skip if we're dragging the route (will be handled by drag handler)
    if (this.isRouteDragging) return;
    
    // ALTERNATE MODE: Handle route clicks for split point selection
    if (window.isAlternateModeActive === true) {
      console.log('🎯 Route clicked in alternate mode');
      e.preventDefault();
      e.originalEvent.stopPropagation();
      
      // Find the nearest waypoint to this click
      if (this.waypointManager && typeof this.waypointManager.getWaypoints === 'function') {
        const waypoints = this.waypointManager.getWaypoints();
        let nearestWaypoint = null;
        let minDistance = Infinity;
        
        // Find the closest waypoint to the click
        waypoints.forEach((waypoint, index) => {
          // Handle different coordinate formats (including Palantir OSDK geoPoint)
          let lat, lng;
          if (waypoint.lat !== undefined && waypoint.lng !== undefined) {
            lat = waypoint.lat;
            lng = waypoint.lng;
          } else if (waypoint.latitude !== undefined && waypoint.longitude !== undefined) {
            lat = waypoint.latitude;
            lng = waypoint.longitude;
          } else if (waypoint.geoPoint) {
            // Palantir OSDK geoPoint format
            lat = waypoint.geoPoint.latitude;
            lng = waypoint.geoPoint.longitude;
          } else if (waypoint.coordinates && Array.isArray(waypoint.coordinates) && waypoint.coordinates.length >= 2) {
            lng = waypoint.coordinates[0];
            lat = waypoint.coordinates[1];
          } else if (waypoint.coords && Array.isArray(waypoint.coords) && waypoint.coords.length >= 2) {
            lng = waypoint.coords[0];
            lat = waypoint.coords[1];
          }
          
          if (lat !== undefined && lng !== undefined) {
            const distance = Math.sqrt(
              Math.pow(lat - e.lngLat.lat, 2) + 
              Math.pow(lng - e.lngLat.lng, 2)
            );
            if (distance < minDistance) {
              minDistance = distance;
              nearestWaypoint = waypoint;
            }
          }
        });
        
        if (nearestWaypoint) {
          console.log('🎯 Setting split point:', nearestWaypoint.name);
          
          // Call alternate mode handler
          if (window.alternateModeClickHandler && typeof window.alternateModeClickHandler === 'function') {
            const waypointAsFeature = {
              name: nearestWaypoint.name,
              hasFuel: true,
              isInRoute: true
            };
            window.alternateModeClickHandler(e.lngLat, waypointAsFeature);
          }
        }
      }
      return; // Exit early for alternate mode
    }
    
    // Prevent rapid clicks
    const now = Date.now();
    if (now - this.lastClickTime < this.config.debounceTime) {
      console.log('Debouncing route click');
      return;
    }
    this.lastClickTime = now;
    
    // Prevent the event from propagating to the map
    e.preventDefault();
    e.originalEvent.stopPropagation();
    
    console.log('Route clicked at:', e.lngLat);
    
    // Find the insert index (only if waypointManager is available)
    let insertIndex = 0;
    if (this.waypointManager && typeof this.waypointManager.findPathInsertIndex === 'function') {
      insertIndex = this.waypointManager.findPathInsertIndex(e.lngLat);
      console.log(`Found route insert index: ${insertIndex}`);
    }
    
    // Check if there's a platform near the click point
    let nearestPlatform = null;
    if (this.platformManager && typeof this.platformManager.findNearestPlatform === 'function') {
      nearestPlatform = this.platformManager.findNearestPlatform(e.lngLat.lat, e.lngLat.lng, 1);
      
      if (nearestPlatform && nearestPlatform.distance < 1) {
        console.log(`Found platform ${nearestPlatform.name} near route click`);
      }
    }
    
    // Store the click coordinates
    this.lastClickCoords = [e.lngLat.lng, e.lngLat.lat];
    
    // Trigger the callback with all necessary information
    this.triggerCallback('onRouteClick', {
      lngLat: e.lngLat,
      point: e.point,
      insertIndex: insertIndex,
      nearestPlatform: nearestPlatform,
      nearestRig: nearestPlatform // For backward compatibility
    });
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
        if (eventName !== 'onError' && 
            this.callbacks.onError && 
            typeof this.callbacks.onError === 'function') {
          this.callbacks.onError(error);
        }
      }
    }
  }
  
  /**
   * Remove event handlers when no longer needed
   */
  removeEventHandlers() {
    if (!this.map) return;
    
    // Remove map click handler
    this.map.off('click', this.handleMapClick);
    
    // Remove platform click handler
    if (this.map.getLayer('platforms')) {
      this.map.off('click', 'platforms', this.handlePlatformClick);
      this.map.off('mouseenter', 'platforms');
      this.map.off('mouseleave', 'platforms');
    }
    
    // Remove route click handler
    if (this.map.getLayer('route')) {
      this.map.off('click', 'route', this.handleRouteClick);
      this.map.off('mouseenter', 'route');
      this.map.off('mouseleave', 'route');
      
      // Remove drag handlers
      this.map.off('mousedown', 'route');
      this.map.off('mousemove');
      this.map.off('mouseup');
    }
    
    console.log('All map event handlers removed');
  }
  
  /**
   * Enable or disable map interactions
   */
  setEnabled(enabled) {
    if (enabled) {
      this.setupEventHandlers();
    } else {
      this.removeEventHandlers();
    }
  }
  
  /**
   * Clean up resources
   */
  destroy() {
    this.removeEventHandlers();
    this.map = null;
    this.waypointManager = null;
    this.platformManager = null;
    
    console.log('MapInteractions destroyed');
  }
}

export default MapInteractions;