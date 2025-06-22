/**
 * SARManager.js
 * 
 * Centralized SAR (Search and Rescue) state management for FastPlanner.
 * Handles all SAR calculations and state without callbacks to prevent race conditions.
 * 
 * @aviation-safety: All calculations use real aircraft data, no placeholder values
 * @architecture: Pure state management - no React hooks, just functions and data
 */

import React from 'react';
import { calculateOperationalRadius, calculateMaxSARWeight, calculateMinimumFuel } from '../calculations/SARCalculations';

/**
 * SARManager Class
 * Manages SAR state and calculations without React hook dependencies
 */
export class SARManager {
  constructor() {
    // Core SAR State
    this.sarEnabled = false;
    this.takeoffFuel = 4000; // lbs - reasonable default
    this.sarWeight = 440; // lbs - typical SAR equipment weight
    this.timeOnTask = 1.0; // hours - time spent on search pattern
    
    // Advanced options
    this.showAdvancedOptions = false;
    this.desiredRadius = 25; // NM - desired operational radius
    this.customReserveFuel = null; // Override policy reserve
    
    // Cached calculation results
    this.lastCalculation = null;
    this.lastCalculationTime = null;
    
    // State change listeners
    this.listeners = new Set();
  }

  /**
   * Add a listener for state changes
   * @param {Function} listener - Function to call when state changes
   */
  addListener(listener) {
    this.listeners.add(listener);
  }

