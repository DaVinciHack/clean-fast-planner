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
        "aircraftId": "190",
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
   * Create a new flight in Palantir using the new createFlightWithWaypoints function
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
    
    // Import the SDK
    const sdk = await this.getSDK();
    
    try {
      // Check if we should use the new createFlightWithWaypoints function
      if (sdk.createFlightWithWaypoints) {
        console.log('Using new createFlightWithWaypoints function');
        
        // Format waypoints in the structured format if available
        let structuredWaypoints = [];
        let legs = [];
        
        // If we have waypoints with leg information
        if (flightData.waypoints && Array.isArray(flightData.waypoints)) {
          // Group waypoints by leg index
          const waypointsByLeg = {};
          
          flightData.waypoints.forEach(wp => {
            const legIndex = wp.legIndex || 0;
            if (!waypointsByLeg[legIndex]) {
              waypointsByLeg[legIndex] = [];
            }
            waypointsByLeg[legIndex].push(wp.name || wp.id);
          });
          
          // Convert to legs array
          Object.keys(waypointsByLeg).forEach(legIndex => {
            legs.push({
              index: Number(legIndex),
              waypoints: waypointsByLeg[legIndex]
            });
          });
          
          // If no legs were created but we have waypoints, create a single leg
          if (legs.length === 0 && flightData.waypoints.length > 0) {
            legs.push({
              index: 0,
              waypoints: flightData.waypoints.map(wp => wp.name || wp.id)
            });
          }
        } else {
          // If no waypoint structure is provided, use locations as a simple leg
          legs.push({
            index: 0,
            waypoints: cleanLocations
          });
        }
        
        // Prepare the parameters for createFlightWithWaypoints
        const params = {
          "flightName": flightData.flightName || "Fast Planner Flight",
          "locations": cleanLocations,
          "legs": legs,
          "useOnlyProvidedWaypoints": true,
          "aircraftId": flightData.aircraftId || "190",
          "region": "NORWAY",
          "aircraftRegion": "NORWAY",
          "etd": flightData.etd || new Date().toISOString(),
          "alternateLocation": flightData.alternateLocation || ""
        };
        
        // Add crew members if provided
        if (flightData.captainId) params.captainId = flightData.captainId;
        if (flightData.copilotId) params.copilotId = flightData.copilotId;
        if (flightData.medicId) params.medicId = flightData.medicId;
        if (flightData.soId) params.soId = flightData.soId;
        if (flightData.rswId) params.rswId = flightData.rswId;
        
        console.log('Creating flight with structured waypoints:', JSON.stringify(params, null, 2));
        
        // Call the API
        const result = await client(sdk.createFlightWithWaypoints).applyAction(
          params,
          { $returnEdits: true }
        );
        
        console.log('Flight creation with structured waypoints successful!', result);
        return result;
      } else {
        // Fall back to the old createNewFlightFp2 if the new function is not available
        console.log('New createFlightWithWaypoints function not available, falling back to createNewFlightFp2');
        
        // Use a greatly simplified approach that matches the working ApiTester
        const cleanData = {
          flightName: flightData.flightName || "Test Flight",
          aircraftRegion: "NORWAY",
          new_parameter: "Norway",
          aircraftId: flightData.aircraftId || "190",
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
        
        // Check if the createNewFlightFp2 action exists
        if (!sdk.createNewFlightFp2) {
          console.error('createNewFlightFp2 action not found in SDK');
          console.log('Available SDK actions:', Object.keys(sdk));
          throw new Error('createNewFlightFp2 action not found in SDK');
        }
        
        // Format the parameters
        const params = this.formatFlightParams(cleanData);
        
        console.log('Calling createNewFlightFp2 with params:', params);
        
        // Make the API call with the exact format from the documentation
        const result = await client(sdk.createNewFlightFp2).applyAction(
          params,
          { $returnEdits: true }
        );
        
        console.log('Flight creation successful!', result);
        return result;
      }
    } catch (error) {
      console.error('Error creating flight:', error);
      
      // Log the full error for debugging
      console.error('Error details:', error);
      
      throw error;
    }
  }
  
  /**
   * Update an existing flight in Palantir using the new updateFastPlannerFlight function
   * @param {Object} flightData - The flight data including the flightId
   * @returns {Promise<Object>} - The result of the API call
   */
  static async updateFlight(flightData) {
    if (!this.isClientAvailable()) {
      throw new Error('OSDK client not available. Try logging in again.');
    }
    
    if (!flightData.flightId) {
      throw new Error('Flight ID is required for updating a flight');
    }
    
    // Import the SDK
    const sdk = await this.getSDK();
    
    try {
      // Check if we should use the new updateFastPlannerFlight function
      if (sdk.updateFastPlannerFlight) {
        console.log('Using new updateFastPlannerFlight function');
        
        // Format structured waypoints if available
        let structuredWaypoints = [];
        
        if (flightData.waypoints && Array.isArray(flightData.waypoints)) {
          // Convert waypoints to structured format
          structuredWaypoints = flightData.waypoints.map(wp => ({
            legIndex: wp.legIndex || 0,
            waypoint: wp.name || wp.id
          }));
        }
        
        // Clean up the locations
        let cleanLocations = [];
        if (flightData.locations && Array.isArray(flightData.locations)) {
          cleanLocations = flightData.locations.map(loc => typeof loc === 'string' ? loc.trim() : loc);
        }
        
        // Prepare the parameters for updateFastPlannerFlight
        const params = {
          "flightId": flightData.flightId,
          "flightName": flightData.flightName,
          "locations": cleanLocations,
          "structuredWaypoints": structuredWaypoints,
          "useOnlyProvidedWaypoints": true,
          "region": "NORWAY",
          "aircraftRegion": "NORWAY",
          "etd": flightData.etd || new Date().toISOString()
        };
        
        // Add optional parameters if provided
        if (flightData.aircraftId) params.aircraftId = flightData.aircraftId;
        if (flightData.alternateLocation) params.alternateLocation = flightData.alternateLocation;
        if (flightData.captainId) params.captainId = flightData.captainId;
        if (flightData.copilotId) params.copilotId = flightData.copilotId;
        if (flightData.medicId) params.medicId = flightData.medicId;
        if (flightData.soId) params.soId = flightData.soId;
        if (flightData.rswId) params.rswId = flightData.rswId;
        
        // Add any additional parameters
        if (flightData.fuelPlanId) params.fuelPlanId = flightData.fuelPlanId;
        if (flightData.timingId) params.timingId = flightData.timingId;
        if (flightData.weightBalanceId) params.weightBalanceId = flightData.weightBalanceId;
        if (flightData.policyUuid) params.policyUuid = flightData.policyUuid;
        
        console.log('Updating flight with parameters:', JSON.stringify(params, null, 2));
        
        // Call the API
        const result = await client(sdk.updateFastPlannerFlight).applyAction(
          params,
          { $returnEdits: true }
        );
        
        console.log('Flight update successful!', result);
        return result;
      } else {
        // Fall back to the old editExistingFlightFp2 if available
        console.log('New updateFastPlannerFlight function not available, falling back to editExistingFlightFp2');
        
        if (!sdk.editExistingFlightFp2) {
          throw new Error('Neither updateFastPlannerFlight nor editExistingFlightFp2 are available');
        }
        
        // Use a greatly simplified approach that matches the working ApiTester
        const cleanData = {
          flightId: flightData.flightId,
          flightName: flightData.flightName,
          aircraftRegion: "NORWAY",
          aircraftId: flightData.aircraftId,
          region: "NORWAY",
          etd: flightData.etd || new Date().toISOString(),
          locations: flightData.locations || ["ENZV", "ENLE"],
          alternateLocation: flightData.alternateLocation || ""
        };
        
        // Only include crew if provided
        if (flightData.captainId) cleanData.captainId = flightData.captainId;
        if (flightData.copilotId) cleanData.copilotId = flightData.copilotId;
        
        // Log the clean data 
        console.log('Flight update data structure:', JSON.stringify(cleanData, null, 2));
        
        // Make the API call
        const result = await client(sdk.editExistingFlightFp2).applyAction(
          cleanData,
          { $returnEdits: true }
        );
        
        console.log('Flight update successful!', result);
        return result;
      }
    } catch (error) {
      console.error('Error updating flight:', error);
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
      return 'API endpoint not found: The required action may not be available';
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
      return 'API function error: The required action may not be available or has changed. Check the Palantir API documentation.';
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