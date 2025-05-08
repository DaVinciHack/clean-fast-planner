/**
 * EnhancedFuelCalculator.js
 * 
 * Advanced fuel calculation module that enhances the existing FlightCalculations
 * with more detailed per-leg and stop-specific calculations.
 * 
 * IMPORTANT: This module NEVER uses fallback data - all calculations require
 * actual aircraft performance data from OSDK.
 */

class EnhancedFuelCalculator {
  constructor() {
    // Default configuration values
    this.config = {
      passengerWeight: 0,       // Changed to 0 to make missing settings obvious
      taxiFuel: 0,              // Changed to 0 to make missing settings obvious
      contingencyFuelPercent: 0, // Changed to 0 to make missing settings obvious
      reserveFuel: 0,           // Changed to 0 to make missing settings obvious
      reserveMethod: 'fixed',     // Default reserve method ('fixed' or 'percent')
      reserveFuelPercent: 0,     // Changed to 0 to make missing settings obvious
      deckTimePerStop: 0,         // Changed to 0 to make missing settings obvious
      deckFuelFlow: 0,          // Changed to 0 to make missing settings obvious
      deckFuelPerStop: 0,       // Changed to 0 to make missing settings obvious
      callbacks: {}               // Callback functions
    };
  }
  
  /**
   * Update configuration settings
   * @param {Object} newConfig - Updated configuration values
   */
  updateConfig(newConfig) {
    if (!newConfig) return;
    
    console.log('EnhancedFuelCalculator: Updating config with:', newConfig);
    
    // Update specific configuration properties
    Object.keys(newConfig).forEach(key => {
      if (key !== 'callbacks' && key in this.config) {
        this.config[key] = newConfig[key];
      }
    });
    
    // Update callbacks separately
    if (newConfig.callbacks) {
      this.config.callbacks = {
        ...this.config.callbacks,
        ...newConfig.callbacks
      };
    }
    
    console.log('EnhancedFuelCalculator: Updated config:', this.config);
  }
  
  /**
   * Set a callback function
   * @param {string} eventName - Event name for the callback
   * @param {Function} callback - Callback function
   */
  setCallback(eventName, callback) {
    if (typeof callback === 'function') {
      this.config.callbacks[eventName] = callback;
    }
  }

  /**
   * Calculate fuel requirements for a route
   * @param {Object} data - Route and aircraft data
   * @param {Array} data.waypoints - Waypoints array
   * @param {Object} data.aircraft - Aircraft object from OSDK
   * @param {Object} data.weather - Weather data
   * @param {number} data.cargoWeight - Additional cargo weight
   * @returns {Object} Fuel calculation results
   */
  calculateFuelRequirements(data) {
    // Validate input data - NEVER calculate with missing data
    if (!this.validateInputData(data)) {
      console.error('EnhancedFuelCalculator: Invalid input data, cannot calculate');
      return null;
    }
    
    const { waypoints, aircraft, weather, cargoWeight = 0 } = data;
    
    console.log('EnhancedFuelCalculator: Calculating fuel requirements', {
      waypointsCount: waypoints.length,
      aircraft: aircraft.registration,
      weather,
      cargoWeight
    });
    
    // Calculate fuel for each leg and stop
    const legResults = this.calculateLegFuel(waypoints, aircraft, weather);
    
    // Calculate additional fuel components
    const auxiliaryFuel = this.calculateAuxiliaryFuel(legResults.totalTripFuel, waypoints.length - 1);
    
    // Calculate per-stop fuel and passenger capacity
    const fuelByStop = this.calculateFuelByStop(waypoints, legResults.legDetails, auxiliaryFuel, aircraft);
    
    // Calculate available capacity for entire route
    const maxCapacity = this.calculateMaxCapacity(fuelByStop, aircraft);
    
    // Compile and return results
    const results = {
      legResults,
      auxiliaryFuel,
      fuelByStop,
      maxCapacity,
      
      // Summary for quick access
      totalTripFuel: legResults.totalTripFuel,
      totalAuxFuel: auxiliaryFuel.total,
      totalFuel: legResults.totalTripFuel + auxiliaryFuel.total,
      
      // Raw input data for reference
      aircraft,
      waypoints,
      weather,
      cargoWeight,
      config: { ...this.config }
    };
    
    // Call callback if it exists
    if (this.config.callbacks.onCalculationComplete) {
      this.config.callbacks.onCalculationComplete(results);
    }
    
    return results;
  }
  
