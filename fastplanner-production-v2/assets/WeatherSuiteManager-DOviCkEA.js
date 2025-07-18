import { N as NOAASatelliteService } from "./index-C3K8pa5V.js";
import "./osdk-vendors-Bhbwzvvx.js";
import "./react-vendors-IA-6mGt_.js";
class WeatherSuiteManager {
  constructor() {
    this.noaaService = new NOAASatelliteService();
    this.activeWeatherLayers = /* @__PURE__ */ new Map();
    this.isInitialized = false;
    this.weatherProfiles = {
      // Perfect for oil rig helicopter operations
      rigOperations: {
        name: "Oil Rig Operations",
        layers: ["CARIBBEAN", "LIGHTNING", "VISIBLE", "LONGWAVE"],
        description: "Optimized for Gulf of Mexico offshore operations",
        priority: ["LIGHTNING", "CARIBBEAN", "VISIBLE"]
        // Safety first!
      },
      // For storm monitoring and severe weather
      stormTracking: {
        name: "Storm Tracking",
        layers: ["LIGHTNING", "CARIBBEAN", "WATER_VAPOR", "LONGWAVE"],
        description: "Real-time storm development and tracking",
        priority: ["LIGHTNING", "CARIBBEAN", "WATER_VAPOR"]
      },
      // For flight planning and visibility
      flightPlanning: {
        name: "Flight Planning",
        layers: ["VISIBLE", "CARIBBEAN", "LIGHTNING"],
        description: "Essential weather for flight safety",
        priority: ["LIGHTNING", "CARIBBEAN", "VISIBLE"]
      },
      // For global operations (Brazil, Nigeria)
      globalOperations: {
        name: "Global Operations",
        layers: ["LIGHTNING", "VISIBLE", "LONGWAVE"],
        description: "Global lightning and satellite coverage",
        priority: ["LIGHTNING", "VISIBLE", "LONGWAVE"]
      }
    };
    console.log("🌩️ Weather Suite Manager initialized");
  }
  /**
   * Initialize the weather suite with map reference
   * @param {Object} mapInstance - Mapbox GL map instance
   */
  initialize(mapInstance) {
    if (!mapInstance) {
      throw new Error("Map instance required for weather suite");
    }
    this.mapInstance = mapInstance;
    this.isInitialized = true;
    console.log("✅ Weather Suite Manager ready");
    return true;
  }
  /**
   * Apply a complete weather profile
   * @param {string} profileName - Name of the weather profile
   * @param {Object} options - Additional options
   */
  async applyWeatherProfile(profileName, options = {}) {
    if (!this.isInitialized) {
      throw new Error("Weather suite not initialized");
    }
    const profile = this.weatherProfiles[profileName];
    if (!profile) {
      throw new Error(`Unknown weather profile: ${profileName}`);
    }
    console.log(`🌤️ Applying weather profile: ${profile.name}`);
    console.log(`📋 ${profile.description}`);
    const results = {
      profile: profileName,
      success: [],
      failed: [],
      layersAdded: 0
    };
    await this.clearAllWeatherLayers();
    const layersToAdd = options.priorityOrder ? profile.priority : profile.layers;
    for (const layerType of layersToAdd) {
      try {
        console.log(`🛰️ Adding ${layerType} layer...`);
        const success = await this.addWeatherLayer(layerType, {
          opacity: options.opacity || 0.7,
          ...options
        });
        if (success) {
          results.success.push(layerType);
          results.layersAdded++;
          console.log(`✅ ${layerType} layer added successfully`);
        } else {
          results.failed.push(layerType);
          console.log(`❌ ${layerType} layer failed to add`);
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`❌ Error adding ${layerType}:`, error.message);
        results.failed.push(layerType);
      }
    }
    this.activeProfile = profileName;
    console.log(`🎉 Weather profile applied: ${results.layersAdded}/${layersToAdd.length} layers successful`);
    return results;
  }
  /**
   * Add individual weather layer
   * @param {string} layerType - Type of weather layer
   * @param {Object} options - Layer options
   */
  async addWeatherLayer(layerType, options = {}) {
    if (!this.isInitialized) {
      throw new Error("Weather suite not initialized");
    }
    try {
      if (layerType === "LIGHTNING") {
        const success2 = await this.addLightningLayer(options);
        if (success2) {
          this.activeWeatherLayers.set(layerType, {
            type: "lightning",
            layerId: "noaa-lightning-layer",
            sourceId: "noaa-lightning",
            addedAt: /* @__PURE__ */ new Date()
          });
        }
        return success2;
      }
      const success = await this.noaaService.addTestOverlay(this.mapInstance, layerType);
      if (success) {
        this.activeWeatherLayers.set(layerType, {
          type: this.getLayerType(layerType),
          layerId: "noaa-satellite-layer",
          // Current implementation uses this
          sourceId: "noaa-satellite",
          addedAt: /* @__PURE__ */ new Date()
        });
        if (options.opacity !== void 0) {
          this.setLayerOpacity(layerType, options.opacity);
        }
      }
      return success;
    } catch (error) {
      console.error(`Error adding weather layer ${layerType}:`, error);
      return false;
    }
  }
  /**
   * Add lightning detection layer (special handling for global coverage)
   * @param {Object} options - Lightning layer options
   */
  async addLightningLayer(options = {}) {
    try {
      const layerName = this.noaaService.lightningLayers.LIGHTNING;
      const source = {
        type: "raster",
        tiles: [this.noaaService.getWMSUrl(layerName, {
          bbox: "{bbox-epsg-3857}",
          width: 512,
          height: 512
        })],
        tileSize: 512,
        attribution: "© NOAA Lightning Detection Network"
      };
      if (this.mapInstance.getSource("noaa-lightning")) {
        this.mapInstance.removeLayer("noaa-lightning-layer");
        this.mapInstance.removeSource("noaa-lightning");
      }
      this.mapInstance.addSource("noaa-lightning", source);
      this.mapInstance.addLayer({
        id: "noaa-lightning-layer",
        type: "raster",
        source: "noaa-lightning",
        paint: {
          "raster-opacity": options.opacity || 0.8
          // Lightning should be visible!
        }
      });
      console.log("⚡ Lightning detection layer added successfully");
      return true;
    } catch (error) {
      console.error("❌ Failed to add lightning layer:", error);
      return false;
    }
  }
  /**
   * Clear all weather layers
   */
  async clearAllWeatherLayers() {
    console.log("🧹 Clearing all weather layers...");
    this.noaaService.removeOverlay(this.mapInstance);
    if (this.mapInstance.getSource("noaa-lightning")) {
      this.mapInstance.removeLayer("noaa-lightning-layer");
      this.mapInstance.removeSource("noaa-lightning");
    }
    this.activeWeatherLayers.clear();
    this.activeProfile = null;
    console.log("✅ All weather layers cleared");
  }
  /**
   * Set opacity for specific weather layer
   * @param {string} layerType - Type of weather layer
   * @param {number} opacity - Opacity value (0-1)
   */
  setLayerOpacity(layerType, opacity) {
    const layerInfo = this.activeWeatherLayers.get(layerType);
    if (!layerInfo) {
      console.warn(`Layer ${layerType} not found`);
      return false;
    }
    try {
      this.mapInstance.setPaintProperty(layerInfo.layerId, "raster-opacity", opacity);
      console.log(`🎨 ${layerType} opacity set to ${opacity}`);
      return true;
    } catch (error) {
      console.error(`Error setting opacity for ${layerType}:`, error);
      return false;
    }
  }
  /**
   * Toggle visibility of weather layer
   * @param {string} layerType - Type of weather layer
   * @param {boolean} visible - Visibility state
   */
  toggleLayerVisibility(layerType, visible = null) {
    const layerInfo = this.activeWeatherLayers.get(layerType);
    if (!layerInfo) {
      console.warn(`Layer ${layerType} not found`);
      return false;
    }
    try {
      if (visible === null) {
        const current = this.mapInstance.getLayoutProperty(layerInfo.layerId, "visibility");
        visible = current === "visible" ? false : true;
      }
      this.mapInstance.setLayoutProperty(
        layerInfo.layerId,
        "visibility",
        visible ? "visible" : "none"
      );
      console.log(`👁️ ${layerType} visibility: ${visible ? "visible" : "hidden"}`);
      return true;
    } catch (error) {
      console.error(`Error toggling visibility for ${layerType}:`, error);
      return false;
    }
  }
  /**
   * Get status of weather suite
   */
  getWeatherStatus() {
    const status = {
      initialized: this.isInitialized,
      activeProfile: this.activeProfile,
      activeLayers: Array.from(this.activeWeatherLayers.keys()),
      layerCount: this.activeWeatherLayers.size,
      profiles: Object.keys(this.weatherProfiles)
    };
    console.log("🌤️ Weather Suite Status:", status);
    return status;
  }
  /**
   * Helper to determine layer type
   * @private
   */
  getLayerType(layerType) {
    if (Object.keys(this.noaaService.satelliteLayers).includes(layerType)) {
      return "satellite";
    } else if (Object.keys(this.noaaService.radarLayers).includes(layerType)) {
      return "radar";
    } else if (Object.keys(this.noaaService.lightningLayers).includes(layerType)) {
      return "lightning";
    } else {
      return "unknown";
    }
  }
  /**
   * Quick setup for oil rig operations
   */
  async setupForRigOperations() {
    console.log("🛢️ Setting up weather for oil rig operations...");
    return await this.applyWeatherProfile("rigOperations", {
      opacity: 0.7,
      priorityOrder: true
      // Use priority order (safety first!)
    });
  }
  /**
   * Quick setup for storm tracking
   */
  async setupForStormTracking() {
    console.log("⛈️ Setting up weather for storm tracking...");
    return await this.applyWeatherProfile("stormTracking", {
      opacity: 0.8,
      // More visible for storm monitoring
      priorityOrder: true
    });
  }
}
if (typeof window !== "undefined") {
  window.WeatherSuiteManager = WeatherSuiteManager;
  window.weatherSuite = new WeatherSuiteManager();
  console.log("🌩️ Weather Suite Manager available at: window.weatherSuite");
  console.log("🛢️ Setup for rig ops: window.weatherSuite.setupForRigOperations()");
  console.log("⛈️ Setup for storms: window.weatherSuite.setupForStormTracking()");
}
export {
  WeatherSuiteManager as default
};
//# sourceMappingURL=WeatherSuiteManager-DOviCkEA.js.map
