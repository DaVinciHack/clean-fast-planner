/**
 * SegmentUtils.js
 * 
 * Utilities for segment-aware fuel management in refuel flights.
 * Handles the aviation logic where refuel stops create separate flight segments,
 * each with independent fuel requirements.
 */

/**
 * Detect which flight segment a location belongs to based on refuel stops
 * 
 * @param {string} locationName - Name of the location to check
 * @param {Array} waypoints - Array of flight waypoints
 * @param {Array} refuelStops - Array of refuel stop indices (e.g., [2, 4])
 * @param {string} purpose - 'requirements' (fuel TO REACH) or 'summary' (fuel TO CONTINUE FROM)
 * @returns {number} Segment number (1, 2, 3, etc.)
 */
export function detectLocationSegment(locationName, waypoints, refuelStops = [], purpose = 'requirements') {
  if (!waypoints || waypoints.length === 0) {
    return 1; // Default to segment 1
  }
  
  // Filter out navigation waypoints to match stop card logic
  const landingStopsOnly = waypoints.filter(wp => {
    const isWaypoint = 
      wp.pointType === 'NAVIGATION_WAYPOINT' || 
      wp.isWaypoint === true || 
      wp.type === 'WAYPOINT';
    return !isWaypoint;
  });
  
  // Find the location index in landing stops
  const locationIndex = landingStopsOnly.findIndex(wp => 
    wp.name === locationName || 
    wp.stopName === locationName ||
    wp.location === locationName
  );
  
  if (locationIndex === -1) {
    console.warn(`🚨 SegmentUtils: Location "${locationName}" not found in waypoints`);
    return 1; // Default to segment 1
  }
  
  // Convert to card index (1-based)
  const cardIndex = locationIndex + 1;
  
  // If no refuel stops, everything is segment 1
  if (!refuelStops || refuelStops.length === 0) {
    return 1;
  }
  
  // Sort refuel stops to ensure proper order
  const sortedRefuelStops = [...refuelStops].sort((a, b) => a - b);
  
  // 🛩️ AVIATION LOGIC: Determine segment based on purpose
  let segment = 1;
  
  // 🚨 SPECIAL CASE: For ARA fuel requirements, first landing stop after departure is ALWAYS segment 1
  // because ARA fuel for first rig must be carried from departure
  if (purpose === 'requirements' && landingStopsOnly.length >= 2) {
    // The first landing stop after departure is at array index 1 (second element)
    // Convert to cardIndex (1-based): array index 1 = cardIndex 2
    const firstRigCardIndex = 2;
    if (cardIndex === firstRigCardIndex) {
      return 1; // First rig after departure is always segment 1 for fuel requirements
    }
  }
  
  for (const refuelStopIndex of sortedRefuelStops) {
    if (purpose === 'requirements') {
      // REQUIREMENTS: Fuel needed TO REACH this location
      // Refuel stop itself belongs to the segment BEFORE it (carried from previous segment)
      // ✅ CRITICAL AVIATION FIX: For REQUIREMENTS, fuel to reach ANY location 
      // is carried from the segment that STARTED before the NEXT refuel stop
      // This means locations AT the refuel stop still get fuel from previous segment
      if (cardIndex <= refuelStopIndex) {
        break; // Location is at or before refuel stop - fuel carried from current segment
      }
      segment++; // Location is after this refuel stop
    } else if (purpose === 'summary') {
      // SUMMARY: Fuel needed TO CONTINUE FROM this location  
      // Refuel stop itself belongs to the segment AFTER it (fuel for next segment)
      if (cardIndex < refuelStopIndex) {
        break; // Location is in current segment
      }
      segment++; // Location is at or after this refuel stop
    }
  }
  
  // Removed excessive debug logging
  
  return segment;
}

/**
 * Get all locations in a specific segment
 * 
 * @param {number} segmentNumber - Segment number to get locations for
 * @param {Array} waypoints - Array of flight waypoints  
 * @param {Array} refuelStops - Array of refuel stop indices
 * @returns {Array} Array of location names in the segment
 */
export function getSegmentLocations(segmentNumber, waypoints, refuelStops = []) {
  if (!waypoints || waypoints.length === 0) {
    return [];
  }
  
  // Filter out navigation waypoints
  const landingStopsOnly = waypoints.filter(wp => {
    const isWaypoint = 
      wp.pointType === 'NAVIGATION_WAYPOINT' || 
      wp.isWaypoint === true || 
      wp.type === 'WAYPOINT';
    return !isWaypoint;
  });
  
  const segmentLocations = [];
  
  for (const waypoint of landingStopsOnly) {
    const locationName = waypoint.name || waypoint.stopName || waypoint.location;
    if (locationName) {
      const locationSegment = detectLocationSegment(locationName, waypoints, refuelStops);
      if (locationSegment === segmentNumber) {
        segmentLocations.push(locationName);
      }
    }
  }
  
  return segmentLocations;
}

