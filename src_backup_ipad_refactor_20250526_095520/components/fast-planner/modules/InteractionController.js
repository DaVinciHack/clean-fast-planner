/**
 * InteractionController.js
 * 
 * This module coordinates all user interactions with the map and waypoints
 * to provide a clean, unified interface for the application.
 */

import MapInteractions from './MapInteractions';
import WaypointInteractions from './WaypointInteractions';

class InteractionController {
  constructor() {
    // Dependency managers
    this.mapManager = null;
    this.waypointManager = null;
    this.platformManager = null;
    
    // Interaction modules
    this.mapInteractions = new MapInteractions();
    this.waypointInteractions = new WaypointInteractions();
    
    // Waypoint mode state
    this.waypointMode = false;
    
    // Bind methods to ensure correct this context
    this.initialize = this.initialize.bind(this);
    this.handleMapClick = this.handleMapClick.bind(this);
    this.handlePlatformClick = this.handlePlatformClick.bind(this);
    this.handleRouteClick = this.handleRouteClick.bind(this);
    this.setWaypointMode = this.setWaypointMode.bind(this);
    this.addWaypoint = this.addWaypoint.bind(this);
    this.removeWaypoint = this.removeWaypoint.bind(this);
    
    // Callbacks
    this.callbacks = {
      onWaypointsChanged: null,
      onError: null
    };
  }
  
  /**
   * Initialize the controller with required dependencies
   */
  initialize(mapManager, waypointManager, platformManager) {
    // Store manager references
    this.mapManager = mapManager;
    this.waypointManager = waypointManager;
    this.platformManager = platformManager;
    
    console.log('InteractionController: initializing with managers');
    
    // Check if mapManager is available
    if (!mapManager) {
      console.error('InteractionController: mapManager is required for initialization');
      return false;
    }
    
    const checkForMapReady = () => {
      const map = mapManager.getMap();
      if (map && typeof map.on === 'function') {
        // Initialize interaction modules with the map instance directly
        this.mapInteractions.initialize(map, waypointManager, platformManager);
        this.waypointInteractions.initialize(waypointManager, platformManager);
        
        // Set up callback forwarding
        this.waypointInteractions.setCallback('onWaypointsChanged', (waypoints) => {
          this.triggerCallback('onWaypointsChanged', waypoints);
        });
        
        console.log('InteractionController: Successfully initialized with map instance');
        
        // Setup event listener for map re-initialization
        window.addEventListener('reinitialize-map-handlers', () => {
          console.log('InteractionController: Reinitializing map handlers');
          
          // Update with the current map instance
          const updatedMap = mapManager.getMap();
          if (updatedMap && typeof updatedMap.on === 'function') {
            this.mapInteractions.initialize(updatedMap, waypointManager, platformManager);
            console.log('Map handlers reinitialized successfully');
            window.mapHandlersInitialized = true;
          }
        });
        
        return true;
      } else {
        console.warn('InteractionController: Map not ready, will try again');
        setTimeout(checkForMapReady, 500);
        return false;
      }
    };
    
    // Start checking for map readiness
    return checkForMapReady();
  }
  
  /**
   * Handle map click events
   */
  handleMapClick(data) {
    if (!this.mapInteractions || !this.waypointInteractions) {
      console.warn('InteractionController: handleMapClick called but interaction modules not initialized');
      return;
    }
    
    console.log('InteractionController: handleMapClick called with data:', data);
    
    // Let the map interactions handle the click first
    const mapResult = this.mapInteractions.handleClick(data);
    
    // If the map interactions didn't handle it, let the waypoint interactions try
    if (!mapResult) {
      this.waypointInteractions.handleMapClick(data);
    }
  }
  
  /**
   * Handle platform click events
   */
  handlePlatformClick(data) {
    if (!this.waypointInteractions) {
      console.warn('InteractionController: handlePlatformClick called but waypoint interactions not initialized');
      return;
    }
    
    console.log('InteractionController: handlePlatformClick called with data:', data);
    this.waypointInteractions.handlePlatformClick(data);
  }
  
  /**
   * Handle route click events
   */
  handleRouteClick(data) {
    if (!this.waypointInteractions) {
      console.warn('InteractionController: handleRouteClick called but waypoint interactions not initialized');
      return;
    }
    
    console.log('InteractionController: handleRouteClick called with data:', data);
    this.waypointInteractions.handleRouteClick(data);
  }
  
  /**
   * Toggle waypoint mode (true for waypoints, false for stops)
   */
  setWaypointMode(waypointMode) {
    this.waypointMode = !!waypointMode;
    
    // Update the waypoint interactions module
    this.waypointInteractions.setWaypointMode(this.waypointMode);
    
    console.log(`Waypoint mode set to: ${this.waypointMode ? 'WAYPOINT' : 'STOP'}`);
    
    return this.waypointMode;
  }
  
  /**
   * Add a waypoint with the current mode
   */
  addWaypoint(waypointData) {
    return this.waypointInteractions.addWaypoint(waypointData);
  }
  
  /**
   * Remove a waypoint by ID or index
   */
  removeWaypoint(waypointIdOrIndex) {
    return this.waypointInteractions.removeWaypoint(waypointIdOrIndex);
  }
  
  /**
   * Set a callback for specific events
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
}

export default InteractionController;
