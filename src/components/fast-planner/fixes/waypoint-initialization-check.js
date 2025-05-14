/**
 * Waypoint Initialization Check Fix
 * 
 * This file helps ensure that WaypointInsertionManager is properly initialized
 * by checking and retrying initialization and displaying a debug indicator.
 */

console.log('🔍 Waypoint Initialization Check running...');

// Create a retry function for WaypointInsertionManager
function checkAndFixWaypointManagerInitialization() {
  console.log('🔍 Checking WaypointInsertionManager initialization...');
  
  // Run this check 3 seconds after page load to allow managers to initialize
  setTimeout(() => {
    // First check if required globals are available
    const mapManagerAvailable = window.mapManager !== undefined;
    const waypointManagerAvailable = window.waypointManager !== undefined;
    
    // Create a debug indicator if it doesn't exist
    let debugIndicator = document.querySelector('#waypoint-debug-indicator');
    if (!debugIndicator) {
      debugIndicator = document.createElement('div');
      debugIndicator.id = 'waypoint-debug-indicator';
      debugIndicator.style.position = 'fixed';
      debugIndicator.style.bottom = '10px';
      debugIndicator.style.right = '10px';
      debugIndicator.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      debugIndicator.style.color = 'white';
      debugIndicator.style.padding = '5px 10px';
      debugIndicator.style.borderRadius = '4px';
      debugIndicator.style.fontSize = '12px';
      debugIndicator.style.zIndex = '9999';
      document.body.appendChild(debugIndicator);
    }
    
    // Update the debug indicator with status
    debugIndicator.innerHTML = `
      <div>🔍 Waypoint Debug:</div>
      <div>MapManager: ${mapManagerAvailable ? '✅' : '❌'}</div>
      <div>WaypointManager: ${waypointManagerAvailable ? '✅' : '❌'}</div>
      <div>Map Initialized: ${mapManagerAvailable && window.mapManager.getMap() ? '✅' : '❌'}</div>
    `;
    
    // If needed managers are not available, retry initialization
    if (!mapManagerAvailable || !waypointManagerAvailable) {
      console.log('🔍 Critical managers missing, cannot fix initialization');
      debugIndicator.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
      return;
    }
    
    // Check if the map is initialized
    const map = window.mapManager.getMap();
    if (!map) {
      console.log('🔍 Map not initialized yet, waiting...');
      debugIndicator.innerHTML += `<div>Status: Waiting for map ⏳</div>`;
      
      // Check again in 2 seconds
      setTimeout(checkAndFixWaypointManagerInitialization, 2000);
      return;
    }
    
    // Add "Fix" button to debug indicator
    debugIndicator.innerHTML += `
      <button id="fix-waypoint-initialization" style="margin-top: 5px; padding: 2px 5px; cursor: pointer; background: #4CAF50; border: none; color: white; border-radius: 3px;">
        Fix Initialization
      </button>
    `;
    
    // Add click handler to the fix button
    document.getElementById('fix-waypoint-initialization').addEventListener('click', () => {
      console.log('🔍 Manual fix requested, attempting to reinitialize WaypointInsertionManager...');
      
      try {
        // Create an emergency initialization for WaypointInsertionManager
        if (window.mapManager && window.waypointManager && window.platformManager) {
          // Import needed modules dynamically
          import('../modules/waypoints/WaypointInsertionManager.js').then(module => {
            const WaypointInsertionManager = module.default;
            
            // Create a new instance
            const emergencyManager = new WaypointInsertionManager(
              window.mapManager,
              window.waypointManager,
              window.platformManager
            );
            
            // Try to initialize it
            const initialized = emergencyManager.initialize();
            
            if (initialized) {
              console.log('🔍 Successfully created emergency WaypointInsertionManager');
              window.waypointInsertionManager = emergencyManager;
              
              // Update interface for user feedback
              debugIndicator.innerHTML += `<div style="color: #4CAF50;">✅ Fixed! Refresh page to apply.</div>`;
              
              // Add refresh button
              debugIndicator.innerHTML += `
                <button id="refresh-page" style="margin-top: 5px; padding: 2px 5px; cursor: pointer; background: #2196F3; border: none; color: white; border-radius: 3px;">
                  Refresh Page
                </button>
              `;
              
              document.getElementById('refresh-page').addEventListener('click', () => {
                window.location.reload();
              });
              
              // Show success notification
              if (window.LoadingIndicator) {
                window.LoadingIndicator.updateStatusIndicator(
                  'Fixed waypoint initialization issues. Please refresh the page.',
                  'success',
                  8000
                );
              }
            } else {
              console.error('🔍 Failed to initialize emergency WaypointInsertionManager');
              debugIndicator.innerHTML += `<div style="color: #F44336;">❌ Fix failed. Try refresh.</div>`;
              
              // Show error notification
              if (window.LoadingIndicator) {
                window.LoadingIndicator.updateStatusIndicator(
                  'Could not fix waypoint issues. Please try refreshing the page.',
                  'error',
                  5000
                );
              }
            }
          }).catch(error => {
            console.error('🔍 Error importing WaypointInsertionManager:', error);
            debugIndicator.innerHTML += `<div style="color: #F44336;">❌ Import failed: ${error.message}</div>`;
          });
        } else {
          console.error('🔍 Required managers not available for fix');
          debugIndicator.innerHTML += `<div style="color: #F44336;">❌ Required managers missing</div>`;
        }
      } catch (error) {
        console.error('🔍 Error in fix attempt:', error);
        debugIndicator.innerHTML += `<div style="color: #F44336;">❌ Error: ${error.message}</div>`;
      }
    });
    
    // Hide the debug indicator after 10 seconds (but keep it accessible via console)
    setTimeout(() => {
      debugIndicator.style.opacity = '0.2';
      debugIndicator.addEventListener('mouseenter', () => {
        debugIndicator.style.opacity = '1';
      });
      debugIndicator.addEventListener('mouseleave', () => {
        debugIndicator.style.opacity = '0.2';
      });
    }, 10000);
    
    // Make available globally
    window._waypointDebug = {
      show: () => { debugIndicator.style.opacity = '1'; },
      hide: () => { debugIndicator.style.opacity = '0.2'; },
      remove: () => { document.body.removeChild(debugIndicator); },
      check: checkAndFixWaypointManagerInitialization
    };
  }, 3000);
}

