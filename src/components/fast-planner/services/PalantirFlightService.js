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
   * Run a diagnostic test with minimal parameters to identify API issues
   * @returns {Promise<boolean>} - True if the diagnostic succeeded
   */
  static async runDiagnostic() {
    try {
      console.log("Running API diagnostic with minimal parameters...");
      
      // Import the SDK
      const sdk = await this.getSDK();
      
      // Log available Actions
      console.log("Available SDK Actions:", Object.keys(sdk).filter(key => 
        typeof key === 'string' && key.toLowerCase().includes('flight')
      ));
      
      // Try with absolute minimal parameters
      const minimalParams = {
        "flightName": "Diagnostic Test Flight",
        "aircraftRegion": "NORWAY",
        "new_parameter": "Norway",
        "aircraftId": { "$primaryKey": "LN-OIA" },
        "region": "NORWAY",
        "etd": new Date().toISOString(),
        "locations": ["ENZV", "ENLE"]
      };
      
      console.log("Diagnostic params:", minimalParams);
      
      // Test the API call with returnEdits option
      const result = await client(sdk.createNewFlightFp2).applyAction(
        minimalParams,
        { $returnEdits: true }
      );
      
      console.log("Diagnostic successful with result:", result);
      return true;
    } catch (error) {
      console.error("Diagnostic failed:", error);
      
      // Check if we have validation errors and log them clearly
      if (error.message && error.message.includes('evaluatedConstraints')) {
        try {
          const errorJson = error.message.match(/\{.*\}/s);
          if (errorJson) {
            const validationData = JSON.parse(errorJson[0]);
            console.log('Parameter validation errors:', validationData);
          }
        } catch (parseError) {
          console.log('Could not parse validation errors:', parseError);
        }
      }
      
      return false;
    }
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
    
    // Clean up the locations to ensure no leading/trailing spaces
    let cleanLocations = [];
    if (flightData.locations && Array.isArray(flightData.locations)) {
      cleanLocations = flightData.locations.map(loc => typeof loc === 'string' ? loc.trim() : loc);
    } else {
      cleanLocations = ["ENZV", "ENLE"]; // Default locations
    }
    
    // Use a greatly simplified approach that matches the working ApiTester
    const cleanData = {
      flightName: flightData.flightName || "Test Flight",
      aircraftRegion: "NORWAY",
      new_parameter: "Norway",
      aircraftId: flightData.aircraftId,
      region: "NORWAY",
      etd: flightData.etd || new Date().toISOString(),
      locations: cleanLocations,
      alternateLocation: flightData.alternateLocation || "",
      // Only include crew if provided
      ...(flightData.captainId ? { captainId: flightData.captainId } : {}),
      ...(flightData.copilotId ? { copilotId: flightData.copilotId } : {})
    };
    
    // Log the clean data 
    console.log('Flight data structure being sent to API:', JSON.stringify(cleanData, null, 2));
    
    // Import the SDK
    const sdk = await this.getSDK();
    
    try {
      // Check if the createNewFlightFp2 action exists
      if (!sdk.createNewFlightFp2) {
        console.error('createNewFlightFp2 action not found in SDK');
        console.log('Available SDK actions:', Object.keys(sdk));
        throw new Error('createNewFlightFp2 action not found in SDK');
      }
      
      // Get parameters in the proper format (this will use $primaryKey format for IDs)
      const params = this.formatFlightParams(cleanData);
      
      console.log('Calling createNewFlightFp2 with params:', params);
      
      // Use a try-catch with retry logic for network issues
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        attempts++;
        try {
          // Make the API call with the exact format from the documentation
          // Add a delay before the API call to ensure any previous requests have completed
          await new Promise(resolve => setTimeout(resolve, 500));
          
          console.log(`Attempt ${attempts} of ${maxAttempts} to create flight...`);
          
          // CRITICAL FIX: Based on working example, use either the direct export or $Actions
          let createFlightAction = sdk.createNewFlightFp2;
          
          // If direct export doesn't exist, try $Actions
          if (!createFlightAction && sdk.$Actions) {
            console.log('Using $Actions.createNewFlightFp2 instead of direct export');
            createFlightAction = sdk.$Actions.createNewFlightFp2;
          }
          
          if (!createFlightAction) {
            throw new Error('Could not find createNewFlightFp2 action in SDK');
          }
          
          // Use the exact format from the working example including $returnEdits option
          const result = await client(createFlightAction).applyAction(
            params,
            { $returnEdits: true }
          );
          console.log('Flight creation successful!', result);
          return result;
        } catch (apiError) {
          console.error(`Attempt ${attempts} failed:`, apiError);
          
          // If this is the last attempt, or if it's not a network error, don't retry
          if (attempts >= maxAttempts || 
             (apiError.message && !apiError.message.includes('Failed to fetch'))) {
            throw apiError;
          }
          
          // Add exponential backoff for retries
          const backoffTime = Math.pow(2, attempts) * 500; // 1s, 2s, 4s
          console.log(`Retrying in ${backoffTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
        }
      }
    } catch (error) {
      console.error('All attempts to create flight failed:', error);
      
      // Log the full error for debugging
      console.error('Error details:', error);
      
      // Check if it's a network issue
      if (error.message && error.message.includes('Failed to fetch')) {
        console.error('This appears to be a network issue or CORS problem.');
        throw new Error('Network error: Failed to connect to the Palantir API. This might be due to connection issues or CORS restrictions.');
      }
      
      // Check for 400 Bad Request errors specifically
      if (error.message && error.message.includes('400')) {
        console.error('This is a 400 Bad Request error - parameter format issue');
        
        // Try to extract any validation details
        try {
          const errorJson = error.message.match(/\{.*\}/s);
          if (errorJson) {
            const validationData = JSON.parse(errorJson[0]);
            console.log('Parameter validation data:', validationData);
            
            // Build a more helpful error message
            let errorDetails = 'API 400 Error: The server rejected the request. ';
            
            if (validationData && validationData.parameters) {
              errorDetails += 'Invalid parameters: ';
              for (const [param, details] of Object.entries(validationData.parameters)) {
                if (details.result === 'INVALID') {
                  errorDetails += `${param}, `;
                }
              }
            }
            
            throw new Error(errorDetails);
          }
        } catch (parseError) {
          console.error('Could not parse validation errors:', parseError);
        }
        
        // If we couldn't extract details, return a general 400 error
        throw new Error('API 400 Error: The server rejected the flight data. Please check all parameters are correctly formatted.');
      }
      
      // Check for authentication issues
      if (error.message && error.message.includes('401')) {
        console.error('This appears to be an authentication issue.');
        throw new Error('Authentication error: Your session may have expired. Please log in again.');
      }
      
      // If there's a detailed error message with validation info, extract and log it
      if (error.message && error.message.includes('INVALID')) {
        try {
          const validationMatch = error.message.match(/Validation Error: (.*)/);
          if (validationMatch && validationMatch[1]) {
            const validationData = JSON.parse(validationMatch[1]);
            console.log('Parameter validation errors:', validationData);
            
            // Check for specific issues and build a detailed error message
            let errorDetails = 'Validation errors: ';
            
            if (validationData && validationData.parameters) {
              for (const [param, details] of Object.entries(validationData.parameters)) {
                if (details.result === 'INVALID') {
                  errorDetails += `${param} (${details.evaluatedConstraints?.[0]?.type || 'unknown reason'}), `;
                }
              }
            }
            
            throw new Error(errorDetails);
          }
        } catch (parseError) {
          console.log('Could not parse validation errors:', parseError);
        }
      }
      
      throw error;
    }
  }
  
  /**
   * Extract an ID from an API result
   * @param {Object} result - The API result
   * @returns {string} - The extracted ID or 'Unknown ID'
   */
  static extractFlightId(result) {
    // Log the entire result structure for debugging
    console.log('Extracting flight ID from result:', result);
    
    // Based on the working example in ApiTester, check for addedObjects first
    if (result && result.addedObjects && Array.isArray(result.addedObjects)) {
      for (const obj of result.addedObjects) {
        if (obj.objectType === 'MainFlightObjectFp2' && obj.primaryKey) {
          console.log('Found flight ID in addedObjects:', obj.primaryKey);
          return obj.primaryKey;
        }
      }
    }
    
    // Fall back to other methods if addedObjects doesn't contain the ID
    if (result) {
      // If the result has an editedObjectTypes property
      if (result.editedObjectTypes && result.editedObjectTypes.length > 0) {
        const firstObject = result.editedObjectTypes[0];
        // Return the ID if it exists
        if (firstObject && firstObject.id) {
          console.log('Found flight ID in editedObjectTypes:', firstObject.id);
          return firstObject.id;
        }
      }
      
      // If the result has a type of 'edits' and an updatedObject property
      if (result.type === 'edits' && result.updatedObject) {
        const id = result.updatedObject.id || 'Unknown ID';
        console.log('Found flight ID in updatedObject:', id);
        return id;
      }
      
      // If the result has an id property directly
      if (result.id) {
        console.log('Found flight ID directly in result:', result.id);
        return result.id;
      }
    }
    
    console.warn('Could not find flight ID in result. Using "Unknown ID"');
    return 'Unknown ID';
  }
  
  /**
   * Check if a result is successful
   * @param {Object} result - The API result
   * @returns {boolean} - True if the result is successful
   */
  static isSuccessfulResult(result) {
    if (!result) return false;
    
    // Based on the API documentation, the result should have one of these structures
    return (
      // Check for the format shown in the API documentation screenshot
      (result.type === 'edits') || 
      
      // Check for editedObjectTypes property
      (result.editedObjectTypes && result.editedObjectTypes.length > 0) ||
      
      // Check for updatedObject property
      (result.updatedObject) ||
      
      // Check for id property directly
      (result.id)
    );
  }
  
  /**
   * Format flight parameters for the API
   * @param {Object} params - Flight parameters
   * @returns {Object} - Formatted parameters for the API exactly as specified in the documentation
   */
  static formatFlightParams(params) {
    // Based on actual implementation, use simple string for aircraftId
    const formattedParams = {
      "flightName": params.flightName || "Test Flight",
      "aircraftRegion": "NORWAY",
      "new_parameter": "Norway",
      "aircraftId": params.aircraftId || "190", // Use the numeric ID as fallback
      "region": "NORWAY",
      "etd": params.etd || new Date().toISOString(),
      "locations": Array.isArray(params.locations) ? params.locations : ["ENZV", "ENLE"],
      "alternateLocation": params.alternateLocation || ""
    };
    
    // Add crew members only if provided
    if (params.captainId) {
      formattedParams.captainId = params.captainId; // Simple string, no $primaryKey
    }
    
    if (params.copilotId) {
      formattedParams.copilotId = params.copilotId; // Simple string, no $primaryKey
    }
    
    if (params.medicId) {
      formattedParams.medicId = params.medicId; // Simple string, no $primaryKey
    }
    
    if (params.soId) {
      formattedParams.soId = params.soId; // Simple string, no $primaryKey
    }
    
    if (params.rswId) {
      formattedParams.rswId = params.rswId; // Simple string, no $primaryKey
    }
    
    console.log('Formatted flight parameters:', formattedParams);
    return formattedParams;
  }
  
  /**
   * Format error message for the user
   * @param {Error} error - The error object
   * @returns {string} - A user-friendly error message
   */
  static formatErrorMessage(error) {
    if (!error) return 'Unknown error occurred';
    
    // Log the full error for debugging
    console.error('Full error details:', error);
    
    // Extract useful information from the error
    const message = error.message || '';
    
    // Check for specific error patterns based on the Palantir API
    if (message.includes('401') || message.includes('unauthorized')) {
      return 'Authentication error: You need to log in again to save flights';
    }
    
    if (message.includes('404') || message.includes('not found')) {
      return 'API endpoint not found: The createNewFlightFp2 action may not be available';
    }
    
    if (message.includes('400') || message.includes('Bad Request')) {
      // For 400 errors, try to extract more details to help diagnose parameter formatting issues
      let detailedMessage = 'API request error (400): The server rejected the flight data.';
      
      // Try to extract parameter-specific errors if they exist
      if (error.response && error.response.data) {
        detailedMessage += ' Details: ' + JSON.stringify(error.response.data);
      }
      
      // Provide guidance for common issues
      detailedMessage += ' Please check that all required fields are correctly formatted, especially IDs and dates.';
      
      return detailedMessage;
    }
    
    if (message.includes('timeout') || message.includes('aborted')) {
      return 'Connection timeout: The server took too long to respond';
    }
    
    if (message.includes('network') || message.includes('offline')) {
      return 'Network error: Check your internet connection';
    }
    
    if (message.includes('TypeError') && message.includes('is not a function')) {
      return 'API function error: The createNewFlightFp2 action may not be available or has changed. Check the Palantir API documentation.';
    }
    
    if (message.includes('bristol') || message.includes('foundry')) {
      return 'API connection error: Unable to connect to the Palantir Foundry service. Please verify your authentication.';
    }
    
    // Special message for missing SDK
    if (message.includes('import') || message.includes('module')) {
      return 'SDK import error: Unable to load the @flight-app/sdk module. Please check that it is correctly installed.';
    }
    
    // Default error message with more detail
    return `Error creating flight: ${message} (Check browser console for more details)`;
  }
}

export default PalantirFlightService;