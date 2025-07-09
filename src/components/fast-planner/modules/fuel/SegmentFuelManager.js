/**
 * SegmentFuelManager.js
 * 
 * Handles complex fuel segmentation logic for flights with refuels.
 * Key principle: Each refuel creates a new flight segment with fresh fuel calculations.
 * 
 * Fuel Rules:
 * - ARA Fuel: Added at segment start, burned at rig approaches only
 * - Approach Fuel: Added at segment start, burned at airport approaches only  
 * - Extra Fuel: Added at segment start, general buffer
 * - Deck Fuel: Location-specific, varies per rig deck time
 */

class SegmentFuelManager {
  constructor() {
    this.segments = [];
    this.refuelStops = [];
    this.listeners = [];
    
    // External data needed for fuel calculations
    this.weatherSegments = [];
    this.fuelPolicy = null;
  }
  
  /**
   * Set external data for fuel calculations
   */
  setExternalData(weatherSegments = [], fuelPolicy = null) {
    this.weatherSegments = weatherSegments;
    this.fuelPolicy = fuelPolicy;
  }
  
  /**
   * Analyze flight and create segments based on refuel stops
   */
  analyzeFlightSegments(stopCards = [], refuelStops = [], weatherSegments = [], fuelPolicy = null) {
    
    // Update external data
    this.setExternalData(weatherSegments, fuelPolicy);
    
    this.segments = [];
    this.refuelStops = [...refuelStops];
    
    if (stopCards.length === 0) {
      return this.segments;
    }
    
    // Create segments: each refuel creates a new segment boundary
    let segmentStart = 0;
    
    // Sort refuel stops to process in order
    const sortedRefuels = [...refuelStops].sort((a, b) => a - b);
    
    for (let i = 0; i < sortedRefuels.length; i++) {
      const refuelIndex = sortedRefuels[i];
      
      // Create segment from current start to refuel stop (inclusive)
      const segmentStops = stopCards.slice(segmentStart, refuelIndex + 1);
      
      if (segmentStops.length > 0) {
        const segment = this.createSegment(segmentStops, segmentStart, true);
        this.segments.push(segment);
      }
      
      // Next segment starts from this refuel stop
      segmentStart = refuelIndex;
    }
    
    // Final segment: from last refuel (or start) to end
    const finalSegmentStops = stopCards.slice(segmentStart);
    if (finalSegmentStops.length > 0) {
      const isRefuelSegment = segmentStart > 0; // Only if we had previous refuels
      const finalSegment = this.createSegment(finalSegmentStops, segmentStart, isRefuelSegment);
      this.segments.push(finalSegment);
    }
    
    return this.segments;
  }
  
  /**
   * Create a single flight segment with fuel requirements
   */
  createSegment(stops, startIndex, isRefuelSegment = false) {
    const segment = {
      id: `segment_${startIndex}`,
      startIndex,
      endIndex: startIndex + stops.length - 1,
      startLocation: stops[0]?.name || stops[0]?.stopName || 'Unknown',
      endLocation: stops[stops.length - 1]?.name || stops[stops.length - 1]?.stopName || 'Unknown',
      stops: [...stops],
      isRefuelSegment,
      
      // Fuel requirements for this segment
      fuelRequirements: {
        araFuel: 0,
        approachFuel: 0,
        extraFuel: 0,
        
        // Track which locations need which fuel types
        araLocations: [],
        approachLocations: [],
        deckFuelByLocation: {}
      }
    };
    
    // Analyze fuel requirements for this segment
    this.calculateSegmentFuelRequirements(segment);
    
    return segment;
  }
  
