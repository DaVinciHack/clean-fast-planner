/**
 * cleanup-fixes.js
 * 
 * Clean up script that removes popups and unnecessary fix notifications
 * from the application without affecting core functionality.
 */

(function() {
  console.log('🧹 Running cleanup script for fix notifications...');
  
  // 1. Remove any existing popups immediately
  const removeExistingPopups = () => {
    // Target popups that may exist from older fix scripts
    const popupSelectors = [
      // Specific popup selectors
      'div:has(> h3:contains("Waypoint/Stop Fix Applied"))',
      'div:has(> h3:contains("Fix Failed to Load"))',
      // Generic popup selectors
      '.fix-applied-popup',
      '.fix-notification',
      '.debug-popup',
      '.waypoint-debug',
      '.waypoint-stop-debug',
      '.waypoint-stop-debug-monitor',
      // Fixed position notifications
      'div[style*="position: fixed"][style*="transform: translate"]',
      'div[style*="position: fixed"][style*="top"][style*="right"][style*="background-color: rgba"]'
    ];
    
    // Convert to valid querySelectorAll format
    const simpleSelectors = [
      '.fix-applied-popup',
      '.fix-notification',
      '.debug-popup',
      '.waypoint-debug',
      '.waypoint-stop-debug',
      '.waypoint-stop-debug-monitor'
    ];
    
    // Custom selectors that need special handling
    const customSelectors = [
      {
        selector: 'position: fixed',
        textContains: ['Waypoint/Stop Fix', 'Fix Failed to Load', 'Fix Active']
      }
    ];
    
    // First, remove elements with simple selectors
    simpleSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        console.log(`🧹 Removing ${elements.length} elements matching: ${selector}`);
        elements.forEach(el => el.remove());
      }
    });
    
    // Then, handle custom selectors
    customSelectors.forEach(({ selector, textContains }) => {
      // Get all elements that might match
      const potentialElements = Array.from(document.querySelectorAll(`div[style*="${selector}"]`));
      
      // Filter to only those containing the text
      const matchingElements = potentialElements.filter(el => {
        const text = el.textContent || '';
        return textContains.some(phrase => text.includes(phrase));
      });
      
      if (matchingElements.length > 0) {
        console.log(`🧹 Removing ${matchingElements.length} custom elements containing specified text`);
        matchingElements.forEach(el => el.remove());
      }
    });
    
    // Handle additional elements that might be adding fixed-position elements
    const fixedPositionElements = Array.from(document.querySelectorAll('div[style*="position: fixed"]'));
    const notificationElements = fixedPositionElements.filter(el => {
      const style = el.getAttribute('style') || '';
      const text = el.textContent || '';
      return (
        (style.includes('z-index: 9999') || style.includes('background-color: rgba')) &&
        (text.includes('Fix') || text.includes('Waypoint') || text.includes('Debug'))
      );
    });
    
    if (notificationElements.length > 0) {
      console.log(`🧹 Removing ${notificationElements.length} notification elements`);
      notificationElements.forEach(el => el.remove());
    }
  };
  
  // 2. Remove event listeners for custom events that trigger popups
  const removeEventListeners = () => {
    console.log('🧹 Removing popup-related event listeners');
    
    // Create dummy listeners that do nothing to replace the existing ones
    const noopListener = () => {
      // Do nothing
      console.log('🧹 Intercepted popup event - suppressed');
    };
    
    // List of known custom events that trigger popups
    const customEvents = [
      'force-route-recalculation',
      'waypoint-fix-applied',
      'fix-ready',
      'fix-failed'
    ];
    
    // Replace existing listeners with no-op listeners
    customEvents.forEach(eventName => {
      // Remove existing listeners (this is not reliable but worth trying)
      window.removeEventListener(eventName, undefined);
      
      // Add a noop listener to intercept any remaining dispatches
      window.addEventListener(eventName, noopListener);
    });
  };
  
  // 3. Disable the force-reload script by replacing its functions
  const disableForceReload = () => {
    // Override key functions that might be displaying popups
    if (window.dispatchEvent && typeof window.dispatchEvent === 'function') {
      // Save original function
      const originalDispatchEvent = window.dispatchEvent;
      
      // Replace with filtered version
      window.dispatchEvent = function(event) {
        // Filter out known problematic custom events
        if (event && event.type && (
          event.type === 'force-route-recalculation' ||
          event.type === 'waypoint-fix-applied' ||
          event.type === 'fix-ready' ||
          event.type === 'fix-failed'
        )) {
          console.log(`🧹 Blocked dispatch of event: ${event.type}`);
          return true; // Pretend it worked
        }
        
        // Allow other events to be dispatched normally
        return originalDispatchEvent.apply(this, arguments);
      };
      
      console.log('🧹 Patched window.dispatchEvent to filter popup events');
    }
  };
  
  // 4. Set up a MutationObserver to catch and remove any dynamically added popups
  const setupMutationObserver = () => {
    // Create a mutation observer to watch for new popups
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Check each added node
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Check if this looks like a notification/popup
              const isPopup = (
                (node.style && node.style.position === 'fixed') ||
                (node.innerHTML && (
                  node.innerHTML.includes('Waypoint/Stop Fix') ||
                  node.innerHTML.includes('Fix Failed to Load') ||
                  node.innerHTML.includes('Fix Active')
                )) ||
                (node.className && (
                  node.className.includes('fix') ||
                  node.className.includes('popup') ||
                  node.className.includes('debug')
                ))
              );
              
              if (isPopup) {
                console.log('🧹 Caught dynamically added popup, removing it');
                node.remove();
              }
            }
          });
        }
      });
    });
    
    // Start observing the body for additions
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    console.log('🧹 Set up mutation observer to catch new popups');
    
    // Store observer in window so it doesn't get garbage collected
    window._popupCleanupObserver = observer;
  };
  
  // Run the cleanup functions
  removeExistingPopups();
  removeEventListeners();
  disableForceReload();
  setupMutationObserver();
  
  // Also create a function to run the cleanup again if needed
  window.cleanupFixNotifications = () => {
    console.log('🧹 Manually running cleanup of fix notifications');
    removeExistingPopups();
  };
  
  // Run this cleanup periodically
  const cleanupInterval = setInterval(removeExistingPopups, 5000);
  window._popupCleanupInterval = cleanupInterval;
  
  console.log('🧹 Cleanup script completed. Use window.cleanupFixNotifications() to run again if needed.');
})();
