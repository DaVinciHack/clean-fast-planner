/**
 * MapInteractionHandler.js
 * 
 * Handles interactions between the map and the route manager
 */

class MapInteractionHandler {
  /**
   * Initialize the handler
   * @param {Object} mapManager - Map manager instance
   * @param {Object} routeManager - Route manager instance
   * @param {Object} platformManager - Platform manager instance (optional)
   */
  constructor(mapManager, routeManager, platformManager = null) {
    this.mapManager = mapManager;
    this.routeManager = routeManager;
    this.platformManager = platformManager;
    
    // Store bound methods for event listeners
    this.handleMapClick = this.handleMapClick.bind(this);
    this.handlePlatformClick = this.handlePlatformClick.bind(this);
    this.handleRouteClick = this.handleRouteClick.bind(this);
    
    // Callbacks
    this.callbacks = {
      onMapClick: null,
      onPlatformClick: null,
      onRouteClick: null,
      onLeftPanelOpen: null,
      onError: null
    };
  }
  
  /**
   * Set a callback function
   * @param {string} type - The callback type
   * @param {Function} callback - The callback function
   */
  setCallback(type, callback) {
    if (this.callbacks.hasOwnProperty(type)) {
      this.callbacks[type] = callback;
    }
  }
  
  /**
   * Trigger a callback if it exists
   * @param {string} type - The callback type
   * @param {*} data - The data to pass to the callback
   */
  triggerCallback(type, data) {
    if (this.callbacks[type]) {
      this.callbacks[type](data);
    }
  }
  
  /**
   * Initialize the handler and set up event listeners
   * @returns {boolean} Whether initialization was successful
   */
  initialize() {
    if (!this.mapManager || !this.routeManager) {
      console.error('Cannot initialize handler: Missing required managers');
      return false;
    }
    
    const map = this.mapManager.getMap();
    if (!map) {
      console.error('Cannot initialize handler: Map is not initialized');
      return false;
    }
    
    console.log('Initializing map interaction handler');
    
    // Set up map click event
    map.on('click', this.handleMapClick);
    
    // Set up platform click event (if platforms layer exists)
    if (map.getLayer('platforms-layer')) {
      map.on('click', 'platforms-layer', this.handlePlatformClick);
    } else {
      console.warn('Platforms layer not found, platform clicks will not be handled');
    }
    
    // Setup route dragging in the RouteManager
    if (typeof this.routeManager.setupRouteDragging === 'function') {
      this.routeManager.setupRouteDragging();
    }
    
    return true;
  }
  
  /**
   * Clean up event listeners
   */
  cleanup() {
    const map = this.mapManager.getMap();
    if (map) {
      map.off('click', this.handleMapClick);
      
      if (map.getLayer('platforms-layer')) {
        map.off('click', 'platforms-layer', this.handlePlatformClick);
      }
    }
  }
  
  /**
   * Handle map click event
   * @param {Object} e - Map click event
   */
  handleMapClick(e) {
    // Skip if mapbox popup is clicked
    if (e.originalEvent.target.closest('.mapboxgl-popup')) {
      return;
    }
    
    // Skip if platform was clicked (handled by handlePlatformClick)
    if (e.features && e.features.length > 0 && 
        e.features.some(f => f.layer.id === 'platforms-layer')) {
      return;
    }
    
    console.log(`Map click at [${e.lngLat.lng}, ${e.lngLat.lat}]`);
    
    // If left panel is not open, trigger the callback
    if (this.callbacks.onLeftPanelOpen) {
      this.callbacks.onLeftPanelOpen();
    }
    
    // Create data object for the click
    const clickData = {
      lngLat: e.lngLat,
      point: e.point,
      mapClickSource: 'directClick'
    };
    
    // Add nearest platform if available
    if (this.platformManager) {
      const nearestPlatform = this.platformManager.findNearestPlatform(
        e.lngLat.lat, e.lngLat.lng, 2 // 2 nm radius
      );
      
      if (nearestPlatform) {
        clickData.nearestRig = {
          name: nearestPlatform.name,
          coordinates: [nearestPlatform.longitude, nearestPlatform.latitude],
          distance: nearestPlatform.distance,
          type: nearestPlatform.type
        };
      }
    }
    
    // Let the RouteManager handle the click based on the current edit mode
    if (this.routeManager) {
      this.routeManager.handleMapClick(clickData);
    }
    
    // Trigger callback with the click data
    this.triggerCallback('onMapClick', clickData);
  }
  
  /**
   * Handle platform click event
   * @param {Object} e - Platform click event
   */
  handlePlatformClick(e) {
    // Skip if mapbox popup is clicked
    if (e.originalEvent.target.closest('.mapboxgl-popup')) {
      return;
    }
    
    if (!e.features || e.features.length === 0) {
      return;
    }
    
    // Get the clicked platform
    const feature = e.features[0];
    const properties = feature.properties;
    
    console.log(`Platform clicked: ${properties.name}`);
    
    // If left panel is not open, trigger the callback
    if (this.callbacks.onLeftPanelOpen) {
      this.callbacks.onLeftPanelOpen();
    }
    
    // Create data object for the click
    const clickData = {
      lngLat: e.lngLat,
      point: e.point,
      mapClickSource: 'platformClick',
      platform: {
        name: properties.name,
        coordinates: [properties.longitude, properties.latitude],
        type: properties.type
      }
    };
    
    // Let the RouteManager handle the click based on the current edit mode
    if (this.routeManager) {
      this.routeManager.handleMapClick(clickData);
    }
    
    // Trigger callback with the click data
    this.triggerCallback('onPlatformClick', clickData);
  }
  
  /**
   * Handle route click event
   * @param {Object} e - Route click event
   */
  handleRouteClick(e) {
    // This is handled by the routeManager's setupRouteDragging method
    // Left for future use or additional functionality
  }
}

export default MapInteractionHandler;