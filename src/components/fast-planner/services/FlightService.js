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
   * Extract display waypoints from flight object, handling different storage formats
   * 
   * @param {Object} flight - Flight object from OSDK
   * @returns {Array<string>} Array of waypoint names with labels
   */
  static extractDisplayWaypoints(flight) {
    try {
      // Try direct array first
      if (Array.isArray(flight.displayWaypoints) && flight.displayWaypoints.length > 0) {
        return flight.displayWaypoints;
      }
      
      // Try displayWaypoints as string (pipe-separated)
      if (typeof flight.displayWaypoints === 'string' && flight.displayWaypoints.length > 0) {
        if (flight.displayWaypoints.includes('|')) {
          return flight.displayWaypoints.split('|').map(wp => wp.trim()).filter(wp => wp.length > 0);
        } else {
          return [flight.displayWaypoints.trim()];
        }
      }
      
      // Look for any field that contains pipe-separated waypoint data
      const potentialFields = Object.keys(flight).filter(key => 
        typeof flight[key] === 'string' && 
        flight[key].includes('|') &&
        (flight[key].includes('(Dep)') || flight[key].includes('(Des)') || flight[key].includes('(Stop'))
      );
      
      if (potentialFields.length > 0) {
        const waypointString = flight[potentialFields[0]];
        return waypointString.split('|').map(wp => wp.trim()).filter(wp => wp.length > 0);
      }
      
      // Try combinedWaypoints as fallback
      if (Array.isArray(flight.combinedWaypoints) && flight.combinedWaypoints.length > 0) {
        // Convert combinedWaypoints to displayWaypoints format
        const stops = flight.stopsArray || [];
        
        return flight.combinedWaypoints.map(waypoint => {
          if (stops.includes(waypoint)) {
            const stopIndex = stops.indexOf(waypoint);
            if (stopIndex === 0) {
              return `${waypoint} (Dep)`;
            } else if (stopIndex === stops.length - 1) {
              return `${waypoint} (Des)`;
            } else {
              return `${waypoint} (Stop${stopIndex})`;
            }
          } else {
            return waypoint;
          }
        });
      }
      
      return [];
      
    } catch (error) {
      console.error('FlightService: Error extracting displayWaypoints:', error);
      return [];
    }
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
  /**
   * Load a specific flight by ID from Palantir
   * 
   * Note: This function was created for SaveFlightButton automation but is not currently used
   * in the main application flow. RightPanel uses loadFlights() + array filtering instead.
   * Keeping this function as it may be useful for future direct flight loading scenarios.
   * 
   * @param {string} flightId - Flight ID to load
   * @returns {Promise<Object>} Result with flight object
   */
  static async loadSpecificFlight(flightId) {
    try {
      console.log(`FlightService: Loading specific flight: ${flightId}`);
      
      // Import the SDK to get MainFlightObjectFp2
      const sdk = await import('@flight-app/sdk');
      
      // Get the MainFlightObjectFp2 object from SDK
      const MainFlightObjectFp2 = sdk.MainFlightObjectFp2;
      
      if (!MainFlightObjectFp2) {
        throw new Error(`MainFlightObjectFp2 not found in SDK`);
      }
      
      // Query for specific flight by ID
      const query = client(MainFlightObjectFp2).where({
        flightId: { $eq: flightId }
      });
      
      const response = await query.fetchPage({
        $pageSize: 1
      });
      
      if (!response || !response.data || response.data.length === 0) {
        console.log(`FlightService: Flight ${flightId} not found`);
        return { success: false, error: 'Flight not found' };
      }
      
      const flight = response.data[0];
      console.log(`FlightService: Found flight ${flightId}:`, flight);
      
      // Process the flight into the same format as loadFlights
      const extractedDisplayWaypoints = this.extractDisplayWaypoints(flight);
      
      const processedFlight = {
        id: flight.flightId,
        name: flight.flightNumber || 'Unknown Flight',
        flightNumber: flight.flightNumber,
        date: flight.etd || flight.createdAt,
        status: flight.isCompleted ? 'Completed' : flight.isInProgress ? 'In Progress' : 'Planned',
        region: flight.region,
        stops: flight.stopsArray || [],
        displayWaypoints: extractedDisplayWaypoints,
        combinedWaypoints: flight.combinedWaypoints || [],
        aircraftId: flight.aircraftId,
        captainId: flight.captainId,
        copilotId: flight.copilotId,
        medicId: flight.medicId,
        soId: flight.soId,
        rswId: flight.rswId,
        windSpeed: flight.avgWindSpeed || flight.windSpeed || 0,
        windDirection: flight.avgWindDirection || flight.windDirection || 0,
        alternateLocation: flight.alternateSplitPoint ? 
          `${flight.alternateSplitPoint} ${flight.alternateName || ''}` : null,
        // Include raw flight object for detailed loading
        _rawFlight: flight
      };
      
      console.log(`FlightService: Processed flight ${flightId} successfully`);
      return { success: true, flight: processedFlight };
      
    } catch (error) {
      console.error(`FlightService: Error loading flight ${flightId}:`, error);
      return { 
        success: false, 
        error: error.message || 'Unknown error loading flight',
        details: error
      };
    }
  }

  /**
   * Load flights from Palantir filtered by region
   * 
   * @param {string} region - Region code to filter flights (optional)
   * @param {number} limit - Maximum number of flights to return (default: 50)
   * @returns {Promise<Object>} Result with flights array
   */
  static async loadFlights(region = null, limit = 200) {
    try {
      console.log(`FlightService: Loading flights for region: ${region || 'ALL'}`);
      
      // Import the SDK to get MainFlightObjectFp2
      const sdk = await import('@flight-app/sdk');
      
      // Get the MainFlightObjectFp2 object from SDK
      const MainFlightObjectFp2 = sdk.MainFlightObjectFp2;
      
      if (!MainFlightObjectFp2) {
        throw new Error(`MainFlightObjectFp2 not found in SDK. Available objects: ${Object.keys(sdk).join(', ')}`);
      }
      
      console.log('FlightService: Building query with server-side region filtering...');
      
      // Build the query using client like other managers do
      let query = client(MainFlightObjectFp2);
      
      // SERVER-SIDE REGION FILTERING using correct Palantir OSDK syntax
      if (region && region !== 'ALL') {
        console.log(`FlightService: Adding server-side filter for region: "${region}"`);
        query = query.where({
          region: { $eq: region }
        });
      }
      
      console.log(`FlightService: ${region ? `Fetching flights for region: ${region}` : 'Fetching ALL flights'}`);
      
      // Fetch flights with high page size
      const response = await query.fetchPage({
        $pageSize: 500
      });
      
      console.log('FlightService: Query response:', {
        dataLength: response.data?.length || 0,
        totalCount: response.totalCount || 'unknown',
        hasMore: response.hasMore || false,
        regionFilter: region || 'NONE'
      });
      
      if (!response || !response.data) {
        console.log('FlightService: No response or data from query');
        return { success: true, flights: [] };
      }
      
      console.log(`FlightService: Found ${response.data.length} flights for region: ${region || 'ALL'}`);
      
      // If we hit the limit and there are more flights, warn about it
      if (response.hasMore) {
        console.warn(`FlightService: WARNING - Hit page limit of ${limit}. There are more flights available. Consider increasing limit or implementing pagination.`);
      }
      
      // Check what region we're filtering for vs what exists
      const regionsFound = [...new Set(response.data.map(flight => flight.region).filter(Boolean))];
      
      // Debug: Show all flights from today to see their region codes (fix timezone issue)
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Start of today
      const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000); // Start of tomorrow
      
      const todaysFlights = response.data.filter(flight => {
        const flightDate = new Date(flight.createdAt);
        return flightDate >= todayStart && flightDate < tomorrowStart;
      });
      
      let flights = response.data;
      
      // Client-side sorting by creation date (newest first) since server-side sorting failed
      flights.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA; // Newest first
      });
      
      // Process flights into a simplified format for the UI
      const processedFlights = flights.map(flight => {
        // Determine status based on available data
        let status = 'Planned'; // Default
        if (flight.isCompleted) {
          status = 'Completed';
        } else if (flight.isInProgress) {
          status = 'In Progress';
        } else if (flight.isCancelled) {
          status = 'Cancelled';
        }
        
        // Use the actual flight number/name as created, not artificial route names
        let flightName = flight.flightNumber || 'Unknown Flight';
        
        // Only fall back to route-based naming if no flight number exists
        if (!flight.flightNumber && flight.stopsArray && flight.stopsArray.length >= 2) {
          const departure = flight.stopsArray[0];
          const destination = flight.stopsArray[flight.stopsArray.length - 1];
          flightName = `${departure} to ${destination}`;
          
          // Add date if available
          if (flight.etd) {
            const etdDate = new Date(flight.etd);
            const dateStr = etdDate.toISOString().split('T')[0]; // YYYY-MM-DD format
            flightName += ` - ${dateStr}`;
          }
        }
        
        const extractedDisplayWaypoints = this.extractDisplayWaypoints(flight);
        
        
        return {
          id: flight.flightId,
          name: flightName,
          flightNumber: flight.flightNumber,
          date: flight.etd || flight.createdAt,
          status: status,
          region: flight.region,
          stops: flight.stopsArray || [],
          displayWaypoints: extractedDisplayWaypoints,
          combinedWaypoints: flight.combinedWaypoints || [],
          aircraftId: flight.aircraftId,
          captainId: flight.captainId,
          copilotId: flight.copilotId,
          medicId: flight.medicId,
          soId: flight.soId,
          rswId: flight.rswId,
          
          // CRITICAL FIX: Extract wind data from saved flight - use avgWindSpeed/avgWindDirection
          windSpeed: flight.avgWindSpeed || flight.windSpeed || 0,
          windDirection: flight.avgWindDirection || flight.windDirection || 0,
          
          alternateLocation: flight.alternateSplitPoint ? 
            `${flight.alternateSplitPoint} ${flight.alternateName || ''}` : null,
          // Include raw flight object for detailed loading
          _rawFlight: flight
        };
      });
      
      return { success: true, flights: processedFlights };
      
    } catch (error) {
      console.error('FlightService: Error loading flights:', error);
      return { 
        success: false, 
        error: error.message || 'Unknown error loading flights',
        details: error
      };
    }
  }
}

export default FlightService;