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
    console.log('InteractionController: initialize() called, but deliberately bypassed to prevent duplicate click handling. No listeners will be attached by this controller.');
    // Returning true to not break any calling code that expects a boolean,
    // but this controller will no longer interact with the map.
    return true; 
  }
  
  /**
   * Handle map click events
   */
  handleMapClick(data) {
    console.log('InteractionController: handleMapClick called, but doing nothing (bypassed). Data:', data);
    // Deliberately empty to prevent adding waypoints
  }
  
  /**
   * Handle platform click events
   */
  handlePlatformClick(data) {
    console.log('InteractionController: handlePlatformClick called, but doing nothing (bypassed). Data:', data);
    // Deliberately empty
  }
  
  /**
   * Handle route click events
   */
  handleRouteClick(data) {
    console.log('InteractionController: handleRouteClick called, but doing nothing (bypassed). Data:', data);
    // Deliberately empty
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
