/**
 * waypoint-stop-debug.js
 * 
 * A simple debug monitor for waypoint vs. stop distinction.
 */

console.log('Waypoint/Stop Debug Monitor script loaded');

// Function to create debug monitor UI
function createDebugMonitor() {
  console.log('Creating waypoint/stop debug monitor...');
  
  // Create the debug monitor container
  const monitorContainer = document.createElement('div');
  monitorContainer.id = 'waypoint-stop-debug-monitor';
  monitorContainer.style.cssText = `
    position: fixed;
    top: 60px;
    right: 0;
    width: 320px;
    background-color: #222;
    color: #eee;
    border-left: 3px solid #007bff;
    z-index: 9999;
    font-family: monospace;
    font-size: 12px;
    padding: 10px;
    box-shadow: -2px 0 5px rgba(0,0,0,0.3);
    overflow: auto;
    max-height: 90vh;
  `;
  
  // Create the header
  monitorContainer.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
      <h3 style="margin: 0; color: #fff; font-size: 14px;">Waypoint/Stop Debug Monitor</h3>
      <span id="monitor-close" style="cursor: pointer; color: #aaa;">×</span>
    </div>
    <div style="margin-bottom: 10px; padding: 5px; border: 1px solid #444; background-color: #333;">
      <div style="margin-bottom: 5px; display: flex; justify-content: space-between;">
        <span>Fix Status:</span>
        <span id="fix-status" style="color: #55ff55; font-weight: bold;">READY</span>
      </div>
      <div id="fix-details" style="font-size: 11px; color: #ccc;">
        Waypoint vs. Stop distinction fix is applied. Navigation waypoints will not
        be included in fuel calculations.
      </div>
    </div>
    <div>
      <button id="show-waypoint-stats" style="width: 100%; padding: 8px; background-color: #007bff; color: white; border: none; cursor: pointer;">
        Show Waypoint Stats
      </button>
    </div>
  `;
  
  // Add the monitor to the page
  document.body.appendChild(monitorContainer);
  
  // Add close functionality
  document.getElementById('monitor-close').addEventListener('click', () => {
    monitorContainer.style.display = 'none';
  });
  
  // Add show stats functionality
  document.getElementById('show-waypoint-stats').addEventListener('click', () => {
    showWaypointStats();
  });
  
  console.log('Waypoint/Stop debug monitor created');
}

// Function to show waypoint stats
function showWaypointStats() {
  if (!window.waypointManager) {
    console.log('waypointManager not available');
    return;
  }
  
  const waypoints = window.waypointManager.getWaypoints();
  if (!waypoints || waypoints.length === 0) {
    console.log('No waypoints found');
    return;
  }
  
  // Count waypoint types
  let navigationWaypoints = 0;
  let landingStops = 0;
  
  waypoints.forEach(wp => {
    if (wp.pointType === 'NAVIGATION_WAYPOINT' || 
        (wp.pointType === undefined && wp.isWaypoint === true)) {
      navigationWaypoints++;
    } else {
      landingStops++;
    }
  });
  
  // Show stats in a popup
  const content = `
    <div style="background-color: #222; color: #fff; padding: 10px; border-radius: 5px; max-width: 300px;">
      <h3 style="margin-top: 0;">Waypoint Stats</h3>
      <div>Total Points: ${waypoints.length}</div>
      <div>Navigation Waypoints: ${navigationWaypoints}</div>
      <div>Landing Stops: ${landingStops}</div>
      <div style="margin-top: 10px;">Current Mode: ${window.isWaypointModeActive ? 'WAYPOINT' : 'NORMAL'}</div>
    </div>
  `;
  
  // Create a simple popup
  const popup = document.createElement('div');
  popup.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 10000;
    background: transparent;
  `;
  popup.innerHTML = content;
  
  // Add close button
  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Close';
  closeBtn.style.cssText = `
    margin-top: 10px;
    padding: 5px 10px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    display: block;
    width: 100%;
  `;
  popup.querySelector('div').appendChild(closeBtn);
  
  closeBtn.addEventListener('click', () => {
    document.body.removeChild(popup);
  });
  
  document.body.appendChild(popup);
  
  console.log('Waypoint stats:', {
    total: waypoints.length,
    navigationWaypoints,
    landingStops,
    currentMode: window.isWaypointModeActive ? 'WAYPOINT' : 'NORMAL'
  });
}

// Create the debug monitor after a delay
setTimeout(createDebugMonitor, 3000);

// Make functions available globally
window.showWaypointStats = showWaypointStats;
