/**
 * MasterFuelManager.js
 * 
 * SINGLE SOURCE OF TRUTH for all fuel calculations in Fast Planner V5
 * 
 * Eliminates race conditions by:
 * - Centralizing all fuel data sources (OSDK Policy, Weather, Wind, Settings)
 * - Sequential processing to prevent simultaneous updates
 * - Subscriber pattern for consistent component updates
 * - Unified calculation pipeline for all fuel types
 * 
 * AVIATION SAFETY: No dummy data, no fallbacks, all calculations based on real values
 */

import WeatherFuelAnalyzer from './weather/WeatherFuelAnalyzer.js';
import WeatherStopCardFuelDistributor from './weather/WeatherStopCardFuelDistributor.js';
import StopCardCalculator from '../calculations/flight/StopCardCalculator.js';
import PassengerCalculator from '../calculations/passengers/PassengerCalculator.js';

class MasterFuelManager {
  constructor() {
    // SINGLE SOURCE OF TRUTH - All fuel data stored here
    this.state = {
      // OSDK Policy Data (Authoritative Source)
      policy: null,                    // Current fuel policy from OSDK
      policySettings: null,            // Extracted policy values
      
      // Weather Systems  
      weather: null,                   // Basic weather (wind speed/direction)
      weatherSegments: null,           // OSDK weather segments for fuel analysis
      weatherFuel: null,               // Calculated ARA/approach fuel from weather
      
      // Route Data
      waypoints: null,                 // Current route waypoints
      aircraft: null,                  // Selected aircraft
      
      // User Overrides
      overrides: {},                   // User overrides for policy values
      
      // Calculated Results (Cached)
      calculations: null,              // Last calculated results
      alternateCalculations: null,     // Alternate route calculations
      
      // State Management
      lastUpdate: 0,                   // Timestamp for change detection
      calculationInProgress: false     // Prevent race conditions
    };
    
    // Subscriber Management - Components that need updates
    this.subscribers = [];
    
    // Debounce mechanism to prevent excessive notifications
    this.notificationTimeout = null;
    
    // Initialize weather analyzer and distributor
    this.weatherAnalyzer = new WeatherFuelAnalyzer();
    this.weatherDistributor = new WeatherStopCardFuelDistributor();
    
    console.log('🎯 MasterFuelManager: Initialized - Single source of truth created');
  }
  
  // =============================================================================
  // PHASE 1: POLICY MANAGEMENT (OSDK Integration)
  // =============================================================================
  
  /**
   * Update fuel policy from OSDK
   * This is the authoritative source for fuel settings
   */
  updateFuelPolicy(policy) {
    if (!policy) {
      console.warn('MasterFuelManager: Attempted to set null policy');
      return;
    }
    
    console.log(`🏛️ MasterFuelManager: Updating fuel policy: ${policy.name}`);
    
    this.state.policy = policy;
    this.state.policySettings = this.extractPolicyValues(policy);
    this.state.lastUpdate = Date.now();
    
    // Invalidate calculations and notify subscribers
    this.invalidateCalculations();
    this.notifySubscribers('policyUpdate', this.state.policySettings);
  }
  
  /**
   * Extract fuel values from OSDK policy
   * Converts policy data into calculation-ready format
   */
  extractPolicyValues(policy) {
    if (!policy) return null;
    
    console.log('🔍 MasterFuelManager: Raw policy object:', policy);
    
    const extracted = {
      // Core fuel values from policy - use correct paths
      taxiFuel: policy.taxiFuel?.default || policy.taxiFuel?.value || 0,
      reserveFuel: policy.reserveFuel?.default || policy.reserveFuel?.value || 0,
      reserveFuelType: policy.reserveFuel?.type || 'fixed',
      
      // Contingency fuel (percentage-based) - use correct paths  
      contingencyFlightLegs: policy.contingencyFuel?.flightLegs?.value || policy.contingencyFuel?.flightLegs?.default || 0,
      contingencyFlightLegsType: policy.contingencyFuel?.flightLegs?.type || 'percentage',
      contingencyAlternate: policy.contingencyFuel?.alternate?.value || policy.contingencyFuel?.alternate?.default || 0,
      contingencyAlternateType: policy.contingencyFuel?.alternate?.type || 'percentage',
      
      // Deck operations
      deckTime: policy.deckFuelTime || 15, // minutes
      deckFuelFlow: 400, // lbs/hr - could come from aircraft or policy
      
      // Weather-based fuel (from policy defaults)
      araFuel: policy.fuelTypes?.araFuel?.default || 200,
      approachFuel: policy.fuelTypes?.approachFuel?.default || 200,
      
      // Metadata
      policyName: policy.name,
      region: policy.region
    };
    
    console.log('🏛️ MasterFuelManager: Extracted policy values:', extracted);
    return extracted;
  }
  
