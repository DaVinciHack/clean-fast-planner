/**
 * GeoTIFFManager.js
 * 
 * Handles loading and displaying GeoTIFF files on the map
 */

class GeoTIFFManager {
  constructor(mapManager) {
    this.mapManager = mapManager;
    this.geoTiffLayers = {};
    this.isInitialized = false;
  }

  /**
   * Initialize the GeoTIFF Manager
   * @returns {Promise} Resolves when initialized
   */
  async initialize() {
    if (this.isInitialized) return Promise.resolve();

    try {
      // Load the required libraries if not already loaded
      await this.loadLibraries();
      this.isInitialized = true;
      console.log('GeoTIFF Manager initialized successfully');
      return Promise.resolve();
    } catch (error) {
      console.error('Failed to initialize GeoTIFF Manager:', error);
      return Promise.reject(error);
    }
  }

  /**
   * Load required libraries for GeoTIFF processing
   * @returns {Promise} Resolves when libraries are loaded
   */
  loadLibraries() {
    return new Promise((resolve, reject) => {
      try {
        // Check if libraries are already loaded
        if (window.geotiff && window.georaster && window.georasterLayer) {
          console.log('GeoTIFF libraries already loaded');
          resolve();
          return;
        }

        // Load GeoTIFF.js
        const geotiffScript = document.createElement('script');
        geotiffScript.src = 'https://cdn.jsdelivr.net/npm/geotiff@2.0.7/dist/geotiff.bundle.min.js';
        geotiffScript.async = true;
        document.body.appendChild(geotiffScript);

        // Load georaster
        const georasterScript = document.createElement('script');
        georasterScript.src = 'https://cdn.jsdelivr.net/npm/georaster@1.5.6/dist/georaster.browser.bundle.min.js';
        georasterScript.async = true;
        document.body.appendChild(georasterScript);

        // Load georaster-layer-for-mapbox-gl
        const georasterLayerScript = document.createElement('script');
        georasterLayerScript.src = 'https://cdn.jsdelivr.net/npm/georaster-layer-for-mapbox-gl@0.15.0/dist/georaster-layer-for-mapbox-gl.min.js';
        georasterLayerScript.async = true;
        document.body.appendChild(georasterLayerScript);

        // Check if libraries are loaded
        const checkScriptsLoaded = setInterval(() => {
          if (window.geotiff && window.georaster && window.georasterLayer) {
            clearInterval(checkScriptsLoaded);
            console.log('GeoTIFF libraries loaded successfully');
            resolve();
          }
        }, 100);

        // Set a timeout to avoid infinite waiting
        setTimeout(() => {
          if (!window.geotiff || !window.georaster || !window.georasterLayer) {
            clearInterval(checkScriptsLoaded);
            reject(new Error('Timeout loading GeoTIFF libraries'));
          }
        }, 10000);
      } catch (error) {
        console.error('Error loading GeoTIFF libraries:', error);
        reject(error);
      }
    });
  }

