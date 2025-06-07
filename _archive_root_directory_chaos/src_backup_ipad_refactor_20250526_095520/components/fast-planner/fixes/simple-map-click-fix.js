/**
 * Simple map click fix - focuses only on click debouncing and proper insertion
 * This is a minimal solution if the more aggressive approach causes issues
 */

console.log('🔧 Simple map click fix initializing...');

// State variables to track click processing
let isProcessingClick = false;
let lastClickTime = 0;
let CLICK_DEBOUNCE_TIME = 500; // ms
let clickQueue = [];

// Only run if not already applied
if (!window._simpleMapClickFixApplied) {
  // Flag to indicate fix is applied
  window._simpleMapClickFixApplied = true;
  
  // Apply fixes when all managers are available
  function applyFixesWhenReady() {
    // Check if required managers exist
    if (!window.mapManager || !window.waypointManager || !window.mapInteractionHandler) {
      console.log('🔧 Required managers not available yet, waiting...');
      setTimeout(applyFixesWhenReady, 1000);
      return;
    }
    
    console.log('🔧 Required managers found, applying simple map click fix...');
    
    // CORE FIX 1: Patch mapInteractionHandler.handleMapClick
    patchMapClickHandler();
    
    // CORE FIX 2: Patch route drag handling
    patchRouteDragHandler();
    
    // CORE FIX 3: Override waypointManager.addWaypointAtIndex
    patchAddWaypointAtIndex();
    
    // Show notification
    showNotification('Simple map click fix applied', 'success');
    
    console.log('🔧 Simple map click fix applied successfully');
  }
  
  // Fix 1: Patch the map click handler to debounce clicks
  function patchMapClickHandler() {
    try {
      if (!window.mapInteractionHandler || !window.mapInteractionHandler.handleMapClick) {
        console.log('🔧 Map click handler not available');
        return;
      }
      
      // Save original handler
      const originalHandleMapClick = window.mapInteractionHandler.handleMapClick;
      
      // Override with debounced version
      window.mapInteractionHandler.handleMapClick = function(e) {
        // Check if we're already processing a click
        if (isProcessingClick) {
          console.log('🔧 Already processing a click, queueing this one');
          clickQueue.push(e);
          return;
        }
        
        // Debounce rapid clicks
        const now = Date.now();
        if (now - lastClickTime < CLICK_DEBOUNCE_TIME) {
          console.log('🔧 Ignoring rapid click');
          return;
        }
        lastClickTime = now;
        
        // Set processing flag
        isProcessingClick = true;
        
        try {
          // Call original handler
          originalHandleMapClick.call(this, e);
        } catch (error) {
          console.error('🔧 Error in handleMapClick:', error);
        } finally {
          // Reset processing flag
          isProcessingClick = false;
          
          // Process next click in queue if any
          if (clickQueue.length > 0) {
            const nextClick = clickQueue.shift();
            setTimeout(() => {
              this.handleMapClick(nextClick);
            }, 50);
          }
        }
      };
      
      console.log('🔧 Map click handler patched successfully');
    } catch (error) {
      console.error('🔧 Error patching map click handler:', error);
    }
  }
  
  // Fix 2: Patch route drag handling to ensure correct insertion
  function patchRouteDragHandler() {
    try {
      if (!window.mapInteractionHandler || !window.mapInteractionHandler.handleRouteDragComplete) {
        console.log('🔧 Route drag handler not available');
        return;
      }
      
      // Save original handler
      const originalHandleRouteDragComplete = window.mapInteractionHandler.handleRouteDragComplete;
      
      // Override with fixed version
      window.mapInteractionHandler.handleRouteDragComplete = function(insertIndex, coords, dragData = {}) {
        console.log(`🔧 Fixed handleRouteDragComplete called with index ${insertIndex}`);
        
        // Validate insertIndex
        if (insertIndex === undefined || insertIndex === null || insertIndex < 0) {
          console.log('🔧 Invalid insertIndex, using 0 as fallback');
          insertIndex = 0;
        }
        
        // Call original with validated insertIndex
        originalHandleRouteDragComplete.call(this, insertIndex, coords, dragData);
      };
      
      console.log('🔧 Route drag handler patched successfully');
    } catch (error) {
      console.error('🔧 Error patching route drag handler:', error);
    }
  }
  
  // Fix 3: Patch addWaypointAtIndex to ensure correct insertion
  function patchAddWaypointAtIndex() {
    try {
      if (!window.waypointManager || !window.waypointManager.addWaypointAtIndex) {
        console.log('🔧 addWaypointAtIndex not available');
        return;
      }
      
      // Save original method
      const originalAddWaypointAtIndex = window.waypointManager.addWaypointAtIndex;
      
      // Override with fixed version
      window.waypointManager.addWaypointAtIndex = function(coords, name, index, options = {}) {
        console.log(`🔧 Fixed addWaypointAtIndex called with index ${index}`);
        
        // Get current waypoints
        const waypoints = this.getWaypoints();
        
        // Validate index
        if (index === undefined || index === null) {
          console.log('🔧 No index provided, adding at the end');
          index = waypoints.length; // Add at end
        } else if (index < 0) {
          console.log('🔧 Negative index, using 0');
          index = 0;
        } else if (index > waypoints.length) {
          console.log(`🔧 Index ${index} exceeds waypoint count ${waypoints.length}, clamping`);
          index = waypoints.length;
        }
        
        console.log(`🔧 Using validated index ${index} (waypoint count: ${waypoints.length})`);
        
        // Call original with validated index
        return originalAddWaypointAtIndex.call(this, coords, name, index, options);
      };
      
      console.log('🔧 addWaypointAtIndex patched successfully');
    } catch (error) {
      console.error('🔧 Error patching addWaypointAtIndex:', error);
    }
  }
  
  // Helper function to show notification
  function showNotification(message, type = 'info', duration = 3000) {
    try {
      // Try to use LoadingIndicator if available
      if (window.LoadingIndicator && window.LoadingIndicator.updateStatusIndicator) {
        window.LoadingIndicator.updateStatusIndicator(message, type, duration);
        return;
      }
      
      // Fallback - create simple notification
      const notification = document.createElement('div');
      notification.className = 'simple-map-fix-notification';
      notification.style.position = 'fixed';
      notification.style.bottom = '20px';
      notification.style.left = '50%';
      notification.style.transform = 'translateX(-50%)';
      notification.style.backgroundColor = type === 'error' ? 'rgba(231, 76, 60, 0.9)' :
                                          type === 'success' ? 'rgba(46, 204, 113, 0.9)' :
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
      console.error('🔧 Error showing notification:', error);
    }
  }
  
  // Start applying fixes when document is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyFixesWhenReady);
  } else {
    // Document already loaded, start immediately
    applyFixesWhenReady();
  }
  
  // Setup additional fallbacks
  if (typeof window.addEventListener === 'function') {
    // Also listen for map initialization events
    window.addEventListener('map-initialized', applyFixesWhenReady);
    window.addEventListener('waypoints-updated', () => {
      // Reapply fixes after waypoints change
      setTimeout(applyFixesWhenReady, 500);
    });
  }
}

// Export the fix application function
export default function applySimpleMapClickFix() {
  if (!window._simpleMapClickFixApplied) {
    window._simpleMapClickFixApplied = true;
    applyFixesWhenReady();
  }
  return 'Simple map click fix initialized';
}