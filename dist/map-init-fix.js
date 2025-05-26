/**
 * Map Initialization and Repair Script
 * This script handles issues where the map fails to initialize properly.
 */

console.log('🗺️ Map Initialization Repair Script loaded');

// Store the original console.error to preserve logging
const originalConsoleError = console.error;

// Set up intercept of map initialization errors
console.error = function(...args) {
  // Call the original function first
  originalConsoleError.apply(console, args);
  
  // Check if this is a map initialization error
  const errorMessage = args.join(' ').toLowerCase();
  if (
    errorMessage.includes('map is not initialized') || 
    errorMessage.includes('cannot create handlers: map is not initialized') ||
    errorMessage.includes('maplibre') ||
    errorMessage.includes('map manager') ||
    errorMessage.includes('getmap')
  ) {
    console.log('🗺️ Detected map initialization error, attempting repair...');
    attemptMapRepair();
  }
};

// Handle clicks on map area to detect unresponsive map
document.addEventListener('click', function(e) {
  // Check if clicking on the map element
  const mapElement = document.getElementById('fast-planner-map');
  if (mapElement && mapElement.contains(e.target)) {
    // If map is supposed to be ready but clicks aren't working
    if (window.mapManager && window.mapManager.getMap && !window.mapClickTestPassed) {
      console.log('🗺️ Click on map detected, testing if map is responsive...');
      
      // Set a flag to track if we've tried to test the map
      window.mapClickTestInProgress = true;
      
      // Test if map click events work by attempting to get features
      try {
        const map = window.mapManager.getMap();
        if (map) {
          // Try to query features at the click point
          const features = map.queryRenderedFeatures([e.clientX, e.clientY]);
          
          // If we got features (even empty array), the map is working
          if (Array.isArray(features)) {
            console.log('🗺️ Map appears to be working, click test passed');
            window.mapClickTestPassed = true;
          } else {
            console.log('🗺️ Map click test failed, attempting repair...');
            attemptMapRepair();
          }
        } else {
          console.log('🗺️ Map not available for click test, attempting repair...');
          attemptMapRepair();
        }
      } catch (error) {
        console.error('🗺️ Error testing map click:', error);
        attemptMapRepair();
      }
      
      // Clear the test flag
      window.mapClickTestInProgress = false;
    }
  }
});

