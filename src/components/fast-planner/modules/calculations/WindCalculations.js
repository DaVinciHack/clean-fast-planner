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
  
  // PALANTIR EXACT MATCH: Use the same calculation method as Palantir
  return calculateGroundSpeedAndTrack(airspeed, windSpeed, windDirection, course).groundSpeed;
};

/**
 * PALANTIR EXACT MATCH: Ground speed & drift calculation
 * This matches the exact calculation in Palantir's calculations.ts
 */
const calculateGroundSpeedAndTrack = (
  cruiseSpeedKnots,  // airspeed
  windSpeed,         // wind speed in knots
  windDirection,     // wind FROM direction (0°=north, 90°=east)
  trackBearing       // intended track bearing (0°=north, 90°=east)
) => {
  // A) Convert "wind from X°" to "wind heading = X+180"
  let windTo = (windDirection + 180) % 360;

  // B) Shift from "aviation angles" (0°=north) to standard math angles (0°=east)
  const headingRad = toRadians(90 - trackBearing);
  const windRad = toRadians(90 - windTo);

  // C) Aircraft velocity vector in standard math coordinates
  const vAx = cruiseSpeedKnots * Math.cos(headingRad);
  const vAy = cruiseSpeedKnots * Math.sin(headingRad);

  // D) Wind velocity vector in standard math coordinates
  const vWx = windSpeed * Math.cos(windRad);
  const vWy = windSpeed * Math.sin(windRad);

  // E) Summation: ground vector
  const vGx = vAx + vWx;
  const vGy = vAy + vWy;

  // F) Ground speed = magnitude
  const groundSpeed = Math.sqrt(vGx * vGx + vGy * vGy);

  // G) Actual ground track in math angles
  let groundTrackMath = toDegrees(Math.atan2(vGy, vGx));
  if (groundTrackMath < 0) {
    groundTrackMath += 360;
  }

  // H) Convert ground track back to aviation angles
  let groundTrackAvi = 90 - groundTrackMath;
  groundTrackAvi = (groundTrackAvi + 360) % 360;

  // I) Drift angle = difference between ground track and intended heading
  let driftAngle = groundTrackAvi - trackBearing;
  // Normalize to -180..180
  driftAngle = ((driftAngle + 180) % 360) - 180;

  console.log(`🔧 PALANTIR MATCH: Track: ${trackBearing}°, Wind: ${windDirection}°@${windSpeed}kts, GS: ${groundSpeed.toFixed(1)}, Drift: ${driftAngle.toFixed(1)}°`);

  return { groundSpeed, driftAngle };
};

// Helper functions to match Palantir's naming
const toRadians = (deg) => (deg * Math.PI) / 180;
const toDegrees = (rad) => (rad * 180) / Math.PI;

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
 * Calculate drift angle (crab angle) needed to maintain course in wind
 * This is particularly important for helicopter operations
 * @param {number} course - Desired ground track in degrees (0-360)
 * @param {number} airspeed - Aircraft's airspeed in knots
 * @param {number} windSpeed - Wind speed in knots
 * @param {number} windDirection - Direction wind is coming FROM in degrees (0-360)
 * @returns {number} Drift angle in degrees (positive = crab right, negative = crab left)
 */
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
  // PALANTIR MATCH: No wind-based fuel adjustment
  // Palantir uses simple: fuel = time × fuelBurn (no adjustment factor)
  // Wind affects time (via ground speed), but not fuel burn rate
  return baseFuelBurn * time;
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
  
  // PALANTIR MATCH: Calculate drift angle using Palantir's exact method
  const { driftAngle } = calculateGroundSpeedAndTrack(airspeed, windSpeed, windDirection, course);
  
  return {
    time,
    fuel,
    headwindComponent: parseFloat(headwindComponent.toFixed(1)),
    crosswindComponent: parseFloat(crosswindComponent.toFixed(1)),
    groundSpeed,
    course,
    driftAngle  // New property, won't break existing code
  };
};

// ENHANCEMENT: Expose this module globally for consistent access across all components
if (typeof window !== 'undefined') {
  window.WindCalculations = {
    calculateWindAngle,
    calculateHeadwindComponent,
    calculateCrosswindComponent,
    calculateGroundSpeed,
    calculateGroundSpeedAndTrack, // NEW: Palantir exact match function
    calculateCourse,
    calculateWindAdjustedTime,
    calculateWindAdjustedFuel,
    calculateLegWithWind,
    calculateDriftAngle
  };
}

export {
  calculateWindAngle,
  calculateHeadwindComponent,
  calculateCrosswindComponent,
  calculateGroundSpeed,
  calculateGroundSpeedAndTrack, // NEW: Palantir exact match function
  calculateCourse,
  calculateWindAdjustedTime,
  calculateWindAdjustedFuel,
  calculateLegWithWind,
  calculateDriftAngle // New function
};
