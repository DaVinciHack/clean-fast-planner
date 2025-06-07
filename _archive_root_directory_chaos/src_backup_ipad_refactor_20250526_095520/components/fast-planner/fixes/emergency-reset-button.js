/**
 * emergency-reset-button.js
 * 
 * This script adds an emergency reset button that appears when
 * the application appears to be locked up.
 */

console.log('🚑 Initializing emergency reset button...');

// Create the emergency reset button function
function createEmergencyResetButton() {
  // Check if button already exists
  if (document.getElementById('emergency-reset-button')) {
    return;
  }
  
  console.log('🚑 Creating emergency reset button...');
  
  // Create the button element
  const button = document.createElement('button');
  button.id = 'emergency-reset-button';
  button.textContent = 'Emergency Reset';
  button.style.position = 'fixed';
  button.style.bottom = '10px';
  button.style.right = '10px';
  button.style.zIndex = '9999';
  button.style.backgroundColor = '#dc3545';
  button.style.color = 'white';
  button.style.border = 'none';
  button.style.padding = '8px 16px';
  button.style.borderRadius = '4px';
  button.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
  button.style.cursor = 'pointer';
  button.style.display = 'none'; // Hidden by default
  
  // Add click handler
  button.addEventListener('click', performEmergencyReset);
  
  // Add to document
  document.body.appendChild(button);
  
  // Set up activity monitoring to detect if app is locked up
  setupActivityMonitoring();
  
  console.log('🚑 Emergency reset button created (hidden initially)');
}

// Perform the emergency reset
function performEmergencyReset() {
  console.log('🚑 Performing emergency reset...');
  
  // Show reset notification
  const notification = document.createElement('div');
  notification.style.position = 'fixed';
  notification.style.top = '50%';
  notification.style.left = '50%';
  notification.style.transform = 'translate(-50%, -50%)';
  notification.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  notification.style.color = 'white';
  notification.style.padding = '20px';
  notification.style.borderRadius = '8px';
  notification.style.zIndex = '10000';
  notification.style.textAlign = 'center';
  notification.innerHTML = `
    <h3 style="margin-top: 0;">Emergency Reset in Progress</h3>
    <p>Resetting application state...</p>
    <div class="loader" style="margin: 10px auto; border: 5px solid #f3f3f3; border-top: 5px solid #3498db; border-radius: 50%; width: 30px; height: 30px; animation: spin 2s linear infinite;"></div>
    <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
  `;
  
  document.body.appendChild(notification);
  
  try {
    // 1. Clear any ongoing operations
    if (window._activeOperations) {
      window._activeOperations = {};
    }
    
    // 2. Reset waypoint manager state
    if (window.waypointManager) {
      try {
        window.waypointManager.clearRoute();
      } catch (e) {
        console.error('🚑 Error clearing route:', e);
      }
    }
    
    // 3. Reinitialize map interaction handler
    if (window.mapInteractionHandler) {
      try {
        window.mapInteractionHandler.initialize();
      } catch (e) {
        console.error('🚑 Error reinitializing map interaction handler:', e);
      }
    }
    
    // 4. Reset global flags
    window.isWaypointModeActive = false;
    window._isRouteDragging = false;
    window._routeDragJustFinished = false;
    window._lastMapClickTime = 0;
    window._lastPlatformClickTime = 0;
    
    // 5. Clear any stuck event listeners
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    const originalRemoveEventListener = EventTarget.prototype.removeEventListener;
    
    // Replace with a version that tracks listeners
    EventTarget.prototype.addEventListener = function(type, listener, options) {
      // Add a special property to track this listener
      if (typeof listener === 'function') {
        listener._trackedListener = true;
      }
      
      return originalAddEventListener.call(this, type, listener, options);
    };
    
    // Restore original after a moment
    setTimeout(() => {
      EventTarget.prototype.addEventListener = originalAddEventListener;
      EventTarget.prototype.removeEventListener = originalRemoveEventListener;
    }, 5000);
    
    // 6. Force reload application state
    setTimeout(() => {
      // Remove notification
      document.body.removeChild(notification);
      
      // Show success notification
      const successNotification = document.createElement('div');
      successNotification.style.position = 'fixed';
      successNotification.style.top = '20px';
      successNotification.style.left = '50%';
      successNotification.style.transform = 'translateX(-50%)';
      successNotification.style.backgroundColor = '#28a745';
      successNotification.style.color = 'white';
      successNotification.style.padding = '10px 20px';
      successNotification.style.borderRadius = '4px';
      successNotification.style.zIndex = '10000';
      successNotification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
      successNotification.textContent = 'Emergency reset completed. Application should now be responsive.';
      
      document.body.appendChild(successNotification);
      
      // Hide the reset button
      const resetButton = document.getElementById('emergency-reset-button');
      if (resetButton) {
        resetButton.style.display = 'none';
      }
      
      // Remove success notification after a few seconds
      setTimeout(() => {
        if (successNotification.parentNode === document.body) {
          document.body.removeChild(successNotification);
        }
      }, 5000);
      
      // Reload the page if the checkbox was checked
      if (document.getElementById('emergency-reset-checkbox').checked) {
        window.location.reload();
      }
    }, 2000);
  } catch (error) {
    console.error('🚑 Error during emergency reset:', error);
    
    // Show error notification
    notification.innerHTML = `
      <h3 style="margin-top: 0; color: #dc3545;">Reset Failed</h3>
      <p>There was an error during the reset. Please try reloading the page.</p>
      <button id="reload-page-button" style="padding: 8px 16px; margin-top: 10px; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Reload Page</button>
    `;
    
    // Add click handler for reload button
    document.getElementById('reload-page-button').addEventListener('click', () => {
      window.location.reload();
    });
  }
}

