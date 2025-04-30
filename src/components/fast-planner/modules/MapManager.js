/**
 * MapManager.js
 * 
 * Handles map initialization, event setup, and basic map interactions
 */

class MapManager {
  constructor() {
    this.map = null;
    this.mapboxToken = 'pk.eyJ1IjoiZGlya3N0ZXIxMDEiLCJhIjoiY204YW9mdm4yMTliMTJscXVnaXRqNmptNyJ9.VDLt_kE5BnAV8S4vXjFMlg';
    this._isLoaded = false; // Internal flag to track load state
    this._loadCallbacks = []; // Queue for callbacks added before load
  }

  /**
   * Initialize the MapBox map
   * @param {string} containerId - The DOM element ID for the map container
   * @returns {Promise} - Resolves with the map instance immediately after creation
   */
  initializeMap(containerId) {
    return new Promise((resolve, reject) => {
      try {
        if (!window.mapboxgl) {
          reject(new Error('Mapbox GL JS not loaded'));
          return;
        }
        
        const mapContainer = document.getElementById(containerId);
        if (!mapContainer) {
          reject(new Error('Map container element not found'));
          return;
        }
        
        // Set Mapbox access token
        window.mapboxgl.accessToken = this.mapboxToken;
        
        console.log('Creating MapBox instance...');
        
        // Create map instance with simpler style
        this.map = new window.mapboxgl.Map({
          container: containerId,
          style: 'mapbox://styles/mapbox/dark-v11',
          center: [-90.5, 27.5], // Gulf of Mexico center
          zoom: 6,
          attributionControl: false,
          preserveDrawingBuffer: true
        });
        
        console.log('Map instance created successfully');
        
        // Navigation controls removed to clean up UI

        this._isLoaded = false; // Reset flag on initialization
        this._loadCallbacks = []; // Clear any previous callbacks

        // Attach the single 'load' event listener
        this.map.once('load', () => {
          console.log('Map loaded event fired');
          this._isLoaded = true; // Set the internal flag
          
          // Add the grid first
          this.addGridToMap(); 
          
          // Execute and clear any pending callbacks
          console.log(`Executing ${this._loadCallbacks.length} queued onMapLoaded callbacks.`);
          this._loadCallbacks.forEach(cb => {
            try {
              cb();
            } catch (e) {
              console.error("Error executing onMapLoaded callback:", e);
            }
          });
          this._loadCallbacks = []; 
        });
        
        // Handle map errors
        this.map.on('error', (e) => {
          console.error('MapBox error:', e);
          reject(e); 
        });

        // Resolve the promise immediately after map instance creation
        resolve(this.map); 

      } catch (error) {
        console.error('Error initializing map:', error);
        reject(error);
      }
    });
  }
  
  /**
   * Load the necessary scripts for the map
   * @returns {Promise} - Resolves when all scripts are loaded
   */
  loadScripts() {
    return new Promise((resolve, reject) => {
      try {
        // Create and load MapBox script
        const mapboxScript = document.createElement('script');
        mapboxScript.src = 'https://api.mapbox.com/mapbox-gl-js/v2.14.1/mapbox-gl.js';
        mapboxScript.async = true;
        document.body.appendChild(mapboxScript);
        
        // Create and load MapBox CSS
        const mapboxCss = document.createElement('link');
        mapboxCss.href = 'https://api.mapbox.com/mapbox-gl-js/v2.14.1/mapbox-gl.css';
        mapboxCss.rel = 'stylesheet';
        document.head.appendChild(mapboxCss);
        
        // Create and load Turf.js
        const turfScript = document.createElement('script');
        turfScript.src = 'https://cdn.jsdelivr.net/npm/@turf/turf@6/turf.min.js';
        turfScript.async = true;
        document.body.appendChild(turfScript);
        
        // Check if scripts are loaded
        const checkScriptsLoaded = setInterval(() => {
          if (window.mapboxgl && window.turf) {
            clearInterval(checkScriptsLoaded);
            console.log('MapBox and Turf scripts loaded successfully');
            resolve();
          }
        }, 100);
        
        // Set a timeout to avoid infinite waiting
        setTimeout(() => {
          if (!window.mapboxgl || !window.turf) {
            clearInterval(checkScriptsLoaded);
            reject(new Error('Timeout loading map scripts'));
          }
        }, 10000);
      } catch (error) {
        console.error('Error loading map scripts:', error);
        reject(error);
      }
    });
  }
  