  /**
   * Load a GeoTIFF file from a URL
   * @param {string} regionId - The region ID this GeoTIFF is for
   * @param {string} url - URL to the GeoTIFF file
   * @param {Object} options - Display options
   * @returns {Promise} Resolves when the GeoTIFF is loaded
   */
  async loadGeoTIFF(regionId, url, options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log(`Loading GeoTIFF for region ${regionId} from ${url}`);
      
      // Fetch the GeoTIFF file
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch GeoTIFF file: ${response.statusText}`);
      }
      
      // Convert to array buffer
      const arrayBuffer = await response.arrayBuffer();
      
      // Parse the GeoTIFF
      const tiff = await window.GeoTIFF.fromArrayBuffer(arrayBuffer);
      const image = await tiff.getImage();
      
      // Get the raster data
      const geoTiffData = await image.readRasters();
      
      // Create a georaster object
      const georaster = await window.georaster.fromArrayBuffer(arrayBuffer);
      
      // Store the data for later use
      this.geoTiffLayers[regionId] = {
        url,
        georaster,
        options,
        isDisplayed: false
      };
      
      console.log(`GeoTIFF for region ${regionId} loaded successfully`);
      return georaster;
    } catch (error) {
      console.error(`Failed to load GeoTIFF for region ${regionId}:`, error);
      throw error;
    }
  }

  /**
   * Display a loaded GeoTIFF on the map
   * @param {string} regionId - The region ID
   * @param {Object} displayOptions - Options for displaying the GeoTIFF
   * @returns {boolean} Success status
   */
  displayGeoTIFF(regionId, displayOptions = {}) {
    try {
      const map = this.mapManager.getMap();
      if (!map) {
        console.warn('Cannot display GeoTIFF: Map not initialized');
        return false;
      }
      
      const layerData = this.geoTiffLayers[regionId];
      if (!layerData || !layerData.georaster) {
        console.warn(`GeoTIFF data for region ${regionId} not loaded`);
        return false;
      }
      
      // If already displayed, remove it first
      this.removeGeoTIFF(regionId);
      
      // Create a unique layer ID
      const layerId = `geotiff-${regionId}`;
      
      // Merge default options with provided options
      const options = {
        opacity: 0.7,
        resolution: 256,
        zIndex: 1, // Above the base map, below other layers
        ...displayOptions,
        ...layerData.options
      };
      
      // Create and add the layer
      const georasterLayer = new window.georasterLayer({
        georaster: layerData.georaster,
        opacity: options.opacity,
        resolution: options.resolution
      });
      
      // Add the layer to the map
      map.addLayer(georasterLayer, 'grid-labels'); // Add before grid labels so they're still visible
      
      // Update the layer data
      this.geoTiffLayers[regionId].isDisplayed = true;
      this.geoTiffLayers[regionId].layer = georasterLayer;
      this.geoTiffLayers[regionId].layerId = layerId;
      
      console.log(`GeoTIFF layer for region ${regionId} displayed successfully`);
      return true;
    } catch (error) {
      console.error(`Error displaying GeoTIFF for region ${regionId}:`, error);
      return false;
    }
  }

  /**
   * Remove a GeoTIFF layer from the map
   * @param {string} regionId - The region ID
   * @returns {boolean} Success status
   */
  removeGeoTIFF(regionId) {
    try {
      const map = this.mapManager.getMap();
      if (!map) {
        console.warn('Cannot remove GeoTIFF: Map not initialized');
        return false;
      }
      
      const layerData = this.geoTiffLayers[regionId];
      if (!layerData || !layerData.isDisplayed) {
        // Not displayed, nothing to do
        return true;
      }
      
      // Remove the layer
      if (layerData.layer) {
        map.removeLayer(layerData.layer);
      }
      
      // Update the layer data
      this.geoTiffLayers[regionId].isDisplayed = false;
      this.geoTiffLayers[regionId].layer = null;
      
      console.log(`GeoTIFF layer for region ${regionId} removed successfully`);
      return true;
    } catch (error) {
      console.error(`Error removing GeoTIFF for region ${regionId}:`, error);
      return false;
    }
  }

  /**
   * Update GeoTIFF display based on the current region
   * @param {string} regionId - The region ID
   */
  updateForRegion(regionId) {
    try {
      // Hide all GeoTIFF layers first
      Object.keys(this.geoTiffLayers).forEach(id => {
        if (id !== regionId && this.geoTiffLayers[id].isDisplayed) {
          this.removeGeoTIFF(id);
        }
      });
      
      // If we have a GeoTIFF for this region, display it
      if (this.geoTiffLayers[regionId]) {
        this.displayGeoTIFF(regionId);
      }
    } catch (error) {
      console.error(`Error updating GeoTIFF display for region ${regionId}:`, error);
    }
  }
}

export default GeoTIFFManager;
