/**
 * LayerPersistenceManager.js - DISABLED
 * 
 * This system has been disabled due to race conditions with PlatformManager.
 * Layer restoration is now handled by PlatformManager.restoreWeatherFeatures()
 * following clean single-responsibility architecture.
 */

class LayerPersistenceManager {
  constructor() {
    console.log('🔧 LayerPersistenceManager: DISABLED - Using PlatformManager.restoreWeatherFeatures() instead');
    this.isInitialized = false;
    this.isDisabled = true;
  }

  initialize() {
    console.log('🔧 LayerPersistenceManager: Initialization skipped - system disabled');
    return;
  }

  getLayerStatus() {
    return {
      disabled: true,
      message: 'LayerPersistenceManager disabled - using PlatformManager.restoreWeatherFeatures()'
    };
  }

  manualRestore() {
    console.log('🔧 LayerPersistenceManager: Manual restore disabled - use PlatformManager instead');
    return;
  }

  destroy() {
    console.log('🔧 LayerPersistenceManager: Already disabled');
  }
}

// Create disabled instance (for compatibility)
const layerPersistenceManager = new LayerPersistenceManager();

// Global access for debugging (disabled state)
window.layerPersistenceManager = layerPersistenceManager;

// Global functions for debugging (disabled)
window.getLayerStatus = () => layerPersistenceManager.getLayerStatus();
window.manualLayerRestore = () => layerPersistenceManager.manualRestore();

export default layerPersistenceManager;
