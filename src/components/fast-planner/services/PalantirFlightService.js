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
    
    // Enhanced debugging - log the structure of the flight data
    console.log('Flight data structure being sent to API:', JSON.stringify(flightData, null, 2));
    
    // Import the SDK
    const sdk = await this.getSDK();
    
    // Log all available functions in the SDK for debugging
    console.log('All available SDK keys:', Object.keys(sdk));
    
    // Check if we're in diagnostic mode
    if (window.OSDK_DIAGNOSTIC_MODE) {
      console.log('Running in diagnostic mode with minimal parameters');
      
      // Try with a simplest possible set of params
      try {
        const simpleParams = {
          flightName: flightData.flightName || "Test Flight",
          aircraftRegion: flightData.aircraftRegion || "NORWAY"
        };
        
        // Check if createNewFlightFp2 exists
        if (sdk.createNewFlightFp2) {
          console.log('Attempting diagnostic call with createNewFlightFp2');
          const result = await client(sdk.createNewFlightFp2).applyAction(simpleParams);
          return result;
        }
        
        // Try all possible flight-related functions
        const flightFunctions = Object.keys(sdk).filter(key => 
          key.toLowerCase().includes('flight')
        );
        
        if (flightFunctions.length > 0) {
          console.log('Found flight-related functions:', flightFunctions);
          
          for (const funcName of flightFunctions) {
            try {
              console.log(`Trying diagnostic call with ${funcName}`);
              const result = await client(sdk[funcName]).applyAction(simpleParams);
              return result;
            } catch (error) {
              console.error(`Error with ${funcName}:`, error);
            }
          }
        }
        
        throw new Error('No working flight-related functions found in diagnostic mode');
      } catch (error) {
        console.error('All diagnostic attempts failed:', error);
        throw error;
      }
    }
    
    // For normal operation - try multiple options in sequence
    
    // Attempt #1: Try with the explicit format from the example code
    try {
      console.log('Attempt #1: Using format from example code');
      
      // Match the example format from the documentation
      const exampleFormatParams = {
        aircraftRegion: flightData.aircraftRegion || "NORWAY",
        new_parameter: flightData.country || "Norway",
        flightName: flightData.flightName || "Test Flight",
        locations: flightData.locations || ["ENZV", "ENLE"],
        alternateLocation: flightData.alternateLocation || "",
        aircraftId: { 
          $primaryKey: flightData.aircraftId || "" 
        },
        region: flightData.region || "NORWAY",
        etd: flightData.etd || new Date().toISOString(),
        captainId: flightData.captainId ? { $primaryKey: flightData.captainId } : null,
        copilotId: flightData.copilotId ? { $primaryKey: flightData.copilotId } : null,
        medicId: flightData.medicId ? { $primaryKey: flightData.medicId } : null,
        soId: flightData.soId ? { $primaryKey: flightData.soId } : null,
        rswId: flightData.rswId ? { $primaryKey: flightData.rswId } : null,
        useDirectRoutes: flightData.useDirectRoutes || false,
        displayWaypoints: flightData.locations || ["ENZV", "ENLE"]
      };
      
      // Identify which action to use based on what's available
      let actionToUse = null;
      
      // Try these in order of likelihood
      const actionNames = [
        'createNewFlightFp2',
        'create-new-flight-fp2',
        'CreateNewFlightFp2',
        'createFlightFp2',
        'createFlight'
      ];
      
      // Find the first available action
      for (const name of actionNames) {
        if (sdk[name]) {
          actionToUse = sdk[name];
          console.log(`Found action: ${name}`);
          break;
        }
      }
      
      // If no exact match, find any flight creation function
      if (!actionToUse) {
        const matchingActions = Object.keys(sdk).filter(key => 
          key.toLowerCase().includes('flight') && 
          (key.toLowerCase().includes('create') || key.toLowerCase().includes('new'))
        );
        
        if (matchingActions.length > 0) {
          actionToUse = sdk[matchingActions[0]];
          console.log(`Using alternative action: ${matchingActions[0]}`);
        }
      }
      
      if (!actionToUse) {
        throw new Error('No suitable flight creation action found in SDK');
      }
      
      // Call the API with the chosen action
      const result = await client(actionToUse).applyAction({
        ...exampleFormatParams,
        $returnEdits: true
      });
      
      console.log('Flight creation successful!', result);
      return result;
    } catch (firstError) {
      console.error('Attempt #1 failed:', firstError);
      
      // Attempt #2: Try with a simplified format
      try {
        console.log('Attempt #2: Using simplified format');
        
        // Use a simpler format with only essential fields
        const simplifiedParams = {
          flightName: flightData.flightName || "Test Flight",
          aircraftRegion: flightData.aircraftRegion || "NORWAY",
          region: flightData.region || "NORWAY",
          locations: flightData.locations || ["ENZV", "ENLE"]
        };
        
        // Look for any flight-related action
        const flightActions = Object.keys(sdk).filter(key => 
          key.toLowerCase().includes('flight')
        );
        
        if (flightActions.length === 0) {
          throw new Error('No flight-related actions found in SDK');
        }
        
        // Try each flight action in turn
        for (const actionName of flightActions) {
          try {
            console.log(`Trying ${actionName} with simplified parameters`);
            const result = await client(sdk[actionName]).applyAction({
              ...simplifiedParams,
              $returnEdits: true
            });
            
            console.log(`Success with ${actionName}!`, result);
            return result;
          } catch (actionError) {
            console.error(`Error with ${actionName}:`, actionError);
            // Continue to the next action
          }
        }
        
        throw new Error('All simplified action attempts failed');
      } catch (secondError) {
        console.error('Attempt #2 failed:', secondError);
        
        // Attempt #3: Last resort - try to read API documentation from SDK
        try {
          console.log('Attempt #3: Analyzing SDK for documentation');
          
          // Look for any function that might tell us about the API
          const helpFunctions = Object.keys(sdk).filter(key => 
            key.toLowerCase().includes('help') || 
            key.toLowerCase().includes('doc') || 
            key.toLowerCase().includes('info')
          );
          
          if (helpFunctions.length > 0) {
            console.log('Found potential help functions:', helpFunctions);
            
            // Try to get info from each function
            for (const helpFunc of helpFunctions) {
              try {
                const info = sdk[helpFunc];
                console.log(`Help from ${helpFunc}:`, info);
              } catch (e) {
                console.error(`Error getting help from ${helpFunc}:`, e);
              }
            }
          }
          
          // At this point, we've tried everything and failed
          throw new Error('Unable to create flight - API integration failed after multiple attempts');
        } catch (thirdError) {
          console.error('All attempts failed:', thirdError);
          
          // Re-throw the original error for better debugging
          throw firstError;
        }
      }
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
    
    // Create a minimal payload to identify what's causing the 400 error
    // Start with just the absolutely required fields
    const minimalParams = {
      flightName: flightName || "Test Flight",
      aircraftRegion: aircraftRegion || "NORWAY",
      aircraftId: { $primaryKey: aircraftId || "" }
    };
    
    // Log the minimal parameters
    console.log('Using minimal parameters to test API:', minimalParams);
    
    // Check if we're in diagnostic mode
    if (window.OSDK_DIAGNOSTIC_MODE) {
      return minimalParams;
    }
    
    // Standard parameters with careful formatting
    // Note: All fields exactly match the example API payload
    return {
      aircraftRegion: aircraftRegion || 'Unknown',
      new_parameter: country || 'Norway', // Default country
      flightName: flightName,
      locations: locations || ["ENZV", "ENLE"],
      alternateLocation: alternateLocation || '', 
      aircraftId: { $primaryKey: aircraftId || "" },
      region: region || 'Unknown',
      etd: etd,
      captainId: captainId ? { $primaryKey: captainId } : null,
      copilotId: copilotId ? { $primaryKey: copilotId } : null,
      medicId: medicId ? { $primaryKey: medicId } : null,
      soId: soId ? { $primaryKey: soId } : null,
      rswId: rswId ? { $primaryKey: rswId } : null,
      useDirectRoutes: useDirectRoutes !== undefined ? useDirectRoutes : false,
      displayWaypoints: locations || ["ENZV", "ENLE"] // Same as locations for now
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