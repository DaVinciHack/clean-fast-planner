/**
 * EnhancedFuelManager.js
 * 
 * Enhanced fuel manager that integrates weather-based fuel calculations
 * with the existing fuel calculation system. Provides the same interface
 * as FuelCalculationManager but adds weather-aware fuel adjustments.
 */

import FuelCalculationManager from './FuelCalculationManager.js';
import WeatherFuelAnalyzer from './weather/WeatherFuelAnalyzer.js';
import ManualFuelOverride from './weather/ManualFuelOverride.js';

class EnhancedFuelManager extends FuelCalculationManager {
  constructor() {
    super();
    
    this.weatherAnalyzer = new WeatherFuelAnalyzer();
    this.manualOverride = new ManualFuelOverride();
    
    // Store weather data
    this.weatherSegments = [];
    this.lastWeatherAnalysis = null;
    
    // Store imported Palantir fuel for comparison
    this.palantirFuel = null;
  }
  
  /**
   * Set weather segments for fuel analysis
   * @param {Array} weatherSegments - Weather segments from Palantir
   */
  setWeatherSegments(weatherSegments) {
    this.weatherSegments = weatherSegments || [];
    console.log(`Weather segments updated: ${this.weatherSegments.length} segments`);
    
    // Re-run calculations if we have aircraft and waypoints
    if (this.state.aircraft && this.state.waypoints.length > 0) {
      this.calculateFuelRequirements(this.state.aircraft, this.state.waypoints);
    }
  }
  
  /**
   * Set imported Palantir fuel data for comparison
   * @param {Object} palantirFuel - Fuel data imported from Palantir
   */
  setPalantirFuel(palantirFuel) {
    this.palantirFuel = palantirFuel;
    console.log("Palantir fuel data set for comparison");
  }
  
  /**
   * Enable manual fuel mode
   * @param {Object} manualValues - Optional initial manual values
   */
  enableManualFuelMode(manualValues = {}) {
    this.manualOverride.enableManualMode();
    if (Object.keys(manualValues).length > 0) {
      this.manualOverride.setManualFuel(manualValues);
    }
    
    // Re-run calculations with manual mode
    if (this.state.aircraft && this.state.waypoints.length > 0) {
      this.calculateFuelRequirements(this.state.aircraft, this.state.waypoints);
    }
  }
  
  /**
   * Disable manual fuel mode and return to automatic calculations
   */
  disableManualFuelMode() {
    this.manualOverride.disableManualMode();
    
    // Re-run calculations with automatic mode
    if (this.state.aircraft && this.state.waypoints.length > 0) {
      this.calculateFuelRequirements(this.state.aircraft, this.state.waypoints);
    }
  }
  
  /**
   * Set manual fuel overrides
   * @param {Object} manualValues - Manual fuel values
   */
  setManualFuel(manualValues) {
    const validation = this.manualOverride.validateManualFuel(manualValues);
    
    if (!validation.isValid) {
      console.error("Manual fuel validation failed:", validation.errors);
      throw new Error(`Invalid manual fuel values: ${validation.errors.join(', ')}`);
    }
    
    if (validation.warnings.length > 0) {
      console.warn("Manual fuel warnings:", validation.warnings);
    }
    
    this.manualOverride.setManualFuel(manualValues);
    
    // Re-run calculations
    if (this.state.aircraft && this.state.waypoints.length > 0) {
      this.calculateFuelRequirements(this.state.aircraft, this.state.waypoints);
    }
  }
  
