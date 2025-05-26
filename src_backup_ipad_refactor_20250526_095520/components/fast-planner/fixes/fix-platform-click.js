/**
 * Fix for platform click handling
 */

console.log('🛠️ Setting up platform click handler fix...');

// Function to patch MapInteractionHandler
function patchMapInteractionHandler() {
  console.log('🛠️ Patching MapInteractionHandler...');
  
  // Wait for MapInteractionHandler to be available
  const checkMapInteractionHandler = () => {
    if (!window.mapInteractionHandler) {
      console.log('🛠️ Waiting for mapInteractionHandler to be available...');
      setTimeout(checkMapInteractionHandler, 1000);
      return;
    }
    
    // Patch the handlePlatformClick method
    if (window.mapInteractionHandler.handlePlatformClick) {
      const originalHandlePlatformClick = window.mapInteractionHandler.handlePlatformClick;
      
      window.mapInteractionHandler.handlePlatformClick = function(e) {
        console.log('🛠️ Enhanced handlePlatformClick called', e);
        
        try {
          // Check if platform is valid
          if (!e.features || e.features.length === 0) {
            console.log('🛠️ No platform features found in click event');
            return;
          }
          
          // Get the platform data
          const platform = e.features[0].properties;
          console.log('🛠️ Platform clicked:', platform);
          
          // Create a valid platform object with coordinates
          const platformData = {
            name: platform.name,
            coordinates: [e.lngLat.lng, e.lngLat.lat],
            type: platform.type || 'platform'
          };
          
          // Manually add the waypoint to avoid function call issues
          console.log('🛠️ Adding platform waypoint manually...');
          
          // If waypointManager is available, add directly
          if (window.waypointManager && window.waypointManager.addWaypoint) {
            console.log('🛠️ Adding via waypointManager.addWaypoint');
            
            // Check if in waypoint mode
            const isWaypointMode = window.isWaypointModeActive === true;
            
            window.waypointManager.addWaypoint(
              platformData.coordinates,
              platformData.name,
              { 
                isWaypoint: isWaypointMode,
                type: isWaypointMode ? 'WAYPOINT' : 'STOP'
              }
            );
            
            // Show success message
            if (window.LoadingIndicator) {
              window.LoadingIndicator.updateStatusIndicator(
                `Added ${platformData.name} to route`,
                'success',
                3000
              );
            }
            
            return;
          }
          
          // If we have an onPlatformClick callback, try to use it
          if (this.callbacks && this.callbacks.onPlatformClick) {
            console.log('🛠️ Calling onPlatformClick callback');
            this.callbacks.onPlatformClick(platformData);
          } else {
            console.log('🛠️ No onPlatformClick callback available');
          }
        } catch (error) {
          console.error('🛠️ Error in handlePlatformClick:', error);
          
          // Show error message
          if (window.LoadingIndicator) {
            window.LoadingIndicator.updateStatusIndicator(
              `Error adding platform: ${error.message}`,
              'error',
              5000
            );
          }
        }
      };
    }
    
    // Patch initialization for click handlers
    if (window.mapInteractionHandler.initialize) {
      const originalInitialize = window.mapInteractionHandler.initialize;
      
      window.mapInteractionHandler.initialize = function() {
        console.log('🛠️ Enhanced initialize called for MapInteractionHandler');
        
        try {
          // First clear any existing handlers to avoid duplicates
          this.clearEventHandlers();
          
          // Then call the original method
          const result = originalInitialize.call(this);
          
          // Make sure all required handlers are registered after initialization
          this.setupClickHandlers();
          
          // Return the original result
          return result;
        } catch (error) {
          console.error('🛠️ Error in MapInteractionHandler initialize:', error);
          return false;
        }
      };
    }
    
    // Add a new method to explicitly set up click handlers
    window.mapInteractionHandler.setupClickHandlers = function() {
      console.log('🛠️ Setting up click handlers manually...');
      
      try {
        const map = this.mapManager.getMap();
        if (!map) {
          console.error('🛠️ Cannot set up click handlers: Map is not initialized');
          return false;
        }
        
        // Add map click handler
        map.on('click', (e) => {
          if (typeof this.handleMapClick === 'function') {
            this.handleMapClick(e);
          } else {
            console.error('🛠️ handleMapClick method not available');
          }
        });
        
        // Add platform click handler for platforms-layer
        map.on('click', 'platforms-layer', (e) => {
          if (typeof this.handlePlatformClick === 'function') {
            this.handlePlatformClick(e);
          } else {
            console.error('🛠️ handlePlatformClick method not available');
          }
        });
        
        // Add platform click handler for major-platforms layer
        map.on('click', 'major-platforms', (e) => {
          if (typeof this.handlePlatformClick === 'function') {
            this.handlePlatformClick(e);
          } else {
            console.error('🛠️ handlePlatformClick method not available');
          }
        });
        
        // Add other handlers as needed
        
        return true;
      } catch (error) {
        console.error('🛠️ Error setting up click handlers:', error);
        return false;
      }
    };
    
    // Add a method to clear event handlers
    window.mapInteractionHandler.clearEventHandlers = function() {
      console.log('🛠️ Clearing event handlers...');
      
      try {
        const map = this.mapManager.getMap();
        if (!map) {
          console.log('🛠️ No map available, nothing to clear');
          return;
        }
        
        // Remove all click handlers
        map.off('click');
        
        // Remove platform click handlers
        if (map.getLayer('platforms-layer')) {
          map.off('click', 'platforms-layer');
        }
        
        if (map.getLayer('major-platforms')) {
          map.off('click', 'major-platforms');
        }
        
        console.log('🛠️ Event handlers cleared');
      } catch (error) {
        console.error('🛠️ Error clearing event handlers:', error);
      }
    };
    
    // Add direct addWaypoint method to handle platform clicks
    window.mapInteractionHandler.addWaypoint = function(waypointData) {
      console.log('🛠️ Direct addWaypoint called in MapInteractionHandler', waypointData);
      
      try {
        // If we have a waypointManager, use it directly
        if (window.waypointManager && window.waypointManager.addWaypoint) {
          // Check if in waypoint mode
          const isWaypointMode = window.isWaypointModeActive === true;
          
          // Extract coordinates
          let coords, name;
          
          if (Array.isArray(waypointData)) {
            coords = waypointData;
            name = null;
          } else if (waypointData && typeof waypointData === 'object') {
            if (waypointData.coordinates) {
              coords = waypointData.coordinates;
            } else if (waypointData.coords) {
              coords = waypointData.coords;
            } else if (waypointData.lngLat) {
              coords = [waypointData.lngLat.lng, waypointData.lngLat.lat];
            } else {
              console.error('🛠️ Invalid waypoint data format:', waypointData);
              return;
            }
            
            name = waypointData.name;
          } else {
            console.error('🛠️ Invalid waypoint data:', waypointData);
            return;
          }
          
          window.waypointManager.addWaypoint(
            coords,
            name,
            { 
              isWaypoint: isWaypointMode,
              type: isWaypointMode ? 'WAYPOINT' : 'STOP'
            }
          );
          
          // Show success message
          if (window.LoadingIndicator) {
            window.LoadingIndicator.updateStatusIndicator(
              `Added ${name || 'waypoint'} to route`,
              'success',
              3000
            );
          }
          
          return;
        }
        
        // If we have a callback, use it
        if (this.callbacks && this.callbacks.onMapClick) {
          this.callbacks.onMapClick(waypointData);
        } else {
          console.error('🛠️ No method available to add waypoint');
        }
      } catch (error) {
        console.error('🛠️ Error in direct addWaypoint:', error);
      }
    };
    
    console.log('🛠️ MapInteractionHandler successfully patched');
  };
  
  // Start checking for mapInteractionHandler
  checkMapInteractionHandler();
}

// Execute the patch
patchMapInteractionHandler();

// Run once on load and also when handleMapClick event is triggered
window.addEventListener('load', () => {
  console.log('🛠️ Window loaded, checking for mapInteractionHandler...');
  setTimeout(patchMapInteractionHandler, 2000);
});

// Export a function to manually apply the patch
export default function applyMapInteractionHandlerFixes() {
  return patchMapInteractionHandler();
}