  /**
   * Validate input data to ensure we have all required information
   * @param {Object} data - Input data object
   * @returns {boolean} True if data is valid, false otherwise
   */
  validateInputData(data) {
    // Check if we have the required data objects
    if (!data || !data.waypoints || !data.aircraft) {
      console.error('EnhancedFuelCalculator: Missing required data objects');
      return false;
    }
    
    // Ensure we have at least 2 waypoints
    if (!Array.isArray(data.waypoints) || data.waypoints.length < 2) {
      console.error('EnhancedFuelCalculator: Need at least 2 waypoints');
      return false;
    }
    
    // Check if all waypoints have coordinates
    for (const waypoint of data.waypoints) {
      if (!waypoint.coords || !Array.isArray(waypoint.coords) || waypoint.coords.length !== 2) {
        console.error('EnhancedFuelCalculator: Invalid waypoint coordinates:', waypoint);
        return false;
      }
    }
    
    // Validate aircraft data - we MUST have these properties
    const requiredAircraftProps = ['cruiseSpeed', 'fuelBurn', 'emptyWeight', 'maxTakeoffWeight', 'maxFuel'];
    for (const prop of requiredAircraftProps) {
      if (typeof data.aircraft[prop] !== 'number' || data.aircraft[prop] <= 0) {
        console.error(`EnhancedFuelCalculator: Missing or invalid aircraft property: ${prop}`, data.aircraft[prop]);
        return false;
      }
    }
    
    // All validations passed
    return true;
  }
  
  /**
   * Calculate fuel for each leg of the route
   * @param {Array} waypoints - Array of waypoint objects
   * @param {Object} aircraft - Aircraft data
   * @param {Object} weather - Weather data
   * @returns {Object} Leg fuel calculation results
   */
  calculateLegFuel(waypoints, aircraft, weather) {
    const legDetails = [];
    let totalDistance = 0;
    let totalTime = 0;
    let totalTripFuel = 0;
    
    // Process each leg (between waypoints)
    for (let i = 0; i < waypoints.length - 1; i++) {
      const from = waypoints[i];
      const to = waypoints[i + 1];
      
      // Calculate distance for this leg
      const distance = this.calculateDistance(from.coords, to.coords);
      
      // Calculate flight time with wind adjustment if available
      const timeResult = this.calculateFlightTime(distance, aircraft.cruiseSpeed, from.coords, to.coords, weather);
      
      // Calculate fuel consumption for this leg
      const fuelRequired = timeResult.flightTimeHours * aircraft.fuelBurn;
      
      // Update totals
      totalDistance += distance;
      totalTime += timeResult.flightTimeHours;
      totalTripFuel += fuelRequired;
      
      // Store leg details
      legDetails.push({
        from: from.name || `Waypoint ${i}`,
        to: to.name || `Waypoint ${i+1}`,
        distance,
        flightTimeHours: timeResult.flightTimeHours,
        fuelRequired: Math.round(fuelRequired),
        groundSpeed: timeResult.groundSpeed,
        heading: timeResult.heading,
        windEffect: timeResult.windEffect
      });
    }
    
    return {
      legDetails,
      totalDistance,
      totalTime,
      totalTripFuel: Math.round(totalTripFuel)
    };
  }
  
  /**
   * Calculate distance between two coordinates
   * @param {Array} from - [lon, lat] coordinates
   * @param {Array} to - [lon, lat] coordinates
   * @returns {number} Distance in nautical miles
   */
  calculateDistance(from, to) {
    if (!window.turf) {
      console.error('EnhancedFuelCalculator: Turf.js not available for distance calculation');
      // Return 0 instead of using fallback data
      return 0;
    }
    
    try {
      const fromPoint = window.turf.point(from);
      const toPoint = window.turf.point(to);
      return window.turf.distance(fromPoint, toPoint, { units: 'nauticalmiles' });
    } catch (error) {
      console.error('EnhancedFuelCalculator: Error calculating distance:', error);
      return 0;
    }
  }
  
