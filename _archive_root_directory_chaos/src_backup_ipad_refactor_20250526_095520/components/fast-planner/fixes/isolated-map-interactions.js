/**
 * isolated-map-interactions.js
 * 
 * AGGRESSIVE FIX: Completely isolates all map interactions into a single controller
 * This overrides all other click handlers and provides a single source of truth
 */

console.log('🛡️ ISOLATED MAP INTERACTIONS: Initializing...');

// Global state to prevent re-initialization
window._isolatedMapInteractionsApplied = false;

// Create an isolated controller for map interactions
class IsolatedMapInteractionController {
  constructor() {
    // Core references
    this.map = null;
    this.mapManager = null;
    this.waypointManager = null;
    this.platformManager = null;
    
    // State tracking
    this.isWaypointMode = false;
    this.isDragging = false;
    this.lastClickTime = 0;
    this.lastClickCoords = null;
    this.isProcessingClick = false;
    this.clickQueue = [];
    
    // Click protection
    this.CLICK_DEBOUNCE_TIME = 500;  // ms
    
    // Bind methods to maintain context
    this.handleMapClick = this.handleMapClick.bind(this);
    this.handlePlatformClick = this.handlePlatformClick.bind(this);
    this.handleRouteClick = this.handleRouteClick.bind(this);
    this.addWaypoint = this.addWaypoint.bind(this);
    
    // Event interceptor
    this.clickEventInstalled = false;
    
    console.log('🛡️ IsolatedMapInteractionController created');
  }
  
  // Setup the controller with required managers
  setup() {
    console.log('🛡️ Setting up isolated map interactions...');
    
    // Get references to global managers
    this.mapManager = window.mapManager;
    this.waypointManager = window.waypointManager;
    this.platformManager = window.platformManager;
    
    if (!this.mapManager || !this.waypointManager) {
      console.log('🛡️ Required managers not available, will retry setup later');
      return false;
    }
    
    // Get map instance
    this.map = this.mapManager.getMap();
    if (!this.map) {
      console.log('🛡️ Map not available, will retry setup later');
      return false;
    }
    
    // Check for waypoint mode global setting
    this.isWaypointMode = window.isWaypointModeActive === true;
    
    // Clear ALL existing event handlers from the map
    this.clearAllMapHandlers();
    
    // Set up our handlers
    this.setupEventHandlers();
    
    // Set up a click event interceptor
    this.setupEventInterceptor();
    
    // Setup successful
    console.log('🛡️ Isolated map interactions successfully set up');
    
    // Show notification
    this.showNotification('Isolated map interactions enabled', 'success');
    
    return true;
  }
  
  // Remove ALL existing event handlers from the map
  clearAllMapHandlers() {
    try {
      console.log('🛡️ Clearing all existing map handlers...');
      
      if (!this.map) return;
      
      // First remove generic click handler
      this.map.off('click');
      
      // Then remove layer-specific click handlers
      const potentialLayers = [
        'platforms-fixed-layer',
        'platforms-movable-layer',
        'airfields-layer',
        'platforms-layer',
        'route',
        'major-platforms'
      ];
      
      potentialLayers.forEach(layer => {
        if (this.map.getLayer(layer)) {
          try {
            this.map.off('click', layer);
            console.log(`🛡️ Removed click handler from layer: ${layer}`);
          } catch (error) {
            console.log(`🛡️ Could not remove handler from layer ${layer}: ${error.message}`);
          }
        }
      });
      
      // Clear any other event listeners on the map container
      const mapContainer = this.map.getContainer();
      if (mapContainer) {
        // Clone the element to remove all listeners
        const newContainer = mapContainer.cloneNode(true);
        mapContainer.parentNode.replaceChild(newContainer, mapContainer);
        
        // Reconnect the map to the new container
        this.map._container = newContainer;
      }
      
      // Reset global flags
      window._boundClickHandler = null;
      window._mapClickHandler = null;
      window._lastMapClickTime = 0;
      window._isRouteDragging = false;
      window._routeDragJustFinished = false;
      
      console.log('🛡️ Successfully cleared all existing map handlers');
    } catch (error) {
      console.error('🛡️ Error clearing map handlers:', error);
    }
  }
  