// Setup activity monitoring
function setupActivityMonitoring() {
  let lastActivity = Date.now();
  let applicationResponsive = true;
  let activityCheckInterval;
  
  // Function to record user activity
  function recordActivity() {
    lastActivity = Date.now();
    applicationResponsive = true;
    
    // Hide the reset button if it's visible
    const resetButton = document.getElementById('emergency-reset-button');
    if (resetButton && resetButton.style.display !== 'none') {
      resetButton.style.display = 'none';
    }
  }
  
  // Add event listeners for user activity
  document.addEventListener('mousemove', recordActivity);
  document.addEventListener('click', recordActivity);
  document.addEventListener('keydown', recordActivity);
  document.addEventListener('scroll', recordActivity);
  
  // Check for application responsiveness
  activityCheckInterval = setInterval(() => {
    const now = Date.now();
    
    // If there's been no activity for more than 15 seconds
    if (now - lastActivity > 15000 && applicationResponsive) {
      // Consider the application potentially locked up
      applicationResponsive = false;
      
      // Show the reset button
      const resetButton = document.getElementById('emergency-reset-button');
      if (resetButton) {
        resetButton.style.display = 'block';
        
        // Update button to include checkbox for page reload
        resetButton.innerHTML = `
          <div>
            <div style="margin-bottom: 5px;">App Not Responding</div>
            <label style="font-size: 12px; display: block; margin-bottom: 5px;">
              <input type="checkbox" id="emergency-reset-checkbox" checked> Reload page after reset
            </label>
            <span>Emergency Reset</span>
          </div>
        `;
      }
    }
  }, 5000);
  
  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    clearInterval(activityCheckInterval);
    document.removeEventListener('mousemove', recordActivity);
    document.removeEventListener('click', recordActivity);
    document.removeEventListener('keydown', recordActivity);
    document.removeEventListener('scroll', recordActivity);
  });
}

// Create the button when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createEmergencyResetButton);
} else {
  createEmergencyResetButton();
}

console.log('🚑 Emergency reset functionality initialized');

// Export for manual activation
export function activateEmergencyReset() {
  const resetButton = document.getElementById('emergency-reset-button');
  if (resetButton) {
    resetButton.style.display = 'block';
  } else {
    createEmergencyResetButton();
    setTimeout(() => {
      const newResetButton = document.getElementById('emergency-reset-button');
      if (newResetButton) {
        newResetButton.style.display = 'block';
      }
    }, 100);
  }
}

export default activateEmergencyReset;