  /**
   * Add grid lines to map
   */
  addGridToMap() {
    const map = this.map;
    if (!map) return;
    
    console.log('Adding grid to map (called from map load event)');
    
    try {
      // Map is guaranteed to be loaded here as this is called from the 'load' event handler
      this._addSimpleGrid(); 
    } catch (error) {
      console.error('Error adding grid to map:', error);
    }
  }
  
  /**
   * Add a simple grid to the map
   * @private
   */
  _addSimpleGrid() {
    const map = this.map;
    if (!map) return;
    
    try {
      console.log('Adding simple grid to map');
      // No need to double-check map.loaded() here
      this._addSimpleGridSafely();
    } catch (error) {
      console.error('Error in _addSimpleGrid:', error);
    }
  }
  
  /**
   * Add grid with additional safety checks
   * @private
   */
  _addSimpleGridSafely() {
    const map = this.map;
    if (!map) {
      console.error('Map is null in _addSimpleGridSafely');
      return;
    }
    
    try {
      console.log('Creating grid data');
      // Create grid with simple lines
      const latLines = [];
      const longLines = [];
      
      // Create latitude lines every 1 degree from 24° to 31° N
      for (let lat = 24; lat <= 31; lat++) {
        const line = {
          type: 'Feature',
          properties: {
            name: `${lat}°N`
          },
          geometry: {
            type: 'LineString',
            coordinates: [
              [-98, lat], // Western Gulf
              [-83, lat]  // Eastern Gulf
            ]
          }
        };
        latLines.push(line);
      }
      
      // Create longitude lines every 1 degree from -98° to -83° W
      for (let long = -98; long <= -83; long++) {
        const line = {
          type: 'Feature',
          properties: {
            name: `${Math.abs(long)}°W`
          },
          geometry: {
            type: 'LineString',
            coordinates: [
              [long, 24], // Southern Gulf
              [long, 31]  // Northern Gulf
            ]
          }
        };
        longLines.push(line);
      }
      
      // Using separate try/catch blocks for each operation for maximum safety
      
      // Remove existing layers first
      try {
        console.log('Checking for existing grid layers');
        if (map.getLayer('grid-labels')) {
          console.log('Removing grid-labels layer');
          map.removeLayer('grid-labels');
        }
      } catch (e) {
        console.warn('Could not remove grid-labels layer:', e.message);
      }
      
      try {
        if (map.getLayer('longitude-lines')) {
          console.log('Removing longitude-lines layer');
          map.removeLayer('longitude-lines');
        }
      } catch (e) {
        console.warn('Could not remove longitude-lines layer:', e.message);
      }
      
      try {
        if (map.getLayer('latitude-lines')) {
          console.log('Removing latitude-lines layer');
          map.removeLayer('latitude-lines');
        }
      } catch (e) {
        console.warn('Could not remove latitude-lines layer:', e.message);
      }
      
      try {
        if (map.getSource('grid-lines')) {
          console.log('Removing grid-lines source');
          map.removeSource('grid-lines');
        }
      } catch (e) {
        console.warn('Could not remove grid-lines source:', e.message);
      }
      
      // Add source
      try {
        console.log('Adding grid-lines source');
        map.addSource('grid-lines', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [...latLines, ...longLines]
          }
        });
      } catch (e) {
        console.error('Error adding grid-lines source:', e.message);
        return; // Stop if we can't add the source
      }
      
