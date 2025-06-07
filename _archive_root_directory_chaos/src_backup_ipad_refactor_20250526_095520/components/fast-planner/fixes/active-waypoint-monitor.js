/**
 * active-waypoint-monitor.js
 * 
 * This script creates a visible monitor in the application that shows
 * the current state of waypoints vs. stops and provides debug info
 */

console.log('🔄 Active waypoint monitor starting...');

// Function to create a floating debug panel
function createDebugPanel() {
  // Check if panel already exists
  if (document.getElementById('waypoint-debug-panel')) {
    return;
  }
  
  // Create the panel
  const panel = document.createElement('div');
  panel.id = 'waypoint-debug-panel';
  panel.style.position = 'fixed';
  panel.style.top = '10px';
  panel.style.right = '10px';
  panel.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  panel.style.color = 'white';
  panel.style.padding = '10px';
  panel.style.borderRadius = '5px';
  panel.style.fontSize = '12px';
  panel.style.zIndex = '9999';
  panel.style.maxWidth = '300px';
  panel.style.maxHeight = '400px';
  panel.style.overflowY = 'auto';
  panel.style.fontFamily = 'monospace';
  panel.style.display = 'none'; // Hidden by default
  
  // Add header
  const header = document.createElement('div');
  header.style.fontWeight = 'bold';
  header.style.marginBottom = '5px';
  header.textContent = 'Waypoint/Stop Debug Monitor';
  panel.appendChild(header);
  
  // Add content area
  const content = document.createElement('div');
  content.id = 'waypoint-debug-content';
  panel.appendChild(content);
  
  // Add toggle button
  const toggleButton = document.createElement('button');
  toggleButton.id = 'waypoint-debug-toggle';
  toggleButton.textContent = 'Show Debug';
  toggleButton.style.position = 'fixed';
  toggleButton.style.top = '10px';
  toggleButton.style.right = '10px';
  toggleButton.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  toggleButton.style.color = 'white';
  toggleButton.style.border = '1px solid white';
  toggleButton.style.borderRadius = '3px';
  toggleButton.style.padding = '5px';
  toggleButton.style.fontSize = '10px';
  toggleButton.style.zIndex = '10000';
  toggleButton.style.cursor = 'pointer';
  
  // Toggle panel visibility when button is clicked
  toggleButton.addEventListener('click', () => {
    if (panel.style.display === 'none') {
      panel.style.display = 'block';
      toggleButton.textContent = 'Hide Debug';
      updateDebugInfo(); // Update info when panel is shown
    } else {
      panel.style.display = 'none';
      toggleButton.textContent = 'Show Debug';
    }
  });
  
  // Add elements to the document
  document.body.appendChild(panel);
  document.body.appendChild(toggleButton);
  
  console.log('🔍 Debug panel created');
  
  return { panel, content, toggleButton };
}

