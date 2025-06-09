/**
 * Flight Calculations Module
 * 
 * A dedicated module for performing all flight-related calculations including:
 * - Fuel requirements and consumption
 * - Passenger capacity based on load
 * - Flight timing with future wind calculations
 */

class FlightCalculations {
  constructor() {
    // Default values for calculations
    this.defaults = {
      passengerWeight: 220, // lbs per passenger including baggage
      contingencyFuelPercent: 10, // 10% contingency fuel
      taxiFuel: 50, // lbs
      reserveFuel: 600, // lbs
      deckTimePerStop: 5, // minutes
      deckFuelFlow: 400, // lbs per hour during deck operations
      callbacks: {} // For notifying UI of calculation results
    };
    
    // Current configuration, initialized with defaults
    this.config = {...this.defaults};
  }
  
  /**
   * Update configuration settings
   * 
   * @param {Object} newConfig Configuration parameters to update
   */
  updateConfig(newConfig) {
    // Debug log to track configuration updates
    console.log("FlightCalculations: Updating config with:", newConfig);
    
    // Only update properties that exist in defaults
    const validConfig = {};
    Object.keys(newConfig).forEach(key => {
      if (key !== 'callbacks' && (this.defaults.hasOwnProperty(key) || key === 'payloadWeight')) {
        validConfig[key] = newConfig[key];
      }
    });
    
    // Merge the valid config with the current config
    this.config = {...this.config, ...validConfig};
    
    // Log the new configuration
    console.log("FlightCalculations: Config updated:", this.config);
  }
  
  /**
   * Set a callback function to be called when calculations are complete
   * 
   * @param {string} event The event name
   * @param {Function} callback The callback function
   */
  setCallback(event, callback) {
    if (typeof callback === 'function') {
      this.config.callbacks[event] = callback;
    }
  }
  
  /**
   * Calculate all flight parameters based on route and aircraft data
   * 
   * @param {Array} coordinates Array of [lng, lat] coordinates for the route
   * @param {Object} aircraft Aircraft data object
   * @param {Object} params Additional parameters for calculations
   * @returns {Object} Complete set of calculated flight statistics
   */
  calculateFlightStats(coordinates, aircraft, params = {}) {
    // Exit early if no valid inputs
    if (!coordinates || coordinates.length < 2 || !aircraft) {
      console.error("Invalid inputs for flight calculations");
      return null;
    }
    
    // Log input parameters for debugging
    console.log("FlightCalculations: calculateFlightStats called with:", {
      coordinates: coordinates.length + " waypoints",
      aircraft: aircraft.registration || "Generic aircraft",
      params
    });
    
    // Merge passed parameters with config
    const calculationParams = {
      ...this.config,
      ...params
    };
    
    console.log("FlightCalculations: Using calculation parameters:", calculationParams);
    
    // Extract aircraft parameters, using defaults for missing values
    const {
      cruseSpeed = 145, // knots - note the field is spelled "cruseSpeed" in the data
      fuelBurn = 1100,   // lbs per hour
      maxFuelCapacity = 5000, // lbs
      maxFuel = 5000, // lbs (alternative field name)
      dryOperatingWeightLbs = 15000, // lbs (empty weight)
      emptyWeight = 15000, // lbs (alternative field name)
      usefulLoad = 7000, // lbs
      maxPassengers = 19
    } = aircraft;
    
    // Use cruseSpeed (matches the field spelling in the aircraft data)
    // But check alternative field names to handle different data structures
    const cruiseSpeed = aircraft.cruiseSpeed || cruseSpeed;
    const fuelCapacity = maxFuel || maxFuelCapacity;
    const operatingWeight = dryOperatingWeightLbs || emptyWeight;
    
    // Calculate total distance
    const totalDistance = this.calculateTotalDistance(coordinates);
    
    // Calculate number of stops (waypoints - 1)
    const numStops = coordinates.length - 1;
    
    // Calculate flight time in hours
    const flightTimeHours = totalDistance / cruiseSpeed;
    
    // Format flight time as HH:MM
    const flightTimeFormatted = this.formatTimeHHMM(flightTimeHours);
    
    // Calculate fuel requirements
    const tripFuel = flightTimeHours * fuelBurn;
    
    // Deck fuel - only for intermediate stops (not final destination)
    const intermediateStops = Math.max(0, numStops - 1); // Don't count final destination
    const deckTimeHours = (intermediateStops * calculationParams.deckTimePerStop) / 60;
    const deckFuel = deckTimeHours * calculationParams.deckFuelFlow;
    
    // Additional fuel components
    const contingencyFuel = tripFuel * (calculationParams.contingencyFuelPercent / 100);
    const taxiFuel = calculationParams.taxiFuel;
    const reserveFuel = calculationParams.reserveFuel;
    
    // Total fuel required
    const totalFuel = Math.round(tripFuel + deckFuel + contingencyFuel + taxiFuel + reserveFuel);
    
    // Get payload weight from params or use a default
    const payloadWeight = calculationParams.payloadWeight || 0;
    
    // Calculate effective max takeoff weight
    const maxTakeoffWeight = operatingWeight + usefulLoad; 
    
    // Calculate usable load after fuel
    const usableLoad = Math.max(0, usefulLoad - totalFuel);
    
    // Calculate maximum passenger capacity based on weight
    const maxPassengersByWeight = Math.floor((usableLoad - payloadWeight) / calculationParams.passengerWeight);
    const calculatedPassengers = Math.min(maxPassengersByWeight, maxPassengers);
    
    // Calculate total time (flight time + deck time)
    const totalTimeHours = flightTimeHours + deckTimeHours;
    const totalTimeFormatted = this.formatTimeHHMM(totalTimeHours);
    
    // Compile results
    const result = {
      // Distance
      totalDistance: totalDistance.toFixed(1),
      
      // Time calculations
      timeHours: flightTimeHours, // Keep the field name compatible with existing code
      estimatedTime: flightTimeFormatted, // Keep the field name compatible with existing code
      deckTimeMinutes: intermediateStops * calculationParams.deckTimePerStop,
      totalTimeHours,
      totalTimeFormatted,
      
      // Fuel calculations
      fuelRequired: Math.round(tripFuel), // Keep the field name compatible with existing code
      tripFuel: Math.round(tripFuel),
      deckFuel: Math.round(deckFuel),
      contingencyFuel: Math.round(contingencyFuel),
      taxiFuel,
      reserveFuel,
      totalFuel,
      
      // Weight calculations
      dryOperatingWeight: operatingWeight,
      maxTakeoffWeight,
      usefulLoad,
      usableLoad,
      
      // Passenger calculation
      maxPassengers,
      maxPassengersByWeight,
      calculatedPassengers,
      
      // Aircraft data reference
      aircraft,
      
      // Route data
      numStops,
      intermediateStops
    };
    
    // Log the results for debugging
    console.log("FlightCalculations: Calculation results:", {
      totalDistance: result.totalDistance,
      estimatedTime: result.estimatedTime,
      totalFuel: result.totalFuel,
      calculatedPassengers: result.calculatedPassengers
    });
    
    // Call the callback if one exists
    if (this.config.callbacks?.onCalculationComplete) {
      this.config.callbacks.onCalculationComplete(result);
    }
    
    // Return the calculation results
    return result;
  }
  
