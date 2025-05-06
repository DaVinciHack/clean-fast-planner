/**
 * PalantirFlightService.js
 * 
 * Service for interacting with Palantir OSDK Flight API
 * This provides a clean interface for creating flights in Palantir from the Fast Planner
 */
import client from '../../../client';

class PalantirFlightService {
  /**
   * Check if the OSDK client is available and authenticated
   * @returns {boolean} - True if OSDK client is available
   */
  static isClientAvailable() {
    return !!client;
  }
  
  /**
   * Import the SDK dynamically
   * @returns {Object} - The SDK object
   */
  static async getSDK() {
    try {
      return await import('@flight-app/sdk');
    } catch (error) {
      console.error('Error importing SDK:', error);
      throw new Error(`Failed to import SDK: ${error.message}`);
    }
  }
  
  /**
   * Create a new flight in Palantir
   * @param {Object} flightData - The flight data
   * @returns {Promise<Object>} - The result of the API call
   */
  static async createFlight(flightData) {
    if (!this.isClientAvailable()) {
      throw new Error('OSDK client not available. Try logging in again.');
    }
    
    // Import the SDK
    const sdk = await this.getSDK();
    
    // Log available functions for debugging
    console.log('Available SDK functions:', Object.keys(sdk).filter(key => 
      typeof sdk[key] === 'function' || 
      (typeof sdk[key] === 'object' && sdk[key] !== null)
    ));
    
    // Enhanced debugging - log the structure of the flight data
    console.log('Flight data structure being sent to API:', JSON.stringify(flightData, null, 2));
    
    // Check if createNewFlightFp2 is available in the SDK
    const targetAction = 'createNewFlightFp2';
    const hyphenatedAction = 'create-new-flight-fp2';
    
    // Try multiple different action names to see if any work
    const possibleActions = [
      targetAction,                      // createNewFlightFp2
      hyphenatedAction,                  // create-new-flight-fp2 
      targetAction.toLowerCase(),        // createnewflightfp2
      hyphenatedAction.toLowerCase(),    // create-new-flight-fp2 (lowercase)
      'CreateNewFlightFp2',              // CreateNewFlightFp2 (Pascal case)
      'create_new_flight_fp2'            // create_new_flight_fp2 (snake case)
    ];
    
    // Log available actions that might match what we need
    const potentialMatches = Object.keys(sdk).filter(key => 
      key.toLowerCase().includes('flight') && 
      (key.toLowerCase().includes('create') || key.toLowerCase().includes('new'))
    );
    
    console.log('Potential matching actions in SDK:', potentialMatches);
    
    // First try the exact action name
    if (sdk[targetAction]) {
      try {
        console.log(`Using exact action name: ${targetAction}`);
        return await client(sdk[targetAction]).applyAction({
          ...flightData,
          $returnEdits: true
        });
      } catch (error) {
        console.error(`Error with exact action ${targetAction}:`, error);
        console.log('Attempting alternative action formats...');
      }
    }
    
    // Try each possible action name one at a time
    for (const actionName of possibleActions) {
      if (sdk[actionName] && actionName !== targetAction) { // Skip the already tried exact match
        try {
          console.log(`Trying alternative action name: ${actionName}`);
          return await client(sdk[actionName]).applyAction({
            ...flightData,
            $returnEdits: true
          });
        } catch (error) {
          console.error(`Error with action ${actionName}:`, error);
          // Continue to the next action name
        }
      }
    }
    
    // If specific action names didn't work, try potential matches we found
    for (const matchName of potentialMatches) {
      if (!possibleActions.includes(matchName)) { // Skip any we already tried
        try {
          console.log(`Trying matching action name: ${matchName}`);
          return await client(sdk[matchName]).applyAction({
            ...flightData,
            $returnEdits: true
          });
        } catch (error) {
          console.error(`Error with match ${matchName}:`, error);
          // Continue to the next action name
        }
      }
    }
    
    // If we get here, we couldn't find a working action
    console.error('Failed to find working SDK action for flight creation');
    throw new Error('Could not find a valid flight creation action in the SDK');
  }
  
  /**
   * Extract an ID from an API result
   * @param {Object} result - The API result
   * @returns {string} - The extracted ID or 'Unknown ID'
   */
  static extractFlightId(result) {
    if (result && result.editedObjectTypes && result.editedObjectTypes[0]) {
      return result.editedObjectTypes[0].id || 'Unknown ID';
    }
    return 'Unknown ID';
  }
  
  /**
   * Check if a result is successful
   * @param {Object} result - The API result
   * @returns {boolean} - True if the result is successful
   */
  static isSuccessfulResult(result) {
    return result && (result.type === 'edits' || result.editedObjectTypes);
  }
  
  /**
   * Format flight parameters for the API
   * @param {Object} params - Flight parameters
   * @returns {Object} - Formatted parameters for the API
   */
  static formatFlightParams(params) {
    const {
      flightName,
      aircraftRegion,
      country,
      locations,
      alternateLocation,
      aircraftId,
      region,
      etd,
      captainId,
      copilotId,
      medicId,
      soId,
      rswId,
      useDirectRoutes
    } = params;
    
    // Create parameters for the API call
    // Format exactly according to the API documentation
    return {
      aircraftRegion: aircraftRegion || 'Unknown',
      new_parameter: country || 'Norway', // Default country
      flightName: flightName,
      locations: locations,
      alternateLocation: alternateLocation || '', // Leave blank for auto-selection
      aircraftId: aircraftId ? { $primaryKey: aircraftId } : null,
      region: region || 'Unknown',
      etd: etd,
      captainId: captainId ? { $primaryKey: captainId } : null,
      copilotId: copilotId ? { $primaryKey: copilotId } : null,
      medicId: medicId ? { $primaryKey: medicId } : null,
      soId: soId ? { $primaryKey: soId } : null,
      rswId: rswId ? { $primaryKey: rswId } : null,
      useDirectRoutes: useDirectRoutes !== undefined ? useDirectRoutes : false,
      displayWaypoints: locations // Same as locations for now
    };
  }
  
  /**
   * Format error message for the user
   * @param {Error} error - The error object
   * @returns {string} - A user-friendly error message
   */
  static formatErrorMessage(error) {
    if (!error) return 'Unknown error occurred';
    
    // Extract useful information from the error
    const message = error.message || '';
    
    // Check for specific error patterns
    if (message.includes('401') || message.includes('unauthorized')) {
      return 'Authentication error: You need to log in again to save flights';
    }
    
    if (message.includes('404') || message.includes('not found')) {
      return 'API endpoint not found: The createNewFlightFp2 action may not be available';
    }
    
    if (message.includes('400') || message.includes('Bad Request')) {
      return 'API request error (400): The server rejected the flight data. Check that all required fields are correctly formatted.';
    }
    
    if (message.includes('timeout') || message.includes('aborted')) {
      return 'Connection timeout: The server took too long to respond';
    }
    
    if (message.includes('network') || message.includes('offline')) {
      return 'Network error: Check your internet connection';
    }
    
    if (message.includes('bristol')) {
      return 'API connection error: Unable to connect to the flight creation service';
    }
    
    // Default error message
    return `Error creating flight: ${message}`;
  }
}

export default PalantirFlightService;