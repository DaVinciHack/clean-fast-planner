/**
 * Waypoint/Stop Debug Button
 * 
 * This fix adds a debug button to the UI that allows the user to manually fix
 * waypoint/stop issues encountered during application use.
 */

console.log('🧰 Waypoint/Stop Debug Button initializing...');

// Create the debug button and UI if it doesn't exist
function createWaypointStopDebug() {
  // Check if it already exists
  if (document.getElementById('waypoint-stop-debug-button')) {
    return; // Already exists
  }
  
  // Wait for document.body to be available
  if (!document.body) {
    console.log('🧰 Document body not available yet, waiting...');
    setTimeout(createWaypointStopDebug, 500);
    return;
  }
  
  // Create a small button in the top-right corner
  const button = document.createElement('button');
  button.id = 'waypoint-stop-debug-button';
  button.textContent = 'Waypoint/Stop Debug';
  button.style.position = 'absolute';
  button.style.top = '10px';
  button.style.right = '10px';
  button.style.zIndex = '9999';
  button.style.backgroundColor = '#3498db';
  button.style.color = 'white';
  button.style.border = 'none';
  button.style.borderRadius = '4px';
  button.style.padding = '5px 10px';
  button.style.cursor = 'pointer';
  button.style.fontSize = '12px';
  
  // Create a debug monitor container (hidden initially)
  const monitor = document.createElement('div');
  monitor.id = 'waypoint-stop-debug-monitor';
  monitor.className = 'waypoint-stop-debug-monitor';
  monitor.style.position = 'absolute';
  monitor.style.top = '40px';
  monitor.style.right = '10px';
  monitor.style.width = '320px';
  monitor.style.maxHeight = '500px';
  monitor.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
  monitor.style.color = 'white';
  monitor.style.borderRadius = '5px';
  monitor.style.padding = '10px';
  monitor.style.zIndex = '9998';
  monitor.style.overflow = 'auto';
  monitor.style.display = 'none';
  monitor.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
  monitor.style.fontFamily = 'monospace';
  monitor.style.fontSize = '12px';
  
  // Initial content for the monitor
  monitor.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
      <h3 style="margin: 0; font-size: 14px; color: #3498db;">Waypoint/Stop Debug Monitor</h3>
      <button id="close-debug-monitor" style="background: none; border: none; color: #ccc; cursor: pointer;">✕</button>
    </div>
    <div id="debug-status">Checking status...</div>
    <div id="debug-content" style="margin-top: 10px;"></div>
    <div id="debug-actions" style="margin-top: 15px; display: flex; flex-wrap: wrap; gap: 5px;"></div>
  `;
  
  // Add button to toggle the monitor
  document.body.appendChild(button);
  document.body.appendChild(monitor);
  
  // Add button event handlers
  button.addEventListener('click', () => {
    if (monitor.style.display === 'none') {
      monitor.style.display = 'block';
      updateDebugMonitor(); // Update when opening
    } else {
      monitor.style.display = 'none';
    }
  });
  
  // Add close button handler - safely
  setTimeout(() => {
    const closeButton = document.getElementById('close-debug-monitor');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        monitor.style.display = 'none';
      });
    }
  }, 500);
  
  console.log('🧰 Waypoint/Stop Debug Button created');
  
  // First update
  setTimeout(updateDebugMonitor, 1000);
}

// Update the debug monitor with current status
function updateDebugMonitor() {
  const monitor = document.getElementById('waypoint-stop-debug-monitor');
  if (!monitor || monitor.style.display === 'none') return;
  
  const statusElement = document.getElementById('debug-status');
  const contentElement = document.getElementById('debug-content');
  const actionsElement = document.getElementById('debug-actions');
  
  // Guard against elements not found
  if (!statusElement || !contentElement || !actionsElement) {
    console.error('Debug monitor elements not found');
    return;
  }
  
  // Check for required managers
  const mapManager = window.mapManager;
  const waypointManager = window.waypointManager;
  const platformManager = window.platformManager;
  const waypointInsertionManager = window.waypointInsertionManager;
  
  // Update status
  let statusHTML = `
    <div style="display: grid; grid-template-columns: auto 1fr; gap: 5px; align-items: center;">
      <div>Map Manager:</div>
      <div style="color: ${mapManager ? '#2ecc71' : '#e74c3c'};">${mapManager ? '✓ Available' : '✗ Missing'}</div>
      
      <div>Waypoint Manager:</div>
      <div style="color: ${waypointManager ? '#2ecc71' : '#e74c3c'};">${waypointManager ? '✓ Available' : '✗ Missing'}</div>
      
      <div>Platform Manager:</div>
      <div style="color: ${platformManager ? '#2ecc71' : '#e74c3c'};">${platformManager ? '✓ Available' : '✗ Missing'}</div>
      
      <div>Waypoint Insertion Manager:</div>
      <div style="color: ${waypointInsertionManager ? '#2ecc71' : '#e74c3c'};">${waypointInsertionManager ? '✓ Available' : '✗ Missing'}</div>
      
      <div>Map Initialized:</div>
      <div style="color: ${mapManager && mapManager.getMap() ? '#2ecc71' : '#e74c3c'};">
        ${mapManager && mapManager.getMap() ? '✓ Ready' : '✗ Not Ready'}
      </div>
    </div>
  `;
  
  statusElement.innerHTML = statusHTML;
  
  // Update content - show waypoints, WaypointMode flag, etc.
  let contentHTML = '<h4 style="margin: 5px 0; color: #f39c12;">Current State:</h4>';
  
  // Check waypoint mode flag
  contentHTML += `
    <div style="margin-bottom: 5px;">
      <div style="display: flex; justify-content: space-between;">
        <div>Waypoint Mode:</div>
        <div style="color: ${window.isWaypointModeActive ? '#2ecc71' : '#3498db'};">
          ${window.isWaypointModeActive ? 'ACTIVE ✓' : 'INACTIVE'}
        </div>
      </div>
    </div>
  `;
  
  // List waypoints if available
  if (waypointManager && waypointManager.getWaypoints) {
    try {
      const waypoints = waypointManager.getWaypoints();
      
      contentHTML += `
        <div style="margin-top: 10px;">
          <div style="display: flex; justify-content: space-between;">
            <div>Waypoints:</div>
            <div>${waypoints.length} total</div>
          </div>
      `;
      
      if (waypoints.length > 0) {
        // Count by type
        const waypointCount = waypoints.filter(wp => wp.isWaypoint || wp.type === 'WAYPOINT' || wp.pointType === 'NAVIGATION_WAYPOINT').length;
        const stopCount = waypoints.length - waypointCount;
        
        contentHTML += `
          <div style="margin-left: 10px; font-size: 11px; color: #bbb;">
            <div>${waypointCount} waypoints, ${stopCount} stops</div>
          </div>
        `;
        
        // List first 3 waypoints + last one
        contentHTML += '<div style="margin-top: 5px; max-height: 120px; overflow-y: auto;">';
        
        for (let i = 0; i < Math.min(waypoints.length, 3); i++) {
          const wp = waypoints[i];
          contentHTML += `
            <div style="display: flex; justify-content: space-between; margin-bottom: 2px; padding: 1px 3px; background-color: rgba(255,255,255,0.05);">
              <div style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${i+1}. ${wp.name || 'Unnamed'}</div>
              <div style="color: ${wp.isWaypoint || wp.type === 'WAYPOINT' ? '#f39c12' : '#3498db'};">
                ${wp.isWaypoint || wp.type === 'WAYPOINT' ? 'Waypoint' : 'Stop'}
              </div>
            </div>
          `;
        }
        
        if (waypoints.length > 4) {
          contentHTML += `<div style="text-align: center; color: #999; margin: 2px 0;">... ${waypoints.length - 4} more ...</div>`;
        }
        
        if (waypoints.length > 3) {
          const wp = waypoints[waypoints.length - 1];
          contentHTML += `
            <div style="display: flex; justify-content: space-between; margin-bottom: 2px; padding: 1px 3px; background-color: rgba(255,255,255,0.05);">
              <div style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${waypoints.length}. ${wp.name || 'Unnamed'}</div>
              <div style="color: ${wp.isWaypoint || wp.type === 'WAYPOINT' ? '#f39c12' : '#3498db'};">
                ${wp.isWaypoint || wp.type === 'WAYPOINT' ? 'Waypoint' : 'Stop'}
              </div>
            </div>
          `;
        }
        
        contentHTML += '</div>';
      }
      
      contentHTML += '</div>';
    } catch (error) {
      contentHTML += `<div style="color: #e74c3c;">Error getting waypoints: ${error.message}</div>`;
    }
  } else {
    contentHTML += '<div style="color: #e74c3c;">Cannot access waypoints</div>';
  }
  
  contentElement.innerHTML = contentHTML;
  
  // Update actions
  let actionsHTML = '<h4 style="margin: 10px 0 5px; color: #f39c12; width: 100%;">Fix Actions:</h4>';
  
  // Add fix buttons
  actionsHTML += `
    <button id="fix-waypoint-mode" class="debug-button" style="padding: 4px 8px; margin: 2px; background: #3498db; color: white; border: none; border-radius: 3px; cursor: pointer;">
      Toggle Waypoint Mode
    </button>
    <button id="fix-map-manager" class="debug-button" style="padding: 4px 8px; margin: 2px; background: #3498db; color: white; border: none; border-radius: 3px; cursor: pointer;">
      Reset Map Handlers
    </button>
    <button id="fix-apply-all" class="debug-button" style="padding: 4px 8px; margin: 2px; background: #e67e22; color: white; border: none; border-radius: 3px; cursor: pointer;">
      Apply All Fixes
    </button>
    <button id="fix-refresh-page" class="debug-button" style="padding: 4px 8px; margin: 2px; background: #2ecc71; color: white; border: none; border-radius: 3px; cursor: pointer;">
      Refresh Page
    </button>
  `;
  
  actionsElement.innerHTML = actionsHTML;
  
  // Add action button handlers
  document.getElementById('fix-waypoint-mode').addEventListener('click', () => {
    const newModeState = !window.isWaypointModeActive;
    window.isWaypointModeActive = newModeState;
    
    // Update visual state and loading indicator
    if (window.LoadingIndicator) {
      window.LoadingIndicator.updateStatusIndicator(
        `${newModeState ? 'Activated' : 'Deactivated'} waypoint mode.`,
        'success',
        3000
      );
    }
    
    // Update body attribute for styling
    if (document.body) {
      if (newModeState) {
        document.body.setAttribute('data-waypoint-mode', 'active');
      } else {
        document.body.removeAttribute('data-waypoint-mode');
      }
    }
    
    // Refresh the debug monitor
    updateDebugMonitor();
  });
  
  document.getElementById('fix-map-manager').addEventListener('click', () => {
    try {
      // Try to reset map handlers using the global function
      if (typeof window.resetMapHandlers === 'function') {
        const resetResult = window.resetMapHandlers();
        
        if (resetResult) {
          // Show success notification
          if (window.LoadingIndicator) {
            window.LoadingIndicator.updateStatusIndicator(
              'Map handlers reset successfully. Try clicking on the map now.',
              'success',
              5000
            );
          }
        } else {
          // Show error notification
          if (window.LoadingIndicator) {
            window.LoadingIndicator.updateStatusIndicator(
              'Failed to reset map handlers. Try refreshing the page.',
              'error',
              5000
            );
          }
        }
      } else {
        // Try to manually reinitialize the MapInteractionHandler
        if (window.mapInteractionHandler && typeof window.mapInteractionHandler.initialize === 'function') {
          window.mapInteractionHandler.initialize();
          
          // Show success notification
          if (window.LoadingIndicator) {
            window.LoadingIndicator.updateStatusIndicator(
              'Map handlers reinitialized. Try clicking on the map now.',
              'success',
              5000
            );
          }
        } else {
          // Show error notification
          if (window.LoadingIndicator) {
            window.LoadingIndicator.updateStatusIndicator(
              'Cannot reset map handlers: required functions not available',
              'error',
              5000
            );
          }
        }
      }
      
      // Update the debug monitor
      updateDebugMonitor();
    } catch (error) {
      console.error('Error resetting map handlers:', error);
      
      // Show error notification
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator(
          `Error resetting map handlers: ${error.message}`,
          'error',
          5000
        );
      }
    }
  });
  
  document.getElementById('fix-apply-all').addEventListener('click', () => {
    try {
      // 1. Reset waypoint mode flag
      window.isWaypointModeActive = false;
      if (document.body) {
        document.body.removeAttribute('data-waypoint-mode');
      }
      
      // 2. Reset map handlers
      if (typeof window.resetMapHandlers === 'function') {
        window.resetMapHandlers();
      } else if (window.mapInteractionHandler && typeof window.mapInteractionHandler.initialize === 'function') {
        window.mapInteractionHandler.initialize();
      }
      
      // 3. Reinitialize waypoint insertion manager
      if (typeof window.reinitializeWaypoints === 'function') {
        window.reinitializeWaypoints();
      }
      
      // 4. Ensure StopCardCalculator is available
      if (!window.StopCardCalculator) {
        window.StopCardCalculator = {
          calculateStopCards: function(waypoints, routeStats, selectedAircraft, weather, options = {}) {
            console.log('Using emergency StopCardCalculator implementation');
            if (!waypoints || waypoints.length === 0) return [];
            
            const landingStops = waypoints.filter(wp => 
              wp.pointType === 'LANDING_STOP' || (!wp.pointType && !wp.isWaypoint)
            );
            
            return landingStops.map((stop, index) => ({
              id: stop.id || `stop_${index}`,
              name: stop.name || `Stop ${index + 1}`,
              coords: stop.coords,
              passengers: stop.passengers || 0,
              index: index,
              deckTime: 5,
              fuelBurn: routeStats?.fuelBurn || 0,
            }));
          }
        };
      }
      
      // Show success notification
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator(
          'Applied all fixes. Try using the app now or refresh if issues persist.',
          'success',
          5000
        );
      }
      
      // Update the debug monitor
      updateDebugMonitor();
    } catch (error) {
      console.error('Error applying all fixes:', error);
      
      // Show error notification
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator(
          `Error applying fixes: ${error.message}`,
          'error',
          5000
        );
      }
    }
  });
  
  document.getElementById('fix-refresh-page').addEventListener('click', () => {
    window.location.reload();
  });
}

// Create a LoadingIndicator if it doesn't exist (for providing feedback)
function ensureLoadingIndicator() {
  if (!window.LoadingIndicator) {
    console.log('Creating LoadingIndicator for waypoint debug...');
    
    window.LoadingIndicator = {
      updateStatusIndicator: function(message, type = 'info', duration = 3000) {
        let container = document.getElementById('status-indicator-container');
        
        if (!container) {
          container = document.createElement('div');
          container.id = 'status-indicator-container';
          container.style.position = 'fixed';
          container.style.bottom = '20px';
          container.style.left = '50%';
          container.style.transform = 'translateX(-50%)';
          container.style.zIndex = '9999';
          container.style.width = 'auto';
          container.style.maxWidth = '80%';
          document.body.appendChild(container);
        }
        
        const statusElement = document.createElement('div');
        statusElement.className = `status-indicator ${type}`;
        statusElement.textContent = message;
        
        // Style the status element
        statusElement.style.backgroundColor = 
          type === 'error' ? 'rgba(231, 76, 60, 0.85)' : 
          type === 'success' ? 'rgba(46, 204, 113, 0.85)' : 
          type === 'warning' ? 'rgba(243, 156, 18, 0.85)' : 'rgba(52, 152, 219, 0.85)';
        statusElement.style.color = 'white';
        statusElement.style.padding = '8px 16px';
        statusElement.style.marginBottom = '8px';
        statusElement.style.borderRadius = '4px';
        statusElement.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        statusElement.style.fontFamily = 'sans-serif';
        statusElement.style.fontSize = '14px';
        statusElement.style.textAlign = 'center';
        
        // Add the status element to the container
        container.appendChild(statusElement);
        
        // Remove the status element after the specified duration
        setTimeout(() => {
          try {
            if (statusElement.parentNode === container) {
              container.removeChild(statusElement);
            }
            
            // Remove the container if it's empty
            if (container.children.length === 0) {
              document.body.removeChild(container);
            }
          } catch (error) {
            console.error('Error removing status indicator:', error);
          }
        }, duration);
      }
    };
  }
}

// Initialize LoadingIndicator
ensureLoadingIndicator();

// Create and show the debug button once the DOM is fully loaded
function initializeWaypointStopDebug() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWaypointStopDebug);
  } else {
    createWaypointStopDebug();
  }
  
  // Set up auto-update for the debug monitor
  setInterval(() => {
    updateDebugMonitor();
  }, 5000); // Update every 5 seconds
}

// Run the initialization
initializeWaypointStopDebug();

// Export a function to manually show the debug UI
export default function showWaypointStopDebug() {
  createWaypointStopDebug();
  
  const monitor = document.getElementById('waypoint-stop-debug-monitor');
  if (monitor) {
    monitor.style.display = 'block';
    updateDebugMonitor();
  }
}