  /**
   * Calculate the total distance of the route in nautical miles
   * 
   * @param {Array} coordinates Array of [lng, lat] coordinates for the route
   * @returns {number} Total distance in nautical miles
   */
  calculateTotalDistance(coordinates) {
    let totalDistance = 0;
    
    for (let i = 0; i < coordinates.length - 1; i++) {
      const from = window.turf.point(coordinates[i]);
      const to = window.turf.point(coordinates[i + 1]);
      
      try {
        // Calculate distance in kilometers
        const distance = window.turf.distance(from, to, {units: 'kilometers'});
        
        // Convert to nautical miles (1 km = 0.539957 nm)
        const distanceNm = distance * 0.539957;
        
        totalDistance += distanceNm;
      } catch (error) {
        console.error("Error calculating leg distance:", error);
      }
    }
    
    return totalDistance;
  }
  
  /**
   * Calculate estimated time between two points
   * 
   * @param {Array} fromCoords [lng, lat] of starting point
   * @param {Array} toCoords [lng, lat] of ending point
   * @param {number} cruiseSpeed Cruise speed in knots
   * @param {Object} windData Optional wind data for more accurate calculation
   * @returns {number} Estimated time in hours
   */
  calculateLegTime(fromCoords, toCoords, cruiseSpeed, windData = null) {
    // Calculate distance between points
    const from = window.turf.point(fromCoords);
    const to = window.turf.point(toCoords);
    const distance = window.turf.distance(from, to, {units: 'kilometers'}) * 0.539957; // Convert to nm
    
    // Basic calculation without wind
    if (!windData) {
      return distance / cruiseSpeed;
    }
    
    // TODO: Add wind calculations in future enhancement
    // This is a placeholder for the wind calculation logic
    // Will need to calculate true heading, then adjust ground speed based on wind
    
    // For now, return the basic calculation
    return distance / cruiseSpeed;
  }
  
  /**
   * Format time in hours to HH:MM format
   * 
   * @param {number} timeHours Time in decimal hours
   * @returns {string} Formatted time string HH:MM
   */
  formatTimeHHMM(timeHours) {
    if (typeof timeHours !== 'number') return '00:00';
    
    const hours = Math.floor(timeHours);
    const minutes = Math.floor((timeHours - hours) * 60);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
}

export default FlightCalculations;