/**
 * clean-up-duplicate-events.js
 * 
 * This module cleans up duplicate event handlers, removes debug UI,
 * and fixes CSS issues to restore the proper functionality of the FastPlannerApp.
 */

console.log('🧹 Clean-up: Starting removal of duplicate event handlers and debug UI...');

/**
 * Remove debug UI elements
 */
function removeDebugUI() {
  // Remove debug monitors
  const debugMonitors = document.querySelectorAll('.waypoint-stop-debug, .waypoint-debug, .waypoint-stop-debug-monitor');
  debugMonitors.forEach(monitor => {
    console.log('🧹 Removing debug monitor:', monitor);
    monitor.remove();
  });
  
  // Remove debug buttons
  const debugButtons = document.querySelectorAll('#waypoint-stop-debug-button');
  debugButtons.forEach(button => {
    console.log('🧹 Removing debug button:', button);
    button.remove();
  });
  
  // Remove debug popups
  const debugPopups = document.querySelectorAll('.debug-popup, .fix-applied-popup');
  debugPopups.forEach(popup => {
    console.log('🧹 Removing debug popup:', popup);
    popup.remove();
  });
  
  // Remove loading indicators
  const loadingIndicators = document.querySelectorAll('#status-indicator-container');
  loadingIndicators.forEach(indicator => {
    console.log('🧹 Removing loading indicator:', indicator);
    indicator.remove();
  });
}

/**
 * Fix CSS for route stats card
 */
function fixRouteStatsCardCSS() {
  // Add a style tag to override the problematic styles
  const styleTag = document.createElement('style');
  styleTag.id = 'route-stats-card-fix';
  styleTag.innerHTML = `
    /* Override problematic route-stats-card styles */
    .route-stats-card {
      position: absolute !important;
      top: 10px !important;
      left: 50% !important;
      transform: translateX(-50%) !important;
      z-index: 12 !important;
      width: auto !important; /* Auto width instead of fixed */
      min-width: 600px !important; /* Smaller minimum width */
      max-width: 800px !important; /* Limit maximum width */
      border-radius: 6px !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5) !important;
    }
    
    /* Make sure route-stats-card children have correct styles */
    .route-stats-card .route-stats-header {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
    }
    
    /* Fix stats row layout */
    .route-stats-card .stats-row {
      display: flex !important;
      justify-content: space-between !important;
      gap: 8px !important;
    }
    
    /* Fix individual stat items */
    .route-stats-card .route-stat-item {
      flex: 1 !important;
      padding: 0 5px !important;
      border-right: 1px solid rgba(255, 255, 255, 0.1) !important;
    }
    
    /* Remove !important from pointer-events which can interfere with map clicks */
    .left-panel, .right-panel, .route-stats-card {
      pointer-events: auto;
    }
    
    /* Ensure child elements in panels receive interaction events but don't use !important */
    .left-panel *, .right-panel *, .route-stats-card * {
      pointer-events: auto;
    }
  `;
  
  // Add the style tag to the head
  document.head.appendChild(styleTag);
  console.log('🧹 Added fixed CSS for route-stats-card');
}

/**
 * Fix duplicate click handlers
 * This is the main fix that will resolve the double-click issue
 */
function fixDuplicateEventHandlers() {
  // Check if we have access to the map manager
  if (!window.mapManager || !window.mapManager.getMap()) {
    console.log('🧹 Map manager not available yet, will retry...');
    setTimeout(fixDuplicateEventHandlers, 1000);
    return;
  }
  
  const map = window.mapManager.getMap();
  
  // Get all click event listeners
  const allHandlers = map._listeners ? map._listeners.click || [] : [];
  console.log(`🧹 Found ${allHandlers.length} click handlers registered on the map`);
  
  if (allHandlers.length > 1) {
    // Save the first click handler (which should be the main one)
    const mainHandler = allHandlers[0];
    
    // Remove all click handlers
    map.off('click');
    
    // Add back just the main one
    map.on('click', mainHandler);
    
    console.log(`🧹 Removed ${allHandlers.length - 1} duplicate click handlers`);
  }
  
  // Ensure only one handler for MapInteractionHandler
  if (window.mapInteractionHandler) {
    console.log('🧹 Reinitializing the map interaction handler...');
    
    // Save the callbacks
    const callbacks = window.mapInteractionHandler.callbacks;
    
    // Reinitialize
    window.mapInteractionHandler.initialize();
    
    // Restore callbacks that might have been lost
    for (const [type, callback] of Object.entries(callbacks)) {
      if (callback) {
        window.mapInteractionHandler.setCallback(type, callback);
      }
    }
    
    console.log('🧹 Map interaction handler reinitialized');
  }
}

/**
 * Fix waypoint mode global flag
 */
function fixWaypointModeFlag() {
  // Ensure the global flag is properly set
  if (typeof window.isWaypointModeActive === 'undefined') {
    console.log('🧹 Setting global waypoint mode flag to false');
    window.isWaypointModeActive = false;
    
    // Also update the body attribute
    if (document.body) {
      document.body.removeAttribute('data-waypoint-mode');
    }
  }
  
  // Create a clean toggleWaypointMode function if it doesn't exist
  if (!window._cleanToggleWaypointMode) {
    window._cleanToggleWaypointMode = (active) => {
      console.log(`🧹 Clean toggle waypoint mode: ${active ? 'ON' : 'OFF'}`);
      
      // Set the global flag
      window.isWaypointModeActive = active;
      
      // Update the body attribute for visual indication
      if (document.body) {
        if (active) {
          document.body.setAttribute('data-waypoint-mode', 'active');
        } else {
          document.body.removeAttribute('data-waypoint-mode');
        }
      }
      
      // Toggle platform manager's waypoint mode if available
      if (window.platformManager && typeof window.platformManager.toggleWaypointMode === 'function') {
        const regionId = window.currentRegion ? window.currentRegion.osdkRegion || window.currentRegion.name : null;
        window.platformManager.toggleWaypointMode(active, window.client, regionId);
      }
      
      return active;
    };
  }
}

/**
 * Apply all fixes
 */
function applyAllFixes() {
  // Remove debug UI
  removeDebugUI();
  
  // Fix CSS
  fixRouteStatsCardCSS();
  
  // Fix waypoint mode flag
  fixWaypointModeFlag();
  
  // Fix duplicate event handlers (needs to run last)
  fixDuplicateEventHandlers();
  
  console.log('🧹 All fixes applied successfully');
}

// Apply fixes immediately
applyAllFixes();

// Set up a periodic cleanup to catch any late-loaded debug UI
const cleanupInterval = setInterval(removeDebugUI, 1000);

// After 10 seconds, reduce the frequency to avoid unnecessary work
setTimeout(() => {
  clearInterval(cleanupInterval);
  setInterval(removeDebugUI, 5000);
}, 10000);

// Expose a function to manually apply fixes
window.cleanUpDuplicateEvents = applyAllFixes;

console.log('🧹 Clean-up script initialized, fixes will be applied periodically');

export default applyAllFixes;