/**
 * Get segment boundaries for display purposes
 * 
 * @param {Array} waypoints - Array of flight waypoints
 * @param {Array} refuelStops - Array of refuel stop indices
 * @returns {Array} Array of segment information objects
 */
export function getSegmentBoundaries(waypoints, refuelStops = []) {
  if (!waypoints || waypoints.length === 0) {
    return [];
  }
  
  // Filter out navigation waypoints
  const landingStopsOnly = waypoints.filter(wp => {
    const isWaypoint = 
      wp.pointType === 'NAVIGATION_WAYPOINT' || 
      wp.isWaypoint === true || 
      wp.type === 'WAYPOINT';
    return !isWaypoint;
  });
  
  if (landingStopsOnly.length < 2) {
    return [];
  }
  
  const segments = [];
  const sortedRefuelStops = [...refuelStops].sort((a, b) => a - b);
  
  let segmentStart = 0;
  let segmentNumber = 1;
  
  // Create segments based on refuel stops
  for (const refuelStopIndex of sortedRefuelStops) {
    const segmentEnd = refuelStopIndex - 1; // Convert to array index
    
    if (segmentEnd >= segmentStart && segmentEnd < landingStopsOnly.length) {
      const startLocation = landingStopsOnly[segmentStart];
      const endLocation = landingStopsOnly[segmentEnd];
      
      segments.push({
        segmentNumber,
        startLocation: startLocation.name || startLocation.stopName,
        endLocation: endLocation.name || endLocation.stopName,
        isRefuelSegment: true,
        locations: landingStopsOnly.slice(segmentStart, segmentEnd + 1).map(wp => 
          wp.name || wp.stopName
        )
      });
      
      segmentStart = segmentEnd; // Start next segment from refuel stop
      segmentNumber++;
    }
  }
  
  // Add final segment (from last refuel stop or start to destination)
  if (segmentStart < landingStopsOnly.length - 1) {
    const startLocation = landingStopsOnly[segmentStart];
    const endLocation = landingStopsOnly[landingStopsOnly.length - 1];
    
    segments.push({
      segmentNumber,
      startLocation: startLocation.name || startLocation.stopName,
      endLocation: endLocation.name || endLocation.stopName,
      isRefuelSegment: false,
      locations: landingStopsOnly.slice(segmentStart).map(wp => 
        wp.name || wp.stopName
      )
    });
  }
  
  // If no refuel stops, create single segment
  if (segments.length === 0) {
    const startLocation = landingStopsOnly[0];
    const endLocation = landingStopsOnly[landingStopsOnly.length - 1];
    
    segments.push({
      segmentNumber: 1,
      startLocation: startLocation.name || startLocation.stopName,
      endLocation: endLocation.name || endLocation.stopName,
      isRefuelSegment: false,
      locations: landingStopsOnly.map(wp => wp.name || wp.stopName)
    });
  }
  
  return segments;
}

/**
 * Create segment-aware fuel override key
 * 
 * @param {string} locationName - Location name
 * @param {string} fuelType - Type of fuel (extraFuel, araFuel, approachFuel)
 * @param {number} segment - Segment number
 * @returns {string} Segment-aware override key
 */
export function createSegmentFuelKey(locationName, fuelType, segment) {
  if (fuelType === 'extraFuel') {
    // Extra fuel is segment-wide, not location-specific
    return `segment${segment}_extraFuel`;
  } else {
    // Location-specific fuel (ARA, approach) includes both location and segment
    return `segment${segment}_${locationName}_${fuelType}`;
  }
}

/**
 * Parse segment-aware fuel override key
 * 
 * @param {string} key - Segment-aware override key
 * @returns {Object} Parsed key information
 */
export function parseSegmentFuelKey(key) {
  const segmentMatch = key.match(/^segment(\d+)_(.+)$/);
  
  if (!segmentMatch) {
    // Legacy key format - assume segment 1
    const parts = key.split('_');
    return {
      segment: 1,
      locationName: parts[0],
      fuelType: parts[1],
      isLegacyKey: true
    };
  }
  
  const segment = parseInt(segmentMatch[1]);
  const remainder = segmentMatch[2];
  
  if (remainder === 'extraFuel') {
    // Extra fuel is segment-wide
    return {
      segment,
      locationName: null,
      fuelType: 'extraFuel',
      isSegmentWide: true
    };
  } else {
    // Location-specific fuel
    const lastUnderscoreIndex = remainder.lastIndexOf('_');
    const locationName = remainder.substring(0, lastUnderscoreIndex);
    const fuelType = remainder.substring(lastUnderscoreIndex + 1);
    
    return {
      segment,
      locationName,
      fuelType,
      isLocationSpecific: true
    };
  }
}