  /**
   * Calculate fuel requirements for a specific segment
   */
  calculateSegmentFuelRequirements(segment) {
    
    // Reset requirements
    segment.fuelRequirements.araFuel = 0;
    segment.fuelRequirements.approachFuel = 0;
    segment.fuelRequirements.araLocations = [];
    segment.fuelRequirements.approachLocations = [];
    segment.fuelRequirements.deckFuelByLocation = {};
    
    // Analyze each stop in this segment (except the starting point if it's a refuel)
    const stopsToAnalyze = segment.isRefuelSegment ? segment.stops.slice(1) : segment.stops;
    
    stopsToAnalyze.forEach((stop, index) => {
      const actualIndex = segment.isRefuelSegment ? index + 1 : index;
      
      // Determine if this is a rig or airport
      const isRig = this.isLocationRig(stop);
      
      if (isRig) {
        // Check if this rig needs ARA fuel
        const needsARA = this.locationNeedsARAFuel(stop);
        if (needsARA) {
          const araAmount = this.getARAFuelAmount(stop);
          segment.fuelRequirements.araFuel += araAmount;
          segment.fuelRequirements.araLocations.push({
            name: stop.name,
            index: actualIndex,
            amount: araAmount
          });
        }
        
        // Calculate deck fuel for this rig
        const deckFuel = this.calculateDeckFuel(stop);
        if (deckFuel > 0) {
          segment.fuelRequirements.deckFuelByLocation[stop.name] = deckFuel;
        }
      } else {
        // Airport - check if needs approach fuel
        const needsApproach = this.locationNeedsApproachFuel(stop);
        if (needsApproach) {
          const approachAmount = this.getApproachFuelAmount(stop);
          segment.fuelRequirements.approachFuel += approachAmount;
          segment.fuelRequirements.approachLocations.push({
            name: stop.name,
            index: actualIndex,
            amount: approachAmount
          });
        }
      }
    });
    
  }
  
  /**
   * Get fuel summary for a specific stop index
   * This shows "fuel needed to complete flight from HERE"
   */
  getFuelSummaryForStop(stopIndex) {
    
    // Find which segment this stop belongs to
    const segment = this.findSegmentForStop(stopIndex);
    if (!segment) {
      return null;
    }
    
    // Calculate remaining fuel requirements from this point
    const remainingFuel = this.calculateRemainingFuelFromStop(stopIndex, segment);
    
    // Calculate departure fuel requirements for this stop
    const departureRequirements = this.calculateDepartureFuelForStop(stopIndex, segment);
    
    return {
      stopIndex,
      stopName: segment.stops[stopIndex - segment.startIndex]?.name || segment.stops[stopIndex - segment.startIndex]?.stopName || 'Unknown',
      segment: segment.id,
      isRefuelStop: this.refuelStops.includes(stopIndex),
      
      // Fuel needed to complete flight from here
      remainingRequirements: remainingFuel,
      
      // Fuel needed when departing from this stop
      departureRequirements: departureRequirements,
      
      // Debug info
      segmentInfo: {
        segmentStart: segment.startLocation,
        segmentEnd: segment.endLocation,
        totalARA: segment.fuelRequirements.araFuel,
        totalApproach: segment.fuelRequirements.approachFuel
      }
    };
  }
  
