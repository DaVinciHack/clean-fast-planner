/**
 * CleanMapManager.js - Proper map layer management without patches
 * 
 * This is a replacement for the messy fix-based approach.
 * Main improvements:
 * - Proper layer existence checking before adding
 * - Consistent layer removal patterns
 * - Source management with proper error handling
 * - Clear layer naming conventions to avoid conflicts
 */

// Create a single, robust map layer management utility
const MapLayerManager = {
  // Store active layers and sources
  activeLayers: new Set(),
  activeSources: new Set(),
  
  /**
   * Safely check if a layer exists
   * @param {Object} map - The MapLibre map instance
   * @param {string} id - Layer ID to check
   * @returns {boolean} - Whether the layer exists
   */
  layerExists(map, id) {
    if (!map) return false;
    try {
      return !!map.getLayer(id);
    } catch (e) {
      console.warn(`Error checking if layer exists: ${id}`, e);
      return false;
    }
  },
  
  /**
   * Safely check if a source exists
   * @param {Object} map - The MapLibre map instance
   * @param {string} id - Source ID to check
   * @returns {boolean} - Whether the source exists
   */
  sourceExists(map, id) {
    if (!map) return false;
    try {
      return !!map.getSource(id);
    } catch (e) {
      console.warn(`Error checking if source exists: ${id}`, e);
      return false;
    }
  },
  
  /**
   * Safely remove a layer
   * @param {Object} map - The MapLibre map instance
   * @param {string} id - Layer ID to remove
   * @returns {boolean} - Whether the removal was successful
   */
  removeLayer(map, id) {
    if (!map) return false;
    if (!this.layerExists(map, id)) return true; // Already gone
    
    try {
      map.removeLayer(id);
      this.activeLayers.delete(id);
      return true;
    } catch (e) {
      console.warn(`Error removing layer: ${id}`, e);
      return false;
    }
  },
  
  /**
   * Safely remove a source
   * @param {Object} map - The MapLibre map instance
   * @param {string} id - Source ID to remove
   * @returns {Promise<boolean>} - Whether the removal was successful
   */
  async removeSource(map, id) {
    if (!map) return false;
    if (!this.sourceExists(map, id)) return true; // Already gone
    
    // Wait to ensure no layers are using this source
    return new Promise(resolve => {
      setTimeout(() => {
        try {
          map.removeSource(id);
          this.activeSources.delete(id);
          resolve(true);
        } catch (e) {
          console.warn(`Error removing source: ${id}`, e);
          resolve(false);
        }
      }, 100);
    });
  },
  
  /**
   * Safely add a layer with duplicate check
   * @param {Object} map - The MapLibre map instance
   * @param {Object} layerConfig - The layer configuration
   * @returns {boolean} - Whether the layer was added successfully
   */
  addLayer(map, layerConfig) {
    if (!map) return false;
    
    const id = layerConfig.id;
    
    // Check if layer already exists
    if (this.layerExists(map, id)) {
      console.log(`Layer already exists: ${id}, updating instead of adding`);
      
      // Update layer visibility if specified
      if (layerConfig.layout && layerConfig.layout.visibility) {
        try {
          map.setLayoutProperty(id, 'visibility', layerConfig.layout.visibility);
        } catch (e) {
          console.warn(`Error updating layer visibility: ${id}`, e);
        }
      }
      
      return true;
    }
    
    // Add new layer
    try {
      map.addLayer(layerConfig);
      this.activeLayers.add(id);
      return true;
    } catch (e) {
      console.warn(`Error adding layer: ${id}`, e);
      
      // If we get an "already exists" error, try to update properties
      if (e.message && e.message.includes('already exists')) {
        if (layerConfig.layout && layerConfig.layout.visibility) {
          try {
            map.setLayoutProperty(id, 'visibility', layerConfig.layout.visibility);
            return true;
          } catch (e2) {
            console.warn(`Error updating layer after 'already exists': ${id}`, e2);
          }
        }
      }
      
      return false;
    }
  },
  
  /**
   * Safely add a source with duplicate check
   * @param {Object} map - The MapLibre map instance
   * @param {string} id - The source ID
   * @param {Object} sourceConfig - The source configuration
   * @returns {boolean} - Whether the source was added/updated successfully
   */
  addSource(map, id, sourceConfig) {
    if (!map) return false;
    
    // Check if source already exists
    if (this.sourceExists(map, id)) {
      console.log(`Source already exists: ${id}, updating data instead of adding`);
      
      try {
        const source = map.getSource(id);
        if (source && typeof source.setData === 'function' && sourceConfig.data) {
          source.setData(sourceConfig.data);
        }
        return true;
      } catch (e) {
        console.warn(`Error updating source data: ${id}`, e);
        return false;
      }
    }
    
    // Add new source
    try {
      map.addSource(id, sourceConfig);
      this.activeSources.add(id);
      return true;
    } catch (e) {
      console.warn(`Error adding source: ${id}`, e);
      
      // If we get an "already exists" error, try to update data
      if (e.message && e.message.includes('already exists')) {
        try {
          const source = map.getSource(id);
          if (source && typeof source.setData === 'function' && sourceConfig.data) {
            source.setData(sourceConfig.data);
            return true;
          }
        } catch (e2) {
          console.warn(`Error updating source after 'already exists': ${id}`, e2);
        }
      }
      
      return false;
    }
  },
  
  /**
   * Set visibility for a layer
   * @param {Object} map - The MapLibre map instance
   * @param {string} id - Layer ID to update
   * @param {boolean} visible - Whether to show or hide the layer
   */
  setLayerVisibility(map, id, visible) {
    if (!map) return;
    
    if (!this.layerExists(map, id)) {
      console.warn(`Cannot set visibility, layer does not exist: ${id}`);
      return;
    }
    
    try {
      map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none');
    } catch (e) {
      console.warn(`Error setting layer visibility: ${id}`, e);
    }
  },
  
  /**
   * Clear all layers and sources
   * @param {Object} map - The MapLibre map instance
   * @param {RegExp} pattern - Optional pattern to match layer/source IDs
   */
  async clearAll(map, pattern = null) {
    if (!map) return;
    
    // Remove all matching layers first
    const layersToRemove = pattern 
      ? Array.from(this.activeLayers).filter(id => pattern.test(id))
      : Array.from(this.activeLayers);
      
    for (const id of layersToRemove) {
      this.removeLayer(map, id);
    }
    
    // Short delay to ensure all layers are removed
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Then remove all matching sources
    const sourcesToRemove = pattern 
      ? Array.from(this.activeSources).filter(id => pattern.test(id))
      : Array.from(this.activeSources);
      
    for (const id of sourcesToRemove) {
      await this.removeSource(map, id);
    }
  }
};

// Export the utility
window.MapLayerManager = MapLayerManager;
