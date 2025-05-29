/**
 * WeatherStopCardFuelDistributor.js
 * 
 * Handles the proper distribution of ARA and approach fuel across stop cards
 * based on weather analysis, using the same logic as Palantir.
 * 
 * ARA Fuel Logic (for rigs):
 * - Added to fuel calculations for all stop cards before reaching the rig
 * - "Consumed" at the rig stop, so doesn't appear on subsequent cards
 * - Each rig gets its own ARA fuel requirement handled independently
 * 
 * Approach Fuel Logic (for airports):
 * - Added once when first required and carried through entire remaining route
 * - Not consumed at stops - stays with you throughout the flight
 * - Applies to the worst-case airport in your route
 */

class WeatherStopCardFuelDistributor {
  constructor() {
    this.araFuelPerRig = 200;      // Default ARA fuel per rig (lbs)
    this.approachFuelDefault = 200; // Default approach fuel (lbs)
  }
  
  /**
   * Distributes weather-based fuel across stop cards with proper consumption logic
   * @param {Array} stopCards - Existing stop cards from normal calculation
   * @param {Array} waypoints - Route waypoints
   * @param {Array} weatherSegments - Weather segments from Palantir
   * @param {Object} settings - Fuel calculation settings
   * @returns {Array} Enhanced stop cards with weather-based fuel properly distributed
   */
  distributeWeatherFuel(stopCards, waypoints, weatherSegments, settings = {}) {
    console.log("⚡ Starting weather fuel distribution across stop cards");
    
    if (!stopCards || !waypoints || !weatherSegments) {
      console.warn("⚡ Missing required data for weather fuel distribution");
      return stopCards;
    }
    
    // Use settings or defaults
    const araFuel = settings.araFuelDefault || this.araFuelPerRig;
    const approachFuel = settings.approachFuelDefault || this.approachFuelDefault;
    
    // Analyze weather for fuel requirements
    const weatherAnalysis = this.analyzeWeatherRequirements(weatherSegments, waypoints);
    
    console.log("⚡ Weather analysis results:", weatherAnalysis);
    
    // Create enhanced stop cards with weather fuel distribution
    const enhancedCards = this.applyWeatherFuelToCards(
      stopCards, 
      waypoints, 
      weatherAnalysis, 
      araFuel, 
      approachFuel
    );
    
    console.log("⚡ Weather fuel distribution complete");
    return enhancedCards;
  }
  
  /**
   * Analyzes weather segments to determine ARA and approach fuel requirements
   * @param {Array} weatherSegments - Weather segments from Palantir
   * @param {Array} waypoints - Route waypoints
   * @returns {Object} Weather analysis with fuel requirements by location
   */
  analyzeWeatherRequirements(weatherSegments, waypoints) {
    const analysis = {
      rigAraRequirements: new Map(), // Map of rig -> { required: boolean, index: number }
      airportApproachRequirements: new Map(), // Map of airport -> { required: boolean, indices: number[] }
      rigIndices: new Map(), // Map of rig name -> waypoint index
      airportIndices: new Map() // Map of airport name -> array of waypoint indices
    };
    
    // Create a map of waypoint names to indices for quick lookup
    const waypointIndexMap = new Map();
    waypoints.forEach((wp, index) => {
      if (wp.name) {
        const name = wp.name.toUpperCase();
        if (!waypointIndexMap.has(name)) {
          waypointIndexMap.set(name, []);
        }
        waypointIndexMap.get(name).push(index);
      }
    });
    
    // Process weather segments
    weatherSegments.forEach(segment => {
      if (!segment.airportIcao) return;
      
      const locationCode = segment.airportIcao.toUpperCase();
      const waypointIndices = waypointIndexMap.get(locationCode);
      
      // Skip if this location is not in our route
      if (!waypointIndices || waypointIndices.length === 0) return;
      
      // Determine if this is a rig
      const isRig = segment.isRig === true || 
                    this.isRigLocation(locationCode, waypoints);
      
      if (isRig) {
        // Store rig indices for later use
        analysis.rigIndices.set(locationCode, waypointIndices);
        
        // Check if ARA fuel is required (same logic as Palantir)
        const needsAra = segment.ranking2 === 8 || segment.ranking2 === 5;
        
        if (needsAra) {
          analysis.rigAraRequirements.set(locationCode, {
            required: true,
            indices: waypointIndices,
            reason: `Weather ranking ${segment.ranking2} detected`
          });
          
          console.log(`⚡ ARA fuel required for rig ${locationCode} at waypoints ${waypointIndices.join(', ')}`);
        }
      } else {
        // This is an airport - store all indices where this airport appears
        analysis.airportIndices.set(locationCode, waypointIndices);
        
        // Check approach fuel requirement (same logic as Palantir)
        const needsApproach = segment.ranking2 === 10 || segment.ranking2 === 5;
        
        if (needsApproach) {
          analysis.airportApproachRequirements.set(locationCode, {
            required: true,
            indices: waypointIndices,
            reason: `Weather ranking ${segment.ranking2} detected`
          });
          
          console.log(`⚡ Approach fuel required for airport ${locationCode} at waypoints ${waypointIndices.join(', ')}`);
        }
      }
    });
    
    return analysis;
  }
  
