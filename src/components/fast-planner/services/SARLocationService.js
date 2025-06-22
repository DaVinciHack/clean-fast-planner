/**
 * SARLocationService.js
 * 
 * Service for managing SAR waypoint creation and tracking.
 * Handles creation of persistent waypoints for coordinates where no physical location exists.
 * Uses OSDK addWaypoint and deleteWaypoint actions for persistent flight plan references.
 * 
 * @aviation-safety: Creates real OSDK waypoints that persist as flight plan references
 * @integration: Works with AlternateMode for SAR waypoint creation workflow
 */

import client from '../../../client';

/**
 * Cache for created SAR waypoints to track them during session
 */
let sarWaypointCache = new Map();

/**
 * Creates a persistent SAR waypoint in OSDK for the given coordinates
 * @param {Object} coordinates - Lat/lng coordinates
 * @param {number} coordinates.lat - Latitude
 * @param {number} coordinates.lng - Longitude  
 * @param {string} [customName] - Optional custom name for the waypoint
 * @returns {Promise<Object>} Created waypoint object
 */
export const createSARWaypoint = async (coordinates, customName = null) => {
  try {
    // Validate coordinates
    if (!coordinates || typeof coordinates.lat !== 'number' || typeof coordinates.lng !== 'number') {
      throw new Error('Invalid coordinates provided');
    }

    // Generate timestamp-based name
    const timestamp = new Date().toISOString().slice(0, 16).replace('T', '_');
    const defaultName = `SAR_${timestamp.replace(/[:-]/g, '')}`;
    const waypointName = customName || defaultName;
    
    console.log(`🎯 Creating SAR waypoint at ${coordinates.lat}, ${coordinates.lng} with name: ${waypointName}`);
    
    // Import the SDK dynamically
    const sdk = await import('@flight-app/sdk');
    
    // Check if addWaypoint action exists
    if (!sdk.addWaypoint) {
      throw new Error('OSDK addWaypoint action not available');
    }
    
    // Create the SAR waypoint using OSDK action
    const waypointData = {
      name: waypointName,
      latitude: coordinates.lat,
      longitude: coordinates.lng,
      locationType: 'SAR_SEARCH_AREA',
      isSARLocation: true,
      description: `Search area created for SAR operations at ${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`,
      createdAt: new Date().toISOString(),
      isTemporary: false // Ensure it persists as flight plan reference
    };
    
    const sarWaypoint = await client(sdk.addWaypoint).applyAction(waypointData);
    
    // Add to cache for tracking
    sarWaypointCache.set(sarWaypoint.id || waypointName, {
      waypoint: sarWaypoint,
      coordinates,
      createdAt: new Date(),
      name: waypointName
    });
    
    console.log(`✅ SAR waypoint created successfully:`, sarWaypoint);
    
    return sarWaypoint;
    
  } catch (error) {
    console.error('Failed to create SAR waypoint:', error);
    
    // Provide user-friendly error messages
    if (error.message.includes('addWaypoint action not available')) {
      throw new Error('SAR waypoint creation not available - OSDK action missing');
    } else if (error.message.includes('Invalid coordinates')) {
      throw new Error('Invalid coordinates provided for SAR waypoint');
    } else {
      throw new Error(`Failed to create SAR waypoint: ${error.message}`);
    }
  }
};

/**
 * Deletes a SAR waypoint from OSDK
 * @param {string} waypointId - ID of the waypoint to delete
 * @returns {Promise<void>}
 */
export const deleteSARWaypoint = async (waypointId) => {
  try {
    console.log(`🗑️ Deleting SAR waypoint: ${waypointId}`);
    
    // Import the SDK dynamically
    const sdk = await import('@flight-app/sdk');
    
    // Check if deleteWaypoint action exists
    if (!sdk.deleteWaypoint) {
      throw new Error('OSDK deleteWaypoint action not available');
    }
    
    // Delete the waypoint using OSDK action
    await client(sdk.deleteWaypoint).applyAction({
      waypointId: waypointId
    });
    
    // Remove from cache
    sarWaypointCache.delete(waypointId);
    
    console.log(`✅ SAR waypoint deleted successfully: ${waypointId}`);
    
  } catch (error) {
    console.error('Failed to delete SAR waypoint:', error);
    throw new Error(`Failed to delete SAR waypoint: ${error.message}`);
  }
};

/**
 * Lists all SAR waypoints for reference/management
 * @returns {Promise<Array>} Array of SAR waypoints
 */
