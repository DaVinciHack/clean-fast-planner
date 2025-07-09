/**
 * FuelInputManager.js
 * 
 * Clean, single source of truth for all fuel input management.
 * Replaces the 4 competing state systems in DetailedFuelBreakdown.
 * Now integrates with SegmentFuelManager for proper refuel handling.
 * 
 * Features:
 * - Single state object for all fuel inputs
 * - Clean listener pattern for UI updates
 * - No synchronization conflicts
 * - Simple API for getting/setting fuel values
 * - Proper handling of refuel stops and segments
 * - Integration with SegmentFuelManager for complex fuel rules
 */

import SegmentFuelManager from './SegmentFuelManager.js';

class FuelInputManager {
  constructor(initialSettings = {}, initialLocationOverrides = {}) {
    // Single source of truth for all fuel data
    this.settings = {
      // Global fuel settings
      extraFuel: 0,
      taxiFuel: 30,
      deckTimePerStop: 5,
      deckFuelFlow: 25,
      passengerWeight: 200,
      cargoWeight: 0,
      contingencyFuelPercent: 5,
      reserveMethod: 'time',
      reserveFuel: 20,
      ...initialSettings
    };
    
    // Location-specific fuel overrides (ARA, approach fuel)
    this.locationOverrides = {
      ...initialLocationOverrides
    };
    
    // Segment-specific fuel settings (for refuels)
    this.segmentOverrides = {};
    
    // Initialize segment manager
    this.segmentManager = new SegmentFuelManager();
    
    // Current flight data
    this.currentStopCards = [];
    this.currentRefuelStops = [];
    
    // Listener functions for UI updates
    this.listeners = [];
  }
  
  /**
   * Subscribe to fuel changes
   * @param {Function} listener - Function to call when fuel data changes
   * @returns {Function} Unsubscribe function
   */
  subscribe(listener) {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }
  
  /**
   * Notify all listeners of changes
   */
  notifyListeners() {
    // console.log('🧰 FuelInputManager: Notifying', this.listeners.length, 'listeners of changes');
    this.listeners.forEach(listener => {
      try {
        listener(this.getEffectiveSettings());
      } catch (error) {
        console.error('🚨 FuelInputManager: Listener error:', error);
      }
    });
  }
  
  /**
   * Update a global fuel setting
   * @param {string} key - Setting key (e.g., 'extraFuel', 'taxiFuel')
   * @param {number} value - New value
   */
  updateSetting(key, value) {
    const numericValue = Number(value) || 0;
    console.log(`🧰 FuelInputManager: Updating setting ${key}: ${this.settings[key]} → ${numericValue}`);
    
    this.settings[key] = numericValue;
    this.notifyListeners();
  }
  
  /**
   * Update location-specific fuel (ARA, approach fuel)
   * @param {string} stopName - Stop/location name
   * @param {string} fuelType - 'araFuel' or 'approachFuel'
   * @param {number} value - Fuel amount
   * @param {number} stopIndex - Stop index for validation
   */
  updateLocationFuel(stopName, fuelType, value, stopIndex = null) {
    const numericValue = Number(value) || 0;
    const key = `${stopName}_${fuelType}`;
    
    console.log(`🧰 FuelInputManager: Updating location fuel ${key}: ${this.locationOverrides[key]?.value || 0} → ${numericValue}`);
    
    if (numericValue > 0) {
      this.locationOverrides[key] = {
        value: numericValue,
        stopIndex: stopIndex,
        timestamp: Date.now()
      };
    } else {
      // Remove zero values to keep object clean
      delete this.locationOverrides[key];
    }
    
    this.notifyListeners();
  }
  
  /**
   * Get fuel value for a specific location
   * @param {string} stopName - Stop/location name
   * @param {string} fuelType - 'araFuel' or 'approachFuel'
   * @returns {number} Fuel amount (0 if not set)
   */
  getLocationFuel(stopName, fuelType) {
    const key = `${stopName}_${fuelType}`;
    const override = this.locationOverrides[key];
    return override?.value || 0;
  }
  
