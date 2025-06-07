/**
 * AppSettingsManager.js
 * 
 * Manages application settings and preferences, including:
 * - Last selected region
 * - Last selected aircraft type/registration
 * - Flight settings (passenger weight, fuel settings, etc.)
 * - UI preferences
 * 
 * Stores settings in localStorage for persistence across sessions.
 */

class AppSettingsManager {
  constructor() {
    // Default settings
    this.defaultSettings = {
      region: 'gulf-of-mexico',
      aircraft: {
        type: '',
        registration: ''
      },
      flightSettings: {
        passengerWeight: 220,
        contingencyFuelPercent: 10,
        taxiFuel: 50,
        reserveFuel: 600,
        deckTimePerStop: 5,
        deckFuelFlow: 400
      },
      uiSettings: {
        leftPanelVisible: true,
        rightPanelVisible: true,
        platformsVisible: true,
        appVersion: '1.0'
      }
    };
    
    // Current settings - will be initialized with defaults then loaded from storage
    this.settings = { ...this.defaultSettings };
    
    // Callbacks for when settings change
    this.callbacks = {
      onChange: null,
      onRegionChange: null,
      onAircraftChange: null,
      onFlightSettingsChange: null,
      onUISettingsChange: null
    };
    
    // Load settings from localStorage
    this.loadSettings();
    
    console.log('AppSettingsManager initialized with settings:', this.settings);
  }
  
  /**
   * Set a callback function
   * @param {string} type - Callback type (e.g., 'onChange')
   * @param {Function} callback - Callback function
   */
  setCallback(type, callback) {
    if (this.callbacks.hasOwnProperty(type)) {
      this.callbacks[type] = callback;
    }
  }
  
  /**
   * Trigger a callback if it exists
   * @param {string} type - The callback type
   * @param {*} data - Data to pass to the callback
   */
  triggerCallback(type, data) {
    if (this.callbacks[type]) {
      this.callbacks[type](data);
    }
    
    // Also trigger the general onChange callback for any setting change
    if (type !== 'onChange' && this.callbacks.onChange) {
      this.callbacks.onChange(this.settings);
    }
  }
  
  /**
   * Load settings from localStorage
   */
  loadSettings() {
    try {
      const savedSettings = localStorage.getItem('fastPlannerSettings');
      if (savedSettings) {
        // Parse the saved settings
        const parsed = JSON.parse(savedSettings);
        
        // Merge with defaults to ensure any new settings are included
        this.settings = {
          ...this.defaultSettings,
          ...parsed,
          // Merge nested objects properly
          flightSettings: {
            ...this.defaultSettings.flightSettings,
            ...(parsed.flightSettings || {})
          },
          aircraft: {
            ...this.defaultSettings.aircraft,
            ...(parsed.aircraft || {})
          },
          uiSettings: {
            ...this.defaultSettings.uiSettings,
            ...(parsed.uiSettings || {})
          }
        };
        
        console.log('Loaded settings from localStorage:', this.settings);
      } else {
        console.log('No saved settings found, using defaults');
      }
    } catch (error) {
      console.error('Error loading settings from localStorage:', error);
      this.settings = { ...this.defaultSettings };
    }
  }
  
  /**
   * Save settings to localStorage
   */
  saveSettings() {
    try {
      localStorage.setItem('fastPlannerSettings', JSON.stringify(this.settings));
      console.log('Saved settings to localStorage');
    } catch (error) {
      console.error('Error saving settings to localStorage:', error);
    }
  }
  
  /**
   * Get all settings
   * @returns {Object} - The current settings
   */
  getAllSettings() {
    return { ...this.settings };
  }
  
  /**
   * Set the last selected region
   * @param {string} regionId - The region ID
   */
  setRegion(regionId) {
    this.settings.region = regionId;
    this.saveSettings();
    this.triggerCallback('onRegionChange', regionId);
  }
  
  /**
   * Get the last selected region
   * @returns {string} - The region ID
   */
  getRegion() {
    return this.settings.region;
  }
  
  /**
   * Set aircraft selection
   * @param {string} type - Aircraft type
   * @param {string} registration - Aircraft registration
   */
  setAircraft(type, registration) {
    this.settings.aircraft = {
      type: type || '',
      registration: registration || ''
    };
    this.saveSettings();
    this.triggerCallback('onAircraftChange', this.settings.aircraft);
  }
  
  /**
   * Get aircraft selection
   * @returns {Object} - The aircraft selection {type, registration}
   */
  getAircraft() {
    return { ...this.settings.aircraft };
  }
  
  /**
   * Update flight settings
   * @param {Object} flightSettings - New flight settings
   */
  updateFlightSettings(flightSettings) {
    // Parse any string values to integers to ensure we don't have string-to-number issues
    const parsedSettings = {};
    Object.keys(flightSettings).forEach(key => {
      const value = flightSettings[key];
      if (typeof value === 'string' && !isNaN(parseInt(value, 10))) {
        parsedSettings[key] = parseInt(value, 10);
      } else {
        parsedSettings[key] = value;
      }
    });
    
    // Log what we're updating with
    console.log('AppSettingsManager: Updating flight settings with parsed values:', parsedSettings);
    
    this.settings.flightSettings = {
      ...this.settings.flightSettings,
      ...parsedSettings
    };
    this.saveSettings();
    this.triggerCallback('onFlightSettingsChange', this.settings.flightSettings);
  }
  
  /**
   * Get flight settings
   * @returns {Object} - The flight settings
   */
  getFlightSettings() {
    return { ...this.settings.flightSettings };
  }
  
  /**
   * Update UI settings
   * @param {Object} uiSettings - New UI settings
   */
  updateUISettings(uiSettings) {
    this.settings.uiSettings = {
      ...this.settings.uiSettings,
      ...uiSettings
    };
    this.saveSettings();
    this.triggerCallback('onUISettingsChange', this.settings.uiSettings);
  }
  
  /**
   * Get UI settings
   * @returns {Object} - The UI settings
   */
  getUISettings() {
    return { ...this.settings.uiSettings };
  }
  
  /**
   * Reset settings to defaults
   */
  resetToDefaults() {
    this.settings = { ...this.defaultSettings };
    this.saveSettings();
    this.triggerCallback('onChange', this.settings);
  }
}

export default AppSettingsManager;