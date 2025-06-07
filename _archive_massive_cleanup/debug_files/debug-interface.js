/**
 * debug-interface.js
 * 
 * A clean debugging interface for waypoints to help diagnose issues
 * and monitor the application state.
 */

// Create a stylish debug interface
function createDebugInterface() {
  // Check if the interface already exists
  if (document.getElementById('clean-debug-interface')) {
    return;
  }
  
  console.log('Creating clean debug interface...');
  
  // Create the debug interface container
  const container = document.createElement('div');
  container.id = 'clean-debug-interface';
  container.style.position = 'fixed';
  container.style.bottom = '10px';
  container.style.left = '10px';
  container.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  container.style.color = '#fff';
  container.style.padding = '10px';
  container.style.borderRadius = '5px';
  container.style.fontFamily = 'monospace';
  container.style.fontSize = '12px';
  container.style.zIndex = '1000';
  container.style.maxWidth = '300px';
  container.style.maxHeight = '300px';
  container.style.overflow = 'auto';
  container.style.transition = 'all 0.3s ease';
  container.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.3)';
  container.style.backdropFilter = 'blur(5px)';
  container.style.opacity = '0.8';
  
  // Add a title
  const title = document.createElement('div');
  title.textContent = 'Waypoint Debug';
  title.style.fontWeight = 'bold';
  title.style.marginBottom = '5px';
  title.style.borderBottom = '1px solid rgba(255, 255, 255, 0.3)';
  title.style.paddingBottom = '5px';
  container.appendChild(title);
  
  // Add a minimize button
  const minimizeButton = document.createElement('button');
  minimizeButton.textContent = '-';
  minimizeButton.style.position = 'absolute';
  minimizeButton.style.top = '5px';
  minimizeButton.style.right = '25px';
  minimizeButton.style.background = 'transparent';
  minimizeButton.style.border = 'none';
  minimizeButton.style.color = '#fff';
  minimizeButton.style.cursor = 'pointer';
  minimizeButton.style.fontSize = '16px';
  minimizeButton.style.padding = '0 5px';
  
  // Add a close button
  const closeButton = document.createElement('button');
  closeButton.textContent = '×';
  closeButton.style.position = 'absolute';
  closeButton.style.top = '5px';
  closeButton.style.right = '5px';
  closeButton.style.background = 'transparent';
  closeButton.style.border = 'none';
  closeButton.style.color = '#fff';
  closeButton.style.cursor = 'pointer';
  closeButton.style.fontSize = '16px';
  closeButton.style.padding = '0 5px';
  
  // Add event listeners to the buttons
  minimizeButton.addEventListener('click', () => {
    const content = document.getElementById('clean-debug-content');
    if (content.style.display === 'none') {
      content.style.display = 'block';
      minimizeButton.textContent = '-';
      container.style.maxHeight = '300px';
    } else {
      content.style.display = 'none';
      minimizeButton.textContent = '+';
      container.style.maxHeight = '30px';
    }
  });
  
  closeButton.addEventListener('click', () => {
    document.body.removeChild(container);
  });
  
  container.appendChild(minimizeButton);
  container.appendChild(closeButton);
  
  // Create content container
  const content = document.createElement('div');
  content.id = 'clean-debug-content';
  container.appendChild(content);
  
  // Add sections
  const sections = [
    { id: 'waypoint-mode', title: 'Waypoint Mode' },
    { id: 'waypoint-count', title: 'Waypoint Count' },
    { id: 'stop-count', title: 'Stop Count' },
    { id: 'map-status', title: 'Map Status' },
    { id: 'last-event', title: 'Last Event' }
  ];
  
  sections.forEach(section => {
    const sectionEl = document.createElement('div');
    sectionEl.className = 'debug-section';
    sectionEl.style.marginBottom = '5px';
    sectionEl.style.padding = '5px';
    sectionEl.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    sectionEl.style.borderRadius = '3px';
    
    const titleEl = document.createElement('div');
    titleEl.className = 'debug-section-title';
    titleEl.textContent = section.title;
    titleEl.style.fontWeight = 'bold';
    titleEl.style.marginBottom = '2px';
    
    const valueEl = document.createElement('div');
    valueEl.id = `debug-${section.id}`;
    valueEl.className = 'debug-section-value';
    valueEl.textContent = 'Loading...';
    
    sectionEl.appendChild(titleEl);
    sectionEl.appendChild(valueEl);
    content.appendChild(sectionEl);
  });
  
  // Add to the page
  document.body.appendChild(container);
  
  // Make the debug interface draggable
  makeDraggable(container);
  
  // Start updating the debug information
  startDebugUpdates();
}

