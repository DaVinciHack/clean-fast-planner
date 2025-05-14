/**
 * WindCalculations.js
 * 
 * Module for calculating wind effects on flight routes
 * Handles headwind/tailwind components, crosswind, and effects on groundspeed
 */

/**
 * Convert degrees to radians
 * @param {number} degrees - Angle in degrees
 * @returns {number} Angle in radians
 */
const degreesToRadians = (degrees) => {
  return degrees * Math.PI / 180;
};

/**
 * Convert radians to degrees
 * @param {number} radians - Angle in radians
 * @returns {number} Angle in degrees
 */
const radiansToDegrees = (radians) => {
  return radians * 180 / Math.PI;
};

/**
 * Calculate the relative angle between two compass bearings
 * @param {number} course - Aircraft course in degrees (0-360)
 * @param {number} windDirection - Direction wind is coming FROM in degrees (0-360)
 * @returns {number} Angle between course and wind in degrees (0-180)
 */
const calculateWindAngle = (course, windDirection) => {
  // Convert wind direction from meteorological (direction wind is coming FROM)
  // to mathematical (direction wind is going TO)
  const windDirectionMath = (windDirection + 180) % 360;
  
  // Calculate the absolute difference between the two angles
  let angleDiff = Math.abs(course - windDirectionMath);
  
  // Ensure the result is the smaller angle (max 180 degrees)
  if (angleDiff > 180) {
    angleDiff = 360 - angleDiff;
  }
  
  return angleDiff;
};

/**
 * Calculate the headwind/tailwind component
 * Positive value = headwind, Negative value = tailwind
 * @param {number} windSpeed - Wind speed in knots
 * @param {number} course - Aircraft course in degrees (0-360)
 * @param {number} windDirection - Direction wind is coming FROM in degrees (0-360)
 * @returns {number} Headwind/tailwind component in knots
 */
const calculateHeadwindComponent = (windSpeed, course, windDirection) => {
  // Convert wind direction from meteorological to mathematical
  const windDirectionMath = (windDirection + 180) % 360;
  
  // Convert to radians
  const courseRad = degreesToRadians(course);
  const windRad = degreesToRadians(windDirectionMath);
  
  // Calculate headwind/tailwind component
  // Note: The negative sign is because a headwind (wind coming from ahead)
  // means the angle diff is near 180°, which gives a negative cosine
  return -windSpeed * Math.cos(courseRad - windRad);
};

/**
 * Calculate the crosswind component
 * @param {number} windSpeed - Wind speed in knots
 * @param {number} course - Aircraft course in degrees (0-360)
 * @param {number} windDirection - Direction wind is coming FROM in degrees (0-360)
 * @returns {number} Crosswind component in knots (positive = from right, negative = from left)
 */
const calculateCrosswindComponent = (windSpeed, course, windDirection) => {
  // Convert wind direction from meteorological to mathematical
  const windDirectionMath = (windDirection + 180) % 360;
  
  // Convert to radians
  const courseRad = degreesToRadians(course);
  const windRad = degreesToRadians(windDirectionMath);
  
  // Calculate crosswind component
  return windSpeed * Math.sin(courseRad - windRad);
};

/**
 * Calculate the ground speed of an aircraft given airspeed and wind
 * @param {number} airspeed - Aircraft's airspeed in knots
 * @param {number} course - Aircraft's course in degrees (0-360)
 * @param {number} windSpeed - Wind speed in knots
 * @param {number} windDirection - Direction wind is coming FROM in degrees (0-360)
 * @returns {number} Ground speed in knots
 */
const calculateGroundSpeed = (airspeed, course, windSpeed, windDirection) => {
  // Calculate headwind/tailwind component
  const headwindComponent = calculateHeadwindComponent(windSpeed, course, windDirection);
  
  // Calculate crosswind component
  const crosswindComponent = calculateCrosswindComponent(windSpeed, course, windDirection);
  
  // Calculate ground speed
  // Ground speed = airspeed - headwind component
  // (headwind is positive, so we subtract)
  const groundSpeed = airspeed - headwindComponent;
  
  // We include a small correction for crosswind effect on groundspeed
  // This is a simplification, but provides a more accurate estimate
  const crosswindCorrection = Math.abs(crosswindComponent) > 0 
    ? -0.02 * Math.pow(crosswindComponent, 2) / airspeed 
    : 0;
  
  return groundSpeed + crosswindCorrection;
};

/**
 * Calculate the course angle between two waypoints
 * @param {Object} from - Starting waypoint with lat, lon properties
 * @param {Object} to - Ending waypoint with lat, lon properties
 * @returns {number} Course in degrees (0-360)
 */
