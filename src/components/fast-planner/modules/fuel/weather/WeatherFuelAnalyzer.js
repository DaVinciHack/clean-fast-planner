/**
 * WeatherFuelAnalyzer.js
 * 
 * Analyzes weather segments to determine ARA and approach fuel requirements
 * using the same logic as Palantir's fuel calculation system.
 * 
 * This ensures consistency between Fast Planner and Palantir fuel calculations
 * while maintaining live fuel updates and dynamic recalculation capabilities.
 */

class WeatherFuelAnalyzer {
  constructor() {
    // Default fuel amounts (should match Palantir policy settings)
    this.defaults = {
      araFuelDefault: 200,     // lbs - ARA fuel per rig requiring it
      approachFuelDefault: 200, // lbs - Approach fuel per airport requiring it
    };
  }

  /**
   * Main method to analyze weather segments and determine required ARA and approach fuel
   * @param {Array} weatherSegments - Weather segments from Palantir
   * @param {Array} waypoints - Current route waypoints
   * @param {Object} settings - Fuel calculation settings including policy values
   * @returns {Object} Analysis results with fuel requirements
   */
  analyzeWeatherForFuel(weatherSegments, waypoints, settings = {}) {
    const config = { ...this.defaults, ...settings };
    
    console.log(`Analyzing weather for ${weatherSegments.length} segments and ${waypoints.length} waypoints`);
    
    // Create sets of actual flight stops for filtering
    const actualFlightStops = new Set();
    waypoints.forEach(wp => {
      if (wp.name) {
        actualFlightStops.add(wp.name.toUpperCase());
      }
    });
    
    console.log("Actual flight stops:", Array.from(actualFlightStops));
    
    const araRequirements = [];
    const approachRequirements = [];
    const rigStops = [];
    
    // Track processed locations to avoid duplicates
    const processedForAra = new Set();
    const processedForApproach = new Set();
    
    // Process each weather segment
    weatherSegments.forEach(segment => {
      if (!segment.airportIcao) return;
      
      const locationCode = segment.airportIcao.toUpperCase();
      
      // Only process if this location is part of our actual flight route
      if (!actualFlightStops.has(locationCode)) {
        return;
      }
      
      // Determine if this is a rig (could be from segment data or waypoint type)
      const isRig = this.isRigLocation(segment, waypoints);
      
      if (isRig) {
        // Add to rig stops if not already included
        if (!rigStops.includes(locationCode)) {
          rigStops.push(locationCode);
        }
        
        // Check ARA requirements (only process each rig once)
        if (!processedForAra.has(locationCode)) {
          processedForAra.add(locationCode);
          
          const needsAra = this.requiresAraFuel(segment);
          if (needsAra) {
            araRequirements.push({
              required: true,
              location: locationCode,
              reason: this.getAraReason(segment)
            });
            console.log(`ARA fuel required at rig ${locationCode}: ${this.getAraReason(segment)}`);
          }
        }
      } else {
        // This is an airport - check approach fuel requirements
        if (!processedForApproach.has(locationCode)) {
          processedForApproach.add(locationCode);
          
          const needsApproach = this.requiresApproachFuel(segment);
          if (needsApproach) {
            approachRequirements.push({
              required: true,
              location: locationCode,
              reason: this.getApproachReason(segment)
            });
            console.log(`Approach fuel required at airport ${locationCode}: ${this.getApproachReason(segment)}`);
          }
        }
      }
    });
    
    // Calculate total fuel requirements
    const totalAraFuel = araRequirements.length * config.araFuelDefault;
    const totalApproachFuel = approachRequirements.length * config.approachFuelDefault;
    
    console.log("Weather fuel analysis complete:", {
      araRequirements: araRequirements.length,
      approachRequirements: approachRequirements.length,
      totalAraFuel,
      totalApproachFuel
    });
    
    return {
      araRequirements,
      approachRequirements,
      rigStops,
      totalAraFuel,
      totalApproachFuel,
      fuelComponents: {
        araFuel: totalAraFuel,
        approachFuel: totalApproachFuel
      }
    };
  }
  
  /**
   * Determines if a location is a rig based on segment data and waypoint information
   * @param {Object} segment - Weather segment
   * @param {Array} waypoints - Route waypoints
   * @returns {boolean} True if location is a rig
   */
  isRigLocation(segment, waypoints) {
    // First check the segment's isRig flag
    if (segment.isRig === true) {
      return true;
    }
    
    // If not in segment, check waypoint type
    const waypoint = waypoints.find(wp => 
      wp.name && wp.name.toUpperCase() === segment.airportIcao.toUpperCase()
    );
    
    if (waypoint) {
      // Check various waypoint properties that indicate a rig
      return waypoint.type === 'rig' || 
             waypoint.isRig === true ||
             waypoint.locationType === 'RIG' ||
             waypoint.isairport === 'No';
    }
    
    return false;
  }
  
