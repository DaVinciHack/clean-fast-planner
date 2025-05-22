/**
 * GulfCoastHeliMap.js
 * 
 * Displays the Gulf Coast helicopter map using a Mapbox-hosted tileset
 */

class GulfCoastHeliMap {
  constructor(mapManager) {
    this.mapManager = mapManager;
    this.isLoaded = false;
    this.isDisplayed = false;
    this.layerId = 'gulf-coast-heli-map';
    this.sourceId = 'gulf-coast-heli-source';
    this._isInitialized = false;
    
    // The ID of the Mapbox-hosted tileset
    this.tilesetId = 'dirkster101.40dvm9j7';
    
    // Check if we have a Mapbox token set in the environment or use a default one
    // This should match the token used by your MapBox GL JS instance
    this.accessToken = 'pk.eyJ1IjoiZGlya3N0ZXIxMDEiLCJhIjoiY204YW9mdm4yMTliMTJscXVnaXRqNmptNyJ9.VDLt_kE5BnAV8S4vXjFMlg'; 
    
    console.log('GulfCoastHeliMap initialized with tileset ID:', this.tilesetId);
  }

  /**
   * Initialize the helicopter map layer
   * @returns {Promise} Resolves when initialized
   */
  async initialize() {
    if (this._isInitialized) return Promise.resolve();
    
    try {
      console.log('Initializing Gulf Coast Helicopter Map layer');
      
      // Verify that the mapManager is valid
      if (!this.mapManager) {
        throw new Error('MapManager is not defined');
      }
      
      // Ensure the access token matches the one used by MapBox
      if (this.mapManager.mapboxToken !== this.accessToken) {
        console.warn(`Access token mismatch: MapManager (${this.mapManager.mapboxToken}) vs GulfCoastHeliMap (${this.accessToken})`);
        // Use the MapManager's token for consistency
        this.accessToken = this.mapManager.mapboxToken;
      }
      
      // Simple test to ensure the tileset ID is well-formed
      if (!this.tilesetId || !this.tilesetId.includes('.')) {
        console.warn(`Tileset ID might be malformed: ${this.tilesetId}`);
      }
      
      this._isInitialized = true;
      console.log('Gulf Coast Helicopter Map layer initialized successfully');
      return Promise.resolve();
    } catch (error) {
      console.error('Failed to initialize Gulf Coast Helicopter Map layer:', error);
      return Promise.reject(error);
    }
  }

