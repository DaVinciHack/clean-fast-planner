/**
 * ManualFuelOverride.js
 * 
 * Provides manual fuel override capabilities for when weather APIs fail
 * or when pilots need to specify custom fuel requirements.
 * 
 * This ensures the application remains usable even when automated
 * weather-based fuel calculations are not available.
 */

class ManualFuelOverride {
  constructor() {
    this.overrides = {};
    this.isManualMode = false;
  }
  
  /**
   * Enable manual fuel mode - disables automatic weather-based calculations
   */
  enableManualMode() {
    this.isManualMode = true;
    console.log("Manual fuel mode enabled - automatic weather calculations disabled");
  }
  
  /**
   * Disable manual fuel mode - re-enables automatic weather-based calculations
   */
  disableManualMode() {
    this.isManualMode = false;
    this.overrides = {};
    console.log("Manual fuel mode disabled - automatic weather calculations enabled");
  }
  
  /**
   * Set manual fuel values
   * @param {Object} manualValues - Object containing manual fuel overrides
   */
  setManualFuel(manualValues) {
    this.overrides = {
      ...this.overrides,
      ...manualValues
    };
    
    console.log("Manual fuel overrides set:", this.overrides);
  }
  
  /**
   * Get current manual overrides
   * @returns {Object} Current manual fuel overrides
   */
  getManualOverrides() {
    return { ...this.overrides };
  }
  
  /**
   * Apply manual overrides to fuel settings
   * @param {Object} baseSettings - Base fuel calculation settings
   * @returns {Object} Settings with manual overrides applied
   */
  applyManualOverrides(baseSettings) {
    if (!this.isManualMode) {
      return baseSettings;
    }
    
    const overriddenSettings = { ...baseSettings };
    
    // Apply each override
    Object.keys(this.overrides).forEach(key => {
      if (this.overrides[key] !== null && this.overrides[key] !== undefined) {
        overriddenSettings[key] = this.overrides[key];
        console.log(`Applied manual override: ${key} = ${this.overrides[key]}`);
      }
    });
    
    return overriddenSettings;
  }
  
  /**
   * Create a manual fuel configuration interface
   * @returns {Object} Configuration object for UI components
   */
  getManualFuelConfig() {
    return {
      isEnabled: this.isManualMode,
      fields: [
        {
          key: 'taxiFuel',
          label: 'Taxi Fuel (lbs)',
          type: 'number',
          min: 0,
          max: 200,
          default: 50,
          description: 'Fuel for ground operations and taxi'
        },
        {
          key: 'contingencyFuelPercent',
          label: 'Contingency Fuel (%)',
          type: 'number',
          min: 5,
          max: 20,
          default: 10,
          description: 'Percentage of trip fuel for contingency'
        },
        {
          key: 'reserveFuel',
          label: 'Reserve Fuel (lbs)',
          type: 'number',
          min: 200,
          max: 1000,
          default: 500,
          description: 'Reserve fuel amount'
        },
        {
          key: 'araFuel',
          label: 'ARA Fuel (lbs)',
          type: 'number',
          min: 0,
          max: 500,
          default: 0,
          description: 'Additional Reserve Allowance for rig operations'
        },
        {
          key: 'approachFuel',
          label: 'Approach Fuel (lbs)',
          type: 'number',
          min: 0,
          max: 500,
          default: 0,
          description: 'Additional fuel for approach in poor weather'
        },
        {
          key: 'deckFuelPerStop',
          label: 'Deck Fuel per Stop (lbs)',
          type: 'number',
          min: 50,
          max: 300,
          default: 100,
          description: 'Additional fuel per rig/platform stop'
        },
        {
          key: 'passengerWeight',
          label: 'Passenger Weight (lbs)',
          type: 'number',
          min: 180,
          max: 250,
          default: 220,
          description: 'Weight per passenger including baggage'
        }
      ],
      currentValues: this.overrides
    };
  }
  
  /**
   * Validate manual fuel values
   * @param {Object} values - Values to validate
   * @returns {Object} Validation result
   */
  validateManualFuel(values) {
    const errors = [];
    const warnings = [];
    
    // Check for reasonable ranges
    if (values.taxiFuel && (values.taxiFuel < 0 || values.taxiFuel > 200)) {
      errors.push("Taxi fuel should be between 0-200 lbs");
    }
    
    if (values.contingencyFuelPercent && (values.contingencyFuelPercent < 5 || values.contingencyFuelPercent > 20)) {
      warnings.push("Contingency fuel percentage outside normal range (5-20%)");
    }
    
    if (values.reserveFuel && values.reserveFuel < 200) {
      errors.push("Reserve fuel should not be less than 200 lbs for safety");
    }
    
    if (values.araFuel && values.araFuel > 500) {
      warnings.push("ARA fuel appears unusually high (>500 lbs)");
    }
    
    if (values.approachFuel && values.approachFuel > 500) {
      warnings.push("Approach fuel appears unusually high (>500 lbs)");
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

export default ManualFuelOverride;