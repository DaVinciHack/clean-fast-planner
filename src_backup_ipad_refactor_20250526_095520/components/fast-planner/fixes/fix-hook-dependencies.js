/**
 * fix-hook-dependencies.js
 * 
 * This script ensures proper hook dependencies by making
 * global variables available for coordination between hooks.
 */

console.log('🪝 Initializing hook dependencies fix...');

// Global flag to prevent multiple executions
if (window._hookDependenciesFixApplied) {
  console.log('🪝 Hook dependencies fix already applied, skipping');
} else {
  window._hookDependenciesFixApplied = true;

  // Create a global shared state for hooks to use
  window.hookGlobalState = window.hookGlobalState || {
    waypoints: [],
    aircraft: null,
    region: null,
    settings: {},
    weather: { windSpeed: 15, windDirection: 270 },
    lastUpdateTime: Date.now()
  };
  
  // Create a global event system for hook communication
  window.hookEvents = window.hookEvents || {
    listeners: {},
    
    on: function(event, callback) {
      if (!this.listeners[event]) {
        this.listeners[event] = [];
      }
      this.listeners[event].push(callback);
    },
    
    off: function(event, callback) {
      if (!this.listeners[event]) return;
      
      if (callback) {
        this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
      } else {
        this.listeners[event] = [];
      }
    },
    
    emit: function(event, data) {
      if (!this.listeners[event]) return;
      
      this.listeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`🪝 Error in event listener for ${event}:`, error);
        }
      });
    }
  };
  
  // Create global references for managers
  window.managerRefs = window.managerRefs || {
    hasBeenInitialized: false,
    
    initialize: function(managers) {
      if (this.hasBeenInitialized) return;
      
      Object.assign(this, managers);
      this.hasBeenInitialized = true;
      
      window.hookEvents.emit('managersInitialized', this);
    }
  };
  
  // Patch the useManagers hook to register global references
  console.log('🪝 Setting up manager registration for hooks...');
  
  // Set up check for manager initialization
  function checkManagerInitialization() {
    // Check if we can find the managers
    if (window.mapManager && window.waypointManager) {
      if (!window.managerRefs.hasBeenInitialized) {
        console.log('🪝 Found global managers, registering them...');
        
        window.managerRefs.initialize({
          mapManager: window.mapManager,
          waypointManager: window.waypointManager,
          mapInteractionHandler: window.mapInteractionHandler,
          platformManager: window.platformManager,
          routeCalculator: window.routeCalculator,
          aircraftManager: window.aircraftManager
        });
        
        console.log('🪝 Managers registered for hook coordination');
      }
      
      return true;
    }
    
    return false;
  }
  
  // Attempt initial check
  if (!checkManagerInitialization()) {
    console.log('🪝 Managers not yet initialized, will check again later...');
    
    // Set up a retry mechanism
    let attempts = 0;
    const maxAttempts = 10;
    
    const checkInterval = setInterval(() => {
      attempts++;
      
      if (checkManagerInitialization()) {
        clearInterval(checkInterval);
        console.log('🪝 Manager initialization completed after', attempts, 'attempts');
      } else if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        console.log('🪝 Failed to initialize managers after', maxAttempts, 'attempts');
      }
    }, 1000);
  }
  
  // Fix specific hook issues
  if (typeof window.addWaypointDirect !== 'function') {
    console.log('🪝 Adding global addWaypointDirect function...');
    
    // Create a direct waypoint function that hooks can use
    window.addWaypointDirect = async function(waypointData) {
      console.log('🪝 Using global addWaypointDirect with data:', waypointData);
      
      if (!window.waypointManager) {
        console.error('🪝 Cannot add waypoint: WaypointManager not available');
        return;
      }
      
      try {
        // Process waypoint based on its type
        let coords, name, isWaypoint = false;
        
        if (Array.isArray(waypointData)) {
          coords = waypointData;
          name = null;
        } else if (typeof waypointData === 'string') {
          // Try to find a location with this name
          name = waypointData;
          
          if (window.platformManager) {
            const platform = window.platformManager.findPlatformByName(name);
            if (platform) {
              coords = platform.coordinates;
            }
          }
          
          if (!coords) {
            console.error('🪝 Cannot find location:', name);
            return;
          }
        } else if (waypointData && typeof waypointData === 'object') {
          // Check if it's a waypoint
          isWaypoint = waypointData.isWaypoint === true || window.isWaypointModeActive === true;
          
          // Extract coordinates
          if (waypointData.coordinates) {
            coords = waypointData.coordinates;
          } else if (waypointData.coords) {
            coords = waypointData.coords;
          } else if (waypointData.lngLat) {
            coords = [waypointData.lngLat.lng, waypointData.lngLat.lat];
          } else if (waypointData.nearestRig && waypointData.nearestRig.distance <= 2) {
            // Use nearest rig
            if (waypointData.nearestRig.coordinates) {
              coords = waypointData.nearestRig.coordinates;
            } else if (waypointData.nearestRig.coords) {
              coords = waypointData.nearestRig.coords;
            } else {
              console.error('🪝 Invalid nearestRig coordinates');
              return;
            }
            
            name = waypointData.nearestRig.name;
          } else {
            console.error('🪝 Cannot extract coordinates from waypoint data');
            return;
          }
          
          // Extract name if not set yet
          if (!name && waypointData.name) {
            name = waypointData.name;
          }
        } else {
          console.error('🪝 Invalid waypoint data format');
          return;
        }
        
        // Validate coordinates
        if (!coords || !Array.isArray(coords) || coords.length !== 2) {
          console.error('🪝 Invalid coordinates format');
          return;
        }
        
        // Add the waypoint
        console.log(`🪝 Adding ${isWaypoint ? 'waypoint' : 'stop'} at [${coords}] with name "${name || 'Unnamed'}"`);
        
        window.waypointManager.addWaypoint(coords, name, {
          isWaypoint: isWaypoint,
          type: isWaypoint ? 'WAYPOINT' : 'STOP'
        });
        
        // Get the updated waypoints
        const updatedWaypoints = window.waypointManager.getWaypoints();
        
        // Emit event for hook communication
        window.hookGlobalState.waypoints = updatedWaypoints;
        window.hookGlobalState.lastUpdateTime = Date.now();
        window.hookEvents.emit('waypointsUpdated', updatedWaypoints);
        
        return updatedWaypoints;
      } catch (error) {
        console.error('🪝 Error in global addWaypointDirect:', error);
      }
    };
  }
  
  // Register global weather updates
  if (typeof window.updateWeatherGlobal !== 'function') {
    console.log('🪝 Adding global weather update function...');
    
    window.updateWeatherGlobal = function(windSpeed, windDirection) {
      console.log('🪝 Global weather update:', windSpeed, windDirection);
      
      const newWeather = {
        windSpeed: parseInt(windSpeed) || 0,
        windDirection: ((parseInt(windDirection) || 0) % 360 + 360) % 360
      };
      
      // Update global state
      window.hookGlobalState.weather = newWeather;
      window.hookGlobalState.lastUpdateTime = Date.now();
      
      // Emit event
      window.hookEvents.emit('weatherUpdated', newWeather);
      
      return newWeather;
    };
  }
  
  console.log('🪝 Hook dependencies fix applied');
}

// Export function for manual application
export function fixHookDependencies() {
  window._hookDependenciesFixApplied = false;
  console.log('🪝 Manually applying hook dependencies fix...');
  // Code will re-run because we reset the flag
}

export default fixHookDependencies;