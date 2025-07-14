/**
 * PassengerCalculator.js
 * 
 * Module for calculating passenger capacity per leg based on aircraft usable load,
 * fuel requirements, and passenger weight settings.
 */

class PassengerCalculator {
  /**
   * Calculate the maximum number of passengers that can be carried on a leg
   * based on available usable load and fuel requirements
   * 
   * @param {Object} aircraft - The aircraft object with usable load info
   * @param {number} fuelWeight - The total fuel weight required for this leg (lbs)
   * @param {number} passengerWeight - The weight per passenger (lbs)
   * @param {number} cargoWeight - The cargo weight that reduces available passenger capacity (lbs)
   * @returns {number} - The maximum number of passengers (integer)
   */
  static calculateMaxPassengers(aircraft, fuelWeight, passengerWeight, cargoWeight = 0) {
    // Validate inputs
    if (!aircraft) {
      console.error('PassengerCalculator: Invalid aircraft data provided');
      return 0;
    }

    // 🚨 AVIATION SAFETY: NO FALLBACKS FOR CRITICAL AIRCRAFT DATA
    // Missing usefulLoad data could result in aircraft overloading and fatal accidents
    if (!aircraft.usefulLoad && (!aircraft.emptyWeight || !aircraft.maxTakeoffWeight)) {
      console.error('🚨 SAFETY CRITICAL: Aircraft missing usefulLoad or weight data - cannot calculate passengers safely');
      console.error('🚨 Missing data:', {
        usefulLoad: aircraft.usefulLoad,
        emptyWeight: aircraft.emptyWeight,
        maxTakeoffWeight: aircraft.maxTakeoffWeight,
        aircraftId: aircraft.aircraftId || aircraft.registration
      });
      console.error('🚨 RETURNING 0 PASSENGERS - System must obtain correct aircraft load data before calculations can proceed');
      return 0;
    }

    // Ensure numeric inputs
    const fuelWeightNum = Number(fuelWeight) || 0;
    const passengerWeightNum = Number(passengerWeight) || 0;
    
    // If passenger weight is zero or invalid, return 0 to avoid division by zero
    if (passengerWeightNum <= 0) {
      console.error('PassengerCalculator: Invalid passenger weight (zero or negative)');
      return {
        maxPassengers: 0,
        availableWeight: 0,
        usedByPassengers: 0,
        remainingWeight: 0
      };
    }
    
    // Calculate available load for passengers
    let usableLoadWithoutFuel = 0;
    
    // 🔍 DEBUG: Log aircraft data to understand what we're working with
    console.log('🔍 PASSENGER DEBUG: Aircraft data:', {
      usableLoad: aircraft.usableLoad,
      usefulLoad: aircraft.usefulLoad,
      maxTakeoffWeight: aircraft.maxTakeoffWeight,
      emptyWeight: aircraft.emptyWeight,
      fuelWeight: fuelWeightNum,
      cargoWeight: cargoWeight || 0
    });
    
    // First, try to use aircraft.usableLoad property if it exists
    // This would be the most direct and accurate way
    if (aircraft.usableLoad !== undefined) {
      // Ensure we're properly subtracting fuel when using usableLoad
      usableLoadWithoutFuel = Number(aircraft.usableLoad) - fuelWeightNum;
      console.log('🔍 Using usableLoad:', aircraft.usableLoad, '- fuel:', fuelWeightNum, '= available:', usableLoadWithoutFuel);
    }
    // Then, try to use aircraft.usefulLoad property if it exists (from OSDK data)
    else if (aircraft.usefulLoad !== undefined) {
      // Ensure we're properly subtracting fuel and cargo when using usefulLoad
      usableLoadWithoutFuel = Number(aircraft.usefulLoad) - fuelWeightNum - (cargoWeight || 0);
      console.log('🔍 Using usefulLoad:', aircraft.usefulLoad, '- fuel:', fuelWeightNum, '- cargo:', (cargoWeight || 0), '= available:', usableLoadWithoutFuel);
    }
    // If not available, calculate it from maxTakeoffWeight and emptyWeight
    else if (aircraft.maxTakeoffWeight && aircraft.emptyWeight) {
      usableLoadWithoutFuel = aircraft.maxTakeoffWeight - aircraft.emptyWeight - fuelWeightNum - (cargoWeight || 0);
      console.log('🔍 Using calculated:', aircraft.maxTakeoffWeight, '- empty:', aircraft.emptyWeight, '- fuel:', fuelWeightNum, '- cargo:', (cargoWeight || 0), '= available:', usableLoadWithoutFuel);
    } 
    // If neither option is available, return 0
    else {
      console.error('🚨 PassengerCalculator: Cannot calculate usableLoad - missing aircraft weight data');
      console.error('🚨 Available aircraft properties:', Object.keys(aircraft));
      return {
        maxPassengers: 0,
        availableWeight: 0,
        usedByPassengers: 0,
        remainingWeight: 0
      };
    }
    
    // Ensure usable load is not negative
    usableLoadWithoutFuel = Math.max(0, usableLoadWithoutFuel);
    
    // Calculate max passengers based on usable load and passenger weight
    const maxByWeight = Math.floor(usableLoadWithoutFuel / passengerWeightNum);
    
    // Limit by aircraft's maximum passenger capacity if available
    const aircraftMaxPax = aircraft.maxPassengers || Number.MAX_SAFE_INTEGER;
    
    // Return the lower value (can't exceed aircraft capacity)
    const result = Math.min(maxByWeight, aircraftMaxPax);
    
    // 🎯 ENHANCEMENT: Return both passenger count AND available weight for UI display
    const finalResult = {
      maxPassengers: result,
      availableWeight: Math.round(usableLoadWithoutFuel), // Raw weight available for passengers
      usedByPassengers: Math.round(result * passengerWeightNum), // Weight used by max passengers
      remainingWeight: Math.round(usableLoadWithoutFuel - (result * passengerWeightNum)) // Weight still available
    };
    
    console.log('🔍 FINAL PASSENGER RESULT:', {
      maxPassengers: finalResult.maxPassengers,
      availableWeight: finalResult.availableWeight,
      usedByPassengers: finalResult.usedByPassengers,
      remainingWeight: finalResult.remainingWeight
    });
    return finalResult;
  }
  
