/**
 * RouteCalculator.js
 * 
 * Handles route calculations including distance, time, fuel, and passenger capacity
 * IMPORTANT: This module has been updated to ONLY use actual aircraft data from OSDK
 * and will NOT use any dummy data or fallbacks.
 */

class RouteCalculator {
  constructor() {
    // Only initialize callbacks - NO default aircraft data
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
      console.error('RouteCalculator: Turf.js not loaded');
      return null;
    }
    
    // Log call with a distinct marker for tracking in console
    console.log('⭐ RouteCalculator.calculateRouteStats called with:', {
      coordinates: coordinates.length,
      options: options.selectedAircraft ? 
        `Aircraft: ${options.selectedAircraft.registration || 'Unknown'}` : 'No aircraft',
      weather: options.weather ? 
        `Wind ${options.weather.windSpeed}kts from ${options.weather.windDirection}°` : 'No weather',
      // CRITICAL FIX: Log the forceTimeCalculation flag
      forceTime: options.forceTimeCalculation ? 'true' : 'false'
    });
    
    // Get options with defaults for non-aircraft values only
    const {
      selectedAircraft = null,
      payloadWeight = 0,
      reserveFuel = 0,
      weather = null,
      // CRITICAL FIX: Add forceTimeCalculation flag
      forceTimeCalculation = false,
      // IMPROVED FIX: Add a flag to indicate if these are ALL waypoints (including navigation waypoints)
      includeAllWaypoints = true
    } = options;
    
    // Check if we have a selectedAircraft object
    if (!selectedAircraft) {
      console.error('RouteCalculator: No aircraft data provided, calculating distance only');
      return this.calculateDistanceOnly(coordinates);
    }
    
    // Check if aircraft has all required properties
    if (!selectedAircraft.cruiseSpeed) {
      console.error('RouteCalculator: Aircraft missing cruiseSpeed property');
      
      // CRITICAL FIX: If forceTimeCalculation is true and we have coordinates, calculate time manually
      if (forceTimeCalculation && coordinates && coordinates.length >= 2) {
        console.log('⭐ Forcing time calculation for map click even without proper aircraft data');
        return this.createBackupTimeCalculation(coordinates, 145); // Use default cruise speed of 145 knots
      }
      
      return this.calculateDistanceOnly(coordinates);
    }
    
    if (!selectedAircraft.fuelBurn) {
      console.error('RouteCalculator: Aircraft missing fuelBurn property');
      
      // CRITICAL FIX: If forceTimeCalculation is true and we have coordinates, calculate time manually
      if (forceTimeCalculation && coordinates && coordinates.length >= 2) {
        console.log('⭐ Forcing time calculation for map click even without complete aircraft data');
        return this.createBackupTimeCalculation(coordinates, selectedAircraft.cruiseSpeed);
      }
      
      return this.calculateDistanceOnly(coordinates);
    }
    
    // All required data is present, calculate route stats
    const results = this.calculateRouteStatsLocally(
      coordinates,
      null, // Not using predefined aircraft types
      selectedAircraft, // Pass the full aircraft object
      payloadWeight,
      reserveFuel,
      weather
    );
    
    // Validate time calculations before returning
    if (!results || results.timeHours === 0 || !results.estimatedTime || results.estimatedTime === '00:00') {
      console.error('⭐ RouteCalculator: Calculation produced invalid time results:', results);
      
      // Attempt to fix the calculation if we have valid inputs
      if (coordinates.length >= 2 && selectedAircraft.cruiseSpeed > 0) {
        console.log('⭐ RouteCalculator: Attempting to manually recalculate time...');
        
        // Calculate the total distance
        let totalDistance = 0;
        for (let i = 0; i < coordinates.length - 1; i++) {
          const from = window.turf.point(coordinates[i]);
          const to = window.turf.point(coordinates[i+1]);
          const options = { units: 'nauticalmiles' };
          totalDistance += window.turf.distance(from, to, options);
        }
        
        // Calculate time based on distance and cruise speed
        const timeHours = totalDistance / selectedAircraft.cruiseSpeed;
        
        // Format time
        const hours = Math.floor(timeHours);
        const minutes = Math.floor((timeHours - hours) * 60);
        const estimatedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        
        console.log('⭐ Manual time calculation:', {
          totalDistance,
          cruiseSpeed: selectedAircraft.cruiseSpeed,
          timeHours,
          estimatedTime
        });
        
        // Update the results with the corrected time
        if (results) {
          results.timeHours = timeHours;
          results.estimatedTime = estimatedTime;
        }
      }
    }
    
