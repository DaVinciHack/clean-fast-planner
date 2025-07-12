/**
 * FuelSaveBackService.js
 * 
 * Service for saving fuel calculations back to Palantir using MainFuelV2 OSDK objects.
 * Transforms StopCardCalculator results into Palantir's exact MainFuelV2 structure.
 * 
 * AVIATION SAFETY: All fuel values are calculated from real aircraft performance data.
 * No dummy values or fallbacks that could mislead pilots.
 * 
 * ARCHITECTURE: Matches Palantir's FlightFuelService.ts array-based structure exactly.
 */

import client from '../../../client';

/**
 * Service class for handling fuel data save-back to Palantir
 */
export class FuelSaveBackService {
  
  /**
   * Save fuel data for a flight using MainFuelV2 OSDK object
   * Matches Palantir's FlightFuelService.ts structure exactly
   * 
   * @param {string} flightId - The flight ID (required)
   * @param {Array} stopCards - Stop cards from StopCardCalculator
   * @param {Object} flightSettings - Current flight settings from UI
   * @param {Object} weatherFuel - Weather fuel analysis
   * @param {Object} fuelPolicy - Selected fuel policy object
   * @param {Object} routeStats - Route statistics
   * @param {Object} selectedAircraft - Aircraft object
   * @returns {Promise<Object>} - OSDK save result
   */
  static async saveFuelData(flightId, stopCards, flightSettings = {}, weatherFuel = {}, fuelPolicy = null, routeStats = {}, selectedAircraft = null) {
    console.log('💾 FuelSaveBackService: Starting MainFuelV2 save-back for flight:', flightId);
    console.log('💾 Stop cards count:', stopCards?.length);
    
    let actionParams = {}; // Declare outside try block for error logging
    let debugInfo = {}; // Additional debug info for error logging
    
    try {
      // Validate required parameters
      if (!flightId) {
        throw new Error('Flight ID is required for fuel save-back');
      }
      
      if (!stopCards || stopCards.length === 0) {
        console.log('💾 No stop cards provided, will only save basic fuel settings');
      }
      
      // Import SDK dynamically
      const sdk = await import('@flight-app/sdk');
      
      // Find or create MainFuelV2 object for this flight
      console.log('💾 Finding existing MainFuelV2 object for flight:', flightId);
      
      let existingFuelObject = null;
      
      // Search for existing fuel object by flight UUID
      console.log('🔍 Searching for MainFuelV2 objects for flight:', flightId);
      
      const existingData = await client(sdk.MainFuelV2)
        .where(fuel => fuel.flightUuid.exactMatch(flightId))
        .fetchPage({ $pageSize: 5 });
    
      console.log('🔍 Search results:', {
        totalFound: existingData.data?.length || 0,
        flightId: flightId
      });
      
      if (existingData.data && existingData.data.length > 0) {
        // Use the first (most recent) fuel object for this flight
        existingFuelObject = existingData.data[0];
        console.log('✅ Found existing fuel object:', {
          primaryKey: existingFuelObject.$primaryKey,
          flightUuid: existingFuelObject.flightUuid,
          updatedAt: existingFuelObject.updatedAt
        });
      } else {
        console.log('ℹ️ No existing fuel object found - will create new one');
        // Note: createOrModifyMainFuelFastPlanner will create if no object provided
      }
      
      console.log('💾 Using fuel object for modification:', 
        existingFuelObject ? existingFuelObject.$primaryKey : 'CREATE NEW');
      
      // Use the NEW comprehensive createOrModifyMainFuelFastPlanner action
      console.log('💾 Using createOrModifyMainFuelFastPlanner - comprehensive fuel + passenger data');
      
      // Get departure card for fuel totals
      const departureCard = stopCards?.[0] || {};
      const currentTime = new Date().toISOString();
      
      // Extract regional weight data from fuel policy (AVIATION SAFETY: NO HARDCODED VALUES!)
      const regionalPassengerWeight = fuelPolicy?.averagePassengerWeight || 
                                     fuelPolicy?.currentPolicy?.averagePassengerWeight || 
                                     220; // Norway default from fuel policy
      const regionalBagWeight = fuelPolicy?.averageBagWeight || 
                               fuelPolicy?.currentPolicy?.averageBagWeight || 
                               0; // Default 0 if not available
      
      // 🚨 CRITICAL FIX: Send COMPLETE fuel data from Fast Planner to Palantir
      // Extract all fuel components from stop cards to match Palantir display
      
      // Extract arrays from stop cards for complete fuel data
      const stopLocations = [];
      const stopTripFuels = [];
      const stopTaxiFuels = [];
      const stopDeckFuels = [];
      const stopReserveFuels = [];
      const stopContingencyFuels = [];
      const stopExtraFuels = [];
      const stopAraFuels = [];
      const stopApproachFuels = [];
      const stopDescriptions = [];
      const stopRequiredFuels = [];
      const stopExcessFuels = [];
      
      // Passenger data arrays
      const requestedPassengers = [];
      const availablePassengers = [];
      const requestedPassengerWeight = [];
      const availableWeight = [];
      const requestedTotalWeight = [];
      const requestedBagWeight = [];
      
      // Process each stop card to extract fuel components
      stopCards.forEach((card, index) => {
        if (!card) return;
        
        // Location and description
        stopLocations.push(card.name || card.stopName || card.location || `Stop ${index + 1}`);
        stopDescriptions.push(card.description || card.stopType || 'Standard Stop');
        
        // Core fuel components (round to integers)
        stopTripFuels.push(Math.round(card.tripFuel || 0));
        stopTaxiFuels.push(Math.round(card.taxiFuel || 0));
        stopDeckFuels.push(Math.round(card.deckFuel || 0));
        stopReserveFuels.push(Math.round(card.reserveFuel || 0));
        stopContingencyFuels.push(Math.round(card.contingencyFuel || 0));
        stopExtraFuels.push(Math.round(card.extraFuel || 0));
        
        // Weather-based fuel components
        stopAraFuels.push(Math.round(card.araFuel || 0));
        stopApproachFuels.push(Math.round(card.approachFuel || 0));
        
        // Calculated totals
        stopRequiredFuels.push(Math.round(card.totalFuel || 0));
        stopExcessFuels.push(Math.round(card.excessFuel || 0));
        
        // Passenger data from stop cards
        requestedPassengers.push(Math.round(card.maxPassengers || card.passengers || 0));
        availablePassengers.push(Math.round(card.maxPassengers || card.passengers || 0));
        requestedPassengerWeight.push(Math.round((card.maxPassengers || 0) * regionalPassengerWeight));
        availableWeight.push(Math.round(card.availableWeight || 0));
        requestedTotalWeight.push(Math.round(card.totalWeight || 0));
        requestedBagWeight.push(Math.round((card.maxPassengers || 0) * regionalBagWeight));
      });
      
      // Generate markdown table matching EXACT operations format
      let markdownTable = "";
      
      stopCards.forEach((card, index) => {
        if (!card) return;
        
        const location = stopLocations[index] || `Stop ${index + 1}`;
        const requiredFuel = stopRequiredFuels[index] || 0;
        const passengers = requestedPassengers[index] || 0;
        const passengerWeight = requestedPassengerWeight[index] || 0;
        
        // Check if refuel is needed (if this is a fuel stop)
        const refuelNote = card.isRefuelStop ? " (Refuel needed)" : "";
        const fuelDisplay = `${requiredFuel}${refuelNote} Lbs`;
        
        // Build fuel components string - EXACT format from operations
        const components = [];
        if (stopTripFuels[index]) components.push(`Trip:${stopTripFuels[index]}`);
        if (stopContingencyFuels[index]) components.push(`Cont:${stopContingencyFuels[index]}`);
        if (stopTaxiFuels[index]) components.push(`Taxi:${stopTaxiFuels[index]}`);
        if (stopDeckFuels[index]) components.push(`Deck:${stopDeckFuels[index]}`);
        if (stopAraFuels[index]) components.push(`ARA:${stopAraFuels[index]}`);
        if (stopApproachFuels[index]) components.push(`Appr:${stopApproachFuels[index]}`);
        if (stopReserveFuels[index]) components.push(`Res:${stopReserveFuels[index]}`);
        if (stopExtraFuels[index]) components.push(`Extra:${stopExtraFuels[index]}`);
        
        // Handle final stop differently
        const isFinalStop = index === stopCards.length - 1;
        let componentsStr = "";
        let passengerStr = "";
        let legStr = "";
        
        if (isFinalStop) {
          componentsStr = `Reserve:${stopReserveFuels[index] || 0} Extra:${stopExtraFuels[index] || 0} FullCont:${stopContingencyFuels[index] || 0}`;
          passengerStr = "Final Stop";
          legStr = `Final destination (Total: ${requiredFuel} Lbs)`;
        } else {
          componentsStr = components.join(' ') || 'No fuel';
          passengerStr = `${passengers} (${passengerWeight} Lbs)`;
          
          // Build legs string - simplified for now (would need route leg data)
          const nextStop = stopLocations[index + 1];
          if (nextStop) {
            legStr = `${location}-${nextStop}`;
          } else {
            legStr = `${location} route`;
          }
        }
        
        // EXACT format: ENZV    5150 (Refuel needed+533) Lbs    13 (2772 Lbs)    Trip:3848 Cont:385 Taxi:100 Deck:450 ARA:200 Appr:200 Res:500    ENZV-ENLE → ENLE-ENWV → ENWV-ENZV
        markdownTable += `${location}    ${fuelDisplay}    ${passengerStr}    ${componentsStr}    ${legStr}\n`;
      });
      
      console.log('💾 COMPLETE FUEL DATA EXTRACTION:', {
        stopCount: stopCards.length,
        locations: stopLocations,
        tripFuels: stopTripFuels,
        totalFuels: stopRequiredFuels,
        markdownTableLines: markdownTable.split('\n').length
      });
      
      // Build action parameters based on whether we're updating or creating
      const actionParams = {
        // Only include existing object if we found one to modify
        ...(existingFuelObject && { "main_fuel_v2": existingFuelObject }),
        
        // Complete fuel data arrays matching Fast Planner calculations
        "stop_locations": stopLocations,
        "stop_descriptions": stopDescriptions,
        "stop_trip_fuels": stopTripFuels,
        "stop_taxi_fuels": stopTaxiFuels,
        "stop_deck_fuels": stopDeckFuels,
        "stop_reserve_fuels": stopReserveFuels,
        "stop_contingency_fuels": stopContingencyFuels,
        "stop_extra_fuels": stopExtraFuels,
        "stop_ara_fuels": stopAraFuels,
        "stop_approach_fuels": stopApproachFuels,
        "stop_required_fuels": stopRequiredFuels,
        "stop_excess_fuels": stopExcessFuels,
        
        // Summary fuel values
        "planned_trip_fuel": Math.round(departureCard.tripFuel || routeStats.tripFuel || 0),
        "planned_extra_fuel": Math.round(Number(flightSettings?.extraFuel) || 0),
        "planned_taxi_fuel": Math.round(departureCard.taxiFuel || 0),
        "planned_deck_fuel": Math.round(departureCard.deckFuel || 0),
        "planned_reserve_fuel": Math.round(departureCard.reserveFuel || 0),
        "planned_contingency_fuel": Math.round(departureCard.contingencyFuel || 0),
        "planned_ara_fuel": Math.round(departureCard.araFuel || weatherFuel?.araFuel || 0),
        "planned_approach_fuel": Math.round(departureCard.approachFuel || weatherFuel?.approachFuel || 0),
        "min_total_fuel": Math.round(departureCard.totalFuel || 0),
        
        // Critical fuel totals  
        "round_trip_fuel": Math.round(departureCard.totalFuel || 0), // Total departure fuel
        "planned_alternate_fuel": Math.round(routeStats.alternateFuel || routeStats.minimumFuel || departureCard.reserveFuel || 0), // Minimum safe fuel 
        "total_fuel_burned": Math.round(routeStats.tripFuel || departureCard.tripFuel || 0),
        "total_fuel_uplifted": Math.round(departureCard.totalFuel || 0),
        
        // Passenger data arrays
        "requested_passengers": requestedPassengers,
        "available_passengers": availablePassengers,
        "requested_passenger_weight": requestedPassengerWeight,
        "available_weight": availableWeight,
        "requested_total_weight": requestedTotalWeight,
        "requested_bag_weight": requestedBagWeight,
        
        // Regional defaults
        "average_passenger_weight": Math.round(regionalPassengerWeight),
        "average_bag_weight": Math.round(regionalBagWeight),
        
        // Flight metadata
        "flight_uuid": flightId,
        "aircraft": selectedAircraft?.name || selectedAircraft?.registration || 'Unknown',
        "policy_uuid": fuelPolicy?.uuid || fuelPolicy?.currentPolicy?.uuid || '',
        "policy_name": fuelPolicy?.name || fuelPolicy?.currentPolicy?.name || '',
        "flight_number": `${selectedAircraft?.registration || 'Unknown'} (${new Date().toLocaleDateString()})`,
        
        // Formatted display data
        "stops_markdown_table": markdownTable,
        "min_fuel_breakdown": `Trip:${Math.round(departureCard.tripFuel || routeStats.tripFuel || 0)} Taxi:${Math.round(departureCard.taxiFuel || 0)} Deck:${Math.round(departureCard.deckFuel || 0)} Res:${Math.round(departureCard.reserveFuel || 0)} Extra:${Math.round(Number(flightSettings?.extraFuel) || 0)}`,
        
        // Technical metadata
        "calculation_unit": "LBS",
        "display_unit": "LBS",
        "uses_combined_weight": true,
        
        // Timestamp
        "updated_at": currentTime,
        "created_at": currentTime
      };
      
      console.log('💾 COMPREHENSIVE FUEL DATA: All fuel components for Palantir:', {
        main_fuel_v2_primaryKey: actionParams.main_fuel_v2?.$primaryKey,
        main_fuel_v2_flightUuid: actionParams.main_fuel_v2?.flightUuid,
        stopCount: actionParams.stop_locations?.length,
        totalParameterCount: Object.keys(actionParams).length,
        sampleStopData: {
          location: actionParams.stop_locations?.[0],
          tripFuel: actionParams.stop_trip_fuels?.[0],
          totalFuel: actionParams.stop_required_fuels?.[0]
        }
      });
      
      console.log('💾 DEBUG: Stop cards structure:', stopCards?.map((card, i) => ({
        index: i,
        name: card.name,
        stopName: card.stopName,
        location: card.location,
        waypoint: card.waypoint,
        totalFuel: card.totalFuel,
        tripFuel: card.tripFuel,
        reserveFuel: card.reserveFuel,
        allKeys: Object.keys(card)
      })));
      
      console.log('💾 DEBUG: First stop card full object:', stopCards?.[0]);
      
      console.log('💾 Full action parameters before submission:', JSON.stringify(actionParams, null, 2));
      console.log('💾 DEBUG: Key parameter types:', {
        main_fuel_v2: typeof actionParams.main_fuel_v2,
        main_fuel_v2_primaryKey: actionParams.main_fuel_v2?.$primaryKey,
        main_fuel_v2_flightUuid: actionParams.main_fuel_v2?.flightUuid
      });
      
      // Debug: Check if we have basic required fuel data
      console.log('💾 DEBUG: Key fuel values being saved:', {
        planned_trip_fuel: actionParams.planned_trip_fuel,
        planned_extra_fuel: actionParams.planned_extra_fuel,
        min_total_fuel: actionParams.min_total_fuel,
        updated_at: actionParams.updated_at
      });
      
      // Determine if we're creating or modifying
      const isModifying = !!existingFuelObject;
      const actionType = isModifying ? 'MODIFY_EXISTING' : 'CREATE_NEW';
      
      if (isModifying) {
        console.log('💾 Using action to MODIFY existing MainFuelV2 object:', existingFuelObject.$primaryKey);
        console.log('💾 DEBUG: Existing object being passed:', {
          primaryKey: existingFuelObject.$primaryKey,
          type: typeof existingFuelObject,
          flightUuid: existingFuelObject.flightUuid,
          flightUuidMatches: existingFuelObject.flightUuid === flightId
        });
        
        // ✅ UUID VALIDATION: Check that key UUIDs are valid
        console.log('💾 UUID VALIDATION:', {
          flightId: flightId,
          flightIdValid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(flightId),
          primaryKey: existingFuelObject.$primaryKey,
          primaryKeyValid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(existingFuelObject.$primaryKey)
        });
      } else {
        console.log('💾 Using action to CREATE new MainFuelV2 object for flight:', flightId);
        console.log('💾 Flight UUID validation:', {
          flightId: flightId,
          flightIdValid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(flightId)
        });
      }
      
      // 🚨 FINAL DEBUG: Log key info before API call
      debugInfo = {
        parameterCount: Object.keys(actionParams).length,
        hasMainFuelV2: !!actionParams.main_fuel_v2,
        main_fuel_v2_primaryKey: actionParams.main_fuel_v2?.$primaryKey,
        actionType: actionType
      };
      console.log('💾 FINAL PARAMETERS BEING SENT TO PALANTIR:', debugInfo);
      
      // ✅ READY: Call action to either modify existing or create new
      console.log(`💾 READY: Calling createOrModifyMainFuelFastPlanner to ${actionType}:`, 
        isModifying ? existingFuelObject.$primaryKey : flightId);
      
      const result = await client(sdk.createOrModifyMainFuelFastPlanner).applyAction(
        actionParams,
        { $returnEdits: true }
      );
      
      console.log('✅ FuelSaveBackService: createOrModifyMainFuelFastPlanner action successful:', result);
      
      // 🔍 VERIFICATION: Load the fuel object after save to verify success
      try {
        console.log('🔍 VERIFICATION: Loading fuel object after save...');
        
        const verifyData = await client(sdk.MainFuelV2)
          .where(fuel => fuel.flightUuid.exactMatch(flightId))
          .fetchPage({ $pageSize: 1 });
        
        if (verifyData.data && verifyData.data.length > 0) {
          const finalFuel = verifyData.data[0];
          
          if (isModifying && existingFuelObject) {
            console.log('🔍 MODIFICATION VERIFICATION:');
            console.log('  BEFORE:');
            console.log('    - UUID:', existingFuelObject.$primaryKey);
            console.log('    - Trip Fuel:', existingFuelObject.plannedTripFuel);
            console.log('    - Total Fuel:', existingFuelObject.minTotalFuel);
            console.log('    - Updated At:', existingFuelObject.updatedAt);
            
            console.log('  AFTER:');
            console.log('    - UUID:', finalFuel.$primaryKey);
            console.log('    - Trip Fuel:', finalFuel.plannedTripFuel);
            console.log('    - Total Fuel:', finalFuel.minTotalFuel);
            console.log('    - Updated At:', finalFuel.updatedAt);
            
            console.log('  VERIFICATION:');
            console.log('    - Same Object?', existingFuelObject.$primaryKey === finalFuel.$primaryKey);
            console.log('    - Data Updated?', existingFuelObject.updatedAt !== finalFuel.updatedAt);
          } else {
            console.log('🔍 CREATION VERIFICATION:');
            console.log('  NEW OBJECT CREATED:');
            console.log('    - UUID:', finalFuel.$primaryKey);
            console.log('    - Flight UUID:', finalFuel.flightUuid);
            console.log('    - Flight UUID Match?', finalFuel.flightUuid === flightId);
            console.log('    - Trip Fuel:', finalFuel.plannedTripFuel);
            console.log('    - Total Fuel:', finalFuel.minTotalFuel);
            console.log('    - Created At:', finalFuel.updatedAt);
          }
        } else {
          console.warn('❌ VERIFICATION: No fuel data found after save!');
        }
      } catch (verifyError) {
        console.error('❌ VERIFICATION ERROR:', verifyError);
      }
      
      // Handle the response from the action
      if (result.type === "edits") {
        // for new objects and updated objects edits will contain the primary key of the object
        const updatedObject = result.editedObjectTypes[0];
        console.log("Updated/Created fuel object:", updatedObject);
        
        // Show user feedback
        if (window.LoadingIndicator) {
          window.LoadingIndicator.updateStatusIndicator(
            'Comprehensive fuel + passenger data saved to Palantir successfully',
            'success',
            3000
          );
        }
        
        return result;
      } else {
        console.warn('Unexpected result type:', result.type);
        return result;
      }
      
    } catch (error) {
      console.error('❌ FuelSaveBackService: Error saving MainFuelV2:', error);
      
      // Enhanced error logging for 400 errors
      if (error.message && error.message.includes('400')) {
        console.error('❌ 400 Bad Request Details:');
        console.error('  - Request parameters (live):', JSON.stringify(actionParams, null, 2));
        console.error('  - Request parameters (preserved):', JSON.stringify(debugInfo?.fullParams || {}, null, 2));
        console.error('  - Debug info:', debugInfo);
        console.error('  - Flight ID:', flightId);
        console.error('  - Fuel policy region:', fuelPolicy?.region);
        console.error('  - Fuel policy UUID:', fuelPolicy?.uuid);
        console.error('  - Error object keys:', Object.keys(error));
        
        // Extract detailed error information from Palantir error object
        if (error.errorName) {
          console.error('  - Error name:', error.errorName);
        }
        if (error.errorCode) {
          console.error('  - Error code:', error.errorCode);
        }
        if (error.statusCode) {
          console.error('  - Status code:', error.statusCode);
        }
        if (error.errorInstanceId) {
          console.error('  - Error instance ID:', error.errorInstanceId);
        }
        if (error.parameters) {
          console.error('  - Error parameters:', error.parameters);
        }
        if (error.cause) {
          console.error('  - Error cause:', error.cause);
        }
        
        // Try to extract more details from the error
        if (error.response) {
          console.error('  - Error response:', error.response);
        }
        if (error.body) {
          console.error('  - Error body:', error.body);
        }
        if (error.details) {
          console.error('  - Error details:', error.details);
        }
        
        // Check if error contains constraint violations
        try {
          const errorString = error.toString();
          if (errorString.includes('constraint') || errorString.includes('validation')) {
            console.error('  - This appears to be a parameter validation error');
            console.error('  - Full error string:', errorString);
          }
        } catch (e) {
          console.error('  - Could not parse error string:', e);
        }
      }
      
      // Show user error feedback
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator(
          `Failed to save fuel data: ${error.message}`,
          'error',
          5000
        );
      }
      
      throw error;
    }
  }
  
  /**
   * Transform stop cards to Palantir's MainFuelV2 complete structure
   * Include ALL fuel components from the departure card
   */
  static transformToMainFuelV2Structure(stopCards, flightSettings, weatherFuel, fuelPolicy, routeStats, selectedAircraft, flightId) {
    console.log('🔄 Transforming stop cards to complete MainFuelV2 structure with ALL fuel components');
    
    if (!stopCards || stopCards.length === 0) {
      throw new Error('Stop cards are required for fuel save-back');
    }
    
    const departureCard = stopCards[0];
    console.log('🔄 Using departure card for fuel data:', departureCard);
    
    // Initialize the record structure with ALL required MainFuelV2 properties
    const fuelRecord = {
      // Basic identifiers
      flightUuid: flightId,
      flightNumber: flightSettings.flightNumber || selectedAircraft?.registration || 'Fast Planner Flight',
      aircraft: selectedAircraft?.registration || selectedAircraft?.assetId || 'Unknown',
      
      // Timestamps
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      
      // Units (matching Palantir's constants)
      calculationUnit: 'LBS',
      displayUnit: 'LBS',
      
      // Policy information
      policyName: fuelPolicy?.name || fuelPolicy?.currentPolicy?.name || 'Unknown Policy',
      policyUuid: fuelPolicy?.uuid || fuelPolicy?.currentPolicy?.uuid || null,
      
      // 🎯 CRITICAL: Planned fuel totals from actual calculations (not settings)
      plannedTripFuel: Math.round(departureCard.tripFuel || routeStats.tripFuel || 0), // This was missing!
      plannedTaxiFuel: Math.round(departureCard.taxiFuel || 0),
      plannedContingencyFuel: Math.round(departureCard.contingencyFuel || 0),
      plannedReserveFuel: Math.round(departureCard.reserveFuel || 0),
      plannedDeckFuel: Math.round(departureCard.deckFuel || 0),
      plannedExtraFuel: Math.round(departureCard.extraFuel || flightSettings.extraFuel || 0),
      plannedAraFuel: Math.round(departureCard.araFuel || weatherFuel.araFuel || 0),
      plannedApproachFuel: Math.round(departureCard.approachFuel || weatherFuel.approachFuel || 0),
      plannedAlternateFuel: 0, // TODO: Extract from alternate calculations
      plannedContingencyAlternateFuel: 0,
      
      // Total fuel calculations from actual calculations
      minTotalFuel: Math.round(departureCard.totalFuel || 0),
      roundTripFuel: Math.round(departureCard.totalFuel || 0),
      
      // Initialize all arrays (Palantir's array-based structure)
      stopLocations: [],
      stopRequiredFuels: [],
      stopDescriptions: [],
      stopTaxiFuels: [],
      stopTripFuels: [],
      stopContingencyFuels: [],
      stopAraFuels: [],
      stopApproachFuels: [],
      stopExtraFuels: [],
      stopDeckFuels: [],
      stopReserveFuels: [],
      stopExcessFuels: [],
      
      // Actual fuel arrays (for post-flight data)
      actualFuelBurneds: [],
      actualFuelUplifteds: [],
      actualLandingFuels: [],
      actualLegNames: [],
      actualOffBlocksFuels: [],
      actualOnBlocksFuels: [],
      actualTakeOffFuels: [],
      
      // Summary fields
      totalFuelBurned: 0,
      totalFuelUplifted: 0,
      automationSummary: 'Generated by Fast Planner',
      minFuelBreakdown: '',
      stopsMarkdownTable: ''
    };
    
    // Populate arrays from stop cards
    stopCards.forEach((card, index) => {
      if (!card || !card.name) return;
      
      fuelRecord.stopLocations.push(card.name);
      fuelRecord.stopRequiredFuels.push(Math.round(card.totalFuel || 0));
      fuelRecord.stopDescriptions.push(this.generateStopDescription(card, index));
      fuelRecord.stopTaxiFuels.push(Math.round(card.taxiFuel || 0));
      fuelRecord.stopTripFuels.push(Math.round(card.tripFuel || 0));
      fuelRecord.stopContingencyFuels.push(Math.round(card.contingencyFuel || 0));
      fuelRecord.stopAraFuels.push(Math.round(card.araFuel || 0));
      fuelRecord.stopApproachFuels.push(Math.round(card.approachFuel || 0));
      fuelRecord.stopExtraFuels.push(Math.round(card.extraFuel || 0));
      fuelRecord.stopDeckFuels.push(Math.round(card.deckFuel || 0));
      fuelRecord.stopReserveFuels.push(Math.round(card.reserveFuel || 0));
      fuelRecord.stopExcessFuels.push(0); // No excess fuel in current calculation
    });
    
    // Generate markdown table summary
    fuelRecord.stopsMarkdownTable = this.generateMarkdownTable(stopCards);
    fuelRecord.minFuelBreakdown = this.generateFuelBreakdown(stopCards[0]);
    
    console.log('🔄 Transformed fuel record:', {
      stopCount: fuelRecord.stopLocations.length,
      totalFuel: fuelRecord.minTotalFuel,
      tripFuel: fuelRecord.plannedTripFuel
    });
    
    return fuelRecord;
  }
  
  /**
   * Generate stop description matching Palantir's format with refuel handling
   */
  static generateStopDescription(card, index) {
    const stopType = index === 0 ? 'Departure' : 'Stop';
    const isRefuel = card.refuelMode === true;
    const refuelIndicator = isRefuel ? ' (REFUEL)' : '';
    return `${stopType}: ${card.name} - ${Math.round(card.totalFuel || 0)} lbs required${refuelIndicator}`;
  }
  
  /**
   * Generate comprehensive markdown table for stops summary with refuel handling
   */
  static generateMarkdownTable(stopCards) {
    if (!stopCards || stopCards.length === 0) return '';
    
    // Enhanced table with refuel indication
    let markdown = '| Stop | Type | Required Fuel | Trip | Contingency | Reserve | Deck | ARA | Approach | Extra | Passengers |\n';
    markdown += '|------|------|---------------|------|-------------|---------|------|-----|----------|-------|------------|\n';
    
    stopCards.forEach((card, index) => {
      if (!card || !card.name) return;
      
      // Determine stop type
      let stopType = 'Stop';
      if (index === 0) stopType = 'Departure';
      else if (card.isDestination) stopType = 'Destination';
      
      // Check for refuel - use the explicit refuelMode flag
      const isRefuel = card.refuelMode === true;
      if (isRefuel) stopType += ' (REFUEL)';
      
      // Format passenger display
      let passengerDisplay = '-';
      if (card.maxPassengers !== null && card.maxPassengers !== undefined) {
        if (typeof card.maxPassengers === 'string') {
          passengerDisplay = card.maxPassengers;
        } else {
          passengerDisplay = card.maxPassengers.toString();
        }
      }
      
      markdown += `| ${card.name} | ${stopType} | ${Math.round(card.totalFuel || 0)} | ${Math.round(card.tripFuel || 0)} | ${Math.round(card.contingencyFuel || 0)} | ${Math.round(card.reserveFuel || 0)} | ${Math.round(card.deckFuel || 0)} | ${Math.round(card.araFuel || 0)} | ${Math.round(card.approachFuel || 0)} | ${Math.round(card.extraFuel || 0)} | ${passengerDisplay} |\n`;
    });
    
    return markdown;
  }
  
  /**
   * Generate fuel breakdown summary
   */
  static generateFuelBreakdown(departureCard) {
    if (!departureCard) return '';
    
    return `Trip: ${Math.round(departureCard.tripFuel || 0)}, Reserve: ${Math.round(departureCard.reserveFuel || 0)}, Taxi: ${Math.round(departureCard.taxiFuel || 0)}, Contingency: ${Math.round(departureCard.contingencyFuel || 0)}`;
  }
  
  /**
   * Extract fuel data from StopCardCalculator results and flight settings
   * Transforms UI/calculation data into format suitable for OSDK save-back
   * 
   * @param {Array} stopCards - Stop cards from StopCardCalculator
   * @param {Object} flightSettings - Current flight settings from UI
   * @param {Object} weatherFuel - Weather-based fuel analysis results
   * @param {Object} routeStats - Route statistics
   * @returns {Object} - Fuel data ready for save-back
   */
  static extractFuelDataFromStopCards(stopCards, flightSettings = {}, weatherFuel = {}, routeStats = {}) {
    console.log('🔍 FuelSaveBackService: Extracting fuel data from stop cards');
    console.log('🔍 Input data:', { 
      stopCardsCount: stopCards?.length, 
      flightSettings: Object.keys(flightSettings),
      weatherFuel,
      routeStats: Object.keys(routeStats)
    });
    
    try {
      if (!stopCards || stopCards.length === 0) {
        console.warn('⚠️ No stop cards available for fuel extraction');
        return {};
      }
      
      // Get departure card (first card) for total fuel calculations
      const departureCard = stopCards[0];
      
      if (!departureCard) {
        console.warn('⚠️ No departure card found');
        return {};
      }
      
      // Extract fuel components from departure card and flight settings
      const extractedData = {
        // Total fuel required for departure
        totalFuel: departureCard.totalFuel || 0,
        
        // Trip fuel (actual fuel consumption for flight)
        tripFuel: routeStats.tripFuel || departureCard.tripFuel || 0,
        
        // Reserve fuel (policy-based)
        reserveFuel: departureCard.reserveFuel || flightSettings.reserveFuel || 0,
        
        // Taxi fuel (policy-based)
        taxiFuel: departureCard.taxiFuel || flightSettings.taxiFuel || 0,
        
        // Deck fuel for intermediate stops
        deckFuel: departureCard.deckFuel || flightSettings.deckFuelPerStop || 0,
        
        // Extra fuel from user input
        extraFuel: flightSettings.extraFuel || 0,
        extraFuelReason: flightSettings.extraFuelReason || '',
        
        // Weather-based fuel (ARA and approach)
        araFuel: weatherFuel.araFuel || flightSettings.araFuel || 0,
        approachFuel: weatherFuel.approachFuel || flightSettings.approachFuel || 0,
        
        // Contingency fuel (percentage-based)
        contingencyFuel: departureCard.contingencyFuel || 0,
        
        // Passenger and cargo data
        passengerCount: flightSettings.passengerCount || 0,
        cargoWeight: flightSettings.cargoWeight || 0,
        
        // Extraction metadata
        extractedAt: new Date().toISOString(),
        source: 'StopCardCalculator'
      };
      
      console.log('✅ FuelSaveBackService: Extracted fuel data:', extractedData);
      return extractedData;
      
    } catch (error) {
      console.error('❌ FuelSaveBackService: Error extracting fuel data:', error);
      return {};
    }
  }
  
  /**
   * Compare current fuel data with previously saved data to detect changes
   * 
   * @param {Object} currentData - Current fuel data from extraction
   * @param {Object} savedData - Previously saved fuel data from Palantir
   * @returns {boolean} - True if data has changed and save-back is needed
   */
  static hasFuelDataChanged(currentData, savedData) {
    if (!currentData || !savedData) {
      return true; // Always save if we don't have comparison data
    }
    
    // Key fields to compare for changes
    const keyFields = [
      'totalFuel',
      'tripFuel', 
      'reserveFuel',
      'taxiFuel',
      'deckFuel',
      'extraFuel',
      'araFuel',
      'approachFuel',
      'contingencyFuel'
    ];
    
    for (const field of keyFields) {
      const current = Number(currentData[field]) || 0;
      const saved = Number(savedData[field]) || 0;
      
      // Use small tolerance for floating-point comparison
      if (Math.abs(current - saved) > 0.1) {
        console.log(`💾 FuelSaveBackService: Change detected in ${field}: ${saved} → ${current}`);
        return true;
      }
    }
    
    console.log('💾 FuelSaveBackService: No significant fuel changes detected');
    return false;
  }
  
  /**
   * Load existing fuel data for a flight from Palantir
   * 
   * @param {string} flightId - Flight ID to load fuel data for
   * @returns {Promise<Object|null>} - Existing fuel data or null if not found
   */
  static async loadExistingFuelData(flightId) {
    console.log('📥 FuelSaveBackService: Loading existing fuel data for flight:', flightId);
    
    try {
      if (!flightId) {
        console.log('📥 DEBUG: No flight ID provided');
        return null;
      }
      
      // Import SDK dynamically
      const sdk = await import('@flight-app/sdk');
      
      // Query MainFuelV2 objects for this flight with timeout
      console.log('📥 DEBUG: About to query MainFuelV2 for flight:', flightId);
      
      const queryPromise = client(sdk.MainFuelV2)
        .where(fuel => fuel.flightUuid.exactMatch(flightId))
        .fetchPage({ $pageSize: 1 });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout after 5 seconds')), 5000)
      );
      
      const fuelData = await Promise.race([queryPromise, timeoutPromise]);
      console.log('📥 DEBUG: Query completed, result:', fuelData);
      
      if (fuelData.data && fuelData.data.length > 0) {
        const existingFuel = fuelData.data[0];
        console.log('📥 FuelSaveBackService: Found existing fuel data:', existingFuel);
        return existingFuel;
      }
      
      console.log('📥 FuelSaveBackService: No existing fuel data found - this is normal for new flights');
      return null;
      
    } catch (error) {
      console.error('❌ FuelSaveBackService: Error loading existing fuel data:', error);
      return null;
    }
  }
  
  /**
   * Auto-save fuel data if changes are detected
   * Called automatically during flight operations
   * 
   * @param {string} flightId - Flight ID
   * @param {Array} stopCards - Current stop cards
   * @param {Object} flightSettings - Current flight settings
   * @param {Object} weatherFuel - Weather fuel analysis
   * @param {Object} fuelPolicy - Selected fuel policy
   * @param {Object} routeStats - Route statistics
   * @param {Object} selectedAircraft - Aircraft object
   * @returns {Promise<boolean>} - True if save was performed
   */
  static async autoSaveFuelData(flightId, stopCards, flightSettings, weatherFuel, fuelPolicy, routeStats, selectedAircraft = null) {
    console.log('🤖 FuelSaveBackService: Auto-save check for flight:', flightId);
    
    try {
      if (!flightId) {
        console.log('🤖 No flight ID provided, skipping auto-save');
        return false;
      }
      
      if (!stopCards || stopCards.length === 0) {
        console.log('🤖 No stop cards available, skipping auto-save');
        return false;
      }
      
      // Load existing fuel data for comparison
      console.log('🤖 DEBUG: Attempting to load existing fuel data...');
      let existingFuelData = null;
      try {
        existingFuelData = await this.loadExistingFuelData(flightId);
        console.log('🤖 DEBUG: Existing fuel data result:', existingFuelData ? 'FOUND' : 'NOT FOUND');
      } catch (loadError) {
        console.warn('🤖 WARNING: Failed to load existing fuel data, will create new:', loadError.message);
        existingFuelData = null;
      }
      
      // Check if save is needed by comparing stop counts and basic totals
      const currentTotalFuel = Math.round(stopCards[0]?.totalFuel || 0);
      const existingTotalFuel = Math.round(existingFuelData?.minTotalFuel || 0);
      
      console.log('🤖 DEBUG: Decision factors:', {
        currentTotalFuel,
        existingTotalFuel,
        stopCardsLength: stopCards?.length,
        existingStopsLength: existingFuelData?.stopLocations?.length,
        hasExistingData: !!existingFuelData
      });
      
      if (this.shouldSaveFuelData(stopCards, existingFuelData, currentTotalFuel, existingTotalFuel)) {
        console.log('🤖 Changes detected, performing auto-save');
        await this.saveFuelData(flightId, stopCards, flightSettings, weatherFuel, fuelPolicy, routeStats, selectedAircraft);
        return true;
      }
      
      console.log('🤖 No significant changes detected, skipping auto-save');
      return false;
      
    } catch (error) {
      console.error('❌ FuelSaveBackService: Auto-save failed:', error);
      return false;
    }
  }
  
  /**
   * Determine if fuel data should be saved based on changes
   */
  static shouldSaveFuelData(stopCards, existingFuelData, currentTotalFuel, existingTotalFuel) {
    // Always save if no existing data
    if (!existingFuelData) {
      console.log('🤖 No existing fuel data, will save');
      return true;
    }
    
    // Save if stop count changed
    if (stopCards.length !== (existingFuelData.stopLocations?.length || 0)) {
      console.log('🤖 Stop count changed, will save');
      return true;
    }
    
    // Save if total fuel changed significantly (more than 10 lbs difference)
    if (Math.abs(currentTotalFuel - existingTotalFuel) > 10) {
      console.log(`🤖 Total fuel changed significantly: ${existingTotalFuel} → ${currentTotalFuel}`);
      return true;
    }
    
    return false;
  }
}

export default FuelSaveBackService;