  /**
   * Determines if ARA fuel is required based on weather segment rankings
   * Uses the same logic as Palantir: ranking2 === 8 or ranking2 === 5
   * @param {Object} segment - Weather segment
   * @returns {boolean} True if ARA fuel is required
   */
  requiresAraFuel(segment) {
    // Check explicit ARA requirement flag first
    if (segment.araRequired === true) {
      return true;
    }
    
    // Check ranking2 for values that trigger ARA fuel (same as Palantir logic)
    return segment.ranking2 === 8 || segment.ranking2 === 5;
  }
  
  /**
   * Determines if approach fuel is required based on weather segment rankings
   * Uses the same logic as Palantir: ranking2 === 5 or ranking2 === 10
   * @param {Object} segment - Weather segment
   * @returns {boolean} True if approach fuel is required
   */
  requiresApproachFuel(segment) {
    // Check explicit approach requirement flag first  
    if (segment.approachRequired === true) {
      return true;
    }
    
    // Check ranking2 for values that trigger approach fuel (same as Palantir logic)
    return segment.ranking2 === 5 || segment.ranking2 === 10;
  }
  
  /**
   * Gets the reason why ARA fuel is required
   * @param {Object} segment - Weather segment
   * @returns {string} Reason for ARA fuel requirement
   */
  getAraReason(segment) {
    if (segment.araRequired === true) {
      return 'Explicit ARA requirement';
    }
    
    if (segment.ranking2 === 8) {
      return 'Weather ranking 8 detected (severe conditions)';
    }
    
    if (segment.ranking2 === 5) {
      return 'Weather ranking 5 detected (marginal conditions)';
    }
    
    return 'Weather conditions require ARA fuel';
  }
  
  /**
   * Gets the reason why approach fuel is required
   * @param {Object} segment - Weather segment
   * @returns {string} Reason for approach fuel requirement
   */
  getApproachReason(segment) {
    if (segment.approachRequired === true) {
      return 'Explicit approach fuel requirement';
    }
    
    if (segment.ranking2 === 10) {
      return 'Weather ranking 10 detected (severe approach conditions)';
    }
    
    if (segment.ranking2 === 5) {
      return 'Weather ranking 5 detected (marginal approach conditions)';
    }
    
    return segment.warnings || 'Weather conditions require approach fuel';
  }
  
  /**
   * Updates fuel settings with weather-based requirements
   * This integrates with the existing FuelCalculationManager
   * @param {Object} currentSettings - Current fuel calculation settings
   * @param {Object} weatherAnalysis - Results from analyzeWeatherForFuel
   * @returns {Object} Updated settings with weather-based fuel
   */
  updateSettingsWithWeatherFuel(currentSettings, weatherAnalysis) {
    return {
      ...currentSettings,
      // Add weather-determined fuel to existing approach/ara fuel
      approachFuel: (currentSettings.approachFuel || 0) + weatherAnalysis.totalApproachFuel,
      araFuel: (currentSettings.araFuel || 0) + weatherAnalysis.totalAraFuel,
      // Store the analysis for reference
      weatherAnalysis: weatherAnalysis
    };
  }
  
  /**
   * Compares calculated fuel with imported Palantir fuel for validation
   * @param {Object} calculatedFuel - Our calculated fuel components
   * @param {Object} palantirFuel - Imported fuel from Palantir
   * @returns {Object} Comparison results and discrepancies
   */
  compareFuelWithPalantir(calculatedFuel, palantirFuel) {
    const comparison = {
      matches: true,
      discrepancies: [],
      toleranceLbs: 50 // Allow 50 lbs tolerance for rounding differences
    };
    
    // Compare individual components
    const componentsToCheck = [
      'taxiFuel', 'tripFuel', 'contingencyFuel', 
      'araFuel', 'approachFuel', 'deckFuel', 'reserveFuel'
    ];
    
    componentsToCheck.forEach(component => {
      const calculated = calculatedFuel[component] || 0;
      const palantir = palantirFuel[component] || 0;
      const difference = Math.abs(calculated - palantir);
      
      if (difference > comparison.toleranceLbs) {
        comparison.matches = false;
        comparison.discrepancies.push({
          component,
          calculated,
          palantir,
          difference,
          percentDiff: palantir > 0 ? ((difference / palantir) * 100).toFixed(1) : 'N/A'
        });
      }
    });
    
    return comparison;
  }
}

export default WeatherFuelAnalyzer;