  /**
   * Get global fuel setting
   * @param {string} key - Setting key
   * @returns {number} Setting value
   */
  getSetting(key) {
    return this.settings[key] || 0;
  }
  
  /**
   * Get all effective settings for StopCardCalculator
   * @returns {Object} Complete settings object
   */
  getEffectiveSettings() {
    return {
      // Global settings
      ...this.settings,
      // Location overrides
      locationFuelOverrides: this.locationOverrides
    };
  }
  
  /**
   * Clear all location fuel for a specific stop
   * @param {string} stopName - Stop name to clear
   */
  clearLocationFuel(stopName) {
    const keysToRemove = Object.keys(this.locationOverrides).filter(key => 
      key.startsWith(stopName + '_')
    );
    
    console.log(`🧰 FuelInputManager: Clearing location fuel for ${stopName}:`, keysToRemove);
    
    keysToRemove.forEach(key => {
      delete this.locationOverrides[key];
    });
    
    if (keysToRemove.length > 0) {
      this.notifyListeners();
    }
  }
  
  /**
   * Get all location fuel overrides
   * @returns {Object} Location overrides object
   */
  getAllLocationOverrides() {
    return { ...this.locationOverrides };
  }
  
  /**
   * Bulk update settings (for initialization)
   * @param {Object} newSettings - Settings to merge
   */
  bulkUpdateSettings(newSettings) {
    console.log('🧰 FuelInputManager: Bulk updating settings:', Object.keys(newSettings));
    
    this.settings = {
      ...this.settings,
      ...newSettings
    };
    
    this.notifyListeners();
  }
  
  /**
   * Reset all fuel data
   */
  reset() {
    console.log('🧰 FuelInputManager: Resetting all fuel data');
    
    this.settings = {
      extraFuel: 0,
      taxiFuel: 30,
      deckTimePerStop: 5,
      deckFuelFlow: 25,
      passengerWeight: 200,
      cargoWeight: 0,
      contingencyFuelPercent: 5,
      reserveMethod: 'time',
      reserveFuel: 20
    };
    
    this.locationOverrides = {};
    this.notifyListeners();
  }
  
  /**
   * Update flight data and analyze segments
   * @param {Array} stopCards - Current stop cards
   * @param {Array} refuelStops - Array of refuel stop indices
   * @param {Array} weatherSegments - Weather data for fuel calculations
   * @param {Object} fuelPolicy - Fuel policy settings
   */
  updateFlightData(stopCards, refuelStops = [], weatherSegments = [], fuelPolicy = null) {
    // Ensure weatherSegments is always an array to prevent null errors
    const safeWeatherSegments = weatherSegments || [];
    
    // console.log('🧰 FuelInputManager: Updating flight data', { 
    //   stops: stopCards.length, 
    //   refuels: refuelStops.length,
    //   weather: safeWeatherSegments.length,
    //   hasFuelPolicy: !!fuelPolicy
    // });
    
    this.currentStopCards = [...stopCards];
    this.currentRefuelStops = [...refuelStops];
    
    // Analyze segments for proper fuel calculations with external data
    this.segmentManager.analyzeFlightSegments(stopCards, refuelStops, safeWeatherSegments, fuelPolicy);
    
    this.notifyListeners();
  }
  
  /**
   * Get fuel summary for a specific stop (segment-aware)
   * @param {number} stopIndex - Stop index
   * @returns {Object} Fuel summary including segment information
   */
  getFuelSummaryForStop(stopIndex) {
    const segmentSummary = this.segmentManager.getFuelSummaryForStop(stopIndex);
    
    if (!segmentSummary) {
      return null;
    }
    
    // Combine with user overrides
    const userARA = this.getLocationFuel(segmentSummary.stopName, 'araFuel');
    const userApproach = this.getLocationFuel(segmentSummary.stopName, 'approachFuel');
    
    return {
      ...segmentSummary,
      userOverrides: {
        araFuel: userARA,
        approachFuel: userApproach
      },
      effectiveFuel: {
        araFuel: userARA || segmentSummary.remainingRequirements.araFuel,
        approachFuel: userApproach || segmentSummary.remainingRequirements.approachFuel
      }
    };
  }
  