// Make an element draggable
function makeDraggable(element) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  
  const header = element.querySelector('div');
  if (header) {
    header.style.cursor = 'move';
    header.onmousedown = dragMouseDown;
  } else {
    element.onmousedown = dragMouseDown;
  }
  
  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    // Get the mouse cursor position at startup
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // Call a function whenever the cursor moves
    document.onmousemove = elementDrag;
  }
  
  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // Calculate the new cursor position
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // Set the element's new position
    element.style.top = (element.offsetTop - pos2) + "px";
    element.style.left = (element.offsetLeft - pos1) + "px";
    // Keep the element within the viewport
    const rect = element.getBoundingClientRect();
    if (rect.left < 0) element.style.left = "0px";
    if (rect.top < 0) element.style.top = "0px";
    if (rect.right > window.innerWidth) element.style.left = (window.innerWidth - rect.width) + "px";
    if (rect.bottom > window.innerHeight) element.style.top = (window.innerHeight - rect.height) + "px";
  }
  
  function closeDragElement() {
    // Stop moving when mouse button is released
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

// Update the debug information periodically
function startDebugUpdates() {
  // Start the update interval
  const updateInterval = setInterval(updateDebugInfo, 500);
  
  // Store the interval ID to be able to clear it later
  window._debugUpdateInterval = updateInterval;
  
  // Track last event for debugging
  window._lastDebugEvent = { 
    type: 'Debug Interface Initialized', 
    timestamp: new Date().toISOString() 
  };
  
  // Add event tracking
  addEventTracking();
}

// Add event tracking to various components
function addEventTracking() {
  // Track map clicks
  if (window.mapManager && window.mapManager.getMap()) {
    const map = window.mapManager.getMap();
    map.on('click', e => {
      window._lastDebugEvent = { 
        type: 'Map Click', 
        coords: [e.lngLat.lng, e.lngLat.lat],
        timestamp: new Date().toISOString()
      };
    });
  }
  
  // Override the addWaypoint method to track events
  if (window.waypointManager && window.waypointManager.addWaypoint) {
    const originalAddWaypoint = window.waypointManager.addWaypoint;
    window.waypointManager.addWaypoint = function(...args) {
      window._lastDebugEvent = { 
        type: 'Add Waypoint', 
        args: JSON.stringify(args),
        timestamp: new Date().toISOString()
      };
      return originalAddWaypoint.apply(this, args);
    };
  }
  
  // Override the removeWaypoint method to track events
  if (window.waypointManager && window.waypointManager.removeWaypoint) {
    const originalRemoveWaypoint = window.waypointManager.removeWaypoint;
    window.waypointManager.removeWaypoint = function(...args) {
      window._lastDebugEvent = { 
        type: 'Remove Waypoint', 
        args: JSON.stringify(args),
        timestamp: new Date().toISOString()
      };
      return originalRemoveWaypoint.apply(this, args);
    };
  }
  
  // Override the toggleWaypointMode method to track events
  if (window.toggleWaypointMode) {
    const originalToggleWaypointMode = window.toggleWaypointMode;
    window.toggleWaypointMode = function(...args) {
      window._lastDebugEvent = { 
        type: 'Toggle Waypoint Mode', 
        args: JSON.stringify(args),
        timestamp: new Date().toISOString()
      };
      return originalToggleWaypointMode.apply(this, args);
    };
  }
}

// Update the debug information
function updateDebugInfo() {
  try {
    // Find the waypoints
    let waypoints = [];
    if (window.waypointManager) {
      waypoints = window.waypointManager.getWaypoints() || [];
    }
    
    // Count regular waypoints and stops
    const waypointCount = waypoints.filter(wp => 
      wp.isWaypoint === true || 
      wp.type === 'WAYPOINT' || 
      wp.pointType === 'NAVIGATION_WAYPOINT'
    ).length;
    
    const stopCount = waypoints.filter(wp => 
      !wp.isWaypoint &&
      wp.type !== 'WAYPOINT' &&
      wp.pointType !== 'NAVIGATION_WAYPOINT'
    ).length;
    
    // Check waypoint mode
    const waypointModeActive = window.isWaypointModeActive === true;
    
    // Check map status
    const mapLoaded = window.mapManager && window.mapManager.getMap() ? 'Loaded' : 'Not Loaded';
    
    // Get last event
    const lastEvent = window._lastDebugEvent || { type: 'None', timestamp: 'N/A' };
    
    // Update the UI
    const waypointModeEl = document.getElementById('debug-waypoint-mode');
    if (waypointModeEl) {
      waypointModeEl.textContent = waypointModeActive ? 'Active' : 'Inactive';
      waypointModeEl.style.color = waypointModeActive ? '#FFCC00' : '#fff';
    }
    
    const waypointCountEl = document.getElementById('debug-waypoint-count');
    if (waypointCountEl) {
      waypointCountEl.textContent = waypointCount.toString();
    }
    
    const stopCountEl = document.getElementById('debug-stop-count');
    if (stopCountEl) {
      stopCountEl.textContent = stopCount.toString();
    }
    
    const mapStatusEl = document.getElementById('debug-map-status');
    if (mapStatusEl) {
      mapStatusEl.textContent = mapLoaded;
      mapStatusEl.style.color = mapLoaded === 'Loaded' ? '#4CAF50' : '#F44336';
    }
    
    const lastEventEl = document.getElementById('debug-last-event');
    if (lastEventEl) {
      lastEventEl.textContent = `${lastEvent.type} (${new Date(lastEvent.timestamp).toLocaleTimeString()})`;
    }
  } catch (error) {
    console.error('Error updating debug info:', error);
  }
}

// Create the debug interface when the page is loaded
window.addEventListener('load', () => {
  // Add a small delay to ensure everything is loaded
  setTimeout(createDebugInterface, 3000);
});

// Make debugging functions globally available
window.debugInterface = {
  show: createDebugInterface,
  update: updateDebugInfo,
  addEvent: (type, data) => {
    window._lastDebugEvent = { 
      type, 
      data,
      timestamp: new Date().toISOString()
    };
  }
};

export {
  createDebugInterface,
  updateDebugInfo
};