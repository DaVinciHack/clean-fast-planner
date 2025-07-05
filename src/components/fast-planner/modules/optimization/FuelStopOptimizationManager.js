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
      onProcessingUpdate: null,
      onDebugUpdate: null
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
      this.notifyDebug('Validation', '🔍 Validating flight configuration...');
      const validationResult = this.validateFlightConfiguration(flightConfiguration);
      if (!validationResult.isValid) {
        this.notifyDebug('Validation Failed', `❌ ${validationResult.reason}`);
        return { success: false, reason: validationResult.reason };
      }

      // Extract passenger requirements
      this.notifyDebug('Analysis', '🔍 Analyzing passenger requirements...');
      console.log('🔍 ANALYZING with config:', {
        stopCards: flightConfiguration.stopCards?.length,
        stopRequests: flightConfiguration.stopRequests?.length,
        overloadedStops: flightConfiguration.overloadedStops?.length,
        firstStopRequest: flightConfiguration.stopRequests?.[0]
      });
      
      const passengerAnalysis = this.analyzePassengerRequirements(flightConfiguration);
      console.log('🔍 PASSENGER ANALYSIS RESULT:', passengerAnalysis);
      
      if (!passengerAnalysis.hasOverload) {
        this.notifyDebug('No Overload', '✅ No weight overload detected');
        console.log('FuelStopOptimizationManager: No passenger overload detected');
        return { success: false, reason: 'No passenger overload' };
      }

      this.notifyDebug('Overload Found', `⚠️ ${passengerAnalysis.affectedStops} stops need ${passengerAnalysis.maxWeightShortage} lbs more capacity`);
      console.log('FuelStopOptimizationManager: Passenger overload detected, finding solutions...');

      // Get all available platforms/locations for search
      this.notifyDebug('Platform Search', '🗺️ Loading available fuel platforms...');
      const allLocations = this.extractAllLocations(flightConfiguration);
      
      // Count fuel-capable platforms using proper evaluation
      const fuelPlatforms = allLocations.allManagerPlatforms?.filter(p => 
        this.platformEvaluator.hasFuelCapability(p)
      ) || [];
      this.notifyDebug('Fuel Platforms', `🛢️ Found ${fuelPlatforms.length} fuel-capable platforms`);
      if (fuelPlatforms.length > 0) {
        this.notifyDebug('Platform List', `📋 Examples: ${fuelPlatforms.slice(0, 3).map(p => p.name).join(', ')}...`);
      }
      
      // Prepare optimization data
      const optimizationData = {
        ...flightConfiguration,
        requiredPassengers: passengerAnalysis.requiredPassengers,
        availablePlatforms: this.platformEvaluator.findFuelCapableRigs(allLocations, null),
        stopCards: flightConfiguration.stopCards || [],
        alternateSplitPoint: flightConfiguration.alternateRouteData?.splitPoint || null
      };

      // Run optimization
      this.notifyDebug('Route Analysis', '🛩️ Analyzing flight route for optimization...');
      console.log('🔍 ABOUT TO CALL OPTIMIZER.suggestFuelStops with data:', {
        waypoints: optimizationData.waypoints?.length,
        availablePlatforms: optimizationData.availablePlatforms?.length,
        stopCards: optimizationData.stopCards?.length,
        hasSelectedAircraft: !!optimizationData.selectedAircraft
      });
      
      const optimizationResult = await this.optimizer.suggestFuelStops(optimizationData);
      
      console.log('🔍 OPTIMIZER RETURNED:', optimizationResult);

      if (optimizationResult.success && optimizationResult.suggestions.length > 0) {
        this.notifyDebug('Success', `🎉 Found ${optimizationResult.suggestions.length} optimization options!`);
        optimizationResult.suggestions.forEach((suggestion, i) => {
          this.notifyDebug(`Option ${i + 1}`, `${suggestion.platform.name} (+${suggestion.passengerGain} passengers, ${suggestion.fuelSavings}lbs fuel saved)`);
        });
        
        this.lastSuggestions = optimizationResult;
        this.notifySuggestions(optimizationResult);
        
        console.log(`FuelStopOptimizationManager: Found ${optimizationResult.suggestions.length} fuel stop options`);
        return optimizationResult;
      } else {
        this.notifyDebug('No Options', '❌ No viable fuel stops found within 100nm of route');
        console.log('FuelStopOptimizationManager: No viable fuel stop options found');
        this.notifyError('No suitable fuel stops found within 100nm of route');
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
   * Analyzes passenger WEIGHT requirements vs capacity (AVIATION LOGIC)
   * @param {Object} config - Flight configuration
   * @returns {Object} Weight overload analysis
   */
  analyzePassengerRequirements(config) {
    // Get the overloaded stops that were passed from the UI (weight-based analysis)
    const overloadedStops = config.overloadedStops || [];
    
    if (overloadedStops.length === 0) {
      return { hasOverload: false, reason: 'No weight overload detected' };
    }

    // Calculate weight shortage from the stop cards
    let maxWeightShortage = 0;
    const detailedOverload = [];
    
    config.stopCards.forEach(card => {
      if (card.isDestination) return; // Skip final destinations
      
      // Get passenger requests from the flight configuration  
      const stopName = card.name || card.stopName;
      const requestedWeight = this.getPassengerRequest(config, stopName, 'totalWeight');
      const requestedCount = this.getPassengerRequest(config, stopName, 'passengerCount');
      const availableWeight = card.availableWeight || card.maxPassengersWeight || 0;
      const aircraftMaxSeats = config.selectedAircraft?.maxPassengers || 19;
      
      const isWeightOverloaded = requestedWeight > availableWeight;
      const isSeatingOverloaded = requestedCount > aircraftMaxSeats;
      
      if (isWeightOverloaded && !isSeatingOverloaded) {
        const weightShortage = requestedWeight - availableWeight;
        maxWeightShortage = Math.max(maxWeightShortage, weightShortage);
        detailedOverload.push({
          stopName,
          requestedWeight,
          availableWeight,
          weightShortage,
          canOptimize: true
        });
      }
    });

    if (detailedOverload.length === 0) {
      return { hasOverload: false, reason: 'No optimizable weight overload found' };
    }

    return {
      hasOverload: true,
      maxWeightShortage,
      overloadedStops: detailedOverload,
      affectedStops: detailedOverload.length,
      overloadType: 'weight'
    };
  }

  /**
   * Helper to get passenger request data from flight configuration
   * @param {Object} config - Flight configuration
   * @param {string} stopName - Stop name
   * @param {string} requestType - Request type (passengerCount, totalWeight)
   * @returns {number} Request value
   */
  getPassengerRequest(config, stopName, requestType) {
    // Try to get from stopRequests if available
    const stopRequest = config.stopRequests?.find(req => req.stopName === stopName);
    if (stopRequest) {
      return requestType === 'passengerCount' ? stopRequest.requestedPassengers : stopRequest.requestedWeight;
    }
    
    // Fallback to flightConfiguration passenger data
    return 0;
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
      if (config.platformManager.getPlatforms) {
        try {
          allLocations.allManagerPlatforms = config.platformManager.getPlatforms();
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
   * Notifies about debug updates
   * @param {String} step - Debug step name
   * @param {String} message - Debug message
   */
  notifyDebug(step, message) {
    if (this.callbacks.onDebugUpdate) {
      this.callbacks.onDebugUpdate({ step, message, timestamp: Date.now() });
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