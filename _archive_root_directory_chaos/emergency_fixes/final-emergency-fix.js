// FINAL EMERGENCY FIX
// THIS IS THE LAST ATTEMPT - IT WILL DISABLE ALL EXISTING HANDLERS
// AND CREATE A COMPLETELY SEPARATE WAYPOINT SYSTEM

// ===== STEP 1: DISABLE ALL EXISTING MAP CLICK HANDLERS =====
const map = window.mapManager?.getMap();
if (!map) {
  alert('Map not available. Try refreshing the page.');
} else {
  // Remove ALL existing click handlers
  console.log('FINAL FIX: Removing ALL existing map click handlers');
  
  // This removes ALL click handlers from the map
  map.off('click');
  
  // Also remove all other click handlers from all layers
  const possibleLayers = [
    'route', 'platforms-layer', 'platforms-fixed-layer', 
    'platforms-movable-layer', 'airfields-layer', 'waypoints-layer'
  ];
  
  possibleLayers.forEach(layer => {
    try {
      map.off('click', layer);
    } catch (e) {
      // Ignore errors if layer doesn't exist
    }
  });
  
  console.log('FINAL FIX: All existing click handlers removed');
}

// ===== STEP 2: CREATE A COMPLETELY SEPARATE WAYPOINT HANDLER =====
// This will be a completely standalone waypoint system
const waypointSystem = {
  active: false,
  stops: [],
  waypoints: [],
  waypointManager: window.waypointManager,
  
  // Initialize the system
  init: function() {
    if (!map) {
      alert('Map not available. Cannot initialize waypoint system.');
      return false;
    }
    
    if (!this.waypointManager) {
      alert('WaypointManager not available. Cannot initialize waypoint system.');
      return false;
    }
    
    // Add a new click handler to the map
    map.on('click', this.handleMapClick.bind(this));
    
    // Create and add the toggle button
    this.addToggleButton();
    
    console.log('FINAL FIX: Waypoint system initialized successfully');
    
    // Check if waypoint mode is already active
    const waypointButton = document.querySelector('button#add-waypoints');
    if (waypointButton && waypointButton.textContent.includes('ACTIVE')) {
      // Waypoint mode is already active
      this.setActive(true);
    }
    
    return true;
  },
  
  // Handle map clicks
  handleMapClick: function(e) {
    console.log(`FINAL FIX: Map clicked in ${this.active ? 'WAYPOINT' : 'NORMAL'} mode`);
    
    const coords = [e.lngLat.lng, e.lngLat.lat];
    
    if (this.active) {
      // In waypoint mode, add a waypoint
      this.addWaypoint(coords);
    } else {
      // In normal mode, add a stop
      this.addStop(coords);
    }
    
    // Show the left panel
    try {
      const leftPanelButton = document.querySelector('.left-panel-toggle-button');
      if (leftPanelButton) {
        leftPanelButton.click();
      }
    } catch (err) {
      // Ignore errors
    }
  },
  
  // Add a waypoint
  addWaypoint: function(coords) {
    console.log('FINAL FIX: Adding waypoint at', coords);
    
    // Generate a name
    const waypointCount = this.waypoints.length;
    const name = `Waypoint ${waypointCount + 1}`;
    
    // Add the waypoint to the waypointManager with explicit type
    this.waypointManager.addWaypoint(coords, name, {
      isWaypoint: true,
      type: 'WAYPOINT'
    });
    
    // Keep track of added waypoints
    this.waypoints.push({
      coords: coords,
      name: name,
      type: 'WAYPOINT'
    });
    
    // Show success message
    this.showMessage(`Added ${name}`);
  },
  
  // Add a stop
  addStop: function(coords) {
    console.log('FINAL FIX: Adding stop at', coords);
    
    // Generate a name
    const stopCount = this.stops.length;
    const name = `Stop ${stopCount + 1}`;
    
    // Add the stop to the waypointManager
    this.waypointManager.addWaypoint(coords, name, {
      isWaypoint: false,
      type: 'STOP'
    });
    
    // Keep track of added stops
    this.stops.push({
      coords: coords,
      name: name,
      type: 'STOP'
    });
    
    // Show success message
    this.showMessage(`Added ${name}`);
  },
  
  // Set active state
  setActive: function(active) {
    console.log(`FINAL FIX: Setting waypoint mode to ${active ? 'ACTIVE' : 'INACTIVE'}`);
    
    // Store the active state
    this.active = active;
    
    // Update the UI
    const waypointButton = document.querySelector('button#add-waypoints');
    if (waypointButton) {
      // Update button style and text
      waypointButton.style.backgroundColor = active ? '#00cc66' : '#0066cc';
      waypointButton.style.fontWeight = active ? 'bold' : 'normal';
      waypointButton.style.border = active ? '2px solid #ffcc00' : 'none';
      waypointButton.textContent = active ? '✅ WAYPOINT MODE ACTIVE' : 'Add Insert Waypoints';
    }
    
    // Change the cursor
    if (map) {
      map.getCanvas().style.cursor = active ? 'crosshair' : '';
    }
    
    // Show a message
    this.showMessage(`${active ? 'Waypoint' : 'Normal'} mode activated`);
    
    return active;
  },
  
  // Add a toggle button to connect to the existing UI
  addToggleButton: function() {
    // Find the existing button
    const existingButton = document.querySelector('button#add-waypoints');
    if (existingButton) {
      // Replace its click handler
      existingButton.onclick = () => {
        this.setActive(!this.active);
      };
      console.log('FINAL FIX: Connected to existing waypoint button');
    } else {
      console.log('FINAL FIX: Existing waypoint button not found');
    }
  },
  
  // Show a message
  showMessage: function(message) {
    try {
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator(message, 'info');
      } else {
        // Create a toast message
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.left = '50%';
        toast.style.transform = 'translateX(-50%)';
        toast.style.backgroundColor = 'rgba(0, 123, 255, 0.9)';
        toast.style.color = 'white';
        toast.style.padding = '10px 20px';
        toast.style.borderRadius = '5px';
        toast.style.zIndex = '1000';
        toast.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
        
        document.body.appendChild(toast);
        
        // Remove after 2 seconds
        setTimeout(() => {
          document.body.removeChild(toast);
        }, 2000);
      }
    } catch (err) {
      console.error('Error showing message:', err);
    }
  }
};