  /**
   * Applies weather fuel to stop cards with proper distribution logic
   * @param {Array} stopCards - Original stop cards
   * @param {Array} waypoints - Route waypoints
   * @param {Object} weatherAnalysis - Weather analysis results
   * @param {number} araFuelAmount - ARA fuel amount per rig
   * @param {number} approachFuelAmount - Approach fuel amount
   * @returns {Array} Enhanced stop cards
   */
  applyWeatherFuelToCards(stopCards, waypoints, weatherAnalysis, araFuelAmount, approachFuelAmount) {
    // Create a copy of stop cards to avoid mutation
    const enhancedCards = stopCards.map(card => ({
      ...card,
      fuelComponentsObject: { ...card.fuelComponentsObject }
    }));
    
    // Process each stop card
    enhancedCards.forEach((card, cardIndex) => {
      let additionalAraFuel = 0;
      let additionalApproachFuel = 0;
      
      // Find which waypoint this card represents
      const waypointIndex = this.findWaypointIndexForCard(card, waypoints, cardIndex);
      
      if (waypointIndex === -1) {
        console.warn(`⚡ Could not find waypoint for card ${cardIndex}`);
        return;
      }
      
      console.log(`⚡ Processing card ${cardIndex} for waypoint ${waypointIndex} (${waypoints[waypointIndex]?.name})`);
      
      // === ARA FUEL LOGIC ===
      // Add ARA fuel for all rigs that we haven't reached yet
      weatherAnalysis.rigAraRequirements.forEach((requirement, rigName) => {
        const rigIndices = requirement.indices;
        
        // Check if we need ARA fuel for this rig (haven't reached any instance of it yet)
        const hasntReachedRig = rigIndices.every(rigIndex => waypointIndex < rigIndex);
        
        if (hasntReachedRig) {
          additionalAraFuel += araFuelAmount;
          console.log(`⚡ Adding ${araFuelAmount} lbs ARA fuel for upcoming rig ${rigName} (rig at indices ${rigIndices.join(',')}, current index ${waypointIndex})`);
        } else {
          console.log(`⚡ Not adding ARA fuel for rig ${rigName} - already reached (rig at indices ${rigIndices.join(',')}, current index ${waypointIndex})`);
        }
      });
      
      // === APPROACH FUEL LOGIC (CORRECTED) ===
      // Add approach fuel for ALL airports requiring it throughout the route
      // MINUS any airports we've already visited (consumed the approach fuel)
      weatherAnalysis.airportApproachRequirements.forEach((requirement, airportName) => {
        const airportIndices = requirement.indices;
        
        // Check if we still need approach fuel for this airport
        // We need it if there are future visits to this airport
        const futureVisits = airportIndices.filter(airportIndex => waypointIndex < airportIndex);
        
        if (futureVisits.length > 0) {
          additionalApproachFuel += approachFuelAmount;
          console.log(`⚡ Adding ${approachFuelAmount} lbs approach fuel for airport ${airportName} (future visits at indices ${futureVisits.join(',')}, current index ${waypointIndex})`);
        } else {
          console.log(`⚡ Not adding approach fuel for airport ${airportName} - no future visits (airport at indices ${airportIndices.join(',')}, current index ${waypointIndex})`);
        }
      });
      
      // Update fuel components in the card
      if (additionalAraFuel > 0) {
        card.fuelComponentsObject.araFuel = (card.fuelComponentsObject.araFuel || 0) + additionalAraFuel;
      }
      
      if (additionalApproachFuel > 0) {
        card.fuelComponentsObject.approachFuel = (card.fuelComponentsObject.approachFuel || 0) + additionalApproachFuel;
      }
      
      // Recalculate total fuel if we added anything
      if (additionalAraFuel > 0 || additionalApproachFuel > 0) {
        const totalAdditional = additionalAraFuel + additionalApproachFuel;
        card.totalFuel = (card.totalFuel || 0) + totalAdditional;
        
        // Update fuel components description if it exists
        if (card.fuelComponents) {
          if (additionalAraFuel > 0) {
            card.fuelComponents += `, ARA:${additionalAraFuel}`;
          }
          if (additionalApproachFuel > 0) {
            card.fuelComponents += `, Appr:${additionalApproachFuel}`;
          }
        }
        
        console.log(`⚡ Card ${cardIndex}: Added ${totalAdditional} lbs weather fuel (ARA:${additionalAraFuel}, Approach:${additionalApproachFuel})`);
      }
    });
    
    return enhancedCards;
  }
  