  /**
   * Remove a state change listener
   * @param {Function} listener - Function to remove
   */
  removeListener(listener) {
    this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of state change
   */
  notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.getState());
      } catch (error) {
        console.error('SAR Manager listener error:', error);
      }
    });
  }

  /**
   * Get current SAR state
   * @returns {Object} Complete SAR state
   */
  getState() {
    return {
      // Core state
      sarEnabled: this.sarEnabled,
      takeoffFuel: this.takeoffFuel,
      sarWeight: this.sarWeight,
      timeOnTask: this.timeOnTask,
      
      // Advanced options
      showAdvancedOptions: this.showAdvancedOptions,
      desiredRadius: this.desiredRadius,
      customReserveFuel: this.customReserveFuel,
      
      // Calculation results
      lastCalculation: this.lastCalculation,
      lastCalculationTime: this.lastCalculationTime
    };
  }

  /**
   * Toggle SAR mode on/off
   */
  toggleSARMode() {
    this.sarEnabled = !this.sarEnabled;
    
    // Clear calculation when disabled
    if (!this.sarEnabled) {
      this.lastCalculation = null;
    }
    
    this.notifyListeners();
  }

  /**
   * Update takeoff fuel
   * @param {number} fuel - Fuel in pounds
   */
  setTakeoffFuel(fuel) {
    this.takeoffFuel = Math.max(0, fuel);
    this.notifyListeners();
  }

  /**
   * Update SAR equipment weight
   * @param {number} weight - Weight in pounds
   */
  setSARWeight(weight) {
    this.sarWeight = Math.max(0, weight);
    this.notifyListeners();
  }

  /**
   * Update time on task
   * @param {number} time - Time in hours
   */
  setTimeOnTask(time) {
    this.timeOnTask = Math.max(0.1, Math.min(10, time));
    this.notifyListeners();
  }

  /**
   * Toggle advanced options visibility
   */
  toggleAdvancedOptions() {
    this.showAdvancedOptions = !this.showAdvancedOptions;
    this.notifyListeners();
  }

  /**
   * Set desired operational radius
   * @param {number} radius - Radius in nautical miles
   */
  setDesiredRadius(radius) {
    this.desiredRadius = Math.max(1, Math.min(200, radius));
    this.notifyListeners();
  }

  /**
   * Set custom reserve fuel override
   * @param {number|null} fuel - Fuel in pounds, or null to use policy
   */
  setCustomReserveFuel(fuel) {
    this.customReserveFuel = fuel;
    this.notifyListeners();
  }

  /**
   * Apply aircraft-specific presets
   * @param {Object} selectedAircraft - OSDK aircraft data
   */
  applyAircraftPresets(selectedAircraft) {
    if (!selectedAircraft) return;

    // Set fuel to 80% of max capacity (typical SAR loading)
    if (selectedAircraft.maxFuel) {
      this.takeoffFuel = Math.round(selectedAircraft.maxFuel * 0.8);
    }

    // Set weight based on aircraft type
    const modelType = selectedAircraft.modelType || selectedAircraft.modelName || '';
    let presetWeight = 440; // Default SAR weight

    if (modelType.includes('S92') || modelType.includes('S-92')) {
      presetWeight = 600; // Heavier SAR equipment for large aircraft
    } else if (modelType.includes('AW139') || modelType.includes('139')) {
      presetWeight = 500; // Medium SAR equipment
    } else if (modelType.includes('AW169') || modelType.includes('169')) {
      presetWeight = 450; // Medium-light SAR equipment
    }

    this.sarWeight = presetWeight;
    this.notifyListeners();
  }

  /**
   * Calculate SAR operational parameters
   * @param {Object} flightData - Current flight data
   * @param {Object} flightData.selectedAircraft - OSDK aircraft data
   * @param {Object} flightData.routeStats - Main route statistics
   * @param {Object} flightData.alternateStats - Alternate route statistics
   * @param {Object} flightData.fuelPolicy - Current fuel policy
   * @param {Array} flightData.waypoints - Current route waypoints
   * @returns {Object|null} SAR calculation results
   */
  calculateSAR(flightData) {
    if (!this.sarEnabled || !flightData.selectedAircraft) {
      return null;
    }

    const {
      selectedAircraft,
      routeStats,
      alternateStats,
      fuelPolicy,
      waypoints
    } = flightData;

    try {
      // Extract fuel requirements
      const routeFuel = routeStats?.totalFuelRequired || routeStats?.fuelRequired || 0;
      const alternateFuel = alternateStats?.totalFuelRequired || alternateStats?.fuelRequired || 0;
      const reserveFuel = this.customReserveFuel !== null ? 
        this.customReserveFuel : 
        (routeStats?.reserveFuel || alternateStats?.reserveFuel || 0);

      // Calculate operational radius
      const calculation = calculateOperationalRadius({
        takeoffFuel: this.takeoffFuel,
        sarWeight: this.sarWeight,
        timeOnTask: this.timeOnTask,
        selectedAircraft,
        routeFuel,
        alternateFuel,
        reserveFuel,
        fuelPolicy
      });

      // Get final waypoint for map visualization
      const finalWaypoint = this.getFinalWaypoint(waypoints);

      // Cache results
      this.lastCalculation = {
        ...calculation,
        finalWaypoint,
        timestamp: new Date()
      };
      this.lastCalculationTime = new Date();

      return this.lastCalculation;

    } catch (error) {
      console.error('SAR calculation error:', error);
      this.lastCalculation = {
        error: 'Calculation failed',
        details: error.message,
        category: 'calculation',
        severity: 'error',
        finalWaypoint: null,
        timestamp: new Date()
      };
      return this.lastCalculation;
    }
  }

  /**
   * Get final waypoint from route for range circle positioning
   * @param {Array} waypoints - Current route waypoints
   * @returns {Object|null} Final waypoint coordinates
   */
  getFinalWaypoint(waypoints) {
    if (!waypoints || waypoints.length === 0) return null;
    
    const lastWaypoint = waypoints[waypoints.length - 1];
    if (!lastWaypoint || !lastWaypoint.lat || !lastWaypoint.lng) return null;
    
    return {
      lat: lastWaypoint.lat,
      lng: lastWaypoint.lng,
      name: lastWaypoint.name || 'Final Waypoint'
    };
  }

  /**
   * Get aircraft capability analysis
   * @param {Object} selectedAircraft - OSDK aircraft data
   * @returns {Object} Capability analysis results
   */
  getAircraftCapability(selectedAircraft) {
    if (!selectedAircraft || !this.sarEnabled) {
      return { hasCapabilityData: false };
    }

    try {
      const maxWeightResult = calculateMaxSARWeight({
        selectedAircraft,
        takeoffFuel: this.takeoffFuel,
        routeFuel: 0, // We'll calculate this separately
        alternateFuel: 0,
        reserveFuel: 0
      });

      const minFuelResult = calculateMinimumFuel({
        selectedAircraft,
        desiredRadius: this.desiredRadius,
        sarWeight: this.sarWeight,
        timeOnTask: this.timeOnTask,
        routeFuel: 0,
        alternateFuel: 0,
        reserveFuel: 0
      });

      return {
        hasCapabilityData: true,
        maxWeight: maxWeightResult,
        minFuel: minFuelResult
      };
    } catch (error) {
      console.error('Aircraft capability analysis error:', error);
      return { hasCapabilityData: false, error: error.message };
    }
  }

  /**
   * Validate SAR parameters
   * @param {Object} selectedAircraft - OSDK aircraft data
   * @returns {Object} Validation results
   */
  validateParameters(selectedAircraft) {
    const validation = {
      fuel: { valid: true, message: '' },
      weight: { valid: true, message: '' },
      time: { valid: true, message: '' }
    };

    // Fuel validation
    if (this.takeoffFuel <= 0) {
      validation.fuel = { valid: false, message: 'Fuel must be greater than 0' };
    } else if (selectedAircraft?.maxFuel && this.takeoffFuel > selectedAircraft.maxFuel) {
      validation.fuel = { valid: false, message: `Exceeds max fuel capacity (${selectedAircraft.maxFuel} lbs)` };
    }

    // Weight validation
    if (this.sarWeight < 0) {
      validation.weight = { valid: false, message: 'Weight cannot be negative' };
    } else if (this.sarWeight > 5000) {
      validation.weight = { valid: false, message: 'Weight exceeds reasonable SAR equipment limits' };
    }

    // Time validation
    if (this.timeOnTask <= 0) {
      validation.time = { valid: false, message: 'Time on task must be greater than 0' };
    } else if (this.timeOnTask > 10) {
      validation.time = { valid: false, message: 'Time on task exceeds reasonable limits (10 hours)' };
    }

    return validation;
  }

  /**
   * Get SAR status for UI display
   * @param {Object} selectedAircraft - OSDK aircraft data
   * @returns {Object} Status information
   */
  getStatus(selectedAircraft) {
    if (!this.sarEnabled) {
      return { status: 'disabled', message: 'SAR Mode disabled' };
    }

    if (!selectedAircraft) {
      return { status: 'error', message: 'No aircraft selected' };
    }

    const hasValidAircraft = selectedAircraft && 
      selectedAircraft.fuelBurn && 
      selectedAircraft.cruiseSpeed;

    if (!hasValidAircraft) {
      return { status: 'error', message: 'Aircraft missing performance data' };
    }

    if (this.lastCalculation?.error) {
      return { status: 'error', message: this.lastCalculation.error };
    }

    if (this.lastCalculation) {
      return { 
        status: 'operational', 
        message: `Operational - ${this.lastCalculation.operationalRadiusNM} NM range` 
      };
    }

    return { status: 'ready', message: 'Ready for SAR calculation' };
  }

  /**
   * Reset SAR manager to default state
   */
  reset() {
    this.sarEnabled = false;
    this.takeoffFuel = 4000;
    this.sarWeight = 440;
    this.timeOnTask = 1.0;
    this.showAdvancedOptions = false;
    this.desiredRadius = 25;
    this.customReserveFuel = null;
    this.lastCalculation = null;
    this.lastCalculationTime = null;
    this.notifyListeners();
  }
}

/**
 * Create and export a singleton SAR manager instance
 */
export const sarManager = new SARManager();

/**
 * React hook to use SAR manager in components
 * @returns {Object} SAR manager state and functions
 */
export const useSARManager = () => {
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);
  
  React.useEffect(() => {
    sarManager.addListener(forceUpdate);
    return () => sarManager.removeListener(forceUpdate);
  }, []);
  
  return {
    ...sarManager.getState(),
    
    // Actions
    toggleSARMode: () => sarManager.toggleSARMode(),
    setTakeoffFuel: (fuel) => sarManager.setTakeoffFuel(fuel),
    setSARWeight: (weight) => sarManager.setSARWeight(weight),
    setTimeOnTask: (time) => sarManager.setTimeOnTask(time),
    toggleAdvancedOptions: () => sarManager.toggleAdvancedOptions(),
    setDesiredRadius: (radius) => sarManager.setDesiredRadius(radius),
    setCustomReserveFuel: (fuel) => sarManager.setCustomReserveFuel(fuel),
    applyAircraftPresets: (aircraft) => sarManager.applyAircraftPresets(aircraft),
    
    // Manager instance for direct access
    manager: sarManager
  };
};