// Function to update debug info in the panel
function updateDebugInfo() {
  const content = document.getElementById('waypoint-debug-content');
  if (!content) return;
  
  // Clear previous content
  content.innerHTML = '';
  
  // Get waypoints status
  const hasWaypointManager = !!window.waypointManager;
  let waypointInfo = '';
  
  if (hasWaypointManager) {
    const waypoints = window.waypointManager.getWaypoints();
    const waypointCount = waypoints.length;
    const navWaypoints = waypoints.filter(wp => 
      wp.pointType === 'NAVIGATION_WAYPOINT' || 
      (wp.pointType === undefined && wp.isWaypoint === true)
    ).length;
    const landingStops = waypoints.filter(wp => 
      wp.pointType === 'LANDING_STOP' || 
      (wp.pointType === undefined && wp.isWaypoint !== true)
    ).length;
    
    waypointInfo = `
      <div>
        <strong>Total Points:</strong> ${waypointCount}<br>
        <strong>Navigation Waypoints:</strong> ${navWaypoints}<br>
        <strong>Landing Stops:</strong> ${landingStops}<br>
        <strong>Current Mode:</strong> ${window.isWaypointModeActive ? 'WAYPOINT' : 'NORMAL'}<br>
      </div>
    `;
    
    // Add detailed waypoint list
    if (waypointCount > 0) {
      let waypointList = '<div style="margin-top: 8px;"><strong>Waypoint Details:</strong><br>';
      
      waypoints.forEach((wp, i) => {
        const type = wp.pointType || (wp.isWaypoint ? 'WAYPOINT' : 'STOP');
        const color = type === 'NAVIGATION_WAYPOINT' || type === 'WAYPOINT' ? '#FFCC00' : '#FF4136';
        
        waypointList += `
          <div style="margin: 2px 0; padding: 2px; border-left: 3px solid ${color};">
            ${i+1}. ${wp.name} - 
            <span style="color: ${color};">
              ${type}
            </span>
          </div>
        `;
      });
      
      waypointList += '</div>';
      waypointInfo += waypointList;
    }
  } else {
    waypointInfo = '<div style="color: red;">WaypointManager not available</div>';
  }
  
  // Get calculator status
  const hasCalculator = !!window.ComprehensiveFuelCalculator;
  let calculatorInfo = '';
  
  if (hasCalculator) {
    // Safely check if the calculator function is patched
    let isPatched = false;
    try {
      const calcFunction = window.ComprehensiveFuelCalculator.calculateAllFuelData.toString();
      isPatched = calcFunction.includes('filter(wp =>') || 
                 calcFunction.includes('pointType') || 
                 calcFunction.includes('isWaypoint');
    } catch (e) {
      console.error('Error checking calculator function:', e);
    }
    
    calculatorInfo = `
      <div style="margin-top: 8px;">
        <strong>Fuel Calculator:</strong> Available<br>
        <strong>Fix Applied:</strong> ${isPatched ? 'YES' : 'NO'}<br>
      </div>
    `;
  } else {
    calculatorInfo = '<div style="margin-top: 8px; color: red;">ComprehensiveFuelCalculator not available</div>';
  }
  
  // Get StopCardCalculator status
  const hasStopCardCalculator = !!window.StopCardCalculator || 
                               (window.originalCalculateStopCards !== undefined);
  let stopCardInfo = '';
  
  if (hasStopCardCalculator) {
    stopCardInfo = `
      <div style="margin-top: 8px;">
        <strong>StopCardCalculator:</strong> Available<br>
        <strong>Original Function Saved:</strong> ${window.originalCalculateStopCards ? 'YES' : 'NO'}<br>
      </div>
    `;
  } else {
    stopCardInfo = '<div style="margin-top: 8px; color: red;">StopCardCalculator not available</div>';
  }
  
  // Fix button
  let fixButton = '';
  if (typeof window.manuallyApplyWaypointStopFix === 'function') {
    fixButton = `
      <button 
        onclick="window.manuallyApplyWaypointStopFix()" 
        style="margin-top: 10px; padding: 5px; background: #007bff; color: white; border: none; border-radius: 3px; cursor: pointer;">
        Apply Fixes Now
      </button>
    `;
  }
  
  // Update the content
  content.innerHTML = `
    <div style="margin-bottom: 10px;">
      <strong>Fix Status:</strong>
      <span style="color: ${hasWaypointManager && hasCalculator ? '#00ff00' : '#ff0000'};">
        ${hasWaypointManager && hasCalculator ? 'READY' : 'NOT READY'}
      </span>
    </div>
    ${waypointInfo}
    ${calculatorInfo}
    ${stopCardInfo}
    ${fixButton}
  `;
}

// Set up an interval to update the debug info
function setupDebugMonitor() {
  // Create the panel
  createDebugPanel();
  
  // Update debug info every second
  setInterval(() => {
    // Only update if panel is visible
    const panel = document.getElementById('waypoint-debug-panel');
    if (panel && panel.style.display !== 'none') {
      updateDebugInfo();
    }
  }, 1000);
  
  console.log('🔄 Debug monitor interval set up');
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Wait a moment to ensure app is initialized
    setTimeout(setupDebugMonitor, 3000);
  });
} else {
  // Wait a moment to ensure app is initialized
  setTimeout(setupDebugMonitor, 3000);
}

console.log('🔄 Active waypoint monitor initialized');