const calculateCourse = (from, to) => {
  const fromLat = degreesToRadians(from.lat);
  const fromLon = degreesToRadians(from.lon);
  const toLat = degreesToRadians(to.lat);
  const toLon = degreesToRadians(to.lon);
  
  const y = Math.sin(toLon - fromLon) * Math.cos(toLat);
  const x = Math.cos(fromLat) * Math.sin(toLat) -
            Math.sin(fromLat) * Math.cos(toLat) * Math.cos(toLon - fromLon);
  
  let bearing = radiansToDegrees(Math.atan2(y, x));
  bearing = (bearing + 360) % 360; // Normalize to 0-360
  
  return bearing;
};

/**
 * Calculate flight time with wind adjustments
 * @param {number} distance - Distance in nautical miles
 * @param {number} airspeed - Aircraft airspeed in knots
 * @param {number} course - Course in degrees (0-360)
 * @param {number} windSpeed - Wind speed in knots
 * @param {number} windDirection - Direction wind is coming FROM in degrees (0-360)
 * @returns {number} Flight time in hours
 */
const calculateWindAdjustedTime = (distance, airspeed, course, windSpeed, windDirection) => {
  // If there's no wind, use simple calculation
  if (windSpeed === 0) {
    return distance / airspeed;
  }
  
  // Calculate ground speed with wind adjustment
  const groundSpeed = calculateGroundSpeed(airspeed, course, windSpeed, windDirection);
  
  // Calculate time (hours) = distance / groundSpeed
  return distance / groundSpeed;
};

/**
 * Calculate additional fuel needed due to wind conditions
 * @param {number} baseFuelBurn - Base fuel burn rate in lbs/hr
 * @param {number} time - Flight time in hours
 * @param {number} headwindComponent - Headwind component in knots
 * @returns {number} Additional fuel in lbs
 */
const calculateWindAdjustedFuel = (baseFuelBurn, time, headwindComponent) => {
  // In a headwind, aircraft typically burns slightly more fuel
  // This is a simplified model - in reality, the relationship is complex
  // For positive headwind values (true headwind), we increase fuel burn slightly
  let adjustmentFactor = 1.0;
  
  if (headwindComponent > 0) {
    // Increase fuel burn by up to 5% for strong headwinds
    adjustmentFactor = 1.0 + Math.min(headwindComponent / 100, 0.05);
  } else if (headwindComponent < 0) {
    // Decrease fuel burn by up to 3% for tailwinds
    // Tailwind component is negative, so we add its absolute value
    adjustmentFactor = 1.0 - Math.min(Math.abs(headwindComponent) / 150, 0.03);
  }
  
  return baseFuelBurn * time * adjustmentFactor;
};

/**
 * Calculate leg information with wind adjustments
 * @param {Object} from - Starting waypoint with lat, lon properties
 * @param {Object} to - Ending waypoint with lat, lon properties
 * @param {number} distance - Distance in nautical miles
 * @param {Object} aircraft - Aircraft object with airspeed and fuelBurn properties
 * @param {Object} weather - Weather object with windSpeed and windDirection properties
 * @returns {Object} Object with time, fuel, headwind, groundSpeed properties
 */
const calculateLegWithWind = (from, to, distance, aircraft, weather) => {
  // Default values if data is missing
  const airspeed = aircraft?.cruiseSpeed || 145;
  const fuelBurn = aircraft?.fuelBurn || 1100;
  const windSpeed = weather?.windSpeed || 0;
  const windDirection = weather?.windDirection || 0;
  
  // Calculate course between waypoints
  const course = calculateCourse(from, to);
  
  // Calculate headwind component
  const headwindComponent = calculateHeadwindComponent(windSpeed, course, windDirection);
  
  // Calculate crosswind component
  const crosswindComponent = calculateCrosswindComponent(windSpeed, course, windDirection);
  
  // Calculate groundspeed
  const groundSpeed = calculateGroundSpeed(airspeed, course, windSpeed, windDirection);
  
  // Calculate time with wind adjustment
  const time = calculateWindAdjustedTime(distance, airspeed, course, windSpeed, windDirection);
  
  // Calculate fuel with wind adjustment
  const fuel = calculateWindAdjustedFuel(fuelBurn, time, headwindComponent);
  
  return {
    time,
    fuel,
    headwindComponent,
    crosswindComponent,
    groundSpeed,
    course
  };
};

export {
  calculateWindAngle,
  calculateHeadwindComponent,
  calculateCrosswindComponent,
  calculateGroundSpeed,
  calculateCourse,
  calculateWindAdjustedTime,
  calculateWindAdjustedFuel,
  calculateLegWithWind
};
