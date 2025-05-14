/**
 * WAYPOINT FIX - STANDALONE SCRIPT
 * This script fixes the waypoint functionality by directly manipulating the DOM
 * and providing a clean implementation that doesn't depend on the existing code.
 */
  // Load the WaypointManager patch
  document.addEventListener("DOMContentLoaded", function() {
    const script = document.createElement("script");
    script.src = "/waypoint-manager-patch.js?v=" + Date.now();
    script.type = "text/javascript";
    document.head.appendChild(script);
    console.log("WAYPOINT FIX: Loaded WaypointManager patch");
  });

// Wait for the page to load
document.addEventListener('DOMContentLoaded', function() {
  console.log('🛠️ STANDALONE WAYPOINT FIX: Initializing...');
  
  // Global waypoint mode state
  let isWaypointMode = false;
  
  // Find the waypoint mode button
  function setupWaypointButton() {
    setTimeout(() => {
      const possibleButtons = document.querySelectorAll('button');
      let waypointButton = null;
      
      // Find the button by text content
      for (const button of possibleButtons) {
        if (button.textContent && 
            (button.textContent.includes('Waypoint Mode') || 
             button.textContent.includes('Insert Waypoint'))) {
          waypointButton = button;
          break;
        }
      }
      
      if (waypointButton) {
        console.log('🛠️ WAYPOINT FIX: Found waypoint button!', waypointButton);
        
        // Override the click handler completely
        waypointButton.addEventListener('click', function(event) {
          // Toggle waypoint mode
          isWaypointMode = !isWaypointMode;
          
          // Update global flag
          window.isWaypointModeActive = isWaypointMode;
          
          // Add visual indication
          if (isWaypointMode) {
            waypointButton.style.backgroundColor = '#FFCC00';
            waypointButton.style.color = '#000000';
            waypointButton.style.fontWeight = 'bold';
            document.body.classList.add('waypoint-mode-active');
          } else {
            waypointButton.style.backgroundColor = '';
            waypointButton.style.color = '';
            waypointButton.style.fontWeight = '';
            document.body.classList.remove('waypoint-mode-active');
          }
          
          console.log(`🛠️ WAYPOINT FIX: Waypoint mode ${isWaypointMode ? 'ENABLED' : 'DISABLED'}`);
          
          // Show a visual notification
          showNotification(`Waypoint Mode ${isWaypointMode ? 'ON' : 'OFF'}`);
          
          // Prevent the original event from propagating
          event.stopPropagation();
        }, true);
        
        console.log('🛠️ WAYPOINT FIX: Waypoint button click handler installed');
      } else {
        console.log('🛠️ WAYPOINT FIX: Could not find waypoint button, will try again later');
        setTimeout(setupWaypointButton, 1000);
      }
    }, 1000);
  }
  
  // Create a notification element
  function showNotification(message) {
    // Remove any existing notification
    const existingNotification = document.getElementById('waypoint-notification');
    if (existingNotification) {
      existingNotification.remove();
    }
    
    // Create new notification
    const notification = document.createElement('div');
    notification.id = 'waypoint-notification';
    notification.style.position = 'fixed';
    notification.style.top = '70px';
    notification.style.left = '50%';
    notification.style.transform = 'translateX(-50%)';
    notification.style.backgroundColor = isWaypointMode ? '#FFCC00' : '#333333';
    notification.style.color = isWaypointMode ? '#000000' : '#FFFFFF';
    notification.style.padding = '10px 20px';
    notification.style.borderRadius = '5px';
    notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    notification.style.zIndex = '9999';
    notification.style.fontWeight = 'bold';
    notification.style.fontSize = '14px';
    notification.textContent = message;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transition = 'opacity 0.5s ease';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 500);
    }, 3000);
  }
  
  // Function to clear map click handlers and add our own
  function fixMapClickHandlers() {
    // Wait for map to be initialized
    if (!window.mapManager || !window.mapManager.getMap()) {
      console.log('🛠️ WAYPOINT FIX: Map not ready yet, waiting...');
      setTimeout(fixMapClickHandlers, 1000);
      return;
    }
    
    const map = window.mapManager.getMap();
    console.log('🛠️ WAYPOINT FIX: Got map instance, fixing click handlers');
    
    // Our custom click handler
    const handleMapClick = function(e) {
      console.log(`🛠️ WAYPOINT FIX: Map clicked in ${isWaypointMode ? 'WAYPOINT' : 'NORMAL'} mode`);
      
      // Ensure Waypoint Manager exists
      if (!window.waypointManager) {
        console.error('🛠️ WAYPOINT FIX: WaypointManager not found!');
        return;
      }
      
      // Add the waypoint/stop based on current mode
      window.waypointManager.addWaypoint(
        [e.lngLat.lng, e.lngLat.lat],
        isWaypointMode ? `Waypoint ${window.waypointManager.getWaypoints().length + 1}` : '',
        { 
          isWaypoint: isWaypointMode,
          type: isWaypointMode ? 'WAYPOINT' : 'STOP'
        }
      );
      
      showNotification(`Added ${isWaypointMode ? 'Waypoint' : 'Stop'}`);
    };
    
    // Store our custom handler globally so it doesn't get garbage collected
    window._waypointFixClickHandler = handleMapClick;
    
    // Add debugging utilities
    window.debugWaypoints = function() {
      if (!window.waypointManager) {
        console.error('WaypointManager not found');
        return;
      }
      
      const waypoints = window.waypointManager.getWaypoints();
      console.log(`Found ${waypoints.length} waypoints:`);
      console.table(waypoints.map((wp, i) => ({
        index: i,
        name: wp.name || `[No Name]`,
        isWaypoint: wp.isWaypoint === true ? 'YES' : 'NO',
        type: wp.type || 'unknown',
      })));
    };
    
    // Set waypoint mode manually
    window.setWaypointMode = function(active) {
      isWaypointMode = active === true;
      window.isWaypointModeActive = isWaypointMode;
      console.log(`🛠️ WAYPOINT FIX: Manually set waypoint mode to ${isWaypointMode ? 'ON' : 'OFF'}`);
      showNotification(`Waypoint Mode ${isWaypointMode ? 'ON' : 'OFF'}`);
      return isWaypointMode;
    };
  }
  
  // Start the initialization process
  setupWaypointButton();
  fixMapClickHandlers();
  
  console.log('🛠️ STANDALONE WAYPOINT FIX: Initialization complete');
});
