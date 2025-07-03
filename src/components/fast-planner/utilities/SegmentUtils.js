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
 * @param {string} purpose - Purpose of detection ('requirements' or other)
 * @param {number} cardIndex - Optional: specific card index to check (for duplicate names)
 * @returns {number} Segment number (1, 2, 3, etc.)
 */
export function detectLocationSegment(locationName, waypoints, refuelStops = [], purpose = 'requirements', cardIndex = null) {
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
  let locationIndex = -1;
  
  if (cardIndex !== null) {
    // 🔧 DUPLICATE NAME FIX: Use specific card index if provided
    locationIndex = cardIndex - 1; // Convert from 1-based to 0-based
    console.log(`🔧 DUPLICATE FIX: Using provided cardIndex ${cardIndex} for ${locationName}`);
  } else {
    // Find by name (may have duplicate name issues)
    locationIndex = landingStopsOnly.findIndex(wp => 
      wp.name === locationName || 
      wp.stopName === locationName ||
      wp.location === locationName
    );
  }
  
  if (locationIndex === -1) {
    console.warn(`🚨 SegmentUtils: Location "${locationName}" not found in waypoints`);
    return 1; // Default to segment 1
  }
  
  // Convert to card index (1-based)
  const finalCardIndex = locationIndex + 1;
  
  // If no refuel stops, everything is segment 1
  if (!refuelStops || refuelStops.length === 0) {
    return 1;
  }
  
  // Sort refuel stops to ensure proper order
  const sortedRefuelStops = [...refuelStops].sort((a, b) => a - b);
  
  // Determine which segment based on refuel stop boundaries
  let segment = 1;
  for (const refuelStopIndex of sortedRefuelStops) {
    // ✅ CRITICAL INDEXING FIX: Convert refuelStops (0-based) to cardIndex format (1-based)
    // 🚨 DO NOT REMOVE THIS +1 CONVERSION! 
    // Without this, ARA fuel and approach fuel break when refuel stops are used
    // RefuelStops array uses 0-based indices, but card.index uses 1-based indices
    const refuelStopCardIndex = refuelStopIndex + 1;
    console.log(`🔍 INDEXING FIX: ${locationName} cardIndex=${cardIndex} vs refuelStopCardIndex=${refuelStopCardIndex} (was ${refuelStopIndex})`);
    if (cardIndex <= refuelStopCardIndex) {
      console.log(`✅ MAIN LOGIC: ${locationName} assigned to segment ${segment}`);
      break; // Location is at or before refuel stop - fuel carried from current segment
    }
    segment++; // Location is after this refuel stop
    console.log(`➡️ MAIN LOGIC: ${locationName} moving to segment ${segment}`);
  }
  
  console.log(`🛩️ SegmentUtils: Location "${locationName}" (card ${cardIndex}) is in segment ${segment}`);
  console.log(`🛩️ SegmentUtils: Refuel stops:`, sortedRefuelStops);
  console.log(`🛩️ SegmentUtils: All waypoints:`, landingStopsOnly.map((wp, i) => `${i+1}:${wp.name || wp.stopName}`));
  
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
  
  console.log('🛩️ SegmentUtils: Generated segments:', segments);
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