  /**
   * Enhanced calculation method that includes weather-based fuel analysis
   * @param {Object} aircraft - Aircraft object
   * @param {Array} waypoints - Array of waypoint objects  
   * @returns {Object} Enhanced fuel calculation results
   */
  calculateFuelRequirements(aircraft, waypoints) {
    if (!aircraft || !waypoints || waypoints.length < 2) return null;
    
    // Store current state
    this.state.aircraft = aircraft;
    this.state.waypoints = waypoints;
    
    console.log("Enhanced fuel calculation starting...");
    
    // Start with base settings
    let enhancedSettings = { ...this.settings };
    
    // Apply weather-based fuel adjustments if we have weather data
    if (this.weatherSegments.length > 0 && !this.manualOverride.isManualMode) {
      console.log("Analyzing weather for fuel requirements...");
      
      this.lastWeatherAnalysis = this.weatherAnalyzer.analyzeWeatherForFuel(
        this.weatherSegments,
        waypoints,
        {
          araFuelDefault: enhancedSettings.araFuelDefault || 200,
          approachFuelDefault: enhancedSettings.approachFuelDefault || 200
        }
      );
      
      // Update settings with weather-determined fuel
      enhancedSettings = this.weatherAnalyzer.updateSettingsWithWeatherFuel(
        enhancedSettings,
        this.lastWeatherAnalysis
      );
      
      console.log("Weather analysis complete:", {
        araFuel: this.lastWeatherAnalysis.totalAraFuel,
        approachFuel: this.lastWeatherAnalysis.totalApproachFuel
      });
    }
    
    // Apply manual overrides if in manual mode
    if (this.manualOverride.isManualMode) {
      console.log("Applying manual fuel overrides...");
      enhancedSettings = this.manualOverride.applyManualOverrides(enhancedSettings);
    }
    
    // Update the manager's settings
    this.settings = enhancedSettings;
    
    // Run the parent calculation with enhanced settings
    const baseResults = super.calculateFuelRequirements(aircraft, waypoints);
    
    // Add enhanced information to results
    const enhancedResults = {
      ...baseResults,
      weatherAnalysis: this.lastWeatherAnalysis,
      isManualMode: this.manualOverride.isManualMode,
      manualOverrides: this.manualOverride.getManualOverrides(),
      hasWeatherData: this.weatherSegments.length > 0
    };
    
    // Compare with Palantir fuel if available
    if (this.palantirFuel && baseResults) {
      enhancedResults.palantirComparison = this.weatherAnalyzer.compareFuelWithPalantir(
        baseResults.fuelResults[0]?.fuelComponents || {},
        this.palantirFuel
      );
      
      if (!enhancedResults.palantirComparison.matches) {
        console.warn("Fuel calculation discrepancy with Palantir:", 
          enhancedResults.palantirComparison.discrepancies);
      }
    }
    
    return enhancedResults;
  }
  
  /**
   * Get enhanced results including weather and manual override information
   * @returns {Object} Enhanced fuel calculation results
   */
  getEnhancedResults() {
    const baseResults = this.getResults();
    
    return {
      ...baseResults,
      weatherAnalysis: this.lastWeatherAnalysis,
      isManualMode: this.manualOverride.isManualMode,
      manualOverrides: this.manualOverride.getManualOverrides(),
      hasWeatherData: this.weatherSegments.length > 0,
      manualFuelConfig: this.manualOverride.getManualFuelConfig(),
      palantirFuel: this.palantirFuel
    };
  }
  
  /**
   * Get weather-based fuel breakdown
   * @returns {Object} Weather fuel analysis details
   */
  getWeatherFuelBreakdown() {
    return this.lastWeatherAnalysis || null;
  }
  
  /**
   * Get comparison with Palantir fuel calculations
   * @returns {Object} Comparison results or null if no Palantir data
   */
  getPalantirComparison() {
    if (!this.palantirFuel || !this.state.fuelResults.length) {
      return null;
    }
    
    return this.weatherAnalyzer.compareFuelWithPalantir(
      this.state.fuelResults[0]?.fuelComponents || {},
      this.palantirFuel
    );
  }
  
  /**
   * Check if fuel calculations are consistent with Palantir
   * @param {number} toleranceLbs - Tolerance in pounds for differences
   * @returns {boolean} True if calculations are within tolerance
   */
  isConsistentWithPalantir(toleranceLbs = 50) {
    const comparison = this.getPalantirComparison();
    return comparison ? comparison.matches : null;
  }
}

export default EnhancedFuelManager;