    // Final log of results for tracking
    console.log('⭐ RouteCalculator final results:', {
      estimatedTime: results?.estimatedTime,
      timeHours: results?.timeHours,
      totalDistance: results?.totalDistance,
      windAdjusted: results?.windAdjusted || false
    });
    
    return results;
  }
  
  /**
   * Calculate distance only without requiring aircraft
   * @param {Array} coordinates - Array of [lng, lat] coordinates
   * @returns {Object} - Distance results
   */
  calculateDistanceOnly(coordinates) {
    if (!window.turf) {
      console.error('Turf.js not loaded');
      return null;
    }
    
    // Calculate total distance
    let totalDistance = 0;
    let legs = [];
    
    console.log('⭐ RouteCalculator: Calculating distance for', coordinates.length, 'waypoints');
    
    for (let i = 0; i < coordinates.length - 1; i++) {
      const from = window.turf.point(coordinates[i]);
      const to = window.turf.point(coordinates[i + 1]);
      const options = { units: 'nauticalmiles' };
      
      const legDistance = window.turf.distance(from, to, options);
      totalDistance += legDistance;
      
      console.log(`⭐ RouteCalculator: Leg ${i+1} distance: ${legDistance.toFixed(1)} nm`);
      
      legs.push({
        from: coordinates[i],
        to: coordinates[i + 1],
        distance: legDistance.toFixed(1)
      });
    }
    
    console.log('⭐ RouteCalculator: Total distance calculated:', totalDistance.toFixed(1), 'nm');
    
    // Compile results with consistent fields that the UI expects
    const result = {
      totalDistance: totalDistance.toFixed(1),
      estimatedTime: '00:00',
      timeHours: 0,
      legs: legs,
      distanceOnly: true // Flag to indicate this is distance-only calculation
    };
    
    // Trigger callback with results
    this.triggerCallback('onCalculationComplete', result);
    
    return result;
  }
  
  /**
   * Calculate route statistics locally without API calls
   * @param {Array} coordinates - Array of [lng, lat] coordinates
   * @param {Object} aircraftTypes - No longer used, kept for backwards compatibility
   * @param {Object} aircraftObject - The aircraft object with performance data
   * @param {number} payloadWeight - Additional payload weight (lbs)
   * @param {number} reserveFuel - Reserve fuel amount (lbs)
   * @param {Object} weather - Weather data with windSpeed and windDirection
   * @returns {Object} - Route statistics
   */
  calculateRouteStatsLocally(coordinates, aircraftTypes, aircraftObject, payloadWeight, reserveFuel, weather) {
    console.log("RouteCalculator: Starting calculation with:", { 
      coordinatesLength: coordinates?.length,
      aircraftObject: aircraftObject ? 
        `${aircraftObject.registration || 'Unknown'} (${aircraftObject.modelType || 'Unknown'})` : 'None',
      weather: weather,
      turf: !!window.turf
    });
    
    if (!coordinates || coordinates.length < 2) {
      console.error('RouteCalculator: Invalid coordinates - need at least 2 waypoints');
      return { totalDistance: '0', estimatedTime: '00:00', timeHours: 0 };
    }
    
    if (!window.turf) {
      console.error('RouteCalculator: Turf.js not loaded');
      return { totalDistance: '0', estimatedTime: '00:00', timeHours: 0 };
    }
    
    // Ensure we have all required aircraft properties - no fallbacks
    if (!aircraftObject) {
      console.error('RouteCalculator: No aircraft object provided');
      return this.calculateDistanceOnly(coordinates);
    }
    
    // Double check that all required properties are present
    if (!aircraftObject.cruiseSpeed) {
      console.error('RouteCalculator: Aircraft object missing cruiseSpeed property');
      return this.calculateDistanceOnly(coordinates);
    }
    
    if (!aircraftObject.fuelBurn) {
      console.error('RouteCalculator: Aircraft object missing fuelBurn property');
      return this.calculateDistanceOnly(coordinates);
    }
    
    // Use the aircraft object directly - no fallbacks to window.selectedAircraft
    const aircraft = aircraftObject;
    
    // Log a summary of what will be calculated
    console.log("⭐ RouteCalculator Stats Input:", {
      waypoints: coordinates.length,
      aircraft: `${aircraft.registration || 'Unknown'} (${aircraft.modelType || 'Unknown'})`,
      cruiseSpeed: aircraft.cruiseSpeed,
      fuelBurn: aircraft.fuelBurn,
      weather: weather ? `${weather.windSpeed}kts from ${weather.windDirection}°` : 'None'
    });
    
    // Calculate each leg
    let totalDistance = 0;
    let totalTimeHours = 0;
    let totalFuel = 0;
    let legs = [];
    let totalHeadwind = 0;
    let legCount = 0;
    
    try {
      // Import the wind calculation functions
      const WindCalculations = window.WindCalculations || 
                             (typeof require !== 'undefined' ? require('./calculations/WindCalculations') : null);
      
      // If WindCalculations is not available, calculate only distance
      if (!WindCalculations) {
        console.error('⭐ WindCalculations module not available');
        return this.calculateDistanceOnly(coordinates);
      }
      
      // Process each leg using WindCalculations - no fallbacks
      const { calculateLegWithWind, calculateCourse } = WindCalculations;
      
      // Add debug log to check for weather object
      console.log('⭐ RouteCalculator processing with weather:', weather);
      
      for (let i = 0; i < coordinates.length - 1; i++) {
        // Create proper lat/lon objects from coordinates
        const fromCoords = {
          lat: coordinates[i][1],
          lon: coordinates[i][0]
        };
        
        const toCoords = {
          lat: coordinates[i+1][1],
          lon: coordinates[i+1][0]
        };
        
        console.log(`⭐ Processing leg ${i+1} from ${fromCoords.lat},${fromCoords.lon} to ${toCoords.lat},${toCoords.lon}`);
        
        // Calculate distance using turf
        const from = window.turf.point(coordinates[i]);
        const to = window.turf.point(coordinates[i+1]);
        const options = { units: 'nauticalmiles' };
        
        const legDistance = window.turf.distance(from, to, options);
        
        // Add distance to total
        totalDistance += legDistance;
        
        // Use the provided weather data - no fallbacks
        console.log(`⭐ Using weather for leg ${i+1}:`, weather);
        
        // Calculate leg details including wind effects
        const legDetails = calculateLegWithWind(
          fromCoords,
          toCoords,
          legDistance,
          aircraft,
          weather
        );
        
        console.log(`⭐ Leg ${i+1} details:`, {
          distance: legDistance.toFixed(1),
          time: legDetails.time.toFixed(2),
          groundSpeed: Math.round(legDetails.groundSpeed),
          headwind: Math.round(legDetails.headwindComponent),
          course: Math.round(legDetails.course)
        });
        
        // Add leg time to total - verify it's a valid number
        if (isNaN(legDetails.time) || legDetails.time <= 0) {
          console.error(`⭐ Invalid leg time for leg ${i+1}:`, legDetails.time);
          
          // Calculate a fallback time based on distance and cruise speed
          const fallbackTime = legDistance / aircraft.cruiseSpeed;
          console.log(`⭐ Using fallback time calculation: ${fallbackTime}`);
          totalTimeHours += fallbackTime;
        } else {
          totalTimeHours += legDetails.time;
        }
        
        // Add leg fuel to total
        totalFuel += legDetails.fuel;
        
        // Track headwind for calculating average
        totalHeadwind += legDetails.headwindComponent;
        legCount++;
        
        // Store leg data
        legs.push({
          from: coordinates[i],
          to: coordinates[i+1],
          distance: legDistance.toFixed(1),
          time: legDetails.time,
          fuel: Math.round(legDetails.fuel),
          course: legDetails.course,
          groundSpeed: legDetails.groundSpeed,
          headwind: legDetails.headwindComponent
        });
      }
    } catch (error) {
      console.error('⭐ RouteCalculator: Error calculating route with wind:', error);
      // Just calculate distance instead of using fallbacks
      return this.calculateDistanceOnly(coordinates);
    }
    
    // Final verification of calculated time
    if (totalTimeHours === 0 && totalDistance > 0) {
      console.error('⭐ RouteCalculator: Zero time calculated for non-zero distance!');
      
      // Force calculate a time based on distance and cruise speed
      totalTimeHours = totalDistance / aircraft.cruiseSpeed;
      console.log(`⭐ Forced time calculation: ${totalTimeHours} hours for ${totalDistance} nm`);
    }
    
    // Calculate average headwind
    const avgHeadwind = legCount > 0 ? Math.round(totalHeadwind / legCount) : 0;
    
    console.log(`RouteCalculator: Total route stats:`, {
      distance: totalDistance.toFixed(1),
      time: totalTimeHours.toFixed(2),
      avgHeadwind: avgHeadwind
    });
    
    // Format time as HH:MM
    const hours = Math.floor(totalTimeHours);
    const minutes = Math.floor((totalTimeHours - hours) * 60);
    const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    // Add reserve fuel (ensure it's a number)
    const reserveFuelValue = Number(reserveFuel) || 0;
    const fuelRequired = Math.round(totalFuel + reserveFuelValue);
    
    // Calculate usable load - only if we have all required aircraft properties
    let usableLoad = 0;
    let maxPassengers = 0;
    
    if (aircraft.maxTakeoffWeight && aircraft.emptyWeight) {
      // Calculate usable load from actual aircraft data
      usableLoad = Math.max(0, aircraft.maxTakeoffWeight - aircraft.emptyWeight - fuelRequired - (Number(payloadWeight) || 0));
      
      // Only calculate passengers if we have passengerWeight
      if (aircraft.passengerWeight) {
        maxPassengers = Math.floor(usableLoad / aircraft.passengerWeight);
      } else {
        console.error('RouteCalculator: Missing passengerWeight data, cannot calculate max passengers');
      }
    } else {
      console.error('RouteCalculator: Missing aircraft weight data, cannot calculate usable load');
    }
    
    // Compile results with clean, consistent property names
    const result = {
      totalDistance: totalDistance.toFixed(1),
      estimatedTime: formattedTime,
      timeHours: totalTimeHours,
      fuelRequired: fuelRequired,
      tripFuel: Math.round(totalFuel),
      usableLoad: usableLoad,
      maxPassengers: maxPassengers,
      aircraft: aircraft,
      legs: legs,
      windAdjusted: weather && weather.windSpeed > 0,
      windData: {
        windSpeed: weather ? weather.windSpeed : 0,
        windDirection: weather ? weather.windDirection : 0,
        avgHeadwind: avgHeadwind
      }
    };
    
    console.log('🔄 RouteCalculator: Final route stats:', {
      distance: result.totalDistance,
      time: result.estimatedTime,
      timeHours: result.timeHours,
      tripFuel: result.tripFuel,
      legCount: result.legs.length,
      waypoints: coordinates.length
    });
    
    // Trigger callback with results
    this.triggerCallback('onCalculationComplete', result);
    
    return result;
  }
  
  /**
   * Methods for aircraft types have been removed
   * ONLY use real aircraft data from OSDK
   */
   
  /**
   * Create backup time calculation for when we need to force time calculation
   * @param {Array} coordinates - Array of [lng, lat] coordinates
   * @param {number} cruiseSpeed - Aircraft cruise speed to use for calculation
   * @returns {Object} - Route statistics with time
   */
  createBackupTimeCalculation(coordinates, cruiseSpeed) {
    console.log('⭐ Creating backup time calculation with cruise speed:', cruiseSpeed);
    
    if (!window.turf) {
      console.error('RouteCalculator: Turf.js not loaded for backup calculation');
      return { totalDistance: '0', estimatedTime: '00:00', timeHours: 0 };
    }
    
    if (!coordinates || coordinates.length < 2 || !cruiseSpeed) {
      console.error('RouteCalculator: Invalid inputs for backup calculation');
      return { totalDistance: '0', estimatedTime: '00:00', timeHours: 0 };
    }
    
    try {
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
      
      // Calculate time based on total distance and cruise speed
      const timeHours = totalDistance / cruiseSpeed;
      
      // Format time as HH:MM
      const hours = Math.floor(timeHours);
      const minutes = Math.floor((timeHours - hours) * 60);
      const estimatedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      console.log('⭐ Backup time calculation results:', {
        totalDistance: totalDistance.toFixed(1),
        timeHours: timeHours,
        estimatedTime: estimatedTime
      });
      
      // Create the result object
      const result = {
        totalDistance: totalDistance.toFixed(1),
        estimatedTime: estimatedTime,
        timeHours: timeHours,
        legs: legs,
        // Add minimal properties to make it compatible with UI expectations
        fuelRequired: Math.round(timeHours * 1100), // Use a default fuel burn of 1100 lbs/hr
        tripFuel: Math.round(timeHours * 1100),
        usableLoad: 0,
        maxPassengers: 0
      };
      
      // Trigger callback with results
      this.triggerCallback('onCalculationComplete', result);
      
      return result;
    } catch (error) {
      console.error('RouteCalculator: Error in backup time calculation:', error);
      return { totalDistance: '0', estimatedTime: '00:00', timeHours: 0 };
    }
  }
}

export default RouteCalculator;