  /**
   * Calculate remaining fuel requirements from a specific stop
   */
  calculateRemainingFuelFromStop(stopIndex, segment) {
    const remaining = {
      araFuel: 0,
      approachFuel: 0,
      extraFuel: 0,
      deckFuel: 0,
      
      // Which locations still need fuel
      pendingARA: [],
      pendingApproach: [],
      pendingDeck: []
    };
    
    // Check if this is a refuel stop - if so, start fresh calculations
    if (this.refuelStops.includes(stopIndex)) {
      
      // Find all segments AFTER this refuel
      const futureSegments = this.segments.filter(seg => seg.startIndex >= stopIndex);
      
      futureSegments.forEach(futureSeg => {
        remaining.araFuel += futureSeg.fuelRequirements.araFuel;
        remaining.approachFuel += futureSeg.fuelRequirements.approachFuel;
        remaining.pendingARA = remaining.pendingARA.concat(futureSeg.fuelRequirements.araLocations);
        remaining.pendingApproach = remaining.pendingApproach.concat(futureSeg.fuelRequirements.approachLocations);
      });
    } else {
      // Normal stop - calculate remaining in current segment + all future segments
      
      // Current segment remaining
      segment.fuelRequirements.araLocations.forEach(araLoc => {
        if (araLoc.index > stopIndex) {
          remaining.araFuel += araLoc.amount;
          remaining.pendingARA.push(araLoc);
        }
      });
      
      segment.fuelRequirements.approachLocations.forEach(approachLoc => {
        if (approachLoc.index > stopIndex) {
          remaining.approachFuel += approachLoc.amount;
          remaining.pendingApproach.push(approachLoc);
        }
      });
      
      // Add all future segments
      const futureSegments = this.segments.filter(seg => seg.startIndex > segment.endIndex);
      futureSegments.forEach(futureSeg => {
        remaining.araFuel += futureSeg.fuelRequirements.araFuel;
        remaining.approachFuel += futureSeg.fuelRequirements.approachFuel;
        remaining.pendingARA = remaining.pendingARA.concat(futureSeg.fuelRequirements.araLocations);
        remaining.pendingApproach = remaining.pendingApproach.concat(futureSeg.fuelRequirements.approachLocations);
      });
    }
    
    // Calculate total remaining fuel needed
    remaining.totalRemaining = remaining.araFuel + remaining.approachFuel + remaining.extraFuel + remaining.deckFuel + 200; // +200 for reserve
    
    return remaining;
  }
  
  /**
   * Calculate departure fuel requirements for a specific stop
   * This shows "fuel needed when departing FROM this stop"
   */
  calculateDepartureFuelForStop(stopIndex, segment) {
    const departure = {
      tripFuel: 0,
      araFuel: 0,
      approachFuel: 0,
      extraFuel: 0,
      reserveFuel: 0,
      totalFuel: 0,
      
      // Breakdown of what fuel is for
      fuelBreakdown: []
    };
    
    // If this is a refuel stop, we start fresh with fuel for remaining segments
    if (this.refuelStops.includes(stopIndex)) {
      
      // Find all segments AFTER this refuel
      const futureSegments = this.segments.filter(seg => seg.startIndex >= stopIndex);
      
      futureSegments.forEach(futureSeg => {
        departure.araFuel += futureSeg.fuelRequirements.araFuel;
        departure.approachFuel += futureSeg.fuelRequirements.approachFuel;
        
        if (futureSeg.fuelRequirements.araFuel > 0) {
          departure.fuelBreakdown.push(`ARA: ${futureSeg.fuelRequirements.araFuel} lbs`);
        }
        if (futureSeg.fuelRequirements.approachFuel > 0) {
          departure.fuelBreakdown.push(`Approach: ${futureSeg.fuelRequirements.approachFuel} lbs`);
        }
      });
    } else if (stopIndex === 0) {
      // Initial departure - need fuel for all segments
      
      this.segments.forEach(seg => {
        departure.araFuel += seg.fuelRequirements.araFuel;
        departure.approachFuel += seg.fuelRequirements.approachFuel;
        
        if (seg.fuelRequirements.araFuel > 0) {
          departure.fuelBreakdown.push(`ARA: ${seg.fuelRequirements.araFuel} lbs`);
        }
        if (seg.fuelRequirements.approachFuel > 0) {
          departure.fuelBreakdown.push(`Approach: ${seg.fuelRequirements.approachFuel} lbs`);
        }
      });
    } else {
      // Intermediate stop - carrying forward remaining fuel
      
      // Current segment remaining + all future segments
      segment.fuelRequirements.araLocations.forEach(araLoc => {
        if (araLoc.index > stopIndex) {
          departure.araFuel += araLoc.amount;
        }
      });
      
      segment.fuelRequirements.approachLocations.forEach(approachLoc => {
        if (approachLoc.index > stopIndex) {
          departure.approachFuel += approachLoc.amount;
        }
      });
      
      // Add all future segments
      const futureSegments = this.segments.filter(seg => seg.startIndex > segment.endIndex);
      futureSegments.forEach(futureSeg => {
        departure.araFuel += futureSeg.fuelRequirements.araFuel;
        departure.approachFuel += futureSeg.fuelRequirements.approachFuel;
      });
    }
    
    // Get actual fuel data from stop cards
    const currentStop = segment.stops[stopIndex - segment.startIndex];
    
    // Use actual flight data if available
    departure.tripFuel = currentStop?.fuelNeeded || currentStop?.tripFuel || 300;
    departure.extraFuel = 100; // TODO: Get from flight settings
    departure.reserveFuel = 200; // TODO: Get from fuel policy
    
    // Calculate total
    departure.totalFuel = departure.tripFuel + departure.araFuel + departure.approachFuel + 
                         departure.extraFuel + departure.reserveFuel;
    
    return departure;
  }
  
