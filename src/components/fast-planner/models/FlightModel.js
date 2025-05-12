/**
 * Flight data model that properly represents the flight structure with legs, stops, and waypoints
 */

/**
 * Represents a complete flight with legs, stops, and waypoints
 */
export class Flight {
  /**
   * Create a new Flight object
   * @param {string} id - Flight ID (UUID)
   * @param {string} name - Flight name/number
   * @param {Object} aircraft - Aircraft object with registration, type, etc.
   * @param {Array<Leg>} legs - Array of flight legs
   */
  constructor(id, name, aircraft, legs = []) {
    this.id = id;
    this.name = name;
    this.aircraft = aircraft;
    this.legs = legs || [];
    this.alternateId = null;
    this.alternateName = null;
    this.alternateSplitPoint = null;
    this.alternateRoute = null;
  }

  /**
   * Get all stops in the flight (departure, intermediate stops, destination)
   * @returns {Array<Stop>} Array of stops
   */
  getAllStops() {
    const stops = [];
    // Add departure from first leg
    if (this.legs.length > 0) {
      stops.push(this.legs[0].from);
    }

    // Add destination from each leg (will include intermediate stops and final destination)
    this.legs.forEach(leg => {
      stops.push(leg.to);
    });

    return stops;
  }

  /**
   * Get the complete list of waypoints for the flight
   * @returns {Array<Object>} Array of all points (stops and waypoints) with role property
   */
  getAllWaypoints() {
    const allPoints = [];
    
    this.legs.forEach((leg, legIndex) => {
      // For first leg, add departure
      if (legIndex === 0) {
        const departure = { ...leg.from, role: 'Dep' };
        allPoints.push(departure);
      }
      
      // Add intermediate waypoints for this leg
      leg.waypoints.forEach(waypoint => {
        allPoints.push({ ...waypoint, role: 'Waypoint', legIndex });
      });
      
      // Add destination for this leg
      const destination = { ...leg.to };
      
      // Set appropriate role
      if (legIndex === this.legs.length - 1) {
        destination.role = 'Des';
      } else {
        destination.role = `Stop${legIndex + 1}`;
      }
      
      allPoints.push(destination);
    });
    
    return allPoints;
  }

  /**
   * Get array of location codes for Palantir API
   * @returns {Array<string>} Array of location codes
   */
  getStopCodes() {
    return this.getAllStops().map(stop => stop.name);
  }

  /**
   * Get combined waypoints array for Palantir API
   * @returns {Array<string>} Array of all waypoint codes including stops
   */
  getCombinedWaypoints() {
    const allPoints = [];
    
    this.legs.forEach((leg, legIndex) => {
      // For first leg, add departure
      if (legIndex === 0) {
        allPoints.push(leg.from.name);
      }
      
      // Add intermediate waypoints
      leg.waypoints.forEach(waypoint => {
        allPoints.push(waypoint.name);
      });
      
      // Add destination
      allPoints.push(leg.to.name);
    });
    
    return allPoints;
  }

  /**
   * Get display waypoints with labels for UI
   * @returns {Array<string>} Array of labeled waypoint codes
   */
  getDisplayWaypoints() {
    const allPoints = [];
    
    this.legs.forEach((leg, legIndex) => {
      // For first leg, add departure with label
      if (legIndex === 0) {
        allPoints.push(`${leg.from.name} (Dep)`);
      }
      
      // Add intermediate waypoints
      leg.waypoints.forEach(waypoint => {
        allPoints.push(waypoint.name);
      });
      
      // Add destination with appropriate label
      if (legIndex === this.legs.length - 1) {
        allPoints.push(`${leg.to.name} (Des)`);
      } else {
        allPoints.push(`${leg.to.name} (Stop${legIndex + 1})`);
      }
    });
    
    return allPoints;
  }
}

/**
 * Represents a leg of a flight between two stops
 */
