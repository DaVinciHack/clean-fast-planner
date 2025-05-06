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
    
    // Check if createNewFlightFp2 is available in the SDK
    if (!sdk.createNewFlightFp2) {
      console.warn('createNewFlightFp2 action not found in SDK. Available keys:', Object.keys(sdk));
      
      // Try to find similar functions
      const possibleMatches = Object.keys(sdk).filter(key => 
        key.toLowerCase().includes('flight') && 
        (key.toLowerCase().includes('create') || key.toLowerCase().includes('new'))
      );
      
      if (possibleMatches.length > 0) {
        console.log('Possible matching functions found:', possibleMatches);
        
        // Try to use the first match
        const firstMatch = possibleMatches[0];
        console.log(`Attempting to use ${firstMatch} instead of createNewFlightFp2`);
        
        // Call the API with the first matching function
        return await client(sdk[firstMatch]).applyAction({
          ...flightData,
          $returnEdits: true
        });
      } else {
        throw new Error('createNewFlightFp2 action not found and no alternatives available');
      }
    } else {
      // Standard path - using createNewFlightFp2
      const { createNewFlightFp2 } = sdk;
      
      // Call the API
      return await client(createNewFlightFp2).applyAction({
        ...flightData,
        $returnEdits: true
      });
    }
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
    return {
      aircraftRegion: aircraftRegion || 'Unknown',
      new_parameter: country || 'Norway', // Default country
      flightName: flightName,
      locations: locations,
      alternateLocation: alternateLocation || '', // Leave blank for auto-selection
      aircraftId: {
        $primaryKey: aircraftId
      },
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