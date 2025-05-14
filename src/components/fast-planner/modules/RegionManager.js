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
    
    console.log(`RegionManager: Setting region to ${regionId}`, region);
    
    // Clear any static data flags to ensure we load fresh data for the new region
    window.staticDataLoaded = false;
    window.platformsLoaded = false;
    window.aircraftLoaded = false;
    console.log('Cleared data flags for new region');
    
    // Store the current region
    this.currentRegion = region;
    
    // Get the map instance
    const map = this.mapManager.getMap();
    if (!map) {
      console.error('Cannot set region: Map is not initialized');
      this.triggerCallback('onError', 'Map is not initialized');
      return null;
    }
    
    // Use onMapLoaded to ensure the map is ready for operations
    this.mapManager.onMapLoaded(() => {
      try {
        // Fly to the region
        map.fitBounds(region.bounds, {
          padding: 50,
          maxZoom: region.zoom || 6
        });
        
        // Trigger the region changed callback
        this.triggerCallback('onRegionChanged', region);
        
        // If platform manager is available, load region-specific platforms
        if (this.platformManager) {
          console.log(`Loading platforms for region: ${region.name}`);
          // The loadPlatformsFromFoundry method will need to be modified to accept region info
          this.platformManager.loadPlatformsFromFoundry(null, region.osdkRegion)
            .then(platforms => {
              console.log(`Loaded ${platforms?.length || 0} platforms for ${region.name}`);
              this.triggerCallback('onRegionLoaded', {
                region: region,
                platforms: platforms
              });
            })
            .catch(error => {
              console.error(`Error loading platforms for region ${region.name}:`, error);
              this.triggerCallback('onError', `Failed to load platforms for ${region.name}: ${error.message}`);
            });
        } else {
          console.log(`No platform manager available for region: ${region.name}`);
          // Still trigger the region loaded callback
          this.triggerCallback('onRegionLoaded', {
            region: region,
            platforms: []
          });
        }
      } catch (error) {
        console.error(`Error setting region ${region.name}:`, error);
        this.triggerCallback('onError', `Failed to set region ${region.name}: ${error.message}`);
      }
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
