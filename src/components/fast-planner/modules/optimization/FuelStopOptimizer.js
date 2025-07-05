/**
 * FuelStopOptimizer.js
 * 
 * Standalone fuel stop optimization module for passenger capacity improvement.
 * Triggers when required passengers > available passengers.
 * 
 * AVIATION SAFETY: No dummy data - only real platform fuel capability data.
 */

import { CorridorSearcher } from './CorridorSearcher.js';
import { PlatformEvaluator } from './PlatformEvaluator.js';
import { OptimizationScorer } from './OptimizationScorer.js';

export class FuelStopOptimizer {
  constructor() {
    this.corridorSearcher = new CorridorSearcher();
    this.platformEvaluator = new PlatformEvaluator();
    this.optimizationScorer = new OptimizationScorer();
  }

  /**
   * Main entry point - analyzes passenger overload and suggests fuel stops
   * @param {Object} flightData - Current flight configuration
   * @returns {Object} Optimization suggestions
   */
  async suggestFuelStops(flightData) {
    try {
      console.log('FuelStopOptimizer: Starting passenger capacity optimization');
      
      // Step 1: Detect passenger overload
      console.log('🔍 STEP 1: Analyzing passenger overload...');
      const overloadAnalysis = this.analyzePassengerOverload(flightData);
      console.log('🔍 OVERLOAD ANALYSIS:', overloadAnalysis);
      
      if (!overloadAnalysis.hasOverload) {
        console.log('❌ NO OVERLOAD: Exiting optimization');
        return { success: false, reason: 'No passenger overload detected' };
      }

      console.log('✅ OVERLOAD CONFIRMED: Proceeding with optimization');

      // Step 2: Find the problematic leg (usually first leg)
      console.log('🔍 STEP 2: Identifying problematic leg...');
      const problematicLeg = this.identifyProblematicLeg(flightData.stopCards, overloadAnalysis);
      console.log('🔍 PROBLEMATIC LEG:', problematicLeg);
      
      // Step 3: Create search corridor toward split point
      console.log('🔍 STEP 3: Creating search corridor...');
      console.log('🔍 WAYPOINTS FOR CORRIDOR:', flightData.waypoints?.map(wp => ({ name: wp.name, lat: wp.lat, lng: wp.lng })));
      const searchCorridor = this.corridorSearcher.createSearchCorridor(
        flightData.waypoints,
        flightData.alternateSplitPoint,
        { maxOffTrack: 100, minFromStart: 20 }
      );
      console.log('🔍 SEARCH CORRIDOR:', searchCorridor);

      // Step 4: Find fuel-capable platforms in corridor
      console.log('🔍 STEP 4: Searching for fuel-capable platforms...');
      console.log('🔍 AVAILABLE PLATFORMS COUNT:', flightData.availablePlatforms?.length || 0);
      console.log('🔍 FIRST FEW PLATFORMS:', flightData.availablePlatforms?.slice(0, 3).map(p => ({ name: p.name, hasFuel: p.hasFuel, fuelAvailable: p.fuelAvailable })));
      
      const candidatePlatforms = await this.findFuelStopsInCorridor(
        searchCorridor,
        flightData.availablePlatforms
      );
      
      console.log('🔍 CANDIDATE PLATFORMS FOUND:', candidatePlatforms.length);
      console.log('🔍 CANDIDATES:', candidatePlatforms.map(p => ({ name: p.name, hasFuel: p.hasFuel })));

      if (candidatePlatforms.length === 0) {
        console.log('❌ NO CANDIDATES: No fuel-capable platforms found in corridor');
        return { 
          success: false, 
          reason: 'No fuel-capable platforms found within 100nm corridor' 
        };
      }

      // Step 5: Score and rank platforms
      const rankedOptions = this.optimizationScorer.scoreAndRankPlatforms(
        candidatePlatforms,
        flightData,
        overloadAnalysis
      );

      // Step 6: Return top 2 suggestions
      const suggestions = rankedOptions.slice(0, 2).map(option => ({
        platform: option.platform,
        passengerGain: option.analysis.passengerGain,
        fuelSavings: option.analysis.fuelSavings,
        routeDeviation: option.analysis.routeDeviation,
        score: option.score,
        insertionPoint: option.insertionPoint
      }));

      return {
        success: true,
        overloadAnalysis,
        suggestions,
        corridorUsed: searchCorridor
      };

    } catch (error) {
      console.error('FuelStopOptimizer error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Analyzes current passenger capacity vs requirements
   * @param {Object} flightData - Flight configuration
   * @returns {Object} Overload analysis
   */
  analyzePassengerOverload(flightData) {
    const { stopCards, requiredPassengers } = flightData;
    
    if (!stopCards || stopCards.length === 0) {
      return { hasOverload: false, reason: 'No stop cards available' };
    }

    // Find legs where required > available passengers
    const overloadedLegs = stopCards
      .map((card, index) => ({
        legIndex: index,
        required: requiredPassengers,
        available: card.maxPassengers || 0,
        shortage: requiredPassengers - (card.maxPassengers || 0)
      }))
      .filter(leg => leg.shortage > 0);

    if (overloadedLegs.length === 0) {
      return { hasOverload: false, reason: 'Sufficient passenger capacity' };
    }

    return {
      hasOverload: true,
      overloadedLegs,
      maxShortage: Math.max(...overloadedLegs.map(leg => leg.shortage)),
      affectedLegs: overloadedLegs.length
    };
  }

  /**
   * Identifies the leg that needs fuel optimization (usually first leg)
   * @param {Array} stopCards - Current stop cards
   * @param {Object} overloadAnalysis - Passenger overload analysis
   * @returns {Object} Problematic leg details
   */
  identifyProblematicLeg(stopCards, overloadAnalysis) {
    // Usually the first leg has the most fuel (worst passenger capacity)
    const firstOverloadedLeg = overloadAnalysis.overloadedLegs[0];
    
    return {
      legIndex: firstOverloadedLeg.legIndex,
      passengerShortage: firstOverloadedLeg.shortage,
      currentFuel: stopCards[firstOverloadedLeg.legIndex]?.totalFuel || 0,
      currentCapacity: firstOverloadedLeg.available
    };
  }

  /**
   * Finds fuel-capable platforms within search corridor
   * @param {Object} corridor - Search corridor geometry
   * @param {Array} platforms - Available platforms
   * @returns {Array} Candidate fuel stops
   */
  async findFuelStopsInCorridor(corridor, platforms) {
    if (!platforms || platforms.length === 0) {
      console.warn('No platforms provided for corridor search');
      return [];
    }

    // Filter platforms within corridor that have fuel capability
    const fuelCapablePlatforms = platforms.filter(platform => {
      // Check if platform has fuel capability
      // Use PlatformEvaluator to properly check fuel capability
      if (!this.platformEvaluator.hasFuelCapability(platform)) {
        return false;
      }

      // Check if platform is within corridor
      return this.corridorSearcher.isPlatformInCorridor(platform, corridor);
    });

    console.log(`Found ${fuelCapablePlatforms.length} fuel-capable platforms in corridor`);
    
    return fuelCapablePlatforms;
  }

  /**
   * Generates human-readable suggestion text
   * @param {Array} suggestions - Top fuel stop suggestions
   * @returns {Object} User-friendly suggestion text
   */
  generateSuggestionText(suggestions) {
    if (!suggestions || suggestions.length === 0) {
      return {
        title: 'No Fuel Stop Options Found',
        message: 'Unable to find suitable fuel stops within 10nm of your route.'
      };
    }

    const primarySuggestion = suggestions[0];
    const hasAlternative = suggestions.length > 1;

    return {
      title: `Fuel Stop Suggestion - Carry ${primarySuggestion.passengerGain} More Passengers`,
      primary: {
        platform: primarySuggestion.platform.name || primarySuggestion.platform.id,
        benefit: `+${primarySuggestion.passengerGain} passengers`,
        deviation: `${primarySuggestion.routeDeviation.toFixed(1)}nm detour`,
        fuelSavings: `${primarySuggestion.fuelSavings.toFixed(0)} lbs fuel saved`
      },
      alternative: hasAlternative ? {
        platform: suggestions[1].platform.name || suggestions[1].platform.id,
        benefit: `+${suggestions[1].passengerGain} passengers`,
        deviation: `${suggestions[1].routeDeviation.toFixed(1)}nm detour`,
        fuelSavings: `${suggestions[1].fuelSavings.toFixed(0)} lbs fuel saved`
      } : null,
      actionPrompt: 'Would you like me to add this fuel stop to your route?'
    };
  }
}

export default FuelStopOptimizer;