  // Set up our isolated event handlers
  setupEventHandlers() {
    console.log('🛡️ Setting up isolated event handlers...');
    
    // Add map click handler
    this.map.on('click', this.handleMapClick);
    
    // Add platform-specific click handlers
    const platformLayers = [
      'platforms-fixed-layer',
      'platforms-movable-layer',
      'airfields-layer',
      'platforms-layer',
      'major-platforms'
    ].filter(layer => this.map.getLayer(layer));
    
    platformLayers.forEach(layer => {
      this.map.on('click', layer, this.handlePlatformClick);
      
      // Add hover styling
      this.map.on('mouseenter', layer, () => {
        this.map.getCanvas().style.cursor = 'pointer';
      });
      
      this.map.on('mouseleave', layer, () => {
        this.map.getCanvas().style.cursor = '';
      });
    });
    
    // Add route click handler if the route layer exists
    if (this.map.getLayer('route')) {
      this.map.on('click', 'route', this.handleRouteClick);
      
      // Add hover styling
      this.map.on('mouseenter', 'route', () => {
        this.map.getCanvas().style.cursor = 'pointer';
      });
      
      this.map.on('mouseleave', 'route', () => {
        this.map.getCanvas().style.cursor = '';
      });
      
      // Set up route dragging
      this.setupRouteDragging();
    }
    
    // Update waypoint mode flag when it changes
    window.addEventListener('waypoint-mode-changed', (e) => {
      this.isWaypointMode = e.detail.active;
      console.log(`🛡️ Waypoint mode changed to: ${this.isWaypointMode ? 'active' : 'inactive'}`);
    });
    
    console.log('🛡️ Isolated event handlers set up successfully');
  }
  
  // Set up route dragging functionality
  setupRouteDragging() {
    console.log('🛡️ Setting up route dragging...');
    
    try {
      // Handle drag start, during, and end
      this.map.on('mousedown', 'route', (e) => {
        // Set drag state flag
        this.isDragging = true;
        
        // Capture starting position
        this.dragStartPos = e.lngLat;
        
        // Change cursor
        this.map.getCanvas().style.cursor = 'grab';
        
        console.log('🛡️ Route drag started');
      });
      
      // Handle mouse move during drag
      this.map.on('mousemove', (e) => {
        if (!this.isDragging) return;
        
        // Change cursor
        this.map.getCanvas().style.cursor = 'grabbing';
      });
      
      // Handle drag end
      this.map.on('mouseup', (e) => {
        if (!this.isDragging) return;
        
        // Reset drag state
        this.isDragging = false;
        
        // Reset cursor
        this.map.getCanvas().style.cursor = '';
        
        // Handle the drop
        this.handleRouteDrop(e);
        
        console.log('🛡️ Route drag ended');
      });
      
      console.log('🛡️ Route dragging set up successfully');
    } catch (error) {
      console.error('🛡️ Error setting up route dragging:', error);
    }
  }
  
  // Handle dropping a point on the route
  handleRouteDrop(e) {
    console.log('🛡️ Handling route drop at', e.lngLat);
    
    try {
      // Find insert index for the drag point
      let insertIndex = null;
      if (this.waypointManager && typeof this.waypointManager.findPathInsertIndex === 'function') {
        insertIndex = this.waypointManager.findPathInsertIndex(e.lngLat);
      } else {
        // Fallback - find nearest segment
        insertIndex = this.findNearestRouteSegment(e.lngLat);
      }
      
      console.log(`🛡️ Route drop insert index: ${insertIndex}`);
      
      // Check for closest rig/platform
      let nearestRig = null;
      if (this.platformManager && typeof this.platformManager.findNearestPlatform === 'function') {
        nearestRig = this.platformManager.findNearestPlatform(e.lngLat.lat, e.lngLat.lng, 2);
      }
      
      // Build drop data for addWaypoint
      const dropData = {
        lngLat: e.lngLat,
        coords: [e.lngLat.lng, e.lngLat.lat],
        insertIndex: insertIndex,
        nearestRig: nearestRig,
        isWaypointMode: this.isWaypointMode,
        isDragDrop: true
      };
      
      // Add waypoint at the determined insert position
      this.addWaypoint(dropData);
    } catch (error) {
      console.error('🛡️ Error handling route drop:', error);
    }
  }
  