  /**
   * Update segment-specific extra fuel (for refuel segments)
   * @param {string} segmentId - Segment identifier
   * @param {number} extraFuel - Extra fuel for this segment
   */
  updateSegmentExtraFuel(segmentId, extraFuel) {
    const numericValue = Number(extraFuel) || 0;
    console.log(`🧰 FuelInputManager: Updating segment ${segmentId} extra fuel: ${numericValue}`);
    
    if (numericValue > 0) {
      this.segmentOverrides[segmentId] = {
        ...this.segmentOverrides[segmentId],
        extraFuel: numericValue
      };
    } else {
      if (this.segmentOverrides[segmentId]) {
        delete this.segmentOverrides[segmentId].extraFuel;
        if (Object.keys(this.segmentOverrides[segmentId]).length === 0) {
          delete this.segmentOverrides[segmentId];
        }
      }
    }
    
    this.notifyListeners();
  }
  
  /**
   * Get segment-specific extra fuel
   * @param {string} segmentId - Segment identifier
   * @returns {number} Extra fuel for this segment
   */
  getSegmentExtraFuel(segmentId) {
    return this.segmentOverrides[segmentId]?.extraFuel || 0;
  }
  
  /**
   * Update deck time for a specific rig (affects deck fuel calculation)
   * @param {string} stopName - Rig name
   * @param {number} deckTime - Deck time in minutes
   */
  updateDeckTime(stopName, deckTime) {
    const numericValue = Number(deckTime) || 5;
    const key = `${stopName}_deckTime`;
    
    console.log(`🧰 FuelInputManager: Updating deck time for ${stopName}: ${numericValue} min`);
    
    this.locationOverrides[key] = {
      value: numericValue,
      timestamp: Date.now()
    };
    
    this.notifyListeners();
  }
  
  /**
   * Get deck time for a specific rig
   * @param {string} stopName - Rig name
   * @returns {number} Deck time in minutes
   */
  getDeckTime(stopName) {
    const key = `${stopName}_deckTime`;
    return this.locationOverrides[key]?.value || this.settings.deckTimePerStop || 5;
  }
  
  /**
   * Get all current segments
   * @returns {Array} Array of segment objects
   */
  getCurrentSegments() {
    return this.segmentManager.segments;
  }
  
  /**
   * Check if a stop is a refuel stop
   * @param {number} stopIndex - Stop index
   * @returns {boolean} True if refuel stop
   */
  isRefuelStop(stopIndex) {
    return this.currentRefuelStops.includes(stopIndex);
  }
  
  /**
   * Get effective settings including segment-aware fuel
   * @returns {Object} Complete settings with segment information
   */
  getEffectiveSettings() {
    return {
      // Global settings
      ...this.settings,
      // Location overrides
      locationFuelOverrides: this.locationOverrides,
      // Segment overrides
      segmentOverrides: this.segmentOverrides,
      // Segment information
      segments: this.segmentManager.segments,
      refuelStops: this.currentRefuelStops
    };
  }
  
  /**
   * Debug: Get current state summary
   * @returns {Object} Debug information
   */
  getDebugInfo() {
    return {
      settings: this.settings,
      locationOverridesCount: Object.keys(this.locationOverrides).length,
      locationOverrides: this.locationOverrides,
      segmentOverrides: this.segmentOverrides,
      segments: this.segmentManager.getDebugInfo(),
      listenersCount: this.listeners.length,
      currentFlight: {
        stopCount: this.currentStopCards.length,
        refuelStops: this.currentRefuelStops
      }
    };
  }
}

export default FuelInputManager;