// Create a reset button
const createResetButton = () => {
  // Check if button already exists
  if (document.querySelector('#final-reset-button')) {
    return;
  }
  
  // Create the button
  const button = document.createElement('button');
  button.id = 'final-reset-button';
  button.innerText = 'Reset Map Clicks';
  button.style.position = 'fixed';
  button.style.bottom = '10px';
  button.style.left = '10px';
  button.style.zIndex = '9999';
  button.style.background = '#ff4136';
  button.style.color = 'white';
  button.style.padding = '5px 10px';
  button.style.border = 'none';
  button.style.borderRadius = '4px';
  button.style.cursor = 'pointer';
  
  // Add click handler
  button.onclick = () => {
    // Remove all click handlers
    map.off('click');
    
    // Re-initialize our system
    waypointSystem.init();
    
    // Show success message
    waypointSystem.showMessage('Map clicks reset');
  };
  
  // Add to document
  document.body.appendChild(button);
};

// Initialize the system with a slight delay to ensure map is fully loaded
setTimeout(() => {
  try {
    // Initialize the waypoint system
    const success = waypointSystem.init();
    
    if (success) {
      console.log('FINAL FIX: Waypoint system ready');
      
      // Create the reset button
      createResetButton();
      
      // Show success message
      waypointSystem.showMessage('Map click fix applied');
    } else {
      console.error('FINAL FIX: Failed to initialize waypoint system');
      
      // Show error message
      alert('Failed to initialize waypoint system. Please refresh the page and try again.');
    }
  } catch (err) {
    console.error('FINAL FIX: Error initializing waypoint system:', err);
    
    // Show error message
    alert(`Error initializing waypoint system: ${err.message}`);
  }
}, 500);

// Make the waypoint system available globally
window.finalWaypointSystem = waypointSystem;
