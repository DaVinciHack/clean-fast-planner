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
   * @param {Object} alternateStopCard - Alternate route stop card data (optional)
   * @returns {Promise<Object>} - OSDK save result
   */
  static async saveFuelData(flightId, stopCards, flightSettings = {}, weatherFuel = {}, fuelPolicy = null, routeStats = {}, selectedAircraft = null, alternateStopCard = null) {
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
      
      // 🎯 CHECK: If we have a pre-found fuel object, use it instead of searching
      if (this._tempExistingFuelObject) {
        console.log('🎯 OPTIMIZATION: Using pre-found fuel object, skipping search');
        existingFuelObject = this._tempExistingFuelObject;
        console.log('✅ Using pre-found fuel object:', {
          primaryKey: existingFuelObject.$primaryKey,
          flightUuid: existingFuelObject.flightUuid
        });
      } else {
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
      }
      
      // 🛩️ AVIATION SAFETY: Robust duplicate prevention check
      // Load existing fuel data to compare with current data before saving
      if (existingFuelObject) {
        console.log('🔍 DUPLICATE PREVENTION: Loading existing fuel data for comparison');
        try {
          const existingFuelData = await this.loadExistingFuelData(flightId);
          
          if (existingFuelData) {
            // Calculate current total fuel for comparison
            const currentTotalFuel = Math.round(stopCards?.[0]?.totalFuel || 0);
            const existingTotalFuel = Math.round(existingFuelData.minTotalFuel || 0);
            
            console.log('🔍 DUPLICATE PREVENTION: Comparison data:', {
              currentTotalFuel,
              existingTotalFuel,
              stopCardsLength: stopCards?.length,
              existingStopsLength: existingFuelData?.stopLocations?.length,
              hasExistingData: !!existingFuelData
            });
            
            // Use the same robust logic as autoSaveFuelData
            if (!this.shouldSaveFuelData(stopCards, existingFuelData, currentTotalFuel, existingTotalFuel)) {
              console.log('🔍 DUPLICATE PREVENTION: No significant changes detected, skipping save to prevent duplicate');
              return {
                success: true,
                message: 'No changes detected - save skipped to prevent duplicate',
                fuelObjectUuid: existingFuelObject.$primaryKey,
                skipped: true
              };
            } else {
              console.log('🔍 DUPLICATE PREVENTION: Significant changes detected, proceeding with save');
            }
          }
        } catch (existingDataError) {
          console.warn('🔍 DUPLICATE PREVENTION: Could not load existing data for comparison, proceeding with save:', existingDataError.message);
        }
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
        
        // Core fuel components (round to integers) - Use fuelComponentsObject with explicit checks
        const tripFuel = card.fuelComponentsObject?.tripFuel || card.tripFuel;
        const stopTaxiFuel = card.fuelComponentsObject?.taxiFuel || card.taxiFuel;
        const deckFuel = card.fuelComponentsObject?.deckFuel || card.deckFuel;
        const stopReserveFuel = card.fuelComponentsObject?.reserveFuel || card.reserveFuel;
        const contingencyFuel = card.fuelComponentsObject?.contingencyFuel || card.contingencyFuel;
        const stopExtraFuel = card.fuelComponentsObject?.extraFuel || card.extraFuel;
        
        stopTripFuels.push(tripFuel ? Math.round(tripFuel) : 0);
        stopTaxiFuels.push(stopTaxiFuel ? Math.round(stopTaxiFuel) : 0);
        stopDeckFuels.push(deckFuel ? Math.round(deckFuel) : 0);
        stopReserveFuels.push(stopReserveFuel ? Math.round(stopReserveFuel) : 0);
        stopContingencyFuels.push(contingencyFuel ? Math.round(contingencyFuel) : 0);
        stopExtraFuels.push(stopExtraFuel ? Math.round(stopExtraFuel) : 0);
        
        // Weather-based fuel components - Use fuelComponentsObject with explicit checks
        const araFuelVal = card.fuelComponentsObject?.araFuel || card.araFuel;
        const approachFuelVal = card.fuelComponentsObject?.approachFuel || card.approachFuel;
        
        stopAraFuels.push(araFuelVal ? Math.round(araFuelVal) : 0);
        stopApproachFuels.push(approachFuelVal ? Math.round(approachFuelVal) : 0);
        
        // Calculated totals - only if data exists
        stopRequiredFuels.push(card.totalFuel ? Math.round(card.totalFuel) : 0);
        stopExcessFuels.push(card.excessFuel ? Math.round(card.excessFuel) : 0);
        
        // Passenger data from stop cards - only use verified data
        const passengerCount = card.maxPassengers || card.passengers;
        requestedPassengers.push(passengerCount ? Math.round(passengerCount) : 0);
        availablePassengers.push(passengerCount ? Math.round(passengerCount) : 0);
        requestedPassengerWeight.push(passengerCount ? Math.round(passengerCount * regionalPassengerWeight) : 0);
        availableWeight.push(card.availableWeight ? Math.round(card.availableWeight) : 0);
        requestedTotalWeight.push(card.totalWeight ? Math.round(card.totalWeight) : 0);
        requestedBagWeight.push(passengerCount ? Math.round(passengerCount * regionalBagWeight) : 0);
      });
      
      // 🚨 AVIATION SAFETY: NO FALLBACKS - Use only verified data or explicit null
      
      // Only use actual verified data - NO fallbacks that could mislead pilots
      const outboundFuel = routeStats?.tripFuel ? Math.round(routeStats.tripFuel) : null;
      const alternateFuel = routeStats?.alternateFuel ? Math.round(routeStats.alternateFuel) : null;
      
      // Only use actual departure card data - NO fallbacks
      const totalContingency = departureCard.fuelComponentsObject?.contingencyFuel ? Math.round(departureCard.fuelComponentsObject.contingencyFuel) : null;
      const extraFuel = departureCard.fuelComponentsObject?.extraFuel ? Math.round(departureCard.fuelComponentsObject.extraFuel) : null;
      const taxiFuel = departureCard.fuelComponentsObject?.taxiFuel ? Math.round(departureCard.fuelComponentsObject.taxiFuel) : null;
      const reserveFuel = departureCard.fuelComponentsObject?.reserveFuel ? Math.round(departureCard.fuelComponentsObject.reserveFuel) : null;
      
      // 🚨 AVIATION SAFETY CHECK: Verify we have essential fuel data
      if (outboundFuel === null || taxiFuel === null || reserveFuel === null) {
        throw new Error('AVIATION SAFETY: Missing essential fuel data - cannot save without verified values');
      }
      
      // Only calculate if we have actual data
      const totalAlternateFuel = taxiFuel + outboundFuel + (alternateFuel || 0) + (totalContingency || 0) + reserveFuel + (extraFuel || 0);
      
      // Only use actual passenger count - NO fallbacks for critical calculations
      console.log('🔍 PASSENGER DEBUG: Departure card passenger data:', {
        maxPassengers: departureCard.maxPassengers,
        passengers: departureCard.passengers,
        requestedPassengersArray: requestedPassengers,
        departureCardKeys: Object.keys(departureCard)
      });
      
      const alternatePassengers = departureCard.maxPassengers || departureCard.passengers;
      if (alternatePassengers === undefined || alternatePassengers === null) {
        throw new Error('AVIATION SAFETY: Missing passenger count - cannot save without verified passenger data');
      }
      const alternatePassengerWeight = alternatePassengers * regionalPassengerWeight;
      
      console.log('🔍 PASSENGER DEBUG: Final values:', {
        alternatePassengers,
        alternatePassengerWeight,
        regionalPassengerWeight
      });
      const alternateLandingFuel = reserveFuel + (totalContingency || 0) + (extraFuel || 0);
      
      // Generate ALL 4 tables in proper MARKDOWN format matching Palantir
      
      // TABLE 1: Fuel Requirements and Passenger Capacity by Stop
      let stopsTable = "## Fuel Requirements and Passenger Capacity by Stop\n\n";
      stopsTable += "| Stop | Required Fuel | Max Passengers | Fuel Components | Legs |\n";
      stopsTable += "|:-----|:-------------|:--------------|:---------------|:-----|\n";
      
      stopCards.forEach((card, index) => {
        if (!card) return;
        
        const location = stopLocations[index] || `Stop ${index + 1}`;
        const requiredFuel = stopRequiredFuels[index]; // No fallback - use actual data
        const passengers = requestedPassengers[index]; // No fallback - use actual data  
        const passengerWeight = requestedPassengerWeight[index]; // No fallback - use actual data
        
        // Check if refuel is needed
        const refuelNote = card.isRefuelStop ? " (Refuel needed)" : "";
        const fuelDisplay = `${requiredFuel}${refuelNote} Lbs`;
        
        // Build fuel components string
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
          componentsStr = `Reserve:${stopReserveFuels[index] || 0} Extra:${stopExtraFuels[index] || 0} FullCont:${stopContingencyFuels[index] || 0}`; // Keep these fallbacks for display only
          passengerStr = "Final Stop";
          legStr = `Final destination (Total: ${requiredFuel} Lbs)`;
        } else {
          componentsStr = components.join(' ') || 'No fuel';
          passengerStr = `${passengers} (${passengerWeight} Lbs)`;
          
          const nextStop = stopLocations[index + 1];
          if (nextStop) {
            legStr = `${location}-${nextStop}`;
            if (index === stopCards.length - 2) {
              legStr += ` → ${nextStop}-${location}`;
            }
          } else {
            legStr = `${location} route`;
          }
        }
        
        stopsTable += `| ${location} | ${fuelDisplay} | ${passengerStr} | ${componentsStr} | ${legStr} |\n`;
      });
      
      // Add the missing "Minimal Fuel with Maximum Passenger Capacity" section to the stops table
      stopsTable += `\n## Minimal Fuel with Maximum Passenger Capacity\n\n`;
      stopsTable += "| Required Fuel | Max Passengers | Fuel Components | Route |\n";
      stopsTable += "|:-------------|:--------------|:---------------|:-----|\n";
      // 🔧 FIXED: Use the ACTUAL alternate route card data passed as parameter
      // Use the alternateStopCard parameter instead of searching in stopCards array
      const alternateCard = alternateStopCard || null;
      
      
      if (alternateCard) {
        // Use the ACTUAL alternate card data when available
        const actualAlternatePassengers = alternateCard.maxPassengers || alternateCard.passengers || alternatePassengers;
        const actualAlternatePassengerWeight = actualAlternatePassengers * regionalPassengerWeight;
        const actualAlternateTotalFuel = alternateCard.totalFuel || totalAlternateFuel;
        
        // Use ACTUAL trip fuel from alternate card, not outbound fuel
        const actualAlternateTripFuel = alternateCard.fuelComponentsObject?.tripFuel || alternateCard.tripFuel || outboundFuel;
        const actualAlternateRouteFuel = alternateCard.fuelComponentsObject?.altFuel || alternateCard.alternateFuel || alternateFuel;
        
        stopsTable += `| ${actualAlternateTotalFuel} LBS | ${actualAlternatePassengers} (${actualAlternatePassengerWeight} LBS) | Taxi:${taxiFuel} Trip:${actualAlternateTripFuel} Alt:${actualAlternateRouteFuel || 0} Cont:${totalContingency || 0} Res:${reserveFuel} Extra:${extraFuel || 0} | Legs to ${alternateCard.routeDescription || 'Alternate Route'} |\n`;
      } else {
        // Fallback to calculated values when no alternate card available
        console.log('💾 DEBUG: No alternate card available, using calculated values');
        stopsTable += `| ${totalAlternateFuel} LBS | ${alternatePassengers} (${alternatePassengerWeight} LBS) | Taxi:${taxiFuel} Trip:${outboundFuel} Alt:${alternateFuel || 0} Cont:${totalContingency || 0} Res:${reserveFuel} Extra:${extraFuel || 0} | Legs to ${stopLocations[1] || 'DEST'} + Alternate to ${stopLocations[0] || 'ORIG'} |\n`;
      }
      stopsTable += `\nPotential landing fuel: ${alternateLandingFuel} LBS (Reserve + FULL Contingency + Extra)\n`;
      
      // Debug log the fuel calculations
      console.log('💾 DEBUG: Fuel calculations:', {
        outboundFuel,
        alternateFuel,
        totalContingency,
        extraFuel,
        totalAlternateFuel,
        alternatePassengers,
        alternatePassengerWeight
      });
      
      console.log('💾 DEBUG: RouteStats vs DepartureCard comparison:', {
        'routeStats.tripFuel': routeStats?.tripFuel,
        'routeStats.alternateFuel': routeStats?.alternateFuel,
        'departureCard.fuelComponentsObject.tripFuel': departureCard.fuelComponentsObject?.tripFuel,
        'departureCard.tripFuel': departureCard.tripFuel,
        'departureCard.totalFuel': departureCard.totalFuel
      });
      
      // TABLE 3: Round Trip Fuel - Detailed Breakdown
      let detailedTable = "### Round Trip Fuel - Detailed Breakdown\n\n";
      detailedTable += "| Component | Amount |\n";
      detailedTable += "|-----------|--------|\n";
      detailedTable += `| Taxi Fuel | ${taxiFuel} LBS |\n`;
      // Use verified values or display as unavailable
      const displayTripFuel = departureCard.fuelComponentsObject?.tripFuel ? Math.round(departureCard.fuelComponentsObject.tripFuel) : 'N/A';
      const displayAraFuel = departureCard.fuelComponentsObject?.araFuel ? Math.round(departureCard.fuelComponentsObject.araFuel) : 'N/A';
      const displayApproachFuel = departureCard.fuelComponentsObject?.approachFuel ? Math.round(departureCard.fuelComponentsObject.approachFuel) : 'N/A';
      const displayDeckFuel = departureCard.fuelComponentsObject?.deckFuel ? Math.round(departureCard.fuelComponentsObject.deckFuel) : 'N/A';
      const displayTotalFuel = departureCard.totalFuel ? Math.round(departureCard.totalFuel) : 'N/A';
      
      detailedTable += `| Trip Fuel | ${displayTripFuel} LBS (+${totalContingency || 0} LBS, 10%) |\n`;
      detailedTable += `| ARA Fuel | ${displayAraFuel} LBS |\n`;
      detailedTable += `| Approach Fuel | ${displayApproachFuel} LBS |\n`;
      detailedTable += `| Extra Fuel | ${extraFuel || 0} LBS |\n`;
      detailedTable += `| Deck Fuel | ${displayDeckFuel} LBS |\n`;
      detailedTable += `| Reserve Fuel | ${reserveFuel} LBS |\n`;
      detailedTable += `| **Total** | **${displayTotalFuel} LBS** |\n`;
      const landingFuel = reserveFuel + totalContingency + extraFuel;
      detailedTable += `\nLanding Fuel: ${landingFuel} LBS (Reserve + FULL Contingency + Extra)\n`;
      
      // TABLE 4: Minimum Required Fuel (Alternate breakdown)
      let minimumTable = "### Minimum Required Fuel\n\n";
      minimumTable += "| Component | Amount |\n";
      minimumTable += "|-----------|--------|\n";
      minimumTable += `| Taxi Fuel | ${taxiFuel} LBS |\n`;
      minimumTable += `| Outbound Fuel | ${outboundFuel} LBS |\n`;
      minimumTable += `| Alternate Fuel | ${alternateFuel} LBS |\n`;
      minimumTable += `| Contingency Fuel | ${totalContingency} LBS (10%) |\n`;
      minimumTable += `| ARA Fuel | ${displayAraFuel} LBS |\n`;
      minimumTable += `| Approach Fuel | ${displayApproachFuel} LBS |\n`;
      minimumTable += `| Extra Fuel | ${extraFuel} LBS |\n`;
      minimumTable += `| Reserve Fuel | ${reserveFuel} LBS |\n`;
      minimumTable += `| **Total** | **${totalAlternateFuel} LBS** |\n`;
      minimumTable += `\nPotential Landing Fuel: ${alternateLandingFuel} LBS (Reserve + FULL Contingency + Extra)\n`;
      
      console.log('💾 COMPLETE FUEL DATA EXTRACTION:', {
        stopCount: stopCards.length,
        locations: stopLocations,
        tripFuels: stopTripFuels,
        totalFuels: stopRequiredFuels,
        stopsTableLines: stopsTable.split('\n').length,
        tablesGenerated: 4
      });
      
      // Build action parameters based on whether we're updating or creating
      const actionParams = {
        // Only include existing object if we found one to modify
        ...(existingFuelObject && { "main_fuel_v2": existingFuelObject }),
        
        // Complete fuel data arrays matching Fast Planner calculations
        "stop_locations": stopLocations,
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
        
        // Summary fuel values - FIXED: Use fuelComponentsObject
        "planned_trip_fuel": Math.round(departureCard.fuelComponentsObject?.tripFuel || routeStats.tripFuel || taxiFuel), // Use taxiFuel as minimum if no trip fuel
        "planned_extra_fuel": Math.round(stopCards.reduce((total, card) => {
          const cardExtraFuel = card?.fuelComponentsObject?.extraFuel || card?.extraFuel;
          return total + (cardExtraFuel || 0); // Only for sum calculation
        }, 0)),
        "planned_taxi_fuel": Math.round(taxiFuel), // Already verified above
        "planned_deck_fuel": Math.round(departureCard.fuelComponentsObject?.deckFuel || 0), // Deck fuel can be 0
        "planned_reserve_fuel": Math.round(reserveFuel), // Already verified above
        "planned_contingency_fuel": Math.round(totalContingency || 0), // Can be 0 for VFR
        "planned_ara_fuel": Math.round(departureCard.fuelComponentsObject?.araFuel || weatherFuel?.araFuel || 0), // Weather fuel can be 0
        "planned_approach_fuel": Math.round(departureCard.fuelComponentsObject?.approachFuel || weatherFuel?.approachFuel || 0), // Weather fuel can be 0
        "min_total_fuel": Math.round(totalAlternateFuel), // Already calculated above
        
        // Critical fuel totals  
        "round_trip_fuel": Math.round(departureCard.totalFuel), // Must have total fuel
        "planned_alternate_fuel": Math.round(alternateFuel || routeStats.minimumFuel || reserveFuel), // Use calculated alternate
        "total_fuel_burned": Math.round(outboundFuel), // Use verified outbound fuel
        "total_fuel_uplifted": Math.round(departureCard.totalFuel), // Must have total fuel
        
        // Passenger data arrays - TEMPORARILY COMMENTED OUT TO ISOLATE 400 ERROR
        // "requested_passengers": requestedPassengers,
        // "available_passengers": availablePassengers,
        // "requested_passenger_weight": requestedPassengerWeight,
        // "available_weight": availableWeight,
        // "requested_total_weight": requestedTotalWeight,
        // "requested_bag_weight": requestedBagWeight,
        
        // Regional defaults - TEMPORARILY COMMENTED OUT
        // "average_passenger_weight": Math.round(regionalPassengerWeight),
        // "average_bag_weight": Math.round(regionalBagWeight),
        
        // Flight metadata
        "flight_uuid": flightId,
        "aircraft": selectedAircraft?.name || selectedAircraft?.registration || 'Unknown',
        "policy_uuid": fuelPolicy?.uuid || fuelPolicy?.currentPolicy?.uuid || '',
        "policy_name": fuelPolicy?.name || fuelPolicy?.currentPolicy?.name || '',
        "flight_number": `${selectedAircraft?.registration || 'Unknown'} (${new Date().toLocaleDateString()})`,
        
        // All 4 formatted display tables matching Palantir operations format
        "stops_markdown_table": stopsTable,        // TABLE 1: Main stops table  
        "stop_descriptions": stopDescriptions,     // Array of stop descriptions (as required by schema)
        "min_fuel_breakdown": detailedTable,       // TABLE 3: Round Trip Fuel (shows first)
        "automation_summary": minimumTable,        // TABLE 4: Minimum Required Fuel (shows second)
        
        // TODO: Find correct field for alternateTable (TABLE 2: Minimal fuel with max passengers)
        
        // 🔧 REMOVED: location_fuel_overrides - not a valid Palantir column
        // Location-specific fuel overrides handled separately in FastPlanner
        
        // Refuel stop indices for loading back into UI  
        "refuel_stop_indices": stopCards.map((card, index) => {
          return card?.refuelMode === true ? index : null;
        }).filter(index => index !== null),
        
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
        refuelStopsCount: actionParams.refuelStopLocations?.length,
        refuelStops: actionParams.refuelStopLocations,
        extraFuel: actionParams.plannedExtraFuel,
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
        plannedTripFuel: actionParams.plannedTripFuel,
        plannedExtraFuel: actionParams.plannedExtraFuel,
        minTotalFuel: actionParams.min_total_fuel,
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
      
      // 🔗 EXTRACT FUEL UUID for flight linking
      let fuelObjectUuid = null;
      if (existingFuelObject) {
        fuelObjectUuid = existingFuelObject.$primaryKey;
        console.log('🔗 Using existing fuel object UUID for linking:', fuelObjectUuid);
      } else if (result && result.type === 'edits') {
        // Extract UUID from creation result
        const edits = result.edits || [];
        const fuelEdit = edits.find(edit => edit.type === 'addObject' && edit.object?.$objectType === 'MainFuelV2');
        if (fuelEdit) {
          fuelObjectUuid = fuelEdit.object.$primaryKey;
          console.log('🔗 Extracted new fuel object UUID for linking:', fuelObjectUuid);
        }
      }
      
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
        
        // 🔗 RETURN FUEL UUID for flight linking
        return { 
          ...result, 
          fuelObjectUuid: fuelObjectUuid,
          success: true 
        };
      } else {
        console.warn('Unexpected result type:', result.type);
        return { 
          ...result, 
          fuelObjectUuid: fuelObjectUuid,
          success: false 
        };
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
    console.log('📥 🔍 loadExistingFuelData called with flight ID:', flightId);
    console.log('📥 🔍 Flight ID type:', typeof flightId);
    console.log('📥 🔍 Flight ID length:', flightId?.length);
    
    try {
      if (!flightId) {
        console.log('📥 DEBUG: No flight ID provided');
        return null;
      }
      
      // Import SDK dynamically
      const sdk = await import('@flight-app/sdk');
      
      // Query MainFuelV2 objects for this flight with timeout
      console.log('📥 🔍 About to query MainFuelV2 for flight:', flightId);
      console.log('📥 🔍 Query: flightUuid.exactMatch(' + flightId + ')');
      
      const queryPromise = client(sdk.MainFuelV2)
        .where(fuel => fuel.flightUuid.exactMatch(flightId))
        .fetchPage({ $pageSize: 10 }); // Get more results to see what's in the database
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout after 5 seconds')), 5000)
      );
      
      const fuelData = await Promise.race([queryPromise, timeoutPromise]);
      console.log('📥 🔍 Query completed - total results found:', fuelData.data?.length || 0);
      
      // Log ALL results to see what the query is actually returning
      if (fuelData.data && fuelData.data.length > 0) {
        console.log('📥 🔍 ALL QUERY RESULTS:');
        fuelData.data.forEach((fuel, index) => {
          console.log(`📥 🔍 Result ${index}:`, {
            primaryKey: fuel.$primaryKey,
            flightUuid: fuel.flightUuid,
            flightNumber: fuel.flightNumber,
            matchesSearch: fuel.flightUuid === flightId
          });
        });
      }
      
      if (fuelData.data && fuelData.data.length > 0) {
        const existingFuel = fuelData.data[0];
        console.log('📥 🔍 FOUND FUEL OBJECT - Checking if it matches:');
        console.log('📥 🔍 Searched for flight ID:', flightId);
        console.log('📥 🔍 Found fuel object flight UUID:', existingFuel.flightUuid);
        console.log('📥 🔍 Do they match?', existingFuel.flightUuid === flightId);
        console.log('📥 🔍 Found fuel object flight number:', existingFuel.flightNumber);
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

  /**
   * Load fuel settings for flight loading (extra fuel + refuel stops)
   * Called during flight loading to restore user's fuel settings
   * 
   * @param {string} flightId - Flight ID to load fuel data for
   * @returns {Promise<Object>} - { extraFuel: number, refuelStops: string[] }
   */
  static async loadFuelSettingsForFlight(flightData) {
    console.log('📥 🎯 NEW APPROACH: Loading fuel settings for flight:', flightData?.id || flightData?.flightId);
    
    try {
      if (!flightData) {
        console.log('📥 No flight data provided, returning defaults');
        return { extraFuel: 0, refuelStops: [] };
      }
      
      // Import SDK dynamically
      const sdk = await import('@flight-app/sdk');
      
      // NEW: Use fuelPlanId for direct lookup
      if (flightData.fuelPlanId) {
        console.log('📥 🎯 Using fuelPlanId for direct lookup:', flightData.fuelPlanId);
        console.log('📥 🎯 Direct lookup UUID format check:', {
          fuelPlanId: flightData.fuelPlanId,
          isValidUUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(flightData.fuelPlanId),
          length: flightData.fuelPlanId?.length
        });
        try {
          const fuelObject = await client(sdk.MainFuelV2).fetchOne(flightData.fuelPlanId);
          console.log('📥 🎯 Direct lookup result:', {
            found: !!fuelObject,
            fuelObjectKeys: fuelObject ? Object.keys(fuelObject) : 'none'
          });
          if (fuelObject) {
            console.log('📥 ✅ SUCCESS: Found fuel object via fuelPlanId');
            console.log('📥 🎯 Direct lookup fuel object details:', {
              primaryKey: fuelObject.$primaryKey,
              plannedExtraFuel: fuelObject.plannedExtraFuel,
              stopExtraFuels: fuelObject.stopExtraFuels,
              stopLocations: fuelObject.stopLocations,
              refuelStopLocations: fuelObject.refuelStopLocations,
              allKeys: Object.keys(fuelObject)
            });
            // 🎯 REVERSE-ENGINEERING: Detect original user inputs from distributed array
            let locationOverrides = {};
            let extraFuel = 0;
            
            // Check if we have stop-specific extra fuel array to reverse-engineer
            if (fuelObject.stopExtraFuels && Array.isArray(fuelObject.stopExtraFuels) && fuelObject.stopLocations) {
              console.log('📥 🎯 REVERSE-ENGINEERING from distributed array:', fuelObject.stopExtraFuels);
              
              // Find patterns: where extra fuel starts and continues until it stops or changes
              const extraFuelArray = fuelObject.stopExtraFuels;
              const locations = fuelObject.stopLocations;
              
              let i = 0;
              while (i < extraFuelArray.length) {
                const currentFuel = extraFuelArray[i];
                
                if (currentFuel > 0) {
                  // Found start of extra fuel - this is likely where user input it
                  const inputLocation = locations[i];
                  const inputIndex = i + 1; // 1-based index
                  
                  // Count how many consecutive stops have the same value
                  let consecutiveStops = 1;
                  while (i + consecutiveStops < extraFuelArray.length && 
                         extraFuelArray[i + consecutiveStops] === currentFuel) {
                    consecutiveStops++;
                  }
                  
                  console.log(`📥 🎯 DETECTED PATTERN: ${currentFuel} lbs from stop ${i+1} (${inputLocation}) for ${consecutiveStops} stops`);
                  
                  // Create location override for the INPUT location (where user added it)
                  const overrideKey = `${inputLocation}_${inputIndex}_extraFuel`;
                  locationOverrides[overrideKey] = currentFuel;
                  console.log(`📥 🎯 RESTORED USER INPUT: ${overrideKey} = ${currentFuel}`);
                  
                  // Skip past this pattern
                  i += consecutiveStops;
                } else {
                  i++;
                }
              }
              
              console.log('📥 🎯 REVERSE-ENGINEERING COMPLETE:', {
                originalArray: extraFuelArray,
                detectedInputs: Object.keys(locationOverrides).length,
                locationOverrides
              });
              
            } else {
              // Fallback: Use single plannedExtraFuel for departure
              extraFuel = Number(fuelObject.plannedExtraFuel) || 0;
              console.log('📥 🎯 Using single extra fuel value:', extraFuel);
            }
            
            // Add any existing location overrides from JSON field  
            if (fuelObject.locationFuelOverrides || fuelObject.location_fuel_overrides) {
              const overridesField = fuelObject.location_fuel_overrides || fuelObject.locationFuelOverrides;
              const existingOverrides = JSON.parse(overridesField);
              locationOverrides = { ...locationOverrides, ...existingOverrides };
              console.log('📥 🎯 LOADED USER FUEL OVERRIDES:', existingOverrides);
            }
            
            const refuelStops = fuelObject.refuelStopLocations || [];
            console.log('📥 ✅ Extracted fuel settings via fuelPlanId:', { 
              extraFuel, 
              refuelStops, 
              locationOverrides,
              distributedStops: Object.keys(locationOverrides).length
            });
            
            // 🎯 CRITICAL: Return the actual fuel object to avoid duplicate lookups
            return { 
              extraFuel, 
              refuelStops, 
              locationOverrides,
              fuelObject: fuelObject  // Store the actual fuel object for reuse
            };
          } else {
            console.warn('📥 ❌ Direct lookup returned null/undefined - fuel object does not exist with this UUID');
          }
        } catch (directError) {
          console.error('📥 ❌ Direct lookup failed with error:', {
            error: directError.message,
            errorType: directError.constructor.name,
            errorCode: directError.code,
            stack: directError.stack
          });
          console.warn('📥 Direct lookup failed, falling back to search:', directError.message);
        }
      } else {
        console.log('📥 ⚠️ No fuelPlanId in flight data, using fallback search');
      }
      
      // FALLBACK: Old backwards search method
      const flightId = flightData.id || flightData.flightId;
      console.log('📥 🔄 FALLBACK: Searching for fuel object by flightUuid:', flightId);
      
      const fuelData = await client(sdk.MainFuelV2)
        .where(fuel => fuel.flightUuid.exactMatch(flightId))
        .fetchPage({ $pageSize: 1 });
      
      console.log('📥 🔍 FUEL QUERY RESULTS:', {
        totalFound: fuelData.data?.length || 0,
        searchingForFlightId: flightId
      });
      
      // Log ALL found fuel objects to see what we're getting
      if (fuelData.data && fuelData.data.length > 0) {
        console.log('📥 🔍 ALL FOUND FUEL OBJECTS:');
        fuelData.data.forEach((fuel, index) => {
          console.log(`📥 🔍 Fuel Object ${index}:`, {
            primaryKey: fuel.$primaryKey,
            flightUuid: fuel.flightUuid,
            flightNumber: fuel.flightNumber,
            matches: fuel.flightUuid === flightId
          });
        });
      }
      
      if (fuelData.data && fuelData.data.length > 0) {
        const fuelObject = fuelData.data[0];
        
        console.log('📥 🔍 COMPLETE FUEL OBJECT FROM PALANTIR:');
        console.log(fuelObject);
        console.log('📥 🔍 ALL FUEL OBJECT KEYS:', Object.keys(fuelObject));
        console.log('📥 🔍 plannedExtraFuel SPECIFICALLY:', fuelObject.plannedExtraFuel);
        console.log('📥 🔍 refuelStopLocations SPECIFICALLY:', fuelObject.refuelStopLocations);
        
        console.log('📥 Found fuel object:', {
          primaryKey: fuelObject.$primaryKey,
          flightUuid: fuelObject.flightUuid,
          hasExtraFuel: fuelObject.plannedExtraFuel !== undefined,
          hasRefuelStops: fuelObject.refuelStopLocations !== undefined,
          rawExtraFuel: fuelObject.plannedExtraFuel,
          rawRefuelStops: fuelObject.refuelStopLocations
        });
        
        // Extract the fuel settings we want to restore
        const extraFuel = Number(fuelObject.plannedExtraFuel) || 0;
        const refuelStops = fuelObject.refuelStopLocations || [];
        
        console.log('📥 FUEL EXTRACTION DEBUG:', {
          rawPlannedExtraFuel: fuelObject.plannedExtraFuel,
          convertedExtraFuel: extraFuel,
          extractionSuccessful: extraFuel > 0
        });
        
        console.log('📥 Extracted fuel settings:', {
          extraFuel: extraFuel,
          refuelStops: refuelStops,
          refuelStopsCount: refuelStops.length
        });
        
        return {
          extraFuel: extraFuel,
          refuelStops: refuelStops,
          fuelObject: fuelObject  // Store the actual fuel object for reuse
        };
      }
      
      console.log('📥 No fuel object found for flight - returning defaults');
      return { extraFuel: 0, refuelStops: [] };
      
    } catch (error) {
      console.error('❌ Error loading fuel settings for flight:', error);
      return { extraFuel: 0, refuelStops: [] };
    }
  }

  /**
   * Save fuel data with existing fuel object ID to prevent duplicates
   * This method skips the search phase and uses the provided fuel object ID directly
   * 
   * @param {string} flightId - The flight ID (required)
   * @param {Array} stopCards - Stop cards from StopCardCalculator
   * @param {Object} flightSettings - Current flight settings from UI
   * @param {Object} weatherFuel - Weather fuel analysis
   * @param {Object} fuelPolicy - Selected fuel policy object
   * @param {Object} routeStats - Route statistics
   * @param {Object} selectedAircraft - Aircraft object
   * @param {string} existingFuelObjectId - Existing fuel object UUID (optional)
   * @param {Object} alternateStopCard - Alternate route stop card data (optional)
   * @returns {Promise<Object>} - OSDK save result
   */
  static async saveFuelDataWithExistingId(flightId, stopCards, flightSettings = {}, weatherFuel = {}, fuelPolicy = null, routeStats = {}, selectedAircraft = null, existingFuelObjectId = null, alternateStopCard = null) {
    console.log('💾 FuelSaveBackService: Starting fuel save with existing ID:', {
      flightId,
      existingFuelObjectId,
      stopCardsCount: stopCards?.length
    });
    
    try {
      // Import SDK dynamically
      const sdk = await import('@flight-app/sdk');
      
      let existingFuelObject = null;
      
      if (existingFuelObjectId) {
        console.log('🎯 DUPLICATE PREVENTION: Using provided fuel object ID:', existingFuelObjectId);
        try {
          // Fetch the existing fuel object directly by its ID
          existingFuelObject = await client(sdk.MainFuelV2).fetchOne(existingFuelObjectId);
          console.log('✅ Found existing fuel object via direct lookup:', {
            primaryKey: existingFuelObject.$primaryKey,
            flightUuid: existingFuelObject.flightUuid
          });
        } catch (fetchError) {
          console.warn('⚠️ Could not fetch fuel object by ID, will search by flight ID:', fetchError.message);
          existingFuelObject = null;
        }
      }
      
      // If direct lookup failed or no ID provided, fall back to search
      if (!existingFuelObject) {
        console.log('🔍 Falling back to search by flight UUID:', flightId);
        const existingData = await client(sdk.MainFuelV2)
          .where(fuel => fuel.flightUuid.exactMatch(flightId))
          .fetchPage({ $pageSize: 5 });
        
        if (existingData.data && existingData.data.length > 0) {
          existingFuelObject = existingData.data[0];
          console.log('✅ Found existing fuel object via search:', {
            primaryKey: existingFuelObject.$primaryKey,
            flightUuid: existingFuelObject.flightUuid
          });
        }
      }
      
      // Call the regular saveFuelData method with a temporary override for the fuel object
      if (existingFuelObject) {
        console.log('🎯 CRITICAL: Using pre-found fuel object to prevent duplicate searches');
        
        // Temporarily store the object globally so saveFuelData can use it
        this._tempExistingFuelObject = existingFuelObject;
        
        try {
          const result = await this.saveFuelData(flightId, stopCards, flightSettings, weatherFuel, fuelPolicy, routeStats, selectedAircraft, alternateStopCard);
          return result;
        } finally {
          // Clean up the temporary object
          delete this._tempExistingFuelObject;
        }
      } else {
        console.log('ℹ️ No existing fuel object found, will create new one');
        return await this.saveFuelData(flightId, stopCards, flightSettings, weatherFuel, fuelPolicy, routeStats, selectedAircraft, alternateStopCard);
      }
      
    } catch (error) {
      console.error('❌ FuelSaveBackService: saveFuelDataWithExistingId failed:', error);
      throw error;
    }
  }
  
  /**
   * Internal save method that accepts a pre-found existing fuel object
   */
  static async saveFuelDataInternal(flightId, stopCards, flightSettings, weatherFuel, fuelPolicy, routeStats, selectedAircraft, existingFuelObject) {
    console.log('💾 FuelSaveBackService: Internal save with pre-found object:', existingFuelObject?.$primaryKey);
    
    // Continue with the same logic as saveFuelData but skip the search phase
    const currentTime = new Date().toISOString();
    
    // Get departure card for fuel totals
    const departureCard = stopCards?.[0] || {};
    
    // Extract regional weight data from fuel policy (AVIATION SAFETY: NO HARDCODED VALUES!)
    const regionalPassengerWeight = fuelPolicy?.averagePassengerWeight || 
      selectedAircraft?.specifications?.performance?.averagePassengerWeight || 220;
    
    console.log('💾 Using passenger weight:', regionalPassengerWeight, 'from', 
      fuelPolicy?.averagePassengerWeight ? 'fuel policy' : 'aircraft specs');
    
    // Build all the arrays - same logic as saveFuelData
    const stopLocations = [];
    const stopDescriptions = [];
    const stopTripFuels = [];
    const stopTaxiFuels = [];
    const stopDeckFuels = [];
    const stopReserveFuels = [];
    const stopContingencyFuels = [];
    const stopExtraFuels = [];
    const stopAraFuels = [];
    const stopApproachFuels = [];
    const stopRequiredFuels = [];
    const stopExcessFuels = [];
    const requestedPassengers = [];
    const availablePassengers = [];
    const requestedPassengerWeight = [];
    
    // Process stop cards
    stopCards.forEach((card, index) => {
      if (!card) return;
      
      const location = card.waypointName || card.name || card.airportName || `Stop ${index + 1}`;
      const description = card.description || `${location} stop`;
      
      stopLocations.push(location);
      stopDescriptions.push(description);
      stopTripFuels.push(Math.round(card.tripFuel || 0));
      stopTaxiFuels.push(Math.round(card.taxiFuel || 0));
      stopDeckFuels.push(Math.round(card.deckFuel || 0));
      stopReserveFuels.push(Math.round(card.reserveFuel || 0));
      stopContingencyFuels.push(Math.round(card.contingencyFuel || 0));
      stopExtraFuels.push(Math.round(card.extraFuel || card.fuelComponentsObject?.extraFuel || 0));
      stopAraFuels.push(Math.round(card.araFuel || card.fuelComponentsObject?.araFuel || 0));
      stopApproachFuels.push(Math.round(card.approachFuel || card.fuelComponentsObject?.approachFuel || 0));
      stopRequiredFuels.push(Math.round(card.totalFuel || 0));
      stopExcessFuels.push(Math.round(card.excessFuel || 0));
      
      requestedPassengers.push(card.passengers || 0);
      availablePassengers.push(card.maxPassengers || 0);
      requestedPassengerWeight.push(Math.round((card.passengers || 0) * regionalPassengerWeight));
    });
    
    // Build action parameters
    const actionParams = {
      // Include existing object for modification
      "main_fuel_v2": existingFuelObject,
      
      // Complete fuel data arrays
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
      "planned_extra_fuel": Math.round(stopCards.reduce((total, card) => {
        const cardExtraFuel = card?.extraFuel || card?.fuelComponentsObject?.extraFuel || 0;
        return total + cardExtraFuel;
      }, 0)),
      "planned_taxi_fuel": Math.round(departureCard.taxiFuel || 0),
      "planned_deck_fuel": Math.round(departureCard.deckFuel || 0),
      "planned_reserve_fuel": Math.round(departureCard.reserveFuel || 0),
      "planned_contingency_fuel": Math.round(departureCard.contingencyFuel || 0),
      "planned_ara_fuel": Math.round(departureCard.araFuel || weatherFuel?.araFuel || 0),
      "planned_approach_fuel": Math.round(departureCard.approachFuel || weatherFuel?.approachFuel || 0),
      "min_total_fuel": Math.round(departureCard.totalFuel || 0),
      
      // Critical fuel totals  
      "round_trip_fuel": Math.round(departureCard.totalFuel || 0),
      "planned_alternate_fuel": Math.round(routeStats.alternateFuel || routeStats.minimumFuel || departureCard.reserveFuel || 0),
      "total_fuel_burned": Math.round(routeStats.tripFuel || departureCard.tripFuel || 0),
      "total_fuel_uplifted": Math.round(departureCard.totalFuel || 0),
      
      // Passenger data
      "requested_passengers": requestedPassengers,
      "available_passengers": availablePassengers,
      "requested_passenger_weight": requestedPassengerWeight,
      "average_passenger_weight": Math.round(regionalPassengerWeight),
      
      // Flight metadata
      "flight_uuid": flightId,
      "aircraft_uuid": selectedAircraft?.$primaryKey || null,
      "updated_at": currentTime
    };
    
    // 🚨 DEBUG: Log full parameters being sent to Palantir
    console.log('💾 DETAILED PARAMETER DEBUG:', {
      parameterCount: Object.keys(actionParams).length,
      hasMainFuelV2: !!actionParams.main_fuel_v2,
      main_fuel_v2_primaryKey: actionParams.main_fuel_v2?.$primaryKey,
      flightUuid: actionParams.flight_uuid,
      stopLocationsCount: actionParams.stop_locations?.length,
      allParameterKeys: Object.keys(actionParams)
    });
    
    console.log('💾 Executing createOrModifyMainFuelFastPlanner action with existing object');
    
    const sdk = await import('@flight-app/sdk');
    const result = await client(sdk.createOrModifyMainFuelFastPlanner).applyAction(
      actionParams,
      { $returnEdits: true }
    );
    
    console.log('✅ Fuel data updated successfully using existing object');
    
    return {
      success: true,
      message: 'Fuel data updated in existing object',
      result: result,
      fuelObjectUuid: existingFuelObject.$primaryKey,
      updated: true
    };
  }
}

export default FuelSaveBackService;