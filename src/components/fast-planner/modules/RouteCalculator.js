/**
 * RouteCalculator.js
 * 
 * Handles route calculations including distance, time, fuel, and passenger capacity
 */

class RouteCalculator {
  constructor() {
    // Default aircraft types with performance data
    this.aircraftTypes = {
      s92: {
        name: "Sikorsky S-92",
        cruiseSpeed: 145, // knots
        fuelBurn: 1450,   // lbs per hour
        maxFuel: 5200,    // lbs
        maxTakeoffWeight: 26500, // lbs
        emptyWeight: 17000, // lbs
        passengerWeight: 220 // lbs per passenger
      },
      aw139: {
        name: "Leonardo AW139",
        cruiseSpeed: 150, // knots
        fuelBurn: 1100,   // lbs per hour
        maxFuel: 3900,    // lbs
        maxTakeoffWeight: 14991, // lbs
        emptyWeight: 10250, // lbs
        passengerWeight: 220 // lbs per passenger
      },
      h175: {
        name: "Airbus H175",
        cruiseSpeed: 150, // knots
        fuelBurn: 980,    // lbs per hour
        maxFuel: 4400,    // lbs
        maxTakeoffWeight: 17196, // lbs
        emptyWeight: 10800, // lbs
        passengerWeight: 220 // lbs per passenger
      },
      h160: {
        name: "Airbus H160",
        cruiseSpeed: 150, // knots
        fuelBurn: 750,    // lbs per hour
        maxFuel: 3000,    // lbs
        maxTakeoffWeight: 13338, // lbs
        emptyWeight: 8100, // lbs
        passengerWeight: 220 // lbs per passenger
      }
    };
    
    this.callbacks = {
      onCalculationComplete: null
    };
  }
  
  /**
   * Set a callback function
   * @param {string} type - The callback type
   * @param {Function} callback - The callback function
   */
  setCallback(type, callback) {
    if (this.callbacks.hasOwnProperty(type)) {
      this.callbacks[type] = callback;
    }
  }
  
  /**
   * Trigger a callback if it exists
   * @param {string} type - The callback type
   * @param {*} data - The data to pass to the callback
   */
  triggerCallback(type, data) {
    if (this.callbacks[type]) {
      this.callbacks[type](data);
    }
  }
  
  /**
   * Calculate route statistics
   * @param {Array} coordinates - Array of [lng, lat] coordinates
   * @param {Object} options - Calculation options
   * @returns {Object} - Route statistics
   */
  calculateRouteStats(coordinates, options = {}) {
    if (!window.turf) {
      console.error('Turf.js not loaded');
      return null;
    }
    
    // Get options with defaults
    const {
      aircraftType = 's92',
      payloadWeight = 2000,
      reserveFuel = 600
    } = options;
    
    return this.calculateRouteStatsLocally(
      coordinates, 
      this.aircraftTypes, 
      aircraftType, 
      payloadWeight, 
      reserveFuel
    );
  }
  
  /**
   * Calculate route statistics locally without API calls
   * @param {Array} coordinates - Array of [lng, lat] coordinates
   * @param {Object} aircraftTypes - Aircraft performance data
   * @param {string} aircraftId - Aircraft type ID
   * @param {number} payloadWeight - Additional payload weight (lbs)
   * @param {number} reserveFuel - Reserve fuel amount (lbs)
   * @returns {Object} - Route statistics
   */
  calculateRouteStatsLocally(coordinates, aircraftTypes, aircraftId, payloadWeight, reserveFuel) {
    // Get aircraft data
    const aircraft = aircraftTypes[aircraftId] || aircraftTypes.s92;
    
    // Calculate total distance
    let totalDistance = 0;
    let legs = [];
    
    for (let i = 0; i < coordinates.length - 1; i++) {
      const from = window.turf.point(coordinates[i]);
      const to = window.turf.point(coordinates[i + 1]);
      const options = { units: 'nauticalmiles' };
      
      const legDistance = window.turf.distance(from, to, options);
      totalDistance += legDistance;
      
      legs.push({
        from: coordinates[i],
        to: coordinates[i + 1],
        distance: legDistance.toFixed(1)
      });
    }
    
    // Calculate time based on cruise speed (hours)
    const timeHours = totalDistance / aircraft.cruiseSpeed;
    
    // Format time as HH:MM
    const hours = Math.floor(timeHours);
    const minutes = Math.floor((timeHours - hours) * 60);
    const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    // Calculate fuel required (include reserve)
    const fuelRequired = Math.round((timeHours * aircraft.fuelBurn) + reserveFuel);
    
    // Calculate usable load
    const usableLoad = Math.max(0, aircraft.maxTakeoffWeight - aircraft.emptyWeight - fuelRequired - payloadWeight);
    
    // Calculate max passengers
    const maxPassengers = Math.floor(usableLoad / aircraft.passengerWeight);
    
    // Compile results
    const result = {
      totalDistance: totalDistance.toFixed(1),
      estimatedTime: formattedTime,
      timeHours: timeHours,
      fuelRequired: fuelRequired,
      usableLoad: usableLoad,
      maxPassengers: maxPassengers,
      aircraft: aircraft,
      legs: legs
    };
    
    // Trigger callback with results
    this.triggerCallback('onCalculationComplete', result);
    
    return result;
  }
  
  /**
   * Get all available aircraft types
   * @returns {Object} - Aircraft types
   */
  getAircraftTypes() {
    return this.aircraftTypes;
  }
  
  /**
   * Get a specific aircraft type
   * @param {string} aircraftId - Aircraft type ID
   * @returns {Object} - Aircraft data
   */
  getAircraftType(aircraftId) {
    return this.aircraftTypes[aircraftId] || this.aircraftTypes.s92;
  }
  
  /**
   * Add a custom aircraft type
   * @param {string} id - Aircraft type ID
   * @param {Object} data - Aircraft performance data
   */
  addAircraftType(id, data) {
    this.aircraftTypes[id] = data;
  }
}

export default RouteCalculator;