      // Add latitude lines layer
      try {
        console.log('Adding latitude-lines layer');
        map.addLayer({
          id: 'latitude-lines',
          type: 'line',
          source: 'grid-lines',
          filter: ['all', ['has', 'name'], ['match', ['slice', ['get', 'name'], -1], ['N'], true, false]],
          paint: {
            'line-color': 'rgba(255, 255, 255, 0.3)',
            'line-width': 1,
            'line-dasharray': [3, 3]
          }
        });
      } catch (e) {
        console.error('Error adding latitude-lines layer:', e.message);
      }
      
      // Add longitude lines layer
      try {
        console.log('Adding longitude-lines layer');
        map.addLayer({
          id: 'longitude-lines',
          type: 'line',
          source: 'grid-lines',
          filter: ['all', ['has', 'name'], ['match', ['slice', ['get', 'name'], -1], ['W'], true, false]],
          paint: {
            'line-color': 'rgba(255, 255, 255, 0.3)',
            'line-width': 1,
            'line-dasharray': [3, 3]
          }
        });
      } catch (e) {
        console.error('Error adding longitude-lines layer:', e.message);
      }
      
      // Add grid labels layer
      try {
        console.log('Adding grid-labels layer');
        map.addLayer({
          id: 'grid-labels',
          type: 'symbol',
          source: 'grid-lines',
          filter: ['has', 'name'],
          layout: {
            'text-field': ['get', 'name'],
            'text-size': 12,
            'text-offset': [0, -1],
            'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
            'text-radial-offset': 0.5,
            'text-justify': 'auto'
          },
          paint: {
            'text-color': 'rgba(255, 255, 255, 0.5)',
            'text-halo-color': 'rgba(0, 0, 0, 0.5)',
            'text-halo-width': 1
          }
        });
      } catch (e) {
        console.error('Error adding grid-labels layer:', e.message);
      }
      
