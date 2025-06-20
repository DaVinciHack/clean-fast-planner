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
   * @param {Object} options - Optional initialization options
   * @param {Object} options.initialRegion - Initial region to center map on
   * @returns {Promise} - Resolves with the map instance immediately after creation
   */
  initializeMap(containerId, options = {}) {
    return new Promise((resolve, reject) => {
      try {
        if (!window.mapboxgl) {
          reject(new Error('Mapbox GL JS not loaded'));
          return;
        }
        
        const mapContainer = document.getElementById(containerId);
        if (!mapContainer) {
          console.error(`🚨 MAP CONTAINER NOT FOUND: ${containerId}`);
          console.error('Available elements:', document.querySelectorAll('[id]'));
          reject(new Error(`Map container element '${containerId}' not found - DOM might not be ready`));
          return;
        }
        
        // Set Mapbox access token
        window.mapboxgl.accessToken = this.mapboxToken;
        
        // 🛡️ PRODUCTION DEBUG: Log token status
        console.log('MapBox token set, creating instance...');
        console.log('Token starts with:', this.mapboxToken.substring(0, 20) + '...');
        
        console.log('Creating MapBox instance...');
        
        // DIAGNOSTIC: Log if this is happening during a region change
        if (window.REGION_CHANGE_IN_PROGRESS) {
          console.log(`%c MAPMANAGER DIAGNOSTIC: ⚠️ Creating map during region change! 
            From: ${window.REGION_CHANGE_FROM} 
            To: ${window.REGION_CHANGE_TO}
            Time: ${window.REGION_CHANGE_TIME}`, 
            'background: orange; color: black; font-weight: bold');
        }
        
        // Always use Gulf of Mexico as the initial map position
        // This allows the nice fly animation to work when loading saved regions
        let initialCenter = [-90.5, 27.5]; // Default: Gulf of Mexico
        let initialZoom = 6;
        
        // DIAGNOSTIC: Log center being used
        console.log(`%c MAPMANAGER DIAGNOSTIC: Using initial center: [${initialCenter}], zoom: ${initialZoom}`, 
                    'background: orange; color: black;');
        
        // Create map instance with determined settings
        this.map = new window.mapboxgl.Map({
          container: containerId,
          style: 'mapbox://styles/mapbox/dark-v11',
          center: initialCenter,
          zoom: initialZoom,
          attributionControl: false,
          preserveDrawingBuffer: true
        });
        
        console.log('Map instance created successfully');

        this._isLoaded = false; // Reset flag on initialization
        this._loadCallbacks = []; // Clear any previous callbacks

        // Attach the single 'load' event listener
        this.map.once('load', () => {
          console.log('Map loaded event fired');
          this._isLoaded = true; // Set the internal flag
          
          // Add the grid first
          this.addGridToMap(); 
          
          // Enhance land brightness while keeping seas dark
          this.enhanceLandBrightness();
          
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
          
          // Dispatch a global event for components to listen for
          const mapLoadedEvent = new CustomEvent('map-loaded', {
            detail: { map: this.map }
          });
          window.dispatchEvent(mapLoadedEvent);
        });
        
        // Add an event listener for region changes
        window.addEventListener('region-changed', (event) => {
          if (!this.map || !this._isLoaded) return;
          
          try {
            if (event.detail && event.detail.region) {
              const region = event.detail.region;
              console.log(`MapManager: Received region change event for ${region.name}`);
              
              // Ensure the map smoothly flies to the region bounds
              if (this.map && typeof this.map.fitBounds === 'function' && region.bounds) {
                console.log(`MapManager: Flying to ${region.name} bounds`);
                this.map.fitBounds(region.bounds, {
                  padding: 50,
                  maxZoom: region.zoom || 6,
                  animate: true,
                  duration: 3000,
                  essential: true
                });
              }
            }
          } catch (error) {
            console.error('MapManager: Error handling region change:', error);
          }
        });
        
        // Handle map errors
        this.map.on('error', (e) => {
          console.error('🚨 MAPBOX ERROR - This will break the map:', e);
          console.error('Error type:', e.error?.type || 'unknown');
          console.error('Error message:', e.error?.message || e.message || 'no message');
          
          // 🛡️ Check for common production issues
          if (e.error?.message?.includes('401') || e.error?.message?.includes('Unauthorized')) {
            console.error('🚨 LIKELY CAUSE: Invalid or expired MapBox token');
          }
          if (e.error?.message?.includes('network') || e.error?.message?.includes('fetch')) {
            console.error('🚨 LIKELY CAUSE: Network connectivity issue or firewall blocking MapBox');
          }
          
          reject(e); 
        });

        // Note: Context menu handling moved to MapInteractions.js for right-click delete functionality

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
        // 🛡️ PRODUCTION FIX: Check if scripts are already loaded (from HTML)
        if (window.mapboxgl && window.turf) {
          console.log('✅ Scripts already loaded from HTML - skipping dynamic loading');
          resolve();
          return;
        }
        
        console.log('📦 Scripts not pre-loaded, loading dynamically...');
        
        // Only load scripts if they're not already available
        if (!window.mapboxgl) {
          const mapboxScript = document.createElement('script');
          mapboxScript.src = 'https://api.mapbox.com/mapbox-gl-js/v2.14.1/mapbox-gl.js';
          mapboxScript.async = true;
          document.body.appendChild(mapboxScript);
          
          // Add MapBox CSS if not already present
          if (!document.querySelector('link[href*="mapbox-gl.css"]')) {
            const mapboxCss = document.createElement('link');
            mapboxCss.href = 'https://api.mapbox.com/mapbox-gl-js/v2.14.1/mapbox-gl.css';
            mapboxCss.rel = 'stylesheet';
            document.head.appendChild(mapboxCss);
          }
        }
        
        if (!window.turf) {
          const turfScript = document.createElement('script');
          // 🛡️ Use same CDN as production to avoid conflicts
          turfScript.src = 'https://unpkg.com/@turf/turf@6/turf.min.js';
          turfScript.async = true;
          document.body.appendChild(turfScript);
        }
        
        // Check if scripts are loaded
        const checkScriptsLoaded = setInterval(() => {
          if (window.mapboxgl && window.turf) {
            clearInterval(checkScriptsLoaded);
            console.log('✅ Dynamic scripts loaded successfully');
            resolve();
          }
        }, 100);
        
        // Set a timeout to avoid infinite waiting - increased for production
        setTimeout(() => {
          if (!window.mapboxgl || !window.turf) {
            clearInterval(checkScriptsLoaded);
            console.error('🚨 SCRIPT LOADING FAILED - This will break the map completely!');
            console.error('MapBox loaded:', !!window.mapboxgl);
            console.error('Turf loaded:', !!window.turf);
            reject(new Error('Timeout loading map scripts - check network connectivity and firewall settings'));
          }
        }, 30000); // 🛡️ Increased to 30 seconds for slower networks
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
   * Enhance land brightness while keeping seas dark
   * Modifies specific map layers to brighten land areas
   */
  enhanceLandBrightness() {
    if (!this.map || !this.map.isStyleLoaded()) {
      console.warn('MapManager: Cannot enhance land brightness - map style not loaded');
      return;
    }
    
    console.log('🌍 MapManager: Enhancing land brightness for better visibility');
    
    try {
      // Get all layers to find land-related ones
      const style = this.map.getStyle();
      if (!style || !style.layers) return;
      
      // Land-related layer patterns to brighten
      const landLayerPatterns = [
        'land',
        'landcover',
        'landuse',
        'building',
        'country',
        'admin',
        'place',
        'road',
        'highway',
        'street',
        'poi'
      ];
      
      // Find and enhance background map layers only (not our custom overlays)
      style.layers.forEach(layer => {
        // Only enhance BASE MAP layers, not custom layers
        const isCustomLayer = layer.id.includes('platform') || 
                             layer.id.includes('waypoint') || 
                             layer.id.includes('route') || 
                             layer.id.includes('grid') ||
                             layer.id.includes('lightning') ||
                             layer.id.includes('weather') ||
                             layer.id.includes('gulf') ||
                             layer.id.includes('3d-rig');
        
        if (isCustomLayer) {
          return; // Skip our custom overlays
        }
        
        // Enhance base map background layers
        if (layer.type === 'background') {
          try {
            // Get current background color and brighten it more
            const currentColor = this.map.getPaintProperty(layer.id, 'background-color') || '#000000';
            this.map.setPaintProperty(layer.id, 'background-color', this.brightenColor(currentColor, 2.5));
            console.log(`✅ Enhanced background layer: ${layer.id}`);
          } catch (e) {
            console.warn(`⚠️ Could not enhance background layer ${layer.id}:`, e.message);
          }
        }
        
        // Enhance base map land/water layers 
        if (layer.type === 'fill' && (layer.id.includes('land') || layer.id.includes('water'))) {
          try {
            const currentColor = this.map.getPaintProperty(layer.id, 'fill-color');
            if (currentColor && layer.id.includes('land')) {
              // Only brighten land, not water - increased brightness
              this.map.setPaintProperty(layer.id, 'fill-color', this.brightenColor(currentColor, 2.2));
              console.log(`✅ Enhanced land fill layer: ${layer.id}`);
            }
          } catch (e) {
            console.warn(`⚠️ Could not enhance fill layer ${layer.id}:`, e.message);
          }
        }
      });
      
      console.log('🌍 Land brightness enhancement completed');
      
    } catch (error) {
      console.error('MapManager: Error enhancing land brightness:', error);
    }
  }
  
  /**
   * Helper function to brighten a color
   * @param {string} color - CSS color string
   * @param {number} factor - Brightness factor (1.0 = no change, 2.0 = double brightness)
   * @returns {string} Brightened color
   */
  brightenColor(color, factor) {
    // Simple implementation - just return a lighter version
    if (typeof color === 'string' && color.startsWith('#')) {
      // Convert hex to RGB and brighten
      const hex = color.slice(1);
      const r = Math.min(255, Math.floor(parseInt(hex.substr(0, 2), 16) * factor));
      const g = Math.min(255, Math.floor(parseInt(hex.substr(2, 2), 16) * factor));
      const b = Math.min(255, Math.floor(parseInt(hex.substr(4, 2), 16) * factor));
      return `rgb(${r}, ${g}, ${b})`;
    }
    return color; // Return original if we can't parse it
  }
  
  /**
   * Fit map to the given coordinates
   * @param {Array} bounds - Array of [lng, lat] coordinates
   * @param {Object} options - Options for fitting bounds
   */
  fitMapToBounds(bounds, options = {}) {
    if (!this.map) {
      console.warn('MapManager: Cannot fit bounds - map is not initialized');
      return false;
    }
    
    try {
      // Default fit bounds options
      const fitOptions = {
        padding: options.padding || 50,
        maxZoom: options.maxZoom || 10,
        animate: options.hasOwnProperty('animate') ? options.animate : true,
        duration: options.duration || 2000,
        essential: options.hasOwnProperty('essential') ? options.essential : true
      };
      
      console.log(`MapManager: Fitting map to bounds with options:`, fitOptions);
      this.map.fitBounds(bounds, fitOptions);
      return true;
    } catch (error) {
      console.error('MapManager: Error fitting map to bounds:', error);
      return false;
    }
  }
  
  /**
   * Fly to a specific region
   * @param {Object} region - The region object with bounds and other properties
   * @returns {boolean} - Success status
   */
  flyToRegion(region) {
    if (!this.map || !this._isLoaded) {
      console.warn('MapManager: Cannot fly to region - map is not initialized or loaded');
      return false;
    }
    
    try {
      if (!region || !region.bounds) {
        console.error('MapManager: Invalid region object for flyToRegion');
        return false;
      }
      
      console.log(`MapManager: Flying to region ${region.name || 'unknown'}`);
      
      // Use fitMapToBounds with region-specific options
      return this.fitMapToBounds(region.bounds, {
        padding: 50,
        maxZoom: region.zoom || 6,
        animate: true,
        duration: 3000,
        essential: true
      });
    } catch (error) {
      console.error('MapManager: Error flying to region:', error);
      return false;
    }
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
   * Reinitialize the map when there's an issue
   * @param {string} containerId - The DOM element ID for the map container
   * @param {Object} options - Optional initialization options
   * @param {Object} options.initialRegion - Initial region to center map on
   * @returns {Promise} - Resolves with the map instance
   */
  reInitializeMap(containerId, options = {}) {
    console.log('🗺️ Reinitializing map...');
    
    return new Promise((resolve, reject) => {
      try {
        // Cleanup existing map if it exists
        if (this.map) {
          try {
            // Remove all sources and layers
            if (this.map.getStyle()) {
              const style = this.map.getStyle();
              if (style && style.layers) {
                // Remove layers first
                style.layers.forEach(layer => {
                  if (this.map.getLayer(layer.id)) {
                    this.map.removeLayer(layer.id);
                  }
                });
              }
              
              if (style && style.sources) {
                // Then remove sources
                Object.keys(style.sources).forEach(source => {
                  if (this.map.getSource(source)) {
                    this.map.removeSource(source);
                  }
                });
              }
            }
            
            // Remove event listeners
            this.map.off();
            
            // Remove the map
            this.map.remove();
            
            console.log('🗺️ Cleaned up existing map');
          } catch (error) {
            console.warn('🗺️ Error cleaning up existing map:', error);
            // Continue anyway to recreate the map
          }
        }
        
        // Reset state
        this.map = null;
        this._isLoaded = false;
        this._loadCallbacks = [];
        
        // Initialize a new map with the provided options
        const result = this.initializeMap(containerId, options);
        
        // Also trigger a global event that other components can listen for
        window.dispatchEvent(new CustomEvent('map-reinitialized'));
        
        resolve(result);
      } catch (error) {
        console.error('🗺️ Error reinitializing map:', error);
        reject(error);
      }
    });
  }
  
  /**
   * Add a callback to be executed once the map is loaded.
   * If the map is already loaded, executes immediately.
   * @param {Function} callback - Function to call when the map is loaded
   */
  onMapLoaded(callback) {
    if (!callback || typeof callback !== 'function') {
      console.error("onMapLoaded: Invalid callback provided");
      return;
    }
    
    if (this.isMapLoaded()) {
      // Map is already loaded, execute immediately but in a try/catch for safety
      console.log("onMapLoaded: Map already loaded, executing callback immediately");
      try {
        callback();
      } catch (e) {
        console.error("Error executing immediate onMapLoaded callback:", e);
      }
    } else if (this.map) {
      // Map exists but not loaded, queue the callback
      console.log("onMapLoaded: Map not loaded, queuing callback for later execution");
      this._loadCallbacks.push(callback);
    } else {
      // Map doesn't exist yet, log warning (this isn't an error case necessarily)
      console.warn("onMapLoaded called before map instance exists, callback will be deferred");
      // Still queue the callback - it will run when the map is eventually initialized
      this._loadCallbacks.push(callback);
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
      const platformLayerIds = ['platforms-fixed-layer', 'platforms-movable-layer', 'airfields-layer'].filter(id => map.getLayer(id));
      if (platformLayerIds.length > 0) {
        const platformFeatures = map.queryRenderedFeatures(e.point, { layers: platformLayerIds });
        if (platformFeatures.length > 0) return;
      }
      
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
          const platformLayerIds = ['platforms-fixed-layer', 'platforms-movable-layer', 'airfields-layer'].filter(id => map.getLayer(id));
          let onPlatform = false;
          if (platformLayerIds.length > 0) {
            const platformFeatures = map.queryRenderedFeatures(e.point, { layers: platformLayerIds });
            if (platformFeatures.length > 0) {
              onPlatform = true;
            }
          }
          if (!onPlatform) {
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

  /**
   * Switch map style to different Mapbox themes
   * @param {string} styleId - The style identifier ('dark', '3d', 'satellite', etc.)
   * @returns {Promise} - Resolves when style has loaded
   */
  switchMapStyle(styleId) {
    return new Promise((resolve, reject) => {
      if (!this.map) {
        reject(new Error('Map not initialized'));
        return;
      }

      // Map of style IDs to Mapbox style URLs
      const styles = {
        'dark': 'mapbox://styles/mapbox/dark-v11',
        'dark-v10': 'mapbox://styles/mapbox/dark-v10',
        'navigation-night': 'mapbox://styles/mapbox/navigation-night-v1',
        'satellite': 'mapbox://styles/mapbox/satellite-v9',
        'satellite-streets': 'mapbox://styles/mapbox/satellite-streets-v12',
        'light': 'mapbox://styles/mapbox/light-v11',
        'navigation': 'mapbox://styles/mapbox/navigation-day-v1',
        '3d': 'mapbox://styles/mapbox/satellite-v9' // Use satellite instead of standard for better compatibility
      };

      const styleUrl = styles[styleId];
      if (!styleUrl) {
        reject(new Error(`Unknown style ID: ${styleId}`));
        return;
      }

      console.log(`🗺️ Switching map style to: ${styleId} (${styleUrl})`);

      // Store current style for comparison
      this._previousStyle = this.getCurrentStyle();
      this._targetStyle = styleId;

      // Save current map state
      const currentCenter = this.map.getCenter();
      const currentZoom = this.map.getZoom();
      const currentBearing = this.map.getBearing();
      const currentPitch = this.map.getPitch();

      console.log(`🗺️ Saving map state: center=${currentCenter.lng.toFixed(3)},${currentCenter.lat.toFixed(3)} zoom=${currentZoom.toFixed(1)}`);

      // Listen for style load completion  
      const onStyleLoad = () => {
        console.log(`🗺️ Style ${styleId} loaded successfully`);

        // Restore map position
        this.map.jumpTo({
          center: currentCenter,
          zoom: currentZoom,
          bearing: currentBearing,
          pitch: styleId === '3d' ? 60 : currentPitch // Set 3D pitch for 3D style
        });

        // For 3D style, enable terrain if available
        if (styleId === '3d') {
          setTimeout(() => {
            this.enable3DFeatures();
          }, 100);
        }

        // Store current style info
        this._currentStyle = styleId;

        console.log(`🗺️ Style change complete from ${this._previousStyle} to ${styleId}`);
        
        // Add the grid back
        setTimeout(() => {
          this.addGridToMap();
        }, 200);

        resolve();
      };

      // Set up one-time listener for style load
      this.map.once('styledata', onStyleLoad);

      // Switch the style (this will automatically clear all custom layers)
      try {
        this.map.setStyle(styleUrl);
      } catch (error) {
        this.map.off('styledata', onStyleLoad);
        reject(error);
      }
    });
  }

  /**
   * Enable 3D features for the standard style
   */
  enable3DFeatures() {
    if (!this.map) return;

    try {
      // Add atmospheric sky layer for enhanced 3D effect (if supported)
      if (!this.map.getLayer('sky')) {
        try {
          this.map.addLayer({
            id: 'sky',
            type: 'sky',
            paint: {
              'sky-type': 'atmosphere',
              'sky-atmosphere-sun': [0.0, 0.0],
              'sky-atmosphere-sun-intensity': 15
            }
          });
          console.log('🌅 Atmospheric sky layer added');
        } catch (skyError) {
          console.log('ℹ️ Sky layer not supported in this style');
        }
      }

      // Adjust pitch for better 3D viewing
      this.map.easeTo({
        pitch: 60,
        duration: 2000
      });
      console.log('📐 Camera pitch adjusted for 3D viewing');

      // Try to add terrain if available (may not be supported in all styles)
      try {
        if (this.map.getSource('mapbox-dem')) {
          this.map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
          console.log('🏔️ 3D terrain enabled');
        }
      } catch (terrainError) {
        console.log('ℹ️ 3D terrain not available in this style');
      }

    } catch (error) {
      console.log('ℹ️ Some 3D features not supported in this style:', error.message);
    }
  }

  /**
   * Auto-zoom map to fit current flight waypoints
   * @param {Array} waypoints - Array of waypoint objects with lat/lng coordinates
   * @param {Object} options - Zoom options
   * @returns {boolean} - Success status
   */
  autoZoomToFlight(waypoints, options = {}) {
    if (!this.map || !this._isLoaded) {
      console.warn('MapManager: Cannot auto-zoom - map is not initialized or loaded');
      return false;
    }
    
    if (!waypoints || !Array.isArray(waypoints) || waypoints.length === 0) {
      console.warn('MapManager: Cannot auto-zoom - no valid waypoints provided');
      return false;
    }
    
    try {
      console.log(`🎯 MapManager: Auto-zooming to fit ${waypoints.length} waypoints`);
      
      // Extract coordinates from waypoints
      const coordinates = [];
      
      waypoints.forEach((waypoint, index) => {
        let lat, lng;
        
        // Handle different coordinate formats
        if (waypoint.lat !== undefined && waypoint.lng !== undefined) {
          lat = waypoint.lat;
          lng = waypoint.lng;
        } else if (waypoint.latitude !== undefined && waypoint.longitude !== undefined) {
          lat = waypoint.latitude;
          lng = waypoint.longitude;
        } else if (waypoint.coordinates && Array.isArray(waypoint.coordinates)) {
          lng = waypoint.coordinates[0];
          lat = waypoint.coordinates[1];
        } else if (waypoint.coords && Array.isArray(waypoint.coords)) {
          lng = waypoint.coords[0];
          lat = waypoint.coords[1];
        }
        
        // Validate coordinates
        if (lat !== undefined && lng !== undefined && 
            typeof lat === 'number' && typeof lng === 'number' &&
            lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 &&
            lat !== 0 && lng !== 0) { // Filter out placeholder coordinates
          coordinates.push([lng, lat]); // GeoJSON format
          console.log(`🎯 Added waypoint ${index}: ${waypoint.name || 'Unknown'} at [${lng.toFixed(4)}, ${lat.toFixed(4)}]`);
        } else {
          console.warn(`🎯 Skipped waypoint ${index}: ${waypoint.name || 'Unknown'} - invalid coordinates`, { lat, lng });
        }
      });
      
      if (coordinates.length === 0) {
        console.warn('MapManager: No valid coordinates found in waypoints');
        return false;
      }
      
      // Calculate bounds
      let minLng = coordinates[0][0];
      let maxLng = coordinates[0][0];
      let minLat = coordinates[0][1];
      let maxLat = coordinates[0][1];
      
      coordinates.forEach(([lng, lat]) => {
        minLng = Math.min(minLng, lng);
        maxLng = Math.max(maxLng, lng);
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
      });
      
      // Create bounds array for Mapbox (southwest, northeast corners)
      const bounds = [[minLng, minLat], [maxLng, maxLat]];
      
      console.log(`🎯 MapManager: Calculated bounds:`, bounds);
      
      // Handle single point case
      if (coordinates.length === 1) {
        console.log('🎯 MapManager: Single waypoint - centering and zooming');
        this.map.flyTo({
          center: coordinates[0],
          zoom: options.singlePointZoom || 10,
          animate: options.hasOwnProperty('animate') ? options.animate : true,
          duration: options.duration || 2000,
          essential: true
        });
        return true;
      }
      
      // Fit map to bounds with enhanced options
      const fitOptions = {
        padding: options.padding || 80, // More generous padding
        maxZoom: options.maxZoom || 12, // Reasonable max zoom
        animate: options.hasOwnProperty('animate') ? options.animate : true,
        duration: options.duration || 2500, // Slightly longer for smooth effect
        essential: options.hasOwnProperty('essential') ? options.essential : true
      };
      
      console.log(`🎯 MapManager: Fitting to bounds with options:`, fitOptions);
      
      this.map.fitBounds(bounds, fitOptions);
      
      // Auto-load weather circles if flight has weather data
      setTimeout(() => {
        this.autoLoadWeatherCircles();
      }, fitOptions.duration + 500); // Wait for zoom animation to complete
      
      return true;
    } catch (error) {
      console.error('MapManager: Error auto-zooming to flight:', error);
      return false;
    }
  }
  
  /**
   * Auto-load weather circles if weather data is available
   * @returns {boolean} - Success status
   */
  autoLoadWeatherCircles() {
    try {
      console.log('🌤️ MapManager: Checking for weather data to auto-load weather circles');
      
      // Find available weather data
      let weatherData = null;
      let dataSource = 'none';
      
      if (window.loadedWeatherSegments?.length > 0) {
        weatherData = window.loadedWeatherSegments;
        dataSource = 'window.loadedWeatherSegments';
      }
      
      console.log(`🌤️ MapManager: Found weather data from ${dataSource}, segments:`, weatherData?.length || 0);
      
      if (weatherData && weatherData.length > 0) {
        // Import and create weather circles layer
        import('./layers/WeatherCirclesLayer.js').then(module => {
          const WeatherCirclesLayer = module.default;
          
          // Clean up existing layer first
          if (window.currentWeatherCirclesLayer) {
            try {
              window.currentWeatherCirclesLayer.removeWeatherCircles();
            } catch (cleanupError) {
              console.warn('🌤️ Auto-load cleanup error:', cleanupError);
            }
          }
          
          // Create new weather circles layer
          console.log('🌤️ MapManager: Auto-creating weather circles for new flight');
          const weatherCirclesLayer = new WeatherCirclesLayer(this.map);
          weatherCirclesLayer.addWeatherCircles(weatherData);
          window.currentWeatherCirclesLayer = weatherCirclesLayer;
          
          console.log('🌤️ MapManager: Weather circles auto-loaded successfully');
          return true;
        }).catch(error => {
          console.error('🌤️ MapManager: Error auto-loading weather circles:', error);
          return false;
        });
      } else {
        console.log('🌤️ MapManager: No weather data available for auto-loading');
        return false;
      }
    } catch (error) {
      console.error('🌤️ MapManager: Error in autoLoadWeatherCircles:', error);
      return false;
    }
  }

  /**
   * Get current map style ID
   * @returns {string} - Current style identifier
   */
  getCurrentStyle() {
    if (!this.map) return null;
    
    // Use stored style if available
    if (this._currentStyle) return this._currentStyle;
    
    try {
      const styleUrl = this.map.getStyle()?.sprite || this.map.getStyle()?.glyphs || '';
      if (styleUrl.includes('dark')) return 'dark';
      if (styleUrl.includes('standard')) return '3d';
      if (styleUrl.includes('satellite-streets')) return 'satellite-streets';
      if (styleUrl.includes('satellite')) return 'satellite';
      if (styleUrl.includes('light')) return 'light';
      if (styleUrl.includes('navigation')) return 'navigation';
    } catch (error) {
      console.warn('Error detecting current style:', error);
    }
    
    return 'dark'; // Default fallback
  }
}

export default MapManager;
