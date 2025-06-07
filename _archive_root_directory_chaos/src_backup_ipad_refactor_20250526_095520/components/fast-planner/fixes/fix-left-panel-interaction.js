/**
 * fix-left-panel-interaction.js
 * 
 * Specifically fixes the issue where the left panel interactions trigger
 * map clicks underneath instead of working properly
 */

console.log('🛠️ Applying left panel interaction fix...');

// Check if fix already applied
if (!window._leftPanelInteractionFixApplied) {
  window._leftPanelInteractionFixApplied = true;
  
  // Apply the fix when the DOM is ready
  function applyFixWhenReady() {
    // Check if document body is available
    if (!document.body) {
      console.log('🛠️ Waiting for document body...');
      setTimeout(applyFixWhenReady, 500);
      return;
    }
    
    console.log('🛠️ Document body found, applying left panel interaction fix...');
    
    // First fix: Ensure clicks on panels don't propagate to the map
    function fixPanelInteractions() {
      // Target panels and their child elements
      const leftPanel = document.querySelector('.left-panel');
      const rightPanel = document.querySelector('.right-panel');
      const routeStatsCard = document.querySelector('.route-stats-card');
      
      if (!leftPanel && !rightPanel && !routeStatsCard) {
        console.log('🛠️ Panels not found yet, will retry...');
        setTimeout(fixPanelInteractions, 1000);
        return;
      }
      
      console.log('🛠️ Found panels, applying interaction fix...');
      
      // Function to make a panel capture all events
      function makeElementCaptureEvents(element, name) {
        if (!element) return;
        
        console.log(`🛠️ Adding event capture to ${name}`);
        
        // Add a high z-index to ensure it's above the map
        const currentZIndex = parseInt(window.getComputedStyle(element).zIndex) || 0;
        if (currentZIndex < 100) {
          element.style.zIndex = '100';
        }
        
        // Ensure the element has position set for z-index to work
        const position = window.getComputedStyle(element).position;
        if (position === 'static') {
          element.style.position = 'relative';
        }
        
        // Add event listeners to capture and stop propagation
        element.addEventListener('click', (e) => {
          // Stop propagation but let the event continue within the panel
          e.stopPropagation();
        }, true);
        
        element.addEventListener('mousedown', (e) => {
          // Stop propagation but let the event continue within the panel
          e.stopPropagation();
        }, true);
        
        element.addEventListener('mouseup', (e) => {
          // Stop propagation but let the event continue within the panel
          e.stopPropagation();
        }, true);
        
        // Add a pointer-events CSS property to ensure clicks work
        element.style.pointerEvents = 'auto';
        
        console.log(`🛠️ Event capture added to ${name}`);
      }
      
      // Apply to all panels
      if (leftPanel) makeElementCaptureEvents(leftPanel, 'left panel');
      if (rightPanel) makeElementCaptureEvents(rightPanel, 'right panel');
      if (routeStatsCard) makeElementCaptureEvents(routeStatsCard, 'route stats card');
      
      // Also fix specific interactive elements that might be problematic
      const interactiveElements = document.querySelectorAll('.waypoint-item, .favorite-location, button, input, select');
      interactiveElements.forEach((el, index) => {
        el.addEventListener('click', (e) => {
          e.stopPropagation();
        }, true);
      });
      
      console.log(`🛠️ Applied event capture to ${interactiveElements.length} interactive elements`);
      
      // Second fix: Add a CSS fix to ensure proper pointer events
      addCSSFix();
    }
    
    // Add CSS fix to ensure clicks work properly
    function addCSSFix() {
      // Check if the style element already exists
      if (document.getElementById('left-panel-interaction-fix-css')) {
        return;
      }
      
      console.log('🛠️ Adding CSS fixes for panel interactions');
      
      // Create style element
      const style = document.createElement('style');
      style.id = 'left-panel-interaction-fix-css';
      style.innerHTML = `
        /* Ensure panels receive clicks properly */
        .left-panel, .right-panel, .route-stats-card {
          pointer-events: auto !important;
          z-index: 100 !important;
          position: relative !important;
        }
        
        /* Ensure all interactive elements inside panels receive clicks */
        .left-panel *, .right-panel *, .route-stats-card * {
          pointer-events: auto !important;
        }
        
        /* Specific fixes for common problematic elements */
        .waypoint-item, .favorite-location, button, input, select {
          pointer-events: auto !important;
          position: relative !important;
          z-index: 101 !important;
        }
        
        /* Ensure the map doesn't interfere with panel clicks */
        .maplibregl-canvas-container, .mapboxgl-canvas-container {
          pointer-events: auto;
        }
        
        /* Only when panels are open, restrict map clicks */
        body.panel-open .maplibregl-canvas-container,
        body.panel-open .mapboxgl-canvas-container {
          pointer-events: none;
        }
        
        /* But still allow clicks on map controls */
        body.panel-open .maplibregl-ctrl-group,
        body.panel-open .mapboxgl-ctrl-group {
          pointer-events: auto !important;
        }
      `;
      
      // Add to document head
      document.head.appendChild(style);
      
      console.log('🛠️ CSS fixes added for panel interactions');
      
      // Add a class to body when panels are open
      trackPanelOpenState();
    }
    
    // Track when panels are open to adjust map click behavior
    function trackPanelOpenState() {
      // Function to check if any panel is currently open
      function updatePanelOpenState() {
        const leftPanel = document.querySelector('.left-panel');
        const rightPanel = document.querySelector('.right-panel');
        
        const isLeftPanelOpen = leftPanel && 
          window.getComputedStyle(leftPanel).display !== 'none' && 
          !leftPanel.classList.contains('hidden');
          
        const isRightPanelOpen = rightPanel && 
          window.getComputedStyle(rightPanel).display !== 'none' && 
          !rightPanel.classList.contains('hidden');
        
        // Update body class based on panel state
        if (isLeftPanelOpen || isRightPanelOpen) {
          document.body.classList.add('panel-open');
        } else {
          document.body.classList.remove('panel-open');
        }
      }
      
      // Initial check
      updatePanelOpenState();
      
      // Set up a mutation observer to track panel visibility changes
      const observer = new MutationObserver((mutations) => {
        let needsUpdate = false;
        
        mutations.forEach(mutation => {
          if (mutation.type === 'attributes' && 
              (mutation.attributeName === 'class' || mutation.attributeName === 'style')) {
            needsUpdate = true;
          } else if (mutation.type === 'childList') {
            const addedPanels = Array.from(mutation.addedNodes).some(node => 
              node.classList && (node.classList.contains('left-panel') || node.classList.contains('right-panel'))
            );
            
            const removedPanels = Array.from(mutation.removedNodes).some(node => 
              node.classList && (node.classList.contains('left-panel') || node.classList.contains('right-panel'))
            );
            
            if (addedPanels || removedPanels) {
              needsUpdate = true;
            }
          }
        });
        
        if (needsUpdate) {
          updatePanelOpenState();
        }
      });
      
      // Observe the body for panel changes
      observer.observe(document.body, { 
        attributes: true,
        childList: true,
        subtree: true,
        attributeFilter: ['class', 'style']
      });
      
      console.log('🛠️ Panel open state tracking initialized');
    }
    
    // Start fixing panel interactions
    fixPanelInteractions();
    
    // Setup periodic check to ensure fixes are still applied
    // (in case panels are dynamically added/removed)
    setInterval(fixPanelInteractions, 5000);
    
    // Show notification that fix is applied
    showNotification('Left panel interaction fix applied', 'success');
    
    console.log('🛠️ Left panel interaction fix applied successfully');
  }
  
  // Helper function to show a notification
  function showNotification(message, type = 'info', duration = 3000) {
    try {
      // Try to use LoadingIndicator if available
      if (window.LoadingIndicator && window.LoadingIndicator.updateStatusIndicator) {
        window.LoadingIndicator.updateStatusIndicator(message, type, duration);
        return;
      }
      
      // Fallback - create a simple notification
      const notification = document.createElement('div');
      notification.className = 'left-panel-fix-notification';
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
      console.error('🛠️ Error showing notification:', error);
    }
  }
  
  // Start applying the fix
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyFixWhenReady);
  } else {
    // Document already loaded, start immediately
    applyFixWhenReady();
  }
  
  // Also listen for any dynamic panel creation
  window.addEventListener('load', () => {
    // Apply fix after a short delay to ensure all panels are loaded
    setTimeout(applyFixWhenReady, 1000);
  });
}

// Export the fix function so it can be called manually if needed
export function applyLeftPanelInteractionFix() {
  window._leftPanelInteractionFixApplied = false; // Reset to force re-application
  applyFixWhenReady();
  return 'Left panel interaction fix initialized';
}

export default applyLeftPanelInteractionFix;
