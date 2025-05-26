/**
 * MapLayerManager.js
 * 
 * A clean, centralized solution for managing map layers and sources
 * to prevent "layer already exists" errors
 */

class MapLayerManager {
  constructor(map) {
    this.map = map;
  }

  /**
   * Safely remove layers and then their source
   * @param {string} sourceId - The source ID to remove
   * @param {Array<string>} layerIds - Array of layer IDs using this source
   * @returns {Promise<boolean>} - Resolves to true if successful
   */
  async safeRemoveLayersAndSource(sourceId, layerIds) {
    if (!this.map) return false;
    
    // First remove all layers
    for (const layerId of layerIds) {
      if (this.map.getLayer(layerId)) {
        try {
          this.map.removeLayer(layerId);
        } catch (e) {
          console.warn(`Error removing layer ${layerId}:`, e);
        }
      }
    }
    
    // Wait for layers to be fully removed
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Then remove the source
    if (this.map.getSource(sourceId)) {
      try {
        this.map.removeSource(sourceId);
        return true;
      } catch (e) {
        console.warn(`Error removing source ${sourceId}:`, e);
        return false;
      }
    }
    
    return true;
  }

  /**
   * Safely add a source only if it doesn't exist
   * @param {string} sourceId - The source ID
   * @param {Object} sourceConfig - The source configuration
   * @returns {boolean} - True if source was added or updated
   */
  safeAddSource(sourceId, sourceConfig) {
    if (!this.map) return false;
    
    try {
      if (this.map.getSource(sourceId)) {
        // Source exists, try to update it
        const source = this.map.getSource(sourceId);
        if (source && sourceConfig.data && typeof source.setData === 'function') {
          source.setData(sourceConfig.data);
          return true;
        }
        
        // If we can't update, we need to remove it first
        this.safeRemoveLayersAndSource(sourceId, []);
        this.map.addSource(sourceId, sourceConfig);
        return true;
      } else {
        // Source doesn't exist, add it
        this.map.addSource(sourceId, sourceConfig);
        return true;
      }
    } catch (e) {
      console.warn(`Error adding/updating source ${sourceId}:`, e);
      return false;
    }
  }

  /**
   * Safely add a layer only if it doesn't exist
   * @param {string} layerId - The layer ID
   * @param {Object} layerConfig - The layer configuration
   * @returns {boolean} - True if layer was added or updated
   */
  safeAddLayer(layerId, layerConfig) {
    if (!this.map) return false;
    
    try {
      if (this.map.getLayer(layerId)) {
        // Layer exists, update properties that can be updated
        if (layerConfig.layout && layerConfig.layout.visibility) {
          this.map.setLayoutProperty(layerId, 'visibility', layerConfig.layout.visibility);
        }
        
        return true;
      } else {
        // Layer doesn't exist, add it
        this.map.addLayer(layerConfig);
        return true;
      }
    } catch (e) {
      console.warn(`Error adding/updating layer ${layerId}:`, e);
      return false;
    }
  }
  
  /**
   * Set visibility of multiple layers
   * @param {Array<string>} layerIds - Layer IDs to update
   * @param {string} visibility - 'visible' or 'none'
   */
  setLayersVisibility(layerIds, visibility) {
    if (!this.map) return;
    
    for (const layerId of layerIds) {
      if (this.map.getLayer(layerId)) {
        try {
          this.map.setLayoutProperty(layerId, 'visibility', visibility);
        } catch (e) {
          console.warn(`Error setting visibility for ${layerId}:`, e);
        }
      }
    }
  }
}

// Export the class
export default MapLayerManager;