export const listSARWaypoints = async () => {
  try {
    console.log('📋 Listing SAR waypoints...');
    
    // Import the SDK dynamically
    const sdk = await import('@flight-app/sdk');
    
    // Check if getWaypoints action exists
    if (!sdk.getWaypoints) {
      console.warn('OSDK getWaypoints action not available, returning cached waypoints');
      return Array.from(sarWaypointCache.values()).map(cache => cache.waypoint);
    }
    
    // Get all SAR waypoints for reference/management
    const waypoints = await client(sdk.getWaypoints).applyAction({
      filter: { isSARLocation: true }
    });
    
    console.log(`📋 Found ${waypoints.length} SAR waypoints`);
    
    return waypoints;
    
  } catch (error) {
    console.error('Failed to list SAR waypoints:', error);
    // Return cached waypoints as fallback
    return Array.from(sarWaypointCache.values()).map(cache => cache.waypoint);
  }
};

/**
 * Gets cached SAR waypoints created during current session
 * @returns {Array} Array of cached SAR waypoint data
 */
export const getCachedSARWaypoints = () => {
  return Array.from(sarWaypointCache.values());
};

/**
 * Clears the SAR waypoint cache (does not delete waypoints from OSDK)
 */
export const clearSARWaypointCache = () => {
  console.log('🧹 Clearing SAR waypoint cache');
  sarWaypointCache.clear();
};

/**
 * Checks if coordinates need a SAR waypoint (no existing location nearby)
 * @param {Object} coordinates - Lat/lng coordinates
 * @param {Array} allLocations - Array of all available locations
 * @param {number} [tolerance] - Distance tolerance in kilometers (default: 0.5km)
 * @returns {boolean} True if SAR waypoint is needed
 */
export const needsSARWaypoint = (coordinates, allLocations = [], tolerance = 0.5) => {
  if (!coordinates || !coordinates.lat || !coordinates.lng) {
    return false;
  }
  
  // Simple distance check - if any location is within tolerance, no SAR waypoint needed
  for (const location of allLocations) {
    if (!location.lat || !location.lng) continue;
    
    const distance = getDistanceKm(
      { lat: coordinates.lat, lng: coordinates.lng },
      { lat: location.lat, lng: location.lng }
    );
    
    if (distance < tolerance) {
      return false; // Existing location found nearby
    }
  }
  
  return true; // No nearby location, SAR waypoint needed
};

/**
 * Finds the nearest location to given coordinates
 * @param {Object} coordinates - Lat/lng coordinates  
 * @param {Array} allLocations - Array of all available locations
 * @returns {Object|null} Nearest location or null if none found
 */
export const findNearestLocation = (coordinates, allLocations = []) => {
  if (!coordinates || !coordinates.lat || !coordinates.lng || allLocations.length === 0) {
    return null;
  }
  
  let nearestLocation = null;
  let minDistance = Infinity;
  
  for (const location of allLocations) {
    if (!location.lat || !location.lng) continue;
    
    const distance = getDistanceKm(
      { lat: coordinates.lat, lng: coordinates.lng },
      { lat: location.lat, lng: location.lng }
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      nearestLocation = { ...location, distance };
    }
  }
  
  return nearestLocation;
};

/**
 * Calculate distance between two lat/lng points in kilometers
 * @param {Object} point1 - First point with lat/lng
 * @param {Object} point2 - Second point with lat/lng  
 * @returns {number} Distance in kilometers
 */
const getDistanceKm = (point1, point2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(point2.lat - point1.lat);
  const dLng = toRadians(point2.lng - point1.lng);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.lat)) * Math.cos(toRadians(point2.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
};

/**
 * Convert degrees to radians
 * @param {number} degrees - Degrees to convert
 * @returns {number} Radians
 */
const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * Generates a user-friendly SAR waypoint name based on location context
 * @param {Object} coordinates - Lat/lng coordinates
 * @param {string} [context] - Optional context like 'Search', 'Rescue', etc.
 * @returns {string} Generated waypoint name
 */
export const generateSARWaypointName = (coordinates, context = 'Search') => {
  const lat = coordinates.lat.toFixed(4);
  const lng = coordinates.lng.toFixed(4);
  const timestamp = new Date().toISOString().slice(11, 16).replace(':', '');
  
  return `SAR_${context}_${lat}_${lng}_${timestamp}`;
};