export class Leg {
  /**
   * Create a new Leg object
   * @param {string} id - Leg ID (UUID)
   * @param {Stop} from - Departure stop
   * @param {Stop} to - Destination stop
   * @param {Array<Waypoint>} waypoints - Array of intermediate waypoints
   */
  constructor(id, from, to, waypoints = []) {
    this.id = id;
    this.from = from; // Stop
    this.to = to; // Stop
    this.waypoints = waypoints || [];
    this.distance = 0;
    this.time = 0;
    this.fuel = 0;
    this.course = 0;
    this.headwind = 0;
  }
  
  /**
   * Calculate basic properties for this leg
   * @param {Function} distanceFunction - Function to calculate distance between points
   * @param {Function} bearingFunction - Function to calculate bearing between points
   */
  calculateProperties(distanceFunction, bearingFunction) {
    // Generate all points in sequence
    const points = this.getAllPoints();
    
    // Calculate total distance
    let totalDistance = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const distance = distanceFunction(
        points[i].lat, points[i].lon, 
        points[i+1].lat, points[i+1].lon
      );
      totalDistance += distance;
    }
    
    // Calculate average course
    if (points.length >= 2) {
      this.course = bearingFunction(
        this.from.lat, this.from.lon,
        this.to.lat, this.to.lon
      );
    }
    
    this.distance = totalDistance;
  }
  
  /**
   * Get all points in order (from, waypoints, to)
   * @returns {Array<Object>} Array of all points in sequence
   */
  getAllPoints() {
    return [this.from, ...this.waypoints, this.to];
  }
  
  /**
   * Get array of point coordinates for mapping
   * @returns {Array<Array<number>>} Array of [lng, lat] coordinates
   */
  getCoordinates() {
    return this.getAllPoints().map(point => [point.lon, point.lat]);
  }
}

/**
 * Represents a stop (airport, rig, etc.) that starts or ends a leg
 */
export class Stop {
  /**
   * Create a new Stop object
   * @param {string} name - Location name/code
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @param {string} type - Location type (AIRPORT, RIG, etc.)
   */
  constructor(name, lat, lon, type = 'UNKNOWN') {
    this.name = name;
    this.lat = lat;
    this.lon = lon;
    this.type = type;
    this.isAirport = type === 'AIRPORT';
    this.isRig = type === 'RIG';
    this.isIntermediate = false; // Stops are never intermediate
  }
}

/**
 * Represents an intermediate waypoint within a leg
 * Extends Stop with additional properties
 */
export class Waypoint extends Stop {
  /**
   * Create a new Waypoint object
   * @param {string} name - Location name/code
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @param {string} type - Location type (default 'WAYPOINT')
   */
  constructor(name, lat, lon, type = 'WAYPOINT') {
    super(name, lat, lon, type);
    this.isIntermediate = true; // Waypoints are always intermediate
  }
}

/**
 * Factory method to create a Flight object from OSDK data
 * @param {Object} flightData - Flight data from OSDK
 * @param {Object} getLocation - Function to get location data by name
 * @returns {Flight} Flight object
 */