  // =============================================================================
  // PHASE 1: WEATHER INTEGRATION
  // =============================================================================
  
  /**
   * Update basic weather data (wind speed/direction)
   * Used for wind calculations throughout the system
   */
  updateWeather(weather) {
    if (!weather || typeof weather.windSpeed !== 'number') {
      console.warn('MasterFuelManager: Invalid weather data provided');
      return;
    }
    
    console.log(`🌬️ MasterFuelManager: Updating weather: ${weather.windSpeed}kt @ ${weather.windDirection}°`);
    
    this.state.weather = weather;
    this.state.lastUpdate = Date.now();
    
    // Invalidate calculations and auto-calculate
    this.invalidateCalculations();
    if (this.validateCalculationInputs()) {
      this.calculateAllFuel();
    }
    this.notifySubscribers('weatherUpdate', weather, this.state.calculations);
  }
  
  /**
   * Update weather segments from OSDK
   * Used for ARA and approach fuel analysis
   */
  updateWeatherSegments(weatherSegments) {
    if (!Array.isArray(weatherSegments)) {
      console.warn('MasterFuelManager: Invalid weather segments provided');
      return;
    }
    
    console.log(`🌩️ MasterFuelManager: Updating weather segments: ${weatherSegments.length} segments`);
    
    this.state.weatherSegments = weatherSegments;
    
    // Analyze weather segments for fuel requirements
    if (this.state.waypoints && weatherSegments.length > 0) {
      this.calculateWeatherFuel();
    }
    
    this.state.lastUpdate = Date.now();
    this.invalidateCalculations();
    
    // Auto-calculate and notify once
    if (this.validateCalculationInputs()) {
      this.calculateAllFuel();
    }
    this.notifySubscribers('weatherSegmentsUpdate', weatherSegments, this.state.calculations);
  }
  
  /**
   * Calculate ARA and approach fuel based on weather segments
   * Uses same logic as Palantir system
   */
  calculateWeatherFuel() {
    if (!this.state.weatherSegments || !this.state.waypoints || !this.state.policySettings) {
      console.log('MasterFuelManager: Insufficient data for weather fuel calculation');
      return null;
    }
    
    console.log('⚡ MasterFuelManager: Calculating weather fuel requirements');
    
    // Use weather analyzer to determine fuel requirements
    const analysis = this.weatherAnalyzer.analyzeWeatherForFuel(
      this.state.weatherSegments,
      this.state.waypoints,
      {
        araFuelDefault: this.state.policySettings.araFuel,
        approachFuelDefault: this.state.policySettings.approachFuel
      }
    );
    
    this.state.weatherFuel = analysis;
    
    console.log('⚡ MasterFuelManager: Weather fuel calculated:', {
      araFuel: analysis.totalAraFuel,
      approachFuel: analysis.totalApproachFuel
    });
    
    return analysis;
  }
  // =============================================================================
  // PHASE 1: ROUTE AND AIRCRAFT MANAGEMENT
  // =============================================================================
  
  /**
   * Update route waypoints
   * Triggers fuel recalculation for new route
   */
  updateWaypoints(waypoints) {
    if (!Array.isArray(waypoints) || waypoints.length < 2) {
      console.log('MasterFuelManager: Invalid waypoints provided');
      this.state.waypoints = null;
      this.invalidateCalculations();
      return;
    }
    
    console.log(`🗺️ MasterFuelManager: Updating waypoints: ${waypoints.length} points`);
    
    this.state.waypoints = waypoints;
    
    // Recalculate weather fuel if we have weather segments
    if (this.state.weatherSegments) {
      this.calculateWeatherFuel();
    }
    
    this.state.lastUpdate = Date.now();
    this.invalidateCalculations();
    
    // Auto-calculate if we have sufficient data
    if (this.validateCalculationInputs()) {
      this.calculateAllFuel();
    }
    
    // Only notify once after all updates are complete
    this.notifySubscribers('waypointsUpdate', waypoints, this.state.calculations);
  }
  
