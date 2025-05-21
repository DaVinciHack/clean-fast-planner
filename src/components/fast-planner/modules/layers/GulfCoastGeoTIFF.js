/**
 * GulfCoastGeoTIFF.js
 * 
 * Specialized module for loading and displaying the Gulf Coast helicopter map
 * Compatible with MapBox GL using raster image overlay
 */

// Create a unique class name to avoid namespace conflicts
class GulfCoastImageOverlay {
  constructor(mapManager) {
    this.mapManager = mapManager;
    this.isLoaded = false;
    this.isDisplayed = false;
    this.layerId = 'gulf-coast-heli-map';
    this.sourceId = 'gulf-coast-heli-source';
    this._isInitialized = false;
    
    // Path to an image file that we can display with MapBox GL
    // Use PNG format which is more universally supported by browsers
    this.imagePath = '/US_Gulf_Coast_Heli/gulf_coast_heli_map.png';
    console.log('GulfCoastImageOverlay initialized with path:', this.imagePath);
    
    // Coordinates for the image overlay (Gulf of Mexico)
    // These are the approximate bounds of the Gulf Coast Helicopter Map
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
      console.log('Gulf Coast Helicopter Map module initialized successfully');
      return Promise.resolve();
    } catch (error) {
      console.error('Failed to initialize Gulf Coast Helicopter Map module:', error);
      return Promise.reject(error);
    }
  }

  /**
   * Load and display the Gulf Coast Map on the map
   * @returns {Promise} Resolves when displayed
   */
  async loadAndDisplay() {
    console.log('GulfCoastImageOverlay.loadAndDisplay() called');
    
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
        // Add source
        map.addSource(this.sourceId, {
          'type': 'image',
          'url': this.imagePath,
          'coordinates': [
            [sw[0], ne[1]], // Top left [lng, lat]
            [ne[0], ne[1]], // Top right
            [ne[0], sw[1]], // Bottom right
            [sw[0], sw[1]]  // Bottom left
          ]
        });
        
        // Add layer
        map.addLayer({
          'id': this.layerId,
          'type': 'raster',
          'source': this.sourceId,
          'paint': {
            'raster-opacity': 0.7,
            'raster-fade-duration': 0
          }
        });
        
        this.isLoaded = true;
        this.isDisplayed = true;
        
        console.log('Gulf Coast Helicopter Map loaded and displayed successfully');
      } catch (innerError) {
        console.error('Error adding image overlay:', innerError);
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
    console.log('GulfCoastImageOverlay.remove() called');
    
    try {
      const map = this.mapManager.getMap();
      if (!map) return;
      
      // Remove layer if it exists
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
    console.log('GulfCoastImageOverlay.toggle() called, current display state:', this.isDisplayed);
    
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

// Export the class with a different name to avoid conflicts
export default GulfCoastImageOverlay;

export default GulfCoastGeoTIFF;
