/**
 * FuelStopOptimizationManager.js
 * 
 * Orchestrates the fuel stop optimization process and manages the UI state.
 * Detects passenger overload and coordinates with the optimization system.
 */

import { FuelStopOptimizer } from './FuelStopOptimizer.js';
import { PlatformEvaluator } from './PlatformEvaluator.js';

export class FuelStopOptimizationManager {
  constructor() {
    this.optimizer = new FuelStopOptimizer();
    this.platformEvaluator = new PlatformEvaluator();
    this.isProcessing = false;
    this.lastSuggestions = null;
    this.callbacks = {
      onSuggestionsReady: null,
      onError: null,
      onProcessingUpdate: null
    };
  }

  /**
   * Sets callback functions for UI updates
   * @param {Object} callbacks - Callback functions
   */
  setCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Main method to check for passenger overload and suggest fuel stops
   * @param {Object} flightConfiguration - Current flight setup
   * @returns {Promise<Object>} Optimization results
   */
  async checkAndOptimize(flightConfiguration) {
    if (this.isProcessing) {
      console.log('FuelStopOptimizationManager: Already processing, skipping...');
      return { success: false, reason: 'Already processing' };
    }

    try {
      this.isProcessing = true;
      this.notifyProcessing(true);

      console.log('FuelStopOptimizationManager: Starting optimization check...');

      // Validate flight configuration
      const validationResult = this.validateFlightConfiguration(flightConfiguration);
      if (!validationResult.isValid) {
        return { success: false, reason: validationResult.reason };
      }

      // Extract passenger requirements
      const passengerAnalysis = this.analyzePassengerRequirements(flightConfiguration);
      if (!passengerAnalysis.hasOverload) {
        console.log('FuelStopOptimizationManager: No passenger overload detected');
        return { success: false, reason: 'No passenger overload' };
      }

      console.log('FuelStopOptimizationManager: Passenger overload detected, finding solutions...');

      // Get all available platforms/locations for search
      const allLocations = this.extractAllLocations(flightConfiguration);
      
      // Prepare optimization data
      const optimizationData = {
        ...flightConfiguration,
        requiredPassengers: passengerAnalysis.requiredPassengers,
        availablePlatforms: this.platformEvaluator.findFuelCapableRigs(allLocations, null),
        stopCards: flightConfiguration.stopCards || [],
        alternateSplitPoint: flightConfiguration.alternateRouteData?.splitPoint || null
      };

      // Run optimization
      const optimizationResult = await this.optimizer.suggestFuelStops(optimizationData);

      if (optimizationResult.success && optimizationResult.suggestions.length > 0) {
        this.lastSuggestions = optimizationResult;
        this.notifySuggestions(optimizationResult);
        
        console.log(`FuelStopOptimizationManager: Found ${optimizationResult.suggestions.length} fuel stop options`);
        return optimizationResult;
      } else {
        console.log('FuelStopOptimizationManager: No viable fuel stop options found');
        this.notifyError('No suitable fuel stops found within 10nm of route');
        return optimizationResult;
      }

    } catch (error) {
      console.error('FuelStopOptimizationManager: Optimization error:', error);
      this.notifyError(`Optimization failed: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      this.isProcessing = false;
      this.notifyProcessing(false);
    }
  }

  /**
   * Validates flight configuration has required data
   * @param {Object} config - Flight configuration
   * @returns {Object} Validation result
   */
  validateFlightConfiguration(config) {
    if (!config) {
      return { isValid: false, reason: 'No flight configuration provided' };
    }

    if (!config.selectedAircraft) {
      return { isValid: false, reason: 'No aircraft selected' };
    }

    if (!config.waypoints || config.waypoints.length < 2) {
      return { isValid: false, reason: 'Insufficient waypoints (need at least 2)' };
    }

    if (!config.stopCards || config.stopCards.length === 0) {
      return { isValid: false, reason: 'No stop cards available for analysis' };
    }

    return { isValid: true };
  }

  /**
   * Analyzes passenger requirements vs capacity
   * @param {Object} config - Flight configuration
   * @returns {Object} Passenger analysis
   */
  analyzePassengerRequirements(config) {
    const requiredPassengers = config.requiredPassengers || 
                              config.flightSettings?.requiredPassengers || 
                              config.passengerCount || 0;

    if (requiredPassengers === 0) {
      return { hasOverload: false, reason: 'No passengers required' };
    }

    // Check each stop card for passenger capacity issues
    const overloadedStops = config.stopCards.filter(card => 
      requiredPassengers > (card.maxPassengers || 0)
    );

    if (overloadedStops.length === 0) {
      return { hasOverload: false, reason: 'Sufficient passenger capacity' };
    }

    const maxShortage = Math.max(...overloadedStops.map(stop => 
      requiredPassengers - (stop.maxPassengers || 0)
    ));

    return {
      hasOverload: true,
      requiredPassengers,
      overloadedStops,
      maxShortage,
      affectedStops: overloadedStops.length
    };
  }

  /**
   * Extracts all location data from flight configuration
   * @param {Object} config - Flight configuration
   * @returns {Object} All location collections
   */
  extractAllLocations(config) {
    const allLocations = {};

    // Extract from various possible sources
    if (config.platforms) allLocations.platforms = config.platforms;
    if (config.rigs) allLocations.rigs = config.rigs;
    if (config.helidecks) allLocations.helidecks = config.helidecks;
    if (config.oilPlatforms) allLocations.oilPlatforms = config.oilPlatforms;
    if (config.availablePlatforms) allLocations.availablePlatforms = config.availablePlatforms;

    // Check for platform manager data
    if (config.platformManager) {
      if (config.platformManager.platforms) allLocations.managerPlatforms = config.platformManager.platforms;
      if (config.platformManager.getAllPlatforms) {
        try {
          allLocations.allManagerPlatforms = config.platformManager.getAllPlatforms();
        } catch (error) {
          console.warn('Failed to get platforms from manager:', error);
        }
      }
    }

    // Check for global platform data
    if (window.currentPlatformData) allLocations.globalPlatforms = window.currentPlatformData;

    const totalCount = Object.values(allLocations).reduce((sum, collection) => {
      return sum + (Array.isArray(collection) ? collection.length : 0);
    }, 0);

    console.log(`FuelStopOptimizationManager: Extracted ${totalCount} total locations from ${Object.keys(allLocations).length} sources`);

    return allLocations;
  }

  /**
   * Adds a fuel stop to the route
   * @param {Object} suggestion - Selected fuel stop suggestion
   * @param {Function} routeModifier - Function to modify the route
   * @returns {Promise<Boolean>} Success status
   */
  async addFuelStopToRoute(suggestion, routeModifier) {
    try {
      console.log('FuelStopOptimizationManager: Adding fuel stop to route:', suggestion.platform.name);

      if (!routeModifier || typeof routeModifier !== 'function') {
        throw new Error('No route modifier function provided');
      }

      // Prepare waypoint data for insertion
      const fuelStopWaypoint = {
        name: suggestion.platform.name || suggestion.platform.id,
        lat: suggestion.platform.lat,
        lng: suggestion.platform.lng,
        type: 'LANDING_STOP',
        refuelStop: true,
        autoInserted: true,
        optimizationData: {
          passengerGain: suggestion.passengerGain,
          fuelSavings: suggestion.fuelSavings,
          routeDeviation: suggestion.routeDeviation,
          score: suggestion.score
        }
      };

      // Call route modifier to insert the waypoint
      const success = await routeModifier(fuelStopWaypoint, suggestion.insertionPoint);

      if (success) {
        console.log('FuelStopOptimizationManager: Fuel stop added successfully');
        this.lastSuggestions = null; // Clear suggestions after successful addition
        return true;
      } else {
        throw new Error('Route modification failed');
      }

    } catch (error) {
      console.error('FuelStopOptimizationManager: Failed to add fuel stop:', error);
      this.notifyError(`Failed to add fuel stop: ${error.message}`);
      return false;
    }
  }

  /**
   * Gets the last optimization suggestions
   * @returns {Object|null} Last suggestions or null
   */
  getLastSuggestions() {
    return this.lastSuggestions;
  }

  /**
   * Clears current suggestions
   */
  clearSuggestions() {
    this.lastSuggestions = null;
  }

  /**
   * Notifies about processing status
   * @param {Boolean} isProcessing - Processing status
   */
  notifyProcessing(isProcessing) {
    if (this.callbacks.onProcessingUpdate) {
      this.callbacks.onProcessingUpdate(isProcessing);
    }
  }

  /**
   * Notifies about new suggestions
   * @param {Object} suggestions - Optimization suggestions
   */
  notifySuggestions(suggestions) {
    if (this.callbacks.onSuggestionsReady) {
      this.callbacks.onSuggestionsReady(suggestions);
    }
  }

  /**
   * Notifies about errors
   * @param {String} errorMessage - Error message
   */
  notifyError(errorMessage) {
    if (this.callbacks.onError) {
      this.callbacks.onError(errorMessage);
    }
  }

  /**
   * Checks if optimization should be triggered automatically
   * @param {Object} flightConfiguration - Current flight setup
   * @returns {Boolean} True if should auto-trigger
   */
  shouldAutoTrigger(flightConfiguration) {
    // Only trigger if:
    // 1. Not already processing
    // 2. Has passenger overload
    // 3. Auto-optimization is enabled in settings
    // 4. Haven't already suggested for this configuration

    if (this.isProcessing) return false;

    const passengerAnalysis = this.analyzePassengerRequirements(flightConfiguration);
    if (!passengerAnalysis.hasOverload) return false;

    const autoOptimizeEnabled = flightConfiguration.settings?.autoOptimizeFuelStops !== false;
    if (!autoOptimizeEnabled) return false;

    // Simple check to avoid duplicate suggestions (could be enhanced)
    if (this.lastSuggestions && this.lastSuggestions.overloadAnalysis?.maxShortage === passengerAnalysis.maxShortage) {
      return false;
    }

    return true;
  }
}

export default FuelStopOptimizationManager;