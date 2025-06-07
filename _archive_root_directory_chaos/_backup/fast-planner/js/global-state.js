/**
 * Global state module for Fast Planner
 * This provides a centralized place for shared state and functions
 */

// Create global namespace
window.FastPlanner = {
  // Map reference
  map: null,
  
  // Waypoints and markers
  waypoints: [],
  markers: [],
  
  // Route functions
  addWaypoint: function(coords, name) {
    console.log(`Adding waypoint at ${coords} with name: ${name || 'Unnamed'}`);
    
    // Create a unique ID for the waypoint
    const id = `waypoint-${Date.now()}`;
    
    // Add to waypoints array
    this.waypoints.push({
      id: id,
      coords: coords,
      name: name || `Waypoint ${this.waypoints.length + 1}`
    });
    
    // Make sure we have a valid map
    if (!this.map) {
      console.error('Map is not initialized yet');
      return;
    }
    
    // Create marker on the map
    const marker = this.createWaypointMarker(coords, name);
    
    // Add drag end event to update route
    marker.on('dragend', () => {
      const lngLat = marker.getLngLat();
      const index = this.markers.indexOf(marker);
      if (index !== -1 && index < this.waypoints.length) {
        this.waypoints[index].coords = [lngLat.lng, lngLat.lat];
        this.updateRoute();
      }
    });
    
    this.markers.push(marker);
    
    // Update route and UI
    this.updateRoute();
    this.updateWaypointList();
  },
  
  // Helper function to create waypoint marker
  createWaypointMarker: function(coords, name) {
    // Make sure we have a valid map
    if (!this.map) {
      console.error('Map is not initialized yet');
      return null;
    }
    
    const marker = new mapboxgl.Marker({
      color: "#FF9800", // Using orange from SAR style
      draggable: true
    })
      .setLngLat(coords)
      .addTo(this.map);
    
    // Add popup with coordinates
    const popup = new mapboxgl.Popup({
      closeButton: true,
      closeOnClick: false,
      offset: 25
    });
    
    const popupContent = `
      <strong>${name || 'Waypoint'}</strong><br>
      Lat: ${coords[1].toFixed(5)}, Lon: ${coords[0].toFixed(5)}
    `;
    
    popup.setHTML(popupContent);
    
    // Show popup on hover
    marker.getElement().addEventListener('mouseenter', () => {
      popup.setLngLat(marker.getLngLat()).addTo(this.map);
    });
    
    marker.getElement().addEventListener('mouseleave', () => {
      popup.remove();
    });
    
    return marker;
  },
  
  // Update route line on map
  updateRoute: function() {
    console.log('Updating route...');
    
    // Make sure we have a valid map
    if (!this.map) {
      console.error('Map is not initialized yet');
      return;
    }
    
    // Remove existing route if it exists
    if (this.map.getSource('route')) {
      this.map.removeLayer('route');
      this.map.removeSource('route');
    }
    
    // If we have at least 2 waypoints, draw the route
    if (this.waypoints.length >= 2) {
      const coordinates = this.waypoints.map(wp => wp.coords);
      
      this.map.addSource('route', {
        'type': 'geojson',
        'data': {
          'type': 'Feature',
          'properties': {},
          'geometry': {
            'type': 'LineString',
            'coordinates': coordinates
          }
        }
      });
      
      // Add main route line
      this.map.addLayer({
        'id': 'route',
        'type': 'line',
        'source': 'route',
        'layout': {
          'line-join': 'round',
          'line-cap': 'round'
        },
        'paint': {
          'line-color': '#007bff', // Bright blue for the main route
          'line-width': 4
        }
      });
      
      // Calculate and update stats
      this.calculateRouteStats(coordinates);
    } else {
      // Reset stats if not enough waypoints
      this.resetRouteStats();
    }
  },
  
  // Find nearest rig to coordinates
  findNearestRig: function(lat, lng) {
    // Make sure we have a valid map
    if (!this.map) {
      console.error('Map is not initialized yet');
      return null;
    }
    
    // Check if we have platforms data
    if (!this.map.getSource('major-platforms')) return null;
    
    // Get platforms data
    const platformSource = this.map.getSource('major-platforms');
    const platforms = platformSource._data.features;
    
    if (!platforms || platforms.length === 0) return null;
    
    let nearestPlatform = null;
    let minDistance = Number.MAX_VALUE;
    
    platforms.forEach(platform => {
      const coords = platform.geometry.coordinates;
      const distance = turf.distance(
        turf.point([lng, lat]),
        turf.point(coords),
        { units: 'nauticalmiles' }
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestPlatform = {
          name: platform.properties.name,
          operator: platform.properties.operator,
          coords: coords,
          lat: coords[1],
          lng: coords[0]
        };
      }
    });
    
    // Only return if within reasonable distance (e.g. 10nm)
    return minDistance <= 10 ? nearestPlatform : null;
  },
  
  // Update waypoint list in UI
  updateWaypointList: function() {
    const waypointListElement = document.getElementById('waypoint-list');
    if (!waypointListElement) return;
    
    waypointListElement.innerHTML = '';
    
    this.waypoints.forEach((waypoint, index) => {
      const waypointElement = document.createElement('div');
      waypointElement.className = 'waypoint-item';
      
      const nameElement = document.createElement('div');
      nameElement.textContent = waypoint.name || `Waypoint ${index + 1}`;
      
      const coordsElement = document.createElement('div');
      coordsElement.textContent = `${waypoint.coords[1].toFixed(4)}, ${waypoint.coords[0].toFixed(4)}`;
      
      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'X';
      deleteButton.className = 'control-button';
      deleteButton.style.padding = '2px 5px';
      deleteButton.style.marginLeft = '5px';
      deleteButton.onclick = () => this.removeWaypoint(waypoint.id, index);
      
      waypointElement.appendChild(nameElement);
      waypointElement.appendChild(coordsElement);
      waypointElement.appendChild(deleteButton);
      
      waypointListElement.appendChild(waypointElement);
    });
  },
  
  // Calculate and update route statistics
  calculateRouteStats: function(coordinates) {
    // Use local calculation for now
    this.calculateRouteStatsLocally(coordinates);
  },
  
  // Calculate route statistics locally
  calculateRouteStatsLocally: function(coordinates) {
    console.log('Using local route calculations');
    
    // Get current aircraft and input values
    let aircraft;
    
    try {
      const aircraftId = document.getElementById('aircraft-type').value;
      // Get aircraft data from select value
      if (window.aircraftTypes && window.aircraftTypes[aircraftId]) {
        aircraft = window.aircraftTypes[aircraftId];
      } else {
        // Fallback to first available aircraft
        aircraft = Object.values(DEFAULT_AIRCRAFT_TYPES)[0];
      }
    } catch (error) {
      console.error('Error getting aircraft data:', error);
      aircraft = DEFAULT_AIRCRAFT_TYPES.s92; // Default to S-92
    }
    
    const payloadWeight = parseFloat(document.getElementById('payload-weight').value) || 0;
    const reserveFuel = parseFloat(document.getElementById('reserve-fuel').value) || 0;
    
    // Calculate total distance
    let totalDistance = 0;
    
    for (let i = 0; i < coordinates.length - 1; i++) {
      const from = turf.point(coordinates[i]);
      const to = turf.point(coordinates[i + 1]);
      const options = { units: 'nauticalmiles' };
      
      const segmentDistance = turf.distance(from, to, options);
      totalDistance += segmentDistance;
    }
    
    // Calculate time based on cruise speed (hours)
    const timeHours = totalDistance / aircraft.cruiseSpeed;
    
    // Format time as HH:MM
    const hours = Math.floor(timeHours);
    const minutes = Math.floor((timeHours - hours) * 60);
    const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    // Calculate fuel required (include reserve)
    const fuelRequired = Math.round((timeHours * aircraft.fuelBurn) + reserveFuel);
    
    // Calculate usable load
    const usableLoad = Math.max(0, aircraft.maxTakeoffWeight - aircraft.emptyWeight - fuelRequired - payloadWeight);
    
    // Calculate max passengers
    const maxPassengers = Math.floor(usableLoad / aircraft.passengerWeight);
    
    // Display results
    const result = {
      totalDistance: totalDistance.toFixed(1),
      estimatedTime: formattedTime,
      fuelRequired: fuelRequired,
      usableLoad: usableLoad,
      maxPassengers: maxPassengers
    };
    
    this.updateRouteStatsDisplay(result);
  },
  
  // Update route statistics display
  updateRouteStatsDisplay: function(stats) {
    document.getElementById('total-distance').textContent = stats.totalDistance || '0';
    document.getElementById('estimated-time').textContent = stats.estimatedTime || '00:00';
    document.getElementById('fuel-required').textContent = stats.fuelRequired || '0';
    document.getElementById('usable-load').textContent = stats.usableLoad || '0';
    document.getElementById('max-passengers').textContent = stats.maxPassengers || '0';
  },
  
  // Reset route statistics
  resetRouteStats: function() {
    const stats = {
      totalDistance: '0',
      estimatedTime: '00:00',
      fuelRequired: '0',
      usableLoad: '0',
      maxPassengers: '0'
    };
    
    this.updateRouteStatsDisplay(stats);
  },
  
  /**
   * Remove a waypoint
   * @param {string} id Waypoint ID
   * @param {number} index Waypoint index
   */
  removeWaypoint: function(id, index) {
    console.log(`Removing waypoint: ${id} at index ${index}`);
    
    // Remove the marker
    if (this.markers[index]) {
      this.markers[index].remove();
    }
    
    // Remove from arrays
    this.markers.splice(index, 1);
    this.waypoints = this.waypoints.filter(wp => wp.id !== id);
    
    // Update route and UI
    this.updateRoute();
    this.updateWaypointList();
  },
  
  // Clear the entire route
  clearRoute: function() {
    console.log('Clearing route');
    
    // Remove all markers
    this.markers.forEach(marker => {
      marker.remove();
    });
    
    this.markers = [];
    this.waypoints = [];
    
    // Remove route from map if it exists and map is initialized
    if (this.map && this.map.getSource('route')) {
      this.map.removeLayer('route');
      this.map.removeSource('route');
    }
    
    // Reset stats and UI
    this.resetRouteStats();
    this.updateWaypointList();
  }
};
