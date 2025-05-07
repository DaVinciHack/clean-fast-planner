/**
 * TripFuelCalculator.js
 * 
 * Handles calculation of trip fuel based on waypoints and aircraft performance.
 * Separates the leg-by-leg fuel calculation logic from the main manager.
 */

class TripFuelCalculator {
  constructor() {
    // Default values for aircraft performance
    this.aircraftPerformance = {
      cruiseFuelFlow: 1000, // lbs/hr - default value, will be overridden
      cruiseSpeed: 120,     // knots - default value, will be overridden
    };
  }
  
  /**
   * Set aircraft performance parameters for calculations
   * @param {Object} performance - Aircraft performance data
   */
  setAircraftPerformance(performance) {
    this.aircraftPerformance = {
      ...this.aircraftPerformance,
      ...performance
    };
  }
  
  /**
   * Calculate ground distance between two waypoints
   * @param {Array} coord1 - [lon, lat] of waypoint 1
   * @param {Array} coord2 - [lon, lat] of waypoint 2
   * @returns {Number} Distance in nautical miles
   */
  calculateDistance(coord1, coord2) {
    if (!coord1 || !coord2) return 0;
    
    // Convert coordinates to radians
    const lon1 = (coord1[0] * Math.PI) / 180;
    const lat1 = (coord1[1] * Math.PI) / 180;
    const lon2 = (coord2[0] * Math.PI) / 180;
    const lat2 = (coord2[1] * Math.PI) / 180;
    
    // Haversine formula for distance
    const dlon = lon2 - lon1;
    const dlat = lat2 - lat1;
    const a = Math.sin(dlat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlon / 2) ** 2;
    const c = 2 * Math.asin(Math.sqrt(a));
    
    // Radius of earth in nautical miles
    const r = 3440.065; // Earth radius in nautical miles
    
    // Return distance rounded to 1 decimal place
    return Math.round(c * r * 10) / 10;
  }
  
  /**
   * Calculate flight time between two waypoints based on distance and cruise speed
   * @param {Number} distance - Distance in nautical miles
   * @param {Number} windComponent - Headwind/tailwind in knots (positive = headwind)
   * @returns {Number} Flight time in hours
   */
  calculateFlightTime(distance, windComponent = 0) {
    if (distance <= 0) return 0;
    
    // Get effective ground speed
    const groundSpeed = Math.max(this.aircraftPerformance.cruiseSpeed - windComponent, 40); // Min 40kts
    
    // Calculate time in hours
    return distance / groundSpeed;
  }
  
  /**
   * Calculate fuel required for a single leg
   * @param {Number} flightTime - Flight time in hours
   * @returns {Number} Fuel required in lbs
   */
  calculateLegFuel(flightTime) {
    if (flightTime <= 0) return 0;
    
    // Simply multiply flight time by fuel flow
    return flightTime * this.aircraftPerformance.cruiseFuelFlow;
  }
  
  /**
   * Calculate trip fuel for all legs in a route
   * @param {Array} waypoints - Array of waypoint objects
   * @param {Array} windComponents - Array of wind components per leg (optional)
   * @returns {Array} Trip fuel for each leg with distances and times
   */
  calculateTripFuel(waypoints, windComponents = []) {
    if (!waypoints || waypoints.length < 2) return [];
    
    const results = [];
    
    // Loop through waypoints to calculate each leg
    for (let i = 0; i < waypoints.length - 1; i++) {
      const from = waypoints[i];
      const to = waypoints[i + 1];
      
      // Skip if coordinates are missing
      if (!from.coords || !to.coords) {
        results.push({
          from: from.name || `Stop ${i + 1}`,
          to: to.name || `Stop ${i + 2}`,
          distance: 0,
          time: 0,
          fuel: 0,
          wind: 0
        });
        continue;
      }
      
      // Get wind component for this leg (default to 0)
      const wind = windComponents[i] || 0;
      
      // Calculate distance, time, and fuel for this leg
      const distance = this.calculateDistance(from.coords, to.coords);
      const time = this.calculateFlightTime(distance, wind);
      const fuel = this.calculateLegFuel(time);
      
      // Format time for display (hours:minutes)
      const hours = Math.floor(time);
      const minutes = Math.round((time - hours) * 60);
      const timeFormatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      // Store results for this leg
      results.push({
        from: from.name || `Stop ${i + 1}`,
        to: to.name || `Stop ${i + 2}`,
        distance: distance,
        time: time,
        timeFormatted: timeFormatted,
        fuel: Math.round(fuel),
        wind: wind
      });
    }
    
    return results;
  }
  
  /**
   * Calculate cumulative trip fuel for a route
   * @param {Array} waypoints - Array of waypoint objects
   * @param {Array} windComponents - Array of wind components per leg (optional)
   * @returns {Object} Total trip fuel and cumulative fuel at each waypoint
   */
  calculateCumulativeTripFuel(waypoints, windComponents = []) {
    // Get leg-by-leg calculations
    const legResults = this.calculateTripFuel(waypoints, windComponents);
    
    // Calculate cumulative totals
    let totalDistance = 0;
    let totalTime = 0;
    let totalFuel = 0;
    const cumulative = legResults.map((leg, index) => {
      totalDistance += leg.distance;
      totalTime += leg.time;
      totalFuel += leg.fuel;
      
      return {
        waypoint: leg.to,
        waypointIndex: index + 1,
        cumulativeDistance: Math.round(totalDistance * 10) / 10,
        cumulativeTime: totalTime,
        cumulativeTimeFormatted: this.formatTime(totalTime),
        cumulativeFuel: Math.round(totalFuel)
      };
    });
    
    // Insert starting point at beginning
    if (waypoints.length > 0 && legResults.length > 0) {
      cumulative.unshift({
        waypoint: legResults[0].from,
        waypointIndex: 0,
        cumulativeDistance: 0,
        cumulativeTime: 0,
        cumulativeTimeFormatted: "00:00",
        cumulativeFuel: 0
      });
    }
    
    return {
      totalDistance: Math.round(totalDistance * 10) / 10,
      totalTime: totalTime,
      totalTimeFormatted: this.formatTime(totalTime),
      totalFuel: Math.round(totalFuel),
      cumulative: cumulative
    };
  }
  
  /**
   * Format time value (hours) to HH:MM format
   * @param {Number} time - Time in hours
   * @returns {String} Formatted time string
   */
  formatTime(time) {
    const hours = Math.floor(time);
    const minutes = Math.round((time - hours) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
}

export default TripFuelCalculator;