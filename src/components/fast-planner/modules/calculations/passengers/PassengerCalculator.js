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
      return 0;
    }
    
    // Calculate available load for passengers
    let usableLoadWithoutFuel = 0;
    
    // First, try to use aircraft.usableLoad property if it exists
    // This would be the most direct and accurate way
    if (aircraft.usableLoad !== undefined) {
      // Ensure we're properly subtracting fuel when using usableLoad
      usableLoadWithoutFuel = Number(aircraft.usableLoad) - fuelWeightNum;
      console.log('PassengerCalculator: Using aircraft.usableLoad directly:', aircraft.usableLoad, 'minus fuel:', fuelWeightNum, '=', usableLoadWithoutFuel);
    }
    // Then, try to use aircraft.usefulLoad property if it exists (from OSDK data)
    else if (aircraft.usefulLoad !== undefined) {
      // Ensure we're properly subtracting fuel and cargo when using usefulLoad
      usableLoadWithoutFuel = Number(aircraft.usefulLoad) - fuelWeightNum - (cargoWeight || 0);
      console.log('PassengerCalculator: Using aircraft.usefulLoad directly:', aircraft.usefulLoad, 'minus fuel:', fuelWeightNum, 'minus cargo:', (cargoWeight || 0), '=', usableLoadWithoutFuel);
    }
    // If not available, calculate it from maxTakeoffWeight and emptyWeight
    else if (aircraft.maxTakeoffWeight && aircraft.emptyWeight) {
      usableLoadWithoutFuel = aircraft.maxTakeoffWeight - aircraft.emptyWeight - fuelWeightNum - (cargoWeight || 0);
      console.log('PassengerCalculator: Calculated usableLoad from weight data, minus fuel and cargo:', usableLoadWithoutFuel);
    } 
    // If neither option is available, return 0
    else {
      console.error('PassengerCalculator: Cannot calculate usableLoad - missing aircraft weight data');
      return 0;
    }
    
    // Ensure usable load is not negative
    usableLoadWithoutFuel = Math.max(0, usableLoadWithoutFuel);
    
    // Calculate max passengers based on usable load and passenger weight
    const maxByWeight = Math.floor(usableLoadWithoutFuel / passengerWeightNum);
    
    // Limit by aircraft's maximum passenger capacity if available
    const aircraftMaxPax = aircraft.maxPassengers || Number.MAX_SAFE_INTEGER;
    
    // Return the lower value (can't exceed aircraft capacity)
    const result = Math.min(maxByWeight, aircraftMaxPax);
    
    console.log('PassengerCalculator result:', {
      usableLoadWithoutFuel,
      maxByWeight,
      aircraftMaxPax,
      result
    });
    
    return result;
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
      const maxPassengers = this.calculateMaxPassengers(
        aircraft,
        fuelRequired,
        passengerWeight
      );
      
      console.log(`PassengerCalculator: Leg ${index + 1} can carry ${maxPassengers} passengers`);
      
      return maxPassengers;
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
      console.error('PassengerCalculator: Invalid stop cards data');
      return stopCards;
    }
    
    // Clone the input array to avoid modifying the original
    const updatedCards = [...stopCards];
    
    // Process each stop card
    updatedCards.forEach((card, index) => {
      // Get fuel for this stop (either directly or from fuel components)
      let fuelRequired;
      
      if (card.fuelComponentsObject) {
        try {
          // Calculate from fuelComponentsObject for consistency
          // Ensure all values are valid numbers
          const safeComponentValues = Object.entries(card.fuelComponentsObject).map(([key, value]) => {
            return [key, typeof value === 'number' ? value : Number(value) || 0];
          });
          
          // Create a map of safe values
          const safeComponents = Object.fromEntries(safeComponentValues);
          
          // Sum the components
          fuelRequired = Object.values(safeComponents).reduce((sum, value) => sum + (Number(value) || 0), 0);
          
          // If there's a mismatch between calculated sum and totalFuel, log and fix it
          if (Math.abs(fuelRequired - card.totalFuel) > 1) { // Allow 1 lb difference for rounding
            console.warn(`PassengerCalculator: Found fuel mismatch in card ${index}`, {
              cardTotalFuel: card.totalFuel,
              calculatedSum: fuelRequired,
              difference: fuelRequired - card.totalFuel,
              components: { ...safeComponents }
            });
            
            // Update totalFuel to match the calculated sum
            card.totalFuel = fuelRequired;
          }
        } catch (error) {
          console.error(`PassengerCalculator: Error calculating fuel from components for card ${index}`, error);
          // Fallback to using totalFuel directly
          fuelRequired = typeof card.totalFuel === 'number' ? card.totalFuel : Number(card.totalFuel) || 0;
        }
      } else {
        // If no components object, use totalFuel directly
        fuelRequired = typeof card.totalFuel === 'number' ? card.totalFuel : Number(card.totalFuel) || 0;
      }
      
      // Calculate max passengers
      try {
        const maxPassengers = this.calculateMaxPassengers(
          aircraft,
          fuelRequired,
          passengerWeight
        );
        
        // Update the card with passenger info - with extra safety checks
        card.maxPassengers = isNaN(maxPassengers) ? 0 : maxPassengers;
        card.maxPassengersDisplay = card.isDestination ? "Final Stop" : (isNaN(maxPassengers) ? "0" : maxPassengers.toString());
        card.maxPassengersWeight = isNaN(maxPassengers) ? 0 : (maxPassengers * passengerWeight);
        
        console.log(`PassengerCalculator: Stop ${index + 1} (${card.stopName || 'Unknown'}) can carry ${maxPassengers} passengers with ${fuelRequired} lbs fuel`);
      } catch (error) {
        console.error(`PassengerCalculator: Error calculating passengers for card ${index}`, error);
        // Set safe defaults
        card.maxPassengers = 0;
        card.maxPassengersDisplay = card.isDestination ? "Final Stop" : "0";
        card.maxPassengersWeight = 0;
      }
    });
    
    return updatedCards;
  }
}

export default PassengerCalculator;
