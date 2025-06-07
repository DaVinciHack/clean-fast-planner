/**
 * GulfCoastLayer.js
 * 
 * Displays the Gulf Coast helicopter map as a simple polygon overlay
 */

class GulfCoastLayer {
  constructor(mapManager) {
    this.mapManager = mapManager;
    this.isLoaded = false;
    this.isDisplayed = false;
    this.layerId = 'gulf-coast-heli-overlay';
    this.sourceId = 'gulf-coast-heli-source';
    this._isInitialized = false;
    
    // Coordinates for the overlay (Gulf of Mexico)
    this.bounds = [
      [-98.0, 24.0], // Southwest corner [lng, lat]
      [-83.0, 31.0]  // Northeast corner [lng, lat]
    ];
    
    console.log('GulfCoastLayer initialized');
  }

  /**
   * Initialize layer
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
    console.log('GulfCoastLayer.loadAndDisplay() called');
    
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
      
      // Southwest and Northeast corners [lng, lat]
      const [sw, ne] = this.bounds;
      
      try {
        // Create a polygon data for the Gulf Coast region
        const geojsonData = {
          'type': 'FeatureCollection',
          'features': [{
            'type': 'Feature',
            'properties': {
              'name': 'Gulf Coast Helicopter Map',
              'description': 'Helicopter route map for the Gulf of Mexico'
            },
            'geometry': {
              'type': 'Polygon',
              'coordinates': [[
                [sw[0], ne[1]], // Top left
                [ne[0], ne[1]], // Top right
                [ne[0], sw[1]], // Bottom right
                [sw[0], sw[1]], // Bottom left
                [sw[0], ne[1]]  // Close the polygon
              ]]
            }
          }]
        };
        
        // Add source
        map.addSource(this.sourceId, {
          'type': 'geojson',
          'data': geojsonData
        });
        
        // Add fill layer
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
        
        // Add outline layer
        map.addLayer({
          'id': this.layerId + '-outline',
          'type': 'line',
          'source': this.sourceId,
          'layout': {},
          'paint': {
            'line-color': '#ffffff',
            'line-width': 2,
            'line-dasharray': [2, 2]
          }
        });
        
        // Add label layer
        map.addLayer({
          'id': this.layerId + '-label',
          'type': 'symbol',
          'source': this.sourceId,
          'layout': {
            'text-field': ['get', 'name'],
            'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
            'text-offset': [0, 0],
            'text-anchor': 'center',
            'text-size': 16
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
        return Promise.resolve();
      } catch (innerError) {
        console.error('Error adding polygon:', innerError);
        return Promise.reject(innerError);
      }
    } catch (error) {
      console.error('Failed to load and display Gulf Coast Helicopter Map:', error);
      return Promise.reject(error);
    }
  }

  /**
   * Remove the map layer
   */
  remove() {
    console.log('GulfCoastLayer.remove() called');
    
    try {
      const map = this.mapManager.getMap();
      if (!map) return;
      
      // Remove layers (in reverse order)
      ['label', 'outline', ''].forEach(suffix => {
        const layerId = this.layerId + (suffix ? '-' + suffix : '');
        if (map.getLayer(layerId)) {
          map.removeLayer(layerId);
          console.log(`Removed layer ${layerId}`);
        }
      });
      
      // Remove source
      if (map.getSource(this.sourceId)) {
        map.removeSource(this.sourceId);
        console.log(`Removed source ${this.sourceId}`);
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
    console.log('GulfCoastLayer.toggle() called, current display state:', this.isDisplayed);
    
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

export default GulfCoastLayer;