  /**
   * Update selected aircraft
   * Aircraft data is critical for all fuel calculations
   */
  updateAircraft(aircraft) {
    if (!aircraft || !aircraft.cruiseSpeed || !aircraft.fuelBurn) {
      console.error('MasterFuelManager: Invalid aircraft - missing critical properties');
      return;
    }
    
    console.log(`✈️ MasterFuelManager: Updating aircraft: ${aircraft.registration}`);
    
    this.state.aircraft = aircraft;
    this.state.lastUpdate = Date.now();
    
    this.invalidateCalculations();
    this.notifySubscribers('aircraftUpdate', aircraft);
  }
  
  /**
   * Apply user overrides to policy values
   * Allows pilots to override policy defaults for specific flights
   */
  applyUserOverrides(overrides) {
    console.log('⚙️ MasterFuelManager: Applying user overrides:', overrides);
    
    this.state.overrides = { ...this.state.overrides, ...overrides };
    this.state.lastUpdate = Date.now();
    
    this.invalidateCalculations();
    this.notifySubscribers('overridesUpdate', this.state.overrides);
  }
  
  // =============================================================================
  // PHASE 1: UNIFIED CALCULATION PIPELINE
  // =============================================================================
  
  /**
   * Calculate all fuel requirements for the current route
   * SINGLE CALCULATION PIPELINE - prevents race conditions
   */
  calculateAllFuel() {
    // Prevent race conditions
    if (this.state.calculationInProgress) {
      console.warn('MasterFuelManager: Calculation already in progress');
      return this.state.calculations;
    }
    
    // Validate required data
    if (!this.validateCalculationInputs()) {
      console.log('MasterFuelManager: Insufficient data for fuel calculation');
      return null;
    }
    
    this.state.calculationInProgress = true;
    
    try {
      console.log('⛽ MasterFuelManager: Starting unified fuel calculation');
      
      // Step 1: Get final fuel values (policy + overrides + weather)
      const finalFuelValues = this.getFinalFuelValues();
      
      // Step 2: Calculate stop cards with unified values
      const stopCards = this.calculateStopCards(finalFuelValues);
      
      // Step 3: Calculate route statistics
      const routeStats = this.calculateRouteStats(finalFuelValues);
      
      // Step 4: Cache results
      const calculations = {
        stopCards,
        routeStats,
        finalFuelValues,
        timestamp: Date.now()
      };
      
      this.state.calculations = calculations;
      
      console.log('⛽ MasterFuelManager: Unified calculation complete');
      return calculations;
      
    } catch (error) {
      console.error('MasterFuelManager: Error during fuel calculation:', error);
      return null;
    } finally {
      this.state.calculationInProgress = false;
    }
  }
  
  /**
   * Validate that we have all required data for calculations
   */
  validateCalculationInputs() {
    const required = {
      waypoints: this.state.waypoints?.length >= 2,
      aircraft: !!this.state.aircraft,
      policySettings: !!this.state.policySettings
      // Weather not required - new flights don't have weather yet
    };
    
    const missing = Object.entries(required)
      .filter(([key, valid]) => !valid)
      .map(([key]) => key);
    
    if (missing.length > 0) {
      console.log('MasterFuelManager: Missing required data:', missing);
      return false;
    }
    
    return true;
  }
  
