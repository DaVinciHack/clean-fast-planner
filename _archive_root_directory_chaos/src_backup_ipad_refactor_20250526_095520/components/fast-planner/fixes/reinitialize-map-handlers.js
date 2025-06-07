/**
 * reinitialize-map-handlers.js
 * 
 * This fix file is responsible for reinitializing map handlers when the map becomes ready
 */

console.log('🔄 Loading map handler reinitialization fix...');

// Set up a mutation observer to detect when the map is added to the DOM
function setupMapReadyDetector() {
  console.log('🔄 Setting up map ready detector...');
  
  // Function to check if the map is ready
  const checkIfMapReady = () => {
    // Check if map element exists
    const mapElement = document.getElementById('fast-planner-map');
    if (!mapElement) return false;
    
    // Check if maplibregl is loaded
    if (!window.maplibregl) return false;
    
    // Check if map manager exists and has a map
    if (!window.mapManager || !window.mapManager.getMap()) return false;
    
    // All checks passed, map is ready
    console.log('🔄 Map is ready!');
    return true;
  };
  
  // Function to reinitialize handlers
  const reinitializeHandlers = () => {
    console.log('🔄 Reinitializing map handlers...');
    
    // Check for cached managers
    if (window._pendingModeHandlerManagers) {
      const { mapManager, waypointManager, platformManager } = window._pendingModeHandlerManagers;
      
      // Try to import and use the createSeparateHandlers function
      if (typeof window.createSeparateHandlers === 'function') {
        console.log('🔄 Using global createSeparateHandlers function...');
        const handlers = window.createSeparateHandlers(mapManager, waypointManager, platformManager);
        
        if (handlers) {
          console.log('🔄 Successfully created mode handlers with cached managers');
          
          // Activate normal mode by default
          handlers.normalModeHandler.activate();
          
          // Make toggle function available globally
          window.toggleMapMode = (mode) => {
            console.log(`🔄 Toggling to ${mode} mode`);
            
            if (mode === 'waypoint') {
              handlers.normalModeHandler.deactivate();
              handlers.waypointModeHandler.activate();
            } else {
              handlers.waypointModeHandler.deactivate();
              handlers.normalModeHandler.activate();
            }
          };
          
          // Clean up the cached managers
          delete window._pendingModeHandlerManagers;
          
          // Dispatch success event
          window.dispatchEvent(new CustomEvent('mode-handlers-initialized', {
            detail: { success: true }
          }));
        }
      } else {
        console.log('🔄 Global createSeparateHandlers not available, trying dynamic import...');
        
        // Try to dynamically import the function
        import('../modules/waypoints/separate-mode-handler.js')
          .then(module => {
            if (module && module.createSeparateHandlers) {
              console.log('🔄 Successfully imported createSeparateHandlers');
              
              const handlers = module.createSeparateHandlers(mapManager, waypointManager, platformManager);
              
              if (handlers) {
                console.log('🔄 Successfully created mode handlers with dynamic import');
                
                // Activate normal mode by default
                handlers.normalModeHandler.activate();
                
                // Make toggle function available globally
                window.toggleMapMode = (mode) => {
                  console.log(`🔄 Toggling to ${mode} mode`);
                  
                  if (mode === 'waypoint') {
                    handlers.normalModeHandler.deactivate();
                    handlers.waypointModeHandler.activate();
                  } else {
                    handlers.waypointModeHandler.deactivate();
                    handlers.normalModeHandler.activate();
                  }
                };
                
                // Clean up the cached managers
                delete window._pendingModeHandlerManagers;
                
                // Dispatch success event
                window.dispatchEvent(new CustomEvent('mode-handlers-initialized', {
                  detail: { success: true }
                }));
              }
            }
          })
          .catch(error => {
            console.error('🔄 Error importing separate-mode-handler.js:', error);
          });
      }
    }
  };
  
  // Check immediately
  if (checkIfMapReady()) {
    reinitializeHandlers();
    return;
  }
  
  // Set up an interval to check if the map is ready
  const readyCheckInterval = setInterval(() => {
    if (checkIfMapReady()) {
      clearInterval(readyCheckInterval);
      reinitializeHandlers();
    }
  }, 1000);
  
  // Clear the interval after 30 seconds to avoid memory leaks
  setTimeout(() => {
    clearInterval(readyCheckInterval);
  }, 30000);
  
  // Also listen for the map-ready event
  window.addEventListener('map-ready', () => {
    console.log('🔄 Map ready event received');
    reinitializeHandlers();
  });
}

// Listen for the map initialization error event
window.addEventListener('map-initialization-error', (event) => {
  console.log('🔄 Map initialization error event received:', event.detail.message);
  setupMapReadyDetector();
});

// Also set up the detector directly to handle cases where the event was missed
setupMapReadyDetector();

// Make sure createSeparateHandlers is globally available
// This helps with dynamic imports and module access
import('../modules/waypoints/separate-mode-handler.js').then(module => {
  window.createSeparateHandlers = module.createSeparateHandlers;
  window.toggleMode = module.toggleMode;
  console.log('🔄 Made createSeparateHandlers and toggleMode globally available');
}).catch(error => {
  console.error('🔄 Error importing separate-mode-handler.js:', error);
});

console.log('🔄 Map handler reinitialization fix loaded successfully');