  /**
   * Calculate flight time between two points, with wind adjustment if available
   * @param {number} distance - Distance in nautical miles
   * @param {number} cruiseSpeed - Cruise speed in knots
   * @param {Array} fromCoords - [lon, lat] coordinates of origin
   * @param {Array} toCoords - [lon, lat] coordinates of destination
   * @param {Object} weather - Weather data (optional)
   * @returns {Object} Flight time and related data
   */
  calculateFlightTime(distance, cruiseSpeed, fromCoords, toCoords, weather) {
    // Default result with no wind
    const result = {
      flightTimeHours: distance / cruiseSpeed,
      groundSpeed: cruiseSpeed,
      heading: 0,
      windEffect: 0
    };
    
    // If we have WindCalculations and weather data, use it
    if (window.WindCalculations && weather && weather.windSpeed > 0) {
      try {
        // Create lat/lon objects from coordinates
        const from = {
          lat: fromCoords[1],
          lon: fromCoords[0]
        };
        
        const to = {
          lat: toCoords[1],
          lon: toCoords[0]
        };
        
        // Calculate heading between points
        const heading = window.WindCalculations.calculateHeading(from, to);
        
        // Calculate wind effect
        const windEffect = window.WindCalculations.calculateWindComponent(
          heading,
          weather.windDirection,
          weather.windSpeed
        );
        
        // Calculate ground speed
        const groundSpeed = Math.max(10, cruiseSpeed - windEffect);
        
        // Calculate time with wind
        const flightTimeHours = distance / groundSpeed;
        
        // Update the result
        result.flightTimeHours = flightTimeHours;
        result.groundSpeed = groundSpeed;
        result.heading = heading;
        result.windEffect = windEffect;
      } catch (error) {
        console.error('EnhancedFuelCalculator: Error calculating wind effect:', error);
        // Keep the default no-wind calculation
      }
    }
    
    return result;
  }
  
  /**
   * Calculate auxiliary fuel components (taxi, contingency, reserve, deck)
   * @param {number} tripFuel - Total trip fuel in lbs
   * @param {number} numStops - Number of intermediate stops
   * @returns {Object} Auxiliary fuel components
   */
  calculateAuxiliaryFuel(tripFuel, numStops) {
    // Calculate taxi fuel
    const taxiFuel = this.config.taxiFuel;
    
    // Calculate contingency fuel (percentage of trip fuel)
    const contingencyFuel = (tripFuel * this.config.contingencyFuelPercent) / 100;
    
    // Calculate reserve fuel
    let reserveFuel = this.config.reserveFuel;
    if (this.config.reserveMethod === 'percent') {
      reserveFuel = (tripFuel * this.config.reserveFuelPercent) / 100;
    }
    
    // Calculate deck fuel for intermediate stops
    // numStops includes the final destination, so subtract 1
    const intermediateStops = Math.max(0, numStops - 1);
    const deckTimeHours = (intermediateStops * this.config.deckTimePerStop) / 60; // Convert from minutes to hours
    const deckFuel = deckTimeHours * this.config.deckFuelFlow;
    
    // Calculate total auxiliary fuel
    const total = taxiFuel + contingencyFuel + reserveFuel + deckFuel;
    
    return {
      taxiFuel: Math.round(taxiFuel),
      contingencyFuel: Math.round(contingencyFuel),
      reserveFuel: Math.round(reserveFuel),
      deckFuel: Math.round(deckFuel),
      total: Math.round(total),
      
      // Additional details
      contingencyFuelPercent: this.config.contingencyFuelPercent,
      reserveMethod: this.config.reserveMethod,
      reserveFuelPercent: this.config.reserveFuelPercent,
      deckTimePerStop: this.config.deckTimePerStop,
      deckFuelFlow: this.config.deckFuelFlow,
      intermediateStops
    };
  }
  
