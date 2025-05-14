/**
 * FlightService.js
 * 
 * Service layer for Palantir OSDK flight operations
 */

import client from '../../../client';

class FlightService {
  /**
   * Creates a new flight with structured waypoints
   * 
   * @param {Object} flightData - Flight data object
   * @param {string} flightData.name - Flight name/number
   * @param {Array<string>} flightData.stops - Array of stop location codes
   * @param {Array<Object>} flightData.waypoints - Array of waypoints with legIndex
   * @param {string} flightData.aircraftId - Aircraft ID
   * @param {Object} flightData.crew - Crew information
   * @param {Date} flightData.etd - Estimated time of departure
   * @param {string} flightData.region - Region code
   * @returns {Promise<Object>} Result with flight ID
   */
  static async createFlight(flightData) {
    try {
      console.log('FlightService: Creating new flight with data:', flightData);
      
      // Import the SDK
      const sdk = await import('@flight-app/sdk');
      
      // Check if function exists
      if (!sdk.createFlightWithWaypoints) {
        console.error('FlightService: createFlightWithWaypoints not found in SDK');
        return { success: false, error: 'Function not available in SDK' };
      }
      
      // Prepare structured waypoints (convert to JSON string)
      const structuredWaypoints = JSON.stringify(flightData.waypoints || []);
      
      // Build parameters for API call
      const params = {
        flightName: flightData.name,
        locations: flightData.stops,
        structuredWaypoints: structuredWaypoints,
        useOnlyProvidedWaypoints: true,
        aircraftId: flightData.aircraftId,
        
        // Crew members (optional)
        ...(flightData.crew?.captainId && { captainId: flightData.crew.captainId }),
        ...(flightData.crew?.copilotId && { copilotId: flightData.crew.copilotId }),
        ...(flightData.crew?.medicId && { medicId: flightData.crew.medicId }),
        ...(flightData.crew?.soId && { soId: flightData.crew.soId }),
        ...(flightData.crew?.rswId && { rswId: flightData.crew.rswId }),
        
        // Other optional parameters
        ...(flightData.alternateLocation && { alternateLocation: flightData.alternateLocation }),
        ...(flightData.etd && { etd: flightData.etd }),
        ...(flightData.region && { region: flightData.region }),
        ...(flightData.aircraftRegion && { aircraftRegion: flightData.aircraftRegion })
      };
      
      console.log('FlightService: Calling createFlightWithWaypoints with params:', params);
      
      // Call OSDK function
      const result = await client(sdk.createFlightWithWaypoints).applyAction(
        params,
        { $returnEdits: true }
      );
      
      console.log('FlightService: Creation result:', result);
      
      // Extract flight ID from result
      let flightId = null;
      if (result && result.addedObjects) {
        for (const obj of result.addedObjects) {
          if (obj.objectType === 'MainFlightObjectFp2' && obj.primaryKey) {
            flightId = obj.primaryKey;
            break;
          }
        }
      }
      
      if (!flightId) {
        return { 
          success: true, 
          warning: 'Flight created but could not extract ID',
          result
        };
      }
      
      return { success: true, flightId, result };
    } catch (error) {
      console.error('FlightService: Error creating flight:', error);
      return { 
        success: false, 
        error: error.message || 'Unknown error creating flight',
        details: error
      };
    }
  }
  
