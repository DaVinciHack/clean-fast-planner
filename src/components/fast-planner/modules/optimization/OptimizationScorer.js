/**
 * OptimizationScorer.js
 * 
 * Scores and ranks fuel stop candidates based on passenger capacity improvement,
 * route deviation, and fuel efficiency. Does NOT modify existing route stops - 
 * only adds fuel stops to enable carrying more passengers.
 */

import { CorridorSearcher } from './CorridorSearcher.js';

export class OptimizationScorer {
  constructor() {
    this.corridorSearcher = new CorridorSearcher();
  }

  /**
   * Scores and ranks fuel stop platforms for passenger optimization
   * @param {Array} candidatePlatforms - Potential fuel stops
   * @param {Object} flightData - Current flight configuration
   * @param {Object} overloadAnalysis - Passenger overload details
   * @returns {Array} Ranked fuel stop options
   */
  scoreAndRankPlatforms(candidatePlatforms, flightData, overloadAnalysis) {
    console.log(`Scoring ${candidatePlatforms.length} fuel stop candidates...`);
    
    const scoredOptions = candidatePlatforms.map(platform => {
      const analysis = this.analyzeFuelStopBenefit(platform, flightData, overloadAnalysis);
      const score = this.calculateOverallScore(analysis);
      
      return {
        platform,
        analysis,
        score,
        insertionPoint: this.findOptimalInsertionPoint(platform, flightData.waypoints)
      };
    });

    // Sort by score (highest first)
    const rankedOptions = scoredOptions.sort((a, b) => b.score - a.score);
    
    console.log('Top fuel stop options:', rankedOptions.slice(0, 3).map(option => ({
      platform: option.platform.name || option.platform.id,
      score: option.score.toFixed(1),
      passengerGain: option.analysis.passengerGain,
      deviation: option.analysis.routeDeviation.toFixed(1) + 'nm'
    })));

    return rankedOptions;
  }

  /**
   * Analyzes the benefit of adding a specific fuel stop
   * @param {Object} platform - Fuel stop platform
   * @param {Object} flightData - Flight configuration
   * @param {Object} overloadAnalysis - Passenger overload details
   * @returns {Object} Benefit analysis
   */
  analyzeFuelStopBenefit(platform, flightData, overloadAnalysis) {
    const { selectedAircraft, waypoints, stopCards } = flightData;
    const problematicLeg = overloadAnalysis.overloadedLegs[0]; // First leg usually has most fuel
    
    // Calculate route deviation
    const routeDeviation = this.calculateRouteDeviation(platform, waypoints);
    
    // Calculate fuel savings from refueling
    const fuelSavings = this.calculateFuelSavings(platform, stopCards, problematicLeg);
    
    // Calculate passenger capacity improvement
    const passengerGain = this.calculatePassengerGain(
      fuelSavings, 
      selectedAircraft, 
      flightData.flightSettings?.passengerWeight || 220
    );
    
    // Calculate fuel efficiency
    const fuelEfficiency = this.calculateFuelEfficiency(fuelSavings, routeDeviation);
    
    return {
      platform,
      routeDeviation,
      fuelSavings,
      passengerGain,
      fuelEfficiency,
      problematicLegIndex: problematicLeg.legIndex,
      targetShortage: problematicLeg.shortage
    };
  }

  /**
   * Calculates route deviation caused by adding fuel stop
   * @param {Object} platform - Fuel stop platform
   * @param {Array} waypoints - Original route waypoints
   * @returns {Number} Additional distance in nautical miles
   */
  calculateRouteDeviation(platform, waypoints) {
    if (!waypoints || waypoints.length < 2) {
      return 0;
    }

    const insertionPoint = this.findOptimalInsertionPoint(platform, waypoints);
    const prevWaypoint = waypoints[insertionPoint - 1];
    const nextWaypoint = waypoints[insertionPoint];
    
    if (!prevWaypoint || !nextWaypoint) {
      return 0;
    }

    // Original direct distance
    const originalDistance = this.corridorSearcher.calculateDistance(prevWaypoint, nextWaypoint);
    
    // New distance via fuel stop
    const distanceToPlatform = this.corridorSearcher.calculateDistance(prevWaypoint, platform);
    const distanceFromPlatform = this.corridorSearcher.calculateDistance(platform, nextWaypoint);
    const newDistance = distanceToPlatform + distanceFromPlatform;
    
    return Math.max(0, newDistance - originalDistance);
  }

  /**
   * Calculates fuel savings from adding a fuel stop
   * @param {Object} platform - Fuel stop platform
   * @param {Array} stopCards - Current stop cards
   * @param {Object} problematicLeg - Leg with passenger overload
   * @returns {Number} Fuel savings in pounds
   */
  calculateFuelSavings(platform, stopCards, problematicLeg) {
    if (!stopCards || stopCards.length === 0) {
      return 0;
    }

    // Get current fuel load on problematic leg
    const currentFuel = stopCards[problematicLeg.legIndex]?.totalFuel || 0;
    
    // Estimate fuel savings by refueling
    // This is a simplified calculation - in reality, we'd need to recalculate the entire route
    const estimatedFuelBurn = this.estimateFuelBurnToFuelStop(platform, stopCards[0]);
    const fuelSavings = Math.max(0, currentFuel - estimatedFuelBurn - 1000); // Keep 1000 lbs reserve
    
    return fuelSavings;
  }

