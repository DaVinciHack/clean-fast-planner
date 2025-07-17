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
      const overloadAnalysis = this.analyzePassengerOverload(flightData);
      
      if (!overloadAnalysis.hasOverload) {
        return { success: false, reason: 'No passenger overload detected' };
      }

      console.log('✅ OVERLOAD CONFIRMED: Proceeding with optimization');

      // Step 2: Find the problematic leg (usually first leg)
      const problematicLeg = this.identifyProblematicLeg(flightData.stopCards, overloadAnalysis);
      
      // Step 3: Create search corridor toward split point
      console.log('🔍 CREATING CORRIDOR WITH SPLIT POINT:', flightData.alternateSplitPoint);
      
      // 🎯 OPTIMIZED CORRIDOR: Reasonable search area 
      const searchCorridor = this.corridorSearcher.createSearchCorridor(
        flightData.waypoints,
        flightData.alternateSplitPoint,
        { maxOffTrack: 50, minFromStart: 5 } // 50nm corridor, 5nm min from start
      );

      // Step 4: Find fuel-capable platforms in corridor (including destination rigs)
      console.log('🔍 SEARCHING FOR FUEL-CAPABLE PLATFORMS...');
      
      // 🎯 NEW: Include destination rigs/waypoints in fuel stop search
      const destinationRigs = this.findDestinationRigsWithFuel(flightData.waypoints);
      if (destinationRigs.length > 0) {
        console.log('🔍 DESTINATION RIGS WITH FUEL:', destinationRigs.map(r => r.name));
      }
      
      // Test fuel capability detection on all platforms
      const fuelCapablePlatformsTotal = flightData.availablePlatforms?.filter(p => 
        this.platformEvaluator.hasFuelCapability(p)
      ) || [];
      console.log('🔍 TOTAL FUEL-CAPABLE PLATFORMS:', fuelCapablePlatformsTotal.length);
      
      // 🔧 NORMALIZE PLATFORMS: Convert coordinates array format to lat/lng properties
      const normalizedPlatforms = (flightData.availablePlatforms || []).map(platform => 
        this.platformEvaluator.normalizePlatform(platform)
      );
      
      // 🎯 COMBINE: Regular platforms + destination rigs with fuel
      const allPlatforms = [...normalizedPlatforms, ...destinationRigs];
      
      // 🎯 LIMIT PLATFORMS: Only consider fuel-capable platforms near route
      const routeStart = flightData.waypoints[0];
      const fuelCapablePlatforms = allPlatforms.filter(platform => 
        platform.hasFuel && platform.lat && platform.lng
      );
      
      // 🚀 IMPROVED: Prioritize by distance from alternate split point (not start)
      const splitPoint = flightData.alternateSplitPoint || flightData.waypoints[flightData.waypoints.length - 1];
      
      console.log('🚀 SPLIT POINT BEING USED:', {
        provided: !!flightData.alternateSplitPoint,
        coords: splitPoint,
        fallback: !flightData.alternateSplitPoint ? 'Using last waypoint' : null
      });
      
      const platformsWithDistance = fuelCapablePlatforms.map(platform => ({
        ...platform,
        distanceFromStart: this.corridorSearcher.calculateDistance(routeStart, platform),
        distanceFromSplit: this.corridorSearcher.calculateDistance(splitPoint, platform)
      })).sort((a, b) => a.distanceFromSplit - b.distanceFromSplit) // Sort by split point distance
        .slice(0, 100); // Limit to 100 closest fuel-capable platforms
      
      console.log(`🎯 PLATFORM FILTERING: ${fuelCapablePlatforms.length} fuel-capable → ${platformsWithDistance.length} closest to split point`);

      // 🚨 SPLIT POINT PROXIMITY TEST: Show top 3 platforms after all filtering
      console.log('🧪 TOP 3 PLATFORMS (by split point proximity after filtering):');
      platformsWithMinDistance.slice(0, 3).forEach(platform => {
        const distFromStart = this.corridorSearcher.calculateDistance(routeStart, platform);
        const distFromSplit = platform.distanceFromSplit || this.corridorSearcher.calculateDistance(splitPoint, platform);
        console.log(`📏 ${platform.name}: ${distFromStart.toFixed(1)}nm from start, ${distFromSplit.toFixed(1)}nm from split point`);
      });

      // 🚀 NEW: Filter platforms to only include those BEFORE the alternate split point
      const platformsBeforeSplit = this.filterPlatformsBeforeSplitPoint(
        platformsWithDistance,
        flightData.waypoints,
        flightData.alternateSplitPoint
      );
      
      console.log(`🎯 SPLIT POINT FILTERING: ${platformsWithDistance.length} platforms → ${platformsBeforeSplit.length} before split point`);
      
      // 🚀 FORCE MINIMUM DISTANCE: Remove platforms too close to departure
      const platformsWithMinDistance = platformsBeforeSplit.filter(platform => {
        const distFromStart = this.corridorSearcher.calculateDistance(routeStart, platform);
        const minDistance = 20; // Minimum 20nm from departure
        const isValidDistance = distFromStart >= minDistance;
        
        if (!isValidDistance) {
          console.log(`❌ TOO CLOSE TO START: ${platform.name} at ${distFromStart.toFixed(1)}nm (min: ${minDistance}nm)`);
        }
        
        return isValidDistance;
      });
      
      console.log(`🎯 MINIMUM DISTANCE FILTERING: ${platformsBeforeSplit.length} platforms → ${platformsWithMinDistance.length} after min distance filter`);
      
      const candidatePlatforms = await this.findFuelStopsInCorridor(
        searchCorridor,
        platformsWithMinDistance
      );
      
      console.log('🔍 CANDIDATE PLATFORMS FOUND:', candidatePlatforms.length);
      if (candidatePlatforms.length > 0) {
        console.log('🔍 CANDIDATES:', candidatePlatforms.slice(0, 3).map(p => p.name));
      }

      if (candidatePlatforms.length === 0) {
        return { 
          success: false, 
          reason: 'No fuel-capable platforms found within 50nm corridor' 
        };
      }

      // Step 5: Score and rank platforms (prioritize alternate split point proximity)
      const rankedOptions = this.optimizationScorer.scoreAndRankPlatforms(
        candidatePlatforms,
        flightData,
        overloadAnalysis,
        flightData.alternateSplitPoint // Pass split point for proximity scoring
      );

      // Step 6: Remove duplicates and return top suggestions
      const uniqueOptions = [];
      const seenPlatforms = new Set();
      
      for (const option of rankedOptions) {
        const platformId = option.platform.name || option.platform.id;
        if (!seenPlatforms.has(platformId)) {
          seenPlatforms.add(platformId);
          uniqueOptions.push(option);
        }
        if (uniqueOptions.length >= 3) break; // Top 3 unique suggestions
      }
      
      const suggestions = uniqueOptions.map(option => ({
        platform: option.platform,
        analysis: {
          passengerGain: option.analysis.passengerGain,
          fuelSavings: option.analysis.fuelSavings,
          routeDeviation: option.analysis.routeDeviation,
          fuelEfficiency: option.analysis.fuelEfficiency
        },
        score: option.score,
        insertionPoint: option.insertionPoint,
        name: option.platform.name || option.platform.id,
        // Also include flattened versions for compatibility
        passengerGain: option.analysis.passengerGain,
        fuelSavings: option.analysis.fuelSavings,
        routeDeviation: option.analysis.routeDeviation
      }));
      
      console.log('🎯 FINAL SUGGESTIONS:', suggestions.map(s => ({
        name: s.name,
        deviation: s.analysis.routeDeviation?.toFixed(1) + 'nm',
        passengerGain: `+${s.analysis.passengerGain}`,
        score: s.score?.toFixed(1)
      })));

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
    const { stopCards, overloadedStops, stopRequests } = flightData;
    
    // Reduced logging for overload analysis
    
    if (!stopCards || stopCards.length === 0) {
      return { hasOverload: false, reason: 'No stop cards available' };
    }

    // 🚨 USE THE OVERLOAD DATA PASSED FROM UI
    // The UI already detected overload and passed overloadedStops
    if (overloadedStops && overloadedStops.length > 0) {
      console.log('✅ OVERLOAD CONFIRMED: Using UI-detected overload data');
      
      // Get detailed overload info from stopRequests
      const overloadDetails = stopRequests?.filter(req => 
        overloadedStops.includes(req.stopName) && req.requestedWeight > req.availableWeight
      ) || [];
      
      const maxShortage = Math.max(...overloadDetails.map(req => 
        req.requestedWeight - req.availableWeight
      ), 0);
      
      return {
        hasOverload: true,
        overloadedLegs: overloadDetails,
        maxShortage,
        affectedLegs: overloadDetails.length,
        reason: `${overloadedStops.length} stops have weight overload`
      };
    }

    // Fallback: analyze stop cards directly
    const overloadedLegs = stopCards
      .map((card, index) => ({
        legIndex: index,
        stopName: card.name || card.stopName,
        required: card.requestedWeight || 0,
        available: card.availableWeight || 0,
        shortage: (card.requestedWeight || 0) - (card.availableWeight || 0)
      }))
      .filter(leg => leg.shortage > 0);

    if (overloadedLegs.length === 0) {
      console.log('❌ NO OVERLOAD: No weight overload detected in analysis');
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
    console.log('🔍 CORRIDOR SEARCH: Starting with', platforms?.length || 0, 'platforms');
    
    if (!platforms || platforms.length === 0) {
      console.warn('❌ CORRIDOR SEARCH: No platforms provided');
      return [];
    }
    
    console.log('🔍 CORRIDOR DETAILS:', {
      maxOffTrack: corridor.maxOffTrack + 'nm',
      minFromStart: corridor.minFromStart + 'nm',
      segments: corridor.segments.length,
      totalDistance: corridor.totalDistance.toFixed(1) + 'nm'
    });

    // Debug: Show first few platforms before filtering
    if (platforms.length > 0) {
      console.log('🔍 RAW PLATFORM SAMPLE:', platforms.slice(0, 2).map(p => ({
        name: p.name,
        hasCoords: !!(p.lat && p.lng),
        hasFuel: p.hasFuel
      })));
    }

    // First, filter for fuel capability
    const fuelCapablePlatforms = platforms.filter(platform => {
      return this.platformEvaluator.hasFuelCapability(platform);
    });
    
    console.log('🔍 CORRIDOR SEARCH: Found', fuelCapablePlatforms.length, 'fuel-capable platforms');
    if (fuelCapablePlatforms.length > 0) {
      console.log('🔍 FUEL-CAPABLE EXAMPLES:', fuelCapablePlatforms.slice(0, 3).map(p => ({
        name: p.name,
        hasFuel: p.hasFuel,
        fuelAvailable: p.fuelAvailable
      })));
    }
    
    // Then filter for corridor proximity
    console.log('🔍 CORRIDOR SEARCH: Checking corridor proximity...');
    
    let rejectionCount = 0;
    const finalCandidates = fuelCapablePlatforms.filter(platform => {
      const inCorridor = this.corridorSearcher.isPlatformInCorridor(platform, corridor);
      // Only log the first few rejections to avoid spam
      if (!inCorridor && rejectionCount < 5) {
        console.log(`❌ OUT OF CORRIDOR: ${platform.name}`);
        rejectionCount++;
      } else if (inCorridor && rejectionCount < 3) {
        console.log(`✅ IN CORRIDOR: ${platform.name}`);
      }
      return inCorridor;
    });
    
    console.log('🔍 CORRIDOR SEARCH: Final candidates:', finalCandidates.length);
    if (finalCandidates.length > 0) {
      console.log('🔍 CORRIDOR SEARCH: Examples:', finalCandidates.slice(0, 3).map(p => p.name));
    } else {
      console.log('❌ NO CANDIDATES FOUND - corridor may be too restrictive');
      console.log('🔍 CORRIDOR SETTINGS:', {
        maxOffTrack: corridor.maxOffTrack + 'nm',
        minFromStart: corridor.minFromStart + 'nm',
        platformsInput: platforms.length,
        fuelCapablePlatforms: fuelCapablePlatforms.length
      });
    }
    
    return finalCandidates;
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

  /**
   * Finds destination rigs/waypoints that have fuel capability
   * @param {Array} waypoints - Route waypoints
   * @returns {Array} Destination rigs with fuel capability
   */
  findDestinationRigsWithFuel(waypoints) {
    if (!waypoints || waypoints.length === 0) {
      return [];
    }

    const destinationRigs = [];
    
    // Check all waypoints (excluding first one - departure)
    for (let i = 1; i < waypoints.length; i++) {
      const waypoint = waypoints[i];
      
      // Normalize waypoint to platform format for fuel evaluation
      const normalizedWaypoint = this.platformEvaluator.normalizePlatform(waypoint);
      
      // Check if this waypoint has fuel capability
      if (normalizedWaypoint.hasFuel) {
        destinationRigs.push({
          ...normalizedWaypoint,
          isDestination: true,
          waypointIndex: i
        });
        console.log(`🛢️ DESTINATION WITH FUEL: ${waypoint.name} has fuel capability`);
      }
    }
    
    return destinationRigs;
  }

  /**
   * Filters platforms to only include those before the alternate split point
   * @param {Array} platforms - Platforms with distances
   * @param {Array} waypoints - Route waypoints
   * @param {Object} alternateSplitPoint - Split point coordinates
   * @returns {Array} Filtered platforms
   */
  filterPlatformsBeforeSplitPoint(platforms, waypoints, alternateSplitPoint) {
    if (!alternateSplitPoint || !alternateSplitPoint.lat || !alternateSplitPoint.lng) {
      console.log('⚠️ NO SPLIT POINT: Returning all platforms (no filtering)');
      return platforms;
    }

    const routeStart = waypoints[0];
    const splitPoint = alternateSplitPoint;
    
    // Calculate total distance from start to split point
    const totalDistanceToSplit = this.corridorSearcher.calculateDistance(routeStart, splitPoint);
    console.log(`🔍 ROUTE TO SPLIT: ${totalDistanceToSplit.toFixed(1)}nm from start to split point`);
    console.log(`🔍 SPLIT POINT COORDS: [${splitPoint.lat}, ${splitPoint.lng}]`);

    const filteredPlatforms = platforms.filter(platform => {
      const distanceFromStart = this.corridorSearcher.calculateDistance(routeStart, platform);
      const distanceFromSplit = this.corridorSearcher.calculateDistance(splitPoint, platform);
      
      // Platform is "before" split point if it's closer to start than to split point
      // AND it's not significantly past the split point
      const isBeforeSplit = distanceFromStart <= (totalDistanceToSplit + 10); // Allow 10nm tolerance
      const preferOnWayToSplit = distanceFromStart < distanceFromSplit; // Prefer platforms "on the way"
      
      const shouldInclude = isBeforeSplit;
      
      if (!shouldInclude) {
        console.log(`❌ PAST SPLIT: ${platform.name} at ${distanceFromStart.toFixed(1)}nm from start (split at ${totalDistanceToSplit.toFixed(1)}nm)`);
      } else if (preferOnWayToSplit) {
        console.log(`✅ ON THE WAY: ${platform.name} at ${distanceFromStart.toFixed(1)}nm from start, ${distanceFromSplit.toFixed(1)}nm from split`);
      }
      
      return shouldInclude;
    });

    console.log(`🔍 SPLIT POINT FILTER RESULT: ${filteredPlatforms.length} platforms pass filter`);
    return filteredPlatforms;
  }
}

export default FuelStopOptimizer;