// Function to attempt map repair
function attemptMapRepair() {
  console.log('🗺️ Attempting map repair procedures...');
  
  // Add a Map Repair button to the UI
  if (!document.getElementById('map-repair-button')) {
    const repairButton = document.createElement('button');
    repairButton.id = 'map-repair-button';
    repairButton.innerText = 'Repair Map';
    repairButton.style.position = 'fixed';
    repairButton.style.bottom = '50px';
    repairButton.style.left = '10px';
    repairButton.style.zIndex = '9999';
    repairButton.style.backgroundColor = '#ff6b6b';
    repairButton.style.color = 'white';
    repairButton.style.padding = '8px 16px';
    repairButton.style.borderRadius = '4px';
    repairButton.style.border = 'none';
    repairButton.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
    repairButton.style.cursor = 'pointer';
    
    // Add button click handler
    repairButton.onclick = function() {
      console.log('🗺️ Map repair button clicked');
      
      // Show repair message
      if (window.LoadingIndicator && window.LoadingIndicator.updateStatusIndicator) {
        window.LoadingIndicator.updateStatusIndicator('Attempting to repair map...', 'info', 5000);
      }
      
      // First check if mapManager exists and try to initialize
      if (window.mapManager) {
        console.log('🗺️ mapManager exists, attempting to reinitialize');
        
        try {
          // Try to reinitialize the map
          if (typeof window.mapManager.reInitializeMap === 'function') {
            window.mapManager.reInitializeMap('fast-planner-map')
              .then(() => {
                console.log('🗺️ Map reinitialized successfully');
                
                // Show success message
                if (window.LoadingIndicator && window.LoadingIndicator.updateStatusIndicator) {
                  window.LoadingIndicator.updateStatusIndicator('Map repaired successfully!', 'success');
                }
                
                // Hide the repair button
                repairButton.style.display = 'none';
                
                // Dispatch a custom event to trigger reinitialization of handlers
                window.dispatchEvent(new CustomEvent('map-repaired'));
              })
              .catch(error => {
                console.error('🗺️ Error reinitializing map:', error);
                
                // Show error message
                if (window.LoadingIndicator && window.LoadingIndicator.updateStatusIndicator) {
                  window.LoadingIndicator.updateStatusIndicator('Map repair failed. Try reloading the page.', 'error');
                }
              });
          } else {
            console.log('🗺️ No reInitializeMap method available, trying alternative repair');
            
            // Try to force reload just the map scripts
            if (window.mapManager.loadScripts) {
              window.mapManager.loadScripts()
                .then(() => {
                  console.log('🗺️ Map scripts reloaded');
                  
                  // Try to initialize again
                  return window.mapManager.initializeMap('fast-planner-map');
                })
                .then(mapInstance => {
                  console.log('🗺️ Map initialized successfully after script reload');
                  
                  // Show success message
                  if (window.LoadingIndicator && window.LoadingIndicator.updateStatusIndicator) {
                    window.LoadingIndicator.updateStatusIndicator('Map repaired successfully!', 'success');
                  }
                  
                  // Hide the repair button
                  repairButton.style.display = 'none';
                  
                  // Dispatch a custom event to trigger reinitialization of handlers
                  window.dispatchEvent(new CustomEvent('map-repaired'));
                })
                .catch(error => {
                  console.error('🗺️ Error in alternative map repair:', error);
                  
                  // Show error message
                  if (window.LoadingIndicator && window.LoadingIndicator.updateStatusIndicator) {
                    window.LoadingIndicator.updateStatusIndicator('Map repair failed. Try reloading the page.', 'error');
                  }
                });
            }
          }
        } catch (error) {
          console.error('🗺️ Error attempting map repair:', error);
          
          // Show error message
          if (window.LoadingIndicator && window.LoadingIndicator.updateStatusIndicator) {
            window.LoadingIndicator.updateStatusIndicator('Map repair failed. Try reloading the page.', 'error');
          }
        }
      } else {
        console.error('🗺️ mapManager not available, cannot repair');
        
        // Show error message
        if (window.LoadingIndicator && window.LoadingIndicator.updateStatusIndicator) {
          window.LoadingIndicator.updateStatusIndicator('Map manager not available. Try reloading the page.', 'error');
        }
      }
    };
    
    // Add button to the DOM
    document.body.appendChild(repairButton);
    
    // Show notification about the repair button
    if (window.LoadingIndicator && window.LoadingIndicator.updateStatusIndicator) {
      window.LoadingIndicator.updateStatusIndicator('Map issues detected. Use the "Repair Map" button if clicking on the map does not work.', 'warning', 10000);
    }
  }
}

// Wait for the app to be fully loaded to ensure we can detect issues
window.addEventListener('load', function() {
  console.log('🗺️ Window loaded, setting up map click detection');
  
  // Wait a bit for any initialization processes to complete
  setTimeout(() => {
    // Check if map click is needed
    const mapElement = document.getElementById('fast-planner-map');
    if (mapElement) {
      console.log('🗺️ Map element found, checking if map is properly initialized');
      
      if (window.mapManager && window.mapManager.getMap && window.mapManager.getMap()) {
        console.log('🗺️ Map appears to be properly initialized');
      } else {
        console.log('🗺️ Map initialization issues detected at startup');
        attemptMapRepair();
      }
    }
  }, 3000);
});

// Handle map-initialization-error events
window.addEventListener('map-initialization-error', function(e) {
  console.log('🗺️ Map initialization error event received');
  attemptMapRepair();
});

// Initialize additional map repair handlers
window.addMapRepairHandler = function(handlerFn) {
  if (typeof handlerFn === 'function') {
    window.addEventListener('map-repaired', handlerFn);
    console.log('🗺️ Added custom map repair handler');
    return true;
  }
  return false;
};

console.log('🗺️ Map Initialization Repair Script ready');