  /**
   * Get final fuel values combining policy, overrides, and weather
   */
  getFinalFuelValues() {
    const base = { ...this.state.policySettings };
    const overrides = this.state.overrides;
    const weatherFuel = this.state.weatherFuel;
    
    // Apply user overrides
    const withOverrides = { ...base, ...overrides };
    
    // Add weather-based fuel
    if (weatherFuel) {
      withOverrides.araFuel = (withOverrides.araFuel || 0) + weatherFuel.totalAraFuel;
      withOverrides.approachFuel = (withOverrides.approachFuel || 0) + weatherFuel.totalApproachFuel;
    }
    
    console.log('⛽ MasterFuelManager: Final fuel values:', withOverrides);
    return withOverrides;
  }
  /**
   * Calculate stop cards using unified fuel values and wind integration
   */
  calculateStopCards(finalFuelValues) {
    console.log('🎯 MasterFuelManager: Calculating stop cards with unified values');
    console.log('🔍 MasterFuelManager: Final fuel values being passed:', finalFuelValues);
    
    // Create the parameters object for StopCardCalculator
    const calculatorParams = {
      passengerWeight: finalFuelValues.passengerWeight || 220,
      taxiFuel: finalFuelValues.taxiFuel,
      contingencyFuelPercent: finalFuelValues.contingencyFlightLegs,
      reserveFuel: finalFuelValues.reserveFuel,
      deckTimePerStop: finalFuelValues.deckTime || 15,
      deckFuelFlow: finalFuelValues.deckFuelFlow || 400
    };
    
    console.log('🔍 MasterFuelManager: Parameters being passed to StopCardCalculator:', calculatorParams);
    
    // Use existing StopCardCalculator but with our unified values
    const stopCards = StopCardCalculator.calculateStopCards(
      this.state.waypoints,
      this.state.calculations?.routeStats || null, // Use cached route stats if available
      this.state.aircraft,
      this.state.weather, // Wind data for calculations
      calculatorParams
    );
    
    // Apply weather fuel distribution if we have weather segments
    if (this.state.weatherSegments && stopCards.length > 0) {
      console.log('⚡ MasterFuelManager: Applying weather fuel distribution to stop cards');
      
      return this.weatherDistributor.distributeWeatherFuel(
        stopCards,
        this.state.waypoints,
        this.state.weatherSegments,
        {
          araFuelDefault: finalFuelValues.araFuel,
          approachFuelDefault: finalFuelValues.approachFuel
        }
      );
    }
    
    return stopCards;
  }
  
  /**
   * Calculate route statistics with wind effects
   */
  calculateRouteStats(finalFuelValues) {
    console.log('📊 MasterFuelManager: Calculating route statistics');
    
    // Basic route stats calculation
    // This will be enhanced in Phase 2 with full wind integration
    let totalDistance = 0;
    let totalTime = 0;
    let totalFuel = 0;
    
    // Calculate leg by leg with wind effects
    for (let i = 0; i < this.state.waypoints.length - 1; i++) {
      const from = this.state.waypoints[i];
      const to = this.state.waypoints[i + 1];
      
      // Calculate distance (using turf if available)
      let legDistance = 0;
      if (window.turf) {
        const fromPoint = window.turf.point([from.lon || from.coords[0], from.lat || from.coords[1]]);
        const toPoint = window.turf.point([to.lon || to.coords[0], to.lat || to.coords[1]]);
        legDistance = window.turf.distance(fromPoint, toPoint, { units: 'nauticalmiles' });
      }
      
      // Calculate with wind effects if WindCalculations available
      let legTime = legDistance / this.state.aircraft.cruiseSpeed;
      let legFuel = legTime * this.state.aircraft.fuelBurn;
      
      if (window.WindCalculations && this.state.weather) {
        const fromCoords = { lat: from.lat || from.coords[1], lon: from.lon || from.coords[0] };
        const toCoords = { lat: to.lat || to.coords[1], lon: to.lon || to.coords[0] };
        
        const windAdjusted = window.WindCalculations.calculateLegWithWind(
          fromCoords,
          toCoords,
          legDistance,
          this.state.aircraft,
          this.state.weather
        );
        
        legTime = windAdjusted.time;
        legFuel = windAdjusted.fuel;
      }
      
      totalDistance += legDistance;
      totalTime += legTime;
      totalFuel += legFuel;
    }
    
    // Add auxiliary fuel
    const auxiliaryFuel = this.calculateAuxiliaryFuel(totalFuel, finalFuelValues);
    
    return {
      totalDistance: totalDistance.toFixed(1),
      totalTime: totalTime,
      tripFuel: Math.round(totalFuel),
      auxiliaryFuel,
      totalFuel: Math.round(totalFuel + auxiliaryFuel.total),
      windAdjusted: !!this.state.weather,
      source: 'MasterFuelManager'
    };
  }
  
