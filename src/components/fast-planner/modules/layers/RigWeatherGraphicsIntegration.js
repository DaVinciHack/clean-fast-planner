/**
 * RigWeatherGraphicsIntegration.js
 * 
 * Integration example showing how to use the RigWeatherGraphics system
 * with the existing weather overlay and map layers
 */

import RigWeatherGraphics from './RigWeatherGraphics.js';

/**
 * Integration utility to connect rig weather graphics with existing systems
 */
class RigWeatherGraphicsIntegration {
  constructor(mapManagerRef) {
    this.mapManager = mapManagerRef;
    this.rigWeatherGraphics = null;
    this.isActive = false;
    
    console.log('🔌 RigWeatherGraphicsIntegration initialized');
  }

  /**
   * Initialize the rig weather graphics system
   */
  initialize() {
    if (!this.mapManager?.current?.map) {
      console.warn('⚠️ Map manager not available for rig weather graphics');
      return false;
    }

    try {
      this.rigWeatherGraphics = new RigWeatherGraphics(this.mapManager.current.map);
      console.log('✅ Rig weather graphics system initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize rig weather graphics:', error);
      return false;
    }
  }

  /**
   * Add rig weather graphics using aviation weather data
   * @param {Array} platformLocations - Platform data with coordinates
   * @param {Object} weatherDataMap - Map of rigName -> aviation weather data
   */
  displayRigWeatherGraphics(platformLocations, weatherDataMap) {
    if (!this.rigWeatherGraphics) {
      console.warn('⚠️ Rig weather graphics not initialized');
      return;
    }

    // Convert platform data to rig weather format
    const rigWeatherData = this.convertToRigWeatherData(platformLocations, weatherDataMap);
    
    if (rigWeatherData.length === 0) {
      console.warn('⚠️ No valid rig weather data to display');
      return;
    }

    // Display the graphics
    this.rigWeatherGraphics.addRigWeatherGraphics(rigWeatherData);
    this.isActive = true;
    
    console.log(`🎯 Displayed weather graphics for ${rigWeatherData.length} rigs`);
  }

  /**
   * Convert platform locations and weather data to the format expected by RigWeatherGraphics
   * @private
   */
  convertToRigWeatherData(platformLocations, weatherDataMap) {
    const rigWeatherData = [];

    platformLocations.forEach(platform => {
      const weather = weatherDataMap[platform.name];
      
      if (!weather || !platform.lat || !platform.lon) {
        console.warn(`⚠️ Missing weather data or coordinates for ${platform.name}`);
        return;
      }

      // Convert to aviation weather format
      const rigWeather = {
        rigName: platform.name,
        latitude: platform.lat,
        longitude: platform.lon,
        
        // Aviation-specific data from new API
        ceiling: weather.ceiling || null,
        flightCategory: weather.flightCategory || 'VFR',
        visibility: weather.visibility || 10,
        cloudCoverage: weather.cloudCoverage || 0,
        
        // Wind data
        windSpeed: weather.windSpeed || 0,
        windDirection: weather.windDirection || 0,
        windGust: weather.windGust || null,
        
        // Temperature and conditions
        temperature: weather.temperature || 70,
        dewPoint: weather.dewPoint || null,
        conditions: weather.conditions || 'Clear',
        
        // Additional metadata
        platformId: platform.id,
        region: platform.region || 'UNKNOWN'
      };

      rigWeatherData.push(rigWeather);
    });

    return rigWeatherData;
  }

  /**
   * Remove rig weather graphics from map
   */
  removeRigWeatherGraphics() {
    if (this.rigWeatherGraphics) {
      this.rigWeatherGraphics.removeRigWeatherGraphics();
      this.isActive = false;
      console.log('🧹 Removed rig weather graphics');
    }
  }

  /**
   * Toggle visibility of rig weather graphics
   */
  toggleVisibility(visible) {
    if (this.rigWeatherGraphics) {
      this.rigWeatherGraphics.toggleVisibility(visible);
      console.log(`👁️ Rig weather graphics ${visible ? 'shown' : 'hidden'}`);
    }
  }

  /**
   * Update graphics with new weather data
   */
  updateWeatherData(platformLocations, weatherDataMap) {
    this.displayRigWeatherGraphics(platformLocations, weatherDataMap);
  }

  /**
   * Check if graphics are currently active
   */
  isGraphicsActive() {
    return this.isActive && this.rigWeatherGraphics?.hasGraphics();
  }

  /**
   * Get the underlying graphics system (for advanced usage)
   */
  getGraphicsSystem() {
    return this.rigWeatherGraphics;
  }

  /**
   * Example usage with your existing weather overlay system
   */
  static exampleIntegration() {
    return `
    // Example integration in your WeatherVisualizationManager.js:
    
    import RigWeatherGraphicsIntegration from './layers/RigWeatherGraphicsIntegration.js';
    
    class WeatherVisualizationManager {
      constructor() {
        // ... existing code ...
        this.rigWeatherIntegration = new RigWeatherGraphicsIntegration(mapManagerRef);
      }
      
      async initialize(managers) {
        // ... existing initialization ...
        
        // Initialize rig weather graphics
        this.rigWeatherIntegration.initialize();
      }
      
      async showWeatherOverlays() {
        // ... existing weather overlay code ...
        
        // Get platform locations from existing system
        const platformLocations = this.getPlatformLocations();
        
        // Fetch aviation weather for each platform
        const weatherDataMap = {};
        for (const platform of platformLocations) {
          try {
            // Use new aviation API instead of fetchNWSPointWeather
            const aviationWeather = await this.fetchAviationWeather(platform.lat, platform.lon);
            weatherDataMap[platform.name] = aviationWeather;
          } catch (error) {
            console.warn('Failed to get aviation weather for', platform.name, error);
          }
        }
        
        // Display rig weather graphics
        this.rigWeatherIntegration.displayRigWeatherGraphics(platformLocations, weatherDataMap);
      }
      
      hideWeatherOverlays() {
        // ... existing cleanup ...
        
        // Remove rig weather graphics
        this.rigWeatherIntegration.removeRigWeatherGraphics();
      }
    }
    `;
  }
}

export default RigWeatherGraphicsIntegration;

/**
 * Usage example for Map Layers Card integration:
 * 
 * In MapLayersCard.jsx, add a new toggle for rig weather graphics:
 * 
 * case 'rigWeatherGraphics':
 *   if (window.rigWeatherIntegration) {
 *     const newVisible = !layers.rigWeatherGraphics;
 *     
 *     if (newVisible) {
 *       // Show rig weather graphics
 *       await window.rigWeatherIntegration.updateWeatherData(platformLocations, weatherDataMap);
 *     } else {
 *       // Hide rig weather graphics
 *       window.rigWeatherIntegration.removeRigWeatherGraphics();
 *     }
 *     
 *     setLayers(prev => ({ ...prev, rigWeatherGraphics: newVisible }));
 *   }
 *   break;
 */