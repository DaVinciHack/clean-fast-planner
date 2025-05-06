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
   * Initialize map click handlers
   * This is the main function that sets up all map interactions
   * @returns {boolean} - Success status
   */
  initialize() {
    console.log('MapInteractionHandler: Initializing map interaction handlers');

    // Make sure we have all the required managers
    if (!this.mapManager || !this.waypointManager || !this.platformManager) {
      console.error('MapInteractionHandler: Missing required managers');
      this.triggerCallback('onError', 'Missing required managers');
      return false;
    }

    // Get the map instance
    const map = this.mapManager.getMap();
    if (!map) {
      console.error('MapInteractionHandler: Map is not initialized');
      this.triggerCallback('onError', 'Map is not initialized');
      return false;
    }

    // CRITICAL: Remove any existing click handler to prevent duplicates
    map.off('click');

    // Map click for adding waypoints
    map.on('click', this.handleMapClick.bind(this));

    // Set up route dragging via the waypoint manager's setupRouteDragging method
    if (typeof this.waypointManager.setupRouteDragging === 'function') {
      this.waypointManager.setupRouteDragging(this.handleRouteDragComplete.bind(this));
    }

    // Mark as initialized
    this.isInitialized = true;
    console.log('MapInteractionHandler: Map interactions initialized successfully');
    return true;
  }

  /**
   * Handle map click events
   * @param {Object} e - The click event
   */
  handleMapClick(e) {
    console.log('MapInteractionHandler: Map click detected', e.lngLat);

    // Ensure managers are initialized
    if (!this.mapManager || !this.waypointManager || !this.platformManager) {
      console.error('MapInteractionHandler: Required managers not initialized');
      return;
    }

    const map = this.mapManager.getMap();
    if (!map) return;

    // Notify the app to ensure left panel is shown when clicking on map
    this.triggerCallback('onLeftPanelOpen');

    try {
      // Check if clicking on a platform marker (rig, platform, airport)
      const platformFeatures = map.queryRenderedFeatures(e.point, { 
        layers: [
          'platforms-fixed-layer', 
          'platforms-movable-layer',
          'airfields-layer'
        ] 
      });

      if (platformFeatures && platformFeatures.length > 0) {
        console.log('MapInteractionHandler: Clicked on platform:', platformFeatures[0].properties.name);
        const props = platformFeatures[0].properties;
        const coordinates = platformFeatures[0].geometry.coordinates.slice();

        // Handle platform click - either direct add or callback
        this.handlePlatformClick(coordinates, props.name);
        return;
      }
    } catch (err) {
      console.error('MapInteractionHandler: Error handling platform click:', err);
    }

    try {
      // Check if clicking on the route line
      const routeFeatures = map.queryRenderedFeatures(e.point, { layers: ['route'] });
      if (routeFeatures && routeFeatures.length > 0) {
        console.log('MapInteractionHandler: Clicked on route line');
        
        // Find where to insert on the path
        const insertIndex = this.waypointManager.findPathInsertIndex(e.lngLat);

        // Check for nearest rig when clicking on route line
        const nearestRig = this.platformManager.findNearestPlatform(e.lngLat.lat, e.lngLat.lng);

        // Handle route click - either direct add or callback
        this.handleRouteClick(e.lngLat, insertIndex, nearestRig);
        return;
      }
    } catch (err) {
      console.error('MapInteractionHandler: Error handling route click:', err);
    }

    // If we're here, we clicked on the map background (not a platform or route)
    try {
      // Check for nearest rig
      const nearestRig = this.platformManager.findNearestPlatform(e.lngLat.lat, e.lngLat.lng);

      if (nearestRig && nearestRig.distance < 1) { // Within 1 nautical mile
        // Add the rig as a waypoint instead of the clicked location
        console.log(`MapInteractionHandler: Using nearest rig: ${nearestRig.name} (${nearestRig.distance.toFixed(1)} nm away)`);
        this.handlePlatformClick(nearestRig.coordinates, nearestRig.name);
      } else {
        // Just add the clicked location as a waypoint
        this.handleMapBackgroundClick(e.lngLat);
      }
    } catch (err) {
      console.error('MapInteractionHandler: Error handling map background click:', err);
      
      // Fallback to just adding the clicked point
      this.handleMapBackgroundClick(e.lngLat);
    }
  }

  /**
   * Handle clicks on platform markers
   * @param {Array} coordinates - [lng, lat] coordinates
   * @param {string} name - The platform name
   */
  handlePlatformClick(coordinates, name) {
    // Either add directly or trigger callback
    if (this.callbacks.onPlatformClick) {
      this.triggerCallback('onPlatformClick', { coordinates, name });
    } else {
      // Direct add if no callback
      this.waypointManager.addWaypoint(coordinates, name);
    }
  }

  /**
   * Handle clicks on the route line
   * @param {Object} lngLat - {lng, lat} click coordinates
   * @param {number} insertIndex - Index to insert the new waypoint
   * @param {Object} nearestRig - The nearest rig if any
   */
  handleRouteClick(lngLat, insertIndex, nearestRig) {
    // Either add directly or trigger callback
    if (this.callbacks.onRouteClick) {
      this.triggerCallback('onRouteClick', { lngLat, insertIndex, nearestRig });
    } else {
      // Direct add if no callback
      if (nearestRig && nearestRig.distance < 2) {
        // Add the rig instead of the clicked point
        this.waypointManager.addWaypointAtIndex(nearestRig.coordinates, nearestRig.name, insertIndex);
      } else {
        // Add the clicked point
        this.waypointManager.addWaypointAtIndex([lngLat.lng, lngLat.lat], null, insertIndex);
      }
    }
  }

  /**
   * Handle clicks on the map background (not on platforms or route)
   * @param {Object} lngLat - {lng, lat} click coordinates
   */
  handleMapBackgroundClick(lngLat) {
    // First check for nearest rig within 2 nautical miles
    const nearestRig = this.platformManager.findNearestPlatform(lngLat.lat, lngLat.lng, 2);
    
    console.log(`MapInteractionHandler: 🌐 Map click at [${lngLat.lng}, ${lngLat.lat}]`);
    
    if (nearestRig) {
      console.log(`MapInteractionHandler: 🌐 Found nearest rig: ${nearestRig.name} at distance ${nearestRig.distance.toFixed(2)} nm`);
    } else {
      console.log(`MapInteractionHandler: 🌐 No rig found within 2 nautical miles`);
    }

    // Either use callback or direct add
    if (this.callbacks.onMapClick) {
      // Include the nearest rig info in the callback data
      const callbackData = { 
        lngLat: lngLat,
        coordinates: [lngLat.lng, lngLat.lat], // Ensure we have coordinates in array format
        mapClickSource: 'directClick' // CRITICAL FIX: Flag to identify this is a map click
      };
      
      if (nearestRig) {
        // Make sure coordinates are in the right format - check all possible formats
        let rigCoordinates;
        if (Array.isArray(nearestRig.coordinates)) {
          rigCoordinates = nearestRig.coordinates;
        } else if (Array.isArray(nearestRig.coords)) {
          rigCoordinates = nearestRig.coords;
        } else if (nearestRig.lng !== undefined && nearestRig.lat !== undefined) {
          rigCoordinates = [nearestRig.lng, nearestRig.lat];
        } else {
          console.error('MapInteractionHandler: 🌐 Invalid rig coordinates format:', nearestRig);
          rigCoordinates = [lngLat.lng, lngLat.lat]; // Fallback to clicked point
        }
        
        callbackData.nearestRig = {
          ...nearestRig,
          coordinates: rigCoordinates,
          name: nearestRig.name || 'Unknown'
        };
      }
      
      console.log(`MapInteractionHandler: 🌐 Triggering onMapClick with data:`, callbackData);
      this.triggerCallback('onMapClick', callbackData);
    } else {
      // Direct add - use nearest rig if available within distance
      if (nearestRig && nearestRig.distance <= 2) {
        console.log(`MapInteractionHandler: 🌐 Snapping to rig ${nearestRig.name}`);
        const coordinates = nearestRig.coords || [nearestRig.lng, nearestRig.lat];
        this.waypointManager.addWaypoint(coordinates, nearestRig.name);
        
        // CRITICAL FIX: Make sure route is updated immediately after adding waypoint
        // We need to force a reflow by adding a small delay
        setTimeout(() => {
          console.log(`MapInteractionHandler: 🌐 Forcing route update for map click`);
          if (this.waypointManager && this.waypointManager.updateRoute) {
            this.waypointManager.updateRoute();
          }
        }, 50);
      } else {
        // No nearby rig, just add the clicked point
        console.log(`MapInteractionHandler: 🌐 Adding waypoint at clicked point`);
        this.waypointManager.addWaypoint([lngLat.lng, lngLat.lat]);
        
        // CRITICAL FIX: Make sure route is updated immediately after adding waypoint
        // We need to force a reflow by adding a small delay
        setTimeout(() => {
          console.log(`MapInteractionHandler: 🌐 Forcing route update for map click`);
          if (this.waypointManager && this.waypointManager.updateRoute) {
            this.waypointManager.updateRoute();
          }
        }, 50);
      }
    }
  }

  /**
   * Handle route drag completion
   * @param {number} insertIndex - Index to insert the new waypoint
   * @param {Array} coords - [lng, lat] coordinates
   */
  handleRouteDragComplete(insertIndex, coords) {
    console.log(`MapInteractionHandler: Route dragged at index ${insertIndex}`, coords);
    
    // Check for nearest rig
    try {
      const nearestRig = this.platformManager.findNearestPlatform(coords[1], coords[0], 2);

      if (nearestRig && nearestRig.distance < 2) { // Within 2 nautical miles
        // Add the rig instead of the dragged point
        console.log(`MapInteractionHandler: Using nearest rig for drag: ${nearestRig.name} (${nearestRig.distance.toFixed(1)} nm away)`);
        this.waypointManager.addWaypointAtIndex(nearestRig.coordinates, nearestRig.name, insertIndex);
      } else {
        // Add the dragged point
        this.waypointManager.addWaypointAtIndex(coords, null, insertIndex);
      }
    } catch (err) {
      console.error('MapInteractionHandler: Error handling route drag:', err);
      
      // Fallback to just adding the dragged point
      this.waypointManager.addWaypointAtIndex(coords, null, insertIndex);
    }
  }
}

export default MapInteractionHandler;