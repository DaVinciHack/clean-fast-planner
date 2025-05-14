/**
 * COMPLETELY SEPARATE WAYPOINT SYSTEM
 * 
 * This script creates an entirely independent waypoint system
 * that doesn't use any flags or interact with the existing code.
 * It's overlaid on top of the existing app.
 */

// Self-executing function to avoid polluting global scope
(function() {
  console.log('🟢 Building completely separate waypoint system');
  
  // Create a container for our waypoints
  const waypointSystem = {
    waypoints: [],
    active: false,
    map: null,
    mapContainer: null,
    waypointLayer: 'custom-waypoints-layer',
    lineLayer: 'custom-waypoints-line-layer',
    
    // Initialize the system
    init: function() {
      console.log('🟢 Initializing separate waypoint system');
      
      // Get the map from the global mapManager
      this.map = window.mapManager?.getMap();
      if (!this.map) {
        console.error('🟢 Map not available');
        return false;
      }
      
      // Create a container for our waypoint UI
      this.createUI();
      
      // Add an independent click handler to the map
      this.setupMapClickHandler();
      
      // Set up independent layers for waypoints
      this.setupMapLayers();
      
      console.log('🟢 Separate waypoint system initialized');
      return true;
    },
    
    // Create a UI for our waypoints
    createUI: function() {
      console.log('🟢 Creating waypoint UI');
      
      // Create a waypoint panel
      const panel = document.createElement('div');
      panel.id = 'separate-waypoint-panel';
      panel.style.position = 'fixed';
      panel.style.top = '100px';
      panel.style.right = '10px';
      panel.style.width = '250px';
      panel.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
      panel.style.color = 'white';
      panel.style.padding = '10px';
      panel.style.borderRadius = '5px';
      panel.style.zIndex = '1000';
      panel.style.display = 'none'; // Hidden by default
      panel.style.maxHeight = '500px';
      panel.style.overflowY = 'auto';
      
      // Add a header
      const header = document.createElement('div');
      header.style.display = 'flex';
      header.style.justifyContent = 'space-between';
      header.style.alignItems = 'center';
      header.style.marginBottom = '10px';
      
      const title = document.createElement('h3');
      title.textContent = 'Waypoints';
      title.style.margin = '0';
      title.style.fontWeight = 'bold';
      title.style.color = '#FFCC00';
      
      const closeButton = document.createElement('button');
      closeButton.textContent = 'X';
      closeButton.style.background = 'none';
      closeButton.style.border = 'none';
      closeButton.style.color = 'white';
      closeButton.style.cursor = 'pointer';
      closeButton.style.fontSize = '16px';
      closeButton.onclick = () => {
        this.toggleActive(false);
      };
      
      header.appendChild(title);
      header.appendChild(closeButton);
      panel.appendChild(header);
      
      // Add a waypoints list container
      const list = document.createElement('div');
      list.id = 'separate-waypoint-list';
      panel.appendChild(list);
      
      // Add a clear button
      const clearButton = document.createElement('button');
      clearButton.textContent = 'Clear Waypoints';
      clearButton.style.width = '100%';
      clearButton.style.padding = '5px';
      clearButton.style.marginTop = '10px';
      clearButton.style.backgroundColor = '#FF4136';
      clearButton.style.color = 'white';
      clearButton.style.border = 'none';
      clearButton.style.borderRadius = '5px';
      clearButton.style.cursor = 'pointer';
      clearButton.onclick = () => {
        this.clearWaypoints();
      };
      panel.appendChild(clearButton);
      
      // Add a button to toggle waypoint mode
      const toggleButton = document.createElement('button');
      toggleButton.id = 'separate-waypoint-toggle';
      toggleButton.textContent = 'ENABLE WAYPOINT MODE';
      toggleButton.style.position = 'fixed';
      toggleButton.style.top = '60px';
      toggleButton.style.right = '10px';
      toggleButton.style.padding = '10px';
      toggleButton.style.backgroundColor = '#0074D9';
      toggleButton.style.color = 'white';
      toggleButton.style.border = 'none';
      toggleButton.style.borderRadius = '5px';
      toggleButton.style.cursor = 'pointer';
      toggleButton.style.zIndex = '1000';
      toggleButton.onclick = () => {
        this.toggleActive(!this.active);
      };
      
      // Add elements to the document
      document.body.appendChild(panel);
      document.body.appendChild(toggleButton);
      
      this.panel = panel;
      this.waypointList = list;
      this.toggleButton = toggleButton;
    },
    
    // Toggle the waypoint system active state
    toggleActive: function(active) {
      console.log(`🟢 Toggling waypoint system ${active ? 'ON' : 'OFF'}`);
      
      this.active = active;
      
      // Update UI
      this.panel.style.display = active ? 'block' : 'none';
      this.toggleButton.textContent = active ? 'WAYPOINT MODE ACTIVE' : 'ENABLE WAYPOINT MODE';
      this.toggleButton.style.backgroundColor = active ? '#2ECC40' : '#0074D9';
      
      // Change cursor
      if (this.map) {
        this.map.getCanvas().style.cursor = active ? 'crosshair' : '';
      }
      
      // Show/hide layers
      if (this.map) {
        const visibility = active ? 'visible' : 'none';
        if (this.map.getLayer(this.waypointLayer)) {
          this.map.setLayoutProperty(this.waypointLayer, 'visibility', visibility);
        }
        if (this.map.getLayer(this.lineLayer)) {
          this.map.setLayoutProperty(this.lineLayer, 'visibility', visibility);
        }
      }
      
      // Show a message
      this.showMessage(`Waypoint Mode ${active ? 'Activated' : 'Deactivated'}`, active ? '#2ECC40' : '#0074D9');
    },
    
    // Set up a completely separate map click handler
    setupMapClickHandler: function() {
      console.log('🟢 Setting up separate map click handler');
      
      // Create a function to handle map clicks
      const handleMapClick = (e) => {
        // Only process clicks when active
        if (!this.active) return;
        
        console.log('🟢 Map clicked in waypoint mode');
        
        // Add a waypoint
        this.addWaypoint([e.lngLat.lng, e.lngLat.lat]);
      };
      
      // Add an event listener for map clicks
      this.map.on('click', handleMapClick);
    },
    
    // Set up layers for waypoints and lines
    setupMapLayers: function() {
      console.log('🟢 Setting up map layers');
      
      // Add source for waypoints and lines if it doesn't exist
      if (!this.map.getSource('custom-waypoints-source')) {
        this.map.addSource('custom-waypoints-source', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: []
          }
        });
      }
      
      // Add a line layer for connecting waypoints
      if (!this.map.getLayer(this.lineLayer)) {
        this.map.addLayer({
          id: this.lineLayer,
          type: 'line',
          source: 'custom-waypoints-source',
          filter: ['==', '$type', 'LineString'],
          layout: {
            'visibility': 'none',
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#FFCC00',
            'line-width': 3,
            'line-dasharray': [2, 1]
          }
        });
      }
      
      // Add a symbol layer for waypoint markers
      if (!this.map.getLayer(this.waypointLayer)) {
        this.map.addLayer({
          id: this.waypointLayer,
          type: 'symbol',
          source: 'custom-waypoints-source',
          filter: ['==', '$type', 'Point'],
          layout: {
            'visibility': 'none',
            'icon-image': 'marker-15',
            'icon-size': 1.5,
            'icon-allow-overlap': true,
            'text-field': ['get', 'name'],
            'text-offset': [0, 1.5],
            'text-anchor': 'top',
            'text-size': 12
          },
          paint: {
            'text-color': '#FFCC00',
            'text-halo-color': 'rgba(0, 0, 0, 0.7)',
            'text-halo-width': 1
          }
        });
      }
    },
    
    // Add a waypoint to the system
    addWaypoint: function(coords) {
      console.log('🟢 Adding waypoint at', coords);
      
      // Create a waypoint object
      const waypoint = {
        id: 'wp-' + Date.now(),
        coords: coords,
        name: `Waypoint ${this.waypoints.length + 1}`
      };
      
      // Add to the array
      this.waypoints.push(waypoint);
      
      // Update the map
      this.updateMapData();
      
      // Update the UI
      this.updateWaypointList();
      
      // Show a message
      this.showMessage(`Added ${waypoint.name}`);
      
      return waypoint;
    },
    
    // Remove a waypoint
    removeWaypoint: function(id) {
      console.log('🟢 Removing waypoint', id);
      
      // Find the waypoint
      const index = this.waypoints.findIndex(wp => wp.id === id);
      if (index === -1) {
        console.log('🟢 Waypoint not found');
        return false;
      }
      
      // Remove from the array
      this.waypoints.splice(index, 1);
      
      // Update the map
      this.updateMapData();
      
      // Update the UI
      this.updateWaypointList();
      
      // Show a message
      this.showMessage('Waypoint removed');
      
      return true;
    },
    
    // Clear all waypoints
    clearWaypoints: function() {
      console.log('🟢 Clearing all waypoints');
      
      // Clear the array
      this.waypoints = [];
      
      // Update the map
      this.updateMapData();
      
      // Update the UI
      this.updateWaypointList();
      
      // Show a message
      this.showMessage('All waypoints cleared');
    },
    
    // Update the GeoJSON data on the map
    updateMapData: function() {
      console.log('🟢 Updating map data');
      
      // Skip if source doesn't exist
      if (!this.map.getSource('custom-waypoints-source')) {
        console.log('🟢 Source not created yet');
        return;
      }
      
      // Create point features for waypoints
      const pointFeatures = this.waypoints.map(wp => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: wp.coords
        },
        properties: {
          id: wp.id,
          name: wp.name
        }
      }));
      
      // Create a line feature connecting waypoints
      let lineFeature = null;
      if (this.waypoints.length >= 2) {
        lineFeature = {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: this.waypoints.map(wp => wp.coords)
          },
          properties: {}
        };
      }
      
      // Create the full GeoJSON object
      const data = {
        type: 'FeatureCollection',
        features: lineFeature ? [...pointFeatures, lineFeature] : pointFeatures
      };
      
      // Update the source
      this.map.getSource('custom-waypoints-source').setData(data);
    },
    
    // Update the waypoint list in the UI
    updateWaypointList: function() {
      console.log('🟢 Updating waypoint list');
      
      // Clear the list
      this.waypointList.innerHTML = '';
      
      // Add a header if we have waypoints
      if (this.waypoints.length > 0) {
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.borderBottom = '1px solid #555';
        header.style.paddingBottom = '5px';
        header.style.marginBottom = '5px';
        
        const nameHeader = document.createElement('div');
        nameHeader.textContent = 'Name';
        nameHeader.style.fontWeight = 'bold';
        
        const actionsHeader = document.createElement('div');
        actionsHeader.textContent = 'Actions';
        actionsHeader.style.fontWeight = 'bold';
        
        header.appendChild(nameHeader);
        header.appendChild(actionsHeader);
        
        this.waypointList.appendChild(header);
      }
      
      // Add each waypoint
      this.waypoints.forEach((waypoint, index) => {
        const item = document.createElement('div');
        item.style.display = 'flex';
        item.style.justifyContent = 'space-between';
        item.style.alignItems = 'center';
        item.style.padding = '5px 0';
        item.style.borderBottom = '1px solid #333';
        
        const nameContainer = document.createElement('div');
        nameContainer.style.display = 'flex';
        nameContainer.style.flexDirection = 'column';
        
        const name = document.createElement('div');
        name.textContent = waypoint.name;
        name.style.fontWeight = 'bold';
        name.style.color = '#FFCC00';
        
        const coords = document.createElement('div');
        coords.textContent = `Lat: ${waypoint.coords[1].toFixed(5)}, Lon: ${waypoint.coords[0].toFixed(5)}`;
        coords.style.fontSize = '11px';
        coords.style.color = '#AAA';
        
        nameContainer.appendChild(name);
        nameContainer.appendChild(coords);
        
        const controls = document.createElement('div');
        
        const removeButton = document.createElement('button');
        removeButton.textContent = '✖';
        removeButton.style.background = 'none';
        removeButton.style.border = 'none';
        removeButton.style.color = '#FF4136';
        removeButton.style.cursor = 'pointer';
        removeButton.style.fontSize = '16px';
        removeButton.style.padding = '0 5px';
        removeButton.onclick = () => {
          this.removeWaypoint(waypoint.id);
        };
        
        controls.appendChild(removeButton);
        
        item.appendChild(nameContainer);
        item.appendChild(controls);
        
        this.waypointList.appendChild(item);
      });
      
      // Add a message if no waypoints
      if (this.waypoints.length === 0) {
        const message = document.createElement('div');
        message.textContent = 'No waypoints added yet';
        message.style.padding = '10px';
        message.style.textAlign = 'center';
        message.style.fontStyle = 'italic';
        message.style.color = '#AAA';
        
        this.waypointList.appendChild(message);
      }
    },
    
    // Show a toast message
    showMessage: function(message, color = '#2ECC40') {
      console.log('🟢 Showing message:', message);
      
      // Create a toast element
      const toast = document.createElement('div');
      toast.textContent = message;
      toast.style.position = 'fixed';
      toast.style.bottom = '20px';
      toast.style.left = '50%';
      toast.style.transform = 'translateX(-50%)';
      toast.style.backgroundColor = color;
      toast.style.color = 'white';
      toast.style.padding = '10px 20px';
      toast.style.borderRadius = '5px';
      toast.style.zIndex = '2000';
      
      // Add to document
      document.body.appendChild(toast);
      
      // Remove after a delay
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 2000);
    }
  };
  
  // Initialize the system
  setTimeout(() => {
    try {
      waypointSystem.init();
      console.log('🟢 Waypoint system ready');
    } catch (err) {
      console.error('🟢 Error initializing waypoint system:', err);
    }
  }, 2000); // Delay to ensure the map is loaded
  
  // Make the system available globally
  window.waypointSystem = waypointSystem;
  
  // Add a keyboard shortcut (press 'w' to toggle)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'w' && !e.ctrlKey && !e.altKey && !e.metaKey) {
      if (window.waypointSystem) {
        window.waypointSystem.toggleActive(!window.waypointSystem.active);
      }
    }
  });
  
  console.log('🟢 Separate waypoint system script loaded');
})();