      console.log('Grid added successfully');
    } catch (error) {
      console.error('Error in _addSimpleGridSafely:', error);
    }
  }
  
  /**
   * Fit map to the given coordinates
   * @param {Array} bounds - Array of [lng, lat] coordinates
   */
  fitMapToBounds(bounds) {
    if (!this.map) return;
    
    this.map.fitBounds(bounds, {
      padding: 50,
      maxZoom: 10
    });
  }
  
  /**
   * Get the current map instance
   * @returns {Object} - The MapBox map instance
   */
  getMap() {
    return this.map;
  }
  
  /**
   * Check if the map is loaded using our internal flag
   * @returns {boolean} - True if the map's load event has fired
   */
  isMapLoaded() {
    // Primarily rely on our internal flag, but check map existence too
    return this._isLoaded && !!this.map; 
  }
  
  /**
   * Add a callback to be executed once the map is loaded.
   * If the map is already loaded, executes immediately.
   * @param {Function} callback - Function to call when the map is loaded
   */
  onMapLoaded(callback) {
    if (this.isMapLoaded()) {
      // Map is already loaded, execute immediately
      console.log("onMapLoaded: Map already loaded, executing callback immediately.");
      try {
        callback();
      } catch (e) {
         console.error("Error executing immediate onMapLoaded callback:", e);
      }
    } else if (this.map) {
      // Map exists but not loaded, queue the callback
      console.log("onMapLoaded: Map not loaded, queuing callback.");
      this._loadCallbacks.push(callback);
    } else {
       console.error("onMapLoaded called before map instance exists.");
    }
  }
  
  /**
   * Set up route dragging functionality
   * @param {Function} onRoutePointAdded - Callback when a new point is added via drag
   */
  setupRouteDragging(onRoutePointAdded) {
    const map = this.map;
    if (!map) return;

    console.log('Setting up route dragging functionality');

    let isDragging = false;
    let draggedLineCoordinates = [];
    let originalLineCoordinates = [];
    let dragStartPoint = null;
    let closestPointIndex = -1;
    let dragLineSource = null;

    // Function to add the temporary drag line
    const addDragLine = (coordinates) => {
      try {
        if (map.getSource('drag-line')) {
          map.removeLayer('drag-line');
          map.removeSource('drag-line');
        }
        
        map.addSource('drag-line', {
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
        
        map.addLayer({
          'id': 'drag-line',
          'type': 'line',
          'source': 'drag-line',
          'layout': {
            'line-join': 'round',
            'line-cap': 'round'
          },
          'paint': {
            'line-color': '#ff0000', // Red for the dragging line
            'line-width': 4,
            'line-dasharray': [2, 1] // Dashed line for the temp route
          }
        });

        dragLineSource = map.getSource('drag-line');
      } catch (error) {
        console.error('Error adding drag line:', error);
      }
    };

    // Helper to find closest point on the line and the segment it belongs to
    const findClosestPointOnLine = (mouseLngLat, mousePoint) => {
      try {
        if (!map.getSource('route')) return null;
        
        // First check if the mouse is over a route feature using rendered features
        // This is more accurate than calculating distance and works better for user interaction
        const routeFeatures = map.queryRenderedFeatures(mousePoint, { layers: ['route'] });
        const isMouseOverRoute = routeFeatures && routeFeatures.length > 0;
        
        const routeSource = map.getSource('route');
        if (!routeSource || !routeSource._data) return null;
        
        const coordinates = routeSource._data.geometry.coordinates;
        if (!coordinates || coordinates.length < 2) return null;
        
        let minDistance = Infinity;
        let closestPoint = null;
        let segmentIndex = -1;
        
        // Check each segment of the line
        for (let i = 0; i < coordinates.length - 1; i++) {
          const line = window.turf.lineString([coordinates[i], coordinates[i + 1]]);
          const point = window.turf.point([mouseLngLat.lng, mouseLngLat.lat]);
          const snapped = window.turf.nearestPointOnLine(line, point);
          
          if (snapped.properties.dist < minDistance) {
            minDistance = snapped.properties.dist;
            closestPoint = snapped.geometry.coordinates;
            segmentIndex = i;
          }
        }
        
        // Convert distance to nautical miles for easy comparison
        const distanceNM = window.turf.distance(
          window.turf.point([mouseLngLat.lng, mouseLngLat.lat]),
          window.turf.point(closestPoint),
          { units: 'nauticalmiles' }
        );
        
        // If mouse is directly over the route (pixel-perfect), return regardless of distance
        // Otherwise use a more generous distance threshold (0.5 nautical miles)
        const maxDistanceThreshold = 0.5; // More generous distance in nautical miles
        
        if (isMouseOverRoute || distanceNM < maxDistanceThreshold) {
          return { 
            point: closestPoint, 
            index: segmentIndex,
            distance: distanceNM,
            isDirectlyOver: isMouseOverRoute
          };
        }
        
        return null;
      } catch (error) {
        console.error('Error finding closest point on line:', error);
        return null;
      }
    };

    // Setup mousedown event for starting the drag
    map.on('mousedown', (e) => {
      // Skip if no route or if clicking on a waypoint
      if (!map.getSource('route')) return;
      
      // Don't start drag if right-click
      if (e.originalEvent.button === 2) return;
      
      // Check for platform markers and don't start drag if clicked on one
      const platformFeatures = map.queryRenderedFeatures(e.point, { layers: ['platforms-layer'] });
      if (platformFeatures.length > 0) return;
      
      // Find the closest point on the route line
      const mousePos = e.lngLat;
      const closestInfo = findClosestPointOnLine(mousePos, e.point);
      
      // If mouse is directly over the route or within distance threshold
      if (closestInfo) {
        console.log('Starting route drag operation at segment:', closestInfo.index, 
                   'Distance:', closestInfo.distance.toFixed(2) + ' nm',
                   'Directly over route:', closestInfo.isDirectlyOver);
        
        // Get the original route coordinates
        const routeSource = map.getSource('route');
        if (!routeSource || !routeSource._data) return;
        originalLineCoordinates = [...routeSource._data.geometry.coordinates];
        
        // Start dragging
        isDragging = true;
        dragStartPoint = closestInfo.point;
        closestPointIndex = closestInfo.index;
        
        // Make a copy of the coordinates for dragging
        draggedLineCoordinates = [...originalLineCoordinates];
        
        // Insert a new point at the drag location, right after the closest segment start
        draggedLineCoordinates.splice(
          closestPointIndex + 1, 
          0, 
          closestInfo.point
        );
        
        // Add the temporary drag line
        addDragLine(draggedLineCoordinates);
        
        // Hide the original route and glow during dragging
        map.setLayoutProperty('route', 'visibility', 'none');
        if (map.getLayer('route-glow')) {
          map.setLayoutProperty('route-glow', 'visibility', 'none');
        }
        
        // Change cursor to grabbing
        map.getCanvas().style.cursor = 'grabbing';
        
        // Prevent default behavior
        e.preventDefault();
      }
    });

    // Set up route hover effect to make it clear it can be dragged
    map.on('mousemove', (e) => {
      if (isDragging) {
        // Update the position of the dragged point
        draggedLineCoordinates[closestPointIndex + 1] = [e.lngLat.lng, e.lngLat.lat];
        
        // Update the drag line
        if (dragLineSource) {
          dragLineSource.setData({
            'type': 'Feature',
            'properties': {},
            'geometry': {
              'type': 'LineString',
              'coordinates': draggedLineCoordinates
            }
          });
        }
      } else {
        // Check if mouse is over the route when not dragging
        const closestInfo = findClosestPointOnLine(e.lngLat, e.point);
        
        if (closestInfo && closestInfo.isDirectlyOver) {
          // Change cursor to indicate draggable route
          map.getCanvas().style.cursor = 'pointer';
        } else if (map.getCanvas().style.cursor === 'pointer') {
          // Reset cursor if it was previously set by this handler
          // (but don't reset if it might have been set by platform hover)
          const platformFeatures = map.queryRenderedFeatures(e.point, { layers: ['platforms-layer'] });
          if (platformFeatures.length === 0) {
            map.getCanvas().style.cursor = '';
          }
        }
      }
    });

    // Setup mouseup for completing the drag
    map.on('mouseup', (e) => {
      if (!isDragging) return;
      
      // Clean up
      isDragging = false;
      
      // Remove the temporary drag line
      if (map.getSource('drag-line')) {
        map.removeLayer('drag-line');
        map.removeSource('drag-line');
      }
      
      // Show the original route and glow again
      map.setLayoutProperty('route', 'visibility', 'visible');
      if (map.getLayer('route-glow')) {
        map.setLayoutProperty('route-glow', 'visibility', 'visible');
      }
      
      // Call the callback with the segment index and new point
      if (onRoutePointAdded && typeof onRoutePointAdded === 'function') {
        console.log('Route drag complete, adding new point at index:', closestPointIndex + 1);
        onRoutePointAdded(closestPointIndex + 1, [e.lngLat.lng, e.lngLat.lat]);
      }
      
      // Reset cursor
      map.getCanvas().style.cursor = '';
      
      // Reset variables
      draggedLineCoordinates = [];
      originalLineCoordinates = [];
      dragStartPoint = null;
      closestPointIndex = -1;
      dragLineSource = null;
    });

    // Cancel the drag operation if the mouse leaves the map
    map.on('mouseout', () => {
      if (!isDragging) return;
      
      console.log('Mouse left map area, canceling route drag');
      
      // Clean up
      isDragging = false;
      
      // Remove the temporary drag line
      if (map.getSource('drag-line')) {
        map.removeLayer('drag-line');
        map.removeSource('drag-line');
      }
      
      // Show the original route and glow again
      map.setLayoutProperty('route', 'visibility', 'visible');
      if (map.getLayer('route-glow')) {
        map.setLayoutProperty('route-glow', 'visibility', 'visible');
      }
      
      // Reset cursor
      map.getCanvas().style.cursor = '';
      
      // Reset variables
      draggedLineCoordinates = [];
      originalLineCoordinates = [];
      dragStartPoint = null;
      closestPointIndex = -1;
      dragLineSource = null;
    });
  }
}

export default MapManager;