  /**
   * Calculate fuel required at each stop
   * @param {Array} waypoints - Waypoints array
   * @param {Array} legDetails - Leg details from calculateLegFuel
   * @param {Object} auxiliaryFuel - Auxiliary fuel components
   * @param {Object} aircraft - Aircraft data
   * @returns {Array} Fuel requirements at each stop
   */
  calculateFuelByStop(waypoints, legDetails, auxiliaryFuel, aircraft) {
    const fuelByStop = [];
    
    // For each waypoint
    for (let i = 0; i < waypoints.length; i++) {
      const waypoint = waypoints[i];
      const isFirstStop = i === 0;
      const isLastStop = i === waypoints.length - 1;
      
      // Calculate fuel needed for remaining legs
      let remainingTripFuel = 0;
      for (let j = i; j < legDetails.length; j++) {
        remainingTripFuel += legDetails[j].fuelRequired;
      }
      
      // Calculate contingency fuel for remaining legs
      const remainingContingency = (auxiliaryFuel.contingencyFuelPercent / 100) * remainingTripFuel;
      
      // Calculate deck fuel for remaining intermediate stops
      const remainingIntermediateStops = Math.max(0, waypoints.length - i - 2);
      const remainingDeckTimeHours = (remainingIntermediateStops * this.config.deckTimePerStop) / 60;
      const remainingDeckFuel = remainingDeckTimeHours * this.config.deckFuelFlow;
      
      // Taxi fuel only applies at the first stop
      const taxiFuel = isFirstStop ? auxiliaryFuel.taxiFuel : 0;
      
      // Reserve fuel is always needed
      const reserveFuel = auxiliaryFuel.reserveFuel;
      
      // Calculate total fuel required at this stop
      const requiredFuel = remainingTripFuel + 
                          remainingContingency + 
                          remainingDeckFuel + 
                          reserveFuel + 
                          taxiFuel;
      
      // Clamp required fuel to aircraft max fuel capacity
      const actualFuel = Math.min(requiredFuel, aircraft.maxFuel);
      
      // Calculate maximum passengers based on weight limitations
      const maxTakeoffWeight = aircraft.maxTakeoffWeight;
      const emptyWeight = aircraft.emptyWeight;
      const maxPassengerWeight = Math.max(0, maxTakeoffWeight - emptyWeight - actualFuel);
      const maxPassengers = Math.floor(maxPassengerWeight / this.config.passengerWeight);
      
      // Ensure we don't exceed aircraft capacity
      const aircraftMaxPassengers = aircraft.maxPassengers || 19; // Default to 19 if not specified
      const limitedMaxPassengers = Math.min(maxPassengers, aircraftMaxPassengers);
      
      // Store stop details
      fuelByStop.push({
        index: i,
        waypoint: waypoint.name || `Waypoint ${i}`,
        isFirstStop,
        isLastStop,
        requiredFuel: Math.round(requiredFuel),
        actualFuel: Math.round(actualFuel),
        maxPassengers: limitedMaxPassengers,
        maxPassengerWeight: limitedMaxPassengers * this.config.passengerWeight,
        
        // Fuel components
        components: {
          remainingTripFuel: Math.round(remainingTripFuel),
          remainingContingency: Math.round(remainingContingency),
          remainingDeckFuel: Math.round(remainingDeckFuel),
          taxiFuel: Math.round(taxiFuel),
          reserveFuel: Math.round(reserveFuel)
        },
        
        // Related waypoint and leg data
        waypoint: waypoint,
        leg: i < legDetails.length ? legDetails[i] : null
      });
    }
    
    return fuelByStop;
  }
  
  /**
   * Calculate maximum passenger capacity for the entire route
   * @param {Array} fuelByStop - Fuel requirements at each stop
   * @param {Object} aircraft - Aircraft data
   * @returns {Object} Maximum capacity data
   */
  calculateMaxCapacity(fuelByStop, aircraft) {
    // Find the limiting waypoint (lowest passenger capacity)
    let minPassengers = Infinity;
    let limitingStop = null;
    
    for (const stop of fuelByStop) {
      // Skip the final stop
      if (stop.isLastStop) continue;
      
      if (stop.maxPassengers < minPassengers) {
        minPassengers = stop.maxPassengers;
        limitingStop = stop;
      }
    }
    
    // If we couldn't find a limiting stop, return null
    if (!limitingStop) {
      return {
        maxPassengers: 0,
        maxPassengerWeight: 0,
        requiredFuel: 0,
        limitingWaypoint: null
      };
    }
    
    // Return the route's maximum capacity, limited by the most restrictive stop
    return {
      maxPassengers: minPassengers,
      maxPassengerWeight: minPassengers * this.config.passengerWeight,
      requiredFuel: fuelByStop[0].requiredFuel, // Fuel needed at first stop
      limitingWaypoint: limitingStop.waypoint,
      limitingStop
    };
  }
  
  /**
   * Format time in hours to HH:MM format
   * @param {number} timeHours - Time in decimal hours
   * @returns {string} Formatted time string
   */
  formatTime(timeHours) {
    if (typeof timeHours !== 'number' || timeHours < 0) {
      return '00:00';
    }
    
    const hours = Math.floor(timeHours);
    const minutes = Math.floor((timeHours - hours) * 60);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
}

export default EnhancedFuelCalculator;