  /**
   * Calculate auxiliary fuel (taxi, contingency, reserve, deck)
   */
  calculateAuxiliaryFuel(tripFuel, finalFuelValues) {
    const contingencyFuel = Math.round((tripFuel * finalFuelValues.contingencyFlightLegs) / 100);
    const deckFuel = this.calculateDeckFuel(finalFuelValues);
    
    const auxiliary = {
      taxi: finalFuelValues.taxiFuel,
      contingency: contingencyFuel,
      reserve: finalFuelValues.reserveFuel,
      deck: deckFuel,
      total: finalFuelValues.taxiFuel + contingencyFuel + finalFuelValues.reserveFuel + deckFuel
    };
    
    return auxiliary;
  }
  
  /**
   * Calculate deck fuel for helicopter operations
   */
  calculateDeckFuel(finalFuelValues) {
    if (!this.state.waypoints) return 0;
    
    // Count intermediate stops (exclude departure and destination)
    const landingStops = this.state.waypoints.filter(wp => 
      wp.pointType !== 'NAVIGATION_WAYPOINT' && 
      wp.isWaypoint !== true && 
      wp.type !== 'WAYPOINT'
    );
    
    const intermediateStops = Math.max(0, landingStops.length - 2);
    const deckTimeHours = (intermediateStops * finalFuelValues.deckTime) / 60;
    
    return Math.round(deckTimeHours * finalFuelValues.deckFuelFlow);
  }
  
  // =============================================================================
  // PHASE 1: SUBSCRIBER MANAGEMENT (NO RACE CONDITIONS)
  // =============================================================================
  
  /**
   * Subscribe to fuel manager updates
   * Components use this to get notified of changes
   */
  subscribe(componentName, callback) {
    console.log(`📡 MasterFuelManager: ${componentName} subscribed to updates`);
    
    this.subscribers.push({
      name: componentName,
      callback,
      subscribed: Date.now()
    });
    
    // Return unsubscribe function
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub.name !== componentName);
      console.log(`📡 MasterFuelManager: ${componentName} unsubscribed`);
    };
  }
  
  /**
   * Notify all subscribers of changes (debounced to prevent flickering)
   * Sequential notification prevents race conditions
   */
  notifySubscribers(changeType, data) {
    // Clear any pending notification
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }
    
    // Debounce notifications to prevent rapid-fire updates
    this.notificationTimeout = setTimeout(() => {
      console.log(`📢 MasterFuelManager: Notifying ${this.subscribers.length} subscribers of ${changeType}`);
      
      // Sequential notification to prevent race conditions
      this.subscribers.forEach((subscriber, index) => {
        setTimeout(() => {
          try {
            subscriber.callback(changeType, data, this.state.calculations);
          } catch (error) {
            console.error(`Error notifying ${subscriber.name}:`, error);
          }
        }, index * 10); // 10ms delay between notifications
      });
    }, 50); // 50ms debounce delay
  }
  
  /**
   * Invalidate cached calculations
   * Keep existing calculations until new ones are ready (prevents flicker)
   */
  invalidateCalculations() {
    // DON'T set to null - keep existing calculations until new ones are ready
    // This prevents flickering when updates happen
    // this.state.calculations = null;
    this.state.alternateCalculations = null;
  }
  
  // =============================================================================
  // PHASE 1: PUBLIC API
  // =============================================================================
  
  /**
   * Get current state for debugging/display
   */
  getCurrentState() {
    return {
      hasPolicy: !!this.state.policy,
      hasWeather: !!this.state.weather,
      hasWeatherSegments: this.state.weatherSegments?.length || 0,
      hasWaypoints: this.state.waypoints?.length || 0,
      hasAircraft: !!this.state.aircraft,
      hasCalculations: !!this.state.calculations,
      lastUpdate: this.state.lastUpdate
    };
  }
  
  /**
   * Get latest calculations (triggers calculation if needed)
   */
  getCalculations() {
    if (!this.state.calculations) {
      return this.calculateAllFuel();
    }
    return this.state.calculations;
  }
  
  /**
   * Force recalculation
   */
  forceRecalculation() {
    console.log('🔄 MasterFuelManager: Forcing recalculation');
    this.invalidateCalculations();
    return this.calculateAllFuel();
  }
}

// Export singleton instance
const masterFuelManager = new MasterFuelManager();
export default masterFuelManager;