  /**
   * Updates an existing flight
   * 
   * @param {string} flightId - ID of the flight to update
   * @param {Object} flightData - Flight data to update
   * @param {string} flightData.name - Flight name/number (optional)
   * @param {Array<string>} flightData.stops - Array of stop location codes (optional)
   * @param {Array<Object>} flightData.waypoints - Array of waypoints with legIndex (optional)
   * @param {string} flightData.aircraftId - Aircraft ID (optional)
   * @param {Object} flightData.crew - Crew information (optional)
   * @param {Date} flightData.etd - Estimated time of departure (optional)
   * @returns {Promise<Object>} Update result
   */
  static async updateFlight(flightId, flightData) {
    try {
      console.log(`FlightService: Updating flight ${flightId} with data:`, flightData);
      
      // Import the SDK
      const sdk = await import('@flight-app/sdk');
      
      // Check if function exists
      if (!sdk.updateFastPlannerFlight) {
        console.error('FlightService: updateFastPlannerFlight not found in SDK');
        return { success: false, error: 'Function not available in SDK' };
      }
      
      // Prepare structured waypoints (convert to JSON string) if provided
      const structuredWaypoints = flightData.waypoints 
        ? JSON.stringify(flightData.waypoints) 
        : undefined;
      
      // Build parameters for API call - only include fields that are provided
      const params = {
        flightId,
        ...(flightData.name && { flightName: flightData.name }),
        ...(flightData.stops && { locations: flightData.stops }),
        ...(structuredWaypoints && { 
          structuredWaypoints,
          useOnlyProvidedWaypoints: true 
        }),
        ...(flightData.aircraftId && { aircraftId: flightData.aircraftId }),
        
        // Crew members (optional)
        ...(flightData.crew?.captainId && { captainId: flightData.crew.captainId }),
        ...(flightData.crew?.copilotId && { copilotId: flightData.crew.copilotId }),
        ...(flightData.crew?.medicId && { medicId: flightData.crew.medicId }),
        ...(flightData.crew?.soId && { soId: flightData.crew.soId }),
        ...(flightData.crew?.rswId && { rswId: flightData.crew.rswId }),
        
        // Other optional parameters
        ...(flightData.alternateLocation && { alternateLocation: flightData.alternateLocation }),
        ...(flightData.etd && { etd: flightData.etd }),
        ...(flightData.region && { region: flightData.region }),
        ...(flightData.aircraftRegion && { aircraftRegion: flightData.aircraftRegion }),
        ...(flightData.fuelPlanId && { fuelPlanId: flightData.fuelPlanId }),
        ...(flightData.timingId && { timingId: flightData.timingId }),
        ...(flightData.weightBalanceId && { weightBalanceId: flightData.weightBalanceId }),
        ...(flightData.policyUuid && { policyUuid: flightData.policyUuid })
      };
      
      console.log('FlightService: Calling updateFastPlannerFlight with params:', params);
      
      // Call OSDK function
      const result = await client(sdk.updateFastPlannerFlight).applyAction(
        params,
        { $returnEdits: true }
      );
      
      console.log('FlightService: Update result:', result);
      
      return { success: true, result };
    } catch (error) {
      console.error(`FlightService: Error updating flight ${flightId}:`, error);
      return { 
        success: false, 
        error: error.message || 'Unknown error updating flight',
        details: error
      };
    }
  }
  
  /**
   * Create structured waypoints format from Flight model
   * 
   * @param {Object} flight - Flight object with legs
   * @returns {Array<Object>} Array of structured waypoints
   */
  static createStructuredWaypoints(flight) {
    if (!flight || !flight.legs) {
      return [];
    }
    
    const structuredWaypoints = [];
    
    // Process each leg
    flight.legs.forEach((leg, legIndex) => {
      // Add waypoints for this leg
      leg.waypoints.forEach(waypoint => {
        structuredWaypoints.push({
          legIndex,
          waypoint: waypoint.name
        });
      });
    });
    
    return structuredWaypoints;
  }
  
  /**
   * Extract structured waypoints from OSDK result
   * 
   * @param {Object} flight - Flight object from OSDK
   * @returns {Array<Object>} Array of structured waypoints
   */
  static extractStructuredWaypoints(flight) {
    try {
      // Check for structuredWaypoints as a string and parse it
      if (flight.structuredWaypoints && typeof flight.structuredWaypoints === 'string') {
        return JSON.parse(flight.structuredWaypoints);
      }
      
      // If not found, try to construct from old format
      if (flight.displayWaypoints && flight.stopsArray) {
        return this.convertOldFormatToStructured(flight.displayWaypoints, flight.stopsArray);
      }
      
      return [];
    } catch (error) {
      console.error('Error extracting structured waypoints:', error);
      return [];
    }
  }
  
  /**
   * Convert old waypoints format to structured format
   * 
   * @param {Array<string>} displayWaypoints - Array of labeled waypoints
   * @param {Array<string>} stops - Array of stops
   * @returns {Array<Object>} Array of structured waypoints
   */
  static convertOldFormatToStructured(displayWaypoints, stops) {
    // Clean up displayWaypoints to remove labels
    const cleanWaypoints = displayWaypoints.map(wp => wp.replace(/\s*\([^)]*\)\s*$/, '').trim());
    
    // Create a map for each leg
    const structuredWaypoints = [];
    let currentLegIndex = 0;
    
    // Process each waypoint
    for (let i = 0; i < cleanWaypoints.length; i++) {
      const waypoint = cleanWaypoints[i];
      
      // Skip stops (they will be in the locations array)
      if (stops.includes(waypoint)) {
        // If this is a stop after the first one, increment leg index
        if (i > 0) {
          currentLegIndex++;
        }
        continue;
      }
      
      // Add as a waypoint for the current leg
      structuredWaypoints.push({
        legIndex: currentLegIndex,
        waypoint: waypoint
      });
    }
    
    return structuredWaypoints;
  }
}

export default FlightService;