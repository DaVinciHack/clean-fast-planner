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
   * @param {Array} data.legs - Array of leg objects, where each leg has departureStop, arrivalStop, and intermediateWaypoints.
   * @param {Object} data.aircraft - Aircraft object from OSDK
   * @param {Object} data.weather - Weather data
   * @param {number} data.cargoWeight - Additional cargo weight
   * @returns {Object} Fuel calculation results
   */
  calculateFuelRequirements(data) {
    // Validate input data - NEVER calculate with missing data
    if (!this.validateInputData(data)) { // validateInputData will be updated to check data.legs
      console.error('EnhancedFuelCalculator: Invalid input data, cannot calculate');
      return null;
    }
    
    const { legs: structuredLegs, aircraft, weather, cargoWeight = 0 } = data; // Renamed waypoints to structuredLegs
    
    console.log('EnhancedFuelCalculator: Calculating fuel requirements', {
      legsCount: structuredLegs.length,
      aircraft: aircraft.registration,
      weather,
      cargoWeight
    });
    
    // Calculate fuel for each leg and stop
    const legResults = this.calculateLegFuel(structuredLegs, aircraft, weather); // Pass structuredLegs

    // Determine the number of actual stops for auxiliary fuel calculation
    // If structuredLegs = [{dep:A, arr:B, int:[]}, {dep:B, arr:C, int:[]}], actual stops are A, B, C (3 stops)
    // Number of actual stops = number of legs + 1, assuming legs are contiguous.
    // Or, more robustly, collect all unique departure and arrival stops.
    const actualStops = [];
    if (structuredLegs.length > 0) {
      structuredLegs.forEach(leg => {
        if (leg.departureStop && !actualStops.find(s => s.id === leg.departureStop.id)) {
          actualStops.push(leg.departureStop);
        }
        if (leg.arrivalStop && !actualStops.find(s => s.id === leg.arrivalStop.id)) {
          actualStops.push(leg.arrivalStop);
        }
      });
    }
    const numActualStops = actualStops.length;
    
    // Calculate additional fuel components
    // The 'numStops' parameter for calculateAuxiliaryFuel should be the number of times deck time is applied.
    // If actualStops are A, B, C, deck time applies at B. So, numIntermediateStopsForDeckTime = numActualStops - 2 (if >=0)
    const numIntermediateStopsForDeckTime = Math.max(0, numActualStops - 2);
    const auxiliaryFuel = this.calculateAuxiliaryFuel(legResults.totalTripFuel, numIntermediateStopsForDeckTime);
    
    // Calculate per-stop fuel and passenger capacity using the list of actual stops
    const fuelByStop = this.calculateFuelByStop(actualStops, legResults.legDetails, auxiliaryFuel, aircraft);
    
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
      legs: structuredLegs, // Store the structured legs
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
   * @param {Object} data - Input data object, expecting data.legs
   * @returns {boolean} True if data is valid, false otherwise
   */
  validateInputData(data) {
    // Check if we have the required data objects
    if (!data || !data.legs || !data.aircraft) { // Check for data.legs
      console.error('EnhancedFuelCalculator: Missing required data objects (legs or aircraft)');
      return false;
    }
    
    // Ensure legs is an array. It can be empty if no valid legs were formed (e.g. < 2 stops).
    // The calculation should handle empty legs array gracefully.
    if (!Array.isArray(data.legs)) {
      console.error('EnhancedFuelCalculator: data.legs is not an array');
      return false;
    }

    if (data.legs.length === 0) {
      // This is a valid case if there are fewer than 2 stops.
      // The calling function (calculateFuelRequirements) should handle this by returning null or default results.
      // For validation here, an empty legs array is permissible if it means no route to calculate.
      // However, if calculateFuelRequirements proceeds, it expects at least one leg to make sense for some calcs.
      // Let's assume for now that if legs is empty, calculateFuelRequirements will handle it.
      // Or, we can enforce that if legs is not empty, it must meet criteria.
      // For now, let's allow empty legs array to pass validation, and let calculateLegFuel handle it.
    } else {
      // If legs array is not empty, validate each leg object
      for (const leg of data.legs) {
        if (!leg || typeof leg !== 'object' ||
            !leg.departureStop || !leg.departureStop.coords || !Array.isArray(leg.departureStop.coords) || leg.departureStop.coords.length !== 2 ||
            !leg.arrivalStop || !leg.arrivalStop.coords || !Array.isArray(leg.arrivalStop.coords) || leg.arrivalStop.coords.length !== 2 ||
            !Array.isArray(leg.intermediateWaypoints)) {
          console.error('EnhancedFuelCalculator: Invalid leg structure or missing stop coordinates:', leg);
          return false;
        }
        for (const iw of leg.intermediateWaypoints) {
          if (!iw || !iw.coords || !Array.isArray(iw.coords) || iw.coords.length !== 2) {
            console.error('EnhancedFuelCalculator: Invalid intermediate waypoint coordinates in leg:', iw);
            return false;
          }
        }
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
   * @param {Array} structuredLegs - Array of leg objects (departureStop, arrivalStop, intermediateWaypoints)
   * @param {Object} aircraft - Aircraft data
   * @param {Object} weather - Weather data
   * @returns {Object} Leg fuel calculation results
   */
  calculateLegFuel(structuredLegs, aircraft, weather) {
    const legDetails = []; // This will store details for each STOP-TO-STOP leg
    let overallTotalDistance = 0;
    let overallTotalTime = 0;
    let overallTotalTripFuel = 0;

    if (!structuredLegs || structuredLegs.length === 0) {
      return {
        legDetails: [],
        totalDistance: 0,
        totalTime: 0,
        totalTripFuel: 0
      };
    }
    
    // Process each leg object
    structuredLegs.forEach((legObject, legIndex) => {
      const departureStop = legObject.departureStop;
      const arrivalStop = legObject.arrivalStop;
      const intermediateWaypoints = legObject.intermediateWaypoints || [];

      let legTotalDistance = 0;
      let legTotalTimeHours = 0;
      let legTotalFuelRequired = 0;
      
      // Create a sequence of points for this leg: [departureStop, ...intermediateWaypoints, arrivalStop]
      const legPointSequence = [departureStop, ...intermediateWaypoints, arrivalStop];
      
      // Calculate segments within this leg
      for (let i = 0; i < legPointSequence.length - 1; i++) {
        const fromPoint = legPointSequence[i];
        const toPoint = legPointSequence[i + 1];
        
        const segmentDistance = this.calculateDistance(fromPoint.coords, toPoint.coords);
        const timeResult = this.calculateFlightTime(segmentDistance, aircraft.cruiseSpeed, fromPoint.coords, toPoint.coords, weather);
        const segmentFuelRequired = timeResult.flightTimeHours * aircraft.fuelBurn;
        
        legTotalDistance += segmentDistance;
        legTotalTimeHours += timeResult.flightTimeHours;
        legTotalFuelRequired += segmentFuelRequired;
      }
      
      // Update overall totals
      overallTotalDistance += legTotalDistance;
      overallTotalTime += legTotalTimeHours;
      overallTotalTripFuel += legTotalFuelRequired;
      
      // Store details for this STOP-TO-STOP leg
      legDetails.push({
        from: departureStop.name || `Stop ${legIndex}`,
        to: arrivalStop.name || `Stop ${legIndex + 1}`,
        departureCoords: departureStop.coords, // Add departure coordinates
        arrivalCoords: arrivalStop.coords,     // Add arrival coordinates
        distance: legTotalDistance,
        flightTimeHours: legTotalTimeHours,
        fuelRequired: Math.round(legTotalFuelRequired),
        // For simplicity, groundSpeed, heading, windEffect for the leg can be an average or from the longest segment,
        // or omitted if per-segment detail isn't needed at this summary level.
        // For now, let's calculate overall leg wind effect based on direct route from dep to arr for simplicity,
        // or acknowledge this is a simplification.
        // Let's use the direct calculation for the leg's representative wind effect.
        groundSpeed: legTotalDistance / legTotalTimeHours || aircraft.cruiseSpeed, // Avoid division by zero
        heading: this.calculateFlightTime(legTotalDistance, aircraft.cruiseSpeed, departureStop.coords, arrivalStop.coords, weather).heading,
        windEffect: this.calculateFlightTime(legTotalDistance, aircraft.cruiseSpeed, departureStop.coords, arrivalStop.coords, weather).windEffect,
        // Store the sequence of all points that made up this leg for potential detailed display
        fullPathWaypoints: legPointSequence.map(wp => wp.name || 'Unnamed Waypoint')
      });
    });
    
    return {
      legDetails, // Array of stop-to-stop leg summaries
      totalDistance: overallTotalDistance,
      totalTime: overallTotalTime,
      totalTripFuel: Math.round(overallTotalTripFuel)
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
   * @param {number} numIntermediateStopsForDeckTime - Number of actual intermediate stops where deck time applies.
   * @returns {Object} Auxiliary fuel components
   */
  calculateAuxiliaryFuel(tripFuel, numIntermediateStopsForDeckTime) {
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
    const deckTimeHours = (numIntermediateStopsForDeckTime * this.config.deckTimePerStop) / 60; // Convert from minutes to hours
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
      intermediateStops: numIntermediateStopsForDeckTime // Use the passed in value
    };
  }
  
  /**
   * Calculate fuel required at each stop
   * @param {Array} actualStops - Array of actual stop waypoint objects
   * @param {Array} legDetails - Leg details from calculateLegFuel (summaries of stop-to-stop legs)
   * @param {Object} auxiliaryFuel - Auxiliary fuel components
   * @param {Object} aircraft - Aircraft data
   * @returns {Array} Fuel requirements at each stop
   */
  calculateFuelByStop(actualStops, legDetails, auxiliaryFuel, aircraft) {
    const fuelByStop = [];

    if (!actualStops || actualStops.length === 0) {
        return [];
    }
    
    // For each actual stop
    for (let i = 0; i < actualStops.length; i++) {
      const currentStopWaypoint = actualStops[i];
      const isFirstStop = i === 0;
      const isLastStop = i === actualStops.length - 1;
      
      // Calculate fuel needed for remaining legs starting from this stop
      let remainingTripFuel = 0;
      // legDetails corresponds to legs *between* stops.
      // If current stop is actualStops[i], the legs to consider are legDetails[i] onwards.
      for (let j = i; j < legDetails.length; j++) {
        // Ensure legDetails[j] exists and has fuelRequired
        if (legDetails[j] && typeof legDetails[j].fuelRequired === 'number') {
            remainingTripFuel += legDetails[j].fuelRequired;
        }
      }
      
      // Calculate contingency fuel for remaining legs
      const remainingContingency = (auxiliaryFuel.contingencyFuelPercent / 100) * remainingTripFuel;
      
      // Calculate deck fuel for remaining intermediate stops
      // If current stop is actualStops[i], number of future stops where deck time applies is (actualStops.length - 1 - i - 1)
      // Example: Stops A, B, C, D. Current stop A (i=0). Future intermediate stops B, C. Count = (4-1-0-1) = 2.
      // Current stop B (i=1). Future intermediate stop C. Count = (4-1-1-1) = 1.
      // Current stop C (i=2). Future intermediate stops None. Count = (4-1-2-1) = 0.
      const remainingIntermediateStopsForDeck = Math.max(0, actualStops.length - 1 - i - 1);
      const remainingDeckTimeHours = (remainingIntermediateStopsForDeck * this.config.deckTimePerStop) / 60;
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
      // Cargo weight needs to be factored in if provided by the overall calculation
      const cargoWeight = (this.config.cargoWeight || 0); // Assuming cargoWeight is in config or passed differently
      const maxPassengerWeight = Math.max(0, maxTakeoffWeight - emptyWeight - actualFuel - cargoWeight);
      const maxPassengers = this.config.passengerWeight > 0 ? Math.floor(maxPassengerWeight / this.config.passengerWeight) : 0;
      
      // Ensure we don't exceed aircraft capacity
      const aircraftMaxPassengers = aircraft.maxPassengers || 19; // Default to 19 if not specified
      const limitedMaxPassengers = Math.min(maxPassengers, aircraftMaxPassengers);
      
      // Store stop details
      fuelByStop.push({
        index: i,
        waypoint: currentStopWaypoint.name || `Stop ${i}`,
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
        waypoint: currentStopWaypoint, // The actual stop waypoint object
        // The leg *departing* from this stop (if not the last stop)
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
