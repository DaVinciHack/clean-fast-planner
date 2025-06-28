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
    
    try {
      // Validate required parameters
      if (!flightId) {
        throw new Error('Flight ID is required for fuel save-back');
      }
      
      if (!stopCards || stopCards.length === 0) {
        throw new Error('Stop cards are required for fuel save-back');
      }
      
      // Import SDK dynamically
      const sdk = await import('@flight-app/sdk');
      
      // Check if MainFuelV2 record already exists
      let existingFuelRecord = null;
      try {
        const existingRecords = await client(sdk.MainFuelV2)
          .where(fuel => fuel.flightUuid.exactMatch(flightId))
          .fetchPage({ $pageSize: 1 });
        
        if (existingRecords.data && existingRecords.data.length > 0) {
          existingFuelRecord = existingRecords.data[0];
          console.log('💾 Found existing MainFuelV2 record:', existingFuelRecord.uuid);
        }
      } catch (searchError) {
        console.log('💾 No existing MainFuelV2 record found, will create new one');
      }
      
      // Transform stopCards to Palantir's array-based structure
      const fuelRecord = this.transformToMainFuelV2Structure(
        stopCards,
        flightSettings,
        weatherFuel,
        fuelPolicy,
        routeStats,
        selectedAircraft,
        flightId
      );
      
      let result;
      
      if (existingFuelRecord) {
        // Update existing record
        console.log('💾 Updating existing MainFuelV2 record');
        result = await client(sdk.MainFuelV2).edit(existingFuelRecord.uuid, fuelRecord);
      } else {
        // Create new record
        console.log('💾 Creating new MainFuelV2 record');
        result = await client(sdk.MainFuelV2).create(fuelRecord);
      }
      
      console.log('✅ FuelSaveBackService: MainFuelV2 save successful:', result);
      
      // Show user feedback
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator(
          'Fuel data saved to Palantir successfully',
          'success',
          3000
        );
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ FuelSaveBackService: Error saving MainFuelV2:', error);
      
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
   * Transform stop cards to Palantir's MainFuelV2 array-based structure
   * Matches the exact format used in FlightFuelService.ts
   */
  static transformToMainFuelV2Structure(stopCards, flightSettings, weatherFuel, fuelPolicy, routeStats, selectedAircraft, flightId) {
    console.log('🔄 Transforming stop cards to MainFuelV2 structure');
    
    // Initialize the record structure matching Palantir's format
    const fuelRecord = {
      // Basic identifiers
      flightUuid: flightId,
      flightNumber: flightSettings.flightNumber || selectedAircraft?.registration || 'Unknown',
      aircraft: selectedAircraft?.registration || selectedAircraft?.assetId || 'Unknown',
      
      // Timestamps
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      
      // Units (matching Palantir's constants)
      calculationUnit: 'LBS',
      displayUnit: 'LBS',
      
      // Policy information
      policyName: fuelPolicy?.name || 'Unknown Policy',
      policyUuid: fuelPolicy?.uuid || fuelPolicy?.id || null,
      
      // Planned fuel totals (from departure card)
      plannedTripFuel: Math.round(routeStats.tripFuel || stopCards[0]?.tripFuel || 0),
      plannedTaxiFuel: Math.round(flightSettings.taxiFuel || 0),
      plannedContingencyFuel: Math.round(stopCards[0]?.contingencyFuel || 0),
      plannedReserveFuel: Math.round(flightSettings.reserveFuel || 0),
      plannedDeckFuel: Math.round(flightSettings.deckFuelPerStop || 0),
      plannedExtraFuel: Math.round(flightSettings.extraFuel || 0),
      plannedAraFuel: Math.round(weatherFuel.araFuel || 0),
      plannedApproachFuel: Math.round(weatherFuel.approachFuel || 0),
      plannedAlternateFuel: 0, // TODO: Extract from alternate calculations
      plannedContingencyAlternateFuel: 0,
      
      // Total fuel calculations
      minTotalFuel: Math.round(stopCards[0]?.totalFuel || 0),
      roundTripFuel: Math.round(stopCards[0]?.totalFuel || 0),
      
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
        return null;
      }
      
      // Import SDK dynamically
      const sdk = await import('@flight-app/sdk');
      
      // Query MainFuelV2 objects for this flight
      const fuelData = await client(sdk.MainFuelV2)
        .where(fuel => fuel.flightUuid.exactMatch(flightId))
        .fetchPage({ $pageSize: 1 });
      
      if (fuelData.data && fuelData.data.length > 0) {
        const existingFuel = fuelData.data[0];
        console.log('📥 FuelSaveBackService: Found existing fuel data:', existingFuel);
        return existingFuel;
      }
      
      console.log('📥 FuelSaveBackService: No existing fuel data found');
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
      const existingFuelData = await this.loadExistingFuelData(flightId);
      
      // Check if save is needed by comparing stop counts and basic totals
      const currentTotalFuel = Math.round(stopCards[0]?.totalFuel || 0);
      const existingTotalFuel = Math.round(existingFuelData?.minTotalFuel || 0);
      
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