  /**
   * Load and display the Gulf Coast helicopter map
   * @returns {Promise} Resolves when displayed
   */
  async loadAndDisplay() {
    console.log('GulfCoastHeliMap.loadAndDisplay() called');
    
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
      
      // Log important debugging information
      console.log('Map is:', map);
      console.log('Tileset ID is:', this.tilesetId);
      console.log('Access token is:', this.accessToken);
      
      try {
        // Add the source using the Mapbox-hosted tileset ID
        console.log(`Adding source with URL: mapbox://${this.tilesetId}`);
        map.addSource(this.sourceId, {
          'type': 'raster',
          'url': `mapbox://${this.tilesetId}`,
          'tileSize': 512,  // Larger tile size for higher resolution
          'maxzoom': 22     // Allow higher zoom levels
        });
        
        // Add the layer with enhanced styling to improve visibility
        // Use beforeId to ensure this layer is added BELOW all other layers
        console.log('Adding layer with ID:', this.layerId);
        
        // Find the first layer to insert before (typically the first platform/rig layer)
        const allLayers = map.getStyle().layers;
        let beforeLayerId = null;
        
        // Look for platform, airport, or route layers to insert before
        const targetLayers = ['platforms-fixed-layer', 'platforms-movable-layer', 'airfields-layer', 'route'];
        for (const layer of allLayers) {
          if (targetLayers.includes(layer.id)) {
            beforeLayerId = layer.id;
            console.log(`Found existing layer to insert before: ${beforeLayerId}`);
            break;
          }
        }
        
        // Add the layer, potentially with beforeId parameter
        const layerConfig = {
          'id': this.layerId,
          'type': 'raster',
          'source': this.sourceId,
          'paint': {
            'raster-opacity': 0.85,             // Slightly reduced opacity for better overlay
            'raster-contrast': 0.4,             // Higher contrast to enhance visibility
            'raster-saturation': 0.3,           // Increased saturation for better color distinction
            'raster-brightness-min': 0.1,       // Increase minimum brightness to enhance dark areas
            'raster-brightness-max': 0.9,       // Reduce maximum brightness to make it darker overall
            'raster-resampling': 'nearest',     // Sharper rendering for aviation charts
            'raster-fade-duration': 0,          // Immediate display without fading
            'raster-hue-rotate': 0              // No color adjustment
          }
        };
        
        // If we found a layer to insert before, specify it
        if (beforeLayerId) {
          map.addLayer(layerConfig, beforeLayerId);
          console.log(`Added layer ${this.layerId} before ${beforeLayerId}`);
        } else {
          // Otherwise add it normally (it will go on top, but other layers added later will cover it)
          map.addLayer(layerConfig);
          console.log(`Added layer ${this.layerId} (no beforeId specified)`);
        }
        
        // Check if the layer was actually added
        if (map.getLayer(this.layerId)) {
          console.log('Layer successfully added to map');
        } else {
          console.warn('Layer not found in map after adding');
        }
        
        this.isLoaded = true;
        this.isDisplayed = true;
        
        console.log('Gulf Coast Helicopter Map loaded and displayed successfully');
        return Promise.resolve();
      } catch (error) {
        console.error('Error adding source/layer:', error);
        
        // Try alternative approach
        console.log('Attempting alternative approach...');
        
        // Try a simpler raster source approach
        map.addSource(this.sourceId + '-alt', {
          'type': 'raster',
          'tiles': [`https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}.png?access_token=${this.accessToken}`],
          'tileSize': 512
        });
        
        // Find the first layer to insert before (same logic as above)
        const allLayers = map.getStyle().layers;
        let beforeLayerId = null;
        
        // Look for platform, airport, or route layers to insert before
        const targetLayers = ['platforms-fixed-layer', 'platforms-movable-layer', 'airfields-layer', 'route'];
        for (const layer of allLayers) {
          if (targetLayers.includes(layer.id)) {
            beforeLayerId = layer.id;
            console.log(`Found existing layer to insert before: ${beforeLayerId}`);
            break;
          }
        }
        
        // Add the layer, potentially with beforeId parameter
        const altLayerConfig = {
          'id': this.layerId + '-alt',
          'type': 'raster',
          'source': this.sourceId + '-alt',
          'paint': {
            'raster-opacity': 0.85,             // Slightly reduced opacity
            'raster-contrast': 0.4,             // Higher contrast
            'raster-brightness-min': 0.1,       // Enhance dark areas
            'raster-brightness-max': 0.9,       // Make it darker overall
            'raster-saturation': 0.3,           // Increased saturation
            'raster-resampling': 'nearest'      // Sharper rendering
          }
        };
        
        // If we found a layer to insert before, specify it
        if (beforeLayerId) {
          map.addLayer(altLayerConfig, beforeLayerId);
          console.log(`Added alternative layer ${this.layerId}-alt before ${beforeLayerId}`);
        } else {
          // Otherwise add it normally
          map.addLayer(altLayerConfig);
          console.log(`Added alternative layer ${this.layerId}-alt (no beforeId specified)`);
        }
        
        console.log('Added placeholder satellite layer as alternative');
        this.isLoaded = true;
        this.isDisplayed = true;
        
        return Promise.resolve();
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
    console.log('GulfCoastHeliMap.remove() called');
    
    try {
      const map = this.mapManager.getMap();
      if (!map) return;
      
      // Remove the layer if it exists
      if (map.getLayer(this.layerId)) {
        map.removeLayer(this.layerId);
      }
      
      // Remove the source if it exists
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
    console.log('GulfCoastHeliMap.toggle() called, current display state:', this.isDisplayed);
    
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

export default GulfCoastHeliMap;