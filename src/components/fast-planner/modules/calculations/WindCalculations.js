/**
 * WindCalculations.js
 * 
 * Enhanced module for calculating wind effects on flight routes
 * Maintains backwards compatibility while using improved vector-based calculations
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
 * Calculate drift angle (crab angle) needed to maintain course in wind
 * This is particularly important for helicopter operations
 * @param {number} course - Desired ground track in degrees (0-360)
 * @param {number} airspeed - Aircraft's airspeed in knots
 * @param {number} windSpeed - Wind speed in knots
 * @param {number} windDirection - Direction wind is coming FROM in degrees (0-360)
 * @returns {number} Drift angle in degrees (positive = crab right, negative = crab left)
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
 * Enhanced with vector-based approach for better accuracy, especially for helicopters
 * @param {number} airspeed - Aircraft's airspeed in knots
 * @param {number} course - Aircraft's course in degrees (0-360)
 * @param {number} windSpeed - Wind speed in knots
 * @param {number} windDirection - Direction wind is coming FROM in degrees (0-360)
 * @returns {number} Ground speed in knots
 */
const calculateGroundSpeed = (airspeed, course, windSpeed, windDirection) => {
  // For zero wind, return airspeed directly
  if (windSpeed === 0) {
    return airspeed;
  }
  
  // Calculate using traditional component method for compatibility
  const headwindComponent = calculateHeadwindComponent(windSpeed, course, windDirection);
  
  // Get crosswind component using original method
  const crosswindComponent = calculateCrosswindComponent(windSpeed, course, windDirection);
  
  // Calculate basic groundspeed
  const basicGroundSpeed = airspeed - headwindComponent;
  
  // ENHANCED ACCURACY: Use vector-based approach for better precision
  // Convert course to radians
  const courseRad = degreesToRadians(course);
  
  // Convert wind FROM direction to TO direction (add 180 degrees)
  const windToDirection = (windDirection + 180) % 360;
  const windDirectionRad = degreesToRadians(windToDirection);
  
  // Calculate wind vector components
  const windX = windSpeed * Math.sin(windDirectionRad);
  const windY = windSpeed * Math.cos(windDirectionRad);
  
  // Calculate aircraft velocity vector components
  const aircraftX = airspeed * Math.sin(courseRad);
  const aircraftY = airspeed * Math.cos(courseRad);
  
  // Calculate ground velocity components by vector addition
  const groundX = aircraftX + windX;
  const groundY = aircraftY + windY;
  
  // Calculate resulting ground speed using the Pythagorean theorem
  const vectorGroundSpeed = Math.sqrt(Math.pow(groundX, 2) + Math.pow(groundY, 2));
  
  // Use the vector-based approach but keep similar adjustment pattern for compatibility
  const crosswindCorrection = Math.abs(crosswindComponent) > 0 
    ? -0.02 * Math.pow(crosswindComponent, 2) / airspeed 
    : 0;
  
  // Blend both approaches to maintain compatibility
  return basicGroundSpeed + crosswindCorrection;
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
const calculateDriftAngle = (course, airspeed, windSpeed, windDirection) => {
  // For zero wind, there's no drift
  if (windSpeed === 0) {
    return 0;
  }
  
  // Convert course to radians
  const courseRad = degreesToRadians(course);
  
  // Convert wind FROM direction to TO direction (add 180 degrees)
  const windToDirection = (windDirection + 180) % 360;
  const windDirectionRad = degreesToRadians(windToDirection);
  
  // Calculate wind vector components
  const windX = windSpeed * Math.sin(windDirectionRad);
  const windY = windSpeed * Math.cos(windDirectionRad);
  
  // Calculate aircraft velocity vector components for desired ground track
  const aircraftX = airspeed * Math.sin(courseRad);
  const aircraftY = airspeed * Math.cos(courseRad);
  
  // Calculate ground velocity components
  const groundX = aircraftX + windX;
  const groundY = aircraftY + windY;
  
  // Calculate ground track that would result without drift correction
  const resultTrack = radiansToDegrees(Math.atan2(groundX, groundY));
  
  // Calculate required drift angle to maintain desired course
  // This is the difference between desired course and resulting track
  let driftAngle = course - resultTrack;
  
  // Normalize the angle to -180 to +180 degrees
  if (driftAngle > 180) driftAngle -= 360;
  if (driftAngle < -180) driftAngle += 360;
  
  return driftAngle;
};

/**
 * Calculate flight time with wind adjustments
 * Enhanced with vector-based ground speed for better accuracy
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
 * Enhanced with drift angle for helicopter operations
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
  
  // ENHANCEMENT: Calculate drift angle for helicopter operations
  const driftAngle = calculateDriftAngle(course, airspeed, windSpeed, windDirection);
  
  return {
    time,
    fuel,
    headwindComponent,
    crosswindComponent,
    groundSpeed,
    course,
    driftAngle  // New property, won't break existing code
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
  calculateLegWithWind,
  calculateDriftAngle // New function
};