  /**
   * Calculate passenger capacity for all legs in a route
   * 
   * @param {Array} legs - Array of leg objects with fuel requirements
   * @param {Object} aircraft - The aircraft object with usable load info
   * @param {number} passengerWeight - The weight per passenger (lbs)
   * @returns {Array} - Array of passenger capacities for each leg
   */
  static calculatePassengersForRoute(legs, aircraft, passengerWeight) {
    if (!Array.isArray(legs) || legs.length === 0) {
      console.error('PassengerCalculator: Invalid legs data');
      return [];
    }
    
    return legs.map((leg, index) => {
      // Get the fuel required for this leg
      const fuelRequired = leg.totalFuel || leg.fuel || 0;
      
      // Calculate max passengers for this leg
      const passengerResult = this.calculateMaxPassengers(
        aircraft,
        fuelRequired,
        passengerWeight
      );
      
      // Return just the passenger count for route calculations (maintain compatibility)
      return passengerResult.maxPassengers;
    });
  }
  
  /**
   * Update stopCards with passenger information
   * 
   * @param {Array} stopCards - Array of stop card objects to update
   * @param {Object} aircraft - The aircraft object
   * @param {number} passengerWeight - The weight per passenger (lbs)
   * @returns {Array} - Updated stopCards with passenger info
   */
  static updateStopCardsWithPassengers(stopCards, aircraft, passengerWeight) {
    if (!Array.isArray(stopCards) || stopCards.length === 0) {
      console.warn('PassengerCalculator: No stop cards data to process (normal during initialization)');
      return stopCards || [];
    }
    
    // Clone the input array to avoid modifying the original
    const updatedCards = [...stopCards];
    
    // Process each stop card
    updatedCards.forEach((card, index) => {
      // 🛩️ AVIATION SAFETY: Use totalFuel as-is - StopCardCalculator owns all fuel logic
      // PassengerCalculator only adds passenger data based on the fuel StopCardCalculator provides
      // This preserves segment math, alternate enforcement, and refuel logic
      const fuelRequired = typeof card.totalFuel === 'number' ? card.totalFuel : Number(card.totalFuel) || 0;
      
      // Calculate max passengers and available weight
      try {
        const passengerResult = this.calculateMaxPassengers(
          aircraft,
          fuelRequired,
          passengerWeight
        );
        
        // Update the card with passenger info - with extra safety checks
        const maxPassengers = passengerResult.maxPassengers;
        card.maxPassengers = isNaN(maxPassengers) ? 0 : maxPassengers;
        card.maxPassengersDisplay = card.isDestination ? "Final Stop" : (isNaN(maxPassengers) ? "0" : maxPassengers.toString());
        card.maxPassengersWeight = isNaN(maxPassengers) ? 0 : (maxPassengers * passengerWeight);
        
        // 🎯 NEW: Add available weight information for UI display
        card.availableWeight = passengerResult.availableWeight || 0;
        card.usedByPassengers = passengerResult.usedByPassengers || 0;
        card.remainingWeight = passengerResult.remainingWeight || 0;
        
      } catch (error) {
        console.error(`PassengerCalculator: Error calculating passengers for card ${index}`, error);
        // Set safe defaults
        card.maxPassengers = 0;
        card.maxPassengersDisplay = card.isDestination ? "Final Stop" : "0";
        card.maxPassengersWeight = 0;
        
        // Set safe defaults for new weight fields
        card.availableWeight = 0;
        card.usedByPassengers = 0;
        card.remainingWeight = 0;
      }
    });
    
    return updatedCards;
  }
}

export default PassengerCalculator;