  /**
   * Estimates fuel burn from departure to fuel stop
   * @param {Object} platform - Fuel stop platform
   * @param {Object} firstStopCard - First stop card
   * @returns {Number} Estimated fuel burn in pounds
   */
  estimateFuelBurnToFuelStop(platform, firstStopCard) {
    // This is a simplified estimate - would need full route calculation in production
    const estimatedDistance = 50; // Assume 50nm average to fuel stop
    const estimatedFuelFlow = 300; // Assume 300 lbs/hour fuel flow
    const estimatedTime = estimatedDistance / 120; // Assume 120 knots average speed
    
    return estimatedFuelFlow * estimatedTime;
  }

  /**
   * Calculates passenger capacity gain from fuel savings
   * @param {Number} fuelSavings - Fuel weight saved (lbs)
   * @param {Object} aircraft - Aircraft data
   * @param {Number} passengerWeight - Weight per passenger (lbs)
   * @returns {Number} Additional passengers that can be carried
   */
  calculatePassengerGain(fuelSavings, aircraft, passengerWeight) {
    if (fuelSavings <= 0) {
      return 0;
    }

    // Convert fuel savings to passenger capacity
    const additionalPassengers = Math.floor(fuelSavings / passengerWeight);
    
    // Limit by aircraft maximum passenger capacity
    const maxPassengers = aircraft?.maxPassengers || 19;
    
    return Math.min(additionalPassengers, maxPassengers);
  }

  /**
   * Calculates fuel efficiency score (passenger gain per nautical mile)
   * @param {Number} fuelSavings - Fuel saved (lbs)
   * @param {Number} routeDeviation - Additional distance (nm)
   * @returns {Number} Efficiency score
   */
  calculateFuelEfficiency(fuelSavings, routeDeviation) {
    if (routeDeviation === 0) {
      return fuelSavings; // Perfect efficiency if no deviation
    }
    
    return fuelSavings / routeDeviation;
  }

  /**
   * Calculates overall score for fuel stop option
   * @param {Object} analysis - Benefit analysis
   * @returns {Number} Overall score (higher is better)
   */
  calculateOverallScore(analysis) {
    const {
      passengerGain,
      routeDeviation,
      fuelSavings,
      fuelEfficiency,
      targetShortage
    } = analysis;

    let score = 0;

    // Passenger gain is most important (0-100 points)
    score += passengerGain * 10;

    // Bonus for meeting target shortage
    if (passengerGain >= targetShortage) {
      score += 20; // Bonus for fully solving the problem
    }

    // Route deviation penalty (0-50 points deducted)
    score -= Math.min(50, routeDeviation * 2);

    // Fuel efficiency bonus (0-30 points)
    score += Math.min(30, fuelEfficiency / 10);

    // Fuel savings bonus (0-20 points)
    score += Math.min(20, fuelSavings / 100);

    return Math.max(0, score);
  }

  /**
   * Finds optimal insertion point for fuel stop in route
   * @param {Object} platform - Fuel stop platform
   * @param {Array} waypoints - Route waypoints
   * @returns {Number} Insertion index
   */
  findOptimalInsertionPoint(platform, waypoints) {
    if (!waypoints || waypoints.length < 2) {
      return 1; // Insert after departure
    }

    let bestIndex = 1;
    let minDeviation = Infinity;

    // Try inserting after each waypoint (except last)
    for (let i = 1; i < waypoints.length; i++) {
      const prevWaypoint = waypoints[i - 1];
      const nextWaypoint = waypoints[i];
      
      // Calculate deviation for this insertion point
      const originalDistance = this.corridorSearcher.calculateDistance(prevWaypoint, nextWaypoint);
      const newDistance = 
        this.corridorSearcher.calculateDistance(prevWaypoint, platform) +
        this.corridorSearcher.calculateDistance(platform, nextWaypoint);
      
      const deviation = newDistance - originalDistance;
      
      if (deviation < minDeviation) {
        minDeviation = deviation;
        bestIndex = i;
      }
    }

    return bestIndex;
  }

  /**
   * Validates fuel stop option meets minimum requirements
   * @param {Object} option - Scored fuel stop option
   * @param {Object} requirements - Minimum requirements
   * @returns {Boolean} True if meets requirements
   */
  validateOption(option, requirements = {}) {
    const {
      minPassengerGain = 1,
      maxRouteDeviation = 15,
      minScore = 10
    } = requirements;

    if (option.analysis.passengerGain < minPassengerGain) {
      return false;
    }

    if (option.analysis.routeDeviation > maxRouteDeviation) {
      return false;
    }

    if (option.score < minScore) {
      return false;
    }

    return true;
  }
}

export default OptimizationScorer;