  /**
   * Find which segment contains a specific stop index
   */
  findSegmentForStop(stopIndex) {
    return this.segments.find(segment => 
      stopIndex >= segment.startIndex && stopIndex <= segment.endIndex
    );
  }
  
  // Helper methods for fuel calculations
  isLocationRig(stop) {
    // Check weather segments for rig identification
    const weatherSegment = this.findWeatherSegmentForStop(stop);
    if (weatherSegment) {
      return weatherSegment.isRig === true;
    }
    
    // Fallback to stop properties
    return stop.isRig || stop.type === 'rig' || false;
  }
  
  locationNeedsARAFuel(stop) {
    // Check weather data for conditions requiring ARA fuel
    const weatherSegment = this.findWeatherSegmentForStop(stop);
    if (weatherSegment && weatherSegment.isRig) {
      // ARA fuel needed if ranking indicates poor conditions
      return weatherSegment.ranking2 === 8 || weatherSegment.ranking2 === 5;
    }
    return false;
  }
  
  locationNeedsApproachFuel(stop) {
    // Check weather data for conditions requiring approach fuel
    const weatherSegment = this.findWeatherSegmentForStop(stop);
    if (weatherSegment && !weatherSegment.isRig) {
      // Approach fuel needed if ranking indicates poor conditions
      return weatherSegment.ranking2 === 10 || weatherSegment.ranking2 === 5;
    }
    return false;
  }
  
  findWeatherSegmentForStop(stop) {
    if (!this.weatherSegments || this.weatherSegments.length === 0) {
      return null;
    }
    
    const stopName = stop.name || stop.stopName;
    return this.weatherSegments.find(segment => 
      segment.airportIcao === stopName ||
      segment.locationName === stopName ||
      segment.location === stopName ||
      segment.uniqueId === stopName
    );
  }
  
  getARAFuelAmount(stop) {
    // Get from fuel policy or use default
    return this.fuelPolicy?.araFuelDefault || 200;
  }
  
  getApproachFuelAmount(stop) {
    // Get from fuel policy or use default
    return this.fuelPolicy?.approachFuelDefault || 150;
  }
  
  calculateDeckFuel(stop) {
    // Get deck time for this specific rig
    const deckTime = stop.deckTime || 5; // minutes
    const deckFuelFlow = 25; // lbs/hr - TODO: Get from settings
    
    return (deckTime / 60) * deckFuelFlow;
  }
  
  // Listener pattern for UI updates
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
  
  notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.segments);
      } catch (error) {
        console.error('🔥 SEGMENT: Listener error:', error);
      }
    });
  }
  
  // Debug method
  getDebugInfo() {
    return {
      segments: this.segments,
      refuelStops: this.refuelStops,
      totalSegments: this.segments.length
    };
  }
}

export default SegmentFuelManager;