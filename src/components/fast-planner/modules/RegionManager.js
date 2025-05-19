/**
 * RegionManager.js
 * 
 * Handles region selection, map navigation, and region-specific data loading
 */

import regions from './data/regions';

class RegionManager {
  constructor(mapManager, platformManager) {
    this.mapManager = mapManager;
    this.platformManager = platformManager;
    this.currentRegion = null;
    this.regions = regions;
    this.callbacks = {
      onRegionChanged: null,
      onRegionLoaded: null,
      onError: null
    };
  }
  
  /**
   * Set a callback function
   * @param {string} type - The callback type
   * @param {Function} callback - The callback function
   */
  setCallback(type, callback) {
    if (this.callbacks.hasOwnProperty(type)) {
      this.callbacks[type] = callback;
    }
  }
  
  /**
   * Trigger a callback if it exists
   * @param {string} type - The callback type
   * @param {*} data - The data to pass to the callback
   */
  triggerCallback(type, data) {
    if (this.callbacks[type]) {
      this.callbacks[type](data);
    }
  }
  
  /**
   * Get all available regions
   * @returns {Array} - Array of region objects
   */
  getRegions() {
    return this.regions;
  }
  
  /**
   * Get the current active region
   * @returns {Object|null} - The current region or null if none selected
   */
  getCurrentRegion() {
    return this.currentRegion;
  }
  
  /**
   * Find a region by ID
   * @param {string} id - The region ID to find
   * @returns {Object|null} - The region object or null if not found
   */
  getRegionById(id) {
    return this.regions.find(region => region.id === id) || null;
  }
  
  /**
   * Set the current region and update the map view
   * @param {string} regionId - The ID of the region to switch to
   * @returns {Object|null} - The selected region or null if not found
   */
  setRegion(regionId) {
    const region = this.getRegionById(regionId);
    if (!region) {
      console.error(`Region with ID "${regionId}" not found`);
      this.triggerCallback('onError', `Region "${regionId}" not found`);
      return null;
    }
    
    console.log(`RegionManager: Setting region to ${regionId} (DELEGATING COMPLETELY TO REGIONCONTEXT)`);
    
    // Only store the region and update the flags - no map operations!
    // This is critical to avoid duplicate/competing region change operations
    this.currentRegion = region;
    
    // Clear any static data flags to ensure we load fresh data for the new region
    window.staticDataLoaded = false;
    window.platformsLoaded = false;
    window.aircraftLoaded = false;
    
    // Immediately trigger the callback with the region object - don't use onMapLoaded
    // This prevents the delayed onMapLoaded callback which causes the flickering
    this.triggerCallback('onRegionChanged', region);
    
    // Report region loaded but without any map operations
    this.triggerCallback('onRegionLoaded', {
      region: region,
      platforms: this.platformManager ? this.platformManager.getPlatforms() : []
    });
    
    return region;
  }
  
  /**
   * Alias for setRegion for backward compatibility
   * @param {string} regionId - The ID of the region to switch to
   * @returns {Object|null} - The selected region or null if not found
   */
  setCurrentRegion(regionId) {
    console.log(`RegionManager: Using setCurrentRegion (alias for setRegion) with ${regionId}`);
    return this.setRegion(regionId);
  }
  
  /**
   * Initialize the region manager and set the default region
   * @param {string} defaultRegionId - The ID of the default region to use
   */
  initialize(defaultRegionId = 'gulf-of-mexico') {
    // Wait for the map to be ready
    this.mapManager.onMapLoaded(() => {
      // Set the default region
      this.setRegion(defaultRegionId);
    });
  }
}

export default RegionManager;