// Run the initialization check
checkAndFixWaypointManagerInitialization();

// Create a global function to force reinitialize waypoints
window.reinitializeWaypoints = function() {
  console.log('🔄 Forcing waypoint reinitialization...');
  
  try {
    // Only attempt if we have the necessary managers
    if (window.mapManager && window.waypointManager && window.platformManager) {
      // Import needed modules dynamically
      import('../modules/waypoints/index.js').then(module => {
        // Reinitialize the handlers
        if (typeof module.reinitializeHandlers === 'function') {
          const handlers = module.reinitializeHandlers();
          if (handlers) {
            console.log('🔄 Successfully reinitialized waypoint handlers:', handlers);
            
            // Show success notification
            if (window.LoadingIndicator) {
              window.LoadingIndicator.updateStatusIndicator(
                'Waypoint handlers reinitialized successfully',
                'success',
                5000
              );
            }
            
            return true;
          }
        }
        
        console.error('🔄 reinitializeHandlers not available or failed');
        return false;
      }).catch(error => {
        console.error('🔄 Error importing waypoints module:', error);
        return false;
      });
    } else {
      console.error('🔄 Required managers not available for reinitialization');
      return false;
    }
  } catch (error) {
    console.error('🔄 Error in reinitialization attempt:', error);
    return false;
  }
};

// Export the check function (though this will generally be run on import)
export default checkAndFixWaypointManagerInitialization;