  /**
   * Finds the waypoint index that corresponds to a stop card
   * @param {Object} card - Stop card object
   * @param {Array} waypoints - Route waypoints
   * @param {number} cardIndex - Index of the card in the cards array
   * @returns {number} Waypoint index or -1 if not found
   */
  findWaypointIndexForCard(card, waypoints, cardIndex) {
    // Try to match by name first
    if (card.waypoint && card.waypoint.name) {
      const index = waypoints.findIndex(wp => 
        wp.name && wp.name.toUpperCase() === card.waypoint.name.toUpperCase()
      );
      if (index !== -1) return index;
    }
    
    // Try to match by location name
    if (card.location) {
      const index = waypoints.findIndex(wp => 
        wp.name && wp.name.toUpperCase() === card.location.toUpperCase()
      );
      if (index !== -1) return index;
    }
    
    // Fallback to card index if it's within bounds
    if (cardIndex < waypoints.length) {
      return cardIndex;
    }
    
    return -1;
  }
  
  /**
   * Determines if a location is a rig
   * @param {string} locationCode - Location code
   * @param {Array} waypoints - Route waypoints
   * @returns {boolean} True if location is a rig
   */
  isRigLocation(locationCode, waypoints) {
    const waypoint = waypoints.find(wp => 
      wp.name && wp.name.toUpperCase() === locationCode.toUpperCase()
    );
    
    if (!waypoint) return false;
    
    return waypoint.type === 'rig' || 
           waypoint.isRig === true ||
           waypoint.locationType === 'RIG' ||
           waypoint.isairport === 'No';
  }
  
  /**
   * Updates fuel calculation settings with weather-based fuel amounts
   * This is used by the existing fuel calculation system
   * @param {Object} currentSettings - Current fuel settings
   * @param {Object} weatherAnalysis - Weather analysis results
   * @param {number} araFuelAmount - ARA fuel per rig
   * @param {number} approachFuelAmount - Approach fuel amount
   * @returns {Object} Updated settings
   */
  updateSettingsWithWeatherFuel(currentSettings, weatherAnalysis, araFuelAmount, approachFuelAmount) {
    const totalAraFuel = weatherAnalysis.rigAraRequirements.size * araFuelAmount;
    const totalApproachFuel = weatherAnalysis.airportApproachRequired ? approachFuelAmount : 0;
    
    return {
      ...currentSettings,
      araFuel: (currentSettings.araFuel || 0) + totalAraFuel,
      approachFuel: (currentSettings.approachFuel || 0) + totalApproachFuel,
      weatherAnalysis: weatherAnalysis
    };
  }
}

export default WeatherStopCardFuelDistributor;