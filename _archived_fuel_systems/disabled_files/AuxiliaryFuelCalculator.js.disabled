/**
 * AuxiliaryFuelCalculator.js
 *
 * Handles calculation of auxiliary fuel components including:
 * - Taxi fuel
 * - Contingency fuel
 * - Reserve fuel
 * - Deck fuel for helicopter operations
 * - Approach fuel
 * - Alternate fuel
 */

class AuxiliaryFuelCalculator {
  constructor() {
    // Default settings (will be overridden)
    this.defaults = {
      taxiFuel: 50,                  // lbs
      contingencyFuelPercent: 10,    // % of trip fuel
      reserveMethod: 'fixed',        // 'fixed' or 'percent'
      reserveFuel: 500,              // lbs for fixed reserve
      reserveFuelPercent: 10,        // % for percent reserve
      deckFuelPerStop: 100,          // lbs of additional fuel at deck
      deckFuelFlow: 400,             // lbs/hr for hover/deck operations
      deckTimePerStop: 5,            // minutes spent at deck per stop
      approachFuel: 0,               // lbs for approach
      alternateDistance: 0,          // nm to alternate
      alternateFuelFlow: 0,          // lbs/hr to alternate
      alternateTime: 0               // minutes to alternate
    };
  }

  /**
   * Calculate all auxiliary fuel components
   * @param {Array} tripFuel - Trip fuel data for all legs
   * @param {Object} settings - Fuel calculation settings
   * @param {Number} numStops - Number of stops (for deck fuel)
   * @returns {Object} Calculated auxiliary fuel components
   */
  calculateAuxiliaryFuel(tripFuel, settings, numStops) {
    // Use provided settings or defaults
    const config = { ...this.defaults, ...settings };
    
    // Calculate total trip fuel
    let totalTripFuel = 0;
    if (Array.isArray(tripFuel)) {
      for (const leg of tripFuel) {
        totalTripFuel += leg.fuel || 0;
      }
    } else {
      totalTripFuel = tripFuel;
    }
    
    // Calculate contingency fuel
    const contingencyPercent = config.contingencyFuelPercent;
    const contingencyFuel = (contingencyPercent / 100) * totalTripFuel;
    
    // Calculate reserve fuel based on method
    let reserveFuel = config.reserveFuel;
    if (config.reserveMethod === 'percent') {
      reserveFuel = (config.reserveFuelPercent / 100) * totalTripFuel;
    }
    
    // Calculate deck fuel
    let deckFuel = 0;
    if (numStops > 0) {
      // Convert deck time from minutes to hours
      const deckTimeHours = (config.deckTimePerStop / 60);
      
      // Calculate deck fuel per stop
      const deckFuelPerStopCalc = deckTimeHours * config.deckFuelFlow;
      
      // Get total deck fuel for all stops
      deckFuel = deckFuelPerStopCalc * numStops;
    }
    
    // Calculate approach fuel (if applicable)
    const approachFuel = config.approachFuel || 0;
    
    // Calculate alternate fuel (if applicable)
    let alternateFuel = 0;
    if (config.alternateDistance > 0 && config.alternateFuelFlow > 0) {
      // Use alternate time if provided, otherwise calculate from distance
      let alternateTimeHours = 0;
      if (config.alternateTime > 0) {
        alternateTimeHours = config.alternateTime / 60;
      } else {
        // Estimate 120 knots for alternate speed
        const alternateSpeed = 120;
        alternateTimeHours = config.alternateDistance / alternateSpeed;
      }
      
      // Calculate alternate fuel
      alternateFuel = alternateTimeHours * config.alternateFuelFlow;
    }
    
    // Return all components
    return {
      taxi: Math.round(config.taxiFuel),
      contingency: Math.round(contingencyFuel),
      contingencyPercent: contingencyPercent,
      reserve: Math.round(reserveFuel),
      reserveMethod: config.reserveMethod,
      reservePercent: config.reserveFuelPercent,
      deck: Math.round(deckFuel),
      deckFuelPerStop: Math.round(deckFuelPerStopCalc || config.deckFuelPerStop),
      approach: Math.round(approachFuel),
      alternate: Math.round(alternateFuel),
      
      // Total of all auxiliary fuel
      total: Math.round(
        config.taxiFuel + 
        contingencyFuel + 
        reserveFuel + 
        deckFuel + 
        approachFuel + 
        alternateFuel
      )
    };
  }
  
  /**
   * Calculate taxi fuel
   * @param {Object} settings - Fuel calculation settings
   * @returns {Number} Taxi fuel in lbs
   */
  calculateTaxiFuel(settings) {
    const config = { ...this.defaults, ...settings };
    return config.taxiFuel;
  }
  
  /**
   * Calculate contingency fuel
   * @param {Number} tripFuel - Trip fuel in lbs
   * @param {Object} settings - Fuel calculation settings
   * @returns {Number} Contingency fuel in lbs
   */
  calculateContingencyFuel(tripFuel, settings) {
    const config = { ...this.defaults, ...settings };
    const contingencyPercent = config.contingencyFuelPercent;
    return (contingencyPercent / 100) * tripFuel;
  }
  
  /**
   * Calculate reserve fuel
   * @param {Number} tripFuel - Trip fuel in lbs (for percent method)
   * @param {Object} settings - Fuel calculation settings
   * @returns {Number} Reserve fuel in lbs
   */
  calculateReserveFuel(tripFuel, settings) {
    const config = { ...this.defaults, ...settings };
    
    if (config.reserveMethod === 'percent') {
      return (config.reserveFuelPercent / 100) * tripFuel;
    }
    
    return config.reserveFuel;
  }
  
  /**
   * Calculate deck fuel for helicopter operations
   * @param {Number} numStops - Number of stops
   * @param {Object} settings - Fuel calculation settings
   * @returns {Number} Deck fuel in lbs
   */
  calculateDeckFuel(numStops, settings) {
    const config = { ...this.defaults, ...settings };
    
    if (numStops <= 0) return 0;
    
    // Convert deck time from minutes to hours
    const deckTimeHours = (config.deckTimePerStop / 60);
    
    // Calculate deck fuel per stop
    const deckFuelPerStop = deckTimeHours * config.deckFuelFlow;
    
    // Get total deck fuel for all stops
    return deckFuelPerStop * numStops;
  }
  
  /**
   * Calculate alternate fuel
   * @param {Object} settings - Fuel calculation settings
   * @returns {Number} Alternate fuel in lbs
   */
  calculateAlternateFuel(settings) {
    const config = { ...this.defaults, ...settings };
    
    if (config.alternateDistance <= 0 || config.alternateFuelFlow <= 0) {
      return 0;
    }
    
    // Use alternate time if provided, otherwise calculate from distance
    let alternateTimeHours = 0;
    if (config.alternateTime > 0) {
      alternateTimeHours = config.alternateTime / 60;
    } else {
      // Estimate 120 knots for alternate speed
      const alternateSpeed = 120;
      alternateTimeHours = config.alternateDistance / alternateSpeed;
    }
    
    // Calculate alternate fuel
    return alternateTimeHours * config.alternateFuelFlow;
  }
}

export default AuxiliaryFuelCalculator;