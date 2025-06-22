/**
 * RouteGeometry.js
 * 
 * Utilities for route detection and geometric calculations used by Alternate Mode.
 * Provides functions to detect if a click point is on a route, find split points,
 * and locate nearest fuel-capable locations.
 * 
 * @aviation-safety: Uses only real waypoint coordinates, no dummy data
 */

/**
 * Calculate the distance between two points using Haversine formula
 * @param {Object} point1 - {lat, lng} coordinates
 * @param {Object} point2 - {lat, lng} coordinates  
 * @returns {number} Distance in nautical miles
 */
const calculateDistance = (point1, point2) => {
  const R = 3440.065; // Earth's radius in nautical miles
  const dLat = (point2.lat - point1.lat) * Math.PI / 180;
  const dLng = (point2.lng - point1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * Calculate the bearing from point1 to point2
 * @param {Object} point1 - {lat, lng} coordinates
 * @param {Object} point2 - {lat, lng} coordinates
 * @returns {number} Bearing in degrees (0-360)
 */
const calculateBearing = (point1, point2) => {
  const dLng = (point2.lng - point1.lng) * Math.PI / 180;
  const lat1 = point1.lat * Math.PI / 180;
  const lat2 = point2.lat * Math.PI / 180;
  
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  
  const bearing = Math.atan2(y, x) * 180 / Math.PI;
  return (bearing + 360) % 360;
};

/**
 * Calculate the shortest distance from a point to a line segment
 * @param {Object} point - Click point {lat, lng}
 * @param {Object} lineStart - Start of line segment {lat, lng}
 * @param {Object} lineEnd - End of line segment {lat, lng}
 * @returns {Object} {distance: number, closestPoint: {lat, lng}, t: number}
 */
const distancePointToLineSegment = (point, lineStart, lineEnd) => {
  // Convert to meters for calculation accuracy
  const R = 6371000; // Earth's radius in meters
  const toRadians = (deg) => deg * Math.PI / 180;
  
  const lat1 = toRadians(lineStart.lat);
  const lng1 = toRadians(lineStart.lng);
  const lat2 = toRadians(lineEnd.lat);
  const lng2 = toRadians(lineEnd.lng);
  const lat3 = toRadians(point.lat);
  const lng3 = toRadians(point.lng);
  
  // Calculate cross track distance using spherical trigonometry
  const dLng13 = lng3 - lng1;
  const dLng12 = lng2 - lng1;
  
  const bearing13 = Math.atan2(
    Math.sin(dLng13) * Math.cos(lat3),
    Math.cos(lat1) * Math.sin(lat3) - Math.sin(lat1) * Math.cos(lat3) * Math.cos(dLng13)
  );
  
  const bearing12 = Math.atan2(
    Math.sin(dLng12) * Math.cos(lat2),
    Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng12)
  );
  
  const distance13 = Math.acos(
    Math.sin(lat1) * Math.sin(lat3) + Math.cos(lat1) * Math.cos(lat3) * Math.cos(dLng13)
  ) * R;
  
  const crossTrackDistance = Math.asin(Math.sin(distance13 / R) * Math.sin(bearing13 - bearing12)) * R;
  
  // Convert back to nautical miles
  const distanceNM = Math.abs(crossTrackDistance) / 1852;
  
  // Calculate the closest point on the line segment
  const distance12 = Math.acos(
    Math.sin(lat1) * Math.sin(lat2) + Math.cos(lat1) * Math.cos(lat2) * Math.cos(dLng12)
  ) * R;
  
  const alongTrackDistance = Math.acos(
    Math.cos(distance13 / R) / Math.cos(crossTrackDistance / R)
  ) * R;
  
  // Calculate parameter t (0 = start, 1 = end)
  let t = alongTrackDistance / distance12;
  
  // Clamp t to [0, 1] for line segment
  if (t < 0) t = 0;
  if (t > 1) t = 1;
  
  // Calculate closest point using interpolation
  const closestPoint = {
    lat: lineStart.lat + t * (lineEnd.lat - lineStart.lat),
    lng: lineStart.lng + t * (lineEnd.lng - lineEnd.lng)
  };
  
  return {
    distance: distanceNM,
    closestPoint,
    t
  };
};

/**
 * Check if a point is on the route within tolerance
 * @param {Object} clickPoint - {lat, lng} coordinates of click
 * @param {Array} waypoints - Array of waypoint objects with lat/lng
 * @param {number} tolerance - Maximum distance in nautical miles (default: 5 NM)
 * @returns {Object} {isOnRoute: boolean, splitPoint?: {lat, lng, index, t}}
 */
export const isPointOnRoute = (clickPoint, waypoints, tolerance = 5.0) => {
  if (!clickPoint || !waypoints || waypoints.length < 2) {
    return { isOnRoute: false };
  }
  
  let minDistance = Infinity;
  let bestSplit = null;
  
  // Check each route segment
  for (let i = 0; i < waypoints.length - 1; i++) {
    const start = waypoints[i];
    const end = waypoints[i + 1];
    
    // Skip if waypoints don't have valid coordinates
    if (!start.lat || !start.lng || !end.lat || !end.lng) {
      continue;
    }
    
    const result = distancePointToLineSegment(clickPoint, start, end);
    
    if (result.distance < minDistance) {
      minDistance = result.distance;
      bestSplit = {
        lat: result.closestPoint.lat,
        lng: result.closestPoint.lng,
        index: i, // Index of the segment start waypoint
        t: result.t // Parameter along the segment (0-1)
      };
    }
  }
  
  const isOnRoute = minDistance <= tolerance;
  
  return {
    isOnRoute,
    splitPoint: isOnRoute ? bestSplit : null,
    distance: minDistance
  };
};

/**
 * Find the closest point on the route to a given point
 * @param {Object} clickPoint - {lat, lng} coordinates
 * @param {Array} waypoints - Array of waypoint objects
 * @returns {Object} {closestPoint: {lat, lng}, index: number, distance: number}
 */
export const findClosestRoutePoint = (clickPoint, waypoints) => {
  if (!clickPoint || !waypoints || waypoints.length === 0) {
    return null;
  }
  
  let minDistance = Infinity;
  let closestWaypoint = null;
  let closestIndex = -1;
  
  waypoints.forEach((waypoint, index) => {
    if (waypoint.lat && waypoint.lng) {
      const distance = calculateDistance(clickPoint, waypoint);
      if (distance < minDistance) {
        minDistance = distance;
        closestWaypoint = waypoint;
        closestIndex = index;
      }
    }
  });
  
  return {
    closestPoint: closestWaypoint,
    index: closestIndex,
    distance: minDistance
  };
};

/**
 * Find the nearest fuel-capable location to a given point
 * @param {Object} clickPoint - {lat, lng} coordinates
 * @param {Array} locations - Array of location objects with fuel capability
 * @param {number} maxDistance - Maximum search distance in nautical miles
 * @returns {Object|null} Nearest fuel-capable location or null
 */
export const findNearestFuelLocation = (clickPoint, locations, maxDistance = 50) => {
  if (!clickPoint || !locations || locations.length === 0) {
    return null;
  }
  
  let nearestLocation = null;
  let minDistance = Infinity;
  
  locations.forEach(location => {
    // Only consider fuel-capable locations
    if (!location.hasFuel) {
      return;
    }
    
    // Skip if location doesn't have valid coordinates
    if (!location.lat || !location.lng) {
      return;
    }
    
    const distance = calculateDistance(clickPoint, location);
    
    if (distance <= maxDistance && distance < minDistance) {
      minDistance = distance;
      nearestLocation = {
        ...location,
        distance
      };
    }
  });
  
  return nearestLocation;
};

/**
 * Find the nearest airport to a given point
 * @param {Object} clickPoint - {lat, lng} coordinates
 * @param {Array} airports - Array of airport objects
 * @param {number} maxDistance - Maximum search distance in nautical miles
 * @returns {Object|null} Nearest airport or null
 */
export const findNearestAirport = (clickPoint, airports, maxDistance = 100) => {
  if (!clickPoint || !airports || airports.length === 0) {
    return null;
  }
  
  let nearestAirport = null;
  let minDistance = Infinity;
  
  airports.forEach(airport => {
    // Skip if airport doesn't have valid coordinates
    if (!airport.lat || !airport.lng) {
      return;
    }
    
    const distance = calculateDistance(clickPoint, airport);
    
    if (distance <= maxDistance && distance < minDistance) {
      minDistance = distance;
      nearestAirport = {
        ...airport,
        distance
      };
    }
  });
  
  return nearestAirport;
};

/**
 * Calculate the split point for inserting an alternate route
 * @param {Array} waypoints - Current route waypoints
 * @param {number} splitIndex - Index where to split the route
 * @param {number} t - Parameter along the segment (0-1)
 * @param {Object} alternateDestination - Alternate destination coordinates
 * @returns {Array} New waypoints array with alternate route
 */
export const calculateAlternateRoute = (waypoints, splitIndex, t, alternateDestination) => {
  if (!waypoints || splitIndex < 0 || splitIndex >= waypoints.length - 1) {
    return waypoints;
  }
  
  const start = waypoints[splitIndex];
  const end = waypoints[splitIndex + 1];
  
  // Calculate the exact split point
  const splitPoint = {
    lat: start.lat + t * (end.lat - start.lat),
    lng: start.lng + t * (end.lng - start.lng),
    name: `Split Point ${splitIndex + 1}`,
    type: 'SPLIT_POINT'
  };
  
  // Create new route with alternate
  const newWaypoints = [
    ...waypoints.slice(0, splitIndex + 1),
    splitPoint,
    {
      ...alternateDestination,
      type: 'ALTERNATE_DESTINATION'
    },
    splitPoint, // Return to split point
    ...waypoints.slice(splitIndex + 1)
  ];
  
  return newWaypoints;
};

export default {
  isPointOnRoute,
  findClosestRoutePoint,
  findNearestFuelLocation,
  findNearestAirport,
  calculateAlternateRoute,
  calculateDistance,
  calculateBearing
};