  // Fallback method to find nearest route segment
  findNearestRouteSegment(lngLat) {
    try {
      const waypoints = this.waypointManager.getWaypoints();
      if (!waypoints || waypoints.length < 2) return 0;
      
      let minDistance = Infinity;
      let insertIndex = 0;
      
      // Check distance to each segment
      for (let i = 0; i < waypoints.length - 1; i++) {
        const start = waypoints[i].coords;
        const end = waypoints[i + 1].coords;
        
        const distance = this.distanceToSegment(
          [lngLat.lng, lngLat.lat],
          start,
          end
        );
        
        if (distance < minDistance) {
          minDistance = distance;
          insertIndex = i + 1;  // Insert after the start point
        }
      }
      
      return insertIndex;
    } catch (error) {
      console.error('🛡️ Error finding nearest route segment:', error);
      return 0;
    }
  }
  
  // Calculate distance from point to line segment
  distanceToSegment(point, start, end) {
    const a = point[0] - start[0];
    const b = point[1] - start[1];
    const c = end[0] - start[0];
    const d = end[1] - start[1];
    
    const dot = a * c + b * d;
    const len_sq = c * c + d * d;
    let param = -1;
    
    if (len_sq !== 0) {
      param = dot / len_sq;
    }
    
    let xx, yy;
    
    if (param < 0) {
      xx = start[0];
      yy = start[1];
    } else if (param > 1) {
      xx = end[0];
      yy = end[1];
    } else {
      xx = start[0] + param * c;
      yy = start[1] + param * d;
    }
    
    const dx = point[0] - xx;
    const dy = point[1] - yy;
    
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  // Set up an event interceptor to catch click events
  setupEventInterceptor() {
    console.log('🛡️ Setting up event interception...');
    
    try {
      // Create a more direct approach that doesn't override native methods
      // We'll use a global click handler instead
      
      // Define elements that should handle their own clicks
      const allowedSelectors = [
        '.left-panel',
        '.right-panel',
        '.route-stats-card',
        '.stop-card',
        '.favorite-location',
        '.waypoint-item',
        'button',
        'input',
        'select',
        '.maplibregl-ctrl',
        '.mapboxgl-ctrl',
        '.maplibregl-popup',
        '.mapboxgl-popup'
      ].join(', ');
      
      // Add a global click handler to the document
      document.addEventListener('click', (event) => {
        // Don't interfere with clicks on UI elements
        if (event.target.closest(allowedSelectors)) {
          console.log('🛡️ Allowing UI element click');
          return true;
        }
        
        // Check if this is a map click (these should already be handled)
        const isMapClick = event.target.closest('.maplibregl-canvas') || 
                          event.target.closest('.mapboxgl-canvas');
        
        if (isMapClick) {
          console.log('🛡️ Allowing map click');
          return true;
        }
        
        // For any other click, see if it's on or within the map container
        // If so, we'll prevent propagation to avoid double clicks
        const mapContainer = this.map?.getContainer();
        if (mapContainer && (event.target === mapContainer || mapContainer.contains(event.target))) {
          console.log('🛡️ Detected click within map container, preventing propagation');
          event.stopPropagation();
          return false;
        }
        
        // Allow all other clicks to proceed normally
        return true;
      }, true); // Use capture phase
      
      console.log('🛡️ Event interception set up successfully');
    } catch (error) {
      console.error('🛡️ Error setting up event interception:', error);
    }
  }
  
  // Handle clicks on the base map (background)
  handleMapClick(e) {
    console.log('🛡️ Map click detected at', e.lngLat);
    
    // Ignore if drag just finished
    if (this.isDragging) {
      console.log('🛡️ Ignoring map click - drag in progress');
      return;
    }
    
    // Debounce clicks
    const now = Date.now();
    if (now - this.lastClickTime < this.CLICK_DEBOUNCE_TIME) {
      console.log('🛡️ Ignoring rapid click');
      return;
    }
    this.lastClickTime = now;
    
    // Check if we're already processing a click
    if (this.isProcessingClick) {
      console.log('🛡️ Already processing a click, queueing');
      // Queue this click to be processed after the current one
      this.clickQueue.push(e);
      return;
    }
    
    // Set processing flag
    this.isProcessingClick = true;
    
    try {
      // Trigger the left panel opening callback if available
      if (window.mapInteractionHandler && 
          window.mapInteractionHandler.callbacks && 
          window.mapInteractionHandler.callbacks.onLeftPanelOpen) {
        window.mapInteractionHandler.callbacks.onLeftPanelOpen();
      }
      
      // Check if this is a click on a platform (higher priority)
      const platformLayers = [
        'platforms-fixed-layer',
        'platforms-movable-layer',
        'airfields-layer',
        'platforms-layer',
        'major-platforms'
      ].filter(layer => this.map.getLayer(layer));
      
      if (platformLayers.length > 0) {
        const platformFeatures = this.map.queryRenderedFeatures(e.point, { layers: platformLayers });
        if (platformFeatures && platformFeatures.length > 0) {
          console.log('🛡️ Platform detected within map click, handling as platform click');
          this.handlePlatformClick({
            point: e.point,
            features: platformFeatures,
            lngLat: e.lngLat
          });
          this.isProcessingClick = false;
          return;
        }
      }
      
      // Check if this is a click on the route (secondary priority)
      if (this.map.getLayer('route')) {
        const routeFeatures = this.map.queryRenderedFeatures(e.point, { layers: ['route'] });
        if (routeFeatures && routeFeatures.length > 0) {
          console.log('🛡️ Route detected within map click, handling as route click');
          this.handleRouteClick({
            point: e.point,
            features: routeFeatures,
            lngLat: e.lngLat
          });
          this.isProcessingClick = false;
          return;
        }
      }
      
      // No platform or route hit, check for nearest rig for snap
      let nearestRig = null;
      if (this.platformManager && typeof this.platformManager.findNearestPlatform === 'function') {
        nearestRig = this.platformManager.findNearestPlatform(e.lngLat.lat, e.lngLat.lng, 2);
      }
      
      // Create waypoint data
      const waypointData = {
        lngLat: e.lngLat,
        coordinates: [e.lngLat.lng, e.lngLat.lat],
        isWaypointMode: this.isWaypointMode,
        nearestRig: nearestRig
      };
      
      // Add the waypoint
      this.addWaypoint(waypointData);
    } catch (error) {
      console.error('🛡️ Error handling map click:', error);
    } finally {
      // Reset processing flag
      this.isProcessingClick = false;
      
      // Process next click in queue if any
      if (this.clickQueue.length > 0) {
        const nextClick = this.clickQueue.shift();
        setTimeout(() => {
          this.handleMapClick(nextClick);
        }, 50);
      }
    }
  }
  
  // Handle clicks on platforms
  handlePlatformClick(e) {
    console.log('🛡️ Platform click detected');
    
    // Ignore if drag just finished
    if (this.isDragging) {
      console.log('🛡️ Ignoring platform click - drag in progress');
      return;
    }
    
    // Debounce clicks
    const now = Date.now();
    if (now - this.lastClickTime < this.CLICK_DEBOUNCE_TIME) {
      console.log('🛡️ Ignoring rapid platform click');
      return;
    }
    this.lastClickTime = now;
    
    // Set processing flag
    this.isProcessingClick = true;
    
    try {
      // Check if platform is valid
      if (!e.features || e.features.length === 0) {
        console.log('🛡️ No platform features found in click event');
        this.isProcessingClick = false;
        return;
      }
      
      // Get the platform data
      const platform = e.features[0].properties;
      console.log('🛡️ Platform clicked:', platform);
      
      // Create a valid platform object with coordinates
      const platformData = {
        name: platform.name,
        coordinates: [e.lngLat.lng, e.lngLat.lat],
        type: platform.type || 'platform',
        isWaypointMode: this.isWaypointMode
      };
      
      // Add the waypoint
      this.addWaypoint(platformData);
    } catch (error) {
      console.error('🛡️ Error handling platform click:', error);
    } finally {
      // Reset processing flag
      this.isProcessingClick = false;
    }
  }
  
  // Handle clicks on the route
  handleRouteClick(e) {
    console.log('🛡️ Route click detected');
    
    // Ignore if drag just finished
    if (this.isDragging) {
      console.log('🛡️ Ignoring route click - drag in progress');
      return;
    }
    
    // Debounce clicks
    const now = Date.now();
    if (now - this.lastClickTime < this.CLICK_DEBOUNCE_TIME) {
      console.log('🛡️ Ignoring rapid route click');
      return;
    }
    this.lastClickTime = now;
    
    // Set processing flag
    this.isProcessingClick = true;
    
    try {
      // Find insert index for the route
      let insertIndex = null;
      if (this.waypointManager && typeof this.waypointManager.findPathInsertIndex === 'function') {
        insertIndex = this.waypointManager.findPathInsertIndex(e.lngLat);
      } else {
        // Fallback - find nearest segment
        insertIndex = this.findNearestRouteSegment(e.lngLat);
      }
      
      console.log(`🛡️ Route click insert index: ${insertIndex}`);
      
      // Get nearest rig for snap
      let nearestRig = null;
      if (this.platformManager && typeof this.platformManager.findNearestPlatform === 'function') {
        nearestRig = this.platformManager.findNearestPlatform(e.lngLat.lat, e.lngLat.lng, 2);
      }
      
      // Create waypoint data
      const routeClickData = {
        lngLat: e.lngLat,
        insertIndex: insertIndex,
        nearestRig: nearestRig,
        isWaypointMode: this.isWaypointMode
      };
      
      // Add the waypoint
      this.addWaypoint(routeClickData);
    } catch (error) {
      console.error('🛡️ Error handling route click:', error);
    } finally {
      // Reset processing flag
      this.isProcessingClick = false;
    }
  }
  
  // Centralized waypoint adding function
  addWaypoint(waypointData) {
    console.log('🛡️ Adding waypoint:', waypointData);
    
    try {
      // Ensure waypoint manager is available
      if (!this.waypointManager) {
        console.error('🛡️ waypointManager not available');
        return;
      }
      
      // Extract coordinates and name from the data
      let coords, name, isWaypoint;
      
      // Get waypoint mode
      isWaypoint = waypointData.isWaypointMode === true || this.isWaypointMode;
      
      // Extract coordinates based on input format
      if (waypointData.coordinates) {
        coords = waypointData.coordinates;
      } else if (waypointData.coords) {
        coords = waypointData.coords;
      } else if (waypointData.lngLat) {
        coords = [waypointData.lngLat.lng, waypointData.lngLat.lat];
      } else {
        console.error('🛡️ Invalid waypoint data - no coordinates', waypointData);
        return;
      }
      
      // Check for nearest rig snap
      if (waypointData.nearestRig && waypointData.nearestRig.distance <= 2) {
        console.log(`🛡️ Snapping to nearest rig: ${waypointData.nearestRig.name} (${waypointData.nearestRig.distance.toFixed(2)} nm away)`);
        
        // Use rig coordinates and name
        if (waypointData.nearestRig.coordinates) {
          coords = waypointData.nearestRig.coordinates;
        } else if (waypointData.nearestRig.coords) {
          coords = waypointData.nearestRig.coords;
        }
        
        name = waypointData.nearestRig.name;
      } else if (waypointData.name) {
        // Use provided name
        name = waypointData.name;
      } else {
        // Generate a name based on type and existing waypoints
        const waypoints = this.waypointManager.getWaypoints() || [];
        if (isWaypoint) {
          name = `Waypoint ${waypoints.length + 1}`;
        } else {
          name = `Stop ${waypoints.length + 1}`;
        }
      }
      
      // Create waypoint options
      const options = {
        isWaypoint: isWaypoint,
        type: isWaypoint ? 'WAYPOINT' : 'STOP',
        pointType: isWaypoint ? 'NAVIGATION_WAYPOINT' : 'LANDING_STOP'
      };
      
      // Check if we have an insert index (for route clicks/drags)
      if (waypointData.insertIndex !== undefined && waypointData.insertIndex !== null) {
        console.log(`🛡️ Adding ${isWaypoint ? 'waypoint' : 'stop'} at index ${waypointData.insertIndex}: ${name}`);
        
        // Add at specific index
        this.waypointManager.addWaypointAtIndex(coords, name, waypointData.insertIndex, options);
      } else {
        console.log(`🛡️ Adding ${isWaypoint ? 'waypoint' : 'stop'} at end: ${name}`);
        
        // Add at the end
        this.waypointManager.addWaypoint(coords, name, options);
      }
      
      // Compare with last coordinates to prevent duplicates on next click
      this.lastClickCoords = coords;
      
      // Show success notification
      this.showNotification(`Added ${name} to route`, 'success');
      
      // Trigger callbacks for UI update
      this.triggerWaypointCallbacks(coords, name, isWaypoint, waypointData.insertIndex);
      
      console.log('🛡️ Waypoint added successfully');
    } catch (error) {
      console.error('🛡️ Error adding waypoint:', error);
    }
  }
  
  // Trigger the necessary callbacks after adding a waypoint
  triggerWaypointCallbacks(coords, name, isWaypoint, insertIndex) {
    try {
      // Create a waypoint data object for callbacks
      const waypointData = {
        coords: coords,
        name: name,
        isWaypoint: isWaypoint,
        insertIndex: insertIndex
      };
      
      // Trigger mapInteractionHandler callbacks if available
      if (window.mapInteractionHandler && window.mapInteractionHandler.callbacks) {
        if (typeof window.mapInteractionHandler.callbacks.onMapClick === 'function') {
          window.mapInteractionHandler.callbacks.onMapClick(waypointData);
        }
      }
      
      // Dispatch a custom event for components that listen to waypoint changes
      const event = new CustomEvent('waypoints-updated', {
        detail: {
          waypoints: this.waypointManager.getWaypoints(),
          lastAdded: waypointData
        }
      });
      window.dispatchEvent(event);
    } catch (error) {
      console.error('🛡️ Error triggering waypoint callbacks:', error);
    }
  }
  
  // Show a notification to the user
  showNotification(message, type = 'info', duration = 3000) {
    try {
      // Try to use the LoadingIndicator if available
      if (window.LoadingIndicator && window.LoadingIndicator.updateStatusIndicator) {
        window.LoadingIndicator.updateStatusIndicator(message, type, duration);
        return;
      }
      
      // Fallback - create a simple notification
      const notification = document.createElement('div');
      notification.className = 'isolated-interaction-notification';
      notification.style.position = 'fixed';
      notification.style.bottom = '20px';
      notification.style.left = '50%';
      notification.style.transform = 'translateX(-50%)';
      notification.style.backgroundColor = type === 'error' ? 'rgba(231, 76, 60, 0.9)' :
                                          type === 'success' ? 'rgba(46, 204, 113, 0.9)' :
                                          type === 'warning' ? 'rgba(243, 156, 18, 0.9)' :
                                          'rgba(52, 152, 219, 0.9)';
      notification.style.color = 'white';
      notification.style.padding = '10px 20px';
      notification.style.borderRadius = '5px';
      notification.style.zIndex = '9999';
      notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
      notification.textContent = message;
      
      document.body.appendChild(notification);
      
      // Remove after the specified duration
      setTimeout(() => {
        if (notification.parentNode === document.body) {
          document.body.removeChild(notification);
        }
      }, duration);
    } catch (error) {
      console.error('🛡️ Error showing notification:', error);
    }
  }
  
  // Setup a waypoint mode toggle button for easier access
  setupWaypointModeButton() {
    try {
      // Check if button already exists
      if (document.getElementById('isolated-waypoint-mode-toggle')) {
        return;
      }
      
      // Create a toggle button
      const button = document.createElement('button');
      button.id = 'isolated-waypoint-mode-toggle';
      button.innerHTML = 'Toggle Waypoint Mode';
      button.style.position = 'absolute';
      button.style.top = '50px';
      button.style.right = '10px';
      button.style.zIndex = '1000';
      button.style.padding = '5px 10px';
      button.style.backgroundColor = this.isWaypointMode ? '#FFCC00' : '#4285F4';
      button.style.color = this.isWaypointMode ? '#333333' : 'white';
      button.style.border = 'none';
      button.style.borderRadius = '4px';
      button.style.cursor = 'pointer';
      
      // Add click handler
      button.addEventListener('click', () => {
        this.isWaypointMode = !this.isWaypointMode;
        
        // Update global flag
        window.isWaypointModeActive = this.isWaypointMode;
        
        // Update button appearance
        button.style.backgroundColor = this.isWaypointMode ? '#FFCC00' : '#4285F4';
        button.style.color = this.isWaypointMode ? '#333333' : 'white';
        
        // Show notification
        this.showNotification(
          `${this.isWaypointMode ? 'Waypoint' : 'Stop'} mode activated`,
          'info'
        );
        
        // Dispatch event
        const event = new CustomEvent('waypoint-mode-changed', {
          detail: { active: this.isWaypointMode }
        });
        window.dispatchEvent(event);
      });
      
      // Add to document
      document.body.appendChild(button);
    } catch (error) {
      console.error('🛡️ Error setting up waypoint mode button:', error);
    }
  }
}

// Initialize the controller once everything is ready
function initializeIsolatedMapInteractions() {
  // Prevent multiple initialization
  if (window._isolatedMapInteractionsApplied) {
    console.log('🛡️ Isolated map interactions already applied, skipping');
    return;
  }
  
  console.log('🛡️ Initializing isolated map interactions...');
  
  // Create controller instance
  const controller = new IsolatedMapInteractionController();
  
  // Try to setup
  if (controller.setup()) {
    // Successful setup
    window._isolatedMapInteractionsApplied = true;
    window.isolatedMapInteractionController = controller;
    
    // Add a waypoint mode toggle button
    controller.setupWaypointModeButton();
    
    console.log('🛡️ Isolated map interactions successfully initialized');
  } else {
    // Failed setup, retry later
    console.log('🛡️ Setup failed, will retry in 1 second');
    setTimeout(initializeIsolatedMapInteractions, 1000);
  }
}

// Clean up UI elements and logs to avoid cluttering the display
function cleanupUI() {
  try {
    // Remove debug console elements
    const debugElements = document.querySelectorAll('.waypoint-stop-debug, .waypoint-debug, .waypoint-stop-debug-monitor');
    debugElements.forEach(el => el.remove());
    
    // Clear previous notifications
    const notifications = document.querySelectorAll('.fix-applied-popup, .isolated-interaction-notification');
    notifications.forEach(el => el.remove());
    
    // Hide debug monitor if visible
    const debugMonitor = document.getElementById('waypoint-stop-debug-monitor');
    if (debugMonitor) {
      debugMonitor.style.display = 'none';
    }
  } catch (error) {
    console.error('🛡️ Error cleaning up UI:', error);
  }
}

// Run cleanup and initialization
cleanupUI();
initializeIsolatedMapInteractions();

// Export the initialization function so it can be called manually if needed
export default initializeIsolatedMapInteractions;
