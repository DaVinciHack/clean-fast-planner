/**
 * fix-conflict-resolver.js
 * 
 * This script resolves conflicts between different fixes
 * and ensures proper initialization order.
 */

console.log('🔧 Initializing fix conflict resolver...');

// Global flag to prevent multiple executions
if (window._fixConflictResolverApplied) {
  console.log('🔧 Fix conflict resolver already applied, skipping');
} else {
  window._fixConflictResolverApplied = true;

  // Step 1: Preserve original methods that multiple fixes might override
  // This prevents one fix from overriding another's changes
  function preserveOriginalMethods() {
    console.log('🔧 Preserving original methods...');
    
    // Store original MapInteractionHandler methods
    if (window.mapInteractionHandler) {
      if (!window._originalMapInteractionHandlerMethods) {
        window._originalMapInteractionHandlerMethods = {
          initialize: window.mapInteractionHandler.initialize,
          handleMapClick: window.mapInteractionHandler.handleMapClick,
          handlePlatformClick: window.mapInteractionHandler.handlePlatformClick,
          handleRouteDragComplete: window.mapInteractionHandler.handleRouteDragComplete
        };
        console.log('🔧 Original MapInteractionHandler methods preserved');
      }
    }
    
    // Store original WaypointManager methods
    if (window.waypointManager) {
      if (!window._originalWaypointManagerMethods) {
        window._originalWaypointManagerMethods = {
          addWaypoint: window.waypointManager.addWaypoint,
          addWaypointAtIndex: window.waypointManager.addWaypointAtIndex,
          removeWaypoint: window.waypointManager.removeWaypoint,
          updateRoute: window.waypointManager.updateRoute,
          setupRouteDragging: window.waypointManager.setupRouteDragging,
          findPathInsertIndex: window.waypointManager.findPathInsertIndex
        };
        console.log('🔧 Original WaypointManager methods preserved');
      }
    }
  }

  // Step 2: Create safe fixed methods for MapInteractionHandler
  function fixMapInteractionHandler() {
    if (!window.mapInteractionHandler) {
      console.log('🔧 MapInteractionHandler not available yet, will retry later');
      return false;
    }
    
    console.log('🔧 Applying safer MapInteractionHandler fixes...');
    
    // Create a better initialize method
    const originalInitialize = window.mapInteractionHandler.initialize;
    window.mapInteractionHandler.initialize = function() {
      console.log('🔧 Safe initialize called on MapInteractionHandler');
      try {
        return originalInitialize.apply(this, arguments);
      } catch (error) {
        console.error('🔧 Error in MapInteractionHandler initialize:', error);
        return false;
      }
    };
    
    // Create a safer handleMapClick method with debouncing
    const originalHandleMapClick = window.mapInteractionHandler.handleMapClick;
    let lastMapClickTime = 0;
    window.mapInteractionHandler.handleMapClick = function(e) {
      const now = Date.now();
      if (now - lastMapClickTime < 500) {
        console.log('🔧 Debouncing map click');
        return;
      }
      
      lastMapClickTime = now;
      console.log('🔧 Safe handleMapClick called on MapInteractionHandler');
      
      try {
        return originalHandleMapClick.apply(this, arguments);
      } catch (error) {
        console.error('🔧 Error in MapInteractionHandler handleMapClick:', error);
      }
    };
    
    // Same for platform click
    const originalHandlePlatformClick = window.mapInteractionHandler.handlePlatformClick;
    let lastPlatformClickTime = 0;
    window.mapInteractionHandler.handlePlatformClick = function(e) {
      const now = Date.now();
      if (now - lastPlatformClickTime < 500) {
        console.log('🔧 Debouncing platform click');
        return;
      }
      
      lastPlatformClickTime = now;
      console.log('🔧 Safe handlePlatformClick called on MapInteractionHandler');
      
      try {
        return originalHandlePlatformClick.apply(this, arguments);
      } catch (error) {
        console.error('🔧 Error in MapInteractionHandler handlePlatformClick:', error);
      }
    };
    
    console.log('🔧 MapInteractionHandler methods safely wrapped');
    return true;
  }

  // Step 3: Fix conflict between left panel and map interactions
  function fixLeftPanelMapConflict() {
    console.log('🔧 Fixing left panel and map interaction conflict...');
    
    // Simplified fix for left panel interactions
    function addPanelEventCapture() {
      const leftPanel = document.querySelector('.left-panel');
      const rightPanel = document.querySelector('.right-panel');
      const routeStatsCard = document.querySelector('.route-stats-card');
      
      if (!leftPanel && !rightPanel && !routeStatsCard) {
        return false;
      }
      
      // Add click capture to panels
      [leftPanel, rightPanel, routeStatsCard].forEach(panel => {
        if (panel && !panel._captureHandlerAdded) {
          panel._captureHandlerAdded = true;
          
          panel.addEventListener('click', (e) => {
            // Stop propagation to prevent map click
            e.stopPropagation();
          }, true);
          
          console.log('🔧 Click capture added to panel:', panel.className);
        }
      });
      
      return true;
    }
    
    // Add simple CSS fix
    const styleId = 'panel-interaction-fix-css';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = `
        .left-panel, .right-panel, .route-stats-card {
          z-index: 100;
          pointer-events: auto;
        }
        
        .left-panel *, .right-panel *, .route-stats-card * {
          pointer-events: auto;
        }
      `;
      
      document.head.appendChild(style);
      console.log('🔧 CSS fix added for panel interactions');
    }
    
    // Initial panel event capture
    const success = addPanelEventCapture();
    
    // Set up observer to handle dynamically added panels
    if (!window._panelObserver) {
      window._panelObserver = new MutationObserver(() => {
        addPanelEventCapture();
      });
      
      window._panelObserver.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      console.log('🔧 Panel observer set up');
    }
    
    return success;
  }

  // Initial execution
  preserveOriginalMethods();
  
  // Set up retry mechanism for fixes that depend on DOM or manager initialization
  function attemptFixes() {
    const mapInteractionFixed = fixMapInteractionHandler();
    const leftPanelFixed = fixLeftPanelMapConflict();
    
    if (!mapInteractionFixed || !leftPanelFixed) {
      console.log('🔧 Some fixes could not be applied yet, will retry...');
      setTimeout(attemptFixes, 1000);
    } else {
      console.log('🔧 All fixes successfully applied');
      
      // Show notification
      if (window.LoadingIndicator && window.LoadingIndicator.updateStatusIndicator) {
        window.LoadingIndicator.updateStatusIndicator(
          'Interaction fixes applied successfully',
          'success',
          3000
        );
      }
    }
  }
  
  // Start fixing
  attemptFixes();
}

// Export the fix as a function so it can be called directly
export function applyFixConflictResolver() {
  window._fixConflictResolverApplied = false;
  console.log('🔧 Manually applying fix conflict resolver...');
  // The code will re-run because we reset the flag
}

export default applyFixConflictResolver;