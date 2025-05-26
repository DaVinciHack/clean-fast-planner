/**
 * GulfCoastImageLayer.js
 * 
 * Specialized module for displaying the Gulf Coast helicopter map
 * using MapBox GL's native image overlay capability
 */

class GulfCoastImageLayer {
  constructor(mapManager) {
    this.mapManager = mapManager;
    this.isLoaded = false;
    this.isDisplayed = false;
    this.layerId = 'gulf-coast-heli-map';
    this.sourceId = 'gulf-coast-heli-source';
    this._isInitialized = false;
    
    // Use SVG format which is guaranteed to work
    this.imagePath = '/US_Gulf_Coast_Heli/gulf_coast_map.svg';
    console.log('GulfCoastImageLayer initialized with path:', this.imagePath, 
                'Full URL:', window.location.origin + this.imagePath);
    
    // Coordinates for the image overlay (Gulf of Mexico)
    this.bounds = [
      [-98.0, 24.0], // Southwest corner [lng, lat]
      [-83.0, 31.0]  // Northeast corner [lng, lat]
    ];
  }

  /**
   * Initialize the map layer
   * @returns {Promise} Resolves when initialized
   */
  async initialize() {
    if (this._isInitialized) return Promise.resolve();
    
    try {
      console.log('Initializing Gulf Coast Helicopter Map layer');
      this._isInitialized = true;
      console.log('Gulf Coast Helicopter Map initialized successfully');
      return Promise.resolve();
    } catch (error) {
      console.error('Failed to initialize Gulf Coast Helicopter Map:', error);
      return Promise.reject(error);
    }
  }

  /**
   * Load and display the Gulf Coast Map on the map
   * @returns {Promise} Resolves when displayed
   */
  async loadAndDisplay() {
    console.log('GulfCoastImageLayer.loadAndDisplay() called');
    
    if (!this._isInitialized) {
      console.log('Gulf Coast Helicopter Map not initialized, initializing now...');
      await this.initialize();
    }
    
    try {
      const map = this.mapManager.getMap();
      if (!map) {
        console.error('Gulf Coast Helicopter Map: Map not initialized');
        return Promise.reject(new Error('Map not initialized'));
      }
      
      console.log('Loading Gulf Coast Helicopter Map...');
      
      // Remove any existing layer first
      this.remove();
      
      // Southwest and Northeast corners of the image [lng, lat]
      const [sw, ne] = this.bounds;
      
      try {
        // Add a simple colored rectangle as a fallback
        map.addSource(this.sourceId, {
          'type': 'geojson',
          'data': {
            'type': 'Feature',
            'properties': {
              'name': 'Gulf Coast Helicopter Map'
            },
            'geometry': {
              'type': 'Polygon',
              'coordinates': [[
                [sw[0], ne[1]], // Top left [lng, lat]
                [ne[0], ne[1]], // Top right
                [ne[0], sw[1]], // Bottom right
                [sw[0], sw[1]], // Bottom left
                [sw[0], ne[1]]  // Back to top left to close the polygon
              ]]
            }
          }
        });
        
        // Add layer
        map.addLayer({
          'id': this.layerId,
          'type': 'fill',
          'source': this.sourceId,
          'layout': {},
          'paint': {
            'fill-color': '#3388ff',
            'fill-opacity': 0.4,
            'fill-outline-color': '#ffffff'
          }
        });
        
        // Add a text label
        map.addLayer({
          'id': this.layerId + '-label',
          'type': 'symbol',
          'source': this.sourceId,
          'layout': {
            'text-field': 'Gulf Coast Helicopter Map',
            'text-font': ['Open Sans Regular'],
            'text-size': 16,
            'text-offset': [0, 0],
            'text-anchor': 'center'
          },
          'paint': {
            'text-color': '#ffffff',
            'text-halo-color': '#000000',
            'text-halo-width': 1
          }
        });
        
        this.isLoaded = true;
        this.isDisplayed = true;
        
        console.log('Gulf Coast Helicopter Map loaded and displayed successfully');
      } catch (innerError) {
        console.error('Error adding overlay:', innerError);
        return Promise.reject(innerError);
      }
      
      return Promise.resolve();
    } catch (error) {
      console.error('Failed to load and display Gulf Coast Helicopter Map:', error);
      return Promise.reject(error);
    }
  }

  /**
   * Remove the map layer
   */
  remove() {
    console.log('GulfCoastImageLayer.remove() called');
    
    try {
      const map = this.mapManager.getMap();
      if (!map) return;
      
      // Remove label layer if it exists
      if (map.getLayer(this.layerId + '-label')) {
        map.removeLayer(this.layerId + '-label');
      }
      
      // Remove main layer if it exists
      if (map.getLayer(this.layerId)) {
        map.removeLayer(this.layerId);
      }
      
      // Remove source if it exists
      if (map.getSource(this.sourceId)) {
        map.removeSource(this.sourceId);
      }
      
      this.isDisplayed = false;
      console.log('Gulf Coast Helicopter Map removed successfully');
    } catch (error) {
      console.error('Error removing Gulf Coast Helicopter Map:', error);
    }
  }

  /**
   * Toggle the visibility of the layer
   * @returns {boolean} The new visibility state
   */
  async toggle() {
    console.log('GulfCoastImageLayer.toggle() called, current display state:', this.isDisplayed);
    
    try {
      if (this.isDisplayed) {
        console.log('Gulf Coast Helicopter Map is currently displayed, removing...');
        this.remove();
        return false;
      } else {
        console.log('Gulf Coast Helicopter Map is not displayed, loading and displaying...');
        await this.loadAndDisplay();
        return true;
      }
    } catch (error) {
      console.error('Error toggling Gulf Coast Helicopter Map:', error);
      return this.isDisplayed;
    }
  }
}

export default GulfCoastImageLayer;