export function createFlightFromOSDK(flightData, getLocation) {
  // Create legs from flightData
  const legs = [];
  
  // If we have display waypoints, use those (they have labels)
  const displayWaypoints = flightData.displayWaypoints || [];
  const combinedWaypoints = flightData.combinedWaypoints || [];
  
  // Check if we have leg data to work with
  if (flightData.legIds && flightData.legIds.length > 0) {
    // Process each leg
    for (let i = 0; i < flightData.legIds.length; i++) {
      const legId = flightData.legIds[i];
      const legData = flightData.legs && flightData.legs[i];
      
      if (legData && legData.waypointIds && legData.waypointIds.length >= 2) {
        // Get from and to locations
        const fromName = legData.waypointIds[0];
        const toName = legData.waypointIds[legData.waypointIds.length - 1];
        
        const fromLoc = getLocation(fromName);
        const toLoc = getLocation(toName);
        
        if (fromLoc && toLoc) {
          // Create from and to stops
          const from = new Stop(fromLoc.name, fromLoc.latitude, fromLoc.longitude, fromLoc.type);
          const to = new Stop(toLoc.name, toLoc.latitude, toLoc.longitude, toLoc.type);
          
          // Process intermediate waypoints (between from and to)
          const intermediateWaypoints = [];
          for (let j = 1; j < legData.waypointIds.length - 1; j++) {
            const wpName = legData.waypointIds[j];
            const wpLoc = getLocation(wpName);
            
            if (wpLoc) {
              const waypoint = new Waypoint(wpLoc.name, wpLoc.latitude, wpLoc.longitude, wpLoc.type);
              intermediateWaypoints.push(waypoint);
            }
          }
          
          // Create leg
          const leg = new Leg(legId, from, to, intermediateWaypoints);
          legs.push(leg);
        }
      }
    }
  } 
  // If we don't have leg data but have waypoints, create legs from waypoints
  else if ((displayWaypoints.length > 0 || combinedWaypoints.length > 0) && flightData.stopsArray && flightData.stopsArray.length >= 2) {
    // Use the stops array to define the legs
    const stops = flightData.stopsArray;
    
    // Used cleaned list of waypoints (without labels if using displayWaypoints)
    const waypointsList = displayWaypoints.length > 0 
      ? displayWaypoints.map(wp => wp.replace(/\s*\([^)]*\)\s*$/, '').trim())
      : combinedWaypoints;
    
    // Create legs from stops, placing waypoints between appropriate stops
    for (let i = 0; i < stops.length - 1; i++) {
      const fromName = stops[i];
      const toName = stops[i + 1];
      
      const fromLoc = getLocation(fromName);
      const toLoc = getLocation(toName);
      
      if (fromLoc && toLoc) {
        // Create from and to stops
        const from = new Stop(fromLoc.name, fromLoc.latitude, fromLoc.longitude, fromLoc.type);
        const to = new Stop(toLoc.name, toLoc.latitude, toLoc.longitude, toLoc.type);
        
        // Find the indices of these stops in the waypoints list
        const fromIndex = waypointsList.findIndex(wp => wp.toUpperCase() === fromName.toUpperCase());
        const toIndex = waypointsList.findIndex(wp => wp.toUpperCase() === toName.toUpperCase());
        
        // If both stops are in the waypoints list and in correct order
        if (fromIndex !== -1 && toIndex !== -1 && fromIndex < toIndex) {
          // Get any waypoints between these stops
          const intermediateWaypoints = [];
          for (let j = fromIndex + 1; j < toIndex; j++) {
            const wpName = waypointsList[j];
            const wpLoc = getLocation(wpName);
            
            if (wpLoc) {
              const waypoint = new Waypoint(wpLoc.name, wpLoc.latitude, wpLoc.longitude, wpLoc.type);
              intermediateWaypoints.push(waypoint);
            }
          }
          
          // Create leg
          const leg = new Leg(
            `generated-leg-${i}`, // Generate a temporary ID
            from, 
            to, 
            intermediateWaypoints
          );
          legs.push(leg);
        } else {
          // If stops aren't found in waypoints list, just create a direct leg
          const leg = new Leg(
            `generated-leg-${i}`, // Generate a temporary ID
            from, 
            to, 
            []
          );
          legs.push(leg);
        }
      }
    }
  }
  
  // Create flight object
  const flight = new Flight(
    flightData.id || flightData.flightId || 'new-flight',
    flightData.flightNumber || flightData.name || 'New Flight',
    flightData.aircraft || { id: flightData.aircraftId, registration: '', type: '' },
    legs
  );
  
  // Add alternate route info if available
  if (flightData.alternateLegIds && flightData.alternateLegIds.length > 0) {
    flight.alternateId = flightData.alternateLegIds[0];
    flight.alternateName = flightData.alternateName;
    flight.alternateSplitPoint = flightData.alternateSplitPoint;
  }
  
  return flight;
}

/**
 * Export all models
 */
export default {
  Flight,
  Leg,
  Stop,
  Waypoint,
  createFlightFromOSDK
};