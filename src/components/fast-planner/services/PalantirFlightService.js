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
   * Inspect createFlightWithWaypoints API to see its signature
   * @returns {Promise<Object>} - Information about the function signature
   */
  static async inspectCreateFlightWithWaypoints() {
    try {
      console.log("🔍 INSPECTING: createFlightWithWaypoints API...");
      
      const sdk = await this.getSDK();
      
      if (!sdk.createFlightWithWaypoints) {
        return { error: "createFlightWithWaypoints not available" };
      }
      
      // Try to inspect the function signature
      const func = sdk.createFlightWithWaypoints;
      console.log("🔍 Function type:", typeof func);
      console.log("🔍 Function string:", func.toString());
      
      // Try to access any metadata if available
      if (func.metadata) {
        console.log("🔍 Function metadata:", func.metadata);
      }
      
      if (func.parameters) {
        console.log("🔍 Function parameters:", func.parameters);
      }
      
      if (func.signature) {
        console.log("🔍 Function signature:", func.signature);
      }
      
      // Check if it has any properties that might indicate parameter structure
      const props = Object.getOwnPropertyNames(func);
      console.log("🔍 Function properties:", props);
      
      for (const prop of props) {
        if (prop !== 'length' && prop !== 'name' && prop !== 'prototype') {
          console.log(`🔍 Property ${prop}:`, func[prop]);
        }
      }
      
      return { 
        type: typeof func,
        properties: props,
        hasMetadata: !!func.metadata,
        hasParameters: !!func.parameters,
        hasSignature: !!func.signature
      };
      
    } catch (error) {
      console.error("🔍 Function inspection failed:", error);
      return { error: error.message };
    }
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
   * Create a new flight or update existing flight in Palantir
   * Automatically chooses between createFlightWithWaypoints (new) or updateFastPlannerFlight (existing)
   * @param {Object} flightData - The flight data
   * @returns {Promise<Object>} - The result of the API call
   */
  static async createFlight(flightData) {
    if (!this.isClientAvailable()) {
      throw new Error('OSDK client not available. Try logging in again.');
    }
    
    // Check if this is an update (existing flight with ID) or create (new flight)
    const isUpdate = flightData.flightId && flightData.flightId.trim() !== '';
    
    // 🎯 ENHANCED LOGGING: Detailed save operation tracking
    console.log('🎯 PALANTIR SAVE OPERATION ANALYSIS:', {
      operation: isUpdate ? 'UPDATE' : 'CREATE',
      flightId: flightData.flightId,
      hasFlightId: !!flightData.flightId,
      flightIdLength: flightData.flightId?.length || 0,
      flightIdTrimmed: flightData.flightId?.trim(),
      waypointCount: flightData.waypoints?.length || 0,
      flightName: flightData.flightName,
      aircraftId: flightData.aircraftId,
      aircraftIdType: typeof flightData.aircraftId
    });
    
    if (isUpdate) {
      console.log(`✅ UPDATING existing flight with ID: ${flightData.flightId}`);
      return await this.updateFlight(flightData);
    } else {
      console.warn('⚠️ CREATING NEW FLIGHT - this may cause waypoint duplication if flight ID should exist');
      return await this.createNewFlight(flightData);
    }
  }
  
  /**
   * Create a new flight in Palantir using createFlightWithWaypoints
   * @param {Object} flightData - The flight data
   * @returns {Promise<Object>} - The result of the API call
   */
  static async createNewFlight(flightData) {
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
      // ✅ TRY: Use newer API instead of forcing legacy API
      if (sdk.createFlightWithWaypoints) {
        console.log('Using new createFlightWithWaypoints function');
        
        // Format waypoints with type information - distinguish stops from navigation waypoints
        let displayWaypoints = null;
        
        if (flightData.waypoints && Array.isArray(flightData.waypoints)) {
          console.log('=== PALANTIR SERVICE WAYPOINT DEBUG ===');
          console.log('Raw waypoints received:', flightData.waypoints.length);
          flightData.waypoints.forEach((wp, index) => {
            console.log(`Waypoint ${index}:`, {
              name: wp.name,
              type: wp.type,
              pointType: wp.pointType,
              isWaypoint: wp.isWaypoint
            });
          });
          
          // CRITICAL FIX: If all waypoints have undefined classification properties,
          // this means Fast Planner is sending stops as waypoints, not actual navigation waypoints
          console.log('🔍 PALANTIR SERVICE: Checking waypoint classifications:', flightData.waypoints.map(wp => ({
            name: wp.name,
            pointType: wp.pointType,
            isWaypoint: wp.isWaypoint,
            type: wp.type,
            isNavigationWaypoint: wp.pointType === 'NAVIGATION_WAYPOINT' || wp.isWaypoint === true || wp.type === 'WAYPOINT'
          })));
          
          const hasActualWaypoints = flightData.waypoints.some(wp => 
            wp.pointType === 'NAVIGATION_WAYPOINT' || 
            wp.isWaypoint === true || 
            wp.type === 'WAYPOINT'
          );
          
          console.log('🔍 PALANTIR SERVICE: hasActualWaypoints =', hasActualWaypoints);
          
          if (!hasActualWaypoints) {
            console.log('❌ No actual navigation waypoints found - all waypoints have undefined classification. Setting displayWaypoints to null.');
            displayWaypoints = null;
          } else {
            console.log('Found actual navigation waypoints, processing them...');
            
            // Create structured waypoints with leg index and waypoint type information
            const structuredWaypoints = flightData.waypoints
              .filter(wp => {
                // Use the same classification logic as WaypointManager.js
                // 1. First check the explicit point type (most reliable)
                if (wp.pointType === 'NAVIGATION_WAYPOINT') return true;
                if (wp.pointType === 'LANDING_STOP') return false;
                
                // 2. Check the isWaypoint boolean flag
                if (typeof wp.isWaypoint === 'boolean') return wp.isWaypoint;
                
                // 3. Check the type string (older method)
                if (wp.type === 'WAYPOINT') return true; // Note: uppercase WAYPOINT
                if (wp.type === 'STOP') return false;
                
                // 4. Don't default to true anymore - only include properly classified waypoints
                return false;
              })
              .map((wp, index) => ({
                legIndex: wp.legIndex || 0,
                waypoint: wp.name || wp.id
              }));
              
            // Convert to JSON string if we have waypoints
            if (structuredWaypoints.length > 0) {
              displayWaypoints = JSON.stringify(structuredWaypoints);
            }
          }
        }
        
        // Prepare the parameters for createFlightWithWaypoints
        // 🧙‍♂️ WIZARD FIX: Add ETD to createFlightWithWaypoints params
        console.log('🧙‍♂️ CREATEFLIGHT DEBUG: flightData.etd =', flightData.etd);
        
        const params = {
          "flightName": flightData.flightName || "Fast Planner Flight",
          "locations": cleanLocations,
          "displayWaypoints": displayWaypoints,  // Send structured waypoint information
          "useOnlyProvidedWaypoints": flightData.useOnlyProvidedWaypoints ?? false,  // 🔧 FIX: Respect Auto Plan setting for weather replanning
          "aircraftId": flightData.aircraftId || "190",    // ✅ Tail number
          // assetIdx removed - was causing save failures
          "region": flightData.region || "NORWAY",
          "etd": flightData.etd || new Date().toISOString() // 🧙‍♂️ WIZARD FIX: Include ETD in newer API
          // 🚨 DEBUG: Temporarily removing policy UUID to test other parameters
        };
        
        console.log('🧙‍♂️ CREATEFLIGHT DEBUG: params.etd =', params.etd);
        console.log('🛩️ POLICY DEBUG: flightData.policyUuid =', flightData.policyUuid, '(temporarily removed for testing)');
        console.log('🚨 CRITICAL DEBUG: Full params being sent to createFlightWithWaypoints:', JSON.stringify(params, null, 2));
        
        // 🔍 PARAMETER DISCOVERY: Inspect the API function signature
        console.log('🔍 To inspect the API function signature, run this in console:');
        console.log('window.PalantirFlightService.inspectCreateFlightWithWaypoints()');
        
        // Make the service available globally for testing
        if (typeof window !== 'undefined') {
          window.PalantirFlightService = PalantirFlightService;
        }
        
        // 🚨 WIZARD DEBUG: Check for potential 400 error causes
        console.log('🚨 WIZARD 400 DEBUG:', {
          hasFlightName: !!params.flightName,
          flightNameLength: params.flightName?.length,
          hasLocations: !!params.locations,
          locationsCount: params.locations?.length,
          hasAircraftId: !!params.aircraftId,
          aircraftIdType: typeof params.aircraftId,
          policyUuidProvided: !!flightData.policyUuid,
          hasRegion: !!params.region,
          hasETD: !!params.etd,
          etdValid: !isNaN(new Date(params.etd))
        });
        
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
        
        // 🛩️ POST-CREATION POLICY: Try to add policy UUID after flight creation if provided
        if (flightData.policyUuid && result) {
          console.log('🛩️ Attempting to add policy UUID after flight creation...');
          try {
            const flightId = this.extractFlightId(result);
            console.log('🛩️ Extracted flight ID for policy update:', flightId);
            
            // Here we could try to update the flight with policy UUID using updateFastPlannerFlight
            // or save it via the fuel save-back service
            console.log('🛩️ Policy UUID will be handled by fuel save-back service for flight:', flightId);
            
          } catch (policyError) {
            console.warn('🛩️ Could not add policy UUID after creation:', policyError);
          }
        }
        
        return result;
      } else {
        // Fall back to the old createNewFlightFp2 if the new function is not available OR if we need policy UUID support
        const reason = !sdk.createFlightWithWaypoints ? 'function not available' : 'policy UUID support needed';
        console.log(`Using legacy createNewFlightFp2 API (${reason})`);
        
        // Use a greatly simplified approach that matches the working ApiTester
        // 🧙‍♂️ DEBUG: Log ETD before and after fallback
        console.log('🧙‍♂️ PALANTIR DEBUG: flightData.etd =', flightData.etd);
        console.log('🧙‍♂️ PALANTIR DEBUG: flightData.etd type =', typeof flightData.etd);
        console.log('🧙‍♂️ PALANTIR DEBUG: flightData.etd truthy =', !!flightData.etd);
        
        const finalETD = flightData.etd || new Date().toISOString();
        console.log('🧙‍♂️ PALANTIR DEBUG: Final ETD being used =', finalETD);
        
        // 🧙‍♂️ DEBUG: Check if we need to convert to extended offset format
        const testDate = new Date(finalETD);
        const extendedFormat = testDate.toISOString().replace('Z', '+00:00');
        console.log('🧙‍♂️ PALANTIR DEBUG: Extended offset format =', extendedFormat);
        console.log('🧙‍♂️ PALANTIR DEBUG: Original .toISOString() =', testDate.toISOString());
        
        const cleanData = {
          flightName: flightData.flightName || "Test Flight",
          aircraftRegion: "GULF_OF_MEXICO",  // ✅ TEMP: Hardcode Gulf of Mexico for wizard
          new_parameter: "Gulf of Mexico",
          aircraftId: flightData.aircraftId || "N109DR",    // ✅ Back to aircraftId
          // NOTE: Removing asset_idx to test without it
          region: "GULF_OF_MEXICO",  // ✅ TEMP: Hardcode Gulf of Mexico for wizard
          etd: finalETD,
          locations: cleanLocations,
          alternateLocation: flightData.alternateLocation || "",
          // Only include crew if provided
          ...(flightData.captainId ? { captainId: flightData.captainId } : {}),
          ...(flightData.copilotId ? { copilotId: flightData.copilotId } : {}),
          // NOTE: Legacy API doesn't support policy UUID - will be saved in fuel object instead
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
        // 🧙‍♂️ DEBUG: Log final ETD in params object
        console.log('🧙‍♂️ PALANTIR DEBUG: Final params.etd =', params.etd);
        console.log('🛩️ LEGACY API DEBUG: Final params with policy fields:', JSON.stringify(params, null, 2));
        
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
      
      // 🚨 ENHANCED ERROR LOGGING: Get detailed error information
      console.error('🚨 DETAILED ERROR ANALYSIS:', {
        errorName: error.name,
        errorMessage: error.message,
        errorCode: error.errorCode,
        statusCode: error.statusCode,
        errorInstanceId: error.errorInstanceId,
        parameters: error.parameters,
        submissionCriteria: error.submissionCriteria,
        fullError: error
      });
      
      // Try to extract validation details if available
      if (error.parameters) {
        console.error('🚨 PARAMETER VALIDATION:', error.parameters);
      }
      
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
        let structuredWaypointsJson = null;
        
        if (flightData.waypoints && Array.isArray(flightData.waypoints)) {
          // Convert waypoints to structured format and stringify
          const structuredWaypoints = flightData.waypoints
            .filter(wp => {
              // Use the same classification logic as create
              if (wp.pointType === 'NAVIGATION_WAYPOINT') return true;
              if (wp.pointType === 'LANDING_STOP') return false;
              if (typeof wp.isWaypoint === 'boolean') return wp.isWaypoint;
              if (wp.type === 'WAYPOINT') return true;
              if (wp.type === 'STOP') return false;
              return true;
            })
            .map(wp => ({
              legIndex: wp.legIndex || 0,
              waypoint: wp.name || wp.id
            }));
            
          // Convert to JSON string if we have waypoints
          if (structuredWaypoints.length > 0) {
            structuredWaypointsJson = JSON.stringify(structuredWaypoints);
          }
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
          "structuredWaypoints": structuredWaypointsJson,
          "useOnlyProvidedWaypoints": true,
          "region": flightData.region || flightData.aircraftRegion || "NORWAY",
          "aircraftRegion": flightData.aircraftRegion || flightData.region || "NORWAY", 
          "etd": flightData.etd || new Date().toISOString()
        };
        
        // Add optional parameters if provided
        if (flightData.aircraftId) params.aircraftId = flightData.aircraftId;    // ✅ Tail number
        // assetIdx removed - was causing save failures
        // if (flightData.assetIdx !== undefined && flightData.assetIdx !== null) {
        //   params.assetIdx = Number(flightData.assetIdx);
        //   console.log('🎯 PALANTIR: Adding assetIdx:', params.assetIdx, 'type:', typeof params.assetIdx);
        // }
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
      "aircraftRegion": "GULF_OF_MEXICO",  // ✅ HARDCODE: Gulf of Mexico for wizard
      "new_parameter": "Gulf of Mexico",
      "aircraftId": params.aircraftId || "190", // Use the numeric ID as fallback
      "region": "GULF_OF_MEXICO",  // ✅ HARDCODE: Gulf of Mexico for wizard
      "etd": params.etd || new Date().toISOString(),
      "locations": Array.isArray(params.locations) ? params.locations : ["ENZV", "ENLE"],
      "alternateLocation": params.alternateLocation || ""
    };
    
    // NOTE: Testing without asset_idx field
    
    // NOTE: Legacy API doesn't support policy UUID parameters
    // Policy UUID will be saved in the fuel object via fuel save-back service
    
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